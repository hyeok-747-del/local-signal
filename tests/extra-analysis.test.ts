import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {parseCsv,reviewsFromCsv,analyzeReviews} from '../src/lib/reviews.ts';
import {findEvents} from '../src/lib/events.ts';
import {makeReport} from '../src/lib/report.ts';
import {makeReportPdf} from '../src/lib/report-pdf.ts';
import {emptyHistory} from '../src/lib/discoveries.ts';
import {summarizeWithAi} from '../src/lib/server/ai.ts';
import {keywordVolume,adSignature} from '../src/lib/server/search-ad.ts';
import {parseGroups} from '../src/components/keyword-panel.tsx';
import type {AnalysisEntries} from '../src/lib/blog-analysis.ts';
const business={id:'public-fixture',name:'테스트 업체',category:'카페',address:'테스트 주소',province:'서울특별시',district:'마포구',source:'public-data' as const};
const entries:AnalysisEntries={[business.id]:{businessId:business.id,fetchedAt:'2026-11-13T00:00:00Z',data:{items:[{title:'카페 이벤트 20% 할인',description:'2026-11-01 ~ 2026-11-30 무료 증정',date:'2026-11-13',url:'https://example.com/event',blogger:'테스트'},{title:'새 프로모션',description:'좋은 혜택',date:'2026-11-12',url:'https://example.com/unknown',blogger:'테스트'}],query:'테스트',start:1,nextStart:null,reportedTotal:2,warning:'테스트'}}};
test('CSV BOM/쉼표/이스케이프/여러 줄, 오류시 부분 가져오기 금지',()=>{
 assert.deepEqual(parseCsv('\uFEFF업체명,리뷰\r\n가게,"친절, 깨끗\n맛있어요"\r\n다른가게,"""좋아요"""'),[['업체명','리뷰'],['가게','친절, 깨끗\n맛있어요'],['다른가게','"좋아요"']]);
 const imported=reviewsFromCsv('업체명,리뷰\n[DEMO] 가게,친절해요');assert.equal(imported[0].demo,true);assert.equal(imported[0].source,'CSV');
 assert.throws(()=>reviewsFromCsv('업체명,리뷰\n가게,정상\n빈가게,'));assert.throws(()=>parseCsv('a,"not closed'));assert.throws(()=>reviewsFromCsv('wrong,header\na,b'));
});
test('리뷰 표현 분석은 불친절을 긍정으로 중복하지 않고 혼합 표현을 구분',()=>{
 const reviews=reviewsFromCsv('업체명,리뷰\n가게,불친절하고 비싸요\n가게,맛있지만 느리고 불편해요\n가게,평범한 방문\n가게,친절하지 않아요');const a=analyzeReviews(reviews);
 assert.equal(a.rows[0].positive.length,0);assert.equal(a.rows[1].label,'혼합');assert.equal(a.rows[2].label,'판단 불가');assert.equal(a.rows[3].label,'부정 표현');assert.ok(a.disadvantages.some(d=>d.keyword==='비싸'));assert.equal(a.advantages.find(d=>d.keyword==='맛있')?.count,1);
});
test('이벤트는 명시된 기간/혜택만 추출하고 미확인 항목 보존',()=>{const events=findEvents([business],entries);assert.equal(events.length,2);assert.equal(events[0].period,'2026-11-01 ~ 2026-11-30');assert.ok(events[0].benefit.includes('20%'));assert.equal(events[1].period,'미확인');assert.equal(events[1].benefit,'미확인');});
test('보고서 일/주/월 범위와 미연결·규칙 제안, 부분 데이터만 활용',()=>{
 const now=new Date('2026-11-13T00:00:00Z'),input={businesses:[business],entries,history:emptyHistory(),reviews:[],trend:null};
 const daily=makeReport({...input,period:'일간'},now),weekly=makeReport({...input,period:'주간'},now),monthly=makeReport({...input,period:'월간'},now);
 assert.equal(daily.start,'2026-11-13');assert.equal(weekly.start,'2026-11-09');assert.equal(monthly.start,'2026-11-01');assert.ok(daily.lines.join('\n').includes('기간 내 확인 1건'));assert.ok(daily.lines.includes('키워드 데이터 미조회.'));assert.ok(daily.lines.join('\n').includes('규칙 기반'));assert.ok(makeReport({...input,entries:{},period:'주간'},now).lines.join('\n').includes('미분석'));
});
test('한국어 PDF 생성과 긴 보고서 자동 페이지 분할',async()=>{
 const report=makeReport({period:'월간',businesses:[business],entries,history:emptyHistory(),reviews:[],trend:null},new Date('2026-11-13T00:00:00Z'));report.lines.push(...Array.from({length:90},(_,i)=>`검증 문장 ${i+1}: 한국어 보고서 줄바꿈과 페이지 경계를 확인합니다.`));const bytes=await makeReportPdf(report,readFileSync('public/fonts/NanumGothic-Regular.ttf'));assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'%PDF');const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>2);assert.equal(pdf.getTitle(),'월간 마케팅 보고서');
});
test('OpenAI Responses 서버 인증·store false·출력 파싱 및 실패 처리',async()=>{
 const result=await summarizeWithAi('사용자 데이터',{key:'fixture-key',model:'fixture-model'},async(url,init)=>{assert.equal(String(url),'https://api.openai.com/v1/responses');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer fixture-key');const body=JSON.parse(String(init?.body));assert.equal(body.store,false);assert.equal(body.model,'fixture-model');assert.equal(body.input,'사용자 데이터');return Response.json({status:'completed',output:[{content:[{type:'output_text',text:'검증된 AI 요약'}]}]});});assert.equal(result.text,'검증된 AI 요약');assert.equal(result.method,'AI 추정');
 await assert.rejects(summarizeWithAi('테스트',{key:'fake',model:'fake'},async()=>new Response('',{status:401})),{code:'AI_ERROR'});await assert.rejects(summarizeWithAi('테스트',{key:'fake',model:'fake'},async()=>Response.json({status:'incomplete'})),{code:'INCOMPLETE_RESPONSE'});
});
test('검색광고는 서명 인증과 범위 검색량 유지, 키워드 파싱 제한',async()=>{
 const result=await keywordVolume('서울 카페',{key:'fixture-key',secret:'fixture-secret',customer:'123'},async(url,init)=>{const u=new URL(String(url)),h=new Headers(init?.headers);assert.equal(u.origin,'https://api.searchad.naver.com');assert.equal(u.searchParams.get('hintKeywords'),'서울카페');assert.equal(h.get('X-Signature'),adSignature(h.get('X-Timestamp')!,'fixture-secret'));assert.equal(h.get('X-Customer'),'123');return Response.json({keywordList:[{relKeyword:'서울카페',monthlyPcQcCnt:'< 10',monthlyMobileQcCnt:100}]});});assert.equal(result.items[0].pc,'< 10');assert.equal(result.items[0].mobile,100);
 assert.equal(parseGroups('카페=서울 카페,마포 카페\n파티룸=서울 파티룸').length,2);assert.throws(()=>parseGroups(''));assert.throws(()=>parseGroups(Array(6).fill('카페').join('\n')));
});
