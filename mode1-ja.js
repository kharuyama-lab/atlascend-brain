/* Mode 1 educational localization. Original Brain Project anatomy identifiers unchanged.
 * Model-associated translations distributed with CC BY-SA 4.0 attribution;
 * new pedagogical text is draft educational content, not clinical decision support.
 */
(function () {
  'use strict';
  const names = {
    // Descending, ascending and association pathways
    'Corticospinal tract':'皮質脊髄路','Corticobulbar tract':'皮質延髄路',
    'Corticopontine tract (frontal)':'前頭橋路','Corticopontine tract (parietal)':'頭頂橋路',
    'Corticopontine tract (occipital)':'後頭橋路',
    'Medial lemniscus':'内側毛帯','Reticulospinal tract':'網様体脊髄路',
    'Anterior thalamic radiation':'前視床放線','Posterior thalamic radiation':'後視床放線',
    'Superior thalamic radiation':'上視床放線','Optic radiation':'視放線',
    'Acoustic radiation':'聴放線','Dentatorubrothalamic tract':'歯状核赤核視床路',
    'Superior cerebellar peduncle':'上小脳脚','Middle cerebellar peduncle':'中小脳脚',
    'Inferior cerebellar peduncle':'下小脳脚','Arcuate fasciculus':'弓状束',
    'Uncinate fasciculus':'鉤状束','Inferior longitudinal fasciculus':'下縦束',
    'Inferior fronto-occipital fasciculus':'下前頭後頭束','Frontal aslant tract':'前頭斜走路',
    'Superior longitudinal fasciculus I':'上縦束I','Superior longitudinal fasciculus II':'上縦束II',
    'Superior longitudinal fasciculus III':'上縦束III',
    'Corticostriatal tract (anterior)':'前部皮質線条体路',
    'Corticostriatal tract (posterior)':'後部皮質線条体路',
    'Corticostriatal tract (superior)':'上部皮質線条体路',
    'Corpus callosum':'脳梁','Fornix':'脳弓','Anterior commissure':'前交連',
    'White matter of telencephalon':'終脳白質',
    // Basal ganglia and thalamus
    'Caudate nucleus':'尾状核','Putamen':'被殻','Globus pallidus external':'淡蒼球外節',
    'Globus pallidus internal':'淡蒼球内節','Substantia nigra':'黒質',
    'Subthalamic nucleus':'視床下核','Nucleus accumbens':'側坐核',
    'Red nucleus':'赤核','Ventral anterior nucleus':'視床前腹側核',
    'Ventral laterodorsal nucleus':'視床外側腹側核（背側部）',
    'Ventral lateroventral nucleus':'視床外側腹側核（腹側部）',
    'Anterior nuclei of thalamus':'視床前核群','Mediodorsal nucleus':'視床背内側核',
    'Intralaminar and lateral posterior nuclei':'視床髄板内核群・外側後核群',
    'Pulvinar':'視床枕','Lateral geniculate body':'外側膝状体',
    'Medial geniculate body':'内側膝状体','Hippocampus':'海馬',
    // Brainstem & cortex
    'Midbrain':'中脳','Pons':'橋','Medulla oblongata':'延髄',
    'Pyramid of medulla oblongata':'延髄錐体','Olive':'オリーブ',
    'Vestibular nuclei':'前庭神経核','Motor nucleus of facial nerve':'顔面神経運動核',
    'Nucleus of abducens nerve':'外転神経核',
    'Precentral gyrus':'中心前回','Postcentral gyrus':'中心後回',
    'Central sulcus':'中心溝','Paracentral gyrus and sulcus':'中心傍小葉（回・溝）',
    'Superior frontal gyrus':'上前頭回','Middle frontal gyrus':'中前頭回',
    'Superior parietal lobule':'上頭頂小葉','Intraparietal sulcus':'頭頂間溝',
    'Supramarginal gyrus':'縁上回','Angular gyrus':'角回',
    'Opercular part of inferior frontal gyrus':'下前頭回弁蓋部',
    'Triangular part of inferior frontal gyrus':'下前頭回三角部',
    'Insula (Subcentral gyrus and ant. and post. sulci)':'島皮質（中心下回周辺）',
    'Calcarine sulcus':'鳥距溝','Cuneus':'楔部','Lingual gyrus':'舌状回',
    'Temporal pole':'側頭極','Superior temporal gyrus (Lateral part)':'上側頭回（外側部）',
    'Transverse temporal gyri':'横側頭回','Precuneus':'楔前部',
    'Flocculus':'片葉','Nodule of vermis':'虫部小節',
    // Arteries
    'Internal carotid artery':'内頸動脈','Anterior cerebral artery':'前大脳動脈',
    'Middle cerebral artery (M1-segment)':'中大脳動脈 M1部',
    'Middle cerebral artery (M3 segment)':'中大脳動脈 M3部',
    'Middle cerebral artery (M3-segment)':'中大脳動脈 M3部',
    'Insular branches of middle cerebral artery (M2)':'中大脳動脈島枝（M2）',
    'Insular branches of middle cerebral artery (M2-segment)':'中大脳動脈島枝（M2）',
    'Posterior cerebral artery':'後大脳動脈','Anterior communicating artery':'前交通動脈',
    'Posterior communicating artery':'後交通動脈','Basilar artery':'脳底動脈',
    'Vertebral artery':'椎骨動脈','Superior cerebellar artery':'上小脳動脈',
    'Anterior inferior cerebellar artery':'前下小脳動脈',
    'Posterior inferior cerebellar artery':'後下小脳動脈',
    'Proximal lateral striate branches':'外側線条体動脈近位枝',
    'Distal lateral striate branches':'外側線条体動脈遠位枝',
    'Pericallosal artery':'脳梁周囲動脈','Callosomarginal artery':'脳梁縁動脈',
    'Anterior spinal artery':'前脊髄動脈',
  };
  // Additional 138 unique Japanese labels. The underlying English node ID is never edited.
  Object.assign(names,{
    "Abducens nerve (VI)": "外転神経（VI）",
    "Accessory nerve (XI)": "副神経（XI）",
    "Accessory nucleus of oculomotor nerve": "動眼神経副核（Edinger–Westphal核）",
    "Adenohypophysis": "下垂体前葉",
    "Anterior division of mandibular nerve": "下顎神経前枝",
    "Anterior hypothalamus": "視床下部前部",
    "Anterior intercavernous sinus": "前海綿間静脈洞",
    "Anterior occipital sulcus": "前後頭溝",
    "Anterior quadrangular lobule": "小脳四角小葉前部",
    "Aqueduct of midbrain": "中脳水道",
    "Base of peduncle": "小脳脚基部",
    "Basilar venous plexus": "脳底静脈叢",
    "Basolateral complex": "扁桃体基底外側核群",
    "Biventral lobule": "小脳二腹小葉",
    "Buccal nerve": "頬神経",
    "Cavernous sinus": "海綿静脈洞",
    "Central lobule": "小脳中心小葉",
    "Central nucleus": "扁桃体中心核",
    "Choroid plexus": "脈絡叢",
    "Cingulate gyrus (Posteroventral part)": "帯状回後腹側部",
    "Cingulate gyrus and sulcus (Middle anterior part)": "帯状回・帯状溝中前部",
    "Cingulate gyrus and sulcus (Middle posterior part)": "帯状回・帯状溝中後部",
    "Cingulate gyrus and sulcus (Posterior dorsal part)": "帯状回・帯状溝後背側部",
    "Cingulate sulcus (Marginal part)": "帯状溝縁部",
    "Circular sulcus of insula": "島輪状溝",
    "Collateral sulcus": "側副溝",
    "Corticomedial group": "扁桃体皮質内側核群",
    "Culmen": "小脳虫部山頂",
    "Declive": "小脳虫部山腹",
    "Facial nerve (VII)": "顔面神経（VII）",
    "Falx cerebri": "大脳鎌",
    "Folium of vermis": "小脳虫部葉",
    "Fourth ventricle": "第四脳室",
    "Frontal branches of callosomarginal artery": "脳梁縁動脈前頭枝",
    "Gracile lobule": "小脳薄小葉",
    "Habenula": "手綱",
    "Hippocampal commissure": "海馬交連",
    "Hypoglossal nerve (XII)": "舌下神経（XII）",
    "Inferior alveolar nerve": "下歯槽神経",
    "Inferior colliculus": "下丘",
    "Inferior frontal sulcus": "下前頭溝",
    "Inferior occipital gyrus and sulcus": "下後頭回・下後頭溝",
    "Inferior petrosal sinus": "下錐体静脈洞",
    "Inferior sagittal sinus": "下矢状静脈洞",
    "Inferior semilunar lobule": "小脳下半月小葉",
    "Inferior temporal gyrus": "下側頭回",
    "Inferior temporal sulcus": "下側頭溝",
    "Interpeduncular fossa": "脚間窩",
    "Lat Fis-ant-Horizont": "外側溝前水平枝",
    "Lat Fis-ant-Vertical": "外側溝前上行枝",
    "Lat Fis-post": "外側溝後枝",
    "Lateral hypothalamus": "視床下部外側部",
    "Lateral nucleus": "扁桃体外側核",
    "Lateral occipital gyrus (Middle occipital gyrus)": "外側後頭回（中後頭回）",
    "Lateral occipitotemporal gyrus": "外側後頭側頭回（紡錘状回）",
    "Lateral pontine branches of basilar artery": "脳底動脈外側橋枝",
    "Lateral ventricle": "側脳室",
    "Lingual nerve": "舌神経",
    "Lingula of cerebellum": "小脳小舌",
    "Lunate sulcus": "月状溝",
    "Mamillary body": "乳頭体",
    "Maxillary nerve": "上顎神経",
    "Medial occipitotemporal gyrus (Parahippocampal)": "内側後頭側頭回（海馬傍回）",
    "Medial pontine branches of basilar artery": "脳底動脈内側橋枝",
    "Meningeal branch of maxillary nerve": "上顎神経硬膜枝",
    "Mental nerve": "オトガイ神経",
    "Middle longitudinal fasciculus": "中縦束",
    "Middle temporal gyrus": "中側頭回",
    "Motor root of trigeminal nerve": "三叉神経運動根",
    "Neurohypophysis": "下垂体後葉",
    "Nucleus of oculomotor nerve": "動眼神経核",
    "Occipital pole": "後頭極",
    "Occipital sinus": "後頭静脈洞",
    "Occipitotemporal sulcus (Lateral part)": "後頭側頭溝外側部",
    "Oculomotor nerve (III)": "動眼神経（III）",
    "Olfactory nerve (I)": "嗅神経（I）",
    "Olfactory sulcus": "嗅溝",
    "Ophthalmic artery": "眼動脈",
    "Ophthalmic nerve": "眼神経",
    "Optic chiasm": "視交叉",
    "Optic nerve (II)": "視神経（II）",
    "Optic tract": "視索",
    "Orbital gyri": "眼窩回",
    "Orbital gyri (Frontomarginal gyrus and sulcus)": "眼窩回（前頭縁回・溝）",
    "Orbital part of inferior frontal gyrus": "下前頭回眼窩部",
    "Orbital sulci (H-shaped orbital sulci)": "眼窩溝（H字状）",
    "Orbital sulci (Lateral Orbital sulcus)": "外側眼窩溝",
    "Orbitofrontal branches of anterior cerebral artery": "前大脳動脈眼窩前頭枝",
    "Paracentral sulcus": "中心傍溝",
    "Parietal branches of middle cerebral artery": "中大脳動脈頭頂枝",
    "Parieto-occipital sulcus": "頭頂後頭溝",
    "Peduncle of flocculus": "片葉脚",
    "Pineal gland": "松果体",
    "Postcentral sulcus": "中心後溝",
    "Posterior commissure": "後交連",
    "Posterior division of mandibular nerve": "下顎神経後枝",
    "Posterior hypothalamus": "視床下部後部",
    "Posterior intercavernous sinus": "後海綿間静脈洞",
    "Posterior quadrangular lobule": "小脳四角小葉後部",
    "Posterior transverse collateral sulcus": "後横側副溝",
    "Precentral sulcus (Superior part)": "中心前溝上部",
    "Precentral sulcus (inferior part)": "中心前溝下部",
    "Preoptic hypothalamus": "視床下部視索前部",
    "Pyramis of vermis": "小脳虫部錐体",
    "Sensory root of trigeminal nerve": "三叉神経感覚根",
    "Septal nuclei": "中隔核群",
    "Septum pellucidum": "透明中隔",
    "Sigmoid sinus": "S状静脈洞",
    "Straight gyrus (Gyrus rectus)": "直回",
    "Straight sinus": "直静脈洞",
    "Stria medullaris thalami": "視床髄条",
    "Stria terminalis": "分界条",
    "Subparietal sulcus": "頭頂下溝",
    "Sulcus interm prim-Jensen": "第一中間溝（Jensen溝）",
    "Superior colliculus": "上丘",
    "Superior frontal sulcus": "上前頭溝",
    "Superior occipital gyri": "上後頭回",
    "Superior petrosal sinus": "上錐体静脈洞",
    "Superior sagittal sinus": "上矢状静脈洞",
    "Superior salivatory nucleus": "上唾液核",
    "Superior semilunar lobule": "小脳上半月小葉",
    "Superior temporal sulcus": "上側頭溝",
    "Temporal branches of middle cerebral artery": "中大脳動脈側頭枝",
    "Temporal plane": "側頭平面",
    "Tentorium cerebelli": "小脳テント",
    "Third ventricle": "第三脳室",
    "Tonsil of cerebellum": "小脳扁桃",
    "Transverse frontopolar gyrus and sulcus": "横前頭極回・溝",
    "Transverse occipital sulcus": "横後頭溝",
    "Transverse sinus": "横静脈洞",
    "Trigeminal nerve (V)": "三叉神経（V）",
    "Trochlear nerve (IV)": "滑車神経（IV）",
    "Tuber of vermis": "小脳虫部隆起",
    "Tuberal hypothalamus": "視床下部隆起部",
    "Uvula of vermis": "小脳虫部垂",
    "Vagus nerve (X)": "迷走神経（X）",
    "Vestibular nerve": "前庭神経",
    "Wing of central lobule": "小脳中心小葉翼"
});
  const categories = {
    cortex:'大脳皮質',cranial_nerves:'脳神経',brainstem:'脳幹',tracts:'神経伝導路・線維路',
    diencephalon:'間脳・視床',arteries:'脳動脈',white_matter:'大脳白質・交連',
    veins_sinuses:'静脈・硬膜静脈洞',cerebellum:'小脳',deep_grey:'基底核・深部灰白質',
    ventricles:'脳室系',meninges_dura:'髄膜・硬膜'
  };
  // Educational drafts: anatomy, physiological function, typical clinical relevance.
  // Disease-specific lesion visualization is reserved for Mode 2.
  const details = {
    'Corticospinal tract': [
      '運動関連皮質から放線冠・内包・大脳脚・橋・延髄錐体を経て脊髄へ下行する。線維の多くは延髄尾側で交叉する。',
      '随意運動に関与し、とくに手指などの分離運動・巧緻運動の制御に重要。',
      '障害されると筋力低下や巧緻運動障害、病期に応じて病的反射・痙縮などの上位運動ニューロン徴候がみられうる。'
    ],
    'Corticobulbar tract': [
      '大脳運動関連皮質から内包膝付近を通り、脳幹の脳神経運動核などへ投射する線維群。支配には両側性・対側優位の違いがある。',
      '顔面・舌・咽喉頭などの随意運動を調節する。',
      '損傷により構音障害、顔面・舌の運動障害などが生じうる。症候は核への両側性支配の程度に依存する。'
    ],
    'Medial lemniscus': [
      '後索核からの二次ニューロンが延髄で交叉して形成し、脳幹を上行して視床腹側後核群へ向かう感覚路。',
      '対側体幹・四肢からの識別性触覚、振動覚、意識的深部感覚の伝達に関わる。',
      '障害では反対側の位置覚・振動覚や識別性触覚が低下し、感覚性運動失調を伴いうる。'
    ],
    'Superior thalamic radiation': [
      '視床から内包・放線冠を経て大脳皮質へ向かう投射線維群の一部。画像由来モデルの境界は近似的。',
      '視床と感覚・運動関連皮質を結ぶ情報伝達に関与する。',
      '障害部位によって対側の感覚障害や運動・注意関連の機能障害につながりうる。'
    ],
    'Posterior thalamic radiation': [
      '視床後部から後頭葉・頭頂葉方向へ向かう投射線維群。視放線を含む領域と関係する。',
      '視床と後方皮質領域を結び、感覚・視覚関連情報の伝達に関与する。',
      '障害の範囲により視野・感覚に関連する症候が現れうる。'
    ],
    'Optic radiation': [
      '外側膝状体から側頭葉・頭頂葉を経て後頭葉の一次視覚野へ向かう線維束。',
      '同名視野の情報を視覚皮質へ伝える。',
      '障害では反対側の同名半盲や同名四分盲が生じうる。'
    ],
    'Reticulospinal tract': [
      '脳幹網様体を起源とし脊髄へ下行する経路。モデルは集約的・模式的で、個人差を反映しない。',
      '姿勢制御、筋緊張、歩行などの脊髄運動回路の調節に関与する。',
      '障害や下行性制御の変化は姿勢・歩行や筋緊張の異常と関連しうるが、単一経路だけでは症候を説明できない。'
    ],
    'Dentatorubrothalamic tract': [
      '小脳歯状核から主に上小脳脚を通り、視床などに至る小脳出力系。中脳付近で交叉する。',
      '小脳から大脳皮質への運動調節情報の伝達に関わる。',
      '障害により協調運動障害、測定障害、企図振戦などの小脳性症候に関与しうる。'
    ],
    'Superior cerebellar peduncle': [
      '小脳と中脳を連結する線維束で、小脳出力線維を多く含む。',
      '小脳から視床・赤核などへの情報伝達を担い、運動調節に関与する。',
      '損傷すると四肢の協調運動障害などが生じうる。'
    ],
    'Middle cerebellar peduncle': [
      '橋核から小脳へ入る橋小脳線維を主に含む大きな線維束。',
      '大脳皮質から橋を介した小脳への運動関連情報を伝える。',
      '損傷では小脳性運動失調などが生じうる。'
    ],
    'Inferior cerebellar peduncle': [
      '延髄・脊髄・前庭系と小脳を連結する線維群を含む。',
      '固有感覚や前庭感覚などを小脳に伝え、姿勢・協調運動の調節に関与する。',
      '損傷により運動失調や平衡障害を生じうる。'
    ],
    'Precentral gyrus': [
      '中心溝の前方に位置し、一次運動野（M1）を含む。身体部位の表現には概ね体部位局在がある。',
      '皮質脊髄路などを介する随意運動の制御に重要。',
      '障害では病変の位置・広がりに応じた対側の運動麻痺や巧緻運動障害が生じうる。'
    ],
    'Postcentral gyrus': [
      '中心溝の後方に位置し、一次体性感覚野（S1）を含む。',
      '触覚・固有感覚などの体性感覚情報の皮質処理に関わる。',
      '障害では対側の体性感覚障害、識別性触覚の低下などを生じうる。'
    ],
    'Putamen': [
      '大脳深部の線条体を構成する核の一つで、内包の外側に位置する。',
      '大脳基底核回路の入力部として運動の選択・調節などに関わる。',
      '機能障害は運動の開始・調節の問題に関連しうる。隣接構造が障害された場合の症候とは区別して考える。'
    ],
    'Caudate nucleus': [
      '側脳室に沿って弓状に存在する線条体の一部。',
      '大脳基底核回路を通じ運動・認知・行動の調節に関与する。',
      '障害により意欲・行動や認知面の変化などを生じうる。'
    ],
    'Globus pallidus internal': [
      '淡蒼球内節は大脳基底核の主要な出力核の一つ。',
      '視床などへの抑制性出力を通じ運動制御を調節する。',
      '機能の変化は運動過少・運動過多などの運動症候と関連する。'
    ],
    'Globus pallidus external': [
      '淡蒼球外節は大脳基底核の間接路などに含まれる核。',
      '視床下核などとの回路を介して基底核出力を調節する。',
      '障害により基底核回路の運動制御に影響しうる。'
    ],
    'Subthalamic nucleus': [
      '間脳下部の小核で、淡蒼球などと結合する。',
      '基底核回路の出力調節に関与する。',
      '片側性の障害では反対側の不随意運動（ヘミバリスムなど）がみられることがある。'
    ],
    'Substantia nigra': [
      '中脳腹側部の核群で、緻密部と網様部などからなる。',
      'ドパミン作動性調節と基底核出力に関与する。',
      'ドパミン系の機能低下は寡動や筋強剛などの運動症候と関連する。'
    ],
    'Ventral anterior nucleus': [
      '視床腹側部の運動関連核群の一つ。',
      '大脳基底核などの入力を受け運動関連皮質との回路に関与する。',
      '障害によって運動の調節に影響しうる。'
    ],
    'Ventral laterodorsal nucleus': [
      '視床腹外側部に属する核群で、運動調節系と結合する。',
      '小脳・基底核などからの情報を運動関連皮質に中継する回路に関与する。',
      '障害では協調運動や随意運動の調節異常が生じうる。'
    ],
    'Pons': [
      '中脳と延髄の間の脳幹部。長い上下行路と脳神経核・橋核などを含む。',
      '運動・感覚情報の伝達と小脳への中継などを担う。',
      '限局性の障害でも運動・感覚・脳神経症候など多彩な症候を生じうる。'
    ],
    'Medulla oblongata': [
      '橋の尾側に続く脳幹部で、錐体・オリーブや諸神経核を含む。',
      '運動・感覚の伝導、呼吸循環など自律機能の調節を担う。',
      '損傷部位によって交叉性の運動・感覚障害や嚥下障害などを生じうる。'
    ],
    'Midbrain': [
      '橋の吻側に位置し、大脳脚・被蓋・上丘・下丘などを含む。',
      '運動路・感覚路の通過、眼球運動や運動調節などに関わる。',
      '障害では運動麻痺、眼球運動障害、運動失調などを生じうる。'
    ],
    'Pyramid of medulla oblongata': [
      '延髄腹側の隆起で、主として皮質脊髄路の下行線維が通過する。',
      '大脳皮質から脊髄への随意運動指令を伝える。',
      '障害は下行運動路の徴候を生じうる。交叉部との位置関係が症候の左右を理解する鍵になる。'
    ],
    'Corpus callosum': [
      '左右大脳半球を連結する大きな交連線維束。',
      '左右大脳半球間の情報統合を助ける。',
      '障害の部位により半球間の情報伝達の異常などを生じうる。'
    ],
    'Internal carotid artery': [
      '頸部から頭蓋内へ入り、前方循環の主要な供血路となる。',
      '大脳半球前方循環の血液供給に関与する。',
      '血管走行と支配領域、具体的な病変はMode 2で扱う。'
    ],
    'Anterior cerebral artery': [
      '内頸動脈終末部から分岐し、大脳半球の内側面を主に走行する。',
      '前方循環の一部として内側前頭・頭頂領域などに血液を供給する。',
      '支配領域と障害時の典型症候はMode 2で学習する。'
    ],
    'Middle cerebral artery (M1-segment)': [
      '内頸動脈から分岐して外側溝方向へ走行する中大脳動脈近位部。穿通枝も分岐する。',
      '大脳半球外側面や深部構造に血液を供給する動脈系の一部。',
      '支配領域と梗塞・出血との対応はMode 2で学習する。'
    ],
    'Posterior cerebral artery': [
      '脳底動脈先端部などから後方へ走行する後方循環の主要動脈。',
      '後頭葉・側頭葉内側部などに血液を供給する。',
      '支配領域と障害に伴う症候はMode 2で扱う。'
    ],
  };
  const systems = {
    motor:['運動系','皮質から脳幹・脊髄へ向かう運動関連経路'],
    somatosensory:['体性感覚系','末梢から視床・大脳皮質へ至る感覚経路'],
    visual:['視覚系','視覚情報の伝達と処理'],
    auditory:['聴覚系','聴覚情報の伝達と処理'],
    language:['言語関連ネットワーク','言語の理解と表出に関連するネットワーク'],
    limbic:['辺縁系・記憶','記憶と情動に関連する経路'],
    reward:['報酬・ドパミン系','基底核の報酬・動機づけ系'],
    csf:['脳脊髄液・脳室系','脳室と脳脊髄液の流れ']
  };

  // Anatomy hierarchy — major category is NEVER omitted, even for very small structures.
  // Hierarchical display is intentionally independent from mesh segmentation.
  const regionJP = {
    "Frontal lobe": "前頭葉",
    "Parietal lobe": "頭頂葉",
    "Temporal lobe": "側頭葉",
    "Occipital lobe": "後頭葉",
    "Limbic lobe": "辺縁葉",
    "Insula": "島葉",
    "Insular lobe": "島葉",
    "Cerebellum": "小脳",
    "Brainstem": "脳幹",
    "Mesencephalon": "中脳",
    "Pons": "橋",
    "Medulla oblongata": "延髄",
    "Telencephalon": "終脳",
    "Diencephalon": "間脳",
    "Hypothalamus": "視床下部",
    "Thalamus": "視床",
    "Amygdala": "扁桃体",
    "Cerebrum": "大脳",
    "Brain": "脳",
    "Vermis": "小脳虫部",
    "Cerebellar peduncles": "小脳脚",
    "Cranial nerves": "脳神経",
    "Cerebral hemisphere": "大脳半球",
    "Corpus striatum": "線条体",
    "Dorsal striatum": "背側線条体",
    "Ventral striatum": "腹側線条体",
    "Globus pallidus": "淡蒼球",
    "Basal forebrain": "前脳基底部",
    "Midbrain": "中脳",
    "Subthalamus": "視床下部（視床下核領域）",
    "Left cerebral hemisphere": "左大脳半球",
    "Right cerebral hemisphere": "右大脳半球",
    "white_matter": "大脳白質",
    "arteries": "動脈",
    "veins_sinuses": "静脈・静脈洞",
    "cranial_nerves": "脳神経",
    "meninges_dura": "髄膜・硬膜",
    "ventricles": "脳室系"
};
  const vermisParts = new Set(['Culmen','Declive','Folium of vermis','Lingula of cerebellum','Nodule of vermis','Pyramis of vermis','Tuber of vermis','Uvula of vermis']);
  const hemisphericParts = new Set(['Anterior quadrangular lobule','Biventral lobule','Gracile lobule','Inferior semilunar lobule','Posterior quadrangular lobule','Superior semilunar lobule','Tonsil of cerebellum','Wing of central lobule']);
  const peduncleParts = new Set(['Superior cerebellar peduncle','Middle cerebellar peduncle','Inferior cerebellar peduncle','Base of peduncle']);
  const flocculonodularParts = new Set(['Flocculus','Peduncle of flocculus','Nodule of vermis']);
  function hierarchy(node){
    if(!node) return [];
    const ja = names[node.label] || node.label;
    const major = categories[node.category] || '脳・神経';
    const c = node.crumb || [];
    const middle = [];
    const add = x => {if(x && x!==major && x!==ja && !middle.includes(x))middle.push(x);};
    if(node.category==='cortex'){
      const lobe=regionJP[node.region] || c.map(x=>regionJP[x]).find(x=>x && /葉$/.test(x));
      add(lobe || '大脳皮質');
    }else if(node.category==='cerebellum'){
      if(flocculonodularParts.has(node.label)) add('片葉小節系');
      else if(peduncleParts.has(node.label)) add('小脳脚');
      else if(vermisParts.has(node.label)) add('小脳虫部');
      else if(hemisphericParts.has(node.label)) add('小脳半球');
      else if(node.label==='Central lobule') add('小脳虫部');
      else add('小脳の小葉');
    }else if(node.category==='brainstem'){
      if(node.label==='Midbrain'||c.includes('Midbrain'))add('中脳');
      else if(node.label==='Pons'||c.includes('Pons'))add('橋');
      else if(node.label==='Medulla oblongata'||c.includes('Medulla oblongata'))add('延髄');
      else add('脳幹');
    }else if(node.category==='diencephalon'){
      if(c.includes('Thalamus')||/thalamus/i.test(node.label)&&!/hypothalamus/i.test(node.label))add('視床');
      else if(c.includes('Hypothalamus')||/hypothalamus/i.test(node.label))add('視床下部');
      else if(/hypophysis/i.test(node.label))add('下垂体');
      else add('間脳関連構造');
    }else if(node.category==='deep_grey'){
      if(c.includes('Amygdala'))add('扁桃体');
      else if(c.includes('Corpus striatum')||c.includes('Globus pallidus')||c.includes('Ventral striatum'))add('大脳基底核');
      else if(c.includes('Midbrain'))add('中脳');
      else if(c.includes('Subthalamus'))add('視床下核領域');
      else add('深部灰白質');
    }else if(node.category==='tracts'){
      if(/corticospinal|corticobulbar|corticopontine|reticulospinal/i.test(node.label))add('下行性運動路');
      else if(/lemniscus|radiation|optic radiation|acoustic radiation/i.test(node.label))add('投射・感覚関連路');
      else if(/cerebellar peduncle|dentatorubro/i.test(node.label))add('小脳連絡路');
      else add('白質線維路');
    }else if(node.category==='cranial_nerves'){
      if(/trigeminal|mandibular|alveolar|buccal nerve|lingual nerve|mental nerve|maxillary|ophthalmic nerve/i.test(node.label))add('三叉神経系');
    }else if(node.category==='ventricles'){
      add('脳室・脳脊髄液系');
    }
    // Eliminate redundant repetition: the final item is always the most specific label.
    let leaf=ja;
    if(node.category==='cerebellum'){
      if(middle.includes('小脳虫部'))leaf=leaf.replace(/^小脳虫部/,'').replace(/^小脳/,'');
      else if(middle.includes('小脳半球'))leaf=leaf.replace(/^小脳/,'');
      else if(middle.includes('小脳脚'))leaf=leaf.replace(/^小脳/,'');
    }
    if(middle.length && (middle[middle.length-1]===leaf||middle[middle.length-1]===ja))middle.pop();
    return [major,...middle,leaf];
  }
  function displayTitle(node){return node ? (names[node.label] || node.label) : '';}

  // Teaching priority is a navigation aid, never a statement that a structure is unimportant clinically.
  // Priority is deliberately assigned to concepts common in undergraduate neuro-PT.
  const core = new Set([
    'Precentral gyrus','Postcentral gyrus','Central sulcus','Paracentral gyrus and sulcus',
    'Superior frontal gyrus','Middle frontal gyrus','Superior parietal lobule','Angular gyrus',
    'Supramarginal gyrus','Precuneus','Superior temporal gyrus (Lateral part)',
    'Transverse temporal gyri','Calcarine sulcus','Cuneus','Lingual gyrus',
    'Hippocampus','Corpus callosum','Fornix','Optic chiasm','Optic nerve (II)',
    'Corticospinal tract','Corticobulbar tract','Medial lemniscus','Optic radiation',
    'Superior thalamic radiation','Reticulospinal tract','Dentatorubrothalamic tract',
    'Putamen','Caudate nucleus','Globus pallidus external','Globus pallidus internal',
    'Substantia nigra','Subthalamic nucleus','Red nucleus','Ventral anterior nucleus',
    'Ventral laterodorsal nucleus','Ventral lateroventral nucleus','Pulvinar',
    'Lateral geniculate body','Medial geniculate body','Midbrain','Pons','Medulla oblongata',
    'Pyramid of medulla oblongata','Superior cerebellar peduncle','Middle cerebellar peduncle',
    'Inferior cerebellar peduncle','Vestibular nuclei','Flocculus',
    'Internal carotid artery','Anterior cerebral artery','Middle cerebral artery (M1-segment)',
    'Posterior cerebral artery','Anterior communicating artery','Posterior communicating artery',
    'Basilar artery','Vertebral artery','Anterior inferior cerebellar artery',
    'Posterior inferior cerebellar artery','Superior cerebellar artery',
    'Third ventricle','Fourth ventricle','Lateral ventricle','Aqueduct of midbrain',
    'Trigeminal nerve (V)','Facial nerve (VII)','Vestibular nerve','Oculomotor nerve (III)',
    'Vagus nerve (X)','Hypoglossal nerve (XII)'
  ]);
  // Specific supplementary explanations: where available these supersede general anatomy notes.
  const supplements = {
    'Putamen':['レンズ核の外側部分を構成する大脳基底核の一部。内包の外側に位置する。','運動関連皮質から入力を受け、基底核回路を介した運動調節に関与する。','被殻出血・線条体病変では内包を含む周囲組織への影響も重要となる。'],
    'Caudate nucleus':['側脳室に沿って弧状に分布する線条体の構成要素。','運動・認知・行動の選択に関連する基底核回路に関与する。','障害の症候は病変の位置・範囲、他の基底核回路への影響によって異なる。'],
    'Globus pallidus internal':['淡蒼球の内側部で、基底核の主要な出力核の一つ。','視床などへの抑制性出力を介して運動の開始・調節に関わる。','基底核の運動調節回路を理解するうえで重要な構造。'],
    'Globus pallidus external':['淡蒼球の外側部で、視床下核などとの回路を形成する。','基底核の間接路などに関係し、運動活動の調整を担う。','単独の損傷だけで症候が一意に決まるわけではない。'],
    'Substantia nigra':['中脳に位置し、緻密部と網様部に区別される。','緻密部のドパミン神経は線条体の機能調節に重要。','黒質緻密部ドパミン神経の変性はパーキンソン病の主要な病態に関係する。'],
    'Subthalamic nucleus':['間脳の視床下領域にある基底核回路の核。','淡蒼球内節・黒質網様部などへの興奮性投射を介して運動調節に関与する。','損傷では対側のバリズムなど不随意運動が生じうる。'],
    'Hippocampus':['側頭葉内側に位置する海馬体の主要部。','新しいエピソード記憶の形成・保持に重要。','両側性障害では著しい記銘障害が生じうる。'],
    'Corpus callosum':['左右大脳半球を連絡する最大の交連線維束。','左右半球間の感覚・運動・認知情報を連絡する。','障害では半球間の情報統合に問題が生じうる。'],
    'Midbrain':['間脳と橋の間に位置する脳幹の上部。大脳脚や被蓋、上・下丘などを含む。','眼球運動、運動調節、感覚情報の中継などに関与する。','病変では眼球運動障害と対側運動障害の組み合わせなどが起こりうる。'],
    'Pons':['中脳と延髄の間の脳幹。橋核や各種脳神経核、長経路を含む。','大脳皮質と小脳の情報連絡、姿勢・運動・感覚調節に関与する。','病変部位により脳神経症候、運動麻痺、感覚障害、運動失調などが生じうる。'],
    'Medulla oblongata':['橋と頸髄をつなぐ脳幹下部。延髄錐体やオリーブなどを含む。','運動・感覚路の通過、呼吸・循環調節、嚥下などに関係する。','病変では交代性症候、嚥下障害、呼吸・循環障害などが問題となる。'],
    'Lateral ventricle':['左右大脳半球内の脳室で、第三脳室とは室間孔を介して連絡する。','脳脊髄液が存在する脳室系の一部。','水頭症では脳室拡大などの画像所見を評価する。'],
    'Third ventricle':['間脳の正中に位置する脳室。','側脳室から受けた脳脊髄液が中脳水道へ流れる経路の一部。','髄液循環障害では脳室拡大の分布が病変位置の手掛かりとなる。'],
    'Fourth ventricle':['橋・延髄の背側と小脳の間に位置する脳室。','中脳水道からの脳脊髄液が流入し、くも膜下腔へ連絡する。','後頭蓋窩の病変による閉塞性水頭症との関連が重要。'],
    'Aqueduct of midbrain':['中脳内で第三脳室と第四脳室を連結する細い管。','脳脊髄液の脳室内の流路を構成する。','狭窄・閉塞により閉塞性水頭症が生じうる。'],
    'Optic chiasm':['視神経が視索へ続く部位に位置し、一部の視覚線維が交叉する。','主に両眼の鼻側網膜由来の線維が交叉する。','圧迫などで両耳側半盲が生じうる。'],
    'Basilar artery':['左右椎骨動脈が合流して形成される脳底部の動脈。','脳幹や小脳などの後方循環に血液を供給する。','閉塞では生命に関わる脳幹虚血や重い運動・意識障害を生じうる。']
  };
  Object.keys(supplements).forEach(k=>{if(!details[k])details[k]=supplements[k];});
  const moreCoreDetails = {
    "Angular gyrus": ["下頭頂小葉の後方に位置し、側頭葉・後頭葉との境界に近い皮質領域。", "言語・読字・数処理・空間認知などに関わる。", "優位半球の損傷では失読・失書・計算障害などを生じうる。"],
    "Anterior communicating artery": ["左右の前大脳動脈を連結するウィリス動脈輪前方の動脈。", "左右の前方循環を連絡する。", "動脈瘤の好発部位の一つであり、破裂するとくも膜下出血をきたしうる。"],
    "Anterior inferior cerebellar artery": ["脳底動脈から分岐し、小脳前下面・橋外側部周辺に分布する動脈。", "小脳および脳幹の一部へ血液を供給する。", "閉塞ではめまい・運動失調・聴覚症状・顔面症状などが生じうる。"],
    "Calcarine sulcus": ["後頭葉内側面の鳥距溝。周囲の皮質には一次視覚野が位置する。", "視覚情報の初期皮質処理に関わる領域の解剖学的指標。", "視覚皮質の障害は対側同名性視野障害につながる。"],
    "Central sulcus": ["前頭葉の中心前回と頭頂葉の中心後回の境界となる脳溝。", "運動野と体性感覚野の位置を理解するための重要なランドマーク。", "脳卒中画像で運動・感覚症候の責任病巣を把握する際に重要。"],
    "Cuneus": ["鳥距溝の上方、頭頂後頭溝の後方にある後頭葉内側の皮質領域。", "視覚情報の処理に関与する後頭葉の一部。", "病変では視野障害などに関連しうる。"],
    "Facial nerve (VII)": ["橋の顔面神経核から出て顔面表情筋などを支配する脳神経。", "表情運動などを担い、味覚や分泌に関わる成分も含む。", "中枢性顔面麻痺と末梢性顔面神経麻痺の違いを理解するうえで重要。"],
    "Flocculus": ["小脳の片葉小節葉を構成する片葉。前庭系と密接に連絡する。", "前庭眼反射や平衡・眼球運動の調整に関わる。", "障害により眼振や平衡障害などが生じうる。"],
    "Fornix": ["海馬から乳頭体などへ向かう弓状の白質線維束。", "辺縁系の記憶関連回路を構成する。", "損傷では記憶障害に関係することがある。"],
    "Hypoglossal nerve (XII)": ["延髄の舌下神経核に由来し、舌筋の多くを支配する脳神経。", "舌の運動と構音・嚥下に関わる。", "末梢性障害では同側舌の萎縮・筋力低下がみられうる。"],
    "Lateral geniculate body": ["視床後部にある視覚系の中継核。", "視索からの入力を受け、視放線を介して一次視覚野へ伝える。", "視覚伝導路の損傷部位と視野障害の関係を理解するうえで重要。"],
    "Lingual gyrus": ["鳥距溝の下方に位置する後頭葉内側面の皮質。", "視覚情報の処理に関与する。", "後頭葉病変では視野症候との位置関係が重要となる。"],
    "Medial geniculate body": ["視床後部にある聴覚系の中継核。", "下丘などからの聴覚情報を聴放線で聴覚皮質へ伝える。", "聴覚伝導路は両側性投射を含むため、一側病変での症候解釈に注意する。"],
    "Middle frontal gyrus": ["前頭葉外側面の上前頭溝と下前頭溝の間に位置する脳回。", "前頭葉の注意・遂行機能などに関連する皮質領域を含む。", "病変により注意や遂行機能の障害が生じうるが、機能局在には個人差がある。"],
    "Oculomotor nerve (III)": ["中脳の動眼神経核群に由来する脳神経。", "眼球運動、眼瞼挙上、瞳孔収縮に関与する。", "障害では眼瞼下垂・眼球運動障害・瞳孔異常などが生じうる。"],
    "Optic nerve (II)": ["網膜神経節細胞の軸索が形成する視覚伝導路の一部。", "網膜からの視覚情報を視交叉へ伝える。", "病変では同側眼の視力障害や視野障害を生じうる。"],
    "Paracentral gyrus and sulcus": ["大脳半球内側面にある中心前回・中心後回の連続領域。", "主に下肢の運動・体性感覚表現領域と関連する。", "前大脳動脈領域病変では対側下肢優位の麻痺・感覚障害が生じうる。"],
    "Posterior communicating artery": ["内頸動脈と後大脳動脈近傍を連絡する動脈。", "ウィリス動脈輪の後方の連絡路を構成する。", "動脈瘤による動眼神経の圧迫などが臨床的に重要。"],
    "Posterior inferior cerebellar artery": ["椎骨動脈から分岐することが多い後下小脳動脈。", "延髄外側部や小脳下面などに血液を供給する。", "閉塞では延髄外側症候群などを生じうる。"],
    "Precuneus": ["頭頂葉内側面の楔前部。", "視空間処理、自己関連処理、認知ネットワークに関与する。", "障害の症候は病変範囲や他の皮質領域との連絡に依存する。"],
    "Pulvinar": ["視床後部に位置する大きな核群。", "視覚・注意などの情報統合に関与する。", "損傷では視空間的な注意などに影響することがある。"],
    "Red nucleus": ["中脳被蓋にある赤核。", "小脳などとの連絡を持ち、運動調節に関与する。", "中脳の病変で運動失調・振戦などを理解する手掛かりとなる。"],
    "Superior cerebellar artery": ["脳底動脈の上部付近から分岐する上小脳動脈。", "小脳上面や上小脳脚などに血液を供給する。", "梗塞では四肢の運動失調などが生じうる。"],
    "Superior frontal gyrus": ["前頭葉の上部に位置する脳回で、内側面にも広がる。", "前頭葉内の運動準備や認知制御などに関連する領域を含む。", "病変部位により運動開始・注意などの機能に影響しうる。"],
    "Superior parietal lobule": ["頭頂間溝より上方の頭頂葉皮質。", "体性感覚と視覚情報の統合、到達運動や空間認知に関与する。", "損傷では感覚運動統合や視覚誘導運動の障害がみられうる。"],
    "Superior temporal gyrus (Lateral part)": ["側頭葉外側面の上部を占める脳回。", "聴覚・言語関連機能に関わる皮質領域を含む。", "優位半球後部周辺の損傷は言語理解障害と関連しうる。"],
    "Supramarginal gyrus": ["側頭葉外側溝の後端を取り囲む下頭頂小葉の一部。", "言語音韻処理、感覚運動統合などに関係する。", "病変では失行や言語関連機能の障害などが起こりうる。"],
    "Transverse temporal gyri": ["上側頭回の上面に位置する横側頭回（ヘシュル回）。", "一次聴覚野を含み、聴覚情報の皮質処理に重要。", "一側性病変では両側性聴覚入力のため単純な片耳聾とはならない。"],
    "Trigeminal nerve (V)": ["橋と連絡する三叉神経。感覚根と運動根を持つ。", "顔面の体性感覚と咀嚼筋運動を主に担う。", "障害では顔面感覚低下、咀嚼筋筋力低下などが起こりうる。"],
    "Vagus nerve (X)": ["延髄に由来する脳神経で、咽喉頭・胸腹部臓器などへ広く分布する。", "嚥下・発声および自律神経機能に関与する。", "障害では嗄声、嚥下障害などが生じうる。"],
    "Ventral lateroventral nucleus": ["視床腹外側核の領域に属する核。", "小脳・基底核からの情報を運動関連皮質へ中継する系に関係する。", "視床病変の運動・協調運動症候を理解する際に位置関係が重要。"],
    "Vertebral artery": ["頸部を上行し頭蓋内で左右が合流して脳底動脈を形成する。", "脳幹・小脳を含む後方循環に血液を供給する。", "解離・閉塞などでは脳幹・小脳梗塞の原因となる。"],
    "Vestibular nerve": ["内耳前庭器から前庭神経核へ情報を伝える第VIII脳神経の構成成分。", "頭部運動・重力方向に関する情報を伝え、平衡と前庭眼反射を支える。", "障害ではめまい、平衡障害、眼振などがみられうる。"],
    "Vestibular nuclei": ["橋・延髄の背外側部に分布する前庭神経核群。", "眼球運動・姿勢制御・前庭脊髄反射に関わる。", "障害では眼振、平衡障害、姿勢の不安定性などが生じうる。"],
  };
  Object.keys(moreCoreDetails).forEach(k=>{if(!details[k]) details[k]=moreCoreDetails[k];});
  const priority = (label) => core.has(label) ? 'core' : 'detail';
  const generalNote = (node) => {
    if(!node)return '';
    const name=names[node.label]||node.label, cat=node.category;
    const region=regionJP[node.region]||'';
    const where=region?`${region}に関連する`:'脳・神経系の';
    const noteByCategory={
      cortex:'大脳皮質の回・溝などの解剖学的区分。近接する機能野と同一とは限らない。',
      cerebellum:'小脳の解剖学的区分。小脳の協調運動・平衡調節の理解に関連する。',
      brainstem:'脳幹の局所構造。通過線維・脳神経核との位置関係が重要。',
      diencephalon:'間脳の局所構造。感覚、運動、自律神経、内分泌などの回路に関係する部位が含まれる。',
      deep_grey:'深部灰白質の一部。基底核・辺縁系などの回路との位置関係を確認する。',
      arteries:'脳血管の分枝または区間。供血領域と症候はMode 2で確認する。',
      veins_sinuses:'頭蓋内の静脈・静脈洞構造。静脈還流経路との連続性を確認する。',
      tracts:'神経線維の経路。起始・終止と通過する構造を合わせて確認する。',
      ventricles:'脳室または髄液循環に関連する構造。',
      cranial_nerves:'脳神経・神経枝の一部。支配領域と走行を確認する。',
      white_matter:'大脳白質の構造。投射線維・連合線維・交連線維との関係を確認する。'
    };
    return `${where}${name}。${noteByCategory[cat]||'周囲の解剖学的位置関係を確認する。'}`;
  };
  window.Mode1JP = Object.freeze({
    names, details, categories, systems, regionJP, hierarchy, displayTitle, priority, generalNote,
    label: (en) => names[en] || en,
    both: (en) => names[en] ? `${names[en]} / ${en}` : en,
    note: '教育用モデルです。解剖学的位置は近似的で、臨床診断には使用できません。'
  });
})();
