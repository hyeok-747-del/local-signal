'use client';
import {useState} from 'react';
import type {Business} from '@/lib/business';
import type {AnalysisEntries} from '@/lib/blog-analysis';
import type {DiscoveryHistory} from '@/lib/discoveries';
import type {Review,TrendData} from '@/lib/extra-types';
import {makeReport,type ReportPeriod} from '@/lib/report';
import AiSummary from './ai-summary';
export default function ReportPanel({businesses,entries,history,reviews,trend}:{businesses:Business[];entries:AnalysisEntries;history:DiscoveryHistory;reviews:Review[];trend:TrendData|null}){
 const [period,setPeriod]=useState<ReportPeriod>('주간'),[aiText,setAiText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),report=makeReport({period,businesses,entries,history,reviews,trend});
 async function download(){setBusy(true);setError('');try{const response=await fetch('/fonts/NanumGothic-Regular.ttf');if(!response.ok)throw new Error('한국어 PDF 폰트를 불러오지 못했습니다.');const {makeReportPdf}=await import('@/lib/report-pdf');const bytes=await makeReportPdf(report,new Uint8Array(await response.arrayBuffer()),aiText),blob=new Blob([bytes as BlobPart],{type:'application/pdf'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`local-insight-${period}-${report.end}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="panel feature-panel"><div className="report-toolbar"><h2>마케팅 보고서</h2><label>보고서 유형<select value={period} onChange={e=>setPeriod(e.target.value as ReportPeriod)}>{['일간','주간','월간'].map(p=><option key={p}>{p}</option>)}</select></label><button className="primary" disabled={busy} onClick={download}>{busy?'PDF 생성 중…':'PDF 다운로드'}</button></div><p className="helper">기본 통계·제안은 AI 키 없이 작동합니다. 현재 화면에서 조회한 데이터와 이 브라우저의 기록으로 작성합니다. 미조회 자료는 생성하지 않습니다.</p>{error&&<p role="alert" className="message">{error}</p>}<article className="report-document"><h1>{report.title}</h1><p>{report.start} ~ {report.end} · 한국시간</p>{report.lines.map((line,i)=>line.startsWith('[')?<h3 key={i}>{line}</h3>:<p key={i}>{line}</p>)}</article><AiSummary label="AI 마케팅 개선 제안" input={report.lines.join('\n')} onResult={setAiText}/></section>;
}
