/* Mode 2 educational time-course state (v0.8).
 * PHASES are qualitative examples, NOT measurements, predictions or care advice.
 * Later lesion renderers can consume the active mechanisms via getPhase(type,idx).
 * Anchors are discrete because individual clinical progression is not linear.
 */
(function(){'use strict';
const TIMES=['発症直後','約6時間','約24時間','約3日','約7日','約14日'];
const STATES={
  ischemic:{ja:'脳梗塞（虚血）',en:'Ischemic stroke',phases:[
    {title:'血流遮断・機能障害',detail:'虚血中心と救済可能な低灌流組織（ペナンブラ）が生じ得る。範囲は閉塞部位・側副血行・再灌流で変わる。',layers:['血流低下','虚血中心','ペナンブラ候補']},
    {title:'虚血の進行と再灌流の分岐',detail:'早期の再灌流が得られれば救済可能な組織が残り得る。ペナンブラが一定速度で梗塞へ移行するわけではない。',layers:['虚血中心','ペナンブラ候補','再灌流条件による差']},
    {title:'梗塞の成立・浮腫の出現',detail:'不可逆的に損傷した領域が明瞭化し、細胞性／血管原性浮腫が加わり得る。大梗塞では腫脹に注意。',layers:['梗塞中心','浮腫の可能性']},
    {title:'亜急性期の腫脹',detail:'広範囲梗塞では発症後数日以内の腫脹が重要。個人差・治療で経過が大きく異なる。',layers:['梗塞巣','浮腫・腫脹']},
    {title:'亜急性期への移行',detail:'浮腫の経過と組織変化が進む。神経伝導路の機能障害と、遅発性の軸索変性は区別する。',layers:['梗塞巣','亜急性組織変化']},
    {title:'組織修復・慢性期へ',detail:'壊死組織の処理やグリオーシスが進む。症状は病巣・治療・可塑性・リハビリテーションなどに左右される。',layers:['組織変化','機能回復過程']},
  ]},
  hemorrhagic:{ja:'脳出血（脳実質内）',en:'Intracerebral hemorrhage',phases:[
    {title:'血腫形成と直接損傷',detail:'出血による組織損傷・血腫の占拠効果が生じる。梗塞と異なり、血腫自体を3D空間で表現する。',layers:['血腫','組織圧排']},
    {title:'早期血腫拡大のリスク',detail:'出血後の早期には血腫拡大が起こり得るが、全例ではない。出血量・治療によって異なる。',layers:['血腫','拡大リスク','圧排']},
    {title:'血腫周囲の二次性障害',detail:'血腫周囲浮腫、炎症、血液成分による毒性が病態に関与し得る。',layers:['血腫','血腫周囲浮腫']},
    {title:'浮腫と組織の圧排',detail:'血腫周囲浮腫は数日以上続き得る。血腫の増大と浮腫の増大は別の現象。',layers:['血腫','浮腫','圧排']},
    {title:'吸収と回復過程',detail:'血腫吸収と周囲組織の変化が進む。神経症候の推移は障害された経路や合併症による。',layers:['血腫の吸収','組織変化']},
    {title:'残存病変',detail:'血腫吸収が進む一方、実質損傷や神経回路の障害が残り得る。',layers:['残存損傷','回復過程']},
  ]},
  sah:{ja:'くも膜下出血（動脈瘤）',en:'Aneurysmal subarachnoid hemorrhage',phases:[
    {title:'くも膜下腔への出血',detail:'脳槽・脳溝などのくも膜下腔に血液が広がる。脳実質内血腫と区別する。',layers:['くも膜下腔の血液','急性水頭症の可能性']},
    {title:'急性合併症の監視',detail:'再出血や急性水頭症が重要。動脈瘤の閉鎖状況などで経過は大きく異なる。',layers:['くも膜下腔の血液','急性合併症']},
    {title:'初期の経過',detail:'くも膜下腔の血液と全脳への影響を評価する。遅発性脳虚血（DCI）はこの時点で必ず起こるものではない。',layers:['くも膜下腔の血液','合併症の監視']},
    {title:'遅発性脳虚血への注意',detail:'発症後おおむね4～14日はDCIの重要な時期。血管攣縮とDCIは同義ではない。',layers:['DCIリスク期間','攣縮の可能性']},
    {title:'遅発性合併症の時期',detail:'DCIは起こる場合と起こらない場合がある。二次的な脳梗塞が起これば、そこで初めて新たな実質病巣が加わる。',layers:['DCIリスク期間','二次性梗塞の可能性']},
    {title:'遅発性合併症の後期',detail:'血管攣縮・DCIのリスクは経時的に変化する。臨床症候は必ずしも血管攣縮と一致しない。',layers:['経過観察','機能障害の評価']},
  ]}
};
function getPhase(type,index){const state=STATES[type]||STATES.ischemic;const i=Math.max(0,Math.min(TIMES.length-1,Math.trunc(index)||0));return {type,time:TIMES[i],index:i,...state.phases[i]};}
window.Mode2StrokeTime={TIMES,STATES,getPhase};
})();
