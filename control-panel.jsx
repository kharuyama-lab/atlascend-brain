/* Brain Project - floating frosted control panel */

function Slider({ value, min = 0, max = 1, step = 0.01, onChange, color, label, suffix }) {
  const ref = React.useRef(null);
  const pct = ((value - min) / (max - min)) * 100;
  const set = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    let t = (clientX - r.left) / r.width; t = Math.max(0, Math.min(1, t));
    let v = min + t * (max - min);
    v = Math.round(v / step) * step;
    onChange(Math.max(min, Math.min(max, v)));
  };
  const down = (e) => { e.preventDefault(); set(e.clientX); const mv = (ev) => set(ev.clientX); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); };
  return (
    <div>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{label}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{suffix != null ? suffix : Math.round(value * 100) + '%'}</span>
      </div>}
      <div ref={ref} onPointerDown={down} style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 99, background: 'rgba(16,20,32,0.10)' }} />
        <div style={{ position: 'absolute', left: 0, width: pct + '%', height: 5, borderRadius: 99, background: color || 'var(--accent)' }} />
        <div style={{ position: 'absolute', left: 'calc(' + pct + '% - 9px)', width: 18, height: 18, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(10,14,28,0.3), 0 0 0 1px rgba(10,14,28,0.06)', border: '3px solid ' + (color || 'var(--accent)') }} />
      </div>
    </div>
  );
}

const LEVEL_COLOR = { Intro: 'var(--c-ventricles)', Core: 'var(--accent)', Advanced: 'var(--c-deep_grey)' };

/* ---------------- Systems (functional views) ---------------- */
function SystemsMode({ activeSystem, onStartSystem }) {
  return (
    <div style={{ padding: '0 10px 10px' }}>
      <p style={{ margin: '0 10px 12px', fontSize: 12, lineHeight: 1.5, color: 'var(--ink-faint)' }}>
        神経経路を段階的に強調表示します。確認したい系統を選択してください。説明文は一部英語のままです。
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {window.SYS.SYSTEMS.map(s => {
          const on = activeSystem === s.id;
          const accent = 'var(--c-' + (s.cat || 'cortex') + ')';
          return (
            <button key={s.id} onClick={() => onStartSystem(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
              border: '1px solid ' + (on ? 'transparent' : 'var(--hair)'), background: on ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
              color: on ? '#fff' : 'var(--ink)', transition: 'all .15s',
            }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, flex: '0 0 auto', display: 'grid', placeItems: 'center',
                background: on ? 'rgba(255,255,255,0.14)' : accent + '33' }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: accent, boxShadow: '0 0 8px ' + accent }} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>{(window.Mode1JP.systems[s.id]||[])[0] || s.label}</span>
                </span>
                <span style={{ display: 'block', fontSize: 11.5, lineHeight: 1.4, color: on ? 'rgba(255,255,255,0.7)' : 'var(--ink-faint)', textWrap: 'pretty' }}>{(window.Mode1JP.systems[s.id]||[])[1] || s.blurb}</span>
              </span>
              <span style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 99, background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--ink-ghost)' }}>
                <Icon name={on ? 'pause' : 'play'} size={13} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Learn (lesson library) ---------------- */
function LessonCard({ lesson, layout, completed, onOpen }) {
  const sys = window.SYS.SYSTEMS.find(s => s.id === lesson.system);
  const accent = sys ? 'var(--c-' + sys.cat + ')' : 'var(--accent)';
  const steps = sys ? sys.stages.length : 0;
  const lvlColor = LEVEL_COLOR[lesson.level] || 'var(--accent)';

  if (layout === 'list') {
    return (
      <button onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 11px', borderRadius: 11, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--hair)', background: 'rgba(255,255,255,0.5)' }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, flex: '0 0 auto', display: 'grid', placeItems: 'center', background: accent + '33' }}>
          {completed ? <Icon name="checkCircle" size={16} style={{ color: '#3aa564' }} /> : <span style={{ width: 9, height: 9, borderRadius: 99, background: accent }} />}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{lesson.minutes} min · {steps} stages</span>
        </span>
        <Icon name="chevRight" size={15} style={{ color: 'var(--ink-ghost)', flex: '0 0 auto' }} />
      </button>
    );
  }
  return (
    <button onClick={onOpen} style={{ display: 'block', width: '100%', padding: '13px 14px 14px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--hair)', background: 'rgba(255,255,255,0.55)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span className="eyebrow" style={{ color: accent, letterSpacing: '0.1em' }}>{lesson.kicker}</span>
        <span style={{ flex: 1 }} />
        {completed && <Icon name="checkCircle" size={16} style={{ color: '#3aa564' }} />}
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.015em', color: 'var(--ink)', lineHeight: 1.18, marginBottom: 5, textWrap: 'pretty' }}>{lesson.title}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-soft)', marginBottom: 11, textWrap: 'pretty' }}>{lesson.subtitle}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: lvlColor, background: 'rgba(16,20,32,0.04)', padding: '3px 9px', borderRadius: 99 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: lvlColor }} />{lesson.level}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} />{lesson.minutes} min</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>· {steps} stages</span>
      </div>
    </button>
  );
}

