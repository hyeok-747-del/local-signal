import {summarizeWithAi} from '@/lib/server/ai';
import {failure,json,rateLimit,required} from '@/lib/server/http';
import {record,ServiceError} from '@/lib/server/provider';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(){return json({configured:!!process.env.OPENAI_API_KEY?.trim(),modelConfigured:!!process.env.OPENAI_MODEL?.trim()});}
export async function POST(request:Request){try{rateLimit(request);const key=required(process.env.OPENAI_API_KEY,'OpenAI'),model=required(process.env.OPENAI_MODEL,'OpenAI 모델');const raw=await request.text();if(Buffer.byteLength(raw)>40000)throw new ServiceError('INVALID_REQUEST','요약 입력이 너무 큽니다. 범위를 줄여 주세요.',413);let body:Record<string,unknown>;try{body=record(JSON.parse(raw));}catch{throw new ServiceError('INVALID_REQUEST','올바른 JSON이 필요합니다.',400);}if(typeof body.input!=='string'||!body.input.trim()||body.input.length>20000)throw new ServiceError('INVALID_REQUEST','요약할 내용을 20,000자 이내로 입력하세요.',400);return json(await summarizeWithAi(body.input,{key,model}));}catch(error){return failure(error);}}
