export type KakaoPoint=object;
export type KakaoMap={panTo:(point:KakaoPoint)=>void;setBounds:(bounds:object)=>void;setCenter:(point:KakaoPoint)=>void;setLevel:(level:number)=>void;relayout:()=>void;addControl:(control:object,position:unknown)=>void};
export type KakaoMarker={setMap:(map:KakaoMap|null)=>void};
export type KakaoMaps={load:(ready:()=>void)=>void;Map:new(element:HTMLElement,options:object)=>KakaoMap;LatLng:new(lat:number,lng:number)=>KakaoPoint;LatLngBounds:new()=>{extend:(point:KakaoPoint)=>void};Marker:new(options:object)=>KakaoMarker;ZoomControl:new()=>object;ControlPosition:{RIGHT:unknown};event:{addListener:(target:object,name:string,handler:()=>void)=>void;removeListener:(target:object,name:string,handler:()=>void)=>void}};
declare global{interface Window{kakao?:{maps:KakaoMaps}}}
let pending:Promise<KakaoMaps>|undefined;
export function loadKakaoMaps(key:string):Promise<KakaoMaps>{
 if(window.kakao?.maps?.Map)return Promise.resolve(window.kakao.maps);
 if(pending)return pending;
 pending=new Promise<KakaoMaps>((resolve,reject)=>{const script=document.createElement('script');let settled=false;const fail=()=>{if(settled)return;settled=true;clearTimeout(timeout);script.remove();pending=undefined;reject(new Error('카카오맵을 연결하지 못했습니다. JavaScript 키·카카오맵 사용 설정·허용 도메인·네트워크를 확인하세요.'));};const timeout=setTimeout(fail,15000);
  script.src=`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;script.async=true;script.onerror=fail;script.onload=()=>{try{if(!window.kakao?.maps?.load){fail();return;}window.kakao.maps.load(()=>{if(settled)return;if(!window.kakao?.maps?.Map){fail();return;}settled=true;clearTimeout(timeout);resolve(window.kakao.maps);});}catch{fail();}};document.head.appendChild(script);
 });return pending;
}
