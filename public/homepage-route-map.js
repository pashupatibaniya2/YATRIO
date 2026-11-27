(()=>{"use strict";
const coords=window.YATRIO_DESTINATION_LOCATIONS||{};
const map=document.querySelector("#route-map .nepal-map"),selected=document.getElementById("mapSelected");
if(!map||!selected||!Object.keys(coords).length)return;
const old=[...map.querySelectorAll(".map-node:not(.hub)")];old.forEach(n=>n.remove());
const ns="http://www.w3.org/2000/svg";
let markerLayer=map.querySelector("#yatrioAllDestinationMarkers");
if(!markerLayer){markerLayer=document.createElementNS(ns,"g");markerLayer.id="yatrioAllDestinationMarkers";map.appendChild(markerLayer);}
const hub=map.querySelector(".map-node.hub");if(hub)hub.setAttribute("transform","translate("+((70+(85.324-80.1)/8.1*780).toFixed(1))+" "+((88+(30-27.7172)/3.7*205).toFixed(1))+")");
map.querySelector(".map-routes")?.remove();
const style=document.createElement("style");style.textContent=`
#route-map .route-map-shell{grid-template-columns:minmax(240px,.78fr) minmax(0,2fr)}
#route-map .route-map-visual{min-width:0}
#route-map .nepal-map{width:100%;height:auto;min-height:300px;overflow:visible}
#route-map .map-node.destination-added{cursor:pointer;outline:none}
#route-map .map-node.destination-added circle.node-core{fill:#f2b84b;stroke:#fff;stroke-width:3}
#route-map .map-node.destination-added circle.node-pulse{fill:#f2b84b22;stroke:#f2b84b88;stroke-width:1.5}
#route-map .map-node.destination-added:hover circle.node-core,#route-map .map-node.destination-added:focus circle.node-core,#route-map .map-node.destination-added.chosen circle.node-core{fill:#18a999;stroke:#fff;stroke-width:4}
#route-map .map-node.destination-added text{font:700 10px Arial,sans-serif;fill:#16384a;paint-order:stroke;stroke:#eaf7f1;stroke-width:3px;stroke-linejoin:round;pointer-events:none}
#route-map .map-explore-tools{display:grid;gap:10px;margin-top:14px}
#route-map .map-explore-tools label{font-size:11px;font-weight:800;color:#a8ddd4;letter-spacing:.08em;text-transform:uppercase}
#route-map .map-explore-tools select{width:100%;padding:11px 12px;border:1px solid #ffffff38;border-radius:10px;background:#214e61;color:#fff}
#route-map .map-route-ideas{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
#route-map .map-route-ideas button{border:1px solid #ffffff45;background:#ffffff10;color:#e7f5f1;border-radius:30px;padding:7px 10px;font-size:11px;font-weight:700}
#route-map .map-route-ideas button:hover{background:#18a999;border-color:#18a999}
#route-map .map-coverage{font-size:11px;color:#b9d4d9;margin-top:8px}
@media(max-width:800px){#route-map .route-map-shell{grid-template-columns:1fr}#route-map .nepal-map{min-height:220px}}
`;
document.head.appendChild(style);
const title=s=>s.split("-").map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ").replace("Everest Region","Everest Region").replace("Api Nampa","Api Nampa").replace("Shey Phoksundo","Shey Phoksundo");
const keyLabels=new Set(["kathmandu","pokhara","chitwan","lumbini","biratnagar","dharan","janakpur","ilam","dhangadhi","nepalgunj","rara-lake","jomsom","lukla","mustang","khaptad","simikot"]);
const names={kathmandu:"Kathmandu",pokhara:"Pokhara",chitwan:"Chitwan",lumbini:"Lumbini",dharan:"Dharan",ilam:"Ilam",janakpur:"Janakpur",biratnagar:"Biratnagar","rara-lake":"Rara Lake","shey-phoksundo":"Shey Phoksundo","everest-region":"Everest Region",khaptad:"Khaptad"};
const x=lon=>Math.max(70,Math.min(850,70+(lon-80.1)/8.1*780));
const y=lat=>Math.max(95,Math.min(290,88+(30-lat)/3.7*205));
const connectionLayer=document.createElementNS(ns,"g");connectionLayer.setAttribute("fill","none");connectionLayer.setAttribute("stroke","#18a999");connectionLayer.setAttribute("stroke-width","2.5");connectionLayer.setAttribute("stroke-dasharray","7 9");connectionLayer.setAttribute("opacity",".65");connectionLayer.id="yatrioSuggestedConnections";
const hubX=x(85.324),hubY=y(27.7172);["pokhara","chitwan","lumbini","janakpur","biratnagar","dharan","ilam","nepalgunj","dhangadhi"].forEach(k=>{if(!coords[k])return;const p=coords[k],px=x(p[1]),py=y(p[0]),midX=(hubX+px)/2,midY=Math.min(hubY,py)-24;const path=document.createElementNS(ns,"path");path.setAttribute("d","M"+hubX+" "+hubY+" Q"+midX+" "+midY+" "+px+" "+py);connectionLayer.appendChild(path);});
map.insertBefore(connectionLayer,markerLayer);
function addOption(name){const select=document.getElementById("to");if(!select)return;let opt=[...select.options].find(o=>o.value.toLowerCase()===name.toLowerCase());if(!opt){opt=document.createElement("option");opt.value=name;opt.textContent=name;select.add(opt);}select.value=opt.value;}
function choose(name,slug,node){addOption(name);selected.textContent="Kathmandu → "+name+" · selected · choose Search selected route";map.querySelectorAll(".map-node:not(.hub)").forEach(n=>n.classList.remove("chosen"));if(node)node.classList.add("chosen");const dest=window.__YATRIO_DEST_META?.[slug];const meta=document.getElementById("mapLocationMeta");if(meta)meta.textContent=(dest?.province||"Nepal")+" · "+(dest?.tagline||"Explore this destination");}
async function build(){
 let destinations=[];
 try{const r=await fetch("/api/marketplace");if(r.ok){const d=await r.json();destinations=d.destinations||[];}}catch(e){}
 if(!destinations.length)destinations=Object.keys(coords).map(slug=>({slug,name:names[slug]||title(slug),province:"Nepal"}));
 window.__YATRIO_DEST_META=Object.fromEntries(destinations.map(d=>[d.slug,d]));
 markerLayer.innerHTML="";
 destinations.filter(d=>coords[d.slug]).forEach((d,i)=>{
  const p=coords[d.slug],g=document.createElementNS(ns,"g");g.setAttribute("class","map-node destination-added");g.setAttribute("transform","translate("+x(p[1]).toFixed(1)+" "+y(p[0]).toFixed(1)+")");g.setAttribute("tabindex","0");g.setAttribute("role","button");g.setAttribute("aria-label","Select "+d.name+" in "+d.province+" Province");
  const pulse=document.createElementNS(ns,"circle");pulse.setAttribute("class","node-pulse");pulse.setAttribute("r",i<8?"10":"7");
  const core=document.createElementNS(ns,"circle");core.setAttribute("class","node-core");core.setAttribute("r",i<8?"5.5":"4");
  g.append(pulse,core);
  if(keyLabels.has(d.slug)){const t=document.createElementNS(ns,"text");t.textContent=(names[d.slug]||d.name).toUpperCase();t.setAttribute("x",d.slug==="kathmandu"?0:9);t.setAttribute("y",d.slug==="kathmandu"?-12:3);t.setAttribute("text-anchor",d.slug==="kathmandu"?"middle":"start");g.appendChild(t);}
  const activate=()=>choose(d.name,d.slug,g);g.addEventListener("click",activate);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate();}});
  const tip=document.createElementNS(ns,"title");tip.textContent=d.name+" · "+d.province+" Province";g.appendChild(tip);markerLayer.appendChild(g);
 });
 const count=document.createElement("div");count.className="map-coverage";count.id="mapLocationMeta";count.textContent=destinations.filter(d=>coords[d.slug]).length+" mapped destinations · all seven provinces · select any pin";
 const tools=document.createElement("div");tools.className="map-explore-tools";
 const label=document.createElement("label");label.textContent="Explore by province";
 const filter=document.createElement("select");filter.id="homeMapProvince";filter.setAttribute("aria-label","Filter map destinations by province");
 filter.innerHTML='<option value="all">All seven provinces</option>'+["Koshi","Madhesh","Bagmati","Gandaki","Lumbini","Karnali","Sudurpashchim"].map(p=>'<option value="'+p+'">'+p+' Province</option>').join("");
 filter.addEventListener("change",()=>{[...markerLayer.children].forEach(g=>{const slug=Object.keys(coords).find(k=>{const p=coords[k];return g.getAttribute("transform")==="translate("+x(p[1]).toFixed(1)+" "+y(p[0]).toFixed(1)+")"});const d=window.__YATRIO_DEST_META?.[slug];g.style.opacity=filter.value==="all"||d?.province===filter.value?"1":".12";g.style.pointerEvents=filter.value==="all"||d?.province===filter.value?"auto":"none";});count.textContent=(filter.value==="all"?"All Nepal":filter.value+" Province")+" · choose a highlighted pin";});
 tools.append(label,filter,count);
 const ideas=document.createElement("div");ideas.className="map-route-ideas";ideas.setAttribute("aria-label","Suggested Nepal journeys");
 const rec=[["Kathmandu","Pokhara","Himalayan views"],["Kathmandu","Chitwan","Wildlife & jungle"],["Kathmandu","Janakpur","Mithila heritage"],["Kathmandu","Ilam","Tea gardens"],["Pokhara","Jomsom","Mustang gateway"],["Nepalgunj","Jumla","Karnali adventure"],["Dhangadhi","Khaptad","Far-west nature"]];
 rec.forEach(([a,b,desc])=>{const btn=document.createElement("button");btn.type="button";btn.textContent=a+" → "+b+" · "+desc;btn.addEventListener("click",()=>{document.getElementById("from").value=a;choose(b,b.toLowerCase().replaceAll(" ","-"),null);});ideas.appendChild(btn);});
 const copy=document.querySelector("#route-map .route-map-copy");if(copy){let oldTools=copy.querySelector(".map-explore-tools");if(oldTools)oldTools.remove();copy.append(tools,ideas);}
 const oldCaption=map.querySelector(".map-caption");if(oldCaption)oldCaption.textContent="61 DESTINATIONS ACROSS ALL 7 PROVINCES · SELECT A PIN";
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build,{once:true});else build();
})();