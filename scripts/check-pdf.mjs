// Generates a clearly labeled synthetic QA report under a Git-ignored directory.
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {makeReportPdf} from '../src/lib/report-pdf.ts';
mkdirSync('.qa',{recursive:true});
const report={title:'PDF 검증용 DEMO 마케팅 보고서',period:'월간',start:'2026-11-01',end:'2026-11-13',createdAt:'2026-11-13T03:00:00Z',lines:['실제 업체 실적이 아닌 PDF 배치 검증용 문서입니다.','[기본 통계]','검색에서 확인된 게시글 수 / 미연결 항목은 미확인으로 표시합니다.','[키워드 추세]','관심도는 0~100의 상대값이며 실제 검색 횟수가 아닙니다.','[이벤트 후보]','기간 미확인 / 혜택 미확인 / 원문 확인 필요','https://example.com/source',...Array.from({length:72},(_,i)=>`검증 항목 ${i+1}: 긴 한국어 문장의 자동 줄바꿈, 페이지 경계 및 하단 페이지 번호를 확인합니다. 수치나 고객 반응을 실제 데이터처럼 생성하지 않습니다.`)]};
writeFileSync('.qa/report.pdf',await makeReportPdf(report,readFileSync('public/fonts/NanumGothic-Regular.ttf')));console.log('Synthetic PDF QA sample: .qa/report.pdf');
