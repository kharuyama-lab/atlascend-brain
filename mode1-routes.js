/* Mode 1 educational metadata. Source GLB geometry is not modified.
   'anatomical landmark' labels with node labels refer to actual loaded meshes;
   landmark entries without node labels are descriptive ONLY and must not
   be represented as localized 3D anatomy. */
window.Mode1Routes = {
  'Corticospinal tract': {
    ja:'皮質脊髄路', color:'#00B6FF', direction:'descending', directionJP:'下行性（運動）',
    description:'随意運動に関わる下行路。現モデルは脳内の一部分であり、脊髄までの連続した線維路ではありません。',
    landmarks:[
      {name:'一次運動野（M1・中心前回）', en:'Primary motor cortex', mesh:'Precentral gyrus', note:'運動野の代表的な皮質領域。皮質脊髄路の起点はM1以外にも広がる。'},
      {name:'放線冠', en:'Corona radiata', note:'通過部位。独立3Dモデルは未収録。'},
      {name:'内包後脚', en:'Posterior limb of internal capsule', note:'通過部位。独立3Dモデルは未収録。'},
      {name:'大脳脚', en:'Cerebral peduncle', mesh:'Midbrain', note:'中脳モデルを位置参照として表示。大脳脚そのものの分離モデルではありません。'},
      {name:'橋（橋底部）', en:'Pons', mesh:'Pons', note:'橋モデルを位置参照として表示。'},
      {name:'延髄錐体', en:'Medullary pyramid', mesh:'Pyramid of medulla oblongata', note:'延髄錐体は既存の独立3D構造。'},
      {name:'錐体交叉', en:'Pyramidal decussation', note:'延髄尾側で線維の大部分が交叉。交叉そのものは未描画。'},
      {name:'脊髄・脊髄前角・α運動ニューロン', en:'Spinal cord / alpha motor neuron', note:'次段階で追加予定。脳内モデルの線はここまで延長されていません。'},
    ],
  },
  'Corticobulbar tract': {
    ja:'皮質延髄路', color:'#FF811E', direction:'descending', directionJP:'下行性（運動）',
    landmarks:[
      {name:'運動関連皮質',en:'Motor cortex',mesh:'Precentral gyrus'},
      {name:'内包膝',en:'Genu of internal capsule',note:'独立3Dモデルなし'},
      {name:'脳幹の脳神経運動核',en:'Brainstem motor nuclei',mesh:'Pons',note:'橋を位置参照として表示。核への投射は左右性が核ごとに異なる。'},
    ],
  },
  'Reticulospinal tract': {
    ja:'網様体脊髄路', color:'#5CCE2E', direction:'descending', directionJP:'下行性（運動調節）',
    landmarks:[{name:'橋・延髄網様体',en:'Brainstem reticular formation',mesh:'Pons',note:'網様体そのものの独立モデルではない'}, {name:'脊髄への下行',en:'Spinal projections',note:'脊髄部分は未実装'}],
  },
  'Medial lemniscus': {
    ja:'内側毛帯', color:'#AA58FF', direction:'ascending', directionJP:'上行性（体性感覚）',
    description:'後索–内側毛帯系のうち、延髄で交叉した後の脳幹上行路。後索を含めた感覚路全体と同一ではありません。',
    landmarks:[
      {name:'後索・薄束核・楔状束核',en:'Dorsal columns and nuclei',note:'脊髄と延髄尾側のこれらの経路は未描画'},
      {name:'内側毛帯交叉',en:'Sensory decussation',note:'延髄の交叉位置は未描画'},
      {name:'延髄・橋',en:'Medulla and pons',mesh:'Pons',note:'橋モデルを位置参照として表示'},
      {name:'視床（VPL）',en:'Ventral posterolateral thalamus',note:'VPL核の独立3D対応を要検証'},
      {name:'一次体性感覚野（S1）',en:'Primary somatosensory cortex',mesh:'Postcentral gyrus',note:'上視床放線を経由する別の投射線維'}],
  },
  'Superior thalamic radiation': {
    ja:'上視床放線',color:'#EBC200',direction:'ascending',directionJP:'主として視床–皮質投射',
    landmarks:[{name:'視床核群',en:'Thalamic nuclei',note:'特定の感覚核と経路は要確認'},{name:'中心後回（S1）',en:'Postcentral gyrus',mesh:'Postcentral gyrus',note:'体性感覚野の位置参照'}],
  },
  'Optic radiation': {
    ja:'視放線',color:'#FF3978',direction:'none',directionJP:'視覚情報の伝達',
    landmarks:[{name:'外側膝状体',en:'Lateral geniculate body',mesh:'Lateral geniculate body'}, {name:'後頭葉の視覚野',en:'Visual cortex',note:'視覚皮質全体の代表位置。独立位置合わせ未実施'}],
  },
  'Dentatorubrothalamic tract': {
    ja:'歯状核赤核視床路',color:'#356DFF',direction:'none',directionJP:'小脳出力系',
    landmarks:[{name:'小脳歯状核',en:'Dentate nucleus',note:'独立モデルとの対応未検証'}, {name:'上小脳脚',en:'Superior cerebellar peduncle',mesh:'Superior cerebellar peduncle'}, {name:'視床',en:'Thalamus',note:'関連核の個別位置合わせは要検証'}],
  },
};
window.Mode1Routes.colorFor = function(label) { return this[label]?.color || '#69E5DD'; };
