<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import { projectDiagram } from '../../packages/cg-algorithms/src/geometry3d.ts'
import { projectPerspective } from '../../packages/cg-algorithms/src/projection.ts'
import type { Vec3 } from '../../packages/cg-algorithms/src/matrix4.ts'
import './lecture03.css'
defineProps<{ compact?: boolean }>()
const x = ref(1), y = ref(1), z = ref(-3)
const point = computed<Vec3>(() => [x.value, y.value, z.value])
const projected = computed(() => projectPerspective(point.value, 90, 1, .1))
const inScreen = computed(() => projected.value !== null && projected.value.every(value => Math.abs(value) <= 2))
// Enlarge the depth axis only in this schematic so P and the camera remain distinct.
function diagram(point: Vec3) { const p = projectDiagram([point[0], point[1], point[2] * 3]); return [190 + p[0] * 20, 80 - p[1] * 20] }
const marker = computed(() => diagram(point.value))
const plane = [[-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1]] as Vec3[]
const planeMarker = computed(() => projected.value && projected.value.every(value => Math.abs(value) <= 1) ? diagram([projected.value[0], projected.value[1], -1]) : null)
const planePath = plane.map(point => diagram(point).join(',')).join(' ')
const camera = diagram([0,0,0])
const forward = diagram([0,0,-6])
function reset() { x.value = 1; y.value = 1; z.value = -3 }
</script>
<template>
  <DemoFrame class="l3-demo" :class="{ compact }" label="3D の点を 2D に映す" @reset="reset">
    <div class="l3-controls">
      <label>x<input v-model.number="x" aria-label="点の x" type="range" min="-2" max="2" step="0.1"><output>{{ x.toFixed(1) }}</output></label>
      <label>y<input v-model.number="y" aria-label="点の y" type="range" min="-2" max="2" step="0.1"><output>{{ y.toFixed(1) }}</output></label>
      <label>z<input v-model.number="z" aria-label="点の z" type="range" min="-6" max="1" step="0.1"><output>{{ z.toFixed(1) }}</output></label>
    </div>
    <div class="l3-columns">
      <figure><figcaption>3D 空間（カメラ座標の模式図）</figcaption>
        <svg viewBox="0 0 340 260" role="img" aria-label="視点 C、投影面 z=-1、点 P の位置関係">
          <rect x="1" y="1" width="338" height="258" rx="8" fill="#f5f8fc" stroke="#c7d4e6" />
          <line :x1="camera[0]" :y1="camera[1]" :x2="forward[0]" :y2="forward[1]" stroke="#8e9bae" stroke-dasharray="5 4" />
          <polygon :points="planePath" fill="#c5def7" fill-opacity=".6" stroke="#1763a6" />
          <line :x1="camera[0]" :y1="camera[1]" :x2="marker[0]" :y2="marker[1]" stroke="#9b551b" stroke-width="2" />
          <circle v-if="planeMarker" :cx="planeMarker[0]" :cy="planeMarker[1]" r="4" fill="#1763a6" /><text v-if="planeMarker" :x="planeMarker[0] + 6" :y="planeMarker[1] + 17" style="font-size:14px">P′</text>
          <circle :cx="camera[0]" :cy="camera[1]" r="5" fill="#172f4e" /><text :x="camera[0] + 8" :y="camera[1] - 8" style="font-size:15px">視点 C (0,0,0)</text>
          <circle :cx="marker[0]" :cy="marker[1]" r="6" fill="#9b551b" /><text :x="marker[0] + 9" :y="marker[1] - 8" style="font-size:16px">P</text>
          <text x="16" y="232" style="font-size:15px">青い面：z = −1（d = 1）</text><text x="16" y="251" style="font-size:14px">カメラ前方は −Z。図は縮尺を簡略化。</text>
        </svg>
      </figure>
      <figure><figcaption>2D スクリーン（Y 上向き）</figcaption>
        <svg viewBox="0 0 340 260" role="img" aria-label="透視投影された点の X Y 座標">
          <rect x="1" y="1" width="338" height="258" rx="8" fill="#f5f8fc" stroke="#c7d4e6" />
          <rect x="60" y="20" width="220" height="220" fill="none" stroke="#c7d4e6" />
          <path d="M40 130H302 M170 245V12" fill="none" stroke="#8e9bae" />
          <text x="305" y="134" style="font-size:16px">X</text><text x="177" y="17" style="font-size:16px">Y</text><text x="176" y="146" style="font-size:14px">0</text>
          <g v-if="projected && inScreen"><line :x1="170" :y1="130" :x2="170 + 55 * projected[0]" :y2="130 - 55 * projected[1]" stroke="#9b551b" stroke-dasharray="4 3" /><circle :cx="170 + 55 * projected[0]" :cy="130 - 55 * projected[1]" r="6" fill="#9b551b" /><text :x="181 + 55 * projected[0]" :y="122 - 55 * projected[1]" style="font-size:16px">P′</text></g>
          <text v-else x="170" y="76" text-anchor="middle" style="font-size:16px">{{ projected ? 'P′ は表示範囲の外' : '投影を停止しています' }}</text>
          <text x="18" y="253" style="font-size:13px">枠の範囲：−2 ≤ X, Y ≤ 2</text>
        </svg>
      </figure>
    </div>
    <div class="l3-readout" aria-live="polite">P = ({{ x.toFixed(1) }}, {{ y.toFixed(1) }}, {{ z.toFixed(1) }})、d = −z = {{ (-z).toFixed(1) }}
      <template v-if="projected"><br>X = {{ x.toFixed(1) }} / {{ (-z).toFixed(1) }} = {{ projected[0].toFixed(3) }}、Y = {{ y.toFixed(1) }} / {{ (-z).toFixed(1) }} = {{ projected[1].toFixed(3) }}</template>
      <template v-else><br>d &lt; 0.1：視点に近すぎる、または後方のため投影しません。</template>
    </div>
    <p class="l3-note">FOV = 90°、aspect = 1、f = 1 の透視投影：X = x/d、Y = y/d。カメラ前方が −Z なので分母は −z。画面描画では Y の符号を反転します。</p>
  </DemoFrame>
</template>
<style scoped>
figure svg { width: 100%; max-height: 260px; }
figcaption { font-weight: 650; margin-bottom: 5px; }
.compact figure svg { max-height: 205px; }
</style>
