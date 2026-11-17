<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ShadingScene from './ShadingScene.vue'
import ClassicVectors from './ClassicVectors.vue'
import ClassicPointLight from './ClassicPointLight.vue'
import { lambert, orenNayar, pointIlluminance, specularTerms, combineLighting } from '../../packages/cg-algorithms/src/shading-classic.ts'

const props = defineProps<{topic:string}>()
const teacher = ref(false)
const showExplanation = ref(true)
const defaults = () => ({lightAngle:35,viewAngle:55,azimuth:180,objectPitch:0,objectYaw:0,kd:.7,ks:.65,intensity:1,exponent:20,blinnExponent:80,sigma:45,distance:1,ambient:.2,red:255,green:244,blue:222,subdivisions:1,mode:'lambert',sameExponent:false,wireframe:false,normals:false,ambientOn:true,diffuseOn:true,specularOn:true,comparison:false})
const s = reactive(defaults())
const information: Record<string,{title:string;goal:string;prediction:string;observation:string;explanation:string}> = {
  'visibility-shading': {title:'Visibility / Shading Explorer',goal:'可視面の決定と、見えている面の明るさの計算を区別する。',prediction:'視点を固定したまま光源を動かすと、輪郭と明るさはそれぞれどう変わる？',observation:'Visible SurfaceとDiffuseを切り替え、光源方向だけを変えて比較する。次に視点を動かす。',explanation:'Visibilityは幾何形状と視点から、手前にある面を決める。Shadingはその面の法線・材質・光源・視点から色を計算する。Wireframeはメッシュの辺を表示し、裏側の線は深度比較で隠す。Visible Surfaceは同じ深度比較で手前の面を塗りつぶす。'},
  lambert: {title:'Lambert Reflection Explorer',goal:'単位法線Nと光源方向Lの内積を、拡散反射の明るさと結び付ける。',prediction:'光源を正面から60°傾けると、線形の反射光量は何倍になる？',observation:'0°→60°→90°→120°を順に選ぶ。内積が負になっても、明るさは負にならない。',explanation:'同じ光が斜めに当たると広い面積に分散するので、単位面積当たりの光量はcos θで減る。数値は球の頂点N=(0,1,0)での値。球全体では画素ごとの法線で計算する。'},
  'point-light': {title:'Point Light Explorer',goal:'点光源の距離と入射角を分けて操作し、照度の逆二乗則を理解する。',prediction:'光源までの距離を2倍、3倍にすると、表面点の照度はそれぞれ何倍になる？',observation:'距離1・2・3のプリセットは角度0°、放射強度1に固定する。照度1、1/4、1/9を比較する。',explanation:'放射強度Jが一定の点光源では、光が広がる面積は距離の二乗に比例する。ここでは遮蔽のない1個の表面点を計算する。位置は距離・天頂角・方位角で指定し、P=(0,0,0)、N=(0,1,0)。'},
  'oren-nayar': {title:'Lambert / Oren–Nayar Explorer',goal:'粗い拡散面の反射が、粗さと入射・出射方向の組に依存することを理解する。',prediction:'σ=0のときは？ σ=45°で、視点を光源側から反対側へ回すとどうなる？',observation:'θL=θV=60°、σ=45°で方位差0°・90°・180°を選び、0.63166・0.33713・0.33713を確認する。',explanation:'講義付録の簡略モデルを使用。σは小面の傾斜角の標準偏差で、計算前にラジアンへ変換する。相互反射は省く。数値は球の頂点で、正面入射時のLambert放射輝度を1とした相対値。MicrofacetのαやPBRのRoughnessとは別の量。'},
  'phong-blinn': {title:'Phong / Blinn–Phong Explorer',goal:'反射ベクトルRとハーフベクトルHを使う2種類の鏡面モデルを比較する。',prediction:'n=m=20ならハイライトの幅も同じ？ Blinnの指数を4倍にするとどうなる？',observation:'同じ指数とn=20・m=80を比較する。光源固定で視点を20°動かし、R·VとN·Hの変化を見る。',explanation:'N・L・Vは単位ベクトル。R=2(N·L)N−L、H=normalize(L+V)。ここでは照明モデルのみを比較し、両方とも画素ごとに評価する。Phong Reflection Modelと、法線を補間するPhong Shadingは別の概念。経験的鏡面式であり、正規化されたBRDFではない。'},
  'shading-comparison': {title:'Flat / Gouraud / Phong Explorer',goal:'同じ形状でも、照明計算の位置と補間する量によって見え方が変わることを理解する。',prediction:'20面の球の頂点間に小さなハイライトがあると、Gouraudでは見つけられる？',observation:'面数を20から1,280へ増やす。ワイヤーと法線を表示し、Flatは面の中心の面法線、Gouraud / Phongは頂点法線を比較する。輪郭が3方式で同じことも確認する。',explanation:'Flatは面の中心と面法線で一度計算し、面内の色を一定にする。Gouraudは頂点で照明を計算して色を補間する。Phongは頂点法線を補間し、正規化して画素ごとに照明を計算する。すべて同じ正二十面体の分割メッシュ、同じ視点、同じBlinn–Phong鏡面モデルを使用する。'},
  'ambient-components': {title:'Ambient / Diffuse / Specular Explorer',goal:'局所照明の3成分を分離し、Ambient LightとAmbient Occlusionを区別する。',prediction:'Ambientだけで球の丸さは分かる？ AOを加えると、接触部と直接光はどうなる？',observation:'各成分を単独表示してから合成する。AO比較ではAmbientのみから始め、Diffuse・Specularを追加して両側で直接光が同じことを確認する。',explanation:'Ambientは方向によらない一様な明るさ。AOは周囲の方向の遮蔽を幾何形状からサンプリングする近似で、光源ではない。遮蔽率Aは0が遮蔽なし、1が完全遮蔽。AOを掛けるのはAmbientだけで、直接光によるCast Shadowや間接反射・色移りは再現しない。'},
}
const info = computed(() => information[props.topic] ?? information.lambert!)
function reset() {
  Object.assign(s,defaults())
  if (props.topic==='lambert') Object.assign(s,{lightAngle:0,kd:1,intensity:1,red:255,green:255,blue:255})
  if (props.topic==='point-light') Object.assign(s,{lightAngle:0,azimuth:0})
  if (props.topic==='oren-nayar') Object.assign(s,{lightAngle:60,viewAngle:60,azimuth:0,kd:1,ks:0})
  if (props.topic==='shading-comparison') Object.assign(s,{lightAngle:30,viewAngle:45,exponent:64,subdivisions:0})
}
watch(() => props.topic,reset,{immediate:true})
function preset(values:Partial<ReturnType<typeof defaults>>) { reset(); Object.assign(s,values) }
function resetRotation() {s.objectPitch=0;s.objectYaw=0}
function rotateObject(dx:number,dy:number) {
  const wrap=(angle:number)=>((angle+180)%360+360)%360-180
  s.objectYaw=wrap(s.objectYaw-dx*.6);s.objectPitch=wrap(s.objectPitch-dy*.6)
}
type NumberKey = 'objectPitch'|'objectYaw'|'lightAngle'|'viewAngle'|'azimuth'|'kd'|'ks'|'intensity'|'exponent'|'blinnExponent'|'sigma'|'distance'|'ambient'|'red'|'green'|'blue'
type Control = {key:NumberKey;label:string;min:number;max:number;step:number;unit?:string;disabled?:boolean}
const controls = computed<Control[]>(() => {
  const items: Control[] = [{key:'lightAngle',label:props.topic==='lambert'||props.topic==='point-light'?'入射角 θL':'光源の天頂角 θL',min:0,max:['oren-nayar','phong-blinn','shading-comparison','ambient-components'].includes(props.topic)?85:180,step:1,unit:'°'}]
  if (props.topic==='point-light') items.unshift({key:'distance',label:'距離 r',min:.5,max:5,step:.05,unit:' m'})
  if (!['lambert','point-light'].includes(props.topic)) items.push({key:'viewAngle',label:'視点の天頂角 θV',min:5,max:props.topic==='visibility-shading'?160:85,step:1,unit:'°'})
  if (['oren-nayar','phong-blinn','point-light'].includes(props.topic)) items.push({key:'azimuth',label:props.topic==='point-light'?'光源の方位角 φL':'光源と視点の方位差 Δφ',min:0,max:props.topic==='point-light'?360:180,step:1,unit:'°'})
  if (props.topic==='lambert') items.push({key:'kd',label:'拡散反射係数 kd',min:0,max:1,step:.01})
  if (['lambert','point-light'].includes(props.topic)) items.push({key:'intensity',label:props.topic==='point-light'?'放射強度 J [W/sr]':'光源強度 IL',min:0,max:2,step:.01})
  if (props.topic==='oren-nayar') items.push({key:'sigma',label:'傾斜角の標準偏差 σ',min:0,max:60,step:1,unit:'°'})
  if (['phong-blinn','shading-comparison','ambient-components'].includes(props.topic)) items.push({key:'exponent',label:props.topic==='phong-blinn'?'Phong指数 n':'鏡面指数 m（Blinn–Phong）',min:1,max:200,step:1})
  if (props.topic==='phong-blinn') items.push({key:'blinnExponent',label:'Blinn–Phong指数 m',min:1,max:800,step:1,disabled:s.sameExponent},{key:'ks',label:'鏡面係数 ks',min:0,max:1,step:.01})
  if (props.topic==='ambient-components') items.push({key:'ambient',label:'Ambient強度 ka Iambient',min:0,max:1,step:.01},{key:'kd',label:'Diffuse係数 kd',min:0,max:1,step:.01},{key:'ks',label:'Specular係数 ks',min:0,max:1,step:.01})
  if (props.topic==='lambert') for (const [key,label] of [['red','光源色 R'],['green','光源色 G'],['blue','光源色 B']] as const) items.push({key,label,min:0,max:255,step:1})
  if (props.topic==='shading-comparison') items.push(
    {key:'objectPitch',label:'物体のX軸回転',min:-180,max:180,step:.1,unit:'°'},
    {key:'objectYaw',label:'物体のY軸回転',min:-180,max:180,step:.1,unit:'°'})
  return items
})
const lightColor = computed(() => '#'+[s.red,s.green,s.blue].map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''))
const m = computed(() => s.sameExponent?s.exponent:s.blinnExponent)
const spec = computed(() => specularTerms(s.lightAngle,s.viewAngle,s.azimuth,s.exponent,m.value,s.ks,s.intensity))
const terms = computed(() => combineLighting({ambient:s.ambient,diffuse:lambert(s.lightAngle,s.kd,s.intensity),specular:specularTerms(s.lightAngle,s.viewAngle,s.azimuth,s.exponent,s.exponent,s.ks,s.intensity).blinn,ambientOn:s.ambientOn,diffuseOn:s.diffuseOn,specularOn:s.specularOn,occlusion:0}))
const settings = computed<Record<string,number|string|boolean>>(() => ({lightAngle:s.lightAngle,viewAngle:s.viewAngle,objectPitch:s.objectPitch,objectYaw:s.objectYaw,lightAzimuth:0,viewAzimuth:s.azimuth,kd:s.kd,ks:s.ks,intensity:s.intensity,exponent:s.exponent,sigma:s.sigma,ambient:props.topic==='ambient-components'?s.ambient:0,ambientOn:s.ambientOn,diffuseOn:s.diffuseOn,specularOn:s.specularOn,subdivisions:props.topic==='shading-comparison'?s.subdivisions:3,wireframe:s.wireframe,normals:s.normals,baseColor:props.topic==='lambert'?'#ffffff':'#82bee8',lightColor:props.topic==='lambert'?lightColor.value:'#ffffff'}))
type SceneCard = {label:string;model:string;extra:Record<string,number|string|boolean>}
const cards = computed((): SceneCard[] => {
  if (props.topic==='oren-nayar') return [{label:'Lambert',model:'lambert',extra:{}},{label:'Oren–Nayar',model:'oren-nayar',extra:{}}]
  if (props.topic==='phong-blinn') return [{label:`Phong · n = ${s.exponent}`,model:'phong',extra:{kd:.15}},{label:`Blinn–Phong · m = ${m.value}`,model:'blinn-phong',extra:{exponent:m.value,kd:.15}}]
  if (props.topic==='shading-comparison') return [{label:'Flat · 面で計算',model:'flat',extra:{}},{label:'Gouraud · 頂点で計算',model:'gouraud',extra:{}},{label:'Phong · 画素で計算',model:'smooth',extra:{}}]
  if (props.topic==='ambient-components' && s.comparison) return [{label:'Ambient + 選択した直接光',model:'ambient',extra:{floor:true,ao:false}},{label:'Ambient × (1−A) + 同じ直接光',model:'ambient',extra:{floor:true,ao:true}}]
  return [{label:props.topic==='visibility-shading'?({wireframe:'Wireframe',visible:'Visible Surface',lambert:'Diffuse Shading',phong:'Diffuse + Specular'}[s.mode]??s.mode):props.topic==='ambient-components'?'選択した3成分の合成':'Lambert · 球全体の反射',model:props.topic==='visibility-shading'?s.mode:props.topic==='ambient-components'?'ambient':'lambert',extra:{floor:props.topic==='visibility-shading',secondSphere:props.topic==='visibility-shading'}}]
})
const number = (value:number) => value.toFixed(5)
</script>

