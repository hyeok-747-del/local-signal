# NAVER API HUB 서버 연동

## 로컬 설정
Next.js는 프로젝트 루트의 `.env.local`을 자동으로 읽습니다. 다음 두 값을 입력하고 서버를 재시작하세요. 기존 파일은 덮어쓰지 않습니다. 실제 설정값은 이 문서에 기록하지 않습니다.

```dotenv
NAVER_API_HUB_CLIENT_ID=
NAVER_API_HUB_CLIENT_SECRET=
```

콘솔 → NAVER API HUB → Application → 등록한 Application → 인증 정보에서 같은 Application의 Client ID와 Client Secret을 각각 확인합니다. 단일 값만으로는 어느 항목인지 확정하지 않습니다. 기존 개발자센터용 변수, Maps 식별자, NCP IAM Access Key/Secret과 구분합니다.

실제 값은 `.env.local` 또는 Vercel 서버 환경변수에만 입력합니다. `.env*`는 Git에서 제외하며 값이 없는 `.env.example`만 추적 가능합니다. Secret에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 클라이언트·LocalStorage·응답·로그에 인증값을 넣지 않습니다. 전달한 값이 Client Secret이었다면 새 Secret을 발급받아 로컬 파일에 직접 입력하세요. 채팅에 다시 보내지 않아도 됩니다.

## 공식 인증
고정 호스트: `https://naverapihub.apigw.ntruss.com`

| 환경변수 | 서버 인증 헤더 |
| --- | --- |
| `NAVER_API_HUB_CLIENT_ID` | `X-NCP-APIGW-API-KEY-ID` |
| `NAVER_API_HUB_CLIENT_SECRET` | `X-NCP-APIGW-API-KEY` |

GET 검색에는 Content-Type을 추가하지 않고 트렌드 POST에만 `application/json`을 사용합니다. IAM HMAC 서명/Bearer 방식이 아닙니다. 키를 URL이나 본문에 넣지 않으며 리다이렉트를 허용하지 않습니다.

## 준비된 서버 경로
| 프로젝트 | API HUB 호출 | 연결 범위 |
| --- | --- | --- |
| `GET /api/blog?name=업체명&province=서울특별시&start=1` | `GET /search/v1/blog` | 기존 블로그 UI |
| `GET /api/naver/local?query=서울%20카페` | `GET /search/v1/local` | 서버 준비, UI는 후속 작업 |
| `POST /api/naver/trends` | `POST /search-trend/v1/search` | 서버 준비, 그래프 UI는 4단계 |

지역 검색은 최대 5개와 시작 위치 1만 지원합니다. 전체 지역 업체나 위치 반경 검색으로 표현하지 않습니다. 공공 상가정보 검색과 네이버 Maps는 별도로 유지합니다. 지도 좌표는 실응답 형식 확인 후 변환하며 가상 좌표를 만들지 않습니다.

트렌드 JSON 요청 예시(키 없음):
```json
{"startDate":"2026-10-01","endDate":"2026-10-31","timeUnit":"date","keywordGroups":[{"groupName":"카페","keywords":["서울 카페"]}]}
```
날짜·구간·그룹(최대 5)·그룹당 검색어(최대 20)·선택 필터를 검증합니다. 상대 관심도(0~100)를 검색 횟수로 변환하지 않습니다.

## 검증 및 배포
키 미설정 시 503/NOT_CONFIGURED입니다. 설정 여부는 인증 성공 또는 각 API 이용 권한을 보장하지 않습니다. 정상/오류 분기 테스트는 mock fixture로 검증합니다. 2026-11-13 사용자 키 입력 후 블로그·지역·트렌드 실연결 HTTP 200을 확인했습니다(PROGRESS.md 참고). 공급자 오류 원문과 인증값은 반환하지 않습니다. Vercel에서는 같은 변수명을 서버 환경변수에 등록하고 재배포합니다. API HUB 키는 Maps 공개 키와 다릅니다.

실연결 재검증은 프로덕션 서버를 3001 포트에서 실행한 뒤 `node scripts/check-naver-live.mjs`로 수행합니다. 이 명령은 세 API를 실제 호출하므로 호출량이 발생합니다. 상태 코드와 개수만 출력합니다.

## 공식 문서
- [공통 인증](https://api.ncloud-docs.com/docs/naver-api-hub-overview)
- [블로그 검색](https://api.ncloud-docs.com/docs/naver-api-hub-search-blog)
- [지역 검색](https://api.ncloud-docs.com/docs/naver-api-hub-search-local)
- [검색어 트렌드](https://api.ncloud-docs.com/docs/naver-api-hub-search-trend)
