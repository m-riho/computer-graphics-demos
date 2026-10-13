<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import WireScene from './WireScene.vue'
import { cubeVertices } from '../../packages/cg-algorithms/src/geometry3d.ts'
import { projectOblique } from '../../packages/cg-algorithms/src/oblique-projection.ts'
import { transformPoint } from '../../packages/cg-algorithms/src/matrix4.ts'
import { translationMatrix } from '../../packages/cg-algorithms/src/transforms3d.ts'
defineProps<{ compact?: boolean }>()
type Preset = 'Cavalier' | 'Cabinet' | 'Custom'
const preset = ref<Preset>('Cabinet'), theta = ref(45), depthScale = ref(.5)
const vertices = cubeVertices(2).map(point => transformPoint(translationMatrix(0, 0, 1), point))
const points = computed(() => vertices.map(point => projectOblique(point, theta.value, depthScale.value)))
const reference = computed(() => vertices.map(point => projectOblique(point, theta.value, 1)))
function setPreset(value: Preset) { preset.value = value; if (value !== 'Custom') { theta.value = 45; depthScale.value = value === 'Cavalier' ? 1 : .5 } }
function reset() { setPreset('Cabinet') }
</script>
<template>
  <DemoFrame class="l3-demo" :class="{ compact }" label="Cavalier / Cabinet を比べる" @reset="reset">
    <div class="l3-buttons"><button v-for="name in (['Cavalier', 'Cabinet', 'Custom'] as const)" :key="name" :aria-pressed="preset === name" @click="setPreset(name)">{{ name }}</button></div>
    <div class="l3-controls">
      <label>角度 θ<input v-model.number="theta" aria-label="角度 θ" type="range" min="0" max="90" step="1" @input="preset = 'Custom'"><output>{{ theta }}°</output></label>
      <label>奥行き縮尺 s<input v-model.number="depthScale" aria-label="奥行き縮尺 s" type="range" min="0" max="1.5" step="0.05" @input="preset = 'Custom'"><output>{{ depthScale.toFixed(2) }}</output></label>
    </div>
    <div class="l3-columns">
      <figure><figcaption>比較基準：s = 1（角度は共通）</figcaption><WireScene :points="reference" :extent="4.3" title="比較基準：s = 1（角度は共通）" /></figure>
      <figure><figcaption>{{ preset }}：s = {{ depthScale.toFixed(2) }}</figcaption><WireScene :points="points" :extent="4.3" :title="`${preset}：s = ${depthScale.toFixed(2)}`" /></figure>
    </div>
    <p class="l3-readout">現在：{{ preset }}、θ = {{ theta }}°、s = {{ depthScale.toFixed(2) }}。正面の辺の長さは同じ。</p>
    <p class="l3-formula">X = x + s z cos θ、Y = y + s z sin θ</p>
    <p class="l3-note">授業の代表例：Cavalier は s = 1、Cabinet は s = 1/2、どちらも θ = 45°。角度などの慣習には幅があります。Y は上向き、描画時に反転。+z は奥の面へ向かう向き。</p>
    <p class="l3-observe">プリセットを切り替え、奥行き方向の辺だけがどのように変わるか観察しよう。</p>
  </DemoFrame>
</template>

<style scoped>
.compact :deep(.l3-wire) { max-height: 180px; }
</style>
