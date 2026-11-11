/* OneClass.7MIT — gerak dan interaksi (tanpa pustaka). Aman bila gagal: elemen tetap terlihat. */
(function(){
  var root=document.documentElement,mq=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced(){return !!(mq&&mq.matches)||root.classList.contains('k7-reduce')}
  function syncReduce(){root.classList.toggle('oc-reduce',reduced())}
  syncReduce();if(mq&&mq.addEventListener)mq.addEventListener('change',syncReduce);
  try{new MutationObserver(function(){syncReduce()}).observe(root,{attributes:true,attributeFilter:['class']})}catch(e){}
  root.classList.add('oc-js');
  var fine=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---- muncul bertahap (hanya elemen halaman baru) ---- */
  var RV='.oc-reveal,.m7-card:not(.oc-static),.m7-stat,.m7-li,.m7-alert,.tl-hero,.tl-top';
  var io=null,seen=new WeakSet();
  function reveal(el){
    if(seen.has(el))return;seen.add(el);
    var sib=el.parentElement?Array.prototype.filter.call(el.parentElement.children,function(c){return c.matches&&c.matches(RV)}):[el];
    var i=Math.max(0,sib.indexOf(el));el.style.setProperty('--oc-d',Math.min(i*0.06,0.5)+'s');
    el.classList.add('oc-rv');
    if(reduced()||!('IntersectionObserver' in window)){el.classList.add('oc-in');return}
    io=io||new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('oc-in');io.unobserve(e.target);countIn(e.target)}})},{threshold:.08,rootMargin:'0px 0px -4% 0px'});
    io.observe(el);
  }
  function scan(scope){(scope.querySelectorAll?scope.querySelectorAll(RV):[]).forEach(reveal);if(scope.matches&&scope.matches(RV))reveal(scope)}

  /* ---- hitung naik angka ---- */
  var NUM=/^(Rp\s?)?(\d{1,3}(?:\.\d{3})+|\d+)$/;
  function fmt(n,rp){var s=Math.round(n).toLocaleString('id-ID');return (rp||'')+s}
  function countEl(el){
    if(reduced()||el.__oc)return;var t=(el.textContent||'').trim(),m=NUM.exec(t);if(!m)return;
    var target=parseInt(m[2].replace(/\./g,''),10);if(!isFinite(target)||target<2||target>1e12)return;
    el.__oc=true;var rp=m[1]||'',start=performance.now(),dur=Math.min(1200,500+Math.log10(target+1)*160),last=null;
    (function step(now){
      if(last!==null&&el.textContent!==last){return}              // aplikasi mengubah angka: berhenti, jangan menimpa
      var p=Math.min(1,(now-start)/dur),e=1-Math.pow(1-p,3);
      var v=p>=1?t:fmt(target*e,rp);el.textContent=v;last=v;
      if(p<1)requestAnimationFrame(step);
    })(start);
  }
  function countIn(scope){(scope.querySelectorAll?scope.querySelectorAll('.m7-stat-figure,.stat-value,.summary-box .money,.oc-count'):[]).forEach(countEl);if(scope.matches&&scope.matches('.m7-stat-figure,.stat-value,.oc-count'))countEl(scope)}

  /* ---- miring dan cahaya mengikuti kursor ---- */
  function tilt(){
    if(!fine)return;
    var TL='.m7-stat,.stat,.summary-box';
    document.addEventListener('pointermove',function(e){
      if(reduced())return;var el=e.target.closest&&e.target.closest(TL);if(!el)return;
      var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      el.style.setProperty('--ry',(x*7).toFixed(2)+'deg');el.style.setProperty('--rx',(-y*7).toFixed(2)+'deg');
    },{passive:true});
    document.addEventListener('pointerout',function(e){var el=e.target.closest&&e.target.closest(TL);if(el&&!el.contains(e.relatedTarget)){el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')}},{passive:true});
  }

  /* ---- riak pada tombol ---- */
  function ripple(){
    document.addEventListener('pointerdown',function(e){
      if(reduced())return;var b=e.target.closest&&e.target.closest('.m7-btn:not(:disabled)');if(!b)return;
      var r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('span');
      s.className='oc-ripple';s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
      b.appendChild(s);setTimeout(function(){s.remove()},650);
    },{passive:true});
  }

  /* ---- konfeti (marun, peach, krem, emas — emas khusus perayaan) ---- */
  function confetti(opts){
    if(reduced())return;opts=opts||{};
    var c=document.createElement('canvas');c.className='oc-confetti';c.setAttribute('aria-hidden','true');document.body.appendChild(c);
    var ctx=c.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=c.width=innerWidth*dpr,H=c.height=innerHeight*dpr;
    var colors=['#7a1424','#a01d2d','#e9b8a0','#ffe3d2','#f3b04a'],n=opts.count||110,ox=(opts.x==null?.5:opts.x)*W,oy=(opts.y==null?.35:opts.y)*H,P=[];
    for(var i=0;i<n;i++){var a=Math.random()*Math.PI*2,v=(6+Math.random()*9)*dpr;P.push({x:ox,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-5*dpr,w:(6+Math.random()*7)*dpr,h:(3+Math.random()*5)*dpr,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:colors[i%colors.length],life:1})}
    var t0=performance.now();
    (function f(now){
      var el=now-t0;ctx.clearRect(0,0,W,H);var alive=0;
      P.forEach(function(p){p.vy+=.28*dpr;p.vx*=.992;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life=Math.max(0,1-el/2600);if(p.life>0&&p.y<H+40){alive++;ctx.save();ctx.globalAlpha=p.life;ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()}});
      if(alive&&el<2800)requestAnimationFrame(f);else c.remove();
    })(t0);
  }

  function init(){
    scan(document);countIn(document);tilt();ripple();
    try{new MutationObserver(function(ms){var q=false;ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)q=true})});if(q)requestAnimationFrame(function(){scan(document)})}).observe(document.body,{childList:true,subtree:true})}catch(e){}
    setTimeout(function(){document.querySelectorAll('.oc-rv:not(.oc-in)').forEach(function(el){el.classList.add('oc-in')})},3000);   // jaring pengaman
  }
  window.OneClassMotion={confetti:confetti,count:countIn,reveal:scan,reduced:reduced};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
