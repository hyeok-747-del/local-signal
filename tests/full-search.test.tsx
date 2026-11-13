import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React from 'react';
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost:3000'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,MutationObserver:dom.window.MutationObserver,localStorage:dom.window.localStorage,getComputedStyle:dom.window.getComputedStyle,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
const {default:Dashboard}=await import('../src/components/dashboard.tsx');
test('전체 검색은 오류 전 결과를 유지하고 실패한 페이지부터 재개하며 중복을 제거한다',async()=>{
 const original=globalThis.fetch;const pages:number[]=[];let failed=false;
 globalThis.fetch=async url=>{const text=String(url);if(text.includes('/api/status'))return Response.json({publicData:true});if(text.includes('/api/regions'))return Response.json({items:[]});const page=Number(new URL(text,'http://localhost').searchParams.get('page'));pages.push(page);if(page===2&&!failed){failed=true;return Response.json({error:{message:'테스트 일시 오류'}},{status:504});}const item=(id:number)=>({id:`public-${id}`,name:`전체 검색 업체 ${id}`,category:'카페',province:'서울특별시',district:'',address:'주소',source:'public-data'});return Response.json({items:page===1?[item(1)]:[item(1),item(2)],source:'public-data',providerPage:page,scanned:1000,total:2000,hasMore:page<2,warning:'원본 범위'});};
 try{const view=render(React.createElement(Dashboard));fireEvent.click(view.getByRole('button',{name:'지역 전체 검색'}));await waitFor(()=>assert.ok(view.getByRole('button',{name:'전체 검색 업체 1'})));await waitFor(()=>assert.ok(view.getByText(/테스트 일시 오류/)),{timeout:5000});assert.deepEqual(pages,[1,2]);fireEvent.click(view.getByRole('button',{name:'전체 검색 재개'}));await waitFor(()=>assert.ok(view.getByText('지역 원본 탐색 완료')));assert.deepEqual(pages,[1,2,2]);assert.equal(view.getAllByRole('button',{name:/^전체 검색 업체 \d$/}).length,2);assert.equal((view.getByRole('progressbar') as HTMLProgressElement).value,2000);
 }finally{cleanup();localStorage.clear();globalThis.fetch=original;}
});
