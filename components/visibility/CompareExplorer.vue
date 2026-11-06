<script setup lang="ts">
import { computed, ref } from 'vue'
import { castVisibilitySample } from '../../packages/cg-algorithms/src/visibility-compare.ts'
import { faceColor, makeVisibilityScene, rasterizeTriangle, replayDepth, VISIBILITY_EPSILON, type ScenePreset } from '../../packages/cg-algorithms/src/visibility-raster.ts'
import FaceGrid from './FaceGrid.vue'
import Playback from './Playback.vue'

const preset = ref<ScenePreset>('lecture')
const pixel = ref(17), step = ref(0)
const showCandidates = ref(true), showDepth = ref(true), showRay = ref(true)
const scene = computed(() => makeVisibilityScene(preset.value))
const x = computed(() => pixel.value % scene.value.width)
const y = computed(() => Math.floor(pixel.value / scene.value.width))
const fragments = computed(() => scene.value.triangles.flatMap(face => rasterizeTriangle(scene.value, face)))
const raster = computed(() => replayDepth(scene.value, fragments.value, pixel.value))
const rays = computed(() => Array.from({length: scene.value.width*scene.value.height}, (_,i) =>
  castVisibilitySample(scene.value, i % scene.value.width, Math.floor(i/scene.value.width))))
const rayColor = computed(() => rays.value.map(r => r.visible?.id ?? null))
const ray = computed(() => rays.value[pixel.value])
const rasterId = computed(() => raster.value.color[pixel.value])
const rayId = computed(() => ray.value.visible?.id ?? null)
const differences = computed(() => raster.value.color.map((id, i) => id !== rayColor.value[i]))
const mismatchCount = computed(() => differences.value.filter(Boolean).length)
const ties = computed(() => {
  const z = ray.value.visible?.t ?? Infinity
  return ray.value.hits.filter(h => Math.abs(h.t - z) <= VISIBILITY_EPSILON).length > 1
})
const rasterStages = ['投影した三角形', '被覆された標本', '深度テスト', '最終 Face ID']
const rayStages = ['画素中心', '一次レイ', '交点候補', '最近傍 → 最終 Face ID']
const fmt = (v: number) => Number.isFinite(v) ? String(Number(v.toFixed(3))) : '∞'
const cover = computed(() => {
  const ids:(string|null)[] = Array(scene.value.width*scene.value.height).fill(null)
  for (const f of fragments.value) {
    const i = f.y*scene.value.width+f.x
    ids[i] = (ids[i] ?? '') + f.faceId
  }
  return ids
})
const selectedCandidates = computed(() => {
  const ids:(string|null)[] = Array(rayColor.value.length).fill(null)
  ids[pixel.value] = ray.value.hits.map(h => h.id).join('') || null
  return ids
})
const diagramFar = computed(() => Math.max(1,...scene.value.triangles.flatMap(f => f.vertices.map(v => v[2])))+1)
const position = (t:number) => 15 + 260*t/diagramFar.value
function changeScene() {
  pixel.value = Math.floor(scene.value.height/2)*scene.value.width+Math.floor(scene.value.width/2)
  step.value = 0
}
function reset() {
  preset.value = 'lecture'
  changeScene()
  showCandidates.value = showDepth.value = showRay.value = true
}
</script>

