import assert from 'node:assert/strict';
const base=process.env.SMOKE_URL||'http://localhost:3001';
const page=await fetch(base);assert.equal(page.status,200);console.log('GET / -> 200');
const state=await fetch(`${base}/api/status`);assert.equal(state.status,200);const status=await state.json();assert.deepEqual(Object.keys(status).sort(),['maps','naverBlog','publicData']);assert.ok(Object.values(status).every(v=>typeof v==='boolean'));console.log('GET /api/status -> 200 (booleans only)');
async function check(path,expected,code){const response=await fetch(`${base}${path}`);assert.equal(response.status,expected);assert.equal(response.headers.get('cache-control'),'no-store');const data=await response.json();assert.equal(data.error.code,code);console.log(`GET ${path.split('?')[0]} -> ${expected} ${code}`);}
if(!status.publicData){await check('/api/businesses?province='+encodeURIComponent('서울특별시'),503,'NOT_CONFIGURED');await check('/api/regions?province='+encodeURIComponent('서울특별시'),503,'NOT_CONFIGURED');}
if(!status.naverBlog)await check('/api/blog?name='+encodeURIComponent('테스트')+'&province='+encodeURIComponent('서울특별시'),503,'NOT_CONFIGURED');
if(!status.naverBlog){
 await check('/api/naver/local?query='+encodeURIComponent('서울 카페'),503,'NOT_CONFIGURED');
 const response=await fetch(`${base}/api/naver/trends`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({startDate:'2026-10-01',endDate:'2026-10-31',timeUnit:'date',keywordGroups:[{groupName:'카페',keywords:['서울 카페']}]})});assert.equal(response.status,503);assert.equal((await response.json()).error.code,'NOT_CONFIGURED');console.log('POST /api/naver/trends -> 503 NOT_CONFIGURED');
}
await check('/api/businesses?page=0',400,'INVALID_REQUEST');
await check('/api/blog?name=demo',400,'INVALID_REQUEST');
console.log('HTTP smoke checks passed. Real provider authentication was not tested.');
