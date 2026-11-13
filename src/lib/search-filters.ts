import type {Business} from './business.ts';
import type {SearchFilters} from './contracts.ts';
export function matchesSearch(b:Business,input:SearchFilters&{keyword:string}){const match=(value:string,query='')=>query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).every(t=>value.toLocaleLowerCase().includes(t));return match(`${b.name} ${b.category} ${b.province} ${b.district} ${b.address}`,input.keyword)&&match(b.name,input.name)&&match(b.address,input.address)&&match(b.category,input.category);}
