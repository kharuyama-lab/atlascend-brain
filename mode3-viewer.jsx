/* Mode 3 v0.2: measured CT/MR voxels; image-space MPR; no claim of GLB registration. */
function Mode3BrainPreview({sourceSceneRef}) {
 const canvasRef=React.useRef(null),[state,setState]=React.useState('既存の3D脳を読み込み中'),[hoverName,setHoverName]=React.useState('');
 React.useEffect(()=>{
  const canvas=canvasRef.current,T=window.THREE;if(!canvas||!T){setState('Three.jsを利用できません');return;}
  let dead=false,request=0,observer,renderer,scene,camera,group,down=null;
  let yaw=.42,pitch=.2,scale=1,target=new T.Vector3(),size=1,initAttempts=0;const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  function render(){if(dead||!renderer)return;const r=canvas.getBoundingClientRect();if(r.width<2||r.height<2)return;
   const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.floor(r.width*dpr),h=Math.floor(r.height*dpr);
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const dist=Math.max(.1,size*1.6*scale);
   camera.position.set(target.x+dist*Math.sin(yaw)*Math.cos(pitch),target.y+dist*Math.sin(pitch),target.z+dist*Math.cos(yaw)*Math.cos(pitch));camera.lookAt(target);renderer.render(scene,camera);
  }
  function create(){if(dead)return;const original=sourceSceneRef?.current;
   if(!original?.cats?.cortex?.meshes?.length){if(++initAttempts>800){setState('3D脳メッシュの取得に失敗しました');return;}request=requestAnimationFrame(create);return;}
   try {original.scene.updateMatrixWorld(true);scene=new T.Scene();scene.add(new T.HemisphereLight(0xf0f7ff,0x30455e,1.5));
    const light=new T.DirectionalLight(0xffffff,1.05);light.position.set(3,7,4);scene.add(light);
    group=new T.Group();scene.add(group);for(const [key,color] of [['cortex',0xdde7ef],['cerebellum',0xe6bfa7],['brainstem',0xebd9ae]]){
     const source=original.cats[key];if(!source)continue;const mat=new T.MeshPhongMaterial({color,side:T.DoubleSide,shininess:20});
     for(const m of source.meshes||[]){if(!m.isMesh||!m.geometry)continue;const copy=new T.Mesh(m.geometry,mat);copy.matrixAutoUpdate=false;copy.matrix.copy(m.matrixWorld);copy.userData.nodeId=m.userData.nodeId;group.add(copy);}
    }
    if(!group.children.length)throw Error('描画可能な3D構造がありません');const bbox=new T.Box3().setFromObject(group);target=bbox.getCenter(new T.Vector3());size=bbox.getSize(new T.Vector3()).length();
    camera=new T.PerspectiveCamera(43,1,.001,1000);renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x0b1521,1);
    observer=new ResizeObserver(render);observer.observe(canvas);setState('');render();
   } catch(err){console.error('Mode3 brain preview',err);setState('3D脳表示エラー：'+String(err.message||err));}
  }
  function start(e){down=[e.clientX,e.clientY,yaw,pitch];canvas.setPointerCapture(e.pointerId);}
  function move(e){if(down){yaw=down[2]+(e.clientX-down[0])*.009;pitch=Math.max(-1.3,Math.min(1.3,down[3]+(e.clientY-down[1])*.009));render();return;}
   if(!camera||!group)return;const rect=canvas.getBoundingClientRect();pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-((e.clientY-rect.top)/rect.height*2-1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(group.children,false)[0];const id=hit?.object?.userData?.nodeId;const node=window.BRAIN?.nodes?.find(n=>n.id===id);setHoverName(node?.label||'');}
  function end(){down=null;}
  function wheel(e){e.preventDefault();scale=Math.max(.55,Math.min(3,scale*(e.deltaY>0?1.08:.92)));render();}
  const leave=()=>setHoverName('');canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('wheel',wheel,{passive:false});create();
  return()=>{dead=true;cancelAnimationFrame(request);observer?.disconnect();canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);canvas.removeEventListener('wheel',wheel);renderer?.dispose();
   if(group){const mats=new Set();group.traverse(o=>{if(o.isMesh&&o.material)mats.add(o.material)});mats.forEach(m=>m.dispose());}
  };
 },[sourceSceneRef]);
 return <div className="mode3-brain-preview"><canvas ref={canvasRef} aria-label="既存の3D脳モデル。ドラッグで回転、ホイールで拡大"/>
  {state&&<div className="mode3-brain-message">{state}</div>}
  {hoverName&&<div className="mode3-brain-hover">{hoverName}</div>}
  <div className="mode3-registration-note">解剖学的参照モデル（実画像への空間登録は未完了）</div>
 </div>;
}

/* Patient-space slice planes: faithful to the selected image bounding box, NOT registered to the GLB. */
function Mode3VolumeInset({bounds,coords}) {
 const ref=React.useRef(null);
 React.useEffect(()=>{
  const cv=ref.current;if(!cv||!bounds||!coords)return;const W=124,H=112;cv.width=W*2;cv.height=H*2;const ctx=cv.getContext('2d');ctx.scale(2,2);
  ctx.clearRect(0,0,W,H);
  const frac=coords.map((x,i)=>Math.max(0,Math.min(1,(x-bounds[i][0])/(bounds[i][1]-bounds[i][0]))));
  function P(x,y,z){return [62+(x-.5)*72-(y-.5)*43,59+(x-.5)*18+(y-.5)*19-(z-.5)*70];}
  function poly(corners,color){ctx.beginPath();corners.forEach(([x,y,z],i)=>{const p=P(x,y,z);if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p)});ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=color.replace(/0\.2[0-9]\)/,'0.95)');ctx.lineWidth=1.2;ctx.stroke();}
  for(let k=0;k<3;k++)for(let v=0;v<=1;v++)for(let u=0;u<=1;u++){const a=[0,0,0],b=[0,0,0];let j=(k+1)%3,l=(k+2)%3;a[k]=v;b[k]=v;a[j]=u;b[j]=u;a[l]=0;b[l]=1;ctx.beginPath();ctx.moveTo(...P(...a));ctx.lineTo(...P(...b));ctx.strokeStyle='rgba(188,207,225,.25)';ctx.lineWidth=.8;ctx.stroke();}
  poly([[0,0,frac[2]],[1,0,frac[2]],[1,1,frac[2]],[0,1,frac[2]]],'rgba(90,214,230,0.25)');
  poly([[0,frac[1],0],[1,frac[1],0],[1,frac[1],1],[0,frac[1],1]],'rgba(243,174,106,0.22)');
  poly([[frac[0],0,0],[frac[0],1,0],[frac[0],1,1],[frac[0],0,1]],'rgba(182,161,255,0.22)');
 },[bounds,coords]);
 return <div className="mode3-space-inset" aria-label="医用画像の患者座標における3断面の位置"><canvas ref={ref} width="248" height="224"/><div>画像側の断面位置</div></div>;
}


