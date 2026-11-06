<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import Playback from './Playback.vue'
import { hex, type RGB } from '../../packages/cg-algorithms/src/color.ts'
import { traceLayers, type ColorLayer } from '../../packages/cg-algorithms/src/visibility-labs.ts'

type Mode = 'equal' | 'alpha'
type Region = 'both' | 'A' | 'B' | 'background'
const props = withDefaults(defineProps<{initialMode?: Mode}>(), {initialMode:'equal'})
const mode = ref<Mode>(props.initialMode), rule = ref<'LESS' | 'LEQUAL'>('LESS')
const reverse = ref(false), writeAlphaDepth = ref(false), step = ref(0)
const alphaA = ref(.5), alphaB = ref(.5), selected = ref<Region>('both')
const backgroundHex = ref('#ffffff'), clipId = 'layer-clip-'+useId()
const background = computed((): RGB => [1,3,5].map(i => parseInt(backgroundHex.value.slice(i,i+2),16)) as RGB)
const layers = computed((): ColorLayer[] => {
  const a: ColorLayer = {id:'A', color:[20,103,167], depth:mode.value==='equal' ? 5 : 3, alpha:mode.value==='equal' ? 1 : alphaA.value}
  const b: ColorLayer = {id:'B', color:[216,112,28], depth:mode.value==='equal' ? 5 : 7, alpha:mode.value==='equal' ? 1 : alphaB.value}
  return reverse.value ? [b,a] : [a,b]
})
const regionList: {value:Region,label:string,x:number,y:number}[] = [
  {value:'both',label:'重なり',x:149,y:95}, {value:'A',label:'A のみ',x:63,y:133},
  {value:'B',label:'B のみ',x:220,y:70}, {value:'background',label:'背景',x:20,y:22},
]
const marker = computed(() => regionList.find(p => p.value === selected.value)!)
const writeDepth = computed(() => mode.value === 'equal' || writeAlphaDepth.value)
function history(region:Region, order = layers.value, count = step.value) {
  const inputs = order.slice(0,count).filter(layer => region==='both' || region===layer.id)
  return traceLayers(inputs, background.value, rule.value, writeDepth.value)
}
function paint(region:Region, order = layers.value, count = step.value) {
  const steps = history(region,order,count)
  return hex(steps[steps.length-1]?.color ?? background.value)
}
const selectedHistory = computed(() => history(selected.value))
const depthLabel = (depth:number) => Number.isFinite(depth) ? depth : '∞'
function reset() {
  mode.value = props.initialMode
  rule.value = 'LESS'
  reverse.value = false
  alphaA.value = alphaB.value = .5
  selected.value = 'both'
  backgroundHex.value = '#ffffff'
  writeAlphaDepth.value = false
  step.value = 0
}
</script>

