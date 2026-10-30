<script setup lang="ts">
import { computed, onMounted, ref, useId, watchEffect } from 'vue'
import { independentNoise, noiseToGray, Perlin2D } from '../../packages/cg-algorithms/src/nature-noise'
import { sampleNoiseField, noiseTerrain, noiseClouds } from '../../packages/cg-algorithms/src/nature-noise-applications'
import MeshView from '../lecture04/MeshView.vue'
import './lecture05.css'
const props=withDefaults(defineProps<{initialMode?:'compare'|'fractal'|'algorithm'}>(),{initialMode:'compare'})
const mode=ref(props.initialMode),seed=ref(0),frequency=ref(4),octaves=ref(4),persistence=ref(.5),lacunarity=ref(2),mapping=ref<'Grayscale'|'Terrain'|'Density'|'Clouds'>('Grayscale')
const terrainHeight=ref(2.5),cloudThreshold=ref(.43),cloudSoftness=ref(.2)
const px=ref(.3),py=ref(.7),dragging=ref(false),mounted=ref(false),randomCanvas=ref<HTMLCanvasElement>(),valueCanvas=ref<HTMLCanvasElement>(),perlinCanvas=ref<HTMLCanvasElement>(),fieldCanvas=ref<HTMLCanvasElement>()
const marker=`noise-arrow-${useId()}`,noise=computed(()=>new Perlin2D(seed.value)),details=computed(()=>noise.value.details(2+px.value,3+py.value))
const width=128,height=96
const fieldOptions=computed(()=>({seed:seed.value,frequency:frequency.value,octaves:octaves.value,persistence:persistence.value,lacunarity:lacunarity.value}))
const sampledField=computed(()=>sampleNoiseField({width,height,...fieldOptions.value}))
const field=computed(()=>sampledField.value.values)
const terrain=computed(()=>noiseTerrain(sampleNoiseField({width:49,height:37,...fieldOptions.value}),terrainHeight.value))
function paintClouds(){
  const canvas=fieldCanvas.value;if(!canvas)return
  canvas.width=width;canvas.height=height
  const context=canvas.getContext('2d');if(!context)return
  const image=context.createImageData(width,height)
  image.data.set(noiseClouds(sampledField.value,cloudThreshold.value,cloudSoftness.value))
  context.putImageData(image,0,0)
}
function paint(canvas:HTMLCanvasElement|undefined,values:number[],density=false){
  if(!canvas)return
  canvas.width=width;canvas.height=height
  const context=canvas.getContext('2d');if(!context)return
  const data=context.createImageData(width,height)
  for(let i=0;i<values.length;i++){
    const gray=noiseToGray(values[i]), ink=density?(noiseToGray(independentNoise(i%width,Math.floor(i/width),seed.value+100))<gray?28:248):Math.round(gray*255)
    data.data.set([ink,ink,ink,255],i*4)
  }
  context.putImageData(data,0,0)
}
onMounted(()=>{mounted.value=true})
watchEffect(()=>{
  if(!mounted.value)return
  if(mode.value==='compare'){
    const n=noise.value, f=Number.isFinite(frequency.value)?frequency.value:4,s=seed.value
    paint(randomCanvas.value,Array.from({length:width*height},(_,i)=>independentNoise(i%width,Math.floor(i/width),s)))
    paint(valueCanvas.value,Array.from({length:width*height},(_,i)=>n.valueNoise((i%width)/(width-1)*f,Math.floor(i/width)/(height-1)*f*.75)))
    paint(perlinCanvas.value,Array.from({length:width*height},(_,i)=>n.sample((i%width)/(width-1)*f,Math.floor(i/width)/(height-1)*f*.75)))
  }else if(mode.value==='fractal'&&mapping.value!=='Terrain'){
    if(mapping.value==='Clouds')paintClouds()
    else paint(fieldCanvas.value,field.value,mapping.value==='Density')
  }
},{flush:'post'})
function move(event:PointerEvent){
  if(!dragging.value)return
  const svg=event.currentTarget as SVGSVGElement,matrix=svg.getScreenCTM();if(!matrix)return
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse())
  px.value=Math.max(.001,Math.min(.999,(p.x-80)/180));py.value=Math.max(.001,Math.min(.999,(230-p.y)/180))
}
function down(event:PointerEvent){dragging.value=true;(event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);move(event)}
function end(){dragging.value=false}
function reset(){mode.value=props.initialMode;seed.value=0;frequency.value=4;octaves.value=4;persistence.value=.5;lacunarity.value=2;mapping.value='Grayscale';terrainHeight.value=2.5;cloudThreshold.value=.43;cloudSoftness.value=.2;px.value=.3;py.value=.7}
const corners=[[0,0],[1,0],[0,1],[1,1]]
const fmt=(value:number)=>value.toFixed(3)
</script>
<template>
  <section class="l5d noise-lab" aria-label="Perlin Noise Lab">
    <div class="l5d-controls">
      <button :aria-pressed="mode==='compare'" @click="mode='compare'">A 比較</button><button :aria-pressed="mode==='fractal'" @click="mode='fractal'">B Fractal Noise</button><button :aria-pressed="mode==='algorithm'" @click="mode='algorithm'">C 計算の過程</button>
      <label>Seed <input v-model.number="seed" type="number" min="0" max="4294967295"/></label><button @click="reset">Reset</button>
      <label v-if="mode!=='algorithm'">Frequency {{ frequency }} <input v-model.number="frequency" type="range" min="1" max="12" step=".5"/></label>
    </div>
    <template v-if="mode==='compare'">
      <div class="l5d-grid3 noise-comparison">
        <figure><h3>Independent Random</h3><canvas ref="randomCanvas" aria-label="画素ごとに独立なランダム値"/><figcaption>画素ごとの乱数。隣接関係なし</figcaption></figure>
        <figure><h3>Value Noise</h3><canvas ref="valueCanvas" aria-label="格子点の乱数値を補間した値ノイズ"/><figcaption>格子の「値」を補間</figcaption></figure>
        <figure><h3>Perlin Noise</h3><canvas ref="perlinCanvas" aria-label="格子点の勾配と変位の内積を補間したPerlinノイズ"/><figcaption>「勾配と変位の内積」を補間</figcaption></figure>
      </div>
      <div class="l5d-readout">共通の表示尺度：明るさ = (N + 1) / 2 · N = 0 は灰色。Frequency は Value / Perlin の格子密度。</div>
      <p class="l5d-note">観察：補間がある2つは連続する。ただしValue Noiseは格子の値、Perlinは格子の勾配を決める。</p>
    </template>
    <template v-else-if="mode==='fractal'">
      <div class="l5d-controls">
        <label>Octaves {{ octaves }} <input v-model.number="octaves" type="range" min="1" max="8"/></label>
        <label>Persistence {{ persistence }} <input v-model.number="persistence" type="range" min="0" max="1" step=".05"/></label>
        <label>Lacunarity {{ lacunarity }} <input v-model.number="lacunarity" type="range" min="1" max="4" step=".1"/></label>
        <label>用途 <select v-model="mapping"><option>Grayscale</option><option value="Terrain">Terrain（山岳）</option><option>Density</option><option value="Clouds">Clouds（雲）</option></select></label>
      </div>
      <div v-if="mapping==='Terrain'||mapping==='Clouds'" class="l5d-controls application-controls">
        <label v-if="mapping==='Terrain'">山の高さ {{ terrainHeight }} <input v-model.number="terrainHeight" type="range" min="0" max="5" step=".1"/></label>
        <template v-else><label>雲のしきい値 {{ cloudThreshold }} <input v-model.number="cloudThreshold" type="range" min="0" max="1" step=".01"/></label><label>境界の柔らかさ {{ cloudSoftness }} <input v-model.number="cloudSoftness" type="range" min=".02" max=".5" step=".01"/></label></template>
      </div>
      <div class="l5d-grid2 fractal-body">
        <div class="field-view"><MeshView v-if="mapping==='Terrain'" :mesh="terrain" :height="240" :initial-pitch="25" :wireframe="false"/><canvas v-else ref="fieldCanvas" :class="{clouds:mapping==='Clouds'}" :aria-label="mapping==='Clouds'?'Perlinノイズの不透明度で描いた白い雲と青空':mapping==='Density'?'同じ場を点の出現確率にした密度表示':'重ね合わせた符号付きノイズの明るさ表示'"/></div>
        <div><h3>同じ field → {{ mapping }}</h3><p>N = Σ aᵢ P(fᵢx, fᵢy) / Σ aᵢ</p><p>aᵢ₊₁ = aᵢ × Persistence<br/>fᵢ₊₁ = fᵢ × Lacunarity</p><div class="l5d-readout">{{ mapping==='Terrain'?`高さ = ${terrainHeight} × N`:mapping==='Clouds'?'g = (N + 1) / 2 → しきい値 → α':mapping==='Density'?'点の出現確率 = (N + 1) / 2':'明るさ = (N + 1) / 2' }}<br/>値は符号付きで加算する。</div><p v-if="mapping==='Clouds'" class="l5d-note">t = clamp((g − しきい値) / 柔らかさ, 0, 1)<br/>α = t²(3 − 2t)。白い雲を青空に重ねる。</p><p v-else class="l5d-note">表示用変換は最後に1回。最小値・最大値による再正規化はしない。</p></div>
      </div>
      <p class="l5d-note">{{ mapping==='Clouds'?'雲のしきい値を下げると雲が増える。2Dの模様であり、体積雲・流体計算ではない。':mapping==='Terrain'?'ドラッグで回転。高さ0では平面になる。高い周波数の細部は格子の解像度に制限される。':'観察：Octavesを増やすと細部が加わる。用途を切り替えてもノイズ関数は同じ。' }}</p>
    </template>
    <template v-else>
      <div class="l5d-controls"><label>s {{ px.toFixed(2) }} <input v-model.number="px" type="range" min=".001" max=".999" step=".001"/></label><label>t {{ py.toFixed(2) }} <input v-model.number="py" type="range" min=".001" max=".999" step=".001"/></label><span>cell (2, 3) · p = ({{ (2+px).toFixed(2) }}, {{ (3+py).toFixed(2) }})</span></div>
      <div class="l5d-grid2 algorithm-body">
        <svg viewBox="0 0 380 280" @pointerdown.stop.prevent="down" @pointermove.stop="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" role="img" aria-label="評価点をドラッグ。実線の矢印は四隅の勾配、破線は隅から評価点への変位。">
          <defs><marker :id="marker" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#005bac"/></marker></defs>
          <rect x="80" y="50" width="180" height="180" fill="#f2f7fc" stroke="#718096" stroke-width="2"/>
          <g v-for="(corner,i) in corners" :key="i"><line :x1="80+corner[0]*180" :y1="230-corner[1]*180" :x2="80+px*180" :y2="230-py*180" stroke="#b85900" stroke-width="1.6" stroke-dasharray="5 4"/><line :x1="80+corner[0]*180" :y1="230-corner[1]*180" :x2="80+corner[0]*180+details.gradients[i][0]*42" :y2="230-corner[1]*180-details.gradients[i][1]*42" stroke="#005bac" stroke-width="3" :marker-end="`url(#${marker})`"/><circle :cx="80+corner[0]*180" :cy="230-corner[1]*180" r="4" fill="#005bac"/><text :x="80+corner[0]*180+(corner[0]?12:-48)" :y="230-corner[1]*180+(corner[1]?-12:25)" style="font-size:18px" fill="#203649">g{{ corner.join('') }}</text></g>
          <circle :cx="80+px*180" :cy="230-py*180" r="8" fill="#b85900" stroke="white" stroke-width="2"/><text :x="94+px*180" :y="226-py*180" style="font-size:20px" fill="#8d4300">p</text><text x="12" y="275" style="font-size:17px" fill="#203649">→ 勾配 g · 破線: 変位 d · ● ドラッグ</text>
        </svg>
        <div class="noise-details"><table><thead><tr><th>隅</th><th>勾配 g</th><th>変位 d</th><th>g · d</th></tr></thead><tbody><tr v-for="(corner,i) in corners" :key="i"><td>{{ corner.join('') }}</td><td>{{ details.gradients[i].map(n=>n.toFixed(2)).join(', ') }}</td><td>{{ details.displacements[i].map(n=>n.toFixed(2)).join(', ') }}</td><td>{{ fmt(details.dots[i]) }}</td></tr></tbody></table><p>fade(s)={{ fmt(details.weights[0]) }}<br/>fade(t)={{ fmt(details.weights[1]) }}</p><div>x補間 → {{ fmt(details.rows[0]) }}, {{ fmt(details.rows[1]) }}</div><div class="l5d-readout">y補間 → <b>N = {{ details.value.toFixed(6) }}</b><br/>表示値 = {{ noiseToGray(details.value).toFixed(6) }}</div></div>
      </div>
      <p class="l5d-note">順序：セル → 四隅の勾配 → 変位 → 内積 → fade(q)=6q⁵−15q⁴+10q³ → x補間 → y補間。</p>
    </template>
  </section>