<template>
  <section class="compare-lab">
    <div class="controls">
      <label>共有シーン <select v-model="preset" aria-label="共有シーン" @change="changeScene"><option value="lecture">講義の A・B・C</option><option value="ordered">非交差面</option><option value="crossing">交差する2面</option><option value="cycle">循環する3面</option></select></label>
      <label><input v-model="showCandidates" type="checkbox"> 候補面</label>
      <label><input v-model="showDepth" type="checkbox"> 深度</label>
      <label><input v-model="showRay" type="checkbox"> レイ</label>
    </div>
    <p class="sample">標本 ({{ x + .5 }}, {{ y + .5 }})　両方の図をクリックするか、矢印キーで画素を選べます。</p>
    <div class="columns">
      <div>
        <h3>面からたどる <small>Rasterization</small></h3>
        <FaceGrid :scene="scene" :label="rasterStages[step]" :selected="pixel" :mode="step===0 ? 'scene' : step===2 && showDepth ? 'depth' : 'color'" :color="step===1 ? cover : raster.color" :depth="raster.depth" @select="pixel=$event"/>
        <p v-if="showCandidates">被覆候補　{{ raster.history.map(f=>f.faceId).join(' → ') || 'なし' }}</p>
        <p v-if="showDepth">深度テスト（初期 ∞）<span v-for="f in raster.history" :key="f.faceId" class="entry">{{ f.faceId }}　{{ fmt(f.depth) }} &lt; {{ fmt(f.stored) }}　{{ f.accepted ? '採用' : '保持' }}</span></p>
      </div>
      <div>
        <h3>画素からたどる <small>Ray Casting</small></h3>
        <FaceGrid :scene="scene" :label="rayStages[step]" :selected="pixel" :mode="step===0 ? 'scene' : 'color'" :color="step===3 ? rayColor : step===2 ? selectedCandidates : []" :differences="step===3 ? differences : undefined" @select="pixel=$event"/>
        <svg v-if="showRay" viewBox="0 0 292 56" role="img" aria-label="正投影の一次レイと深度軸上の交点">
          <path d="M15 30H280m-8 -4 8 4 -8 4" fill="none" stroke="#365971" stroke-width="1.6"/>
          <text x="9" y="49">0</text><text x="279" y="49">+z</text>
          <g v-for="(hit,i) in ray.hits" v-show="step>=2" :key="hit.id">
            <circle :cx="position(hit.t)" cy="30" :r="step===3 && rayId===hit.id ? 6 : 4" :fill="faceColor(hit.id)" stroke="#284359"/>
            <text :x="position(hit.t)" :y="i%2 ? 49 : 19" text-anchor="middle">{{ hit.id }}{{ showDepth ? ' '+fmt(hit.t) : '' }}</text>
          </g>
        </svg>
        <p v-if="showCandidates">交点候補　{{ ray.hits.map(h=>h.id + (showDepth ? ' (t='+fmt(h.t)+')' : '')).join('、') || 'なし' }}</p>
      </div>
    </div>
    <p class="result"><strong>{{ rasterId===rayId ? 'MATCH' : ties ? '同深度の境界' : 'DIFFER' }}</strong>　Raster {{ rasterId ?? '背景' }} ／ Ray {{ rayId ?? '背景' }}　<span>全画素の ID 差 {{ mismatchCount }} / {{ rayColor.length }}</span></p>
    <p v-if="rasterId!==rayId">採否は左の深度履歴・右の交点候補で確認できます。{{ ties ? '最小深度が許容誤差内で重なる標本です。' : '被覆辺・クリッピング・深度順を確認してください。' }}</p>
    <Playback v-model:step="step" :max="3" @reset="reset"/>
    <p class="note">共通条件は正投影、画素中心、左上規則、{{ scene.camera.near }} &lt; z ≤ {{ scene.camera.far }}。深度は小さいほど手前で、等しいときは先の面を採用します。境界の許容誤差は 10⁻⁹ です。</p>
  </section>
</template>

<style scoped>
.compare-lab {color:#193b53;line-height:1.5;font-size:1rem}.controls {display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center}.controls label {display:inline-flex;gap:.3rem;align-items:center}
.sample,.note {margin:.6rem 0;color:#435c71}.columns {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem}.columns>div {min-width:0;background:#f6f9fb;border:1px solid #c2d5e3;border-radius:.5rem;padding:.65rem}.columns h3 {font-size:1.08rem;margin:0 0 .4rem;color:#004e8a}.columns h3 small {font-size:.82em;font-weight:450}
.columns p {margin:.5rem 0}.columns :deep(.face-grid svg) {max-height:16rem}.columns svg:not(.face-grid svg) {width:100%;display:block}.columns svg text {font-size:12px;fill:#15374f}.entry {display:block;font-variant-numeric:tabular-nums}.result {margin:.65rem 0;padding:.5rem .65rem;border-left:4px solid #005bac;background:#eef5fc}.result strong {color:#005bac}.result span {display:inline-block}
@media(max-width:620px){.columns {grid-template-columns:minmax(0,1fr)}}
</style>
