<script setup lang="ts">
import {ref,onMounted,watch} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import JpegBlockDemo from './JpegBlockDemo.vue'
import {clamp} from '../../packages/cg-algorithms/src/index.ts'
const props=defineProps<{showProcess?:boolean}>()
import {makeSample,copyCanvas} from '../common/imageTools'
const quality=ref(.15),bytes=ref(0),status=ref('準備中'),original=ref<HTMLCanvasElement>(),result=ref<HTMLCanvasElement>();let source:HTMLCanvasElement,version=0
// Browser encoder; compare against raw RGB, not a misleading differently sized source file.
async function draw(){if(!source||!original.value||!result.value)return;const id=++version;copyCanvas(original.value,source);status.value='圧縮中';const blob=await new Promise<Blob|null>(resolve=>source.toBlob(resolve,'image/jpeg',clamp(quality.value,.01,1)));if(!blob){status.value='JPEG生成に失敗';return}const im=await createImageBitmap(blob);if(id!==version){im.close();return}copyCanvas(result.value,im);im.close();bytes.value=blob.size;status.value='完了'}
onMounted(()=>{source=makeSample();draw()});watch(quality,draw)
</script>
<template><DemoFrame label="JPEG品質と失われる細部" @reset="quality=.15">
<div class="controls"><label>品質<input aria-label="JPEG品質" type="range" min="0.01" max="1" step="0.01" v-model.number="quality"/>{{Math.round(quality*100)}}%</label><span class="readout">JPEG {{(bytes/1024).toFixed(1)}} KiB · {{status}}</span></div>
<div class="panels"><figure><canvas ref="original" width="384" height="256"/><figcaption>元画像：384×256画素</figcaption></figure><figure><canvas ref="result" width="384" height="256"/><figcaption>圧縮後：文字・境界・縞に注目</figcaption></figure></div>
<div class="hint">比較用の未圧縮RGBは288 KiB（α・ヘッダー除外）。同じ画素数で比較。品質値とサイズはブラウザのJPEG実装に依存し、画質の百分率ではありません。</div>
<JpegBlockDemo v-if="props.showProcess" :quality="quality" />
</DemoFrame></template>