<template>
  <section class="layers-lab">
    <div class="toolbar">
      <label>表示 <select v-model="mode"><option value="equal">A　等深度（Equal Depth）</option><option value="alpha">B　半透明（Transparency）</option></select></label>
      <label>描画順 <select v-model="reverse"><option :value="false">A → B</option><option :value="true">B → A</option></select></label>
      <label>深度テスト <select v-model="rule"><option>LESS</option><option>LEQUAL</option></select></label>
    </div>
    <div v-if="mode==='alpha'" class="toolbar tuning">
      <label>αA <input v-model.number="alphaA" type="range" min="0" max="1" step=".05"> {{ alphaA.toFixed(2) }}</label>
      <label>αB <input v-model.number="alphaB" type="range" min="0" max="1" step=".05"> {{ alphaB.toFixed(2) }}</label>
      <label>背景色 <input v-model="backgroundHex" type="color"></label>
      <label><input v-model="writeAlphaDepth" type="checkbox">深度を書き込む</label>
    </div>
    <div class="panel">
      <figure>
        <svg viewBox="0 0 280 192" role="img" aria-label="二つの三角形の合成結果。選んだ領域を輪で表示">
          <defs><clipPath :id="clipId"><polygon points="25,155 140,15 215,155"/></clipPath></defs>
          <rect width="280" height="192" :fill="hex(background)" @click="selected='background'"/>
          <polygon points="25,155 140,15 215,155" :fill="paint('A')" @click="selected='A'"/>
          <polygon points="70,42 260,42 210,180" :fill="paint('B')" @click="selected='B'"/>
          <polygon points="70,42 260,42 210,180" :clip-path="'url(#'+clipId+')'" :fill="paint('both')" @click="selected='both'"/>
          <g pointer-events="none" fill="none">
            <polygon points="25,155 140,15 215,155" stroke="#005ba8" stroke-width="2"/>
            <polygon points="70,42 260,42 210,180" stroke="#934401" stroke-dasharray="6 3" stroke-width="2"/>
            <circle :cx="marker.x" :cy="marker.y" r="6" stroke="white" stroke-width="4"/>
            <circle :cx="marker.x" :cy="marker.y" r="6" stroke="#45243e" stroke-width="2"/>
          </g>
          <g pointer-events="none" class="face-label"><text x="49" y="145">A</text><text x="228" y="62">B</text></g>
        </svg>
        <figcaption>A は実線、B は破線。輪の位置の色と深度を履歴で確認できます。</figcaption>
      </figure>
      <div>
        <label>注目標本 <select v-model="selected"><option v-for="p in regionList" :key="p.value" :value="p.value">{{ p.label }}</option></select></label>
        <p>候補深度　{{ mode==='equal' ? 'A = B = 5' : 'A = 3（手前）、B = 7（奥）' }}<br>初期深度 ∞、小さいほど手前。</p>
        <ol class="history">
          <li>背景 {{ hex(background) }} ／ 深度 ∞</li>
          <li v-for="h in selectedHistory" :key="h.id">
            面 {{ h.id }}　{{ h.candidate }} {{ rule==='LESS' ? '&lt;' : '≤' }} {{ depthLabel(h.before) }}
            → <b>{{ h.accepted ? '採用' : '棄却' }}</b><br>
            色 {{ hex(h.color) }} ／ 深度 {{ depthLabel(h.stored) }}
          </li>
        </ol>
        <p class="readout"><span class="swatch" :style="{background:paint(selected)}"></span>現在 {{ paint(selected) }}（{{ step }}/2 面）</p>
        <p>2 面描画後の{{ marker.label }}<br>
          <span class="swatch" :style="{background:paint(selected,layers,2)}"></span> {{ layers.map(l=>l.id).join('→') }} {{ paint(selected,layers,2) }}
          ／ <span class="swatch" :style="{background:paint(selected,[...layers].reverse(),2)}"></span> {{ [...layers].reverse().map(l=>l.id).join('→') }} {{ paint(selected,[...layers].reverse(),2) }}</p>
      </div>
    </div>
    <p v-if="mode==='equal'">同じ深度では LESS は先の面を残し、LEQUAL は後の面で更新します。採用した不透明面の色と深度を書き込みます。</p>
    <p v-else>採用した面の色を α × 面色 + (1 − α) × 現在色で合成。奥から手前の順と逆順を比べてください。手前を先に深度へ書くと、奥の面は深度テストで棄却されます。第2回と同じ 8 bit RGB 符号値を使う簡易モデルです。</p>
    <Playback v-model:step="step" :max="2" @reset="reset"/>
  </section>
</template>

<style scoped>
.layers-lab { color:#203b4f; line-height:1.45 }
.toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem 1rem }
.tuning { margin-top:.6rem } input[type=range] { width:5.5rem; vertical-align:middle } input[type=color] { vertical-align:middle; width:3rem; height:1.6rem }
.panel { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1rem; margin:.8rem 0; align-items:start }
figure { margin:0 } svg { box-sizing:border-box; width:100%; display:block; border:1px solid #b8cbd7 } figcaption { font-size:.88em }
.face-label { font:bold 14px sans-serif; fill:#173b55; stroke:#fff; paint-order:stroke; stroke-width:2.5px }
p { margin:.45rem 0 }.history { margin:.5rem 0; padding-left:1.6rem }.readout { background:#edf4fa; padding:.45rem .6rem }.swatch { display:inline-block; width:1.2em; height:1.2em; vertical-align:middle; border:1px solid #516675; border-radius:3px }
@media(max-width:650px){ .panel { grid-template-columns:1fr } figure svg { max-height:17rem } }
</style>
