<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import { cubeEdges, cubeVertices } from '../../packages/cg-algorithms/src/geometry3d.ts'
import { projectParallel, projectPerspective } from '../../packages/cg-algorithms/src/projection.ts'
import { transformPoint } from '../../packages/cg-algorithms/src/matrix4.ts'
import { translationMatrix } from '../../packages/cg-algorithms/src/transforms3d.ts'
import type { Vec2 } from '../../packages/cg-algorithms/src/matrix4.ts'
import './lecture03.css'
defineProps<{ compact?: boolean }>()
const objectZ = ref(0), cameraDistance = ref(6), fov = ref(60)
const display = ref<'compare' | 'parallel' | 'perspective'>('compare')
const modes = computed(() => display.value === 'compare' ? ['parallel', 'perspective'] as const : [display.value])
const scene = computed(() => [-1.25, 1.25].map((x, i) => cubeVertices(1.4).map(point =>
  transformPoint(translationMatrix(x, 0, objectZ.value - i * 4 - cameraDistance.value), point))))
function points(mode: string, index: number): (Vec2 | null)[] {
  return scene.value[index].map(point => mode === 'parallel' ? projectParallel(point, .45) : projectPerspective(point, fov.value, 1))
}
const projections = computed(() => modes.value.map(mode => ({ mode, cubes: [points(mode, 0), points(mode, 1)] })))
const sx = (x: number) => 170 + 85 * x
const sy = (y: number) => 112 - 85 * y
function reset() { objectZ.value = 0; cameraDistance.value = 6; fov.value = 60; display.value = 'compare' }
</script>
<template>
  <DemoFrame class="l3-demo" :class="{ compact }" label="平行投影と透視投影" @reset="reset">
    <div class="l3-controls">
      <label>物体の z<input v-model.number="objectZ" aria-label="物体の z" type="range" min="-3" max="1" step="0.1"><output>{{ objectZ.toFixed(1) }}</output></label>
      <label>カメラ距離<input v-model.number="cameraDistance" aria-label="カメラ距離" type="range" min="6" max="12" step="0.1"><output>{{ cameraDistance.toFixed(1) }}</output></label>
      <label>FOV<input v-model.number="fov" aria-label="FOV" type="range" min="30" max="100" step="1"><output>{{ fov }}°</output></label>
      <label>表示<select v-model="display" aria-label="表示"><option value="compare">左右比較</option><option value="parallel">平行投影のみ</option><option value="perspective">透視投影のみ</option></select></label>
    </div>
    <div class="l3-columns" :class="{ single: display !== 'compare' }">
      <figure v-for="panel in projections" :key="panel.mode">
        <figcaption>{{ panel.mode === 'parallel' ? '平行投影（Parallel）' : '透視投影（Perspective）' }}</figcaption>
        <svg viewBox="0 0 340 255" role="img" :aria-label="`${panel.mode === 'parallel' ? '平行投影' : '透視投影'}による同じ大きさの立方体 A と B`">
          <rect x="1" y="1" width="338" height="253" rx="8" fill="#f5f8fc" stroke="#c7d4e6" />
          <path d="M20 112H320 M170 20V207" stroke="#c7d4e6" stroke-dasharray="3 4" />
          <g v-for="(cube, index) in panel.cubes" :key="index" :stroke="index === 0 ? '#1763a6' : '#9b551b'" fill="none" stroke-width="2.3" :stroke-dasharray="index ? '7 3' : undefined">
            <template v-for="([a, b], edge) in cubeEdges" :key="edge"><line v-if="cube[a] && cube[b]" :x1="sx(cube[a]![0])" :y1="sy(cube[a]![1])" :x2="sx(cube[b]![0])" :y2="sy(cube[b]![1])" /></template>
          </g>
          <text x="20" y="237" fill="#1763a6" style="font-size:15px">A（実線）近い</text><text x="193" y="237" fill="#9b551b" style="font-size:15px">B（破線）遠い</text>
        </svg>
      </figure>
    </div>
    <p class="l3-readout">一辺は両方 1.4。視点から中心まで：A = {{ (cameraDistance - objectZ).toFixed(1) }}、B = {{ (cameraDistance - objectZ + 4).toFixed(1) }}</p>
    <p class="l3-formula">平行：X = 0.45x、Y = 0.45y　／　透視：X = fx / d、Y = fy / d、f = 1 / tan(FOV / 2)</p>
    <p class="l3-note">右手系・カメラは +Z 側から −Z を見る。d = −z（カメラ座標）、縦 FOV、aspect = 1。Y は上向き、描画時に下向きへ反転。</p>
    <p class="l3-observe">距離を変えたとき、大きさが変わるのはどちら？ FOV を広げるとどう見える？</p>
  </DemoFrame>
</template>
<style scoped>
.single { grid-template-columns: minmax(0, 1fr); max-width: 560px; margin-inline: auto; }
figure svg { width: 100%; max-height: 260px; }
figcaption { font-weight: 650; margin-bottom: 5px; }
.compact figure svg { max-height: 185px; }
</style>
