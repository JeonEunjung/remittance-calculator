# 보안 강화 문서

## 🛡️ 적용된 보안 조치

### 1. 인증 토큰 기반 접근 제어

#### Google Apps Script 인증
- **방식**: Secret Token 기반 인증
- **목적**: 무단 API 호출 차단
- **구현**: 모든 POST/DELETE 요청에 토큰 검증 필수

```javascript
// ❌ 차단: 토큰 없이 직접 호출
fetch('https://script.google.com/...', { method: 'POST' })

// ✅ 허용: 프록시 서버를 통한 인증된 호출만 가능
fetch('/api/sheets', { method: 'POST' })
```

**효과**:
- Google Apps Script URL이 노출되어도 토큰 없이는 접근 불가
- 악의적 스크립트로부터 스프레드시트 보호

---

### 2. Vercel Functions 프록시 서버

#### 구조
```
브라우저 (index.html)
    ↓
Vercel Functions (/api/sheets.js) 🔐 인증 토큰 자동 추가
    ↓
Google Apps Script ✅ 토큰 검증
    ↓
Google Sheets
```

#### 보안 이점
1. **환경변수 은닉**: 사용자 브라우저에 토큰 노출 없음
2. **CORS 화이트리스트**: 허용된 도메인만 API 호출 가능
3. **단일 진입점**: 모든 요청이 프록시를 거쳐 로깅 가능

---

### 3. Rate Limiting (속도 제한)

#### Google Apps Script Rate Limit
- **제한**: 1분당 최대 30회
- **방식**: CacheService 기반 분 단위 카운팅
- **목적**: 스팸 공격 및 스프레드시트 과부하 방지

**시나리오:**
```
공격자: 1초에 100회 요청 시도
결과:
  - 처음 30회: 성공
  - 이후 70회: 429 Too Many Requests
  - 1분 경과 후 카운터 리셋
```

#### Vercel Functions CORS
- **화이트리스트**: 특정 도메인만 허용
  - `http://localhost:3000` (개발)
  - `http://localhost:5173` (Vite 개발)
  - `https://remittance-calculator.vercel.app` (프로덕션)
  - `https://*.vercel.app` (Vercel Preview 배포)

**차단 예시:**
```javascript
// ❌ 다른 사이트에서 호출 시 CORS 에러
// evil-site.com
fetch('https://remittance-calculator.vercel.app/api/sheets', { ... })
// → CORS policy error
```

---

## 💰 과금 시나리오 분석

### Vercel Functions 무료 한도
- **함수 호출**: 무제한
- **실행 시간**: 100 GB-Hours/월
- **대역폭**: 100 GB/월

### Google Apps Script 무료 한도
- **일일 실행 시간**: 90분
- **URL Fetch 호출**: 20,000회/일
- **트리거**: 20개 프로젝트 × 20개 트리거

---

## 📊 공격 시나리오 및 방어

### 시나리오 A: 정상 사용 (안전)
```
일일 사용자: 100명
평균 저장 횟수: 5회/인
총 API 호출: 500회/일
월 API 호출: 15,000회
```
**결과**: ✅ 안전 (무료 한도 내)

---

### 시나리오 B: 단일 IP 스팸 공격 (차단됨)
```
공격: 1개 IP에서 1분에 100회 요청
방어:
  1. Rate Limit 발동 → 30회 이후 차단
  2. Google Apps Script 1분당 최대 30회만 실행
결과: ✅ 차단 성공
```

---

### 시나리오 C: 분산 봇넷 공격 (부분 방어)
```
공격: 100개 서로 다른 IP에서 동시 공격
각 IP: 1분당 30회 × 100 IP = 3,000회/분 이론상 가능

현재 방어:
  1. Google Apps Script Rate Limit (1분당 30회)
     → 실제로는 먼저 도착한 30개 요청만 처리
  2. CacheService는 전역 카운터로 작동
     → 모든 IP 합산해서 1분당 30회 제한

실제 결과:
  - 1분당 최대 30회만 처리
  - 나머지 요청: 429 에러
```
**결과**: ✅ 안전 (Rate Limit으로 방어)

