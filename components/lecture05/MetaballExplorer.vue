<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { metaballField, sampleScalarField, contourSegments, type Point2, type FieldBall } from '../../packages/cg-algorithms/src/nature-fields'
import './lecture05.css'
const initial:Point2[]=[[280,130],[420,130],[350,65],[210,180],[500,180]]
const count=ref(2),centers=ref<Point2[]>(initial.map(p=>[...p])),selected=ref(0)
const weights=ref([1,1,1,1,1]),radii=ref([145,145,145,145,145]),threshold=ref(.35)
const heatmap=ref(true),contour=ref(true),showCenters=ref(true)
const balls=computed<FieldBall[]>(()=>centers.value.slice(0,count.value).map((center,i)=>({center,radius:radii.value[i],weight:weights.value[i]})))
const middleValue=computed(()=>metaballField([350,130],balls.value))
const canvas=ref<HTMLCanvasElement|null>(null)
function draw(){
 const ctx=canvas.value?.getContext('2d');if(!ctx)return
 const grid=sampleScalarField((x,y)=>metaballField([x,y],balls.value),144,52,720,260)
 ctx.fillStyle='#f2f7fb';ctx.fillRect(0,0,720,260)
 for(let y=0;y<grid.rows;y++)for(let x=0;x<grid.columns;x++){
   const value=grid.values[y*(grid.columns+1)+x]
   ctx.fillStyle=heatmap.value?`hsl(${215-65*Math.min(1,value)}, ${25+55*Math.min(1,value)}%, ${97-62*Math.min(1,value/1.6)}%)`:value>=threshold.value?'#acd9df':'#f2f7fb'
   ctx.fillRect(x*5,y*5,5,5)
 }
 if(contour.value){ctx.strokeStyle='#112f44';ctx.lineWidth=3;ctx.beginPath();for(const [a,b]of contourSegments(grid,threshold.value)){ctx.moveTo(...a);ctx.lineTo(...b)}ctx.stroke()}
}
watch([balls,threshold,heatmap,contour],draw,{deep:true,flush:'post'});onMounted(draw)
watch(count,()=>{selected.value=Math.min(selected.value,count.value-1)})
let dragging=-1
function down(event:PointerEvent,index:number){selected.value=index;dragging=index;(event.currentTarget as SVGElement).setPointerCapture(event.pointerId)}
function move(event:PointerEvent){
 if(dragging<0)return
 const svg=(event.currentTarget as SVGElement).ownerSVGElement, matrix=svg?.getScreenCTM();if(!svg||!matrix)return
 const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const p=point.matrixTransform(matrix.inverse())
 centers.value[dragging]=[Math.max(12,Math.min(708,p.x)),Math.max(12,Math.min(248,p.y))]
}
function key(event:KeyboardEvent,index:number){
 const deltas:Record<string,Point2>={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}
 const d=deltas[event.key];if(!d)return;event.preventDefault();selected.value=index
 const p=centers.value[index];centers.value[index]=[Math.max(12,Math.min(708,p[0]+d[0])),Math.max(12,Math.min(248,p[1]+d[1]))]
}
function reset(){count.value=2;centers.value=initial.map(p=>[...p]);selected.value=0;weights.value=[1,1,1,1,1];radii.value=[145,145,145,145,145];threshold.value=.35;heatmap.value=true;contour.value=true;showCenters.value=true}
</script>
<template><section class="l5d metaball-demo" aria-label="Metaball の影響値と等値線">
 <div class="l5d-controls"><label>中心数 <select v-model.number="count" aria-label="Metaball の中心数"><option v-for="n in [2,3,4,5]" :key="n">{{n}}</option></select></label><label>編集 <select v-model.number="selected" aria-label="編集する中心"><option v-for="n in count" :key="n" :value="n-1">中心 {{n}}</option></select></label><label>Weight {{weights[selected].toFixed(1)}} <input v-model.number="weights[selected]" aria-label="選択中心の Weight" type="range" min="0.2" max="2" step="0.1"></label><label>半径 {{radii[selected]}} <input v-model.number="radii[selected]" aria-label="選択中心の影響半径" type="range" min="60" max="230" step="5"></label><button @click="reset">Reset</button></div>
 <div class="l5d-controls"><label>閾値 τ {{threshold.toFixed(2)}} <input v-model.number="threshold" aria-label="Metaball の閾値" type="range" min="0.1" max="1.5" step="0.05"></label><label><input v-model="heatmap" type="checkbox"> Field heatmap</label><label><input v-model="contour" type="checkbox"> 等値線</label><label><input v-model="showCenters" type="checkbox"> 中心</label></div>
 <div class="meta-plot l5d-visual"><canvas ref="canvas" width="720" height="260" aria-hidden="true"/><svg preserveAspectRatio="none" viewBox="0 0 720 260" aria-label="中心をドラッグすると、影響値を加算した等値線が融合する">
 <g v-if="showCenters"><g v-for="(ball,i) in balls" :key="i" class="handle" tabindex="0" role="button" :aria-label="`中心 ${i+1} を移動`" @pointerdown="down($event,i)" @pointermove="move" @pointerup="dragging=-1" @pointercancel="dragging=-1" @keydown="key($event,i)"><circle :cx="ball.center[0]" :cy="ball.center[1]" r="15" fill="white" :stroke="i===selected?'#b45309':'#174f68'" :stroke-width="i===selected?4:2"/><text :x="ball.center[0]" :y="ball.center[1]+6" text-anchor="middle">{{i+1}}</text></g></g>
 <path d="M344 130h12m-6 -6v12" stroke="#9f1239" stroke-width="2"/><text x="14" y="25">太線：F(p)=τ ／ 中心の数字をドラッグ</text></svg></div>
 <div class="l5d-readout">F(p) = Σ wᵢ max(0, 1−|p−cᵢ|²/rᵢ²)³ ／ 中央＋の F = {{middleValue.toFixed(3)}}（{{middleValue>=threshold?'内部：F ≥ τ':'外部：F < τ'}}）</div>
 <p class="l5d-note">中心を離す → 近づける → 首がつながる。Boolean は集合を結合し、Metaball は影響値を足して等値面を作ります。</p>
</section></template>
<style scoped>
.meta-plot{position:relative;max-width:720px;aspect-ratio:720/260;margin:0 auto}.meta-plot canvas,.meta-plot svg{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}.meta-plot svg{font-size:18px}.handle{cursor:grab;touch-action:none}.handle:focus{outline:none}.handle:focus circle{stroke:#7c3aed;stroke-width:5}.metaball-demo input[type=range]{width:85px}
</style>
