// Credentials stay inside the Next.js server. This script prints safe counts/codes only.
import assert from 'node:assert/strict';
const base=process.env.SMOKE_URL||'http://localhost:3001',status=await fetch(`${base}/api/status`).then(r=>r.json());
console.log(JSON.stringify({publicDataConfigured:status.publicData}));
for(const [name,path] of [['regions',`/api/regions?${new URLSearchParams({province:'서울특별시'})}`],['businesses',`/api/businesses?${new URLSearchParams({province:'서울특별시',keyword:'카페',page:'1'})}`]]){
 const response=await fetch(`${base}${path}`),data=await response.json();
 if(!status.publicData){assert.equal(response.status,503);assert.equal(data.error.code,'NOT_CONFIGURED');console.log(JSON.stringify({endpoint:name,status:503,code:data.error.code}));continue;}
 if(!response.ok){console.log(JSON.stringify({endpoint:name,status:response.status,code:data.error?.code}));process.exitCode=1;continue;}
 assert.ok(Array.isArray(data.items));assert.ok(data.items.every(item=>name==='regions'?item.code&&item.name:item.id&&item.name&&item.address&&item.category));console.log(JSON.stringify({endpoint:name,status:response.status,count:data.items.length,...(name==='businesses'?{scanned:data.scanned,total:data.total,emptyReason:data.emptyReason,hasMore:data.hasMore}:{})}));
}
if(!status.publicData)console.log('Missing-key handling verified. Real public-data authentication remains unverified.');
if(status.publicData&&!process.exitCode){
 const query={province:'서울특별시',district:'마포구',keyword:'',page:'1'},response=await fetch(`${base}/api/businesses?${new URLSearchParams(query)}`),data=await response.json();assert.equal(response.status,200);assert.ok(data.items.length>0);const sample=data.items[0];assert.equal(sample.district,'마포구');
 const filteredResponse=await fetch(`${base}/api/businesses?${new URLSearchParams({...query,name:sample.name,address:sample.address,category:sample.category})}`),filtered=await filteredResponse.json();assert.equal(filteredResponse.status,200);assert.ok(filtered.items.some(item=>item.id===sample.id));console.log(JSON.stringify({districtSearchStatus:response.status,advancedFilterStatus:filteredResponse.status,matchedSample:true}));
}
