# 로컬시그널 · Local Signal
전국 경쟁업체 AI 마케팅 분석 플랫폼. **공개 사이트: https://local-signal-pdh.vercel.app** . 라운드 옐로/크림 테마와 분석 기능을 배포했으며 공공 상가정보·네이버 블로그·트렌드 실연결을 공개 주소에서 검증했습니다. [사용 안내](STAGE4_GUIDE.md)에 리뷰·이벤트·보고서·PDF 및 선택적 AI 설정을 정리했습니다. Maps·OpenAI·검색광고는 해당 키 설정 후 별도 검증이 필요합니다. DEMO는 가상 데이터로 기본 기능을 체험하는 모드이며 실제 실적을 만들지 않습니다.

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
   “업체명·주소·업종 상세 검색”을 열면 각 필드에 조건을 별도로 지정할 수 있습니다. 모든 조건을 현재 불러온 지역 원본에서 서버 필터링합니다. 빈 결과와 인증/한도/통신 오류를 구분하며 다음 원본을 계속 탐색할 수 있습니다.
3. 체크박스로 개별 또는 검색 결과 전체(페이지 전체 포함)를 선택합니다. 선택 개수 제한 없이 기본 정보를 비교합니다.
4. 북마크로 관심업체를 저장합니다. 관심 경쟁업체 메뉴에서 확인/삭제하고 새로고침 후 저장 상태를 확인합니다.
5. 실제 검색에서는 원본 1,000건씩 불러와 키워드를 필터합니다. 현재 확인 범위와 지역 전체 원본 수를 구분하며 다음 원본을 계속 불러올 수 있습니다. 선택 개수 제한은 없습니다.
6. 실제 업체명을 누르거나 지도 마커를 누르면 업체 정보가 표시됩니다. 좌표 없는 업체는 지도에 표시하지 않습니다.
7. 블로그 분석 메뉴에서 실제 업체를 골라 검색 결과와 원문 링크, 오늘/이번 주/이번 달 통계를 확인합니다. 여러 업체 체크 후 비교 조회로 표·선/막대그래프와 최근/이전 7일 활동을 비교합니다. 추가 게시글을 불러오면 통계도 갱신됩니다.
8. 제목·요약문 근거로 협찬 명시/체험단 명시/내돈내산 명시/판단 불가를 분류합니다. 키워드 기반이며 AI 추정은 사용하지 않습니다. 상충·부정·모집 문맥은 판단을 보류합니다.
9. 같은 지역·키워드를 재검색하면 신규 발견 업체와 최초 발견일을 확인합니다. 첫 검색은 기준선입니다. 신규 발견은 실제 신규 개업을 의미하지 않습니다. 과거 관측 ID는 부분 검색 이후에도 유지합니다.
10. 키워드 분석에서 실제 관심도를 비교하고, 리뷰 분석에서 직접 입력/CSV로 표현을 분석합니다. 이벤트는 조회한 블로그의 후보를 탐색합니다. 보고서는 일/주/월 기본 통계와 PDF 다운로드를 지원하며 OpenAI 키·모델이 있을 때만 AI 요약을 활성화합니다.
11. 설정에서 키 설정 유무를 확인합니다. 설정됨은 실제 인증 성공을 의미하지 않으며 호출 시 검증됩니다.

관심업체 및 지역 설정은 LocalStorage에 저장되며 다른 브라우저/기기와 공유되지 않습니다. 개인정보나 Secret을 넣지 마세요. DEMO 업체와 주소는 가상이며 실존 업체의 실적을 나타내지 않습니다. 실제 검색 시 제공기관 행정구역 코드 목록을 조회하고, 키가 없으면 기본 지역 선택 목록을 제공합니다.