---

### 시나리오 D: Google Apps Script URL 직접 호출 (차단됨)
```
공격: 노출된 URL로 직접 POST 요청

curl -X POST https://script.google.com/macros/s/.../exec \
  -d '{"type": "funnel", "date": "2024-01-01", ...}'

Google Apps Script 응답:
  {
    "status": "error",
    "message": "Unauthorized: Invalid authentication token"
  }
```
**결과**: ✅ 차단 성공 (인증 토큰 없음)

---

### 시나리오 E: CORS 우회 시도 (차단됨)
```javascript
// 악의적 사이트 (evil-site.com)
fetch('https://remittance-calculator.vercel.app/api/sheets', {
  method: 'POST',
  body: JSON.stringify({ ... })
})

// 브라우저 CORS 정책으로 차단
// Error: CORS policy: No 'Access-Control-Allow-Origin' header
```
**결과**: ✅ 브라우저 단에서 차단

---

## 🚨 위험 요소 및 대응

### 위험 1: 환경변수 노출

**시나리오:**
- `.env` 파일이 실수로 GitHub에 커밋됨
- Vercel 환경변수 스크린샷이 공개됨

**피해:**
- 공격자가 `AUTH_TOKEN` 획득
- 프록시 서버 없이 직접 Google Apps Script 호출 가능

**대응:**
1. **즉시 토큰 변경**
   ```bash
   # .env 파일 수정
   AUTH_TOKEN=new-secure-random-token-2024

   # google-apps-script.js의 VALID_TOKEN도 동일하게 변경
   const VALID_TOKEN = 'new-secure-random-token-2024';

   # Google Apps Script 새 배포 (새 URL 발급)
   # Vercel 환경변수 업데이트
   ```

2. **Git 히스토리 정리**
   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit: 보안 강화 완료"
   git push -f origin main
   ```

---

### 위험 2: Google Apps Script 할당량 소진

**시나리오:**
- Rate Limit을 우회하지 않아도 장시간 공격 시 할당량 소진 가능
- 일일 90분 실행 시간 초과

**피해:**
- 서비스 완전 중단 (24시간)

**대응:**
1. **Google Apps Script 모니터링**
   - Apps Script Dashboard → Executions 확인
   - 비정상 트래픽 감지 시 즉시 대응

2. **긴급 차단**
   ```javascript
   // google-apps-script.js 최상단 추가
   const EMERGENCY_SHUTDOWN = true;

   function doPost(e) {
     if (EMERGENCY_SHUTDOWN) {
       return ContentService.createTextOutput(JSON.stringify({
         status: 'error',
         message: 'Service temporarily unavailable'
       }));
     }
     // 기존 로직...
   }
   ```

---

### 위험 3: Vercel Functions 과부하

**시나리오:**
- 프록시 서버(/api/sheets)에 대량 요청
- 함수 실행 시간 초과 (100 GB-Hours/월)

**피해:**
- Vercel이 함수 실행 중지
- 추가 과금 발생 가능

**대응:**
1. **Vercel Dashboard 모니터링**
   - Functions → Usage 확인
   - 비정상적인 스파이크 감지

2. **환경변수로 API 일시 중단**
   ```bash
   # Vercel 환경변수 추가
   API_DISABLED=true
   ```

   ```javascript
   // api/sheets.js
   if (process.env.API_DISABLED === 'true') {
     return res.status(503).json({
       status: 'error',
       message: 'Service temporarily unavailable for maintenance'
     });
   }
   ```

---

## ✅ 보안 체크리스트

### 배포 전 필수 확인사항

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있음
- [ ] Google Apps Script의 `VALID_TOKEN`이 변경됨 (기본값 사용 금지)
- [ ] `.env`의 `AUTH_TOKEN`이 Google Apps Script와 일치함
- [ ] `GOOGLE_SHEET_URL`을 새로 배포된 URL로 업데이트함
- [ ] Vercel 환경변수에 `GOOGLE_SHEET_URL`과 `AUTH_TOKEN` 설정함
- [ ] `git log` 명령으로 Git 히스토리에 토큰이 없음을 확인함
- [ ] GitHub 레포지토리가 Private으로 설정됨 (또는 토큰 노출 없음)

### 정기 점검 (주 1회)

- [ ] Vercel Functions 사용량 확인
- [ ] Google Apps Script Executions 로그 확인
- [ ] 비정상 트래픽 패턴 감지
- [ ] 환경변수 유출 여부 확인 (GitHub, 스크린샷 등)

---

## 🔐 추가 보안 권장사항

### 1. IP 화이트리스트 (선택사항)

**Google Apps Script에 추가:**
```javascript
const ALLOWED_IPS = [
  '1.2.3.4',  // 회사 IP
  '5.6.7.8'   // 집 IP
];

