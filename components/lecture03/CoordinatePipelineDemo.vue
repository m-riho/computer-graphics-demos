<script setup lang="ts">
import {computed, ref} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import WireScene from './WireScene.vue'
import MatrixReadout from './MatrixReadout.vue'
import {identityMatrix, multiplyMatrix4, type Vec3, type Vec2} from '../../packages/cg-algorithms/src/matrix4.ts'
import {translationMatrix, rotationYMatrix} from '../../packages/cg-algorithms/src/transforms3d.ts'
import {cameraMatrix, inverseRigidTransform} from '../../packages/cg-algorithms/src/camera.ts'
import {cubeVertices, cubeEdges, projectDiagram, coordinatePipeline} from '../../packages/cg-algorithms/src/geometry3d.ts'

defineProps<{compact?: boolean}>()
const stage = ref(0), selected = ref(6), modelX = ref(1), modelAngle = ref(25), cameraZ = ref(7)
const stages = ['Local','World','Camera','Projected','Screen']
const width=640, height=400
const model = computed(() => multiplyMatrix4(translationMatrix(modelX.value,0,0),rotationYMatrix(modelAngle.value)))
const camera = computed(() => cameraMatrix([0,0,cameraZ.value]))
const view = computed(() => inverseRigidTransform(camera.value))
const vertices = cubeVertices()
const pipeline = computed(() => vertices.map(p => coordinatePipeline(p,model.value,camera.value,60,width,height)))
const tracked = computed(() => pipeline.value[selected.value])
const axisPoints = ([[0,0,0],[2,0,0],[0,2,0],[0,0,2]] as Vec3[]).map(projectDiagram)
const points = computed(() => pipeline.value.map(p => {
  if (stage.value === 0) return projectDiagram(p.local)
  if (stage.value === 1) return projectDiagram(p.world)
  if (stage.value === 2) return projectDiagram(p.camera)
  return p.projected
}))
const activeMatrix = computed(() => stage.value===1 ? model.value : stage.value===2 ? view.value : identityMatrix())
const applied = computed(() => [
  '物体固有の座標。まだ変換しません。',
  'Modeling：p_world = M p_local',
  'Viewing：p_camera = V p_world',
  'Projection：d = −z_camera > 0 で透視除算',
  'Viewport：NDC → 640 × 400 px（y下向き）',
][stage.value])
const tuple = (p: readonly number[] | null) => p ? `(${p.map(v => v.toFixed(2)).join(', ')})` : '投影範囲外'
const screenEdges = computed(() => cubeEdges.flatMap(([a,b]) => {
  const start=pipeline.value[a].screen, end=pipeline.value[b].screen
  return start && end ? [{start,end,key:`${a}-${b}`}] : []
}))
const screenPoints = computed(() => pipeline.value.map((p,index) => ({point:p.screen,index})).filter((p): p is {point:Vec2;index:number} => p.point !== null))
function reset() { stage.value=0; selected.value=6; modelX.value=1; modelAngle.value=25; cameraZ.value=7 }
</script>
<template>
<DemoFrame label="1つの頂点を、5つの座標系で追う" class="l3-demo pipeline-demo" :class="{compact}" @reset="reset">
  <div class="l3-buttons pipeline-steps" aria-label="座標系の段階">
    <button v-for="(name,i) in stages" :key="name" :aria-pressed="stage===i" @click="stage=i">{{i+1}}. {{name}}</button>
  </div>
  <div class="l3-controls">
    <label>追跡頂点<select v-model.number="selected" aria-label="追跡する頂点"><option v-for="(_,i) in vertices" :key="i" :value="i">頂点 {{i}}</option></select></label>
    <label>物体 x<input v-model.number="modelX" type="range" min="-2" max="2" step=".1" aria-label="物体のx位置"><output>{{modelX.toFixed(1)}}</output></label>
    <label>物体 Y回転<input v-model.number="modelAngle" type="range" min="-90" max="90" step="5" aria-label="物体のY軸回転"><output>{{modelAngle}}°</output></label>
    <label>カメラ z<input v-model.number="cameraZ" type="range" min="4" max="10" step=".5" aria-label="カメラのz位置"><output>{{cameraZ.toFixed(1)}}</output></label>
  </div>
  <p class="l3-formula">{{applied}}</p>
  <div class="l3-columns pipeline-columns">
    <div>
      <WireScene v-if="stage<4" :points="points" :ndc="stage===3" :selected="selected" :axis-points="stage<3 ? axisPoints : undefined" :extent="stage===2 ? 8 : stage===3 ? 1.2 : 4" :title="stage<3 ? `${stages[stage]} 座標の3D模式図` : 'Projected：NDC（x右、y上）'"/>
      <figure v-else class="screen-figure">
        <svg viewBox="-36 -32 730 484" role="img" aria-label="640×400ピクセルの画面座標。原点は左上、xは右、yは下。">
          <rect x="0" y="0" width="640" height="400" fill="var(--paper,#fff)" stroke="currentColor"/>
          <path d="M0 0H665m-8-5 8 5-8 5M0 0V425m-5-8 5 8 5-8" fill="none" stroke="currentColor"/>
          <g class="screen-labels" fill="currentColor"><text x="5" y="-10">(0, 0)</text><text x="632" y="-10">+x</text><text x="8" y="425">+y</text><text x="512" y="425">640 × 400 px</text></g>
          <svg width="640" height="400" viewBox="0 0 640 400" overflow="hidden">
            <line v-for="edge in screenEdges" :key="edge.key" :x1="edge.start[0]" :y1="edge.start[1]" :x2="edge.end[0]" :y2="edge.end[1]" stroke="var(--accent,#1767aa)" stroke-width="4"/>
            <circle v-for="item in screenPoints" :key="item.index" :cx="item.point[0]" :cy="item.point[1]" :r="item.index===selected ? 9 : 4" :fill="item.index===selected ? '#b24b00' : 'var(--accent,#1767aa)'" :stroke="item.index===selected ? 'currentColor' : 'none'" stroke-width="2"/>
          </svg>
        </svg>
        <figcaption>Screen：左上原点・ピクセル単位</figcaption>
      </figure>
      <p class="l3-note">{{stage<3 ? '模式図の見た目と座標値を区別しよう。図を斜めから見せています。' : '投影後は2D。Projectedはy上向き、Screenはy下向きです。'}}</p>
    </div>
    <div>
      <table class="pipeline-values"><caption>頂点 {{selected}} の数値追跡</caption><tbody>
        <tr v-for="(name,i) in stages" :key="name" :class="{active:stage===i}"><th scope="row">{{name}}</th><td>{{tuple([tracked.local,tracked.world,tracked.camera,tracked.projected,tracked.screen][i])}}</td></tr>
      </tbody></table>
      <MatrixReadout v-if="stage===1 || stage===2" :matrix="activeMatrix" :label="stage===1 ? 'M = T R_y' : 'V = C⁻¹'"/>
      <p v-else-if="stage===3" class="l3-note">FOV = 60°、aspect = 640/400。x_ndc = f x / (aspect d)、y_ndc = f y / d、f = 1/tan(30°)。</p>
      <p v-else-if="stage===4" class="l3-note">x_screen = (x_ndc + 1) × 320<br>y_screen = (1 − y_ndc) × 200</p>
      <p v-else class="l3-note">立方体の中心がLocalの原点。右の段階へ進んでも、同じ番号の頂点を追跡します。</p>
    </div>
  </div>
