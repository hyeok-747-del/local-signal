import {ServiceError} from './provider.ts';
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function failure(error:unknown){const e=error instanceof ServiceError?error:new ServiceError('INTERNAL_ERROR','요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',500);return json({error:{code:e.code,message:e.message}},e.status);}
export function required(value:string|undefined,label:string){if(!value?.trim())throw new ServiceError('NOT_CONFIGURED',`${label} API 키가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수를 확인해 주세요.`,503);return value.trim();}
// Vercel 인스턴스별 임시 제한입니다. 공유 저장소 없이 전역 호출량을 보장하지는 않습니다.
const buckets=new Map<string,{count:number;reset:number}>();
export function rateLimit(request:Request){const now=Date.now();const ip=(request.headers.get('x-forwarded-for')||'local').split(',')[0].slice(0,100);const key=`${new URL(request.url).pathname}:${ip}`;if(buckets.size>=1000)for(const [k,v]of buckets)if(v.reset<=now)buckets.delete(k);if(buckets.size>=1000&&!buckets.has(key))throw new ServiceError('RATE_LIMITED','요청이 많습니다. 1분 후 다시 시도해 주세요.',429);const b=buckets.get(key);if(b&&b.reset>now){if(b.count>=30)throw new ServiceError('RATE_LIMITED','요청이 많습니다. 1분 후 다시 시도해 주세요.',429);b.count++;}else buckets.set(key,{count:1,reset:now+60000});}
