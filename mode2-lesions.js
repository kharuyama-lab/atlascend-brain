/* Mode 2 v0.8E — representative ACUTE stroke lesion overlays (not CT/MRI, not patient data).
 * All anchors come from the loaded GLB's own structures, and all additions live
 * ONLY in Mode 2.  Infarcts are cortical surface patches or small deep foci;
 * hemorrhages are intraparenchymal clot volumes.
 * No time progression or quantitative lesion volume is implied.
 */
(function(){'use strict';
 const CASES=[
  {id:'mca',ja:'MCA領域の皮質梗塞',kind:'ischemic',group:'脳梗塞',artery:'MCA',tracts:['Corticospinal tract','Spinothalamic tract'],
   desc:'中大脳動脈の代表的な皮質梗塞例。皮質病巣と皮質下経路の関係を学習。MCA全域の閉塞や病巣を意味しません。',site:'前頭・頭頂葉の外側面（模式的な部分病変）'},
  {id:'aca',ja:'ACA領域の皮質梗塞',kind:'ischemic',group:'脳梗塞',artery:'ACA',tracts:['Corticospinal tract'],
   desc:'前大脳動脈の内側前頭・頭頂領域。下肢優位の障害に関連する領域を例示します。',site:'傍中心小葉周辺（模式的な部分病変）'},
  {id:'pca',ja:'PCA領域の皮質梗塞',kind:'ischemic',group:'脳梗塞',artery:'PCA',tracts:['Optic radiation'],
   desc:'後大脳動脈の後頭葉側の梗塞。視覚路と同名半盲などの関連を学習します。',site:'後頭葉視覚皮質付近（模式的な部分病変）'},
  {id:'capsule',ja:'内包後脚のラクナ梗塞',kind:'ischemic',group:'脳梗塞',artery:null,tracts:['Corticospinal tract'],
   desc:'内包後脚付近の小梗塞。前脈絡叢動脈やレンズ核線条体動脈などの分布には個人差があります。',site:'被殻・淡蒼球と視床の間（位置参照）'},
  {id:'thalamic_lacune',ja:'視床ラクナ梗塞',kind:'ischemic',group:'脳梗塞',artery:null,tracts:['Dorsal column–medial lemniscus pathway','Spinothalamic tract'],
   desc:'視床腹側後核群に近い小梗塞の模式例。感覚路と感覚障害の関係を示します。',site:'視床腹側の感覚中継核付近'},
  {id:'putamen_bleed',ja:'被殻出血',kind:'hemorrhagic',group:'脳出血',artery:null,tracts:['Corticospinal tract'],
   desc:'被殻内の血腫。隣接する内包後脚への直接障害・圧排が生じ得ます（圧排変形は次段階）。',site:'被殻内（実メッシュ基準）'},
  {id:'thalamus_bleed',ja:'視床出血',kind:'hemorrhagic',group:'脳出血',artery:null,tracts:['Dorsal column–medial lemniscus pathway','Spinothalamic tract'],
   desc:'視床内の血腫。感覚障害や内包への影響を学ぶ代表例です。',site:'視床内（実メッシュ基準）'},
  {id:'pons_bleed',ja:'橋出血',kind:'hemorrhagic',group:'脳出血',artery:null,tracts:['Corticospinal tract','Medial lemniscus'],
   desc:'橋の実質内出血の模式例。運動路・感覚路・脳神経核との位置関係を示します。',site:'橋底部（実メッシュ基準）'},
  {id:'cerebellum_bleed',ja:'小脳出血',kind:'hemorrhagic',group:'脳出血',artery:null,tracts:[],
   desc:'小脳半球深部の代表的な血腫。運動失調・体幹失調・歩行障害と関連し、血腫や浮腫が大きい場合には第四脳室圧迫・水頭症や脳幹圧迫の危険があります。典型的位置の模式例であり、圧迫変形は未実装です。',
   site:'小脳半球の深部（後方小脳葉群の実メッシュから推定）'},

 ];
 const byId=Object.fromEntries(CASES.map(c=>[c.id,c]));
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function create(T,{gltfScene,meshById,nodes}){
  const root=new T.Group();root.name='MODE2_ONLY_ACUTE_STROKE_LESIONS';gltfScene.add(root);
  const originals=[];const materials=[];const diagnostics={ready:true,missing:[],drawn:{},anchors:{}};
  const byLabel=(label,side)=>{
   const n=nodes.find(n=>n.label===label && (side==null || n.side===side));
   return n?(meshById.get(n.id)||[]):[];
  };
  const boundsOf=(label,side)=>{
   const ms=byLabel(label,side);if(!ms.length)return null;
   const b=new T.Box3();const v=new T.Vector3();
   gltfScene.updateMatrixWorld(true);
   for(const m of ms){if(!m.geometry?.attributes?.position)continue;
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
    const box=m.geometry.boundingBox;
    // Transform all eight corners to gltfScene's coordinate frame (not world coordinates).
    const mn=box.min,mx=box.max;
    for(const x of [mn.x,mx.x])for(const y of [mn.y,mx.y])for(const z of [mn.z,mx.z]){
      v.set(x,y,z);b.expandByPoint(gltfScene.worldToLocal(m.localToWorld(v.clone())));
    }
   }
   return b.isEmpty()?null:b;
  };
  const centroid=(label,side)=>{const b=boundsOf(label,side);return b?b.getCenter(new T.Vector3()):null;};
  const thalamus=(side)=>centroid('Ventral lateroventral nucleus',side)||centroid('Ventral laterodorsal nucleus',side);
  function featurePoint(c,side){
    const put=centroid('Putamen',side),tha=thalamus(side);
    if(c.id==='capsule'){
      if(!put||!tha)return null;
      const pt=put.clone().lerp(tha,.52);
      pt.z-=Math.min(put.distanceTo(tha)*.15,.008);
      return {p:pt,ref:boundsOf('Putamen',side),source:'Putamen–thalamus anatomical corridor (approximate)'};
    }
    if(c.id==='putamen_bleed'){return put?{p:put,ref:boundsOf('Putamen',side),source:'Putamen mesh'}:null;}
    if(c.id==='thalamic_lacune'||c.id==='thalamus_bleed'){
      const p=tha;if(!p)return null;
      return {p,ref:boundsOf('Ventral lateroventral nucleus',side)||boundsOf('Ventral laterodorsal nucleus',side),source:'Ventral thalamic nucleus mesh'};
    }
    if(c.id==='cerebellum_bleed'){
      // Deliberately use actual ipsilateral cerebellar lobular meshes, not
      // the whole brain's bounding box (would place a clot outside cerebellum).
      // No segmented dentate nucleus exists in this source model; the point
      // is therefore explicitly a hemispheric approximation, not a voxel lesion.
      const labels=['Inferior semilunar lobule','Posterior quadrangular lobule','Biventral lobule'];
      const ref=new T.Box3();let found=0;
      for(const label of labels){const b=boundsOf(label,side);if(b){ref.union(b);found++;}}
      if(!found||ref.isEmpty())return null;
      const p=ref.getCenter(new T.Vector3());
      return {p,ref,source:'Union of ipsilateral inferior semilunar / posterior quadrangular / biventral cerebellar lobules (schematic deep hemisphere)'};
    }
    if(c.id==='pons_bleed'){
      const b=boundsOf('Pons',side);if(!b)return null;
      const p=b.getCenter(new T.Vector3());p.z=b.max.z*.65+b.min.z*.35;
      return {p,ref:b,source:'Pons mesh (anterior half)'};
    }
    return null;
  }
  const corticalNames={mca:new Set(['Frontal lobe','Parietal lobe']),aca:new Set(['Frontal lobe','Parietal lobe','Limbic lobe']),pca:new Set(['Occipital lobe'])};
  const cortex=nodes.filter(n=>n.category==='cortex'&&n.region);
  const atlasBounds=new T.Box3();gltfScene.updateMatrixWorld(true);
  const inv=new T.Matrix4().copy(gltfScene.matrixWorld).invert();
  for(const n of cortex)for(const m of (meshById.get(n.id)||[])){
    if(!m.geometry?.attributes?.position)continue;
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
    atlasBounds.union(m.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,m.matrixWorld)));
  }
  const bmin=atlasBounds.min.clone(),bspan=atlasBounds.getSize(new T.Vector3());
  const VERT=`uniform mat4 uAtlas; uniform vec3 uMin,uSpan; varying vec3 vPos;
   void main(){vec3 a=(uAtlas*vec4(position,1.0)).xyz;
    vPos=vec3(abs(a.x-(uMin.x+.5*uSpan.x))/(.5*uSpan.x),
      (a.y-uMin.y)/uSpan.y,(a.z-uMin.z)/uSpan.z);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
  const FRAG=`uniform vec3 uColor,uCenter,uRadii;uniform float uAlpha;varying vec3 vPos;
   void main(){vec3 d=(vPos-uCenter)/uRadii;float r=length(d);
    float a=1.0-smoothstep(.71,1.04,r);if(a<.015)discard;
    gl_FragColor=vec4(uColor,uAlpha*a);}`;
  const focus={
    mca:{center:[.78,.66,.68],radii:[.36,.25,.26]},
    aca:{center:[.18,.85,.65],radii:[.33,.21,.29]},
    pca:{center:[.69,.57,.10],radii:[.40,.38,.29]},
  };
  if(!atlasBounds.isEmpty()&&bspan.x>0&&bspan.y>0&&bspan.z>0){
    for(const id of Object.keys(corticalNames)){
      const f=focus[id];
      for(const n of cortex){if(!corticalNames[id].has(n.region))continue;
        for(const orig of (meshById.get(n.id)||[])){
          if(!orig.geometry?.attributes?.position)continue;
          const shader=new T.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,
           uniforms:{uAtlas:{value:new T.Matrix4().multiplyMatrices(inv,orig.matrixWorld)},uMin:{value:bmin},uSpan:{value:bspan},
            uColor:{value:new T.Color(0xF15666)},uCenter:{value:new T.Vector3(...f.center)},uRadii:{value:new T.Vector3(...f.radii)},uAlpha:{value:.85}},
           transparent:true,depthTest:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
          const mesh=new T.Mesh(orig.geometry,shader);mesh.name=`MODE2_INFARCT_${id}_${n.side}`;
          mesh.matrixAutoUpdate=false;mesh.matrix.copy(orig.matrix);mesh.renderOrder=18;
          mesh.raycast=()=>{};mesh.visible=false;orig.parent.add(mesh);
          materials.push(shader);originals.push({id,side:n.side,mesh,orig});
        }
      }
    }
  }else diagnostics.missing.push('cortical bounding box');
  const deepGroups=new Map();
  for(const c of CASES.filter(x=>x.kind!=='sah'&&!x.artery))for(const side of ['left','right']){
    const a=featurePoint(c,side);
    if(!a||!a.ref){diagnostics.missing.push(c.id+'|'+side);continue;}
    const span=a.ref.getSize(new T.Vector3());
    const isLacune=c.kind==='ischemic';
    const radius=isLacune ? .0038 : c.id==='cerebellum_bleed' ? .012 : c.id==='pons_bleed' ? .010 : .008;
    const sx=clamp(span.x*(isLacune?.24:.43),radius*.7,radius*1.75);
    const sy=clamp(span.y*(isLacune?.18:.37),radius*.7,radius*1.8);
    const sz=clamp(span.z*(isLacune?.18:.38),radius*.7,radius*1.8);
    const g=new T.Group();g.position.copy(a.p);g.name=`MODE2_${c.id}_${side}`;
    const coreMat=new T.MeshPhongMaterial({color:isLacune?0xf05a6f:0xab263f,emissive:isLacune?0x721c35:0x581321,emissiveIntensity:.28,
       transparent:true,opacity:isLacune?.84:.93,depthWrite:false,side:T.DoubleSide});
    const geo=new T.SphereGeometry(1,28,20);
    const core=new T.Mesh(geo,coreMat);core.scale.set(sx,sy,sz);core.renderOrder=19;core.raycast=()=>{};g.add(core);
    const shellMat=new T.MeshBasicMaterial({color:isLacune?0xffa4b0:0xf27a84,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});
    const shell=new T.Mesh(new T.SphereGeometry(1,24,16),shellMat);shell.scale.set(sx*1.23,sy*1.23,sz*1.23);shell.renderOrder=18;shell.raycast=()=>{};g.add(shell);
    g.visible=false;root.add(g);deepGroups.set(c.id+'|'+side,g);
    diagnostics.anchors[c.id+'|'+side]={center:a.p.toArray(),source:a.source,size:[sx,sy,sz]};
  }
  let selected=null,selectedSide='left',displayHemisphere='both';
  function setSelection(id,side){selected=byId[id]?id:null;selectedSide=(side==='right'?'right':'left');update();}
  function update(){
    const allowed=displayHemisphere==='both'||displayHemisphere===selectedSide;
    for(const o of originals)o.mesh.visible=allowed&&o.id===selected&&o.side===selectedSide&&o.orig.visible;
    for(const [key,g] of deepGroups)g.visible=allowed&&key===selected+'|'+selectedSide;
    diagnostics.drawn[selected||'none']=originals.filter(o=>o.id===selected&&o.side===selectedSide).length+(deepGroups.has(selected+'|'+selectedSide)?1:0);
  }
  update();
  function setHemisphere(side){displayHemisphere=side||'both';update();}
  return {setSelection,setHemisphere,update,getDiagnostics:()=>({...diagnostics,selected,side:selectedSide,corticalMeshes:originals.length}),
    dispose(){for(const o of originals)o.mesh.parent?.remove(o.mesh);for(const m of materials)m.dispose();
      root.traverse(o=>{if(o.isMesh){o.geometry?.dispose();o.material?.dispose();}});root.parent?.remove(root);}};
 }
 window.Mode2Lesions={CASES,create};
})();
