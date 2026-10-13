<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import WireScene from './WireScene.vue'
import { cubeVertices } from '../../packages/cg-algorithms/src/geometry3d.ts'
import { projectOblique } from '../../packages/cg-algorithms/src/oblique-projection.ts'
import { transformPoint } from '../../packages/cg-algorithms/src/matrix4.ts'
import { translationMatrix } from '../../packages/cg-algorithms/src/transforms3d.ts'
defineProps<{ compact?: boolean }>()
const theta = ref(45), depthScale = ref(.5), stage = ref(0)
// Translate the cube so that the front is z=0 and the other face is z=2.
const vertices = cubeVertices(2).map(point => transformPoint(translationMatrix(0, 0, 1), point))
const points = computed(() => vertices.map(point => projectOblique(point, theta.value, depthScale.value)))
function reset() { theta.value = 45; depthScale.value = .5; stage.value = 0 }
</script>
<template>
  <DemoFrame class="l3-demo" :class="{ compact }" label="奥行きの表し方を観察しよう" @reset="reset">
    <div class="l3-controls">
      <label>奥行き方向の角度 θ<input v-model.number="theta" aria-label="奥行き方向の角度 θ" type="range" min="-180" max="180" step="1"><output>{{ theta }}°</output></label>
      <label>奥行き縮尺 s<input v-model.number="depthScale" aria-label="奥行き縮尺 s" type="range" min="0" max="1.5" step="0.05"><output>{{ depthScale.toFixed(2) }}</output></label>
    </div>
    <div class="l3-columns discovery-columns">
      <WireScene :points="points" :extent="4.3" title="立方体の形を観察" />
      <div class="l3-observe"><strong>観察して、自分の言葉で説明しよう</strong>
        <ul><li>θ を変えると何が変わる？</li><li>s を変えると何が変わる？</li><li>z が同じ点はどう移動する？</li><li>奥の面は小さくなる？</li><li>奥行き方向の辺はどんな関係？</li></ul>
      </div>
    </div>
    <div v-if="stage >= 1" class="l3-readout" data-reveal="mechanism">X = x + z に比例する横方向のずれ<br>Y = y + z に比例する縦方向のずれ</div>
    <div v-if="stage >= 2" class="l3-formula" data-reveal="formula">X = x + s z cos θ、Y = y + s z sin θ<br><span class="l3-note">Y は上向き。画面描画の下向き y 軸へは符号を反転。+z は奥の面へ向かう向きです。</span></div>
    <p v-if="stage >= 3" class="l3-readout" data-reveal="name"><strong>斜投影（Oblique Projection）</strong>：奥行きを一定方向へのずれで表す平行投影の一種。</p>
    <div class="l3-buttons"><button v-if="stage === 0" @click="stage = 1">仕組みを見る</button><button v-else-if="stage === 1" @click="stage = 2">数式を見る</button><button v-else-if="stage === 2" @click="stage = 3">名前を見る</button><span v-else class="l3-note">Reset で観察からやり直せます。</span></div>
  </DemoFrame>
</template>
<style scoped>
.discovery-columns { align-items: center; }
ul { margin: .35em 0 0; padding-left: 1.35em; }
li { margin: .17em 0; }
.compact :deep(.l3-wire) { max-height: 175px; }
.compact .l3-readout, .compact .l3-formula { margin-block: 4px; }
</style>
