<script setup lang="ts">
import {ref,onMounted,onBeforeUnmount,watch,nextTick} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import JpegBlockDemo from './JpegBlockDemo.vue'
import {clamp} from '../../packages/cg-algorithms/src/index.ts'
import {makeSample,copyCanvas} from '../common/imageTools'
const props=defineProps<{showProcess?:boolean}>()
const quality=ref(.15),bytes=ref(0),status=ref('準備中')
const original=ref<HTMLCanvasElement>(),resultUrl=ref('')
let source:HTMLCanvasElement,version=0
const urls=new Set<string>()
function release(url:string){if(urls.delete(url))URL.revokeObjectURL(url)}

// Show the actual encoded JPEG directly; avoid a second ImageBitmap → canvas transfer.
async function draw(){
 if(!source)return
 const id=++version
 status.value='圧縮中'
 let pendingUrl=''
 try{
  const blob=await new Promise<Blob|null>(resolve=>source.toBlob(resolve,'image/jpeg',clamp(quality.value,.01,1)))
  if(id!==version)return
  if(!blob||blob.type!=='image/jpeg')throw new Error('JPEG encoding failed')
  pendingUrl=URL.createObjectURL(blob);urls.add(pendingUrl)
  const image=new Image();image.src=pendingUrl
  await image.decode()
  if(id!==version)return
  const previous=resultUrl.value
  resultUrl.value=pendingUrl;pendingUrl=''
  bytes.value=blob.size
  await nextTick()
  release(previous)
  if(id===version)status.value='完了'
 }catch{
  if(id===version){bytes.value=0;status.value='JPEG生成・表示に失敗（Resetで再試行）';const previous=resultUrl.value;resultUrl.value='';await nextTick();release(previous)}
 }finally{release(pendingUrl)}
}
function reset(){if(quality.value===.15)void draw();else quality.value=.15}
onMounted(()=>{source=makeSample();if(original.value)copyCanvas(original.value,source);void draw()})
watch(quality,draw)
onBeforeUnmount(()=>{version++;for(const url of urls)release(url)})
</script>
<template><DemoFrame label="JPEG品質と失われる細部" @reset="reset">
<div class="controls"><label>品質<input aria-label="JPEG品質" type="range" min="0.01" max="1" step="0.01" v-model.number="quality"/>{{Math.round(quality*100)}}%</label><span class="readout">JPEG {{(bytes/1024).toFixed(1)}} KiB · {{status}}</span></div>
<div class="panels"><figure><canvas ref="original" width="384" height="256"/><figcaption>元画像：384×256画素</figcaption></figure><figure><img v-if="resultUrl" :key="resultUrl" class="jpeg-result" :src="resultUrl" width="384" height="256" alt="現在の品質設定で圧縮したJPEG画像" /><div v-else class="jpeg-result jpeg-placeholder" role="status">{{status}}</div><figcaption>圧縮後：文字・境界・縞に注目</figcaption></figure></div>
<div class="hint">比較用の未圧縮RGBは288 KiB（α・ヘッダー除外）。同じ画素数で比較。品質値とサイズはブラウザのJPEG実装に依存し、画質の百分率ではありません。</div>
<JpegBlockDemo v-if="props.showProcess" :quality="quality" />
</DemoFrame></template>

<style scoped>
.jpeg-result{display:block;width:100%;height:260px;object-fit:contain;max-width:100%}.jpeg-placeholder{display:grid;place-items:center;color:var(--muted);background:var(--soft);font-size:18px}
@media(max-width:650px){.jpeg-result{height:auto;aspect-ratio:3/2}}
</style>