function doPost(e) {
  // IP 검증 (Apps Script에서는 제한적)
  // Vercel Functions에서 구현 권장
}
```

**Vercel Functions에서 구현:**
```javascript
// api/sheets.js
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];

if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(req.headers['x-forwarded-for'])) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

### 2. 로깅 및 알림

**Slack/Discord Webhook 연동:**
```javascript
// api/sheets.js
async function sendAlert(message) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ text: message })
  });
}

// 비정상 트래픽 감지 시
if (requestCount > 100) {
  await sendAlert('⚠️ 비정상 트래픽 감지: ' + requestCount + '회/분');
}
```

---

### 3. 토큰 자동 교체 (고급)

**월 1회 자동 토큰 교체 스크립트:**
```bash
#!/bin/bash
# rotate-token.sh

NEW_TOKEN=$(openssl rand -hex 32)

# .env 업데이트
sed -i '' "s/AUTH_TOKEN=.*/AUTH_TOKEN=$NEW_TOKEN/" .env

# Vercel 환경변수 업데이트
vercel env rm AUTH_TOKEN production
echo "$NEW_TOKEN" | vercel env add AUTH_TOKEN production

echo "✅ 토큰 교체 완료: $NEW_TOKEN"
echo "⚠️ Google Apps Script의 VALID_TOKEN도 수동 업데이트 필요"
```

---

## 📞 긴급 대응 절차

### 1단계: 피해 확인
- [ ] Vercel Dashboard에서 비정상 트래픽 확인
- [ ] Google Apps Script Executions 로그 확인
- [ ] 데이터 무결성 확인 (스프레드시트 점검)

### 2단계: 즉시 차단
```bash
# Vercel 환경변수로 API 비활성화
vercel env add API_DISABLED true production

# 또는 Google Apps Script에 긴급 차단 코드 추가
EMERGENCY_SHUTDOWN = true
```

### 3단계: 보안 업데이트
1. 토큰 변경 (AUTH_TOKEN)
2. Google Apps Script 새 배포 (URL 변경)
3. `.env` 파일 업데이트
4. Vercel 환경변수 업데이트

### 4단계: 서비스 재개
```bash
# API 재활성화
vercel env rm API_DISABLED production

# 동작 확인
curl https://remittance-calculator.vercel.app/api/sheets
```

---

## 📚 관련 문서

- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Vercel 환경변수 설정 가이드
- [README.md](./README.md) - 프로젝트 개요 및 사용법
- [google-apps-script.js](./google-apps-script.js) - Google Apps Script 소스코드

---

## 🆘 문의

보안 취약점 발견 시:
1. GitHub Issue를 **절대 생성하지 마세요** (공개됨)
2. 레포지토리 관리자에게 직접 연락
3. 토큰 노출이 의심되면 즉시 교체
