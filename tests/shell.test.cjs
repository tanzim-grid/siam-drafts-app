const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
for(const s of scripts)new vm.Script(s[2]);
assert.ok(html.includes('Siam drafts'));assert.ok(html.includes('Unlock'));
assert.ok(!/signUp|signInWithPassword|type="email"|publishableKey|sb_secret_[A-Za-z0-9_-]{12,}/.test(html));
assert.ok(!/const ROWS\s*=\s*\[/.test(html));assert.ok(html.includes('type="text/plain" id="masum-private-ui"'));
const code=scripts.find(s=>s[2].includes('window.BoardSync ='))[2],local=new Map(),session=new Map(),server=new Map();let revoked=false;
function runtime(){
 const button={disabled:false},form={elements:{password:{value:''}},querySelector:()=>button};
 const gate={style:{},querySelector:s=>s==='form'?form:{textContent:'',onclick:null},remove(){},set innerHTML(v){}};
 const document={body:{appendChild(){}},createElement:()=>gate,getElementById:()=>({textContent:''})};
 const storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
 const fetch=async(url,opt={})=>{
  const route=url.split('/').pop().split('?')[0];const body=opt.body?JSON.parse(opt.body):{};
  let status=200,data={};const authorized=opt.headers.Authorization==='Bearer '+'a'.repeat(64)&&!revoked;
  if(route==='login'){if(body.password==='fixture-test-not-real'){revoked=false;data={token:'a'.repeat(64),expires_at:new Date(Date.now()+43200000).toISOString()};}else{status=401;data={error:'Invalid password'};}}
  else if(!authorized){status=401;data={error:'Password required'};}
  else if(route==='batch')data={DATE:'2026-11-08',ROWS:Array.from({length:5},()=>({}))};
  else if(route==='state')data=[...server.values()].map(x=>structuredClone(x));
  else if(route==='event'){const k=JSON.stringify([body.day,body.kind,body.item]);const r=server.get(k)||{day:body.day,kind:body.kind,item:body.item,value:{}};for(const[f,v]of Object.entries(body.patch))if(v===null)delete r.value[f];else r.value[f]=v;server.set(k,r);data={ok:true};}
  else if(route==='logout'){revoked=true;data={ok:true};}
  return {ok:status===200,status,json:async()=>data};
 };
 const window={localStorage:storage(local),sessionStorage:storage(session),addEventListener(){},dispatchEvent(){}};
 const ctx=vm.createContext({window,document,fetch,navigator:{onLine:true},location:{href:'https://tanzim-grid.github.io/siam-drafts-app/?date=2026-11-08',reload(){}},URL,crypto:webcrypto,Event:class{},setTimeout:()=>1,clearTimeout(){},setInterval(){}});
 vm.runInContext(code,ctx);return {sync:window.BoardSync,form};
}
(async()=>{
 let a=runtime();a.form.elements.password.value='wrong-fixture';await a.form.onsubmit({preventDefault(){},currentTarget:a.form});assert.equal(session.size,0);assert.equal(a.form.elements.password.value,'');
 a.form.elements.password.value='fixture-test-not-real';await a.form.onsubmit({preventDefault(){},currentTarget:a.form});await a.sync.ready;await a.sync.init('2026-11-08');
 a.sync.storage.setItem('board-feedback-2026-11-08',JSON.stringify({'1-D':{copied:true},'2-V1':{needsWork:true}}));
 a.sync.storage.setItem('board-history-2026-11-08',JSON.stringify({'1':{u:[{label:'copy',snap:{}}],r:[]}}));
 // A reload reuses opaque session, durable outbox and shared namespace.
 const b=runtime();await b.sync.ready;await b.sync.init('2026-11-08');await b.sync.flush();
 assert.equal(JSON.parse(b.sync.storage.getItem('board-feedback-2026-11-08'))['1-D'].copied,true);
 const k=JSON.stringify(['2026-11-08','feedback','1-D']);server.get(k).value.gem=true;
 b.sync.storage.setItem('board-feedback-2026-11-08',JSON.stringify({'1-D':{copied:true,needsWork:true},'2-V1':{needsWork:true}}));await b.sync.flush();
 assert.deepEqual(JSON.parse(b.sync.storage.getItem('board-feedback-2026-11-08'))['1-D'],{copied:true,gem:true,needsWork:true});
 assert.equal(JSON.parse(b.sync.storage.getItem('board-history-2026-11-08'))['1'].u.length,1);
 assert.ok([...local.keys()].every(k=>k.startsWith('siam:masum:shared-v1:')));
 console.log('PASS: password-only shell; no data or privileged keys; wrong password leaves locked; opaque-session reload; persistent outbox; independent field merges; history; isolated shared-board keys.');
})().catch(e=>{console.error(e);process.exitCode=1;});
