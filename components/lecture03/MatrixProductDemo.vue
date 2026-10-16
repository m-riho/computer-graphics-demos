<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import MatrixMultiplicationSteps from './MatrixMultiplicationSteps.vue'

type Preset = 'vector2' | 'rotation3' | 'translation4' | 'matrix2'
const preset = ref<Preset>('vector2'), revision = ref(0)
const descriptions: Record<Preset, string> = {
  vector2: '2×2行列と2成分の列ベクトル。左の1行と右の列で、結果の1成分を計算します。',
  rotation3: 'Z軸まわりに90°回転する3×3行列。(1, 2, 3) が (−2, 1, 3) へ移ります。',
  translation4: '移動量 (3, −1, 2) の4×4行列。点はw = 1、方向はw = 0として、最後の成分が計算にどう効くか比べます。',
  matrix2: '行列同士でも同じ規則です。左の行と右の列を選び、その積の和を結果の対応する位置へ入れます。',
}
const description = computed(() => descriptions[preset.value])
function reset() { preset.value = 'vector2'; revision.value++ }
</script>

<template>
  <DemoFrame label="行と列を追う掛け算" class="matrix-product-demo" @reset="reset">
    <div class="controls">
      <label>計算する例
        <select v-model="preset">
          <option value="vector2">2×2行列 × ベクトル</option>
          <option value="rotation3">3×3行列 × ベクトル（回転）</option>
          <option value="translation4">4×4行列 × ベクトル（平行移動）</option>
          <option value="matrix2">2×2行列 × 2×2行列</option>
        </select>
      </label>
    </div>
    <p class="example-description">{{ description }}</p>
    <MatrixMultiplicationSteps :key="`${preset}-${revision}`" :preset="preset" :active="true" />
    <p class="hint">同じ位置の成分を掛け、その積をすべて足します。まず「次へ」で1組ずつ確認し、「再生」で計算全体を追いましょう。「最初から」は今の例を、Resetは最初の2×2の例をやり直します。</p>
  </DemoFrame>
</template>

<style scoped>
.matrix-product-demo{--axis-x:#c43c39;--axis-y:#24733c;container-type:inline-size}
.matrix-product-demo .controls label{flex-wrap:wrap;font-size:18px;max-width:100%}
.matrix-product-demo select{max-width:100%;font-size:17px}
.example-description{font-size:18px;line-height:1.6;margin:12px 0 20px}
.matrix-product-demo :deep(.product-controls){gap:10px}
.matrix-product-demo :deep(.product-controls button){font-size:18px;min-height:44px}
@container(max-width:620px){
  .matrix-product-demo :deep(.product-equation){flex-direction:column;gap:10px}
  .matrix-product-demo :deep(.product-operator){padding-top:0}
  .matrix-product-demo :deep(.product-terms){flex-wrap:wrap;gap:6px}
  .matrix-product-demo :deep(.product-term){min-width:80px;font-size:18px;padding:5px}
  .matrix-product-demo :deep(.product-stage){font-size:18px}
  .matrix-product-demo :deep(.product-legend){font-size:16px}
  .matrix-product-demo :deep(.product-instruction){font-size:17px}
  .matrix-product-demo :deep(.product-print-work){font-size:16px;width:auto;overflow-wrap:anywhere}
}
@media print{.matrix-product-demo :deep(.screen-only){display:none!important}.controls{display:none}}
</style>
