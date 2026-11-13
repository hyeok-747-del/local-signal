import {json} from '@/lib/server/http';
import {hubConfigured} from '@/lib/server/naver-hub';
import {publicDataValue} from '@/lib/server/public-data-key';
// 키 값은 반환하지 않습니다. 설정 유무이며 실제 인증 성공 여부와는 다릅니다.
export async function GET(){return json({publicData:!!publicDataValue(),naverBlog:hubConfigured(),maps:!!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim(),openai:!!(process.env.OPENAI_API_KEY?.trim()&&process.env.OPENAI_MODEL?.trim()),searchAd:!!(process.env.NAVER_AD_CUSTOMER_ID?.trim()&&process.env.NAVER_AD_API_KEY?.trim()&&process.env.NAVER_AD_SECRET_KEY?.trim())});}
