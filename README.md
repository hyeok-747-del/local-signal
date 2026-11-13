# 로컬인사이트
전국 경쟁업체 AI 마케팅 분석 플랫폼. 현재 **2단계 API 연동 코드**까지 구현했습니다. 공공 상가정보·네이버 블로그·네이버 Maps는 실제 키를 설정한 뒤 사용합니다. 키 미설정 시 명확한 안내를 표시합니다. DEMO를 켜면 가상의 서울 업체 24개로 검색, 선택, 비교, 관심업체 저장을 체험합니다. 통계 분석은 3단계에서 구현합니다.

## 실행 (Windows PowerShell)
Node.js와 npm이 필요합니다. 테스트 의존성(jsdom 31)은 Node.js 22.22.2+, 24.15.0+ 또는 26+를 지원합니다. 현재 검증 환경은 Node.js 26.13.0입니다.
```powershell
npm.cmd install
npm.cmd run dev
```
http://localhost:3000 에 접속합니다. PowerShell 실행 정책으로 npm.ps1이 차단되면 위처럼 npm.cmd를 사용합니다.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

HTTP 검증은 프로덕션 서버를 `npm.cmd start -- --port 3001`로 실행한 상태에서 `node scripts/smoke.mjs`를 사용합니다. 키가 없으면 미설정 오류를 확인하고, 키가 설정된 API는 이 스크립트가 실제 외부 호출을 하지 않습니다. DOM/공급자 mock 테스트와 실데이터 인증 검증은 별개입니다.

## 사용
1. [API_SETUP.md](API_SETUP.md)에 따라 `.env.local`을 설정하고 서버를 재시작합니다. 키 없이 체험하려면 DEMO를 켭니다.
2. 서울특별시/시·도 전체에서 업체 검색을 누릅니다. 카페·파티룸·케이터링으로 검색하거나 구를 선택합니다.
3. 체크박스로 개별 또는 검색 결과 전체(페이지 전체 포함)를 선택합니다. 선택 개수 제한 없이 기본 정보를 비교합니다.
4. 북마크로 관심업체를 저장합니다. 관심 경쟁업체 메뉴에서 확인/삭제하고 새로고침 후 저장 상태를 확인합니다.
5. 실제 검색에서는 원본 1,000건씩 불러와 키워드를 필터합니다. 현재 확인 범위와 지역 전체 원본 수를 구분하며 다음 원본을 계속 불러올 수 있습니다. 선택 개수 제한은 없습니다.
6. 실제 업체명을 누르거나 지도 마커를 누르면 업체 정보가 표시됩니다. 좌표 없는 업체는 지도에 표시하지 않습니다.
7. 블로그 분석 메뉴에서 실제 업체를 골라 네이버 검색 결과와 원문 링크를 확인합니다. 통계 비교는 3단계, 키워드·리뷰·이벤트·AI 보고서는 4단계입니다.
8. 설정에서 키 설정 유무를 확인합니다. 설정됨은 실제 인증 성공을 의미하지 않으며 호출 시 검증됩니다.

관심업체 및 지역 설정은 LocalStorage에 저장되며 다른 브라우저/기기와 공유되지 않습니다. 개인정보나 Secret을 넣지 마세요. DEMO 업체와 주소는 가상이며 실존 업체의 실적을 나타내지 않습니다. 실제 검색 시 제공기관 행정구역 코드 목록을 조회하고, 키가 없으면 기본 지역 선택 목록을 제공합니다.

## 구조
- `src/app`: App Router 진입점, 메타데이터, 전역 스타일(Tailwind CSS 4)
- `src/components/dashboard.tsx`: 대시보드, 검색, 선택, 비교 및 로컬 저장
- `src/components/business-map.tsx`: 네이버 Maps SDK 및 위치/업체 연동
- `src/components/blog-search.tsx`: 블로그 검색 및 게시글 추가 로딩
- `src/app/api`: 업체/지역/블로그/설정 상태 Route Handlers
- `src/lib/server`: 고정 호스트 외부 API 호출, 응답 정규화, 오류 및 제한 처리
- `src/lib/business.ts`: 타입, 명시적 데모 데이터, 검색/선택 함수
- `src/lib/regions.ts`: 17개 시·도 및 지역 선택 목록
- `tests`: 데이터 단위 검증 및 jsdom/Testing Library 동작 회귀 테스트
- `PROJECT_SPEC.md`: 5단계 전체 요구사항
- `PROGRESS.md`: 구현 및 검증 기록

## API 키 설정
[NAVER API HUB 서버 인증 안내](NAVER_API_HUB.md): `NAVER_API_HUB_CLIENT_ID`와 `NAVER_API_HUB_CLIENT_SECRET`을 `.env.local`에서 읽습니다. 블로그는 기존 UI에 연결했고 지역 검색·검색어 트렌드는 서버 경로를 준비했습니다. 해당 추가 화면은 후속 단계에서 구현합니다.

[API_SETUP.md](API_SETUP.md)에 발급 링크, 변수명, 입력 위치, 오류 대처 방법을 정리했습니다. `.env.example`을 `.env.local`로 복사하고 실제 키를 넣습니다. 비밀값에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 공개 지도 Key ID만 예외입니다. 키를 GitHub나 채팅에 올리지 않습니다.

서버는 키가 포함된 요청 URL이나 제공기관 오류 원문을 클라이언트에 반환하지 않습니다. 요청당 타임아웃과 인스턴스별 임시 호출 제한이 있으며 Vercel 전체 호출량을 보장하는 분산 제한은 아닙니다. 키 없는 환경에서 실데이터 인증 성공을 검증할 수 없으므로 mock 응답 테스트와 실제 연결 테스트를 구분합니다.

## GitHub / Vercel (5단계 실행 예정)
현재 원격 업로드 및 배포는 수행하지 않습니다. 추후 GitHub에 저장소를 생성하고 이 프로젝트를 push한 후 Vercel에서 Import합니다. Framework는 Next.js, Build Command는 `npm run build`, 출력 경로는 기본값을 사용합니다. Vercel Settings → Environment Variables에 서버 키를 등록하고 재배포합니다. 지도 허용 도메인에 배포 도메인을 추가합니다. `.env.local`은 Git에 포함하지 않습니다.

기본 구성 참고: [Next.js 공식 설치 가이드](https://nextjs.org/docs/app/getting-started/installation), [Tailwind Next.js 설치](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
