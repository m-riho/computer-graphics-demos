<script setup lang="ts">
import { computed, ref } from 'vue'
import Playback from './Playback.vue'
import { makeScanlineTriangles, scanlineSpan, scanVisibleSpans } from '../../packages/cg-algorithms/src/visibility-labs.ts'
import { sampleTriangle, type VisibilityTriangle } from '../../packages/cg-algorithms/src/visibility-raster.ts'

type Mode = 'coverage' | 'visibility'
const props = withDefaults(defineProps<{initialMode?: Mode}>(), {initialMode:'coverage'})
const mode = ref<Mode>(props.initialMode), row = ref(2), column = ref(3)
const triangles = makeScanlineTriangles(), width = 7, height = 5
const y = computed(() => row.value + .5), x = computed(() => column.value + .5)
const activeFaces = computed(() => mode.value === 'coverage' ? triangles.slice(0,1) : triangles)
const faces = computed(() => activeFaces.value.map(face => ({...face, span:scanlineSpan(face.vertices,y.value)})))
const spans = computed(() => scanVisibleSpans(activeFaces.value, y.value))
const picked = computed(() => faces.value.flatMap(face => {
  if (!face.span || x.value < face.span[0] || x.value >= face.span[1]) return []
  const sample = sampleTriangle(face.vertices, [x.value,y.value])
  return sample ? [{id:face.id,depth:sample.depth}] : []
}))
const winner = computed(() => [...picked.value].sort((a,b) => a.depth-b.depth)[0]?.id ?? '背景')
const path = (face:VisibilityTriangle) => face.vertices.map(v => v[0]+','+v[1]).join(' ')
const color = (id:string) => id === 'A' ? '#005da5' : '#994700'
const fmt = (n:number) => Number(n.toFixed(2))
const chartX = (x:number) => 35 + x*52
const chartZ = (z:number) => 17 + z*11
const curves = computed(() => faces.value.flatMap(face => {
  if (!face.span) return []
  const [l,r] = face.span
  const a = sampleTriangle(face.vertices,[l,y.value]), b = sampleTriangle(face.vertices,[r,y.value])
  return a && b ? [{id:face.id,left:l,right:r,zl:a.depth,zr:b.depth}] : []
}))
const overlap = computed(() => {
  const [a,b] = faces.value
  if (!a?.span || !b?.span) return null
  const left = Math.max(a.span[0], b.span[0]), right = Math.min(a.span[1], b.span[1])
  return left < right ? [left, right] : null
})
function reset() { mode.value = props.initialMode; row.value = 2; column.value = 3 }
</script>

