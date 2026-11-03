/* Mode 2 v0.8G — artery-to-cortical-territory synchronization.
 * Reuses the native Z-Anatomy/BodyParts3D artery meshes by sharing geometry,
 * and never changes Mode 1 source mesh materials, geometry or state.
 * These are anatomical arteries, NOT reconstructed perfusion trees.
 * MCA M1/M2/M3/temporal/parietal branches and ACA named branches are available;
 * PCA has only its main named artery in the source atlas. Do not invent branches.
 */
(function(){'use strict';
const GROUPS={
 ACA:[
  'Anterior cerebral artery',
  'Callosomarginal artery',
  'Frontal branches of callosomarginal artery',
  'Pericallosal artery',
  'Orbitofrontal branches of anterior cerebral artery'
 ],
 MCA:[
  'Middle cerebral artery (M1-segment)',
  'Insular branches of middle cerebral artery (M2)',
  'Insular branches of middle cerebral artery (M2-segment)',
  'Middle cerebral artery (M3 segment)',
  'Middle cerebral artery (M3-segment)',
  'Parietal branches of middle cerebral artery',
  'Temporal branches of middle cerebral artery'
 ],
 PCA:['Posterior cerebral artery']
};
const COLORS={ACA:'#E69F00',MCA:'#0072B2',PCA:'#CC79A7'};
const GROUP_LABELS={ACA:'前大脳動脈と既存皮質枝',MCA:'中大脳動脈と既存皮質枝',PCA:'後大脳動脈本幹'};
function create(T,{meshById,nodes}){
  const labels=Object.fromEntries(Object.entries(GROUPS).map(([id,names])=>[id,new Set(names)]));
  const overlays=[];const materials=[];
  const available={ACA:[],MCA:[],PCA:[]};
  const missing={ACA:[],MCA:[],PCA:[]};
  for(const id of Object.keys(GROUPS)){
    const matched=nodes.filter(n=>n.category==='arteries'&&labels[id].has(n.label));
    const found=new Set(matched.map(n=>n.label));
    missing[id]=GROUPS[id].filter(n=>!found.has(n));
    for(const n of matched){
      const originals=meshById.get(n.id)||[];
      if(!originals.length)continue;
      for(const src of originals){
        if(!src.isMesh||!src.geometry||!src.parent)continue;
        // Overlay shares original geometry and transform; it is NOT a synthetic vessel.
        const mat=new T.MeshBasicMaterial({color:COLORS[id],transparent:true,
          opacity:.96,depthTest:true,depthWrite:false,side:T.DoubleSide,
          polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
        const mesh=new T.Mesh(src.geometry,mat);
        mesh.name=`MODE2_NATIVE_ARTERY_${id}_${n.side}_${n.label}`;
        mesh.matrixAutoUpdate=false;mesh.matrix.copy(src.matrix);
        mesh.visible=false;mesh.frustumCulled=src.frustumCulled;
        mesh.renderOrder=19;
        mesh.raycast=()=>{}; // never block native node picking or disease overlays
        src.parent.add(mesh);
        overlays.push({id,side:n.side,mesh,src});
        materials.push(mat);
      }
      available[id].push({label:n.label,side:n.side});
    }
  }
  let selected=new Set(),hemisphere='both',enabled=true;
  function update(){
    for(const item of overlays){
      item.mesh.visible=enabled&&selected.has(item.id)&&(
        hemisphere==='both'||item.side==='median'||item.side===hemisphere);
      // The original source object may be hidden by the Mode 1 layers; cloning
      // into its parent (rather than into the source mesh) keeps this independent.
      if(item.mesh.visible&&!item.mesh.parent)item.mesh.visible=false;
    }
  }
  function setSelection(ids,side,show){
    selected=new Set((Array.isArray(ids)?ids:[]).filter(id=>GROUPS[id]));
    hemisphere=['left','right','both'].includes(side)?side:'both';
    enabled=show!==false;
    update();
  }
  return {setSelection,update,
    getDiagnostics:()=>({ready:true,selected:[...selected],enabled,hemisphere,
      nativeMeshes:overlays.length,available,missing,groupLabels:GROUP_LABELS}),
    dispose(){for(const o of overlays)o.mesh.parent?.remove(o.mesh);for(const m of materials)m.dispose();}
  };
}
window.Mode2Vessels={GROUPS,COLORS,GROUP_LABELS,create};
})();
