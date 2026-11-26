const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons = {buses:"🚌",stays:"⌂",rides:"🚙",experiences:"✦"};
const categoryPhotos = {buses:"/images/pokhara.jpg",stays:"/images/lumbini.jpg",rides:"/images/ilam.jpg",experiences:"/images/chitwan.jpg"};
async function loadMarketplace(){
  const r = await fetch("/api/marketplace");
  const data = await r.json();
  if(!r.ok) throw new Error(data.error || "Marketplace could not load");
  document.getElementById("categories").innerHTML = data.categories.map(c => '<a class="cat cat-'+esc(c.slug)+'" href="'+(c.slug==="buses"?"/":"/explore.html?category="+c.slug)+'"><div class="catphoto" aria-hidden="true"></div><div class="caticon">'+(icons[c.slug]||"✦")+'</div><h3>'+esc(c.name)+'</h3><p>'+esc(c.description)+'</p><span class="catfoot">'+(c.slug==="buses"?"SEARCH BUS JOURNEYS →":"PARTNER NETWORK OPEN · "+c.verified_providers+" VERIFIED")+'</span></a>').join("");
  const destinationPhotos={kathmandu:"/images/kathmandu.jpg",pokhara:"/images/pokhara.jpg",chitwan:"/images/chitwan.jpg",lumbini:"/images/lumbini.jpg",dharan:"/images/dharan.jpg",ilam:"/images/ilam.jpg",janakpur:"/images/janakpur.jpg",biratnagar:"/images/biratnagar.jpg","rara-lake":"/images/rara-lake.jpg",khaptad:"/images/khaptad.jpg","api-nampa":"/images/api-himal.jpg",panauti:"/images/panauti.jpg",ghandruk:"/images/ghandruk-village.jpg","shey-phoksundo":"/images/phoksundo-lake.jpg"};
  const provincePhotos={Bagmati:"/images/kathmandu.jpg",Gandaki:"/images/pokhara.jpg",Koshi:"/images/ilam.jpg",Madhesh:"/images/janakpur.jpg",Lumbini:"/images/lumbini.jpg",Karnali:"/images/rara-lake.jpg",Sudurpashchim:"/images/khaptad.jpg"};
  window.yatrioDestinations=data.destinations;
  const mountainNames=["nagarkot","bandipur","gorkha","jomsom","mustang","manang","lukla","everest-region","rara-lake","bhedetar","ilam"];
  const heritageNames=["kathmandu","bhaktapur","lalitpur","janakpur","lumbini","gorkha","tansen"];
  const natureNames=["chitwan","bardiya","koshi-tappu","rara-lake","ilam"];
  function destinationType(d){if(mountainNames.includes(d.slug))return "mountain";if(heritageNames.includes(d.slug))return "heritage";if(natureNames.includes(d.slug))return "nature";return "city";}
  const destinationStories={
    kathmandu:"Explore Kathmandu Durbar Square, the living lanes of the old city, Swayambhunath and Boudhanath. The valley blends sacred courtyards, artisan workshops, rooftop cafés and lively neighbourhood markets. Allow time to visit temples respectfully and explore beyond the busiest streets.",
    pokhara:"Spend time beside Phewa Lake, visit Tal Barahi Temple and take in the Annapurna and Machhapuchhre skyline when the weather is clear. Sarangkot is a favourite sunrise viewpoint; caves, waterfalls, paragliding and lakeside cafés add options for different travel styles.",
    chitwan:"Discover the subtropical landscapes around Chitwan National Park, with guided jeep or canoe experiences, birdwatching and opportunities to learn about Tharu culture. Wildlife sightings are never guaranteed; choose responsible operators and follow park and guide instructions.",
    lumbini:"Visit the Maya Devi Temple and Sacred Garden, see the Ashoka Pillar and explore monasteries built by Buddhist communities from around the world. The atmosphere is peaceful and reflective. Dress respectfully, observe quiet zones and leave time to walk or cycle around the large monastic area.",
    dharan:"Use Dharan as a lively eastern Nepal base for local food, temples and day trips towards the cooler hills around Bhedetar. The city is known for its energetic street life and access to eastern hill districts; allow extra time for onward road journeys.",
    ilam:"Walk through rolling tea estates around Kanyam and nearby hill viewpoints, enjoy local tea and explore quiet rural roads. Clear mornings often offer the best views. Ilam is a slower-paced escape, so plan time for scenic stops rather than treating it only as a transit point.",
    janakpur:"Discover Janaki Mandir, the ponds and sacred sites of Janakpur, and the region's distinctive Mithila art and traditions. Festivals can bring the city to life, while quieter days are ideal for exploring the temple architecture and local markets at an unhurried pace.",
    biratnagar:"Biratnagar is a practical eastern gateway with busy markets, food stops and onward connections across the Terai and towards the hills. It is more of a regional city experience than a single monument destination; use it as a base to connect with nearby places.",
    bhaktapur:"Explore Bhaktapur Durbar Square, Nyatapola Temple, the pottery lanes and traditional Newari courtyards. Look for carved windows, brick architecture and local craft workshops. Early mornings are calmer for photography; respect active temples and private courtyards.",
    lalitpur:"Patan's Durbar Square, Krishna Mandir, the Golden Temple and its craft-filled lanes make Lalitpur a rewarding cultural walk. The city is known for metalwork, woodcarving and traditional architecture. Take time to visit small courtyards and local artisan shops.",
    nagarkot:"Nagarkot is best known for broad Himalayan sunrise and sunset viewpoints, short walks and hilltop stays. Mountain visibility depends on weather and season, so keep plans flexible and consider staying overnight rather than relying on a quick day trip.",
    bandipur:"Wander Bandipur's preserved bazaar streets, traditional Newari-style buildings and viewpoints over the surrounding hills. Nearby trails and caves offer gentle excursions. The old town is best explored on foot; check local access and accommodation before travelling in peak periods.",
    gorkha:"Visit Gorkha Durbar for its historic connection to the Shah dynasty and views over the surrounding hills. The town also offers a glimpse of traditional hill life and routes towards nearby rural landscapes. Expect steps and uphill walking around the historic complex.",
    jomsom:"Jomsom sits in the windy Kali Gandaki valley and is a gateway to Lower Mustang, Kagbeni and Muktinath. Expect dramatic dry mountain scenery, strong afternoon winds and changing road conditions. Check weather, flights and road status before setting out.",
    mustang:"Mustang's trans-Himalayan landscapes, cliffside settlements, monasteries and Lo Manthang heritage offer a very different side of Nepal. Some areas require permits and registered guides; confirm current rules, transport, weather and acclimatisation needs before travel.",
    manang:"Manang is a high-altitude village on the Annapurna Circuit, surrounded by stark peaks and traditional mountain settlements. It is a place to slow down and acclimatise, with side walks and cultural visits. Build in rest days and follow altitude-safety guidance.",
    lukla:"Lukla is the best-known starting point for many Everest-region treks. The small mountain settlement is shaped by trekking seasons and flight conditions. Flights are weather-dependent, and onward journeys require preparation, suitable footwear and a realistic schedule.",
    "everest-region":"The Everest region combines Sherpa villages, monasteries, suspension bridges and extraordinary high-mountain trails inside Sagarmatha National Park. Namche Bazaar and Tengboche are classic stops. Trekking requires acclimatisation, suitable insurance and careful attention to altitude and weather.",
    "rara-lake":"Rara Lake is a remote alpine destination framed by forested slopes and mountain wilderness. Visitors come for quiet lakeside walks, changing water colours and the journey itself. Reaching the area takes planning; check transport, accommodation, weather and park guidance well ahead.",
    bardiya:"Bardiya National Park protects extensive Terai grasslands and riverine forest. Guided wildlife excursions, birdwatching and community-based Tharu experiences are highlights. Wildlife is unpredictable, so choose ethical guides, keep a safe distance and never expect guaranteed sightings.",
    "koshi-tappu":"Koshi Tappu's wetlands are known for birdlife, water buffalo and seasonal river landscapes. It is especially rewarding for birdwatchers and nature travellers. Arrange visits with knowledgeable local guides and check seasonal water levels and protected-area rules.",
    tansen:"Explore Tansen's old bazaar, traditional Newari-influenced architecture and the hilltop setting above the Palpa landscape. Rani Mahal, beside the Kali Gandaki River, is a popular excursion. Road travel can be winding, so allow time for the journey.",
    "nepalgunj":"Nepalgunj is a busy western hub and a gateway for journeys towards remote Karnali and Himalayan destinations. Explore local markets and regional food, then plan onward transport carefully: many remote routes depend on flights, road conditions and seasonal access.",
    dhangadhi:"Dhangadhi offers a far-western city base, local food and access towards Shuklaphanta and other Sudurpashchim landscapes. It is a useful starting point for regional exploration; confirm onward transport and park arrangements before travelling.",
    bhedetar:"Bhedetar is a cool ridge-top escape above the eastern plains, known for viewpoints, fresh air and local food stops. It works well as a relaxed short break or a stop on an eastern Nepal road trip. Visibility changes with cloud and season.",
    butwal:"Butwal is a major western gateway where the Terai meets routes towards the hills. Explore local markets and use the city to connect with Tansen, Lumbini and nearby destinations. Check the exact onward route and travel time before setting out.",
    dhulikhel:"Dhulikhel offers Himalayan viewpoints on clear days, an atmospheric old town and short walks through nearby villages. It makes an easy cultural and nature break from Kathmandu. Mountain views are weather-dependent, so plan a flexible stay.",
    panauti:"Panauti's historic centre is known for Indreshwar Temple, traditional Newari houses and quiet lanes near the river confluence. Explore on foot, visit local craft and community spaces respectfully, and allow time to appreciate the town beyond a quick photo stop.",
    kirtipur:"Kirtipur rewards slow exploration through old Newari streets, Bagh Bhairab Temple, traditional eateries and valley viewpoints. Its hilltop setting makes it a good half-day cultural escape from central Kathmandu.",
    pharping:"Pharping is a spiritual destination south of Kathmandu, with monasteries, meditation spaces and sacred caves including Asura Cave. Dress respectfully, keep noise low around religious sites and check opening/access arrangements locally.",
    ghandruk:"Ghandruk is a traditional Gurung settlement with stone-paved lanes, cultural museums and striking views towards the Annapurna range when skies are clear. It is a popular trekking village; confirm road access, trail conditions and accommodation before departure.",
    ghorepani:"Ghorepani is a classic trekking stop for the early-morning walk to Poon Hill, where clear weather can reveal a wide Himalayan panorama. The route involves sustained uphill walking; prepare for cold mornings and changing mountain conditions.",
    besisahar:"Besisahar is a key gateway for the Annapurna Circuit and the Marshyangdi valley. The town is a practical place to organise onward transport and supplies before heading into the hills. Road access beyond town can vary with weather and construction.",
    kanyam:"Kanyam's rolling tea gardens are among eastern Nepal's best-known scenic landscapes. Enjoy a gentle walk, tea tasting and viewpoints across the green hills. Weekends and holidays can be busy, so consider an early visit.",
    taplejung:"Taplejung is a remote eastern Himalayan gateway for the Kanchenjunga region, with dramatic mountain landscapes and culturally rich settlements. Treks are demanding and may require permits, guides and careful logistics; plan well in advance.",
    pathibhara:"Pathibhara is a revered highland pilgrimage site in Taplejung district. The journey includes steep mountain access and can be affected by weather. Check local transport, trail conditions and seasonal arrangements, and prepare for altitude and cold.",
    tilaurakot:"Tilaurakot is an important archaeological landscape associated with ancient Kapilavastu and the life of Siddhartha Gautama. Visitors can explore the remains and interpretive setting; combine it thoughtfully with Lumbini and nearby Buddhist heritage sites.",
    ramgram:"Ramgram is associated with the ancient Ramagrama Stupa, an important Buddhist heritage site. The setting is quieter and more rural than Lumbini. Visit respectfully and check local access or interpretation arrangements before travelling.",
    devdaha:"Devdaha is linked with Buddhist traditions and the wider cultural landscape around the Buddha's life. Explore local heritage sites and community spaces, and consider combining the visit with Lumbini and other destinations in the region.",
    jumla:"Jumla offers highland scenery, distinctive Karnali culture and valleys known for local apples. It is a remote destination where transport and weather can shape plans. Confirm flights or road access, accommodation and local guidance before departure.",
    "sinja-valley":"Sinja Valley is associated with the medieval Khasa civilisation and the history of the Nepali language. Its archaeological and rural landscapes reward travellers interested in heritage beyond the main tourist circuit. Access can be challenging; arrange local guidance.",
    "shey-phoksundo":"Shey Phoksundo is famed for the striking turquoise lake, cliffs, waterfalls and the distinctive culture of Dolpo. Reaching it involves remote travel and trekking logistics; check permits, guides, weather and access requirements before planning.",
    dolpo:"Dolpo is a remote trans-Himalayan region of high passes, traditional villages and Buddhist monasteries. Journeys can be physically demanding and permit-dependent. Plan with experienced local operators, allow acclimatisation time and confirm current restrictions.",
    simikot:"Simikot is the gateway to Humla and the remote Limi Valley, with rugged mountain landscapes and distinctive local culture. Flights and weather can disrupt schedules; build in buffer days and confirm local transport and guide arrangements.",
    khaptad:"Khaptad National Park is known for open meadows, forests, rolling highland landscapes and quiet walking trails. It is ideal for nature-focused travel, but access can be slow. Check entry arrangements, accommodation, weather and trail conditions.",
    dadeldhura:"Dadeldhura offers far-western hill scenery, historic sites such as Amargadhi Fort and a relaxed regional-town atmosphere. It can be a useful stop while exploring Sudurpashchim; confirm road conditions and local transport.",
    tikapur:"Tikapur sits near the Karnali river landscape and offers a quieter western Terai experience. Explore local community life and nearby riverine scenery, while checking seasonal conditions and local access before planning outdoor activities.",
    shuklaphanta:"Shuklaphanta National Park is known for expansive grasslands and wildlife habitat, including the swamp deer. Guided visits are important for safety and conservation. Wildlife sightings vary, so enjoy the landscape without expecting guaranteed encounters.",
    "api-nampa":"Api Nampa Conservation Area protects remote far-western Himalayan landscapes around Api and Nampa. This is an expedition-style destination rather than a casual day trip; arrange permits, local guides, supplies and a realistic weather window.",
    doti:"Doti offers a look at far-western hill culture, river valleys and historic settlements. It is best explored at a measured pace with local knowledge; confirm road access and available stays before travelling to smaller communities."
  };
  function destinationDescription(d,kind){
    return destinationStories[d.slug]||d.name+" offers a glimpse of "+(kind==="mountain"?"Nepal's hill and Himalayan landscapes":kind==="heritage"?"Nepal's living heritage and local traditions":kind==="nature"?"Nepal's protected landscapes and biodiversity":"everyday life in Nepal's regional towns")+". Explore "+(d.highlights||[]).join(", ").toLowerCase()+". Use this destination as a starting point to discover nearby communities, local food and the character of "+d.province+". Check transport, seasonal access and local guidance before travelling; a destination listing does not mean a direct bus service is currently available.";
  }
  function renderDestinations(){
    const query=(document.getElementById("destinationSearch")?.value||"").trim().toLowerCase();
    const region=document.getElementById("destinationRegion")?.value||"all";
    const active=document.querySelector(".destination-chip.active")?.dataset.filter||"all";
    const filtered=data.destinations.filter(d=>{const hay=[d.name,d.province,d.tagline,...(d.highlights||[])].join(" ").toLowerCase();return (!query||hay.includes(query))&&(region==="all"||d.province===region)&&(active==="all"||destinationType(d)===active)});
    document.getElementById("destinationCount").textContent=filtered.length+" destinations to explore";
    document.getElementById("destinationEmpty").hidden=filtered.length>0;
    document.getElementById("destinationsGrid").innerHTML=filtered.map((d,i)=>{
      const exactPhoto=destinationPhotos[d.slug],photo=exactPhoto||provincePhotos[d.province],kind=destinationType(d),photoStyle=photo?' style="--dest-photo:url(&quot;'+photo+'&quot;)"':'';
      const videoHref=d.slug==='bardiya'?'https://www.youtube.com/watch?v=DWV7mQpbqmM':'https://www.youtube.com/results?search_query='+encodeURIComponent(d.name+' Nepal travel destination');
      return '<article class="dest destination-card" data-yatrio-reveal style="--yr-delay:'+(Math.min(i,8)*45)+'ms"><div class="destart scene-'+kind+(photo?' photo-dest':'')+'"'+photoStyle+'>'+(photo?'<img class="dest-real-photo" src="'+photo+'" alt="'+esc(d.name+(exactPhoto?' destination':' regional landscape'))+'" loading="lazy" decoding="async" onerror="this.hidden=true">':'<div class="dest-photo-placeholder" aria-hidden="true"></div>')+'<span class="scenic-label">'+(exactPhoto?'DESTINATION PHOTO':photo?'REGIONAL PHOTO · INSPIRATION':'ILLUSTRATED PLACE')+'</span><span class="dest-photo-shade"></span><span class="dest-photo-caption">'+esc(d.name)+'<small>'+esc(d.province)+' · NEPAL'+(exactPhoto?'':photo?' · REGIONAL INSPIRATION':'')+'</small></span><span class="dest-orbit" aria-hidden="true">✦</span></div><div class="destbody"><h3>'+esc(d.name)+'</h3><p class="dest-tagline">'+esc(d.tagline)+'</p><p class="dest-description">'+esc(destinationDescription(d,kind))+'</p><div class="tags">'+(d.highlights||[]).slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div><a class="destination-plan-link" href="/plan.html?destination='+encodeURIComponent(d.name)+'">Plan this trip <span>↗</span></a><a class="dest-video-link" href="'+videoHref+'" target="_blank" rel="noopener">▶ Watch '+(d.slug==='bardiya'?'official destination film':'place videos on YouTube')+'</a></div></article>';
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
    {src:"/images/rara-lake.jpg",title:"Rara Lake",type:"Destination photo · Karnali",alt:"Rara Lake in Nepal"},
    {src:"/images/khaptad.jpg",title:"Khaptad National Park",type:"Destination photo · Sudurpashchim",alt:"Misty landscape in Khaptad National Park"},
    {src:"/images/api-himal.jpg",title:"Api Himal",type:"Destination photo · Sudurpashchim",alt:"Api Himal mountain landscape"},
    {src:"/images/panauti.jpg",title:"Panauti",type:"Destination photo · Bagmati",alt:"Historic street and temple area in Panauti"},
    {src:"/images/ghandruk-village.jpg",title:"Ghandruk",type:"Destination photo · Gandaki",alt:"Ghandruk village in the Annapurna region"},
    {src:"/images/phoksundo-lake.jpg",title:"Shey Phoksundo Lake",type:"Destination photo · Karnali",alt:"Phoksundo Lake in Dolpo"},
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