import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hubConfigured,hubCredentials,hubRequest} from '../src/lib/server/naver-hub.ts';
import {searchLocal} from '../src/lib/server/naver-local.ts';
import {searchTrends,validateTrendInput} from '../src/lib/server/naver-trends.ts';
import type {Fetcher} from '../src/lib/server/provider.ts';
const credentials={id:'fixture-id',secret:'fixture-secret'};
const input={startDate:'2026-10-01',endDate:'2026-10-31',timeUnit:'date',keywordGroups:[{groupName:'카페',keywords:['서울 카페']}]};
test('HUB 환경변수 두 개만 사용하고 불완전한 인증은 거부',()=>{
 assert.equal(hubConfigured({NAVER_API_HUB_CLIENT_ID:'fixture-id'}),false);
 assert.throws(()=>hubCredentials({NAVER_API_HUB_CLIENT_ID:'fixture-id'}),{code:'NOT_CONFIGURED'});
 assert.equal(hubConfigured({NAVER_CLIENT_ID:'old-id',NAVER_CLIENT_SECRET:'old-secret'}),false);
 assert.deepEqual(hubCredentials({NAVER_API_HUB_CLIENT_ID:' fixture-id ',NAVER_API_HUB_CLIENT_SECRET:' fixture-secret '}),credentials);
});
test('HUB GET 인증 헤더와 HTTPS 주소 고정, URL과 응답에 Secret 미포함',async()=>{
 const fetcher:Fetcher=async(url,init)=>{const u=new URL(String(url)),headers=new Headers(init?.headers);assert.equal(u.origin,'https://naverapihub.apigw.ntruss.com');assert.equal(u.pathname,'/search/v1/blog');assert.equal(headers.get('X-NCP-APIGW-API-KEY-ID'),credentials.id);assert.equal(headers.get('X-NCP-APIGW-API-KEY'),credentials.secret);assert.equal(headers.get('X-Naver-Client-Secret'),null);assert.equal(headers.get('Content-Type'),null);assert.ok(!u.href.includes(credentials.secret));assert.equal(init?.redirect,'error');assert.equal(init?.cache,'no-store');return Response.json({items:[]});};
 const result=await hubRequest('/search/v1/blog',credentials,{query:{query:'서울 카페',format:'json'}},fetcher);assert.deepEqual(result,{items:[]});
});
test('HUB의 세 가지 오류 응답은 본문/키를 재노출하지 않음',async()=>{
 for(const payload of [{error:{errorCode:'200',details:'fixture-secret'}},{errorCode:'SE02',errorMessage:'fixture-secret'},{errMsg:'fixture-secret',body:'private body'}])await assert.rejects(hubRequest('/search/v1/blog',credentials,{},async()=>Response.json(payload)),error=>{assert.ok(error instanceof Error);assert.ok(!error.message.includes('fixture-secret'));return true;});
});
test('지역 검색은 공식 최대 5개와 start 1 요청, 무제한 페이지를 가장하지 않음',async()=>{
 const result=await searchLocal('서울 카페',credentials,async(url)=>{const u=new URL(String(url));assert.equal(u.pathname,'/search/v1/local');assert.equal(u.searchParams.get('display'),'5');assert.equal(u.searchParams.get('start'),'1');assert.equal(u.searchParams.get('format'),'json');return Response.json({total:1,items:[{title:'<b>테스트</b>',category:'카페',roadAddress:'테스트 주소',link:'javascript:alert(1)',mapx:'127',mapy:'37'}]});});
 assert.equal(result.items[0].name,'테스트');assert.equal(result.items[0].url,'');assert.ok(result.warning.includes('최대 5개'));assert.ok(!JSON.stringify(result).includes('fixture-secret'));
});
test('트렌드 날짜/그룹/선택 필터를 검증하고 알 수 없는 필드는 전달하지 않음',()=>{
 const valid=validateTrendInput({...input,secret:'should-drop'});assert.ok(!('secret' in valid));
 for(const change of [{startDate:'2015-01-01'},{endDate:'2026-02-30'},{endDate:'2026-09-01'},{timeUnit:'year'},{keywordGroups:[]},{keywordGroups:Array(6).fill(input.keywordGroups[0])},{keywordGroups:[{groupName:'카페',keywords:Array(21).fill('서울')}]},{device:'tablet'},{ages:['12']}])assert.throws(()=>validateTrendInput({...input,...change}),{status:400});
});
test('트렌드는 JSON POST와 공통 인증을 사용하며 상대 관심도 그대로 반환',async()=>{
 const validated=validateTrendInput(input);const result=await searchTrends(validated,credentials,async(url,init)=>{assert.equal(new URL(String(url)).pathname,'/search-trend/v1/search');assert.equal(init?.method,'POST');const headers=new Headers(init?.headers);assert.equal(headers.get('Content-Type'),'application/json');assert.equal(headers.get('X-NCP-APIGW-API-KEY'),credentials.secret);assert.deepEqual(JSON.parse(String(init?.body)),validated);return Response.json({...validated,results:[{title:'카페',keywords:['서울 카페'],data:[{period:'2026-10-01',ratio:72.5}]}]});});
 assert.equal(result.results[0].data[0].ratio,72.5);assert.equal(result.metric,'relative-interest');assert.ok(result.warning.includes('실제 검색 횟수'));
 await assert.rejects(searchTrends(validated,credentials,async()=>Response.json({...validated,results:[{title:'카페',keywords:[],data:[{period:'2026-10-01',ratio:101}]}]})),{code:'INVALID_RESPONSE'});
});
