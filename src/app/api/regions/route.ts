import {getDistricts} from '@/lib/server/public-data';
import {json,failure,rateLimit} from '@/lib/server/http';
import {publicDataKey} from '@/lib/server/public-data-key';
export async function GET(request:Request){try{rateLimit(request);return json({items:await getDistricts(new URL(request.url).searchParams.get('province')||'',publicDataKey())});}catch(error){return failure(error);}}
