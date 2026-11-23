import * as THREE from 'three';

const $ = id => document.getElementById(id);
const canvas = $('world');
const clamp = THREE.MathUtils.clamp;
const random = (a,b) => a + Math.random()*(b-a);
const TAU = Math.PI*2;
const ISLAND_Y = 12;
const ISLAND_RADIUS = 24;
const LIGHT_COUNT = 12;
const STORAGE = 'skybound-journey-of-light-phase1-v1';
const saved = (() => { try { const d=JSON.parse(localStorage.getItem(STORAGE)||'{}'); return Array.isArray(d.collected)?d.collected.filter(v=>Number.isInteger(v)&&v>=0&&v<LIGHT_COUNT):[]; } catch { return []; }})();
const found = new Set(saved);
let started = false, completed = false, elapsed=0, toastTime=0;
const keys = new Set();
const joy = {x:0,y:0};
const input = {jump:false,fly:false};
let muted=false;
let audio;

function message(msg){$('toast').textContent=msg;$('toast').classList.add('visible');toastTime=2.2;}
function playSound(freq=590,duration=.2){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.4,audio.currentTime+duration);g.gain.setValueAtTime(.03,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function updateHUD(){$('collected').textContent=`${found.size} / ${LIGHT_COUNT}`;$('mission-text').textContent=found.size===LIGHT_COUNT?'Every lost light has returned! The island shines again.':`Gather ${LIGHT_COUNT-found.size} more light${LIGHT_COUNT-found.size===1?'':'s'} around the island.`;}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({collected:[...found]}))}catch{}}
function showError(err){console.error(err);$('error').hidden=false;$('error-message').textContent=err?.message||String(err);}

