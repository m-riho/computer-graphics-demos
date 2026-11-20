<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { lerpValue, interpolationNormals, interpolateShading, interpolationPath, triangleWeights, type Weights } from '../../packages/cg-algorithms/src/shading-interpolation.ts'
import { linearToSrgb, type ShadingVector } from '../../packages/cg-algorithms/src/shading-geometry.ts'

type Mode = 'gouraud'|'linear'|'phong'
const props=defineProps<{topic:string}>()
const initialMode=():Mode => props.topic.startsWith('linear')?'linear':props.topic.startsWith('phong')?'phong':'gouraud'
const mode=ref<Mode>(initialMode()), progress=ref(0), speed=ref(1), playing=ref(false)
const lightAngle=ref(35), spread=ref(1), specular=ref(true), showField=ref(true)
const endpointA=ref(.2), endpointB=ref(.8), picked=ref<Weights|null>(null), teacher=ref(false)
const frame=ref('')
const names=['A','B','C']
const f=(v:number)=>v.toFixed(3)
const vector=(v:number[])=>'('+v.map(f).join(', ')+')'
function color(v:number) {
  const channel=Math.round(255*linearToSrgb(Math.max(0,Math.min(1,v))))
  return 'rgb('+channel+','+channel+','+channel+')'
}
// Oblique diagram of an XY triangle: two orthogonal unit projection axes.
// The lighting model has a separate, fixed V=(0,0,1).
function project(v:readonly number[]):[number,number] {
  return [320+150*(Math.sqrt(3)/2*v[0]!-.5*v[2]!),285-150*(.25*v[0]!+Math.sqrt(3)/2*v[1]!+Math.sqrt(3)/4*v[2]!)]
}
const world:ShadingVector[]=[[-1.25,-.8,0],[1.25,-.8,0],[0,1.45,0]]
const vertices=world.map(project)
const weights=computed(()=>picked.value??interpolationPath(progress.value))
const result=computed(()=>interpolateShading(weights.value,lightAngle.value,spread.value,specular.value))
const normals=computed(()=>interpolationNormals(spread.value))
const position=(w:Weights):[number,number]=>[0,1].map(k=>vertices.reduce((s,p,i)=>s+w[i]!*p[k]!,0)) as [number,number]
const point=computed(()=>position(weights.value))
const intensity=computed(()=>mode.value==='gouraud'?result.value.gouraud:result.value.phong)
const linear=computed(()=>lerpValue(endpointA.value,endpointB.value,progress.value))
function arrow(origin:readonly number[], normal:ShadingVector, scale=1) {
  const tip=project(normal), zero=project([0,0,0])
  const dx=(tip[0]-zero[0])*.42*scale,dy=(tip[1]-zero[1])*.42*scale,len=Math.hypot(dx,dy)
  if(len<.1) return ''
  const ux=dx/len,uy=dy/len,w=3*scale,h=Math.min(12*scale,len*.4)
  const x=origin[0]!,y=origin[1]!,endX=x+dx,endY=y+dy,bx=endX-h*ux,by=endY-h*uy
  return 'M'+(x-uy*w)+','+(y+ux*w)+' L'+(bx-uy*w)+','+(by+ux*w)+' L'+(bx-uy*w*2.4)+','+(by+ux*w*2.4)+' L'+endX+','+endY+' L'+(bx+uy*w*2.4)+','+(by-ux*w*2.4)+' L'+(bx+uy*w)+','+(by-ux*w)+' L'+(x+uy*w)+','+(y-ux*w)+'Z'
}
const field=computed(()=>{
  const items:{p:[number,number];n:ShadingVector;c:string}[]=[]
  for(let a=1;a<6;a++)for(let b=1;b<6-a;b++){
    const w:Weights=[a/6,b/6,1-(a+b)/6],r=interpolateShading(w,lightAngle.value,spread.value,specular.value)
    items.push({p:position(w),n:r.normal,c:color(r.phong)})
  }
  return items
})
function render() {
  if(typeof document==='undefined'||mode.value==='linear')return
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=260
  const context=canvas.getContext('2d')!;const image=context.createImageData(320,260)
  for(let y=0;y<260;y++)for(let x=0;x<320;x++){
    const w=triangleWeights([2*x+1,2*y+1],vertices)
    if(w.some(v=>v<0))continue
    const r=interpolateShading(w,lightAngle.value,spread.value,specular.value)
    const c=Math.round(255*linearToSrgb(Math.min(1,mode.value==='gouraud'?r.gouraud:r.phong)))
    const i=(y*320+x)*4
    image.data[i]=c;image.data[i+1]=c;image.data[i+2]=c;image.data[i+3]=255
  }
  context.putImageData(image,0,0);frame.value=canvas.toDataURL()
}
let request=0,last=0,direction=1
function animate(now:number){
  if(!playing.value)return
  if(last){
    let next=progress.value+Math.min((now-last)/1000,.05)*speed.value/10*direction
    if(next>1){next=1;direction=-1}
    if(next<0){next=0;direction=1}
    progress.value=next
  }
  last=now;request=requestAnimationFrame(animate)
}
watch(playing,active=>{
  cancelAnimationFrame(request);last=0
  if(active){picked.value=null;request=requestAnimationFrame(animate)}
})
function scrub(){playing.value=false;picked.value=null}
function stopHidden(){if(document.hidden)playing.value=false}
function preset(w:Weights){playing.value=false;picked.value=w}
function reset(){
  playing.value=false;mode.value=initialMode();progress.value=0;speed.value=1
  lightAngle.value=mode.value==='phong'?0:35;spread.value=1;specular.value=true
  showField.value=true;endpointA.value=.2;endpointB.value=.8;picked.value=null;direction=1
}
function switchMode(){playing.value=false;picked.value=null;progress.value=0;lightAngle.value=mode.value==='phong'?0:35}
function pick(event:PointerEvent) {
  const svg=event.currentTarget as SVGSVGElement, matrix=svg.getScreenCTM()
  if(!matrix)return
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse())
  const w=triangleWeights([p.x,p.y],vertices)
  if(w.every(v=>v>=-1e-8))preset(w.map(v=>Math.max(0,v)) as Weights)
}
watch(()=>props.topic,reset,{immediate:true})
watch([mode,lightAngle,spread,specular],render)
onMounted(()=>{render();document.addEventListener('visibilitychange',stopHidden)})
onUnmounted(()=>{cancelAnimationFrame(request);document.removeEventListener('visibilitychange',stopHidden)})
</script>

