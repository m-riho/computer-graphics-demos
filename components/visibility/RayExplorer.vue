<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Vec3 } from '../../packages/cg-algorithms/src/matrix4.ts'
import { nearestPositiveHit, pointOnRay, primaryRay, sphereIntersections, triangleIntersection, type TriangleVertices } from '../../packages/cg-algorithms/src/visibility-rays.ts'
import Playback from './Playback.vue'

const width = 7, height = 5
const pixel = ref(17)
const eyeY = ref(0)
const sphereX = ref(5), sphereY = ref(0), radius = ref(2)
const triangleX = ref(8), triangleY = ref(0)
const step = ref(0)
const stages = ['画素中心にレイを通す', '球 S の交点を求める', '三角形 T の交点を求める', '最小の正の t を選ぶ']
const eye = computed<Vec3>(() => [0, eyeY.value, 0])
const sphere = computed(() => ({center: [sphereX.value, sphereY.value, 0] as Vec3, radius: radius.value}))
const triangle = computed<TriangleVertices>(() => [
  [triangleX.value, triangleY.value - 2.4, -1.7],
  [triangleX.value, triangleY.value + 2.4, -1.7],
  [triangleX.value, triangleY.value, 2.3],
])
const pixels = computed(() => Array.from({length: width*height}, (_, i) => {
  const x = i % width, y = Math.floor(i / width)
  const plane: Vec3 = [1, eyeY.value + (x+0.5-width/2)*0.18, (height/2-y-0.5)*0.18]
  const ray = primaryRay(eye.value, plane)
  const sphereResult = sphereIntersections(ray, sphere.value)
  const triangleHit = triangleIntersection(ray, triangle.value)
  const hits = sphereResult.roots.map(t => ({ id:'S', t }))
  if (triangleHit) hits.push({ id:'T', t:triangleHit.t })
  return {x,y,plane,ray,sphereResult,triangleHit,hits,visible:nearestPositiveHit(hits)}
}))
const current = computed(() => pixels.value[pixel.value])
const marks = computed(() => current.value.hits.filter(h => h.t > 0 && (h.id === 'S' ? step.value >= 1 : step.value >= 2))
  .map(h => ({...h, point: pointOnRay(current.value.ray, h.t)})))
const end = computed(() => pointOnRay(current.value.ray, 11/current.value.ray.direction[0]))
// XY 平面上への正投影。縦横同じ倍率で球の輪郭を描く。
const sx = (x: number) => 25 + x*30
const sy = (y: number) => 126 - y*30
const fmt = (n: number) => Number(n.toFixed(3)).toString()
function navigate(e: KeyboardEvent) {
  const delta:Record<string,[number,number]> = { ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1] }
  if (e.key in delta) {
    e.preventDefault()
    e.stopPropagation()
    const [dx,dy] = delta[e.key]
    const x = Math.max(0, Math.min(width-1,current.value.x+dx))
    const y = Math.max(0, Math.min(height-1,current.value.y+dy))
    pixel.value = y*width+x
    const grid = (e.currentTarget as HTMLElement).parentElement
    grid?.querySelectorAll('button')[pixel.value]?.focus()
  }
}
function reset() {
  pixel.value = 17
  eyeY.value = sphereY.value = triangleY.value = step.value = 0
  sphereX.value = 5
  radius.value = 2
  triangleX.value = 8
}
</script>

