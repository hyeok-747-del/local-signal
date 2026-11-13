import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBlog,classifyDisclosure,seoulDay,dayOffset} from '../src/lib/blog-analysis.ts';
import {emptyHistory,readHistory,recordDiscoveries,scopeKey} from '../src/lib/discoveries.ts';
import type {BlogPost,BlogResult} from '../src/lib/contracts.ts';
import type {Business} from '../src/lib/business.ts';
const now=new Date('2026-11-13T01:00:00Z');
function post(date:string,i=0):BlogPost{return {title:'테스트 게시글',description:'테스트 요약',url:`https://example.com/${date}/${i}`,blogger:'테스트',date};}
function result(items:BlogPost[],extra:Partial<BlogResult>={}):BlogResult{return {items,query:'테스트',reportedTotal:items.length,start:1,nextStart:null,warning:'테스트',...extra};}
test('한국시간 자정과 월/연도 경계, 월요일 기준 이번 주 계산',()=>{
 assert.equal(seoulDay(new Date('2026-11-12T15:00:00Z')),'2026-11-13');assert.equal(seoulDay(new Date('2026-11-12T14:59:59Z')),'2026-11-12');assert.equal(dayOffset('2027-01-01',-1),'2026-12-31');
 const s=analyzeBlog(result([post('2026-11-13'),post('2026-11-09'),post('2026-11-08'),post('2026-11-01'),post('2026-10-31')]),now);
 assert.equal(s.todayCount,1);assert.equal(s.weekStart,'2026-11-09');assert.equal(s.weekCount,2);assert.equal(s.monthCount,4);assert.equal(s.recent,3);assert.equal(s.previous,2);assert.equal(s.daily.length,14);
});
test('검색 URL 중복·미확인 날짜·미래 게시글은 통계에서 올바르게 처리',()=>{
 const p=post('2026-11-13'),s=analyzeBlog(result([p,p,post('미확인'),post('2026-02-30'),post('2026-11-14')]),now);
 assert.equal(s.total,4);assert.equal(s.todayCount,1);assert.equal(s.unknownDates,2);assert.equal(s.covered,false);assert.equal(s.growth,null);assert.equal(s.signal,'표본 미완료');
});
test('최근/이전 7일 경계와 증가율·급증 임계값·이전 0건',()=>{
 const items=[...Array.from({length:6},(_,i)=>post('2026-11-13',i)),post('2026-11-06'),post('2026-10-31')];
 const s=analyzeBlog(result(items),now);assert.equal(s.recent,6);assert.equal(s.previous,2);assert.equal(s.growth,200);assert.equal(s.signal,'급증 신호');
 const fresh=analyzeBlog(result([post('2026-11-13')]),now);assert.equal(fresh.growth,null);assert.equal(fresh.signal,'활동 새로 확인');
 const decline=analyzeBlog(result([post('2026-11-01'),post('2026-11-02')]),now);assert.equal(decline.growth,-100);assert.equal(decline.signal,'감소 신호');
 const small=analyzeBlog(result([post('2026-11-13'),post('2026-11-12'),post('2026-11-06')]),now);assert.equal(small.signal,'증가 신호');
});
test('제한된 검색 표본은 증가율 보류, 14일 경계까지 조회하면 판단 가능',()=>{
 const partial=analyzeBlog(result([post('2026-11-13')],{reportedTotal:500,nextStart:51}),now);assert.equal(partial.covered,false);assert.equal(partial.signal,'표본 미완료');
 const bounded=analyzeBlog(result([post('2026-11-13'),post('2026-10-31')],{reportedTotal:5000,nextStart:101}),now);assert.equal(bounded.covered,true);
 const capped=analyzeBlog(result([post('2026-11-13')],{reportedTotal:5000,nextStart:null}),now);assert.equal(capped.covered,false);
});
test('명시 표현 분류와 근거, 부정·상충·모집·불충분은 판단 불가',()=>{
 for(const [title,label] of [['#협찬 카페 방문','협찬 명시'],['식사를 제공받아 작성','협찬 명시'],['체험단으로 참여했어요','체험단 명시'],['내돈내산 카페 방문','내돈내산 명시'],['카페 후기','판단 불가'],['협찬 없이 내돈내산','판단 불가'],['#협찬 #내돈내산','판단 불가'],['체험단 후기 모집 안내','판단 불가']]){const c=classifyDisclosure({title,description:''});assert.equal(c.label,label,title);assert.equal(c.method,'키워드 기반');}
});
const scope={province:'서울특별시',district:'마포구',keyword:' 카페  '};
function business(id:string):Business{return {id,name:'테스트',category:'카페',province:'서울특별시',district:'마포구',address:'테스트 주소',source:'public-data'};}
test('첫 검색은 기준선, 다음 검색 신규 발견 및 최초 발견일 보존',()=>{
 const first=recordDiscoveries(emptyHistory(),scope,[business('public-1')],null,now);assert.deepEqual(first.newIds,[]);assert.equal(first.baseline,true);
 const second=recordDiscoveries(first.history,scope,[business('public-1'),business('public-2')],['public-1'],new Date('2026-11-14T01:00:00Z'));assert.deepEqual(second.newIds,['public-2']);assert.equal(second.history.firstSeen['public-1'],now.toISOString());assert.ok(second.history.firstSeen['public-2']);
 assert.deepEqual(readHistory(JSON.stringify(second.history)),second.history);
});
test('추가 페이지/부분 검색에서 과거 관측 ID 보존 및 DEMO 제외',()=>{
 const first=recordDiscoveries(emptyHistory(),scope,[business('public-1'),business('public-2')],null,now);
 const partial=recordDiscoveries(first.history,scope,[business('public-1')],['public-1','public-2'],now);assert.equal(partial.history.scopes[scopeKey(scope)].length,2);
 const repeated=recordDiscoveries(partial.history,scope,[business('public-2'),{...business('demo-1'),source:'demo'}],partial.history.scopes[scopeKey(scope)],now);assert.deepEqual(repeated.newIds,[]);assert.equal(repeated.history.firstSeen['demo-1'],undefined);
 assert.equal(scopeKey(scope),scopeKey({...scope,keyword:'카페'}));assert.notEqual(scopeKey(scope),scopeKey({...scope,district:''}));assert.throws(()=>readHistory('{broken'));
});
