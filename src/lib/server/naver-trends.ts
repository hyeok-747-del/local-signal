import {hubRequest,type HubCredentials} from './naver-hub.ts';
import {record,ServiceError,str,type Fetcher} from './provider.ts';

export type TrendInput={startDate:string;endDate:string;timeUnit:'date'|'week'|'month';keywordGroups:{groupName:string;keywords:string[]}[];device?:'pc'|'mo';gender?:'m'|'f';ages?:string[]};
function invalid():never{throw new ServiceError('INVALID_REQUEST','트렌드 요청의 날짜·구간·키워드 그룹·필터를 확인해 주세요. 그룹 최대 5개, 그룹당 키워드 최대 20개입니다.',400);}
function validDate(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function validateTrendInput(value:unknown):TrendInput{
 const input=record(value);
 if(!validDate(input.startDate)||!validDate(input.endDate)||input.startDate<'2016-01-01'||input.endDate<input.startDate||!['date','week','month'].includes(str(input.timeUnit)))invalid();
 if(!Array.isArray(input.keywordGroups)||input.keywordGroups.length<1||input.keywordGroups.length>5)invalid();
 const keywordGroups=input.keywordGroups.map(value=>{const group=record(value);if(typeof group.groupName!=='string'||!group.groupName.trim()||group.groupName.length>100||!Array.isArray(group.keywords)||group.keywords.length<1||group.keywords.length>20||group.keywords.some(k=>typeof k!=='string'||!k.trim()||k.length>100))invalid();return {groupName:group.groupName.trim(),keywords:(group.keywords as string[]).map(k=>k.trim())};});
 if(input.device!==undefined&&!['pc','mo'].includes(str(input.device)))invalid();
 if(input.gender!==undefined&&!['m','f'].includes(str(input.gender)))invalid();
 if(input.ages!==undefined&&(!Array.isArray(input.ages)||input.ages.length>11||input.ages.some(a=>typeof a!=='string'||!/^(?:[1-9]|10|11)$/.test(a))))invalid();
 return {startDate:input.startDate,endDate:input.endDate,timeUnit:input.timeUnit as TrendInput['timeUnit'],keywordGroups,...(input.device?{device:input.device as 'pc'|'mo'}:{}),...(input.gender?{gender:input.gender as 'm'|'f'}:{}),...(input.ages?{ages:input.ages as string[]}:{})};
}
export async function searchTrends(input:TrendInput,credentials:HubCredentials,fetcher?:Fetcher){
 const root=await hubRequest('/search-trend/v1/search',credentials,{body:input},fetcher);
 if(!Array.isArray(root.results)||!validDate(root.startDate)||!validDate(root.endDate)||!['date','week','month'].includes(str(root.timeUnit)))throw new ServiceError('INVALID_RESPONSE','NAVER API HUB 검색어 트렌드 응답 형식이 올바르지 않습니다.');
 const results=root.results.map(value=>{const group=record(value);if(typeof group.title!=='string'||!Array.isArray(group.keywords)||group.keywords.some(k=>typeof k!=='string')||!Array.isArray(group.data))throw new ServiceError('INVALID_RESPONSE','트렌드 그룹 응답 형식이 올바르지 않습니다.');const data=group.data.map(value=>{const point=record(value);if(!validDate(point.period)||typeof point.ratio!=='number'||!Number.isFinite(point.ratio)||point.ratio<0||point.ratio>100)throw new ServiceError('INVALID_RESPONSE','상대 관심도 응답 형식이 올바르지 않습니다.');return {period:point.period,ratio:point.ratio};});return {title:group.title,keywords:group.keywords as string[],data};});
 return {source:'naver-api-hub',startDate:root.startDate,endDate:root.endDate,timeUnit:root.timeUnit,results,metric:'relative-interest',warning:'0~100의 상대적 검색 관심도입니다. 실제 검색 횟수 또는 월간 검색량이 아닙니다.'};
}
