import {searchPublic} from '@/lib/server/public-data';
import {integer,ServiceError} from '@/lib/server/provider';
import {json,failure,rateLimit} from '@/lib/server/http';
import {publicDataKey} from '@/lib/server/public-data-key';
export const runtime='nodejs';
export async function GET(request:Request){try{rateLimit(request);const p=new URL(request.url).searchParams;const province=p.get('province')?.trim()||'',district=p.get('district')?.trim()||'',keyword=p.get('keyword')?.trim()||'',name=p.get('name')?.trim()||'',address=p.get('address')?.trim()||'',category=p.get('category')?.trim()||'';if(province.length>40||district.length>50||[keyword,name,address,category].some(s=>s.length>200))throw new ServiceError('INVALID_REQUEST','검색어 또는 지역이 너무 깁니다.',400);const page=integer(p.get('page'),1,100000);return json(await searchPublic({province,district,keyword,name,address,category,page},publicDataKey()));}catch(error){return failure(error);}}
