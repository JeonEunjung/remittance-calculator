require('dotenv').config();
const fetch = require('node-fetch');

// 환경변수에서 보안 정보 로드
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

module.exports = async (req, res) => {
  // CORS 설정 - 화이트리스트 기반
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://remittance-calculator.vercel.app',
    'https://*.vercel.app'
  ];

  const origin = req.headers.origin;

  // Origin 검증
  const isAllowed = !origin || allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      const regex = new RegExp(allowed.replace('*', '.*'));
      return regex.test(origin);
    }
    return allowed === origin;
  });

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 환경변수 확인
  if (!GOOGLE_SHEET_URL || !AUTH_TOKEN) {
    console.error('❌ 환경변수가 설정되지 않았습니다.');
    return res.status(500).json({
      status: 'error',
      message: '서버 설정 오류입니다. 관리자에게 문의하세요.'
    });
  }

  // GET 요청 처리 (데이터 조회)
  if (req.method === 'GET') {
    try {
      const timestamp = Date.now();
      const response = await fetch(`${GOOGLE_SHEET_URL}?timestamp=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Google Sheets GET 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '데이터를 불러오는데 실패했습니다.'
      });
    }
  }

  // POST 요청 처리 (데이터 저장/삭제)
  if (req.method === 'POST') {
    try {
      const data = req.body;

      // 🔐 인증 토큰 추가
      data.auth_token = AUTH_TOKEN;

      // Google Sheets로 프록시
      const response = await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const text = await response.text();

      // JSON 파싱 시도
      try {
        const result = JSON.parse(text);
        return res.status(200).json(result);
      } catch (e) {
        // 파싱 실패 시 텍스트 그대로 반환
        return res.status(200).send(text);
      }
    } catch (error) {
      console.error('Google Sheets POST 오류:', error);
      return res.status(500).json({
        status: 'error',
        message: '데이터를 저장하는데 실패했습니다.'
      });
    }
  }

  // 지원하지 않는 메서드
  return res.status(405).json({
    status: 'error',
    message: 'Method not allowed'
  });
};