<template>
  <section class="scanline-lab">
    <div class="toolbar">
      <label>表示 <select v-model="mode"><option value="coverage">A　走査変換</option><option value="visibility">B　走査線隠面消去</option></select></label>
      <label>走査線 y = {{ y }} <input v-model.number="row" type="range" min="0" :max="height-1"></label>
      <label>標本 x = {{ x }} <input v-model.number="column" type="range" min="0" :max="width-1"></label>
    </div>
    <div class="panel">
      <figure>
        <svg viewBox="-.18 -.18 7.36 5.36" role="img" aria-label="水平な走査線、各面との交点、標本中心">
          <rect width="7" height="5" fill="white"/>
          <line v-for="i in width+1" :key="'x'+i" :x1="i-1" :x2="i-1" y1="0" y2="5" stroke="#bacbd5" stroke-width=".016"/>
          <line v-for="j in height+1" :key="'y'+j" x1="0" x2="7" :y1="j-1" :y2="j-1" stroke="#bacbd5" stroke-width=".016"/>
          <polygon v-for="face in faces" :key="face.id" :points="path(face)" :stroke="color(face.id)" :fill="color(face.id)" fill-opacity=".12" stroke-width=".055" :stroke-dasharray="face.id==='B' ? '.14 .06' : undefined"/>
          <line x1="0" x2="7" :y1="y" :y2="y" stroke="#25394c" stroke-width=".04" stroke-dasharray=".12 .07"/>
          <g v-for="span in spans" :key="span.left"><line :x1="span.left" :x2="span.right" :y1="y" :y2="y" :stroke="color(span.faceId)" stroke-width=".14"/></g>
          <g v-for="face in faces" :key="face.id">
            <template v-if="face.span"><circle v-for="(v,i) in face.span" :key="i" :cx="v" :cy="y" r=".10" :fill="i===0 ? color(face.id) : 'white'" :stroke="color(face.id)" stroke-width=".04"/></template>
          </g>
          <circle v-for="i in width" :key="i" :cx="i-.5" :cy="y" r=".052" fill="#122536"/>
          <circle :cx="x" :cy="y" r=".18" fill="none" stroke="#871653" stroke-width=".055"/>
          <template v-for="j in height" :key="j"><rect v-for="i in width" :key="i" :x="i-1" :y="j-1" width="1" height="1" fill="transparent" class="pick" @click="column=i-1;row=j-1"/></template>
        </svg>
        <figcaption>● 左交点を含む　○ 右交点を除く。小点は画素中心、輪は選択した標本。</figcaption>
      </figure>
      <div>
        <h3>面ごとの候補区間（Span）</h3>
        <p v-for="face in faces" :key="face.id"><b>面 {{ face.id }}</b>　{{ face.span ? fmt(face.span[0])+' ≤ x < '+fmt(face.span[1]) : 'この行に候補なし' }}</p>
        <template v-if="mode==='coverage'">
          <p>この行で塗る候補の x 座標</p>
          <p class="readout">{{ Array.from({length:width},(_,i) => i+.5).filter(v => faces[0].span && v >= faces[0].span[0] && v < faces[0].span[1]).join('、') || 'なし' }}</p>
        </template>
        <template v-else>
          <h3>深度と可視区間（Visible span）</h3>
          <svg viewBox="0 0 420 155" role="img" aria-label="横軸 x、下向き深度 z。走査線上の2面の深度と可視区間">
            <path d="M35 15 V116 H400" fill="none" stroke="#8298a6"/><text x="1" y="18">近</text><text x="1" y="109">遠</text><text x="403" y="120">x</text>
            <line :x1="chartX(x)" :x2="chartX(x)" y1="10" y2="137" stroke="#871653" stroke-dasharray="3 4"/>
            <g v-for="c in curves" :key="c.id">
              <line :x1="chartX(c.left)" :y1="chartZ(c.zl)" :x2="chartX(c.right)" :y2="chartZ(c.zr)" :stroke="color(c.id)" stroke-width="3" :stroke-dasharray="c.id==='B' ? '7 3' : undefined"/>
              <text :x="chartX(c.right)+3" :y="chartZ(c.zr)+4" :fill="color(c.id)">{{ c.id }}</text>
            </g>
            <g v-for="span in spans" :key="span.left"><rect :x="chartX(span.left)" y="124" :width="chartX(span.right)-chartX(span.left)" height="24" :fill="color(span.faceId)"/><text v-if="span.right-span.left>.37" :x="chartX((span.left+span.right)/2)" y="142" text-anchor="middle" fill="white">{{ span.faceId }}</text></g>
          </svg>
          <p>z<sub>A</sub>(x) = 1 + x、z<sub>B</sub>(x) = 4.5。<template v-if="overlap">重なる区間では x &lt; 3.5 で z<sub>A</sub> &lt; z<sub>B</sub>、x &gt; 3.5 で z<sub>B</sub> &lt; z<sub>A</sub>。等深度は先に処理する A。</template><template v-else>この行に重なる区間はありません。</template></p>
        </template>
        <p class="readout">P = ({{ x }}, {{ y }}) ／ <b>{{ winner }}</b><template v-if="mode==='visibility' && picked.length"> ／ {{ picked.map(p => 'z'+p.id+' = '+fmt(p.depth)).join('、') }}</template></p>
      </div>
    </div>
    <p><b>走査変換</b>は塗る候補の画素を決めます。<b>走査線隠面消去</b>は候補ごとの深度を比べ、見える面を決めます。小さい深度が手前、背景は ∞。</p>
    <Playback v-model:step="row" :max="height-1" @reset="reset"/>
  </section>
</template>

<style scoped>
.scanline-lab { color:#203b4f; line-height:1.45 }
.toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:.5rem 1rem }
.toolbar input { width:6rem; vertical-align:middle }
.panel { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1rem; margin:.8rem 0; align-items:start }
figure { margin:0 } svg { width:100%; max-height:23rem; display:block } svg text { font:16px sans-serif }
figcaption { font-size:.88em } h3,p { margin:.45rem 0 }
.readout { background:#edf4fa; padding:.5rem .65rem } .pick { cursor:crosshair }
@media(max-width:650px) { .panel { grid-template-columns:1fr } figure svg { max-height:17rem } }
</style>