function LearnMode({ completedSet, onOpenLesson }) {
  const [layout, setLayout] = React.useState('cards');
  const LESSONS = window.SYS.LESSONS;
  const done = LESSONS.filter(l => completedSet.has(l.id)).length;
  return (
    <div style={{ padding: '0 12px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="eyebrow" style={{ flex: 1 }}>{done} of {LESSONS.length} completed</span>
        <Segmented style={{ width: 70 }} value={layout} onChange={setLayout}
          options={[{ value: 'cards', icon: 'grid', label: '' }, { value: 'list', icon: 'list', label: '' }]} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: layout === 'list' ? 7 : 10 }}>
        {LESSONS.map(l => (
          <LessonCard key={l.id} lesson={l} layout={layout} completed={completedSet.has(l.id)} onOpen={() => onOpenLesson(l.id)} />
        ))}
      </div>
    </div>
  );
}

function AtlasMode1Browser(props){
  const [category,setCategory] = React.useState(null);
  const [detailsOpen,setDetailsOpen] = React.useState(false);
  const groups = props.groups || [];
  const current = groups.find(g => g.cat === category) || groups.find(g => g.cat === 'cortex') || groups[0];
  const allItems = current ? current.regions.flatMap(r => r.items) : [];
  // The existing hemisphere control also applies to the browser: do not show
  // duplicate left/right entries unless the student explicitly chose both.
  const inSide = it => props.hemisphere === 'both' || it.side === 'median' || it.side === props.hemisphere;
  const visibleItems = allItems.filter(inSide);
  const core = visibleItems.filter(it => window.Mode1JP.priority(it.label) === 'core');
  const detail = visibleItems.filter(it => window.Mode1JP.priority(it.label) !== 'core');
  const byName = (a,b) => window.Mode1JP.label(a.label).localeCompare(window.Mode1JP.label(b.label),'ja');
  core.sort(byName); detail.sort(byName);
  // Search remains global, not restricted to whichever category was last opened.
  const searching = !!props.search?.trim();
  const results = searching ? groups.flatMap(g => g.regions.flatMap(r => r.items)
    .filter(it => inSide(it) && props.matchedIds?.has(it.id)).map(it => ({...it, groupLabel:g.label})))
    .sort((a,b) => (window.Mode1JP.priority(a.label)==='core'?0:1)-(window.Mode1JP.priority(b.label)==='core'?0:1) || byName(a,b)) : [];
  const chooseCat = cat => {setCategory(cat);setDetailsOpen(false);};
  const sideLabel = it => props.hemisphere==='both' && it.side!=='median'
    ? (it.side==='left'?'左 ':it.side==='right'?'右 ':'') : '';
  const renderCompact = (it, inSearch=false) => <div key={it.id} className="atlas-compact-item detail">
    <button type="button" className={'atlas-item-name'+(props.selectedId===it.id?' is-active':'')}
      title={it.label} onClick={()=>props.onSelect(it.id)}>
      {sideLabel(it)}{window.Mode1JP.label(it.label)}
      <small>{inSearch ? it.groupLabel + ' · ' + it.label : it.label}</small>
    </button>
    <button type="button" className="atlas-info-trigger" onClick={()=>props.onFocus(it.id)}
      aria-label={window.Mode1JP.label(it.label)+'にフォーカス'} title="3Dでフォーカス">◎</button>
  </div>;
  return <div className="atlas-mode1-browser">
    <div className="atlas-section-title">構造を選ぶ</div>
    <div className="atlas-categories" aria-label="構造カテゴリ">
      {groups.map(g=><button key={g.cat} type="button"
        className={'atlas-choice'+(!searching && current?.cat===g.cat?' is-active':'')}
        aria-pressed={!searching && current?.cat===g.cat} title={g.label}
        onClick={()=>{if(searching)props.setSearch('');chooseCat(g.cat);}}>{g.label}</button>)}
    </div>
    {searching ? <>
      <div className="atlas-browser-subhead"><strong>検索結果</strong><span>{results.length} 件</span></div>
      <div className="atlas-compact-list">{results.map(it=>renderCompact(it,true))}
        {!results.length&&<div className="atlas-empty">一致する構造がありません</div>}
      </div>
    </> : current && <>
      <div className="atlas-browser-subhead">
        <strong>{current.label}</strong>
        <button type="button" className="atlas-layer-mini" onClick={()=>props.onToggleLayer(current.cat)}
          aria-pressed={!!props.layerOn?.[current.cat]}>{props.layerOn?.[current.cat]?'表示 ON':'表示 OFF'}</button>
      </div>
      {core.length>0 && <div className="atlas-feature-grid" aria-label={current.label+'の主要構造'}>
        {core.map(it=><button key={it.id} type="button"
          className={'atlas-feature-button'+(props.selectedId===it.id?' is-active':'')}
          title={it.label} aria-pressed={props.selectedId===it.id}
          onClick={()=>{if(!props.layerOn?.[current.cat]) props.onToggleLayer(current.cat); props.onSelect(it.id);}}>
          <span className="atlas-feature-name">{sideLabel(it)}{window.Mode1JP.label(it.label)}</span>
        </button>)}
      </div>}
      {detail.length>0 && <>
        <button type="button" className="atlas-detail-toggle" aria-expanded={detailsOpen}
          onClick={()=>setDetailsOpen(v=>!v)}>
          <span>その他の構造 <span className="atlas-detail-count">{detail.length}</span></span>
          <span aria-hidden="true">{detailsOpen?'−':'＋'}</span>
        </button>
        {detailsOpen && <div className="atlas-compact-list">{detail.map(it=>renderCompact(it))}</div>}
      </>}
      {!core.length&&!detail.length&&<div className="atlas-empty">この左右設定に該当する構造はありません</div>}
    </>}
  </div>;
}

