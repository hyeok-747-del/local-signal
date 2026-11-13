// Server modules are imported only by Route Handlers. Never return provider error bodies or URLs with keys.
export class ServiceError extends Error {
 code:string;
 status:number;
 constructor(code:string, message:string, status=502){super(message);this.code=code;this.status=status;}
}
export type Fetcher = typeof fetch;
export function record(value:unknown):Record<string,unknown> {return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}
export function str(value:unknown):string {return typeof value==='string'||typeof value==='number'?String(value):'';}
export function integer(value:string|null, fallback:number, max:number){if(value===null)return fallback;if(!/^\d+$/.test(value)||Number(value)<1||Number(value)>max)throw new ServiceError('INVALID_REQUEST','페이지 값이 올바르지 않습니다.',400);return Number(value);}
export async function upstream(url:URL, init:RequestInit={}, fetcher:Fetcher=fetch):Promise<unknown>{
 try{
  const response=await fetcher(url,{...init,cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok){if(response.status===429)throw new ServiceError('RATE_LIMITED','외부 API 호출 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',429);if(response.status===401||response.status===403)throw new ServiceError('INVALID_CREDENTIALS','API 인증 또는 이용 권한을 확인해 주세요.',502);throw new ServiceError('UPSTREAM_ERROR','외부 API가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.');}
  const text=await response.text();
  // 공공데이터 게이트웨이는 HTTP 200으로 XML 인증/할당량 오류를 반환할 수 있습니다.
  if(text.trim().startsWith('<')){if(/LIMITED|LIMIT.*EXCEED|TOO_MANY/i.test(text))throw new ServiceError('RATE_LIMITED','공공 API 호출 한도를 확인해 주세요.',429);if(/SERVICE_KEY|ACCESS_DENIED|AUTH|REGISTERED/i.test(text))throw new ServiceError('INVALID_CREDENTIALS','공공데이터 인증키와 활용 승인을 확인해 주세요.');throw new ServiceError('INVALID_RESPONSE','공공 API에서 JSON 대신 오류 응답을 반환했습니다.');}
  try{return JSON.parse(text);}catch{throw new ServiceError('INVALID_RESPONSE','외부 API 응답 형식이 올바르지 않습니다.');}
 }catch(error){if(error instanceof ServiceError)throw error;throw new ServiceError('NETWORK_ERROR','외부 API 연결에 실패했거나 응답 시간이 초과되었습니다. 잠시 후 재시도해 주세요.',504);}
}
export function publicEnvelope(payload:unknown){
 const root=record(payload), envelope=Object.keys(record(root.response)).length?record(root.response):root,header=record(envelope.header),body=record(envelope.body);
 const code=str(header.resultCode||envelope.resultCode||body.resultCode);
 if(code&&code!=='00'&&code!=='0'&&code!=='NORMAL_SERVICE'){if(['20','22'].includes(code))throw new ServiceError('RATE_LIMITED','공공 API 호출 한도에 도달했습니다.',429);if(['21','30','31','32'].includes(code))throw new ServiceError('INVALID_CREDENTIALS','공공데이터 인증키, 활용 승인 및 서비스 권한을 확인해 주세요.');throw new ServiceError('UPSTREAM_ERROR','공공 API가 오류를 반환했습니다. 인증 및 제공기관 상태를 확인해 주세요.');}
 if(!('items' in body))throw new ServiceError('INVALID_RESPONSE','공공 API 응답에 업체 또는 지역 목록이 없습니다.');
 const raw=body.items, nested=record(raw).item;
 const items=Array.isArray(raw)?raw:Array.isArray(nested)?nested:nested?[nested]:raw===null||raw===''?[]:Object.keys(record(raw)).length?[raw]:[];
 return {items:items.map(record),body};
}
export function publicUrl(operation:string,key:string,params:Record<string,string>){
 let decoded=key.trim();try{decoded=decodeURIComponent(decoded);}catch{throw new ServiceError('INVALID_CREDENTIALS','공공데이터 인증키 형식을 확인해 주세요.');}
 const url=new URL(`https://apis.data.go.kr/B553077/api/open/sdsc2/${operation}`);
 url.search=new URLSearchParams({serviceKey:decoded,type:'json',...params}).toString();return url;
}
