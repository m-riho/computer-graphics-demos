<script setup lang="ts">
import {computed, ref} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import WireScene from './WireScene.vue'
import MatrixReadout from './MatrixReadout.vue'
import {multiplyMatrix4, transformPoint, type Vec3} from '../../packages/cg-algorithms/src/matrix4.ts'
import {translationMatrix, rotationZMatrix} from '../../packages/cg-algorithms/src/transforms3d.ts'
import {cubeVertices, projectDiagram} from '../../packages/cg-algorithms/src/geometry3d.ts'

defineProps<{compact?: boolean}>()
const angle = ref(60), offset = ref<Vec3>([2,0,0])
const axes = ['x','y','z']
const rotation = computed(() => rotationZMatrix(angle.value))
const translation = computed(() => translationMatrix(...offset.value))
const tr = computed(() => multiplyMatrix4(translation.value, rotation.value))
const rt = computed(() => multiplyMatrix4(rotation.value, translation.value))
const vertices = cubeVertices(1.5)
const before = vertices.map(projectDiagram)
const panels = computed(() => [
  {title:'回転 → 移動', formula:'M = T R', matrix:tr.value},
  {title:'移動 → 回転', formula:'M = R T', matrix:rt.value},
].map(panel => ({...panel, points:vertices.map(p => projectDiagram(transformPoint(panel.matrix,p))), center:transformPoint(panel.matrix,[0,0,0])})))
const axisPoints = ([[0,0,0],[2,0,0],[0,2,0],[0,0,2]] as Vec3[]).map(projectDiagram)
const tuple = (p: readonly number[]) => `(${p.map(v => v.toFixed(2)).join(', ')})`
function reset() { angle.value=60; offset.value=[2,0,0] }
</script>
<template>
<DemoFrame label="同じ変換でも、順序で結果が変わる" class="l3-demo order-demo" :class="{compact}" @reset="reset">
  <div class="l3-controls">
    <label>Z軸回転 θ<input v-model.number="angle" type="range" min="-180" max="180" step="5" aria-label="Z軸回転角"><output>{{angle}}°</output></label>
    <label v-for="(axis,i) in axes" :key="axis">t{{axis}}<input v-model.number="offset[i]" type="range" min="-3" max="3" step=".1" :aria-label="`移動量 t${axis}`"><output>{{offset[i].toFixed(1)}}</output></label>
  </div>
  <div class="l3-columns">
    <div v-for="panel in panels" :key="panel.title" class="order-panel">
      <strong>{{panel.title}} · {{panel.formula}}</strong>
      <WireScene :points="panel.points" :ghost="before" :axis-points="axisPoints" :extent="6.6" :title="`${panel.title}（3D模式図）`"/>
      <p class="l3-readout">中心：{{tuple(panel.center)}}</p>
      <MatrixReadout :matrix="panel.matrix" :label="panel.formula"/>
    </div>
  </div>
  <p class="l3-observe">一般に TR ≠ RT。右側は、移動した中心も座標原点のまわりを回ります。左側は、原点で回してから中心を移します。</p>
  <p v-if="!compact" class="l3-note">列ベクトルでは右側の行列から適用します。破線は変換前。θ = 0°や移動量が0など、結果が一致する場合もあります。</p>
</DemoFrame>
</template>
<style scoped>
.order-panel{min-width:0}.order-panel>strong{display:block;text-align:center}.order-demo .l3-readout{margin:4px 0;overflow-wrap:anywhere}.order-demo.compact :deep(.l3-wire){max-height:165px}.order-demo.compact .l3-observe{font-size:16px}.order-demo.compact :deep(.l3-matrix-wrap){font-size:16px}@media(max-width:600px){.order-demo .l3-columns{grid-template-columns:1fr}.order-demo.compact :deep(.l3-wire){max-height:none}}
</style>
