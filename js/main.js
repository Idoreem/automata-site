(function(){
  var CAL="https://cal.com/ido-reem/שיחת-אפיון-לעסק-שלך";
  var WA="https://wa.me/972544354411?text="+encodeURIComponent("היי, הגעתי דרך האתר ואשמח לשמוע על פתרונות AI ואוטומציה לעסק שלי");
  document.querySelectorAll("[data-cal]").forEach(function(a){a.href=CAL;a.target="_blank";a.rel="noopener"});
  document.querySelectorAll("[data-wa]").forEach(function(a){a.href=WA;a.target="_blank";a.rel="noopener"});
  var y=document.getElementById("yr"); if(y) y.textContent=new Date().getFullYear();

  // navbar glass on scroll
  var nav=document.getElementById("nav");
  var onScroll=function(){ if(window.scrollY>24) nav.classList.add("scrolled"); else nav.classList.remove("scrolled"); };
  onScroll(); window.addEventListener("scroll",onScroll,{passive:true});

  // mobile menu → simple anchor reveal
  var mb=document.getElementById("menuBtn");
  if(mb){ mb.addEventListener("click",function(){
    var links=document.querySelector(".nav-links");
    var open=links.style.display==="flex";
    links.style.display=open?"":"flex";
    if(!open){links.style.position="absolute";links.style.flexDirection="column";links.style.insetInlineEnd="20px";links.style.insetBlockStart="64px";links.style.background="var(--glass-bg)";links.style.backdropFilter="blur(16px)";links.style.padding="10px";links.style.borderRadius="14px";links.style.border="1px solid var(--glass-bd)";links.style.boxShadow="var(--shadow-md)";}
    mb.setAttribute("aria-expanded",String(!open));
  }); }

  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // reveal on scroll
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}})},{threshold:.16,rootMargin:"0px 0px -8% 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){io.observe(el)});

  // count-up
  var sn=document.getElementById("statNum");
  if(sn){
    var done=false;
    var cio=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting&&!done){done=true;
        var t=+sn.dataset.target, d=1400, s=null;
        if(reduce){sn.textContent=t;return;}
        function step(ts){if(!s)s=ts;var p=Math.min((ts-s)/d,1);var e=1-Math.pow(1-p,3);sn.textContent=Math.round(e*t);if(p<1)requestAnimationFrame(step);else sn.textContent=t;}
        requestAnimationFrame(step);
      }})},{threshold:.5});
    cio.observe(sn);
  }

  // sequenced bubbles / flow rows
  function sequence(sel,childSel,gap){
    var host=document.querySelector(sel); if(!host)return;
    var items=host.querySelectorAll(childSel);
    var sio=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){ items.forEach(function(it,i){ setTimeout(function(){it.classList.add("show")}, reduce?0:i*gap); }); sio.unobserve(e.target);} })},{threshold:.4});
    sio.observe(host);
  }
  sequence("#tgPhone",".bub",520);
  sequence("#opsFlow",".flow-row,.flow-arrow",300);

  // hero signal paths — build + animate
  var svg=document.getElementById("heroPaths");
  if(svg){
    var W=1440,H=640;
    var paths=[
      "M-40,150 C 300,60 560,300 900,180 S 1360,120 1520,240",
      "M-40,360 C 320,300 620,470 980,360 S 1380,320 1520,420",
      "M-40,540 C 360,520 640,600 1020,520 S 1400,540 1520,560"
    ];
    var ns="http://www.w3.org/2000/svg";
    paths.forEach(function(d,i){
      var p=document.createElementNS(ns,"path");
      p.setAttribute("d",d); p.setAttribute("class","spath"+(reduce?"":" draw"));
      p.setAttribute("stroke", i===1?"var(--cyan)":"var(--brand-400)");
      p.setAttribute("stroke-width", i===1?"2.2":"1.6");
      p.setAttribute("opacity", i===1?"0.55":"0.32");
      svg.appendChild(p);
      var len=p.getTotalLength(); p.style.setProperty("--len",len);
      if(!reduce){
        // moving pulse along the path
        var dot=document.createElementNS(ns,"circle");
        dot.setAttribute("r", i===1?"4":"3"); dot.setAttribute("class","pulse pulse-move");
        svg.appendChild(dot);
        (function(path,circle,dur,delay){
          var start=null;
          function move(ts){ if(!start)start=ts+delay; var el=Math.max(0,ts-start); var t=(el%dur)/dur; var pt=path.getPointAtLength(t*len); circle.setAttribute("cx",pt.x); circle.setAttribute("cy",pt.y); circle.setAttribute("opacity", t<0.04||t>0.96?0:0.9); requestAnimationFrame(move); }
          requestAnimationFrame(move);
        })(p,dot, 5200+i*1400, i*900);
      }
    });
  }
})();
