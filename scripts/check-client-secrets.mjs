import {readFileSync,readdirSync} from 'node:fs';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
const names=['PUBLIC_DATA_API_KEY','DATA_API_KEY','NAVER_API_HUB_CLIENT_ID','NAVER_API_HUB_CLIENT_SECRET','OPENAI_API_KEY','NAVER_AD_API_KEY','NAVER_AD_SECRET_KEY'];
const values=names.map(n=>process.env[n]?.trim()).filter(v=>v&&v.length>=8),hits=[];let checked=0;
function scan(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())scan(path);else if(/\.(?:js|json|css|map)$/.test(entry.name)){checked++;const text=readFileSync(path,'utf8');if(values.some(v=>text.includes(v)||text.includes(encodeURIComponent(v))))hits.push(path);}}}
scan('.next/static');console.log(JSON.stringify({browserAssetsChecked:checked,credentialMatches:hits}));if(hits.length)process.exitCode=1;
