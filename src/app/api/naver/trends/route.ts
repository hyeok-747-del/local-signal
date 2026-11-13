import {validateTrendInput,searchTrends} from '@/lib/server/naver-trends';
import {hubCredentials} from '@/lib/server/naver-hub';
import {ServiceError} from '@/lib/server/provider';
import {failure,json,rateLimit} from '@/lib/server/http';
export const runtime='nodejs';
export async function POST(request:Request){try{rateLimit(request);if(!request.headers.get('content-type')?.includes('application/json'))throw new ServiceError('INVALID_REQUEST','application/json 형식으로 요청해 주세요.',415);const text=await request.text();if(Buffer.byteLength(text,'utf8')>32768)throw new ServiceError('INVALID_REQUEST','요청 본문이 너무 큽니다.',413);let body:unknown;try{body=JSON.parse(text);}catch{throw new ServiceError('INVALID_REQUEST','올바른 JSON을 입력해 주세요.',400);}return json(await searchTrends(validateTrendInput(body),hubCredentials()));}catch(error){return failure(error);}}
