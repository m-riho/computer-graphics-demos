<script setup lang="ts">
import {computed, ref} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import WireScene from './WireScene.vue'
import MatrixReadout from './MatrixReadout.vue'
import {transformPoint, type Vec3} from '../../packages/cg-algorithms/src/matrix4.ts'
import {translationMatrix, scaleMatrix, rotationXMatrix, rotationYMatrix, rotationZMatrix} from '../../packages/cg-algorithms/src/transforms3d.ts'
import {cubeVertices, projectDiagram} from '../../packages/cg-algorithms/src/geometry3d.ts'

defineProps<{compact?: boolean}>()
type Mode = 'translation' | 'scale' | 'rotationX' | 'rotationY' | 'rotationZ'
const mode = ref<Mode>('translation')
const translation = ref<Vec3>([1, 0, 0]), scale = ref<Vec3>([1, 1, 1]), angle = ref(30)
const axes = ['x', 'y', 'z']
const modes: {value: Mode; label: string}[] = [
  {value:'translation', label:'平行移動 / Translation'}, {value:'scale', label:'拡大縮小 / Scale'},
  {value:'rotationX', label:'X軸回転 / Rotation X'}, {value:'rotationY', label:'Y軸回転 / Rotation Y'},
  {value:'rotationZ', label:'Z軸回転 / Rotation Z'},
]
const matrix = computed(() => {
  if (mode.value === 'translation') return translationMatrix(...translation.value)
  if (mode.value === 'scale') return scaleMatrix(...scale.value)
  if (mode.value === 'rotationX') return rotationXMatrix(angle.value)
  if (mode.value === 'rotationY') return rotationYMatrix(angle.value)
  return rotationZMatrix(angle.value)
})
const vertices = cubeVertices()
const before = vertices.map(projectDiagram)
const after = computed(() => vertices.map(p => projectDiagram(transformPoint(matrix.value, p))))
const basis: Vec3[] = [[0,0,0],[2,0,0],[0,2,0],[0,0,2]]
const axisPoints = basis.map(projectDiagram)
const selected = computed(() => transformPoint(matrix.value, vertices[6]))
const tuple = (p: readonly number[]) => `(${p.map(v => v.toFixed(2)).join(', ')})`
function reset() { mode.value='translation'; translation.value=[1,0,0]; scale.value=[1,1,1]; angle.value=30 }
</script>

<template>
<DemoFrame label="変換を動かして、4×4行列を見る" class="l3-demo matrix-demo" :class="{compact}" @reset="reset">
  <div class="l3-controls">
    <label>変換<select v-model="mode" aria-label="変換の種類"><option v-for="item in modes" :key="item.value" :value="item.value">{{item.label}}</option></select></label>
  </div>
  <div class="l3-controls">
    <template v-if="mode==='translation'"><label v-for="(axis,i) in axes" :key="axis">t{{axis}}<input v-model.number="translation[i]" type="range" min="-2" max="2" step=".1" :aria-label="`平行移動 t${axis}`"><output>{{translation[i].toFixed(1)}}</output></label></template>
    <template v-else-if="mode==='scale'"><label v-for="(axis,i) in axes" :key="axis">s{{axis}}<input v-model.number="scale[i]" type="range" min=".2" max="2" step=".1" :aria-label="`拡大率 s${axis}`"><output>{{scale[i].toFixed(1)}}</output></label></template>
    <label v-else>回転角 θ<input v-model.number="angle" type="range" min="-180" max="180" step="5" aria-label="回転角"><output>{{angle}}°</output></label>
  </div>
  <div class="l3-columns">
    <div><WireScene :points="after" :ghost="before" :axis-points="axisPoints" :selected="6" :extent="4.8" title="実線：変換後 ／ 破線：変換前（3D模式図）"/><p class="l3-readout">頂点6：{{tuple(vertices[6])}} → {{tuple(selected)}}</p></div>
    <div><MatrixReadout :matrix="matrix" label="変換行列 M"/><p class="l3-formula">p′ = M p、p = (x, y, z, 1)ᵀ</p><p class="l3-note">同次座標の最後の成分を1にすると、平行移動も4×4行列の掛け算で表せます。移動量は右端の列です。</p></div>
  </div>
  <p class="l3-observe">破線の立方体と比べよう。回転は座標原点を通る選択軸のまわり。右手系・列ベクトルです。</p>
</DemoFrame>
</template>
<style scoped>
.matrix-demo .l3-readout{overflow-wrap:anywhere}.matrix-demo .l3-controls label{flex-wrap:wrap}.matrix-demo.compact .l3-note{font-size:16px}.matrix-demo.compact .l3-observe{font-size:17px}@media(max-width:600px){.matrix-demo .l3-columns{grid-template-columns:1fr}.matrix-demo select{max-width:100%}}
</style>
