<script setup lang="ts">
import {computed, ref} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import WireScene from './WireScene.vue'
import MatrixReadout from './MatrixReadout.vue'
import {multiplyMatrix4, transformPoint, type Vec3} from '../../packages/cg-algorithms/src/matrix4.ts'
import {translationMatrix} from '../../packages/cg-algorithms/src/transforms3d.ts'
import {cameraMatrix, inverseRigidTransform} from '../../packages/cg-algorithms/src/camera.ts'
import {projectPerspective} from '../../packages/cg-algorithms/src/projection.ts'
import {cubeVertices} from '../../packages/cg-algorithms/src/geometry3d.ts'

defineProps<{compact?: boolean}>()
const position = ref<Vec3>([0,0,6]), object = ref<Vec3>([0,0,0]), yaw=ref(0), matched=ref(true)
const display=ref('both'), reveal=ref(0), cameraAxis=ref(0), objectAxis=ref(0)
const axes=['x','y','z']
const baseline=cameraMatrix([0,0,6]), baselineView=inverseRigidTransform(baseline)
const view = computed(() => inverseRigidTransform(cameraMatrix(position.value,yaw.value)))
const model = computed(() => translationMatrix(...object.value))
// B moves the entire compared scene while its camera stays at C0.
const modelB = computed(() => matched.value ? multiplyMatrix4(baseline,multiplyMatrix4(view.value,model.value)) : model.value)
const vertices=cubeVertices()
const cameraA = computed(() => vertices.map(p => transformPoint(multiplyMatrix4(view.value,model.value),p)))
const cameraB = computed(() => vertices.map(p => transformPoint(multiplyMatrix4(baselineView,modelB.value),p)))
const pointsA=computed(() => cameraA.value.map(p => projectPerspective(p,60,420/260)))
const pointsB=computed(() => cameraB.value.map(p => projectPerspective(p,60,420/260)))
const error=computed(() => Math.max(...cameraA.value.flatMap((p,i) => p.map((v,j) => Math.abs(v-cameraB.value[i][j])))))
const centerB=computed(() => transformPoint(modelB.value,[0,0,0]))
const clipped=computed(() => [...pointsA.value,...pointsB.value].some(p => p===null))
const tuple=(p: readonly number[]) => `(${p.map(v => v.toFixed(2)).join(', ')})`
function reset() { position.value=[0,0,6]; object.value=[0,0,0]; yaw.value=0; matched.value=true; display.value='both'; reveal.value=0; cameraAxis.value=0; objectAxis.value=0 }
</script>
<template>
<DemoFrame label="カメラの移動と、物体の逆向きの変換" class="l3-demo camera-demo" :class="{compact}" @reset="reset">
  <div class="l3-controls">
    <label v-if="compact">カメラ軸<select v-model.number="cameraAxis" aria-label="操作するカメラ軸"><option v-for="(axis,i) in axes" :key="axis" :value="i">{{axis}}</option></select><input v-model.number="position[cameraAxis]" type="range" :min="cameraAxis===2 ? 4 : -2" :max="cameraAxis===2 ? 10 : 2" step=".1" :aria-label="`カメラの${axes[cameraAxis]}位置`"><output>{{position[cameraAxis].toFixed(1)}}</output></label>
    <template v-else><label v-for="(axis,i) in axes" :key="axis">カメラ {{axis}}<input v-model.number="position[i]" type="range" :min="i===2 ? 4 : -2" :max="i===2 ? 10 : 2" step=".1" :aria-label="`カメラの${axis}位置`"><output>{{position[i].toFixed(1)}}</output></label></template>
    <label>カメラ Y回転<input v-model.number="yaw" type="range" min="-35" max="35" step="5" aria-label="カメラのY軸回転"><output>{{yaw}}°</output></label>
  </div>
  <details class="object-controls" :open="!compact">
    <summary>物体の位置を変える · {{tuple(object)}}</summary>
    <div class="l3-controls"><label v-if="compact">物体軸<select v-model.number="objectAxis" aria-label="操作する物体軸"><option v-for="(axis,i) in axes" :key="axis" :value="i">{{axis}}</option></select><input v-model.number="object[objectAxis]" type="range" min="-1.5" max="1.5" step=".1" :aria-label="`物体の${axes[objectAxis]}位置`"><output>{{object[objectAxis].toFixed(1)}}</output></label><template v-else><label v-for="(axis,i) in axes" :key="axis">物体 {{axis}}<input v-model.number="object[i]" type="range" min="-1.5" max="1.5" step=".1" :aria-label="`物体の${axis}位置`"><output>{{object[i].toFixed(1)}}</output></label></template></div>
  </details>
  <div class="l3-controls">
    <label><input v-model="matched" type="checkbox" aria-label="Bに対応する逆変換を適用">Bに対応する逆変換を適用</label>
    <label>表示<select v-model="display" aria-label="比較表示"><option value="both">左右比較</option><option value="a">Aのみ</option><option value="b">Bのみ</option></select></label>
  </div>
  <div class="l3-columns camera-panels" :class="{single:display!=='both'}">
    <div v-if="display!=='b'"><strong>A：カメラを動かす</strong><WireScene :points="pointsA" ndc title="Aのカメラ画像（NDC）"/><p class="l3-readout">カメラ {{tuple(position)}}<br>物体中心 {{tuple(object)}}</p></div>
    <div v-if="display!=='a'"><strong>B：物体側を変換する</strong><WireScene :points="pointsB" ndc title="Bの固定カメラ画像（NDC）"/><p class="l3-readout">カメラ (0, 0, 6) 固定<br>物体中心 {{tuple(centerB)}}</p></div>
  </div>
  <p class="l3-observe">{{error<1e-9 ? '一致：両方のカメラから見た頂点座標は同じです。' : '不一致：Bの対応変換を有効にして、見え方を比べよう。'}}<span v-if="clipped"> カメラの背面・近すぎる頂点は描画しません。</span></p>
  <div class="l3-buttons"><button v-if="reveal===0" @click="reveal=1">考え方を見る</button><button v-else-if="reveal===1" @click="reveal=2">数式を見る</button></div>
  <p v-if="reveal>=1" class="l3-note">カメラが右へ動くと物体は左へ見えます。回転も含め、シーン全体を逆向きに変換すると固定カメラで同じ画像を得られます。</p>
  <div v-if="reveal===2" class="camera-equation"><p class="l3-formula">V = C⁻¹、M_B = C₀ V M → C₀⁻¹ M_B = V M</p><MatrixReadout v-if="!compact" :matrix="view" label="AのViewing transform V"/></div>
  <p class="l3-note conditions">一致する条件：同じFOV（60°）・同じ画面比率・比較するシーン全体を変換。この図に固定した世界背景はありません。</p>
</DemoFrame>
</template>
<style scoped>
.camera-panels>div{min-width:0}.camera-panels>div>strong{display:block;text-align:center}.camera-panels.single{grid-template-columns:1fr;max-width:650px;margin:auto}.object-controls{margin:6px 0 10px}.object-controls summary{cursor:pointer;font-size:18px}.object-controls .l3-controls{margin-top:8px}.camera-demo .l3-readout{font-size:18px;overflow-wrap:anywhere;margin:4px 0}.camera-demo.compact :deep(.l3-wire){max-height:140px}.camera-demo.compact .l3-readout,.camera-demo.compact .conditions,.camera-demo.compact .l3-note{font-size:14px}.camera-demo.compact .l3-observe,.camera-demo.compact .l3-formula{font-size:16px}.camera-demo.compact .object-controls{margin:4px 0}.camera-demo.compact .l3-buttons{margin:4px 0}@media(max-width:600px){.camera-panels{grid-template-columns:1fr}.camera-demo.compact :deep(.l3-wire){max-height:none}}
</style>
