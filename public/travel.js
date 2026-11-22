const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons = {buses:"🚌",stays:"⌂",rides:"🚙",experiences:"✦"};
const categoryPhotos = {buses:"/images/pokhara.jpg",stays:"/images/lumbini.jpg",rides:"/images/ilam.jpg",experiences:"/images/chitwan.jpg"};
async function loadMarketplace(){
  const r = await fetch("/api/marketplace");
  const data = await r.json();
  if(!r.ok) throw new Error(data.error || "Marketplace could not load");
  document.getElementById("categories").innerHTML = data.categories.map(c => '<a class="cat cat-'+esc(c.slug)+'" href="'+(c.slug==="buses"?"/":"/explore.html?category="+c.slug)+'"><div class="catphoto" aria-hidden="true"></div><div class="caticon">'+(icons[c.slug]||"✦")+'</div><h3>'+esc(c.name)+'</h3><p>'+esc(c.description)+'</p><span class="catfoot">'+(c.slug==="buses"?"SEARCH BUS JOURNEYS →":"PARTNER NETWORK OPEN · "+c.verified_providers+" VERIFIED")+'</span></a>').join("");
  const destinationPhotos={kathmandu:"/images/kathmandu.jpg",pokhara:"/images/pokhara.jpg",chitwan:"/images/chitwan.jpg",lumbini:"/images/lumbini.jpg",dharan:"/images/dharan.jpg",ilam:"/images/ilam.jpg",janakpur:"/images/janakpur.jpg",biratnagar:"/images/biratnagar.jpg"};
  const provincePhotos={Bagmati:"/images/kathmandu.jpg",Gandaki:"/images/pokhara.jpg",Koshi:"/images/ilam.jpg",Madhesh:"/images/janakpur.jpg",Lumbini:"/images/lumbini.jpg"};
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
      const exactPhoto=destinationPhotos[d.slug],photo=exactPhoto||provincePhotos[d.province],kind=destinationType(d),photoStyle=photo?' style="--dest-photo:url(&quot;'+photo+'&quot;)"':'';
      return '<article class="dest destination-card" data-yatrio-reveal style="--yr-delay:'+(Math.min(i,8)*45)+'ms"><div class="destart scene-'+kind+(photo?' photo-dest':'')+'"'+photoStyle+'><span class="scenic-label">'+(exactPhoto?'DESTINATION PHOTO':photo?'REGIONAL PHOTO':kind.toUpperCase()+' · NEPAL')+'</span><span class="dest-photo-shade"></span><span class="dest-photo-caption">'+esc(d.name)+'<small>'+esc(d.province)+' · NEPAL'+(exactPhoto?'':photo?' · REGIONAL INSPIRATION':'')+'</small></span><span class="dest-orbit" aria-hidden="true">✦</span></div><div class="destbody"><h3>'+esc(d.name)+'</h3><p>'+esc(d.tagline)+'</p><div class="tags">'+(d.highlights||[]).slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div><a class="destination-plan-link" href="/plan.html?destination='+encodeURIComponent(d.name)+'">Plan this trip <span>↗</span></a></div></article>';
    }).join("");
  }
  document.getElementById("destinationSearch").addEventListener("input",renderDestinations);
  document.getElementById("destinationRegion").addEventListener("change",renderDestinations);
  document.getElementById("destinationChips").addEventListener("click",e=>{const btn=e.target.closest(".destination-chip");if(!btn)return;document.querySelectorAll(".destination-chip").forEach(x=>x.classList.toggle("active",x===btn));renderDestinations()});
  renderDestinations();

  const mediaItems=[
    {src:"/images/kathmandu.jpg",title:"Kathmandu",type:"Destination photo",alt:"Kathmandu Durbar Square and historic cityscape"},
    {src:"/images/pokhara.jpg",title:"Pokhara",type:"Destination photo",alt:"Phewa Lake and the Himalayan backdrop in Pokhara"},
    {src:"/images/chitwan.jpg",title:"Chitwan",type:"Destination photo",alt:"Chitwan National Park landscape"},
    {src:"/images/lumbini.jpg",title:"Lumbini",type:"Destination photo",alt:"Maya Devi Temple in Lumbini"},
    {src:"/images/dharan.jpg",title:"Dharan",type:"Destination photo",alt:"Bhedetar and Dharan hill-country view"},
    {src:"/images/ilam.jpg",title:"Ilam",type:"Destination photo",alt:"Green tea gardens in Ilam"},
    {src:"/images/janakpur.jpg",title:"Janakpur",type:"Destination photo",alt:"Janaki Mandir in Janakpur"},
    {src:"/images/biratnagar.jpg",title:"Biratnagar",type:"Destination photo",alt:"Aerial view of Biratnagar"},
    {src:"/images/fleet-demo-exterior.jpg",title:"Coach exterior",type:"Illustrative fleet demo",alt:"Illustrative intercity bus exterior"},
    {src:"/images/fleet-demo-interior.jpg",title:"Coach interior",type:"Illustrative fleet demo",alt:"Illustrative intercity coach passenger interior"}
  ];
  const mediaGrid=document.getElementById("yatrioMediaGrid");
  if(mediaGrid) mediaGrid.innerHTML=mediaItems.map(m=>'<a class="media-card" href="'+m.src+'" target="_blank" rel="noopener" aria-label="Open full image: '+esc(m.title)+'"><img src="'+m.src+'" alt="'+esc(m.alt)+'" loading="lazy" decoding="async"><div class="media-card-copy"><strong>'+esc(m.title)+'</strong><span>'+esc(m.type)+'</span></div></a>').join("");

  const mapPlaces={
    kathmandu:[27.7172,85.3240],pokhara:[28.2096,83.9856],chitwan:[27.5750,84.5000],lumbini:[27.4833,83.2760],
    dharan:[26.8120,87.2830],ilam:[26.9090,87.9280],janakpur:[26.7288,85.9263],biratnagar:[26.4525,87.2718],
    bhaktapur:[27.6710,85.4298],lalitpur:[27.6588,85.3247],nagarkot:[27.7170,85.5200],bandipur:[27.9380,84.4060],
    gorkha:[28.0000,84.6330],jomsom:[28.7800,83.7200],mustang:[29.1800,83.9600],manang:[28.6667,84.0167],
    lukla:[27.6870,86.7310],"everest-region":[27.8069,86.7140],"rara-lake":[29.5300,82.0800],bardiya:[28.4000,81.3000],
    "koshi-tappu":[26.5700,87.0000],hetauda:[27.4280,85.0320],tansen:[27.8670,83.5460],nepalgunj:[28.0500,81.6170],
    dhangadhi:[28.6950,80.5930],bhedetar:[26.9900,87.3300],butwal:[27.7000,83.4500],
    dhulikhel:[27.6220,85.5420],panauti:[27.5840,85.5160],kirtipur:[27.6780,85.2770],pharping:[27.6120,85.2640],
    ghandruk:[28.3750,83.8060],ghorepani:[28.4000,83.6900],besisahar:[28.2310,84.3760],damauli:[27.9760,84.2700],
    kanyam:[26.8790,88.0710],birtamod:[26.6460,87.9940],itahari:[26.6630,87.2740],phidim:[27.1450,87.7670],
    taplejung:[27.3540,87.6700],pathibhara:[27.4300,87.7700],bardibas:[26.9840,85.9190],jaleshwar:[26.6480,85.8000],
    malangwa:[26.8580,85.5600],gaur:[26.7650,85.2780],tilaurakot:[27.5740,83.0520],ramgram:[27.5300,83.6670],
    devdaha:[27.6350,83.5160],kapilvastu:[27.5500,83.0500],swargadwari:[28.0800,82.7400],jumla:[29.2750,82.1830],
    "sinja-valley":[29.2750,82.0000],"shey-phoksundo":[29.2000,82.9500],dolpo:[29.0000,82.8000],simikot:[29.9670,81.8180],
    khaptad:[29.2500,81.1000],dadeldhura:[29.3000,80.5800],tikapur:[28.5280,81.1170],shuklaphanta:[28.8500,80.2500],
    "api-nampa":[29.8500,80.7000],doti:[29.2600,80.9400]
  };
  function initDestinationMap(){
    const el=document.getElementById("yatrioNepalMap"),detail=document.getElementById("mapDetail");
    if(!el||!window.L){if(detail)detail.innerHTML='<strong>Map preview unavailable</strong><p>Destination cards and trip planning are still available below.</p><a class="map-plan-link" href="/plan.html">Open trip planner ↗</a>';return;}
    const map=L.map(el,{scrollWheelZoom:false,zoomControl:true}).setView([28.25,84.1],6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
    const bounds=[];
    data.destinations.forEach(d=>{
      const point=mapPlaces[d.slug];if(!point)return;bounds.push(point);
      const icon=L.divIcon({className:"",html:'<span class="yatrio-map-pin '+(["kathmandu","pokhara","lumbini"].includes(d.slug)?"featured":"")+'"></span>',iconSize:[23,23],iconAnchor:[11,11]});
      const marker=L.marker(point,{icon,title:d.name,alt:"Explore "+d.name}).addTo(map);
      marker.bindTooltip(esc(d.name),{direction:"top",offset:[0,-8]});
      marker.on("click",()=>{
        detail.innerHTML='<span class="map-detail-kicker">'+esc(d.province)+' · NEPAL</span><strong>'+esc(d.name)+'</strong><p>'+esc(d.tagline)+'</p><a class="map-plan-link" href="/plan.html?destination='+encodeURIComponent(d.name)+'">Plan this trip ↗</a>';
      });
    });
    if(bounds.length)map.fitBounds(bounds,{padding:[24,24],maxZoom:7});
    document.getElementById("mapCount").textContent=bounds.length+" mapped destinations · all seven provinces";
    setTimeout(()=>map.invalidateSize(),250);
  }
  initDestinationMap();
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