/* Synthetic teaching volumes only: a shared 3D implicit shape is sampled by the
 * three MPR canvases and by the Three.js mesh. CT and MNI use separate bounds;
 * they are NOT mutually registered. All centers are on the RAS left (negative X).
 * A small infarct is not automatically multiple lacunes. */
const MODE3_LESION_LAYOUTS={
 mca:{c:[-.235,.055,.055],ci:[.135,.16,.16],ch:[.095,.105,.105]},
 capsule:{c:[-.095,-.02,.005],ci:[.048,.07,.074],ch:[.079,.086,.09]},
 thalamus:{c:[-.065,-.065,-.03],ci:[.065,.068,.068],ch:[.073,.076,.078]},
 lacune:{c:[-.095,-.015,.03],ci:[.014,.02,.025]}
};
function mode3TeachingLesion(bounds,kind,time,region){
 if(!bounds)return null;
 const useRegion=(kind==='hemorrhage'&&region==='lacune')?'capsule':region;
 const layout=MODE3_LESION_LAYOUTS[useRegion]||MODE3_LESION_LAYOUTS.mca;
 const spans=bounds.map(([a,b])=>b-a);
 const center=bounds.map(([a,b],i)=>(a+b)*.5+spans[i]*layout.c[i]);
 const radii=spans.map((v,i)=>v*(kind==='hemorrhage'?(layout.ch||layout.ci)[i]:layout.ci[i]));
 return {center,radii,kind,time,region:useRegion,spans};
}
function mode3Warp(nx,ny,nz,kind,region){
 const small=region==='lacune';
 const a=Math.sin(nx*7.7+ny*3.9+nz*4.1)*Math.cos(ny*6.3-nz*5.1);
 const b=Math.sin(nx*12.1-ny*9.2+nz*3.7)*Math.sin(nz*8.3+nx*2.7);
 // Hematomas are compact with irregular lobulations; large infarcts spread
 // asymmetrically along a territory. No random flicker during scrubbing.
 const mag=small?.055:kind==='hemorrhage'?.115:.17;
 return 1+mag*(.72*a+.28*b)+(kind==='ischemia'&&!small?.075*nx*ny:0);
}
function mode3Implicit(lesion,x,y,z){
 const nx=(x-lesion.center[0])/lesion.radii[0],ny=(y-lesion.center[1])/lesion.radii[1],nz=(z-lesion.center[2])/lesion.radii[2];
 const r=Math.sqrt(nx*nx+ny*ny+nz*nz);
 return r/Math.max(.73,mode3Warp(nx,ny,nz,lesion.kind,lesion.region));
}
function mode3LesionBounds(lesion){
 const parts=[lesion];
 return [0,1,2].map(i=>[
  Math.min(...parts.map(p=>p.center[i]-p.radii[i]*1.3)),
  Math.max(...parts.map(p=>p.center[i]+p.radii[i]*1.3))
 ]);
}
function mode3Clamp(x,a=0,b=1){return Math.max(a,Math.min(b,x));}
function mode3Smooth(a,b,x){const t=mode3Clamp((x-a)/(b-a));return t*t*(3-2*t);}
function mode3LesionAppearance(mod,kind,time,region,view="realistic"){
 const small=region==='lacune';
 if(kind==='hemorrhage'){
  if(mod==='ct')return {tone:[232,219,178,36][time],strength:[.92,.89,.78,.67][time],edema:[0,.20,.35,0][time],legend:'CT：急性期高吸収から吸収・慢性低吸収への模式変化'};
  if(mod==='t1')return {tone:[107,99,203,62][time],strength:[.46,.59,.75,.62][time],edema:[0,.14,.2,0][time],legend:'T1：血液分解産物による複雑な経時信号変化（代表例）'};
  return {tone:[169,57,63,185][time],strength:[.53,.68,.78,.74][time],edema:[0,.16,.24,0][time],legend:'T2：時期・血液成分で変わる不均一な信号（代表例）'};
 }
 if(mod==='ct')return {tone:[84,74,40,22][time],strength:[small?.025:.045,small?.13:.23,small?.45:.68,small?.6:.80][time],edema:[0,.06,.16,0][time],legend:'CT：早期には微細、時間経過で低吸収域が明瞭化'};
 if(mod==='t1')return {tone:[98,86,52,32][time],strength:[small?.06:.045,.23,.61,.76][time],edema:[0,.07,.12,0][time],legend:'T1：低信号域（虚血直後には目立たない場合あり）'};
 return {tone:[165,181,228,185][time],strength:[small?.08:.06,.24,.68,.76][time],edema:[0,.06,.15,0][time],legend:'T2：高信号域（発症直後には目立たない場合あり）'};
}
function mode3ApplyVisibility(a,view){
 if(view!=='enhanced')return a;
 // Keep lesion geometry fixed. The enhancement is explicitly non-diagnostic.
 return {...a,strength:Math.max(.67,Math.min(.98,a.strength*2.8)),edema:Math.min(.42,a.edema*1.18),enhanced:true};
}
function mode3DrawLesionOverlay(ctx,lesion,appearance,cfg,b,left,top,dw,dh,planeCoordinate,dpr){
 if(!lesion||appearance.strength<=0)return;
 const extents=mode3LesionBounds(lesion);
 if(planeCoordinate<extents[cfg.w][0]||planeCoordinate>extents[cfg.w][1])return;
 // Restrict pixel work to the projected 3D lesion bounds.
 const toX=(v,axis)=>left+(b[axis][1]-v)/(b[axis][1]-b[axis][0])*dw;
 const xCoords=extents[cfg.u].map(x=>toX(x,cfg.u));
 const yCoords=extents[cfg.v].map(y=>top+(b[cfg.v][1]-y)/(b[cfg.v][1]-b[cfg.v][0])*dh);
 const x0=Math.max(0,Math.floor(Math.max(left,Math.min(...xCoords))));
 const y0=Math.max(0,Math.floor(Math.max(top,Math.min(...yCoords))));
 const x1=Math.min(ctx.canvas.width,Math.ceil(Math.min(left+dw,Math.max(...xCoords))));
 const y1=Math.min(ctx.canvas.height,Math.ceil(Math.min(top+dh,Math.max(...yCoords))));
 if(x1<=x0||y1<=y0)return;
 const cx=toX(lesion.center[cfg.u],cfg.u);
 const cy=top+(b[cfg.v][1]-lesion.center[cfg.v])/(b[cfg.v][1]-b[cfg.v][0])*dh;
 const rx=Math.abs(x1-x0)/2,ry=Math.abs(y1-y0)/2;
 const data=ctx.getImageData(x0,y0,x1-x0,y1-y0),pixels=data.data;
 for(let py=0;py<y1-y0;py++)for(let px=0;px<x1-x0;px++){
  const x=x0+px+.5,y=y0+py+.5;
  const pt=[0,0,0];pt[cfg.u]=b[cfg.u][1]-(x-left)/dw*(b[cfg.u][1]-b[cfg.u][0]);
  pt[cfg.v]=b[cfg.v][1]-(y-top)/dh*(b[cfg.v][1]-b[cfg.v][0]);pt[cfg.w]=planeCoordinate;
  const r=mode3Implicit(lesion,...pt);
  const core=1-mode3Smooth(.82,1.055,r);
  const surround=appearance.edema*(1-mode3Smooth(1.02,1.29,r))*(1-core);
  if(core<.002&&surround<.002)continue;
  const idx=(py*(x1-x0)+px)*4;
  const baseline=(pixels[idx]+pixels[idx+1]+pixels[idx+2])/3;
  const grain=Math.sin(pt[0]*1.37+pt[1]*2.13+pt[2]*.49)*Math.sin(pt[2]*2.01-pt[0]*.77+pt[1]*1.53);
  let tissueTone=appearance.tone;
  if(lesion.kind==='hemorrhage' && appearance.modality==='t2'){
   // At ~7d T2 core may remain dark with a brighter peripheral rim.
   if(lesion.time===2 && r>.64 && r<1.02)tissueTone=195;
   // Chronic hemosiderin rim: dark rim, potentially CSF-like bright center.
   if(lesion.time===3 && r>.72 && r<1.07)tissueTone=43;
  }
  const target=mode3Clamp(tissueTone+grain*(lesion.kind==='hemorrhage'?15:9),0,255);
  const alpha=mode3Clamp(core*appearance.strength*(.94+.06*grain));
  // Around a hematoma, represent edema separately from the clot itself.
  const edematarget=baseline+(appearance.tone>baseline? -27 : -18);
  const result=baseline*(1-alpha-surround)+target*alpha+edematarget*surround;
  pixels[idx]=pixels[idx+1]=pixels[idx+2]=mode3Clamp(result,0,255);
 }
 ctx.putImageData(data,x0,y0);
 // A locator is NOT part of the lesion: it makes a tiny lacune or slender
 // subarachnoid blood discoverable without changing lesion size or voxel values.
 // Only the educational Enhanced mode shows this clearly separate annotation.
 if(appearance.enhanced && lesion.region==='lacune'){
  const px=toX(lesion.center[cfg.u],cfg.u);
  const py=top+(b[cfg.v][1]-lesion.center[cfg.v])/(b[cfg.v][1]-b[cfg.v][0])*dh;
  const inView=px>=left&&px<=left+dw&&py>=top&&py<=top+dh;
  if(inView){
   const rr=Math.max(9*dpr, Math.min(17*dpr,Math.max(rx,ry)+4*dpr));
   ctx.save();ctx.strokeStyle='rgba(255,214,94,.98)';ctx.lineWidth=Math.max(1.5,1.7*dpr);
   ctx.setLineDash([4*dpr,3*dpr]);ctx.beginPath();ctx.arc(px,py,rr,0,Math.PI*2);ctx.stroke();
   ctx.setLineDash([]);ctx.fillStyle='rgba(255,214,94,.98)';ctx.font=`${10*dpr}px system-ui`;
   ctx.fillText('ラクナ位置',Math.min(ctx.canvas.width-65*dpr,px+rr+3*dpr),Math.max(12*dpr,py-rr));
   ctx.restore();
  }
 }
}
function mode3MakeLesionMesh(T,lesion){
 const geo=new T.SphereGeometry(1,48,32),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){
  const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i),warp=mode3Warp(nx,ny,nz,lesion.kind,lesion.region);
  p.setXYZ(i,nx*warp,ny*warp,nz*warp);
 }
 geo.computeVertexNormals();
 const mat=new T.MeshPhongMaterial({color:lesion.kind==='hemorrhage'?0xe33439:0x4c5c70,transparent:true,opacity:lesion.view==='enhanced'?.96:.78,side:T.DoubleSide,depthWrite:false});
 const mesh=new T.Mesh(geo,mat);mesh.position.set(...lesion.center);mesh.scale.set(...lesion.radii);mesh.renderOrder=6;return mesh;
}

