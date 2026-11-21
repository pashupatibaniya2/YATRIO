/* YATRIO 3D exterior builder. */
(async function(){
 const canvas=document.getElementById("busExteriorCanvas"),status=document.getElementById("busExterior3DStatus");if(!canvas)return;
 let THREE,OrbitControls,renderer,scene,camera,controls,bus=null;
 const defaults={body_style:"standard_coach",primary_color:"#f3f6f7",secondary_color:"#176b87",trim_color:"#18a999",window_tint:"light",headlight_style:"led",wheel_style:"alloy",luggage_bays:true,brand_text:"YATRIO"};
 const read=()=>{const v={};document.querySelectorAll("[data-exterior]").forEach(el=>v[el.dataset.exterior]=el.type==="checkbox"?el.checked:el.value);return {...defaults,...v}};
 const color=v=>/^#[0-9a-f]{6}$/i.test(String(v||""))?v:"#f3f6f7";
 try{
  THREE=await import("https://esm.sh/three@0.161.0");({OrbitControls}=await import("https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js"));
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"low-power"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();scene.background=new THREE.Color("#eaf2f4");camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(8,5.5,10);
  controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.target.set(0,1.4,0);controls.minDistance=5;controls.maxDistance=24;
  scene.add(new THREE.HemisphereLight(0xffffff,0x526a75,2));const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(5,10,7);scene.add(key);const fill=new THREE.DirectionalLight(0x8bd8d0,1.2);fill.position.set(-7,4,-5);scene.add(fill);
  const mat=(c,r=.48,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o};
  function rounded(p,w,h,d,m,x,y,z,r=.12){const sh=new THREE.Shape();sh.moveTo(-w/2+r,-h/2);sh.lineTo(w/2-r,-h/2);sh.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);sh.lineTo(w/2,h/2-r);sh.quadraticCurveTo(w/2,h/2,w/2-r,h/2);sh.lineTo(-w/2+r,h/2);sh.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);sh.lineTo(-w/2,-h/2+r);sh.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.045,bevelThickness:.045});const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o}
  function label(parent,t){if(!t)return;const c=document.createElement("canvas");c.width=512;c.height=128;const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.font="800 62px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(t).slice(0,32),256,64);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.62),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));plane.position.set(0,2.02,.01);parent.add(plane);const other=plane.clone();other.position.z=-.01;other.rotation.y=Math.PI;parent.add(other);const left=plane.clone();left.position.set(-1.29,1.48,0);left.rotation.y=-Math.PI/2;parent.add(left);const right=plane.clone();right.position.set(1.29,1.48,0);right.rotation.y=Math.PI/2;parent.add(right)}
  function build(cfg){
   if(bus){scene.remove(bus);bus.traverse(o=>{o.geometry?.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}})}
   bus=new THREE.Group();scene.add(bus);const high=cfg.body_style==="high_deck"||cfg.body_style==="sleeper",length=cfg.body_style==="sleeper"?8.8:10.2,height=high?3.15:2.75,width=2.55;
   const primary=mat(color(cfg.primary_color),.34,.18),secondary=mat(color(cfg.secondary_color),.4,.12),trim=mat(color(cfg.trim_color),.3,.35),glass=mat(cfg.window_tint==="dark"?"#142c3b":cfg.window_tint==="clear"?"#a9d7e1":"#477887",.16,.25),rubber=mat("#17252c",.9),metal=mat(cfg.wheel_style==="standard"?"#65747b":"#c5d0d4",.28,.75),lamp=mat(cfg.headlight_style==="classic"?"#fff0c2":"#e5fbff",.18,.1),dark=mat("#182b35",.5);
   rounded(bus,width,height,length,primary,0,height/2,0,.22);box(bus,width+.025,.55,length-.15,secondary,0,.42,0);box(bus,width+.04,.09,length-.12,trim,0,.72,0);box(bus,width-.14,.12,length-.4,trim,0,height+.015,0);
   rounded(bus,width-.12,.72,.12,dark,0,height-.48,length/2+.015,.08);const wind=box(bus,width*.78,1,.035,glass,0,height-.86,length/2+.09);wind.rotation.x=-.16;box(bus,width*.8,.55,.04,glass,0,.9,-length/2-.08);
   const count=cfg.body_style==="tourist"?6:8,winY=high?2.05:1.82,winH=high?1:.82,winW=(length-1.7)/count-.07;
   for(const side of [-1,1])for(let i=0;i<count;i++){const z=-length/2+.92+i*(length-1.7)/count;box(bus,.035,winH,winW,glass,side*(width/2+.018),winY,z);box(bus,.055,.045,winW+.04,trim,side*(width/2+.04),winY+winH/2,z)}
   for(const side of [-1,1])for(const z of [-length*.31,length*.31]){
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.49,.49,.28,32),rubber);tire.rotation.z=Math.PI/2;tire.position.set(side*(width/2+.02),.52,z);bus.add(tire);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(cfg.wheel_style==="premium"?.31:.27,cfg.wheel_style==="premium"?.31:.27,.3,32),metal);hub.rotation.z=Math.PI/2;hub.position.copy(tire.position);bus.add(hub);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.31,20),trim);cap.rotation.z=Math.PI/2;cap.position.copy(tire.position);bus.add(cap);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.53,.045,8,28,Math.PI),trim);arch.rotation.z=Math.PI;arch.position.set(side*(width/2+.03),.52,z);bus.add(arch)
   }
   for(const side of [-1,1]){box(bus,.34,.19,.06,lamp,side*.72,.58,length/2+.1);box(bus,.12,.08,.07,trim,side*.98,.87,length/2+.1);box(bus,.12,.12,.48,dark,side*(width/2+.2),height-1.03,length/2-.22);if(cfg.luggage_bays!==false)for(let i=0;i<3;i++){const z=-length*.25+i*length*.25;box(bus,.035,.42,1.25,trim,side*(width/2+.035),.39,z);box(bus,.045,.035,.16,dark,side*(width/2+.06),.43,z+.47)}for(let i=0;i<5;i++)box(bus,.045,.06,.12,lamp,side*(width/2+.035),.79,-length*.35+i*length*.17)}
   box(bus,.78,.28,.06,dark,0,.94,length/2+.11);for(let i=0;i<5;i++)box(bus,.06,.2,.025,metal,-.28+i*.14,.94,length/2+.15);
   for(const side of [-1,1]){box(bus,.25,.62,.055,mat("#c94d42"),side*.94,1,-length/2-.08);box(bus,.18,.12,.06,lamp,side*.94,.62,-length/2-.08)}
   label(bus,cfg.brand_text||"YATRIO");bus.rotation.y=-.28;controls.target.set(0,height*.55,0);camera.position.set(8,height*2,11);controls.update();
  }
  const resize=()=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(canvas);resize();
  document.querySelectorAll("[data-exterior]").forEach(el=>el.addEventListener("input",()=>build(read())));
  window.YatrioExterior3D={setConfig(cfg){const v={...defaults,...(cfg||{})};document.querySelectorAll("[data-exterior]").forEach(el=>{if(Object.hasOwn(v,el.dataset.exterior)){if(el.type==="checkbox")el.checked=!!v[el.dataset.exterior];else el.value=v[el.dataset.exterior]}});build(read())},getConfig:read,reset(){this.setConfig(defaults)}};
  build(read());function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();status.textContent="Interactive 3D exterior ready · drag to orbit · scroll to zoom.";
 }catch(e){console.warn("Exterior preview unavailable",e);if(status)status.textContent="3D preview is unavailable on this device; customization settings can still be saved."}
})();