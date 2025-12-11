# Vercel 배포 및 환경변수 설정 가이드

## 🔐 보안 중요 사항

**절대 GitHub에 커밋하지 말아야 할 것들:**
- `.env` 파일
- `AUTH_TOKEN` 값
- `GOOGLE_SHEET_URL` (새로 발급받은 URL)

이 정보들은 Vercel Dashboard에서 환경변수로만 관리해야 합니다!

---

## 📋 설정 순서

### 1단계: Google Apps Script 배포

#### 1-1. Google Apps Script 열기
1. [Google Sheets 스프레드시트](https://sheets.google.com) 생성
2. **확장 프로그램** → **Apps Script** 클릭
3. 기존 코드 삭제 후 `google-apps-script.js` 내용 복사-붙여넣기

#### 1-2. 인증 토큰 변경 (필수!)
```javascript
// ⚠️ 이 부분을 반드시 변경하세요!
const VALID_TOKEN = 'remit-calc-secure-token-2024-change-this';
```

**새 토큰 생성 방법:**
```bash
# 터미널에서 실행 (Mac/Linux)
openssl rand -hex 32

# 또는 온라인 생성기 사용
# https://www.random.org/strings/
```

**예시:**
```javascript
const VALID_TOKEN = 'a7f3e9d2c4b8f1a6e5d3c2b9a8f7e6d5c4b3a2f1e9d8c7b6a5f4e3d2c1b0a9f8';
```

#### 1-3. 배포
1. **배포** → **새 배포** 클릭
2. **유형 선택** → **웹 앱** 선택
3. **액세스 권한**:
   - 실행: **나**
   - 액세스 권한: **모든 사용자** (인증 토큰으로 보호됨)
4. **배포** 클릭
5. **웹 앱 URL** 복사 (나중에 사용)

**URL 형식 예시:**
```
https://script.google.com/macros/s/AKfycbx.../exec
```

---

### 2단계: Vercel 프로젝트 생성

#### 2-1. GitHub 레포지토리 연결
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **Add New** → **Project** 클릭
3. GitHub 레포지토리 선택 (`remittance-calculator`)
4. **Import** 클릭

#### 2-2. 프로젝트 설정 (그대로 두기)
- **Framework Preset**: Other
- **Root Directory**: `./`
- **Build Command**: (비워두기)
- **Output Directory**: (비워두기)

#### 2-3. **Deploy** 클릭
- 첫 배포는 환경변수 없이 진행 (나중에 추가)

---

### 3단계: Vercel 환경변수 설정

#### 3-1. Settings로 이동
1. Vercel 프로젝트 대시보드
2. **Settings** 탭 클릭
3. 왼쪽 메뉴 → **Environment Variables** 선택

#### 3-2. 환경변수 추가

| 변수명 | 값 | Environment | 설명 |
|--------|-----|-------------|------|
| `GOOGLE_SHEET_URL` | `https://script.google.com/macros/s/.../exec` | Production, Preview, Development | 1단계에서 복사한 URL |
| `AUTH_TOKEN` | `a7f3e9d2c4b8f1a6e5d3c2b9a8f7e6d5...` | Production, Preview, Development | Google Apps Script의 VALID_TOKEN과 동일 |

**⚠️ 중요:**
- `AUTH_TOKEN`은 Google Apps Script의 `VALID_TOKEN`과 **완전히 동일**해야 함!
- 대소문자, 공백 등 정확히 일치해야 작동

#### 3-3. 각 환경변수 입력 방법
1. **Name** 필드에 변수명 입력 (예: `GOOGLE_SHEET_URL`)
2. **Value** 필드에 값 입력
3. **Environment** 선택:
   - ✅ Production (프로덕션)
   - ✅ Preview (프리뷰 배포)
   - ✅ Development (로컬 개발)
4. **Add** 버튼 클릭

---

### 4단계: 재배포

환경변수를 추가한 후 반드시 재배포해야 적용됩니다!

#### 4-1. Deployments 탭으로 이동
1. 상단 메뉴 → **Deployments** 클릭
2. 최신 배포 찾기

#### 4-2. 재배포 실행
1. 배포 오른쪽의 **⋯** (더보기) 클릭
2. **Redeploy** 선택
3. **Redeploy** 버튼 클릭 (확인)
4. 배포 완료 대기 (1-2분 소요)

---

### 5단계: 로컬 개발 환경 설정 (선택사항)

#### 5-1. `.env` 파일 생성
프로젝트 루트에 `.env` 파일 생성:

```bash
# Google Apps Script 배포 URL
GOOGLE_SHEET_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec

# 인증 토큰 (Google Apps Script의 VALID_TOKEN과 동일)
AUTH_TOKEN=a7f3e9d2c4b8f1a6e5d3c2b9a8f7e6d5c4b3a2f1e9d8c7b6a5f4e3d2c1b0a9f8
```

#### 5-2. 패키지 설치
```bash
npm install
```

#### 5-3. Vercel CLI로 로컬 실행
```bash
# Vercel CLI 설치 (최초 1회)
npm install -g vercel

# 로컬 개발 서버 실행
vercel dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

---

## ✅ 설정 확인

### 1. 브라우저 콘솔 확인
1. 배포된 사이트 열기 (예: `https://remittance-calculator.vercel.app`)
2. **개발자 도구** (F12) 열기
3. **Console** 탭 확인

**정상 동작:**
```
✅ 데이터를 불러왔습니다.
```

**오류 발생:**
```
❌ Unauthorized: Invalid authentication token
→ AUTH_TOKEN이 Google Apps Script와 일치하지 않음

❌ 서버 설정 오류입니다.
→ Vercel 환경변수가 설정되지 않음
```

### 2. Network 탭 확인
1. **Network** 탭 열기
2. 새로고침 (F5)
3. `/api/sheets` 요청 찾기

**정상 응답 (200 OK):**
```json
[
  {
    "id": "2024-01-01T...",
    "type": "funnel",
    "date": "2024-01-01",
    ...
  }
]
```

**오류 응답 (401 Unauthorized):**
```json
{
  "status": "error",
  "message": "Unauthorized: Invalid authentication token"
}
```

---

## 🚨 문제 해결

### 문제 1: "Unauthorized" 오류
**원인**: AUTH_TOKEN 불일치

**해결:**
1. Google Apps Script의 `VALID_TOKEN` 확인
2. Vercel 환경변수 `AUTH_TOKEN` 확인
3. 대소문자, 공백 등 정확히 일치하는지 확인
4. 환경변수 수정 후 **반드시 재배포**

### 문제 2: "서버 설정 오류" 메시지
**원인**: Vercel 환경변수 미설정

**해결:**
1. Vercel Dashboard → Settings → Environment Variables
2. `GOOGLE_SHEET_URL`과 `AUTH_TOKEN` 추가 확인
3. **재배포** 실행

### 문제 3: 데이터가 저장되지 않음
**원인**: Google Sheets 권한 문제

**해결:**
1. Google Apps Script → **배포** 재확인
2. **액세스 권한**: 모든 사용자
3. **실행**: 나
4. 새 배포 생성 후 URL 업데이트

### 문제 4: CORS 오류
**원인**: 허용되지 않은 도메인에서 접근

**해결:**
1. `api/sheets.js`의 `allowedOrigins` 확인
2. 배포 URL 추가:
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     'https://your-actual-domain.vercel.app', // 추가
     ...
   ];
   ```

---

## 🔄 환경변수 업데이트 방법

### 토큰 변경이 필요한 경우
1. **Google Apps Script 수정**
   ```javascript
   const VALID_TOKEN = 'new-token-here';
   ```
   새 배포 생성

2. **Vercel 환경변수 업데이트**
   - Settings → Environment Variables
   - `AUTH_TOKEN` 찾기
   - **Edit** 클릭
   - 새 값 입력 후 **Save**

3. **재배포**
   - Deployments → Redeploy

4. **로컬 .env 파일도 업데이트**
   ```bash
   AUTH_TOKEN=new-token-here
   ```

---

## 📚 추가 자료

### Vercel 관련
- [Vercel Functions 문서](https://vercel.com/docs/functions)
- [환경변수 설정 가이드](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI 사용법](https://vercel.com/docs/cli)

### Google Apps Script 관련
- [Apps Script 웹 앱 배포](https://developers.google.com/apps-script/guides/web)
- [Apps Script CacheService](https://developers.google.com/apps-script/reference/cache/cache-service)

### 보안 관련
- [SECURITY.md](./SECURITY.md) - 보안 가이드
- [보안 체크리스트](./SECURITY.md#%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8)

---

## 📞 추가 지원

문제가 계속 발생하면:
1. [SECURITY.md](./SECURITY.md) 참고
2. Vercel 로그 확인 (Functions → Logs)
3. Google Apps Script 로그 확인 (Executions)