let renderer,scene,camera,hero,wingLeft,wingRight,lights=[],clouds=[],waterfalls=[],stars=[];
const clock=new THREE.Clock();
let cameraYaw=.7,cameraPitch=.37, cameraDistance=13;
const pos = new THREE.Vector3(0,ISLAND_Y+1.5,0);
let vy=0,airborne=false,energy=100,grounded=true;
const targetPos = new THREE.Vector3();
const up = new THREE.Vector3(0,1,0);
const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...opts});
const materials={grass:mat(0x7ac9a3),grassLight:mat(0x9ce2b8),earth:mat(0x846d78),stone:mat(0xbfd1cf),trunk:mat(0x795e69),leaf:mat(0x70b89f),leaf2:mat(0xb0d5ae),gold:mat(0xe9bc72,{metalness:.23,roughness:.43}),white:mat(0xf9f6e6),cloth:mat(0x96c7c8),cape:mat(0xffe0b0,{side:THREE.DoubleSide}),dark:mat(0x34556b)};
const glowMat=(hex)=>new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.92});
function mesh(geometry,material,parent=scene,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
function sphere(r,material,parent,x,y,z,w=12,h=10){return mesh(new THREE.SphereGeometry(r,w,h),material,parent,x,y,z);}
function terrainHeight(x,z){const radial=Math.hypot(x,z);if(radial>ISLAND_RADIUS-1.2)return -Infinity;return ISLAND_Y+.18*Math.sin(x*.45)+.16*Math.cos(z*.4);}
function onIsland(x,z){return Math.hypot(x,z)<ISLAND_RADIUS-1.7;}
function makeWorld(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x9dd9e6);scene.fog=new THREE.FogExp2(0x9dd9e6,.009);
 camera=new THREE.PerspectiveCamera(60,1,.1,260);
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.27;
 const hemi=new THREE.HemisphereLight(0xffffff,0x6499a6,2.2);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffe6b7,3);sun.position.set(-35,55,25);scene.add(sun);
 const disk=mesh(new THREE.CylinderGeometry(ISLAND_RADIUS,ISLAND_RADIUS-2.6,2.2,80),materials.grass,scene,0,ISLAND_Y-1,0);disk.scale.z=1;
 const underside=mesh(new THREE.ConeGeometry(ISLAND_RADIUS-2.6,13,80),materials.earth,scene,0,ISLAND_Y-9,0);underside.rotation.z=Math.PI;
 const rock=mesh(new THREE.ConeGeometry(13,14,9),materials.earth,scene,1,ISLAND_Y-19,0);rock.rotation.z=Math.PI;
 for(let i=0;i<12;i++){let a=TAU*i/12, r=19+random(-1.1,1.3);let piece=mesh(new THREE.ConeGeometry(random(2.2,4.5),random(6,12),5),materials.earth,scene,Math.cos(a)*r,ISLAND_Y-5-random(0,3),Math.sin(a)*r);piece.rotation.z=Math.PI;piece.rotation.y=a;}
 const path=mesh(new THREE.RingGeometry(2.7,3.8,48),materials.stone,scene,0,ISLAND_Y+.18,0);path.rotation.x=-Math.PI/2;
 // Centre sanctuary: four pillars and a glowing archway.
 for(let i=0;i<4;i++){let a=TAU*i/4+.25, x=Math.cos(a)*3.6,z=Math.sin(a)*3.6;let p=mesh(new THREE.CylinderGeometry(.38,.55,3.9,7),materials.stone,scene,x,ISLAND_Y+2.1,z);p.rotation.y=a;mesh(new THREE.CylinderGeometry(.7,.7,.35,8),materials.gold,scene,x,ISLAND_Y+4.1,z);}
 const beacon=mesh(new THREE.OctahedronGeometry(.85),glowMat(0xffe6a0),scene,0,ISLAND_Y+4.9,0);beacon.userData.beacon=true;stars.push(beacon);
 for(let i=0;i<15;i++){
   let a=i*2.399+1.3,r=8+((i*7)%13)*.9,x=Math.cos(a)*r,z=Math.sin(a)*r;
   if(r>22||Math.abs(x)<5&&Math.abs(z)<5)continue;
   const tree=new THREE.Group();tree.position.set(x,terrainHeight(x,z),z);scene.add(tree);
   mesh(new THREE.CylinderGeometry(.24,.43,2.4,7),materials.trunk,tree,0,1.15,0);
   sphere(1.65,materials.leaf,tree,0,3.25,0,9,8);sphere(1.25,i%3?materials.leaf2:materials.grassLight,tree,-.8,2.9,.36,9,8);sphere(1.17,materials.leaf,tree,.87,2.95,-.25,9,8);
 }
 // Clusters of original glowing flowers and low stone ruins.
 for(let i=0;i<70;i++){
   const a=random(0,TAU),r=random(5.2,21.8),x=Math.cos(a)*r,z=Math.sin(a)*r;
   const f=sphere(random(.09,.2),i%5===0?glowMat(0xffe7b7):materials.grassLight,scene,x,terrainHeight(x,z)+.3,z,6,5);
   f.scale.set(1,random(1.2,2.7),1);
 }
 for(let i=0;i<9;i++){
   const a=i*TAU/9+.2,r=21,x=Math.cos(a)*r,z=Math.sin(a)*r;
   const ruin=mesh(new THREE.BoxGeometry(.85,random(1,2.7),.85),materials.stone,scene,x,ISLAND_Y+1.1,z);ruin.rotation.y=a;
 }
 // Airborne mini-islets make the world feel larger; Phase 1 collision is on the main island only.
 for(let i=0;i<6;i++){
   const a=i*TAU/6+.4,r=39+random(0,16),x=Math.cos(a)*r,z=Math.sin(a)*r,y=ISLAND_Y+random(-7,11);
   mesh(new THREE.CylinderGeometry(random(4,7),random(3.5,5),1.2,18),materials.grass,scene,x,y,z);
   const tip=mesh(new THREE.ConeGeometry(4.1,6.4,9),materials.earth,scene,x,y-3.7,z);tip.rotation.z=Math.PI;
   if(i%2===0)sphere(2,materials.leaf,scene,x,y+2,z);
 }
 // Atmospheric cloud puffs, no downloaded textures.
 const cloudMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.68,depthWrite:false});
 for(let i=0;i<30;i++){
   const group=new THREE.Group();group.position.set(random(-130,130),random(-17,8),random(-110,110));
   for(let j=0;j<5;j++){const p=sphere(random(3,6),cloudMaterial,group,j*3.2-7,Math.sin(j)*.8,random(-2,2),9,6);p.scale.y=.48;}
   scene.add(group);clouds.push({group,speed:random(.12,.44)});
 }
 // Distant suspended particles.
 const dustGeo=new THREE.BufferGeometry(),points=[];
 for(let i=0;i<220;i++){points.push(random(-130,130),random(-3,90),random(-120,120));}
 dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xfffae0,size:.21,transparent:true,opacity:.7}));scene.add(dust);
 createHero();createLights();updateHUD();resize();
}
function createHero(){
 hero=new THREE.Group();scene.add(hero);
 const body=mesh(new THREE.CapsuleGeometry(.43,1.06,5,9),materials.cloth,hero,0,.94,0);body.scale.x=1.05;
 sphere(.43,materials.white,hero,0,2.04,0,14,12);
 const hair=mesh(new THREE.SphereGeometry(.45,12,8,0,TAU,0,Math.PI*.55),materials.dark,hero,0,2.19,0);
 sphere(.075,materials.dark,hero,-.15,2.04,.39);sphere(.075,materials.dark,hero,.15,2.04,.39);
 for(const side of [-1,1]){
   const arm=mesh(new THREE.CapsuleGeometry(.15,.58,3,7),materials.cloth,hero,side*.52,1.27,0);arm.rotation.z=side*.22;
   mesh(new THREE.CapsuleGeometry(.15,.35,3,7),materials.dark,hero,side*.21,.15,0);
 }
 const capeGeo=new THREE.BufferGeometry();capeGeo.setAttribute('position',new THREE.Float32BufferAttribute([-0.48,1.72,-.2,.48,1.72,-.2,.83,.34,-.43,-.83,.34,-.43],3));capeGeo.setIndex([0,1,2,0,2,3]);capeGeo.computeVertexNormals();
 const cape=mesh(capeGeo,materials.cape,hero);cape.material.side=THREE.DoubleSide;
 wingLeft=new THREE.Group();wingRight=new THREE.Group();hero.add(wingLeft,wingRight);wingLeft.position.set(-.55,1.5,-.18);wingRight.position.set(.55,1.5,-.18);
 const wingGeom=new THREE.ConeGeometry(.65,2.25,3);
 const l=mesh(wingGeom,materials.cape,wingLeft,-.65,-.18,0);l.rotation.z=-Math.PI/2;l.rotation.y=.2;
 const r=mesh(wingGeom,materials.cape,wingRight,.65,-.18,0);r.rotation.z=Math.PI/2;r.rotation.y=-.2;
 hero.position.copy(pos);
}
function createLights(){
 const orbs=[[0,0],[5,7],[-7,7],[-11,-2],[10,-7],[16,4],[-17,3],[5,-15],[-5,-17],[0,17],[18,-8],[-15,-10]];
 for(let i=0;i<orbs.length;i++){
   const [x,z]=orbs[i],y=terrainHeight(x,z)+2.2;
   const group=new THREE.Group();group.position.set(x,y,z);scene.add(group);
   const core=mesh(new THREE.IcosahedronGeometry(.42,1),new THREE.MeshBasicMaterial({color:0xffe7aa}),group);
   const halo=mesh(new THREE.TorusGeometry(.75,.035,7,28),new THREE.MeshBasicMaterial({color:0xfff2c2,transparent:true,opacity:.8}),group);halo.rotation.y=Math.PI/3;
   const light=new THREE.PointLight(0xffe1a1,2.5,7,2);group.add(light);
   lights.push({id:i,group,core,halo,baseY:y,phase:i*1.8,active:!found.has(i)});
   group.visible=!found.has(i);
 }
}
function resize(){if(!renderer)return;const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);
function vectorInput(){
 const x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;
 const z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joy.y;
 const v=new THREE.Vector2(x,z);if(v.length()>1)v.normalize();return v;
}
function update(dt){
 elapsed+=dt;
 const movement=vectorInput();
 const forward=new THREE.Vector3(-Math.sin(cameraYaw),0,-Math.cos(cameraYaw));
 const right=new THREE.Vector3(Math.cos(cameraYaw),0,-Math.sin(cameraYaw));
 const direction=forward.multiplyScalar(-movement.y).addScaledVector(right,movement.x);
 if(direction.lengthSq()>.001){direction.normalize();const facing=Math.atan2(direction.x,direction.z);const delta=Math.atan2(Math.sin(facing-hero.rotation.y),Math.cos(facing-hero.rotation.y));hero.rotation.y+=delta*Math.min(1,dt*10);}
 const speed=airborne?8.4:6.4;
 pos.addScaledVector(direction,dt*speed);
 if(input.jump&&grounded){vy=7.5;grounded=false;airborne=true;input.jump=false;playSound(440,.12);}
 const wantsFly=input.fly||keys.has('KeyF')||keys.has('ShiftLeft')||keys.has('ShiftRight');
 const canFly=wantsFly&&energy>1;
 if(canFly){airborne=true;grounded=false;vy=Math.max(vy,-2);vy=Math.min(9,vy+25*dt);energy=Math.max(0,energy-22*dt);}
 else {vy-=17*dt;}
 pos.y+=vy*dt;
 const surface=terrainHeight(pos.x,pos.z);
 if(surface!==-Infinity&&pos.y<=surface){pos.y=surface;vy=0;grounded=true;airborne=false;energy=Math.min(100,energy+30*dt);}
 else if(!canFly&&pos.y>surface+.2){grounded=false;airborne=true;}
 // Phase 1 safety: soft recovery if the explorer falls below the cloud layer.
 if(pos.y<-24){pos.set(0,ISLAND_Y+3,0);vy=0;energy=100;message('A wind current returned you to the sanctuary.');}
 hero.position.copy(pos);
 wingLeft.rotation.z=THREE.MathUtils.lerp(wingLeft.rotation.z,airborne?-.48:.07,dt*6);
 wingRight.rotation.z=THREE.MathUtils.lerp(wingRight.rotation.z,airborne?.48:-.07,dt*6);
 hero.position.y+=grounded?Math.sin(elapsed*5)*(direction.lengthSq()>.1?.08:.025):0;
 for(const l of lights){if(!l.active)continue;l.group.position.y=l.baseY+Math.sin(elapsed*1.5+l.phase)*.28;l.halo.rotation.y+=dt*.8;l.core.rotation.y+=dt*.75;
   if(Math.hypot(pos.x-l.group.position.x,pos.y+1.2-l.group.position.y,pos.z-l.group.position.z)<2.2){l.active=false;l.group.visible=false;found.add(l.id);persist();updateHUD();playSound(560+found.size*24,.24);message(`✦ Light found! ${found.size} of ${LIGHT_COUNT}`);if(found.size===LIGHT_COUNT)finish();}
 }
 clouds.forEach(c=>{c.group.position.x+=dt*c.speed;if(c.group.position.x>140)c.group.position.x=-140;});
 stars.forEach(o=>{o.rotation.y+=dt*.55;o.position.y=ISLAND_Y+4.9+Math.sin(elapsed*1.2)*.3;});
 $('energy-fill').style.width=`${energy.toFixed(0)}%`;
 if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('visible');}
 // Smoothed orbit camera that follows the player.
 const cp=new THREE.Vector3(Math.sin(cameraYaw)*Math.cos(cameraPitch)*cameraDistance,
                             Math.sin(cameraPitch)*cameraDistance+2.5,
                             Math.cos(cameraYaw)*Math.cos(cameraPitch)*cameraDistance);
 targetPos.copy(pos).add(new THREE.Vector3(0,2,0));
 const desired=targetPos.clone().add(cp);
 camera.position.lerp(desired,Math.min(1,dt*6.2));camera.lookAt(targetPos);
}
function finish(){if(completed)return;completed=true;message('✦ You restored every light!');setTimeout(()=>{if(!started)return;$('overlay').hidden=false;$('dialog-text').textContent='You gathered all twelve lights and brought warmth back to the floating sanctuary. Phase 1 complete! Explore freely or begin another journey.';$('start-btn').innerHTML='CONTINUE EXPLORING <span>➜</span>';},1500);}
function animate(){requestAnimationFrame(animate);const dt=Math.min(.045,clock.getDelta());if(started)update(dt);else {elapsed+=dt;stars.forEach(o=>o.rotation.y+=dt*.4);clouds.forEach(c=>{c.group.position.x+=dt*c.speed;if(c.group.position.x>140)c.group.position.x=-140;});}
 if(renderer){renderer.render(scene,camera);}}