</DemoFrame>
</template>
<style scoped>
.pipeline-steps{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.pipeline-steps button[aria-pressed=true]{background:var(--soft,#e9f2fa);border-color:var(--accent,#1767aa);font-weight:700}.pipeline-values{border-collapse:collapse;width:100%;font-size:18px;font-variant-numeric:tabular-nums}.pipeline-values caption{text-align:left;font-weight:700;padding:4px 0}.pipeline-values th,.pipeline-values td{padding:4px 6px;border-bottom:1px solid var(--rule,#ccd4df);text-align:left}.pipeline-values td{overflow-wrap:anywhere}.pipeline-values tr.active{background:var(--soft,#edf4fa);font-weight:700}.screen-figure svg{width:100%}.screen-labels{font-size:22px}.screen-figure figcaption{text-align:center;font-size:17px}.pipeline-demo.compact .screen-figure>svg{max-height:210px}.pipeline-demo.compact .pipeline-steps{margin-bottom:6px}.pipeline-demo.compact .pipeline-values{font-size:15px}.pipeline-demo.compact .pipeline-values th,.pipeline-demo.compact .pipeline-values td{padding:2px 5px}.pipeline-demo.compact .l3-note{font-size:15px}.pipeline-demo.compact :deep(.l3-matrix-wrap){font-size:15px}@media(max-width:600px){.pipeline-columns{grid-template-columns:1fr}.pipeline-values{font-size:16px}.pipeline-steps button{flex:1 1 auto}}
</style>