<template>
  <section class="ray-lab">
    <div class="controls">
      <label>視点 y {{ eyeY }} <input v-model.number="eyeY" type="range" min="-2" max="2" step=".25"></label>
      <label>球 x {{ sphereX }} <input v-model.number="sphereX" type="range" min=".5" max="9" step=".25"></label>
      <label>球 y {{ sphereY }} <input v-model.number="sphereY" type="range" min="-2" max="2" step=".25"></label>
      <label>半径 r {{ radius }} <input v-model.number="radius" type="range" min=".5" max="2.5" step=".25"></label>
      <label>三角形 x {{ triangleX }} <input v-model.number="triangleX" type="range" min="2" max="10" step=".25"></label>
      <label>三角形 y {{ triangleY }} <input v-model.number="triangleY" type="range" min="-2" max="2" step=".25"></label>
    </div>
    <div class="work">
      <figure class="scene">
        <figcaption>一次レイと物体（xy 面への正投影）</figcaption>
        <svg viewBox="0 0 365 250" role="img" aria-label="視点O、視平面、球S、三角形Tの位置とレイ">
          <line :x1="sx(1)" :x2="sx(1)" :y1="sy(eyeY + .75)" :y2="sy(eyeY - .75)" stroke="#005bac" stroke-width="4"/>
          <text :x="sx(1)" :y="sy(eyeY - .75)+16">視平面</text>
          <circle :cx="sx(sphereX)" :cy="sy(sphereY)" :r="radius*30" fill="#d8f0e8" stroke="#21836a" stroke-width="2"/>
          <text :x="sx(sphereX)" :y="sy(sphereY)+16">S</text>
          <line :x1="sx(triangleX)" :x2="sx(triangleX)" :y1="sy(triangleY+2.4)" :y2="sy(triangleY-2.4)" stroke="#c76a22" stroke-width="4"/>
          <text :x="sx(triangleX)+5" :y="sy(triangleY)+18">T</text>
          <line :x1="sx(0)" :y1="sy(eyeY)" :x2="sx(end[0])" :y2="sy(end[1])" stroke="#264761" stroke-width="1.8" stroke-dasharray="5 3"/>
          <line v-if="step === 3 && current.visible" :x1="sx(0)" :y1="sy(eyeY)" :x2="sx(pointOnRay(current.ray,current.visible.t)[0])" :y2="sy(pointOnRay(current.ray,current.visible.t)[1])" stroke="#005bac" stroke-width="3"/>
          <circle :cx="sx(0)" :cy="sy(eyeY)" r="4" fill="#203c52"/><text :x="sx(0)-10" :y="sy(eyeY)-9">O</text>
          <circle :cx="sx(1)" :cy="sy(current.plane[1])" r="3.5" fill="#005bac"/>
          <g v-for="(m,i) in marks" :key="m.id+i">
            <circle :cx="sx(m.point[0])" :cy="sy(m.point[1])" :r="step===3 && current.visible?.t===m.t ? 6 : 4" fill="white" stroke="#005bac" stroke-width="2"/>
            <text :x="sx(m.point[0])" :y="sy(m.point[1])-(i%2 ? -19 : 8)" text-anchor="middle">{{ fmt(m.t) }}</text>
          </g>
        </svg>
      </figure>
      <div class="image-plane">
        <strong>画素中心を選択</strong>
        <div class="grid" aria-label="視平面の画素">
          <button v-for="(p,i) in pixels" :key="i" type="button" :class="[p.visible?.id, {selected:i===pixel}]" :tabindex="i === pixel ? 0 : -1" :aria-pressed="i === pixel" :aria-label="'画素 ('+p.x+', '+p.y+') '+(p.visible?.id ?? '背景')" @click="pixel=i" @keydown="navigate">{{ p.visible?.id ?? '·' }}</button>
        </div>
        <p>選択 ({{ current.x }}, {{ current.y }})<br>S 球 ／ T 三角形 ／ · 背景</p>
      </div>
    </div>
    <p class="status"><strong>{{ stages[step] }}</strong>　P(t) = O + tD、D = ({{ current.ray.direction.map(fmt).join(', ') }})。D は単位ベクトルなので t は距離を表します。</p>
    <div class="hits">
      <span :class="{active:step===1}">球 S の t　{{ current.sphereResult.roots.map(fmt).join('、') || '交点なし' }}</span>
      <span :class="{active:step===2}">三角形 T の t　{{ current.triangleHit ? fmt(current.triangleHit.t) : '交点なし' }}</span>
      <strong :class="{active:step===3}">可視物体　{{ current.visible ? current.visible.id + '（最小の正の t = ' + fmt(current.visible.t) + '）' : '背景（正の交点なし）' }}</strong>
    </div>
    <Playback v-model:step="step" :max="3" @reset="reset"/>
    <details><summary>交差式と重心座標を確認</summary>
      <p>球　a t² + b t + c = 0　(a, b, c) = ({{ [current.sphereResult.a,current.sphereResult.b,current.sphereResult.c].map(fmt).join(', ') }})、判別式 = {{ fmt(current.sphereResult.discriminant) }}。</p>
      <p>三角形　{{ current.triangleHit ? '交点の重心座標 λ = (' + current.triangleHit.weights.map(fmt).join(', ') + ')' : 'このレイは三角形と交差しません。' }}</p>
    </details>
  </section>
</template>

<style scoped>
.ray-lab {color:#193b53;line-height:1.5;font-size:1rem}
.controls,.work,.hits {display:flex;flex-wrap:wrap;align-items:center;gap:.55rem 1rem}.controls label {display:inline-flex;align-items:center;gap:.35rem;font-variant-numeric:tabular-nums}.controls input {width:5.5rem}
.work {align-items:stretch;margin:.75rem 0}.scene,.image-plane {margin:0;padding:.65rem;border:1px solid #c2d5e3;border-radius:.5rem;background:#f6f9fb;min-width:0}.scene {flex:1.7 1 18rem}.image-plane {flex:1 1 12rem}
figcaption,.image-plane strong,.status strong {color:#004e8a;font-weight:700}svg {display:block;width:100%;max-height:16rem}svg text {font-size:12px;fill:#183950;font-weight:600;paint-order:stroke;stroke:#fff;stroke-width:2px}
.grid {display:grid;grid-template-columns:repeat(7,minmax(0,1fr));max-width:15rem;margin-top:.5rem}.grid button {border:1px solid #a6b9c9;border-radius:0;background:white;color:#17364b;padding:0;aspect-ratio:1;min-width:0;font-size:.82rem}.grid button.S {background:#c6eadf}.grid button.T {background:#ffe2bc}.grid button.selected {outline:3px solid #005bac;outline-offset:-3px;font-weight:800}
.image-plane p,.status,details p {margin:.5rem 0}.hits {margin:.55rem 0}.hits>* {padding:.2rem .4rem;border-bottom:2px solid transparent}.hits .active {border-color:#005bac;background:#edf5ff}details {margin-top:.55rem}summary {cursor:pointer}
</style>
