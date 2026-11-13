import {provinceCodes,type District,type SearchResult} from '../contracts.ts';
import type {Business} from '../business.ts';
import {ServiceError,publicEnvelope,publicUrl,upstream,str,type Fetcher} from './provider.ts';
export async function getDistricts(province:string,key:string,fetcher?:Fetcher):Promise<District[]>{
 const code=provinceCodes[province];if(!code)throw new ServiceError('INVALID_REQUEST','지원하지 않는 시·도입니다.',400);
 const {items}=publicEnvelope(await upstream(publicUrl('baroApi',key,{resId:'dong',catId:'cty'}),{},fetcher));
 const matching=items.filter(r=>str(r.ctprvnCd)===code||str(r.signguCd).startsWith(code));
 return [...new Map(matching.map(r=>({code:str(r.signguCd),name:str(r.signguNm)})).filter(r=>/^\d{5}$/.test(r.code)&&r.name).map(r=>[r.code,r])).values()].sort((a,b)=>a.name.localeCompare(b.name,'ko'));
}
export function normalizeBusiness(row:Record<string,unknown>):Business|null{
 const id=str(row.bizesId),name=[str(row.bizesNm),str(row.brchNm)].filter(Boolean).join(' ');if(!id||!name)return null;
 const latitude=Number(row.lat),longitude=Number(row.lon),valid=row.lat!==null&&row.lat!==''&&row.lon!==null&&row.lon!==''&&Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=33&&latitude<=39&&longitude>=124&&longitude<=132;
 return {id:`public-${id}`,name,category:str(row.indsSclsNm||row.indsMclsNm||row.indsLclsNm)||'업종 미확인',province:str(row.ctprvnNm),district:str(row.signguNm),address:str(row.rdnmAdr||row.lnoAdr)||'주소 미확인',source:'public-data',...(valid?{latitude,longitude}:{})};
}
export async function searchPublic(input:{province:string;district:string;keyword:string;page:number},key:string,fetcher?:Fetcher):Promise<SearchResult>{
 const code=provinceCodes[input.province];if(!code)throw new ServiceError('INVALID_REQUEST','지원하지 않는 시·도입니다.',400);
 let region=code,divId='ctprvnCd';
 if(input.district){const districts=await getDistricts(input.province,key,fetcher);const selected=districts.find(d=>d.name===input.district);if(!selected)throw new ServiceError('INVALID_REGION','제공기관 지역 목록에 없는 시·군·구입니다. 시·도 전체로 검색하거나 지역 목록을 새로 불러오세요.',400);region=selected.code;divId='signguCd';}
 const {items,body}=publicEnvelope(await upstream(publicUrl('storeListInDong',key,{divId,key:region,numOfRows:'1000',pageNo:String(input.page)}),{},fetcher));
 const total=Number(body.totalCount);if(!Number.isFinite(total)||total<0)throw new ServiceError('INVALID_RESPONSE','공공 API의 전체 건수 응답이 올바르지 않습니다.');
 const tokens=input.keyword.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const businesses=items.map(normalizeBusiness).filter((b):b is Business=>b!==null).filter(b=>tokens.every(t=>`${b.name} ${b.category} ${b.address}`.toLocaleLowerCase().includes(t)));
 return {items:businesses,source:'public-data',providerPage:input.page,scanned:items.length,total,hasMore:input.page*1000<total,warning:'공공 API는 지역별 페이지를 제공합니다. 키워드는 불러온 원본의 업체명·업종·주소에서 검색합니다. 전체 지역 검색을 마치려면 다음 원본도 불러오세요. 미검색 페이지에 다른 결과가 있을 수 있습니다. 제공기관의 기준일과 실제 영업 상태는 다를 수 있습니다.'};
}
