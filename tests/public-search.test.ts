import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {GET} from '../src/app/api/businesses/route.ts';
import {searchPublic} from '../src/lib/server/public-data.ts';
import {matchesSearch} from '../src/lib/search-filters.ts';
import {scopeKey} from '../src/lib/discoveries.ts';
import {publicDataValue} from '../src/lib/server/public-data-key.ts';
const row={bizesId:'fixture',bizesNm:'테스트 커피',brchNm:'마포점',rdnmAdr:'서울특별시 마포구 테스트로 1',indsSclsNm:'카페',ctprvnNm:'서울특별시',signguNm:'마포구',stdrYm:'202609'};
const fetchOriginal=globalThis.fetch,keyOriginal=process.env.PUBLIC_DATA_API_KEY;
afterEach(()=>{globalThis.fetch=fetchOriginal;if(keyOriginal===undefined)delete process.env.PUBLIC_DATA_API_KEY;else process.env.PUBLIC_DATA_API_KEY=keyOriginal;});
const payload=(items:unknown[],totalCount=items.length)=>({header:{resultCode:'00'},body:{items,totalCount}});
test('공공 상가 경로/필수 파라미터/인코딩을 공식 문서대로 요청하고 키를 반환하지 않음',async()=>{
 process.env.PUBLIC_DATA_API_KEY='fixture+key/=';let count=0;
 globalThis.fetch=async(url)=>{count++;const u=new URL(String(url));assert.equal(u.origin,'https://apis.data.go.kr');assert.equal(u.pathname,'/B553077/api/open/sdsc2/storeListInDong');assert.equal(u.searchParams.get('ServiceKey'),'fixture+key/=');assert.equal(u.searchParams.get('type'),'json');assert.equal(u.searchParams.get('divId'),'ctprvnCd');assert.equal(u.searchParams.get('key'),'11');assert.equal(u.searchParams.get('numOfRows'),'1000');assert.equal(u.searchParams.get('pageNo'),'1');assert.equal(u.searchParams.get('name'),null);return Response.json(payload([row],2000));};
 const response=await GET(new Request(`http://localhost/api/businesses?${new URLSearchParams({province:'서울특별시',name:'테스트',address:'마포구',category:'카페',keyword:'서울'})}`));assert.equal(response.status,200);const data=await response.json();assert.equal(data.items.length,1);assert.equal(data.hasMore,true);assert.equal(data.emptyReason,null);assert.equal(data.dataPeriod,'202609');assert.equal(count,1);assert.ok(!JSON.stringify(data).includes('fixture+key'));
});
test('업체명/주소/업종/통합 키워드는 각각 대응 필드에서 모두 만족해야 함',()=>{
 const b={id:'public-1',name:'테스트 커피 마포점',address:'서울특별시 마포구 테스트로',category:'카페',province:'서울특별시',district:'마포구'};
 assert.equal(matchesSearch(b,{keyword:'서울 카페',name:'테스트',address:'마포구',category:'카페'}),true);assert.equal(matchesSearch(b,{keyword:'',name:'테스트로'}),false);assert.equal(matchesSearch(b,{keyword:'',address:'커피'}),false);assert.equal(matchesSearch(b,{keyword:'',category:'파티룸'}),false);
});
test('지역 원본 없음과 현재 페이지 조건 불일치, 빈 페이지를 구분',async()=>{
 const input={province:'서울특별시',district:'',keyword:'케이터링',page:1};
 assert.equal((await searchPublic(input,'fake',async()=>Response.json(payload([],0)))).emptyReason,'NO_REGIONAL_DATA');
 const noMatch=await searchPublic(input,'fake',async()=>Response.json(payload([row],5000)));assert.equal(noMatch.emptyReason,'NO_MATCH_IN_PAGE');assert.equal(noMatch.items.length,0);assert.equal(noMatch.hasMore,true);
 assert.equal((await searchPublic(input,'fake',async()=>Response.json(payload([],100)))).emptyReason,'EMPTY_PAGE');
 await assert.rejects(searchPublic(input,'fake',async()=>Response.json(payload([{wrong:'schema'}],100))),{code:'INVALID_RESPONSE'});
});
test('키 없음은 외부 호출 없이 503, 인증과 한도 오류도 별도 코드',async()=>{
 delete process.env.PUBLIC_DATA_API_KEY;globalThis.fetch=async()=>{throw new Error('must not call');};const request=()=>new Request(`http://localhost/api/businesses?province=${encodeURIComponent('서울특별시')}`);
 let response=await GET(request());assert.equal(response.status,503);assert.equal((await response.json()).error.code,'NOT_CONFIGURED');
 process.env.PUBLIC_DATA_API_KEY='fixture-secret';globalThis.fetch=async()=>new Response('',{status:403});response=await GET(request());assert.equal((await response.json()).error.code,'INVALID_CREDENTIALS');
 globalThis.fetch=async()=>new Response('',{status:429});response=await GET(request());assert.equal(response.status,429);assert.equal((await response.json()).error.code,'RATE_LIMITED');
});
test('신규 발견 기록은 상세 검색 조건도 범위에 포함하고 기존 범위 키 유지',()=>{const base={province:'서울특별시',district:'',keyword:'카페'};assert.equal(scopeKey(base),JSON.stringify(['서울특별시','','카페']));assert.notEqual(scopeKey(base),scopeKey({...base,name:'테스트'}));assert.notEqual(scopeKey({...base,name:'테스트'}),scopeKey({...base,address:'테스트'}));});
test('Vercel 서버 Secret 별칭과 기존 로컬 변수 모두 지원',()=>{assert.equal(publicDataValue({PUBLIC_DATA_API_KEY:' local-key '}),'local-key');assert.equal(publicDataValue({PUBLIC_DATA_API_KEY:'old-key',DATA_API_KEY:' cloud-key '}),'cloud-key');assert.equal(publicDataValue({}),'');});
