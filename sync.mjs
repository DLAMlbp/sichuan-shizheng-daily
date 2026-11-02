import fs from 'node:fs/promises';
const origin='https://sichuan-shizheng-daily.tianyiling675.chatgpt.site';
const root=new URL('./',import.meta.url);
async function get(route){const r=await fetch(origin+route,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`Source HTTP ${r.status}`);return r.json();}
const list=await get('/api/issues');
if(!Array.isArray(list)||!list.length)throw Error('No source editions');
const staged=[];
for(const item of list){
 if(!/^\d{4}-\d{2}-\d{2}(-sample)?$/.test(item.id))throw Error('Invalid issue id');
 const issue=await get('/api/issues?id='+item.id);
 if(issue.id!==item.id||!issue.articles?.length)throw Error('Invalid issue');
 staged.push([item.id+'.json',issue]);
}
const status=await get('/api/status');
let old=[];try{old=JSON.parse(await fs.readFile(new URL('index.json',root),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const merged=new Map(old.map(i=>[i.id,i]));for(const item of list)merged.set(item.id,item);
const ordered=[...merged.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.edition.localeCompare(b.edition));
staged.push(['index.json',ordered],['status.json',status]);
// Finish network validation before changing the published snapshot. Do not delete old editions.
await fs.mkdir(root,{recursive:true});for(const [name,value] of staged)await fs.writeFile(new URL(name,root),JSON.stringify(value));
console.log(`Snapshot ready: ${ordered.length} archived editions`);
