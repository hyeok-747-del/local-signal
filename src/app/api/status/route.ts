import {json} from '@/lib/server/http';
import {hubConfigured} from '@/lib/server/naver-hub';
// 키 값은 반환하지 않습니다. 설정 유무이며 실제 인증 성공 여부와는 다릅니다.
export async function GET(){return json({publicData:!!process.env.PUBLIC_DATA_API_KEY?.trim(),naverBlog:hubConfigured(),maps:!!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim()});}
