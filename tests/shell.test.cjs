const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
for(const s of scripts)new vm.Script(s[2]);
assert.ok(html.includes('Masumparvej_ post drafts'));
assert.ok(html.includes('rel="icon"') && html.includes('favicon.svg') && html.includes('type="image/svg+xml"'));
assert.ok(html.includes('favicon.png'));
const fav=fs.readFileSync('favicon.svg','utf8');
assert.ok(fav.includes('M2 8C5.47582 13.3333 18.5242 13.3333 22 8'));
assert.ok(fav.includes('prefers-color-scheme: dark'));
assert.ok(fs.existsSync('favicon.png'));assert.ok(html.includes('Unlock'));
assert.ok(!/signUp|signInWithPassword|type="email"|publishableKey|sb_secret_[A-Za-z0-9_-]{12,}/.test(html));
assert.ok(!/const ROWS\s*=\s*\[/.test(html));assert.ok(html.includes('type="text/plain" id="masum-private-ui"'));
const code=scripts.find(s=>s[2].includes('window.BoardSync ='))[2],local=new Map(),session=new Map(),server=new Map();let revoked=false;
function runtime(failure){
 const button={disabled:false},form={elements:{password:{value:'',type:'password'}},querySelector:()=>button},message={textContent:''},reveal={setAttribute(){}};
 const gate={style:{},querySelector:s=>s==='form'?form:s==='[data-show-password]'?reveal:message,remove(){},set innerHTML(v){}};
 const document={body:{appendChild(){}},createElement:()=>gate,getElementById:()=>({textContent:''})};
 const storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
 const fetch=async(url,opt={})=>{
  const route=url.split('/').pop().split('?')[0];const body=opt.body?JSON.parse(opt.body):{};
  if(failure==='network')throw new TypeError('fetch failed');
  if(failure)return {ok:false,status:failure,json:async()=>({error:'Invalid password'})};
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
 vm.runInContext(code,ctx);return {sync:window.BoardSync,form,message,reveal};
}
(async()=>{
 for(const [failure,expected] of [[429,/Too many/],[503,/temporarily unavailable/],['network',/Cannot reach/]]){const r=runtime(failure);r.form.elements.password.value='fixture';await r.form.onsubmit({preventDefault(){},currentTarget:r.form});assert.match(r.message.textContent,expected);assert.doesNotMatch(r.message.textContent,/Password did not match/);}
 let a=runtime();a.reveal.onclick();assert.equal(a.form.elements.password.type,'text');a.reveal.onclick();assert.equal(a.form.elements.password.type,'password');a.form.elements.password.value='wrong-fixture';await a.form.onsubmit({preventDefault(){},currentTarget:a.form});assert.match(a.message.textContent,/Password did not match/);assert.equal(session.size,0);assert.equal(a.form.elements.password.value,'');
 a.form.elements.password.value='fixture-test-not-real';await a.form.onsubmit({preventDefault(){},currentTarget:a.form});await a.sync.ready;await a.sync.init('2026-11-08');
 a.sync.storage.setItem('board-feedback-2026-11-08',JSON.stringify({'1-D':{copied:true},'2-V1':{needsWork:true}}));
 a.sync.storage.setItem('board-history-2026-11-08',JSON.stringify({'1':{u:[{label:'copy',snap:{}}],r:[]}}));
 assert.equal(local.get('siam-shared-session-v1'),'a'.repeat(64));
 assert.ok(!session.has('siam-shared-session-v1'));
 assert.ok(![...local.values(),...[...local.keys()]].some(v=>String(v).includes('fixture-test-not-real')));
 // Reload and a new tab / closed-browser return: sessionStorage empty, localStorage token reused, no password prompt.
 session.clear();
 const b=runtime();await b.sync.ready;await b.sync.init('2026-11-08');await b.sync.flush();
 assert.equal(local.get('siam-shared-session-v1'),'a'.repeat(64));
 assert.ok(!session.has('siam-shared-session-v1'));

 assert.equal(JSON.parse(b.sync.storage.getItem('board-feedback-2026-11-08'))['1-D'].copied,true);
 const k=JSON.stringify(['2026-11-08','feedback','1-D']);server.get(k).value.gem=true;
 b.sync.storage.setItem('board-feedback-2026-11-08',JSON.stringify({'1-D':{copied:true,needsWork:true},'2-V1':{needsWork:true}}));await b.sync.flush();
 assert.deepEqual(JSON.parse(b.sync.storage.getItem('board-feedback-2026-11-08'))['1-D'],{copied:true,gem:true,needsWork:true});
 assert.equal(JSON.parse(b.sync.storage.getItem('board-history-2026-11-08'))['1'].u.length,1);
 assert.ok([...local.keys()].every(k=>k.startsWith('siam:masum:shared-v1:')||k==='siam-shared-session-v1'||k==='siam-shared-expiry-v1'));
 assert.ok(html.includes('hg-approve-button') && html.includes('CheckIcon') && html.indexOf('hg-approve-button') < html.indexOf('I posted this'));
 assert.ok(html.includes('content:attr(data-label)'));
 assert.ok(html.includes('.hg-card-controls > button[data-label]:hover::after'));
 assert.ok(!html.includes('.hg-card-controls > button[title]:hover::after'));
 assert.ok(!html.includes('content:attr(title)'));
 for (const t of ['I posted this','Approved','Needs improvement (not disliked)','Hide','Edit']) assert.ok(html.includes('title:') && html.includes(t), t);
 assert.ok(html.includes('"data-label": g ? "Posted (click to unmark)" : "I posted this"'));
 assert.ok(html.includes('"data-label": a ? "Approved (click to unmark)" : "Approved"'));
 assert.ok(html.includes('"data-label": "Edit"') && html.includes('"aria-label": "Edit"'));
 assert.ok(!html.includes('title: "Edit"'));
 assert.ok(html.includes('hg-edit-button') && html.includes('PencilEdit02Icon') && html.includes('saveEdit') && html.includes('cancelEdit'));
 assert.ok(html.includes('Text cannot be empty.'));
 assert.ok(html.indexOf('hg-edit-button", "data-label": "Edit"') < html.indexOf('hg-approve-button", "data-label": a'));
 b.sync.storage.setItem('board-feedback-2026-11-08',JSON.stringify({'1-D':{copied:true,gem:true,needsWork:true,approved:true},'2-V1':{needsWork:true}})); await b.sync.flush();
 assert.equal(JSON.parse(b.sync.storage.getItem('board-feedback-2026-11-08'))['1-D'].approved,true);
 assert.equal(server.get(k).value.approved,true); assert.equal(server.get(k).value.gem,true);
 // Edit field merges independently; empty reject is UI-only; multiline persists; null clears.
 const edited='Hello\nworld & <x>';
 b.sync.storage.setItem('board-feedback-2026-11-08',JSON.stringify({'1-D':{copied:true,gem:true,needsWork:true,approved:true,edit:edited},'2-V1':{needsWork:true}})); await b.sync.flush();
 assert.equal(JSON.parse(b.sync.storage.getItem('board-feedback-2026-11-08'))['1-D'].edit,edited);
 assert.equal(server.get(k).value.edit,edited); assert.equal(server.get(k).value.approved,true);
 const cleared={'1-D':{copied:true,gem:true,needsWork:true,approved:true},'2-V1':{needsWork:true}};
 b.sync.storage.setItem('board-feedback-2026-11-08',JSON.stringify(cleared)); await b.sync.flush();
 assert.equal(server.get(k).value.edit,undefined); assert.equal(server.get(k).value.gem,true);
 const pencil=html.slice(html.indexOf('"PencilEdit02Icon"'), html.indexOf('], "Copy01"'));
 assert.ok(pencil.startsWith('"PencilEdit02Icon": [['));
 assert.ok(!pencil.startsWith('"PencilEdit02Icon": [[['));
 assert.equal([...pencil.matchAll(/"stroke": "currentColor"/g)].length, 2);
 assert.ok(html.includes('function collapse()') && html.includes('.hidden-row{') && html.includes('Unhide all') && html.includes("grid: '.hg-card-grid'") && html.includes('data-card-id') && !html.includes('hg-slot-parked') && !html.includes('allCardsParked') && !html.includes('allOutOfRow'));
 assert.ok(html.includes('function xPostUrl') && html.includes('xPostUrl(t.xUrl)') && html.includes('xPostUrl(cx.xUrl)'));
 assert.ok(html.includes('hg-forlater') && html.includes('"Bookmark02": [[') && !html.includes('Bookmark01Icon') && !html.includes('Open on X') && html.includes('board-forlater') && html.includes("kind: 'forlater'") && html.includes("scope: 'global'"));
 assert.ok(html.includes('laterButton(later, DATE, c, r, laterSaved, show)') && html.includes('laterChip(setLaterOpen)') && html.includes('"Saved in For later \\u2191"') && html.includes('"Nothing saved yet. Tap the bookmark on any card to keep it here."'));
 assert.ok(html.includes('ForLaterBox, { later, open: laterOpen, setOpen: setLaterOpen, fb, mark, applyEdit }'));
 assert.ok(html.includes('hg-forlater-actions') && html.includes('PencilEdit02Icon') && html.includes('function laterStamp'));
 assert.ok(html.includes('later.update(it.uid') && html.includes('toggleApproved') && html.includes('readFeedback'));
 assert.ok(html.includes('href: urlOf(it.text)') && html.includes('"Post on X"') && html.includes('className: "hg-post-link"'));

 { const css=html.slice(html.indexOf('const CSS = `'),html.indexOf('`;',html.indexOf('const CSS = `'))).replace(/\/\*[\s\S]*?\*\//g,''); assert.ok(css.includes('.hg-forlater{') && css.includes('.hg-later-chip{') && css.includes('.hg-card[data-later]')); }
 // For later snapshots sync as global masum_state rows; removal is a tombstone field, never a delete.
 const uid='2026-11-08:1-D', fl={version:1,items:{[uid]:{uid,cardId:'1-D',boardDate:'2026-11-08',slot:'1',label:'Draft',post:'P',type:'T',text:'snap',savedAt:100}}};
 b.sync.storage.setItem('board-forlater',JSON.stringify(fl));await b.sync.flush();
 const fk=JSON.stringify(['global','forlater',uid]); assert.equal(server.get(fk).value.text,'snap'); assert.equal(server.get(fk).value.savedAt,100);
 fl.items[uid]={...fl.items[uid],removedAt:101}; b.sync.storage.setItem('board-forlater',JSON.stringify(fl));await b.sync.flush();
 assert.equal(server.get(fk).value.removedAt,101); assert.equal(server.get(fk).value.text,'snap');
 assert.equal(JSON.parse(b.sync.storage.getItem('board-forlater')).items[uid].removedAt,101);
 b.sync.storage.setItem('board-feedback-2026-11-01',JSON.stringify({'3-V2':{approved:true,edit:'from later'}})); await b.sync.flush();
 assert.equal(server.get(JSON.stringify(['2026-11-01','feedback','3-V2'])).value.approved,true);
 assert.equal(server.get(JSON.stringify(['2026-11-01','feedback','3-V2'])).value.edit,'from later');
 const got=await b.sync.readFeedback('2026-11-01');
 assert.equal(got['3-V2'].approved,true);
 assert.ok(html.includes('hg-trend-link') && html.includes('View post on X') && html.includes('Tap (i) to open the X post'));
 assert.ok(!html.includes('href: t.url') && !html.includes('href: cx.url') && !html.includes('xPostUrl(t.url)') && !html.includes('xPostUrl(cx.url)'));
 // Prior sessionStorage sessions migrate into localStorage and are cleared from the tab store.
 session.clear();
 // Keep the durable token test already done; now seed only sessionStorage as a pre-upgrade browser.
 const keep=local.get('siam-shared-session-v1');
 local.delete('siam-shared-session-v1'); local.delete('siam-shared-expiry-v1');
 session.set('siam-shared-session-v1','a'.repeat(64));
 session.set('siam-shared-expiry-v1',String(Date.now()+86400000));
 const m=runtime(); await m.sync.ready;
 assert.equal(local.get('siam-shared-session-v1'),'a'.repeat(64));
 assert.ok(!session.has('siam-shared-session-v1'));
 assert.ok(html.includes('persist=window.localStorage') && html.includes('saveSession') && !html.includes('sessionStorage.setItem(\'siam-shared-session-v1\''));
console.log('PASS: password-only shell; no data or privileged keys; wrong password leaves locked; durable localStorage session across reload/new-tab/restart; sessionStorage migration; persistent outbox; independent field merges including approved+edit; history; isolated shared-board keys; Edit+Approved controls; hover titles.');
})().catch(e=>{console.error(e);process.exitCode=1;});
