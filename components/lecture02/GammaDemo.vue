<script setup lang="ts">
import {ref,computed,onMounted,watch} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {gammaEncode,gammaDecode,simulateGamma} from '../../packages/cg-algorithms/src/index.ts'
import {makeSample} from '../common/imageTools'
const gamma=ref(2.2),original=ref<HTMLCanvasElement>(),encoded=ref<HTMLCanvasElement>();let source:HTMLCanvasElement
const curve=computed(()=>Array.from({length:101},(_,i)=>`${i?'L':'M'}${40+i*3.8},${150-gammaEncode(i/100,gamma.value)*120}`).join(' '))
function draw(){if(!source||!original.value||!encoded.value)return;const data=source.getContext('2d')!.getImageData(0,0,384,256)
 for(const [target,correct] of [[original.value,false],[encoded.value,true]] as const){const out=new ImageData(new Uint8ClampedArray(data.data),384,256);for(let i=0;i<out.data.length;i+=4)for(let k=0;k<3;k++){const l=data.data[i+k]/255;out.data[i+k]=255*simulateGamma(l,gamma.value,correct)}target.getContext('2d')!.putImageData(out,0,0)}
}
onMounted(()=>{source=makeSample();draw()});watch(gamma,draw)
</script>
<template><DemoFrame label="線形輝度 → 符号値 → 表示輝度" @reset="gamma=2.2">
<div class="controls"><label>仮想表示装置のγ<input aria-label="ガンマ" type="range" min="1" max="3" step="0.1" v-model.number="gamma"/>{{gamma.toFixed(1)}}</label><button @click="gamma=1">γ=1.0</button><button @click="gamma=2.2">γ≈2.2</button></div>
<div class="panels"><svg style="height:150px" viewBox="0 0 470 190" role="img" aria-label="線形輝度とエンコード値の曲線"><path d="M40 20 V150 H420 M40 150 L420 30" fill="none" stroke="#bbb"/><path :d="curve" fill="none" stroke="currentColor" stroke-width="3"/><text x="8" y="20" style="font-size:19px">符号値 E</text><text x="200" y="182" style="font-size:19px">線形輝度 L（0〜1）</text></svg><div class="readout">E = L^(1/γ)、表示輝度 = E^γ<br>L=0.5 → E={{gammaEncode(.5,gamma).toFixed(3)}}<br>→ 表示輝度={{gammaDecode(gammaEncode(.5,gamma),gamma).toFixed(3)}}</div></div>
<div class="panels"><figure><canvas ref="original" width="384" height="256" style="height:145px"/><figcaption>補正なし：Lをそのまま入力</figcaption></figure><figure><canvas ref="encoded" width="384" height="256" style="height:145px"/><figcaption>逆べき乗でエンコード</figcaption></figure></div>
<div class="hint">説明用のべき乗モデル。sRGBは区分関数でありγ=2.2そのものではない。比較画像は仮想表示結果をsRGBへ変換して表示。</div>
</DemoFrame></template>
