/* Mode 2 axial: presentation-only, label-aware subpixel antialiasing.
   NO atlas labels or anatomical locations are changed by this renderer.
   Raw ID masks remain authoritative for hit testing. The atlas masks currently
   originate from brain.glb; they are NOT PAM50/MNI segmented MRI volumes. */
(function(root){'use strict';
  function render(ids,palette,sz){
    if(!ids || ids.length!==sz*sz || !Array.isArray(palette))return null;
    const S=sz*2;
    const can=document.createElement('canvas');can.width=S;can.height=S;
    const c=can.getContext('2d');if(!c)return null;
    const image=c.createImageData(S,S), data=image.data;
    const colors=palette.map(h=>{const n=parseInt((h||'#131d2a').slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];});
    // Four quarter-pixel samples interpolate only the display colors at hard
    // segmentation borders. No blur kernel crosses whole nuclei or fissures.
    for(let y=0;y<S;y++){
      const yy=(y+.5)/2-.5, y0=Math.max(0,Math.floor(yy)),y1=Math.min(sz-1,y0+1),dy=Math.max(0,Math.min(1,yy-y0));
      for(let x=0;x<S;x++){
        const xx=(x+.5)/2-.5,x0=Math.max(0,Math.floor(xx)),x1=Math.min(sz-1,x0+1),dx=Math.max(0,Math.min(1,xx-x0));
        const p=(y*S+x)*4;
        const t=[ids[y0*sz+x0],ids[y0*sz+x1],ids[y1*sz+x0],ids[y1*sz+x1]];
        const w=[(1-dx)*(1-dy),dx*(1-dy),(1-dx)*dy,dx*dy];
        for(let ch=0;ch<3;ch++){
          let n=0;for(let k=0;k<4;k++)n+=(colors[t[k]]||colors[0])[ch]*w[k];
          data[p+ch]=Math.round(n);
        }
        data[p+3]=255;
      }
    }
    c.putImageData(image,0,0);
    return can;
  }
  root.Mode2AxialSmooth={render,version:'v0.9B label-preserving display smoothing'};
})(window);
