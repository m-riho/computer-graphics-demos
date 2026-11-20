<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { beamFootprint } from '../../packages/cg-algorithms/src/shading-incidence.ts'

defineProps<{ topic?: string }>()
const angle = ref(30)
const teacher = ref(false)
const explanation = ref(true)
const uid = useId().replace(/:/g, '')
const beam = computed(() => beamFootprint(angle.value))
const x = (v: number) => 360 + 76 * v
const y = (v: number) => 350 - 76 * v
const point = (p: readonly number[]) => x(p[0]!) + ',' + y(p[1]!)
const top = 4
const slope = computed(() => beam.value.light[0] / beam.value.light[1])
const polygon = computed(() => [
  [beam.value.left, 0], [beam.value.right, 0],
  [beam.value.right + top * slope.value, top], [beam.value.left + top * slope.value, top],
].map(point).join(' '))
const rays = computed(() => [0.15, .5, .85].map(f => {
  const ground = beam.value.left + f * beam.value.floorWidth
  // Arrowhead close to the floor; its direction is always -L.
  const height = .65 * beam.value.light[1]
  return { start: [ground + top * slope.value, top], end: [ground + height * slope.value, height] }
}))
const arc = computed(() => {
  const radius = 68, theta = angle.value * Math.PI / 180
  return 'M 360 282 A 68 68 0 0 1 ' + (360 + radius * Math.sin(theta)) + ' ' + (350 - radius * Math.cos(theta))
})
const f = (v: number) => v.toFixed(3)
function reset() { angle.value = 30 }
</script>

<template>
  <section class="shading-explorer beam-explorer" :class="{ teacher }">
    <header class="beam-header">
      <div><h2>入射角と光の広がり</h2><p>Beam Footprint Explorer</p></div>
      <button type="button" :aria-pressed="teacher" @click="teacher = !teacher">教員モード</button>
    </header>
    <p class="beam-question"><strong>予想：</strong>同じ太さの光を60°傾けると、床の照射幅と単位面積当たりの光量は？</p>
    <div class="beam-controls">
      <label>入射角 θ：<strong>{{ angle }}°</strong>
        <input v-model.number="angle" type="range" min="0" max="80" step="1" aria-label="入射角 θ" />
      </label>
      <div class="beam-buttons">
        <button v-for="a in [0, 30, 60, 80]" :key="a" type="button" :aria-pressed="angle === a" @click="angle = a">{{ a }}°</button>
        <button type="button" @click="reset">初期状態に戻す</button>
      </div>
    </div>
    <div class="beam-legend">
      <span class="normal">↑ N：面の単位法線</span>
      <span class="source">⇢ L：面から光源へ（破線）</span>
      <span class="incoming">↙ −L：光が進む向き（実線）</span>
    </div>
    <svg class="beam-diagram" viewBox="0 0 900 470" role="img" :aria-label="'入射角' + angle + '度。光束の幅1に対し床の照射幅' + f(beam.floorWidth) + '、相対照度' + f(beam.relativeIlluminance)">
      <defs>
        <clipPath :id="uid + '-clip'"><rect x="24" y="20" width="852" height="330" /></clipPath>
        <marker v-for="(color, i) in ['#005bac', '#14734c', '#ae5500']" :id="uid + '-arrow-' + i" :key="i" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z" :fill="color" /></marker>
      </defs>
      <rect x="24" y="350" width="852" height="95" fill="#edf2f7" />
      <g :clip-path="'url(#' + uid + '-clip)'">
        <polygon :points="polygon" fill="#ffe6a4" fill-opacity=".65" stroke="#bb7c16" stroke-width="1.5" />
        <line v-for="(ray, i) in rays" :key="i" :x1="x(ray.start[0]!)" :y1="y(ray.start[1]!)" :x2="x(ray.end[0]!)" :y2="y(ray.end[1]!)" stroke="#ae5500" stroke-width="2.5" :marker-end="'url(#' + uid + '-arrow-2)'" />
      </g>
      <line x1="24" y1="350" x2="876" y2="350" stroke="#50677d" stroke-width="2" />
      <line :x1="x(beam.left)" y1="350" :x2="x(beam.right)" y2="350" stroke="#cc7c00" stroke-width="10" />
      <!-- Fixed perpendicular beam width, not a fixed width along the floor. -->
      <line data-testid="cross-section" :x1="x(beam.crossSection[0][0])" :y1="y(beam.crossSection[0][1])" :x2="x(beam.crossSection[1][0])" :y2="y(beam.crossSection[1][1])" stroke="#71491c" stroke-width="6" />
      <g v-for="(p, i) in beam.crossSection" :key="'cap' + i">
        <circle :cx="x(p[0])" :cy="y(p[1])" r="5" fill="#71491c" />
      </g>
      <line x1="360" y1="350" x2="360" y2="160" stroke="#005bac" stroke-width="4" :marker-end="'url(#' + uid + '-arrow-0)'" />
      <line x1="360" y1="350" :x2="360 + 145 * beam.light[0]" :y2="350 - 145 * beam.light[1]" stroke="#14734c" stroke-width="3" stroke-dasharray="9 5" :marker-end="'url(#' + uid + '-arrow-1)'" />
      <path v-if="angle > 0" :d="arc" fill="none" stroke="#37536a" stroke-width="2" />
      <text x="334" y="151" fill="#005bac">N</text>
      <text v-if="angle > 0" :x="360 + 160 * beam.light[0]" :y="350 - 160 * beam.light[1]" fill="#14734c">L</text>
      <text x="40" y="51" class="angle-note">θ = {{ angle }}°</text>
      <text x="40" y="82" class="diagram-note">茶色の線：光束の幅 1</text>
      <text x="40" y="110" class="diagram-note">（光の進む向きに垂直）</text>
      <circle cx="360" cy="350" r="5" fill="#153854" />
      <line data-testid="floor-width" :x1="x(beam.left)" y1="390" :x2="x(beam.right)" y2="390" stroke="#153854" stroke-width="2" />
      <path :d="'M' + x(beam.left) + ' 377V403 M' + x(beam.right) + ' 377V403'" stroke="#153854" stroke-width="2" />
      <text x="360" y="433" text-anchor="middle">床の照射幅 W = {{ f(beam.floorWidth) }}</text>
      <text x="790" y="430" text-anchor="middle" class="diagram-note">床面</text>
    </svg>
    <div class="beam-metrics" aria-live="polite" aria-atomic="true">
      <div><span>床の照射面積（奥行き1）</span><strong data-testid="area">{{ f(beam.floorWidth) }} 倍</strong><small>W = 1 / cos θ</small></div>
      <div><span>単位面積当たりの光量</span><strong data-testid="irradiance">{{ f(beam.relativeIlluminance) }} 倍</strong><small>E / E₀ = cos θ = N · L</small></div>
      <div><span>床に届く光の総量</span><strong>1.000 倍</strong><small>面積 × 相対照度 = 1</small></div>
    </div>
    <p class="beam-assumption">光に垂直な断面積1（幅1 × 奥行き1）の平行光を想定。光の総量と太さを保ち、入射角だけを変えます。</p>
    <button v-if="teacher" type="button" :aria-expanded="explanation" @click="explanation = !explanation">{{ explanation ? '説明を隠す' : '説明を表示' }}</button>
    <div v-if="!teacher || explanation" class="beam-explanation">
      <p><strong>観察：</strong>0°と60°を比べてください。照らす面積が2倍になると、同じ光が広がり、単位面積当たりの光量は半分になります。</p>
      <p><strong>理由：</strong>床の幅 W を光に垂直な方向へ投影すると、光束の幅1になります。W cos θ = 1 なので、W = 1 / cos θ です。</p>
      <p>ここで示すのは面に届く光の量（相対照度）。材質による反射は次のLambertのデモで扱います。90°に近づくと幅は限りなく大きくなり、照度は0に近づくため、操作範囲は80°までとしています。</p>
    </div>
  </section>
