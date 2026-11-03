/* Mode 2 v0.8F — anatomy-aware, EXCLUSIVE cortical arterial territories.
 * Important: schematic surface classifications, NOT individual perfusion boundaries.
 * Mode 1 and original GLB meshes/materials remain untouched.
 * The old v0.8D overlay blended three independent weighted transparent layers,
 * producing extensive false overlap on the medial surface. This implementation
 * classifies each cortical surface fragment into at most ONE territory and
 * shades it once. Temporal named gyri are primary evidence; simplified position
 * only refines inferior temporal and ACA/PCA watershed boundaries.
 */
(function(){'use strict';
const TERRITORIES=[
 {id:'ACA',ja:'前大脳動脈',en:'Anterior cerebral artery',color:'#E69F00',summary:'内側前頭・頭頂葉（傍中心小葉、帯状回前部など）と上縁の一部。皮質領域の代表的な分布です。'},
 {id:'MCA',ja:'中大脳動脈',en:'Middle cerebral artery',color:'#0072B2',summary:'前頭・頭頂・側頭葉の外側面の大部分（上・中側頭回、側頭極を含む）、島皮質。内側面は原則として含めません。'},
 {id:'PCA',ja:'後大脳動脈',en:'Posterior cerebral artery',color:'#CC79A7',summary:'後頭葉と側頭葉の内側・下面（紡錘状回・海馬傍回など）が中心。外側の上・中側頭回は原則としてMCA。個人差あり。'},
];
const regionIndex={'Frontal lobe':1,'Parietal lobe':2,'Temporal lobe':3,'Occipital lobe':4,'Limbic lobe':5,'Insula':6};
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
/** Anatomically named parcels override crude whole-brain XYZ thresholds.
 * These labels are supplied by BRAIN.nodes (Z-Anatomy meshes) and do NOT
 * imply segmented perfusion masks. For inferior temporal gyrus only, a small
 * posterior/inferior tip can be mapped to PCA in the textbook schematic.
 * uParcel: 0=generic region, 1=lateral temporal (MCA),
 * 2=ventromedial/occipitotemporal (PCA), 3=inferior temporal transitional,
 * 4=hippocampus (primarily PCA; anterior choroidal variation),
 * -1=exclude misleading white-matter structures grouped under cortex.
 */
const TEMP_MCA=new Set([
  'Superior temporal gyrus (Lateral part)','Superior temporal sulcus',
  'Middle temporal gyrus','Inferior temporal sulcus','Temporal pole',
  'Temporal plane','Transverse temporal gyri'
]);
const TEMP_PCA=new Set([
  'Lateral occipitotemporal gyrus',
  'Medial occipitotemporal gyrus (Parahippocampal)',
  'Occipitotemporal sulcus (Lateral part)'
]);
const NON_CORTICAL=new Set(['Acoustic radiation','Optic radiation']);
function parcelForNode(n){
  if(NON_CORTICAL.has(n.label))return -1;
  if(n.region==='Temporal lobe'){
    if(TEMP_MCA.has(n.label))return 1;
    if(TEMP_PCA.has(n.label))return 2;
    if(n.label==='Inferior temporal gyrus')return 3;
    return 1; // no unnamed temporal mesh should be indiscriminately PCA
  }
  if(n.label==='Hippocampus')return 4;
  return 0;
}
/** Coordinates: lat 0=medial longitudinal fissure, 1=lateral convexity;
 * up 0=inferior, 1=superior; pa 0=posterior, 1=anterior.
 * This is a simplified topographic atlas, not a calibrated patient perfusion map.
 * Return 0=ACA,1=MCA,2=PCA,-1=excluded.
 * Optional label ensures CPU QA and fragment shader use the same named parcels.
 */
function classify(region,coord,label=''){
 const [lat,up,pa]=coord.map(x=>clamp(x));
 const parcel=parcelForNode({region,label});
 if(parcel===-1)return -1;
 if(parcel===1)return 1;
 if(parcel===2||parcel===4)return 2;
 if(parcel===3){
   // Inferior temporal gyrus belongs largely to lateral MCA; only a narrow
   // posterior/basal margin is included in PCA in the schematic.
   return (pa<.19 && up<.30) ? 2 : 1;
 }
 if(region==='Occipital lobe')return 2;
 if(region==='Insula')return 1;
 if(region==='Limbic lobe')return pa>=.43 ? 0 : 2;
 if(region==='Frontal lobe'){
   return (lat<.34||(lat<.45 && up>.81)) ? 0 : 1;
 }
 if(region==='Parietal lobe'){
   if(pa<.28 && lat<.29)return 2;
   return (lat<.34||(lat<.44 && up>.83)) ? 0 : 1;
 }
 if(region==='Temporal lobe')return 1;
 return -1;
}
function weight(id,region,coord,label=''){return (TERRITORIES[classify(region,coord,label)]?.id===id)?1:0;}
const VERT=`
 uniform mat4 uMeshToAtlas;uniform vec3 uMin,uSpan;
 varying vec3 vNorm;
 void main(){
   vec3 a=(uMeshToAtlas*vec4(position,1.0)).xyz;
   float midx=uMin.x+0.5*uSpan.x;
   float lat=abs(a.x-midx)/max(0.000001,0.5*uSpan.x);
   vNorm=vec3(clamp(lat,0.0,1.0),clamp((a.y-uMin.y)/uSpan.y,0.0,1.0),clamp((a.z-uMin.z)/uSpan.z,0.0,1.0));
   gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
 }`;
const FRAG=`
 uniform vec3 uACA,uMCA,uPCA,uSelected;uniform float uAlpha;uniform int uRegion,uParcel;
 varying vec3 vNorm;
 void main(){
   float lat=vNorm.x,up=vNorm.y,pa=vNorm.z;
   int t=-1;
   if(uParcel==1)t=1;                      // named lateral temporal gyri
   else if(uParcel==2||uParcel==4)t=2;     // named ventromedial temporal
   else if(uParcel==3)t=(pa<.19&&up<.30)?2:1; // inferior temporal gyrus
   else if(uRegion==4)t=2;
   else if(uRegion==6)t=1;
   else if(uRegion==5)t=(pa>=.43)?0:2;
   else if(uRegion==1)t=((lat<.34)||(lat<.45&&up>.81))?0:1;
   else if(uRegion==2){
     if(pa<.28&&lat<.29)t=2;
     else t=((lat<.34)||(lat<.44&&up>.83))?0:1;
   } else if(uRegion==3)t=1;
   if(t<0)discard;
   vec3 color=vec3(1.0);float pattern=0.0;
   if(t==0){if(uSelected.x<0.5)discard;color=uACA;
     pattern=step(.94,fract((up+pa)*43.0));
   } else if(t==1){if(uSelected.y<0.5)discard;color=uMCA;}
   else {if(uSelected.z<0.5)discard;color=uPCA;
     vec2 dots=fract(vec2(up,pa)*38.0)-.5;
     pattern=1.0-step(.105,length(dots));
   }
   // Color is categorical; the less-prominent patterns are secondary cues.
   // No alpha blending between competing ACA/MCA/PCA classifications.
   gl_FragColor=vec4(color,uAlpha*(1.0-.13*pattern));
 }`;
function create(T,{gltfScene,meshById,nodes}){
 const cortex=nodes.filter(n=>n.category==='cortex'&&regionIndex[n.region]);
 gltfScene.updateMatrixWorld(true);
 const inv=new T.Matrix4().copy(gltfScene.matrixWorld).invert();
 const bounds=new T.Box3();const matrix=new T.Matrix4();
 for(const n of cortex)for(const m of (meshById.get(n.id)||[])){
   if(!m.geometry?.attributes?.position)continue;
   matrix.multiplyMatrices(inv,m.matrixWorld);
   if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
   bounds.union(m.geometry.boundingBox.clone().applyMatrix4(matrix));
 }
 const span=bounds.getSize(new T.Vector3());const min=bounds.min.clone();
 if(bounds.isEmpty()||span.x<1e-7||span.y<1e-7||span.z<1e-7){
  console.warn('[Mode 2 vascular] no valid cortex bounding box');
  return {setSelection(){},update(){},getDiagnostics(){return {ready:false}},dispose(){}};
 }
 const overlays=[];const materials=[];const regionCount={};
 for(const n of cortex){
   const region=regionIndex[n.region],parcel=parcelForNode(n);
   if(parcel===-1)continue; // radiations are deep white matter, not cortical surface
   regionCount[n.region]=(regionCount[n.region]||0)+1;
   for(const orig of (meshById.get(n.id)||[])){
     if(!orig.geometry?.attributes?.position)continue;
     const meshToAtlas=new T.Matrix4().multiplyMatrices(inv,orig.matrixWorld);
     const mat=new T.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,
       uniforms:{uMeshToAtlas:{value:meshToAtlas},uMin:{value:min},uSpan:{value:span},
         uACA:{value:new T.Color(TERRITORIES[0].color)},uMCA:{value:new T.Color(TERRITORIES[1].color)},
         uPCA:{value:new T.Color(TERRITORIES[2].color)},uSelected:{value:new T.Vector3()},
         uAlpha:{value:.66},uRegion:{value:region},uParcel:{value:parcel}},
       transparent:true,depthTest:true,depthWrite:true,side:T.FrontSide,
       polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
     const overlay=new T.Mesh(orig.geometry,mat);
     overlay.name=`MODE2_EXCLUSIVE_TERRITORY_${n.side}_${n.label}`;
     overlay.renderOrder=13;overlay.visible=false;overlay.frustumCulled=orig.frustumCulled;
     overlay.raycast=()=>{};overlay.matrixAutoUpdate=false;overlay.matrix.copy(orig.matrix);
     orig.parent.add(overlay);overlays.push({mesh:overlay,orig,side:n.side});materials.push(mat);
   }
 }
 let selected=[],hemisphere='both',opacity=.66;
 const apply=()=>{
   const ids=new Set(selected);const sel=new T.Vector3(+ids.has('ACA'),+ids.has('MCA'),+ids.has('PCA'));
   for(const o of overlays){
     o.mesh.visible=ids.size>0&&(hemisphere==='both'||o.side===hemisphere)&&o.orig.visible;
     o.mesh.material.uniforms.uSelected.value.copy(sel);
     o.mesh.material.uniforms.uAlpha.value=opacity;
   }
 };
 function setSelection(ids,side,alpha){
   selected=Array.isArray(ids)?ids.filter(x=>TERRITORIES.some(t=>t.id===x)):[];
   hemisphere=side||'both';opacity=clamp(Number.isFinite(alpha)?alpha:.66,.08,.88);apply();
 }
 return {setSelection,update:apply,
  getDiagnostics:()=>({ready:true,version:'0.8F',exclusive:true,namedParcels:true,overlayMeshes:overlays.length,regionCount,
    selected:selected.slice(),bounds:[min.toArray(),bounds.max.toArray()]}),
  dispose(){for(const o of overlays)o.mesh.parent?.remove(o.mesh);for(const m of materials)m.dispose();}};
}
window.Mode2Territories={TERRITORIES,classify,weight,parcelForNode,create};
})();
