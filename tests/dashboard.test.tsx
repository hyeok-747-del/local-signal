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
