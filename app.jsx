/* Brain Project - app composition, state & scene wiring */

const CAT_ORDER = window.BRAIN.depth; // outer -> inner peel order
const SHORT = {
  meninges_dura: 'Dura & falx', veins_sinuses: 'Sinuses', arteries: 'Arteries', cortex: 'Cortex',
  white_matter: 'White matter', deep_grey: 'Deep grey', diencephalon: 'Diencephalon',
  ventricles: 'Ventricles', brainstem: 'Brainstem', cerebellum: 'Cerebellum', cranial_nerves: 'Nerves',
};

const PRESETS = [
  { id: 'whole',  label: '脳全体',     color: 'var(--c-cortex)',         on: ['cortex','cerebellum','brainstem'], cortex: 1,    focus: null },
  { id: 'vasc',   label: '脳血管',      color: 'var(--c-arteries)',       on: ['arteries','veins_sinuses'],        cortex: 0.12, focus: 'arteries' },
  { id: 'willis', label: 'ウィリス動脈輪', color: 'var(--c-arteries)',       on: ['arteries'],                        cortex: 0.08, focus: 'arteries',
    subset: { arteries: ['Anterior cerebral artery', 'Anterior communicating artery', 'Internal carotid artery', 'Posterior communicating artery', 'Posterior cerebral artery', 'Basilar artery'] } },
  { id: 'vent',   label: '脳室',       color: 'var(--c-ventricles)',     on: ['ventricles'],                      cortex: 0.10, focus: 'ventricles' },
  { id: 'limbic', label: '辺縁系',    color: 'var(--c-deep_grey)',      on: ['deep_grey','white_matter','diencephalon'], cortex: 0.12, focus: 'deep_grey',
    // Only the true limbic structures - excludes corpus callosum, basal ganglia, thalamus, geniculate/optic relays, etc.
    subset: {
      deep_grey:    ['Lateral nucleus', 'Basolateral complex', 'Central nucleus', 'Corticomedial group', 'Septal nuclei'],
      white_matter: ['Fornix', 'Hippocampal commissure', 'Stria terminalis', 'Anterior commissure'],
      diencephalon: ['Mamillary body', 'Preoptic hypothalamus', 'Anterior hypothalamus', 'Tuberal hypothalamus', 'Lateral hypothalamus', 'Posterior hypothalamus', 'Habenula', 'Stria medullaris thalami'],
    } },
  { id: 'deep',   label: '深部灰白質',        color: 'var(--c-deep_grey)',      on: ['deep_grey','diencephalon'],   cortex: 0.12, focus: 'deep_grey' },
  { id: 'bgnuc',  label: '大脳基底核',    color: 'var(--c-deep_grey)',      on: ['deep_grey','brainstem'],           cortex: 0.10, focus: 'deep_grey',
    // Caudate/putamen/accumbens + the atlas-derived pallidal & subthalamic nuclei (GPe/GPi, STN, SN) and the brainstem red nucleus.
    subset: {
      deep_grey: ['Caudate nucleus', 'Putamen', 'Nucleus accumbens', 'Globus pallidus external', 'Globus pallidus internal', 'Subthalamic nucleus', 'Substantia nigra'],
      brainstem: ['Red nucleus'],
    } },
  { id: 'thalnuc', label: '視床核', color: 'var(--c-diencephalon)',   on: ['diencephalon'],                    cortex: 0.10, focus: 'diencephalon',
    subset: { diencephalon: ['Pulvinar', 'Anterior nuclei of thalamus', 'Mediodorsal nucleus', 'Ventral laterodorsal nucleus', 'Ventral lateroventral nucleus', 'Ventral anterior nucleus', 'Intralaminar and lateral posterior nuclei', 'Lateral geniculate body', 'Medial geniculate body'] } },
  { id: 'nerves', label: '脳神経',   color: 'var(--c-cranial_nerves)', on: ['cranial_nerves','brainstem'],      cortex: 0.12, focus: 'cranial_nerves' },
  { id: 'dura',   label: '髄膜・硬膜',  color: 'var(--c-meninges_dura)',  on: ['meninges_dura','veins_sinuses'],   cortex: 0.30, focus: null },
];

// Mode 2 reuses the HCP-derived original pathways. The expanded metadata lives in mode2-pathways.js.
const MODE1_PATHWAYS = [
  { label: 'Corticospinal tract', ja: '皮質脊髄路', group: '運動系' },
  { label: 'Corticobulbar tract', ja: '皮質延髄路', group: '運動系' },
  { label: 'Reticulospinal tract', ja: '網様体脊髄路', group: '運動系' },
  { label: 'Medial lemniscus', ja: '内側毛帯', group: '感覚系' },
  { label: 'Superior thalamic radiation', ja: '上視床放線', group: '感覚系' },
  { label: 'Optic radiation', ja: '視放線', group: '視覚系' },
  { label: 'Dentatorubrothalamic tract', ja: '歯状核赤核視床路', group: '小脳関連' },
];

// Shuffle palettes - 12 subsystems incl. white-matter tracts. These are deliberately
// far apart from each other (cortex tone, saturation and overall mood all shift) so a
// single tap on "Palette" is an unmistakable change, not a subtle nudge. The page default
// lives in data.js (window.BRAIN.palette); a refresh always returns to it.
const PALETTES = [
  // Jewel - saturated, gem-bright on a warm-cream cortex
  { name: 'Jewel',    colors: { cortex:'#E7DEC9', white_matter:'#D7DDE8', deep_grey:'#B57BE0', diencephalon:'#7E8CF2', brainstem:'#E8B24A', cerebellum:'#F0894E', ventricles:'#3FC8D6', arteries:'#F05068', veins_sinuses:'#5078E8', cranial_nerves:'#D9D24A', meninges_dura:'#CC63CC', tracts:'#46C2B0' } },
  // Ice - cool monochrome blues/teals, cortex a pale frost, one warm rescue (arteries)
  { name: 'Ice',      colors: { cortex:'#D6E2EC', white_matter:'#C4D4E2', deep_grey:'#6E86C8', diencephalon:'#4F9AD6', brainstem:'#3FB0C4', cerebellum:'#56C8C0', ventricles:'#7FE0E4', arteries:'#F2756A', veins_sinuses:'#3E72C8', cranial_nerves:'#9ED0E0', meninges_dura:'#8C9ED8', tracts:'#34C0D8' } },
  // Ember - earthy, warm clay & amber; cool structures pulled toward terracotta
  { name: 'Ember',    colors: { cortex:'#E8CDA8', white_matter:'#D8C4B0', deep_grey:'#C2683E', diencephalon:'#B8884A', brainstem:'#E0982E', cerebellum:'#E8743A', ventricles:'#C9A86A', arteries:'#E03C3C', veins_sinuses:'#8C5A86', cranial_nerves:'#F0C44A', meninges_dura:'#A85C4A', tracts:'#C98A3E' } },
  // Neon - electric, fully saturated against a cool-slate cortex
  { name: 'Neon',     colors: { cortex:'#C7D2DE', white_matter:'#AEBCCE', deep_grey:'#B14DFF', diencephalon:'#3D8BFF', brainstem:'#FFD23D', cerebellum:'#FF7A2E', ventricles:'#1EE0E0', arteries:'#FF2D6B', veins_sinuses:'#3A5DFF', cranial_nerves:'#EAFF3D', meninges_dura:'#FF4DE0', tracts:'#2DFFB0' } },
  // Bloom - soft pastels, gentle and desaturated, lavender-tinted cortex
  { name: 'Bloom',    colors: { cortex:'#EADFE8', white_matter:'#DCD6E6', deep_grey:'#B79CDE', diencephalon:'#9CB4E6', brainstem:'#E6C68A', cerebellum:'#E8A88C', ventricles:'#9CD8D2', arteries:'#E892A2', veins_sinuses:'#9CAEE0', cranial_nerves:'#D8D08C', meninges_dura:'#D29ECE', tracts:'#92CFC4' } },
  // Forest - greens, teals and ambers; mossy cortex, earthy and organic
  { name: 'Forest',   colors: { cortex:'#D8DEC2', white_matter:'#C6D2BE', deep_grey:'#7A9E6E', diencephalon:'#4F9E86', brainstem:'#D2A23C', cerebellum:'#E0883C', ventricles:'#46C2A0', arteries:'#D8543C', veins_sinuses:'#3E7E8C', cranial_nerves:'#C6C23C', meninges_dura:'#8E9E5C', tracts:'#5CB87E' } },
  // Mono - near-greyscale with a single bold accent per cool/warm; stark and editorial
  { name: 'Mono',     colors: { cortex:'#DEDEDE', white_matter:'#C8C8C8', deep_grey:'#8E8E96', diencephalon:'#9A9AA2', brainstem:'#B0AEA6', cerebellum:'#A6A6AA', ventricles:'#7FC2C8', arteries:'#E64A5C', veins_sinuses:'#5A78C8', cranial_nerves:'#D8C84A', meninges_dura:'#9A8EA2', tracts:'#6ABFB8' } },
  // Spectrum - the full wheel, maximally varied hue per subsystem
  { name: 'Spectrum', colors: { cortex:'#E8DAC0', white_matter:'#D6DEE8', deep_grey:'#A35CE0', diencephalon:'#5C6CE8', brainstem:'#F0B23C', cerebellum:'#F07A3C', ventricles:'#2CC8C8', arteries:'#F0405C', veins_sinuses:'#3C6CE8', cranial_nerves:'#E0D43C', meninges_dura:'#D44CC4', tracts:'#2CC86A' } },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3A66FF",
  "stage": "deep blue",
  "surface": "frosted",
  "autorotate": true,
  "glow": 1.06
}/*EDITMODE-END*/;

const STAGES = {
  'deep blue':  ['#1a2236', '#0c1018', '#06080d', '#E9EDF6', '#9aa6bd'],
  'charcoal':   ['#26262b', '#141417', '#08080a', '#ECECEE', '#9b9ba3'],
  'clinical':   ['#dfe6f0', '#c4cedd', '#aebccf', '#1a2030', '#5a667a'],
};

