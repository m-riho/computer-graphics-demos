<script setup lang="ts">
import {ref,onMounted,watch} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {sampleNearest,quantizeRgba} from '../../packages/cg-algorithms/src/index.ts'
import {makeSample,photoCanvas,copyCanvas} from '../common/imageTools'
const props=defineProps<{sourceImage?:string;sourceLabel?:string}>()
const resolution=ref(24),bits=ref(2),grid=ref(true),mode=ref('gradient'),ready=ref(false),error=ref('')
const original=ref<HTMLCanvasElement>(),result=ref<HTMLCanvasElement>();let photo:HTMLCanvasElement,gradient:HTMLCanvasElement
function draw(){if(!ready.value||!original.value||!result.value)return;const src=mode.value==='photo'?photo:gradient;copyCanvas(original.value,src)
 const c=document.createElement('canvas');c.width=resolution.value;c.height=Math.round(resolution.value*2/3);const x=c.getContext('2d')!;const data=src.getContext('2d')!.getImageData(0,0,src.width,src.height)
 const sampled=sampleNearest(data.data,src.width,src.height,c.width,c.height)
 const im=new ImageData(new Uint8ClampedArray(quantizeRgba(sampled,bits.value)),c.width,c.height)
 x.putImageData(im,0,0);const y=result.value.getContext('2d')!;y.imageSmoothingEnabled=false;copyCanvas(result.value,c)
 if(grid.value&&resolution.value<=64){y.strokeStyle='rgba(0,0,0,.3)';y.lineWidth=.6;for(let i=0;i<=c.width;i++){y.beginPath();y.moveTo(i*384/c.width,0);y.lineTo(i*384/c.width,256);y.stroke()}for(let i=0;i<=c.height;i++){y.beginPath();y.moveTo(0,i*256/c.height);y.lineTo(384,i*256/c.height);y.stroke()}}
}
function reset(){resolution.value=24;bits.value=2;grid.value=true;mode.value='gradient';draw()}
onMounted(async()=>{gradient=makeSample();const x=gradient.getContext('2d')!,g=x.createLinearGradient(0,0,384,0);g.addColorStop(0,'black');g.addColorStop(1,'white');x.fillStyle=g;x.fillRect(0,0,384,256);try{photo=props.sourceImage?await photoCanvas(props.sourceImage):makeSample();ready.value=true;draw()}catch{error.value='画像を読み込めません。'}})
watch([resolution,bits,grid,mode],draw)
</script>
<template><DemoFrame label="細かさと階調を、別々に変える" @reset="reset">
<div class="controls"><label>横の画素数<input aria-label="横の画素数" type="range" min="8" max="96" step="8" v-model.number="resolution"/>{{resolution}}</label><label>各成分のbit<select aria-label="量子化ビット数" v-model.number="bits"><option v-for="n in [1,2,4,8]" :value="n">{{n}}</option></select></label><label><input type="checkbox" v-model="grid"/>格子</label><select aria-label="元画像" v-model="mode"><option value="gradient">グラデーション</option><option value="photo">{{props.sourceLabel ?? '図形サンプル'}}</option></select></div>
<div class="panels"><figure><canvas ref="original" width="384" height="256"/><figcaption>元画像（デジタルの参照画像）</figcaption></figure><figure><canvas ref="result" width="384" height="256"/><figcaption>{{resolution}}×{{Math.round(resolution*2/3)}}画素・各成分{{2**bits}}段階</figcaption></figure></div>
<div class="hint">標本化＝空間の細かさ。量子化＝値の段階数。格子は横64画素まで表示。{{error}}</div>
</DemoFrame></template>
