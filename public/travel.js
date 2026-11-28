const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons = {buses:"🚌",stays:"⌂",rides:"🚙",experiences:"✦"};
const categoryPhotos = {buses:"/images/pokhara.jpg",stays:"/images/lumbini.jpg",rides:"/images/ilam.jpg",experiences:"/images/chitwan.jpg"};
async function loadMarketplace(){
  const r = await fetch("/api/marketplace");
  const data = await r.json();
  if(!r.ok) throw new Error(data.error || "Marketplace could not load");
  document.getElementById("categories").innerHTML = data.categories.map(c => '<a class="cat cat-'+esc(c.slug)+'" href="'+(c.slug==="buses"?"/":"/explore.html?category="+c.slug)+'"><div class="catphoto" aria-hidden="true"></div><div class="caticon">'+(icons[c.slug]||"✦")+'</div><h3>'+esc(c.name)+'</h3><p>'+esc(c.description)+'</p><span class="catfoot">'+(c.slug==="buses"?"SEARCH BUS JOURNEYS →":"PARTNER NETWORK OPEN · "+c.verified_providers+" VERIFIED")+'</span></a>').join("");
  const destinationPhotos={kathmandu:"/images/kathmandu.jpg",pokhara:"/images/pokhara.jpg",chitwan:"/images/chitwan.jpg",lumbini:"/images/lumbini.jpg",bandipur:"/images/bandipur.jpg",jomsom:"/images/jomsom.jpg",manang:"/images/manang.jpg",mustang:"/images/mustang.jpg",bhedetar:"/images/dharan.jpg",ilam:"/images/ilam.jpg",janakpur:"/images/janakpur.jpg",biratnagar:"/images/biratnagar.jpg","rara-lake":"/images/rara-lake.jpg",khaptad:"/images/khaptad.jpg","api-nampa":"/images/api-himal.jpg",panauti:"/images/panauti.jpg",ghandruk:"/images/ghandruk-village.jpg","shey-phoksundo":"/images/phoksundo-lake.jpg",bhaktapur:"/images/bhaktapur.jpg",nagarkot:"/images/nagarkot.jpg","everest-region":"/images/namche-bazar.jpg",bardiya:"/images/bardiya.jpg"};
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
  function destinationIllustration(d,kind){
    const palettes={mountain:["#b9d9d3","#286276","#f5fbf4"],heritage:["#f4dfbf","#98654b","#fff1d5"],nature:["#d9ead3","#286b58","#f3f7d8"],city:["#d7e8ee","#356d80","#f6f2df"]};
    const c=palettes[kind]||palettes.city,seed=Array.from(d.slug).reduce((a,x,i)=>(a*31+x.charCodeAt(0)+i)%9973,7),sunX=65+(seed%230);
    const scene=kind==="heritage"
      ? '<path d="M0 245V170h52v-35h28v35h40v-68h42v68h46v-42h34v42h58v75Z" fill="'+c[1]+'"/><path d="M148 102l21-29 21 29v66h-42Z" fill="'+c[2]+'"/><path d="M158 130h22v38h-22Z" fill="'+c[0]+'"/>'
      : kind==="nature"
      ? '<path d="M0 210Q90 165 170 205T360 190V270H0Z" fill="'+c[1]+'"/><path d="M0 235Q100 195 190 232T360 220V270H0Z" fill="#8dbd8b"/><path d="M0 247Q120 222 220 246T360 238V270H0Z" fill="#4b8a73"/>'
      : kind==="mountain"
      ? '<path d="M0 230 78 115l45 65 68-115 82 127 42-53 45 91v40H0Z" fill="'+c[1]+'"/><path d="m150 143 41-78 48 74-34-19-15 17-15-16Z" fill="'+c[2]+'"/>'
      : '<path d="M0 205Q85 135 170 198T360 175V270H0Z" fill="'+c[1]+'"/><path d="M0 230Q100 185 210 224T360 207V270H0Z" fill="#7caeaa"/>';
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 270"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="'+c[0]+'"/><stop offset="1" stop-color="#eef4e8"/></linearGradient></defs><rect width="360" height="270" fill="url(#g)"/><circle cx="'+sunX+'" cy="66" r="27" fill="#fff0bd" opacity=".95"/>'+scene+'<path d="M0 258Q90 246 180 258T360 250V270H0Z" fill="#173e4a" opacity=".35"/><text x="18" y="42" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#ffffff" opacity=".9">'+esc(d.name)+'</text></svg>';
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }
  function renderDestinations(){
    const query=(document.getElementById("destinationSearch")?.value||"").trim().toLowerCase();
    const region=document.getElementById("destinationRegion")?.value||"all";
    const active=document.querySelector(".destination-chip.active")?.dataset.filter||"all";
    const filtered=data.destinations.filter(d=>{const hay=[d.name,d.province,d.tagline,...(d.highlights||[])].join(" ").toLowerCase();return (!query||hay.includes(query))&&(region==="all"||d.province===region)&&(active==="all"||destinationType(d)===active)});
    document.getElementById("destinationCount").textContent=filtered.length+" destinations to explore";
    document.getElementById("destinationEmpty").hidden=filtered.length>0;
    document.getElementById("destinationsGrid").innerHTML=filtered.map((d,i)=>{
      const exactPhoto=destinationPhotos[d.slug],kind=destinationType(d),visual=exactPhoto||destinationIllustration(d,kind);
      const videoHref=d.slug==='bardiya'?'https://www.youtube.com/watch?v=DWV7mQpbqmM':'https://www.youtube.com/results?search_query='+encodeURIComponent(d.name+' Nepal travel destination');
      return '<article class="dest destination-card" data-yatrio-reveal style="--yr-delay:'+(Math.min(i,8)*45)+'ms"><div class="destart scene-'+kind+' photo-dest"><img class="dest-real-photo '+(exactPhoto?'verified-destination-photo':'destination-illustration')+'" src="'+visual+'" alt="'+esc(exactPhoto?d.name+' destination photograph':d.name+' illustrated destination scene')+'" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\''+destinationIllustration(d,kind)+'\';this.classList.add(\'destination-illustration\')"><span class="scenic-label">'+(exactPhoto?'DESTINATION PHOTO':'DESTINATION ILLUSTRATION')+'</span><span class="dest-photo-shade"></span><span class="dest-photo-caption">'+esc(d.name)+'<small>'+esc(d.province)+' · NEPAL</small></span><span class="dest-orbit" aria-hidden="true">✦</span></div><div class="destbody"><h3>'+esc(d.name)+'</h3><p class="dest-tagline">'+esc(d.tagline)+'</p><p class="dest-description">'+esc(destinationDescription(d,kind))+'</p><div class="tags">'+(d.highlights||[]).slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div><a class="destination-plan-link" href="/plan.html?destination='+encodeURIComponent(d.name)+'">Plan this trip <span>↗</span></a><a class="destination-plan-link" href="/destination.html?place='+encodeURIComponent(d.slug)+'">Explore destination guide <span>↗</span></a><a class="dest-video-link" href="'+videoHref+'" target="_blank" rel="noopener">▶ Watch '+(d.slug==='bardiya'?'official destination film':'place videos on YouTube')+'</a></div></article>';
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
    {src:"/images/dharan.jpg",title:"Bhedetar",type:"Destination photo · Bhedetar",alt:"Bhedetar hill-country view near Dharan"},
    {src:"/images/ilam.jpg",title:"Ilam",type:"Destination photo",alt:"Green tea gardens in Ilam"},
    {src:"/images/janakpur.jpg",title:"Janakpur",type:"Destination photo",alt:"Janaki Mandir in Janakpur"},
    {src:"/images/biratnagar.jpg",title:"Biratnagar",type:"Destination photo",alt:"Aerial view of Biratnagar"},
    {src:"/images/rara-lake.jpg",title:"Rara Lake",type:"Destination photo · Karnali",alt:"Rara Lake in Nepal"},
    {src:"/images/khaptad.jpg",title:"Khaptad National Park",type:"Destination photo · Sudurpashchim",alt:"Misty landscape in Khaptad National Park"},
    {src:"/images/api-himal.jpg",title:"Api Himal",type:"Destination photo · Sudurpashchim",alt:"Api Himal mountain landscape"},
    {src:"/images/panauti.jpg",title:"Panauti",type:"Destination photo · Bagmati",alt:"Historic street and temple area in Panauti"},
    {src:"/images/ghandruk-village.jpg",title:"Ghandruk",type:"Destination photo · Gandaki",alt:"Ghandruk village in the Annapurna region"},
    {src:"/images/phoksundo-lake.jpg",title:"Shey Phoksundo Lake",type:"Destination photo · Karnali",alt:"Phoksundo Lake in Dolpo"},
    {src:"/images/bardiya.jpg",title:"Bardiya National Park",type:"Destination photo · Lumbini Province",alt:"Bardiya National Park entrance gate at Thakurdwara"},
    {src:"/images/fleet-demo-exterior.jpg",title:"Coach exterior",type:"Illustrative fleet demo",alt:"Illustrative intercity bus exterior"},
    {src:"/images/fleet-demo-interior.jpg",title:"Coach interior",type:"Illustrative fleet demo",alt:"Illustrative intercity coach passenger interior"}
  ];
  const mediaGrid=document.getElementById("yatrioMediaGrid");
  if(mediaGrid) mediaGrid.innerHTML=mediaItems.map(m=>'<a class="media-card" href="'+m.src+'" target="_blank" rel="noopener" aria-label="Open full image: '+esc(m.title)+'"><img src="'+m.src+'" alt="'+esc(m.alt)+'" loading="lazy" decoding="async"><div class="media-card-copy"><strong>'+esc(m.title)+'</strong><span>'+esc(m.type)+'</span></div></a>').join("");

  const mapPlaces=window.YATRIO_DESTINATION_LOCATIONS;
  function initDestinationMap(){
    const el=document.getElementById("yatrioNepalMap"),detail=document.getElementById("mapDetail");
    if(!el||!window.L){if(detail)detail.innerHTML='<strong>Map preview unavailable</strong><p>Destination cards and trip planning are still available below.</p><a class="map-plan-link" href="/plan.html">Open trip planner ↗</a>';return;}
    const map=L.map(el,{scrollWheelZoom:false,zoomControl:true}).setView([28.25,84.1],6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
    const bounds=[],markers={};let activeRoute=null,journeyLine=null,journeyFrom=null,journeyTo=null,currentGpsOrigin=null;
    const fromSelect=document.getElementById("journeyFrom"),toSelect=document.getElementById("journeyTo"),dateInput=document.getElementById("journeyDate"),stepLabel=document.getElementById("journeyStep"),guidance=document.getElementById("journeyGuidance"),searchJourney=document.getElementById("searchJourney");
    const remotePlaces=new Set(["mustang","manang","lukla","everest-region","rara-lake","jomsom","ghandruk","ghorepani","taplejung","pathibhara","jumla","sinja-valley","shey-phoksundo","dolpo","simikot","khaptad","api-nampa","swargadwari"]);
    const todayNepal=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kathmandu",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    if(dateInput){dateInput.min=todayNepal;dateInput.value=todayNepal;}
    const destinationBySlug=Object.fromEntries(data.destinations.map(d=>[d.slug,d]));
    function fillJourneySelect(select){if(!select)return;select.innerHTML='<option value="">Choose a place</option>'+data.destinations.map(d=>'<option value="'+esc(d.slug)+'">'+esc(d.name)+' · '+esc(d.province)+'</option>').join("");}
    fillJourneySelect(fromSelect);fillJourneySelect(toSelect);
    function updateJourneyState(){
      if(stepLabel)stepLabel.textContent=journeyFrom?(journeyTo?"✓ Two places selected":"2 · Choose destination"):"1 · Choose origin";
      if(fromSelect)fromSelect.value=journeyFrom||"";if(toSelect)toSelect.value=journeyTo||"";
      if(searchJourney)searchJourney.disabled=!(journeyFrom&&journeyTo&&journeyFrom!==journeyTo);
      if(journeyFrom&&journeyTo){const a=destinationBySlug[journeyFrom],b=destinationBySlug[journeyTo];const remote=remotePlaces.has(journeyFrom)||remotePlaces.has(journeyTo);guidance.innerHTML='<strong>'+esc(a.name)+' → '+esc(b.name)+'</strong> · '+(remote?'Remote/highland access: a bus may not reach the destination. Check local jeep, trekking, permit, flight and seasonal arrangements.':'Road access may be available, but bus service is only shown if a verified operator has a scheduled departure.')+' Select Preview journey to request a mapped road connection.';}
      else if(journeyFrom){guidance.textContent="Origin: "+destinationBySlug[journeyFrom].name+". Now choose destination from dropdown or tap a map pin.";}
      else guidance.textContent="Choose starting point and destination from the dropdowns. Use current location if you want GPS as your starting point.";
    }
    function selectJourneyPlace(slug){
      if(!journeyFrom){journeyFrom=slug;journeyTo=null;}
      else if(!journeyTo&&slug!==journeyFrom){journeyTo=slug;}
      else {journeyTo=slug;}
      currentGpsOrigin=null;updateJourneyState();
    }
    fromSelect?.addEventListener("change",()=>{journeyFrom=fromSelect.value||null;currentGpsOrigin=null;if(journeyFrom===journeyTo)journeyTo=null;updateJourneyState();});
    toSelect?.addEventListener("change",()=>{journeyTo=toSelect.value||null;updateJourneyState();});
    document.getElementById("useCurrentLocation")?.addEventListener("click",()=>{
      if(!navigator.geolocation){guidance.textContent="Location is unavailable in this browser. Select your starting place from the dropdown.";return;}
      guidance.textContent="Requesting your location permission…";
      navigator.geolocation.getCurrentPosition(position=>{
        const gps=[position.coords.latitude,position.coords.longitude];
        let nearest=null,nearestDistance=Infinity;
        for(const [slug,point] of Object.entries(mapPlaces)){const dist=map.distance(gps,point);if(dist<nearestDistance){nearestDistance=dist;nearest=slug;}}
        currentGpsOrigin={coords:gps,nearestSlug:nearest,accuracy:position.coords.accuracy};
        journeyFrom=nearest;if(journeyTo===nearest)journeyTo=null;
        updateJourneyState();
        guidance.innerHTML='<strong>Current location detected.</strong> GPS accuracy ±'+Math.round(position.coords.accuracy)+' m. For bus search, the starting place is approximated as <strong>'+esc(destinationBySlug[nearest].name)+'</strong> (nearest mapped destination, '+Math.round(nearestDistance/1000)+' km away). Preview will use your GPS coordinates.';
      },error=>{guidance.textContent=error.code===1?"Location permission denied. Choose a start location from the dropdown.":"Could not determine your location. Please select your starting point manually.";},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
    });
    document.getElementById("previewJourney")?.addEventListener("click",async()=>{
      if(!journeyFrom||!journeyTo||journeyFrom===journeyTo){guidance.textContent="Choose two different destinations first.";return;}
      if(journeyLine){map.removeLayer(journeyLine);journeyLine=null;}
      const a=currentGpsOrigin?.coords||mapPlaces[journeyFrom],b=mapPlaces[journeyTo],remote=remotePlaces.has(journeyFrom)||remotePlaces.has(journeyTo);
      if(remote){guidance.innerHTML='<strong>Remote access advisory:</strong> this journey may require local jeep/flight/trek arrangements, permits, weather and seasonal checks. The map preview is not a guaranteed bus route.';map.fitBounds([a,b],{padding:[35,35]});return;}
      guidance.textContent="Requesting mapped road geometry…";
      try{
        const response=await fetch("https://router.project-osrm.org/route/v1/driving/"+a[1]+","+a[0]+";"+b[1]+","+b[0]+"?overview=full&geometries=geojson&steps=false");
        const result=await response.json();if(!response.ok||result.code!=="Ok"||!result.routes?.[0])throw new Error("No routable road connection returned for these places.");
        const line=result.routes[0];journeyLine=L.geoJSON(line.geometry,{style:{color:"#e36b45",weight:5,opacity:.92}}).addTo(map);
        map.fitBounds(journeyLine.getBounds(),{padding:[32,32]});
        guidance.innerHTML='<strong>Mapped road estimate: '+Math.round(line.distance/1000)+' km.</strong> Route geometry is an OpenStreetMap-based driving estimate, not an official bus route, road-condition report or guaranteed travel time.';
      }catch(error){guidance.textContent="Road preview unavailable: "+error.message+" Destination pins remain available; check local access before travel.";}
    });
    searchJourney?.addEventListener("click",()=>{
      if(!journeyFrom||!journeyTo)return;
      const a=destinationBySlug[journeyFrom],b=destinationBySlug[journeyTo],date=dateInput?.value||todayNepal;
      const originName=currentGpsOrigin?"Current location (near "+a.name+")":a.name;
      location.href="/?from="+encodeURIComponent(originName)+"&to="+encodeURIComponent(b.name)+"&date="+encodeURIComponent(date)+"&source=map";
    });
    data.destinations.forEach(d=>{
      const point=mapPlaces[d.slug];if(!point)return;bounds.push(point);
      const icon=L.divIcon({className:"",html:'<span class="yatrio-map-pin '+(["kathmandu","pokhara","lumbini"].includes(d.slug)?"featured":"")+'"></span>',iconSize:[23,23],iconAnchor:[11,11]});
      const marker=L.marker(point,{icon,title:d.name,alt:"Explore "+d.name}).addTo(map);markers[d.slug]=marker;
      marker.bindTooltip(esc(d.name),{direction:"top",offset:[0,-8]});
      marker.on("click",()=>{
        selectJourneyPlace(d.slug);
        detail.innerHTML='<span class="map-detail-kicker">'+esc(window.YATRIO_DESTINATION_DISTRICTS?.[d.slug]||d.province)+' · '+esc(d.province)+' Province · NEPAL</span><strong>'+esc(d.name)+'</strong><p>'+esc(d.tagline)+'</p><a class="map-plan-link" href="/destination.html?place='+encodeURIComponent(d.slug)+'">View destination guide ↗</a><a class="map-plan-link" href="/plan.html?destination='+encodeURIComponent(d.name)+'">Plan this trip ↗</a>';
      });
    });
    const routes={
      "eastwest":{name:"East–West Nepal",stops:[["Kakarbhitta",26.6430,88.1550],["Birtamod",26.6460,87.9940],["Itahari",26.6630,87.2740],["Biratnagar",26.4525,87.2718],["Bardibas",26.9840,85.9190],["Hetauda",27.4280,85.0320],["Chitwan",27.5750,84.5000],["Butwal",27.7000,83.4500],["Nepalgunj",28.0500,81.6170],["Dhangadhi",28.6950,80.5930],["Mahendranagar",28.9630,80.1770]]},
      "kathmandu-pokhara":{name:"Kathmandu to Pokhara",stops:[["Kathmandu",27.7172,85.3240],["Damauli",27.9760,84.2700],["Pokhara",28.2096,83.9856]]},
      "kathmandu-chitwan-lumbini":{name:"Kathmandu · Chitwan · Lumbini",stops:[["Kathmandu",27.7172,85.3240],["Chitwan",27.5750,84.5000],["Butwal",27.7000,83.4500],["Lumbini",27.4833,83.2760]]},
      "kathmandu-janakpur":{name:"Kathmandu to Janakpur",stops:[["Kathmandu",27.7172,85.3240],["Bardibas",26.9840,85.9190],["Janakpur",26.7288,85.9263]]},
      "kathmandu-ilam":{name:"Kathmandu · Dharan · Ilam",stops:[["Kathmandu",27.7172,85.3240],["Bardibas",26.9840,85.9190],["Itahari",26.6630,87.2740],["Dharan",26.8120,87.2830],["Ilam",26.9090,87.9280]]},
      "pokhara-jomsom":{name:"Pokhara to Jomsom",stops:[["Pokhara",28.2096,83.9856],["Beni",28.3500,83.5660],["Jomsom",28.7800,83.7200]]},
      "nepalgunj-jumla":{name:"Nepalgunj · Surkhet · Jumla",stops:[["Nepalgunj",28.0500,81.6170],["Surkhet",28.6000,81.6330],["Jumla",29.2750,82.1830]]},
      "dhangadhi-khaptad":{name:"Dhangadhi · Khaptad · Dadeldhura",stops:[["Dhangadhi",28.6950,80.5930],["Dadeldhura",29.3000,80.5800],["Khaptad",29.2500,81.1000]]}
    };
    const status=document.getElementById("routeStatus"),selector=document.getElementById("nepalRouteSelect");
    function clearRoute(){if(activeRoute){map.removeLayer(activeRoute);activeRoute=null;}}
    async function showRoute(key){
      clearRoute();if(!key){map.fitBounds(bounds,{padding:[24,24],maxZoom:7});status.textContent="All "+bounds.length+" destinations shown · choose a corridor to draw a road route";return;}
      const route=routes[key];if(!route)return;status.textContent="Finding mapped road route for "+route.name+"…";selector.disabled=true;
      const coords=route.stops.map(p=>p[2]+","+p[1]).join(";");
      try{
        const response=await fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=false");
        const result=await response.json();
        if(!response.ok||result.code!=="Ok"||!result.routes?.[0])throw new Error(result.message||"No mapped road route is available for this corridor.");
        const line=result.routes[0];
        activeRoute=L.geoJSON(line.geometry,{style:{color:"#e36b45",weight:5,opacity:.9}}).addTo(map);
        const stopLayer=L.featureGroup(route.stops.map((p,i)=>L.marker([p[1],p[2]],{icon:L.divIcon({className:"",html:'<span class="yatrio-route-stop">'+(i+1)+'</span>',iconSize:[26,26],iconAnchor:[13,13]})}).bindTooltip(esc(p[0]))));
        stopLayer.addTo(map);activeRoute.addLayer(stopLayer);
        map.fitBounds(activeRoute.getBounds(),{padding:[28,28]});
        const km=Math.round(line.distance/1000);
        status.textContent=route.name+" · approx. "+km+" km mapped road distance · "+route.stops.length+" stops";
        detail.innerHTML='<span class="map-detail-kicker">ROUTE CORRIDOR</span><strong>'+esc(route.name)+'</strong><p>'+route.stops.map(p=>esc(p[0])).join(" → ")+'</p><p class="route-distance">Approx. '+km+' km by mapped road. Actual travel time and access depend on road, weather and local conditions.</p><a class="map-plan-link" href="/plan.html?destination='+encodeURIComponent(route.stops[route.stops.length-1][0])+'">Plan this journey ↗</a>';
      }catch(error){status.textContent="Road route unavailable for this corridor. All destination pins remain visible; check the national highway reference below.";detail.innerHTML='<span class="map-detail-kicker">ROUTE NOT AVAILABLE</span><strong>'+esc(route.name)+'</strong><p>'+esc(error.message)+'</p><a class="map-plan-link" href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route='+route.stops[0][1]+'%2C'+route.stops[0][2]+'%3B'+route.stops.at(-1)[1]+'%2C'+route.stops.at(-1)[2]+'" target="_blank" rel="noopener">Try external directions ↗</a>';}
      finally{selector.disabled=false;}
    }
    selector?.addEventListener("change",()=>showRoute(selector.value));
    document.getElementById("showAllNepalPins")?.addEventListener("click",()=>{selector.value="";showRoute("");detail.innerHTML='<span class="map-detail-kicker">ALL NEPAL</span><strong>'+bounds.length+' mapped destinations</strong><p>Explore destination pins across all seven provinces. Select any pin for its district, guide and trip-planning links.</p><a class="map-plan-link" href="/plan.html">Open trip planner ↗</a>';});
    map.fitBounds(bounds,{padding:[24,24],maxZoom:7});
    document.getElementById("mapCount").textContent=bounds.length+" mapped destinations · all seven provinces";
    status.textContent=bounds.length+" destination pins ready · choose a road corridor above";
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