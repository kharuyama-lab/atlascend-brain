/* Mode 2 compact control surface: no nested scrolling, all actions one touch. */
const m2small={padding:'6px 5px',borderRadius:7,border:'1px solid var(--hair)',background:'rgba(255,255,255,.72)',fontFamily:'var(--font)',fontWeight:700,fontSize:11,color:'var(--ink-soft)',cursor:'pointer',minWidth:0};
function M2Button({active,children,onClick,disabled=false,title}){return <button type="button" title={title} aria-pressed={!!active} disabled={disabled} onClick={onClick} className={'atlas-choice'+(active?' is-active':'')}>{children}</button>}
function Mode2Panel(p){
 const catalog=p.pathways||[];
 const panel=p.mode2Panel||'routes';
 const groups=['運動系','感覚系','部分経路','視覚系','小脳関連'];
 const [group,setGroup]=React.useState('運動系');
 const [selectedInfo,setSelectedInfo]=React.useState(null);
 const tracts=catalog.filter(t=>t.cat===group);
 const visible=tracts;
 return <section className="atlas-compact-body" aria-label="Mode 2 操作">
  <div className="atlas-section-title">神経伝導路・脳血管</div>
  <div className="atlas-segments">{[['routes','伝導路'],['territory','血管支配'],['lesion','病変モデル']].map(([id,l])=><M2Button key={id} active={panel===id} onClick={()=>p.onMode2PanelChange(id)}>{l}</M2Button>)}</div>
  {panel==='routes'&&<>
   <div className="atlas-compact-row"><span>左右</span><div className="atlas-segments"><M2Button active={p.hemisphere==='left'} onClick={()=>p.setHemisphere('left')}>左</M2Button><M2Button active={p.hemisphere==='both'} onClick={()=>p.setHemisphere('both')}>両側</M2Button><M2Button active={p.hemisphere==='right'} onClick={()=>p.setHemisphere('right')}>右</M2Button></div></div>
   <div className="atlas-compact-row"><span>伝導路</span><div className="atlas-segments"><M2Button onClick={p.onSelectAllTracts}>全ON</M2Button><M2Button onClick={p.onClearTracts}>全OFF</M2Button><M2Button active={!!p.showPathwayLandmarks} onClick={()=>p.onTogglePathwayLandmarks(!p.showPathwayLandmarks)}>経由ラベル</M2Button></div></div>
   <div className="atlas-section-title atlas-section-secondary">伝導路カテゴリ</div>
   <div className="atlas-chip-grid">{groups.map(g=><M2Button key={g} active={group===g} onClick={()=>{setGroup(g);setSelectedInfo(null)}}>{g}</M2Button>)}</div>
   <div className="atlas-compact-list">{visible.map(t=>{const on=p.selectedTracts.includes(t.id);return <div key={t.id} className="atlas-compact-item"><button type="button" aria-pressed={on} className={'atlas-tract-toggle'+(on?' active':'')} onClick={()=>p.onToggleTract(t.id)}>{on?'ON':'OFF'}</button><button type="button" className="atlas-item-name" title={t.en} onClick={()=>setSelectedInfo(selectedInfo===t.id?null:t.id)}>{t.ja}<small>{t.en}</small></button><button aria-label="説明を表示" className="atlas-info-trigger" onClick={()=>setSelectedInfo(selectedInfo===t.id?null:t.id)}>ⓘ</button></div>})}</div>
   {selectedInfo&&catalog.some(t=>t.id===selectedInfo)&&<div className="atlas-inline-detail"><button className="atlas-detail-close" onClick={()=>setSelectedInfo(null)}>×</button>{(()=>{const t=catalog.find(x=>x.id===selectedInfo);return <><strong>{t.ja}</strong><span>{t.summary}／交叉：{t.cross}／機能：{t.function}</span></>})()}</div>}
   {p.selectedTracts.includes('Corticospinal tract')&&<button className="atlas-wide-action" onClick={p.onInspectT1}>T1：皮質脊髄路と運動ニューロン</button>}
   <div className="atlas-compact-row"><span>基本解剖</span><div className="atlas-segments">{[['brainstem','脳幹'],['cerebellum','小脳'],['spinal','脊髄']].map(([k,l])=>{const state=p.contextVisibility?.[k]||'on';return <M2Button key={k} active={state!=='off'} onClick={()=>p.onContextVisibility(k,state==='on'?'fade':state==='fade'?'off':'on')}>{l} {state==='on'?'ON':state==='fade'?'Fade':'OFF'}</M2Button>})}</div></div>
   <div className="atlas-compact-row"><span>深部組織</span><div className="atlas-segments">{[['putamen','被殻'],['thalamus','視床']].map(([k,l])=>{const state=p.contextVisibility?.[k]||'fade';return <M2Button key={k} active={state==='on'} onClick={()=>p.onContextVisibility(k,state==='fade'?'on':state==='on'?'off':'fade')}>{l} {state==='on'?'ON':state==='fade'?'Fade':'OFF'}</M2Button>})}</div></div>
  </>}
  {panel==='territory'&&<>
   <div className="atlas-compact-row"><span>左右</span><div className="atlas-segments"><M2Button active={p.hemisphere==='left'} onClick={()=>p.setHemisphere('left')}>左</M2Button><M2Button active={p.hemisphere==='both'} onClick={()=>p.setHemisphere('both')}>両側</M2Button><M2Button active={p.hemisphere==='right'} onClick={()=>p.setHemisphere('right')}>右</M2Button></div></div>
   <div className="atlas-section-title atlas-section-secondary">血管支配領域（複数選択可）</div>
   <div className="atlas-chip-grid">{(p.territories||[]).map(t=><M2Button key={t.id} title={t.summary} active={!!p.selectedTerritories?.includes(t.id)} onClick={()=>p.onToggleTerritory(t.id)}>{t.id}</M2Button>)}</div>
   <div className="atlas-compact-row"><span>表示</span><div className="atlas-segments"><M2Button onClick={p.onClearTerritories}>全OFF</M2Button><M2Button active={!!p.showSelectedArteries} onClick={()=>p.onToggleSelectedArteries(!p.showSelectedArteries)}>血管連動</M2Button></div></div>
   <div className="atlas-compact-row"><span>不透明度</span><input className="atlas-compact-range" type="range" min="0.12" max="0.80" step="0.02" value={p.territoryOpacity} onChange={e=>p.onTerritoryOpacity(Number(e.target.value))}/><b>{Math.round(p.territoryOpacity*100)}%</b></div>
  </>}
  {panel==='lesion'&&<Mode2LesionCompact {...p}/>}
 </section>;
}
function Mode2LesionCompact(p){
 const cases=(p.lesionCases||[]).filter(x=>x.kind!=='sah');
 const [info,setInfo]=React.useState(false);
 const c=cases.find(x=>x.id===p.selectedLesion);
 return <>
  <div className="atlas-compact-row"><span>病変</span><div className="atlas-segments"><M2Button active={!p.selectedLesion} onClick={()=>p.onSelectLesion(null)}>OFF</M2Button><M2Button active={p.lesionSide==='left'} onClick={()=>p.onLesionSide('left')}>左</M2Button><M2Button active={p.lesionSide==='right'} onClick={()=>p.onLesionSide('right')}>右</M2Button></div></div>
  <div className="atlas-compact-row"><span>領域</span><div className="atlas-segments"><M2Button active={!!p.lesionShowTerritories} onClick={p.onToggleLesionTerritories}>支配領域 {p.lesionShowTerritories?'ON':'OFF'}</M2Button></div></div>
  <div className="atlas-section-title atlas-section-secondary">病変モデルを選択</div>
  <div className="atlas-compact-list">{cases.map(x=><M2Button key={x.id} active={p.selectedLesion===x.id} onClick={()=>{p.onSelectLesion(x.id);setInfo(true);if(p.hemisphere!=='both'&&p.hemisphere!==p.lesionSide)p.setHemisphere('both')}}>{x.ja}</M2Button>)}</div>
  {c&&<><button className="atlas-wide-action" onClick={()=>setInfo(v=>!v)}>{c.ja}　{info?'説明を閉じる':'ⓘ 説明'}</button>{info&&<div className="atlas-inline-detail">{c.site}。{c.desc}</div>}{c.artery&&<button className="atlas-wide-action" onClick={()=>p.onToggleRelatedTerritory(c.artery)}>関連血管領域：{c.artery}</button>}{!!c.tracts?.length&&<button className="atlas-wide-action" onClick={()=>p.onSetTracts(c.tracts.slice())}>関連する伝導路を表示</button>}</>}
 </>;
}
window.Mode2Panel=Mode2Panel;
