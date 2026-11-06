<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { cullingSections, inspectCullingScene, type CullingShape } from '../../packages/cg-algorithms/src/visibility-culling.ts'
import type { Vec3 } from '../../packages/cg-algorithms/src/matrix4.ts'
import Playback from './Playback.vue'

const props = withDefaults(defineProps<{ initialPreset?: CullingShape }>(), { initialPreset: 'convex' })
const shape = ref<CullingShape>(props.initialPreset)
const eyeY = ref(0)
const reverse = ref(false)
const cull = ref(true)
const normals = ref(true)
const step = ref(0)
const eye = computed<Vec3>(() => [-5, eyeY.value, 0])
const loops = computed(() => cullingSections(shape.value))
const faces = computed(() => {
  const walls = inspectCullingScene(shape.value, eye.value, reverse.value)
  // 最初に視点側の外壁、凹形状・複数物体では続いて奥の壁を調べる。
  const priority = shape.value === 'concave' ? ['A8','A4'] : ['A4','B4']
  return [...priority.flatMap(id => walls.filter(f => f.id === id)), ...walls.filter(f => !priority.includes(f.id))]
})
const chosen = computed(() => faces.value[step.value] ?? faces.value[0])
const normalMarker = useId()
const viewMarker = useId()
const sx = (x: number) => 214 + x * 36
const sy = (y: number) => 108 - y * 36
const viewBox = computed(() => {
  const eyeScreenY = sy(eyeY.value)
  const top = Math.min(0, eyeScreenY - 18)
  const bottom = Math.max(214, eyeScreenY + 26)
  return `0 ${top} 332 ${bottom - top}`
})
const vector = (v: Vec3) => '(' + v.map(n => Number(n.toFixed(2))).join(', ') + ')'
const facing = { front: '表向き', back: '裏向き', edge: '境界（真横）' } as const
function reset() {
  shape.value = props.initialPreset
  eyeY.value = step.value = 0
  reverse.value = false
  cull.value = normals.value = true
}
</script>

<template>
  <section class="culling-lab">
    <div class="controls">
      <label>形状 <select v-model="shape" aria-label="形状" @change="step = 0"><option value="convex">閉じた凸形状</option><option value="concave">凹形状（U字）</option><option value="multiple">複数物体</option></select></label>
      <label>視点 y {{ eyeY.toFixed(1) }} <input v-model.number="eyeY" type="range" min="-5" max="5" step="0.1"></label>
      <label><input v-model="reverse" type="checkbox"> 頂点順を反転</label>
      <label><input v-model="cull" type="checkbox"> Culling ON</label>
      <label><input v-model="normals" type="checkbox"> 法線 n</label>
    </div>
    <div class="work">
      <figure>
        <figcaption>柱体の中央断面（z = 0）</figcaption>
        <svg :viewBox="viewBox" role="img" :aria-label="chosen.id + ' の面中心と視点の断面図'">
          <defs>
            <marker :id="normalMarker" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#086352"/></marker>
            <marker :id="viewMarker" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#005bac"/></marker>
          </defs>
          <polygon v-for="(loop,i) in loops" :key="i" :points="loop.map(([x,y]) => sx(x)+','+sy(y)).join(' ')" fill="#e8eff4" stroke="#bfccd6" stroke-width="1"/>
          <g v-for="f in faces.filter(f => !cull || f.orientation === 'front')" :key="f.id">
            <line :x1="sx(f.vertices[0][0])" :y1="sy(f.vertices[0][1])" :x2="sx(f.vertices[1][0])" :y2="sy(f.vertices[1][1])" :stroke="f.id === chosen.id ? '#b8530d' : '#254d6b'" :stroke-dasharray="f.orientation === 'front' ? undefined : '4 3'" stroke-width="3"/>
            <line v-if="normals" :x1="sx(f.center[0])" :y1="sy(f.center[1])" :x2="sx(f.center[0]+0.65*f.normal[0])" :y2="sy(f.center[1]+0.65*f.normal[1])" stroke="#086352" stroke-width="2" :marker-end="'url(#'+normalMarker+')'"/>
          </g>
          <line :x1="sx(chosen.center[0])" :y1="sy(chosen.center[1])" :x2="sx(eye[0]) + 5" :y2="sy(eye[1])" stroke="#005bac" stroke-width="1.6" stroke-dasharray="5 4" :marker-end="'url(#'+viewMarker+')'"/>
          <circle :cx="sx(eye[0])" :cy="sy(eye[1])" r="4" fill="#173b56"/>
          <text :x="sx(eye[0])" :y="sy(eye[1])+18" text-anchor="middle">視点</text>
          <circle :cx="sx(chosen.center[0])" :cy="sy(chosen.center[1])" r="4" fill="#b8530d"/>
          <text :x="sx(chosen.center[0])+5" :y="sy(chosen.center[1])-8" class="face-label">{{ chosen.id }}</text>
        </svg>
        <small>実線は表向きの候補、青い破線は面中心から視点への v。</small>
      </figure>
      <div class="readout">
        <label>注目する側面 <select v-model.number="step" aria-label="注目する側面"><option v-for="(face,i) in faces" :key="face.id" :value="i">{{ face.id }}</option></select></label>
        <p>法線 n = {{ vector(chosen.normal) }}<br>視線 v = {{ vector(chosen.view) }}</p>
        <strong>n·v = {{ Number(chosen.product.toFixed(2)) }} ／ {{ facing[chosen.orientation as keyof typeof facing] }}</strong>
        <p>描画候補　{{ !cull || chosen.orientation === 'front' ? '残す' : '除外' }}<br>中心への遮蔽　{{ chosen.blocker ? chosen.blocker + ' が手前' : 'なし' }}</p>
      </div>
    </div>
    <Playback v-model:step="step" :max="faces.length - 1" @reset="reset"/>
    <p class="note">頂点順が外向きなら n は外向きです。順序を反転すると n も反転します。画面上の CW／CCW は座標軸と API の設定に依存します。凹形状の A4 を選び、A8 に遮られるか調べましょう。</p>
  </section>
</template>

<style scoped>
.culling-lab {color:#193b53;font-size:1rem;line-height:1.55}
.controls,.work {display:flex;flex-wrap:wrap;gap:.65rem 1.25rem;align-items:center}
.controls label {display:inline-flex;gap:.35rem;align-items:center}.controls input[type=range]{max-width:7rem}
.work {margin:.8rem 0;align-items:stretch}.work figure,.readout {margin:0;border:1px solid #c2d5e3;border-radius:.5rem;padding:.7rem;background:#f6f9fb}
.work figure {flex:1.6 1 19rem}.readout {flex:1 1 14rem}.readout p {margin:.55rem 0}
svg {display:block;width:100%;max-height:18rem}svg text {font-size:12px;fill:#15374f}.face-label {paint-order:stroke;stroke:white;stroke-width:3px}
figcaption,.readout strong {font-weight:700;color:#004e8a}.note,small {color:#435c71}.note {margin:.6rem 0}select {max-width:100%}
</style>
