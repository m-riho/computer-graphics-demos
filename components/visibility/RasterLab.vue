<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Playback from './Playback.vue'
import { makeVisibilityScene, sampleTriangle, type VisibilityTriangle } from '../../packages/cg-algorithms/src/visibility-raster.ts'
import type { Vec2 } from '../../packages/cg-algorithms/src/matrix4.ts'

type Mode = 'coverage' | 'edges' | 'shared' | 'weights'
type Vertices = VisibilityTriangle['vertices']
const props = withDefaults(defineProps<{initialMode?: Mode; initialPreset?: 'lecture'|'appendix'}>(), {initialMode:'coverage', initialPreset:'appendix'})
const mode = ref<Mode>(props.initialMode), scale = ref(1), preset = ref(props.initialPreset)
const initial = (): Vertices => [[1,1,.2], [5,1,.6], [1,5,1]]
const appendix = ref<Vertices>(initial())
const lectureScene = makeVisibilityScene('lecture')
const lecture = ref<Vertices>(lectureScene.triangles[0].vertices.map(v => [...v]) as Vertices)
const isLecture = computed(() => mode.value === 'coverage' && preset.value === 'lecture')
const appendixGridSize = 8
const baseWidth = computed(() => isLecture.value ? lectureScene.width : appendixGridSize)
const baseHeight = computed(() => isLecture.value ? lectureScene.height : appendixGridSize)
const width = computed(() => scale.value * baseWidth.value)
const height = computed(() => scale.value * baseHeight.value)
const editable = computed(() => isLecture.value ? lecture.value : appendix.value)
const vertices = computed((): Vertices => {
  const source = mode.value === 'shared' ? initial() : editable.value
  return source.map(([x,y,z]) => [x * scale.value, y * scale.value, z]) as Vertices
})
const neighbor = computed((): Vertices => [vertices.value[1],[5*scale.value,5*scale.value,0],vertices.value[2]])
function initialPixel() {
  if (mode.value === 'shared') return width.value * scale.value + 5 * scale.value - 1
  const center = isLecture.value ? [3.5,2.5] : [2.5,1.5]
  return Math.floor(center[1]*scale.value)*width.value + Math.floor(center[0]*scale.value)
}
const selected = ref(initialPixel())
const centers = ref(true), bounds = ref(true), mask = ref(true)
const diagram = ref<SVGSVGElement>(), dragging = ref<number | null>(null)
const names = ['A','B','C'], edges = ['BC','CA','AB']
const cells = computed(() => Array.from({length:width.value*height.value}, (_, id) => {
  const x = id % width.value, y = Math.floor(id / width.value)
  const p: Vec2 = [x+.5,y+.5]
  const sample = sampleTriangle(vertices.value, p)
  const other = mode.value === 'shared' ? sampleTriangle(neighbor.value, p) : null
  return {id, x, y, sample, owner:sample?.covered ? 'ABC' : other?.covered ? 'BDC' : '', onShared:mode.value === 'shared' && sample && Math.abs(sample.edges[0]) < 1e-8 && p.every(v => v >= scale.value && v <= scale.value*5)}
}))
const active = computed(() => cells.value[selected.value])
const box = computed(() => {
  const xs = vertices.value.map(v => v[0]), ys = vertices.value.map(v => v[1])
  return {x:Math.min(...xs), y:Math.min(...ys), width:Math.max(...xs)-Math.min(...xs), height:Math.max(...ys)-Math.min(...ys)}
})
const coordinate = (n:number) => Number(n.toFixed(3))
const path = (v:Vertices) => v.map(p => p[0]+','+p[1]).join(' ')
const constrain = (v:number, limit:number) => Math.min(limit, Math.max(0, Math.round(v*4)/4)) / scale.value
function move(index:number, x:number, y:number) {
  if (mode.value !== 'shared') {
    editable.value[index][0] = constrain(x,width.value)
    editable.value[index][1] = constrain(y,height.value)
  }
}
function pointerLocation(event:PointerEvent): Vec2 | undefined {
  const transform = diagram.value?.getScreenCTM()
  if (!transform) return
  const p = new DOMPoint(event.clientX,event.clientY).matrixTransform(transform.inverse())
  return [p.x,p.y]
}
function startDrag(index:number, event:PointerEvent) {
  if (mode.value === 'shared') return
  dragging.value = index
  diagram.value?.setPointerCapture(event.pointerId)
}
function pointerMove(event:PointerEvent) {
  const p = pointerLocation(event)
  if (p && dragging.value !== null) move(dragging.value,...p)
}
function selectCell(event:PointerEvent) {
  const p = pointerLocation(event)
  if (!p || p[0] < 0 || p[0] >= width.value || p[1] < 0 || p[1] >= height.value) return
  selected.value = Math.floor(p[1]) * width.value + Math.floor(p[0])
}
function nudge(index:number, event:KeyboardEvent) {
  const offsets:Record<string, Vec2> = {ArrowLeft:[-.25,0],ArrowRight:[.25,0],ArrowUp:[0,-.25],ArrowDown:[0,.25]}
  const d = offsets[event.key]
  if (!d) return
  event.preventDefault()
  event.stopPropagation()
  const [x,y] = vertices.value[index]
  move(index,x+d[0],y+d[1])
}
watch([mode,preset,scale], () => { selected.value = initialPixel() })
function reset() {
  scale.value = 1
  appendix.value = initial()
  lecture.value = lectureScene.triangles[0].vertices.map(v => [...v]) as Vertices
  preset.value = props.initialPreset
  mode.value = props.initialMode
  selected.value = initialPixel()
  centers.value = bounds.value = mask.value = true
}
</script>

