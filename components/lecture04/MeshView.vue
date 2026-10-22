<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { clampFinite, meshEdges, validateMesh, type Mesh, type Vec3 } from '../../packages/cg-algorithms/src/mesh'
const props=withDefaults(defineProps<{mesh:Mesh;wireframe?:boolean;surface?:boolean;originalMesh?:Mesh;originalVertices?:boolean;highlightVertices?:number[];highlightEdges?:number[];highlightFaces?:number[];height?:number;directedEdge?:[number,number]}>(),{wireframe:true,surface:true,originalVertices:false,height:260})
const yaw=ref(32),pitch=ref(-22),zoom=ref(1),dragging=ref(false),markerId=`arrow-${useId()}`
// View operations change only the projection, never the mesh data.
const pointers=new Map<number,{x:number;y:number}>()
function resetView(){yaw.value=32;pitch.value=-22;zoom.value=1}
function rotate(dx:number,dy:number){
  yaw.value=((yaw.value+dx+180)%360+360)%360-180
  pitch.value=clampFinite(pitch.value+dy,-80,80,-22)
}
function setZoom(value:number){zoom.value=clampFinite(value,.5,2.5,1)}
function pointerDown(event:PointerEvent){
  if(event.pointerType==='mouse'&&event.button!==0)return
  const svg=event.currentTarget as SVGSVGElement
  svg.focus({preventScroll:true})
  svg.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY})
  dragging.value=true
}
function pointerMove(event:PointerEvent){
  const previous=pointers.get(event.pointerId)
  if(!previous)return
  const current={x:event.clientX,y:event.clientY}
  const other=[...pointers.entries()].find(([id])=>id!==event.pointerId)?.[1]
  if(other){
    const before=Math.hypot(previous.x-other.x,previous.y-other.y)
    const after=Math.hypot(current.x-other.x,current.y-other.y)
    if(before>1)setZoom(zoom.value*after/before)
  }else{
    const box=(event.currentTarget as SVGSVGElement).getBoundingClientRect()
    rotate((current.x-previous.x)*360/Math.max(1,box.width),(current.y-previous.y)*180/Math.max(1,box.height))
  }
  pointers.set(event.pointerId,current)
}
function pointerEnd(event:PointerEvent){
  pointers.delete(event.pointerId)
  dragging.value=pointers.size>0
  const svg=event.currentTarget as SVGSVGElement
  if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId)
}
function wheel(event:WheelEvent){
  const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewportHeight.value:1)
  setZoom(zoom.value*Math.exp(-Math.max(-200,Math.min(200,pixels))*.002))
}
function keydown(event:KeyboardEvent){
  switch(event.key){
    case 'ArrowLeft':rotate(-5,0);break
    case 'ArrowRight':rotate(5,0);break
    case 'ArrowUp':rotate(0,-5);break
    case 'ArrowDown':rotate(0,5);break
    case '+':case '=':setZoom(zoom.value*1.1);break
    case '-':case '_':setZoom(zoom.value/1.1);break
    case 'Home':resetView();break
    default:return
  }
  event.preventDefault()
  event.stopPropagation()
}
defineExpose({resetView})
const error=computed(()=>validateMesh(props.mesh)[0]??'')
const viewportHeight=computed(()=>clampFinite(props.height,120,600,260))
const transform=computed(()=>{
  const all=[...props.mesh.vertices,...(props.originalMesh?.vertices??[])].filter(v=>v.every(Number.isFinite))
  const low=[0,1,2].map(k=>Math.min(...all.map(v=>v[k]),0)),high=[0,1,2].map(k=>Math.max(...all.map(v=>v[k]),0))
  const center=low.map((v,i)=>(v+high[i])/2),radius=Math.max(.1,...all.map(v=>Math.hypot(...v.map((x,i)=>x-center[i]))))
  const scale=Math.min(220,viewportHeight.value*.43)/radius*zoom.value
  const y=clampFinite(yaw.value,-180,180,32)*Math.PI/180,p=clampFinite(pitch.value,-80,80,-22)*Math.PI/180
  return (v:Vec3)=>{const [a,b,c]=v.map((x,i)=>x-center[i]),x=Math.cos(y)*a+Math.sin(y)*c,z=-Math.sin(y)*a+Math.cos(y)*c,yy=Math.cos(p)*b-Math.sin(p)*z,zz=Math.sin(p)*b+Math.cos(p)*z;return [250+x*scale,viewportHeight.value/2-yy*scale,zz*scale]}
})
const points=computed(()=>error.value?[]:props.mesh.vertices.map(transform.value))
const edges=computed(()=>error.value?[]:meshEdges(props.mesh))
const originalPoints=computed(()=>(props.originalMesh?.vertices??[]).filter(v=>v.every(Number.isFinite)).map(transform.value))
const originalEdges=computed(()=>props.originalMesh?meshEdges(props.originalMesh):[])
const polygons=computed(()=>{
  if(error.value)return []
  const result=props.mesh.faces.map((face,id)=>{
    const ps=face.map(v=>points.value[v]); const normal=[0,0,0]
    ps.forEach((a,i)=>{const b=ps[(i+1)%ps.length];normal[0]+=(a[1]-b[1])*(a[2]+b[2]);normal[1]+=(a[2]-b[2])*(a[0]+b[0]);normal[2]+=(a[0]-b[0])*(a[1]+b[1])})
    // Undo the screen-y reflection when interpreting the face normal.
    const nx=-normal[0],ny=normal[1],nz=-normal[2]
    const length=Math.hypot(nx,ny,nz)||1,light=Math.max(0,(-.35*nx+.5*ny+.79*nz)/length)
    const spec=Math.pow(Math.max(0,(-.18*nx+.25*ny+.95*nz)/length),24)
    const lum=Math.min(90,37+33*light+20*spec)
    return {id,points:ps.map(p=>`${p[0]},${p[1]}`).join(' '),depth:ps.reduce((sum,p)=>sum+p[2],0)/ps.length,fill:`hsl(202 48% ${lum}%)`}
  })
  return result.sort((a,b)=>a.depth-b.depth)
})
</script>
<template>
  <div class="mesh-view">
    <svg tabindex="0" :class="{dragging}" @pointerdown.stop.prevent="pointerDown" @pointermove.stop="pointerMove" @pointerup.stop="pointerEnd" @pointercancel="pointerEnd" @lostpointercapture="pointerEnd" @wheel.stop.prevent="wheel" @keydown="keydown" @click.stop
      :viewBox="`0 0 500 ${viewportHeight}`" :style="{height:`${viewportHeight}px`}" role="img" aria-label="3Dメッシュ。ドラッグ・矢印キーで回転、ホイール・＋−キーで拡大縮小、Homeで視点リセット。黄色の太線・頂点ラベルは選択要素、破線は元の制御メッシュ。">
      <defs><marker :id="markerId" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#9a3412"/></marker></defs>
      <text v-if="error" x="20" y="40" fill="#9a3412">表示できないメッシュ: {{ error }}</text>
      <g v-else>
        <g v-if="surface"><polygon v-for="p in polygons" :key="p.id" :points="p.points" :fill="highlightFaces?.includes(p.id)?'#fbbf24':p.fill" :stroke="wireframe?'#244459':p.fill" :stroke-width="wireframe?.8:.35"/></g>
        <g v-if="wireframe && !surface" stroke="#365c78" stroke-width="1.7" fill="none"><line v-for="([a,b],id) in edges" :key="id" :x1="points[a]?.[0]" :y1="points[a]?.[1]" :x2="points[b]?.[0]" :y2="points[b]?.[1]"/></g>
        <g v-if="originalMesh" stroke="#713b9c" stroke-width="1.1" stroke-dasharray="5 4" opacity=".85"><line v-for="([a,b],i) in originalEdges" :key="i" :x1="originalPoints[a]?.[0]" :y1="originalPoints[a]?.[1]" :x2="originalPoints[b]?.[0]" :y2="originalPoints[b]?.[1]"/></g>
        <g v-if="originalVertices" fill="white" stroke="#713b9c" stroke-width="2"><circle v-for="(p,i) in (originalMesh?originalPoints:points)" :key="i" :cx="p[0]" :cy="p[1]" r="3.5"/></g>
        <g stroke="#a94700" stroke-width="4" stroke-dasharray="8 2"><template v-for="id in highlightEdges" :key="id"><line v-if="edges[id]" :x1="points[edges[id][0]][0]" :y1="points[edges[id][0]][1]" :x2="points[edges[id][1]][0]" :y2="points[edges[id][1]][1]"/></template></g>
        <g v-for="id in highlightVertices" :key="id"><template v-if="points[id]"><circle :cx="points[id][0]" :cy="points[id][1]" r="6" fill="#fbbf24" stroke="#78350f" stroke-width="2"/><text :x="points[id][0]+9" :y="points[id][1]-9" fill="#78350f" stroke="white" stroke-width="3" paint-order="stroke" font-size="16">v{{ id }}</text></template></g>
        <line v-if="directedEdge && points[directedEdge[0]] && points[directedEdge[1]]" :x1="points[directedEdge[0]][0]" :y1="points[directedEdge[0]][1]" :x2="points[directedEdge[1]][0]" :y2="points[directedEdge[1]][1]" stroke="#9a3412" stroke-width="4" :marker-end="`url(#${markerId})`"/>
      </g>
    </svg>
    <div class="mesh-view-controls"><label>Yaw <input v-model.number="yaw" aria-label="Yaw" type="range" min="-180" max="180"/></label><label>Pitch <input v-model.number="pitch" aria-label="Pitch" type="range" min="-80" max="80"/></label><label>Zoom <input v-model.number="zoom" aria-label="Zoom" type="range" min=".5" max="2.5" step=".05"/></label><button type="button" @click="resetView">Reset View</button></div>
    <p class="mesh-view-help">ドラッグ：回転 · ホイール／ピンチ：拡大縮小</p>
  </div>
</template>
<style scoped>
.mesh-view {min-width:0}.mesh-view svg{display:block;width:100%;background:radial-gradient(ellipse at center,#edf4fa,#f7fafc);border-radius:8px;touch-action:none;cursor:grab;user-select:none}.mesh-view svg.dragging{cursor:grabbing}.mesh-view svg:focus-visible{outline:3px solid #d08c00;outline-offset:2px}.mesh-view-help{margin:2px 0 0!important;text-align:center;font-size:11px!important;color:#526579}.mesh-view-controls{display:flex;justify-content:center;align-items:center;gap:8px;font-size:12px;flex-wrap:wrap}.mesh-view-controls label{display:flex;align-items:center;gap:4px}.mesh-view-controls input{width:65px}.mesh-view-controls button{padding:2px 5px;font-size:12px}
</style>
