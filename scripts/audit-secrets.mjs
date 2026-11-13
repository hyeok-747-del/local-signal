import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const values=[];
try{
 for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){
  const match=line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if(!match)continue;
  let value=match[2];
  if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
  else value=value.replace(/\s+#.*$/,'').trim();
  if(value.length>=8)values.push(...new Set([value,encodeURIComponent(value)]));
 }
}catch(error){if(error.code!=='ENOENT')throw new Error('Cannot read local environment for audit.');}
const findings=[];
function scan(label,text){
 if(values.some(value=>text.includes(value)))findings.push({path:label,reason:'local credential match'});
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/.test(text))findings.push({path:label,reason:'credential pattern'});
 if(/(?:api[_-]?key|client[_-]?(?:secret|id)|password|access[_-]?token)\s*[=:]\s*['"][A-Za-z0-9+/_=-]{28,}['"]/i.test(text))findings.push({path:label,reason:'credential assignment'});
}
const files=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
for(const file of files){if(file==='.env.local'||file.startsWith('node_modules/')||file.startsWith('.next/')){findings.push({path:file,reason:'private/generated file would be uploaded'});continue;}scan(file,readFileSync(file,'utf8'));}
const objects=git('cat-file','--batch-all-objects','--batch-check=%(objecttype) %(objectname)').split(/\r?\n/).filter(Boolean);
let blobs=0;
for(const line of objects){const [type,hash]=line.split(' ');if(type==='blob'){blobs++;scan(`git-blob:${hash}`,git('cat-file','blob',hash));}}
console.log(JSON.stringify({candidateFiles:files.length,localValuesChecked:values.length,gitBlobsChecked:blobs,findings},null,2));
if(findings.length)process.exitCode=1;