/* Mode 3 v0.3: MNI ICBM152 2009c MRI brain surface, aligned by original template RAS coordinates. */
function Mode3RegisteredBrain({position,mod,lesion}) {
 const cvRef=React.useRef(null),regRef=React.useRef(null),latestRef=React.useRef({position,mod});
 latestRef.current={position,mod};
 const [status,setStatus]=React.useState('MNI脳表を読み込み中…');
 React.useEffect(()=>{
  const canvas=cvRef.current,T=window.THREE;
  if(!canvas||!T){setStatus('3D描画ライブラリが利用できません');return;}
  let dead=false,ro,renderer,scene,camera,mesh,geometry,lesionMesh;let scale=1,yaw=.42,pitch=.19;
  const pointers=new Map();let pointerDrag=null,pinchStart=null;
  const target=new T.Vector3(),brainSize=new T.Vector3();
  const groups={};const bound={};
  function render(){if(dead||!renderer)return;const r=canvas.getBoundingClientRect();if(r.width<2||r.height<2)return;
   const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.floor(r.width*dpr),h=Math.floor(r.height*dpr);
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
   const span=brainSize.length(),dist=span*1.13*scale;
   camera.position.set(target.x+dist*Math.sin(yaw)*Math.cos(pitch),target.y+dist*Math.cos(yaw)*Math.cos(pitch),target.z+dist*Math.sin(pitch));
   camera.up.set(0,0,1);camera.lookAt(target);renderer.render(scene,camera);
  }
  function addQuad(axis,rgba){
   const min=bound.min,max=bound.max,margin=6;
   const x0=min.x-margin,x1=max.x+margin,y0=min.y-margin,y1=max.y+margin,z0=min.z-margin,z1=max.z+margin;
   let corners;if(axis===2)corners=[[x0,y0,0],[x1,y0,0],[x1,y1,0],[x0,y1,0]];
   else if(axis===1)corners=[[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1]];
   else corners=[[0,y0,z0],[0,y1,z0],[0,y1,z1],[0,y0,z1]];
   const g=new T.Group();let faces=new T.BufferGeometry();faces.setAttribute('position',new T.Float32BufferAttribute(corners.flat(),3));faces.setIndex([0,1,2,0,2,3]);faces.computeVertexNormals();
   let panel=new T.Mesh(faces,new T.MeshBasicMaterial({color:rgba,opacity:.13,transparent:true,side:T.DoubleSide,depthTest:false,depthWrite:false}));panel.renderOrder=4;g.add(panel);
   let outline=new T.LineLoop(new T.BufferGeometry().setFromPoints(corners.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:rgba,transparent:true,opacity:.92,depthTest:false}));outline.renderOrder=5;g.add(outline);
   scene.add(g);groups[axis]=g;
  }
  (async()=>{
   try{
    const url='ICBM09c_brain_surface.bin';
    const response=await fetch(url,{cache:'default'});if(!response.ok)throw Error('脳表データ HTTP '+response.status);
    const buf=await response.arrayBuffer();if(dead)return;
    const view=new DataView(buf);const nv=view.getUint32(0,true),nf=view.getUint32(4,true);
    if(!nv||!nf||buf.byteLength!==8+nv*12+nf*12)throw Error('脳表データの形式が正しくありません');
    const vertices=new Float32Array(buf,8,nv*3),triangles=new Uint32Array(buf,8+nv*12,nf*3);
    geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(vertices,3));geometry.setIndex(new T.BufferAttribute(triangles,1));geometry.computeVertexNormals();
    scene=new T.Scene();scene.add(new T.HemisphereLight(0xf1f7ff,0x44536d,1.8));
    const light=new T.DirectionalLight(0xffffff,1.45);light.position.set(100,100,220);scene.add(light);
    mesh=new T.Mesh(geometry,new T.MeshPhongMaterial({color:0xcbddec,transparent:true,opacity:.58,shininess:42,depthWrite:false,side:T.DoubleSide}));mesh.renderOrder=1;scene.add(mesh);
    const box=new T.Box3().setFromObject(mesh);box.getCenter(target);box.getSize(brainSize);bound.min=box.min;bound.max=box.max;
    addQuad(2,0x3cc8df);addQuad(1,0xe2a049);addQuad(0,0xb393ee);
    camera=new T.PerspectiveCamera(43,1,.1,2500);camera.up.set(0,0,1);
    renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'low-power'});
    renderer.setClearColor(0x0b1521,1);ro=new ResizeObserver(render);ro.observe(canvas);
    let lesionGeometryKey=null;
    regRef.current={groups,render,scene,setLesion(next){
     const key=next?JSON.stringify([next.kind,next.region,next.center,next.radii,next.spans]):null;
     if(key===lesionGeometryKey && lesionMesh){
      const opacity=next.view==='enhanced'?.96:.78;
      lesionMesh.traverse(o=>{if(o.isMesh&&o.material)o.material.opacity=opacity;});
      render();return;
     }
     if(lesionMesh){scene.remove(lesionMesh);lesionMesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});lesionMesh=null;}
     lesionGeometryKey=key;
     if(next){lesionMesh=mode3MakeLesionMesh(T,next);scene.add(lesionMesh);}render();
    }};
    const initial=latestRef.current;movePlanes(initial.position,initial.mod);
    if(lesion){lesionMesh=mode3MakeLesionMesh(T,lesion);scene.add(lesionMesh);}setStatus('');render();
   }catch(e){console.error('ICBM registered surface',e);if(!dead)setStatus('脳表表示エラー：'+String(e.message||e));}
  })();
  function movePlanes(pos,kind){const valid=Array.isArray(pos)&&kind!=='ct';
   for(let axis=0;axis<3;axis++){if(groups[axis]){groups[axis].visible=!!valid;if(valid)groups[axis].position.set(axis===0?pos[0]:0,axis===1?pos[1]:0,axis===2?pos[2]:0);}}
   render();
  }
  function onDown(e){canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1)pointerDrag={x:e.clientX,y:e.clientY,yaw,pitch};if(pointers.size===2){let ps=[...pointers.values()];pinchStart={dist:Math.hypot(ps[0][0]-ps[1][0],ps[0][1]-ps[1][1]),scale};pointerDrag=null;}}
  function onMove(e){if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1&&pointerDrag){yaw=pointerDrag.yaw+(e.clientX-pointerDrag.x)*.009;pitch=Math.max(-1.4,Math.min(1.4,pointerDrag.pitch+(e.clientY-pointerDrag.y)*.009));render();}else if(pointers.size===2&&pinchStart){let ps=[...pointers.values()],d=Math.hypot(ps[0][0]-ps[1][0],ps[0][1]-ps[1][1]);scale=Math.max(.45,Math.min(4,pinchStart.scale*pinchStart.dist/Math.max(1,d)));render();}}
  function onUp(e){pointers.delete(e.pointerId);pointerDrag=null;pinchStart=null;}
  function onWheel(e){e.preventDefault();scale=Math.max(.45,Math.min(4,scale*(e.deltaY>0?1.1:.9)));render();}
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);canvas.addEventListener('wheel',onWheel,{passive:false});
  return()=>{dead=true;ro?.disconnect();canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);canvas.removeEventListener('wheel',onWheel);if(regRef.current?.groups===groups)regRef.current=null;if(lesionMesh){lesionMesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}for(const g of Object.values(groups)){g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}mesh?.material?.dispose();geometry?.dispose();renderer?.dispose();};
 },[]);
 React.useEffect(()=>{regRef.current?.setLesion(lesion);},[lesion]);
 React.useEffect(()=>{const r=regRef.current;if(!r)return;r.position={position,mod};const valid=Array.isArray(position)&&mod!=='ct';for(let axis=0;axis<3;axis++){const g=r.groups[axis];if(!g)continue;g.visible=!!valid;if(valid)g.position.set(axis===0?position[0]:0,axis===1?position[1]:0,axis===2?position[2]:0);}r.render();},[position,mod]);
 return <div className="mode3-brain-preview"><canvas ref={cvRef} style={{touchAction:'none'}} aria-label="ICBM152標準脳。MRIの3平面位置を同じMNI座標で表示。ドラッグで回転、ピンチで拡大"/>
  {status&&<div className="mode3-brain-message">{status}</div>}
  <div className="mode3-registration-note">{mod==='ct'?'CTはMNIに未登録：断面ガイドを非表示':'MNI152脳表｜青：水平・橙：前額・紫：矢状（MRIと同一座標）'}</div>
 </div>;
}

