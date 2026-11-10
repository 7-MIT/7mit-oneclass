/* TrustLayer di dalam ruang kerja OneClass: memeriksa apakah antarmuka sesuai aturan peran, lalu melapor ke server.
   Server tetap yang menegakkan izin; skrip ini tidak memblokir apa pun. */
(function(){
  var S=window.OneClassSession,C=window.ONECLASS_CONFIG,M=window.K7_ONECLASS;
  if(!S||!C||!M)return;
  var sess=S.read();if(!sess)return;
  var SKIP={dues:1,class_data:1,trustlayer:1};
  function visible(el){
    if(!el||el.hidden)return false;
    var cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden';
  }
  async function report(items){
    if(!items.length)return;
    try{await S.call('trustlayer-api',{action:'report_access',mode:M.mode,app_version:C.appVersion,items:items.slice(0,30)},sess.token)}catch(e){}
  }
  function addManagerLink(){
    var nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-oc-link]'))return;
    var b=document.createElement('button');b.type='button';b.setAttribute('data-oc-link','/trustlayer/');
    b.innerHTML='<span class="nav-icon"><i data-lucide="shield-check"></i></span>TrustLayer';
    b.addEventListener('click',function(){location.href='/trustlayer/'});
    nav.appendChild(b);try{window.lucide&&window.lucide.createIcons&&window.lucide.createIcons()}catch(e){}
  }
  async function init(){
    var tl=S.trust();
    if(!tl){try{tl=await S.trustSession(sess.token);S.keepTrust(tl)}catch(e){return}}
    if(tl.manager)addManagerLink();
    var nav=document.getElementById('nav');if(!nav)return;
    var items=[];
    (tl.permissions||[]).forEach(function(p){
      if(p.action!=='view'||p.ownership!=='own'||SKIP[p.resource])return;
      items.push({resource:p.resource,action:'view',ownership:'own',observed_allowed:visible(nav.querySelector('[data-page="'+p.resource+'"]'))});
    });
    report(items);
    nav.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('[data-page]');if(!b)return;
      report([{resource:b.getAttribute('data-page'),action:'view',ownership:'own',observed_allowed:true}]);
    });
  }
  function start(){setTimeout(init,2500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