function useIsMobile(bp) {
  bp = bp || 640;
  const q = '(max-width: ' + bp + 'px)';
  const [m, setM] = React.useState(() => window.matchMedia(q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const h = (e) => setM(e.matches);
    mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); };
  }, []);
  return m;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const mobile = useIsMobile();
  const nodes = window.BRAIN.nodes;
  const cats = window.BRAIN.categories;
  const PAL = window.BRAIN.palette;
  const [palVer, setPalVer] = React.useState(0); // initialized before groups useMemo
  const DESC = window.BRAIN.descriptions;

  // Pathway state must be defined BEFORE pathwayNodeIds useMemo reads it.
  const [selectedTracts, setSelectedTracts] = React.useState(['Corticospinal tract']);
  // Mode 3 controls live in the persistent left control panel, as in Modes 1/2.
  const [mode3Mod, setMode3Mod] = React.useState('t1');
  const [mode3CTWindow, setMode3CTWindow] = React.useState('brain');
  const [mode3Guide, setMode3Guide] = React.useState('brain');
  const [mode3Position, setMode3Position] = React.useState(null);
  const [mode3Meta, setMode3Meta] = React.useState({});
  const [mode3Fit, setMode3Fit] = React.useState(0);
  // Mode 3 lesion controls are owned here; the panel and viewer share one state.
  const [mode3LesionEnabled, setMode3LesionEnabled] = React.useState(false);
  const [mode3LesionKind, setMode3LesionKind] = React.useState('ischemia');
  const [mode3LesionRegion, setMode3LesionRegion] = React.useState('mca');
  const [mode3LesionTime, setMode3LesionTime] = React.useState(0);
  const [mode3LesionView, setMode3LesionView] = React.useState('realistic');
  const [selectedTerritories,setSelectedTerritories]=React.useState([]);
  const [territoryOpacity,setTerritoryOpacity]=React.useState(.48);
  const [showSelectedArteries,setShowSelectedArteries]=React.useState(true);
  const [selectedLesion,setSelectedLesion]=React.useState(null);
  const [lesionSide,setLesionSide]=React.useState('left');
  // Mode 2 subview is owned by App so visualization state and panel never diverge.
  const [mode2Panel,setMode2Panel]=React.useState('routes');
  // In onset view, clinical lesion visibility takes priority. Previous selections
  // stay intact and can be overlaid explicitly without modifying Mode 1.
  const [lesionShowTerritories,setLesionShowTerritories]=React.useState(false);

  // ---- build grouped tree (memo) ----
  const groups = React.useMemo(() => {
    return CAT_ORDER.filter(cat => cat !== 'tracts').map(cat => {
      const ns = nodes.filter(n => n.category === cat);
      const byRegion = {};
      ns.forEach(n => { (byRegion[n.region] = byRegion[n.region] || []).push({ id: n.id, label: n.label, side: n.side, region:n.region, crumb:n.crumb, category:n.category }); });
      const regions = Object.keys(byRegion).sort().map(region => ({
        region, items: byRegion[region].sort((a, b) => a.label.localeCompare(b.label) || a.side.localeCompare(b.side)),
      }));
      return { cat, label: window.Mode1JP.categories[cat] || cats[cat].label, count: ns.length, color: PAL[cat], regions };
    });
  }, [palVer]);
  const nodeById = React.useMemo(() => { const m = {}; nodes.forEach(n => m[n.id] = n); return m; }, []);
  const pathwayNodeIds = React.useMemo(() => {
    const names = new Set(selectedTracts);
    if(names.has('Anterior corticospinal tract'))names.add('Corticospinal tract');
    return nodes.filter(n => n.category === 'tracts' && names.has(n.label)).map(n => n.id);
  }, [selectedTracts]);

  // resolve a system stage to real nodeIds (active = this stage, seen = earlier stages)
  const resolveStage = React.useCallback((systemId, stageIndex) => {
    const sys = window.SYS.SYSTEMS.find(s => s.id === systemId);
    if (!sys || !sys.stages[stageIndex]) return { activeIds: [], seenIds: [] };
    const activeKeys = sys.stages[stageIndex].nodes;
    const seenKeys = new Set();
    for (let i = 0; i < stageIndex; i++) sys.stages[i].nodes.forEach(k => seenKeys.add(k));
    const activeIds = [];
    activeKeys.forEach(k => window.SYS.idsForKey(k).forEach(id => activeIds.push(id)));
    const activeSet = new Set(activeIds);
    const seenIds = [];
    seenKeys.forEach(k => { if (!activeKeys.includes(k)) window.SYS.idsForKey(k).forEach(id => { if (!activeSet.has(id)) seenIds.push(id); }); });
    return { activeIds, seenIds };
  }, []);

  // ---- state ----
  const [search, setSearch] = React.useState('');
  const [searchSide, setSearchSide] = React.useState('both');  // filter results to one side
  const [hemisphere, setHemisphere] = React.useState('left');
  const [cortexOpacity, setCortexOpacity] = React.useState(1);
  const [layerOn, setLayerOn] = React.useState(() => { const o = {}; CAT_ORDER.forEach(c => o[c] = ['cortex', 'cerebellum', 'brainstem'].includes(c)); return o; });
  const [expanded, setExpanded] = React.useState(() => new Set());
  const [selectedId, setSelectedId] = React.useState(null);
  const [isolatedIds, setIsolatedIds] = React.useState(null);
  const [activePreset, setActivePreset] = React.useState('whole');
  const [atlasMode, setAtlasMode] = React.useState('anatomy');

  const [collapsed, setCollapsed] = React.useState(false);
  const [pos, setPos] = React.useState(() => { try { return JSON.parse(localStorage.getItem('ba_pos')) || { x: 16, y: 16 }; } catch (e) { return { x: 16, y: 16 }; } });
  const [hover, setHover] = React.useState(null); // {id, x, y}
  const hoverTimerRef = React.useRef(null);
  // Anatomical structure names: ordinary hover tooltip, unchanged in every Mode.
  // Separately, route-specific landmark annotations are controlled in Mode 2.
  const [showPathwayLandmarks, setShowPathwayLandmarks] = React.useState(false);
  const [hint, setHint] = React.useState(true);
  const [posterBusy, setPosterBusy] = React.useState(false);
  const palIdxRef = React.useRef(0);
  const [rotationPaused, setRotationPaused] = React.useState(false);
  const [focusedId, setFocusedId] = React.useState(null); // which node the camera is focused on

  // ---- modes: explore (structural) · systems (functional) · learn (lessons) ----
  const [mode, setMode] = React.useState('explore');
  const [sceneReady, setSceneReady] = React.useState(false);
  const [modelProblem, setModelProblem] = React.useState('');
  // VR (WebXR beta)
  const [vrSupported, setVrSupported] = React.useState(false);
  const [vrActive, setVrActive] = React.useState(false);
  const vrActionRef = React.useRef(null);   // current handler for in-VR panel button presses (kept fresh each render)
  // systems
  const [activeSystem, setActiveSystem] = React.useState(null);
  const [sysStep, setSysStep] = React.useState(0);
  const [sysPlaying, setSysPlaying] = React.useState(false);
  // lessons
  const [openLessonId, setOpenLessonId] = React.useState(null);
  const [phase, setPhase] = React.useState(null);          // 'intro' | 'playing' | 'quiz' | 'done'
  const [lessonStep, setLessonStep] = React.useState(0);
  const [lessonPlaying, setLessonPlaying] = React.useState(false);
  const [qIdx, setQIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [quizSet, setQuizSet] = React.useState([]);            // questions in the current round (drawn from the bank)
  const [quizTally, setQuizTally] = React.useState({ asked: 0, correct: 0 });  // running totals across rounds
  const quizSeenRef = React.useRef(new Set());                 // bank questions already used this session (avoid repeats)
  const [completed, setCompleted] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ba_completed') || '[]')); } catch (e) { return new Set(); }
  });
  const [toast, setToast] = React.useState('');
  const flash = (m) => { setToast(m); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(''), 2200); };
  const quizPickRef = React.useRef(null);     // LessonQuiz answer() for "find" questions
  const quizFindRef = React.useRef(null);     // { idToKey } while a find-question is live

  React.useEffect(() => { try { localStorage.setItem('ba_completed', JSON.stringify([...completed])); } catch (e) {} }, [completed]);

  const [consent, setConsent] = React.useState('denied'); // Local prototype: analytics disabled
  const acceptCookies = () => { window.BrainAnalytics && window.BrainAnalytics.grant(); setConsent('granted'); };
  const declineCookies = () => { window.BrainAnalytics && window.BrainAnalytics.deny(); setConsent('denied'); };

  React.useEffect(() => { try { localStorage.setItem('ba_pos', JSON.stringify(pos)); } catch (e) {} }, [pos]);

  const sceneRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  // Mode 1 axial anatomical section: same GLB, no CT/MRI volume.
  const axialCanvasRef = React.useRef(null);
  const [axialPercent, setAxialPercent] = React.useState(59);
  const mode2SectionInitialized = React.useRef(false);
  const [showAxial, setShowAxial] = React.useState(true);
  const [axialHover, setAxialHover] = React.useState(null);
  const [axialSelectedStructure,setAxialSelectedStructure]=React.useState(null);
  const c8MotorCircuit='direct'; // T1: only direct corticomotoneuronal demonstration
  const c8MagnifierRef=React.useRef(null);
  const [spinalTractLayers,setSpinalTractLayers]=React.useState({
    lCST:true,aCST:false,gracilis:false,cuneatus:false,anterolateral:false,spinocerebellar:false
  });
  // A single named CST selection activates its corresponding spinal WM mask.
  // The other masks remain independently selectable for comparison.
  React.useEffect(()=>{
    if(atlasMode==='pathways' && selectedTracts.includes('Corticospinal tract'))
      setSpinalTractLayers(prev=>prev.lCST?prev:{...prev,lCST:true});
  },[atlasMode,selectedTracts]);
  // These masks are anatomical teaching territories; the 3D schematic model
  // has not yet been co-registered to PAM50. Never overlay heuristic 3D dots.
  React.useEffect(()=>{
    window.SpineAtlasSection?.setTractOptions?.(spinalTractLayers);
    sceneRef.current?.redrawAxialSlice?.();
  },[spinalTractLayers,sceneReady]);
  React.useEffect(()=>{
    const active=atlasMode==='pathways' && selectedTracts.includes('Corticospinal tract');
    const mode=active?c8MotorCircuit:'off';
    window.SpineAtlasSection?.setCircuitMode?.(mode);
    window.SpineAtlasSection?.setCSTOriginSide?.(hemisphere);
    window.SpineAtlasSection?.setMode2CSTFocus?.(active); 
    sceneRef.current?.setMode2MotorCircuit?.(mode);
    sceneRef.current?.redrawAxialSlice?.();
  },[c8MotorCircuit,atlasMode,selectedTracts,hemisphere,sceneReady]);
  // The spinal section uses height-dependent educational WM/GM shapes, with the 3D exterior unchanged.
  // Mark it separately from the brain's pre-generated atlas images.
  const axialInfo = sceneReady && sceneRef.current?.getAxialInfo?.();
  const axialIsSpinal = !!(axialInfo && axialInfo.loaded && axialInfo.min +
    (axialInfo.max - axialInfo.min) * axialPercent / 100 < axialInfo.brainMin);
  // Mode2-only anatomical level navigation. Mode1 keeps its original 101-step control.
  const mode2SliceLevels = atlasMode==='pathways' && axialInfo?.loaded
    ? (sceneRef.current?.getMode2SectionLevels?.()||[]) : [];
  const closestMode2Level = mode2SliceLevels.reduce((best,item,i)=>
    Math.abs(item.percent-axialPercent)<Math.abs(mode2SliceLevels[best]?.percent-axialPercent)
      ? i : best,0);
  const chosenMode2Level=mode2SliceLevels[closestMode2Level]||null;
  const goMode2Level=(index)=>{
    const item=mode2SliceLevels[Math.max(0,Math.min(mode2SliceLevels.length-1,index))];
    if(item) {setAxialHover(null);setAxialPercent(item.percent);}
  };
  // Optional T1 anatomical magnifier: same canvas section, no invented second map.
  React.useEffect(()=>{
    const canvas=c8MagnifierRef.current;
    if(!canvas||atlasMode!=='pathways'||!selectedTracts.includes('Corticospinal tract')||!String(chosenMode2Level?.label||'').includes('T1'))return;
    const atlas=window.SpineAtlasSection;
    if(!atlas?.renderCanvas)return;
    const source=document.createElement('canvas');source.width=430;source.height=318;
    atlas.renderCanvas(source.getContext('2d'),430,318,1,'T1');
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Enlarges the same T1 lateral funiculus/intermediate gray/ventral horn region.
    ctx.drawImage(source,hemisphere==='right'?210:0,65,220,155,0,0,canvas.width,canvas.height);
  },[chosenMode2Level?.label,atlasMode,sceneReady,showAxial,hemisphere,selectedTracts]);


  // Mode 1 common anatomical-context controls (not preset-specific).
  // ON/Fade/OFF are independent of presets and never reset the camera.
  // Fade follows the cortex opacity slider in real time; ON=1, OFF=0.
  const [contextVisibility, setContextVisibility] = React.useState({
    brainstem:'on', cerebellum:'on', spinal:'on', putamen:'fade', thalamus:'fade'
  });

  // ---- search matching ----
  const q = search.trim();
  const matchedIds = React.useMemo(() => {
    const s = new Set();
    if (!q) return s;
    const lq = q.toLowerCase();
    nodes.forEach(n => {
      if (n.category === 'tracts') return; // Reserved for Mode 2.
      // side filter: midline structures have no L/R counterpart, so keep them on either side
      if (searchSide !== 'both' && n.side !== 'median' && n.side !== searchSide) return;
      if (n.label.toLowerCase().includes(lq) || n.region.toLowerCase().includes(lq) ||
          (n.crumb || []).some(c => c.toLowerCase().includes(lq)) || n.category.includes(lq) ||
          window.Mode1JP.label(n.label).toLowerCase().includes(lq) ||
          window.Mode1JP.hierarchy(n).some(h=>h.toLowerCase().includes(lq))) s.add(n.id);
    });
    return s;
  }, [q, searchSide]);
  const matchedCats = React.useMemo(() => { const c = new Set(); matchedIds.forEach(id => c.add(nodeById[id].category)); return c; }, [matchedIds]);

  // auto-expand categories with matches
  React.useEffect(() => {
    if (q) setExpanded(new Set(matchedCats));
  }, [q]);

  // ---- scene init ----
  React.useEffect(() => {
    let s;
    try {
      s = window.BrainScene.create(canvasRef.current, {
      autorotate: t.autorotate,
      onReady: () => { setSceneReady(true); setModelProblem(''); },
      onError: (msg) => setModelProblem(String(msg)),
      onPick: (id) => {
        // during a lesson "find this structure" question, a click answers it
        if (id != null && quizFindRef.current) {
          const key = quizFindRef.current.idToKey[id];
          if (key && quizPickRef.current) quizPickRef.current(key);
          return;
        }
        if (id != null) { setSelectedId(id); setRotationPaused(true); setHint(false); } else setSelectedId(null);
      },
      onHover: (id) => {
        clearTimeout(hoverTimerRef.current);
        setHover(null);
        if (id != null) {
          hoverTimerRef.current = setTimeout(() => setHover({id}), 180);
        }
      },
      onVR: (active) => setVrActive(active),
      onVRAction: (type, val) => vrActionRef.current && vrActionRef.current(type, val),
      });
    } catch (error) {
      console.error('BrainAtlas: 3D viewer startup failed', error);
      setSceneReady(false);
      setModelProblem(String(error?.message || error));
      return; // Keep React and the control panel running instead of a black screen.
    }
    sceneRef.current = s; window.__BA = s;
    s.vr.supported().then(setVrSupported).catch(() => {});
    return () => { clearTimeout(hoverTimerRef.current); s.dispose(); };
  }, []);


  // Keep the anatomical slice and the translucent 3D cutting plane aligned.
  React.useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    s.setAxialCanvas(showAxial && atlasMode!=='imaging' ? axialCanvasRef.current : null);
    s.setAxialSlice(axialPercent / 100);
  }, [showAxial, sceneReady, atlasMode]);
  React.useEffect(() => {
    if (sceneRef.current) sceneRef.current.setAxialSlice(axialPercent / 100);
  }, [axialPercent]);
  React.useEffect(() => {
    const isMode2=atlasMode==='pathways';
    sceneRef.current?.setMode2AxialEnabled?.(isMode2);
    if(isMode2 && sceneReady){
      // First entry snaps the plane and 2D image to the same discrete level;
      // changing Mode 1 ↔ 2 never alters the camera, rotations or other layers.
      const levels=sceneRef.current?.getMode2SectionLevels?.()||[];
      if(levels.length){
        if(!mode2SectionInitialized.current){
          mode2SectionInitialized.current=true;
          const initial=levels.find(item=>item.id==='thalamic')||levels[0];
          setAxialPercent(initial.percent);
        }else setAxialPercent(prev=>{
          const nearest=levels.reduce((best,item)=>Math.abs(item.percent-prev)<Math.abs(best.percent-prev)?item:best,levels[0]);
          return nearest.percent;
        });
      }
    }
  },[atlasMode,sceneReady]);

  // ---- compose & push to scene ----
  const firstCompose = React.useRef(true);
  React.useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    const map = {};
    const syncVascularOverlay = atlasMode==='pathways' &&
      (mode2Panel!=='lesion' || lesionShowTerritories) && selectedTerritories.length>0;
    const isoCats = isolatedIds ? new Set([...isolatedIds].map(id => nodeById[id].category)) : null;
    CAT_ORDER.forEach(cat => {
      let visible = layerOn[cat];
      let opacity = cat === 'cortex' ? cortexOpacity : 1;
      if (q && !matchedCats.has(cat)) opacity *= 0.12;
      if (isoCats) { if (!isoCats.has(cat)) visible = false; else opacity = 1; } // isolated layer fully opaque
      // These three controls are deliberately separate from the presets.
      if(cat === 'brainstem' || cat === 'cerebellum') {
        const state = contextVisibility[cat];
        visible = state !== 'off';
        opacity = state === 'fade' ? cortexOpacity : 1;
      }
      // Deep landmarks are ON/Fade/OFF only in Mode 2, and do not change Mode 1.
      if(atlasMode==='pathways' && (cat==='deep_grey'||cat==='diencephalon')){
        const part=cat==='deep_grey'?'putamen':'thalamus';
        const st=contextVisibility[part]||'fade';
        visible=st!=='off';opacity=st==='on'?1:.24;
      }
      if(atlasMode==='pathways' && cat==='cortex') opacity=Math.min(opacity,.14);
      if(atlasMode==='pathways' && (cat==='brainstem'||cat==='cerebellum') && visible) opacity=Math.min(opacity,.24);
      // In Mode 2, selected native artery meshes are recolored by a dedicated
      // overlay. Hide the unselected original pink vascular layer beneath it.
      if(cat==='arteries' && atlasMode==='pathways' &&
        (mode2Panel==='territory' || mode2Panel==='lesion' || syncVascularOverlay)) visible=false;
      if(cat==='tracts') { visible=atlasMode==='pathways';opacity=1; }
      map[cat] = { visible, opacity };
    });
    s.setLayers(map);
    s.setSpinalVisible(contextVisibility.spinal !== 'off');
    s.setSpinalOpacity(atlasMode==='pathways' && contextVisibility.spinal==='on' ? .22 : (contextVisibility.spinal === 'fade' ? cortexOpacity : 1));
    s.setSpinalTracts([]); // Legacy disabled in v0.6B; new Mode 2 overlay owns continuity.
    s.setMode2Pathways?.(atlasMode==='pathways' ? selectedTracts : [], hemisphere, true);
    // Suppress the large perfusion overlay in onset view unless specifically requested.
    // Keep saved territory selection for seamless return to the vascular tab.
    const showTerritoryLayer = atlasMode==='pathways' &&
      (mode2Panel!=='lesion' || lesionShowTerritories);
    const currentTerritoryOpacity = mode2Panel==='lesion' ? Math.min(territoryOpacity,.22) : territoryOpacity;
    s.setMode2Territories?.(showTerritoryLayer ? selectedTerritories : [], hemisphere, currentTerritoryOpacity);
    // Same selection / hemisphere / onset visibility as the colored cortical map.
    s.setMode2Vessels?.(showTerritoryLayer ? selectedTerritories : [], hemisphere, showSelectedArteries);
    s.setMode2Lesion?.(atlasMode==='pathways' ? selectedLesion : null, lesionSide);
    s.setHemisphere(hemisphere);
    s.isolate(isolatedIds ? [...isolatedIds] : null);
    // preset-defined sub-selection (e.g. Circle of Willis = only the ring arteries)
    const preset = PRESETS.find(p => p.id === activePreset);
    let subsetMap = null;
    if (preset && preset.subset) {
      subsetMap = {};
      Object.keys(preset.subset).forEach(cat => {
        const labels = new Set(preset.subset[cat]);
        subsetMap[cat] = new Set(nodes.filter(n => n.category === cat && labels.has(n.label)).map(n => n.id));
      });
    }
    if (atlasMode === 'pathways') {
      subsetMap={...(subsetMap||{}),tracts:new Set(pathwayNodeIds)};
      subsetMap.deep_grey=new Set(nodes.filter(n=>n.label==='Putamen'||n.label==='Globus pallidus external'||n.label==='Globus pallidus internal').map(n=>n.id));
      subsetMap.diencephalon=new Set(nodes.filter(n=>n.parent==='Thalamus').map(n=>n.id));
    }
    // A manually selected brainstem ON/Fade must show the whole structure,
    // including presets that previously restricted it to a single nucleus.
    if (subsetMap) {
      delete subsetMap.brainstem;
      delete subsetMap.cerebellum;
    }
    s.setSubset(subsetMap);
    s.setEmphasized(atlasMode === 'pathways' ? pathwayNodeIds : []);
    // Only the MODE 2 waypoint chips (e.g., cerebral peduncle, pons, pyramid)
    // are optional. Native mesh hover labels stay enabled in all modes.
    const showRouteLabels = atlasMode==='pathways' && mode2Panel==='routes' && showPathwayLandmarks;
    s.setRouteAnnotations(showRouteLabels ? selectedTracts : []);
    s.setRouteImpulse(atlasMode === 'pathways' ? selectedTracts : []);
    if (selectedId != null) s.selectNode(selectedId); else s.clearSelect();
    s.redrawAxialSlice && s.redrawAxialSlice();
    if (firstCompose.current) { s.snap(); firstCompose.current = false; }
  }, [layerOn, cortexOpacity, hemisphere, q, matchedCats, isolatedIds, selectedId, activePreset, pathwayNodeIds, selectedTracts, contextVisibility, sceneReady, atlasMode, selectedTerritories,territoryOpacity,showSelectedArteries,selectedLesion,lesionSide,mode2Panel,lesionShowTerritories,showPathwayLandmarks]);

  // Switching Mode 1 ↔ Mode 2 does NOT reset or reframe the camera.

  React.useEffect(() => { sceneRef.current && sceneRef.current.setAutoRotate(t.autorotate && !rotationPaused); }, [t.autorotate, rotationPaused]);
  React.useEffect(() => { sceneRef.current && sceneRef.current.setExposure(t.glow); }, [t.glow]);

  // ---- tweaks -> CSS vars ----
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--accent', t.accent);
    r.setProperty('--accent-soft', t.accent + '1f');
    r.setProperty('--accent-ring', t.accent + '66');
    const sg = STAGES[t.stage] || STAGES['deep blue'];
    r.setProperty('--stage-1', sg[0]); r.setProperty('--stage-2', sg[1]); r.setProperty('--stage-3', sg[2]);
    r.setProperty('--on-stage', sg[3]); r.setProperty('--on-stage-soft', sg[4]);
    if (t.surface === 'solid') { r.setProperty('--glass', 'var(--glass-solid)'); }
    else { r.setProperty('--glass', 'rgba(249,250,252,0.74)'); }
  }, [t.accent, t.stage, t.surface]);

  // ---- actions ----
  const toggleLayer = (cat) => {
    setActivePreset(null);
    if(cat === 'brainstem' || cat === 'cerebellum') {
      setContextVisibility(old => ({...old,[cat]:old[cat] === 'off' ? 'on' : 'off'}));
    } else setLayerOn(o => ({ ...o, [cat]: !o[cat] }));
  };
  const setContextPart = (part, state) => {
    if(!['brainstem','cerebellum','spinal','putamen','thalamus'].includes(part) || !['on','fade','off'].includes(state)) return;
    setContextVisibility(old => ({...old,[part]:state}));
  };
  const onExpand = (cat) => setExpanded(s => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  const showAll = () => { setActivePreset(null); setLayerOn(() => { const o = {}; CAT_ORDER.forEach(c => o[c] = c !== 'tracts'); return o; }); setContextVisibility({brainstem:'on',cerebellum:'on',spinal:'on',putamen:'fade',thalamus:'fade'}); setDepthStop(0); };
  const hideAll = () => { setActivePreset(null); setLayerOn(() => { const o = {}; CAT_ORDER.forEach(c => o[c] = false); return o; }); setContextVisibility({brainstem:'off',cerebellum:'off',spinal:'off',putamen:'off',thalamus:'off'}); };
  const selectNode = (id) => { setSelectedId(id); if(id != null) setRotationPaused(true); setHint(false); };
  const focusNode = (id) => { sceneRef.current && sceneRef.current.focusNode(id); setRotationPaused(true); setSelectedId(id); setFocusedId(id); setHint(false); };
  // toggling focus for the selection card: a second press is its own undo (reset view)
  const toggleFocus = (id) => {
    if (focusedId === id) { sceneRef.current && sceneRef.current.reset(); setFocusedId(null); }
    else { sceneRef.current && sceneRef.current.focusNode(id); setFocusedId(id); }
  };
  const focusCat = (cat) => sceneRef.current && sceneRef.current.focusCategory(cat);
  const zoom = (dir) => sceneRef.current && sceneRef.current.zoom(dir);
  const enterVR = () => {
    const s = sceneRef.current; if (!s) return;
    s.vr.enter().catch(err => flash('Could not start VR: ' + ((err && err.message) || err)));
  };
  const exitVR = () => { const s = sceneRef.current; if (s) s.vr.exit(); };
  const reset = () => {
    setActivePreset('whole'); applyPreset(PRESETS[0], false);
    setHemisphere('left'); setContextVisibility({brainstem:'on',cerebellum:'on',spinal:'on',putamen:'fade',thalamus:'fade'}); setIsolatedIds(null); setSearch(''); setSelectedId(null); setFocusedId(null); setRotationPaused(false);
    sceneRef.current && sceneRef.current.reset();
  };

  const applyPreset = (p, doFocus = true) => {
    if (p.id === 'pathways') setHemisphere('both');
    setActivePreset(p.id);
    setIsolatedIds(null); setSearch(''); setSelectedId(null); setFocusedId(null);  // close any open selection card
    const o = {}; CAT_ORDER.forEach(c => o[c] = p.on.includes(c) || (c === 'cortex' && p.cortex > 0));
    setLayerOn(o); setCortexOpacity(p.cortex);
    if (doFocus && p.focus) setTimeout(() => sceneRef.current && sceneRef.current.focusCategory(p.focus), 60);
    else if (doFocus) sceneRef.current && sceneRef.current.reset();
  };

  // ============================================================
  //  Systems & Lessons
  // ============================================================
  const lesson = openLessonId ? window.SYS.LESSONS.find(l => l.id === openLessonId) : null;
  const lessonSysId = lesson ? lesson.system : null;

  // which pathway stage is currently on the stage (system free-stepping, or a playing lesson)
  let stageActive = null;
  if (lesson && (phase === 'intro' || phase === 'playing')) stageActive = { systemId: lessonSysId, stageIndex: phase === 'intro' ? 0 : lessonStep };
  else if (activeSystem) stageActive = { systemId: activeSystem, stageIndex: sysStep };

  // lesson "find this structure" challenge -> candidate keys glow on the brain
  let quizFind = null;
  const curQ = phase === 'quiz' ? quizSet[qIdx] : null;
  if (lesson && curQ && curQ.type === 'find' && answers[qIdx] === undefined) {
    quizFind = { keys: curQ.options, answerKey: curQ.answer };
  }
  const playerOpen = !!stageActive || (lesson && (phase === 'quiz' || phase === 'done'));

  const stageKey = stageActive ? stageActive.systemId + ':' + stageActive.stageIndex : 'none';
  const quizKey = quizFind ? openLessonId + ':q' + qIdx : 'none';

  // ---- drive the real 3D scene from the active pathway stage / quiz ----
  React.useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    if (quizFind) {
      const ids = []; const idToKey = {};
      quizFind.keys.forEach(k => window.SYS.idsForKey(k).forEach(id => { ids.push(id); idToKey[id] = k; }));
      quizFindRef.current = { idToKey };
      s.setHighlight(ids, []);
      s.frameNodes(ids, 2.8);
    } else if (stageActive) {
      quizFindRef.current = null;
      const { activeIds, seenIds } = resolveStage(stageActive.systemId, stageActive.stageIndex);
      s.setHighlight(activeIds, seenIds);
      s.frameNodes(activeIds.length ? activeIds : seenIds, 3.0);
    } else {
      quizFindRef.current = null;
      s.clearHighlight();
    }
  }, [stageKey, quizKey, sceneReady]);

  // ---- system actions ----
  const startSystem = (id) => {
    if (activeSystem === id) { setActiveSystem(null); setSysPlaying(false); if (!mobile) setCollapsed(false); return; }
    setActiveSystem(id); setSysStep(0); setSysPlaying(false); setSelectedId(null);
    if (!mobile) setCollapsed(true);   // focus on the model + narration card
  };
  const closeSystem = () => { setActiveSystem(null); setSysPlaying(false); if (!mobile) setCollapsed(false); sceneRef.current && sceneRef.current.reset(); };

  // ---- quiz round drawing (a short randomised round pulled from the lesson's bank) ----
  const QUIZ_ROUND = 4;   // questions asked per round before we offer "more"
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  // draw the next round of unseen questions; once the bank is exhausted, reshuffle the whole bank
  const drawRound = (bank) => {
    const want = Math.min(QUIZ_ROUND, bank.length);
    let pool = bank.filter(q => !quizSeenRef.current.has(q));
    if (pool.length < want) { quizSeenRef.current = new Set(); pool = bank.slice(); }
    const round = shuffle(pool).slice(0, want);
    round.forEach(q => quizSeenRef.current.add(q));
    return round;
  };
  const startQuizRound = (bank) => {
    setQuizSet(drawRound(bank)); setQIdx(0); setAnswers({}); setPhase('quiz');
  };

  // ---- lesson actions ----
  const openLesson = (id) => {
    if (!window.SYS.LESSONS.some(l => l.id === id)) return;
    quizSeenRef.current = new Set();
    setOpenLessonId(id); setPhase('intro'); setLessonStep(0); setLessonPlaying(false);
    setQIdx(0); setAnswers({}); setQuizSet([]); setQuizTally({ asked: 0, correct: 0 });
    setSelectedId(null); setActiveSystem(null); setMode('learn');
    if (!mobile) setCollapsed(true);
  };
  const beginLesson = () => { setPhase('playing'); setLessonStep(0); setLessonPlaying(true); };
  const finishStages = () => {
    if (lesson && lesson.quiz && lesson.quiz.length) { setLessonPlaying(false); startQuizRound(lesson.quiz); }
    else completeLesson();
  };
  // finish the current round: bank this round's score into the running tally, then show completion
  const completeLesson = () => {
    const correct = quizSet.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    setQuizTally(t => ({ asked: t.asked + quizSet.length, correct: t.correct + correct }));
    setLessonPlaying(false); setPhase('done');
    setCompleted(c => new Set([...c, openLessonId]));
  };
  // "Ask me more": draw a fresh round from the bank and return to the quiz
  const moreQuestions = () => { if (lesson && lesson.quiz) { setLessonPlaying(false); startQuizRound(lesson.quiz); } };
  const closeLesson = () => { setOpenLessonId(null); setPhase(null); setLessonPlaying(false); if (!mobile) setCollapsed(false); sceneRef.current && sceneRef.current.reset(); };
  const replayLesson = () => { quizSeenRef.current = new Set(); setQuizTally({ asked: 0, correct: 0 }); setQuizSet([]); setPhase('playing'); setLessonStep(0); setQIdx(0); setAnswers({}); setLessonPlaying(true); };

  // ---- mode switching (stop whatever the other modes were running) ----
  const switchMode = (m) => {
    if (m !== 'explore' && m !== 'systems') return;
    setMode(m);
    if (m !== 'systems') { setActiveSystem(null); setSysPlaying(false); }
    if (m !== 'learn') { setOpenLessonId(null); setPhase(null); setLessonPlaying(false); }
    if (m === 'explore') { setSelectedId(null); }
  };

  const applyPalette = (pal) => {
    Object.assign(window.BRAIN.palette, pal);                       // mutate in place so PAL ref sees it
    const r = document.documentElement.style;
    Object.keys(pal).forEach(k => r.setProperty('--c-' + k, pal[k]));
    sceneRef.current && sceneRef.current.setPalette(pal);
    setPalVer(v => v + 1);                                          // re-render dots/legend/tree
  };
  const randomizePalette = () => {
    let j; do { j = Math.floor(Math.random() * PALETTES.length); } while (j === palIdxRef.current && PALETTES.length > 1);
    palIdxRef.current = j;
    applyPalette(PALETTES[j].colors);
  };

  const isolateMatches = () => { if (matchedIds.size) setIsolatedIds(new Set(matchedIds)); };
  const isolateNode = (id) => {
    // isolate exactly the clicked structure (both sides if it is one of a pair)
    const n = nodeById[id];
    const ids = nodes.filter(x => x.label === n.label && x.category === n.category).map(x => x.id);
    setIsolatedIds(new Set(ids.length ? ids : [id]));
    setTimeout(() => sceneRef.current && sceneRef.current.focusNode(id), 60);
  };
  const clearIsolate = () => setIsolatedIds(null);

  // ---- selection derived ----
  const selNode = selectedId != null ? nodeById[selectedId] : null;
  const related = React.useMemo(() => {
    if (!selNode) return [];
    // only suggest structures that are actually visible on the stage: when a single
    // hemisphere is shown, drop the opposite side (median structures show on both).
    const sideOk = (s) => hemisphere === 'both' || s === 'median' || s === hemisphere;
    return nodes.filter(n => n.id !== selNode.id && n.category === selNode.category && n.region === selNode.region && sideOk(n.side))
      .slice(0, 5).map(n => ({ id: n.id, label: n.label, side: n.side }));
  }, [selectedId, hemisphere]);
  const description = selNode ? (DESC[selNode.label] || ('A structure of the ' + cats[selNode.category].label.toLowerCase() + ', located in the ' + selNode.region.replace(/_/g, ' ') + '.')) : '';

  // mirror the selection into the in-headset 3D info panel (the HTML card isn't visible in VR),
  // including the same Related-structures buttons the web card shows
  React.useEffect(() => {
    const s = sceneRef.current; if (!s || !s.setVRInfo) return;
    if (selNode) {
      const side = selNode.side === 'median' ? 'Midline' : (selNode.side === 'left' ? 'Left' : 'Right');
      s.setVRInfo({ title: selNode.label, side, body: description, color: PAL[selNode.category], related });
    } else {
      s.setVRInfo(null);
    }
  }, [selectedId, description, related]);

  // mirror the control panel (hemisphere / layers / views) into the left in-VR panel
  React.useEffect(() => {
    const s = sceneRef.current; if (!s || !s.setVRControls || !vrActive) return;
    s.setVRControls({
      hemisphere,
      layers: CAT_ORDER.map(cat => ({ cat, label: SHORT[cat] || (cats[cat] && cats[cat].label) || cat, on: !!layerOn[cat], color: PAL[cat] })),
      presets: PRESETS.map(p => ({ id: p.id, label: p.label, active: activePreset === p.id })),
    });
  }, [vrActive, hemisphere, layerOn, activePreset]);

  // mirror the Systems/Learn step card into the in-VR narration panel (below the brain)
  React.useEffect(() => {
    const s = sceneRef.current; if (!s || !s.setVRNarration || !vrActive) return;
    let narr = null;
    if (lesson && phase === 'playing') {
      const sys = window.SYS.SYSTEMS.find(x => x.id === lessonSysId);
      if (sys && sys.stages[lessonStep]) { const st = sys.stages[lessonStep]; narr = { kind: 'Lesson', title: st.title, body: st.body, step: lessonStep, total: sys.stages.length, last: lessonStep >= sys.stages.length - 1, isLesson: true }; }
    } else if (activeSystem) {
      const sys = window.SYS.SYSTEMS.find(x => x.id === activeSystem);
      if (sys && sys.stages[sysStep]) { const st = sys.stages[sysStep]; narr = { kind: 'System', title: st.title, body: st.body, step: sysStep, total: sys.stages.length, last: sysStep >= sys.stages.length - 1, isLesson: false }; }
    }
    s.setVRNarration(narr);
  }, [vrActive, activeSystem, sysStep, openLessonId, phase, lessonStep, lessonSysId]);

  // handle button presses coming back from the in-VR panels (kept fresh each render so it
  // closes over current state). Routes to the same handlers the web UI uses.
  const vrNarrStep = (dir) => {
    if (lesson && phase === 'playing') {
      const sys = window.SYS.SYSTEMS.find(x => x.id === lessonSysId); const len = sys ? sys.stages.length : 0;
      if (dir > 0) { if (lessonStep >= len - 1) finishStages(); else setLessonStep(lessonStep + 1); } else setLessonStep(Math.max(0, lessonStep - 1));
    } else if (activeSystem) {
      const sys = window.SYS.SYSTEMS.find(x => x.id === activeSystem); const len = sys ? sys.stages.length : 0;
      setSysStep(dir > 0 ? Math.min(len - 1, sysStep + 1) : Math.max(0, sysStep - 1));
    }
  };
  vrActionRef.current = (type, val) => {
    switch (type) {
      case 'exit': exitVR(); break;
      case 'select': selectNode(val); break;
      case 'toggleLayer': toggleLayer(val); break;
      case 'hemisphere': setHemisphere(val); break;
      case 'preset': { const p = PRESETS.find(x => x.id === val); if (p) applyPreset(p); break; }
      case 'showAll': showAll(); break;
      case 'hideAll': hideAll(); break;
      case 'reset': reset(); break;
      case 'narrPrev': vrNarrStep(-1); break;
      case 'narrNext': vrNarrStep(1); break;
      case 'narrClose': if (openLessonId) closeLesson(); else closeSystem(); break;
      default: break;
    }
  };

  // ---- high-definition poster export (features the selection if any) ----
  const savePoster = async () => {
    const s = sceneRef.current; if (!s || posterBusy) return;
    setPosterBusy(true);
    try {
      if (selectedId != null) { s.focusNode(selectedId); await new Promise(r => setTimeout(r, 750)); }
      const title = selNode ? window.Mode1JP.label(selNode.label) : '脳全体';
      const sub = selNode
        ? (window.Mode1JP.hierarchy(selNode).join(' › ')
           + (selNode.side !== 'median' ? '  ·  ' + (selNode.side === 'left' ? '左' : '右') : ''))
        : '脳の神経解剖';
      const url = s.capturePoster(2400, 1500, { title, subtitle: sub, color: selNode ? PAL[selNode.category] : t.accent });
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brain-project-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { console.error('poster failed', e); }
    setPosterBusy(false);
  };

  // ---- shareable deep link (GitHub Pages friendly: plain query params) ----
  const buildShareUrl = () => {
    const p = new URLSearchParams();
    p.set('mode', mode);
    if (mode === 'systems' && activeSystem) { p.set('sys', activeSystem); p.set('step', String(sysStep)); }
    else if (mode === 'learn' && openLessonId) { p.set('lesson', openLessonId); }
    else {
      if (activePreset && activePreset !== 'whole') p.set('preset', activePreset);
      if (hemisphere !== 'left') p.set('hemi', hemisphere);
      if (selectedId != null) {
        p.set('sel', String(selectedId));
        if (focusedId === selectedId) p.set('focus', '1');   // shared from focused mode -> reopen focused
      }
    }
    return location.origin + location.pathname + '?' + p.toString();
  };
  const copyShareLink = async () => {
    const url = buildShareUrl();
    try { await navigator.clipboard.writeText(url); flash('Link copied to clipboard'); }
    catch (e) { window.prompt('Copy this link', url); }
  };

  // restore state from a shared link (once, on mount). The deep-linked structure is
  // applied later, once the specimen has loaded, since the camera can't frame a mesh
  // before then - see the sceneReady effect below.
  const didRestore = React.useRef(false);
  const pendingDeep = React.useRef(null);   // { id, focus } parsed from the link
  React.useEffect(() => {
    if (didRestore.current) return; didRestore.current = true;
    let p; try { p = new URLSearchParams(location.search); } catch (e) { return; }
    if (![...p.keys()].length) return;
    if (p.get('sys')) {
      const id = p.get('sys');
      if (window.SYS.SYSTEMS.some(s => s.id === id)) {
        setMode('systems'); setActiveSystem(id); if (!mobile) setCollapsed(true);
        const st = parseInt(p.get('step') || '0', 10); if (!isNaN(st)) setSysStep(st);
      }
    } else if (p.get('lesson')) {
      openLesson(p.get('lesson'));
    } else {
      if (['explore','systems'].includes(p.get('mode'))) setMode(p.get('mode'));
      if (p.get('preset')) { const pr = PRESETS.find(x => x.id === p.get('preset')); if (pr) applyPreset(pr); }
      if (p.get('hemi')) setHemisphere(p.get('hemi'));
      if (p.get('sel')) { const id = parseInt(p.get('sel'), 10); if (!isNaN(id) && nodeById[id]) pendingDeep.current = { id, focus: p.get('focus') === '1' }; }
    }
  }, []);

  // apply the deep-linked structure once the specimen is loaded: if the link was shared
  // from focused mode, focus it (camera + select + active focus toggle); otherwise just
  // select it, exactly as a click would.
  React.useEffect(() => {
    if (!sceneReady || !pendingDeep.current) return;
    const { id, focus } = pendingDeep.current; pendingDeep.current = null;
    if (focus) focusNode(id); else selectNode(id);
  }, [sceneReady]);

  // ---- keyboard ----
  React.useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT') { if (e.key === 'Escape') e.target.blur(); return; }
      if (e.key === '/') { e.preventDefault(); const i = document.querySelector('.glass input'); i && i.focus(); }
      else if (e.key === 'Escape') { if (isolatedIds) clearIsolate(); else setSelectedId(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isolatedIds]);

  const hoverNode = hover ? nodeById[hover.id] : null;

  return (
    <React.Fragment>
      <div className="stage" />
      <canvas ref={canvasRef} className="three" style={{visibility:atlasMode==='imaging'?'hidden':'visible'}} />
      {atlasMode==='imaging' && <Mode3Viewer mobile={mobile} mod={mode3Mod} windowMode={mode3CTWindow} sourceSceneRef={sceneRef} position={mode3Position} setPosition={setMode3Position} onMeta={setMode3Meta} fitSignal={mode3Fit} lesionEnabled={mode3LesionEnabled} lesionKind={mode3LesionKind} lesionRegion={mode3LesionRegion} lesionTime={mode3LesionTime} lesionView={mode3LesionView}/>}
      {atlasMode!=='imaging' && modelProblem && <div role="alert" style={{position:'absolute',left:'50%',top:76,transform:'translateX(-50%)',maxWidth:560,zIndex:15,
        background:'rgba(17,23,36,.95)',color:'#f5d2ca',border:'1px solid #c87866',borderRadius:10,
        fontSize:12,lineHeight:1.6,padding:'10px 14px',pointerEvents:'none',whiteSpace:'pre-wrap'}}>
        3Dモデルの読み込みを確認できません：{modelProblem}
      </div>}

      {/* MODE 1 axial anatomical contours: simultaneous with the rotatable brain.
          Uses actual mesh-plane intersections, not a stack of MR/CT images. */}
      {showAxial && atlasMode!=='imaging' ? (
        <section aria-label="水平断面" style={{position:'absolute', zIndex:10,
          top:mobile?'auto':118, bottom:mobile?12:'auto', right:mobile?10:18,
          width:mobile?'min(275px, 70vw)':'min(385px, 35vw)',
          padding:'12px 12px 10px', borderRadius:14,
          maxHeight:mobile?'calc(100dvh - 130px)':'calc(100dvh - 228px)',
          overflowY:'auto',overscrollBehavior:'contain',scrollbarWidth:'thin',
          boxSizing:'border-box',
          background:'rgba(14,22,35,0.92)', border:'1px solid rgba(176,205,235,.25)',
          boxShadow:'0 10px 30px rgba(0,0,0,.3)', color:'#edf3fa'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginBottom:8}}>
            <div>
              <strong style={{fontSize:13}}>水平断面 <small style={{fontWeight:500,opacity:.74}}>Axial</small></strong>
              <div style={{fontSize:10, opacity:.7}}>{axialIsSpinal?'PAM50代表髄節（3D高さは模式対応）':(atlasMode==='pathways'?'代表断面・3Dガイド連動':'3D解剖モデルの同一高さ')}</div>
            </div>
            <button type="button" aria-label="断面を閉じる" title="断面を非表示"
              onClick={()=>setShowAxial(false)}
              style={{background:'transparent',border:'1px solid #647489',borderRadius:6,
                      color:'#dce9f7',cursor:'pointer',fontSize:12,padding:'3px 7px'}}>×</button>
          </div>
          <div style={{fontSize:10,color:'#b9d9ec',marginBottom:5}}>R＝被検者右、L＝被検者左（画像は足側から見た表示）</div>
          <div style={{display:'flex',gap:10,alignItems:'stretch'}}>
            <canvas ref={axialCanvasRef}
              onMouseMove={e=>{
                const hit=sceneRef.current?.getAxialHit?.(e);
                setAxialHover(prev=>(prev?.ja===hit?.ja && prev?.en===hit?.en)?prev:hit);
              }}
              onMouseLeave={()=>setAxialHover(null)}
              onClick={e=>{
                const hit=sceneRef.current?.getAxialHit?.(e);
                if(axialIsSpinal)setAxialSelectedStructure(hit||null);
              }}
              style={{display:'block' ,width:'calc(100% - 47px)',cursor:'crosshair',
              aspectRatio:'1 / 1',maxHeight:mobile?194:307,
              background:'#121c2b',borderRadius:8,
              border:'1px solid rgba(165,191,214,.16)'}} />
            <div style={{width:37,display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'space-between',gap:3}}>
              <span style={{fontSize:10,color:'#c4e3ef'}}>上</span>
              {atlasMode==='pathways' && mode2SliceLevels.length>0 ? (
                <input id="axial-level-mode2" type="range" min="0" max={mode2SliceLevels.length-1}
                  aria-label="Mode 2の代表横断面を選択"
                  value={mode2SliceLevels.length-1-closestMode2Level}
                  onChange={e=>goMode2Level(mode2SliceLevels.length-1-Number(e.target.value))}
                  style={{writingMode:'vertical-lr',direction:'rtl',
                    height:mobile?154:255,width:24,accentColor:'#2bd7e6',
                    cursor:'pointer',touchAction:'none',flex:1,minHeight:110}} />
              ) : (
                <input id="axial-level-mode1" type="range" min="0" max="100"
                  aria-label="水平断の高さを上下に動かす" value={axialPercent}
                  onChange={e=>setAxialPercent(Number(e.target.value))}
                  style={{writingMode:'vertical-lr',direction:'rtl',
                    height:mobile?154:255,width:24,accentColor:'#2bd7e6',
                    cursor:'pointer',touchAction:'none',flex:1,minHeight:110}} />
              )}
              <span style={{fontSize:10,color:'#c4e3ef'}}>下</span>
            </div>
          </div>
          <div aria-live="polite" style={{minHeight:35,marginTop:6,padding:'7px 9px',
            borderRadius:6,background:'rgba(47,69,92,.37)',display:'flex',alignItems:'flex-start',gap:8}}>
            {axialHover ? <React.Fragment>
              <span style={{width:9,height:9,borderRadius:4,background:axialHover.color,flexShrink:0}} />
              <div style={{fontSize:12,fontWeight:600,lineHeight:1.35,minWidth:0}}>
                {axialHover.ja}<small style={{display:'block',fontSize:10,opacity:.7,fontWeight:400}}>{axialHover.en}</small>
                {axialHover.description && <span style={{display:'block',marginTop:4,fontSize:11,fontWeight:400,lineHeight:1.5}}>{axialHover.description}</span>}
                {axialHover.clinical && <span style={{display:'block',marginTop:4,fontSize:10,fontWeight:400,lineHeight:1.5,color:'#c9e5f3'}}>臨床：{axialHover.clinical}</span>}
              </div>
            </React.Fragment> : <span style={{fontSize:11,opacity:.8}}>断面の組織にカーソルを合わせると名称を表示</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
            margin:'9px 0 5px',fontSize:11,color:'#dce9f5'}}>
            <label htmlFor={atlasMode==='pathways'?'axial-level-mode2':'axial-level-mode1'}>
              {atlasMode==='pathways'?'解剖学的な高さを選択':'高さを上下に移動'}
            </label>
            <span style={{fontVariantNumeric:'tabular-nums'}}>
              {atlasMode==='pathways' && chosenMode2Level
                ? (closestMode2Level+1)+' / '+mode2SliceLevels.length : axialPercent+'%'}
            </span>
          </div>
          {atlasMode==='pathways' && chosenMode2Level && <div style={{padding:'5px 8px',borderRadius:6,
            background:'rgba(45,73,98,.4)',fontSize:11,color:'#e9f4ff',marginBottom:6}}>
            <div style={{fontWeight:700}}>{chosenMode2Level.label}</div>
            <div style={{fontSize:10,opacity:.7}}>{chosenMode2Level.basis}</div>
            {chosenMode2Level.segment && <div style={{fontSize:10,color:'#d1e7fa',marginTop:3}}>
              {chosenMode2Level.segment.includes('-')?'移行部の補間断面：実測切片ではありません。':'脊髄髄節レベル：椎体の高さとは一致しません。'}
            </div>}
            <div style={{display:'flex',gap:7,marginTop:6}}>
              <button disabled={closestMode2Level===0} onClick={()=>goMode2Level(closestMode2Level-1)}
                type="button" style={{padding:'3px 8px',borderRadius:5,background:'#203b53',
                  color:'#e4f2ff',border:'1px solid #5b728a',cursor:'pointer'}}>上の断面</button>
              <button disabled={closestMode2Level>=mode2SliceLevels.length-1} onClick={()=>goMode2Level(closestMode2Level+1)}
                type="button" style={{padding:'3px 8px',borderRadius:5,background:'#203b53',
                  color:'#e4f2ff',border:'1px solid #5b728a',cursor:'pointer'}}>下の断面</button>
            </div>
          </div>}
          {axialIsSpinal ? (
            <React.Fragment>
              <div style={{fontSize:11,fontWeight:700,color:'#e4f1ff',marginTop:9,marginBottom:4}}>
                白質伝導路（複数選択可）
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'5px 7px',fontSize:10}}>
                {[
                  ['lCST','外側皮質脊髄路','#0072b2'],
                  ['aCST','前皮質脊髄路','#0072b2'],
                  ['gracilis','薄束','#d3951d'],
                  ['cuneatus','楔状束','#e6b44a'],
                  ['anterolateral','前外側系','#c86b8c'],
                  ['spinocerebellar','前脊髄小脳路','#009e73']
                ].map(([key,label,color])=><label key={key} style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer'}}>
                  <input type="checkbox" checked={!!spinalTractLayers[key]} onChange={e=>setSpinalTractLayers(prev=>({...prev,[key]:e.target.checked}))}
                    style={{accentColor:color,margin:0}} />
                  <span style={{color:'#dbeaf4'}}>{label}</span>
                </label>)}
              </div>
              <div style={{fontSize:10,color:'#b9cde1',marginTop:8,lineHeight:1.45}}>
                <strong style={{color:'#f5faff'}}>色面＝伝導路が占める領域／白縁の水色小円＝3Dで選択した皮質脊髄路の代表線維1本の切断位置。</strong>
                スライスに応じて小円の位置が変化します。3D・PAM50の厳密な座標登録は未完了のため、領域内への対応づけは模式的です。
                灰白質：前角・後角・中間部 ／ 白質：前索・側索・後索。クリックで機能と臨床的意義を表示します。
              </div>
              {atlasMode==='pathways' && (
                <div style={{marginTop:9,padding:'8px 9px',border:'1px solid rgba(167,199,225,.33)',borderRadius:8,
                  background:'rgba(23,41,61,.64)',fontSize:11}}>
                  <div style={{fontWeight:700,color:'#f0f6fd',marginBottom:5}}>T1：皮質脊髄路 → α運動ニューロン → 末梢運動神経</div>
                  <div style={{fontSize:10,color:'#cce3f4',marginBottom:6,lineHeight:1.5}}>
                    手指の巧緻運動に関連する<strong>直接皮質運動ニューロン結合</strong>の模式例です。
                    水色のCST側枝が前角のピンク色のα運動ニューロンに直接シナプスし、
                    α運動ニューロンの軸索は前根・末梢神経を経て神経筋接合部へ至ります。
                  </div>
                  {!selectedTracts.includes('Corticospinal tract') &&
                    <div style={{fontSize:10,color:'#f2c9a4',marginTop:6}}>伝導路一覧で皮質脊髄路を選択すると、T1の直接結合が表示されます。</div>}
                  {selectedTracts.includes('Corticospinal tract') && (
                    <div style={{marginTop:6,lineHeight:1.5}}>
                      <div><span style={{color:'#23d5e3'}}>●</span> CST側枝　
                        <span style={{color:'#ed70b1'}}>●</span> α運動ニューロン・末梢軸索　
                        <span style={{color:'#ffe37b'}}>●</span> シナプス／神経筋接合部</div>
                      <div style={{fontSize:10,opacity:.8,marginTop:4}}>
                        T1断面のみの例示。細胞・末梢神経・筋線維は教育用模式図で、筋までの距離は縮尺外です。
                        この直接結合は全皮質脊髄線維に普遍的ではありません。
                      </div>
                      {String(chosenMode2Level?.label||'').includes('T1') ? (
                        <div style={{marginTop:7}}>
                          <div style={{fontSize:10,color:'#dceaf6',marginBottom:3}}>選択したCST・前角・前根・末梢運動神経（拡大）</div>
                          <canvas ref={c8MagnifierRef} width={320} height={220}
                            style={{width:'100%',maxWidth:320,height:'auto',display:'block',borderRadius:6,
                              background:'#142032',border:'1px solid #506a84'}} />
                        </div>
                      ) : (
                        <button type="button" onClick={()=>{
                            const i=mode2SliceLevels.findIndex(a=>String(a.label||'').includes('T1'));
                            if(i>=0)goMode2Level(i);
                          }} style={{marginTop:5,padding:'4px 9px',background:'#294a65',color:'#eaf5ff',
                            border:'1px solid #738ea7',borderRadius:5,cursor:'pointer'}}>
                          最下端T1へ移動
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {axialSelectedStructure && (
                <div style={{padding:'9px 10px',background:'rgba(34,55,78,.78)',border:'1px solid #526e88',borderRadius:8,marginTop:7}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:6}}>
                    <div><strong style={{fontSize:12}}>{axialSelectedStructure.ja}</strong>
                      <small style={{display:'block',fontSize:10,opacity:.7}}>{axialSelectedStructure.en}</small></div>
                    <button type="button" aria-label="説明を閉じる" onClick={()=>setAxialSelectedStructure(null)}
                      style={{background:'transparent',color:'#d6e5f2',border:0,cursor:'pointer'}}>×</button>
                  </div>
                  <div style={{fontSize:11,lineHeight:1.5,marginTop:6}}>{axialSelectedStructure.description}</div>
                  {axialSelectedStructure.clinical&&<div style={{fontSize:10,lineHeight:1.5,color:'#d9e8f1',marginTop:4}}>臨床：{axialSelectedStructure.clinical}</div>}
                </div>
              )}
              <div style={{fontSize:10,lineHeight:1.5,color:'#b8c6d7',marginTop:8}}>
                PAM50の確率マップを基に作成したC1〜T1の代表髄節図です。細い境界や中心管は教育用に整理しています。
                髄節と椎体高位は異なり、現在の3D外観との厳密な空間登録は未完了です。
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',fontSize:10,color:'#b9cce0',marginTop:4}}>
                <span><span style={{color:'#a6b9cf'}}>●</span> 皮質</span>
                <span><span style={{color:'#e0e7ef'}}>●</span> 白質</span>
                <span><span style={{color:'#ed7d66'}}>●</span> 被殻</span>
                <span><span style={{color:'#e9bc50'}}>●</span> 尾状核</span>
                <span><span style={{color:'#39b8a0'}}>●</span> 視床</span>
                <span><span style={{color:'#245f91'}}>●</span> 脳室</span>
                <span><span style={{color:'#a67acb'}}>●</span> 淡蒼球</span>
                <span><span style={{color:'#ffffff'}}>◎</span> 選択中の伝導路</span>
              </div>
              <div style={{fontSize:10,lineHeight:1.45,opacity:.68,marginTop:7}}>
                {atlasMode==='pathways' ? '脳断面は既存3Dメッシュ由来です。輪郭のみ表示上平滑化。伝導路は実際の3Dメッシュ交点または模式的補完線の交点であり、MRIの確率分布ではありません。' : '元の3Dモデルから事前生成した教育用模式断面です。CT/MRIや厳密な組織分割ではありません。'}
              </div>
            </React.Fragment>
          )}
        </section>
      ) : atlasMode!=='imaging' ? (
        <button type="button" onClick={()=>setShowAxial(true)}
          style={{position:'absolute',zIndex:10,right:18,top:118,borderRadius:9,
                  background:'rgba(14,22,35,.92)',color:'#e0f0fc',
                  border:'1px solid rgba(176,205,235,.4)',padding:'9px 14px',cursor:'pointer'}}>
          水平断面を表示
        </button>
      ) : null}

      {/* corner toolbar: save poster · credits · shuffle palette · subsystem key */}
      {atlasMode!=='imaging' && <Legend groups={groups} layerOn={layerOn} onPoster={savePoster} posterBusy={posterBusy} onCopyLink={copyShareLink} onZoom={zoom} mobile={mobile}
        autorotate={t.autorotate && !rotationPaused} onToggleSpin={() => { if (rotationPaused) { setRotationPaused(false); setTweak('autorotate', true); } else setTweak('autorotate', !t.autorotate); }}
        vrSupported={vrSupported} vrActive={vrActive} onEnterVR={enterVR} onExitVR={exitVR} />}

      {hint && consent && !mobile && (
        <div className="pop" style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 12,
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99,
          background: 'rgba(8,11,18,0.55)', color: 'var(--on-stage)', fontSize: 12.5, fontWeight: 500, backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)' }}>
          <Icon name="crosshair" size={14} style={{ color: 'var(--on-stage-soft)' }} />
          Drag to rotate · scroll to zoom · click a structure to inspect
        </div>
      )}

      <ControlPanel
        mode={mode} setMode={switchMode} atlasMode={atlasMode} onAtlasMode={setAtlasMode}
        mode3Mod={mode3Mod} onMode3Mod={setMode3Mod} mode3CTWindow={mode3CTWindow} onMode3CTWindow={setMode3CTWindow} mode3Guide={mode3Guide} onMode3Guide={setMode3Guide} mode3Position={mode3Position} onMode3Position={setMode3Position} mode3Meta={mode3Meta} onMode3Fit={()=>setMode3Fit(v=>v+1)}
        mode3LesionEnabled={mode3LesionEnabled} onMode3LesionEnabled={setMode3LesionEnabled} mode3LesionKind={mode3LesionKind} onMode3LesionKind={setMode3LesionKind} mode3LesionRegion={mode3LesionRegion} onMode3LesionRegion={setMode3LesionRegion} mode3LesionTime={mode3LesionTime} onMode3LesionTime={setMode3LesionTime} mode3LesionView={mode3LesionView} onMode3LesionView={setMode3LesionView}
        activeSystem={activeSystem} onStartSystem={startSystem}
        completedSet={completed} onOpenLesson={openLesson}
        totalCount={nodes.length}
        groups={groups} layerOn={layerOn} expanded={expanded}
        onToggleLayer={toggleLayer} onExpand={onExpand}
        onSelect={selectNode} onFocus={focusNode} onFocusCat={focusCat}
        selectedId={selectedId}
        search={search} setSearch={(v) => { setSearch(v); setActivePreset(null); }} matchedIds={matchedIds} matchCount={matchedIds.size}
        searchSide={searchSide} setSearchSide={setSearchSide}
        hemisphere={hemisphere} setHemisphere={(v) => { setHemisphere(v); }}
        cortexOpacity={cortexOpacity} setCortexOpacity={(v) => { setCortexOpacity(v); if (activePreset !== 'pathways') setActivePreset(null); }}
        presets={PRESETS} activePreset={activePreset} onPreset={(id) => applyPreset(PRESETS.find(p => p.id === id))}
        contextVisibility={contextVisibility}
        onContextVisibility={setContextPart}
        territories={window.Mode2Territories.TERRITORIES} selectedTerritories={selectedTerritories}
        territoryOpacity={territoryOpacity} onTerritoryOpacity={setTerritoryOpacity}
        showSelectedArteries={showSelectedArteries} onToggleSelectedArteries={()=>setShowSelectedArteries(v=>!v)}
        lesionCases={window.Mode2Lesions.CASES} selectedLesion={selectedLesion} lesionSide={lesionSide}
        mode2Panel={mode2Panel} onMode2PanelChange={setMode2Panel}
        lesionShowTerritories={lesionShowTerritories} onToggleLesionTerritories={()=>setLesionShowTerritories(v=>!v)}
        onSelectLesion={setSelectedLesion} onLesionSide={setLesionSide}
        onSetTracts={(arr)=>setSelectedTracts(old=>[...new Set([...old,...arr])])}
        onToggleTerritory={(id)=>setSelectedTerritories(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id])}
        onToggleRelatedTerritory={(id)=>{
          setSelectedTerritories(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
          setLesionShowTerritories(true);
        }}
        onClearTerritories={()=>setSelectedTerritories([])}
        showPathwayLandmarks={showPathwayLandmarks}
        onTogglePathwayLandmarks={(on)=>setShowPathwayLandmarks(!!on)}
        pathways={window.Mode2Pathways.PATHWAYS} selectedTracts={selectedTracts}
        onInspectT1={()=>{
          setMode2Panel('routes');setShowAxial(true);
          setSelectedTracts(prev=>prev.includes('Corticospinal tract')?prev:[...prev,'Corticospinal tract']);
          const levels=sceneRef.current?.getMode2SectionLevels?.()||[];
          const index=levels.findIndex(x=>x.segment==='T1');
          if(index>=0)goMode2Level(index);
        }}
        onToggleTract={(label) => setSelectedTracts(old => old.includes(label) ? old.filter(x => x !== label) : [...old, label])}
        onClearTracts={() => setSelectedTracts([])} onSelectAllTracts={() => setSelectedTracts(window.Mode2Pathways.PATHWAYS.map(x=>x.id))}
        onReset={reset} onShowAll={showAll} onHideAll={hideAll}
        onIsolateMatches={isolateMatches} canIsolate={matchedIds.size > 0}
        isolated={!!isolatedIds} onClearIsolate={clearIsolate}
        pos={pos} setPos={setPos} collapsed={collapsed} setCollapsed={setCollapsed}
        q={q} mobile={mobile}
      />

      {!consent && <ConsentBanner onAccept={acceptCookies} onDecline={declineCookies} />}

      <SelectionCard node={selNode} color={selNode ? PAL[selNode.category] : null}
        catLabel={selNode ? (window.Mode1JP.categories[selNode.category] || cats[selNode.category].label) : ''} description={description} related={related}
        rotationPaused={rotationPaused} onResumeRotation={() => { setRotationPaused(false); setTweak('autorotate', true); }}
        onSelect={selectNode} onRelated={focusNode} onFocus={toggleFocus} onIsolate={isolateNode} onClose={() => setSelectedId(null)}
        isolated={!!isolatedIds} focused={selNode && focusedId === selNode.id} onClearIsolate={clearIsolate} mobile={mobile} />

      {/* SYSTEMS narration (free stepping) */}
      {activeSystem && !lesson && (
        <NarrationCard sys={window.SYS.SYSTEMS.find(s => s.id === activeSystem)} idx={sysStep} setIdx={setSysStep}
          playing={sysPlaying} setPlaying={setSysPlaying} onClose={closeSystem} onSelectNode={selectNode} isLesson={false} mobile={mobile} />
      )}

      {/* LESSON player chrome */}
      {lesson && phase === 'intro' && <LessonIntro lesson={lesson} onBegin={beginLesson} onClose={closeLesson} mobile={mobile} />}
      {lesson && phase === 'playing' && (
        <NarrationCard sys={window.SYS.SYSTEMS.find(s => s.id === lessonSysId)} idx={lessonStep} setIdx={setLessonStep}
          playing={lessonPlaying} setPlaying={setLessonPlaying} onClose={closeLesson} onSelectNode={selectNode}
          isLesson={true} lessonTitle={lesson.title} onFinish={finishStages} mobile={mobile} />
      )}
      {lesson && phase === 'quiz' && (
        <LessonQuiz lesson={lesson} quiz={quizSet} qIdx={qIdx} setQIdx={setQIdx} answers={answers} setAnswers={setAnswers}
          onFinish={completeLesson} pickFromStage={quizPickRef} mobile={mobile} />
      )}
      {lesson && phase === 'done' && (
        <LessonComplete lesson={lesson} score={quizSet.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0)}
          total={quizSet.length} tally={quizTally} bankSize={lesson.quiz ? lesson.quiz.length : 0}
          onMore={moreQuestions} onReplay={replayLesson} onClose={closeLesson} onShare={copyShareLink} mobile={mobile} />
      )}

      <Toast msg={toast} />

      {/* hover tooltip */}
      {hoverNode && !selNode && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 14,
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 99,
          background: 'rgba(8,11,18,0.6)', color: 'var(--on-stage)', fontSize: 12.5, fontWeight: 600, backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }}>
          <Dot color={PAL[hoverNode.category]} size={8} />
          <span>{window.Mode1JP.label(hoverNode.label)}</span>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={t.accent} options={['#3A66FF', '#12B5C9', '#7C5CFF', '#F0556B', '#1F9E63']} onChange={v => setTweak('accent', v)} />
        <TweakRadio label="Stage" value={t.stage} options={['deep blue', 'charcoal', 'clinical']} onChange={v => setTweak('stage', v)} />
        <TweakRadio label="Panel surface" value={t.surface} options={['frosted', 'solid']} onChange={v => setTweak('surface', v)} />
        <TweakSection label="Specimen" />
        <TweakToggle label="Idle auto-rotate" value={t.autorotate} onChange={v => setTweak('autorotate', v)} />
        <TweakSlider label="Specimen glow" value={t.glow} min={0.8} max={1.4} step={0.02} unit="×" onChange={v => setTweak('glow', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

/* bottom-center cookie-consent popup (gates Firebase/Google Analytics) */
function ConsentBanner({ onAccept, onDecline }) {
  return (
    <div className="glass glass-top-hi pop" style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      width: 'min(560px, calc(100vw - 32px))', padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <Icon name="info" size={16} style={{ color: 'var(--ink-faint)', flex: '0 0 auto' }} />
      <span style={{ flex: 1, minWidth: 220, fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-soft)' }}>
        We use Google&nbsp;Analytics to understand usage. Decline keeps it anonymous &amp; cookieless.
      </span>
      <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <button onClick={onDecline} style={{
          padding: '8px 14px', borderRadius: 10, border: '1px solid var(--hair)', background: 'rgba(255,255,255,0.5)',
          color: 'var(--ink-soft)', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
        }}>Decline</button>
        <button onClick={onAccept} style={{
          padding: '8px 16px', borderRadius: 10, border: '1px solid transparent', background: 'var(--accent)',
          color: '#fff', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Accept</button>
      </div>
    </div>
  );
}

/* small toast confirmation (e.g. "Link copied") */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pop" style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 99,
      background: 'rgba(8,11,18,0.72)', color: 'var(--on-stage)', fontSize: 12.5, fontWeight: 600, backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)' }}>
      <Icon name="checkCircle" size={14} style={{ color: '#5fd08a' }} /> {msg}
    </div>
  );
}

/* stage toolbar: spin toggle, share (link / poster), palette, about (mobile: zoom + about, top-right) */
function Legend({ groups, layerOn, onPoster, posterBusy, onCopyLink, onZoom, mobile, autorotate, onToggleSpin, vrSupported, vrActive, onEnterVR, onExitVR }) {
  const [cred, setCred] = React.useState(false);     // credits
  const [share, setShare] = React.useState(false);   // share menu (link / poster)
  const pill = {
    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 99, border: '1px solid var(--glass-edge)',
    color: 'var(--ink-soft)', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  };
  const credLink = {
    display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--ink-soft)',
    fontSize: 12, fontWeight: 600, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--hair)', background: 'rgba(255,255,255,0.5)',
  };
  const shareItem = {
    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', cursor: 'pointer',
    border: 'none', background: 'transparent', color: 'var(--ink-soft)', fontFamily: 'var(--font)',
    fontSize: 12.5, fontWeight: 600, padding: '9px 10px', borderRadius: 9,
  };
  const about = (
    <div className="glass pop scroll" style={{ padding: '14px 15px', width: 290, maxHeight: '70vh', overflowY: 'auto' }}>
      <div className="eyebrow" style={{ marginBottom: 9 }}>About</div>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
        The <b style={{ color: 'var(--ink)' }}>most detailed interactive 3D brain</b> available to date, and
        it's <b style={{ color: 'var(--ink)' }}>constantly growing</b>. Free for everyone.
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
        The <a href="https://www.reddit.com/r/neuro/comments/1tyfydj/the_lack_of_a_proper_brain_map_drove_me_nuts_when/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>r/neuro community</a> gave
        it a warm welcome - that meant a lot.
      </p>
      <div className="eyebrow" style={{ marginBottom: 9 }}>Credits</div>
      <a href="https://github.com/itayinbarr" target="_blank" rel="noopener noreferrer" style={{ ...credLink, marginBottom: 10 }}><Icon name="github" size={14} /> Built by Itay Inbar</a>
      <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.5, color: 'var(--ink-faint)' }}>
        initial 3D anatomy from z anatomy, built on BodyParts3D / DBCLS (CC&nbsp;BY-SA&nbsp;4.0). Deep nuclei,
        hypothalamus and white-matter tracts registered from open MRI atlases: CIT168 (Pauli&nbsp;et&nbsp;al.
        2018; Tyszka&nbsp;&amp;&nbsp;Pauli 2016), the Najdenovska&nbsp;et&nbsp;al. 2018 thalamic atlas,
        the Neudorfer&nbsp;et&nbsp;al. 2020 hypothalamic atlas, and HCP1065 tract templates. Approximate and
        educational - not for clinical use.
      </p>
    </div>
  );

  // "Try in VR (beta)" pill - only rendered when the browser reports immersive-vr
  // support (i.e. a real headset/VR browser like the Quest browser), so it never
  // shows on a plain desktop. Sits in this bottom-right (mobile: top-right) row.
  const vrBtn = vrSupported ? (
    <button onClick={vrActive ? onExitVR : onEnterVR} className="glass"
      style={vrActive ? { ...pill, borderColor: 'var(--accent)', color: 'var(--accent)' } : pill}
      title={vrActive ? 'Exit immersive VR' : 'Enter immersive VR (beta) — walk around and pick the brain apart in your headset'}>
      <Icon name="headset" size={14} /> {vrActive ? 'Exit VR' : 'VR'}
      {!vrActive && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 5px', borderRadius: 5, background: 'var(--accent)', color: '#fff' }}>beta</span>}
    </button>
  ) : null;

  // mobile: pinned top-right - zoom −/+ then About, with the panel opening downward
  if (mobile) {
    const zoomBtn = { width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 99, border: '1px solid var(--glass-edge)', color: 'var(--ink-soft)', cursor: 'pointer' };
    return (
      <div style={{ position: 'absolute', right: 8, top: 8, zIndex: 22, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {vrBtn}
          <button onClick={() => onZoom(-1)} className="glass" style={zoomBtn} title="Zoom in"><Icon name="plus" size={16} /></button>
          <button onClick={() => onZoom(1)} className="glass" style={zoomBtn} title="Zoom out"><Icon name="minus" size={16} /></button>
          <button onClick={() => setCred(c => !c)} className="glass" style={pill}><Icon name="info" size={14} /> About</button>
        </div>
        {cred && about}
      </div>
    );
  }

  const spinPill = autorotate ? { ...pill, borderColor: 'var(--accent)', color: 'var(--accent)' } : pill;
  return (
    <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {cred && about}
      {share && !mobile && (
        <div className="glass pop" style={{ padding: 8, width: 232 }}>
          <button onClick={() => { onCopyLink(); setShare(false); }} style={shareItem} title="Copy a link that reopens this exact view">
            <Icon name="link" size={15} style={{ color: 'var(--ink-faint)' }} /> <span style={{ flex: 1 }}>Copy link to this view</span>
          </button>
          <button onClick={() => { onPoster(); setShare(false); }} disabled={posterBusy} style={{ ...shareItem, opacity: posterBusy ? 0.6 : 1 }} title="Download a high-definition poster (features the selected structure)">
            <Icon name={posterBusy ? 'reset' : 'download'} size={15} style={{ color: 'var(--ink-faint)' }} /> <span style={{ flex: 1 }}>{posterBusy ? 'Rendering\u2026' : 'Download poster'}</span>
          </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {vrBtn}
        {!mobile && (
          <button onClick={() => { setShare(s => !s); setCred(false); }} className="glass" style={pill} title="Share this view: copy a link or download a poster">
            <Icon name="share" size={14} /> Share
          </button>
        )}
        <button onClick={() => { setCred(c => !c); setShare(false); }} className="glass" style={pill} title="About this project · credits & licence">
          <Icon name="info" size={14} /> About
        </button>
        {!mobile && (
          <button onClick={onToggleSpin} className="glass" style={spinPill}
            title={autorotate ? 'Stop the automatic spin' : 'Resume the automatic spin'}>
            <Icon name="rotate" size={14} /> {autorotate ? 'Spinning' : 'Spin'}
          </button>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
