/* Mode 1 — bilingual anatomy card. The original 3D node IDs are unchanged. */
function SelectionCard({ node, color, catLabel, description, related, onRelated,
                         onFocus, onIsolate, onClose, isolated, focused,
                         onClearIsolate, mobile, rotationPaused, onResumeRotation }) {
  const [tab,setTab] = React.useState(0);
  React.useEffect(()=>setTab(0),[node?.id]);
  if (!node) return null;
  const JP = window.Mode1JP;
  const info = JP.details[node.label];
  const ja = JP.label(node.label);
  const translated = ja !== node.label;
  const sideLabel = node.side === 'median' ? '正中' : (node.side === 'left' ? '左' : '右');
  const cardStyle = mobile
    ? { position:'absolute', left:8, right:8, bottom:8, maxHeight:'67vh', overflow:'hidden', padding:'16px', zIndex:45 }
    : { position:'absolute', right:16, top:16, width:390, maxWidth:'min(390px,calc(100vw - 32px))', maxHeight:'calc(100vh - 90px)', overflow:'hidden', padding:'17px', zIndex:30 };
  const paraStyle = {fontSize:13, lineHeight:1.7, color:'var(--ink-soft)', margin:'5px 0 0'};
  const sectionStyle = {margin:'13px 0 0', paddingTop:12, borderTop:'1px solid var(--hair-2)'};
  const sectionTitle = {fontSize:12, fontWeight:800, letterSpacing:'.02em', color:'var(--ink)', margin:0};
  return (
    <div className="glass glass-top-hi pop atlas-selection-card" data-mode1-card={node.id} style={cardStyle}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{width:11,height:11,borderRadius:99,background:color,flex:'0 0 auto',marginTop:6}} />
        <div style={{flex:1,minWidth:0}}>
          <h2 style={{margin:0,fontWeight:800,fontSize:19,lineHeight:1.3,color:'var(--ink)'}}>{ja}</h2><span className={'atlas-priority-badge '+JP.priority(node.label)}>{JP.priority(node.label)==='core'?'重要':'詳細'}</span>
          {translated && <div style={{fontSize:12,color:'var(--ink-faint)',marginTop:3}}>{node.label}</div>}
          <div style={{fontSize:11,color:'var(--ink-soft)',lineHeight:1.55,marginTop:6,fontWeight:600}}>{JP.hierarchy(node).join(' › ')}</div>
          <div style={{fontSize:10.5,color:'var(--ink-faint)',marginTop:3}}>{sideLabel}</div>
          {node.label==='Precentral gyrus' && <div style={{fontSize:11,color:'var(--ink-faint)',marginTop:5}}>関連領域：大脳皮質 › 前頭葉 › 一次運動野（M1）〈中心前回全体と同義ではありません〉</div>}
        </div>
        <IconBtn name="x" title="説明を閉じる" onClick={onClose} dim={28} size={15} />
      </div>

      <div className="atlas-detail-tabs" role="tablist" aria-label="構造の解説">
        {['神経解剖','機能解剖','臨床的意義'].map((name,i)=><button key={i} role="tab" aria-selected={tab===i} onClick={()=>setTab(i)}>{name}</button>)}
      </div>
      <p className="atlas-detail-paragraph">{info ? info[tab] : (tab===0 ? JP.generalNote(node) : tab===1 ? 'この詳細構造の個別機能解説は簡略化しています。周囲の主要構造や伝導路との関係を確認してください。' : '単独の障害から症候は断定できません。周囲の重要構造との位置関係を確認してください。')}</p>
      {node.source && node.source.indexOf('Z-Anatomy') === -1 && (
        <p style={{fontSize:11,lineHeight:1.6,color:'var(--ink-faint)',margin:'12px 0 0'}}>
          この構造は {node.source} に由来する近似的な位置合わせを含みます。
        </p>
      )}
      {JP.priority(node.label)==='core' && related && related.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>関連する構造</h3>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:9}}>
            {related.map(r => <button key={r.id} onClick={() => onRelated(r.id)} style={{fontFamily:'var(--font)',fontSize:11.5,color:'var(--ink-soft)',border:'1px solid var(--hair)',borderRadius:8,background:'rgba(255,255,255,.6)',padding:'6px 9px',cursor:'pointer'}}>
              {JP.label(r.label)} {r.side==='median'?'':(r.side==='left'?'L':'R')}
            </button>)}
          </div>
        </div>
      )}
      
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        <button onClick={()=>onFocus(node.id)} style={mode1CardButton(!focused)}>{focused?'視点を戻す':'対象にフォーカス'}</button>
        <button onClick={()=>isolated?onClearIsolate():onIsolate(node.id)} style={mode1CardButton(isolated)}>{isolated?'単独表示を解除':'単独表示'}</button>
        {rotationPaused && <button onClick={onResumeRotation} style={mode1CardButton(false)}>自動回転を再開</button>}
      </div>
    </div>
  );
}
function mode1CardButton(active) {
  return {flex:'1 1 auto',fontFamily:'var(--font)',fontSize:12,fontWeight:700,padding:'9px 10px',borderRadius:9,
    cursor:'pointer',border:active?'1px solid transparent':'1px solid var(--hair)',
    background:active?'var(--accent)':'rgba(255,255,255,.6)',color:active?'#fff':'var(--ink-soft)'};
}
Object.assign(window,{SelectionCard});
