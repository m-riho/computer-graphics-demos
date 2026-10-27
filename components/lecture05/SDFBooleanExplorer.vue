<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { evaluateCircleBoolean, sampleScalarField, contourSegments, type Point2, type BooleanOperation } from '../../packages/cg-algorithms/src/nature-fields'
import './lecture05.css'
const operation = ref<BooleanOperation>('union')
const point = ref<Point2>([235,130]), bCenter = ref<Point2>([390,130])
const a = { center:[265,130] as Point2, radius:90 }
const b = computed(()=>({center:bCenter.value,radius:90}))
const result = computed(()=>evaluateCircleBoolean(point.value,a,b.value,operation.value))
const formula = computed(()=>operation.value==='union'?'min(dA, dB)':operation.value==='intersection'?'max(dA, dB)':'max(dA, −dB)')
const status = computed(()=>Math.abs(result.value.value)<.5?'境界付近（|d| < 0.5）':result.value.value<0?'内部（d < 0）':'外部（d > 0）')
const canvas=ref<HTMLCanvasElement|null>(null)
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  const grid=sampleScalarField((x,y)=>evaluateCircleBoolean([x,y],a,b.value,operation.value).value,144,52,720,260)
  ctx.fillStyle='#f3f7fb';ctx.fillRect(0,0,720,260)
  for(let y=0;y<grid.rows;y++)for(let x=0;x<grid.columns;x++){
    const value=grid.values[y*(grid.columns+1)+x]
    ctx.fillStyle=value<0?'#a8d8ee':'#f3f7fb';ctx.fillRect(x*5,y*5,5,5)
  }
  ctx.strokeStyle='#075985';ctx.lineWidth=3;ctx.beginPath()
  for(const [a,b] of contourSegments(grid,0)){ctx.moveTo(...a);ctx.lineTo(...b)}ctx.stroke()
}
watch([operation,bCenter],draw,{deep:true,flush:'post'});onMounted(draw)
let dragging:'point'|'b'|null=null
function down(event:PointerEvent,target:'point'|'b'){
  dragging=target;(event.currentTarget as SVGElement).setPointerCapture(event.pointerId)
}
function move(event:PointerEvent){
  if(!dragging)return
  const svg=(event.currentTarget as SVGElement).ownerSVGElement;if(!svg)return
  const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY
  const matrix=svg.getScreenCTM();if(!matrix)return
  const local=p.matrixTransform(matrix.inverse())
  const next:Point2=[Math.max(12,Math.min(708,local.x)),Math.max(12,Math.min(248,local.y))]
  if(dragging==='point')point.value=next;else bCenter.value=next
}
function key(event:KeyboardEvent,target:'point'|'b'){
  const delta:Record<string,Point2>={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}
  const d=delta[event.key];if(!d)return;event.preventDefault()
  const current=target==='point'?point.value:bCenter.value
  const next:Point2=[Math.max(12,Math.min(708,current[0]+d[0])),Math.max(12,Math.min(248,current[1]+d[1]))]
  if(target==='point')point.value=next;else bCenter.value=next
}
function reset(){operation.value='union';point.value=[235,130];bCenter.value=[390,130]}
</script>
<template><section class="l5d sdf-demo" aria-label="SDF と集合演算">
  <div class="l5d-controls"><label>集合演算 <select v-model="operation" aria-label="集合演算"><option value="union">Union：和集合</option><option value="intersection">Intersection：共通部分</option><option value="difference">A−B：差集合</option></select></label><button @click="reset">Reset</button><span>d(p) = |p−c|−r</span></div>
  <div class="sdf-plot l5d-visual"><canvas ref="canvas" width="720" height="260" aria-hidden="true"/><svg preserveAspectRatio="none" viewBox="0 0 720 260" aria-label="A・B の円と評価点 p。p と B のハンドルをドラッグ、または矢印キーで移動。">
    <circle :cx="a.center[0]" :cy="a.center[1]" r="90" fill="none" stroke="#5b6f84" stroke-dasharray="7 5" stroke-width="2"/>
    <circle :cx="bCenter[0]" :cy="bCenter[1]" r="90" fill="none" stroke="#985515" stroke-dasharray="3 4" stroke-width="2"/>
    <text :x="a.center[0]-65" :y="a.center[1]-58">A</text>
    <g class="handle" tabindex="0" role="button" aria-label="円 B を移動" @pointerdown="down($event,'b')" @pointermove="move" @pointerup="dragging=null" @pointercancel="dragging=null" @keydown="key($event,'b')"><circle :cx="bCenter[0]" :cy="bCenter[1]" r="15" fill="#fff" stroke="#985515" stroke-width="3"/><text :x="bCenter[0]" :y="bCenter[1]+6" text-anchor="middle">B</text></g>
    <line :x1="point[0]" :y1="point[1]" :x2="a.center[0]" :y2="a.center[1]" stroke="#42546b" stroke-dasharray="4 4"/>
    <g class="handle" tabindex="0" role="button" aria-label="評価点 p を移動" @pointerdown="down($event,'point')" @pointermove="move" @pointerup="dragging=null" @pointercancel="dragging=null" @keydown="key($event,'point')"><circle :cx="point[0]" :cy="point[1]" r="11" fill="#b91c1c" stroke="white" stroke-width="3"/><text :x="point[0]+16" :y="point[1]-12">p</text></g>
    <text x="14" y="26" style="font-size:17px">塗り＝内部 ／ 太線＝集合の境界</text>
  </svg></div>
  <div class="l5d-readout">dA = {{result.dA.toFixed(1)}} ／ dB = {{result.dB.toFixed(1)}} → {{formula}} = <strong>{{result.value.toFixed(1)}}</strong>：{{status}}</div>
  <p class="l5d-note">p と B をドラッグ（Tab＋矢印キーでも可）。合成値の符号は集合を表しますが、厳密な最短距離とは限りません。</p>
</section></template>
<style scoped>
.sdf-plot{position:relative;max-width:720px;aspect-ratio:720/260;margin:0 auto}.sdf-plot canvas,.sdf-plot svg{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}.sdf-plot svg{font-size:21px;overflow:hidden}.handle{cursor:grab;touch-action:none}.handle:focus{outline:none}.handle:focus circle{stroke:#7c3aed;stroke-width:5}
</style>
