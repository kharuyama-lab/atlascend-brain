/* Brain Atlas Mode 2A — pedagogical pathways layered over the retained HCP1065 specimens.
   Never confuse newly drawn supplemental centerlines with measured tractography.
   Coordinates are attached to the original spinal-cord local geometry; atlas 3D geometry unchanged.
   Primary references: NCBI Bookshelf NBK535423, NBK507888, NBK556013, NBK545206.
*/
(function(){'use strict';
const PATHWAYS=[
 {id:'Corticospinal tract',ja:'皮質脊髄路',en:'Corticospinal tract (CST)',cat:'運動系',color:'#13BAFF',direction:'下行',source:'HCP1065＋頸髄補完',
 summary:'一次運動野など→放線冠→内包後脚→大脳脚→橋底部→延髄錐体→延髄尾側の錐体交叉（大部分）→対側外側皮質脊髄路。同側に残る少数線維は前皮質脊髄路として別表示。',cross:'延髄尾側の錐体交叉（主要線維）',function:'対側の随意運動、特に遠位部の巧緻運動。'},
 {id:'Anterior corticospinal tract',ja:'前皮質脊髄路（非錐体交叉線維）',en:'Anterior corticospinal tract (ACST)',cat:'運動系',color:'#90E1ED',direction:'下行',source:'解剖学的知見に基づく教育用補完',
 summary:'皮質脊髄路の一部は延髄尾側の錐体交叉では交叉せず、同側の前索内側部を下降する。終止髄節では前白交連を通って交叉する線維も多く、両側性の投射と個体差がある。',cross:'延髄の錐体交叉では非交叉。脊髄髄節で一部が交叉。',function:'体幹・近位筋の運動制御への関与。線維数・下行範囲は個体差が大きい。'},
 {id:'Corticobulbar tract',ja:'皮質延髄路',en:'Corticobulbar tract',cat:'運動系',color:'#FF974C',direction:'下行',source:'HCP1065',
 summary:'運動関連皮質→放線冠→内包膝→脳幹の脳神経運動核。核により両側／対側投射の比率が異なる。',cross:'一律の交叉点は存在しない',function:'顔面・舌・咀嚼・嚥下などの運動制御。'},
 {id:'Reticulospinal tract',ja:'網様体脊髄路',en:'Reticulospinal tract',cat:'運動系',color:'#70D58A',direction:'下行',source:'HCP1065＋頸髄補完',
 summary:'橋・延髄の網様体から脊髄へ。複数の投射系があり、左右両側性・走行の多様性がある。',cross:'単一の交叉点なし',function:'姿勢制御・筋緊張・歩行調節。'},
 {id:'Dorsal column–medial lemniscus pathway',ja:'後索―内側毛帯路',en:'Dorsal column–medial lemniscus (DCML)',cat:'感覚系',color:'#A886FF',direction:'上行',source:'HCP内側毛帯＋後索補完',
 summary:'同側後索（薄束・楔状束）→延髄の薄束核・楔状束核→内弓状線維（感覚交叉）→対側内側毛帯→視床VPL→一次体性感覚野。',cross:'延髄尾側の内弓状線維（感覚交叉）',function:'振動覚・精細触覚・意識的固有感覚。'},
 {id:'Spinothalamic tract',ja:'脊髄視床路（前外側系）',en:'Spinothalamic tract (STT)',cat:'感覚系',color:'#FF6687',direction:'上行',source:'教育用補完',
 summary:'後根神経節→後角でシナプス→脊髄前白交連で交叉（通常数髄節以内）→対側前外側索→視床VPL→一次体性感覚野。',cross:'脊髄の前白交連（入髄レベル付近）',function:'痛覚・温度覚（前外側系）。'},
 {id:'Dorsal spinocerebellar tract',ja:'後脊髄小脳路',en:'Dorsal spinocerebellar tract',cat:'感覚系',color:'#39C9B4',direction:'上行',source:'教育用補完',
 summary:'下肢・体幹の固有感覚→Clarke柱（概ねC8～L3）→同側外側索→下小脳脚→同側小脳。',cross:'原則として交叉しない',function:'下肢・体幹の無意識的固有感覚。'},
 {id:'Ventral spinocerebellar tract',ja:'前脊髄小脳路',en:'Ventral spinocerebellar tract',cat:'感覚系',color:'#E9B960',direction:'上行',source:'教育用補完',
 summary:'主に腰仙髄脊髄介在ニューロン系→脊髄内交叉→対側前外側索を上行→主に上小脳脚→小脳内で再交叉する線維が多い。',cross:'脊髄内交叉＋小脳内で再交叉する線維が多い',function:'脊髄運動回路の状態を小脳へ伝える。'},
 {id:'Medial lemniscus',ja:'内側毛帯（単独）',en:'Medial lemniscus',cat:'部分経路',color:'#8D69EF',direction:'上行',source:'HCP1065',
 summary:'延髄の感覚交叉以降、視床VPLへ向かう線維束。後索全体と同一ではない。',cross:'交叉後の経路',function:'精細触覚・振動覚・意識的固有感覚。'},
 {id:'Superior thalamic radiation',ja:'上視床放線',en:'Superior thalamic radiation',cat:'部分経路',color:'#E9DA55',direction:'混合',source:'HCP1065',
 summary:'視床と大脳皮質を結ぶ線維群。感覚路の視床皮質投射はこの一部であり、このメッシュ全体をS1投射と同一視しない。',cross:'なし',function:'視床―皮質の情報伝達。'},
 {id:'Optic radiation',ja:'視放線',en:'Optic radiation',cat:'視覚系',color:'#EC66B7',direction:'上行',source:'HCP1065',
 summary:'外側膝状体→側頭葉・頭頂葉の白質（Meyerループ等）→後頭葉の一次視覚野。',cross:'視交叉は視放線より近位',function:'視覚情報伝達。'},
 {id:'Dentatorubrothalamic tract',ja:'歯状核赤核視床路',en:'Dentato-rubro-thalamic tract',cat:'小脳関連',color:'#589BFF',direction:'上行',source:'HCP1065',
 summary:'小脳歯状核→上小脳脚→中脳で交叉→赤核周辺・視床（VL等）→運動関連皮質。',cross:'上小脳脚交叉',function:'小脳出力・運動調節。'},
 ];
for(const item of PATHWAYS){if(window.Mode1Routes?.[item.id])window.Mode1Routes[item.id].color=item.color;}
const V07C_VERSION="v0.7D specimen-registered smoothed";
const SUPP=new Set(['Anterior corticospinal tract','Corticospinal tract','Reticulospinal tract','Dorsal column–medial lemniscus pathway','Spinothalamic tract','Dorsal spinocerebellar tract','Ventral spinocerebellar tract']);
function create(T,args){
 const {spinal,gltfScene,meshById,nodes}=args;
 const group=new T.Group();group.name='Mode 2A: 伝導路の補完（模式経路）';gltfScene.add(group);
 const perRoute=new Map();const pulses=[];
 const vec=(x,y,z)=>new T.Vector3(x,y,z);
 const section=(t)=>spinal && spinal.getSectionAt(spinal.topY+(spinal.bottomY-spinal.topY)*t);
 const top=section(.06),bottom=section(.92);
 if(!top || !bottom){console.warn('[Mode2] cord sections unavailable; native HCP tracts only');return {setSelection(){},setImpulses(){},update(){},getDiagnostics(){return {supplementalReady:false};}};}
 function centroid(label,side){
   const node=nodes.find(n=>n.label===label && n.side===side);
   const m=node && meshById.get(node.id)?.[0];if(!m) return null;
   if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
   gltfScene.updateWorldMatrix(true,true);
   const v=m.geometry.boundingBox.getCenter(new T.Vector3());
   return gltfScene.worldToLocal(m.localToWorld(v));
 }
 // X sign depends on the actual hemisphere registration, not on an assumption
 // about GLTF's left-right axis convention.
 const left=centroid('Precentral gyrus','left');
 const right=centroid('Precentral gyrus','right');
 const xsgn = {left:left?Math.sign(left.x-top.x)||-1:-1,
               right:right?Math.sign(right.x-top.x)||1:1};
 function pt(t,side,lateral,anterior){
   const s=section(t);
   // A tube has non-zero thickness.  Limit normalized radial offset so its
   // complete cross-section remains inside the original cervical exterior.
   const r=Math.hypot(lateral,anterior),maxR=.76;
   const k=r>maxR?maxR/r:1;
   return vec(s.x+xsgn[side]*s.rx*lateral*k,s.y,s.z+s.rz*anterior*k);
 }
 function med(side,lateral,anterior,dy){return vec(top.x+xsgn[side]*top.rx*lateral,top.y+dy,top.z+top.rz*anterior);}
 // Use the actual native HCP tract terminal as an anchor; do not falsely assert
 // that the missing segment has been measured or registered.
 function lowEnd(label,side){
   const n=nodes.find(n=>n.label===label&&n.side===side),m=n&&meshById.get(n.id)?.[0];
   if(!m)return null;
   const at=m.geometry?.getAttribute('position');if(!at || !at.count)return null;
   gltfScene.updateWorldMatrix(true,true);
   let min=Infinity, lo=[];
   const v=new T.Vector3();
   for(let i=0;i<at.count;i++){v.fromBufferAttribute(at,i);const p=gltfScene.worldToLocal(m.localToWorld(v.clone()));if(p.y<min)min=p.y;}
   const b=new T.Vector3();let c=0;
   for(let i=0;i<at.count;i++) {v.fromBufferAttribute(at,i);const p=gltfScene.worldToLocal(m.localToWorld(v.clone()));if(p.y<min+.003){b.add(p);c++;}}
   return c?b.multiplyScalar(1/c):null;
 }
 // Produce a SINGLE descending teaching centerline through the existing HCP
 // CST mesh before extending it into the medulla and the atlas-constrained cord.
 // The native vertices are OBSERVED specimens; their median path is an
 // educational visualization, not a tractography-derived stream-line.
 function nativeCSTCenterline(side){
   const node=nodes.find(n=>n.label==='Corticospinal tract'&&n.side===side);
   const meshes=node && meshById.get(node.id)||[];
   const cloud=[];gltfScene.updateMatrixWorld(true);
   const q=new T.Vector3();
   for(const m of meshes){
     const at=m.geometry?.getAttribute('position');if(!at)continue;
     for(let i=0;i<at.count;i++){
       q.fromBufferAttribute(at,i);
       cloud.push(gltfScene.worldToLocal(m.localToWorld(q.clone())));
     }
   }
   if(cloud.length<30)return [];
   const ys=cloud.map(x=>x.y).sort((a,b)=>a-b);
   const low=ys[Math.floor(ys.length*.003)],high=ys[Math.floor(ys.length*.997)];
   if(!(high-low>.003))return [];
   const n=17, step=(high-low)/(n-1), out=[];
   const median=(values)=>{values.sort((a,b)=>a-b);return values[Math.floor(values.length/2)];};
   for(let k=0;k<n;k++){
     const y=high-step*k;
     const band=cloud.filter(v=>Math.abs(v.y-y)<step*.75);
     if(band.length<8)continue;
     out.push(vec(median(band.map(v=>v.x)),y,median(band.map(v=>v.z))));
   }
   // The inferior specimen end is an exact shared anchor with the next section.
   const end=lowEnd('Corticospinal tract',side);
   if(end){
     while(out.length>1&&out[out.length-1].y<=end.y+.00025)out.pop();
     out.push(end);
   }
   return out;
 }
 // Anatomical landmarks originate from the ORIGINAL specimen, not arbitrary stage coordinates.
 function structureBounds(label,side){
   const node=nodes.find(n=>n.label===label && n.side===side),meshes=node&&meshById.get(node.id);
   if(!meshes?.length)return null;
   const mn=vec(Infinity,Infinity,Infinity),mx=vec(-Infinity,-Infinity,-Infinity);
   let low=vec(0,0,0),cnt=0,ys=[];
   gltfScene.updateWorldMatrix(true,true);
   for(const m of meshes){const at=m.geometry?.getAttribute('position');if(!at)continue;
     const v=new T.Vector3();for(let i=0;i<at.count;i++){
       v.fromBufferAttribute(at,i);const q=gltfScene.worldToLocal(m.localToWorld(v.clone()));
       mn.min(q);mx.max(q);ys.push(q);
     }
   }
   if(!ys.length)return null;
   const cap=mn.y+(mx.y-mn.y)*.12;
   for(const q of ys)if(q.y<=cap){low.add(q);cnt++;}
   return {min:mn,max:mx,center:mn.clone().add(mx).multiplyScalar(.5),low:cnt?low.multiplyScalar(1/cnt):mn.clone()};
 }
 const landmarks=[];
 const regionMeshes=[];
 // All reference positions below are computed from ACTUAL BodyParts3D meshes.
 // The original HCP1065 tract endpoint is kept.  Only its missing inferior
 // continuation is reconstructed; no native tract mesh is translated.
 const medullaBounds=structureBounds('Medulla oblongata','left');
 const pontineBounds={left:structureBounds('Pons','left'),right:structureBounds('Pons','right')};
 const medSpan=medullaBounds?medullaBounds.max.y-medullaBounds.min.y:top.rx*5;
 const pyramid={left:structureBounds('Pyramid of medulla oblongata','left'),right:structureBounds('Pyramid of medulla oblongata','right')};
 const audit={version:V07C_VERSION,medullaAnchored:!!medullaBounds,pyramidsAnchored:!!(pyramid.left&&pyramid.right),cordClamps:0,brainstemClamps:0,routeSamples:0,cordOutliers:0,brainstemOutliers:0};
 // Narrow local Y-band samples are used rather than whole-object centroids;
 // the caudal medulla slopes strongly posteriorly as it narrows toward C1.
 const profileCache=new Map(),cloudCache=new Map();
 function specimenBand(label,side,y){
   const snappedY=Math.round(y/.0007)*.0007;
   const key=label+'|'+side+'|'+snappedY.toFixed(5);
   if(profileCache.has(key))return profileCache.get(key);
   const n=nodes.find(q=>q.label===label&&q.side===side);
   const mm=n&&(meshById.get(n.id)||[]);
   if(!mm?.length){profileCache.set(key,null);return null;}
   const cloudKey=label+'|'+side;
   let cloud=cloudCache.get(cloudKey);
   if(!cloud){
     cloud=[];gltfScene.updateWorldMatrix(true,true);
     const q=new T.Vector3();
     for(const m of mm){
       const arr=m.geometry?.getAttribute('position');if(!arr)continue;
       for(let i=0;i<arr.count;i++){
         q.fromBufferAttribute(arr,i);
         cloud.push(gltfScene.worldToLocal(m.localToWorld(q.clone())));
       }
     }
     cloudCache.set(cloudKey,cloud);
   }
   const minY=label==='Medulla oblongata'?medullaBounds?.min.y:label==='Pons'?pontineBounds[side]?.min.y:pyramid[side]?.min.y;
   const maxY=label==='Medulla oblongata'?medullaBounds?.max.y:label==='Pons'?pontineBounds[side]?.max.y:pyramid[side]?.max.y;
   if(minY!=null&&(y<minY-.0022||y>maxY+.0022)){
     profileCache.set(key,null);return null;
   }
   const span=.00145;
   const pos=cloud.filter(v=>Math.abs(v.y-snappedY)<=span);
   if(pos.length<5){profileCache.set(key,null);return null;}
   const bx={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
   for(const v of pos){bx.minX=Math.min(v.x,bx.minX);bx.maxX=Math.max(v.x,bx.maxX);bx.minZ=Math.min(v.z,bx.minZ);bx.maxZ=Math.max(v.z,bx.maxZ);}
   profileCache.set(key,bx);return bx;
 }
 // Raw mesh bands jump at individual triangles and snapped slice boundaries.
 // Build a *stable, level-dependent envelope* from the original GLB once per
 // structure and use continuous interpolation for every spline point.
 // A moving average of anatomical cross-section limits is preferable to
 // clipping the tract separately against a noisy band at each rendered sample.
 const smoothProfileCache=new Map();
 function smoothSpecimenBand(label,side,y){
   const key=label+'|'+side;
   if(!smoothProfileCache.has(key)){
     const region=label==='Medulla oblongata'?medullaBounds:
        label==='Pons'?pontineBounds[side]:pyramid[side];
     if(!region){smoothProfileCache.set(key,null);}
     else {
       const count=Math.max(20,Math.ceil((region.max.y-region.min.y)/.0013));
       const levels=Array.from({length:count+1},(_,i)=>{
         const h=region.min.y+(region.max.y-region.min.y)*i/count;
         return specimenBand(label,side,h);
       });
       const props=['minX','maxX','minZ','maxZ'];
       const smoothed=levels.map((v,i)=>{
         if(!v)return null;
         const o={};
         for(const k of props){let total=0,weight=0;
           for(let j=Math.max(0,i-3);j<=Math.min(count,i+3);j++){
             if(!levels[j])continue;
             const w=[4,3,2,1][Math.abs(j-i)];
             total+=levels[j][k]*w;weight+=w;
           }
           o[k]=weight?total/weight:v[k];
         }
         return o;
       });
       smoothProfileCache.set(key,{minY:region.min.y,maxY:region.max.y,levels:smoothed});
     }
   }
   const p=smoothProfileCache.get(key);
   if(!p||y<p.minY-.001||y>p.maxY+.001)return null;
   const t=Math.max(0,Math.min(p.levels.length-1,(y-p.minY)/(p.maxY-p.minY)*(p.levels.length-1)));
   let lo=Math.floor(t),hi=Math.min(lo+1,p.levels.length-1);
   // Fallback to neighboring original anatomical samples at mesh tips.
   while(lo>0&&!p.levels[lo])lo--;
   while(hi<p.levels.length-1&&!p.levels[hi])hi++;
   const a=p.levels[lo],b=p.levels[hi];
   if(!a&&!b)return null;
   if(!a)return b;
   if(!b)return a;
   const f=hi===lo?0:(t-lo)/(hi-lo);
   return {minX:a.minX+(b.minX-a.minX)*f,maxX:a.maxX+(b.maxX-a.maxX)*f,
           minZ:a.minZ+(b.minZ-a.minZ)*f,maxZ:a.maxZ+(b.maxZ-a.maxZ)*f};
 }
 function bandAt(y,side){
   let m=null,p=null;
   if(medullaBounds&&y<=medullaBounds.max.y+.0001&&y>=medullaBounds.min.y-.0008){
     const hemi=smoothSpecimenBand('Medulla oblongata','left',y);
     if(hemi)m={minX:-hemi.maxX,maxX:hemi.maxX,minZ:hemi.minZ,maxZ:hemi.maxZ,kind:'medulla'};
   }
   const one=smoothSpecimenBand('Pons',side,y);
   if(one){const other=smoothSpecimenBand('Pons',side==='left'?'right':'left',y);
     p={minX:other?Math.min(one.minX,other.minX):one.minX,
        maxX:other?Math.max(one.maxX,other.maxX):one.maxX,
        minZ:one.minZ,maxZ:one.maxZ,kind:'pons'};
   }
   if(m&&p){
     // The two original specimen segmentations OVERLAP at the pontomedullary
     // junction. Switching envelopes abruptly here generated visible kinks.
     const transitionStart=Math.max(medullaBounds.min.y,Math.max(pontineBounds.left.min.y,pontineBounds.right.min.y));
     const transitionEnd=medullaBounds.max.y;
     const t=Math.max(0,Math.min(1,(y-transitionStart)/Math.max(.001,transitionEnd-transitionStart)));
     const f=t*t*(3-2*t);
     return {minX:m.minX*(1-f)+p.minX*f,maxX:m.maxX*(1-f)+p.maxX*f,
       minZ:m.minZ*(1-f)+p.minZ*f,maxZ:m.maxZ*(1-f)+p.maxZ*f,kind:'pontomedullary-blend'};
   }
   return m||p;
 }
 function pupil(y,side,fraction=.36,depth=.77){
   const b=bandAt(y,side);
   if(!b)return null;
   const hw=Math.max(Math.abs(b.minX),Math.abs(b.maxX));
   return vec(xsgn[side]*hw*fraction,y,b.minZ+(b.maxZ-b.minZ)*depth);
 }
 function pyrAt(y,side){
   const b=smoothSpecimenBand('Pyramid of medulla oblongata',side,y);
   if(!b)return pupil(y,side,.31,.80);
   return vec((b.minX+b.maxX)/2,y,(b.minZ+b.maxZ)/2);
 }
 function decussation(side){
   // caudal fifth of the ACTUAL medulla, not inside the cervical cord and
   // not at the inferior boundary of the segmented pyramids (which end above).
   const y=medullaBounds?medullaBounds.min.y+medSpan*.20:top.y+.006;
   const b=bandAt(y,side);
   const z=b?b.minZ+(b.maxZ-b.minZ)*.51:top.z;
   return vec(top.x,y,z);
 }
 function keepInside(p){
   const out=p.clone();
   const c=spinal.getSectionAt(p.y);
   if(c){
     const u=(p.x-c.x)/c.rx, v=(p.z-c.z)/c.rz;
     const r=Math.hypot(u,v);audit.routeSamples++;
     if(r>.79){audit.cordOutliers++;const k=.75/r;
       out.x=c.x+(p.x-c.x)*k;out.z=c.z+(p.z-c.z)*k;audit.cordClamps++;}
     return out;
   }
   const b=bandAt(p.y,'left');
   if(b){
     const cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
     const rx=Math.max(.001,(b.maxX-b.minX)/2),rz=Math.max(.001,(b.maxZ-b.minZ)/2);
     const u=(p.x-cx)/rx,v=(p.z-cz)/rz,r=Math.hypot(u,v);
     audit.routeSamples++;
     // Conservative elliptical inner envelope; avoids the surface protrusion
     // while preserving correct anterior/posterior and lateral tract ordering.
     if(r>.82){audit.brainstemOutliers++;const k=.79/r;
       out.x=cx+(p.x-cx)*k;out.z=cz+(p.z-cz)*k;audit.brainstemClamps++;}
   }
   return out;
 }
 function capsuleLandmark(side){
   const put=centroid('Putamen',side);
   const thal=centroid('Ventral laterodorsal nucleus',side)||centroid('Ventral lateroventral nucleus',side);
   if(!put||!thal)return null;
   // Posterior limb corridor is BETWEEN thalamus and the lentiform nucleus.
   // Approximate highlight only; native specimen contains no capsule segmentation.
   const mid=put.clone().lerp(thal,.5);
   const gap=put.distanceTo(thal);
   mid.z-=Math.min(gap*.15,.008); // posterior half of the putamen/thalamic corridor
   const geom=new T.SphereGeometry(1,18,10);
   const obj=new T.Mesh(geom,new T.MeshBasicMaterial({color:0xc4e4f0,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));
   obj.scale.set(Math.max(.002,gap*.18),Math.max(.009,gap*.36),Math.max(.002,gap*.16));
   obj.position.copy(mid);obj.name='内包後脚（位置参照・模式領域）';
   obj.userData={mode2Supplement:true,kind:'approximate-internal-capsule',side};
   obj.renderOrder=5;group.add(obj);regionMeshes.push({mesh:obj,side});
   landmarks.push({ja:'内包後脚（模式領域）',en:'Posterior limb of internal capsule · approximate corridor',side,point:mid.clone(),color:'#b6e1f7'});
   return mid;
 }
 for(const side of ['left','right'])capsuleLandmark(side);
 for(const side of ['left','right']){
   const d=decussation(side);
   landmarks.push({ja:'錐体交叉（延髄尾側）',en:'Pyramidal decussation · caudal medulla',side,point:d,color:'#13BAFF'});
 }
 // The terminal T1 motor circuit is a clearly identified pedagogical overlay.
 // This is NOT a segmentation of synapses or alpha-motoneuron somata in PAM50.
 const motorCircuits=[];let motorCircuitMode='direct';let selectedHemisphere='both';
 function neuronTube(sub,points,color,r=.00032){
   const curve=new T.CatmullRomCurve3(points,false,'centripetal',.3);
   const mesh=new T.Mesh(new T.TubeGeometry(curve,32,r,8,false),
      new T.MeshBasicMaterial({color,depthWrite:false,transparent:true,opacity:.98}));
   mesh.renderOrder=18;sub.add(mesh);return mesh;
 }
 function neuronSoma(sub,point,color,r=.00095){
   const m=new T.Mesh(new T.SphereGeometry(r,14,12),new T.MeshBasicMaterial({color,depthWrite:false}));
   m.position.copy(point);m.renderOrder=19;sub.add(m);return m;
 }
 // A monosynaptic corticomotoneuronal example, not all CST fibers.
 // The downstream alpha MN axon runs through the ventral root/peripheral
 // motor nerve to a muscle endplate. Peripheral anatomy is NOT TO SCALE.
 function buildT1Circuit(startSide){
   const target=startSide==='left'?'right':'left';
   const common=new T.Group(),direct=new T.Group();
   const cst=pt(.908,target,.55,-.23);
   const dendrite=pt(.908,target,.37,.32);
   const alpha=pt(.908,target,.30,.48);
   const exit=pt(.908,target,.80,.67);
   const rootOutside=exit.clone().add(vec(xsgn[target]*top.rx*.28,top.rx*.025,top.rz*.35));
   const peripheral=rootOutside.clone().add(vec(xsgn[target]*top.rx*.45,-top.rx*.055,top.rz*.25));
   const endplate=peripheral.clone().add(vec(xsgn[target]*top.rx*.34,-top.rx*.015,top.rz*.21));
   const cyan=0x15d4e9,pink=0xff79b5,gold=0xffe37b;
   neuronSoma(common,alpha,pink,Math.max(.00047,top.rx*.12));
   // Dendrite belongs to alpha motoneuron. Synaptic terminal is cyan.
   neuronTube(common,[alpha,dendrite],pink,.00030);
   neuronTube(direct,[cst,pt(.908,target,.41,.09),dendrite],cyan,.00034);
   neuronSoma(direct,dendrite,gold,Math.max(.00020,top.rx*.045));
   // One continuous postsynaptic axon: anterior horn -> ventral root -> peripheral axon.
   neuronTube(common,[alpha,pt(.908,target,.54,.60),exit,rootOutside,peripheral,endplate],pink,.00038);
   neuronSoma(common,endplate,gold,Math.max(.00028,top.rx*.06));
   // Small muscle fiber at the NMJ (explanatory icon, not anatomical distance).
   const muscle=new T.Mesh(new T.SphereGeometry(1,14,12),
      new T.MeshBasicMaterial({color:0xDEA68A,depthWrite:false,transparent:true,opacity:.9}));
   muscle.position.copy(endplate).add(vec(xsgn[target]*top.rx*.14,0,top.rz*.065));
   muscle.scale.set(top.rx*.34,top.rx*.11,top.rx*.12);
   muscle.renderOrder=18;common.add(muscle);
   group.add(common,direct);
   motorCircuits.push({startSide,common,direct,cst,alpha,dendrite,rootOutside,peripheral,endplate});
 }
 function syncMotorCircuits(){
   const active=perRoute.has('Corticospinal tract');
   for(const c of motorCircuits){
     const on=active && motorCircuitMode!=='off' && group.visible &&
       selectedRoutes.has('Corticospinal tract') &&
       (selectedHemisphere==='both'||selectedHemisphere===c.startSide);
     c.common.visible=on;
     c.direct.visible=on;
   }
 }
 let selectedRoutes=new Set();
 function setMotorCircuit(mode){
   motorCircuitMode=mode==='off'?'off':'direct';
   syncMotorCircuits();
 }
 const curves=[];
 function path(id,side,pts,opts={}){
   if(pts.length<2)return;
   const color=PATHWAYS.find(r=>r.id===id).color;
   const approximate=new T.CatmullRomCurve3(pts.map(p=>p.clone()),false,'centripetal',.4);
   // Densely regularize the complete 3D continuation, not only the anchors.
   // This catches Catmull-Rom overshoot between two otherwise valid anchors.
   const nSteps=Math.max(100,pts.length*22);
   function smoothClamp(q,i){
     const inside=keepInside(q);
     // The native HCP fibre endpoint can be beyond the INNER ellipse even
     // though it is part of the genuine mesh. Bring it into the inner
     // corridor gradually; an immediate projection created a sharp notch.
     if(opts.nativeAnchor&&i<24){
       const t=i/24,f=t*t*(3-2*t);
       return q.clone().lerp(inside,f);
     }
     return inside;
   }
   const constrained=[];
   for(let i=0;i<=nSteps;i++){
     const q=approximate.getPoint(i/nSteps);
     constrained.push(smoothClamp(q,i));
   }
   // After correcting overshoot, low-pass ONLY the transverse x/z track.
   // This removes polygon-by-polygon oscillation while retaining every height
   // and the medullary decussation. Preserve original HCP anchor exactly.
   let regularized=constrained;
   for(let pass=0;pass<3;pass++){
     regularized=regularized.map((p,i)=>{
       if(i===0||i===regularized.length-1)return p.clone();
       let xx=0,zz=0,ww=0;
       for(let k=-6;k<=6;k++){
         const j=Math.min(regularized.length-1,Math.max(0,i+k));
         const w=7-Math.abs(k);
         xx+=regularized[j].x*w;zz+=regularized[j].z*w;ww+=w;
       }
       const q=p.clone();
       // Avoid shifting the HCP specimen endpoint or the terminal endpoint.
       const fade=Math.min(1,i/12,(regularized.length-1-i)/12);
       const a=fade*fade*(3-2*fade);
       q.x+=(xx/ww-q.x)*a;q.z+=(zz/ww-q.z)*a;
       return q;
     });
   }
   // A final, gentle radial check uses the now-continuous specimen envelope.
   // Do not snap an already smoothed path back onto individual raw vertices.
   const finalPoints=regularized;
   const curve=new T.CatmullRomCurve3(finalPoints,false,'centripetal',.24);
   const rad=Math.max(.00045,Math.min(top.rx*.09,.00105));
   const tube=new T.Mesh(new T.TubeGeometry(curve,Math.max(48,pts.length*20),rad,7,false),
       new T.MeshBasicMaterial({color,transparent:true,opacity:(id==='Corticospinal tract'?.95:(opts.reference?.57:.95)),depthWrite:false}));
   tube.userData={mode2Supplement:true,id,side,schematic:true,kind:opts.reference?'inferred-connection':'cord-local'};
   tube.renderOrder=12;group.add(tube);
   const info={id,side,mesh:tube,curve,reversed:!!opts.reverse};
   curves.push(info);
   if(!perRoute.has(id))perRoute.set(id,[]);
   perRoute.get(id).push(info);
   const dot=new T.Mesh(new T.SphereGeometry(rad*1.35,8,7),new T.MeshBasicMaterial({color,transparent:true,opacity:.88,depthWrite:false}));
   dot.visible=false;dot.renderOrder=13;group.add(dot);pulses.push({dot,...info});
 }
 for(const side of ['left','right']){
   const opp=side==='left'?'right':'left';
   // Lateral CST: specimen-anchored sequence from the HCP endpoint in the
   // ventral pons through the actual medullary pyramid, then decussation.
   // This prevents the old spline from bowing outside the pons/medulla.
   const cst=lowEnd('Corticospinal tract',side);
   const dec=decussation(side);
   const pons=pontineBounds[side];
   const pyr=pyramid[side];
   const pontineY=pons?pons.min.y+(pons.max.y-pons.min.y)*.23:dec.y+medSpan;
   const rostralMedY=medullaBounds?medullaBounds.max.y-medSpan*.045:dec.y+medSpan*.70;
   const pyrHiY=pyr?pyr.min.y+(pyr.max.y-pyr.min.y)*.74:dec.y+medSpan*.53;
   const pyrLoY=pyr?pyr.min.y+(pyr.max.y-pyr.min.y)*.17:dec.y+medSpan*.39;
   const caudalMedY=medullaBounds?medullaBounds.min.y+medSpan*.43:dec.y+medSpan*.22;
   const preCrossY=medullaBounds?medullaBounds.min.y+medSpan*.27:dec.y+medSpan*.07;
   const nativeTrace=nativeCSTCenterline(side);
   const bridge=[
     ...(nativeTrace.length?nativeTrace:(cst?[cst]:[])),
     pupil(pontineY,side,.34,.88),
     pupil(rostralMedY,side,.37,.79),
     pyrAt(pyrHiY,side),
     pyrAt(pyrLoY,side),
     pupil(caudalMedY,side,.31,.69),
     pupil(preCrossY,side,.20,.61),
     dec,
     pt(.018,opp,.20,.06),
     pt(.09,opp,.50,-.22),
     pt(.30,opp,.57,-.24),pt(.58,opp,.55,-.23),pt(.975,opp,.53,-.22)
   ].filter(Boolean);
   path('Corticospinal tract',side,bridge,{reference:true,nativeAnchor:!!cst});
   // At the terminal T1 representative level, the same CST fiber branches into a motor-neuron example.
   // Do not create an unrelated C5-ending branch.
   buildT1Circuit(side);
   // Anterior corticospinal tract (minor uncrossed component at PYRAMIDAL level).
   // It descends ipsilaterally near the anterior median fissure, with a representative
   // segmental commissural branch; a small uncrossed ipsilateral branch is also shown.
   // The schematic is NOT a measured fibre count or a fixed 10% diameter.
   path('Anterior corticospinal tract',side,[
     pyrAt(pyrLoY,side),
     pupil(caudalMedY,side,.24,.73),
     pupil(preCrossY,side,.12,.75),
     pt(.018,side,.12,.67),
     pt(.10,side,.11,.72),pt(.34,side,.12,.71),pt(.58,side,.11,.71),pt(.78,side,.10,.71)
   ].filter(Boolean),{reference:true});
   path('Anterior corticospinal tract',side,[
     pt(.58,side,.12,.78),pt(.595,side,.04,.47),pt(.60,opp,.11,.42),pt(.62,opp,.24,.32)
   ],{reference:true});
   path('Anterior corticospinal tract',side,[
     pt(.58,side,.12,.78),pt(.60,side,.18,.46),pt(.62,side,.26,.34)
   ],{reference:true});
   // Reticulospinal: anteromedial cord localization, display schematic projection.
   path('Reticulospinal tract',side,[
     pt(.03,side,.25,.45),pt(.21,side,.31,.57),pt(.45,side,.30,.62),pt(.68,side,.31,.60),pt(.91,side,.30,.58)
   ],{reference:true});
   // Dorsal columns run on SAME side, synapse at caudal medulla;
   // medial lemniscus after sensory decussation is a distinct second-order neuron.
   const mlOpp=lowEnd('Medial lemniscus',opp);
   // Medial gracile / lateral cuneate fasciculi are separated throughout
   // the cervical cord, as in anatomical dorsal-column cross sections.
   path('Dorsal column–medial lemniscus pathway',side,[
     pt(.92,side,.12,-.67),pt(.69,side,.12,-.69),pt(.45,side,.12,-.73),
     pt(.20,side,.12,-.73),pt(.018,side,.12,-.69)
   ]);
   path('Dorsal column–medial lemniscus pathway',side,[
     pt(.92,side,.42,-.60),pt(.69,side,.41,-.65),pt(.45,side,.41,-.66),
     pt(.20,side,.42,-.66),pt(.018,side,.40,-.61)
   ]);
   // The sensory decussation belongs to the lower MEDULLA, not the cord.
   path('Dorsal column–medial lemniscus pathway',side,[
     pt(.018,side,.27,-.65),med(side,.30,-.54,.010),
     med(side,.17,-.20,.014),med(opp,.16,.12,.018),
     ...(mlOpp?[mlOpp]:[med(opp,.24,.24,.012)])
   ],{reference:true});
   // Spinothalamic second-order axon: dorsal horn -> anterior white commissure,
   // then contralateral anterolateral funiculus. Representative C7 entry.
   path('Spinothalamic tract',side,[
     pt(.74,side,.63,-.39),pt(.735,side,.38,.05),pt(.733,opp,.18,.42),
     pt(.70,opp,.64,.47),pt(.48,opp,.70,.43),pt(.25,opp,.70,.40),pt(.058,opp,.67,.38),
     pt(.014,opp,.56,.28)
   ]);
   // Dorsal spinocerebellar: lower limb/trunk afferents relay via Clarke column,
   // then ascend ipsilaterally in dorsolateral funiculus toward inferior peduncle.
   path('Dorsal spinocerebellar tract',side,[
     pt(.92,side,.81,-.35),pt(.68,side,.82,-.34),pt(.44,side,.82,-.35),
     pt(.19,side,.84,-.38),pt(.032,side,.76,-.38)
   ]);
   // Ventral spinocerebellar: first spinal crossing; ascending contralateral
   // ventrolateral tract. Cerebellar entry and recrossing not drawn without anchors.
   path('Ventral spinocerebellar tract',side,[
     pt(.91,side,.26,-.05),pt(.90,opp,.20,.22),pt(.85,opp,.78,.55),
     pt(.64,opp,.81,.55),pt(.43,opp,.81,.51),pt(.19,opp,.79,.53),pt(.033,opp,.69,.52)
   ]);
 }
 let impulse=true;
 function setSelection(ids,hemi){
   const chosen=new Set(ids||[]);
   selectedRoutes=chosen;selectedHemisphere=hemi||'both';
   group.visible=chosen.size>0;
   for(const r of regionMeshes){r.mesh.visible=(chosen.has('Corticospinal tract')||chosen.has('Anterior corticospinal tract'))&&(hemi==='both'||hemi===r.side);}
   for(const item of curves){
     item.mesh.visible=chosen.has(item.id) && (hemi==='both'||hemi===item.side);
   }
   for(const p of pulses)p.dot.visible=impulse && p.mesh.visible;
   syncMotorCircuits();
 }
 function setImpulses(v){impulse=!!v;for(const p of pulses)p.dot.visible=impulse&&p.mesh.visible;}
 function getSectionMarkersAtY(y){
   if(!spinal || !Number.isFinite(y))return [];
   const s=spinal.getSectionAt(y);
   if(!s)return [];
   const hits=[];
   for(const item of curves){
     if(!item.mesh.visible)continue;
     const pts=item.curve.getPoints(240);
     for(let i=1;i<pts.length;i++){
       const a=pts[i-1],b=pts[i];
       if((a.y-y)*(b.y-y)>0 || Math.abs(b.y-a.y)<1e-9)continue;
       const t=(y-a.y)/(b.y-a.y);
       const p=a.clone().add(b.clone().sub(a).multiplyScalar(t));
       const u=(p.x-s.x)/s.rx, v=(p.z-s.z)/s.rz;
       if(Math.abs(u)>.94 || Math.abs(v)>.94)continue;
       const def=PATHWAYS.find(x=>x.id===item.id);
       if(def)hits.push({id:item.id,u,v,color:def.color,ja:def.ja,en:def.en,side:item.side});
       break;
     }
   }
   return hits;
 }
 // Mode2 brainstem-to-cord centerline section sampling. The samples come
 // from the SAME 3D spline used to render each schematic continuation.
 // We never produce fabricated histology masks from these line crossings.
 function getBrainstemSectionCrossingsAtY(y){
   if(!Number.isFinite(y))return [];
   const out=[],limits=new Map();
   for(const item of curves){
     if(!item.mesh.visible)continue;
     const pts=item.curve.getPoints(160);
     for(let i=1;i<pts.length;i++){
       const a=pts[i-1],b=pts[i],d=b.y-a.y;
       if(Math.abs(d)<1e-10||(a.y-y)*(b.y-y)>0)continue;
       const p=a.clone().lerp(b,(y-a.y)/d);
       const key=item.id+'|'+item.side;
       const arr=limits.get(key)||[];
       if(arr.some(old=>(old.x-p.x)**2+(old.z-p.z)**2<.000004))continue;
       // A single representative 3D route must not generate two teaching dots
       // at one axial level. Multiple intersections are diagnostic of a fold,
       // not two independent corticospinal tracts.
       if(arr.length>=1)break;
       arr.push(p);limits.set(key,arr);
       const def=PATHWAYS.find(x=>x.id===item.id);
       if(def)out.push({id:item.id,x:p.x,z:p.z,ja:def.ja,en:def.en,side:item.side,color:def.color,basis:'3D schematic spline intersection'});
     }
   }
   return out;
 }
 function update(now){
   if(!impulse||!group.visible)return;
   for(const p of pulses){if(!p.dot.visible)continue;
     // upgoing tracts start from the cord and vice versa; spread phase subtly.
     const t=((now*.00015+(p.side==='right'?.48:0))%1);
     const pos=p.curve.getPointAt(t); // each polyline is ordered along the impulse direction
     p.dot.position.copy(pos);
   }
 }
 return {group,setSelection,setImpulses,setMotorCircuit,update,getSectionMarkersAtY,getBrainstemSectionCrossingsAtY,
    getLandmarks(){return landmarks.slice();},
    getDiagnostics(){return {supplementalReady:true,curves:curves.length,continuousCST:true,motorCircuits:motorCircuits.length,ids:[...perRoute.keys()],internalCapsuleProxy:regionMeshes.length,...audit};}};
}
window.Mode2Pathways={PATHWAYS,SUPP,create};
})();
