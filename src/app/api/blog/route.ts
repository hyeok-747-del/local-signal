import {searchBlog} from '@/lib/server/blog';
import {integer,ServiceError} from '@/lib/server/provider';
import {json,failure,rateLimit} from '@/lib/server/http';
import {hubCredentials} from '@/lib/server/naver-hub';
export const runtime='nodejs';
export async function GET(request:Request){try{rateLimit(request);const p=new URL(request.url).searchParams;const name=p.get('name')?.trim()||'',province=p.get('province')?.trim()||'',district=p.get('district')?.trim()||'',category=p.get('category')?.trim()||'';if(!name||!province||[name,province,district,category].some(s=>s.length>100)||name.startsWith('[DEMO]'))throw new ServiceError('INVALID_REQUEST','실제 업체명과 지역을 선택해 주세요. DEMO 업체는 블로그를 검색하지 않습니다.',400);return json(await searchBlog({name,province,district,category,start:integer(p.get('start'),1,1000)},hubCredentials()));}catch(error){return failure(error);}}