## 구조
- `src/app`: App Router 진입점, 메타데이터, 전역 스타일(Tailwind CSS 4)
- `src/components/dashboard.tsx`: 대시보드, 검색, 선택, 비교 및 로컬 저장
- `src/components/business-map.tsx`, `kakao-business-map.tsx`: 카카오맵 SDK 및 위치/업체 연동. 설정은 [KAKAO_MAP_SETUP.md](KAKAO_MAP_SETUP.md) 참고.
- `src/components/blog-search.tsx`: 블로그 검색 및 게시글 추가 로딩
- `src/app/api`: 업체/지역/블로그/설정 상태 Route Handlers
- `src/lib/server`: 고정 호스트 외부 API 호출, 응답 정규화, 오류 및 제한 처리
- `src/lib/business.ts`: 타입, 명시적 데모 데이터, 검색/선택 함수
- `src/lib/regions.ts`: 17개 시·도 및 지역 선택 목록
- `src/lib/blog-analysis.ts`: 한국시간 날짜 구간, 표본 범위, 증감/급증 신호, 근거 기반 키워드 분류
- `src/lib/discoveries.ts`: 검색 범위별 관측 이력과 최초 발견일
- `src/components/blog-analysis-panel.tsx`, `blog-activity.tsx`, `activity-bars.tsx`: 단일/복수 업체 분석 및 그래프
- `tests`: 데이터 단위 검증 및 jsdom/Testing Library 동작 회귀 테스트
- `PROJECT_SPEC.md`: 5단계 전체 요구사항
- `PROGRESS.md`: 구현 및 검증 기록

## API 키 설정
[NAVER API HUB 서버 인증 안내](NAVER_API_HUB.md): `NAVER_API_HUB_CLIENT_ID`와 `NAVER_API_HUB_CLIENT_SECRET`을 `.env.local`에서 읽습니다. 블로그는 기존 UI에 연결했고 지역 검색·검색어 트렌드는 서버 경로를 준비했습니다. 해당 추가 화면은 후속 단계에서 구현합니다.

[API_SETUP.md](API_SETUP.md)에 발급 링크, 변수명, 입력 위치, 오류 대처 방법을 정리했습니다. `.env.example`을 `.env.local`로 복사하고 실제 키를 넣습니다. 비밀값에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 공개 지도 Key ID만 예외입니다. 키를 GitHub나 채팅에 올리지 않습니다.

서버는 키가 포함된 요청 URL이나 제공기관 오류 원문을 클라이언트에 반환하지 않습니다. 요청당 타임아웃과 인스턴스별 임시 호출 제한이 있으며 Vercel 전체 호출량을 보장하는 분산 제한은 아닙니다. 키 없는 환경에서 실데이터 인증 성공을 검증할 수 없으므로 mock 응답 테스트와 실제 연결 테스트를 구분합니다.

## 통계 기준 및 한계
통계는 한국시간 기준 ‘검색에서 확인된 게시글 수’입니다. 이번 주는 월요일~오늘, 최근 7일은 오늘 포함 7일, 이전 7일은 그 앞의 7일입니다. URL 중복은 제거하며 미확인/잘못된 날짜는 날짜 통계에서 제외합니다. 이전 7일이 0건이면 무한 증가율을 표시하지 않습니다. 검색 표본이 최근 14일을 충분히 포함하지 않으면 증가율/급증 판단을 보류합니다. 급증 신호는 표본 기준 2배 이상이면서 3건 이상 증가한 경우입니다. 색인 지연·검색 제한·동명 업체 오매칭 가능성이 있어 실제 총 홍보량을 뜻하지 않습니다.

복수 조회는 선택 수를 제한하지 않고 요청 간격을 두어 순차 처리합니다. 중지하거나 일부 업체가 실패해도 완료된 결과는 유지합니다. 분석 결과는 화면 세션에서만 유지되고 새로고침 시 다시 조회합니다. 발견 이력은 LocalStorage의 `local-insight:discoveries:v1`에 저장되며 다른 기기와 공유되지 않습니다. 저장 오류는 안내하며 손상된 기존 기록을 덮어쓰지 않습니다.

## GitHub / Vercel
사용자 요청에 따라 [GitHub 저장소](https://github.com/hyeok-747-del/local-signal)에 연결하여 `main` 브랜치로 업로드했습니다. `.env.local`과 생성물은 포함하지 않습니다. 후속 변경은 같은 origin/main을 사용합니다.

Vercel 프로젝트 `pdh7/local-signal-pdh`와 연결되어 있습니다. 배포 주소는 https://local-signal-pdh.vercel.app 이며 최종 배포/검증 기록은 PROGRESS.md를 확인하세요. 배포 설정과 서버 Secret 별칭은 [DEPLOYMENT.md](DEPLOYMENT.md)에 정리했습니다. 지도 키를 추가하면 허용 도메인에 이 주소를 등록합니다.

기본 구성 참고: [Next.js 공식 설치 가이드](https://nextjs.org/docs/app/getting-started/installation), [Tailwind Next.js 설치](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
