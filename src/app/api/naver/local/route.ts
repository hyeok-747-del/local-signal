import {searchLocal} from '@/lib/server/naver-local';
import {hubCredentials} from '@/lib/server/naver-hub';
import {ServiceError} from '@/lib/server/provider';
import {failure,json,rateLimit} from '@/lib/server/http';
export const runtime='nodejs';
export async function GET(request:Request){try{rateLimit(request);const query=new URL(request.url).searchParams.get('query')?.trim()||'';if(!query||query.length>200)throw new ServiceError('INVALID_REQUEST','지역과 업종을 포함한 검색어를 1~200자로 입력해 주세요.',400);return json(await searchLocal(query,hubCredentials()));}catch(error){return failure(error);}}
