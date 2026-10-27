<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { boundedInteger, kochCurve, sierpinskiTriangles, escapeTime } from '../../packages/cg-algorithms/src/nature-fractals'
import type { Point2 } from '../../packages/cg-algorithms/src/nature-fields'
import './lecture05.css'
type Mode='koch'|'sierpinski'|'mandelbrot'|'julia'
const mode=ref<Mode>('koch'),iteration=ref(3),limit=ref(80),real=ref(-.8),imaginary=ref(.156)
const center=ref<Point2>([-.5,0]),span=ref(5.6),canvas=ref<HTMLCanvasElement|null>(null)
const geometric=computed(()=>mode.value==='koch'||mode.value==='sierpinski')
const level=computed(()=>boundedInteger(iteration.value,0,6))
const maxIterations=computed(()=>boundedInteger(limit.value,20,400,80))
const c=computed<Point2>(()=>[Number.isFinite(real.value)?Math.max(-2,Math.min(2,real.value)):-.8,Number.isFinite(imaginary.value)?Math.max(-2,Math.min(2,imaginary.value)):.156])
const count=computed(()=>mode.value==='koch'?4**level.value:3**level.value)
function resetView(){center.value=mode.value==='mandelbrot'?[-.5,0]:[0,0];span.value=5.6}
function reset(){mode.value='koch';iteration.value=3;limit.value=80;real.value=-.8;imaginary.value=.156;resetView()}
function zoom(factor:number){span.value=Math.max(.02,Math.min(8,span.value*factor))}
function pan(x:number,y:number){center.value=[Math.max(-3,Math.min(3,center.value[0]+x*span.value)),Math.max(-3,Math.min(3,center.value[1]+y*span.value))]}
function draw(){
 const ctx=canvas.value?.getContext('2d');if(!ctx)return
 const width=560,height=240;ctx.fillStyle='#f2f7fb';ctx.fillRect(0,0,width,height)
 if(mode.value==='koch'){
   const points=kochCurve(level.value);ctx.strokeStyle='#075985';ctx.lineWidth=1.8;ctx.beginPath()
   points.forEach(([x,y],i)=>{const px=25+x*510,py=210-y*510;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.stroke()
 }else if(mode.value==='sierpinski'){
   ctx.fillStyle='#075985'
   for(const triangle of sierpinskiTriangles(level.value)){ctx.beginPath();triangle.forEach(([x,y],i)=>{const px=160+x*240,py=225-y*240;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();ctx.fill()}
 }else{
   // 280×120 標本、最大400反復。高解像度の計算は授業デモでは行わない。
   const w=280,h=120,unit=span.value/w
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const p:Point2=[center.value[0]+(x-w/2)*unit,center.value[1]-(y-h/2)*unit]
     const n=mode.value==='mandelbrot'?escapeTime([0,0],p,maxIterations.value):escapeTime(p,c.value,maxIterations.value)
     ctx.fillStyle=n===maxIterations.value?'#102c43':`hsl(${205+n*5%100},75%,${76-Math.min(40,n*.7)}%)`
     ctx.fillRect(x*2,y*2,2,2)
   }
 }
}
let frame=0
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)}
watch([mode,level,maxIterations,c,center,span],schedule,{deep:true,flush:'post'})
watch(mode,resetView);onMounted(draw);onBeforeUnmount(()=>cancelAnimationFrame(frame))
let start:{x:number;y:number;center:Point2}|null=null
function down(event:PointerEvent){if(geometric.value)return;start={x:event.clientX,y:event.clientY,center:[...center.value]};(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)}
function move(event:PointerEvent){
 if(!start)return
 const rect=(event.currentTarget as HTMLCanvasElement).getBoundingClientRect()
 const renderedWidth=Math.min(rect.width,rect.height*560/240)
 center.value=[Math.max(-3,Math.min(3,start.center[0]-(event.clientX-start.x)/renderedWidth*span.value)),Math.max(-3,Math.min(3,start.center[1]+(event.clientY-start.y)/renderedWidth*span.value))]
}
</script>
<template><section class="l5d fractal-demo" aria-label="4 種類のフラクタルを比較">
 <div class="l5d-controls"><label>Fractal <select v-model="mode" aria-label="フラクタルの種類"><option value="koch">Koch</option><option value="sierpinski">Sierpiński</option><option value="mandelbrot">Mandelbrot</option><option value="julia">Julia（filled）</option></select></label>
 <template v-if="geometric"><label>Iteration {{level}} <input v-model.number="iteration" aria-label="フラクタルの反復回数" type="range" min="0" max="6"></label><button :disabled="level>=6" @click="iteration=level+1">Step</button></template>
 <label v-else>反復上限 {{maxIterations}} <input v-model.number="limit" aria-label="複素数反復の上限" type="range" min="20" max="400" step="20"></label><button @click="reset">Reset</button>
 </div>
 <div v-if="!geometric" class="l5d-controls complex-controls"><button aria-label="拡大" @click="zoom(.7)">Zoom ＋</button><button aria-label="縮小" @click="zoom(1/.7)">−</button><button aria-label="左へ移動" @click="pan(-.1,0)">←</button><button aria-label="右へ移動" @click="pan(.1,0)">→</button><button aria-label="上へ移動" @click="pan(0,.1)">↑</button><button aria-label="下へ移動" @click="pan(0,-.1)">↓</button><button @click="resetView">Reset View</button><template v-if="mode==='julia'"><label>c.real <input v-model.number="real" aria-label="Julia c の実部" type="number" min="-2" max="2" step="0.01"></label><label>c.imag <input v-model.number="imaginary" aria-label="Julia c の虚部" type="number" min="-2" max="2" step="0.01"></label></template></div>
 <canvas ref="canvas" class="l5d-visual fractal-canvas" width="560" height="240" role="img" :aria-label="`${mode} の生成結果`" @pointerdown="down" @pointermove="move" @pointerup="start=null" @pointercancel="start=null"/>
 <div class="l5d-readout" v-if="geometric">{{mode==='koch'?'線分数 = 4ⁿ':'三角形数 = 3ⁿ'}} → n = {{level}}：<strong>{{count.toLocaleString()}}</strong> {{mode==='koch'?'本':'個'}} ／ {{mode==='koch'?'各線分を 1/3 長の4本へ置換':'中央の三角形を除き、3つの三角形へ'}} </div>
 <div class="l5d-readout" v-else>z ← z²+c ／ {{mode==='mandelbrot'?'z₀=0、画素位置が c':`画素位置が z₀、c=(${c[0].toFixed(3)}, ${c[1].toFixed(3)})`}} ／ 横幅 {{span.toFixed(3)}}</div>
 <p class="l5d-note">{{geometric?'Step で規則を1回適用。反復回数が増えると、個数は指数的に増えます。':'ドラッグ／矢印で移動。濃い領域は上限まで発散を検出しない点（集合の近似）。逃走半径 max(2, |c|)、280×120 標本。'}}</p>
</section></template>
<style scoped>
.fractal-canvas{height:245px;object-fit:contain;background:#f2f7fb}.complex-controls{gap:6px 10px}.complex-controls label{gap:3px}.complex-controls input[type=number]{width:82px}.complex-controls button{padding:3px 7px}
</style>
