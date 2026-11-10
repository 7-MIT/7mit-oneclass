/* OneClass.7MIT — sesi akun.7mit bersama untuk halaman masuk, callback Google, TrustLayer, dan ruang kerja. */
(function(){
  var C=window.ONECLASS_CONFIG||{},KEY='kelas7mit_persistent_account_session_v1',TL='oneclass_trustlayer_v1',STORAGE='k7_google_supabase_oneclass',INTENT='k7_google_oauth_intent_v1';
  var UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function read(){
    try{var v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&UUID.test(String(v.token||''))&&v.profile)return v}catch(e){}
    return null;
  }
  function save(token,profile){
    var p=profile||{};
    localStorage.setItem(KEY,JSON.stringify({token:token,profile:{account_key:p.account_key||'',username:p.username||'',display_name:p.display_name||'',role:p.role||'',account_type:p.account_type||''},saved_at:Date.now()}));
  }
  function clear(){try{localStorage.removeItem(KEY)}catch(e){}try{sessionStorage.removeItem(TL)}catch(e){}}
  function headers(token){
    var h={'Content-Type':'application/json',apikey:C.anonKey,Authorization:'Bearer '+C.anonKey};
    if(token)h['x-7mit-session']=token;return h;
  }
  async function call(fn,body,token){
    var r=await fetch(C.functionsUrl+'/'+fn,{method:'POST',headers:headers(token),body:JSON.stringify(body||{}),cache:'no-store'});
    var raw=await r.text(),d={};try{d=raw?JSON.parse(raw):{}}catch(e){}
    return{ok:r.ok&&d.ok!==false,status:r.status,data:d};
  }
  function akun(body){return call('akun-auth',body)}
  async function trustSession(token){
    var r=await call('trustlayer-api',{action:'session'},token);
    if(!r.ok)throw new Error(r.data.message||'TrustLayer tidak menjawab.');
    return r.data;
  }
  function keepTrust(tl){try{sessionStorage.setItem(TL,JSON.stringify({mode:tl.mode,manager:!!tl.manager,permissions:tl.permissions||[],expected_app_version:tl.expected_app_version||'',rules_version:tl.rules_version||'',at:Date.now()}))}catch(e){}}
  function trust(){try{return JSON.parse(sessionStorage.getItem(TL)||'null')}catch(e){return null}}
  function homeFor(mode){return '/app/'+mode+'/'}
  async function googleClient(){
    var m=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    return m.createClient(C.supabaseUrl,C.anonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,flowType:'pkce',storageKey:STORAGE}});
  }
  async function startGoogle(){
    var c=await googleClient();
    try{sessionStorage.setItem(INTENT,JSON.stringify({mode:'login',expected:'oneclass',at:Date.now()}))}catch(e){}
    var r=await c.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/auth/callback',scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
    if(r.error)throw r.error;
    if(r.data&&r.data.url)location.assign(r.data.url);
  }
  async function logout(){var s=read();if(s){try{await akun({action:'logout',token:s.token})}catch(e){}}clear()}
  window.OneClassSession={read:read,save:save,clear:clear,akun:akun,call:call,trustSession:trustSession,keepTrust:keepTrust,trust:trust,homeFor:homeFor,googleClient:googleClient,startGoogle:startGoogle,logout:logout,STORAGE:STORAGE,INTENT:INTENT};
})();