</template>
<style scoped>
.noise-lab .l5d-controls{gap:6px 12px}.noise-lab input[type=range]{width:83px}.noise-comparison canvas{width:100%;height:225px;image-rendering:pixelated;border:1px solid #b7c7d7}.noise-comparison h3{font-size:18px}.noise-comparison figcaption{font-size:17px}.field-view canvas{height:240px;width:100%;object-fit:contain;image-rendering:pixelated;background:#edf2f7}.field-view canvas.clouds{background:linear-gradient(#1566ae,#75b5e0);image-rendering:auto;width:min(100%,360px);height:auto;aspect-ratio:4/3;display:block;margin-inline:auto}.algorithm-body svg{height:280px;width:100%;touch-action:none;cursor:crosshair}.noise-details table{font-size:16px!important}.noise-details p{margin:6px 0}.noise-details .l5d-readout{margin-top:5px}.fractal-body p{margin:8px 0}.fractal-body :deep(.mesh-view-controls){font-size:14px}.fractal-body :deep(.mesh-view-help){font-size:13px!important}
@media(max-width:700px){.noise-lab .l5d-grid2,.noise-lab .l5d-grid3{grid-template-columns:1fr}.noise-comparison canvas{height:180px}.noise-details table{font-size:14px!important}}
</style>
