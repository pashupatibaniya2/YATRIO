/* YATRIO V103: vehicle-aware Three.js interior with seat layouts inferred from approved fleet metadata. */
(async function(){
 const panel=document.getElementById("bus3dPanel"),view=document.getElementById("bus3dViewport"),fallback=document.getElementById("bus3dShell");
 if(!panel||!view||!fallback)return;
 let THREE,OrbitControls;
 try{
  THREE=await import("https://esm.sh/three@0.161.0");
  ({OrbitControls}=await import("https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js"));
  if(!document.querySelector("#seatGrid [data-seat-id]"))await new Promise(resolve=>{const grid=document.getElementById("seatGrid");if(!grid)return resolve();const mo=new MutationObserver(()=>{if(grid.querySelector("[data-seat-id]")){mo.disconnect();resolve()}});mo.observe(grid,{childList:true,subtree:true})});
 }catch(e){console.warn("3D library unavailable; accessible CSS seat map remains active",e);return}
 const canvas=document.createElement("canvas");canvas.className="bus3d-canvas";canvas.setAttribute("aria-label","Interactive 3D bus cabin. Drag to orbit and select available seats.");canvas.style.display="none";view.insertBefore(canvas,fallback);
 let renderer;
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xf2f7f8);
  const camera=new THREE.PerspectiveCamera(42,1,.1,120);camera.position.set(7,7.5,10);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.target.set(0,1,0);controls.maxPolarAngle=Math.PI*.49;controls.minDistance=4;controls.maxDistance=28;
  scene.add(new THREE.HemisphereLight(0xeaf8ff,0x617b86,2));
  const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(5,12,7);key.castShadow=true;scene.add(key);
  const fill=new THREE.DirectionalLight(0x8ed8d2,1);fill.position.set(-6,5,-5);scene.add(fill);
  const mat=(c,r=.7)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
  const cabin=new THREE.Group();scene.add(cabin);
  const seatMap=new Map(),ray=new THREE.Raycaster(),pt=new THREE.Vector2();
  let layout="coach-2x2",rowCount=4,cabinLength=9.3,seatCount=0;
  const buttons=()=>[...document.querySelectorAll("#seatGrid [data-seat-id]")];
  function cube(parent,w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
  function detectLayout(list){
   const bus=(panel.dataset.busType||"").toLowerCase(),types=list.map(b=>(b.title||"").toLowerCase());
   const sleeper=/sleeper|berth/.test(bus)||types.some(t=>/sleeper|berth|bed/.test(t));
   const sofa=/sofa|2\s*\+\s*1|2x1|2-1/.test(bus)||types.some(t=>/sofa|single.?side|2\s*\+\s*1/.test(t));
   return sleeper?"sleeper-2x1":sofa?"sofa-2x1":"coach-2x2";
  }
  function makeLabel(text){
   const c=document.createElement("canvas");c.width=128;c.height=64;const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.font="bold 32px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(text).slice(0,9),64,32);
   const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
   return new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  }
  function clearCabin(){while(cabin.children.length){const o=cabin.children.pop();o.traverse?.(x=>{x.geometry?.dispose();if(Array.isArray(x.material))x.material.forEach(m=>m.dispose());else x.material?.dispose()})}seatMap.clear()}
  let seatNormal,seatEdge,seatChosen,seatUnavailable;
  function buildCabin(list){
   clearCabin();layout=detectLayout(list);const sleeper=layout==="sleeper-2x1",twoPlusOne=layout!=="coach-2x2";
   const perRow=twoPlusOne?3:4;rowCount=Math.max(3,Math.ceil(list.length/perRow));cabinLength=rowCount*(sleeper?1.85:1.48)+3.5;
   const floor=mat(0x849ca5),wall=mat(0xe5eef0),dark=mat(0x17394b),glass=new THREE.MeshPhysicalMaterial({color:0x9bd7e2,transparent:true,opacity:.48,roughness:.2});
   cube(cabin,5,.2,cabinLength,floor,0,.08,0);cube(cabin,5.1,.16,cabinLength+.4,wall,0,-.04,0);
   cube(cabin,.16,1.6,cabinLength,wall,-2.48,.9,0);cube(cabin,.16,1.6,cabinLength,wall,2.48,.9,0);
   cube(cabin,4.9,1.6,.18,dark,0,.9,-cabinLength/2);cube(cabin,4.9,1.6,.18,wall,0,.9,cabinLength/2);
   for(let z=-cabinLength/2+1;z<cabinLength/2-1;z+=2.1){cube(cabin,.035,.7,1.5,glass,-2.38,1.2,z);cube(cabin,.035,.7,1.5,glass,2.38,1.2,z)}
   cube(cabin,3.8,.18,.4,dark,0,1,-cabinLength/2+.42);cube(cabin,3.6,.95,.08,glass,0,2,-cabinLength/2+.12);
   cube(cabin,1.1,.65,.6,dark,-1.3,.45,-cabinLength/2+.95);
   const wheel=new THREE.Mesh(new THREE.TorusGeometry(.27,.045,10,28),mat(0x263f4a));wheel.position.set(-1.4,1.2,-cabinLength/2+.72);cabin.add(wheel);
   cube(cabin,4.7,.1,.12,mat(0xa5b9bf),0,2.45,0);
   for(let z=-cabinLength/2+1;z<cabinLength/2;z+=2.5)cube(cabin,.9,.04,.16,mat(0xffedc0),0,2.36,z);
   seatNormal=mat(0x2e6474);seatEdge=mat(0x173f50);seatChosen=mat(0x08a991);seatUnavailable=mat(0x9baab0);
   const slots=twoPlusOne?[-1.18,-.48,1.08]:[-1.48,-.78,.78,1.48];
   list.forEach((b,i)=>{
    const row=Math.floor(i/perRow),col=i%perRow,x=slots[col],z=-cabinLength/2+1.9+row*(sleeper?1.85:1.48);
    const g=new THREE.Group();g.position.set(x,.18,z);g.userData.id=b.dataset.seatId;
    const seatType=(b.title||"").toLowerCase(),isBed=sleeper||/sleeper|berth|bed/.test(seatType);
    const w=isBed ? .72 : .66,d=isBed ? 1.52 : .74;
    const parts=[];
    if(isBed){
     const platform=cube(g,w,.18,d,edge,0,.28,0);parts.push(platform);
     const mattress=cube(g,w-.07,.16,d-.08,normal,0,.46,0);parts.push(mattress);
     const pillow=cube(g,w*.72,.12,.3,edge,0,.6,-d/2+.22);parts.push(pillow);
     cube(g,.06,.13,d*.82,edge,-w/2-.03,.48,0);cube(g,.06,.13,d*.82,edge,w/2+.03,.48,0);
     const rail=cube(g,w,.09,.07,edge,0,.62,d/2-.06);parts.push(rail);
    }else{
     const base=cube(g,w,.18,d,edge,0,.24,0);parts.push(base);
     const cushion=cube(g,w-.06,.13,d-.06,normal,0,.37,0);parts.push(cushion);
     const back=cube(g,w,.76,.16,normal,0,.8,-d/2+.05);parts.push(back);
     const head=cube(g,w*.68,.2,.18,edge,0,1.27,-d/2+.02);parts.push(head);
     for(const side of [-1,1])cube(g,.08,.16,d*.75,edge,side*(w/2+.03),.52,0);
    }
    const label=makeLabel(b.textContent.trim());label.scale.set(.48,.24,1);label.position.set(0,isBed ? .82 : .55,d*.48);g.add(label);
    g.userData.parts=parts;g.userData.unavailable=b.disabled;g.userData.selected=false;cabin.add(g);seatMap.set(b.dataset.seatId,g);
   });
   const badge=document.getElementById("bus3dLayoutName");if(badge)badge.textContent=sleeper?"Sleeper berths · 2+1":twoPlusOne?"Sofa / deluxe · 2+1":"Coach seats · 2+2";
   const dist=Math.max(11,cabinLength*.92);camera.position.set(dist*.68,dist*.65,dist*.9);controls.target.set(0,1,0);controls.update();
  }
  function sync(){
   const list=buttons();if(!list.length)return;
   const signature=layout+"|"+list.map(b=>b.dataset.seatId+":"+b.title).join("|");
   if(signature!==sync.signature){buildCabin(list);sync.signature=signature}
   const normal=seatNormal,chosen=seatChosen,off=seatUnavailable;
   list.forEach(b=>{const g=seatMap.get(b.dataset.seatId);if(!g)return;const unavailable=b.disabled,selected=b.classList.contains("selected");g.userData.unavailable=unavailable;g.userData.selected=selected;const m=unavailable?off:selected?chosen:normal;g.userData.parts.forEach(p=>{p.material=m});if(g.userData.parts[0]&&!unavailable&&!selected)g.userData.parts[0].material=seatEdge;g.scale.setScalar(selected?1.06:1)});
  }
  sync();
  canvas.addEventListener("click",e=>{const r=canvas.getBoundingClientRect();pt.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(pt,camera);const hit=ray.intersectObjects(cabin.children,true)[0];let o=hit&&hit.object;while(o&&!o.userData.id)o=o.parent;if(o&&window.toggleSeat)window.toggleSeat(o.userData.id)});
  const resize=()=>{const r=view.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};
  const ro=new ResizeObserver(resize);ro.observe(view);resize();
  let raf=0;function animate(){raf=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();
  canvas.style.display="block";panel.classList.add("webgl-active");fallback.setAttribute("aria-hidden","true");
  new MutationObserver(sync).observe(document.getElementById("seatGrid"),{childList:true,subtree:true,attributes:true,attributeFilter:["class","disabled","title"]});
  window.addEventListener("yatrio:bus-view",e=>{if(e.detail==="top"){camera.position.set(0,Math.max(13,cabinLength),.01);controls.target.set(0,0,0)}else{const d=Math.max(11,cabinLength*.92);camera.position.set(d*.68,d*.65,d*.9);controls.target.set(0,1,0)}controls.update()});
  window.addEventListener("yatrio:bus-rotate",e=>{const a=Number(e.detail||0)*Math.PI/180+Math.PI/4,d=Math.max(11,cabinLength*.92);camera.position.x=Math.sin(a)*d;camera.position.z=Math.cos(a)*d;camera.position.y=d*.65;controls.update()});
  window.addEventListener("yatrio:bus-reset",()=>{const d=Math.max(11,cabinLength*.92);camera.position.set(d*.68,d*.65,d*.9);controls.target.set(0,1,0);controls.update()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else animate()});
 }catch(e){console.warn("3D renderer failed; CSS seat map remains available",e);if(renderer)renderer.dispose();canvas.remove();panel.classList.remove("webgl-active")}
})();