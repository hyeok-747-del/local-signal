import type {BlogPost,BlogResult} from './contracts.ts';

const DAY=86400000;
export function seoulDay(now=new Date()){return new Date(now.getTime()+9*60*60*1000).toISOString().slice(0,10);}
export function dayOffset(day:string,offset:number){return new Date(Date.parse(`${day}T00:00:00Z`)+offset*DAY).toISOString().slice(0,10);}
export function validDay(day:string){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day))&&new Date(day).toISOString().slice(0,10)===day;}
export type DisclosureLabel='협찬 명시'|'체험단 명시'|'내돈내산 명시'|'판단 불가';
export type Disclosure={label:DisclosureLabel;method:'키워드 기반';evidence:string[];reason:string};
export function classifyDisclosure(post:Pick<BlogPost,'title'|'description'>):Disclosure{
 const text=`${post.title} ${post.description}`;
 // 단어의 단순 등장만으로 대가 관계를 확정하지 않습니다. 부정/상충/인용은 보수적으로 처리합니다.
 const groups:[DisclosureLabel,RegExp][]=[['협찬 명시',/(?:#협찬|광고\s*포함|유료\s*광고|협찬(?:을|를)?\s*(?:받|제공)|(?:제품|서비스|식사|원고료|이용권|식사권|상품)(?:을|를)?\s*제공\s*받)/gi],['체험단 명시',/(?:#체험단|체험단(?:으로|에)\s*(?:참여|선정)|체험단\s*(?:활동|후기|리뷰))/gi],['내돈내산 명시',/(?:#?내돈내산|직접\s*(?:구매|결제)(?:한|했)|제\s*돈(?:으로)?\s*(?:구매|결제))/gi]];
 const evidence=groups.map(([label,pattern])=>({label,matches:[...text.matchAll(pattern)].map(m=>m[0])})).filter(g=>g.matches.length);
 const ambiguous=/(?:아니|않|없|아닌|미제공|무관|모집|신청|예시|가이드|뜻|사용법|비교)/.test(text);
 if(evidence.length!==1||ambiguous)return {label:'판단 불가',method:'키워드 기반',evidence:evidence.flatMap(g=>g.matches),reason:evidence.length>1?'상충하는 표현이 함께 있습니다.':ambiguous?'부정·모집·설명 등 문맥이 섞여 단정할 수 없습니다.':'제목과 요약문에서 명시적인 근거를 확인하지 못했습니다.'};
 return {label:evidence[0].label,method:'키워드 기반',evidence:[...new Set(evidence[0].matches)],reason:'제목·요약문에 명시된 표현입니다. 실제 대가 관계는 원문 확인이 필요합니다.'};
}
export type AnalysisEntry={businessId:string;data:BlogResult;fetchedAt:string};
export type AnalysisEntries=Record<string,AnalysisEntry>;
export function analyzeBlog(data:BlogResult,now=new Date()){
 const today=seoulDay(now),recentStart=dayOffset(today,-6),previousStart=dayOffset(today,-13),previousEnd=dayOffset(today,-7);
 const weekday=new Date(`${today}T00:00:00Z`).getUTCDay(),weekStart=dayOffset(today,-((weekday+6)%7)),monthStart=`${today.slice(0,7)}-01`;
 const unique=data.items.filter((p,i,a)=>a.findIndex(x=>x.url===p.url)===i),dated=unique.filter(p=>validDay(p.date)&&p.date<=today),unknownDates=unique.filter(p=>!validDay(p.date)).length;
 const count=(start:string,end=today)=>dated.filter(p=>p.date>=start&&p.date<=end).length;
 const recent=count(recentStart),previous=count(previousStart,previousEnd),oldest=dated.map(p=>p.date).sort()[0];
 const covered=unknownDates===0&&((data.nextStart===null&&data.reportedTotal<=1000)||!!oldest&&oldest<=previousStart);
 const growth=covered&&previous>0?Math.round((recent-previous)/previous*1000)/10:null;
 const signal=!covered?'표본 미완료':previous===0?(recent>0?'활동 새로 확인':'변화 없음'):recent>=previous*2&&recent-previous>=3?'급증 신호':recent<previous?'감소 신호':recent>previous?'증가 신호':'변화 없음';
 const daily=Array.from({length:14},(_,i)=>{const date=dayOffset(previousStart,i);return {date,count:count(date,date)};});
 const classifications=unique.map(post=>({post,disclosure:classifyDisclosure(post)}));
 const disclosureCounts:Record<DisclosureLabel,number>={'협찬 명시':0,'체험단 명시':0,'내돈내산 명시':0,'판단 불가':0};classifications.forEach(c=>disclosureCounts[c.disclosure.label]++);
 return {today,weekStart,monthStart,total:unique.length,todayCount:count(today),weekCount:count(weekStart),monthCount:count(monthStart),recent,previous,growth,signal,covered,unknownDates,daily,classifications,disclosureCounts};
}
