(()=>{"use strict";
const KEY="yatrio_visit_reminder_seen_v1";
try{if(sessionStorage.getItem(KEY))return;sessionStorage.setItem(KEY,"1");}catch(e){}
const css=`
#yatrio-visit-reminder{position:fixed;z-index:9999;left:18px;bottom:18px;width:min(390px,calc(100vw - 36px));background:#102a43;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:16px 48px 16px 17px;box-shadow:0 18px 48px rgba(7,26,41,.28);font:14px/1.5 Arial,sans-serif;animation:yatrioReminderIn .35s ease-out}
#yatrio-visit-reminder strong{display:block;font-size:15px;margin-bottom:4px;letter-spacing:.1px}
#yatrio-visit-reminder p{margin:0;color:#d5e6eb;font-size:13px}
#yatrio-visit-reminder .yr-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
#yatrio-visit-reminder a{display:inline-block;text-decoration:none;border-radius:8px;padding:8px 11px;font-weight:700;font-size:12px;background:#18a999;color:#fff}
#yatrio-visit-reminder a.yr-secondary{background:rgba(255,255,255,.12);color:#e7f1f4}
#yatrio-visit-reminder button{position:absolute;right:10px;top:10px;width:30px;height:30px;border:0;border-radius:8px;background:rgba(255,255,255,.12);color:#fff;font-size:19px;line-height:1;cursor:pointer}
#yatrio-visit-reminder button:focus-visible,#yatrio-visit-reminder a:focus-visible{outline:3px solid #f2b84b;outline-offset:2px}
@keyframes yatrioReminderIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:480px){#yatrio-visit-reminder{left:10px;bottom:10px;width:calc(100vw - 20px)}}
@media(prefers-reduced-motion:reduce){#yatrio-visit-reminder{animation:none}}
`;
const style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
function show(){if(!document.body)return;const box=document.createElement("aside");box.id="yatrio-visit-reminder";box.setAttribute("role","region");box.setAttribute("aria-label","YATRIO visitor reminder");box.innerHTML='<button type="button" aria-label="Dismiss reminder">×</button><strong>Welcome to YATRIO 👋</strong><p>Planning a journey in Nepal? Compare bus services, explore destinations and keep your trip details together.</p><div class="yr-actions"><a href="/travel.html">Explore trips</a><a class="yr-secondary" href="/support.html">Help & support</a></div>';box.querySelector("button").addEventListener("click",()=>box.remove());document.body.appendChild(box);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show,{once:true});else show();
})();