function startGame(){started=true;$('overlay').hidden=true;clock.getDelta();playSound(500,.2);}
$('start-btn').addEventListener('click',startGame);
$('help').addEventListener('click',()=>{$('overlay').hidden=false;$('dialog-text').textContent='Explore the island, walk and jump, then hold FLY to rise into the sky. Drag the screen to turn the camera. Collect twelve golden lights to complete Phase 1.';$('start-btn').innerHTML='RETURN TO ADVENTURE <span>➜</span>';});
$('sound').addEventListener('click',()=>{muted=!muted;$('sound').textContent=muted?'♪̸':'♪';});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat)input.jump=true;});
window.addEventListener('keyup',e=>{keys.delete(e.code);});
window.addEventListener('blur',()=>{keys.clear();input.fly=false;input.jump=false;joy.x=joy.y=0;resetStick();});
const bindPress=(id,key)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input[key]=true;b.classList.add('pressed');});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{if(key==='fly')input.fly=false;b.classList.remove('pressed');});};
bindPress('jump-btn','jump');bindPress('fly-btn','fly');
const joyEl=$('joystick'),knob=$('stick-knob');let joyId=null;
function resetStick(){knob.style.transform='translate(0px,0px)';joy.x=0;joy.y=0;}
function updateStick(e){const r=joyEl.querySelector('.stick-ring').getBoundingClientRect();const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const max=35,dist=Math.hypot(dx,dy),factor=dist>max?max/dist:1;const x=dx*factor,y=dy*factor;joy.x=x/max;joy.y=y/max;knob.style.transform=`translate(${x}px,${y}px)`;}
joyEl.addEventListener('pointerdown',e=>{e.preventDefault();joyId=e.pointerId;joyEl.setPointerCapture(joyId);updateStick(e);});
joyEl.addEventListener('pointermove',e=>{if(joyId===e.pointerId)updateStick(e);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])joyEl.addEventListener(ev,e=>{if(joyId===e.pointerId){joyId=null;resetStick();}});
let cameraDrag=null;
canvas.addEventListener('pointerdown',e=>{if(!started)return;cameraDrag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!cameraDrag||cameraDrag.id!==e.pointerId)return;const dx=e.clientX-cameraDrag.x,dy=e.clientY-cameraDrag.y;cameraDrag.x=e.clientX;cameraDrag.y=e.clientY;cameraYaw-=dx*.005;cameraPitch=clamp(cameraPitch+dy*.0035,-.2,1.04);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(cameraDrag?.id===e.pointerId)cameraDrag=null;});
canvas.addEventListener('wheel',e=>{cameraDistance=clamp(cameraDistance+e.deltaY*.012,6.5,22);},{passive:true});
try{makeWorld();camera.position.set(8,24,12);camera.lookAt(pos);animate();if(found.size===LIGHT_COUNT)updateHUD();}catch(err){showError(err);}