<template>
<section class="shading-explorer interpolation-explorer">
  <header><div><h2>{{ mode==='linear'?'線形補間をたどる':mode==='gouraud'?'Gouraud：頂点の色を補間':'Phong：法線から色を求める' }}</h2><p>Shading Interpolation Explorer</p></div><button type="button" :aria-pressed="teacher" @click="teacher=!teacher">教員モード</button></header>
  <div class="interp-controls">
    <label>表示内容<select v-model="mode" aria-label="表示内容" @change="switchMode"><option value="gouraud">Gouraud Shading</option><option value="linear">線形補間</option><option value="phong">Phong Shading</option></select></label>
    <label>再生速度：{{ speed }}倍<input v-model.number="speed" aria-label="再生速度" type="range" min=".25" max="2" step=".25" /></label>
    <div class="interp-buttons"><button type="button" :aria-pressed="playing" @click="playing=!playing">{{ playing?'⏸ 一時停止':'▶ 再生' }}</button><button type="button" @click="reset">初期状態に戻す</button></div>
  </div>
  <label class="interp-progress">{{ mode==='linear'?'AからBへの割合 t':'点Pの移動経路' }}：{{ f(progress) }}<span v-if="picked">（図上で指定中）</span>
    <input v-model.number="progress" :aria-label="mode==='linear'?'割合 t':'点Pの移動経路'" type="range" min="0" max="1" step=".001" @input="scrub" />
  </label>
  <template v-if="mode==='linear'">
    <div class="interp-controls"><label>Aの明るさ：{{ f(endpointA) }}<input v-model.number="endpointA" type="range" aria-label="Aの明るさ" min="0" max="1" step=".01" /></label><label>Bの明るさ：{{ f(endpointB) }}<input v-model.number="endpointB" type="range" aria-label="Bの明るさ" min="0" max="1" step=".01" /></label></div>
    <div class="interp-buttons"><button v-for="t in [0,.25,.5,.75,1]" :key="t" type="button" @click="scrub();progress=t">t = {{ t }}</button></div>
    <svg viewBox="0 0 720 260" class="interp-linear" role="img" aria-label="AからBへ移動する点Pと補間された明るさ">
      <rect v-for="i in 180" :key="i" :x="60+(i-1)*600/180" y="85" :width="600/180+.5" height="55" :fill="color(lerpValue(endpointA,endpointB,(i-.5)/180))" />
      <text x="60" y="55" text-anchor="middle">A</text><text x="660" y="55" text-anchor="middle">B</text>
      <path :d="'M'+(60+600*progress)+' 64V151'" stroke="white" stroke-width="7" />
      <path :d="'M'+(60+600*progress)+' 64V151'" stroke="#005bac" stroke-width="3" />
      <circle :cx="60+600*progress" cy="112" r="14" :fill="color(linear)" stroke="#005bac" stroke-width="4" />
      <text x="360" y="195" text-anchor="middle">P：t = {{ f(progress) }}　明るさ = {{ f(linear) }}</text>
      <text x="360" y="231" text-anchor="middle">Aの重み {{ f(1-progress) }}　＋　Bの重み {{ f(progress) }}　＝ 1</text>
    </svg>
    <div class="interp-formula"><strong>c(t) = (1 − t)c<sub>A</sub> + tc<sub>B</sub></strong><p>({{ f(1-progress) }}) × {{ f(endpointA) }} ＋ {{ f(progress) }} × {{ f(endpointB) }} = <strong data-testid="linear-result">{{ f(linear) }}</strong></p></div>
    <p>「再生」で点Pが往復します。0.2と0.8の中間は0.5、Aから1/4の位置は0.35。RGBの各成分も、同じ式で補間できます。</p>
  </template>
  <template v-else>
    <div class="interp-controls">
      <label>光源方向：{{ lightAngle }}°<input v-model.number="lightAngle" aria-label="光源方向" type="range" min="-60" max="60" step="1" /></label>
      <label>頂点法線の傾き：{{ (spread*50).toFixed(0) }}°<input v-model.number="spread" aria-label="頂点法線の傾き" type="range" min="0" max="1.2" step=".02" /></label>
      <label><input v-model="specular" type="checkbox" />鏡面反射を含める</label>
      <label v-if="mode==='phong'"><input v-model="showField" type="checkbox" />面内の法線も表示</label>
    </div>
    <div class="interp-buttons"><button v-for="(name,i) in names" :key="name" type="button" @click="preset(([0,1,2].map(k=>k===i?1:0)) as Weights)">頂点{{ name }}</button><button type="button" @click="preset([1/3,1/3,1/3])">重心</button><button type="button" @click="lightAngle=0;spread=1;specular=true;preset([1/3,1/3,1/3])">中央のハイライト</button></div>
    <div class="interp-main">
      <div>
        <svg class="interp-triangle" viewBox="0 0 640 520" role="img" aria-label="三角形上の点P、頂点の色と法線。三角形をクリックすると点Pを指定できます。" @pointerdown="pick">
          <image v-if="frame" :href="frame" width="640" height="520" />
          <polygon :points="vertices.map(p=>p.join(',')).join(' ')" fill="none" stroke="#4f6c82" stroke-width="2" />
          <g v-if="mode==='phong'&&showField" data-testid="normal-field">
            <path v-for="(item,i) in field" :key="i" :d="arrow(item.p,item.n,.65)" :fill="item.c" stroke="#183148" stroke-width="1.2" />
          </g>
          <g v-for="(vertex,i) in vertices" :key="i">
            <path :d="arrow(vertex,normals[i]!)" :fill="color(result.vertexColors[i]!)" stroke="#183148" stroke-width="2" />
            <circle :cx="vertex[0]" :cy="vertex[1]" r="8" :fill="color(result.vertexColors[i]!)" stroke="#005bac" stroke-width="3" />
            <text :x="vertex[0]+(i===0?-22:18)" :y="vertex[1]+(i===2?0:29)">{{ names[i] }}</text>
          </g>
          <g data-testid="moving-point">
            <circle :cx="point[0]" :cy="point[1]" r="11" fill="none" stroke="white" stroke-width="7" />
            <circle :cx="point[0]" :cy="point[1]" r="11" :fill="color(intensity)" stroke="#005bac" stroke-width="3" />
            <path v-if="mode==='phong'" data-testid="moving-normal" :d="arrow(point,result.normal,1.4)" :fill="color(result.phong)" stroke="#132d43" stroke-width="2" />
            <text :x="point[0]+16" :y="point[1]-15" stroke="white" stroke-width="4" paint-order="stroke" fill="#005bac">P</text>
          </g>
          <g transform="translate(550,445)" class="interp-axes"><path d="M0 0L40 -12" stroke="#c43c38"/><path d="M0 0L0 -40" stroke="#308744"/><path d="M0 0L-24 -21" stroke="#235cbb"/><text x="43" y="-8">X</text><text x="-6" y="-48">Y</text><text x="-40" y="-22">Z</text></g>
        </svg>
        <p class="interp-caption">斜めから見た模式図。{{ mode==='phong'?'矢印は単位法線で、塗り色はその場所の照明計算の結果です。':'頂点の矢印は頂点法線。面内では、頂点で求めた色を補間します。' }} 黒い輪郭は矢印を見やすくするためのものです。</p>
        <p class="interp-caption">再生すると A → B → C → 重心 → A を往復。三角形のクリック・タッチでも点Pを指定できます。</p>
      </div>
      <div class="interp-readout">
        <h3>点Pの重み（重心座標）</h3>
        <div v-for="(w,i) in weights" :key="i" class="interp-weight"><span>λ{{ names[i] }}</span><meter :value="w" min="0" max="1" :aria-label="'頂点'+names[i]+'の重み'"></meter><strong>{{ f(w) }}</strong></div>
        <p>λA + λB + λC = 1</p>
        <div v-if="mode==='gouraud'" class="interp-formula">
          <h3>頂点の色を混ぜる</h3>
          <p>cP = λA cA + λB cB + λC cC</p>
          <p v-for="(c,i) in result.vertexColors" :key="i"><span class="interp-swatch" :style="{background:color(c)}"></span> c{{ names[i] }} = {{ f(c) }}<br />寄与：{{ f(weights[i]!) }} × {{ f(c) }} = {{ f(weights[i]!*c) }}</p>
          <strong>cP = {{ f(result.gouraud) }}</strong>
        </div>
        <div v-else class="interp-formula">
          <h3>① 法線を補間</h3><p>Ñ = λA NA + λB NB + λC NC</p>
          <code data-testid="raw-normal">{{ vector(result.rawNormal) }}</code><p>長さ {{ f(Math.hypot(...result.rawNormal)) }}</p>
          <h3>② 長さを1にする</h3><code data-testid="unit-normal">N = {{ vector(result.normal) }}</code><p>長さ {{ f(Math.hypot(...result.normal)) }}</p>
          <h3>③ その法線で照明計算</h3><p>環境光 0.050<br />拡散 {{ f(result.lighting.diffuse) }} ＋ 鏡面 {{ f(result.lighting.specular) }}</p>
        </div>
        <div class="interp-result"><span class="interp-swatch large" :style="{background:color(intensity)}"></span><div>点Pの色（線形の明るさ）<strong data-testid="point-intensity">{{ f(intensity) }}</strong></div></div>
        <div class="interp-compare"><span>Gouraud：<b data-testid="gouraud-value">{{ f(result.gouraud) }}</b></span><span>Phong：<b data-testid="phong-value">{{ f(result.phong) }}</b></span></div>
        <p class="interp-caption">同じ形・頂点法線・光源・材質で比較。両方式とも反射式はBlinn–Phongです。</p>
      </div>
    </div>
  </template>
  <details :open="teacher" class="interp-notes"><summary>計算と表示について</summary>
    <p>明るさをRGBの同じ値に入れたグレーで表示しています。数値と補間は線形光で計算し、画面表示の最後にsRGBへ変換します。</p>
    <p v-if="mode!=='linear'">法線はXYZの3成分を補間してから正規化します。投影した矢印の画面上の長さは向きで変わりますが、正規化後の3次元の長さは常に1です。点Pの矢印は見やすく拡大し、面内の小さい矢印は縮小表示しています。照明の視線方向は V=(0,0,1)、平行光はXZ平面で回転します。三角形を等しい深度で見る場合の補間を扱い、透視補正は省いています。</p>
    <p v-if="mode!=='linear'">環境光0.05、拡散係数0.25、鏡面係数0.7、鏡面指数32。鏡面反射を外すと拡散係数は0.95。Phong Shading（法線を補間する方法）とPhong反射モデル（反射の式）は別のものです。</p>
  </details>
