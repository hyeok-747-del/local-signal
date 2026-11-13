// Explicit live request; logs aggregate counts only, never credentials or post content.
import assert from 'node:assert/strict';
import {analyzeBlog} from '../src/lib/blog-analysis.ts';
const base=process.env.SMOKE_URL||'http://localhost:3001';
const response=await fetch(`${base}/api/blog?${new URLSearchParams({name:'스타벅스',province:'서울특별시',category:'카페',start:'1'})}`);
if(!response.ok){const body=await response.json();console.log(JSON.stringify({status:response.status,errorCode:body.error?.code}));process.exitCode=1;}
else{const stats=analyzeBlog(await response.json());assert.equal(stats.daily.reduce((sum,d)=>sum+d.count,0),stats.recent+stats.previous);assert.equal(Object.values(stats.disclosureCounts).reduce((a,b)=>a+b,0),stats.total);if(stats.growth!==null)assert.ok(Number.isFinite(stats.growth));console.log(JSON.stringify({status:response.status,total:stats.total,today:stats.todayCount,week:stats.weekCount,month:stats.monthCount,recent7:stats.recent,previous7:stats.previous,coverage:stats.covered,signal:stats.signal,classifications:stats.disclosureCounts},null,2));}
