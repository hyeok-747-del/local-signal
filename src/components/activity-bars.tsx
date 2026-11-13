export default function ActivityBars({rows}:{rows:{id:string;name:string;recent:number;previous:number}[]}){
 const max=Math.max(1,...rows.flatMap(r=>[r.recent,r.previous]));
 return <div className="activity-bars"><h3>최근 7일 · 이전 7일 게시글 비교</h3><p className="helper">검색 표본에서 확인된 건수 · 파랑: 최근 7일 / 회색: 이전 7일</p>{rows.map(r=><div className="bar-business" key={r.id}><strong>{r.name}</strong><div aria-label={`${r.name} 최근 7일 ${r.recent}건`} className="bar-row"><span>최근</span><div><i style={{width:`${r.recent/max*100}%`}}/></div><small>{r.recent}건</small></div><div aria-label={`${r.name} 이전 7일 ${r.previous}건`} className="bar-row previous"><span>이전</span><div><i style={{width:`${r.previous/max*100}%`}}/></div><small>{r.previous}건</small></div></div>)}</div>;
}