</section>
</template>

<style scoped>
.interpolation-explorer {color:#153854;font:17px/1.55 'Hiragino Sans',sans-serif;}
.interpolation-explorer * {box-sizing:border-box;}
.interpolation-explorer h2 {font-size:1.4em;font-weight:bold;margin:0;}
.interpolation-explorer h3 {font-size:1em;font-weight:bold;margin:8px 0;}
.interpolation-explorer p {margin:.5em 0;}
.interpolation-explorer header {display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;}
.interpolation-explorer header p {font-size:.85em;color:#50677d;}
.interp-controls {display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;margin:16px 0;}
.interp-controls label {flex:1 1 180px;}
.interpolation-explorer input[type=range],.interpolation-explorer select {display:block;width:100%;accent-color:#005bac;}
.interpolation-explorer input[type=range] {margin-top:10px;}
.interpolation-explorer select {background:white;padding:7px;border:1px solid #9bb5cc;font:inherit;border-radius:5px;color:inherit;}
.interp-buttons {display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}
.interpolation-explorer button {padding:7px 12px;background:#eff6ff;border:1px solid #9bb5cc;border-radius:6px;color:#14466d;font:inherit;cursor:pointer;}
.interpolation-explorer button[aria-pressed=true] {background:#005bac;color:white;}
.interpolation-explorer :is(button,input,select):focus-visible {outline:3px solid #db8400;outline-offset:3px;}
.interp-progress {display:block;background:#edf4fc;padding:12px 16px;border-radius:6px;}
.interp-main {display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:20px;}
.interp-triangle,.interp-linear {display:block;width:100%;height:auto;background:#f2f6fb;border:1px solid #cbdbea;border-radius:8px;}
.interp-triangle {touch-action:pan-y;cursor:crosshair;}
.interp-linear {margin:14px 0;}
.interpolation-explorer svg text {font:23px 'Hiragino Sans',sans-serif;fill:#153854;}
.interp-axes path {stroke-width:3;}
.interp-axes text {font-size:17px!important;}
.interp-caption {font-size:.82em;color:#50677d;}
.interp-weight {display:grid;grid-template-columns:35px 1fr 55px;align-items:center;gap:8px;}
.interp-weight meter {width:100%;}
.interp-formula {background:#edf4fc;border-radius:6px;padding:12px;margin:12px 0;}
.interp-formula code {display:block;font-size:1em;overflow-wrap:anywhere;white-space:normal;}
.interp-swatch {display:inline-block;width:24px;height:24px;border:1px solid #50677d;vertical-align:middle;}
.interp-swatch.large {width:60px;height:60px;flex-shrink:0;}
.interp-result {display:flex;align-items:center;gap:12px;}
.interp-result strong {display:block;font-size:1.6em;color:#005bac;}
.interp-compare {display:flex;flex-wrap:wrap;justify-content:space-between;padding:12px;background:#f0f5fa;margin-top:12px;}
.interp-notes {margin-top:16px;border-top:1px solid #cbdbea;padding-top:12px;}
@media(max-width:760px){.interp-main {grid-template-columns:1fr;}.interpolation-explorer {font-size:16px;}}
</style>
