import {required} from './http.ts';
import {record,ServiceError,upstream,type Fetcher} from './provider.ts';

export type HubCredentials = {id:string;secret:string};
// Next.js loads .env.local into process.env. Read only inside server request handlers.
export function hubCredentials(env:Record<string,string|undefined>=process.env):HubCredentials {
 return {id:required(env.NAVER_API_HUB_CLIENT_ID,'NAVER API HUB Client ID'),secret:required(env.NAVER_API_HUB_CLIENT_SECRET,'NAVER API HUB Client Secret')};
}
export function hubConfigured(env:Record<string,string|undefined>=process.env){return !!(env.NAVER_API_HUB_CLIENT_ID?.trim()&&env.NAVER_API_HUB_CLIENT_SECRET?.trim());}

export async function hubRequest(path:'/search/v1/blog'|'/search/v1/local'|'/search-trend/v1/search',credentials:HubCredentials,options:{query?:Record<string,string>;body?:unknown}={},fetcher?:Fetcher){
 const url=new URL(path,'https://naverapihub.apigw.ntruss.com');
 if(options.query)url.search=new URLSearchParams(options.query).toString();
 const headers:Record<string,string>={'X-NCP-APIGW-API-KEY-ID':credentials.id,'X-NCP-APIGW-API-KEY':credentials.secret};
 const init:RequestInit={headers,redirect:'error'};
 if(options.body!==undefined){headers['Content-Type']='application/json';init.method='POST';init.body=JSON.stringify(options.body);}
 const root=record(await upstream(url,init,fetcher));
 // HUB has gateway, Search and Search Trend error shapes. Never forward raw details/body.
 if(root.error||root.errorCode||root.errMsg)throw new ServiceError('UPSTREAM_ERROR','NAVER API HUB에서 오류를 반환했습니다. API 권한과 요청 조건을 확인해 주세요.');
 return root;
}
