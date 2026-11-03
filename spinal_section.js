/*
 * Spinal cord cross-sectional teaching view, v0.10B.
 * Source: user's PAM50-master.zip, PAM50 atlas and template masks.
 * Geometry: smoothed contour sampling from representative C1..T1 spinal segments.
 * NO claim of patient-specific segmentation, exact in-vivo boundaries, or
 * coordinate registration to the Brain Project 3D schematic spinal cylinder.
 * The atlas is used as a reference; the bundled dataset contains only a small
 * set of simplified derived educational polygon contours, not the NIfTI volumes.
 */
(function(root){
 'use strict';
 const data=root.SpinePAM50Contours?.segments;
 const segments=['C1','C2','C3','C4','C5','C6','C7','C8','T1'];
 const colors={cord:'#e5edf4',gm:'#a28abb',ventralHorn:'#c09bd3',dorsalHorn:'#8a74b4',intermediate:'#a28abc',
   dorsalFuniculus:'#cadce8',lateralFuniculus:'#d6e4e9',ventralFuniculus:'#e3e8f0',
   lCST:'#0072b2',aCST:'#0072b2',gracilis:'#d3951d',cuneatus:'#e6b44a',
   anterolateral:'#c86b8c',spinocerebellar:'#009e73'};
 const terms={
  cord:['脊髄全体','Spinal cord','白質と灰白質からなる中枢神経組織です。','外周はPAM50脊髄マスクを基にしています。'],
  gm:['灰白質','Gray matter','神経細胞体、樹状突起、シナプスなどが多い領域です。','前角・後角・中間部を区別して観察します。'],
  ventralHorn:['前角','Anterior (ventral) horn','骨格筋を支配する下位運動ニューロン群が主に存在します。頸膨大では上肢筋、C8〜T1では手内在筋を含む遠位上肢筋の運動制御に関係します。内側の運動ニューロン群は軸筋、外側は四肢筋に対応する傾向があります。','前角細胞障害では弛緩性筋力低下、筋萎縮、腱反射低下、線維束性収縮などが起こりえます。上位運動ニューロン障害による痙性麻痺と区別します。'],
  dorsalHorn:['後角','Posterior (dorsal) horn','後根から入る一次感覚ニューロンの入力を受けます。侵害受容・温度覚などの処理には後角表層が重要で、脊髄視床路へ投射する二次ニューロンや介在ニューロンが関わります。','痛覚・温度覚線維は通常、入髄後1〜2髄節程度上下へ走行・シナプスし、前白交連で交叉して対側の前外側系を上行します。'],
  intermediate:['中間灰白質','Intermediate gray matter','前角と後角の間の灰白質で、局所介在ニューロンと自律神経系の神経核を含みます。T1では中間外側核（側角）の交感神経節前ニューロンが重要です。','T1付近では側角（交感神経節前ニューロン）も重要です。'],
  ventralFuniculus:['前索','Anterior funiculus','前正中裂と前根出口の間にある白質領域です。前皮質脊髄路、前庭脊髄路、網様体脊髄路など姿勢や体幹・近位筋に関係する下行路、および一部の上行線維があります。','前正中裂そのものとは異なる領域です。'],
  lateralFuniculus:['側索','Lateral funiculus','前根・後根の間に位置する白質です。背外側部に外側皮質脊髄路、前外側部に脊髄視床路を含む前外側系、外側辺縁には脊髄小脳路などが近接します。各束の境界は個人差があります。','運動・感覚両方の経路が近接します。'],
  dorsalFuniculus:['後索','Posterior funiculus','後根入口から後正中中隔にかけての白質です。薄束は内側で下肢・体幹下部、楔状束は外側で上肢・体幹上部の識別性触覚、振動覚、意識的固有感覚を延髄まで同側で運びます。','識別性触覚、振動覚、意識的固有感覚に関与します。'],
  lCST:['外側皮質脊髄路','Lateral corticospinal tract','一次運動野などからの下行線維が放線冠・内包後脚・大脳脚・橋底部・延髄錐体を通り、延髄尾側で大部分が交叉します。脊髄では対側の側索後方寄りを下降し、前角運動回路へ投射します。','左大脳皮質由来の代表線維は錐体交叉後、右脊髄側索に位置します。損傷高位と交叉の上下によって麻痺側が異なります。青色面は多数の線維が占める束の領域、白縁の小円は選択した1本の代表位置です。'],
  aCST:['前皮質脊髄路','Anterior corticospinal tract','錐体交叉で交叉しない一部の線維が前索を下降し、髄節レベルで交叉・両側投射するものがあります。','外側皮質脊髄路と混同しないでください。'],
  gracilis:['薄束','Fasciculus gracilis','後索の内側を上行し、主として下肢・体幹下部からの識別性触覚・振動覚・意識的固有感覚を延髄の薄束核へ運びます。脊髄内では交叉せず、薄束核で中継した後、内側毛帯へ進む線維が交叉します。','延髄の薄束核に達します。'],
  cuneatus:['楔状束','Fasciculus cuneatus','上位胸髄以上で後索の外側に位置し、主として上肢・体幹上部の識別性触覚・振動覚・意識的固有感覚を延髄の楔状束核へ運びます。後索内では同側を上行します。','延髄の楔状束核に達します。'],
  anterolateral:['前外側系（脊髄毛帯領域）','Anterolateral system / spinal lemniscus','痛覚・温度覚などの感覚情報に関わる前外側系です。一次求心線維は後角でシナプスし、二次線維は前白交連を通って通常1〜2髄節以内に交叉し、対側を上行します。PAM50のこのマスクには脊髄視床路以外の線維も含まれます。','脊髄視床路単独の正確な境界を示したものではありません。'],
  spinocerebellar:['前脊髄小脳路','Ventral spinocerebellar tract','脊髄内の運動関連情報を小脳へ伝える上行系。小脳への経路途中で交叉を伴います。','PAM50の領域は前脊髄小脳路であり、後脊髄小脳路を代表しません。'],
  representativeFiber:['代表皮質脊髄線維（横断位置・模式）','Representative corticospinal fiber cross-section','選択した3D皮質脊髄路の中心線がこの横断面を通過する位置を、一本の代表線維の切断面として表したものです。','青いPAM50領域は多数の線維束が占める領域で、この小円はその中の一例です。GLBとPAM50は厳密に登録されていないため位置対応は模式的です。'],
  centralCanal:['中心管','Central canal','灰白交連付近の中央に位置する、脳室系に連なる細い管です。','成人では狭小化・閉塞する場合があります。ここは位置マーカーです。'],
  anteriorFissure:['前正中裂','Anterior median fissure','脊髄前面の正中にある比較的深い裂溝です。','前索とは異なる解剖学的構造です。'],
  posteriorSulcus:['後正中溝','Posterior median sulcus','脊髄後面の正中にある浅い溝で、後正中中隔に連続します。','前正中裂と深さが異なります。'],
  grayCommissure:['灰白交連','Gray commissure','左右の脊髄灰白質を中央で連絡します。','中心管はこの付近に存在します。'],
  alphaMotorNeuron:['α運動ニューロン','Alpha motor neuron','前角の運動ニューロン。軸索は前根を通り骨格筋の錘外筋線維を支配します。','障害では筋力低下・筋萎縮・線維束性収縮など下位運動ニューロン徴候がみられます。'],
  cstCollateral:['皮質脊髄路の側枝（模式）','Corticospinal collateral (schematic)','外側皮質脊髄路から灰白質内の運動関連回路に向かう側枝です。','側枝の細部はPAM50のマスクから直接同定されたものではありません。'],
  synapseDirect:['皮質運動ニューロンの直接連絡','Direct corticomotoneuronal connection','皮質脊髄路の一部の軸索がα運動ニューロンの樹状突起や細胞体に直接シナプスを形成します。','霊長類の手指の巧緻運動に重要な結合。すべての皮質脊髄線維がこの形式ではありません。'],
  ventralRootAxon:['α運動ニューロンの軸索・前根','Alpha motoneuron axon / ventral root','α運動ニューロンの単一軸索が前根を通って脊髄外へ出ます。','前根と末梢運動神経は連続する同一ニューロンの軸索を含みます。'],
  peripheralMotorAxon:['末梢運動神経の軸索','Peripheral motor axon','前根から出たα運動ニューロンの軸索は脊髄神経・前枝を介して末梢神経内を走り、筋へ到達します。','図では全経路を簡略化し、特定の末梢神経名や筋支配高位を断定しません。'],
  neuromuscularJunction:['神経筋接合部','Neuromuscular junction','α運動ニューロンの軸索終末が筋線維の運動終板にアセチルコリンを放出する部位です。','脊髄内の皮質脊髄路―α運動ニューロン間シナプスとは異なる接合部です。'],
  muscleFiber:['骨格筋線維（模式）','Skeletal muscle fiber · schematic','運動単位に属する錘外筋線維を表す教育用模式図です。','実際の手内在筋がT1脊髄直近に存在するという意味ではありません。']
 };
 const OPTIONS={lCST:true,aCST:false,gracilis:false,cuneatus:false,anterolateral:false,spinocerebellar:false};
 const settings={...OPTIONS};
 // The terminal T1 motor-circuit layer is a schematic cellular teaching overlay,
 // NOT a synapse segmentation from PAM50. It is enabled only in Mode 2.
 let circuitMode='off';
 let cstOriginSide='left'; // origin hemisphere (crosses at caudal medulla)
 let focusUnilateralCST=false; // only in Mode 2 selected-tract view
 function setMode2CSTFocus(active){focusUnilateralCST=!!active;}
 // Display convention: axial viewed from inferior, image-left is patient's RIGHT.
 // Here 'left'/'right' variables below describe the IMAGE side, not patient side.
 const CIRCUIT_MODES=['off','direct'];
 let lastFiberMarkers={};
 function setCircuitMode(value){circuitMode=CIRCUIT_MODES.includes(value)?value:'off';}
 function getCircuitMode(){return circuitMode;}
 function setCSTOriginSide(side){cstOriginSide=['left','right','both'].includes(side)?side:'both';}
 function setTractOptions(changes){
   for(const k of Object.keys(OPTIONS)) if(k in changes) settings[k]=!!changes[k];
 }
 function getSectionAt(progress){
   const p=Math.max(0,Math.min(1,Number(progress)||0));
   const idx=Math.max(0,Math.min(8,Math.round(p*8)));
   return {segment:segments[idx],index:idx,progress:p,mode:'PAM50-derived representative slice'};
 }
 const entry=(key)=>{const t=terms[key];return t?{ja:t[0],en:t[1],description:t[2],clinical:t[3],color:colors[key]||'#b9d9e7',region:key}:null;};
 function toPath(polygons){
   const path=new Path2D();
   for(const poly of polygons||[]){if(poly.length<3)continue;path.moveTo(poly[0][0],poly[0][1]);
     for(let i=1;i<poly.length;i++)path.lineTo(poly[i][0],poly[i][1]);path.closePath();}
   return path;
 }
 const cache=new Map();
 function boundsOfCord(level){
   const points=(data?.[level]?.cord||[]).flat();
   if(!points.length)return {top:125,bottom:238};
   return {top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
 }
 function getPath(level,key){
   const id=level+'/'+key;
   if(!cache.has(id))cache.set(id,toPath(data?.[level]?.[key]||[]));
   return cache.get(id);
 }
 function available(level,key){return !!data?.[level]?.[key]?.length;}
 // T1 reference geometry (430 x 318 coordinates):
 // In T1: lateral CST ~ (284,185), intermediate gray ~ (249,165), ventral horn ~ (252,150).
 // Representative circuit shifted from C8 to T1; neuron placement remains SCHEMATIC.
 // Synaptic locations, neuronal shapes and ventral root extension are SCHEMATIC.
 const CIRCUIT={cst:[294,187],alpha:[258,140],directSynapse:[265,151],
   rootExit:[323,111],peripheral:[364,103],nmj:[380,91],muscle:[392,83]};
 const CIRCUIT_COLORS={cst:'#23d5e3',alpha:'#ed70b1',synapse:'#ffe37b',muscle:'#dba68d'};
 function drawCurve(ctx,points,color,width=3,dash=[]){
   ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
   ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
   // Smooth quadratic interpolation between ANATOMY-CHECKED anchors.
   for(let i=1;i<points.length-1;i++){
     ctx.quadraticCurveTo(points[i][0],points[i][1],
       (points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2);
   }
   ctx.lineTo(...points[points.length-1]);ctx.stroke();ctx.setLineDash([]);
 }
 function soma(ctx,x,y,color,r=6){
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
   ctx.lineWidth=1.5;ctx.strokeStyle='#122337';ctx.stroke();
   ctx.beginPath();ctx.arc(x-1,y-1,2,0,Math.PI*2);ctx.fillStyle='#352b4b';ctx.fill();
 }
 function terminal(ctx,x,y){
   ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#ffffff';ctx.fill();
   ctx.strokeStyle='#293952';ctx.lineWidth=.9;ctx.stroke();
 }
 // The PAM50 mask is a tract TERRITORY, not a single axon. The exemplar
 // 3D spline is sampled at the very same 3D guide height by scene.js.
 // With no measured GLB-to-PAM50 registration, map its relative transverse
 // change to a small offset around the corresponding PAM50 region centroid.
 // Always constrain the small marker to the anatomical lCST polygon.
 function representativeFiberMarkers(ctx,segment,hits){
   const all=data?.[segment]?.lCST||[];
   const result={};
   for(const hit of hits||[]){
     if(hit.id!=='Corticospinal tract'||!Number.isFinite(hit.u)||!Number.isFinite(hit.v))continue;
     // Left M1 -> right spinal CST -> image LEFT (radiological orientation).
     const targetSide=hit.side==='left'?'left':'right';
     const poly=all.filter(p=>p.length>=3).find(p=>{
       const x=p.reduce((v,q)=>v+q[0],0)/p.length;
       return targetSide==='right'?x>215:x<215;
     });
     if(!poly)continue;
     const cx=poly.reduce((v,q)=>v+q[0],0)/poly.length;
     const cy=poly.reduce((v,q)=>v+q[1],0)/poly.length;
     const displacementX=Math.max(-5,Math.min(5,(Math.abs(hit.u)-.53)*22));
     const displacementY=Math.max(-5,Math.min(5,(hit.v+.22)*20));
     const candidateX=cx+(targetSide==='right'?displacementX:-displacementX);
     const candidateY=cy-displacementY;
     const shape=toPath([poly]);
     const inside=ctx.isPointInPath(shape,candidateX,candidateY);
     const x=inside?candidateX:cx, y=inside?candidateY:cy;
     result[targetSide]=[x,y];
     // white ring = exemplar 3D axon; blue region underneath = whole tract mask
     ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#ffffff';ctx.fillStyle='#13BAFF';
     ctx.beginPath();ctx.arc(x,y,4.25,0,2*Math.PI);ctx.fill();ctx.stroke();
     ctx.restore();
   }
   return result;
 }
 // Direct corticomotoneuronal (CM) example at T1 only.
 // Histological axons and individual synapses are NOT resolved in PAM50:
 // soma, collateral, ventral root, peripheral axon and motor endplate are schematic.
 // All elements belong to ONE selected CST exemplar and its postsynaptic alpha MN.
 function renderC8MotorCircuitSide(ctx,targetSide,fiberPoint){
   if(circuitMode==='off')return;
   ctx.save();
   // Work in right-image-side coordinates, then mirror for the image-left side.
   if(targetSide==='left'){ctx.translate(430,0);ctx.scale(-1,1);}
   ctx.translate(-8,5);
   ctx.lineCap='round';ctx.lineJoin='round';
   const start=fiberPoint ? [targetSide==='left'?430-fiberPoint[0]+8:fiberPoint[0]+8,fiberPoint[1]-5] : [294,187];
   // One CST collateral reaches one alpha MN dendrite: no intermediate neuron.
   const branch=[start,[284,182],[275,166],[265,151]];
   drawCurve(ctx,branch,'#142238',6.0);
   drawCurve(ctx,branch,CIRCUIT_COLORS.cst,3.5);
   // A synapse onto an alpha MN dendrite, rather than an invented direct
   // corticospinal-peripheral-nerve junction.
   drawCurve(ctx,[[258,140],[261,145],[265,151]],CIRCUIT_COLORS.alpha,2.5);
   drawCurve(ctx,[[258,140],[246,134]],CIRCUIT_COLORS.alpha,1.4);
   drawCurve(ctx,[[258,140],[250,126]],CIRCUIT_COLORS.alpha,1.4);
   drawCurve(ctx,[[258,140],[266,127]],CIRCUIT_COLORS.alpha,1.4);
   soma(ctx,258,140,CIRCUIT_COLORS.alpha,6.5);
   terminal(ctx,265,151);
   // Same alpha MN axon exits anterolaterally in a ventral rootlet,
   // continues in a peripheral motor nerve and reaches a muscle endplate.
   const motorAxon=[[264,139],[280,132],[300,121],[323,111],[342,107],[362,102],[379,91]];
   drawCurve(ctx,motorAxon,'#172637',6.2);
   drawCurve(ctx,motorAxon,CIRCUIT_COLORS.alpha,3.1);
   // The motor end plate is spatially far from the cord in the real body.
   // Small extracord muscle icon here is a deliberately NOT-TO-SCALE inset.
   ctx.save();
   ctx.translate(394,83);ctx.rotate(-.27);
   ctx.beginPath();ctx.ellipse(0,0,16,7.5,0,0,Math.PI*2);
   ctx.fillStyle='rgba(221,162,137,.91)';ctx.fill();
   ctx.strokeStyle='#ffe4cb';ctx.lineWidth=1.1;ctx.stroke();
   ctx.strokeStyle='rgba(255,231,218,.58)';ctx.lineWidth=.7;
   for(const xx of [-9,-3,3,9]){ctx.beginPath();ctx.moveTo(xx,-5);ctx.lineTo(xx,5);ctx.stroke();}
   ctx.restore();
   ctx.beginPath();ctx.arc(379,91,3.8,0,Math.PI*2);
   ctx.fillStyle=CIRCUIT_COLORS.synapse;ctx.fill();
   ctx.strokeStyle='#604b33';ctx.lineWidth=1.1;ctx.stroke();
   ctx.restore();
 }
 function renderC8MotorCircuit(ctx,markers){
   if(circuitMode==='off')return;
   if(cstOriginSide==='left'||cstOriginSide==='both')renderC8MotorCircuitSide(ctx,'left',markers?.left);
   if(cstOriginSide==='right'||cstOriginSide==='both')renderC8MotorCircuitSide(ctx,'right',markers?.right);
 }
 function circuitHitOnRight(x,y){
   if(circuitMode==='off')return null;
   const near=(p,r)=>Math.hypot(x-p[0],y-p[1])<=r;
   if(near([265,151],5.4))return entry('synapseDirect');
   if(near([258,140],10))return entry('alphaMotorNeuron');
   if(near([379,91],8.5))return entry('neuromuscularJunction');
   if(near([394,83],14))return entry('muscleFiber');
   if(x>337&&x<378&&Math.abs(y-(108-(x-337)*.36))<12)return entry('peripheralMotorAxon');
   if(x>290&&x<341&&y>99&&y<139)return entry('ventralRootAxon');
   if(near([284,181],10))return entry('cstCollateral');
   return null;
 }
 function circuitHit(x,y){
   if(circuitMode==='off')return null;
   if(cstOriginSide==='right'||cstOriginSide==='both'){
     const h=circuitHitOnRight(x+8,y-5);if(h)return h;
   }
   if(cstOriginSide==='left'||cstOriginSide==='both')return circuitHitOnRight(430-x+8,y-5);
   return null;
 }
 function renderCanvas(ctx,width,height,progress,explicitSegment,options={}){
   const selected=getSectionAt(progress);
   const seg=data?.[explicitSegment]?explicitSegment:selected.segment;
   const section=seg===selected.segment?selected:{...selected,segment:seg,index:segments.indexOf(seg),interpolated:seg.includes('-')};
   const scale=Math.min((width-4)/430,(height-4)/318),
      offsetX=(width-430*scale)/2,offsetY=(height-318*scale)/2;
   const view={section,offsetX,offsetY,scale,cx:215,cy:160,source:'PAM50',spinal:true};
   if(!data?.[seg]){
     ctx.fillStyle='#f0baa1';ctx.font='12px system-ui';ctx.fillText('PAM50断面データを読み込めません',12,height/2);
     return view;
   }
   ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);
   ctx.lineJoin='round';ctx.lineCap='round';
   ctx.fillStyle=colors.cord;ctx.strokeStyle='#90a6be';ctx.lineWidth=2.6;
   ctx.fill(getPath(seg,'cord'));ctx.stroke(getPath(seg,'cord'));
   ctx.save();ctx.clip(getPath(seg,'cord'));
   // Funiculi = teaching compartment zones inferred from the PAM50 grouped soft masks.
   for(const key of ['ventralFuniculus','lateralFuniculus','dorsalFuniculus']){
     ctx.globalAlpha=.70;ctx.fillStyle=colors[key];ctx.fill(getPath(seg,key));
   }
   ctx.globalAlpha=1;
   ctx.fillStyle=colors.gm;ctx.fill(getPath(seg,'gm'));
   for(const key of ['intermediate','dorsalHorn','ventralHorn']){
     ctx.fillStyle=colors[key];ctx.fill(getPath(seg,key));
   }
   for(const key of Object.keys(OPTIONS))if(settings[key]&&available(seg,key)){
     ctx.globalAlpha=.83;ctx.fillStyle=colors[key];
     // CST territory is bilateral anatomy, but selected unilateral CST is
     // highlighted only contralateral to its cortical origin after decussation.
     // Opposite territory remains visible as underlying unselected white matter.
     if(key==='lCST'&&focusUnilateralCST&&cstOriginSide!=='both'){
       const maskSide=cstOriginSide==='left'?'left':'right';
       for(const poly of data[seg][key]||[]){
         if(poly.length<3)continue;
         const cx=poly.reduce((n,pt)=>n+pt[0],0)/poly.length;
         if(maskSide==='left'?cx>=215:cx<=215)continue;
         const p=toPath([poly]);ctx.fill(p);
         ctx.globalAlpha=1;ctx.lineWidth=1.1;ctx.strokeStyle='#20374f';ctx.stroke(p);ctx.globalAlpha=.83;
       }
     }else{
       ctx.fill(getPath(seg,key));ctx.globalAlpha=1;ctx.lineWidth=1.1;ctx.strokeStyle='#20374f';ctx.stroke(getPath(seg,key));
     }
     ctx.globalAlpha=1;
   }
   ctx.restore();
   // PAM50 masks identify the outer cord; fissure/sulcus are highlighted as
   // teaching landmarks because a 0.5-mm template cannot preserve their depth.
   const b=boundsOfCord(seg);
   ctx.lineCap='round';ctx.strokeStyle='#789bb8';ctx.lineWidth=1.6;
   ctx.beginPath();ctx.moveTo(215,b.top+1);ctx.lineTo(215,b.top+13);ctx.stroke();
   ctx.setLineDash([2,2]);ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(215,b.bottom-1);ctx.lineTo(215,b.bottom-8);ctx.stroke();ctx.setLineDash([]);
   const markers=representativeFiberMarkers(ctx,seg,options.fiberHits);
   lastFiberMarkers=(options.fiberHits!==undefined)?markers:lastFiberMarkers;
   view.fiberMarkers=markers;
   if(seg==='T1')renderC8MotorCircuit(ctx,markers);
   ctx.beginPath();ctx.arc(215,160,2.7,0,2*Math.PI);
   ctx.fillStyle='#293d62';ctx.fill();ctx.strokeStyle='#e6f2fd';ctx.lineWidth=1;ctx.stroke();
   ctx.fillStyle='#b7cde0';ctx.textAlign='center';ctx.font='12px system-ui';
   ctx.fillText('前方',215,19);ctx.fillText('後方',215,305);
   // Radiological axial view: R (patient right) is at image left.
   ctx.font='bold 17px system-ui';ctx.fillStyle='#f0f8ff';ctx.textAlign='center';
   ctx.fillText('R',40,162);ctx.fillText('L',390,162);
   ctx.restore();
   return view;
 }
 function hitCanvas(ctx,localX,localY,view){
   if(!view?.section||!data?.[view.section.segment])return null;
   const seg=view.section.segment,x=(localX-view.offsetX)/view.scale,y=(localY-view.offsetY)/view.scale;
   if(!Number.isFinite(x)||!Number.isFinite(y))return null;
   // The 3D exemplar marker is independent of the lCST territory and
   // should not be captured by the adjacent collateral/synapse hit zones.
   for(const point of Object.values(view.fiberMarkers||{})){
     if(Math.hypot(x-point[0],y-point[1])<7)return entry('representativeFiber');
   }
   const circuitHitResult=seg==='T1'?circuitHit(x,y):null;
   if(circuitHitResult)return circuitHitResult;
   const path=(key)=>ctx.isPointInPath(getPath(seg,key),x,y);
   const b=boundsOfCord(seg);
   if(Math.abs(x-215)<3.3&&y>=b.top-3&&y<=b.top+14)return entry('anteriorFissure');
   if(Math.abs(x-215)<3.3&&y>=b.bottom-9&&y<=b.bottom+3)return entry('posteriorSulcus');
   if(Math.hypot(x-215,y-160)<4.5)return entry('centralCanal');
   if(!path('cord')){
     return null;
   }
   for(const key of [...Object.keys(OPTIONS).filter(k=>settings[k]).reverse()]){
     if(key==='lCST'&&focusUnilateralCST&&cstOriginSide!=='both'){
       if(cstOriginSide==='left'&&x>215)continue;
       if(cstOriginSide==='right'&&x<215)continue;
     }
     if(path(key))return entry(key);
   }
   for(const key of ['ventralHorn','dorsalHorn','intermediate'])if(path(key))return entry(key);
   if(path('gm'))return entry('grayCommissure');
   for(const key of ['dorsalFuniculus','lateralFuniculus','ventralFuniculus'])if(path(key))return entry(key);
   return entry('cord');
 }
 function svgFor(progress){
   const seg=getSectionAt(progress).segment;
   if(!data?.[seg])return '<svg viewBox="0 0 430 318"></svg>';
   let parts=[];
   for(const key of ['cord','ventralFuniculus','lateralFuniculus','dorsalFuniculus','gm','intermediate','dorsalHorn','ventralHorn',...Object.keys(OPTIONS).filter(k=>settings[k])]){
     for(const poly of data[seg][key]||[]){if(poly.length<3)continue;
       parts.push(`<polygon points="${poly.map(p=>p.join(',')).join(' ')}" fill="${colors[key]}" stroke="#536c83" stroke-width=".65"><title>${terms[key]?.[0]||key}</title></polygon>`);}
   }
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 318" role="img" aria-label="${seg}髄節横断面">${parts.join('')}</svg>`;
 }
 function render(container,progress){if(!container)return;container.innerHTML=svgFor(progress);return getSectionAt(progress);}
 const api={isPAM50:true,SEGMENTS:segments,colors,terms,options:settings,setCircuitMode,getCircuitMode,setCSTOriginSide,setMode2CSTFocus,CIRCUIT,CIRCUIT_COLORS,setTractOptions,getSectionAt,renderCanvas,hitCanvas,svgFor,render};
 if(root)root.SpineAtlasSection=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
