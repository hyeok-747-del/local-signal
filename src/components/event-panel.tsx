'use client';
import {useState} from 'react';
import type {Business} from '@/lib/business';
import type {AnalysisEntries} from '@/lib/blog-analysis';
import {findEvents} from '@/lib/events';
export default function EventPanel({businesses,entries}:{businesses:Business[];entries:AnalysisEntries}){
 const [filter,setFilter]=useState(''),events=findEvents(businesses,entries),visible=events.filter(e=>!filter||e.business===filter);
 return <section className="panel feature-panel"><h2>경쟁업체 이벤트 후보</h2><p className="helper">블로그 분석에서 조회한 제목·요약문만 탐색합니다. 자동으로 확정된 이벤트가 아니며 종료 여부와 실제 혜택은 원문에서 확인하세요. 기간·혜택은 추측하지 않습니다.</p><label className="inline-filter">이벤트 업체<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">전체 업체</option>{[...new Set(events.map(e=>e.business))].map(n=><option key={n}>{n}</option>)}</select></label>{!visible.length?<div className="empty"><h3>확인된 이벤트 후보가 없습니다</h3><p>먼저 실제 업체의 블로그를 조회하세요. 현재 검색 표본에 없을 수도 있습니다.</p></div>:<div className="event-grid">{visible.map(e=><article key={`${e.business}:${e.url}`}><span className="badge">이벤트 후보 · 원문 확인 필요</span><h3>{e.title}</h3><strong>{e.business}</strong><p>기간: {e.period}</p><p>혜택: {e.benefit}</p><small>게시일: {e.postDate} (이벤트 기간과 다름)</small><a href={e.url} target="_blank" rel="noopener noreferrer">출처 원문 확인 ↗</a></article>)}</div>}</section>;
}