<template>
  <section class="shading-explorer classic-explorer" :class="{'teacher-mode':teacher}" :data-topic="topic">
    <header class="explorer-header">
      <div><p class="eyebrow">第7回 · SHADING LAB</p><h2>{{ info.title }}</h2><p class="goal">{{ info.goal }}</p></div>
      <div class="display-actions"><button type="button" :aria-pressed="teacher" @click="teacher=!teacher">{{ teacher?'通常表示':'教員投影モード' }}</button><button type="button" :aria-expanded="showExplanation" @click="showExplanation=!showExplanation">{{ showExplanation?'説明を折りたたむ':'説明を表示' }}</button></div>
    </header>
    <p v-if="showExplanation" class="prediction"><strong>予測</strong> {{ info.prediction }}</p>
    <div class="explorer-layout">
      <aside class="controls" aria-label="照明パラメータ">
        <h3>操作</h3>
        <label v-if="topic==='visibility-shading'" class="select-control">表示モード<select v-model="s.mode" aria-label="表示モード"><option value="wireframe">Wireframe</option><option value="visible">Visible Surface</option><option value="lambert">Diffuse Shading</option><option value="phong">Diffuse + Specular</option></select></label>
        <label v-if="topic==='shading-comparison'" class="select-control">三角形数<select v-model.number="s.subdivisions" aria-label="三角形数"><option v-for="(count,index) in [20,80,320,1280]" :key="count" :value="index">{{ count.toLocaleString() }} 三角形</option></select></label>
        <label v-for="control in controls" :key="control.key" class="range-control"><span>{{ control.label }} <output>{{ control.key==='blinnExponent'&&s.sameExponent?m:Number(s[control.key]).toFixed(control.step<1?2:0) }}{{ control.unit }}</output></span><input v-model.number="s[control.key]" type="range" :min="control.min" :max="control.max" :step="control.step" :aria-label="control.label" :disabled="control.disabled" /></label>
        <div v-if="topic==='lambert'" class="color-swatch"><span :style="{background:lightColor}" />光源色 {{ lightColor }} <small>sRGB入力</small></div>
        <label v-if="topic==='phong-blinn'" class="check-control"><input v-model="s.sameExponent" type="checkbox" />同じ指数を使用する（m = n）</label>
        <template v-if="topic==='visibility-shading'||topic==='shading-comparison'"><label class="check-control"><input v-model="s.wireframe" type="checkbox" />ワイヤーフレームを重ねる</label></template>
        <label v-if="topic==='shading-comparison'" class="check-control"><input v-model="s.normals" type="checkbox" />法線を表示</label>
        <template v-if="topic==='ambient-components'">
          <label class="check-control"><input v-model="s.ambientOn" type="checkbox" />Ambient</label><label class="check-control"><input v-model="s.diffuseOn" type="checkbox" />Diffuse</label><label class="check-control"><input v-model="s.specularOn" type="checkbox" />Specular</label>
          <label class="check-control"><input v-model="s.comparison" type="checkbox" />Ambient / AO 比較モード</label>
        </template>
        <button v-if="topic==='shading-comparison'" type="button" class="reset" @click="resetRotation">物体の向きだけを戻す</button>
        <button type="button" class="reset" @click="reset">初期状態に戻す</button>
        <p class="coordinate-note">天頂角は+Yから測定。方位角0°は+Z、90°は+X。球の半径は1。</p>
      </aside>
      <div class="experiment">
        <div class="presets" aria-label="プリセット">
          <span>プリセット</span>
          <template v-if="topic==='lambert'"><button v-for="angle in [0,60,90,120]" :key="angle" type="button" @click="preset({lightAngle:angle})">入射角 {{ angle }}°</button></template>
          <template v-else-if="topic==='point-light'"><button v-for="r in [1,2,3]" :key="r" type="button" @click="preset({distance:r})">距離 {{ r }} m</button></template>
          <template v-else-if="topic==='oren-nayar'"><button type="button" @click="preset({sigma:0})">σ = 0°</button><button type="button" @click="preset({sigma:45})">σ = 45° · θL = θV = 60°</button><button v-for="angle in [0,90,180]" :key="angle" type="button" @click="preset({azimuth:angle})">方位差 {{ angle }}°</button></template>
          <template v-else-if="topic==='phong-blinn'"><button type="button" @click="preset({sameExponent:true,exponent:20,viewAngle:35})">n = m = 20</button><button type="button" @click="preset({exponent:20,blinnExponent:80,viewAngle:35})">n = 20 · m = 80</button><button type="button" @click="preset({viewAngle:55})">光源固定・視点 +20°</button></template>
          <template v-else-if="topic==='shading-comparison'"><button type="button" @click="preset({subdivisions:0,exponent:100})">20面・小さなハイライト</button><button type="button" @click="preset({subdivisions:3})">1,280面</button><button type="button" @click="preset({wireframe:true,normals:true})">メッシュと法線</button></template>
          <template v-else-if="topic==='ambient-components'"><button type="button" @click="preset({diffuseOn:false,specularOn:false})">Ambientのみ</button><button type="button" @click="preset({ambientOn:false,specularOn:false})">Diffuseのみ</button><button type="button" @click="preset({ambientOn:false,diffuseOn:false})">Specularのみ</button><button type="button" @click="preset({})">3成分を合成</button><button type="button" @click="preset({comparison:true,diffuseOn:false,specularOn:false,ambient:.5})">Ambient と AO</button></template>
          <template v-else><button type="button" @click="preset({mode:'visible'})">可視面だけ</button><button type="button" @click="preset({mode:'lambert',lightAngle:75})">同じ視点・斜めの光</button><button type="button" @click="preset({mode:'phong',viewAngle:35})">鏡面反射を追加</button></template>
        </div>
        <p v-if="topic==='shading-comparison'" class="rotation-help">どれか1つの球をドラッグ（タッチ操作も可）すると、3つが同時に回転します。光源と視点は固定したまま比較できます。矢印キーでも回転、Homeキーで向きをリセット。回転順序はX軸 → Y軸です。</p>
        <ClassicPointLight v-if="topic==='point-light'" :distance="s.distance" :angle="s.lightAngle" :intensity="s.intensity" :azimuth="s.azimuth" />
        <div v-else class="scene-cards" :class="{'three-cards':cards.length===3}">
          <figure v-for="card in cards" :key="card.model+(card.extra.ao?'ao':'')"><figcaption>{{ card.label }}</figcaption><ShadingScene :model="card.model" :settings="{...settings,...card.extra}" :rotatable="topic==='shading-comparison'" @rotate="rotateObject" @reset-rotation="resetRotation" /></figure>
        </div>
        <p v-if="topic==='shading-comparison' && s.normals" class="rotation-help">黄色の線：Flatは各面の中心から出る面法線、Gouraud / Phongは各頂点の法線。Phongの照明計算では、この頂点法線を補間して画素ごとの法線を求めます。</p>
        <div class="calculation" aria-live="polite">
          <template v-if="topic==='lambert'"><strong>球の頂点：N·L = {{ number(Math.cos(s.lightAngle*Math.PI/180)) }}</strong><p>I<sub>d</sub> = k<sub>d</sub> I<sub>L</sub> max(0, N·L) = <b>{{ number(lambert(s.lightAngle,s.kd,s.intensity)) }}</b></p><small>数値は光源色を掛ける前の係数。RGB色は線形RGBへ変換してから乗算。</small></template>
          <template v-else-if="topic==='point-light'"><strong>E = J max(0, N·L) / r² = {{ number(pointIlluminance(s.distance,s.lightAngle,s.intensity)) }} W/m²</strong><p>同じ角度・強度で r = 1 m と比べる距離係数：1 / r² = {{ number(1/(s.distance*s.distance)) }}</p></template>
          <template v-else-if="topic==='oren-nayar'"><strong>球の頂点の相対反射光：Lambert {{ number(lambert(s.lightAngle)) }} ／ Oren–Nayar {{ number(orenNayar(s.lightAngle,s.viewAngle,s.azimuth,s.sigma)) }}</strong><p>I<sub>rel</sub> = cos θ<sub>L</sub> [A + B max(0, cos Δφ) sin a tan b]</p><p>A = 1 − 0.5 σ²/(σ² + 0.33), B = 0.45 σ²/(σ² + 0.09)</p><small>a = max(θL, θV), b = min(θL, θV)、σはラジアン。k<sub>d</sub> I<sub>L</sub> = 1。</small></template>
          <template v-else-if="topic==='phong-blinn'"><strong>球の頂点：Phong {{ number(spec.phong) }} ／ Blinn–Phong {{ number(spec.blinn) }}</strong><p>I<sub>s,Phong</sub> = k<sub>s</sub> I<sub>L</sub> max(0, R·V)<sup>n</sup>　(R·V = {{ number(spec.rDotV) }})</p><p>I<sub>s,Blinn</sub> = k<sub>s</sub> I<sub>L</sub> max(0, N·H)<sup>m</sup>　(N·H = {{ number(spec.nDotH) }})</p><small>形状を見やすくするため、球には共通の拡散係数0.15を追加。数値は鏡面項だけ。</small></template>
          <template v-else-if="topic==='shading-comparison'"><strong>各球 {{ (20*4**s.subdivisions).toLocaleString() }} 三角形 · 同一の形状・カメラ・照明</strong><p>Gouraud：C = Σ w<sub>i</sub> C<sub>i</sub>　／　Phong：N = normalize(Σ w<sub>i</sub> N<sub>i</sub>) → 照明計算</p><small>w<sub>i</sub>は三角形内の補間重み。輪郭の多角形らしさは、照明の補間だけでは消えない。</small></template>
          <template v-else-if="topic==='ambient-components'"><strong>球の頂点・AO適用前：I = I<sub>a</sub> + I<sub>d</sub> + I<sub>s</sub> = {{ number(terms.total) }}</strong><div class="component-values"><span>Ambient {{ number(terms.ambient) }}</span><span>Diffuse {{ number(terms.diffuse) }}</span><span>Specular {{ number(terms.specular) }}</span></div><p>I<sub>ambient,AO</sub> = k<sub>a</sub> I<sub>ambient</sub> (1 − A)</p><p>I<sub>s</sub> = k<sub>s</sub> I<sub>L</sub> max(0, N·H)<sup>m</sup>（Blinn–Phong）</p><small>各成分の数値は材質色を掛ける前。AOの遮蔽率は球・床の各位置で異なる。</small></template>
          <template v-else><strong>{{ s.mode==='visible'||s.mode==='wireframe'?'光源方向は、面の可視判定や形状を変えない。':'画素ごとの法線から拡散・鏡面反射を計算。' }}</strong><p>可視性 = f(幾何形状, 視点)　／　色 = f(法線, 光源, 視点, 材質)</p></template>
        </div>
        <ClassicVectors v-if="['lambert','oren-nayar','phong-blinn'].includes(topic)" :light-angle="s.lightAngle" :view-angle="s.viewAngle" :view-azimuth="s.azimuth" :show-view="topic==='oren-nayar'" :specular="topic==='phong-blinn'" />
        <p v-if="topic!=='point-light'" class="display-note">線形RGBで照明計算 → sRGBで表示。画面では1を超える成分をクリップするため、比較には数値も使う。</p>
      </div>
    </div>
    <div v-if="showExplanation" class="learning-notes"><p><strong>観察</strong> {{ info.observation }}</p><p><strong>説明</strong> {{ info.explanation }}</p></div>
  </section>
