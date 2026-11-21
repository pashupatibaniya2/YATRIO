const API=(window.__HATCHABLE__&&window.__HATCHABLE__.api)||"/api";
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let fleet=[],activeVehicle=null,THREE=null,OrbitControls=null,renderer=null,scene=null,camera=null,controls=null,vehicleGroup=null,animationId=0,resizeObserver=null;
const normalize=s=>String(s||"").toLowerCase().replace(/[_-]/g," ");
function typeMatch(v,f){if(!f)return true;const t=normalize(v.bus_type),e=v.seat_layout_config?.vehicle?.exterior||{},layout=v.seat_layout_config?.layout||"";if(f==="high")return /high/.test(t)||e.body_style==="high_deck";if(f==="sleeper")return /sleeper|berth/.test(t)||layout==="sleeper_2x1";if(f==="sofa")return /sofa|vip/.test(t)||layout==="sofa_2x1";if(f==="tourist")return /tourist/.test(t);return /coach|bus/.test(t)||layout==="coach_2x2"}
function render(){
 const q=normalize($("fleetSearch").value),type=$("typeFilter").value,amenity=$("amenityFilter").value;
 const filtered=fleet.filter(v=>(!q||normalize(v.bus_name+" "+v.operator_name+" "+v.bus_type).includes(q))&&typeMatch(v,type)&&(!amenity||v.amenities.some(a=>normalize(a).includes(amenity))));
 $("fleetCount").textContent=filtered.length+" of "+fleet.length+" vehicles";
 if(!filtered.length){$("fleetGrid").innerHTML='<div class="empty"><strong>No vehicles match those filters.</strong><br>Try another search or clear a filter.</div>';return}
 $("fleetGrid").innerHTML=filtered.map(v=>{
  const photo=v.bus_images.find(i=>i.image_type==="exterior")||v.bus_images[0],ext=v.seat_layout_config?.vehicle?.exterior||{},layout=v.seat_layout_config?.layout||"auto";
  const image=photo?'<img src="'+esc(photo.url)+'" alt="'+esc(photo.alt_text||v.bus_name)+'" loading="lazy">':'<div class="illustrative"><span>3D VEHICLE PREVIEW</span></div>';
  const logo=v.logo_url?'<img class="fleet-logo" src="'+esc(v.logo_url)+'" alt="'+esc(v.operator_name)+' logo">':"";
  const amenities=v.amenities.slice(0,4).map(a=>'<span>'+esc(String(a).replace(/_/g," "))+'</span>').join("");
  return '<article class="fleet-card"><div class="fleet-image">'+image+'<span class="tag">'+(photo?"APPROVED FLEET PHOTO":"3D MODEL AVAILABLE")+'</span>'+logo+'</div><div class="fleet-body"><div class="fleet-operator">'+esc(v.operator_name)+'</div><h3>'+esc(v.bus_name)+'</h3><div class="fleet-type">'+esc(v.bus_type||"Intercity bus")+'</div><div class="specs"><span>◉ '+esc(v.capacity||"—")+' seats</span><span>▦ '+esc(layout.replace(/_/g," "))+'</span><span>↗ '+esc(v.upcoming_services)+" upcoming service"+(v.upcoming_services===1?"":"s")+'</span></div><div class="amenities">'+(amenities||"<span>Amenities not listed</span>")+'</div><div class="card-actions"><button class="preview-btn" data-preview="'+esc(v.bus_id)+'">Explore 3D</button><a class="journey-btn" href="/#searchForm">Find journeys</a></div></div></article>'
 }).join("");
 $("fleetGrid").querySelectorAll("[data-preview]").forEach(b=>b.addEventListener("click",()=>openViewer(b.dataset.preview)));
}
async function loadFleet(){
 try{const r=await fetch(API+"/fleet-showroom");const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load the fleet");fleet=d.vehicles||[];$("demoNotice").textContent=d.notice||"Fleet details are supplied by approved operators. Check journey results for current service information.";render();const requested=new URLSearchParams(location.search).get("bus_id");if(requested&&fleet.some(v=>v.bus_id===requested))openViewer(requested)}
 catch(e){$("fleetCount").textContent="Fleet unavailable";$("fleetGrid").innerHTML='<div class="empty"><strong>We could not load the fleet.</strong><br>'+esc(e.message)+'<br><button class="preview-btn" id="retryFleet">Try again</button></div>';$("retryFleet")?.addEventListener("click",loadFleet)}
}
function disposeGroup(group){if(!group)return;group.traverse(o=>{o.geometry?.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}})}
function material(color,roughness=.5,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
function cube(parent,w,h,d,mat,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function rounded(parent,w,h,d,mat,x,y,z){const g=new THREE.BoxGeometry(w,h,d,1,1,1);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function buildExterior(v){
 const cfg=v.seat_layout_config||{},e=cfg.vehicle?.exterior||{},body=material(e.primary_color||"#f3f6f7",.34,.18),lower=material(e.secondary_color||"#176b87",.42,.1),trim=material(e.trim_color||"#18a999",.3,.3),glass=material(e.window_tint==="dark"?"#172f3d":e.window_tint==="clear"?"#a9d7e1":"#477887",.18,.15),rubber=material("#192a33",.9),metal=material(e.wheel_style==="standard"?"#68777d":"#c4d0d3",.25,.7),lamp=material("#e9fbff",.15);
 const high=e.body_style==="high_deck"||e.body_style==="sleeper",length=e.body_style==="sleeper"?8.8:10.2,height=high?3.1:2.7,width=2.5;
 rounded(vehicleGroup,width,height,length,body,0,height/2,0);cube(vehicleGroup,width+.02,.5,length-.12,lower,0,.42,0);cube(vehicleGroup,width+.03,.07,length-.12,trim,0,.7,0);cube(vehicleGroup,width-.15,.1,length-.4,trim,0,height+.01,0);
 cube(vehicleGroup,width*.78,.92,.045,glass,0,height-.8,length/2+.04);cube(vehicleGroup,width*.78,.5,.04,glass,0,.9,-length/2-.04);
 const count=8,ww=(length-1.6)/count-.05;for(const side of [-1,1])for(let i=0;i<count;i++){const z=-length/2+.85+i*(length-1.6)/count;cube(vehicleGroup,.04,high?1:.82,ww,glass,side*(width/2+.02),high?2:1.78,z)}
 for(const side of [-1,1])for(const z of [-length*.31,length*.31]){
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,.27,28),rubber);tire.rotation.z=Math.PI/2;tire.position.set(side*(width/2+.02),.5,z);vehicleGroup.add(tire);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.29,28),metal);hub.rotation.z=Math.PI/2;hub.position.copy(tire.position);vehicleGroup.add(hub);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.3,18),trim);cap.rotation.z=Math.PI/2;cap.position.copy(tire.position);vehicleGroup.add(cap);
 }
 for(const side of [-1,1]){cube(vehicleGroup,.32,.18,.06,lamp,side*.7,.55,length/2+.08);cube(vehicleGroup,.12,.12,.42,trim,side*(width/2+.18),height-1,length/2-.2);if(e.luggage_bays!==false)for(let i=0;i<3;i++)cube(vehicleGroup,.035,.4,1.2,trim,side*(width/2+.03),.38,-length*.25+i*length*.25)}
 cube(vehicleGroup,.75,.24,.06,material("#1b3039"),0,.9,length/2+.08);
 if(v.logo_url){new THREE.TextureLoader().load(v.logo_url,tex=>{if(!vehicleGroup)return;tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide});for(const side of [-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.45),m);p.position.set(side*(width/2+.05),1.15,0);p.rotation.y=side>0?Math.PI/2:-Math.PI/2;vehicleGroup.add(p)}})}
 vehicleGroup.rotation.y=-.3;
}
function buildInterior(v){
 const cfg=v.seat_layout_config||{},vehicle=cfg.vehicle||{},layout=cfg.layout||"auto",sofa=layout==="sofa_2x1"||/sofa/i.test(v.bus_type||""),sleeper=layout==="sleeper_2x1"||/sleeper/i.test(v.bus_type||""),perRow=sofa||sleeper?3:4,configured=Array.isArray(cfg.seats)?cfg.seats:[];
 const width=Number(cfg.cabin_width)||2.45,length=9.5,deckCount=Math.max(1,Math.min(2,Number(vehicle.deck_count)||1)),rows=Math.max(4,configured.length?Math.max(...configured.map(s=>Number(s.row)||1)):Math.ceil((Number(v.capacity)||32)/perRow/deckCount)),rowGap=Number(cfg.row_spacing)||.74,floor=material("#899da4"),wall=material(cfg.interior_color||"#e5eef0"),seat=material(cfg.seat_color||"#2e6474"),trim=material("#9bb6bb"),dark=material("#18394a"),glass=material("#a5d6df",.2);
 cube(vehicleGroup,width,.16,length,floor,0,.08,0);cube(vehicleGroup,width,.08,length,wall,0,-.02,0);cube(vehicleGroup,.12,1.6,length,wall,-width/2,.85,0);cube(vehicleGroup,.12,1.6,length,wall,width/2,.85,0);
 for(const side of [-1,1])for(let z=-3.7;z<=3.8;z+=1.9)cube(vehicleGroup,.04,.7,1.2,glass,side*(width/2-.03),1.2,z);
 cube(vehicleGroup,width-.2,.16,.18,dark,0,.15,4.55);
 for(let deck=0;deck<deckCount;deck++){
  const y=deck*2.35;if(deck===1){cube(vehicleGroup,width,.14,length,wall,0,y+1.85,0);cube(vehicleGroup,.08,.65,length,trim,0,y+2.25,0)}
  const seats=configured.length?configured.filter(s=>(Number(s.deck)||1)===deck+1):Array.from({length:rows*perRow},(_,i)=>({row:Math.floor(i/perRow)+1,col:i%perRow+1,seat_type:layout}));
  for(const item of seats){
   const row=Number(item.row)||1,col=Number(item.col)||1,z=-length/2+1.1+(row-1)*Math.min(rowGap*1.65,(length-2.2)/Math.max(1,rows-1));
   let x;if(sofa||sleeper){x=col<=2?-.62:.62;if(col===3)x=.62}else{x=[-.86,-.32,.32,.86][Math.min(3,Math.max(0,col-1))]}
   const seatMat=material(seat.color.getStyle(),.72),seatW=sleeper?.48:.44,seatD=sleeper?.72:.46;
   cube(vehicleGroup,seatW,.12,seatD,seatMat,x,y+.28,z);cube(vehicleGroup,seatW,.66,.14,seatMat,x,y+.64,z-seatD*.35);cube(vehicleGroup,seatW+.025,.07,seatD,trim,x,y+.37,z);
  }
 }
 cube(vehicleGroup,.5,.65,.7,dark,0,.65,-4.15);cube(vehicleGroup,.1,.5,.2,trim,.38,.7,-4.15);vehicleGroup.rotation.y=-.12;
}
async function ensure3D(){
 if(THREE)return;
 THREE=await import("https://esm.sh/three@0.161.0");({OrbitControls}=await import("https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js"));
 const canvas=$("fleetCanvas");renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"low-power"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(8,5.5,10);
 controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=5;controls.maxDistance=22;scene.add(new THREE.HemisphereLight(0xffffff,0x617783,2));const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(5,10,7);scene.add(key);const fill=new THREE.DirectionalLight(0x8bd8d0,1.1);fill.position.set(-7,4,-5);scene.add(fill);
 resizeObserver=new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()});resizeObserver.observe(canvas);
 const loop=()=>{animationId=requestAnimationFrame(loop);controls.update();renderer.render(scene,camera)};loop();
}
function setView(mode){
 if(!activeVehicle||!vehicleGroup)return;disposeGroup(vehicleGroup);vehicleGroup=new THREE.Group();scene.add(vehicleGroup);
 if(mode==="interior")buildInterior(activeVehicle);else buildExterior(activeVehicle);
 $("viewExterior").classList.toggle("active",mode==="exterior");$("viewInterior").classList.toggle("active",mode==="interior");
 controls.target.set(0,mode==="interior"?1:1.3,0);camera.position.set(mode==="interior"?7:8,mode==="interior"?6:5.5,mode==="interior"?8:10);controls.update();
}
async function openViewer(id){
 activeVehicle=fleet.find(v=>v.bus_id===id);if(!activeVehicle)return;
 $("viewer").classList.add("open");$("viewer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
 $("viewerTitle").textContent=activeVehicle.bus_name;$("viewerSub").textContent=activeVehicle.bus_type+" · "+activeVehicle.operator_name;$("viewerBusName").textContent=activeVehicle.bus_name;$("viewerOperator").textContent=activeVehicle.operator_name+" · "+activeVehicle.capacity+" seats";
 $("viewerSpecs").innerHTML='<span>'+esc(activeVehicle.capacity)+' seats</span><span>'+esc(activeVehicle.bus_type)+'</span><span>'+esc(activeVehicle.upcoming_services)+' upcoming services</span>';
 $("viewerSearch").href="/#search";$("viewerPhotoStrip").hidden=true;$("viewerPhotoStrip").innerHTML=activeVehicle.bus_images.map(i=>'<img src="'+esc(i.url)+'" alt="'+esc(i.alt_text||i.image_type)+'">').join("");
 try{await ensure3D();if(vehicleGroup){scene.remove(vehicleGroup);disposeGroup(vehicleGroup)}vehicleGroup=new THREE.Group();scene.add(vehicleGroup);setView("exterior")}
 catch(e){$("viewerSub").textContent+=" · 3D preview unavailable on this device";console.warn(e)}
}
function closeViewer(){ $("viewer").classList.remove("open");$("viewer").setAttribute("aria-hidden","true");document.body.style.overflow="";activeVehicle=null;if(vehicleGroup){scene?.remove(vehicleGroup);disposeGroup(vehicleGroup);vehicleGroup=null}}
$("fleetSearch").addEventListener("input",render);$("typeFilter").addEventListener("change",render);$("amenityFilter").addEventListener("change",render);
$("viewExterior").addEventListener("click",()=>setView("exterior"));$("viewInterior").addEventListener("click",()=>setView("interior"));
$("closeViewer").addEventListener("click",closeViewer);$("viewer").addEventListener("click",e=>{if(e.target===$("viewer"))closeViewer()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("viewer").classList.contains("open"))closeViewer()});
$("viewerPhotos").addEventListener("click",()=>{$("viewerPhotoStrip").hidden=!$("viewerPhotoStrip").hidden});
loadFleet();