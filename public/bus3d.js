/* YATRIO V100: Three.js coach cabin with accessible CSS fallback */
(async function(){
 const panel=document.getElementById("bus3dPanel"),view=document.getElementById("bus3dViewport"),fallback=document.getElementById("bus3dShell");
 if(!panel||!view||!fallback)return;
 let THREE,OrbitControls;
 try{
  THREE=await import("https://esm.sh/three@0.161.0");
  ({OrbitControls}=await import("https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js"));
  if(!document.querySelector("#seatGrid [data-seat-id]"))await new Promise(resolve=>{const grid=document.getElementById("seatGrid");if(!grid)return resolve();const observer=new MutationObserver(()=>{if(grid.querySelector("[data-seat-id]")){observer.disconnect();resolve()}});observer.observe(grid,{childList:true,subtree:true})});
 }catch(e){console.warn("3D library unavailable; CSS seat map remains active",e);return}
 const canvas=document.createElement("canvas");canvas.className="bus3d-canvas";canvas.setAttribute("aria-label","Interactive 3D bus interior. Drag to orbit; select a seat.");canvas.style.display="none";view.insertBefore(canvas,fallback);
 let renderer;
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xf2f7f8);
  const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(7,7.5,10);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.target.set(0,1,0);controls.maxPolarAngle=Math.PI*.49;
  scene.add(new THREE.HemisphereLight(0xeaf8ff,0x617b86,2));
  const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(5,12,7);light.castShadow=true;scene.add(light);
  const fill=new THREE.DirectionalLight(0x8ed8d2,1);fill.position.set(-6,5,-5);scene.add(fill);
  const mat=(c,r=.7)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
  const cabin=new THREE.Group();scene.add(cabin);
  const buttons=()=>[...document.querySelectorAll("#seatGrid [data-seat-id]")];
  const seats=buttons(),rowCount=Math.max(4,Math.ceil(seats.length/4)),length=rowCount*1.45+3.5;
  function cube(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;cabin.add(o);return o}
  const floor=mat(0x849ca5),wall=mat(0xe5eef0),dark=mat(0x17394b),glass=new THREE.MeshPhysicalMaterial({color:0x9bd7e2,transparent:true,opacity:.48,roughness:.2});
  cube(5,.2,length,floor,0,.08,0);cube(5.1,.16,length+.4,wall,0,-.04,0);
  cube(.16,1.6,length,wall,-2.48,.9,0);cube(.16,1.6,length,wall,2.48,.9,0);
  cube(4.9,1.6,.18,dark,0,.9,-length/2);cube(4.9,1.6,.18,wall,0,.9,length/2);
  for(let z=-length/2+1;z<length/2-1;z+=2.1){cube(.035,.7,1.5,glass,-2.38,1.2,z);cube(.035,.7,1.5,glass,2.38,1.2,z)}
  cube(3.8,.18,.4,dark,0,1,-length/2+.42);cube(3.6,.95,.08,glass,0,2,-length/2+.12);
  cube(1.1,.65,.6,dark,-1.3,.45,-length/2+.95);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.27,.045,10,28),mat(0x263f4a));ring.position.set(-1.4,1.2,-length/2+.72);cabin.add(ring);
  cube(4.7,.1,.12,mat(0xa5b9bf),0,2.45,0);
  for(let z=-length/2+1;z<length/2;z+=2.5)cube(.9,.04,.16,mat(0xffedc0),0,2.36,z);
  const normal=mat(0x2e6474),edge=mat(0x173f50),chosen=mat(0x08a991),off=mat(0x9baab0),seatMap=new Map();
  function makeSeat(s,i){
   const g=new THREE.Group(),col=i%4,row=Math.floor(i/4),x=col<2?-1.42+col*.82:.60+(col-2)*.82,z=-length/2+2+row*1.45;
   g.position.set(x,.18,z);g.userData.id=s.dataset.seatId;
   const type=(s.title||"").toLowerCase(),sleeper=/sleeper|berth|bed/.test(type),w=sleeper ? .72 : .66,d=sleeper ? 1.05 : .72;
   const base=new THREE.Mesh(new THREE.BoxGeometry(w,.18,d),edge);base.position.y=.24;g.add(base);
   const cushion=new THREE.Mesh(new THREE.BoxGeometry(w-.06,.13,d-.06),normal);cushion.position.y=.37;g.add(cushion);
   const back=new THREE.Mesh(new THREE.BoxGeometry(w,.76,.16),normal);back.position.set(0,.8,-d/2+.05);g.add(back);
   const head=new THREE.Mesh(new THREE.BoxGeometry(w*.68,.2,.18),edge);head.position.set(0,1.27,-d/2+.02);g.add(head);
   for(const side of [-1,1]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.08,.16,d*.75),edge);arm.position.set(side*(w/2+.03),.52,0);g.add(arm)}
   const label=document.createElement("canvas");label.width=128;label.height=64;const ctx=label.getContext("2d");ctx.fillStyle="#fff";ctx.font="bold 34px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(s.textContent.trim(),64,32);
   const tex=new THREE.CanvasTexture(label),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sprite.scale.set(.48,.24,1);sprite.position.set(0,.55,.08);g.add(sprite);
   g.userData.parts=[base,cushion,back,head];cabin.add(g);seatMap.set(s.dataset.seatId,g);
  }
  function sync(){
   const list=buttons();list.forEach((b,i)=>{let g=seatMap.get(b.dataset.seatId);if(!g){makeSeat(b,i);g=seatMap.get(b.dataset.seatId)}
    const unavailable=b.disabled,selected=b.classList.contains("selected"),m=unavailable?off:selected?chosen:normal;
    g.userData.parts.forEach(p=>p.material=m);g.userData.parts[0].material=unavailable?off:selected?chosen:edge;g.scale.setScalar(selected?1.06:1);
   });
  }
  sync();
  const ray=new THREE.Raycaster(),pt=new THREE.Vector2();
  canvas.addEventListener("click",e=>{const r=canvas.getBoundingClientRect();pt.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(pt,camera);const hit=ray.intersectObjects(cabin.children,true)[0];let o=hit&&hit.object;while(o&&!o.userData.id)o=o.parent;if(o&&window.toggleSeat)window.toggleSeat(o.userData.id)});
  const resize=()=>{const r=view.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};
  const ro=new ResizeObserver(resize);ro.observe(view);resize();
  let raf=0;function animate(){raf=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();
  canvas.style.display="block";panel.classList.add("webgl-active");fallback.setAttribute("aria-hidden","true");
  new MutationObserver(sync).observe(document.getElementById("seatGrid"),{childList:true,subtree:true,attributes:true,attributeFilter:["class","disabled"]});
  window.addEventListener("yatrio:bus-view",e=>{if(e.detail==="top"){camera.position.set(0,14,.01);controls.target.set(0,0,0)}else{camera.position.set(7,7.5,10);controls.target.set(0,1,0)}controls.update()});
  window.addEventListener("yatrio:bus-rotate",e=>{const a=Number(e.detail||0)*Math.PI/180+Math.PI/4;camera.position.x=Math.sin(a)*13;camera.position.z=Math.cos(a)*13;camera.position.y=7;controls.update()});
  window.addEventListener("yatrio:bus-reset",()=>{camera.position.set(7,7.5,10);controls.target.set(0,1,0);controls.update()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else animate()});
 }catch(e){console.warn("3D renderer failed; CSS seat map remains available",e);if(renderer)renderer.dispose();canvas.remove()}
})();