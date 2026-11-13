import type {Review} from './extra-types.ts';
export function parseCsv(text:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false,closed=false;
 const input=text.replace(/^\uFEFF/,'');
 for(let i=0;i<input.length;i++){const ch=input[i];if(quoted){if(ch==='"'){if(input[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=ch;continue;}
  if(ch==='"'){if(cell||closed)throw new Error('CSV 따옴표 형식이 올바르지 않습니다.');quoted=true;}else if(ch===','){row.push(cell);cell='';closed=false;}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(c=>c.trim()))rows.push(row);row=[];cell='';closed=false;}else{if(closed&&!/\s/.test(ch))throw new Error('CSV 따옴표 뒤의 구분자를 확인하세요.');if(!closed)cell+=ch;}}
 if(quoted)throw new Error('CSV 따옴표가 닫히지 않았습니다.');row.push(cell);if(row.some(c=>c.trim()))rows.push(row);return rows;
}
export function reviewsFromCsv(text:string,now=new Date()):Review[]{const rows=parseCsv(text);if(rows.length<2)throw new Error('CSV 헤더와 리뷰 행이 필요합니다.');const header=rows[0].map(s=>s.trim().toLowerCase()),businessIndex=header.findIndex(h=>['업체명','business'].includes(h)),textIndex=header.findIndex(h=>['리뷰','text','review'].includes(h));if(businessIndex<0||textIndex<0)throw new Error('CSV 헤더에 업체명,리뷰 열을 넣어 주세요.');if(rows.length>5001)throw new Error('한 파일은 리뷰 5,000개 이하로 나누어 업로드해 주세요.');return rows.slice(1).map((row,index)=>{const business=row[businessIndex]?.trim(),content=row[textIndex]?.trim();if(!business||!content||business.length>100||content.length>5000)throw new Error(`${index+2}행의 업체명 또는 리뷰 길이를 확인하세요.`);return {id:crypto.randomUUID(),business,text:content,createdAt:now.toISOString(),source:'CSV',demo:business.startsWith('[DEMO]')};});}
export function analyzeReviews(reviews:Review[]){
 const positives=['친절','맛있','깨끗','가성비','빠르','분위기 좋'],negatives=['불친절','맛없','비싸','느리','불편','더럽','시끄럽'];
 const rows=reviews.map(review=>{const positive=positives.filter(k=>{if(k==='친절'&&/불친절|친절하지\s*않/.test(review.text))return false;return review.text.includes(k);}),negative=negatives.filter(k=>review.text.includes(k));if(/친절하지\s*않/.test(review.text))negative.push('친절하지 않음');return {review,positive,negative,label:positive.length&&negative.length?'혼합':positive.length?'긍정 표현':negative.length?'부정 표현':'판단 불가'};});
 const count=(key:'positive'|'negative')=>[...new Set(rows.flatMap(r=>r[key]))].map(keyword=>({keyword,count:rows.filter(r=>r[key].includes(keyword)).length})).sort((a,b)=>b.count-a.count);
 return {rows,advantages:count('positive'),disadvantages:count('negative')};
}
export function isReview(value:unknown):value is Review{if(!value||typeof value!=='object')return false;const r=value as Record<string,unknown>;return ['id','business','text','createdAt'].every(k=>typeof r[k]==='string')&&Number.isFinite(Date.parse(String(r.createdAt)))&&String(r.business).length>0&&String(r.business).length<=100&&String(r.text).length>0&&String(r.text).length<=5000&&['직접 입력','CSV'].includes(String(r.source))&&typeof r.demo==='boolean';}
