const plans = {
  Pokhara: {
    image:"/images/pokhara.jpg", region:"Gandaki Province", intro:"A lakeside base for mountain views, gentle adventures and relaxed evenings.",
    balanced:[["Lakeside arrival","Settle in around Phewa Lake, explore the waterfront and enjoy sunset views from the lakeside promenade.","Easy arrival day"],["Views & viewpoints","Start early for a Sarangkot sunrise if weather allows, then explore the World Peace Pagoda area and the lake.","Nature + scenery"],["Caves & old town","Visit one or two local cave or waterfall attractions, then leave time for a relaxed meal and departure.","Flexible finish"]],
    nature:[["Lake and mountain air","Walk beside Phewa Lake and take a boat ride when conditions are safe. Keep the afternoon open for rest.","Outdoor start"],["Sunrise and trails","Choose Sarangkot or a nearby viewpoint for early mountain scenery; add a short local walk suited to your fitness.","Early start"],["Waterfall and green spaces","Explore the Davis Falls area and nearby green spaces, checking local access and conditions.","Nature day"]],
    culture:[["Lakeside and local life","Explore the waterfront, local markets and neighbourhood cafés to get oriented.","Gentle introduction"],["Heritage and reflection","Visit the World Peace Pagoda area and local cultural sites; dress respectfully at religious places.","Culture day"],["Old Pokhara","Explore older neighbourhoods and local food traditions before departure.","Local flavour"]],
    relaxed:[["Arrive and unwind","Check in, take a gentle lakeside stroll and enjoy an unhurried evening.","Low effort"],["A slow lake day","Choose a short boat outing if conditions permit, with plenty of time for cafés and rest.","Easy pace"],["Free-choice morning","Keep the morning open for a favourite spot or a late breakfast before departure.","Flexible finish"]]
  },
  Chitwan: {
    image:"/images/chitwan.jpg", region:"Bagmati Province", intro:"A warm lowland escape shaped by river landscapes, community culture and wildlife experiences.",
    balanced:[["Arrive in Sauraha","Travel to Sauraha, settle in and take an evening walk through the village area.","Arrival + local life"],["Nature and wildlife","Choose a licensed, locally guided nature activity and follow park rules and wildlife-distance guidance.","Guided outdoors"],["Culture and departure","Learn about local Tharu culture through a community-led experience, then depart at a comfortable time.","Community-led"]],
    nature:[["River-country arrival","Arrive in Sauraha and enjoy a quiet riverside walk while following local safety advice.","Gentle start"],["Guided nature day","Book a permitted activity with an authorised local guide; wildlife sightings are never guaranteed.","Wildlife etiquette"],["Birds and wetlands","Explore suitable birdwatching or wetland areas with local guidance before departure.","Nature finish"]],
    culture:[["Sauraha and community","Get to know the village and ask local hosts about community-led cultural experiences.","Local welcome"],["Tharu heritage","Choose a respectful, community-run cultural programme and learn about local traditions.","Heritage focus"],["Slow morning","Enjoy a relaxed breakfast and local market time before travelling onward.","Easy finish"]],
    relaxed:[["Arrive and settle","Check in, take a short village walk and keep the evening free.","Unhurried"],["Choose your own pace","Pick one optional guided activity or spend the day resting by the river.","Flexible day"],["Leisurely departure","Enjoy a slow breakfast and leave enough time for your onward journey.","Easy finish"]]
  },
  Lumbini: {
    image:"/images/lumbini.jpg", region:"Lumbini Province", intro:"A reflective journey through one of the world's most important Buddhist pilgrimage landscapes.",
    balanced:[["Arrive in Lumbini","Settle in and orient yourself around the wider pilgrimage area; keep the first afternoon light.","Arrival day"],["Sacred Garden and monasteries","Explore the Sacred Garden and monastery zones respectfully, allowing time for quiet reflection.","Heritage focus"],["Local history and departure","Visit a local museum or heritage stop if open, then plan your onward journey.","Flexible finish"]],
    nature:[["A calm arrival","Arrive and take a gentle walk through the green spaces around the pilgrimage area.","Easy start"],["Gardens and quiet paths","Spend time in the Sacred Garden and surrounding landscaped areas, respecting quiet zones.","Slow outdoors"],["Open morning","Enjoy a final quiet walk before departure.","Gentle finish"]],
    culture:[["Arrival and orientation","Learn about Lumbini's significance and plan visits around local site guidance.","Context first"],["Monastic zone exploration","Explore monastery areas and the Sacred Garden with respectful dress and behaviour.","Culture day"],["Museum and reflection","Visit a museum or interpretation centre if open, then depart.","Heritage finish"]],
    relaxed:[["Arrive and rest","Keep the first day simple and settle into your accommodation.","Low effort"],["A reflective day","Spend unhurried time in the Sacred Garden and selected monastery areas.","Slow pace"],["Open time","Leave the final morning flexible for reflection and departure.","Flexible finish"]]
  },
  Ilam: {
    image:"/images/ilam.jpg", region:"Koshi Province", intro:"A slower eastern-hills escape with tea gardens, green ridgelines and cool highland air.",
    balanced:[["Arrive among the hills","Reach Ilam, settle in and enjoy a gentle walk near the town or tea-growing landscape.","Scenic arrival"],["Tea gardens and viewpoints","Explore local tea gardens and nearby viewpoints, checking access with local hosts.","Highland scenery"],["Local flavours and departure","Try local produce, enjoy a final viewpoint and leave time for the onward road journey.","Easy finish"]],
    nature:[["Green-hill arrival","Arrive and take a short walk to enjoy the landscape without rushing.","Nature start"],["Tea gardens and trails","Explore tea-growing areas and nearby walking routes with local guidance.","Outdoor day"],["Sunrise or viewpoint","Choose a nearby viewpoint if weather and road conditions allow, then depart.","Scenic finish"]],
    culture:[["Town and local life","Explore Ilam town and learn about the region's tea-growing communities.","Local introduction"],["Tea culture","Visit a tea garden or producer that welcomes visitors; ask before entering private fields.","Community focus"],["Food and departure","Enjoy regional flavours and a relaxed final morning.","Local finish"]],
    relaxed:[["Settle into Ilam","Arrive, rest and enjoy the cooler hill atmosphere.","Low effort"],["A slow tea-country day","Spend an unhurried day around tea gardens and scenic stops.","Slow pace"],["Flexible morning","Keep plans light and allow extra time for road travel.","Easy finish"]]
  },
  Kathmandu: {
    image:"", region:"Bagmati Province", intro:"A layered valley of historic squares, living traditions, temples and neighbourhood food.",
    balanced:[["Arrive and explore","Get oriented around your chosen neighbourhood and enjoy an easy evening walk.","Arrival + food"],["Heritage squares","Choose a UNESCO-listed heritage area such as Kathmandu Durbar Square or Patan, checking current entry details.","Architecture + history"],["Temple and local lanes","Explore a major temple area and local markets respectfully, then depart or extend your stay.","Living heritage"]],
    nature:[["Valley orientation","Take a gentle walk in a green space or hill-edge neighbourhood.","Easy start"],["Hill and viewpoint day","Choose a nearby valley viewpoint or nature walk after checking weather and access.","Outdoors"],["Garden morning","Spend time in a garden or open space before departure.","Gentle finish"]],
    culture:[["Old city introduction","Explore a historic neighbourhood with a local guide if you want deeper context.","Heritage start"],["Patan or Bhaktapur","Choose one historic city area and allow time for courtyards, temples and local craft traditions.","Culture focus"],["Temple traditions","Visit a major religious site respectfully and check visitor rules before arrival.","Living culture"]],
    relaxed:[["Arrive and settle","Keep the first day neighbourhood-based and enjoy local food.","Low effort"],["Choose one heritage area","Explore one historic area slowly rather than rushing between sites.","Slow pace"],["Free morning","Leave the final morning open for a café, market or garden visit.","Flexible finish"]]
  }
};
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const extensions = {
  Pokhara:[["Adventure choice","Add a guided activity such as paragliding or a short hike only after checking operator credentials and weather.","Optional activity"],["Mountain day","Keep a full day for a locally guided day walk or a nearby viewpoint.","Flexible outdoors"],["Local food trail","Explore local cafés and regional food at an unhurried pace.","Food + neighbourhoods"],["Buffer and departure","Keep a weather and road-condition buffer before your onward journey.","Travel buffer"]],
  Chitwan:[["Community experience","Add another community-led experience or a conservation learning visit where available.","Local connection"],["Nature at a slower pace","Choose a second permitted guided nature activity; wildlife sightings are not guaranteed.","Guided outdoors"],["Village and food day","Spend more time with local hosts and regional food traditions.","Local connection"],["Buffer and departure","Keep a buffer for road conditions and your onward journey.","Travel buffer"]],
  Lumbini:[["Monastery discovery","Explore another monastery area at a respectful pace, following visitor guidance.","Heritage extension"],["Museum and learning","Add time for interpretation, history and learning if visitor facilities are open.","Culture extension"],["Quiet reflection","Leave a day intentionally unstructured for reflection and rest.","Slow pace"],["Buffer and departure","Keep a buffer for onward transport and local conditions.","Travel buffer"]],
  Ilam:[["Tea country extension","Visit another tea-growing area with permission from local hosts.","Highland scenery"],["Nearby viewpoint","Choose a nearby viewpoint after checking weather and road access.","Scenic extension"],["Local produce and crafts","Spend time with local producers and small businesses where visitor access is welcomed.","Community focus"],["Buffer and departure","Allow extra time for hill roads and your onward journey.","Travel buffer"]],
  Kathmandu:[["Neighbourhood day","Choose a neighbourhood and explore its food, craft and everyday life slowly.","Local discovery"],["Valley excursion","Add a nearby heritage or nature excursion after checking current access and transport.","Flexible excursion"],["Food and craft","Explore local food traditions and craft markets with time to browse.","Local discovery"],["Buffer and departure","Keep a buffer for city traffic and onward travel.","Travel buffer"]]
};
const destinationProfiles={
  "Bhaktapur":{region:"Bagmati Province",image:"",intro:"A heritage city of brick lanes, pagoda temples, courtyards and traditional craft." ,highlights:["Durbar Square","Nyatapola Temple","Pottery Square"]},
  "Lalitpur (Patan)":{region:"Bagmati Province",image:"",intro:"Discover Patan's celebrated architecture, courtyards, metalwork and living Newari culture.",highlights:["Patan Durbar Square","Golden Temple","Traditional crafts"]},
  "Nagarkot":{region:"Bagmati Province",image:"",intro:"A peaceful hill escape known for Himalayan viewpoints, sunrise possibilities and short walks.",highlights:["Sunrise viewpoints","Hill walks","Mountain scenery"]},
  "Bandipur":{region:"Gandaki Province",image:"",intro:"Slow down in a preserved hilltop bazaar with traditional architecture and wide mountain views.",highlights:["Old bazaar","Mountain panoramas","Local culture"]},
  "Gorkha":{region:"Gandaki Province",image:"",intro:"Explore Nepal's historic hill country, heritage landmarks and surrounding landscapes.",highlights:["Gorkha Durbar","Local heritage","Hill scenery"]},
  "Jomsom":{region:"Gandaki Province",image:"",intro:"A high Himalayan gateway to the Kali Gandaki valley and Mustang landscapes.",highlights:["Kali Gandaki","Mountain views","Mustang gateway"]},
  "Mustang":{region:"Gandaki Province",image:"",intro:"Discover dramatic trans-Himalayan scenery, ancient settlements and distinctive local heritage.",highlights:["Lo Manthang region","High-altitude landscapes","Monasteries"]},
  "Manang":{region:"Gandaki Province",image:"",intro:"A Himalayan settlement surrounded by high peaks and trekking trails in the Annapurna region.",highlights:["Annapurna Circuit","Mountain trails","Highland culture"]},
  "Lukla":{region:"Koshi Province",image:"",intro:"A mountain gateway for journeys into the Everest region; flights and trails are weather dependent.",highlights:["Everest gateway","Mountain flights","Trekking routes"]},
  "Everest Region":{region:"Koshi Province",image:"",intro:"Plan carefully for high-altitude trails, Sherpa communities and spectacular Himalayan landscapes.",highlights:["Sagarmatha region","Sherpa culture","High-altitude trekking"]},
  "Rara Lake":{region:"Karnali Province",image:"",intro:"A remote alpine lake experience surrounded by forests, quiet trails and mountain wilderness.",highlights:["Rara National Park","Alpine lake","Nature trails"]},
  "Bardiya":{region:"Lumbini Province",image:"",intro:"Explore western Terai nature and community-led conservation experiences with local guidance.",highlights:["Bardiya National Park","Wildlife conservation","Tharu culture"]},
  "Koshi Tappu":{region:"Koshi Province",image:"",intro:"A wetland landscape known for birdlife, river habitats and conservation-focused visits.",highlights:["Birdwatching","Wetlands","Wildlife conservation"]},
  "Janakpur":{region:"Madhesh Province",image:"/images/janakpur.jpg",intro:"Experience Mithila art, sacred heritage and the distinctive cultural life of the eastern Terai.",highlights:["Janaki Mandir","Mithila culture","Heritage walks"]},
  "Dharan":{region:"Koshi Province",image:"/images/dharan.jpg",intro:"A lively eastern city and a convenient base for local food, viewpoints and nearby hill escapes.",highlights:["Local food","Bhedetar gateway","Eastern Nepal"]},
  "Biratnagar":{region:"Koshi Province",image:"/images/biratnagar.jpg",intro:"Explore a major eastern Nepal hub, local markets and nearby cultural and nature destinations.",highlights:["Eastern gateway","Local markets","Regional connections"]},
  "Butwal":{region:"Lumbini Province",image:"",intro:"A growing gateway city linking the western Terai with hill towns and heritage destinations.",highlights:["Siddharthanagar gateway","Local markets","Western connections"]},
  "Hetauda":{region:"Bagmati Province",image:"",intro:"A relaxed central Nepal city connecting the Terai, forested foothills and nearby heritage routes.",highlights:["Makwanpur","Central Nepal","Foothill scenery"]},
  "Tansen":{region:"Lumbini Province",image:"",intro:"A historic hill town with old bazaars, traditional crafts and scenic views across Palpa.",highlights:["Rani Mahal","Old bazaar","Palpa culture"]},
  "Nepalgunj":{region:"Lumbini Province",image:"",intro:"A western Nepal travel hub and starting point for journeys into remote mountain regions.",highlights:["Bageshwori Temple","Local markets","Western gateway"]},
  "Dhangadhi":{region:"Sudurpashchim Province",image:"",intro:"Discover far-western Nepal's urban life, regional food and gateways to protected landscapes.",highlights:["Far-west culture","Local food","Shuklaphanta gateway"]},
  "Bhedetar":{region:"Koshi Province",image:"",intro:"A cool eastern hill station with viewpoints, fresh air and easy access to local food stops.",highlights:["Viewpoints","Mountain air","Local food"]}
};
const genericExtensions={};
for(const [name,profile] of Object.entries(destinationProfiles)){
  const h=profile.highlights;
  const intro=profile.intro;
  plans[name]={
    image:profile.image,region:profile.region,intro,
    balanced:[[ "Arrive and get oriented","Arrive in "+name+", settle in and explore a nearby neighbourhood or viewpoint at an easy pace.","Arrival day"],["Explore the highlights","Choose from "+h[0]+", "+h[1]+" and other locally recommended stops. Check access and opening information before setting out.","Main discovery day"],["Local flavour and onward travel","Enjoy "+h[2]+", try regional food and leave a comfortable buffer for your onward journey.","Flexible finish"]],
    nature:[["A gentle arrival","Settle in and enjoy the surrounding landscape with a short walk suited to the weather and your ability.","Easy start"],["Nature and scenery","Explore local outdoor highlights such as "+h[1]+" with local guidance; check trail, road and weather conditions.","Outdoor day"],["Slow scenic morning","Choose a quiet viewpoint or nature stop around "+h[2]+" before departure.","Nature finish"]],
    culture:[["Local orientation","Get to know "+name+" through its neighbourhoods, food and everyday life.","Local introduction"],["Heritage and community","Explore "+h[0]+" and "+h[1]+" respectfully, ideally with a knowledgeable local guide.","Culture day"],["Craft, food and stories","Spend time learning about local traditions and regional food before travelling onward.","Heritage finish"]],
    relaxed:[["Arrive and unwind","Check in, rest and enjoy an unhurried first look at "+name+".","Low effort"],["A slow day in "+name,"Choose one or two favourite stops from "+h.join(", ")+" and leave plenty of time for rest.","Slow pace"],["Flexible departure morning","Enjoy a relaxed breakfast and allow extra time for road, weather or flight conditions.","Easy finish"]]
  };
  genericExtensions[name]=[["Explore beyond the centre","Ask a local host about a nearby viewpoint, community experience or short walk that suits current conditions.","Local discovery"],["A flexible extra day","Choose an additional highlight from "+h.join(", ")+", or keep the day free for rest.","Optional day"],["Food and neighbourhoods","Try regional dishes and spend time with local businesses and communities.","Local flavour"],["Buffer and departure","Keep a buffer for changing road, weather and transport conditions before your onward journey.","Travel buffer"]];
}
const form = document.getElementById("plannerForm");
const destination = document.getElementById("destination");
const requestedDestination = new URLSearchParams(location.search).get("destination");
if(requestedDestination && Object.prototype.hasOwnProperty.call(plans,requestedDestination)) destination.value=requestedDestination;
function renderPlan(shouldScroll){
  const origin=document.getElementById("origin").value;
  const dest=destination.value;
  const days=Math.max(2,Math.min(7,Number(document.getElementById("days").value)||3));
  const style=document.getElementById("style").value;
  const data=plans[dest];
  const items=data[style];
  const selected=[];
  const extraDays=extensions[dest]||genericExtensions[dest]||[];
  for(let i=0;i<days;i++) selected.push(i<items.length?items[i]:extraDays[(i-items.length)%extraDays.length]);
  const label=style==="nature"?"Nature & outdoors":style==="culture"?"Culture & heritage":style==="relaxed"?"Slow & relaxed":"A little of everything";
  const photo=data.image ? "background-image:linear-gradient(90deg,#102a4310,#102a4366),url('"+data.image+"')" : "background-image:linear-gradient(135deg,#174b63,#18a999)";
  const daysHtml=selected.map((item,i)=>'<article class="day" style="animation-delay:'+(i*.06)+'s"><div class="day-number">D'+(i+1)+'</div><div><h3>'+esc(item[0])+'</h3><p>'+esc(item[1])+'</p><small>'+esc(item[2])+'</small></div></article>').join("");
  const busOrigin=origin==="Chitwan"?"Sauraha":origin;
  const busDest=dest==="Chitwan"?"Sauraha":dest==="Kathmandu"?"Kathmandu":dest;
  const supportedBusDest=["Sauraha","Pokhara","Kathmandu","Butwal","Biratnagar","Dharan"];
  const hasDirectRoute=busOrigin==="Kathmandu"&&supportedBusDest.includes(busDest)&&busDest!=="Kathmandu";
  const busUrl=hasDirectRoute?"/?from="+encodeURIComponent(busOrigin)+"&to="+encodeURIComponent(busDest):"/";
  const busLabel=hasDirectRoute?"Check Kathmandu bus search →":"Browse bus search (availability varies) →";
  const serviceUrl="/explore.html?city="+encodeURIComponent(dest==="Chitwan"?"Sauraha":dest);
  document.getElementById("tripResult").innerHTML='<div class="sectionhead"><div><h2>Your suggested itinerary</h2><p>Use this as a flexible starting point and adapt it to your dates.</p></div><span class="step">'+days+' DAYS · '+esc(label.toUpperCase())+'</span></div><div class="trip-summary"><div class="summary-photo" role="img" aria-label="'+esc(dest)+' landscape" style="'+photo+'"></div><div class="summary-copy"><div class="eyebrow">'+esc(data.region)+' · NEPAL</div><h3>'+esc(dest==="Kathmandu"?"Kathmandu Valley":dest)+'</h3><p>'+esc(data.intro)+'</p><div class="summary-meta"><span class="meta-pill">Starting from '+esc(origin)+'</span><span class="meta-pill">'+days+' day outline</span><span class="meta-pill">'+esc(label)+'</span></div></div></div><div class="days">'+daysHtml+'</div><div class="actions"><a class="action primary" href="'+busUrl+'">'+busLabel+'</a><a class="action secondary" href="'+serviceUrl+'">Browse local travel services →</a></div>';
  if(shouldScroll) document.getElementById("tripResult").scrollIntoView({behavior:"smooth",block:"start"});
}
form.addEventListener("submit",e=>{e.preventDefault();renderPlan(true)});
destination.addEventListener("change",()=>{if(document.getElementById("tripResult").querySelector(".days"))renderPlan(false)});
renderPlan();