/* CT is in its own patient-RAS space. Show the true CT scan volume bounds
 * and orthogonal slice planes rather than placing unregistered CT coordinates on
 * the MNI152 brain (which would suggest a false anatomical correspondence). */
function Mode3CTCoordinateGuide({position,bounds,lesion}) {
 const canvasRef=React.useRef(null),viewRef=React.useRef(null);
 React.useEffect(()=>{
  const canvas=canvasRef.current,T=window.THREE;if(!canvas||!T||!bounds)return;
  let dead=false,renderer,observer;let yaw=.65,pitch=.28,scale=1,drag=null;
  const scene=new T.Scene();scene.add(new T.AmbientLight(0xffffff,1));
  const lo=new T.Vector3(bounds[0][0],bounds[1][0],bounds[2][0]);
  const hi=new T.Vector3(bounds[0][1],bounds[1][1],bounds[2][1]);
  const center=lo.clone().add(hi).multiplyScalar(.5),dims=hi.clone().sub(lo);
  const box=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(dims.x,dims.y,dims.z)),new T.LineBasicMaterial({color:0x9bafc4,transparent:true,opacity:.8}));box.position.copy(center);scene.add(box);
  let lesionMesh=null,lesionGeometryKey=null;
  function updateLesion(next){
   const key=next?JSON.stringify([next.kind,next.region,next.center,next.radii,next.spans]):null;
   if(key===lesionGeometryKey&&lesionMesh){
    const opacity=next.view==='enhanced'?.96:.78;
    lesionMesh.traverse(o=>{if(o.isMesh&&o.material)o.material.opacity=opacity;});render();return;
   }
   if(lesionMesh){scene.remove(lesionMesh);lesionMesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});lesionMesh=null;}
   lesionGeometryKey=key;
   if(next){lesionMesh=mode3MakeLesionMesh(T,next);scene.add(lesionMesh);}render();
  }
  const planes=[];for(let axis=0;axis<3;axis++){
   const sizes=axis===0?[dims.y,dims.z]:axis===1?[dims.x,dims.z]:[dims.x,dims.y];
   const g=new T.Group();const panel=new T.Mesh(new T.PlaneGeometry(...sizes),new T.MeshBasicMaterial({color:[0xb393ee,0xe2a049,0x3cc8df][axis],side:T.DoubleSide,transparent:true,opacity:.19,depthWrite:false}));
   if(axis===0)panel.rotation.y=Math.PI/2;else if(axis===1)panel.rotation.x=Math.PI/2;
   g.add(panel);const edges=new T.LineSegments(new T.EdgesGeometry(panel.geometry),new T.LineBasicMaterial({color:[0xb393ee,0xe2a049,0x3cc8df][axis],transparent:true,opacity:.95}));edges.rotation.copy(panel.rotation);g.add(edges);scene.add(g);planes.push(g);
  }
  const camera=new T.PerspectiveCamera(43,1,.1,5000);camera.up.set(0,0,1);
  renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x0b1521,1);
  // RAS patient space: +X=R, +Y=A, +Z=S. Labels are projected from
  // actual patient-space axis endpoints, so they follow 3D rotation.
  const directions=[
   ['R',0,1,'右'],['L',0,-1,'左'],
   ['A',1,1,'前'],['P',1,-1,'後'],
   ['S',2,1,'上'],['I',2,-1,'下']
  ];
  function updateDirectionLabels(rect){
   const elements=canvas.parentElement?.querySelectorAll('[data-ct-dir]');
   if(!elements)return;
   const reach=Math.max(dims.length()*.035,3);
   directions.forEach(([code,axis,sign],i)=>{
    const el=elements[i];if(!el)return;
    const at=center.clone();at.setComponent(axis,center.getComponent(axis)+sign*(dims.getComponent(axis)/2+reach));
    const projected=at.project(camera);
    const visible=projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1.08&&Math.abs(projected.y)<1.08;
    el.style.display=visible?'block':'none';
    el.style.left=((projected.x+1)*50)+'%';
    el.style.top=((1-projected.y)*50)+'%';
   });
  }
  function render(){if(dead)return;const rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return;renderer.setSize(Math.floor(rect.width*Math.min(devicePixelRatio||1,2)),Math.floor(rect.height*Math.min(devicePixelRatio||1,2)),false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();const dist=dims.length()*1.1*scale;camera.position.set(center.x+dist*Math.sin(yaw)*Math.cos(pitch),center.y+dist*Math.cos(yaw)*Math.cos(pitch),center.z+dist*Math.sin(pitch));camera.lookAt(center);renderer.render(scene,camera);updateDirectionLabels(rect);}
  function update(pos){if(!Array.isArray(pos))return;planes.forEach((g,axis)=>{g.position.copy(center);g.position.setComponent(axis,pos[axis]);});render();}
  function down(e){canvas.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY,yaw,pitch];}
  function move(e){if(!drag)return;yaw=drag[2]+(e.clientX-drag[0])*.009;pitch=Math.max(-1.4,Math.min(1.4,drag[3]+(e.clientY-drag[1])*.009));render();}
  function up(){drag=null;}
  function wheel(e){e.preventDefault();scale=Math.max(.45,Math.min(4,scale*(e.deltaY>0?1.1:.9)));render();}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});
  observer=new ResizeObserver(render);observer.observe(canvas);viewRef.current={update,updateLesion};update(position);updateLesion(lesion);
  return()=>{dead=true;observer.disconnect();for(const [type,handler] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['wheel',wheel]])canvas.removeEventListener(type,handler);viewRef.current=null;scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});renderer.dispose();};
 },[bounds?.map(b=>b.join(',')).join('|')]);
 React.useEffect(()=>viewRef.current?.update(position),[position]);
 React.useEffect(()=>viewRef.current?.updateLesion(lesion),[lesion]);
 return <div className="mode3-brain-preview"><canvas ref={canvasRef} style={{touchAction:'none'}} aria-label="CT患者RAS座標の3次元撮像範囲、3断面位置、方向ラベル（R右、L左、A前、P後、S上、I下）"/>
  {[['R','右'],['L','左'],['A','前'],['P','後'],['S','上'],['I','下']].map(([code,ja])=><span key={code} data-ct-dir={code} className="mode3-ct-direction" title={`${ja} (${code})`}>{ja}<small>{code}</small></span>)}
  <div className="mode3-registration-note">患者RAS座標：R右・L左・A前・P後・S上・I下｜CT撮像範囲（脳表形状ではありません）</div></div>;
}

