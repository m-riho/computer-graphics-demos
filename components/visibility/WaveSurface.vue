<script setup lang="ts">
import { computed, ref } from 'vue'
import { stripTriangles, waveSections } from '../../packages/cg-algorithms/src/visibility-wave.ts'
import type { Vec2 } from '../../packages/cg-algorithms/src/matrix4.ts'
import Playback from './Playback.vue'

const elevation = ref(22)
const count = ref(19)
const hide = ref(false)
const step = ref(0)
const point = ([x,y]: Vec2) => x.toFixed(2) + ',' + y.toFixed(2)
const sections = computed(() => waveSections(count.value, elevation.value, step.value * Math.PI / 18))
const drawing = computed(() => sections.value.map((row, i, rows) => ({
  line: row.map(point).join(' '),
  mask: hide.value && i > 0 ? stripTriangles(rows[i-1], row)
    .map(triangle => 'M' + triangle.map(point).join('L') + 'Z').join('') : '',
})))
function reset() {
  elevation.value = 22
  count.value = 19
  hide.value = false
  step.value = 0
}
</script>

<template>
  <section class="wave-lab">
    <div class="wave-controls">
      <label><input v-model="hide" type="checkbox"> 隠れた線を消す</label>
      <label>見下ろす角度 <input v-model.number="elevation" type="range" min="5" max="65"> {{ elevation }}°</label>
      <label>断面の数 <input v-model.number="count" type="range" min="5" max="33" step="2"> {{ count }} 本</label>
    </div>
    <figure>
      <svg viewBox="0 0 640 300" role="img" :aria-label="hide ? '手前の波面に隠れる線を消した断面図' : '波面のすべての断面線'">
        <g v-for="(row, i) in drawing" :key="i">
          <path v-if="row.mask" :d="row.mask" fill="white"/>
          <polyline :points="row.line" fill="none" stroke="#135482" stroke-width="1.65" stroke-linejoin="round"/>
        </g>
      </svg>
      <figcaption>各線は波面を等間隔に切った断面です。手前の峰と奥の線が交わる場所で、隠線消去を切り替えてみましょう。</figcaption>
    </figure>
    <p>ステップを進めると、波の峰が移動します。</p>
    <Playback v-model:step="step" :max="36" @reset="reset"/>
  </section>
</template>

<style scoped>
.wave-controls { display:flex; flex-wrap:wrap; gap:.6rem 1.2rem; align-items:center }
.wave-controls label { display:inline-flex; align-items:center; gap:.3rem }
.wave-controls input[type=range] { width:6rem }
figure { margin:1rem 0 .6rem }
svg { display:block; width:100%; max-height:21rem; background:white; border:1px solid #c2d5e3; border-radius:.5rem; box-sizing:border-box }
figcaption { margin:.5rem 0; color:#36536a }
p { margin:.55rem 0 }
</style>