function ControlPanel(props) {
  const { pos, setPos, collapsed, setCollapsed, mode, setMode } = props;
  const dragRef = React.useRef(null);
  const [layersOpen, setLayersOpen] = React.useState(false);
  const [viewsOpen, setViewsOpen] = React.useState(false);
  const layersShown = layersOpen || !!props.q;   // a search always reveals the matched tree
  // typing in search auto-collapses the cinematic views (results take the space);
  // clearing it reopens them. Manual toggling still works while a query is active.
  const hasSearch = !!props.search;
  React.useEffect(() => { if(hasSearch)setViewsOpen(false); }, [hasSearch]);

  const startDrag = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    const sx = e.clientX, sy = e.clientY, ox = pos.x, oy = pos.y;
    const mv = (ev) => {
      const nx = Math.max(8, Math.min(window.innerWidth - 120, ox + ev.clientX - sx));
      const ny = Math.max(8, Math.min(window.innerHeight - 80, oy + ev.clientY - sy));
      setPos({ x: nx, y: ny });
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const mobile = props.mobile;
  // on mobile the controls live in the bottom sheet; when a structure is selected the
  // selection card takes that same spot, so we hide the controls behind it
  if (mobile && props.selectedId != null) return null;
  const containerStyle = mobile
    ? { position: 'absolute', left: 8, right: 8, bottom: 8, maxHeight: '44vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 20 }
    : { position: 'absolute', left: pos.x, top: pos.y, width: 326,
        height: collapsed ? undefined : 'calc(100vh - 24px)', maxHeight: 'calc(100vh - 24px)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 20 };
  return (
    <div className="glass glass-top-hi pop" style={containerStyle}>
      {/* header (hidden on mobile - bottom sheet shows only the cinematic views) */}
      {!mobile && (
      <div onPointerDown={startDrag} className="noselect" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 9px 8px 10px', cursor: 'grab' }}>
        <img src="atlascend-brain-icon.png" alt="ATLASCEND Brain" draggable={false}
          style={{ width: 39, height: 39, flex: '0 0 39px', borderRadius: 10, objectFit: 'cover', display: 'block' }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 8, fontWeight: 750, letterSpacing: '0.13em', color: 'var(--ink-faint)' }}>ATLASCEND</span>
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--ink)', lineHeight: 1 }}>Brain</span>
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.03em', padding: '2px 4px', borderRadius: 5, background: 'var(--accent-soft)', color: 'var(--accent)' }}>BETA</span>
          </div>
          <div title="On the Shoulders of Giants. Beyond the Atlas."
            style={{ fontSize: 8, fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--ink-faint)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>On the Shoulders of Giants. Beyond the Atlas.</div>
        </div>
        <Icon name="grip" size={13} style={{ color: 'var(--ink-ghost)', flex: '0 0 auto' }} />
        <IconBtn name={collapsed ? 'chevDown' : 'chevUp'} title={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed(!collapsed)} />
      </div>
      )}

      {!collapsed && (
        <React.Fragment>
          {/* Permanent top-level mode navigation; switching keeps camera and layers intact. */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:4,
              padding: mobile ? '10px' : '0 12px 12px' }}>
            {[['Mode 1','Anatomy',false,'anatomy'],['Mode 2','Pathways',false,'pathways'],['Mode 3','CT/MRI',false,'imaging']].map(([name,sub,disabled,id]) => (
              <button key={name} type="button" disabled={disabled} onClick={()=>!disabled&&props.onAtlasMode(id)} title={disabled ? '未実装' : name+'に切り替え'}
                style={{ display:'flex',flexDirection:'column',gap:2,alignItems:'center',justifyContent:'center',
                padding:'8px 2px',fontSize:11,fontWeight:700,borderRadius:9,
                border:disabled || props.atlasMode!==id ? '1px solid var(--hair)' : '1px solid var(--accent)',
                background:disabled || props.atlasMode!==id ? 'rgba(16,20,32,0.025)' : 'var(--accent-soft)',
                color:disabled ? 'var(--ink-ghost)' : props.atlasMode===id?'var(--accent)':'var(--ink-soft)',cursor:disabled ? 'not-allowed' : 'pointer',
                fontFamily:'var(--font)',lineHeight:1.3 }}>
                <span>{name}</span><span style={{fontSize:10,fontWeight:500}}>{sub}</span>
              </button>
            ))}
          </div>
          <div className="scroll atlas-panel-scroll" style={{ minHeight:0, flex:1, overflowY:'auto', overscrollBehavior:'contain' }}>
          {props.atlasMode === 'imaging' ? <section className="mode3-panel-controls" style={{padding:'8px 12px',fontSize:11,lineHeight:1.3,color:'var(--ink-soft)',boxSizing:'border-box'}} aria-label="Mode 3 操作">
            <div className="atlas-section-title">CT / MRI</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:5,marginBottom:7}}>
              {[['ct','CT'],['t1','MRI T1'],['t2','MRI T2']].map(([id,label])=><button key={id} type="button" onClick={()=>{props.onMode3Mod(id);if((id==='ct')!==(props.mode3Mod==='ct')){const b=props.mode3Meta?.[id]?.bounds;if(b)props.onMode3Position(props.mode3LesionEnabled?b.map(([lo,hi],i)=>(lo+hi)/2+(hi-lo)*({mca:[-.235,.055,.055],capsule:[-.095,-.02,.005],thalamus:[-.065,-.065,-.03],lacune:[-.095,-.015,.03]}[props.mode3LesionRegion]||[-.235,.055,.055])[i]):(id==='ct'?b.map(([lo,hi])=>(lo+hi)/2):[0,-16,30]));}}} aria-pressed={props.mode3Mod===id}
                style={{padding:'6px 3px',borderRadius:8,fontSize:12,fontWeight:props.mode3Mod===id?800:500,cursor:'pointer',border:'1px solid '+(props.mode3Mod===id?'var(--accent)':'var(--hair)'),background:props.mode3Mod===id?'var(--accent-soft)':'rgba(255,255,255,.34)',color:'var(--ink)'}}>{label}</button>)}
            </div>
            {props.mode3Mod==='ct'&&<div style={{marginBottom:7}}><div style={{fontWeight:700,color:'var(--ink)',marginBottom:6}}>CTウィンドウ</div>
              <div style={{display:'flex',gap:6}}>{[['brain','脳条件'],['bone','骨条件']].map(([id,label])=><button key={id} type="button" onClick={()=>props.onMode3CTWindow(id)} aria-pressed={props.mode3CTWindow===id} style={{flex:1,borderRadius:8,padding:'5px',border:'1px solid '+(props.mode3CTWindow===id?'var(--accent)':'var(--hair)'),background:props.mode3CTWindow===id?'var(--accent-soft)':'rgba(255,255,255,.34)',color:'var(--ink)',cursor:'pointer'}}>{label}</button>)}</div>
            </div>}
            <div style={{fontWeight:700,color:'var(--ink)',marginBottom:5}}>{props.mode3Mod==='ct'?'断面位置（CT原画像座標）':'断面位置（ICBM152 MNI座標）'}</div>
            {!props.mode3Position||!props.mode3Meta?.[props.mode3Mod]?<div style={{color:'var(--ink-faint)',fontSize:11,marginBottom:7}}>画像読込後に操作できます。</div>:
              <React.Fragment>
                {[[2,'水平断面','S–I'],[1,'前額断面','A–P'],[0,'矢状断面','R–L']].map(([axis,name,direction])=>{
                  const bounds=props.mode3Meta[props.mode3Mod].bounds[axis],value=props.mode3Position[axis];
                  const inRange=value>=bounds[0]&&value<=bounds[1];
                  return <div key={axis} style={{marginBottom:7}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,marginBottom:4}}><label style={{fontWeight:650,color:'var(--ink)'}}>{name} <span style={{fontWeight:400,fontSize:10}}>({direction})</span></label><span style={{fontSize:10,color:inRange?'var(--ink-soft)':'#b65042'}}>{value.toFixed(1)} mm{!inRange?' 範囲外':''}</span></div>
                    <div style={{display:'grid',gridTemplateColumns:'26px minmax(0,1fr) 26px',gap:5,alignItems:'center'}}>
                      <button type="button" aria-label={name+'を1 mm下げる'} style={{padding:'2px 0',borderRadius:6,border:'1px solid var(--hair)'}} onClick={()=>props.onMode3Position(c=>{const r=[...c];r[axis]=Math.max(bounds[0],Math.min(bounds[1],r[axis]-1));return r;})}>−</button>
                      <input type="range" aria-label={name+'の位置'} min={bounds[0]} max={bounds[1]} step="0.5" value={Math.max(bounds[0],Math.min(bounds[1],value))} onChange={e=>props.onMode3Position(c=>{const r=[...c];r[axis]=Number(e.target.value);return r;})} style={{width:'100%',accentColor:'var(--accent)'}}/>
                      <button type="button" aria-label={name+'を1 mm上げる'} style={{padding:'2px 0',borderRadius:6,border:'1px solid var(--hair)'}} onClick={()=>props.onMode3Position(c=>{const r=[...c];r[axis]=Math.min(bounds[1],Math.max(bounds[0],r[axis]+1));return r;})}>＋</button>
                    </div>
                  </div>;
                })}
              </React.Fragment>}
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:6,marginBottom:7}}>
              <button type="button" onClick={()=>props.onMode3Fit()} style={{border:'1px solid var(--hair)',borderRadius:7,padding:5,background:'rgba(255,255,255,.4)'}}>画像を全体表示</button>
              <button type="button" onClick={()=>{const b=props.mode3Meta?.[props.mode3Mod]?.bounds;if(b)props.onMode3Position(b.map(([lo,hi])=>(lo+hi)/2));}} style={{border:'1px solid var(--hair)',borderRadius:7,padding:5,background:'rgba(255,255,255,.4)'}}>座標を中央へ</button>
            </div>
            <div className="mode3-lesion-panel" role="group" aria-label="病変シミュレーション">
              <div className="mode3-lesion-heading"><strong>病変シミュレーション</strong><button type="button" className={props.mode3LesionEnabled?'on':''} onClick={()=>{
                const next=!props.mode3LesionEnabled;props.onMode3LesionEnabled(next);
                if(next){const b=props.mode3Meta?.[props.mode3Mod]?.bounds;if(b){const mid=b.map(([lo,hi])=>(lo+hi)/2),spans=b.map(([lo,hi])=>hi-lo);const offsets={mca:[-.235,.055,.055],capsule:[-.095,-.02,.005],thalamus:[-.065,-.065,-.03],lacune:[-.095,-.015,.03]};const offset=offsets[props.mode3LesionRegion]||offsets.mca;props.onMode3Position(mid.map((v,i)=>v+spans[i]*offset[i]));}}
              }} aria-pressed={props.mode3LesionEnabled}>{props.mode3LesionEnabled?'ON':'OFF'}</button></div>
              <div className="mode3-lesion-row"><span>種類</span><div className="mode3-choice-grid two">{[['ischemia','脳梗塞'],['hemorrhage','脳出血']].map(([id,label])=><button key={id} type="button" disabled={!props.mode3LesionEnabled} aria-pressed={props.mode3LesionKind===id} className={props.mode3LesionKind===id?'selected':''} onClick={()=>{props.onMode3LesionKind(id);if((id==='hemorrhage'&&props.mode3LesionRegion==='lacune')){props.onMode3LesionRegion('capsule');const b=props.mode3Meta?.[props.mode3Mod]?.bounds;if(b){const off=[-.095,-.02,.005];props.onMode3Position(b.map(([lo,hi],i)=>(lo+hi)/2+(hi-lo)*off[i]));}}}}>{label}</button>)}</div></div>
              <div className="mode3-lesion-row"><span>部位</span><div className="mode3-choice-grid four">{[['mca','MCA'],['capsule','被殻・内包'],['thalamus','視床'],...(props.mode3LesionKind==='hemorrhage'?[]:[['lacune','ラクナ']])].map(([id,label])=><button key={id} type="button" disabled={!props.mode3LesionEnabled} title={id==='lacune'?'ラクナ梗塞':undefined} aria-pressed={props.mode3LesionRegion===id} className={props.mode3LesionRegion===id?'selected':''} onClick={()=>{
                props.onMode3LesionRegion(id);const b=props.mode3Meta?.[props.mode3Mod]?.bounds;if(b){const mid=b.map(([lo,hi])=>(lo+hi)/2),spans=b.map(([lo,hi])=>hi-lo);const offsets={mca:[-.235,.055,.055],capsule:[-.095,-.02,.005],thalamus:[-.065,-.065,-.03],lacune:[-.095,-.015,.03]};props.onMode3Position(mid.map((v,i)=>v+spans[i]*offsets[id][i]));}
              }}>{label}</button>)}</div></div>
              <div className="mode3-lesion-row"><span>表示</span><div className="mode3-choice-grid two">{[['realistic','実画像'],['enhanced','強調表示']].map(([id,label])=><button key={id} type="button" disabled={!props.mode3LesionEnabled} aria-pressed={props.mode3LesionView===id} className={props.mode3LesionView===id?'selected':''} onClick={()=>props.onMode3LesionView(id)}>{label}</button>)}</div></div>
              <div className="mode3-lesion-actions"><button type="button" disabled={!props.mode3LesionEnabled||!props.mode3Meta?.[props.mode3Mod]} onClick={()=>{const b=props.mode3Meta?.[props.mode3Mod]?.bounds;if(!b)return;const off={mca:[-.235,.055,.055],capsule:[-.095,-.02,.005],thalamus:[-.065,-.065,-.03],lacune:[-.095,-.015,.03]}[props.mode3LesionRegion]||[-.235,.055,.055];props.onMode3Position(b.map(([lo,hi],i)=>(lo+hi)/2+(hi-lo)*off[i]));}}>◎ 病変中心（3断面）</button></div>
              <div className="mode3-timeline-head"><span>発症後の経過</span><b>{['発症時 (0–6h)','24時間','7日','慢性期'][props.mode3LesionTime]}</b></div>
              <input className="mode3-timeline" type="range" min="0" max="3" step="1" value={props.mode3LesionTime} disabled={!props.mode3LesionEnabled} onChange={e=>props.onMode3LesionTime(Number(e.target.value))} aria-label="発症後の経過"/>
              <div className="mode3-time-marks"><span>発症</span><span>24h</span><span>7d</span><span>慢性</span></div>
              
            </div>
          </section> : props.atlasMode === 'pathways' ? <Mode2Panel {...props}/> : <React.Fragment>
            <section className="atlas-compact-body" aria-label="Mode 1 操作">
              <div className="atlas-search"><Icon name="search" size={14}/><input value={props.search} onChange={e=>props.setSearch(e.target.value)} placeholder="構造名を検索（日／英）"/>{props.search&&<button onClick={()=>props.setSearch('')}>×</button>}</div>
              <div className="atlas-compact-row"><span>左右</span><div className="atlas-segments"><button className={'atlas-choice'+(props.hemisphere==='left'?' is-active':'')} onClick={()=>props.setHemisphere('left')}>左</button><button className={'atlas-choice'+(props.hemisphere==='both'?' is-active':'')} onClick={()=>props.setHemisphere('both')}>両側</button><button className={'atlas-choice'+(props.hemisphere==='right'?' is-active':'')} onClick={()=>props.setHemisphere('right')}>右</button></div></div>
              <div className="atlas-compact-row"><span>基本解剖</span><div className="atlas-segments">{[['brainstem','脳幹'],['cerebellum','小脳'],['spinal','脊髄']].map(([k,l])=>{const st=props.contextVisibility?.[k]||'on';return <button key={k} type="button" className={'atlas-choice'+(st!=='off'?' is-active':'')} onClick={()=>props.onContextVisibility(k,st==='on'?'fade':st==='fade'?'off':'on')}>{l} {st==='on'?'ON':st==='fade'?'Fade':'OFF'}</button>})}</div></div>
              <div className="atlas-compact-row"><span>脳表透過</span><input className="atlas-compact-range" type="range" min="0" max="1" step="0.01" value={props.cortexOpacity} onChange={e=>props.setCortexOpacity(Number(e.target.value))}/><b>{Math.round(props.cortexOpacity*100)}%</b></div>
              <div className="atlas-section-title atlas-section-secondary">表示プリセット</div>
              <div className="atlas-preset-grid">{(props.presets||[]).map(v=><button type="button" key={v.id} className={'atlas-choice'+(props.activePreset===v.id?' is-active':'')} onClick={()=>props.onPreset(v.id)}>{v.label}</button>)}</div>
              <AtlasMode1Browser {...props}/>
              <div className="atlas-footer-actions"><button type="button" className="atlas-choice" onClick={props.onReset}>初期表示</button><button type="button" className="atlas-choice" onClick={props.isolated?props.onClearIsolate:props.onIsolateMatches} disabled={!props.isolated&&!props.canIsolate}>{props.isolated?'単独表示解除':'単独表示'}</button></div>
            </section>
          </React.Fragment>}
          </div>
          {/* Public attribution: local page, no external code loaded. */}
          <div style={{ padding: mobile ? '4px 10px 7px' : '5px 12px 9px', textAlign: 'right', borderTop: '1px solid var(--hair)' }}>
            <a href="credits.html" target="_blank" rel="noopener noreferrer"
              style={{fontSize:10, fontWeight:600, color:'var(--ink-soft)', textDecoration:'underline', textUnderlineOffset:2}}
              title="教材について・出典・ライセンスを開く">About / Credits &amp; Licenses</a>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

const ghostBtn = { border: '1px solid var(--hair)', background: 'transparent', color: 'var(--ink-faint)', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, cursor: 'pointer' };
const footBtn = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid var(--hair)', background: 'rgba(255,255,255,0.5)', color: 'var(--ink-soft)', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 600, padding: '8px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' };

Object.assign(window, { ControlPanel, Slider });
