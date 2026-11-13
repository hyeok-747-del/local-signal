# 2단계 API 설정

실제 키는 `.env.local`에서만 관리합니다. **키를 채팅이나 GitHub에 붙여 넣지 마세요.** 최신 실연결 검증 결과는 PROGRESS.md를 확인하세요.

## 입력 위치
프로젝트 루트에서 `.env.example`을 `.env.local`로 복사한 뒤 실제 값을 입력합니다. `.env.local`이 이미 있으면 기존 값을 보존하세요.

```dotenv
PUBLIC_DATA_API_KEY=공공데이터포털_인증키
NAVER_API_HUB_CLIENT_ID=API_HUB_Client_ID
NAVER_API_HUB_CLIENT_SECRET=API_HUB_Client_Secret
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=네이버_Maps_공개_Key_ID
```

입력 후 실행 중인 서버를 종료하고 `npm.cmd run dev`로 다시 실행합니다. 지도 공개 식별자는 빌드 시 클라이언트 코드에 포함되므로 프로덕션에서는 다시 빌드/배포해야 합니다. 키 상태를 새로 확인하려면 페이지를 새로고침합니다.

## 1. 공공 상가정보
1. [소상공인시장진흥공단 상가(상권)정보 API](https://www.data.go.kr/data/15012005/openapi.do)에서 활용 신청합니다.
2. 활용 승인과 인증키 활성화를 확인합니다.
3. 인증키를 `PUBLIC_DATA_API_KEY`에 입력합니다. 일반 인증키(Decoding)를 권장하며, Encoding 키도 한 번 디코딩 후 안전하게 인코딩하도록 처리했습니다.
4. 실제 업체 검색을 누릅니다. 결과가 없으면 시·군·구 또는 키워드를 바꿉니다.

사용 엔드포인트는 `https://apis.data.go.kr/B553077/api/open/sdsc2`의 `baroApi`(행정구역)와 `storeListInDong`(지역 업체)입니다. 시·군·구는 제공기관 코드로 확인한 뒤 조회합니다. 개편 지역이 API에 아직 없으면 시·도 전체 검색을 이용하세요.

공식 요청 변수에 맞춰 서버가 `PUBLIC_DATA_API_KEY`를 `ServiceKey`에 매핑합니다. 지역 목록은 `baroApi?resId=dong&catId=cty&type=json`, 업체 원본은 `storeListInDong?divId=ctprvnCd&key=시도코드&pageNo=페이지&numOfRows=1000&type=json`을 사용합니다. 시·군·구 선택 시 `divId=signguCd`와 공식 시·군·구 코드를 사용합니다. 인증키는 이 안내나 브라우저 요청에 넣지 않습니다.

검색창의 “업체명·주소·업종 상세 검색”에서 각 조건을 지정할 수 있습니다. 통합 키워드와 모든 상세 조건을 서버에서 함께 필터합니다. 세부 문자열을 공공 API에 존재하지 않는 파라미터로 보내지 않습니다. 신규 발견 이력도 상세 검색 조건별로 구분합니다.

빈 결과는 지역 원본 0건(`NO_REGIONAL_DATA`), 불러온 페이지의 조건 불일치(`NO_MATCH_IN_PAGE`), 요청 페이지가 비어 있음(`EMPTY_PAGE`)으로 구분합니다. 인증·호출 한도·통신·응답 형식 오류는 별도의 오류 응답으로 표시합니다. 원본을 읽지 못한 것을 정상 0건으로 처리하지 않습니다.

로컬 프로덕션 서버를 `npm.cmd start -- --port 3001`로 실행하고 `node scripts/check-public-data.mjs`로 확인합니다. 키가 있으면 실제 API를 호출하고 없으면 미설정 처리만 검증합니다. 실제 키 값과 원문은 출력하지 않습니다.

이 API는 자유 키워드 통합 검색이 아닙니다. 지역 원본을 1,000건씩 가져오고 상호·업종·주소에 키워드가 모두 포함된 업체를 찾습니다. “다음 원본 1,000건 불러오기”로 남은 원본을 계속 검색할 수 있습니다. 현재 확인한 원본 수와 제공기관 전체 원본 수를 구분하여 표시합니다. 전체 탐색 전 0건은 지역 내 업체 부재를 의미하지 않습니다. 결과는 영업/폐업 실시간 보증이 아닙니다.

## 2. NAVER API HUB 블로그·지역·검색어 트렌드
1. 네이버 클라우드 콘솔 → NAVER API HUB → Application에서 등록한 애플리케이션을 선택합니다.
2. 블로그 검색·지역 검색·검색어 트렌드 이용 권한을 확인합니다.
3. 인증 정보의 Client ID와 Client Secret을 각각 `NAVER_API_HUB_CLIENT_ID`, `NAVER_API_HUB_CLIENT_SECRET`에 입력합니다. Maps 키와 서로 다릅니다. [상세 인증 및 서버 경로](NAVER_API_HUB.md)를 참고하세요.
4. 실제 업체를 검색하거나 관심업체로 저장한 뒤 “블로그 분석”에서 업체를 선택합니다.
5. 제목/요약문/블로그명/작성일/원문 링크를 확인합니다. DEMO 업체의 실제 블로그는 검색하지 않습니다.

[공식 API HUB 블로그 문서](https://api.ncloud-docs.com/docs/naver-api-hub-search-blog)에 따라 날짜순 조회와 시작 위치 제한을 처리합니다. 요청당 최대 50개를 불러오고 시작 위치 1,000 범위 안에서 추가 탐색합니다. 결과 개수는 확인된 게시글 수이며 전체 게시글 수로 표시하지 않습니다. 지역·업종을 검색어에 포함해도 동명 업체/타 업체가 섞일 수 있으므로 원문을 확인하세요.

## 3. 네이버 Maps
1. [네이버 클라우드 콘솔](https://console.ncloud.com/)에서 Maps 서비스와 애플리케이션을 설정합니다.
2. Dynamic Map 이용 권한을 활성화하고 Web 서비스 허용 URL에 로컬 주소와 추후 Vercel 도메인을 등록합니다. 현재 개발 시에는 `http://localhost:3000`을 사용합니다.
3. 공개 Key ID를 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`에 입력합니다. **Secret Key는 입력하지 않습니다.**
4. [공식 SDK 가이드](https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html)에 맞춰 `ncpKeyId`로 SDK를 로드합니다.
5. 실제 업체 검색 결과에서 좌표가 있는 업체만 마커로 표시합니다. 마커/업체명 클릭으로 정보와 해당 목록 페이지를 연결하고 관심업체를 저장합니다. 가상 좌표는 생성하지 않습니다.

지도 오류 시에도 업체 검색·선택·비교는 사용할 수 있습니다. 키 설정 유무는 인증 성공을 뜻하지 않으며 도메인/이용 권한은 실제 표시로 확인해야 합니다. 클라우드 서비스 요금과 한도를 확인하세요.

## 오류 안내와 제한
- `NOT_CONFIGURED` / 503: 환경변수가 없거나 비어 있습니다.
- `INVALID_CREDENTIALS`: 인증키, 활용 승인 또는 API 이용 권한을 확인합니다.
- `RATE_LIMITED` / 429: 앱 또는 제공기관 한도입니다. 잠시 후 재시도합니다.
- `NETWORK_ERROR` / 504: 네트워크 실패 또는 응답 시간 초과입니다.
- `INVALID_RESPONSE`: 제공기관의 응답 형식이 예상과 다릅니다. 오류 원문과 키는 화면에 노출하지 않습니다.
- Vercel 인스턴스별 임시 분당 제한이 있으며 분산 환경의 전체 호출량을 보장하지 않습니다. 공개 배포 전 제공기관 콘솔의 사용량과 한도를 확인합니다.

## Vercel에서 설정 (5단계)
4단계 OpenAI 요약·검색광고·리뷰·PDF 설정과 사용법은 [STAGE4_GUIDE.md](STAGE4_GUIDE.md)를 확인하세요. OpenAI는 `OPENAI_API_KEY`뿐 아니라 사용 가능한 `OPENAI_MODEL`도 필요합니다. 키·Secret은 `.env.local`에만 입력합니다.

프로젝트 Settings → Environment Variables에 동일한 변수명을 추가하고 필요한 Production/Preview 환경에 적용 후 재배포합니다. Maps 허용 URL에 공개 도메인을 추가합니다. Secret은 `NEXT_PUBLIC_` 변수로 만들지 않습니다. OpenAI·데이터랩·검색광고는 4단계에 연결합니다.
