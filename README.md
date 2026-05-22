# 매칭온 프론트엔드

백엔드 `Back-Kyung` 코드의 실제 API 경로를 기준으로 만든 React + Vite 프론트 초안입니다.

## 실행
```bash
npm install
npm run dev
```

백엔드는 `http://localhost:8080`에서 실행한다고 가정했습니다. 다르면 `.env` 파일을 만들고 아래처럼 수정하세요.

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 현재 연결한 주요 API
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/users/me`
- PATCH `/api/users/me`
- DELETE `/api/users/me`
- GET `/api/mypage`
- GET `/api/experts/search`
- GET `/api/store-products`
- GET `/api/community/posts`
- POST `/api/community/posts`
- GET `/api/service-requests/me`
- POST `/api/service-requests`
- GET `/api/payments/me`
- GET `/api/admin/users`
- PATCH `/api/admin/users/{userId}/suspend`

## 주의
현재 백엔드 `SecurityConfig`에 CORS 설정이 주석 처리되어 있습니다. 브라우저에서 API 연결 시 CORS 오류가 나면 백엔드에서 CORS 설정을 켜야 합니다.
