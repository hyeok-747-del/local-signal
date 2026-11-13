import {keywordVolume} from '@/lib/server/search-ad';
import {json,failure,required,rateLimit} from '@/lib/server/http';
import {ServiceError} from '@/lib/server/provider';
export const runtime='nodejs';
export async function GET(request:Request){try{rateLimit(request);const keyword=new URL(request.url).searchParams.get('keyword')?.trim()||'';if(!keyword||keyword.length>100)throw new ServiceError('INVALID_REQUEST','검색어를 1~100자로 입력하세요.',400);return json(await keywordVolume(keyword,{customer:required(process.env.NAVER_AD_CUSTOMER_ID,'검색광고 고객 ID'),key:required(process.env.NAVER_AD_API_KEY,'검색광고'),secret:required(process.env.NAVER_AD_SECRET_KEY,'검색광고 Secret')}));}catch(error){return failure(error);}}
