import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React from 'react';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,MutationObserver:dom.window.MutationObserver,localStorage:dom.window.localStorage,getComputedStyle:dom.window.getComputedStyle,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
const {render,fireEvent,waitFor,cleanup,act}=await import('@testing-library/react');
const {default:Dashboard}=await import('../src/components/dashboard.tsx');
const {default:BlogSearch}=await import('../src/components/blog-search.tsx');
const {default:BusinessMap}=await import('../src/components/business-map.tsx');
const {default:KeywordPanel}=await import('../src/components/keyword-panel.tsx');
const {default:ReportPanel}=await import('../src/components/report-panel.tsx');
const {default:EventPanel}=await import('../src/components/event-panel.tsx');
const originalFetch=globalThis.fetch;
const key='local-insight:favorites:v1';
afterEach(()=>{cleanup();localStorage.clear();globalThis.fetch=originalFetch;});
test('DEMO 검색·전체 페이지 선택·24개 비교·저장·재마운트·삭제',async()=>{
 globalThis.fetch=async()=>Response.json({publicData:false,naverBlog:false,maps:false});
 let view=render(React.createElement(Dashboard));
 fireEvent.click(view.getByLabelText('DEMO 사용'));fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 assert.equal(view.getAllByRole('button',{name:/관심업체 저장$/}).length,8);
 fireEvent.click(view.getByLabelText('검색 결과 전체 선택'));
 fireEvent.click(view.getByRole('button',{name:'선택 비교 (24)'}));
 assert.equal(view.getByRole('dialog').querySelectorAll('tbody tr').length,24);
 fireEvent.keyDown(window,{key:'Escape'});assert.equal(view.queryByRole('dialog'),null);
 fireEvent.click(view.getByRole('button',{name:'[DEMO] 모노 커피 1호점 관심업체 저장'}));
 await waitFor(()=>assert.equal(JSON.parse(localStorage.getItem(key)||'[]').length,1));
 fireEvent.click(view.getByRole('button',{name:'다음 페이지'}));
 assert.ok(view.getByRole('button',{name:'[DEMO] 오후의 테이블 2호점'}));
 view.unmount();view=render(React.createElement(Dashboard));
 fireEvent.click(view.getByRole('button',{name:/^관심 경쟁업체/}));
 assert.ok(view.getByRole('button',{name:'[DEMO] 모노 커피 1호점'}));
 fireEvent.click(view.getByRole('button',{name:'[DEMO] 모노 커피 1호점 관심업체 삭제'}));
 await waitFor(()=>assert.equal(JSON.parse(localStorage.getItem(key)||'[]').length,0));
});
test('키 없는 실제 검색은 오류 안내, DEMO 전환 뒤 실제 응답을 섞지 않음',async()=>{
 globalThis.fetch=async(url)=>String(url).includes('/api/status')?Response.json({publicData:false,naverBlog:false,maps:false}):Response.json({error:{code:'NOT_CONFIGURED',message:'공공 상가정보 API 키가 설정되지 않았습니다.'}},{status:503});
 const view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 await waitFor(()=>assert.ok(view.getByRole('status').textContent?.includes('API 키가 설정되지 않았습니다')));
 fireEvent.click(view.getByLabelText('DEMO 사용'));assert.equal(view.queryByRole('status'),null);
 fireEvent.click(view.getByRole('button',{name:'업체 검색'}));assert.ok(view.getByRole('button',{name:'[DEMO] 모노 커피 1호점'}));
});
test('실제 원본 페이지 추가시 업체/선택 유지 및 최초 검색 조건 유지',async()=>{
 const calls:string[]=[];
 globalThis.fetch=async(url)=>{const text=String(url);calls.push(text);if(text.includes('/api/status'))return Response.json({publicData:true,naverBlog:true,maps:false});if(text.includes('/api/regions'))return Response.json({items:[{code:'11440',name:'마포구'}]});const page=Number(new URL(text,'http://localhost').searchParams.get('page'));return Response.json({items:[{id:`public-${page}`,name:`테스트 실제응답 ${page}`,category:'카페',province:'서울특별시',district:'마포구',address:'테스트 주소',source:'public-data'}],source:'public-data',providerPage:page,scanned:1000,total:2000,hasMore:page<2,warning:'테스트 원본'});};
 const view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 await waitFor(()=>assert.ok(view.getByRole('button',{name:'테스트 실제응답 1'})));
 fireEvent.click(view.getByLabelText('테스트 실제응답 1 선택'));
 fireEvent.change(view.getByPlaceholderText('카페, 파티룸, 케이터링 등'),{target:{value:'다른 검색어'}});
 fireEvent.click(view.getByRole('button',{name:'다음 원본 1,000건 불러오기'}));
 await waitFor(()=>assert.ok(view.getByRole('button',{name:'테스트 실제응답 2'})));
 assert.ok((view.getByLabelText('테스트 실제응답 1 선택') as HTMLInputElement).checked);
 const last=calls.filter(u=>u.includes('/api/businesses')).at(-1)!;assert.equal(new URL(last,'http://localhost').searchParams.get('keyword'),'');
 assert.ok(view.getByText('지역 원본 탐색 완료'));
});
test('블로그 업체 선택·검색·원문 링크·게시글 더 보기',async()=>{
 globalThis.fetch=async(url)=>{const start=new URL(String(url),'http://localhost').searchParams.get('start');return Response.json({items:[{title:`테스트 글 ${start}`,description:'요약문',url:`https://blog.naver.com/fixture/${start}`,blogger:'블로그명',date:'2026-11-13'}],query:'서울 테스트 카페',reportedTotal:2,start:Number(start),nextStart:start==='1'?2:null,warning:'오매칭 및 색인 지연 주의'});};
 const view=render(React.createElement(BlogSearch,{businesses:[{id:'public-1',name:'테스트 업체',category:'카페',province:'서울특별시',district:'마포구',address:'테스트 주소',source:'public-data'}]}));
 fireEvent.change(view.getByRole('combobox'),{target:{value:'public-1'}});fireEvent.click(view.getByRole('button',{name:'블로그 검색'}));
 await waitFor(()=>assert.equal(view.getByRole('link',{name:'테스트 글 1'}).getAttribute('rel'),'noopener noreferrer'));
 fireEvent.click(view.getByRole('button',{name:'다음 게시글 불러오기'}));await waitFor(()=>assert.ok(view.getByRole('link',{name:'테스트 글 2'})));
 assert.ok(view.getByText('검색에서 확인된 게시글 수: 2건'));assert.equal(view.queryByRole('button',{name:'다음 게시글 불러오기'}),null);
});
test('늦게 도착한 실제 API 응답이 DEMO 결과를 덮어쓰지 않음',async()=>{
 let resolveResponse:((response:Response)=>void)|undefined;
 globalThis.fetch=async(url)=>String(url).includes('/api/status')?Response.json({publicData:false,naverBlog:false,maps:false}):new Promise<Response>(resolve=>{resolveResponse=resolve;});
 const view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 fireEvent.click(view.getByLabelText('DEMO 사용'));fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 await act(async()=>{resolveResponse!(Response.json({items:[],source:'public-data',providerPage:1,scanned:0,total:0,hasMore:false,warning:'테스트'}));});
 assert.ok(view.getByRole('button',{name:'[DEMO] 모노 커피 1호점'}));assert.equal(view.queryByText('지역 원본 탐색 완료'),null);
});
test('지도 SDK mock: 실제 좌표 마커·클릭 정보·관심 저장 및 정리',async()=>{
 const previousKey=process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID='test-public-key';
 const clicks:(()=>void)[]=[];let markerCount=0,removed=0,destroyed=0,focused='',saved='';
 const api={Map:class{panTo(){}fitBounds(){}destroy(){destroyed++;}},LatLng:class{constructor(public lat:number,public lng:number){}},LatLngBounds:class{extend(){}},Marker:class{constructor(){markerCount++;}setMap(){removed++;}},Event:{addListener:(_target:object,_event:string,callback:()=>void)=>{clicks.push(callback);return {};},removeListener:()=>{},trigger:()=>{}}};
 window.naver={maps:api};Object.defineProperty(globalThis,'ResizeObserver',{configurable:true,value:class{observe(){}disconnect(){}}});
 const actual={id:'public-map',name:'테스트 지도 업체',category:'카페',province:'서울특별시',district:'마포구',address:'테스트 주소',latitude:37.55,longitude:126.92,source:'public-data' as const};
 try{
  const view=render(React.createElement(BusinessMap,{items:[actual,{...actual,id:'public-no-location',latitude:undefined,longitude:undefined}],focused:actual.id,onFocus:id=>{focused=id;},onSave:b=>{saved=b.id;},favorites:[],demo:false}));
  await waitFor(()=>assert.equal(markerCount,1));clicks[0]();assert.equal(focused,actual.id);
  fireEvent.click(view.getByRole('button',{name:'관심업체 추가'}));assert.equal(saved,actual.id);view.unmount();assert.equal(destroyed,1);assert.equal(removed,1);
 }finally{delete window.naver;if(previousKey===undefined)delete process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;else process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=previousKey;}
});
test('같은 검색을 반복하면 새 업체만 신규 발견, 최초 발견일과 브라우저 기록 유지',async()=>{
 let round=0;
 const business=(id:string)=>({id,name:id==='public-1'?'기존 업체':'새로 발견한 업체',category:'카페',province:'서울특별시',district:'마포구',address:'테스트 주소',source:'public-data'});
 globalThis.fetch=async(url)=>{if(String(url).includes('/api/status'))return Response.json({publicData:false,naverBlog:true,maps:false});round++;return Response.json({items:round===1?[business('public-1')]:[business('public-1'),business('public-2')],source:'public-data',providerPage:1,scanned:2,total:2,hasMore:false,warning:'테스트'});};
 const view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 await waitFor(()=>assert.ok(view.getByText('첫 검색 · 비교 기준 기록 중')));
 const first=JSON.parse(localStorage.getItem('local-insight:discoveries:v1')||'{}').firstSeen['public-1'];
 fireEvent.click(view.getByRole('button',{name:'업체 검색'}));await waitFor(()=>assert.ok(view.getByText('이전 검색 대비 신규 발견 1개')));
 assert.equal(view.getAllByText('신규 발견').length,1);assert.ok(view.getByText(/신규 발견은 실제 신규 개업을 뜻하지 않습니다/));
 assert.equal(JSON.parse(localStorage.getItem('local-insight:discoveries:v1')||'{}').firstSeen['public-1'],first);
});
test('손상된 발견 기록은 실제 업체 검색 후에도 덮어쓰지 않음',async()=>{
 localStorage.setItem('local-insight:discoveries:v1','{broken');
 globalThis.fetch=async(url)=>String(url).includes('/api/status')?Response.json({publicData:false,naverBlog:true,maps:false}):Response.json({items:[],source:'public-data',providerPage:1,scanned:0,total:0,hasMore:false,warning:'테스트'});
 const view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 await waitFor(()=>assert.ok(view.getByRole('status').textContent?.includes('기존 기록은 보존')));assert.equal(localStorage.getItem('local-insight:discoveries:v1'),'{broken');
});
test('블로그 복수 비교의 부분 실패를 표시하고 분류 근거/필터/미분석 상태 제공',async()=>{
 const businesses=[1,2].map(i=>({id:`public-${i}`,name:`비교 업체 ${i}`,category:'카페',province:'서울특별시',district:'마포구',address:'테스트 주소',source:'public-data' as const}));
 globalThis.fetch=async(url)=>{const name=new URL(String(url),'http://localhost').searchParams.get('name');if(name==='비교 업체 2')return Response.json({error:{message:'테스트 인증 실패'}},{status:502});return Response.json({items:[{title:'#협찬 카페 방문',description:'식사를 제공받아 작성',url:'https://example.com/sponsored',blogger:'테스트',date:'2026-11-13'},{title:'평범한 후기',description:'일상',url:'https://example.com/unknown',blogger:'테스트',date:'2026-11-12'}],query:'테스트',reportedTotal:2,start:1,nextStart:null,warning:'검색 표본'});};
 const view=render(React.createElement(BlogSearch,{businesses}));fireEvent.change(view.getByRole('combobox'),{target:{value:'public-1'}});fireEvent.click(view.getByRole('button',{name:'블로그 검색'}));
 await waitFor(()=>assert.ok(view.getByRole('link',{name:'#협찬 카페 방문'})));
 fireEvent.click(view.getByRole('button',{name:'판단 불가 1'}));assert.equal(view.queryByRole('link',{name:'#협찬 카페 방문'}),null);assert.ok(view.getByRole('link',{name:'평범한 후기'}));
 fireEvent.click(view.getByRole('button',{name:/^전체$/}));assert.ok(view.getByText(/근거: #협찬/));
 fireEvent.click(view.getByLabelText('분석 업체 전체 선택'));fireEvent.click(view.getByRole('button',{name:'선택 업체 비교 조회'}));
 await waitFor(()=>assert.ok(view.getByRole('alert').textContent?.includes('비교 업체 2: 테스트 인증 실패')),{timeout:5000});
 assert.ok(view.getByText('미분석'));assert.ok(view.getByRole('img',{name:/선그래프/}));assert.ok(view.getByText('비교 조회 완료 · 각 업체의 최신 검색 50건부터 분석합니다.'));
});
test('리뷰 직접 입력·브라우저 복원·삭제 및 CSV 업로드 동작',async()=>{
 globalThis.fetch=async()=>Response.json({configured:false,modelConfigured:false,publicData:false,naverBlog:true,maps:false});
 let view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'리뷰 분석'}));
 fireEvent.change(view.getByLabelText('리뷰 대상 업체명'),{target:{value:'직접 입력 업체'}});fireEvent.change(view.getByLabelText('리뷰 본문'),{target:{value:'친절하고 맛있어요'}});fireEvent.click(view.getByRole('button',{name:'리뷰 추가'}));
 await waitFor(()=>assert.equal(JSON.parse(localStorage.getItem('local-insight:reviews:v1')||'[]').length,1));assert.ok((view.getByRole('button',{name:'선택 리뷰 AI 요약'}) as HTMLButtonElement).disabled);
 view.unmount();view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'리뷰 분석'}));assert.ok(view.getByText('친절하고 맛있어요'));
 const file=new dom.window.File(['업체명,리뷰\nCSV 업체,비싸고 불편해요'],'reviews.csv',{type:'text/csv'});Object.defineProperty(file,'text',{value:async()=>'업체명,리뷰\nCSV 업체,비싸고 불편해요'});fireEvent.change(view.getByLabelText('리뷰 CSV 파일'),{target:{files:[file]}});
 await waitFor(()=>assert.equal(JSON.parse(localStorage.getItem('local-insight:reviews:v1')||'[]').length,2));fireEvent.click(view.getAllByRole('button',{name:'리뷰 삭제'})[0]);assert.equal(JSON.parse(localStorage.getItem('local-insight:reviews:v1')||'[]').length,1);
});
test('키워드 저장·트렌드 조회는 실제 응답 표시, 상대 관심도 의미 유지',async()=>{
 let result:unknown=null;globalThis.fetch=async(_url,init)=>{const input=JSON.parse(String(init?.body));assert.equal(input.keywordGroups[0].groupName,'카페');return Response.json({source:'naver-api-hub',startDate:'2026-11-01',endDate:'2026-11-07',timeUnit:'date',metric:'relative-interest',warning:'실제 검색 횟수가 아닙니다.',results:[{title:'카페',keywords:['서울 카페'],data:[{period:'2026-11-01',ratio:50}]}]});};
 const view=render(React.createElement(KeywordPanel,{province:'서울특별시',district:'',data:null,onResult:value=>{result=value;}}));fireEvent.change(view.getByLabelText('비교 키워드 (한 줄당 주제어=검색어1,검색어2)'),{target:{value:'카페=서울 카페'}});fireEvent.click(view.getByRole('button',{name:'관련 키워드 저장'}));assert.ok(localStorage.getItem('local-insight:keywords:v1')?.includes('서울 카페'));fireEvent.click(view.getByRole('button',{name:'관심도 비교 조회'}));await waitFor(()=>assert.ok(result));
});
test('키 없는 기본 보고서와 이벤트 미확인 상태는 정상 표시',async()=>{
 globalThis.fetch=async()=>Response.json({configured:false,modelConfigured:false});
 const view=render(React.createElement(ReportPanel,{businesses:[],entries:{},history:{firstSeen:{},scopes:{}},reviews:[],trend:null}));assert.ok(view.getByRole('heading',{name:'주간 마케팅 보고서'}));fireEvent.change(view.getByLabelText('보고서 유형'),{target:{value:'월간'}});assert.ok(view.getByRole('heading',{name:'월간 마케팅 보고서'}));await waitFor(()=>assert.ok((view.getByRole('button',{name:'AI 마케팅 개선 제안'}) as HTMLButtonElement).disabled));view.unmount();
 const business={id:'public-event',name:'테스트 이벤트 업체',category:'카페',province:'서울특별시',district:'마포구',address:'테스트',source:'public-data' as const};const event=render(React.createElement(EventPanel,{businesses:[business],entries:{'public-event':{businessId:'public-event',fetchedAt:'2026-11-13T00:00:00Z',data:{items:[{title:'이벤트 안내',description:'혜택을 확인하세요',date:'2026-11-13',url:'https://example.com/event',blogger:'테스트'}],query:'테스트',reportedTotal:1,start:1,nextStart:null,warning:'표본'}}}}));assert.ok(event.getByText('기간: 미확인'));assert.ok(event.getByText('혜택: 미확인'));assert.equal(event.getByRole('link',{name:/출처 원문/}).getAttribute('href'),'https://example.com/event');
});
test('공공 검색 상세 조건을 서버에 전달하고 빈 결과의 원인을 표시',async()=>{
 let requested:URL|null=null;globalThis.fetch=async(url)=>{if(String(url).includes('/api/status'))return Response.json({publicData:false,naverBlog:true,maps:false});requested=new URL(String(url),'http://localhost');return Response.json({items:[],source:'public-data',providerPage:1,scanned:1000,total:5000,hasMore:true,emptyReason:'NO_MATCH_IN_PAGE',warning:'서버 필터링'});};
 const view=render(React.createElement(Dashboard));fireEvent.click(view.getByText('업체명·주소·업종 상세 검색'));fireEvent.change(view.getByLabelText('업체명'),{target:{value:'테스트 업체'}});fireEvent.change(view.getByLabelText('주소 검색'),{target:{value:'테헤란로'}});fireEvent.change(view.getByLabelText('업종 검색'),{target:{value:'카페'}});fireEvent.click(view.getByRole('button',{name:'업체 검색'}));
 await waitFor(()=>assert.ok(view.getByText('현재 원본 페이지에 조건 일치 업체가 없습니다')));assert.equal(requested!.searchParams.get('name'),'테스트 업체');assert.equal(requested!.searchParams.get('address'),'테헤란로');assert.equal(requested!.searchParams.get('category'),'카페');assert.ok(view.getByRole('button',{name:'다음 원본 1,000건 불러오기'}));
});
