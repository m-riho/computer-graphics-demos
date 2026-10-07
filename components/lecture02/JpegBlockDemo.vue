<script setup lang="ts">
import {computed} from 'vue'
import {clamp,makeJpegBlock,dctBlock,quantizeDct,idctBlock,jpegQuantizationStep} from '../../packages/cg-algorithms/src/index.ts'
const props=defineProps<{quality:number}>()
const pixels=makeJpegBlock(),coefficients=dctBlock(pixels)
const step=computed(()=>jpegQuantizationStep(props.quality))
const quantized=computed(()=>quantizeDct(coefficients,step.value))
const reconstructed=computed(()=>idctBlock(quantized.value.map(value=>value*step.value)))
const zeros=computed(()=>quantized.value.filter(value=>value===0).length)
const error=computed(()=>pixels.reduce((sum,value,i)=>sum+Math.abs(value-reconstructed.value[i]),0)/64)
</script>
<template><section class="jpeg-process" aria-label="JPEGの量子化の模式実験">
<h3>8×8ブロックの中で、何が失われる？</h3>
<p>輝度 → DCT（周波数成分） → 係数の量子化 → 逆DCT</p>
<div class="jpeg-grids"><figure v-for="(values,i) in [pixels,reconstructed]" :key="i"><div class="jpeg-pixels"><span v-for="(value,k) in values" :key="k" :style="{background:`rgb(${clamp(value,0,255)},${clamp(value,0,255)},${clamp(value,0,255)})`}" /></div><figcaption>{{i?'量子化後に復元':'元の8×8輝度'}}</figcaption></figure><div><p>模式量子化の刻み：<strong>{{step}}</strong></p><p>0になる係数：<strong>{{zeros}} / 64</strong></p><p>平均絶対誤差：<strong>{{error.toFixed(2)}}</strong></p></div></div>
<p class="hint">上の品質スライダーと連動しますが、ブラウザ内部を再現したものではありません。全周波数に同じ刻みを使い、情報削減だけを説明します。実際のJPEGは周波数別量子化表・色差間引き・符号化なども使います。</p>
</section></template>
<style scoped>
.jpeg-process{border-top:1px solid var(--rule);margin-top:28px;padding-top:20px}.jpeg-process h3{font-size:1.2em}.jpeg-grids{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:20px}.jpeg-pixels{display:grid;grid-template-columns:repeat(8,1fr);aspect-ratio:1;border:1px solid var(--rule)}.jpeg-pixels span{aspect-ratio:1}@media(max-width:650px){.jpeg-grids{grid-template-columns:1fr 1fr}.jpeg-grids>div:last-child{grid-column:1/-1}}
</style>
