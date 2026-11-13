// Explicit opt-in live check: calls each enabled NAVER API once. Never logs credentials or raw bodies.
const base=process.env.SMOKE_URL||'http://localhost:3001';
const state=await fetch(`${base}/api/status`).then(r=>r.json());
if(!state.naverBlog){console.log(JSON.stringify({configured:false,message:'Both API HUB environment variables are required.'}));process.exitCode=1;}else{
 const requests=[
  ['blog',`/api/blog?${new URLSearchParams({name:'스타벅스',province:'서울특별시',category:'카페',start:'1'})}`],
  ['local',`/api/naver/local?${new URLSearchParams({query:'서울 카페'})}`],
  ['trends','/api/naver/trends',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({startDate:'2026-11-01',endDate:'2026-11-07',timeUnit:'date',keywordGroups:[{groupName:'카페',keywords:['서울 카페']}]})}],
 ];
 const results=await Promise.all(requests.map(async([api,path,init])=>{
  try{const response=await fetch(`${base}${path}`,init);const data=await response.json();return {api,status:response.status,...(response.ok?{items:api==='trends'?data.results?.length:data.items?.length,...(api==='trends'?{points:data.results?.reduce((n,g)=>n+g.data.length,0),metric:data.metric}:{})}:{errorCode:data.error?.code||'UNKNOWN_ERROR'})};}
  catch{return {api,status:0,errorCode:'LOCAL_CONNECTION_FAILED'};}
 }));
 console.log(JSON.stringify({configured:true,results},null,2));if(results.some(r=>r.status!==200))process.exitCode=1;
}
