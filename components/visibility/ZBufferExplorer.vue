<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import FaceGrid from './FaceGrid.vue'
import Playback from './Playback.vue'
import { makeVisibilityScene, rasterizeTriangle, replayDepth } from '../../packages/cg-algorithms/src/visibility-raster'

const scene = makeVisibilityScene('lecture')
const order = ref('ABC')
const unit = ref<'face'|'fragment'>('face')
const showDepth = ref(true)
const step = ref(0)
const selected = ref(17) // 講義図 P = (3,2)。原点は左上、添字は0から。
const faces = computed(() => order.value === 'ABC' ? scene.triangles : [...scene.triangles].reverse())
const groups = computed(() => faces.value.map(t => rasterizeTriangle(scene,t)))
const all = computed(() => groups.value.flat())
const max = computed(() => unit.value === 'face' ? faces.value.length : all.value.length)
const processed = computed(() => unit.value === 'face' ? groups.value.slice(0,step.value).flat() : all.value.slice(0,step.value))
const result = computed(() => replayDepth(scene, processed.value, selected.value))
const last = computed(() => processed.value.at(-1))
const exceptionUrl = ref('https://m-riho.github.io/computer-graphics-demos/#/sessions/06/transparency-depth/demo')
onMounted(() => {
  if (location.hash.startsWith('#/sessions/')) exceptionUrl.value = '#/sessions/06/transparency-depth/demo'
})
function depthLabel(value: number) { return Number.isFinite(value) ? String(Number(value.toFixed(2))) : '∞' }
function restart() { step.value = 0 }
function reset() {
  order.value = 'ABC'
  unit.value = 'face'
  showDepth.value = true
  selected.value = 17
  restart()
}
watch([order,unit], restart, { flush:'sync' })
</script>

<template>
  <div class="z-explorer">
    <div class="settings">
      <label>描画順
        <select v-model="order"><option value="ABC">A → B → C</option><option value="CBA">C → B → A</option></select>
      </label>
      <label>ステップ単位
        <select v-model="unit"><option value="face">面ごと</option><option value="fragment">フラグメントごと</option></select>
      </label>
      <label><input v-model="showDepth" type="checkbox"> 深度を表示</label>
    </div>
    <Playback :key="order + unit" v-model:step="step" :max="max" @reset="reset" />
    <div class="summary" aria-live="polite">
      <b v-if="!last">初期状態：全画素を背景色と ∞ で初期化</b>
      <b v-else-if="unit === 'face'">面 {{ last.faceId }} を処理（{{ groups[step-1].length }} 画素）</b>
      <b v-else>面 {{ last.faceId }} の画素 ({{ last.x }}, {{ last.y }}) を処理</b>
      <span>深度テスト <strong>候補 &lt; 記録</strong></span>
    </div>
    <div class="grids">
      <FaceGrid :scene="scene" mode="scene" :selected="selected" label="シーン（正面から投影）" @select="selected = $event" />
      <FaceGrid :scene="scene" :color="result.color" :selected="selected" label="色（Color Buffer）" @select="selected = $event" />
      <FaceGrid v-if="showDepth" :scene="scene" mode="depth" :depth="result.depth" :selected="selected" label="深度（Depth Buffer）" @select="selected = $event" />
    </div>
    <ul class="legend" aria-label="各面の一定深度">
      <li v-for="f in scene.triangles" :key="f.id" :class="'face-'+f.id"><i aria-hidden="true"></i>{{ f.id }} = {{ f.vertices[0][2] }}</li>
    </ul>
    <section class="history" aria-live="polite">
      <h3>画素 P ({{ selected % scene.width }}, {{ Math.floor(selected / scene.width) }}) の履歴</h3>
      <ol>
        <li>初期 <strong>∞</strong></li>
        <li v-for="item in result.history" :key="item.faceId">
          <b>{{ item.faceId }}</b>　{{ depthLabel(item.depth) }} &lt; {{ depthLabel(item.stored) }} は{{ item.accepted ? '真' : '偽' }}
          <strong>{{ item.accepted ? '更新 → ' + item.depth : '棄却 → ' + item.stored + ' を保持' }}</strong>
        </li>
      </ol>
      <p v-if="!result.history.length && step > 0">この画素には処理済みの候補がありません。</p>
      <p>現在の記録　<strong>{{ result.color[selected] ?? '背景' }} ／ {{ depthLabel(result.depth[selected]) }}</strong></p>
    </section>
    <small>平行投影の 7 × 5 格子。左上を (0, 0) とし、画素中心を調べます。小さい深度ほど手前です。図をクリックするか、図にフォーカスして矢印キーで画素を選んでください。</small>
    <a :href="exceptionUrl">同じ深度・半透明のときの比較へ →</a>
  </div>
</template>

<style scoped>
.z-explorer { color:#193b53; container-type:inline-size; line-height:1.5; }
.settings,.summary,.legend { display:flex; flex-wrap:wrap; align-items:center; gap:.55rem 1.2rem; }
.settings label { display:inline-flex; align-items:center; gap:.5rem; }
.settings select { background:white; border:1px solid #9bb5cc; border-radius:.25rem; padding:.38em; color:inherit; font:inherit; }
.summary { justify-content:space-between; background:#eef4fa; padding:.6rem .8rem; border-left:3px solid #005bac; margin-bottom:.9rem; }
.grids { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
.legend { list-style:none; padding:0; margin:.45rem 0 1rem; }
.legend li { display:inline-flex; align-items:center; gap:.4rem; font-weight:650; }
.legend i { width:1.5rem; border-top:3px solid; }
.face-A { color:#125da5; } .face-B { color:#a74413; } .face-C { color:#057665; }
.face-B i { border-top-style:dashed; } .face-C i { border-top-style:dotted; }
.history { border-top:1px solid #bbcedb; padding-top:.65rem; }
.history h3 { margin:0 0 .6rem; font-size:1.05em; }
.history ol { list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:.6rem; }
.history li { padding:.4rem .65rem; border:1px solid #b5cddd; border-radius:.25rem; }
.history li strong { display:block; }
.history p { margin:.45rem 0; }
.z-explorer small,.z-explorer a { display:block; margin-top:.4rem; }
.z-explorer small { color:#466174; }
@container (max-width:620px) { .grids { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@container (max-width:400px) { .grids { grid-template-columns:1fr; } }
</style>
