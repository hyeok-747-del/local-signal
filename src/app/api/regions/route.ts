import {getDistricts} from '@/lib/server/public-data';
import {json,failure,required,rateLimit} from '@/lib/server/http';
export async function GET(request:Request){try{rateLimit(request);return json({items:await getDistricts(new URL(request.url).searchParams.get('province')||'',required(process.env.PUBLIC_DATA_API_KEY,'공공 상가정보'))});}catch(error){return failure(error);}}
