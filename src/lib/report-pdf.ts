import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type {Report} from './report.ts';
export async function makeReportPdf(report:Report,fontBytes:Uint8Array,aiText=''){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(fontBytes,{subset:false});doc.setTitle(report.title);doc.setLanguage('ko-KR');
 const supported=new Set(font.getCharacterSet()),clean=(s:string)=>[...s].map(c=>c==='\t'?' ':supported.has(c.codePointAt(0)!)?c:'?').join('');
 let page=doc.addPage([595.28,841.89]),y=780;
 function draw(text:string,size=10){const source=clean(text);let line='';for(const char of source){if(font.widthOfTextAtSize(line+char,size)>487&&line){paint(line,size);line='';}line+=char;}paint(line,size);}
 function paint(text:string,size:number){if(y<65){page=doc.addPage([595.28,841.89]);y=780;}page.drawText(text,{x:54,y,size,font,color:rgb(.12,.19,.31)});y-=size+8;}
 draw(report.title,20);draw(`${report.start} ~ ${report.end}`,11);draw(`작성: ${new Date(report.createdAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}`,9);y-=10;
 for(const line of report.lines)for(const part of line.split('\n')){if(part.startsWith('[')){y-=10;draw(part,12);}else draw(part);}
 if(aiText){y-=12;draw('[AI 추정 요약]',12);for(const line of aiText.split('\n'))draw(line);}
 doc.getPages().forEach((p,i)=>p.drawText(`LOCAL SIGNAL  |  ${i+1} / ${doc.getPageCount()}`,{x:54,y:32,size:8,font,color:rgb(.5,.56,.66)}));return doc.save();
}
