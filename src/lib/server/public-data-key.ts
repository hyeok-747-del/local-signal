import {required} from './http.ts';
// Vercel CLI reserves PUBLIC_* for public config. DATA_API_KEY is its server Secret alias.
export function publicDataValue(env:Record<string,string|undefined>=process.env){return env.DATA_API_KEY?.trim()||env.PUBLIC_DATA_API_KEY?.trim()||'';}
export function publicDataKey(){return required(publicDataValue(),'공공 상가정보');}
