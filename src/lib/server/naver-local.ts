import {plainText,safeUrl} from './blog.ts';
import {hubRequest,type HubCredentials} from './naver-hub.ts';
import {record,ServiceError,str,type Fetcher} from './provider.ts';

export async function searchLocal(query:string,credentials:HubCredentials,fetcher?:Fetcher){
 const root=await hubRequest('/search/v1/local',credentials,{query:{query,display:'5',start:'1',sort:'random',format:'json'}},fetcher);
 if(!Array.isArray(root.items)||!Number.isFinite(Number(root.total)))throw new ServiceError('INVALID_RESPONSE','NAVER API HUB 지역 검색 응답 형식이 올바르지 않습니다.');
 return {source:'naver-api-hub',query,items:root.items.map(record).map(r=>({name:plainText(r.title),category:plainText(r.category),address:plainText(r.roadAddress||r.address),url:safeUrl(r.link),mapx:str(r.mapx),mapy:str(r.mapy)})),warning:'네이버 지역 검색에서 확인된 최대 5개 결과입니다. 전체 지역 업체 목록이나 위치 반경 검색이 아니며 다음 페이지는 제공하지 않습니다. 지도 좌표는 실제 응답 형식 확인 후 변환합니다.'};
}