function Mode3Viewer({mobile,mod,windowMode,sourceSceneRef,position,setPosition,onMeta,fitSignal,lesionEnabled=false,lesionKind="ischemia",lesionRegion="mca",lesionTime=0,lesionView="realistic"}) {
 const API=window.Mode3Imaging;
 const [vol,setVol]=React.useState({}),[error,setError]=React.useState(''),[loading,setLoading]=React.useState('');
 const [activePane,setActivePane]=React.useState('brain');
 const [modalities,setModalities]=React.useState({});
 const refs=React.useRef({}),guideRef=React.useRef(null);
 const transform=React.useRef({axial:{zoom:1,panX:0,panY:0},coronal:{zoom:1,panX:0,panY:0},sagittal:{zoom:1,panX:0,panY:0}});
 const gestures=React.useRef({}),frames=React.useRef({}),renderLock=React.useRef(0),pixelCache=React.useRef({});
 const FILES=[['ct','mode3_data/CT-brain.nrrd'],['t1','ICBM09c_T1.nrrd'],['t2','ICBM09c_T2.nrrd']];
 React.useEffect(()=>{let cancelled=false;
  async function loadOnce(){const v={};for(const [key,name] of FILES){if(!cancelled)setLoading(name+' を読み込み中');const url=name+'?v=0.3';const r=await fetch(url,{cache:'default'});
    if(!r.ok)throw Error(name+' の読込失敗：HTTP '+r.status);v[key]=await API.readNRRD(await r.arrayBuffer());v[key].fields.modality=key==='ct'?'CT':'MR';
   }return v;
  }
  (async()=>{try{
   const cached=window.__BrainAtlasMode3Volumes || (window.__BrainAtlasMode3Volumes=loadOnce());let v;
   try {v=await cached;}catch(err){if(window.__BrainAtlasMode3Volumes===cached)delete window.__BrainAtlasMode3Volumes;throw err;}
   if(cancelled)return;const wins={};for(const k of ['t1','t2']){const data=v[k].data,a=[];const step=Math.max(1,Math.floor(data.length/35000));for(let i=0;i<data.length;i+=step){const x=data[i];if(Number.isFinite(x)&&x>0)a.push(x);}a.sort((x,y)=>x-y);
    const lo=a[Math.floor(a.length*.025)]??0,hi=a[Math.floor(a.length*.993)]??1000;wins[k]={center:(lo+hi)/2,width:Math.max(1,hi-lo)};
   }
   if(cancelled)return;setVol(v);setModalities(wins);const meta=Object.fromEntries(Object.entries(v).map(([key,item])=>[key,{bounds:item.bounds,dims:item.dims,origin:item.origin}]));onMeta(meta);
   setPosition(p=>p||[0,-16,30]);setError('');
   }catch(err){if(!cancelled)setError(err.message||String(err));}finally{if(!cancelled)setLoading('');}
  })();return()=>{cancelled=true;};},[]);
 React.useEffect(()=>{for(const t of Object.values(transform.current)){t.zoom=1;t.panX=0;t.panY=0;}pixelCache.current={};requestRender();},[fitSignal]);
 const bounds=vol[mod]?.bounds||null;
 const lesion=lesionEnabled&&bounds?{...mode3TeachingLesion(bounds,lesionKind,lesionTime,lesionRegion),view:lesionView}:null;
 const lesionAppearance={...mode3ApplyVisibility(mode3LesionAppearance(mod,lesionKind,lesionTime,lesionRegion),lesionView),modality:mod};
 const descriptors=[['axial','水平断面 Axial','#5ccddd',2],['coronal','前額断面 Coronal','#f3ae6a',1],['sagittal','矢状断面 Sagittal','#b6a1ff',0]];
 const quality=mod==='ct'?(windowMode==='bone'?{center:550,width:1800}:{center:40,width:80}):modalities[mod];
 function paint() {
  if(!position||!bounds||!vol[mod]||!quality)return;const v=vol[mod];
  for(const [plane,, ,waxis] of descriptors){const target=refs.current[plane];if(!target)continue;
   const ctx=target.getContext('2d');if(!ctx)continue;const dpr=Math.min(window.devicePixelRatio||1,2),r=target.getBoundingClientRect();if(r.width<2||r.height<2)continue;
   const W=Math.max(1,Math.floor(r.width*dpr)),H=Math.max(1,Math.floor(r.height*dpr));if(target.width!==W||target.height!==H){target.width=W;target.height=H;}
   ctx.fillStyle='#090e18';ctx.fillRect(0,0,W,H);
   const cfg=API.formats[plane],outOfRange=position[waxis]<bounds[waxis][0]||position[waxis]>bounds[waxis][1];
   const cacheKey=[mod,windowMode,plane,position[waxis].toFixed(2),bounds.map(b=>b.join(':')).join('/')].join('|');
   let rendered=pixelCache.current[plane];if(!rendered||rendered.key!==cacheKey){rendered={key:cacheKey,canvas:API.renderSlice(v,plane,position,bounds,448,448,'linear',quality)};pixelCache.current[plane]=rendered;}
   const source=rendered.canvas,t=transform.current[plane];const baseScale=Math.min(W/source.width,H/source.height)*.96;
   const dw=source.width*baseScale*t.zoom,dh=source.height*baseScale*t.zoom,left=(W-dw)/2+t.panX*dpr,top=(H-dh)/2+t.panY*dpr;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,left,top,dw,dh);
   if(lesion)mode3DrawLesionOverlay(ctx,lesion,lesionAppearance,cfg,bounds,left,top,dw,dh,position[waxis],dpr);
   const fracU=(bounds[cfg.u][1]-position[cfg.u])/(bounds[cfg.u][1]-bounds[cfg.u][0]),fracV=(bounds[cfg.v][1]-position[cfg.v])/(bounds[cfg.v][1]-bounds[cfg.v][0]);
   ctx.save();ctx.strokeStyle='rgba(65,211,230,.92)';ctx.lineWidth=Math.max(1,dpr);ctx.beginPath();ctx.moveTo(left+fracU*dw,0);ctx.lineTo(left+fracU*dw,H);ctx.moveTo(0,top+fracV*dh);ctx.lineTo(W,top+fracV*dh);ctx.stroke();ctx.restore();
   ctx.font=`${11*dpr}px system-ui`;ctx.fillStyle='#edf7ff';ctx.fillText(plane==='sagittal'?'A':'R',Math.max(5*dpr,left+8*dpr),Math.max(15*dpr,top+16*dpr));
   if(plane!=='sagittal')ctx.fillText('L',Math.min(W-18*dpr,left+dw-15*dpr),Math.max(15*dpr,top+16*dpr));
   if(outOfRange){ctx.fillStyle='rgba(6,15,25,.76)';ctx.fillRect(0,H/2-35*dpr,W,70*dpr);ctx.fillStyle='#ffe2ad';ctx.font=`${12*dpr}px system-ui`;ctx.textAlign='center';ctx.fillText('この高さは '+(mod==='ct'?'CT':'MRI')+' の撮像範囲外',W/2,H/2);ctx.textAlign='left';}
   frames.current[plane]={left,top,dw,dh,W,H,cfg,dpr};
  }
 }
 function requestRender(){if(renderLock.current)return;renderLock.current=requestAnimationFrame(()=>{renderLock.current=0;paint();});}
 React.useEffect(()=>{requestRender();},[vol,mod,position,windowMode,modalities,activePane,mobile,lesionEnabled,lesionKind,lesionRegion,lesionTime,lesionView]);
 React.useEffect(()=>{const elements=Object.values(refs.current).filter(Boolean);if(!elements.length)return;const ro=new ResizeObserver(requestRender);elements.forEach(el=>ro.observe(el));return()=>ro.disconnect();},[vol,mod,activePane,mobile]);
 React.useEffect(()=>()=>{if(renderLock.current)cancelAnimationFrame(renderLock.current);},[]);
 function location(e,plane){const canvas=refs.current[plane],frame=frames.current[plane];if(!canvas||!frame||!position||!bounds)return;
  const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*frame.W/rect.width,y=(e.clientY-rect.top)*frame.H/rect.height;
  const t=Math.max(0,Math.min(1,(x-frame.left)/frame.dw)),s=Math.max(0,Math.min(1,(y-frame.top)/frame.dh));
  setPosition(p=>{const q=[...p];q[frame.cfg.u]=API.uWorld(bounds,frame.cfg.u,t);q[frame.cfg.v]=API.uWorld(bounds,frame.cfg.v,s);return q;});
 }
 function down(e,plane){const canvas=e.currentTarget;canvas.setPointerCapture(e.pointerId);let g=gestures.current[plane];if(!g)g=gestures.current[plane]={pointers:new Map(),start:null};g.pointers.set(e.pointerId,[e.clientX,e.clientY]);if(g.pointers.size===1){location(e,plane);}else if(g.pointers.size===2){const pts=[...g.pointers.values()],t=transform.current[plane];g.start={dist:Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1]),zoom:t.zoom,panX:t.panX,panY:t.panY,cx:(pts[0][0]+pts[1][0])/2,cy:(pts[0][1]+pts[1][1])/2};}}
 function move(e,plane){const g=gestures.current[plane];if(!g?.pointers.has(e.pointerId))return;g.pointers.set(e.pointerId,[e.clientX,e.clientY]);if(g.pointers.size===1){location(e,plane);return;}if(g.pointers.size===2&&g.start){const a=[...g.pointers.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),cx=(a[0][0]+a[1][0])/2,cy=(a[0][1]+a[1][1])/2;
  const t=transform.current[plane];t.zoom=Math.max(.7,Math.min(5,g.start.zoom*d/Math.max(1,g.start.dist)));t.panX=g.start.panX+cx-g.start.cx;t.panY=g.start.panY+cy-g.start.cy;requestRender();}}
 function up(e,plane){const g=gestures.current[plane];if(!g)return;g.pointers.delete(e.pointerId);g.start=null;if(!g.pointers.size)delete gestures.current[plane];}
 function wheel(e,plane){e.preventDefault();const axis=API.formats[plane].w;if(e.ctrlKey||e.metaKey){const t=transform.current[plane];t.zoom=Math.max(.7,Math.min(5,t.zoom*(e.deltaY>0?.9:1.1)));requestRender();return;}
  if(!position||!bounds)return;const spacing=Math.max(.5,Math.min(2,Math.min(...vol[mod].M.filter((_,i)=>true).map(Math.abs).filter(x=>x>.01))||1));setPosition(p=>{const q=[...p];q[axis]=Math.max(bounds[axis][0],Math.min(bounds[axis][1],p[axis]+(e.deltaY>0?-spacing:spacing)));return q;});}
 return <section className={'mode3-container'+(mobile?' mobile':'')} aria-label="Mode 3 医用画像MPR">
  <div className="mode3-top"><strong>Mode 3 — 実画像による3平面同期</strong><span>{mod==='ct'?'CT · RAS患者座標（MNI未登録）':mod==='t1'?'ICBM152 MRI T1 · MNI座標':'ICBM152 MRI T2 · MNI座標'}</span></div>
  {mobile&&<div className="mode3-mobile-tabs">{[['brain','3D脳'],['axial','水平'],['coronal','前額'],['sagittal','矢状']].map(([id,label])=><button key={id} type="button" className={activePane===id?'sel':''} onClick={()=>setActivePane(id)}>{label}</button>)}</div>}
  {(!position||!vol[mod])?<div className="mode3-loading"><strong>CT・MRI実画像を準備しています</strong><p>{error||loading||'画像データの読み込み中'}</p><p>CTは mode3_data/CT-brain.nrrd、MRIはICBM09cの2ファイルをbrain-atlas/に置いてください。架空の画像では代用しません。</p></div>:
  <React.Fragment><div className="mode3-grid">
    <div className={'mode3-tile mode3-brain-tile'+(mobile&&activePane!=='brain'?' mode3-hide':'')}><header><b>{mod==='ct'?'CT撮像範囲（患者RAS座標）':'3D標準脳（ICBM152・MNI座標）'}</b><span>マウス／指で回転</span></header>
      {mod==='ct'?<Mode3CTCoordinateGuide position={position} bounds={bounds} lesion={lesion}/>:<Mode3RegisteredBrain position={position} mod={mod} lesion={lesion}/>}<footer>{mod==='ct'?'CT断面位置は患者RAS座標で正確に連動。MRI標準脳への登録は未完了です。':'MRIの水平・前額・矢状断面と、3D脳上の切断ガイドは同一MNI座標です。'}</footer></div>
    {descriptors.map(([plane,title,color,axis])=><div className={'mode3-tile'+(mobile&&activePane!==plane?' mode3-hide':'')} key={plane}><header><b style={{color}}>{title}</b><span>{['R–L','A–P','S–I'][axis]} {position[axis].toFixed(1)} mm</span></header>
      <canvas ref={el=>{refs.current[plane]=el;}} style={{touchAction:'none'}} aria-label={title+'：ドラッグで位置選択、ホイールでスライス、ピンチで拡大'}
        onPointerDown={e=>down(e,plane)} onPointerMove={e=>move(e,plane)} onPointerUp={e=>up(e,plane)} onPointerCancel={e=>up(e,plane)} onWheel={e=>wheel(e,plane)}/>
      <footer>タップ・ドラッグ：交差位置 ／ ホイール：スライス ／ ピンチ：拡大</footer></div>)}
  </div><div className="mode3-bottom">MRI：ICBM152 2009c symmetric標準脳（T1/T2 1mm等方性）／CT：3D Slicer CT-MR Brain。MRIと3Dガイドは同一MNI座標。CTはMNI未登録のため位置対応を主張しません。病変は教育用合成3Dモデル（強調表示は診断画像の実信号を示しません）。CTとMRIは未登録のため病変位置はそれぞれ独立した模式配置。自動構造名は未実装。</div></React.Fragment>}
 </section>;
}
