const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons = {buses:"🚌",stays:"⌂",rides:"🚙",experiences:"✦"};
const categoryPhotos = {buses:"/images/pokhara.jpg",stays:"/images/lumbini.jpg",rides:"/images/ilam.jpg",experiences:"/images/chitwan.jpg"};
async function loadMarketplace(){
  const r = await fetch("/api/marketplace");
  const data = await r.json();
  if(!r.ok) throw new Error(data.error || "Marketplace could not load");
  document.getElementById("categories").innerHTML = data.categories.map(c => '<a class="cat cat-'+esc(c.slug)+'" href="'+(c.slug==="buses"?"/":"/explore.html?category="+c.slug)+'"><div class="catphoto" aria-hidden="true"></div><div class="caticon">'+(icons[c.slug]||"✦")+'</div><h3>'+esc(c.name)+'</h3><p>'+esc(c.description)+'</p><span class="catfoot">'+(c.slug==="buses"?"SEARCH BUS JOURNEYS →":"PARTNER NETWORK OPEN · "+c.verified_providers+" VERIFIED")+'</span></a>').join("");
  const destinationPhotos={kathmandu:"/images/kathmandu.jpg",pokhara:"/images/pokhara.jpg",chitwan:"/images/chitwan.jpg",lumbini:"/images/lumbini.jpg",dharan:"/images/dharan.jpg",ilam:"/images/ilam.jpg",janakpur:"/images/janakpur.jpg",biratnagar:"/images/biratnagar.jpg"};
  window.yatrioDestinations=data.destinations;
  const mountainNames=["nagarkot","bandipur","gorkha","jomsom","mustang","manang","lukla","everest-region","rara-lake","bhedetar","ilam"];
  const heritageNames=["kathmandu","bhaktapur","lalitpur","janakpur","lumbini","gorkha","tansen"];
  const natureNames=["chitwan","bardiya","koshi-tappu","rara-lake","ilam"];
  function destinationType(d){if(mountainNames.includes(d.slug))return "mountain";if(heritageNames.includes(d.slug))return "heritage";if(natureNames.includes(d.slug))return "nature";return "city";}
  function renderDestinations(){
    const query=(document.getElementById("destinationSearch")?.value||"").trim().toLowerCase();
    const region=document.getElementById("destinationRegion")?.value||"all";
    const active=document.querySelector(".destination-chip.active")?.dataset.filter||"all";
    const filtered=data.destinations.filter(d=>{const hay=[d.name,d.province,d.tagline,...(d.highlights||[])].join(" ").toLowerCase();return (!query||hay.includes(query))&&(region==="all"||d.province===region)&&(active==="all"||destinationType(d)===active)});
    document.getElementById("destinationCount").textContent=filtered.length+" destinations to explore";
    document.getElementById("destinationEmpty").hidden=filtered.length>0;
    document.getElementById("destinationsGrid").innerHTML=filtered.map((d,i)=>{
      const photo=destinationPhotos[d.slug],kind=destinationType(d),photoStyle=photo?' style="--dest-photo:url(&quot;'+photo+'&quot;)"':'';
      return '<article class="dest destination-card" data-yatrio-reveal style="--yr-delay:'+(Math.min(i,8)*45)+'ms"><div class="destart scene-'+kind+(photo?' photo-dest':'')+'"'+photoStyle+'><span class="scenic-label">'+kind.toUpperCase()+' · NEPAL</span><span class="dest-photo-shade"></span><span class="dest-photo-caption">'+esc(d.name)+'<small>'+esc(d.province)+' · NEPAL</small></span><span class="dest-orbit" aria-hidden="true">✦</span></div><div class="destbody"><h3>'+esc(d.name)+'</h3><p>'+esc(d.tagline)+'</p><div class="tags">'+(d.highlights||[]).slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div><a class="destination-plan-link" href="/plan.html?destination='+encodeURIComponent(d.name)+'">Plan this trip <span>↗</span></a></div></article>';
    }).join("");
  }
  document.getElementById("destinationSearch").addEventListener("input",renderDestinations);
  document.getElementById("destinationRegion").addEventListener("change",renderDestinations);
  document.getElementById("destinationChips").addEventListener("click",e=>{const btn=e.target.closest(".destination-chip");if(!btn)return;document.querySelectorAll(".destination-chip").forEach(x=>x.classList.toggle("active",x===btn));renderDestinations()});
  renderDestinations();
}
document.getElementById("partnerForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.currentTarget, status=document.getElementById("formStatus"), button=form.querySelector("button");
  const body=Object.fromEntries(new FormData(form).entries());
  button.disabled=true;button.textContent="Submitting…";status.className="status";status.textContent="";
  try{
    const r=await fetch("/api/partner-apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await r.json();
    if(r.status===401 && data.login_url){location.href=data.login_url;return;}
    if(r.status===401){location.href="/login.html?next="+encodeURIComponent("/travel.html#partner");return;}
    if(!r.ok)throw new Error(data.error||"Application could not be submitted");
    status.textContent=data.message+" Reference: "+data.application.id;
    form.reset();
  }catch(err){status.className="status error";status.textContent=err.message;}
  finally{button.disabled=false;button.textContent="Submit partner application →";}
});
loadMarketplace().catch(e=>{document.getElementById("categories").innerHTML='<p class="status error">'+esc(e.message)+'</p>';});