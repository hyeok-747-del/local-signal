import type { Business } from './business.ts';
export type ApiError = { error: { code: string; message: string } };
export type SearchFilters={name?:string;address?:string;category?:string};
export type SearchResult = { items: Business[]; source: 'public-data'; providerPage: number; scanned: number; total: number; hasMore: boolean; warning: string; emptyReason?:'NO_REGIONAL_DATA'|'NO_MATCH_IN_PAGE'|'EMPTY_PAGE'|null; matchedInPage?:number; dataPeriod?:string };
export type BlogPost = { title: string; description: string; url: string; blogger: string; date: string };
export type BlogResult = { items: BlogPost[]; query: string; reportedTotal: number; start: number; nextStart: number | null; warning: string };
export type IntegrationStatus = { publicData: boolean; naverBlog: boolean; maps: boolean; openai?:boolean; searchAd?:boolean };
export type District = { code: string; name: string };
export const provinceCodes: Record<string,string> = {'서울특별시':'11','부산광역시':'26','대구광역시':'27','인천광역시':'28','광주광역시':'29','대전광역시':'30','울산광역시':'31','세종특별자치시':'36','경기도':'41','강원특별자치도':'51','충청북도':'43','충청남도':'44','전북특별자치도':'52','전라남도':'46','경상북도':'47','경상남도':'48','제주특별자치도':'50'};
