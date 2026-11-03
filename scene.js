/* ============================================================
   Brain Project - REAL specimen scene (Three.js r137 global)
   Loads the 344-structure Z-Anatomy brain.glb and exposes the
   exact same window.BrainScene API the procedural mock used -    but every mesh carries its real bx_id, so picking, selection,
   isolate and focus are per-structure, not per-category.
   ============================================================ */
(function () {
  const T = window.THREE;

  const PAL = (window.BRAIN && window.BRAIN.palette) || {};
  const col = (c, fb) => new T.Color(PAL[c] || fb || '#cccccc');
  // per-subsystem self-illumination so hues stay vivid on the dark stage
  const CAT_EMISS = {
    cortex: 0.05, white_matter: 0.16, deep_grey: 0.44, diencephalon: 0.42, brainstem: 0.22,
    cerebellum: 0.12, ventricles: 0.54, arteries: 0.6, veins_sinuses: 0.5, cranial_nerves: 0.54, meninges_dura: 0.06,
    tracts: 0.5,
  };
  // structures kept translucent even at full layer opacity (you see through them)
  const MAX_OPACITY = { meninges_dura: 0.34, ventricles: 0.9 };
  const VESSEL = new Set(['arteries', 'veins_sinuses', 'cranial_nerves', 'tracts']);
  // tone down the very light masses so the cortex doesn't read as neon-white on the dark stage
  const CAT_SHADE = { cortex: 0.62, white_matter: 0.8 };
  function shade(cat, hex) { const c = new T.Color(hex || '#cccccc'); if (CAT_SHADE[cat]) c.multiplyScalar(CAT_SHADE[cat]); return c; }

  function extras(o) {
    if (o.userData && o.userData.bx_cat != null) return o.userData;
    if (o.parent && o.parent.userData && o.parent.userData.bx_cat != null) return o.parent.userData;
    return o.userData || {};
  }

  /* ============================================================ */
  function create(canvas, opts) {
    opts = opts || {};
    const URL = opts.url || './models/brain.glb';
    const DRACO = opts.dracoPath || './vendor/draco/';

    // A canvas that was previously bound to a 2D context (or a failed WebGL
    // context) cannot reliably be reused for WebGL on every browser.
    // Keep the original DOM canvas for React ownership. If creation fails,
    // render into a NEW sibling canvas instead of retrying the same one.
    let renderer;
    let fallbackCanvas = null;
    let originalCanvasDisplay = null;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (firstError) {
      console.warn('BrainAtlas: original canvas rejected WebGL; trying a fresh rendering surface', firstError);
      const options = [
        { antialias: true, alpha: true, powerPreference: 'default' },
        { antialias: false, alpha: true, powerPreference: 'low-power', precision: 'mediump' },
      ];
      let lastError = firstError;
      for (const config of options) {
        // Do not pass `canvas`: Three.js must allocate a genuinely new canvas.
        try {
          renderer = new T.WebGLRenderer(config);
          fallbackCanvas = renderer.domElement;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!renderer) {
        const error = new Error('WebGL初期化に失敗しました。新しいCanvasでも描画を開始できません。');
        error.cause = lastError;
        throw error;
      }
      // Match the original renderer's layout, stacking and pointer behavior.
      fallbackCanvas.className = canvas.className;
      fallbackCanvas.style.cssText = canvas.style.cssText;
      fallbackCanvas.style.visibility = canvas.style.visibility || 'visible';
      originalCanvasDisplay = canvas.style.display;
      canvas.style.display = 'none';
      canvas.parentNode.insertBefore(fallbackCanvas, canvas.nextSibling);
      console.info('BrainAtlas: recovered WebGL using a fresh canvas');
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.LinearToneMapping;
    renderer.toneMappingExposure = opts.exposure || 0.95;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.01, 200);

    // lights - soft clinical key + cool/warm rims for the "designed" stage
    scene.add(new T.HemisphereLight(0xc6d2ff, 0x14171f, 0.5));
    const key = new T.DirectionalLight(0xffffff, 1.05); key.position.set(4, 6.5, 7); scene.add(key);
    const fill = new T.DirectionalLight(0xaebfff, 0.34); fill.position.set(-6, 1, 3); scene.add(fill);
    const rim = new T.DirectionalLight(0x8ee0ff, 0.8); rim.position.set(-3, 3, -8); scene.add(rim);
    const rim2 = new T.DirectionalLight(0xff9bb6, 0.3); rim2.position.set(5, -2, -6); scene.add(rim2);

    const root = new T.Group(); root.rotation.y = -0.25; scene.add(root);
    const model = new T.Group(); root.add(model);   // holds the centered/scaled gltf

    // logical category registry (we never reparent gltf meshes - keep transforms)
    const cats = {};                       // cat -> { want, targetOpacity, meshes[] }
    function C(cat) { if (!cats[cat]) cats[cat] = { want: true, targetOpacity: 1, meshes: [] }; return cats[cat]; }
    const allMeshes = [];
    // Preserve original GLB metadata before userData is replaced for interaction.
    const sourceCoreMeshes = [];
    const meshById = new Map();             // nodeId -> [meshes]
    let loaded = false;
    // Scene lifetime is separate from asynchronous GLTF loading.
    let sceneDisposed = false;
    let contextLost = false;
    function disposeMeshResources(object) {
      object.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry?.dispose();
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach(m => m?.dispose());
      });
    }
    function onContextLost(event) {
      event.preventDefault(); // Allows browser-managed WebGL context restoration.
      if (sceneDisposed) return;
      contextLost = true;
      renderer.setAnimationLoop(null);
      console.warn('[BrainScene] WebGL context lost; rendering suspended.');
      opts.onError?.('WebGL描画が停止しました。ページを再読み込みしてください。');
    }
    function onContextRestored() {
      if (sceneDisposed || !contextLost) return;
      // Do not silently resume an incompletely restored Three.js scene.
      console.info('[BrainScene] WebGL context restored; reload is required.');
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);
    // Original spinal-cord schematic is kept outside the 437 source node registry.
    let spinal=null;
    let spinalWant=true;
    let spinalAlpha=1;
    let spinalRoutes=[];
    let mode2=null,mode2Selection=[],mode2Impulse=true;
    // Native HCP specimen and the Mode2 representative reconstruction overlapped,
    // leaving two lines and a false discontinuity at the specimen endpoint.
    // Keep the native source untouched and visible in Mode1; use one continuous
    // representative pathway in Mode2 when CST is selected.
    const nativeCSTIds=new Set((window.BRAIN?.nodes||[])
      .filter(n=>n.category==='tracts'&&n.label==='Corticospinal tract').map(n=>n.id));
    function suppressNativeCST(m){
      return !!mode2 && mode2AxialEnabled && mode2Selection.includes('Corticospinal tract') &&
        m.userData.cat==='tracts' && nativeCSTIds.has(m.userData.nodeId);
    }
    let mode2AxialEnabled=false;
    const mode2SmoothCache=new Map();
    let mode2LevelCache=null;
    let gltfForMode2=null;
    // Mode 2 cortical perfusion territories are layered over unmodified GLB gyri.
    let mode2Territories=null, territorySelection=[], territoryOpacity=.48;
    let mode2Vessels=null, vesselSelection=[], vesselEnabled=true;
    let mode2Lesions=null, lesionSelection=null, lesionSide='left';


    // Mode 1 contextual anatomical landmarks and subtle direction cues.
    // All 3D structures referenced here are native GLB meshes; no invented
    // internal-capsule / spinal-cord geometries are inserted.
    let currentRouteLabels = [];
    let currentImpulseLabels = [];
    let routeContextIds = new Set();
    let markers = [];
    // No detached glow spheres. Pulses illuminate only the native tract surface.
    // A short emissive highlight travels in one direction along the tract itself.
    const routePulseGroups = new Map();
    const annotationLayer = document.createElement('div');
    annotationLayer.setAttribute('aria-hidden', 'true');
    annotationLayer.style.cssText = 'position:fixed;inset:0;z-index:9;pointer-events:none;overflow:hidden;';
    (canvas.parentElement || document.body).appendChild(annotationLayer);

    function idsForLandmark(name) {
      return window.BRAIN.nodes.filter(n => n.label === name).map(n => n.id);
    }
    function buildRouteAnnotations() {
      annotationLayer.replaceChildren();
      markers = [];
      routeContextIds = new Set();
      if (!loaded) return;
      const routes = window.Mode1Routes || {};
      const labels = currentRouteLabels.slice(0, 2); // avoid crowding for multiple tracts
      const unique = new Set();
      labels.forEach((routeLabel, ri) => {
        const route = routes[routeLabel];
        if (!route) return;
        route.landmarks.filter(l => l.mesh).forEach((landmark, i) => {
          const ids = idsForLandmark(landmark.mesh);
          ids.forEach(id => routeContextIds.add(id));
          // For labels, show one side only when both are on, to avoid duplicates.
          const filtered = ids.map(id => window.BRAIN.nodes.find(n => n.id === id)).filter(Boolean);
          const onSide = filtered.find(n => n.side === req.hemisphere) ||
                         filtered.find(n => n.side === 'left') || filtered[0];
          if (!onSide || unique.has(landmark.mesh)) return;
          unique.add(landmark.mesh);
          const meshes = meshById.get(onSide.id);
          if (!meshes || !meshes.length) return;
          if (meshes[0].geometry && !meshes[0].geometry.boundingBox) meshes[0].geometry.computeBoundingBox();
          const el = document.createElement('div');
          el.textContent = landmark.name;
          el.title = landmark.note || landmark.en || '';
          el.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);font:600 11px/1.35 -apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN",sans-serif;color:#f1f6fc;background:rgba(11,20,35,.86);border:1px solid '+route.color+'aa;border-radius:7px;white-space:nowrap;padding:3px 7px;box-shadow:0 2px 8px rgba(0,0,0,.32);';
          annotationLayer.appendChild(el);
          const anchor = meshes[0].geometry && meshes[0].geometry.boundingBox
            ? meshes[0].geometry.boundingBox.getCenter(new T.Vector3()) : new T.Vector3();
          markers.push({mesh:meshes[0],el,anchor,offset:markers.length});
        });
      });
      // Anchors in the ORIGINAL brain GLB coordinate system; descriptions explicitly
      // distinguish inferred position reference from segmented anatomy.
      if(mode2?.getLandmarks && labels.some(l=>l==='Corticospinal tract'||l==='Anterior corticospinal tract')){
        const existing=new Set();
        for(const a of mode2.getLandmarks()){
          if(req.hemisphere==='both' && a.side==='right')continue;
          if(req.hemisphere!=='both' && a.side!==req.hemisphere)continue;
          if(existing.has(a.ja+'|'+a.side))continue;
          existing.add(a.ja+'|'+a.side);
          const el=document.createElement('div');el.textContent=a.ja;el.title=a.en;
          el.style.cssText='position:absolute;left:0;top:0;transform:translate(-50%,-50%);font:600 11px/1.35 -apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN",sans-serif;color:#f1f6fc;background:rgba(11,20,35,.86);border:1px solid '+a.color+'aa;border-radius:7px;white-space:nowrap;padding:3px 7px;box-shadow:0 2px 8px rgba(0,0,0,.32);';
          annotationLayer.appendChild(el);
          markers.push({mesh:gltfForMode2,el,anchor:a.point.clone(),offset:markers.length,virtual:true,side:a.side});
        }
      }
    }
    function updateRouteAnnotations() {
      if (!markers.length) return;
      const rect = dom.getBoundingClientRect();
      for (const item of markers) {
        // Actual structure's bounding box center, not an invented landmark coordinate.
        const pt = item.mesh.localToWorld(item.anchor.clone());
        const view = pt.clone().project(camera);
        const front = pt.clone().sub(camera.position).dot(camera.getWorldDirection(new T.Vector3())) > 0;
        const side = item.virtual ? item.side : item.mesh.userData.side;
        const sideOK = req.hemisphere === 'both' || side === 'median' || side === req.hemisphere;
        item.el.style.display = front && sideOK && Math.abs(view.x)<1.05 && Math.abs(view.y)<1.05 ? 'block':'none';
        item.el.style.left = (rect.left+(view.x+1)*.5*rect.width+25)+'px';
        item.el.style.top = (rect.top+(1-view.y)*.5*rect.height+(item.offset%2)*13)+'px';
      }
    }
    function setRouteAnnotations(labels) {
      currentRouteLabels = labels || [];
      buildRouteAnnotations();
    }
    // A small light band travels *on the tract mesh*, in its anatomical
    // direction. Unlike v0.3.1, progress is based on mesh-surface distance
    // (not horizontal slices through the world Y axis).
    // No floating spheres, halos, particle trails or enlarged overlays.
    function routeVertexProgress(mesh, direction) {
      const geo = mesh.geometry;
      const pos = geo.getAttribute('position');
      if (!pos || pos.count < 2) return null;
      const count = pos.count;
      const heights = new Float32Array(count);
      const coords = new Float32Array(count * 3);
      const v = new T.Vector3();
      let ymin = Infinity, ymax = -Infinity;
      mesh.updateWorldMatrix(true, false);
      for (let i = 0; i < count; i++) {
        v.fromBufferAttribute(pos, i);
        coords[3*i] = v.x; coords[3*i+1] = v.y; coords[3*i+2] = v.z;
        v.applyMatrix4(mesh.matrixWorld);
        heights[i] = v.y;
        ymin = Math.min(ymin, v.y);
        ymax = Math.max(ymax, v.y);
      }
      const height = Math.max(0.00001, ymax-ymin);
      const fallback = () => {
        const result = new Float32Array(count);
        for (let i=0; i<count; i++) result[i] = direction === 'descending'
          ? (ymax-heights[i]) / height : (heights[i]-ymin) / height;
        return result;
      };
      const index = geo.getIndex();
      // Unindexed or very large geometries fall back to a simple height cue.
      if (!index || count > 15000) return fallback();
      const adjacency = Array.from({length:count}, () => []);
      const addEdge = (a,b) => {
        if (a === b || a>=count || b>=count) return;
        const ax=coords[3*a]-coords[3*b], ay=coords[3*a+1]-coords[3*b+1], az=coords[3*a+2]-coords[3*b+2];
        const length=Math.hypot(ax,ay,az);
        if (length > 1e-9) {
          adjacency[a].push([b,length]);
          adjacency[b].push([a,length]);
        }
      };
      for(let i=0; i+2<index.count; i+=3) {
        const a=index.getX(i), b=index.getX(i+1), c=index.getX(i+2);
        addEdge(a,b);addEdge(b,c);addEdge(c,a);
      }
      // Start at the terminal rim closest to the anatomical origin.
      // Mesh-surface geodesics preserve curvature better than global height.
      const originY = direction === 'descending' ? ymax : ymin;
      const cutoff = Math.max(height*0.008,1e-6);
      const dist = new Float64Array(count).fill(Infinity);
      const heap=[];
      function push(id,d) {
        let k=heap.length;heap.push([id,d]);
        while(k>0) {let p=(k-1)>>1;if(heap[p][1]<=d)break;heap[k]=heap[p];k=p;}heap[k]=[id,d];
      }
      function pop() {
        const first=heap[0], last=heap.pop();
        if(heap.length) {
          let k=0;
          while(2*k+1<heap.length) {
            let c=2*k+1;
            if(c+1<heap.length && heap[c+1][1]<heap[c][1])c++;
            if(heap[c][1]>=last[1])break;
            heap[k]=heap[c];k=c;
          }
          heap[k]=last;
        }
        return first;
      }
      for (let i=0;i<count;i++) {
        if(Math.abs(heights[i]-originY)<=cutoff) {dist[i]=0;push(i,0);}
      }
      while(heap.length) {
        const [a,da]=pop();
        if(da>dist[a])continue;
        for(const [b,w] of adjacency[a]) {
          const nd=da+w;
          if(nd<dist[b]) {dist[b]=nd;push(b,nd);}
        }
      }
      let max=0;
      for(const d of dist) if(Number.isFinite(d))max=Math.max(max,d);
      if(max<=1e-9 || !Array.from(dist).every(Number.isFinite))return fallback();
      const progress=new Float32Array(count);
      for(let i=0;i<count;i++)progress[i]=Math.min(1,dist[i]/max);
      return progress;
    }
    function prepareRoutePulses() {
      if (!loaded) return;
      model.updateMatrixWorld(true);
      const routes=window.Mode1Routes || {};
      Object.keys(routes).forEach(label=> {
        const route=routes[label];
        if(!['ascending','descending'].includes(route.direction))return;
        ['left','right'].forEach(side=> {
          const node=window.BRAIN.nodes.find(n=>n.label===label && n.side===side);
          if(!node)return;
          const ms=meshById.get(node.id)||[];
          if(!ms.length)return;
          const state={
            label,side,
            center:{value:0},
            width:{value:0.030},
            strength:{value:0},
            color:{value:new T.Color('#ffffff')},
          };
          ms.forEach(m=> {
            const arc=routeVertexProgress(m,route.direction);
            if(!arc)return;
            // Own geometry so no other object can share the injected attribute.
            m.geometry=m.geometry.clone();
            m.geometry.setAttribute('aRouteArc',new T.Float32BufferAttribute(arc,1));
            m.material.onBeforeCompile=shader=> {
              shader.uniforms.uRoutePulsePos=state.center;
              shader.uniforms.uRoutePulseWidth=state.width;
              shader.uniforms.uRoutePulseStrength=state.strength;
              shader.uniforms.uRoutePulseColor=state.color;
              shader.vertexShader='attribute float aRouteArc;\nvarying float vRouteArc;\n'+shader.vertexShader;
              shader.vertexShader=shader.vertexShader.replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\nvRouteArc=aRouteArc;'
              );
              shader.fragmentShader='varying float vRouteArc;\nuniform float uRoutePulsePos;\nuniform float uRoutePulseWidth;\nuniform float uRoutePulseStrength;\nuniform vec3 uRoutePulseColor;\n'+shader.fragmentShader;
              shader.fragmentShader=shader.fragmentShader.replace(
                '#include <emissivemap_fragment>',
                '#include <emissivemap_fragment>\nfloat routeDx=(vRouteArc-uRoutePulsePos)/max(0.001,uRoutePulseWidth);\nfloat routeBand=exp(-routeDx*routeDx*3.0);\ntotalEmissiveRadiance+=uRoutePulseColor*(uRoutePulseStrength*routeBand);'
              );
            };
            m.material.needsUpdate=true;
          });
          routePulseGroups.set(label+'|'+side,state);
        });
      });
    }
    function setRouteImpulse(labels) {
      currentImpulseLabels=labels||[];
    }
    function updateRouteImpulse(now) {
      // A single short moving accent, with a pause before the next cycle.
      // This is a schematic direction cue, NOT physiological conduction speed.
      const period=3600, travelPart=0.79;
      const phase=(now%period)/period;
      routePulseGroups.forEach(state=>{
        const enabled=currentImpulseLabels.includes(state.label) &&
          (req.hemisphere==='both'||req.hemisphere===state.side);
        const active=enabled && phase<travelPart;
        state.strength.value=active?0.95:0;
        if(active) state.center.value=phase/travelPart;
      });
    }

    // state requested before the GLB finished loading - applied on load
    const req = { layers: null, hemisphere: 'both', isolate: null, selected: null, subset: null };

    /* ---------- Mode 1 AXIAL: self-contained smoothed atlas (v0.4E) ----------
      101 slices derived and minimally smoothed from the licensed Brain Project
      surface meshes (educational schematic ONLY, not CT/MRI or diagnostic masks).
      All slice data is embedded directly in scene.js; no separate axial-atlas
      folder or fetch() is required. Only the requested 256px slice is colored.
      Original 3D mesh, mesh IDs, interactions and tract controls are unchanged.
    ------------------------------------------------------------------------- */

    /* v0.4F: section coordinate calibration for THIS exact brain.glb.
       These are geometric plane/triangle intersections in glTF source units;
       they are NOT anatomy approximations from the schematic atlas masks.
       Every guide position uses exactly the same 0..100 section level as
       the atlas image. Abort the overlay if the original GLB has changed.
    */
    const AX_GLB_CORE_BOUNDS={coreMin:[-0.06888675689697266,1.5388015508651733,-0.0991320013999939],coreMax:[0.06888774037361145,1.6996346712112427,0.08156709372997284]};
    const AX_INTERSECTION_EXTENTS={"both":[[0.000599,0.000599,-0.035629,-0.035629],[3.1e-05,0.007361,-0.035868,-0.02275],[3.3e-05,0.007664,-0.035479,-0.022208],[3.5e-05,0.007817,-0.035074,-0.021665],[3.6e-05,0.007877,-0.03467,-0.021124],[3.7e-05,0.007925,-0.034266,-0.020584],[3.8e-05,0.007954,-0.033861,-0.020045],[3.8e-05,0.007984,-0.033457,-0.019505],[4e-05,0.008013,-0.033069,-0.018965],[3.9e-05,0.008027,-0.032688,-0.018425],[4.1e-05,0.008026,-0.032307,-0.017873],[4e-05,0.008051,-0.031926,-0.017277],[3.8e-05,0.008151,-0.031545,-0.016377],[3.8e-05,0.008322,-0.031164,-0.015262],[-0.012745,0.012745,-0.041413,-0.013438],[-0.027091,0.027092,-0.057189,-0.011526],[-0.031443,0.031444,-0.068908,-0.009845],[-0.034639,0.03464,-0.07109,-0.008469],[-0.037607,0.037609,-0.072494,-0.007368],[-0.039369,0.039367,-0.073692,-0.006363],[-0.041342,0.041343,-0.074901,-0.005418],[-0.042802,0.042801,-0.076192,-0.00457],[-0.044245,0.044245,-0.077511,-0.004026],[-0.04569,0.045692,-0.078535,-0.003911],[-0.047024,0.047022,-0.079177,-0.00227],[-0.047825,0.047825,-0.079437,-0.001154],[-0.047749,0.04775,-0.079721,3.8e-05],[-0.0488,0.0488,-0.080124,0.011168],[-0.053345,0.053344,-0.079921,0.013484],[-0.054986,0.054988,-0.07946,0.015305],[-0.055622,0.055624,-0.078879,0.021801],[-0.055878,0.055878,-0.078117,0.026031],[-0.057031,0.057032,-0.088963,0.032486],[-0.057406,0.057403,-0.089877,0.034118],[-0.059595,0.059597,-0.090874,0.035742],[-0.060174,0.060176,-0.09187,0.036196],[-0.061994,0.061991,-0.092867,0.036651],[-0.06214,0.062137,-0.093858,0.037105],[-0.062271,0.062268,-0.094787,0.036963],[-0.062823,0.062819,-0.095448,0.036721],[-0.063542,0.063538,-0.095895,0.036704],[-0.063984,0.06398,-0.096343,0.036754],[-0.064033,0.064032,-0.096962,0.036723],[-0.064516,0.064514,-0.09759,0.035508],[-0.06517,0.06517,-0.098218,0.035217],[-0.065896,0.065894,-0.098846,0.049107],[-0.066291,0.06629,-0.098987,0.062923],[-0.066475,0.066477,-0.099085,0.068204],[-0.066592,0.066593,-0.098748,0.071509],[-0.066661,0.066658,-0.098203,0.072788],[-0.067048,0.06705,-0.098629,0.074008],[-0.067845,0.067846,-0.098867,0.075427],[-0.068288,0.068289,-0.098815,0.07641],[-0.068732,0.068733,-0.098532,0.078314],[-0.068714,0.068715,-0.098249,0.080127],[-0.068536,0.068537,-0.097877,0.080621],[-0.068553,0.068554,-0.097236,0.080722],[-0.06857,0.068571,-0.096594,0.080513],[-0.068428,0.068426,-0.095953,0.080039],[-0.068188,0.068187,-0.094807,0.08035],[-0.067525,0.067526,-0.094083,0.08098],[-0.066853,0.066853,-0.094408,0.08153],[-0.067506,0.067506,-0.094371,0.081391],[-0.067681,0.067681,-0.09394,0.081252],[-0.067856,0.067856,-0.093508,0.080726],[-0.06803,0.068031,-0.092861,0.08132],[-0.067874,0.067874,-0.090663,0.081506],[-0.067736,0.067736,-0.090058,0.080988],[-0.067711,0.067711,-0.089453,0.080765],[-0.06767,0.067669,-0.088847,0.080203],[-0.067584,0.067584,-0.088345,0.07963],[-0.067341,0.06734,-0.088764,0.078706],[-0.067097,0.067097,-0.088055,0.077169],[-0.066841,0.066841,-0.087221,0.076358],[-0.066143,0.066143,-0.086324,0.07564],[-0.065446,0.065445,-0.085172,0.074801],[-0.064743,0.064742,-0.084572,0.07389],[-0.063602,0.063601,-0.083758,0.072848],[-0.063052,0.063051,-0.083496,0.071216],[-0.062466,0.062467,-0.082866,0.066067],[-0.061451,0.061452,-0.08136,0.064417],[-0.060229,0.060229,-0.079477,0.064539],[-0.059006,0.059005,-0.078266,0.064305],[-0.057784,0.057782,-0.07681,0.063789],[-0.056743,0.056745,-0.075447,0.061832],[-0.054606,0.054607,-0.073849,0.060009],[-0.053265,0.053265,-0.072154,0.05887],[-0.0519,0.051901,-0.068333,0.05587],[-0.049131,0.049131,-0.067912,0.051826],[-0.047105,0.047105,-0.066736,0.049324],[-0.045699,0.045699,-0.065064,0.046081],[-0.043379,0.043381,-0.06317,0.044141],[-0.040583,0.040582,-0.059054,0.040635],[-0.037205,0.037204,-0.057804,0.039129],[-0.035038,0.035037,-0.056386,0.030509],[-0.031604,0.031605,-0.04914,0.028332],[-0.028902,0.028905,-0.047144,0.026021],[-0.025483,0.025483,-0.045675,0.013655],[-0.020177,0.020176,-0.042114,0.002158],[-0.016785,0.016785,-0.030757,-0.001278],[-0.010756,0.010755,-0.023478,-0.023478]],"left":[[0.000599,0.000599,-0.035629,-0.035629],[3.1e-05,0.007361,-0.035868,-0.02275],[3.3e-05,0.007664,-0.035479,-0.022208],[3.5e-05,0.007817,-0.035074,-0.021665],[3.6e-05,0.007877,-0.03467,-0.021124],[3.7e-05,0.007925,-0.034266,-0.020584],[3.8e-05,0.007954,-0.033861,-0.020045],[3.8e-05,0.007984,-0.033457,-0.019505],[4e-05,0.008013,-0.033069,-0.018965],[3.9e-05,0.008027,-0.032688,-0.018425],[4.1e-05,0.008026,-0.032307,-0.017873],[4e-05,0.008051,-0.031926,-0.017277],[3.8e-05,0.008151,-0.031545,-0.016377],[3.8e-05,0.008322,-0.031164,-0.015262],[3.8e-05,0.012745,-0.041413,-0.013438],[3.7e-05,0.027092,-0.057189,-0.011526],[3.7e-05,0.031444,-0.068908,-0.009845],[-0.002571,0.03464,-0.07109,-0.008469],[-0.003305,0.037609,-0.072494,-0.007368],[-0.004774,0.039367,-0.073692,-0.006363],[-0.005989,0.041343,-0.074901,-0.005418],[-0.006162,0.042801,-0.076192,-0.00457],[-0.013629,0.044245,-0.077511,-0.004026],[-0.01304,0.045692,-0.078535,-0.003911],[-0.011195,0.047022,-0.079177,-0.00227],[-0.009645,0.047825,-0.079437,-0.001154],[-0.008587,0.04775,-0.079721,3.8e-05],[-0.007939,0.0488,-0.080124,0.011168],[-0.007541,0.053344,-0.079921,0.013484],[-0.007238,0.054988,-0.07946,0.015305],[-0.006948,0.055624,-0.078879,0.021801],[-0.006535,0.055878,-0.078117,0.026031],[-0.006621,0.057032,-0.088963,0.032486],[-0.00583,0.057403,-0.089877,0.034118],[-0.00582,0.059597,-0.090874,0.035742],[-0.006087,0.060176,-0.09187,0.036196],[-0.006003,0.061991,-0.092867,0.036651],[-0.005722,0.062137,-0.093858,0.037105],[-0.005947,0.062268,-0.094787,0.036963],[-0.005562,0.062819,-0.095448,0.036721],[-0.00517,0.063538,-0.095895,0.036704],[-0.005113,0.06398,-0.096343,0.036754],[-0.00501,0.064032,-0.096962,0.036723],[-0.004876,0.064514,-0.09759,0.035508],[-0.004627,0.06517,-0.098218,0.035217],[-0.004,0.065894,-0.098846,0.049107],[-0.002418,0.06629,-0.098987,0.062923],[-0.003088,0.066477,-0.099085,0.068204],[-0.004249,0.066593,-0.098748,0.071509],[-0.011464,0.066658,-0.098203,0.072788],[-0.02374,0.06705,-0.098629,0.074008],[-0.021983,0.067846,-0.098867,0.075427],[-0.020005,0.068289,-0.098815,0.07641],[-0.021013,0.068733,-0.098532,0.078314],[-0.022066,0.068715,-0.098249,0.080127],[-0.022678,0.068537,-0.097877,0.080621],[-0.023798,0.068554,-0.097236,0.080722],[-0.024417,0.068571,-0.096594,0.080513],[-0.024764,0.068426,-0.095953,0.080039],[-0.024962,0.068187,-0.094807,0.08035],[-0.024981,0.067526,-0.094083,0.08098],[-0.024553,0.066853,-0.094408,0.08153],[-0.023718,0.067506,-0.094371,0.081391],[-0.021915,0.067681,-0.09394,0.081252],[-0.020013,0.067856,-0.093508,0.080726],[-0.018109,0.068031,-0.092861,0.08132],[-0.017022,0.067874,-0.090663,0.081506],[-0.016219,0.067736,-0.090058,0.080988],[-0.015527,0.067711,-0.089453,0.080765],[-0.014892,0.067669,-0.088847,0.080203],[-0.014172,0.067584,-0.088345,0.07963],[-0.013411,0.06734,-0.088764,0.078706],[6.5e-05,0.067097,-0.088055,0.077169],[8.2e-05,0.066841,-0.087221,0.076358],[3.4e-05,0.066143,-0.086324,0.07564],[2.4e-05,0.065445,-0.085172,0.074801],[9e-06,0.064742,-0.084572,0.07389],[1.3e-05,0.063601,-0.083758,0.072848],[1.8e-05,0.063051,-0.083496,0.071216],[1.5e-05,0.062467,-0.082866,0.066067],[1.7e-05,0.061452,-0.08136,0.064417],[3.4e-05,0.060229,-0.079477,0.064539],[0.000142,0.059005,-0.078266,0.064305],[0.000269,0.057782,-0.07681,0.063789],[0.000246,0.056745,-0.075447,0.061832],[0.000181,0.054607,-0.073849,0.060009],[0.00016,0.053265,-0.072154,0.05887],[9.7e-05,0.051901,-0.068333,0.05587],[0.000102,0.049131,-0.067912,0.051826],[6.3e-05,0.047105,-0.066736,0.049324],[7.8e-05,0.045699,-0.065064,0.046081],[0.000105,0.043381,-0.06317,0.044141],[0.000184,0.040582,-0.059054,0.040635],[0.000261,0.037204,-0.057804,0.039129],[0.000257,0.035037,-0.056386,0.030509],[0.000286,0.031605,-0.04914,0.028332],[0.000589,0.028905,-0.047144,0.026021],[0.001087,0.025483,-0.045675,0.013655],[0.003164,0.020176,-0.042114,0.002158],[0.006138,0.016785,-0.030757,-0.001278],[0.010755,0.010755,-0.023478,-0.023478]],"right":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,[-0.012745,-0.005005,-0.041413,-0.034598],[-0.027091,-0.001478,-0.057189,-0.012863],[-0.031443,-0.000537,-0.068908,-0.010715],[-0.034639,0.002572,-0.07109,-0.009237],[-0.037607,0.003306,-0.072494,-0.008077],[-0.039369,0.004644,-0.073692,-0.007179],[-0.041342,0.005997,-0.074901,-0.006243],[-0.042802,0.006187,-0.076192,-0.005657],[-0.044245,0.013631,-0.077511,-0.005786],[-0.04569,0.01304,-0.078535,-0.004018],[-0.047024,0.011195,-0.079177,-0.00227],[-0.047825,0.009645,-0.079437,-0.001154],[-0.047749,0.008588,-0.079721,3.8e-05],[-0.0488,0.007939,-0.080124,0.011168],[-0.053345,0.007552,-0.079921,0.013484],[-0.054986,0.007248,-0.07946,0.015305],[-0.055622,0.006947,-0.078879,0.021801],[-0.055878,0.006535,-0.078117,0.026031],[-0.057031,0.006592,-0.088963,0.032486],[-0.057406,0.00526,-0.089877,0.034118],[-0.059595,0.005716,-0.090874,0.035742],[-0.060174,0.006024,-0.09187,0.036196],[-0.061994,0.005854,-0.092867,0.036651],[-0.06214,0.005611,-0.093858,0.037105],[-0.062271,0.005947,-0.094787,0.036963],[-0.062823,0.005562,-0.095448,0.036721],[-0.063542,0.005017,-0.095895,0.036704],[-0.063984,0.004806,-0.096343,0.036754],[-0.064033,0.004533,-0.096962,0.036723],[-0.064516,0.004262,-0.09759,0.035508],[-0.06517,0.003899,-0.098218,0.035217],[-0.065896,0.003253,-0.098846,0.049107],[-0.066291,0.002199,-0.098987,0.062923],[-0.066475,0.003088,-0.099085,0.068204],[-0.066592,0.004249,-0.098748,0.071509],[-0.066661,0.011464,-0.098203,0.072788],[-0.067048,0.02374,-0.098629,0.074008],[-0.067845,0.021983,-0.098867,0.075427],[-0.068288,0.020005,-0.098815,0.07641],[-0.068732,0.021013,-0.098532,0.078314],[-0.068714,0.022067,-0.098249,0.080127],[-0.068536,0.022678,-0.097877,0.080621],[-0.068553,0.023798,-0.097236,0.080722],[-0.06857,0.024413,-0.096594,0.080513],[-0.068428,0.024762,-0.095953,0.080039],[-0.068188,0.024963,-0.094807,0.08035],[-0.067525,0.024982,-0.094083,0.08098],[-0.066853,0.024554,-0.094408,0.08153],[-0.067506,0.023719,-0.094371,0.081391],[-0.067681,0.021915,-0.09394,0.081252],[-0.067856,0.020013,-0.093508,0.080726],[-0.06803,0.018109,-0.092861,0.08132],[-0.067874,0.017023,-0.090663,0.081506],[-0.067736,0.016218,-0.090058,0.080988],[-0.067711,0.015524,-0.089453,0.080765],[-0.06767,0.014893,-0.088847,0.080203],[-0.067584,0.014172,-0.088345,0.07963],[-0.067341,0.013412,-0.088764,0.078706],[-0.067097,-6.6e-05,-0.088055,0.077169],[-0.066841,-8.3e-05,-0.087221,0.076358],[-0.066143,-3.4e-05,-0.086324,0.07564],[-0.065446,-2.4e-05,-0.085172,0.074801],[-0.064743,-9e-06,-0.084572,0.07389],[-0.063602,-1.3e-05,-0.083758,0.072848],[-0.063052,-1.8e-05,-0.083496,0.071216],[-0.062466,-1.5e-05,-0.082866,0.066067],[-0.061451,-1.7e-05,-0.08136,0.064417],[-0.060229,-3.4e-05,-0.079477,0.064539],[-0.059006,-0.000142,-0.078266,0.064305],[-0.057784,-0.000268,-0.07681,0.063789],[-0.056743,-0.000243,-0.075447,0.061832],[-0.054606,-0.000177,-0.073849,0.060009],[-0.053265,-0.000158,-0.072154,0.05887],[-0.0519,-0.0001,-0.068333,0.05587],[-0.049131,-0.000105,-0.067912,0.051826],[-0.047105,-6.5e-05,-0.066736,0.049324],[-0.045699,-8.1e-05,-0.065064,0.046081],[-0.043379,-0.000108,-0.06317,0.044141],[-0.040583,-0.000183,-0.059054,0.040635],[-0.037205,-0.000257,-0.057804,0.039129],[-0.035038,-0.000252,-0.056386,0.030509],[-0.031604,-0.000286,-0.04914,0.028332],[-0.028902,-0.000585,-0.047144,0.026021],[-0.025483,-0.001088,-0.045675,0.013655],[-0.020177,-0.003166,-0.042114,0.002158],[-0.016785,-0.00614,-0.030757,-0.001278],[-0.010756,-0.010756,-0.023478,-0.023478]]};
    const AX_SZ=256;
    const AX_HIT_SZ=384; // Original tract marker coordinates
    const AX_NAMES={
      1:['大脳皮質','Cerebral cortex'],2:['大脳白質','Cerebral white matter'],
      3:['小脳','Cerebellum'],4:['脳幹','Brainstem'],
      5:['間脳','Diencephalon'],6:['深部灰白質','Deep gray matter'],
      7:['尾状核','Caudate nucleus'],8:['被殻','Putamen'],
      9:['淡蒼球','Globus pallidus'],10:['視床','Thalamus'],
      11:['脳室','Ventricles']
    };
    // Broad-category atlas annotations: these categories are illustrative,
    // NOT single subnuclei or clinical MRI segmentations.
    const AX_FACTS={
      1:['大脳皮質は局所の機能に応じた領域分化を持ちます。中心前回は一次運動野、中心後回は一次体性感覚野です。','局在により運動・感覚・言語・視空間などの高次機能障害が異なります。'],
      2:['大脳白質は皮質間の連合線維、左右半球を結ぶ交連線維、皮質と下位中枢を結ぶ投射線維からなります。','内包後脚の小病巣でも多数の投射線維が密集するため、顕著な運動・感覚障害が生じます。'],
      3:['小脳は姿勢・平衡、運動タイミング、誤差修正と協調運動に関わります。皮質・深部小脳核・小脳脚は機能が異なります。','障害では運動失調、測定障害、構音障害、体幹失調などが生じます。'],
      4:['脳幹は中脳・橋・延髄を含み、脳神経核、網様体と多くの上行・下行伝導路が通過します。','交代性症候や意識・呼吸循環の障害など、病巣レベルで症候が異なります。'],
      5:['間脳には視床・視床下部などがあり、感覚中継と運動系・自律機能の調節に関わります。','病巣部位により感覚障害、注意・覚醒障害、自律神経障害などがみられます。'],
      6:['基底核を含む深部灰白質は皮質‐基底核‐視床‐皮質回路などを形成します。','運動調節障害、筋緊張異常、遂行機能障害などに関係します。'],
      7:['尾状核は線条体の一部で、皮質入力を受けて行動選択、学習、認知・運動回路に関わります。','尾状核・内包前脚近傍の障害で意欲・遂行機能・運動面の変化が生じえます。'],
      8:['被殻は線条体の一部で、運動関連皮質から入力を受けます。外側を外包、内側を淡蒼球が占めます。','被殻出血では隣接する内包への進展・圧排が片麻痺の重要な要因になります。'],
      9:['淡蒼球は外節と内節に分かれ、内節は大脳基底核の主要出力核の一つです。','障害は筋緊張や運動開始・制御の異常と関連します。'],
      10:['視床は感覚・運動・連合系の情報を中継します。外側に内包後脚、内側に第三脳室があります。','視床出血・梗塞では半身感覚障害が典型的で、内包に及ぶと運動障害も伴います。'],
      11:['脳室は脳脊髄液で満たされた空間で、側脳室・第三脳室・中脳水道・第四脳室へ連なります。','出血による脳室内進展や髄液循環障害は水頭症につながることがあります。']
    };
    const AX_COLORS=[
      '#131d2a', '#a6b9cf', '#e0e7ef', '#9fb6d8', '#dca36b',
      '#6e9ece', '#c39bcb', '#e9bc50', '#ed7d66', '#a67acb',
      '#39b8a0', '#245f91'
    ];
    const AX_DATA={"rows":["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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgYAsIAAW/rLwEAAAAASUVORK5CYII="],"frames":[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[[294,173.1,181.8]],[[294,174.8,181.0],[295,191.0,177.6]],[[75,187.0,170.4],[76,190.8,171.0],[85,180.4,171.4],[86,203.4,170.9],[129,226.6,234.1],[294,177.4,179.9],[295,192.4,179.3]],[[75,187.1,168.9],[76,192.0,170.6],[80,187.4,169.8],[81,183.8,168.7],[83,181.2,169.1],[84,187.1,169.6],[85,180.9,169.9],[86,202.5,169.1],[97,202.7,215.7],[128,167.2,238.4],[129,227.3,232.4],[188,184.5,170.9],[203,185.0,229.3],[294,179.5,180.1],[295,193.7,181.0]],[[75,186.4,168.2],[76,194.2,168.9],[79,190.4,167.9],[80,189.0,169.3],[81,183.5,168.4],[82,209.0,169.0],[83,180.7,168.5],[84,187.9,168.8],[85,181.3,168.3],[86,201.8,167.8],[97,202.5,215.8],[128,170.4,234.9],[129,219.2,206.7],[188,181.7,172.6],[189,203.2,170.3],[203,185.8,221.4],[294,180.9,180.9],[295,194.7,182.6]],[[75,185.5,167.8],[76,195.5,168.1],[79,190.6,167.8],[80,189.8,168.4],[81,182.9,167.1],[82,208.4,168.5],[83,178.2,167.4],[84,193.2,167.8],[85,181.4,166.7],[86,201.6,167.4],[97,201.9,216.1],[98,158.5,219.1],[128,171.5,237.4],[129,217.4,205.1],[188,175.8,177.1],[189,205.5,176.2],[203,184.9,216.8],[294,182.0,182.0],[295,195.4,183.8],[354,161.6,212.0]],[[75,184.4,167.5],[76,197.0,167.9],[79,190.5,167.6],[80,190.9,167.9],[81,182.2,165.9],[82,207.8,166.8],[83,176.0,166.7],[84,199.4,166.4],[85,181.0,165.8],[86,201.7,167.5],[97,201.5,216.1],[98,164.1,212.0],[128,171.5,233.0],[129,217.3,213.1],[188,174.4,179.6],[189,206.1,179.6],[203,192.3,206.2],[294,182.9,183.2],[295,195.8,184.8],[354,191.2,210.2]],[[75,183.3,167.4],[76,198.4,168.0],[79,190.1,167.6],[80,192.7,167.6],[81,181.6,164.8],[82,208.2,165.7],[83,173.8,166.2],[84,203.4,165.6],[85,180.5,165.7],[86,202.3,167.7],[97,201.7,215.3],[98,167.2,206.3],[128,170.3,220.2],[129,218.0,198.6],[188,173.6,181.5],[189,206.5,182.6],[203,192.4,176.9],[294,183.8,184.6],[295,196.0,185.6],[354,190.5,205.0]],[[75,182.1,167.4],[76,199.8,168.1],[79,189.3,167.6],[80,194.5,168.0],[81,180.5,163.7],[82,209.1,165.0],[83,171.8,166.5],[84,206.6,166.3],[85,179.7,165.9],[86,202.8,167.9],[97,202.6,213.2],[98,169.2,201.9],[128,172.5,218.8],[129,215.9,199.0],[188,173.3,183.5],[189,206.8,184.4],[294,184.4,185.6],[295,196.1,186.3],[354,190.9,202.0]],[[75,180.7,167.5],[76,201.3,168.2],[79,188.4,167.6],[80,196.2,168.5],[81,178.9,162.7],[82,210.1,165.0],[83,170.1,167.2],[84,209.0,167.6],[85,178.8,166.4],[86,203.7,168.2],[97,204.4,208.9],[98,170.9,198.2],[128,174.3,218.2],[188,173.3,184.9],[189,206.9,185.6],[294,185.0,186.6],[295,196.1,186.8],[354,190.4,199.7]],[[75,179.5,167.6],[76,202.9,168.4],[79,187.2,167.7],[80,197.9,169.2],[81,177.2,162.6],[82,211.4,165.5],[83,168.5,168.0],[84,211.1,168.8],[85,177.7,166.8],[86,204.8,168.6],[97,206.1,203.4],[98,172.4,195.2],[128,176.3,218.0],[188,173.4,186.0],[189,207.1,186.6],[294,185.6,187.4],[295,196.0,187.0],[354,190.7,197.7]],[[75,178.2,167.9],[76,204.7,168.6],[79,185.8,167.9],[80,199.7,169.8],[81,175.5,162.9],[82,212.9,166.2],[83,166.8,168.9],[84,213.2,170.1],[85,176.4,167.3],[86,206.1,169.0],[97,206.4,198.5],[98,174.1,192.7],[128,178.3,218.3],[188,173.5,186.9],[189,207.3,187.4],[294,186.3,188.2],[295,195.9,187.2],[354,191.0,195.7]],[[75,176.6,168.2],[76,206.3,168.9],[79,184.3,168.1],[80,201.5,170.3],[81,174.0,163.5],[82,214.6,167.0],[83,165.2,169.8],[84,214.9,171.2],[85,174.9,167.9],[86,207.5,169.5],[97,205.6,194.6],[98,176.0,190.6],[128,180.1,219.3],[188,173.6,187.7],[189,207.7,188.0],[294,186.6,188.4],[295,195.8,187.1],[354,191.2,194.3]],[[75,175.0,168.7],[76,208.0,169.2],[79,182.6,168.3],[80,203.3,170.7],[81,172.2,164.4],[82,216.4,168.0],[83,163.5,170.7],[84,216.6,172.4],[85,173.3,168.5],[86,209.2,170.1],[97,203.9,191.9],[98,178.9,188.7],[128,181.1,220.9],[134,99.1,130.0],[188,173.6,188.3],[189,208.2,188.5],[294,187.0,188.6],[295,195.8,186.9],[354,191.5,192.6]],[[36,307.2,209.6],[75,173.4,169.2],[76,209.7,169.6],[79,180.9,168.6],[80,205.2,171.1],[81,170.2,165.5],[82,218.1,169.0],[83,161.9,171.7],[84,218.2,173.6],[85,171.6,169.2],[86,210.9,170.7],[97,201.5,189.7],[98,181.9,187.7],[128,182.8,223.6],[134,100.0,141.0],[188,173.5,188.7],[189,208.9,188.9],[294,187.3,188.6],[295,195.8,186.5],[354,191.7,191.2]],[[36,306.6,209.8],[75,171.8,169.7],[76,211.5,170.0],[79,179.1,168.9],[80,207.0,171.3],[81,168.1,166.7],[82,220.2,170.3],[83,160.5,172.7],[84,219.8,174.9],[85,169.7,169.9],[86,212.9,171.4],[97,198.0,187.9],[98,185.5,187.2],[128,184.6,228.0],[134,100.7,152.3],[135,277.0,121.8],[188,172.9,189.2],[189,209.7,189.3],[294,187.5,188.2],[295,196.0,186.0],[354,192.1,189.8],[416,112.5,119.2],[417,270.2,132.4]],[[36,303.0,211.8],[75,169.9,170.5],[76,213.3,170.5],[79,177.2,169.2],[80,208.7,171.5],[81,165.6,168.4],[82,222.4,171.8],[83,158.9,173.9],[84,221.5,176.2],[85,167.7,170.7],[86,214.9,172.2],[97,193.3,186.9],[98,190.0,187.2],[128,185.4,234.6],[134,101.2,166.1],[135,278.7,135.1],[188,172.0,189.6],[189,210.8,189.6],[294,187.6,187.5],[295,196.4,185.3],[354,192.6,188.5],[416,112.3,131.9],[417,269.4,134.0]],[[36,299.4,214.7],[75,168.3,171.2],[76,215.4,171.2],[79,175.4,169.6],[80,210.3,171.5],[81,163.2,170.1],[82,224.7,173.5],[83,157.3,175.1],[84,223.2,177.5],[85,165.7,171.5],[86,217.0,173.0],[97,187.5,186.6],[98,194.8,187.4],[128,185.6,240.9],[134,110.9,201.2],[135,280.8,163.9],[188,171.2,189.8],[189,211.9,189.8],[245,185.5,301.6],[246,202.6,291.6],[294,187.4,186.4],[295,197.1,184.3],[354,192.6,187.4],[416,115.9,152.3],[417,268.1,133.9]],[[36,295.9,218.2],[75,166.5,171.9],[76,217.6,172.0],[79,173.6,169.9],[80,212.0,171.4],[81,160.6,172.1],[82,227.1,175.3],[83,155.8,176.4],[84,224.9,179.0],[85,163.6,172.4],[86,219.2,173.8],[97,181.8,186.7],[98,199.3,187.6],[134,112.8,190.5],[135,280.6,170.7],[188,169.9,190.1],[189,213.5,190.2],[245,176.7,297.2],[246,203.1,292.5],[294,187.1,185.0],[295,198.2,183.1],[416,120.2,155.4],[417,264.1,139.7]],[[35,90.6,203.6],[36,292.6,222.2],[75,164.8,172.7],[76,219.5,172.7],[79,171.8,170.3],[80,213.5,171.0],[81,157.9,174.6],[82,230.3,178.4],[83,154.4,178.2],[84,226.9,180.7],[85,161.5,173.5],[86,221.4,174.8],[90,225.1,284.9],[97,177.7,186.8],[98,203.5,187.6],[134,107.3,177.8],[135,274.6,217.8],[188,168.3,190.4],[189,215.2,190.6],[245,161.0,287.6],[246,205.1,294.1],[294,186.4,183.3],[295,199.6,181.8],[416,121.7,155.3],[417,257.9,151.2]],[[35,91.5,203.4],[36,289.7,226.1],[75,163.0,173.6],[76,221.4,173.5],[79,170.0,170.7],[80,214.8,170.5],[81,158.0,237.4],[82,237.0,184.4],[83,154.4,180.5],[84,228.5,182.6],[85,159.2,174.5],[86,223.8,175.8],[90,233.8,279.9],[97,174.5,186.6],[98,207.3,187.3],[132,128.1,230.7],[134,100.5,171.1],[135,271.6,227.7],[188,166.6,190.8],[189,217.1,191.0],[245,149.8,278.9],[246,230.4,287.1],[294,185.2,181.2],[295,201.5,180.3],[416,122.9,154.2],[417,257.5,151.6]],[[8,174.1,196.8],[35,92.2,203.4],[36,287.4,229.4],[75,161.3,174.9],[76,222.9,175.2],[79,168.3,171.2],[80,215.7,170.0],[81,153.8,257.2],[82,242.4,188.2],[83,154.2,182.7],[84,229.1,184.1],[85,156.7,174.9],[86,227.0,175.9],[90,242.7,272.8],[97,171.9,186.3],[98,210.6,186.8],[132,125.2,222.8],[133,268.0,183.7],[134,109.0,206.4],[135,268.4,236.5],[188,164.7,191.2],[189,219.1,191.4],[245,149.5,258.0],[246,231.0,287.0],[294,183.4,179.2],[295,203.3,178.8],[416,124.6,152.6],[417,254.4,148.3]],[[8,169.0,198.1],[9,208.4,198.9],[35,92.2,203.5],[36,285.3,232.2],[75,160.0,176.9],[76,224.9,176.3],[79,167.0,171.9],[80,216.6,168.9],[81,145.8,230.6],[82,243.8,189.1],[83,153.7,184.8],[84,229.4,185.5],[85,154.5,174.7],[86,229.9,175.5],[90,249.3,265.6],[97,169.4,185.8],[98,213.6,186.1],[132,126.7,228.4],[133,250.0,240.6],[134,111.8,222.3],[135,265.4,244.3],[188,162.6,191.7],[189,221.1,192.0],[210,90.9,163.7],[245,147.4,227.6],[246,237.6,280.3],[294,182.0,178.3],[295,204.6,178.0],[416,131.7,145.3],[417,250.2,142.5]],[[8,163.6,198.7],[9,218.8,198.4],[35,90.9,202.4],[36,283.5,234.5],[75,159.2,178.7],[76,228.0,173.3],[79,166.4,172.6],[80,218.6,166.9],[81,141.7,227.7],[82,251.4,242.1],[83,152.7,186.8],[84,229.4,186.9],[85,151.8,174.0],[86,232.2,175.3],[90,253.8,259.3],[97,167.0,185.4],[98,216.4,185.3],[132,127.1,230.6],[133,253.2,237.0],[134,113.2,231.1],[135,262.8,250.6],[188,160.4,192.3],[189,223.3,192.6],[210,96.8,173.9],[245,135.9,218.2],[246,256.2,222.3],[283,251.9,268.3],[294,180.8,177.8],[295,206.8,177.0],[416,144.5,134.7],[417,248.0,143.2]],[[8,155.9,199.5],[9,238.6,199.7],[35,88.2,200.6],[36,281.8,236.4],[75,158.1,180.4],[76,231.1,173.3],[79,166.3,173.2],[80,219.1,165.4],[81,137.3,220.2],[82,252.3,245.2],[83,150.4,188.5],[84,232.4,189.4],[85,149.8,174.8],[86,234.3,175.6],[87,177.9,137.3],[88,226.9,114.6],[89,129.9,237.3],[90,256.7,253.8],[97,164.6,185.0],[98,219.0,184.6],[132,141.3,218.4],[133,231.2,224.7],[134,113.7,234.3],[135,259.9,257.6],[188,158.2,193.1],[189,225.4,193.4],[210,98.7,173.6],[245,141.8,222.8],[246,255.4,223.7],[282,137.9,270.2],[283,252.2,266.7],[294,176.8,172.6],[295,209.7,176.0],[416,151.7,124.0],[417,237.0,131.5]],[[8,147.1,202.9],[9,253.1,203.3],[32,164.4,110.5],[35,90.2,205.9],[36,280.3,238.0],[75,157.1,181.1],[76,233.5,175.4],[79,164.2,172.5],[80,219.5,163.7],[81,130.9,222.0],[82,253.2,236.6],[83,147.9,190.3],[84,236.0,191.4],[85,148.7,176.6],[86,237.1,177.0],[87,176.9,133.0],[88,220.2,102.6],[89,126.9,232.8],[90,258.6,249.5],[97,162.1,184.7],[98,221.4,184.2],[132,144.0,222.2],[133,229.3,217.0],[135,257.2,263.7],[188,155.9,194.1],[189,227.6,194.4],[210,101.3,175.0],[211,301.8,151.6],[246,227.1,207.8],[282,138.3,268.8],[283,252.2,265.1],[294,173.1,168.4],[295,213.3,174.6],[416,153.4,116.1],[417,231.2,122.3]],[[8,137.4,209.9],[9,260.5,209.4],[32,162.9,109.6],[35,105.1,231.3],[36,278.8,239.4],[75,117.9,167.2],[76,260.6,170.0],[79,158.1,170.3],[80,221.1,160.8],[81,128.0,220.7],[82,250.0,245.5],[83,146.0,192.5],[84,238.2,193.4],[85,146.8,178.3],[86,239.8,179.7],[87,170.3,117.8],[88,222.6,106.2],[89,132.5,246.5],[90,259.4,246.2],[92,256.1,205.3],[97,159.6,184.6],[98,223.7,184.1],[132,144.8,217.3],[133,227.4,213.3],[135,254.6,269.6],[188,153.6,195.3],[189,229.7,195.4],[210,118.1,209.6],[211,306.3,171.2],[246,222.9,210.1],[282,139.1,264.9],[283,250.8,266.0],[294,167.9,163.0],[295,216.2,174.0],[416,153.1,100.7],[417,229.2,116.6]],[[8,131.0,216.2],[9,263.4,216.7],[32,163.1,104.9],[35,107.1,233.6],[36,277.3,240.6],[75,124.4,170.2],[76,267.8,169.8],[79,157.2,171.2],[80,225.7,156.5],[83,144.7,194.9],[84,239.6,195.5],[85,144.5,180.3],[86,241.8,182.7],[87,165.3,106.9],[88,231.2,123.5],[89,134.8,261.5],[90,259.6,243.4],[92,255.9,206.3],[97,157.7,184.7],[98,226.0,184.6],[132,146.7,221.2],[133,241.8,130.7],[135,252.1,275.0],[188,151.3,196.8],[189,231.6,196.5],[210,119.7,212.5],[211,297.0,194.8],[246,219.5,210.9],[282,142.7,266.6],[283,252.8,256.7],[294,159.5,157.1],[295,221.0,172.8],[416,149.4,92.6],[417,228.3,97.8]],[[8,128.6,220.5],[9,263.9,223.8],[32,162.8,104.7],[35,108.6,235.5],[36,275.9,241.6],[75,113.3,168.7],[76,271.7,171.0],[79,153.4,169.2],[80,231.1,152.5],[83,143.7,197.3],[84,240.8,197.7],[85,143.4,184.3],[86,242.8,185.0],[87,161.7,103.0],[88,233.2,125.5],[89,139.9,272.4],[90,259.1,241.8],[92,255.2,207.9],[97,156.1,185.3],[98,227.9,185.8],[132,146.8,215.9],[133,240.6,127.9],[135,249.8,280.0],[188,149.1,198.6],[189,233.6,198.0],[210,121.9,216.2],[211,281.7,208.1],[246,216.1,209.0],[282,143.5,264.8],[283,259.1,229.3],[294,153.0,152.4],[295,225.7,171.8],[416,141.7,87.0],[417,229.4,91.2]],[[8,128.0,224.1],[9,263.5,230.5],[32,154.4,130.2],[35,110.0,237.3],[36,274.4,242.4],[75,110.1,170.2],[76,276.7,172.5],[79,149.1,167.2],[80,234.3,148.7],[83,142.7,199.8],[84,241.8,200.1],[85,142.2,188.0],[86,243.9,187.0],[87,153.1,101.3],[88,236.1,129.4],[89,150.8,290.4],[90,258.1,240.8],[92,254.3,209.5],[97,155.1,186.2],[98,229.7,187.7],[132,147.4,214.8],[133,242.8,123.2],[135,247.5,284.9],[188,147.0,201.0],[189,235.5,199.6],[210,124.5,220.8],[211,272.1,216.5],[246,214.2,207.4],[282,140.5,256.2],[283,255.0,226.1],[294,150.0,149.4],[295,249.0,130.3],[417,229.9,88.2]],[[8,128.8,227.7],[9,262.6,238.0],[32,153.4,132.7],[35,111.1,238.7],[36,272.8,243.1],[75,107.5,172.4],[76,273.6,176.5],[79,147.3,166.7],[80,236.3,145.7],[83,142.1,202.8],[84,242.6,202.5],[85,141.1,190.7],[86,245.0,188.2],[87,150.0,103.3],[88,238.3,133.3],[89,152.9,292.8],[90,256.7,240.6],[92,253.3,211.9],[97,154.4,187.3],[98,231.6,190.2],[132,144.5,170.5],[133,246.4,116.7],[135,245.3,289.6],[188,145.2,203.6],[189,237.2,201.5],[210,126.8,225.2],[211,265.1,223.8],[282,132.0,236.3],[283,250.2,224.1],[294,148.5,146.2],[295,255.5,116.2],[417,230.3,86.3]],[[8,129.9,231.7],[9,261.7,245.0],[32,152.6,134.9],[35,112.4,239.9],[36,271.3,243.6],[75,109.5,176.0],[76,273.8,179.2],[79,145.6,164.1],[80,240.1,141.4],[83,141.6,206.3],[84,243.3,205.0],[85,140.1,193.1],[86,246.3,189.7],[87,145.6,116.0],[88,240.0,136.8],[89,156.7,293.1],[90,255.0,241.0],[92,251.5,211.5],[97,151.0,186.6],[98,233.8,193.1],[132,145.7,161.6],[133,244.8,113.5],[135,243.4,293.7],[188,143.7,206.6],[189,238.7,203.7],[210,129.1,229.6],[211,260.4,230.0],[282,133.8,237.7],[283,246.0,224.3],[294,145.7,142.2],[295,255.3,119.6],[417,230.4,85.7]],[[8,131.4,235.8],[9,261.3,251.9],[32,151.9,136.6],[35,113.7,240.5],[36,270.1,243.6],[75,110.3,178.5],[76,274.9,181.5],[79,145.0,156.4],[80,242.8,139.0],[83,141.3,210.8],[84,243.8,207.5],[85,139.2,195.5],[86,247.7,191.3],[87,144.1,119.1],[88,241.1,139.7],[89,158.9,295.5],[90,253.2,242.0],[92,249.8,212.0],[97,147.1,185.7],[98,235.8,196.0],[132,155.1,190.0],[133,243.5,109.6],[135,241.6,297.6],[188,142.5,209.9],[189,240.1,206.1],[210,131.2,233.8],[211,256.6,235.9],[282,135.7,239.7],[283,243.0,226.4],[294,142.7,137.8],[295,253.5,126.2],[366,239.6,88.6],[384,134.7,237.8],[417,230.5,85.4]],[[8,132.9,239.5],[9,261.6,256.5],[32,151.6,138.0],[35,115.0,240.0],[36,268.6,243.4],[75,111.5,181.4],[76,272.7,184.7],[79,142.6,150.5],[80,244.8,136.8],[83,141.2,215.0],[84,244.1,209.9],[85,138.5,197.9],[86,248.8,192.8],[87,146.3,126.0],[88,242.0,142.5],[89,160.9,297.5],[90,251.6,243.1],[92,243.1,191.9],[97,144.9,186.4],[98,237.5,198.7],[132,158.0,196.5],[133,241.6,105.7],[135,239.7,301.5],[188,141.5,213.6],[189,241.4,209.1],[210,133.1,237.9],[211,253.5,241.5],[282,137.5,242.2],[283,241.6,229.3],[294,140.8,132.9],[295,249.4,130.3],[366,239.3,89.1],[368,284.0,163.9],[384,136.4,233.0]],[[8,133.9,242.4],[32,151.4,139.2],[35,116.4,238.4],[36,267.5,242.8],[75,113.4,184.2],[76,271.8,187.4],[79,141.3,145.8],[80,245.6,135.2],[83,141.3,219.5],[84,244.3,212.6],[85,138.0,200.5],[86,249.7,194.3],[87,146.5,128.0],[88,242.4,144.8],[90,249.7,244.9],[92,241.7,191.3],[97,143.2,187.0],[98,238.6,200.8],[110,99.5,171.2],[111,284.1,167.2],[132,161.4,197.7],[133,238.8,102.2],[135,238.0,305.1],[188,140.9,217.5],[189,242.3,212.0],[210,134.9,241.6],[211,251.0,247.1],[282,139.5,245.3],[283,240.7,232.8],[294,140.3,128.0],[295,245.0,135.7],[366,238.8,101.9],[368,283.4,169.1],[384,137.2,228.2],[385,240.5,214.5]],[[8,134.2,244.0],[32,151.3,140.1],[33,237.3,161.4],[35,117.8,234.8],[36,266.6,241.4],[75,116.0,187.1],[76,270.0,190.0],[79,140.9,141.8],[80,245.6,133.6],[83,141.6,224.5],[84,244.4,215.5],[85,137.7,203.2],[86,250.3,195.8],[87,147.4,130.7],[88,242.5,147.3],[90,247.9,247.0],[92,240.1,192.8],[97,141.8,187.2],[98,239.4,202.6],[110,101.1,173.9],[111,279.8,168.5],[132,161.1,158.1],[133,235.9,99.7],[135,236.6,308.2],[188,140.5,221.5],[189,243.0,215.2],[210,136.8,245.5],[211,249.0,252.0],[282,141.4,248.4],[283,240.1,236.8],[294,141.0,123.9],[295,245.0,135.1],[365,119.8,255.6],[366,239.0,107.6],[367,75.2,170.8],[368,284.0,190.2],[384,137.4,221.2],[385,241.9,211.7]],[[32,151.3,140.6],[33,238.6,150.9],[35,113.1,199.3],[36,266.0,238.5],[75,121.2,189.2],[76,267.1,191.6],[79,141.2,138.5],[80,244.8,132.2],[83,142.1,230.2],[84,244.4,218.4],[85,137.5,205.9],[86,250.7,197.2],[87,148.4,132.6],[88,242.4,149.1],[90,246.4,249.1],[92,238.3,190.1],[97,140.6,186.9],[98,240.2,204.8],[110,105.2,176.4],[111,281.1,173.3],[132,154.5,76.9],[133,233.5,98.2],[135,235.3,311.1],[188,140.4,225.7],[189,243.5,218.6],[210,138.6,249.4],[211,247.4,256.8],[282,143.2,251.8],[283,239.9,240.5],[294,142.5,121.3],[365,120.4,255.8],[366,241.5,116.2],[367,86.8,204.6],[368,283.4,209.0],[384,135.0,219.3],[385,243.9,213.7]],[[32,151.6,141.6],[33,238.6,143.2],[35,113.3,194.0],[36,279.4,188.3],[76,264.7,191.9],[79,142.3,135.6],[80,243.7,131.0],[83,142.8,235.9],[84,244.2,221.3],[85,137.6,208.6],[86,250.7,198.6],[87,150.0,134.8],[88,242.0,151.3],[90,244.8,251.9],[92,236.2,190.8],[97,139.8,185.6],[98,240.9,207.1],[110,105.1,179.1],[111,279.3,176.1],[132,147.7,78.3],[133,232.3,97.9],[135,234.2,313.6],[188,140.6,230.4],[189,243.8,222.1],[210,140.2,253.0],[211,246.0,261.5],[282,145.0,255.1],[283,239.6,244.5],[294,144.2,119.8],[365,121.1,256.4],[366,250.1,132.2],[367,82.4,211.5],[368,274.0,238.4],[384,134.0,215.5],[385,244.5,210.8]],[[32,152.5,142.7],[33,237.2,138.4],[35,111.0,163.3],[36,266.9,188.8],[79,144.0,132.8],[80,241.8,129.3],[83,143.9,242.6],[84,244.0,224.4],[85,137.8,211.1],[86,250.4,199.8],[87,151.4,136.4],[88,241.4,152.8],[90,243.5,254.7],[92,233.0,192.1],[97,139.7,183.3],[98,241.4,209.2],[110,105.1,180.0],[111,279.9,179.1],[133,232.2,98.6],[135,233.2,315.9],[188,141.1,234.4],[189,243.9,225.8],[210,142.0,256.8],[211,244.9,266.0],[282,146.9,258.9],[283,239.4,248.6],[294,146.2,119.0],[363,158.2,257.0],[365,121.4,257.1],[366,254.6,209.4],[367,81.9,218.5],[368,255.9,260.8],[384,133.4,212.9],[385,244.6,213.1]],[[32,153.4,143.5],[33,235.6,135.6],[35,111.5,162.0],[36,256.2,177.8],[79,146.2,130.1],[80,240.3,127.7],[83,145.1,248.5],[84,243.6,227.5],[85,138.3,213.7],[86,249.7,201.0],[87,152.9,137.8],[88,240.4,154.6],[90,242.4,257.8],[92,230.1,192.3],[97,140.5,179.7],[98,241.9,212.2],[110,105.0,180.6],[111,281.0,181.3],[133,232.7,99.5],[135,232.3,318.2],[188,141.8,238.1],[189,243.8,229.6],[210,143.8,260.7],[211,244.0,270.3],[282,148.5,262.3],[283,239.0,252.4],[294,148.6,118.6],[363,161.0,259.8],[365,113.9,183.0],[366,254.7,222.4],[367,84.6,232.7],[368,251.9,266.1],[384,131.8,218.0],[385,243.9,213.7]],[[32,154.6,144.3],[33,232.9,132.9],[35,111.6,161.8],[79,149.0,127.5],[80,238.9,126.0],[83,146.6,255.7],[84,243.2,230.7],[85,138.9,216.2],[86,248.6,202.1],[87,154.8,139.4],[88,239.4,155.9],[90,241.6,261.1],[91,141.2,195.0],[92,229.1,175.7],[97,142.1,176.9],[98,242.1,215.9],[110,105.2,181.8],[111,283.5,182.1],[133,234.6,101.7],[188,142.8,241.5],[189,243.5,233.5],[210,145.7,264.6],[211,243.4,274.5],[282,150.0,265.6],[283,238.6,256.3],[294,151.0,118.7],[363,164.6,262.7],[365,117.3,206.1],[366,256.5,210.2],[367,79.9,199.3],[368,250.0,270.3],[384,138.0,196.7],[385,242.4,214.6]],[[32,156.1,145.1],[33,231.4,133.1],[35,111.5,162.2],[79,152.0,125.0],[80,237.8,123.4],[83,148.4,263.1],[84,242.7,233.9],[85,139.6,218.6],[86,247.3,203.2],[87,156.8,140.8],[88,238.1,157.2],[90,241.2,265.0],[91,143.1,195.3],[92,228.7,151.0],[97,144.5,176.9],[98,241.8,221.7],[110,105.9,183.4],[111,276.3,181.2],[133,236.4,103.6],[188,144.1,244.5],[189,243.0,237.5],[210,147.5,268.5],[211,243.0,278.5],[282,151.4,269.1],[283,238.1,260.4],[294,153.3,119.0],[363,168.4,264.7],[364,223.3,220.3],[365,118.7,215.1],[366,251.4,208.1],[368,249.3,273.7],[384,150.2,155.7],[385,240.7,215.5]],[[32,157.7,145.9],[33,228.3,130.7],[35,111.1,163.3],[79,155.2,122.5],[80,237.7,120.4],[83,150.5,270.7],[84,242.1,237.2],[85,140.6,221.0],[86,245.6,204.1],[87,158.6,141.8],[88,236.6,158.4],[90,241.2,268.8],[91,145.2,197.6],[92,227.0,150.6],[97,146.7,179.1],[98,240.9,228.4],[110,112.7,184.8],[111,242.0,183.4],[133,238.2,105.4],[188,145.5,247.0],[189,242.1,241.9],[210,149.5,272.7],[211,243.0,282.1],[282,152.8,272.6],[283,237.6,264.1],[294,155.7,119.5],[363,169.6,255.2],[364,224.1,223.0],[365,120.6,211.8],[366,244.3,282.0],[368,249.4,276.8],[384,153.0,153.9],[385,238.4,216.5]],[[32,160.1,146.9],[33,224.3,128.4],[35,110.4,164.9],[79,158.3,119.9],[80,239.1,116.5],[83,152.6,277.5],[84,241.5,240.7],[85,141.6,222.9],[86,243.7,205.0],[87,160.5,142.8],[88,235.2,159.4],[90,241.7,272.8],[91,147.1,202.5],[92,225.7,150.7],[97,149.1,182.6],[98,239.4,236.0],[110,144.3,184.9],[111,239.6,185.0],[188,147.1,249.0],[189,241.1,246.2],[210,151.6,276.9],[211,243.3,285.9],[282,154.0,276.1],[283,236.8,268.2],[294,157.8,120.0],[363,161.9,182.5],[364,224.4,224.2],[365,121.1,195.6],[366,244.4,286.2],[368,250.1,279.9],[384,155.6,152.9],[385,236.1,217.7]],[[32,162.8,148.0],[33,223.8,129.9],[35,109.2,166.9],[79,161.4,117.3],[80,242.6,111.4],[83,155.1,285.2],[84,240.8,244.1],[85,143.0,224.9],[86,241.3,206.0],[87,162.6,143.9],[88,233.0,160.4],[90,242.9,277.5],[91,148.7,209.0],[97,151.4,186.6],[98,237.6,242.1],[110,146.5,186.6],[111,237.8,186.0],[188,149.2,250.7],[189,239.8,250.2],[210,153.9,281.3],[211,244.1,289.1],[282,155.0,279.6],[283,236.1,271.9],[294,160.2,120.8],[363,162.7,178.4],[364,224.5,227.0],[366,244.7,290.2],[368,251.5,283.1],[384,158.3,152.2],[385,233.6,218.9]],[[32,165.9,149.1],[33,222.1,129.1],[35,107.4,169.2],[79,164.1,114.6],[80,245.3,107.5],[83,157.9,292.9],[84,239.9,248.2],[85,144.5,226.6],[86,239.0,206.8],[87,164.8,144.8],[88,231.2,161.1],[90,244.9,282.4],[91,151.3,213.3],[97,153.5,190.4],[98,235.8,247.1],[110,148.2,188.1],[111,235.8,186.7],[188,151.2,251.8],[189,238.4,254.1],[210,156.7,286.4],[211,245.4,292.2],[282,155.9,283.0],[283,235.2,275.8],[294,162.6,121.5],[363,164.5,143.6],[364,223.7,225.6],[366,245.4,294.1],[368,253.5,285.9],[384,161.5,151.8],[385,230.1,197.5]],[[32,169.1,150.2],[33,219.1,129.4],[35,98.5,170.3],[79,166.4,111.6],[83,160.8,300.3],[84,239.2,251.7],[85,146.2,228.1],[86,236.7,207.7],[87,166.8,145.4],[88,229.3,161.6],[90,246.3,285.6],[91,155.1,210.9],[97,155.4,193.9],[98,233.9,251.5],[110,149.8,189.8],[111,234.1,186.4],[188,153.4,252.6],[189,236.6,258.1],[210,159.8,292.1],[211,247.4,295.1],[282,156.8,287.0],[283,234.2,279.6],[294,164.9,122.4],[363,166.9,141.6],[364,222.4,223.2],[366,246.2,297.9],[368,256.5,288.9],[384,164.2,151.8],[385,224.0,153.5]],[[32,173.0,151.5],[33,223.2,137.2],[35,95.4,171.3],[79,167.7,109.4],[83,163.8,307.5],[84,238.4,255.0],[85,148.1,229.2],[86,234.1,208.7],[87,168.8,146.0],[88,226.6,162.2],[91,158.7,211.1],[97,157.4,197.1],[98,231.9,255.6],[110,151.3,191.5],[111,232.5,184.8],[188,155.4,253.1],[189,234.6,261.8],[210,164.1,299.1],[211,250.0,297.8],[282,157.2,289.5],[283,233.3,283.3],[294,167.1,123.1],[363,169.2,140.8],[364,220.5,221.3],[366,247.1,301.4],[368,261.0,292.2],[384,166.6,152.0],[385,221.1,153.8]],[[32,176.6,152.7],[33,235.9,152.2],[83,166.0,312.8],[84,237.6,258.2],[85,150.2,230.1],[86,231.9,209.7],[87,171.2,146.6],[88,224.2,162.5],[91,161.5,215.6],[97,159.6,200.5],[98,230.1,259.1],[110,152.6,193.3],[111,230.6,179.5],[188,157.5,253.5],[189,232.7,264.9],[210,167.0,303.3],[211,253.3,300.0],[294,169.3,123.9],[363,171.9,140.7],[364,218.4,216.5],[368,264.6,294.2],[384,168.9,152.4],[385,218.1,154.4]],[[32,180.1,153.8],[84,236.8,261.1],[85,152.7,230.6],[86,230.0,210.6],[87,173.1,146.9],[88,221.2,162.6],[91,164.5,217.2],[97,161.9,203.5],[98,228.4,262.1],[110,152.4,217.4],[111,229.4,172.0],[188,159.5,253.9],[189,230.6,267.7],[211,255.2,301.1],[294,171.3,124.5],[363,174.8,141.0],[364,216.6,211.5],[384,171.0,153.1],[385,215.7,155.0]],[[32,183.6,155.0],[84,236.0,263.7],[85,155.3,230.9],[86,228.4,211.7],[87,175.3,147.1],[88,218.4,162.6],[91,167.8,215.5],[97,164.3,206.2],[98,226.9,264.6],[110,152.8,222.0],[111,230.0,167.0],[188,161.4,254.4],[189,228.5,270.1],[294,172.8,124.9],[363,178.1,141.8],[364,214.3,210.5],[384,172.9,153.9],[385,213.1,155.8]],[[32,186.9,156.0],[84,235.0,266.2],[85,158.3,230.8],[86,227.3,212.9],[87,177.4,147.0],[88,215.3,162.4],[91,170.4,216.7],[97,167.0,208.4],[98,225.3,267.0],[110,153.3,221.1],[111,232.0,166.8],[188,163.2,255.0],[189,226.0,272.5],[294,174.5,125.3],[363,181.7,142.9],[364,211.2,205.2],[384,174.5,154.9],[385,210.8,156.6]],[[32,189.6,156.9],[84,234.2,268.1],[85,161.3,230.5],[86,226.8,214.4],[87,178.6,146.9],[88,211.8,162.0],[91,173.3,215.0],[97,169.8,210.2],[98,223.7,269.1],[110,153.8,220.1],[111,233.9,167.9],[188,164.9,255.9],[189,223.9,274.1],[363,185.9,144.5],[364,205.2,192.0],[384,175.9,156.0],[385,208.5,157.4]],[[32,190.4,157.1],[84,233.4,269.7],[85,164.5,229.9],[86,227.3,216.2],[88,209.1,161.5],[91,176.0,210.4],[97,172.7,211.6],[98,222.3,270.9],[110,141.0,245.9],[111,235.8,169.4],[188,166.4,257.2],[189,221.8,275.4],[363,190.7,146.6],[364,200.7,203.3],[384,176.2,156.5],[385,206.7,158.3]],[[84,232.7,270.8],[85,168.3,229.2],[86,228.8,217.9],[91,181.3,165.3],[97,175.8,212.7],[98,220.9,272.4],[110,140.7,247.6],[111,237.7,171.2],[188,167.6,259.0],[189,219.8,276.3],[363,194.5,148.3],[364,200.0,216.1],[385,206.0,158.6]],[[84,232.0,271.5],[85,172.8,228.3],[86,231.5,219.9],[97,179.1,213.5],[98,219.9,273.3],[110,141.5,249.0],[111,239.7,173.3],[188,168.8,261.7],[189,218.0,276.9],[364,206.8,261.2]],[[84,231.2,271.9],[85,177.8,227.5],[86,236.0,222.4],[97,182.7,214.2],[98,218.8,274.2],[110,144.0,250.2],[188,169.5,264.4],[189,216.1,277.4],[364,206.9,261.8]],[[84,230.6,272.1],[85,182.6,227.2],[86,240.4,224.5],[97,185.8,214.9],[110,145.2,250.4],[364,207.6,262.5]],[[84,231.5,272.1]],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]};
    const axial={canvas:null,fraction:0.59,min:-1,max:1,brainMin:-1,
      rows:new Array(11).fill(null),rowErrors:{},frames:AX_DATA.frames,
      slices:new Map(),redrawHandle:0,markerHits:[],viewRect:null,destroyed:false,
      sourceCenter:null,modelScale:1,spatialReady:false,coordinateMismatch:false};
    // The old 3.1-unit-wide disc was far larger than the tissue at low levels.
    // It could LOOK as though it intersected the cerebellum even when the
    // actual y level was below it. The new guide is bounded by the REAL mesh
    // intersections at this precise slice, not by a generic fixed circle.
    const axialDisc=new T.Mesh(new T.CircleGeometry(1,72),
      new T.MeshBasicMaterial({color:0x6cddf5,transparent:true,opacity:0.035,
        side:T.DoubleSide,depthWrite:false,depthTest:true}));
    axialDisc.rotation.x=-Math.PI/2;axialDisc.visible=false;axialDisc.renderOrder=5;
    root.add(axialDisc);
    const axialRing=new T.Mesh(new T.RingGeometry(0.975,1.025,96),
      new T.MeshBasicMaterial({color:0x92edff,transparent:true,opacity:0.93,
        side:T.DoubleSide,depthWrite:false,depthTest:true}));
    axialRing.rotation.x=-Math.PI/2;axialRing.visible=false;axialRing.renderOrder=6;
    root.add(axialRing);
    const axialStep=()=>Math.max(0,Math.min(100,Math.round(axial.fraction*100)));
    // Shared absolute Y-coordinate for 3D plane, brain atlas and cervical cord.
    // 0=caudal end of displayed cervical segment, 100=upper cerebral cortex.
    const axialRequestedY=()=>axial.min+(axial.max-axial.min)*axialStep()/100;
    const axialBrainStep=()=>Math.max(0,Math.min(100,Math.round(
      (axialRequestedY()-axial.brainMin)/(axial.max-axial.brainMin)*100)));
    // Use the EXACT stored level of the selected cerebral slice for the 3D guide.
    // Without this snapping, nearest-slice selection introduces a small Y offset.
    const axialLevelY=()=>axialRequestedY()<axial.brainMin ? axialRequestedY() :
      axial.brainMin+(axial.max-axial.brainMin)*axialBrainStep()/100;
    function placeAxialGuide(){
      if(!axial.spatialReady||axial.coordinateMismatch)return;
      // The transverse-slice guide is ALWAYS bilateral, even when only one
      // hemisphere of the 3D model is visible. The 2D axial slice is likewise
      // the complete left+right anatomical section; never shrink or move the
      // 3D guide to fit the currently visible hemisphere.
      const bilateralExtents=AX_INTERSECTION_EXTENTS.both;
      const level=axialLevelY();
      const sourceY=level/axial.modelScale+axial.sourceCenter.y;
      const cordSection=level<axial.brainMin && spinal && spinalWant ? spinal.getSectionAt(sourceY) : null;
      const section=cordSection ? [cordSection.x-cordSection.rx,cordSection.x+cordSection.rx,
        cordSection.z-cordSection.rz,cordSection.z+cordSection.rz] :
        (level>=axial.brainMin ? bilateralExtents[axialBrainStep()] : null);
      if(!section){axialDisc.visible=axialRing.visible=false;return;}
      axialDisc.visible=axialRing.visible=!!axial.canvas;
      const [minX,maxX,minZ,maxZ]=section,c=axial.sourceCenter,k=axial.modelScale;
      // In the real scene the glTF is centered, uniformly scaled, then rotated
      // 180 degrees about Y. The guide must apply that SAME affine transform.
      const px=-((minX+maxX)/2-c.x)*k;
      const pz=-((minZ+maxZ)/2-c.z)*k;
      const py=axialLevelY();
      const rx=Math.max(0.001,(maxX-minX)*k*.5);
      const rz=Math.max(0.001,(maxZ-minZ)*k*.5);
      for(const guide of [axialDisc,axialRing]){
        guide.position.set(px,py,pz);
        // Scale in the geometry's XY axes; rotation.x maps the local Y to Z.
        guide.scale.set(rx,rz,1);
      }
    }
    function setAxialSlice(fraction){
      const step=Math.max(0,Math.min(100,Math.round((Number(fraction)||0)*100)));
      axial.fraction=step/100; // exact same 1-of-101 level for image AND guide
      placeAxialGuide();
      scheduleAxial();
    }
    function setAxialCanvas(canvasElement){
      axial.canvas=canvasElement||null;
      // Never show a guide ring before the real specimen is registered.
      axialDisc.visible=axialRing.visible=!!axial.canvas && axial.spatialReady && !axial.coordinateMismatch;
      placeAxialGuide();
      scheduleAxial();
    }
    function scheduleAxial(){
      if(axial.redrawHandle)cancelAnimationFrame(axial.redrawHandle);
      if(axial.canvas)axial.redrawHandle=requestAnimationFrame(()=>{
        axial.redrawHandle=0;renderAxial();
      });
    }
    // Decode only the requested row from an in-memory data URI.
    function needAxialRow(row){
      if(axial.rows[row]||axial.rowErrors[row])return;
      const img=new Image();
      const entry={img,ready:false};axial.rows[row]=entry;
      img.onload=()=>{if(axial.destroyed)return;entry.ready=true;scheduleAxial();};
      img.onerror=()=>{
        axial.rowErrors[row]='断面画像のデコードに失敗しました';
        console.error('[Axial v0.4D] embedded image decode error: row',row);
        scheduleAxial();
      };
      img.src='data:image/png;base64,'+AX_DATA.rows[row];
    }
    // v0.4I: remove ONLY tiny, fully enclosed background gaps in the 2D
    // presentation mask. Never touch the 3D mesh, axial coordinate mapping,
    // large cavities or independently labeled structures (e.g. ventricles).
    function fillTinyAxialVoids(ids, width, height) {
      const seen = new Uint8Array(ids.length);
      const queue = new Int32Array(ids.length);
      const maxArea = 12;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const start = y * width + x;
          if (ids[start] !== 0 || seen[start]) continue;
          let head = 0, tail = 1, touchesEdge = false;
          const adjacent = new Uint32Array(AX_COLORS.length);
          let boundary = 0;
          queue[0] = start;
          seen[start] = 1;
          while (head < tail) {
            const pos = queue[head++];
            const px = pos % width, py = (pos / width) | 0;
            if (px === 0 || py === 0 || px === width - 1 || py === height - 1) touchesEdge = true;
            // 4-connected region: don't artificially bridge diagonal structures.
            const near = [px > 0 ? pos - 1 : -1, px + 1 < width ? pos + 1 : -1,
              py > 0 ? pos - width : -1, py + 1 < height ? pos + width : -1];
            for (const ni of near) {
              if (ni < 0) continue;
              if (ids[ni] === 0) {
                if (!seen[ni]) { seen[ni] = 1; queue[tail++] = ni; }
              } else if (ids[ni] < adjacent.length) {
                adjacent[ids[ni]]++;
                boundary++;
              }
            }
          }
          if (touchesEdge || tail > maxArea || boundary < 3) continue;
          let best = 0, votes = 0;
          for (let k = 1; k < adjacent.length; k++) {
            if (adjacent[k] > votes) { votes = adjacent[k]; best = k; }
          }
          // At least 75% of the neighboring tissue must agree. Otherwise
          // this may be a true sulcus, a ventricular margin, or a junction.
          if (best && votes / boundary >= 0.75) {
            for (let k = 0; k < tail; k++) ids[queue[k]] = best;
          }
        }
      }
      return ids;
    }
    function getAxialSlice(step){
      if(axial.slices.has(step))return axial.slices.get(step);
      const row=Math.floor(step/10),col=step%10;
      const strip=axial.rows[row];
      if(!strip||!strip.ready){needAxialRow(row);return null;}
      // Lightweight per-slice recoloring, no three-dimensional intersections.
      const cv=document.createElement('canvas');cv.width=AX_SZ;cv.height=AX_SZ;
      const c=cv.getContext('2d',{willReadFrequently:true});
      c.drawImage(strip.img,col*AX_SZ,0,AX_SZ,AX_SZ,0,0,AX_SZ,AX_SZ);
      const raw=c.getImageData(0,0,AX_SZ,AX_SZ);
      const colored=c.createImageData(AX_SZ,AX_SZ);
      const ids=new Uint8Array(AX_SZ*AX_SZ);
      for (let i=0; i<ids.length; i++) ids[i]=raw.data[i*4]||0;
      // Conservative cleanup on the requested image only; keep original
      // anatomical masks and their spatial calibration unchanged.
      fillTinyAxialVoids(ids, AX_SZ, AX_SZ);
      const pal=AX_COLORS.map(h=>{
        const n=parseInt(h.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];
      });
      for(let i=0;i<ids.length;i++){
        const p=i*4,code=ids[i],cc=pal[code]||pal[0];
        // Delineate regional boundaries, without tracing mesh triangles.
        const x=i%AX_SZ,y=(i/AX_SZ)|0;
        const edge=code>0&&x>0&&y>0&&
          (ids[i-1]!==code||ids[i-AX_SZ]!==code);
        const mul=edge?0.95:1;
        colored.data[p]=Math.round(cc[0]*mul);
        colored.data[p+1]=Math.round(cc[1]*mul);
        colored.data[p+2]=Math.round(cc[2]*mul);
        colored.data[p+3]=255;
      }
      c.putImageData(colored,0,0);
      // v0.4E: soften only the *display* image. The original anatomical region
      // IDs remain untouched and continue to drive accurate hover hit testing.
      // Upscaling before the subtle blur smooths 256px stair-step contours
      // without merging labels or re-running any 3D intersection calculations.
      const presentation=document.createElement('canvas');
      presentation.width=AX_SZ*2;
      presentation.height=AX_SZ*2;
      const pc=presentation.getContext('2d');
      pc.imageSmoothingEnabled=true;
      pc.imageSmoothingQuality='high';
      if('filter' in pc) pc.filter='blur(0.85px)';
      pc.drawImage(cv,0,0,presentation.width,presentation.height);
      if('filter' in pc) pc.filter='none';
      const result={canvas:presentation,ids};
      axial.slices.set(step,result);
      // Retain a small cache to avoid unbounded growth on mobile devices.
      if(axial.slices.size>24){const oldest=axial.slices.keys().next().value;axial.slices.delete(oldest);}
      return result;
    }
    // Start with current row so the default view becomes available immediately.
    needAxialRow(5);
    // EDUCATIONAL spinal SEGMENT mapping (NOT measured vertebral coordinates).
    // The existing spinal 3D schematic already assigns C5..T1 at t=.52,.62,
    // .72,.82,.92. Upper C1..C4 anchor points are interpolated to match that
    // schematic's vertical extent. We do not claim PAM50 registration here.
    const spinalSegmentAnchors=[0,.13,.26,.39,.52,.62,.72,.82,.92];
    function cervicalProgress(t){
      const value=Math.max(0,Math.min(1,t));
      if(value>=spinalSegmentAnchors[8])return 1;
      for(let i=0;i<8;i++){
        const a=spinalSegmentAnchors[i],b=spinalSegmentAnchors[i+1];
        if(value<=b)return(i+(value-a)/(b-a))/8;
      }
      return 1;
    }
    function drawCervicalAxial(ctx,w,h,sourceY){
      axial.viewRect=null;axial.markerHits=[];
      const part=spinal && spinal.getSectionAt(sourceY);
      if(!part){
        ctx.fillStyle='#aab8cd';ctx.font='12px system-ui';
        ctx.fillText('頸髄断面の範囲外です',18,h/2);return;
      }
      const anatomy=window.SpineAtlasSection;
      if(!anatomy?.renderCanvas){
        ctx.fillStyle='#ffc3a3';ctx.font='12px system-ui';
        ctx.fillText('脊髄断面モジュールを読み込めません',12,h/2);
        return; // Do not silently fall back to the old ellipse.
      }
      const progress=cervicalProgress(part.t);
      // The discrete Mode 2 level is authoritative: percentage rounding must
      // not silently swap a selected C8 slice back to C7.
      const snapped=mode2AxialEnabled ? getMode2SectionLevels().reduce((best,item)=>
        Math.abs(item.percent-axial.fraction*100)<Math.abs(best.percent-axial.fraction*100)?item:best,
        getMode2SectionLevels()[0]||{percent:0}) : null;
      const seg=snapped?.part==='cord' ? snapped.segment : undefined;
      // A colored PAM50 white-matter mask describes the WHOLE tract territory.
      // The selected 3D centerline is a single exemplar fiber, shown separately
      // as a small cross-sectional point inside that territory. The spatial
      // correspondence uses a transparent anatomical warp: Brain Project GLB
      // and PAM50 are not voxel-to-voxel registered, so do not claim precision.
      // v0.10G: source of truth is the 3D renderer's hemisphere selection.
      // Do not let a stale React effect keep the atlas in bilateral mode.
      const showSelectedCST=mode2AxialEnabled && mode2Selection.includes('Corticospinal tract');
      anatomy.setCSTOriginSide?.(req.hemisphere);
      anatomy.setMode2CSTFocus?.(showSelectedCST);
      const fiberHits=(showSelectedCST && mode2?.getSectionMarkersAtY)
        ? mode2.getSectionMarkersAtY(sourceY).filter(hit=>hit.id==='Corticospinal tract' &&
          (req.hemisphere==='both'||hit.side===req.hemisphere))
        : [];
      const view=anatomy.renderCanvas(ctx,w,h,progress,seg,{fiberHits});
      ctx.fillStyle='#d6e5ef';ctx.font='600 12px system-ui';
      ctx.fillText(view.section.segment+'髄節付近 — 頸髄横断面',12,22);
      ctx.font='10px system-ui';ctx.fillStyle='#a6b9cc';
      ctx.fillText('PAM50髄節代表断面・3Dとの位置登録は未完了',12,40);
      axial.viewRect={spinal:true,part,...view};
      // Mode 2: 2D positions are projected from intersections with the SAME
      // supplemental 3D tube centerlines; they are not separately invented dots.
      if(!anatomy.isPAM50 && mode2 && mode2Selection.length && mode2.getSectionMarkersAtY){
        for(const hit of mode2.getSectionMarkersAtY(sourceY)){
          const px=view.offsetX+(view.cx+hit.u*view.section.width)*view.scale;
          const py=view.offsetY+(view.cy-hit.v*view.section.height)*view.scale;
          if(!Number.isFinite(px)||!Number.isFinite(py))continue;
          ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);
          ctx.fillStyle=hit.color;ctx.fill();ctx.lineWidth=1.3;
          ctx.strokeStyle='#ffffff';ctx.stroke();
          axial.markerHits.push({x:px,y:py,ja:hit.ja+'（教育用）',en:hit.en,color:hit.color});
        }
      }
    }
    function renderAxial(){
      const cv=axial.canvas;if(!cv)return;
      const rect=cv.getBoundingClientRect();
      const w=Math.floor(rect.width),h=Math.floor(rect.height);
      if(w<20||h<20)return;
      const dpr=Math.min(2,window.devicePixelRatio||1);
      if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){
        cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
      }
      const ctx=cv.getContext('2d');if(!ctx)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle=AX_COLORS[0];ctx.fillRect(0,0,w,h);
      if(axial.coordinateMismatch){
        ctx.font='12px system-ui';ctx.fillStyle='#ffc1a8';
        ctx.fillText('3Dモデルと断面データの座標が一致しません',12,h/2);
        return;
      }
      // Below the original GLB bounds, draw a transverse spinal section
      // using the SAME sourceY that places the 3D horizontal guide.
      if(axialLevelY()<axial.brainMin){
        if(!spinalWant){
          ctx.fillStyle='#b6c6d8';ctx.font='12px system-ui';
          ctx.fillText('頸髄モデルが非表示です',12,h/2);
          axial.viewRect=null;axial.markerHits=[];
          return;
        }
        const sourceY=axialLevelY()/axial.modelScale+axial.sourceCenter.y;
        drawCervicalAxial(ctx,w,h,sourceY);
        return;
      }
      const step=axialBrainStep(),row=Math.floor(step/10),col=step%10;
      const size=Math.min(w,h),dx=(w-size)/2,dy=(h-size)/2;
      axial.viewRect={dx,dy,size,row,col,step};
      axial.markerHits=[];
      let slice=null;
      try {slice=getAxialSlice(step);} catch(err){
        axial.rowErrors[row]='断面描画の処理に失敗しました';
        console.error('[Axial v0.4D]',err);
      }
      if(!slice){
        ctx.font='12px system-ui';ctx.fillStyle='#b6c6d8';
        ctx.fillText(axial.rowErrors[row]||'断面画像を準備中…',12,h/2);
        return;
      }
      ctx.imageSmoothingEnabled=true;
      let axialPresentation=slice.canvas;
      if(mode2AxialEnabled && window.Mode2AxialSmooth?.render){
        if(!mode2SmoothCache.has(step)){
          mode2SmoothCache.set(step,window.Mode2AxialSmooth.render(slice.ids,AX_COLORS,AX_SZ));
          if(mode2SmoothCache.size>18)mode2SmoothCache.delete(mode2SmoothCache.keys().next().value);
        }
        axialPresentation=mode2SmoothCache.get(step)||slice.canvas;
      }
      ctx.drawImage(axialPresentation,dx,dy,size,size);
      const active=req.subset&&req.subset.tracts;
      const frame=axial.frames&&axial.frames[step];
      if(active&&frame){
        for(const [id,sx,sy] of frame){
          if(!active.has(id))continue;
          const mesh=meshById.get(id)?.[0];
          if(!mesh||mesh.userData.hemiHidden||mesh.userData.isoHidden)continue;
          const node=window.BRAIN.nodes.find(n=>n.id===id);
          const label=node?.label||'神経伝導路';
          // One selected 3D CST centerline -> one axial point. The native HCP
          // mask's separate marker was incorrectly producing a second dot.
          if(mode2AxialEnabled && label==='Corticospinal tract' &&
             mode2Selection.includes('Corticospinal tract'))continue;
          if(mode2AxialEnabled && req.hemisphere!=='both' &&
             node?.side!=='median' && node?.side!==req.hemisphere)continue;
          const color=window.Mode1Routes?.colorFor(label)||'#00d1ef';
          const px=dx+(sx/AX_HIT_SZ)*size,py=dy+(sy/AX_HIT_SZ)*size;
          ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);
          ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.8;
          ctx.strokeStyle='#f8fcff';ctx.stroke();
          axial.markerHits.push({x:px,y:py,ja:window.Mode1JP?.label(label)||label,
             en:label,color});
        }
      }
      // Mode 2: supplemental 3D continuation intersections in the same GLB
      // source coordinates. These are model-derived POINTS, not voxel tract
      // MASKS. Keep the distinction explicit in the hit label and UI.
      if(mode2AxialEnabled && mode2 && mode2.getBrainstemSectionCrossingsAtY){
        const sourceY=axialLevelY()/axial.modelScale+axial.sourceCenter.y;
        const seenCrossings=new Set();
        for(const hit of mode2.getBrainstemSectionCrossingsAtY(sourceY)){
          if(req.hemisphere!=='both' && hit.side!==req.hemisphere)continue;
          const crossingKey=hit.id+'|'+hit.side;
          if(seenCrossings.has(crossingKey))continue;
          seenCrossings.add(crossingKey);
          const ux=(128+1200*hit.x)/AX_SZ,uy=(119-1200*hit.z)/AX_SZ;
          if(ux<0||ux>1||uy<0||uy>1)continue;
          const px=dx+ux*size,py=dy+uy*size;
          ctx.beginPath();ctx.arc(px,py,4.4,0,Math.PI*2);
          ctx.fillStyle=hit.color;ctx.fill();ctx.lineWidth=1.6;
          ctx.strokeStyle='#fff';ctx.stroke();
          axial.markerHits.push({x:px,y:py,ja:hit.ja+'（3D模式線の交点）',en:hit.en,color:hit.color});
        }
      }
      // v0.5C: physical intersections with the *same* 3D schematic tube.
      // In particular, this includes the CAUDAL MEDULLA (pyramidal decussation)
      // which is above the cervical tube, hence on the brain-atlas slice branch.
      // The original Brain Project slice mask stays untouched.
      if(!mode2AxialEnabled && spinal && spinalWant && spinal.getTractCrossingsAtY){
        const sourceY=axialLevelY()/axial.modelScale+axial.sourceCenter.y;
        if(sourceY>=spinal.topY && sourceY<=spinal.sourceBounds.max.y){
          // Calibrated from the existing 101-slice masks and original GLB
          // intersection extents: image-x ≈128+1200*source-x,
          // image-y ≈119-1200*source-z (256-pixel atlas coordinates).
          // Do NOT stretch the marker independently using the brain bounding box.
          for(const hit of spinal.getTractCrossingsAtY(sourceY,req.hemisphere)){
            const ux=(128+1200*hit.x)/AX_SZ,uy=(119-1200*hit.z)/AX_SZ;
            if(ux<0||ux>1||uy<0||uy>1)continue;
            const px=dx+ux*size,py=dy+uy*size;
            // Small, high-contrast position marker; the 2D and 3D source x/y/z
            // are the same (only the atlas presentation is simplified).
            ctx.beginPath();ctx.arc(px,py,5,0,2*Math.PI);
            ctx.fillStyle=hit.color;ctx.fill();ctx.lineWidth=1.7;
            ctx.strokeStyle='#f8fcff';ctx.stroke();
            axial.markerHits.push({x:px,y:py,ja:hit.ja+'（模式）',en:hit.en,color:hit.color});
          }
        }
      }
      ctx.fillStyle='rgba(232,243,252,.85)';ctx.font='10px system-ui';
      ctx.fillText('前方',10,16);
      ctx.fillText('後方',w-35,h-10);
      ctx.font='bold 14px system-ui';ctx.fillStyle='#eef7ff';
      ctx.textAlign='left';ctx.fillText('R',9,h/2);
      ctx.textAlign='right';ctx.fillText('L',w-9,h/2);ctx.textAlign='left';
    }
    function getAxialHit(event){
      if(!axial.canvas||!axial.viewRect)return null;
      const b=axial.canvas.getBoundingClientRect();
      const px=event.clientX-b.left,py=event.clientY-b.top;
      for(const marker of axial.markerHits){
        if((marker.x-px)**2+(marker.y-py)**2<100)return marker;
      }
      if(axial.viewRect.spinal){
        return window.SpineAtlasSection?.hitCanvas?.(
          axial.canvas.getContext('2d'),px,py,axial.viewRect) || null;
      }
      const {dx,dy,size,step}=axial.viewRect;
      const x=Math.floor((px-dx)/size*AX_SZ),y=Math.floor((py-dy)/size*AX_SZ);
      if(x<0||y<0||x>=AX_SZ||y>=AX_SZ)return null;
      const sl=axial.slices.get(step);if(!sl)return null;
      const id=sl.ids[y*AX_SZ+x];
      const name=AX_NAMES[id];if(!name)return null;
      return {ja:name[0],en:name[1],color:AX_COLORS[id],description:AX_FACTS[id]?.[0]||'',clinical:AX_FACTS[id]?.[1]||''};
    }
    // Mode 2 ONLY. A discrete level map tied to measured mesh heights in the
    // native brain.glb, then mapped to the exact existing 0..100 guide coordinate.
    // It is deliberately NOT marketed as PAM50/MNI atlas registration.
    function getMode2SectionLevels(){
      if(!loaded || !axial.spatialReady)return [];
      if(mode2LevelCache)return mode2LevelCache;
      const nativeY=(label,q=.5)=>{
        const matches=window.BRAIN.nodes.filter(n=>n.label===label);
        const bounds=[];
        for(const node of matches){
          for(const m of (meshById.get(node.id)||[])){
            if(!m.geometry)continue;
            if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
            const bb=m.geometry.boundingBox;
            // Transform all eight source-geometry bounding corners through
            // the actual glTF scene, then back to original glTF coordinates.
            // This handles nested transforms without changing the meshes.
            gltfForMode2?.updateMatrixWorld(true);
            const low=bb.min,hi=bb.max;
            for(const x of [low.x,hi.x])for(const y of [low.y,hi.y])for(const z of [low.z,hi.z]){
              const p=gltfForMode2.worldToLocal(m.localToWorld(new T.Vector3(x,y,z)));
              bounds.push(p.y);
            }
          }
        }
        if(!bounds.length)return null;
        return Math.min(...bounds)+(Math.max(...bounds)-Math.min(...bounds))*q;
      };
      const pct=(y)=>Math.max(0,Math.min(100,Math.round(((y-axial.sourceCenter.y)*axial.modelScale-axial.min)/(axial.max-axial.min)*1000)/10));
      const defs=[
        ['semioval','半卵円中心付近','White matter of telencephalon',.84],
        ['corona','放線冠付近','White matter of telencephalon',.66],
        ['basal','基底核・内包付近','Putamen',.50],
        ['thalamic','視床・内包後脚付近','Ventral lateroventral nucleus',.50],
        ['mid-upper','中脳上部','Superior colliculus',.51],
        ['mid-lower','中脳下部','Inferior colliculus',.50],
        ['pons-upper','橋上部','Pons',.78],
        ['pons-lower','橋下部','Pons',.23],
        ['med-upper','延髄上部','Medulla oblongata',.76],
        ['med-lower','延髄下部','Medulla oblongata',.37],
        ['med-caudal','延髄尾側（交叉近傍）','Medulla oblongata',.11]
      ];
      const result=[];
      const known=[];
      for(const [id,label,structure,q] of defs){
        const y=nativeY(structure,q);
        if(y===null)continue;
        const percent=pct(y);
        if(percent===0||percent===100)continue;
        result.push({id,label,percent,part:'brain',basis:'3D解剖メッシュの高さ',structure});
        known.push({id,label,percent,y});
      }
      // Additional anatomical positions (brain has 101 source image steps).
      // These are intermediate heights of the SAME source mesh / cross-section,
      // not additional registered MRI slices. No duplicated category labels.
      known.sort((a,b)=>b.y-a.y);
      for(let i=0;i<known.length-1;i++){
        const hi=known[i],lo=known[i+1];
        const n=i<=4?3:2; // denser sampling from subcortical white matter to brainstem
        for(let j=1;j<n;j++){
          const t=j/n,percent=pct(hi.y*(1-t)+lo.y*t);
          if(percent===0||percent===100)continue;
          result.push({id:`bridge-${hi.id}-${lo.id}-${j}`,label:`${hi.label} ～ ${lo.label}（中間${j}/${n}）`,
            percent,part:'brain',basis:'既存3Dモデルの中間断面（実測MRIではありません）'});
        }
      }
      // The spinal-cord *segment* assignments come from the existing
      // registered schematic, NOT the vertebral levels or PAM50 masks.
      const anchors=[0,.13,.26,.39,.52,.62,.72,.82,.92];
      const cordSegments=['C1','C2','C3','C4','C5','C6','C7','C8','T1'];
      cordSegments.forEach((segment,i)=>{
        if(!spinal)return;
        const t=.012+anchors[i]*.974;
        const y=spinal.topY+(spinal.bottomY-spinal.topY)*t;
        result.push({id:'cord-'+segment,label:segment+'髄節',percent:pct(y),part:'cord',basis:'現行頸髄模式メッシュの髄節割当',segment});
        if(i>=cordSegments.length-1)return;
        const midpoint=(anchors[i]+anchors[i+1])/2;
        const yy=spinal.topY+(spinal.bottomY-spinal.topY)*(.012+midpoint*.974);
        const next=cordSegments[i+1];
        result.push({id:'cord-'+segment+'-'+next,label:segment+'〜'+next+'移行断面',percent:pct(yy),
          part:'cord',segment:segment+'-'+next,
          basis:'隣接するPAM50由来の代表髄節輪郭を補間した教育用断面'});
      });
      result.sort((a,b)=>b.percent-a.percent);
      const unique=[];
      for(const entry of result){
        if(!unique.length||entry.percent!==unique[unique.length-1].percent){unique.push(entry);continue;}
        // The source contains multiple anatomical landmarks in a narrow band;
        // choose one rather than presenting two identical cross-sections.
        // Prefer cervical segment naming when a collision involves the cord.
        if(entry.part==='cord')unique[unique.length-1]=entry;
        else if(unique[unique.length-1].id?.startsWith('bridge-') && !entry.id.startsWith('bridge-'))
          unique[unique.length-1]=entry; // preserve named anatomical reference levels
      }
      mode2LevelCache=unique;
      return unique;
    }
    function setMode2AxialEnabled(value){
      mode2AxialEnabled=!!value; scheduleAxial();
    }

    function getAxialInfo() { return {fraction:axial.fraction,min:axial.min,max:axial.max,brainMin:axial.brainMin,loaded}; }

    /* ---------------- load the real specimen ---------------- */
    const draco = new T.DRACOLoader().setDecoderPath(DRACO);
    const loader = new T.GLTFLoader(); loader.setDRACOLoader(draco);
    let loadingNotice = setTimeout(() => {
      if(!sceneDisposed && !loaded && opts.onError) opts.onError('brain.glb の読み込みが完了していません。Chromeのコンソールを確認してください。');
    }, 11000);
    loader.load(URL, (gltf) => {
      if (sceneDisposed) { disposeMeshResources(gltf.scene); return; }
      try {
      model.add(gltf.scene);
      gltfForMode2=gltf.scene;

      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const ex = extras(o);
        // bx_core is part of the original GLB. Once we overwrite userData
        // below for app picking/materials, looking it up again would lose it.
        if (ex.bx_core === 1 || ex.bx_core === true) sourceCoreMeshes.push(o);
        const cat = ex.bx_cat || 'other';
        const id = ex.bx_id != null ? ex.bx_id : null;
        const side = ex.bx_side || 'median';
        const base = shade(cat, PAL[cat]);
        const be = CAT_EMISS[cat] != null ? CAT_EMISS[cat] : 0.06;
        const mat = new T.MeshStandardMaterial({
          color: base.clone(),
          roughness: VESSEL.has(cat) ? 0.5 : 0.82,
          metalness: 0.0,
          transparent: true, opacity: 1,
          emissive: base.clone().multiplyScalar(be),
          side: cat === 'meninges_dura' ? T.DoubleSide : T.FrontSide,
          depthWrite: true,
        });
        o.material = mat;
        o.userData = { cat, side, nodeId: id, baseColor: base.clone(), baseEmiss: be,
                       maxOpacity: MAX_OPACITY[cat] != null ? MAX_OPACITY[cat] : 1 };
        C(cat).meshes.push(o); allMeshes.push(o);
        if (id != null) { if (!meshById.has(id)) meshById.set(id, []); meshById.get(id).push(o); }
      });

      // center on the CORE brain (ignore descending nerves/vessels) + scale to stage
      // v0.4G REGISTRATION FIX:
      // The source atlas is generated in *original GLB* coordinates. root has a
      // -0.25 rad stage yaw; Box3.expandByObject(mesh) otherwise includes that
      // parent rotation, producing WORLD-aligned X/Z bounds and a false
      // mismatch against the unrotated atlas even for the identical GLB.
      // Temporarily remove the display yaw during bounds construction, then
      // restore it before rendering. No geometry or atlas coordinates change.
      const stageYaw = root.rotation.y;
      root.rotation.y = 0;
      root.updateMatrixWorld(true);
      const core = new T.Box3();
      let anyCore = false;
      try {
        // Only use the 271 'core' objects identified by the original GLB.
        // Do not fall back to all 437 meshes: cranial nerves/vessels extend
        // far below the brain, leading to a false coordinate-mismatch error.
        for (const m of sourceCoreMeshes) {
          core.expandByObject(m);
          anyCore = true;
        }
        if (!anyCore) {
          console.error('[Axial coordinate calibration] No original bx_core meshes found.');
          core.setFromObject(gltf.scene);
        }
      } finally {
        root.rotation.y = stageYaw;
        root.updateMatrixWorld(true);
      }
      // v0.5A.1: obtain the ACTUAL lower medulla cross-section and its tangent.
      // The whole hemimedulla bbox center is NOT its inferior outlet center.
      const medulla = new T.Box3();
      const medullaMeshes=[];
      for(const node of window.BRAIN.nodes){
        if(node.label!=='Medulla oblongata')continue;
        for(const m of (meshById.get(node.id)||[])){
          if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
          medulla.union(m.geometry.boundingBox);
          medullaMeshes.push(m);
        }
      }
      if(medullaMeshes.length&&window.BrainCervical){
        spinal=window.BrainCervical.build(T,medullaMeshes,core.max.y-core.min.y);
        if(spinal){
          gltf.scene.add(spinal.group);
          // Register the actual missing half of the medulla for hover/picking.
          // It uses the same existing brainstem material and node identity.
          const missingMedulla=spinal.medullaComplement;
          if(missingMedulla && medullaMeshes[0]){
            const original=medullaMeshes[0],id=original.userData.nodeId;
            missingMedulla.userData={...original.userData,side:'right',
              repairedFrom:'BodyParts3D full medulla'};
            C('brainstem').meshes.push(missingMedulla);
            allMeshes.push(missingMedulla);
            if(id!=null){
              if(!meshById.has(id))meshById.set(id,[]);
              meshById.get(id).push(missingMedulla);
            }
          }
          spinal.group.visible=spinalWant;
          spinal.buildPathways(meshById,window.BRAIN.nodes);
          spinal.setOpacity(spinalAlpha);
          spinal.setPathways(spinalRoutes,req.hemisphere);
          if(spinal.onReady)spinal.onReady(()=>{if(!axial.destroyed){placeAxialGuide();scheduleAxial();}});
        }
      }else console.warn('[Brain Atlas] Cervical geometry missing: no medulla mesh.');
      const center = core.getCenter(new T.Vector3());
      gltf.scene.position.sub(center);                 // core center -> model origin
      const r = core.getBoundingSphere(new T.Sphere()).radius || 1;
      model.scale.setScalar(1.7 / r);                  // fit the design camera framing
      // anatomical upright: Z-Anatomy exports anterior toward +Z; face the camera
      model.rotation.y = Math.PI;
      // Build Mode 2 supplemental anatomical routes ONLY after the original
      // brain/cord have been registered. These are NOT added to original meshes.
      if(window.Mode2Pathways && spinal){
        mode2=window.Mode2Pathways.create(T,{spinal,gltfScene:gltf.scene,meshById,nodes:window.BRAIN.nodes});
        mode2.setSelection(mode2Selection,req.hemisphere);
        mode2.setImpulses(mode2Impulse);
      }
      // Build Mode 2 cortical territories after registration, without changing
      // source GLB geometry or any Mode 1 layer/material.
      if(window.Mode2Territories){
        mode2Territories=window.Mode2Territories.create(T,{gltfScene:gltf.scene,meshById,nodes:window.BRAIN.nodes});
        mode2Territories.setSelection(territorySelection,req.hemisphere,territoryOpacity);
      }
      // Highlight native arterial meshes when Mode 2 cortical territory is selected.
      // Overlays use shared geometries and are independent of all Mode 1 controls.
      if(window.Mode2Vessels){
        mode2Vessels=window.Mode2Vessels.create(T,{meshById,nodes:window.BRAIN.nodes});
        mode2Vessels.setSelection(vesselSelection,req.hemisphere,vesselEnabled);
      }
      // Mode 2 onset-only stroke examples. Anchored to existing GLB anatomy;
      // never alter the original materials, meshes or Mode 1 data.
      if(window.Mode2Lesions){
        mode2Lesions=window.Mode2Lesions.create(T,{gltfScene:gltf.scene,meshById,nodes:window.BRAIN.nodes});
        mode2Lesions.setSelection(lesionSelection,lesionSide);
      }
      const scale = model.scale.x;
      axial.brainMin = (core.min.y-center.y)*scale;
      axial.min = ((spinal ? spinal.bottomY : core.min.y)-center.y)*scale;
      axial.max = (core.max.y-center.y)*scale;
      axial.sourceCenter=center.clone();
      axial.modelScale=scale;
      // Prevent false anatomical registration if a different GLB is loaded.
      const sourceMin=AX_GLB_CORE_BOUNDS.coreMin;
      const sourceMax=AX_GLB_CORE_BOUNDS.coreMax;
      console.info('[Brain Atlas v0.4H] Coordinate check: original core meshes =',sourceCoreMeshes.length);
      const modelMin=core.min.toArray(),modelMax=core.max.toArray();
      axial.coordinateMismatch=[0,1,2].some(i=>
        Math.abs(modelMin[i]-sourceMin[i])>0.00002 ||
        Math.abs(modelMax[i]-sourceMax[i])>0.00002);
      if(axial.coordinateMismatch){
        console.error('[Axial coordinate calibration] GLB core bounds mismatch; display suppressed.',{coreMeshCount:sourceCoreMeshes.length,modelMin,modelMax,sourceMin,sourceMax,stageYaw});
        axialDisc.visible=axialRing.visible=false;
      }
      root.updateMatrixWorld(true);
      axial.spatialReady=true;
      placeAxialGuide();

      loaded = true;
      scheduleAxial();
      buildRouteAnnotations();
      prepareRoutePulses();
      setRouteImpulse(currentImpulseLabels);
      // apply whatever the React app already asked for, then settle instantly
      if (req.layers) setLayers(req.layers);
      setHemisphere(req.hemisphere);
      isolate(req.isolate);
      setSubset(req.subset);
      if (req.selected != null) selectNode(req.selected); else clearSelect();
      snap();
      clearTimeout(loadingNotice);
      console.info('[Brain Atlas recovery] brain.glb loaded', {meshes:allMeshes.length, visible:allMeshes.filter(m=>m.visible).length});
      if (opts.onReady) opts.onReady();
      } catch(e) {
        clearTimeout(loadingNotice);
        console.error('[Brain Atlas recovery] Error while preparing 3D:',e);
        if(opts.onError)opts.onError('3Dモデル初期化エラー：'+(e && e.message ? e.message : String(e)));
      }
    }, undefined, (err) => {
      clearTimeout(loadingNotice);
      if (sceneDisposed) return;
      console.error('[BrainScene] GLB load failed:', err);
      if(opts.onError)opts.onError('brain.glb 読み込み失敗：'+(err && err.message ? err.message : String(err)));
    });

    /* ---------------- camera / orbit (unchanged feel) ---------------- */
    const target = new T.Vector3(0, -0.05, 0);
    const sph = new T.Spherical(7.6, Math.PI / 2.25, 0.5);
    const sphGoal = sph.clone();
    const tgtGoal = target.clone();
    let autoRot = opts.autorotate !== false;
    let idleTimer = 0;

    function applyCamera() {
      const off = new T.Vector3().setFromSpherical(sph);
      camera.position.copy(target).add(off);
      camera.lookAt(target);
    }

    let dragging = false, panning = false, lastX = 0, lastY = 0, moved = 0;
    const dom = renderer.domElement;
    function down(e) {
      dragging = true; moved = 0;
      panning = e.button === 2 || e.metaKey || e.ctrlKey;      // ⌘/Ctrl = pan/drift
      lastX = e.clientX; lastY = e.clientY; idleTimer = 0;
      dom.setPointerCapture && dom.setPointerCapture(e.pointerId);
    }
    function move(e) {
      hover(e);
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (panning) {
        const s = sph.radius * 0.0016;
        const right = new T.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const up = new T.Vector3().setFromMatrixColumn(camera.matrix, 1);
        tgtGoal.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
      } else {
        sphGoal.theta -= dx * 0.006;
        sphGoal.phi = Math.max(0.18, Math.min(Math.PI - 0.18, sphGoal.phi - dy * 0.006));
      }
      idleTimer = 0;
    }
    function up(e) { if (dragging && moved < 6) click(e); dragging = false; panning = false; }
    function wheel(e) {
      e.preventDefault();
      sphGoal.radius = Math.max(2.6, Math.min(16, sphGoal.radius * (1 + e.deltaY * 0.0009)));
      idleTimer = 0;
    }
    // stepped zoom for on-screen +/- buttons (pinch-zoom is unreliable on mobile);
    // the loop eases sph.radius toward the goal, so each tap glides in/out smoothly
    function zoom(dir) {
      sphGoal.radius = Math.max(2.6, Math.min(16, sphGoal.radius * (1 + dir * 0.22)));
      idleTimer = 0;
    }
    // keyboard modifier toggles pan even mid-drag
    function onKeyDown(e) { if ((e.key === 'Meta' || e.key === 'Control') && dragging) panning = true; }
    function onKeyUp(e) { if (e.key === 'Meta' || e.key === 'Control') panning = false; }
    function onContextMenu(e) { e.preventDefault(); }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    dom.addEventListener('wheel', wheel, { passive: false });
    dom.addEventListener('contextmenu', onContextMenu);

    /* ---------------- picking / hover (per-structure) ---------------- */
    const ray = new T.Raycaster();
    const ndc = new T.Vector2();
    let hovered = null, selectedIds = new Set();
    let emphasizedIds = new Set(); // Mode 1: simultaneously visible pathways

    // ---- functional-system highlight mode (Systems / Learn) ----
    // when on, the loop ignores the per-category layer state and instead
    // glows the active pathway structures, dims the already-seen ones, and
    // keeps cortex/cerebellum/brainstem as a faint ghost for spatial context.
    let hiOn = false;
    let hiActive = new Set();   // nodeIds glowing now
    let hiSeen = new Set();     // nodeIds lit earlier in the pathway
    const GHOST_CATS = new Set(['cortex', 'cerebellum', 'brainstem']);
    function pickAt(e) {
      const r = dom.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const cand = allMeshes.filter(m => m.visible && m.material.opacity > 0.14);
      const hits = ray.intersectObjects(cand, false);
      return hits.length ? hits[0].object : null;
    }
    function hover(e) {
      if (dragging) return;
      const m = pickAt(e);
      if (m !== hovered) {
        hovered = m;
        dom.style.cursor = m ? 'pointer' : 'grab';
        if (opts.onHover) opts.onHover(m ? m.userData.nodeId : null);
      }
    }
    function click(e) {
      const m = pickAt(e);
      if (opts.onPick) opts.onPick(m ? m.userData.nodeId : null, m);
    }

    /* ---------------- public state API ---------------- */
    function setLayer(cat, st) {
      req.layers = req.layers || {}; req.layers[cat] = Object.assign(req.layers[cat] || {}, st);
      const c = cats[cat]; if (!c) return;
      if (st.visible != null) c.want = st.visible !== false;
      if (st.opacity != null) c.targetOpacity = st.opacity;
      if (st.visible === false) c.targetOpacity = 0;
      else if (st.opacity == null && st.visible === true) c.targetOpacity = 1;
    }
    function setLayers(map) { Object.keys(map).forEach(c => setLayer(c, map[c])); }

    function setHemisphere(side) {
      req.hemisphere = side;
      allMeshes.forEach(m => {
        const sd = m.userData.side;
        m.userData.hemiHidden = (m.userData.cat === 'brainstem' || m.userData.cat === 'cerebellum') ? false : !(side === 'both' || sd === 'median' || sd === side);
      });
      if(spinal)spinal.setPathways(spinalRoutes,side);
      if(mode2)mode2.setSelection(mode2Selection,side);
      if(mode2Territories)mode2Territories.setSelection(territorySelection,side,territoryOpacity);
      mode2Vessels?.setSelection(vesselSelection,side,vesselEnabled);
      mode2Lesions?.setHemisphere(side);
      if (loaded && currentRouteLabels.length) buildRouteAnnotations();
      placeAxialGuide();
      scheduleAxial();
    }

    function frameBox(box, padScale) {
      if (!box || box.isEmpty()) return;
      const c = box.getCenter(new T.Vector3());
      const r = box.getBoundingSphere(new T.Sphere()).radius;
      tgtGoal.copy(c);
      sphGoal.radius = Math.max(2.6, Math.min(16, r * (padScale || 3.0) + 0.4));
      autoRot = false; idleTimer = 0;
    }
    function boxOfMeshes(ms) {
      const b = new T.Box3();
      ms.forEach(m => { if (m.geometry) b.expandByObject(m); });
      return b;
    }
    function focusCategory(cat) { const c = cats[cat]; if (c) frameBox(boxOfMeshes(c.meshes), 2.6); }
    function focusNode(id) {
      const ms = meshById.get(id);
      if (ms && ms.length) frameBox(boxOfMeshes(ms), 4.0);
      else { const n = window.BRAIN.nodes.find(x => x.id === id); if (n) focusCategory(n.category); }
    }

    function selectNode(id) {
      req.selected = id;
      selectedIds = new Set();
      const ms = meshById.get(id);
      if (ms) ms.forEach(m => selectedIds.add(m));
      else { selectedIds = new Set(); }
    }
    function clearSelect() { req.selected = null; selectedIds = new Set(); }
    function setEmphasized(ids) { emphasizedIds = new Set(ids || []); }

    function isolate(ids) {
      req.isolate = ids;
      const set = ids ? new Set(ids) : null;
      allMeshes.forEach(m => { m.userData.isoHidden = set ? !set.has(m.userData.nodeId) : false; });
    }

    // restrict given categories to a set of node ids (e.g. only the circle-of-Willis
    // arteries) without touching any other layer - map: { cat: Set(ids) } or null.
    function setSubset(map) {
      req.subset = map;
      allMeshes.forEach(m => {
        const s = map && map[m.userData.cat];
        m.userData.subsetHidden = s ? !s.has(m.userData.nodeId) : false;
      });
      scheduleAxial();
    }

    // ---- functional-system highlight (drives Systems & Learn) ----
    function setHighlight(activeIds, seenIds) {
      hiOn = true;
      hiActive = new Set(activeIds || []);
      hiSeen = new Set(seenIds || []);
    }
    function clearHighlight() { hiOn = false; hiActive = new Set(); hiSeen = new Set(); }
    // frame a set of nodeIds (only the meshes currently shown by hemisphere)
    function frameNodes(ids, padScale) {
      const b = new T.Box3();
      let any = false;
      (ids || []).forEach(id => {
        const ms = meshById.get(id);
        if (ms) ms.forEach(m => { if (m.geometry && !m.userData.hemiHidden) { b.expandByObject(m); any = true; } });
      });
      if (!any) { (ids || []).forEach(id => { const ms = meshById.get(id); if (ms) ms.forEach(m => { if (m.geometry) { b.expandByObject(m); any = true; } }); }); }
      if (any) frameBox(b, padScale || 3.2);
    }

    function reset() {
      tgtGoal.set(0, -0.05, 0);
      sphGoal.set(7.6, Math.PI / 2.25, 0.5);
      autoRot = opts.autorotate !== false; idleTimer = 0;
    }

    function snap() {
      allMeshes.forEach(m => {
        const c = cats[m.userData.cat];
        const want = c && c.want && !m.userData.hemiHidden && !m.userData.isoHidden && !m.userData.subsetHidden;
        const cap = m.userData.maxOpacity != null ? m.userData.maxOpacity : 1;
        m.material.opacity = (want && !suppressNativeCST(m)) ? Math.min(cap, c.targetOpacity) : 0;
        // only solid meshes write depth - a translucent ghost (e.g. faded cortex)
        // must not occlude the structures behind it
        m.material.depthWrite = m.material.opacity >= 0.98;
        m.visible = m.material.opacity > 0.012;
      });
    }

    // Coherently follow underlying anatomical layer and hemi visibility.
    function syncMode2Territories(){mode2Territories?.update();}
    function syncMode2Vessels(){mode2Vessels?.update();}
    function syncMode2Lesions(){mode2Lesions?.update();}

    function setSpinalOpacity(alpha){
      spinalAlpha=Math.max(0,Math.min(1,Number(alpha)||0));
      if(spinal)spinal.setOpacity(spinalAlpha);
    }
    function setMode2MotorCircuit(mode){mode2?.setMotorCircuit?.(mode);scheduleAxial();}
    function setMode2Pathways(labels,hemisphere,impulse){
      mode2Selection=Array.isArray(labels)?labels:[];
      mode2Impulse=impulse!==false;
      if(mode2){mode2.setSelection(mode2Selection,hemisphere||req.hemisphere);mode2.setImpulses(mode2Impulse);}
      window.SpineAtlasSection?.setCSTOriginSide?.(hemisphere||req.hemisphere);
      window.SpineAtlasSection?.setMode2CSTFocus?.(
        mode2AxialEnabled && mode2Selection.includes('Corticospinal tract'));
      scheduleAxial();
    }
    function setMode2Territories(ids,side,alpha){
      territorySelection=Array.isArray(ids)?ids:[];
      territoryOpacity=Number.isFinite(alpha)?alpha:.48;
      if(mode2Territories)mode2Territories.setSelection(territorySelection,side||req.hemisphere,territoryOpacity);
    }
    function setMode2Vessels(ids,side,show){
      vesselSelection=Array.isArray(ids)?ids:[];
      vesselEnabled=show!==false;
      mode2Vessels?.setSelection(vesselSelection,side||req.hemisphere,vesselEnabled);
    }
    function setMode2Lesion(caseId,side){
      lesionSelection=caseId||null;
      lesionSide=side==='right'?'right':'left';
      mode2Lesions?.setSelection(lesionSelection,lesionSide);
    }
    function getMode2Diagnostics(){return {pathways:mode2?.getDiagnostics()||{supplementalReady:false},territories:mode2Territories?.getDiagnostics()||{ready:false},vessels:mode2Vessels?.getDiagnostics()||{ready:false},lesions:mode2Lesions?.getDiagnostics()||{ready:false}};}
    function setSpinalTracts(labels){
      spinalRoutes=labels||[];
      if(spinal)spinal.setPathways(spinalRoutes,req.hemisphere);
      scheduleAxial();
    }
    function setSpinalVisible(v) {
      spinalWant=!!v;
      if (spinal) spinal.group.visible=spinalWant;
      placeAxialGuide();scheduleAxial();
    }
    function focusBrainSpinal() {
      if (!spinal) return;
      const b=new T.Box3();
      // The original brain is displayed in its existing transform and is NOT moved.
      for(const m of sourceCoreMeshes) b.expandByObject(m);
      b.expandByObject(spinal.group);
      frameBox(b,3.2);
    }
    function focusSpinal() {
      if (spinal && spinal.ready) frameBox(new T.Box3().setFromObject(spinal.group),3.8);
    }
    function getSpinalInfo() {
      return spinal ? {loaded:spinal.ready,visible:spinalWant,segments:spinal.segments,
        sourceAnchorMin:spinal.sourceBounds.min.toArray(),sourceAnchorMax:spinal.sourceBounds.max.toArray(),
        topY:spinal.topY,bottomY:spinal.bottomY,externalOnly:false,schematic:true,
        error:spinal.error} : {loaded:false,visible:spinalWant,externalOnly:true};
    }

    function setAutoRotate(v) { autoRot = v; }
    function setExposure(v) { renderer.toneMappingExposure = v; }
    function setBackground() {}
    function frameSphere(center, radius, dist) {
      tgtGoal.copy(center);
      sphGoal.radius = Math.max(2.6, Math.min(16, dist || radius * 3));
      autoRot = false; idleTimer = 0;
    }

    /* ============================================================
       VR (WebXR) — beta. Drops the specimen into a floor-anchored
       hologram you can physically walk around (room-scale), spin and
       resize with the thumbsticks, and pick apart by pointing a
       controller and pulling the trigger. Same meshes, same picking
       as the desktop view - just presented in immersive space.
       ============================================================ */
    renderer.xr.enabled = true;
    let inVR = false, vrHovered = null;
    const VR_DIST = -0.7, VR_HEIGHT = 1.4, VR_SCALE = 0.24;   // a graspable ~0.8 m brain at eye level
    const savedRoot = { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, s: 1 };
    let vrGrid = null;
    const controllers = [];
    // gesture state - works for hand-tracking pinches AND controller triggers, since
    // WebXR maps a hand pinch to the same 'select' action a trigger fires.
    const pinched = [false, false];
    const pinchStart = [new T.Vector3(), new T.Vector3()];
    const pinchMoved = [0, 0];
    const pinchHit = [null, null];
    const TAP = 0.045;                     // hand travel (m) below which a pinch is a tap (select) not a grab
    const grab = { mode: 0, hand: null, pair: null, offset: new T.Matrix4() };   // 0 none · 1 one-hand · 2 two-hand
    const xrRay = new T.Raycaster();
    const tmpMat = new T.Matrix4(), frameM = new T.Matrix4();
    const headPos = new T.Vector3();
    const pA = new T.Vector3(), pB = new T.Vector3(), midV = new T.Vector3(), scV = new T.Vector3();
    const tmpQ = new T.Quaternion();
    const vUp = new T.Vector3(0, 1, 0), vRight = new T.Vector3(), vDir = new T.Vector3(), vFwd = new T.Vector3();

    /* ============================================================
       In-scene UI - interactive canvas panels visible in the headset.
       Each panel carries hit-test "regions"; a pinch (tap) on a region
       fires its action via opts.onVRAction, so the web UI's controls work
       in VR. Panels (all anchored relative to the brain):
         · info      - selected structure + Related buttons   (brain's right, top)
         · side      - how-to + Exit VR                        (brain's right, under info)
         · controls  - hemisphere / layers / views            (brain's left)
         · narration - Systems/Learn step card                 (below the brain)
       ============================================================ */
    const FS = 'sans-serif';
    let vrUI = null;
    const panels = {};            // key -> panel
    const ipanels = [];           // panels in hit-test order
    let vrInfo = null, vrControls = null, vrNarration = null;
    const pinchUI = [null, null]; // region/'bg'/null that each pinch began on
    const grabHand = [false, false];
    const act = (type, val) => { if (opts.onVRAction) opts.onVRAction(type, val); };

    function makePanel(key, wMeters, pxW, pxH) {
      const canvas = document.createElement('canvas'); canvas.width = pxW; canvas.height = pxH;
      const ctx = canvas.getContext('2d');
      const tex = new T.CanvasTexture(canvas); tex.anisotropy = 4;
      const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide, depthTest: false });
      const mesh = new T.Mesh(new T.PlaneGeometry(wMeters, wMeters * pxH / pxW), mat);
      mesh.renderOrder = 10;
      const p = { key, mesh, canvas, ctx, tex, w: pxW, h: pxH, regions: [] };
      panels[key] = p; ipanels.push(p);
      return p;
    }
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function wrap(ctx, text, maxW) {
      const words = (text || '').split(/\s+/); const lines = []; let line = '';
      for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
      if (line) lines.push(line); return lines;
    }
    function clearPanel(p, alpha) {
      const { ctx, canvas } = p; ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(10,14,24,' + (alpha == null ? 0.92 : alpha) + ')'; roundRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 26); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 2; ctx.stroke();
      p.regions = [];
    }
    // draw a button + register its hit region; o: {bg,fg,border,dot,font,r,center,action}
    function chip(p, x, y, w, h, label, o) {
      o = o || {}; const ctx = p.ctx;
      ctx.fillStyle = o.bg || 'rgba(255,255,255,0.06)'; roundRect(ctx, x, y, w, h, o.r != null ? o.r : 12); ctx.fill();
      if (o.border) { ctx.strokeStyle = o.border; ctx.lineWidth = 2; ctx.stroke(); }
      if (o.dot) { ctx.fillStyle = o.dot; ctx.beginPath(); ctx.arc(x + 20, y + h / 2, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = o.fg || '#E9EDF6'; ctx.font = o.font || '600 24px ' + FS;
      ctx.textBaseline = 'middle'; ctx.textAlign = o.center ? 'center' : 'left';
      ctx.fillText(label, o.center ? x + w / 2 : x + (o.dot ? 38 : 16), y + h / 2 + 1);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (o.action) p.regions.push({ x, y, w, h, action: o.action });
    }

    function drawInfo() {
      const p = panels.info; if (!p) return;
      const info = vrInfo; p.mesh.visible = !!info;
      if (!info) { p.regions = []; return; }
      const { ctx } = p; const W = p.w, pad = 38;
      clearPanel(p, 0.92);
      ctx.fillStyle = info.color || '#3A66FF'; ctx.beginPath(); ctx.arc(pad + 12, 54, 13, 0, Math.PI * 2); ctx.fill();
      if (info.side) {
        ctx.font = '600 24px ' + FS; const sw = ctx.measureText(info.side).width;
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, W - pad - sw - 30, 34, sw + 30, 40, 20); ctx.fill();
        ctx.fillStyle = 'rgba(233,237,246,0.85)'; ctx.fillText(info.side, W - pad - sw - 15, 62);
      }
      ctx.fillStyle = '#E9EDF6'; ctx.font = '800 40px ' + FS;
      const tl = wrap(ctx, info.title || '', W - pad * 2 - 40).slice(0, 2);
      tl.forEach((l, i) => ctx.fillText(l, pad + 40, 66 + i * 46));
      let y = 66 + tl.length * 46 + 22;
      ctx.fillStyle = 'rgba(180,190,210,0.92)'; ctx.font = '400 27px ' + FS;
      wrap(ctx, info.body || '', W - pad * 2).slice(0, 6).forEach(l => { ctx.fillText(l, pad, y); y += 36; });
      if (info.related && info.related.length) {
        y += 10; ctx.fillStyle = 'rgba(150,160,180,0.9)'; ctx.font = '700 20px ' + FS;
        ctx.fillText('RELATED STRUCTURES', pad, y); y += 26;
        let x = pad; const ch = 46;
        info.related.forEach(r => {
          const lbl = r.label + (r.side && r.side !== 'median' ? '  ' + (r.side === 'left' ? 'L' : 'R') : '');
          ctx.font = '600 22px ' + FS; const w = Math.min(W - pad * 2, ctx.measureText(lbl).width + 28);
          if (x + w > W - pad) { x = pad; y += ch + 12; }
          chip(p, x, y, w, ch, lbl, { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.14)', font: '600 22px ' + FS, action: () => act('select', r.id) });
          x += w + 12;
        });
      }
      p.tex.needsUpdate = true;
    }
    function drawSide() {
      const p = panels.side; if (!p) return;
      clearPanel(p, 0.88);
      const { ctx } = p; const W = p.w, pad = 30;
      ctx.fillStyle = '#8ee0ff'; ctx.font = '700 22px ' + FS; ctx.fillText('HOW TO', pad, 42);
      const rows = [['Pinch', 'select · press a button'], ['Pinch + move', 'grab & move the brain'], ['Two hands', 'pull apart to resize']];
      let y = 80;
      rows.forEach(r => {
        ctx.fillStyle = '#cfe8ff'; ctx.font = '700 23px ' + FS; ctx.fillText(r[0], pad, y);
        ctx.fillStyle = 'rgba(200,208,222,0.8)'; ctx.font = '400 21px ' + FS; ctx.fillText(r[1], pad + 200, y);
        y += 36;
      });
      const bh = 60, bw = W - pad * 2;
      chip(p, pad, p.h - bh - 24, bw, bh, '✕  Exit VR', { bg: 'rgba(200,60,84,0.92)', border: 'rgba(255,255,255,0.25)', fg: '#fff', font: '800 30px ' + FS, r: bh / 2, center: true, action: () => endSession() });
      p.tex.needsUpdate = true;
    }
    function drawControls() {
      const p = panels.controls; if (!p) return;
      const c = vrControls; p.mesh.visible = !!c;
      if (!c) { p.regions = []; return; }
      clearPanel(p, 0.92);
      const { ctx } = p; const W = p.w, pad = 28; let y = 40;
      ctx.fillStyle = '#E9EDF6'; ctx.font = '800 32px ' + FS; ctx.fillText('Controls', pad, y); y += 30;
      ctx.fillStyle = 'rgba(150,160,180,0.9)'; ctx.font = '700 18px ' + FS; ctx.fillText('HEMISPHERE', pad, y); y += 16;
      const segW = (W - pad * 2 - 16) / 3;
      [['left', 'Left'], ['both', 'Both'], ['right', 'Right']].forEach((o, i) => {
        const on = c.hemisphere === o[0];
        chip(p, pad + i * (segW + 8), y, segW, 52, o[1], { bg: on ? '#3A66FF' : 'rgba(255,255,255,0.06)', fg: on ? '#fff' : '#cdd5e4', font: '700 22px ' + FS, center: true, action: () => act('hemisphere', o[0]) });
      });
      y += 52 + 26;
      ctx.fillStyle = 'rgba(150,160,180,0.9)'; ctx.font = '700 18px ' + FS; ctx.fillText('LAYERS', pad, y); y += 16;
      (c.layers || []).forEach(L => {
        const h = 48;
        chip(p, pad, y, W - pad * 2, h, L.label, { bg: L.on ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.035)', dot: L.color, fg: L.on ? '#E9EDF6' : 'rgba(160,168,184,0.8)', font: '600 22px ' + FS, action: () => act('toggleLayer', L.cat) });
        // on/off check at the right edge
        ctx.fillStyle = L.on ? '#5fd08a' : 'rgba(255,255,255,0.16)';
        roundRect(ctx, pad + (W - pad * 2) - 40, y + h / 2 - 12, 24, 24, 7); ctx.fill();
        y += h + 8;
      });
      y += 8;
      const bw = (W - pad * 2 - 16) / 3;
      [['showAll', 'Show all'], ['hideAll', 'Hide all'], ['reset', 'Reset']].forEach((o, i) => {
        chip(p, pad + i * (bw + 8), y, bw, 50, o[1], { bg: 'rgba(255,255,255,0.06)', fg: '#cdd5e4', font: '600 20px ' + FS, center: true, action: () => act(o[0]) });
      });
      y += 50 + 26;
      ctx.fillStyle = 'rgba(150,160,180,0.9)'; ctx.font = '700 18px ' + FS; ctx.fillText('VIEWS', pad, y); y += 16;
      let x = pad;
      (c.presets || []).forEach(pr => {
        ctx.font = '600 20px ' + FS; const w = ctx.measureText(pr.label).width + 28;
        if (x + w > W - pad) { x = pad; y += 48; }
        chip(p, x, y, w, 42, pr.label, { bg: pr.active ? '#3A66FF' : 'rgba(255,255,255,0.06)', fg: pr.active ? '#fff' : '#cdd5e4', font: '600 20px ' + FS, action: () => act('preset', pr.id) });
        x += w + 10;
      });
      p.tex.needsUpdate = true;
    }
    function drawNarration() {
      const p = panels.narration; if (!p) return;
      const n = vrNarration; p.mesh.visible = !!n;
      if (!n) { p.regions = []; return; }
      clearPanel(p, 0.92);
      const { ctx } = p; const W = p.w, pad = 34;
      ctx.fillStyle = '#8ee0ff'; ctx.font = '700 20px ' + FS;
      ctx.fillText((n.kind || 'Step').toUpperCase() + ' · ' + (n.step + 1) + ' / ' + n.total, pad, 40);
      ctx.fillStyle = '#E9EDF6'; ctx.font = '800 32px ' + FS;
      ctx.fillText(wrap(ctx, n.title || '', W - pad * 2)[0] || '', pad, 80);
      ctx.fillStyle = 'rgba(190,200,216,0.9)'; ctx.font = '400 24px ' + FS;
      wrap(ctx, n.body || '', W - pad * 2).slice(0, 4).forEach((l, i) => ctx.fillText(l, pad, 120 + i * 32));
      const bh = 56, by = p.h - bh - 22, bw = 170;
      chip(p, pad, by, bw, bh, '‹ Prev', { fg: '#cdd5e4', font: '700 24px ' + FS, center: true, action: () => act('narrPrev') });
      chip(p, pad + bw + 12, by, bw, bh, n.last ? (n.isLesson ? 'To quiz ›' : 'Done') : 'Next ›', { bg: '#3A66FF', fg: '#fff', font: '700 24px ' + FS, center: true, action: () => act('narrNext') });
      chip(p, W - pad - 160, by, 160, bh, '✕ Close', { fg: '#cdd5e4', font: '700 24px ' + FS, center: true, action: () => act('narrClose') });
      p.tex.needsUpdate = true;
    }
    function setVRInfo(info) { vrInfo = info || null; if (panels.info) drawInfo(); }
    function setVRControls(c) { vrControls = c || null; if (panels.controls) drawControls(); }
    function setVRNarration(n) { vrNarration = n || null; if (panels.narration) drawNarration(); }

    function buildVRUI() {
      if (vrUI) return;
      vrUI = new T.Group(); scene.add(vrUI);
      makePanel('info', 0.44, 800, 660); panels.info.mesh.visible = false;
      makePanel('side', 0.44, 800, 300);
      makePanel('controls', 0.34, 640, 1180);
      makePanel('narration', 0.6, 1100, 360); panels.narration.mesh.visible = false;
      Object.values(panels).forEach(p => vrUI.add(p.mesh));
      drawSide(); drawInfo(); drawControls(); drawNarration();
    }

    function buildControllers() {
      if (controllers.length) return;
      const rayGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -1)]);
      for (let i = 0; i < 2; i++) {
        const c = renderer.xr.getController(i);
        c.userData.idx = i;
        c.addEventListener('selectstart', () => onPinchStart(c));
        c.addEventListener('selectend', () => onPinchEnd(c));
        const line = new T.Line(rayGeo, new T.LineBasicMaterial({ color: 0x8ee0ff, transparent: true, opacity: 0.9 }));
        line.scale.z = 5; line.name = 'ray';
        c.add(line);
        const tip = new T.Mesh(new T.SphereGeometry(0.012, 12, 12), new T.MeshBasicMaterial({ color: 0x8ee0ff }));
        tip.name = 'tip'; c.add(tip);
        scene.add(c);
        controllers.push(c);
      }
    }

    function setRay(c) {
      tmpMat.identity().extractRotation(c.matrixWorld);
      xrRay.ray.origin.setFromMatrixPosition(c.matrixWorld);
      xrRay.ray.direction.set(0, 0, -1).applyMatrix4(tmpMat).normalize();
    }
    function controllerHit(c) {
      setRay(c);
      const cand = allMeshes.filter(m => m.visible && m.material.opacity > 0.14);
      const hits = xrRay.intersectObjects(cand, false);
      return hits.length ? hits[0] : null;
    }
    // which UI region (if any) does this hand point at? returns region | 'bg' | null
    function regionAt(c) {
      setRay(c);
      for (const p of ipanels) {
        if (!p.mesh.visible) continue;
        const h = xrRay.intersectObject(p.mesh, false);
        if (h.length && h[0].uv) {
          const u = h[0].uv, px = u.x * p.w, py = (1 - u.y) * p.h;
          const r = p.regions.find(rg => px >= rg.x && px <= rg.x + rg.w && py >= rg.y && py <= rg.y + rg.h);
          return r || 'bg';
        }
      }
      return null;
    }
    function endSession() { const s = renderer.xr.getSession(); if (s) s.end(); }

    // ---- grab math: drive the brain from a "grab frame" (one hand = its pose;
    // two hands = a handlebar whose length scales the brain) ----
    function frameFor(out, mode, a, b) {
      if (mode === 2) {
        pA.setFromMatrixPosition(a.matrixWorld); pB.setFromMatrixPosition(b.matrixWorld);
        midV.addVectors(pA, pB).multiplyScalar(0.5);
        const dist = Math.max(0.0001, pA.distanceTo(pB));
        const angle = Math.atan2(pB.x - pA.x, pB.z - pA.z);
        tmpQ.setFromAxisAngle(vUp, angle);
        return out.compose(midV, tmpQ, scV.set(dist, dist, dist));   // the handlebar length carries the resize
      }
      return out.copy(a.matrixWorld);                                 // one hand: pose only, size unchanged
    }
    function beginGrab(mode, a, b) {
      grab.mode = mode; grab.hand = mode === 1 ? a : null; grab.pair = mode === 2 ? [a, b] : null;
      frameFor(frameM, mode, a, b);
      grab.offset.copy(frameM).invert().multiply(root.matrixWorld);   // root pose relative to the grab frame
    }
    function applyGrab() {
      if (!grab.mode) return;
      const a = grab.mode === 2 ? grab.pair[0] : grab.hand;
      const b = grab.mode === 2 ? grab.pair[1] : null;
      frameFor(frameM, grab.mode, a, b);
      tmpMat.multiplyMatrices(frameM, grab.offset);
      tmpMat.decompose(root.position, root.quaternion, root.scale);
      if (root.scale.x < 0.05 || root.scale.x > 1.4) root.scale.setScalar(Math.max(0.05, Math.min(1.4, root.scale.x)));
    }

    // ---- gesture handlers: pinch a panel = press a button; pinch a structure = select;
    // pinch-drag empty = grab/move; two free pinches = resize/rotate ----
    function onPinchStart(c) {
      const i = c.userData.idx;
      pinched[i] = true; pinchMoved[i] = 0;
      pinchStart[i].setFromMatrixPosition(c.matrixWorld);
      const ui = regionAt(c); pinchUI[i] = ui;
      pinchHit[i] = ui ? null : controllerHit(c);   // only target a structure when not on a panel
    }
    function onPinchEnd(c) {
      const i = c.userData.idx;
      pinched[i] = false;
      const ui = pinchUI[i]; pinchUI[i] = null;
      if (ui) { if (ui !== 'bg' && pinchMoved[i] < TAP && ui.action) ui.action(); }   // button press
      else if (!grabHand[i] && pinchMoved[i] < TAP) {                                  // tap on a structure = select
        const hit = pinchHit[i];
        if (opts.onPick) opts.onPick(hit ? hit.object.userData.nodeId : null, hit ? hit.object : null);
      }
    }

    function layoutVRUI() {
      if (!vrUI) return;
      const xrCam = renderer.xr.getCamera(camera);
      xrCam.getWorldPosition(headPos);
      const center = root.position;                          // model is centered on root's origin
      const radius = root.scale.x * 1.7;
      vDir.subVectors(center, headPos); vDir.y = 0; if (vDir.lengthSq() < 1e-5) vDir.set(0, 0, -1); vDir.normalize();
      vRight.crossVectors(vUp, vDir).normalize();            // unit vector to the brain's right (from the viewer)
      const rx = radius + 0.30;
      // right column: description on top, how-to + Exit beneath it (fixed offsets so the
      // how-to stays put even when nothing is selected and the description is hidden)
      panels.info.mesh.position.copy(center).addScaledVector(vRight, -rx).setY(center.y + 0.18);
      panels.side.mesh.position.copy(center).addScaledVector(vRight, -rx).setY(center.y - 0.16);
      // left column: the control panel
      panels.controls.mesh.position.copy(center).addScaledVector(vRight, radius + 0.34).setY(center.y);
      // below: the Systems/Learn narration card
      panels.narration.mesh.position.copy(center).setY(center.y - (radius + 0.30));
      Object.values(panels).forEach(p => { if (p.mesh.visible) p.mesh.lookAt(headPos); });
    }

    function pollVR(dt) {
      const session = renderer.xr.getSession(); if (!session) return;
      // measure pinch travel for grab/tap discrimination (panel pinches never grab)
      controllers.forEach(c => {
        const i = c.userData.idx;
        if (pinched[i] && !pinchUI[i]) { pA.setFromMatrixPosition(c.matrixWorld); pinchMoved[i] = Math.max(pinchMoved[i], pA.distanceTo(pinchStart[i])); }
      });
      const gh = controllers.filter(c => pinched[c.userData.idx] && !pinchUI[c.userData.idx]);
      if (gh.length >= 2) { if (grab.mode !== 2) beginGrab(2, gh[0], gh[1]); }
      else if (gh.length === 1) { const i = gh[0].userData.idx; if (grab.mode === 2) beginGrab(1, gh[0]); else if (grab.mode === 0 && pinchMoved[i] >= TAP) beginGrab(1, gh[0]); }
      else { grab.mode = 0; grab.hand = null; grab.pair = null; }
      grabHand[0] = grabHand[1] = false;
      if (grab.mode === 1 && grab.hand) grabHand[grab.hand.userData.idx] = true;
      if (grab.mode === 2 && grab.pair) { grabHand[grab.pair[0].userData.idx] = true; grabHand[grab.pair[1].userData.idx] = true; }
      applyGrab();

      // thumbsticks (controllers only - hands have no gamepad). Disabled while grabbing.
      if (!grab.mode) {
        let yaw = 0, scaleDelta = 0, slideZ = 0, slideX = 0;
        for (const src of session.inputSources) {
          const gp = src.gamepad; if (!gp || !gp.axes) continue;
          const ax = gp.axes;
          let sx = ax.length >= 4 ? ax[2] : ax[0];
          let sy = ax.length >= 4 ? ax[3] : ax[1];
          if (Math.abs(sx) < 0.18) sx = 0;
          if (Math.abs(sy) < 0.18) sy = 0;
          if (src.handedness === 'left') { slideX += sx; slideZ += sy; } else { yaw += sx; scaleDelta += sy; }
        }
        if (yaw) root.rotation.y -= yaw * dt * 2.4;
        if (slideZ) root.position.z = Math.max(-3, Math.min(-0.2, root.position.z + slideZ * dt * 1.3));
        if (slideX) root.position.x = Math.max(-1.6, Math.min(1.6, root.position.x + slideX * dt * 1.3));
        if (scaleDelta) root.scale.setScalar(Math.max(0.05, Math.min(1.3, root.scale.x * (1 - scaleDelta * dt * 1.3))));
      }
      // hover glow + ray length from whichever hand/controller is closest to a structure
      let best = null;
      controllers.forEach(c => {
        const h = controllerHit(c);
        const ray = c.getObjectByName('ray');
        if (ray) { ray.scale.z = h ? h.distance : 5; ray.material.color.setHex(h ? 0xffffff : 0x8ee0ff); }
        if (h && (!best || h.distance < best.distance)) best = h;
      });
      vrHovered = best ? best.object : null;
      hovered = vrHovered;   // reuse the desktop emissive-boost path for the pointed-at mesh
      layoutVRUI();
    }

    function enterVRRig() {
      inVR = true;
      savedRoot.px = root.position.x; savedRoot.py = root.position.y; savedRoot.pz = root.position.z;
      savedRoot.rx = root.rotation.x; savedRoot.ry = root.rotation.y; savedRoot.rz = root.rotation.z;
      savedRoot.s = root.scale.x;
      root.position.set(0, VR_HEIGHT, VR_DIST);
      root.scale.setScalar(VR_SCALE);
      scene.background = new T.Color(0x05070d);
      if (!vrGrid) { vrGrid = new T.GridHelper(12, 24, 0x2a3550, 0x161c2c); vrGrid.material.transparent = true; vrGrid.material.opacity = 0.45; }
      scene.add(vrGrid);
      buildControllers();
      buildVRUI();
      vrUI.visible = true;
      setVRInfo(vrInfo);
      autoRot = false;
      if (opts.onVR) opts.onVR(true);
    }

    function exitVRRig() {
      inVR = false;
      grab.mode = 0; grab.hand = null; grab.pair = null;
      pinched[0] = pinched[1] = false; pinchHit[0] = pinchHit[1] = null; pinchUI[0] = pinchUI[1] = null;
      grabHand[0] = grabHand[1] = false;
      root.position.set(savedRoot.px, savedRoot.py, savedRoot.pz);
      root.rotation.set(savedRoot.rx, savedRoot.ry, savedRoot.rz);
      root.scale.setScalar(savedRoot.s);
      scene.background = null;
      if (vrGrid) scene.remove(vrGrid);
      if (vrUI) vrUI.visible = false;
      hovered = null; vrHovered = null;
      autoRot = opts.autorotate !== false;
      if (opts.onVR) opts.onVR(false);
    }

    renderer.xr.addEventListener('sessionstart', enterVRRig);
    renderer.xr.addEventListener('sessionend', exitVRRig);

    const vr = {
      supported() {
        if (!navigator.xr || !navigator.xr.isSessionSupported) return Promise.resolve(false);
        return navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
      },
      enter() {
        if (!navigator.xr) return Promise.reject(new Error('WebXR unavailable'));
        return navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] })
          .then(session => { renderer.xr.setReferenceSpaceType('local-floor'); return renderer.xr.setSession(session); });
      },
      exit() { const s = renderer.xr.getSession(); if (s) return s.end(); },
      isActive() { return inVR; },
      // test hook: build the panels + draw sample data outside a session and report the
      // number of clickable regions per panel (validates the in-VR UI without a headset).
      _test(payload) {
        buildVRUI(); vrUI.visible = false;
        payload = payload || {};
        setVRInfo(payload.info || null);
        setVRControls(payload.controls || null);
        setVRNarration(payload.narration || null);
        const count = k => (panels[k] && panels[k].mesh.visible ? panels[k].regions.length : (panels[k] ? panels[k].regions.length : -1));
        return { info: count('info'), side: count('side'), controls: count('controls'), narration: count('narration') };
      },
    };

    /* ---------------- resize + loop ---------------- */
    function resize() {
      const r = dom.getBoundingClientRect();
      const w = Math.max(2, r.width), h = Math.max(2, r.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(() => { resize(); scheduleAxial(); });
    ro.observe(dom);
    if (dom.parentElement) ro.observe(dom.parentElement);
    resize();

    let t0 = performance.now();
    function loop(now) {
      if (sceneDisposed || contextLost) return;
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      idleTimer += dt;
      if (inVR) pollVR(dt);
      if (autoRot && !dragging && idleTimer > 1.2) sphGoal.theta += dt * 0.11;
      const k = 1 - Math.pow(0.0016, dt);
      sph.radius += (sphGoal.radius - sph.radius) * k;
      sph.phi += (sphGoal.phi - sph.phi) * k;
      sph.theta += (sphGoal.theta - sph.theta) * k;
      target.lerp(tgtGoal, k);
      if (!renderer.xr.isPresenting) applyCamera();   // in VR the headset pose drives the camera

      if (loaded && hiOn) {
        // ---- functional-system highlight pass ----
        const fade = 1 - Math.pow(0.0022, dt);
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);   // gentle breathing glow
        allMeshes.forEach(m => {
          const ud = m.userData;
          const hemiOk = !ud.hemiHidden;
          const cap = ud.maxOpacity != null ? ud.maxOpacity : 1;
          const isActive = hemiOk && hiActive.has(ud.nodeId);
          const isSeen = hemiOk && !isActive && hiSeen.has(ud.nodeId);
          let tgt;
          if (isActive) tgt = Math.min(cap, 1);
          else if (isSeen) tgt = Math.min(cap, 0.62);
          else if (hemiOk && GHOST_CATS.has(ud.cat)) tgt = 0.05;   // faint context
          else tgt = 0;
          // The three anatomical-context controls take precedence over preset,
          // highlighting and selection. ON=1, OFF=0, Fade=cortex slider alpha.
          if((ud.cat==='brainstem'||ud.cat==='cerebellum')&&cats[ud.cat]){
            const cc=cats[ud.cat];
            tgt=(cc.want && hemiOk) ? Math.min(cap,cc.targetOpacity) : 0;
          }
          m.material.opacity += (tgt - m.material.opacity) * (isActive ? 1 : fade);
          m.material.depthWrite = m.material.opacity >= 0.98;
          m.visible = m.material.opacity > 0.012;
          m.material.color.copy(ud.baseColor);
          if (isActive) {
            m.material.emissive.copy(ud.baseColor).multiplyScalar(Math.min(1.1, ud.baseEmiss * 2.4 + 0.30 + pulse * 0.22));
            m.renderOrder = 3;
          } else if (isSeen) {
            m.material.emissive.copy(ud.baseColor).multiplyScalar(ud.baseEmiss + 0.05);
            m.renderOrder = 1;
          } else {
            m.material.emissive.copy(ud.baseColor).multiplyScalar(ud.baseEmiss * 0.4);
            m.renderOrder = 0;
          }
        });
      } else if (loaded) {
        const fade = 1 - Math.pow(0.0022, dt);
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);   // gentle breathing glow for VR feedback
        allMeshes.forEach(m => {
          const c = cats[m.userData.cat];
          const want = c && c.want && !m.userData.hemiHidden && !m.userData.isoHidden && !m.userData.subsetHidden;
          const cap = m.userData.maxOpacity != null ? m.userData.maxOpacity : 1;
          const isSel = selectedIds.has(m);
          const isEmph = !m.userData.hemiHidden && emphasizedIds.has(m.userData.nodeId);
          const isContext = !m.userData.hemiHidden && routeContextIds.has(m.userData.nodeId) && currentRouteLabels.length > 0;
          const routeColor = m.userData.cat === 'tracts' ? window.Mode1Routes?.colorFor(window.BRAIN.nodes.find(n=>n.id===m.userData.nodeId)?.label) : null;
          const drawColor = routeColor ? new T.Color(routeColor) : m.userData.baseColor;
          // selected and enabled pathway meshes stay legible even under a translucent cortex
          const tgt = isSel || isEmph ? 1 : (isContext ? 0.32 : (want ? Math.min(cap, c.targetOpacity) : 0));
          // Apply the explicit ON/Fade/OFF choice at the rendering stage.
          // Do not let selection, isolation or contextual highlighting override it.
          let finalTgt=tgt;
          if((m.userData.cat==='brainstem'||m.userData.cat==='cerebellum')&&c){
            finalTgt=(c.want && !m.userData.hemiHidden) ? Math.min(cap,c.targetOpacity) : 0;
          }
          if(suppressNativeCST(m))finalTgt=0;
          m.material.opacity += (finalTgt - m.material.opacity) * (suppressNativeCST(m) ? 1 : (isSel ? 1 : fade));
          // translucent meshes must not write depth, or they cull what's behind them
          m.material.depthWrite = m.material.opacity >= 0.98;
          m.visible = m.material.opacity > 0.012;
          if (isSel && inVR) {
            // in VR (dark stage, no HTML card) a darker shade reads as "vanished" -
            // so the selection BRIGHTENS and breathes to clearly stand out instead
            m.material.color.copy(m.userData.baseColor);
            m.material.emissive.copy(m.userData.baseColor).multiplyScalar(Math.min(1.2, m.userData.baseEmiss * 2.2 + 0.5 + pulse * 0.25));
          } else if (isEmph || (isSel && m.userData.cat === 'tracts')) {
            // Pathways: bright high-contrast material, never darken when clicked.
            m.material.color.copy(drawColor);
            m.material.emissive.copy(drawColor).multiplyScalar(m.userData.cat === 'tracts' ? (0.16 + (m === hovered ? 0.10 : 0)) : (m.userData.baseEmiss + 0.30 + (m === hovered ? 0.18 : 0)));
          } else if (isContext) {
            m.material.color.copy(m.userData.baseColor);
            m.material.emissive.copy(m.userData.baseColor).multiplyScalar(0.12);
          } else if (isSel) {
            m.material.color.copy(m.userData.baseColor).multiplyScalar(0.38);
            m.material.emissive.copy(m.userData.baseColor).multiplyScalar(m.userData.baseEmiss * 0.5);
          } else {
            m.material.color.copy(m.userData.baseColor);
            let e = m.userData.baseEmiss + (m === hovered ? (inVR ? 0.35 : 0.2) : 0);
            m.material.emissive.copy(m.userData.baseColor).multiplyScalar(e);
          }
          m.renderOrder = isSel ? 3 : (isEmph ? 2 : (isContext ? 1 : 0));
        });
      }
      if (loaded) { updateRouteImpulse(now); updateRouteAnnotations(); if(mode2)mode2.update(now);syncMode2Territories();syncMode2Vessels();syncMode2Lesions(); }
      renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(loop);   // setAnimationLoop (not rAF) so WebXR can drive the frame loop in VR

    /* ---------------- live re-palette ---------------- */
    function setPalette(map) {
      allMeshes.forEach(m => {
        const hex = map[m.userData.cat]; if (!hex) return;
        const c = shade(m.userData.cat, hex);
        m.userData.baseColor = c.clone();
        m.material.color.copy(c);           // emissive is recomputed each frame from baseColor
      });
    }

    /* ---------------- high-definition poster ---------------- */
    function capturePoster(W, H, meta) {
      meta = meta || {};
      const SS = 1.5;                                   // supersample for clean edges
      const rw = Math.round(W * SS), rh = Math.round(H * SS);
      const rt = new T.WebGLRenderTarget(rw, rh, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat });
      const oldA = camera.aspect;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera);
      const buf = new Uint8Array(rw * rh * 4);
      renderer.readRenderTargetPixels(rt, 0, 0, rw, rh, buf);
      renderer.setRenderTarget(null);
      camera.aspect = oldA; camera.updateProjectionMatrix(); rt.dispose();

      const tmp = document.createElement('canvas'); tmp.width = rw; tmp.height = rh;
      tmp.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buf), rw, rh), 0, 0);

      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      const cs = getComputedStyle(document.documentElement);
      const gv = (n, f) => (cs.getPropertyValue(n) || f).trim();
      const s1 = gv('--stage-1', '#1a2236'), s2 = gv('--stage-2', '#0c1018'), s3 = gv('--stage-3', '#06080d');
      const onc = gv('--on-stage', '#E9EDF6'), ons = gv('--on-stage-soft', '#9aa6bd');
      const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, Math.max(W, H) * 0.72);
      g.addColorStop(0, s1); g.addColorStop(0.5, s2); g.addColorStop(1, s3);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(0, H); ctx.scale(1, -1); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(tmp, 0, 0, W, H); ctx.restore();

      // top wordmark
      ctx.textBaseline = 'alphabetic';
      ctx.font = '600 26px "JetBrains Mono", monospace'; ctx.fillStyle = ons; ctx.globalAlpha = 0.85;
      ctx.fillText('BRAIN PROJECT', 64, 86); ctx.globalAlpha = 1;
      // bottom scrim
      const sg = ctx.createLinearGradient(0, H - 380, 0, H);
      sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = sg; ctx.fillRect(0, H - 380, W, 380);
      // accent dot + title
      const accent = meta.color || '#3A66FF';
      ctx.beginPath(); ctx.arc(64 + 13, H - 150, 13, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
      ctx.font = '800 78px "Hanken Grotesk", sans-serif'; ctx.fillStyle = onc;
      ctx.fillText(meta.title || 'Whole brain', 64 + 44, H - 124);
      ctx.font = '500 28px "Hanken Grotesk", sans-serif'; ctx.fillStyle = ons;
      let sub = (meta.subtitle || '');
      while (sub && ctx.measureText(sub).width > W - 128) sub = sub.slice(0, -2);
      if (sub !== (meta.subtitle || '')) sub = sub.replace(/\s+\S*$/, '') + ' …';
      ctx.fillText(sub, 64 + 44, H - 80);
      return cv.toDataURL('image/png');
    }

    return {
      THREE: T, scene, camera, renderer, cats,
      setLayer, setLayers, setHemisphere, focusCategory, focusNode,
      selectNode, clearSelect, setEmphasized, reset, frameSphere, snap, isolate, setSubset, zoom,
      setHighlight, clearHighlight, frameNodes, setRouteAnnotations, setRouteImpulse,
      setAutoRotate, setExposure, setBackground, setPalette, capturePoster, vr, setVRInfo, setVRControls, setVRNarration,
      setAxialCanvas, setAxialSlice, redrawAxialSlice:scheduleAxial, getAxialInfo, getAxialHit, getMode2SectionLevels, setMode2AxialEnabled,
      setSpinalVisible, setSpinalOpacity, setSpinalTracts, setMode2Pathways, setMode2MotorCircuit, setMode2Territories, setMode2Vessels, setMode2Lesion, getMode2Diagnostics, focusBrainSpinal, focusSpinal, getSpinalInfo,
      dispose() {
        if (sceneDisposed) return;
        sceneDisposed = true;
        clearTimeout(loadingNotice);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost, false);
        renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored, false);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('pointerup', up);
        dom.removeEventListener('pointerdown', down);
        dom.removeEventListener('pointermove', move);
        dom.removeEventListener('wheel', wheel);
        dom.removeEventListener('contextmenu', onContextMenu);
        renderer.xr.removeEventListener('sessionstart', enterVRRig);
        renderer.xr.removeEventListener('sessionend', exitVRRig);
        try { const s = renderer.xr.getSession(); if (s) s.end(); } catch (e) {}
        renderer.setAnimationLoop(null);
        axial.destroyed=true;if(axial.redrawHandle)cancelAnimationFrame(axial.redrawHandle);axial.rows.length=0; axial.slices.clear();mode2SmoothCache.clear(); axialDisc.geometry.dispose(); axialDisc.material.dispose(); axialRing.geometry.dispose(); axialRing.material.dispose(); annotationLayer.remove(); routePulseGroups.clear();
        mode2Territories?.dispose();
        mode2Vessels?.dispose();
        mode2Lesions?.dispose();
        if(mode2?.group)mode2.group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();o.material?.dispose();}});
        if(spinal){spinal.dispose?.();spinal.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});}
        // Release the specimen resources after any other consumers finish disposal.
        disposeMeshResources(model);
        draco.dispose();
        ro.disconnect(); renderer.dispose(); if (fallbackCanvas) { fallbackCanvas.remove(); canvas.style.display = originalCanvasDisplay; } },
    };
  }

  window.BrainScene = { create };
})();
