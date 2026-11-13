# Local Signal 배포

- GitHub: https://github.com/hyeok-747-del/local-signal
- Vercel 프로젝트: `pdh7/local-signal-pdh`
- Production 도메인: https://local-signal-pdh.vercel.app
- Framework: Next.js / 설치: npm ci / 빌드: npm run build
- 검증: Production READY, 비로그인 HTTP 200 및 공공/블로그/트렌드 실제 응답 확인(2026-11-13). 세부 기록은 PROGRESS.md.

## 환경변수
키는 Git에 올리지 않습니다. `.vercelignore`도 `.env*`, `.qa`, `.git`, node_modules, .next를 배포 소스에서 제외합니다. 실제 값은 Vercel 서버 Secret에 등록합니다.

| 로컬 변수 | Vercel Production 변수 | 용도 |
| --- | --- | --- |
| PUBLIC_DATA_API_KEY | DATA_API_KEY | 공공 상가정보 서버 인증 |
| NAVER_API_HUB_CLIENT_ID | 동일 | 검색/트렌드 Client ID |
| NAVER_API_HUB_CLIENT_SECRET | 동일 | 검색/트렌드 Secret |
| NEXT_PUBLIC_KAKAO_MAP_KEY | 동일 | 카카오맵 JavaScript 공개 키 |
| OPENAI_API_KEY / OPENAI_MODEL | 동일 | 선택적 AI 요약 |
| NAVER_AD_CUSTOMER_ID / NAVER_AD_API_KEY / NAVER_AD_SECRET_KEY | 동일 | 선택적 검색광고 |

공공 인증값은 Vercel CLI의 `PUBLIC_*` Secret 제한에 맞춰 DATA_API_KEY 별칭을 사용합니다. Next.js 서버에서만 읽습니다. 키를 URL/명령 인자/문서에 넣지 않습니다.

## 갱신
기존 Vercel 인증과 프로젝트 연결을 사용합니다. `.vercel/project.json`은 로컬 연결 정보이며 Git 제외입니다. 아래 명령은 실제 클라우드 설정과 배포를 변경합니다.

```powershell
npm.cmd exec --yes --package=vercel -- vercel link --yes --project local-signal-pdh --scope pdh7
node scripts/sync-vercel-env.mjs
npm.cmd exec --yes --package=vercel -- vercel deploy --prod --yes --scope pdh7
```

환경 동기화 스크립트는 명시된 허용 변수 중 비어 있지 않은 값만 표준입력으로 전달하고 값은 출력하지 않습니다. CLI가 로컬 인증용 OIDC 토큰을 .env.local에 추가할 수 있으나 이 값은 동기화 대상이 아닙니다.

## 확인
`SMOKE_URL`을 Production 도메인으로 지정한 뒤 `scripts/smoke.mjs`, `check-public-data.mjs`, `check-naver-live.mjs`로 상태/공공 검색/검색 및 트렌드를 점검합니다. 실제 API 호출량이 발생하며 결과는 상태와 건수만 출력합니다. 미설정 기능은 비활성화/안내 상태로 유지합니다.

Maps를 발급받으면 SDK 허용 도메인에 Production 주소를 등록하고 환경변수 설정 후 재배포합니다. OpenAI 및 검색광고도 실제 키 발급 후 별도 검증이 필요합니다.
