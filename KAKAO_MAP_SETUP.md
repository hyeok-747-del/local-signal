# 카카오맵 연결

지도는 사용자 요청에 따라 네이버 Maps에서 **Kakao Maps Web API**로 교체했습니다. 네이버 API HUB 블로그·지역·트렌드와 공공 상가정보 검색은 그대로 유지합니다.

## 필요한 설정
1. [카카오디벨로퍼스](https://developers.kakao.com/)에서 사용할 앱을 선택하거나 만듭니다.
2. 앱의 **카카오맵 → 사용 설정**에서 상태를 ON으로 설정합니다. 콘솔에서 추가 권한/절차를 요구하면 안내를 따릅니다.
3. **앱 설정 → 앱 → 플랫폼 키**에서 **JavaScript 키**를 확인합니다.
4. 해당 키의 **JavaScript SDK 도메인**에 아래 주소를 등록합니다.
   - `http://localhost:3000`
   - `http://localhost:3001` (검증 서버를 이 포트로 실행할 경우)
   - `https://local-signal-pdh.vercel.app`
5. `.env.local`의 다음 항목에 JavaScript 키를 입력하고 개발 서버를 재시작합니다.

```dotenv
NEXT_PUBLIC_KAKAO_MAP_KEY=
```

이 JavaScript 키는 브라우저 지도 SDK에서 쓰는 공개 식별자이므로 허용 도메인 제한이 필요합니다. **REST API 키·Admin 키·다른 서비스 Secret을 넣지 마세요.** 기존 `fml…` 네이버 Maps ID를 카카오 키로 재사용하지 않습니다. 기존 .env.local의 다른 인증값은 보존합니다.

## Vercel
같은 이름으로 Production 환경변수를 등록한 뒤 재배포합니다. NEXT_PUBLIC_ 변수는 빌드 시 브라우저 코드에 포함되므로 키를 추가/변경한 후 재빌드가 필수입니다. `scripts/sync-vercel-env.mjs`는 새 카카오 공개 변수도 지원합니다. 공개 도메인뿐 아니라 Preview 도메인에서도 사용할 경우 해당 도메인 등록 여부를 확인합니다.

## 동작
- `https://dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false`를 로드하고 `kakao.maps.load` 이후 지도를 생성합니다. 일반 카카오 JavaScript SDK의 로그인/공유 초기화와 별도입니다.
- 실제 공공 데이터 좌표가 있는 업체에 마커를 생성하고, 마커/업체명 클릭과 목록 페이지를 연동합니다.
- 선택 업체 정보와 관심업체 저장/삭제, 지도 크기 변경 시 relayout, 줌 컨트롤을 제공합니다.
- 키 없음/SDK 로드 실패/도메인·권한 문제는 안내합니다. 검색·선택·비교는 계속 작동합니다.
- DEMO는 가상 주소이므로 실제 지도 마커를 만들지 않습니다. 좌표 없는 실제 업체도 임의 위치를 생성하지 않습니다.

## 검증 한계
SDK 모의 테스트는 실제 도메인 승인·지도 타일 표시 검증과 다릅니다. JavaScript 키 입력과 카카오맵 활성화/도메인 등록 후 실제 브라우저에서 지도가 표시되는지 확인해야 합니다.

## 공식 문서
- [사용자가 제공한 일반 JavaScript SDK 가이드](https://developers.kakao.com/docs/ko/javascript/getting-started)
- [카카오맵 이해하기/활성화](https://developers.kakao.com/docs/ko/kakaomap/common)
- [지도 Web API 시작하기](https://apis.map.kakao.com/web/guide/)
- [지도 Web API 레퍼런스](https://apis.map.kakao.com/web/documentation/)