</template>

<style scoped>
.beam-explorer { color:#153854; font:17px/1.6 'Hiragino Sans',sans-serif; }
.beam-explorer * { box-sizing:border-box; }
.beam-explorer h2 { margin:0; font-size:1.45em; font-weight:700; }
.beam-explorer p { margin:.5em 0; }
.beam-header { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; }
.beam-header p { color:#50677d; font-size:.9em; }
.beam-question, .beam-explanation { padding:12px 16px; background:#edf4fc; border-radius:8px; }
.beam-controls { display:flex; flex-wrap:wrap; align-items:center; gap:16px; margin:18px 0; }
.beam-controls label { flex:1 1 240px; display:block; }
.beam-controls input { display:block; width:100%; accent-color:#005bac; margin-top:12px; }
.beam-buttons { display:flex; flex-wrap:wrap; gap:8px; }
.beam-explorer button { padding:8px 12px; color:#14466d; background:#f3f8ff; border:1px solid #9bb5cc; border-radius:6px; font:inherit; cursor:pointer; }
.beam-explorer button[aria-pressed=true] { color:white; background:#005bac; }
.beam-explorer button:focus-visible, .beam-explorer input:focus-visible { outline:3px solid #db8400; outline-offset:3px; }
.beam-legend { display:flex; flex-wrap:wrap; gap:8px 20px; font-size:.9em; }
.normal { color:#005bac; } .source { color:#14734c; } .incoming { color:#ae5500; }
.beam-diagram { display:block; width:100%; height:auto; background:#fafcff; border:1px solid #cbdbea; border-radius:8px; margin:12px 0; }
.beam-diagram text { font:24px 'Hiragino Sans',sans-serif; fill:#153854; }
.beam-diagram .diagram-note { font-size:20px; }
.beam-diagram .angle-note { font-size:28px; font-weight:bold; }
.beam-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.beam-metrics div { display:flex; flex-direction:column; background:#f0f6fc; border:1px solid #cbdbea; padding:12px; border-radius:6px; }
.beam-metrics span, .beam-metrics small { font-size:.87em; }
.beam-metrics strong { color:#005bac; font-size:1.7em; }
.beam-assumption { font-size:.88em; color:#50677d; }
.teacher { font-size:20px; }
@media(max-width:600px) {
  .beam-explorer { font-size:16px; }
  .beam-metrics { grid-template-columns:1fr; }
  .beam-metrics div { padding:10px 14px; }
}
</style>
