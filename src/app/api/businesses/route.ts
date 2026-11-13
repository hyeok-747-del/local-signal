import {searchPublic} from '@/lib/server/public-data';
import {integer,ServiceError} from '@/lib/server/provider';
import {json,failure,required,rateLimit} from '@/lib/server/http';
export const runtime='nodejs';
export async function GET(request:Request){try{rateLimit(request);const p=new URL(request.url).searchParams;const province=p.get('province')||'',district=p.get('district')||'',keyword=p.get('keyword')||'';if(province.length>40||district.length>50||keyword.length>200)throw new ServiceError('INVALID_REQUEST','검색어 또는 지역이 너무 깁니다.',400);const page=integer(p.get('page'),1,100000);return json(await searchPublic({province,district,keyword,page},required(process.env.PUBLIC_DATA_API_KEY,'공공 상가정보')));}catch(error){return failure(error);}}
