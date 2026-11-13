'use client';
import {useEffect,useRef,useState} from 'react';
import {clientApi,postJson} from '@/lib/client-api';
export default function AiSummary({input,label='AI 요약',onResult}:{input:string;label?:string;onResult?:(text:string)=>void}){
 const [configured,setConfigured]=useState(false),[busy,setBusy]=useState(false),[text,setText]=useState(''),[error,setError]=useState('');const abort=useRef<AbortController|null>(null);
 useEffect(()=>{const c=new AbortController();clientApi<{configured:boolean;modelConfigured:boolean}>('/api/ai',c.signal).then(s=>setConfigured(s.configured&&s.modelConfigured)).catch(()=>{});return()=>{c.abort();abort.current?.abort();};},[]);
 useEffect(()=>{abort.current?.abort();setBusy(false);setText('');setError('');onResult?.('');},[input]);
 async function run(){const c=new AbortController();abort.current=c;setBusy(true);setError('');try{const result=await postJson<{text:string}>('/api/ai',{input},c.signal);if(!c.signal.aborted){setText(result.text);onResult?.(result.text);}}catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'AI 요청 실패');}finally{if(!c.signal.aborted)setBusy(false);}}
 return <div className="ai-summary"><button className="primary" disabled={!configured||!input.trim()||input.length>20000||busy} onClick={run}>{busy?'AI 분석 중…':label}</button><p className="helper">{configured?'클릭하면 표시된 분석 자료 또는 선택 리뷰 본문을 OpenAI에 전송합니다. 개인정보를 제거하세요. AI 추정 결과는 사실 확정이 아닙니다.':'AI 미연결 · OPENAI_API_KEY와 OPENAI_MODEL을 설정하면 활성화됩니다. 기본 분석은 계속 사용할 수 있습니다.'}{input.length>20000?' 입력이 20,000자를 넘습니다. 요약 범위를 줄여 주세요.':''}</p>{error&&<p role="alert" className="message">{error}</p>}{text&&<div className="ai-output"><strong>AI 추정 요약</strong><p>{text}</p></div>}</div>;
}
