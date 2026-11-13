import {isBusiness,type Business} from './business.ts';

export const discoveryKey='local-insight:discoveries:v1';
export type SearchScope={province:string;district:string;keyword:string;name?:string;address?:string;category?:string};
export type DiscoveryHistory={firstSeen:Record<string,string>;scopes:Record<string,string[]>};
export type DiscoveryResult={history:DiscoveryHistory;newIds:string[];baseline:boolean};
export function scopeKey(scope:SearchScope){const clean=(s='')=>s.trim().toLocaleLowerCase().replace(/\s+/g,' ');const base=[scope.province,scope.district,clean(scope.keyword)];return JSON.stringify([...(scope.name||scope.address||scope.category?[...base,clean(scope.name),clean(scope.address),clean(scope.category)]:base)]);}
export function emptyHistory():DiscoveryHistory{return {firstSeen:{},scopes:{}};}
export function readHistory(raw:string|null):DiscoveryHistory{
 if(!raw)return emptyHistory();const value:unknown=JSON.parse(raw);if(!value||typeof value!=='object')throw new Error('invalid history');
 const root=value as Record<string,unknown>;if(!root.firstSeen||typeof root.firstSeen!=='object'||!root.scopes||typeof root.scopes!=='object')throw new Error('invalid history');
 const firstSeen=Object.fromEntries(Object.entries(root.firstSeen).filter(([id,date])=>id.startsWith('public-')&&typeof date==='string'&&Number.isFinite(Date.parse(date))));
 const scopes=Object.fromEntries(Object.entries(root.scopes).filter(([,ids])=>Array.isArray(ids)&&ids.every(id=>typeof id==='string'&&id.startsWith('public-'))));
 return {firstSeen:firstSeen as Record<string,string>,scopes:scopes as Record<string,string[]>};
}
export function recordDiscoveries(history:DiscoveryHistory,scope:SearchScope,items:Business[],baselineIds:string[]|null,now=new Date()):DiscoveryResult{
 const key=scopeKey(scope),baseline=baselineIds===null,valid=items.filter(b=>isBusiness(b)&&b.source==='public-data'),newIds=baseline?[]:valid.filter(b=>!baselineIds.includes(b.id)).map(b=>b.id);
 const firstSeen={...history.firstSeen};for(const b of valid)if(!firstSeen[b.id])firstSeen[b.id]=now.toISOString();
 // Keep every previously observed ID; partial searches must not make old businesses look new later.
 const merged=[...new Set([...(history.scopes[key]||[]),...valid.map(b=>b.id)])];
 return {history:{firstSeen,scopes:{...history.scopes,[key]:merged}},newIds:[...new Set(newIds)],baseline};
}
