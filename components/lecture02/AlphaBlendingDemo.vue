<script setup lang="ts">
import {computed, ref} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {compositeOverOpaque, hex, type RGB} from '../../packages/cg-algorithms/src/index.ts'

defineProps<{compact?: boolean}>()
const alpha = ref(.5)
const frontIndex = ref(0), backIndex = ref(0)
const fronts: {name: string; rgb: RGB}[] = [
  {name:'赤 / Red', rgb:[255,0,0]}, {name:'緑 / Green', rgb:[0,255,0]},
  {name:'青 / Blue', rgb:[0,0,255]}, {name:'黄 / Yellow', rgb:[255,255,0]},
]
const backs: {name: string; rgb: RGB}[] = [
  {name:'白', rgb:[255,255,255]}, {name:'黒', rgb:[0,0,0]},
  {name:'青', rgb:[0,0,255]}, {name:'灰色', rgb:[128,128,128]},
]
const front = computed(() => fronts[frontIndex.value].rgb)
const back = computed(() => backs[backIndex.value].rgb)
const result = computed(() => compositeOverOpaque(front.value, back.value, alpha.value))
const state = computed(() => alpha.value === 0 ? '透明' : alpha.value === 1 ? '不透明' : '半透明')
function reset() { alpha.value = .5; frontIndex.value = 0; backIndex.value = 0 }
</script>

<template>
<DemoFrame label="αを動かして、背景の透け方を比べる" class="alpha-demo" :class="{compact}" @reset="reset">
<p class="alpha-intro">RGBAのAlphaは<strong>不透明度</strong>。0は透明、1は不透明です。</p>
<div class="controls">
  <label>前景色<select aria-label="前景色" v-model.number="frontIndex"><option v-for="(c,i) in fronts" :key="i" :value="i">{{c.name}}</option></select></label>
  <label>背景色<select aria-label="背景色" v-model.number="backIndex"><option v-for="(c,i) in backs" :key="i" :value="i">{{c.name}}</option></select></label>
</div>
<div class="controls alpha-control">
  <label>α<input aria-label="アルファ値" type="range" min="0" max="1" step="0.01" v-model.number="alpha" /><output>{{alpha.toFixed(2)}} · {{state}}</output></label>
  <div class="alpha-presets screen-only"><button v-for="a in [0,.5,1]" :key="a" :aria-pressed="alpha===a" @click="alpha=a">α = {{a}}</button></div>
</div>
<div class="alpha-panels">
  <figure>
    <div class="alpha-scene" :style="{background:hex(back)}" role="img" :aria-label="`前景${fronts[frontIndex].name}、背景${backs[backIndex].name}、アルファ値${alpha}`">
      <span class="background-word" :style="{color:backIndex===0?'#202124':'#ffffff'}">背景の文字</span>
      <div class="foreground-paint" :style="{background:`rgb(${front.join(' ')} / ${alpha})`}" />
    </div>
    <figcaption>中央の四角が前景。α = 0では背景だけが見えます。</figcaption>
  </figure>
  <div class="alpha-result">
    <div class="result-swatch" :style="{background:hex(result)}" role="img" :aria-label="`合成色 ${hex(result)}`" />
    <div class="readout">合成色 RGB ({{result.join(', ')}})<br>{{hex(result)}}</div>
    <div class="alpha-small">文字のない領域の色。8 bitの整数に丸めて表示。</div>
  </div>
</div>
<div class="alpha-equation">
  <strong>合成色 = 前景色 × α ＋ 背景色 × (1−α)</strong>
  <div class="alpha-numbers">({{front.join(', ')}}) × {{alpha.toFixed(2)}} ＋ ({{back.join(', ')}}) × {{(1-alpha).toFixed(2)}}</div>
</div>
<div class="hint">αを8 bitで保存する場合は0〜255（現在は約{{Math.round(alpha*255)}}）。<br>背景は不透明。ここではsRGBの符号値を重み付けし、線形光での合成とは区別します。</div>
<div v-if="!compact" class="alpha-source">参考：<a href="https://www.w3.org/TR/compositing-1/#simplealphacompositing">W3C — Simple alpha compositing</a></div>
</DemoFrame>
</template>

<style scoped>
.alpha-demo p{margin:0 0 16px}.alpha-demo .alpha-control{gap:12px 20px}.alpha-presets{display:flex;gap:8px}.alpha-presets button[aria-pressed=true]{background:var(--soft,#e8f1fa);border-color:var(--accent,#1565a8)}.alpha-control output{min-width:150px;font-variant-numeric:tabular-nums}.alpha-panels{display:grid;grid-template-columns:1.3fr 1fr;gap:30px;align-items:start}.alpha-scene{height:210px;position:relative;display:grid;place-items:center;border:1px solid #a4adb8;isolation:isolate}.background-word{font-size:32px;font-weight:700}.foreground-paint{position:absolute;inset:20px 36px}.alpha-demo figcaption,.alpha-small{font-size:18px;margin-top:8px}.result-swatch{height:108px;border:1px solid #a4adb8;margin-bottom:10px}.alpha-equation{background:var(--soft,#edf4fa);padding:12px 16px;margin-top:16px;border-left:4px solid var(--accent,#1767aa)}.alpha-numbers{font-size:20px;font-variant-numeric:tabular-nums;margin-top:4px}.alpha-source{font-size:16px;margin-top:14px}.alpha-source a{text-decoration:underline}
.alpha-demo.compact p{margin-bottom:10px}.alpha-demo.compact .controls{margin-bottom:10px}.alpha-demo.compact .alpha-scene{height:115px}.alpha-demo.compact .result-swatch{height:45px}.alpha-demo.compact figcaption,.alpha-demo.compact .alpha-small{font-size:16px}.alpha-demo.compact .alpha-equation{margin-top:10px;padding:8px 14px}.alpha-demo.compact .hint{font-size:17px}.alpha-demo.compact .alpha-numbers{font-size:18px}
@media(max-width:650px){.alpha-panels{grid-template-columns:1fr;gap:18px}.alpha-control label{flex-wrap:wrap}.alpha-demo .alpha-control input{width:145px}.alpha-control output{min-width:115px}.alpha-equation{font-size:18px;padding:10px}.alpha-numbers{font-size:16px;overflow-wrap:anywhere}.alpha-demo .alpha-scene{height:180px}.result-swatch{height:70px}.alpha-demo .controls{gap:12px}.alpha-demo .alpha-presets{flex-wrap:wrap}.alpha-demo .hint{font-size:16px}}
</style>
