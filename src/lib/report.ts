import type {Business} from './business.ts';
import {analyzeBlog,seoulDay,dayOffset,validDay,type AnalysisEntries} from './blog-analysis.ts';
import type {DiscoveryHistory} from './discoveries.ts';
import type {Review,TrendData} from './extra-types.ts';
import {analyzeReviews} from './reviews.ts';
import {findEvents} from './events.ts';
export type ReportPeriod='일간'|'주간'|'월간';
export type Report={title:string;period:ReportPeriod;start:string;end:string;createdAt:string;lines:string[]};
export function makeReport(input:{period:ReportPeriod;businesses:Business[];entries:AnalysisEntries;history:DiscoveryHistory;reviews:Review[];trend:TrendData|null},now=new Date()):Report{
 const end=seoulDay(now),start=input.period==='일간'?end:input.period==='주간'?dayOffset(end,-((new Date(`${end}T00:00:00Z`).getUTCDay()+6)%7)):`${end.slice(0,7)}-01`;
 const inPeriod=(date:string)=>validDay(date)&&date>=start&&date<=end,actual=input.businesses.filter(b=>b.source==='public-data'),lines:string[]=[];
 lines.push('집계 기준: 한국시간 / 검색에서 확인된 게시글 / 미분석과 0건을 구분합니다.','[업체별 블로그 활동]');
 if(!actual.length)lines.push('실제 업체 미선택 / 업체 검색 API 연결 상태를 확인하세요.');
 for(const b of actual){const entry=input.entries[b.id];if(!entry){lines.push(`${b.name}: 미분석`);continue;}const s=analyzeBlog(entry.data,now),periodCount=entry.data.items.filter((p,i,a)=>inPeriod(p.date)&&a.findIndex(x=>x.url===p.url)===i).length;lines.push(`${b.name}: 기간 내 확인 ${periodCount}건 / 최근 7일 ${s.recent}건 / 이전 7일 ${s.previous}건 / ${s.signal} / 증가율 ${s.growth===null?'산정 보류':`${s.growth}%`}`);}
 lines.push('[신규 발견 경쟁업체]');const discovered=actual.filter(b=>input.history.firstSeen[b.id]&&inPeriod(seoulDay(new Date(input.history.firstSeen[b.id]))));lines.push(discovered.length?discovered.map(b=>`${b.name} (최초 발견일 ${seoulDay(new Date(input.history.firstSeen[b.id]))}, 개업일 미확인)`).join('\n'):'기간 내 현재 목록에서 확인된 최초 발견 기록 없음. 브라우저별 기록입니다.');
 lines.push('[키워드 관심도]');if(input.trend){lines.push(`조회 범위 ${input.trend.startDate} ~ ${input.trend.endDate} / 보고서 기간과 별도의 조회 범위 / 상대 관심도`);for(const g of input.trend.results){const points=g.data.filter(p=>inPeriod(p.period));lines.push(points.length?`${g.title}: 기간 내 ${points.length}개 관측점, 처음 ${points[0].ratio} / 마지막 ${points.at(-1)!.ratio} (검색 횟수 아님)`:`${g.title}: 보고서 기간 내 관측점 없음`);}}else lines.push('키워드 데이터 미조회.');
 lines.push('[경쟁업체 이벤트]');const events=findEvents(actual,input.entries).filter(e=>inPeriod(e.postDate));lines.push(...(events.length?events.flatMap(e=>[`${e.business}: ${e.title}`,`기간 ${e.period} / 혜택 ${e.benefit} / 원문 확인 필요`,e.url]):['기간 내 블로그 검색 표본에서 확인된 이벤트 후보 없음.']));
 lines.push('[입력 리뷰]');const reviews=input.reviews.filter(r=>inPeriod(seoulDay(new Date(r.createdAt)))),analysis=analyzeReviews(reviews);lines.push(`기간 내 입력 ${reviews.length}개 (입력일 기준, 작성일 아님). DEMO ${reviews.filter(r=>r.demo).length}개.`,`자주 언급된 장점: ${analysis.advantages.map(a=>`${a.keyword} ${a.count}개`).join(', ')||'미확인'}`,`자주 언급된 단점: ${analysis.disadvantages.map(a=>`${a.keyword} ${a.count}개`).join(', ')||'미확인'}`);
 lines.push('[마케팅 개선 제안 - 규칙 기반]','검색어에 지역·업종을 포함하고 동명 업체 매칭을 원문에서 확인하세요.');if(actual.some(b=>!input.entries[b.id]))lines.push('미분석 업체의 블로그를 먼저 조회해 비교 기준을 확보하세요.');if(Object.values(input.entries).some(e=>!analyzeBlog(e.data,now).covered))lines.push('14일 표본이 부족한 업체는 게시글을 더 조회한 뒤 증감 판단을 하세요.');if(analysis.disadvantages.length)lines.push(`반복된 고객 표현(${analysis.disadvantages[0].keyword})의 원문을 검토하고 운영 개선 항목으로 정리하세요.`);if(events.length)lines.push('이벤트 후보의 기간·혜택을 원문에서 확인한 뒤 프로모션 일정에 반영하세요.');
 lines.push('[한계]','검색 결과 제한·색인 지연·오매칭으로 실제 전체 홍보량과 다를 수 있습니다. 이벤트는 후보이며 개업일/대가 관계를 확정하지 않습니다. AI 분석은 별도 요청 시에만 실행합니다.');
 return {title:`${input.period} 마케팅 보고서`,period:input.period,start,end,createdAt:now.toISOString(),lines};
}
