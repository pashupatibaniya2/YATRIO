const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons = {buses:"🚌",stays:"⌂",rides:"🚙",experiences:"✦"};
async function loadMarketplace(){
  const r = await fetch("/api/marketplace");
  const data = await r.json();
  if(!r.ok) throw new Error(data.error || "Marketplace could not load");
  document.getElementById("categories").innerHTML = data.categories.map(c => '<a class="cat" href="'+(c.slug==="buses"?"/":"/explore.html?category="+c.slug)+'"><div class="caticon">'+(icons[c.slug]||"✦")+'</div><h3>'+esc(c.name)+'</h3><p>'+esc(c.description)+'</p><span class="catfoot">'+(c.slug==="buses"?"SEARCH BUS JOURNEYS →":"PARTNER NETWORK OPEN · "+c.verified_providers+" VERIFIED")+'</span></a>').join("");
  const destinationPhotos={pokhara:"/images/pokhara.jpg",chitwan:"/images/chitwan.jpg",lumbini:"/images/lumbini.jpg",ilam:"/images/ilam.jpg"};document.getElementById("destinationsGrid").innerHTML = data.destinations.map((d,i) => {const photo=destinationPhotos[d.slug];return '<article class="dest"><div class="destart'+(photo?' photo-dest':'')+'"'+(photo?' style="--dest-photo:url(\''+photo+'\')"':'')+'><span class="scenic-label">'+(i%4===0?"HIMALAYAN ESCAPE":i%4===1?"LAKESIDE DAYS":i%4===2?"WILD NEPAL":"CULTURE & HERITAGE")+'</span><span class="dest-photo-shade"></span><span class="dest-photo-caption">'+esc(d.name)+'<small>'+esc(d.province)+' · NEPAL</small></span></div><div class="destbody"><h3>'+esc(d.name)+'</h3><p>'+esc(d.tagline)+' · '+esc(d.province)+'</p><div class="tags">'+d.highlights.map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div></div></article>'}).join("");
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