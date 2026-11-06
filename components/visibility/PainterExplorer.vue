<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FaceGrid from './FaceGrid.vue'
import Playback from './Playback.vue'
import { makeVisibilityScene, rasterizeTriangle, renderPainter, renderZBuffer, type ScenePreset } from '../../packages/cg-algorithms/src/visibility-raster'

type PainterPreset = Exclude<ScenePreset,'lecture'>
const props = withDefaults(defineProps<{ initialPreset?: PainterPreset }>(), { initialPreset: 'ordered' })
const preset = ref<PainterPreset>(props.initialPreset)
const order = ref('ABC')
const step = ref(0)
const compare = ref(true), highlight = ref(true)
const selected = ref(17)
const scene = computed(() => makeVisibilityScene(preset.value))
const choices = computed(() => scene.value.triangles.length === 2 ? ['AB','BA'] : ['ABC','ACB','BAC','BCA','CAB','CBA'])
const faces = computed(() => [...order.value].map(id => scene.value.triangles.find(f => f.id === id)!))
const reference = computed(() => renderZBuffer(scene.value))
const painted = computed(() => renderPainter(scene.value, faces.value.slice(0, step.value)))
const differences = computed(() => painted.value.color.map((id,i) => id !== reference.value.color[i]))
const errorCount = computed(() => differences.value.filter(Boolean).length)
const selectedFaces = computed(() => scene.value.triangles.flatMap(face =>
  rasterizeTriangle(scene.value, face).filter(f => f.y * scene.value.width + f.x === selected.value)
).sort((a,b) => a.depth-b.depth))
const hints = {
  ordered: 'どの重なりでも C が最も手前、A が最も奥です。A → B → C の順で最後まで描いてみましょう。',
  crossing: '同じ輪郭の2面が交差します。左側と右側の画素を選び、手前の面が入れ替わる位置を探しましょう。',
  cycle: '右下では A が B を、上では B が C を、左下では C が A を覆います。描画順を変えて違う画素に斜線が現れるか確かめましょう。',
}
function restart() { step.value = 0 }
function setSceneDefaults(value: PainterPreset) {
  order.value = value === 'crossing' ? 'AB' : 'ABC'
  selected.value = value === 'crossing' ? 8 * 16 + 4 : value === 'cycle' ? 14 * 24 + 19 : 17
  restart()
}
function reset() {
  preset.value = props.initialPreset
  setSceneDefaults(props.initialPreset)
  compare.value = true
  highlight.value = true
}
watch(preset, setSceneDefaults, { immediate: true, flush: 'sync' })
watch(order, restart, { flush: 'sync' })
</script>

<template>
  <div class="painter">
    <div class="settings">
      <label>シーン
        <select v-model="preset"><option value="ordered">非交差の3面</option><option value="crossing">交差する2面</option><option value="cycle">前後が循環する3面</option></select>
      </label>
      <label>描画順（先 → 後）
        <select v-model="order"><option v-for="value in choices" :key="value" :value="value">{{ [...value].join(' → ') }}</option></select>
      </label>
      <label><input v-model="compare" type="checkbox"> 正解画像</label>
      <label><input v-model="highlight" type="checkbox"> 差分を斜線で表示</label>
    </div>
    <Playback :key="preset + order" v-model:step="step" :max="faces.length" @reset="reset" />
    <div class="status" aria-live="polite">
      <b>{{ step ? '今描いた面 ' + faces[step-1].id : '初期状態（背景）' }}</b>
      <span>{{ step === faces.length ? '完成時の誤り' : '正解との途中差分' }} <b>{{ errorCount }}</b> / {{ scene.width * scene.height }} 画素</span>
    </div>
    <div class="grids">
      <FaceGrid :scene="scene" :color="painted.color" :selected="selected" :differences="highlight ? differences : undefined"
        label="ペインタ法の Color Buffer" @select="selected = $event" />
      <FaceGrid v-if="compare" :scene="scene" :color="reference.color" :selected="selected" label="正解画像（Z-buffer）" @select="selected = $event" />
    </div>
    <div class="inspect">
      <b>画素 P ({{ selected % scene.width }}, {{ Math.floor(selected / scene.width) }})</b>
      <span>カメラからの並び（手前 → 奥）</span>
      <strong>{{ selectedFaces.map(f => f.faceId + ' (' + Number(f.depth.toFixed(2)) + ')').join(' → ') || '背景' }}</strong>
      <span>描いた色 {{ painted.color[selected] ?? '背景' }} ／ 正解 {{ reference.color[selected] ?? '背景' }}</span>
    </div>
    <p>{{ hints[preset] }}</p>
    <small>平行投影・不透明面。画素中心を1回標本化し、左上の辺を含めます。括弧内の深度は小さいほど手前です。クリックまたは矢印キーで画素を選べます。</small>
  </div>
</template>

<style scoped>
.painter { container-type:inline-size; color:#193b53; line-height:1.5; }
.settings,.status,.inspect { display:flex; flex-wrap:wrap; align-items:center; gap:.55rem 1.25rem; }
.settings label { display:inline-flex; align-items:center; gap:.5rem; }
.settings select { border:1px solid #9bb5cc; border-radius:.25rem; padding:.38em; background:#fff; color:inherit; font:inherit; }
.status { justify-content:space-between; padding:.6rem .8rem; margin-bottom:.9rem; background:#eef4fa; border-left:3px solid #005bac; }
.grids { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1.1rem; max-width:55rem; }
.inspect { padding:.7rem 0; margin-top:.55rem; border-bottom:1px solid #ccdbe5; }
.painter p { margin:.65rem 0 .3rem; }
.painter small { display:block; color:#466174; }
@container (max-width:520px) { .grids { grid-template-columns:1fr; } }
</style>
