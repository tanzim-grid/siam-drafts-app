const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
for(const s of scripts)new vm.Script(s[2]);
assert.equal((html.match(/const \{ DATE, DATE_LABEL, ROWS, RATINGS, TRENDING, CONTEXT \} = window.MASUM_BATCH;/g)||[]).length,1);
assert.ok(!/const ROWS\s*=\s*\[/.test(html));assert.ok(!/sb_secret_|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(html));
assert.ok(html.includes('Siam drafts'));assert.ok(html.includes('data-signup'));assert.ok(html.includes("flowType: 'pkce'"));
assert.ok(html.includes('emailRedirectTo:redirect.href'));assert.ok(html.includes("searchParams.get('date')"));
const sync=scripts.find(s=>s[2].includes('window.BoardSync ='))[2];
const loader=scripts.find(s=>s[2].includes('window.MASUM_BATCH = await'))[2];
async function run(member) {
 const queries=[],appends=[],buttons=[{disabled:false},{disabled:false},{disabled:false}],listeners={};
 const form={elements:{email:{value:'reviewer@example.invalid'},password:{value:'not-a-real-password'}},querySelector:()=>buttons[0],querySelectorAll:()=>buttons,reportValidity:()=>true};
 const gate={style:{},querySelector:s=>s==='form'?form:s==='[data-signup]'?buttons[1]:s==='[data-signout]'?buttons[2]:{textContent:''},remove(){},set innerHTML(v){}};
 const document={body:{appendChild:e=>appends.push(e)},createElement:()=>gate,getElementById:id=>({textContent:id==='masum-private-ui'?'/* deferred UI */':''})};
 const client={auth:{getSession:async()=>({data:{session:member===null?null:{user:{id:'synthetic-id',email:'reviewer@example.invalid'}}}}),onAuthStateChange(){},signOut:async()=>{},signUp:async a=>{assert.ok(a.options.emailRedirectTo.endsWith('?date=2026-11-08'));return{data:{session:null}};}},from(table){queries.push(table);return{select(){return this;},eq(){return this;},order(){return this;},limit(){return this;},maybeSingle:async()=>({data:table==='masum_members'?(member?{user_id:'synthetic-id'}:null):{payload:{DATE:'2026-11-08',ROWS:Array.from({length:5},()=>Object.fromEntries(['Draft',...Array.from({length:10},(_,i)=>'Variant '+(i+1))].map(k=>[k,'synthetic fixture'])))}}})};}};
 const window={supabase:{createClient:()=>client},localStorage:{getItem:()=>null},addEventListener(){}};
 const ctx=vm.createContext({window,document,location:{href:'https://example.invalid/siam/?date=2026-11-08',reload(){}},URL,crypto:require('node:crypto').webcrypto,Event:class{},setTimeout:()=>1,clearTimeout(){},setInterval(){}});
 vm.runInContext(sync,ctx);ctx.BoardSync=window.BoardSync;vm.runInContext(loader,ctx);
 await new Promise(r=>setImmediate(r)); await new Promise(r=>setImmediate(r));
 if(member!==true) assert.ok(!queries.includes('masum_batches'),'anonymous/nonmember must never fetch batch');
 else assert.ok(queries.includes('masum_batches'),'approved member can fetch batch');
 if(member===null) {await buttons[1].onclick();assert.ok(!queries.includes('masum_batches'),'signup never auto-grants membership');}
}
(async()=>{await run(null);await run(false);await run(true);console.log('PASS: scripts parse, no embedded ROWS/JWT/secret, signup callback date preserved, anonymous/nonmember batch reads absent, member read permitted in mock, signup never grants membership.');})().catch(e=>{console.error(e);process.exitCode=1;});
