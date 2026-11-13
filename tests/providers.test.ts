import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getDistricts,normalizeBusiness,searchPublic} from '../src/lib/server/public-data.ts';
import {plainText,safeUrl,searchBlog} from '../src/lib/server/blog.ts';
import {ServiceError,integer,publicUrl,upstream,publicEnvelope,type Fetcher} from '../src/lib/server/provider.ts';
import {failure,required,rateLimit} from '../src/lib/server/http.ts';

// 테스트 fixture이며 실제 수집 데이터가 아닙니다. 사용자 화면에 주입하지 않습니다.
const fixture={bizesId:'fixture-1',bizesNm:'테스트 커피',brchNm:'테스트점',indsSclsNm:'카페',ctprvnCd:'11',ctprvnNm:'서울특별시',signguCd:'11440',signguNm:'마포구',rdnmAdr:'서울특별시 마포구 테스트로',lat:'37.55',lon:'126.92'};
function responder(data:unknown,status=200):Fetcher{return async()=>new Response(JSON.stringify(data),{status});}
function envelope(items:unknown,totalCount=1){return {header:{resultCode:'00'},body:{items,totalCount}};}
test('공공 API 업체 필드와 좌표 정규화, 결측 좌표는 생성하지 않음',()=>{
 const actual=normalizeBusiness(fixture)!;assert.equal(actual.name,'테스트 커피 테스트점');assert.equal(actual.source,'public-data');assert.equal(actual.latitude,37.55);assert.equal(normalizeBusiness({...fixture,lat:'',lon:''})?.latitude,undefined);assert.equal(normalizeBusiness({}),null);
});
test('시도 전체 요청 및 복수 키워드 검색, 원본 페이지 계속 탐색',async()=>{
 let called='';const fetcher:Fetcher=async(url)=>{called=String(url);return new Response(JSON.stringify(envelope([fixture],2500)));};
 const data=await searchPublic({province:'서울특별시',district:'',keyword:'서울 카페',page:2},'fake-key',fetcher);
 const params=new URL(called).searchParams;assert.equal(params.get('divId'),'ctprvnCd');assert.equal(params.get('key'),'11');assert.equal(params.get('pageNo'),'2');assert.equal(data.items.length,1);assert.equal(data.hasMore,true);assert.equal(data.scanned,1);
 const empty=await searchPublic({province:'서울특별시',district:'',keyword:'파티룸',page:3},'fake-key',fetcher);assert.equal(empty.items.length,0);assert.equal(empty.hasMore,false);
});
test('공식 시군구 코드로 범위 지정, 타 시도와 잘못된 지역 거부',async()=>{
 const calls:URL[]=[];const fetcher:Fetcher=async(url)=>{const u=new URL(String(url));calls.push(u);return new Response(JSON.stringify(u.pathname.endsWith('/baroApi')?envelope([{ctprvnCd:'11',signguCd:'11440',signguNm:'마포구'},{ctprvnCd:'26',signguCd:'26110',signguNm:'중구'}]):envelope([fixture])));};
 assert.deepEqual(await getDistricts('서울특별시','fake',fetcher),[{code:'11440',name:'마포구'}]);
 await searchPublic({province:'서울특별시',district:'마포구',keyword:'',page:1},'fake',fetcher);assert.equal(calls.at(-1)!.searchParams.get('divId'),'signguCd');assert.equal(calls.at(-1)!.searchParams.get('key'),'11440');
 await assert.rejects(searchPublic({province:'서울특별시',district:'없는구',keyword:'',page:1},'fake',fetcher),{code:'INVALID_REGION'});
 await assert.rejects(getDistricts('미지원시','fake',fetcher),{status:400});
});
test('빈 응답과 중첩 응답 처리, 손상 형식 및 제공기관 오류 거부',()=>{
 assert.deepEqual(publicEnvelope(envelope([])).items,[]);assert.equal(publicEnvelope({response:envelope({item:[fixture]})}).items.length,1);
 assert.throws(()=>publicEnvelope({}),{code:'INVALID_RESPONSE'});assert.throws(()=>publicEnvelope({header:{resultCode:'30'},body:{items:[]}}),{code:'INVALID_CREDENTIALS'});
});
test('인증키 인코딩을 한 번만 수행하고 임의 호스트를 허용하지 않음',()=>{
 const a=publicUrl('storeListInDong','a%2Bb%2Fc%3D',{key:'11'});assert.equal(a.hostname,'apis.data.go.kr');assert.equal(a.searchParams.get('ServiceKey'),'a+b/c=');assert.ok(!a.href.includes('%252B'));
});
test('인증 실패/한도/네트워크/비JSON 오류를 안전한 메시지로 처리',async()=>{
 await assert.rejects(upstream(new URL('https://example.com'),{},responder({},403)),{code:'INVALID_CREDENTIALS'});
 await assert.rejects(upstream(new URL('https://example.com'),{},responder({},429)),{status:429});
 await assert.rejects(upstream(new URL('https://example.com'),{},async()=>{throw new Error('SECRET_URL=must-not-leak');}),{code:'NETWORK_ERROR'});
 await assert.rejects(upstream(new URL('https://example.com'),{},async()=>new Response('<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>')),{code:'INVALID_CREDENTIALS'});
 await assert.rejects(upstream(new URL('https://example.com'),{},async()=>new Response('not json')),{code:'INVALID_RESPONSE'});
 const response=failure(new Error('SECRET_URL=must-not-leak'));assert.equal(response.status,500);assert.ok(!(await response.text()).includes('SECRET'));
});
test('네이버 검색에 지역/업종을 포함하고 인증 헤더는 서버에서만 보냄',async()=>{
 let headers:HeadersInit|undefined;let called='';const fetcher:Fetcher=async(url,init)=>{called=String(url);headers=init?.headers;return new Response(JSON.stringify({total:2000,items:[{title:'<b>테스트</b> &amp; 카페',description:'후기',link:'https://blog.naver.com/fixture/1',bloggername:'테스트 블로그',postdate:'20261113'},{title:'차단',link:'javascript:alert(1)'}]}));};
 const data=await searchBlog({name:'테스트',province:'서울특별시',district:'마포구',category:'카페',start:951},{id:'fake-id',secret:'fake-secret'},fetcher);
 assert.ok(new URL(called).searchParams.get('query')?.includes('마포구 카페'));assert.equal(new Headers(headers).get('X-NCP-APIGW-API-KEY'),'fake-secret');assert.equal(data.items.length,1);assert.equal(data.items[0].title,'테스트 & 카페');assert.equal(data.items[0].date,'2026-11-13');assert.ok(!JSON.stringify(data).includes('fake-secret'));assert.ok(data.warning.includes('1,000'));
});
test('링크 및 HTML 안전 처리와 블로그 결과 끝 페이지',async()=>{
 assert.equal(safeUrl('data:text/html,hello'),'');assert.equal(safeUrl('https://user:password@example.com'),'');assert.equal(plainText('<img src=x>text &#128512;'),'text 😀');
 const data=await searchBlog({name:'테스트',province:'서울특별시',district:'',category:'',start:1},{id:'fake',secret:'fake'},responder({total:0,items:[]}));assert.equal(data.nextStart,null);assert.equal(data.items.length,0);
});
test('환경변수 미설정, 페이지 검증, 로컬 요청 제한',()=>{
 assert.throws(()=>required('','공공'),{status:503});assert.equal(integer(null,1,1000),1);for(const value of ['-1','1.5','1001','abc'])assert.throws(()=>integer(value,1,1000),{status:400});
 const req=new Request('http://localhost/api/test',{headers:{'x-forwarded-for':'fixture-ip'}});for(let i=0;i<30;i++)rateLimit(req);assert.throws(()=>rateLimit(req),{status:429});
 assert.ok(new ServiceError('TEST','안내') instanceof Error);
});
