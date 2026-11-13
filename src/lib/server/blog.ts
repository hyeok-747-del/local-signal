import type {BlogResult} from '../contracts.ts';
import {ServiceError,record,str,type Fetcher} from './provider.ts';
import {hubRequest,type HubCredentials} from './naver-hub.ts';
export function plainText(value:unknown){return str(value).replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:\d+|x[\da-f]+);/gi,entity=>{const known:Record<string,string>={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};if(known[entity])return known[entity];const n=entity.startsWith('&#x')?parseInt(entity.slice(3),16):parseInt(entity.slice(2),10);return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):'';});}
export function safeUrl(value:unknown){try{const url=new URL(str(value));return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}}
export async function searchBlog(input:{name:string;province:string;district:string;category:string;start:number},credentials:HubCredentials,fetcher?:Fetcher):Promise<BlogResult>{
 const query=[input.name,input.province,input.district,input.category].filter(Boolean).join(' ');
 const root=await hubRequest('/search/v1/blog',credentials,{query:{query,display:String(Math.min(50,1001-input.start)),start:String(input.start),sort:'date',format:'json'}},fetcher);
 if(!Array.isArray(root.items)||!Number.isFinite(Number(root.total)))throw new ServiceError('INVALID_RESPONSE','네이버 검색 응답 형식이 올바르지 않습니다.');
 const items=root.items.map(record).map(r=>({title:plainText(r.title),description:plainText(r.description),url:safeUrl(r.link),blogger:plainText(r.bloggername),date:/^\d{8}$/.test(str(r.postdate))?str(r.postdate).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3'):'미확인'})).filter(p=>p.url);
 const next=input.start+root.items.length;
 return {items,query,reportedTotal:Number(root.total),start:input.start,nextStart:root.items.length>0&&next<=Math.min(Number(root.total),1000)?next:null,warning:'검색에서 확인된 게시글입니다. 결과에 타 업체 게시글이 섞일 수 있습니다. 지역·업종을 함께 검색하지만 원문을 확인하세요. 검색 결과 접근 제한(시작 위치 최대 1,000)과 색인 지연으로 전체 게시글 수나 실제 홍보 실적을 확정할 수 없습니다.'};
}