<template>
  <section class="raster-lab">
    <div class="toolbar">
      <label>表示 <select v-model="mode"><option value="coverage">A　画素被覆</option><option value="edges">B　エッジ関数</option><option value="shared">C　左上規則</option><option value="weights">D　重心座標と深度</option></select></label>
      <label v-if="mode==='coverage'">三角形 <select v-model="preset"><option value="lecture">本編の面 A</option><option value="appendix">付録の直角三角形</option></select></label>
      <label>格子 <select v-model.number="scale"><option v-for="n in [1,2,3]" :key="n" :value="n">{{ n*baseWidth }} × {{ n*baseHeight }}</option></select></label>
      <label><input v-model="centers" type="checkbox">画素中心</label>
      <label><input v-model="bounds" type="checkbox">外接矩形</label>
      <label><input v-model="mask" type="checkbox">被覆マスク</label>
    </div>
    <div class="panel">
      <figure>
        <svg ref="diagram" :viewBox="[-.45,-.45,width+.9,height+.9].join(' ')" aria-label="投影された三角形、画素格子と選択した標本 P" @pointerdown="selectCell" @pointermove="pointerMove" @pointerup="dragging=null" @lostpointercapture="dragging=null">
          <g v-for="cell in cells" :key="cell.id">
            <rect :x="cell.x" :y="cell.y" width="1" height="1" :fill="mask && cell.owner ? (cell.owner === 'ABC' ? '#bbd8ec' : '#f9d8a6') : 'white'" stroke="#a9becc" stroke-width=".02"/>
            <circle v-if="centers" :cx="cell.x+.5" :cy="cell.y+.5" :r="cell.onShared ? .1 : .045" :fill="cell.onShared ? '#a74e00' : '#324958'"/>
          </g>
          <rect v-if="bounds" v-bind="box" fill="none" stroke="#70737c" stroke-width=".05" stroke-dasharray=".14 .08"/>
          <polygon :points="path(vertices)" fill="none" stroke="#005ba8" stroke-width=".07"/>
          <polygon v-if="mode==='shared'" :points="path(neighbor)" fill="none" stroke="#994600" stroke-width=".06" stroke-dasharray=".15 .05"/>
          <g v-for="(v,i) in vertices" :key="i" :tabindex="mode==='shared' ? undefined : 0" :aria-label="'頂点 '+names[i]+'。矢印キーで移動'" @keydown="nudge(i,$event)" @pointerdown.stop="startDrag(i,$event)">
            <circle :cx="v[0]" :cy="v[1]" r=".25" fill="transparent"/>
            <circle :cx="v[0]" :cy="v[1]" r=".09" fill="#005ba8"/>
            <text :x="v[0]+.10" :y="v[1]-.10" :style="{fontSize: .34*scale+'px'}" class="v-label">{{ names[i] }}</text>
          </g>
          <text v-if="mode==='shared'" :x="neighbor[1][0]+.1" :y="neighbor[1][1]+.16" :style="{fontSize: .34*scale+'px'}" class="v-label">D</text>
          <circle :cx="active.x+.5" :cy="active.y+.5" r=".21" fill="none" stroke="#8d1856" stroke-width=".07"/>
        </svg>
        <figcaption>{{ mode === 'shared' ? '実線は ABC、破線は BDC。共有辺上の標本は大きな点。' : '頂点 A・B・C をドラッグ、または Tab で選んで矢印キーで移動。' }}</figcaption>
      </figure>
      <div>
        <h3>標本 P = ({{ active.x+.5 }}, {{ active.y+.5 }})</h3>
        <label>画素 <input v-model.number="selected" type="range" min="0" :max="width*height-1"> ({{ active.x }}, {{ active.y }})</label>
        <p>左上原点、右に x、下に y。1 画素につき中心 1 点で判定します。</p>
        <p class="readout"><b>{{ active.owner ? (isLecture ? '面 A' : active.owner) : '背景' }}</b> ／ {{ cells.filter(cell => cell.owner).length }} 画素を被覆</p>
        <p v-if="!active.sample">3 頂点が一直線上にあり、面積が 0 です。</p>
        <template v-else-if="mode==='edges'">
          <p>各辺で内部を正にそろえた値。0 の場合は左上規則で境界を判定します。</p>
          <ul><li v-for="i in [2,0,1]" :key="i">E<sub>{{ edges[i] }}</sub> = {{ coordinate(active.sample.edges[i]) }} <small>（境界 {{ active.sample.included[i] ? '採用' : '除外' }}）</small></li></ul>
        </template>
        <template v-else-if="mode==='weights'">
          <p v-for="(v,i) in editable" :key="i"><label>z<sub>{{ names[i] }}</sub> <input v-model.number="v[2]" type="range" min="0" max="1" step=".05"> {{ v[2].toFixed(2) }}</label></p>
          <p>λ(A, B, C) = ({{ active.sample.weights.map(coordinate).join(', ') }})</p>
          <p>Σλz = <b>{{ coordinate(active.sample.depth) }}</b>{{ active.sample.covered ? '（候補深度）' : '（外部への外挿）' }}</p>
          <p>画面深度を線形補間。透視投影のテクスチャ座標などには w による補正が必要です。</p>
        </template>
        <template v-else-if="mode==='shared'">
          <p>ABC の B→C は右側の境界なので除外。BDC の C→B は左側の境界なので採用します。</p>
          <p>共有辺上の {{ cells.filter(cell => cell.onShared).length }} 点をクリックし、所有面を確かめてください。</p>
        </template>
        <p v-else>破線は頂点の最小・最大座標から作った外接矩形。頂点を動かし、矩形内で色が付く画素を調べてください。</p>
      </div>
    </div>
    <Playback v-model:step="selected" :max="width*height-1" @reset="reset"/>
  </section>
</template>

<style scoped>
.raster-lab { color:#203b4f; line-height:1.45 }
.toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:.5rem 1rem }
.panel { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); align-items:start; gap:1rem; margin:.8rem 0 }
figure { margin:0; min-width:0 } svg { display:block; width:100%; max-height:23rem; touch-action:none }
.v-label { font:bold .34px sans-serif; paint-order:stroke; stroke:white; stroke-width:.065px; fill:#153c59 }
g:focus-visible { outline:2px solid #a65100 }
figcaption,small { font-size:.89em } h3,p,ul { margin:.45rem 0 }
.readout { background:#edf4fa; padding:.5rem .65rem }
input[type=range] { max-width:8rem; vertical-align:middle }
@media(max-width:650px) { .panel { grid-template-columns:1fr } svg { max-height:18rem } }
</style>