</template>

<style scoped>
.rotation-help{font-size:13px;color:#b8d9ed;margin:0 0 12px}
.classic-explorer{--panel:#102235;--edge:#36516a;color:#e7eff7;background:#081727;border:1px solid var(--edge);border-radius:18px;padding:24px;line-height:1.6;font-size:15px;min-width:0}.explorer-header{display:flex;gap:20px;justify-content:space-between;align-items:flex-start}.eyebrow{color:#64e8bc;font-size:11px;font-weight:750;letter-spacing:.14em;margin:0 0 5px}.classic-explorer h2{font-size:25px;color:#fff;margin:0;line-height:1.3}.goal{margin:10px 0 15px;color:#c4d6e6}.display-actions{display:flex;flex-wrap:wrap;gap:7px;flex:0 0 170px}.classic-explorer button,.classic-explorer select{font:inherit;border:1px solid #4b6881;border-radius:7px;background:#183149;color:#e7eff7;padding:8px 11px;cursor:pointer;line-height:1.4}.classic-explorer button:hover{background:#294a65;border-color:#64e8bc}.classic-explorer button:focus-visible,.classic-explorer input:focus-visible,.classic-explorer select:focus-visible{outline:3px solid #64e8bc;outline-offset:3px}.display-actions button{font-size:12px;flex:1 0 auto}.display-actions [aria-pressed=true]{background:#285b51}.prediction{border-left:3px solid #ffce70;background:#1c2c3c;padding:12px 15px;margin:0 0 20px}.prediction strong{color:#ffce70;margin-right:8px}.explorer-layout{display:grid;grid-template-columns:238px minmax(0,1fr);gap:20px;align-items:start}.controls{background:var(--panel);border:1px solid var(--edge);border-radius:12px;padding:16px}.controls h3{font-size:16px;margin:0 0 14px;color:#64e8bc}.range-control{display:block;margin:0 0 16px;font-size:13px}.range-control>span{display:flex;gap:8px;justify-content:space-between}.range-control output{font-variant-numeric:tabular-nums;color:#ffce70;font-weight:700;white-space:nowrap}.range-control input{width:100%;accent-color:#64e8bc;height:25px;display:block;margin:3px 0 0}.range-control input:disabled{opacity:.4}.select-control{display:block;font-size:13px;margin-bottom:15px}.select-control select{display:block;width:100%;margin-top:6px}.check-control{display:flex;align-items:center;gap:8px;font-size:13px;margin:12px 0}.check-control input{width:17px;height:17px;accent-color:#64e8bc;flex-shrink:0}.classic-explorer .reset{width:100%;margin-top:14px;background:#24463f;border-color:#4f8c7c;font-size:13px}.coordinate-note{font-size:11px;color:#9db3c5;margin:12px 0 0}.presets{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-bottom:14px}.presets>span{font-size:12px;color:#a3bdcf;margin-right:3px}.presets button{font-size:12px;padding:6px 9px}.scene-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.scene-cards.three-cards{grid-template-columns:repeat(3,minmax(0,1fr))}.scene-cards figure{margin:0;border:1px solid var(--edge);border-radius:12px;overflow:hidden;min-width:0;background:var(--panel)}.scene-cards figcaption{font-weight:650;font-size:14px;padding:10px;text-align:center;border-bottom:1px solid var(--edge);min-height:42px}.calculation{border:1px solid #446b72;background:#102e38;border-radius:12px;padding:15px;margin:14px 0;color:#d8eff1;overflow-wrap:anywhere}.calculation strong{font-size:15px;color:#92f0d4}.calculation p{margin:8px 0;font-size:15px}.calculation small{font-size:12px;color:#bdd5df}.calculation b{color:#ffce70}.component-values{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0;font-variant-numeric:tabular-nums}.component-values span{font-size:13px;border:1px solid #446b72;border-radius:6px;padding:5px 8px}.learning-notes{display:grid;grid-template-columns:1fr 1.5fr;gap:18px;border-top:1px solid var(--edge);margin-top:20px;padding-top:14px;font-size:14px;color:#c4d6e6}.learning-notes p{margin:0}.learning-notes strong{display:block;color:#64e8bc;margin-bottom:5px}.display-note{font-size:11px;color:#9db3c5;margin:12px 0 0}.color-swatch{display:flex;gap:7px;align-items:center;font-size:11px;margin-bottom:12px}.color-swatch>span{width:25px;height:20px;border:1px solid #789;border-radius:4px}.color-swatch small{font-size:10px;color:#9db3c5}.teacher-mode{font-size:18px}.teacher-mode .explorer-layout{grid-template-columns:280px minmax(0,1fr)}.teacher-mode .range-control,.teacher-mode .check-control,.teacher-mode .presets button{font-size:16px}.teacher-mode .range-control input{height:34px}.teacher-mode .calculation strong,.teacher-mode .calculation p{font-size:19px}.teacher-mode .scene-cards figcaption{font-size:18px}@media(max-width:1000px){.explorer-layout,.teacher-mode .explorer-layout{grid-template-columns:205px minmax(0,1fr);gap:14px}.scene-cards.three-cards{grid-template-columns:1fr}.classic-explorer{padding:18px}}@media(max-width:700px){.explorer-header{display:block}.display-actions{margin:0 0 16px}.explorer-layout,.teacher-mode .explorer-layout{grid-template-columns:1fr}.controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.controls h3,.coordinate-note,.reset,.select-control,.color-swatch{grid-column:1/-1}.range-control,.check-control{min-width:0}.range-control>span{flex-wrap:wrap;gap:1px 8px}.scene-cards,.scene-cards.three-cards{grid-template-columns:1fr}.classic-explorer h2{font-size:22px}.learning-notes{grid-template-columns:1fr}.classic-explorer{padding:14px}.calculation p{font-size:14px}}
</style>
