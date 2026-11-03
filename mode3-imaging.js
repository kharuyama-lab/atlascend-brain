/* Mode 3 clinical multi-planar viewer (MPR): native NRRD voxels, patient-space registration.
 * Source: 3D Slicer SampleData / CT-MR Brain. No synthetic image data.
 */
(function(){'use strict';
const enc=new TextDecoder('utf-8');
function matrixInverse(M){
 const [a,b,c,d,e,f,g,h,i]=M;const A=e*i-f*h,B=c*h-b*i,C=b*f-c*e,D=f*g-d*i,E=a*i-c*g,F=c*d-a*f,G=d*h-e*g,H=b*g-a*h,I=a*e-b*d;
 const det=a*A+b*D+c*G; if(Math.abs(det)<1e-10)throw Error('画像の座標行列が特異です');return [A,B,C,D,E,F,G,H,I].map(x=>x/det);
}
function product(M,v){return [M[0]*v[0]+M[1]*v[1]+M[2]*v[2],M[3]*v[0]+M[4]*v[1]+M[5]*v[2],M[6]*v[0]+M[7]*v[1]+M[8]*v[2]];}
function parseVec(s){return [...String(s).matchAll(/\(([^)]+)\)/g)].map(m=>m[1].split(',').map(Number));}
function parsePoint(s){let p=String(s).replace(/[()]/g,'').split(',').map(Number);if(p.length!==3||p.some(x=>!Number.isFinite(x)))throw Error('space origin不正');return p;}
async function readNRRD(buffer){
 const buf=new Uint8Array(buffer);let end=-1;let term=0;
 for(let i=0;i<Math.min(buf.length,65536);i++){if(buf[i]===10&&buf[i+1]===10){end=i+2;term=2;break;}if(buf[i]===13&&buf[i+1]===10&&buf[i+2]===13&&buf[i+3]===10){end=i+4;term=4;break;}}
 if(end<0)throw Error('NRRDヘッダーが見つかりません');
 const header=enc.decode(buf.subarray(0,end));if(!header.startsWith('NRRD'))throw Error('NRRDではありません');
 const fields={};header.split(/\r?\n/).forEach(line=>{const n=line.indexOf(':');if(n>0&&!line.startsWith('#'))fields[line.slice(0,n).trim().toLowerCase()]=line.slice(n+1).trim();});
 if(Number(fields.dimension)!==3)throw Error('3D NRRDのみ対応');
 const dims=fields.sizes.split(/\s+/).map(Number);if(dims.length!==3||dims.some(n=>!(n>0)))throw Error('NRRD dimensions不正');
 const length=dims.reduce((a,b)=>a*b,1);const type=(fields.type||'').toLowerCase();const types={'short':['i16',2],'int16':['i16',2],'signed short':['i16',2],'unsigned short':['u16',2],'ushort':['u16',2],'uint16':['u16',2],'char':['i8',1],'signed char':['i8',1],'uchar':['u8',1],'unsigned char':['u8',1],'uint8':['u8',1],'float':['f32',4],'double':['f64',8],'int':['i32',4]};
 const dt=types[type];if(!dt)throw Error('未対応のNRRD型 '+type);
 let bytes=buf.slice(end);if(/gzip|gz/.test(fields.encoding||'')){
   if(!('DecompressionStream' in window))throw Error('Chromeのgzip展開に非対応です');
   const response=new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')));
   bytes=new Uint8Array(await response.arrayBuffer());
 }else if(fields.encoding!=='raw')throw Error('raw/gzip NRRDだけに対応');
 if(bytes.byteLength<length*dt[1])throw Error('画像データが途中で切れています');
 const off=bytes.byteOffset,ab=bytes.buffer;const dv=new DataView(ab,off,length*dt[1]);
 const little=(fields.endian||'little').toLowerCase()!=='big';let data;
 if(dt[0]==='i8')data=new Int8Array(bytes.slice(0,length).buffer);
 else if(dt[0]==='u8')data=new Uint8Array(bytes.slice(0,length).buffer);
 else {const kind=dt[0];data=kind==='f32'?new Float32Array(length):kind==='f64'?new Float64Array(length):kind==='i32'?new Int32Array(length):kind==='u16'?new Uint16Array(length):new Int16Array(length);
   for(let j=0;j<length;j++){const k=j*dt[1];data[j]=kind==='f32'?dv.getFloat32(k,little):kind==='f64'?dv.getFloat64(k,little):kind==='i32'?dv.getInt32(k,little):kind==='u16'?dv.getUint16(k,little):dv.getInt16(k,little);}}
 const dirs=parseVec(fields['space directions']||'');if(dirs.length!==3)throw Error('space directions が必要です');
 const org=parsePoint(fields['space origin']||'');
 const space=(fields.space||'left-posterior-superior').toLowerCase();
 // NRRD space axes convert explicitly to RAS patient coordinates.
 const signs=space.startsWith('left-posterior')?[-1,-1,1]:space.startsWith('right-anterior')?[1,1,1]:null;
 if(!signs)throw Error('未対応の座標系：'+fields.space);
 const origin=org.map((v,j)=>v*signs[j]);
 const M=[dirs[0][0]*signs[0],dirs[1][0]*signs[0],dirs[2][0]*signs[0],dirs[0][1]*signs[1],dirs[1][1]*signs[1],dirs[2][1]*signs[1],dirs[0][2]*signs[2],dirs[1][2]*signs[2],dirs[2][2]*signs[2]];
 const inv=matrixInverse(M);const corners=[];for(let i of [0,dims[0]-1])for(let j of [0,dims[1]-1])for(let k of [0,dims[2]-1]){const d=product(M,[i,j,k]);corners.push(origin.map((v,x)=>v+d[x]));}
 const bounds=[0,1,2].map(j=>[Math.min(...corners.map(c=>c[j])),Math.max(...corners.map(c=>c[j]))]);
 const scales=fields['measurement frame']||null;
 return {dims,data,origin,M,inv,bounds,fields,scales};
}
function nearest(v,xyz){
 let d=xyz.map((x,j)=>x-v.origin[j]);let q=product(v.inv,d);let i=Math.round(q[0]),j=Math.round(q[1]),k=Math.round(q[2]);
 if(i<0||i>=v.dims[0]||j<0||j>=v.dims[1]||k<0||k>=v.dims[2])return NaN;
 return v.data[(k*v.dims[1]+j)*v.dims[0]+i];
}
function trilinear(v,xyz){
 const p=product(v.inv,xyz.map((x,j)=>x-v.origin[j]));const [i,j,k]=p.map(Math.floor),[nx,ny,nz]=v.dims;
 if(i<0||j<0||k<0||i+1>=nx||j+1>=ny||k+1>=nz)return nearest(v,xyz);
 const t=p.map((x,j)=>x-Math.floor(x)), at=(x,y,z)=>v.data[(z*ny+y)*nx+x];
 let sum=0;for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++)sum+=at(i+x,j+y,k+z)*(x?t[0]:1-t[0])*(y?t[1]:1-t[1])*(z?t[2]:1-t[2]);return sum;
}
function selectBounds(volumes){
 const bounds=[0,1,2].map(a=>[Math.max(...volumes.map(v=>v.bounds[a][0])),Math.min(...volumes.map(v=>v.bounds[a][1]))]);
 if(bounds.some(([lo,hi])=>hi-lo<45))throw Error('CT・MRIに共通する十分な撮像範囲がありません。位置合わせを確認してください。');
 return bounds;
}
const formats={axial:{u:0,v:1,w:2},coronal:{u:0,v:2,w:1},sagittal:{u:1,v:2,w:0}};
function uWorld(b,axis,t){return b[axis][1]-(b[axis][1]-b[axis][0])*t;}
function renderSlice(vol,plane,at,b,w=352,h=352,quality='linear',wl=null){
 const cfg=formats[plane],rangeU=b[cfg.u][1]-b[cfg.u][0],rangeV=b[cfg.v][1]-b[cfg.v][0],aspect=rangeU/rangeV;
 let W=Math.round(w),H=Math.round(h);let tw,th;if(aspect>=1){tw=W;th=Math.max(1,Math.floor(W/aspect));}else{th=H;tw=Math.max(1,Math.floor(H*aspect));}
 const canvas=document.createElement('canvas');canvas.width=tw;canvas.height=th;const ctx=canvas.getContext('2d');let im=ctx.createImageData(tw,th);const out=im.data;
 const win=wl||{center:vol.fields.modality==='CT'?40:500,width:vol.fields.modality==='CT'?80:1000};const low=win.center-win.width/2,high=win.center+win.width/2;
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
  const p=[...at];p[cfg.u]=uWorld(b,cfg.u,(x+.5)/tw);p[cfg.v]=uWorld(b,cfg.v,(y+.5)/th);
  const val=quality==='linear'?trilinear(vol,p):nearest(vol,p);const idx=(y*tw+x)*4;
  const g=Number.isFinite(val)?Math.max(0,Math.min(255,Math.round(255*(val-low)/(high-low)))):0;
  out[idx]=g;out[idx+1]=g;out[idx+2]=g;out[idx+3]=255;
 }
 ctx.putImageData(im,0,0);return canvas;
}
window.Mode3Imaging={readNRRD,nearest,trilinear,selectBounds,formats,renderSlice,uWorld,product};
})();
