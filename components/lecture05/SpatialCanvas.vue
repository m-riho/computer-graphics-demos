<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { TriangleMesh, Vec3 } from '../../packages/cg-algorithms/src/natural-modeling'
import type { SpatialCube } from '../../packages/cg-algorithms/src/nature-spatial'
const props=withDefaults(defineProps<{mesh?:TriangleMesh;points?:Vec3[];cubes?:SpatialCube[];mode?:string;height?:number;color?:boolean}>(),{mode:'mesh',height:280,color:false})
const canvas=ref<HTMLCanvasElement>(),yaw=ref(.55),pitch=ref(-.65),zoom=ref(1)
let frame=0,observer:ResizeObserver|undefined,last:{x:number;y:number;id:number}|undefined
function resetView(){yaw.value=.55;pitch.value=-.65;zoom.value=1;schedule()}
defineExpose({resetView})
function project(p:Vec3,width:number,height:number):[number,number,number]{
  const x=Math.cos(yaw.value)*p[0]+Math.sin(yaw.value)*p[2],z=-Math.sin(yaw.value)*p[0]+Math.cos(yaw.value)*p[2]
  const y=Math.cos(pitch.value)*p[1]-Math.sin(pitch.value)*z,depth=Math.sin(pitch.value)*p[1]+Math.cos(pitch.value)*z
  const scale=Math.min(width*.28,height*.32)*zoom.value
  return [width/2+x*scale,height/2-y*scale,depth]
}
function draw(){
  const el=canvas.value;if(!el)return
  const width=Math.max(100,el.clientWidth),height=props.height,dpr=Math.min(window.devicePixelRatio||1,2)
  el.width=width*dpr;el.height=height*dpr
  const ctx=el.getContext('2d');if(!ctx)return
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#f3f7fc';ctx.fillRect(0,0,width,height)
  const projected=(p:Vec3)=>project(p,width,height)
  function polygon(points:number[][],fill:string|undefined,stroke:string|undefined){ctx!.beginPath();points.forEach((p,i)=>i?ctx!.lineTo(p[0],p[1]):ctx!.moveTo(p[0],p[1]));ctx!.closePath();if(fill){ctx!.fillStyle=fill;ctx!.fill()}if(stroke){ctx!.strokeStyle=stroke;ctx!.lineWidth=.65;ctx!.stroke()}}
  if(props.points){
    ctx.fillStyle='#175b9c'
    // 10万点でもDOMノードは増やさない。単色点は一括で描画。
    if(!props.color){ctx.beginPath();for(const p of props.points){const [x,y]=projected(p);ctx.rect(x,y,props.points.length<1000?2.8:1.4,props.points.length<1000?2.8:1.4)}ctx.fill()}
    else for(const p of props.points){const [x,y]=projected(p);ctx.fillStyle=`hsl(${210-p[1]*130} 70% 42%)`;ctx.fillRect(x,y,2,2)}
  }else if(props.cubes){
    const faces:{points:number[][];depth:number;fill?:string;stroke:string}[]=[]
    const indices=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]]
    for(const cube of props.cubes){const ps=Array.from({length:8},(_,i)=>projected([cube.center[0]+((i&1)?1:-1)*cube.size/2,cube.center[1]+((i&2)?1:-1)*cube.size/2,cube.center[2]+((i&4)?1:-1)*cube.size/2]))
      indices.forEach((ids,i)=>{const points=ids.map(id=>ps[id]);faces.push({points,depth:points.reduce((sum,p)=>sum+p[2],0)/4,fill:cube.occupied?`hsl(207 58% ${43+i*4}%)`:undefined,stroke:cube.occupied?'#1d4564':'#a6b6c9'})})
    }
    faces.sort((a,b)=>a.depth-b.depth).forEach(f=>polygon(f.points,f.fill,f.stroke))
  }else if(props.mesh){
    const ps=props.mesh.vertices.map(projected)
    const polygons=props.mesh.faces.map(ids=>{
      const points=ids.map(id=>ps[id]),[a,b,c]=ids.map(id=>props.mesh!.vertices[id])
      const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i])
      const nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0],length=Math.hypot(nx,ny,nz)||1
      const rx=Math.cos(yaw.value)*nx+Math.sin(yaw.value)*nz,rz=-Math.sin(yaw.value)*nx+Math.cos(yaw.value)*nz
      const ry=Math.cos(pitch.value)*ny-Math.sin(pitch.value)*rz,depthNormal=Math.sin(pitch.value)*ny+Math.cos(pitch.value)*rz
      const light=Math.max(0,(-.3*rx+.5*ry+.8*depthNormal)/length)
      return {points,depth:points.reduce((sum,p)=>sum+p[2],0)/3,light}
    }).sort((a,b)=>a.depth-b.depth)
    for(const f of polygons)polygon(f.points,props.mode==='wireframe'?undefined:`hsl(202 58% ${35+35*f.light}%)`,props.mode==='wireframe'?'#17496f':undefined)
  }
  ctx.fillStyle='#42566b';ctx.font='14px sans-serif';ctx.fillText('ドラッグ / 矢印：回転   ホイール / ＋−：拡大',12,height-12)
}
function schedule(){if(typeof requestAnimationFrame==='undefined'||frame)return;frame=requestAnimationFrame(()=>{frame=0;draw()})}
function down(e:PointerEvent){if(e.button!==0)return;(e.currentTarget as HTMLCanvasElement).focus({preventScroll:true});(e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);last={x:e.clientX,y:e.clientY,id:e.pointerId}}
function move(e:PointerEvent){if(!last||last.id!==e.pointerId)return;yaw.value+=(e.clientX-last.x)*.01;pitch.value=Math.max(-1.5,Math.min(1.5,pitch.value+(e.clientY-last.y)*.01));last={x:e.clientX,y:e.clientY,id:e.pointerId};schedule()}
function end(e:PointerEvent){if(last?.id===e.pointerId)last=undefined}
function wheel(e:WheelEvent){zoom.value=Math.max(.5,Math.min(2.3,zoom.value*Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*.002)));schedule()}
function key(e:KeyboardEvent){
  if(e.key==='Home')resetView();else if(e.key==='ArrowLeft')yaw.value-=.1;else if(e.key==='ArrowRight')yaw.value+=.1;else if(e.key==='ArrowUp')pitch.value=Math.max(-1.5,pitch.value-.1);else if(e.key==='ArrowDown')pitch.value=Math.min(1.5,pitch.value+.1);else if(e.key==='+'||e.key==='=')zoom.value=Math.min(2.3,zoom.value*1.1);else if(e.key==='-')zoom.value=Math.max(.5,zoom.value/1.1);else return
  e.preventDefault();e.stopPropagation();schedule()
}
watch(()=>[props.mesh,props.points,props.cubes,props.mode,props.color,props.height],schedule)
onMounted(()=>{observer=new ResizeObserver(schedule);if(canvas.value)observer.observe(canvas.value);draw()})
onBeforeUnmount(()=>{observer?.disconnect();cancelAnimationFrame(frame)})
</script>
<template><canvas ref="canvas" class="spatial-canvas" :style="{height:`${height}px`}" tabindex="0" role="img" :aria-label="`回転可能な3D表示: ${mode}。ドラッグ・矢印キーで回転、ホイールで拡大、Homeで視点リセット。`" @pointerdown.stop.prevent="down" @pointermove.stop="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @wheel.stop.prevent="wheel" @keydown="key" @click.stop>3D形状の描画にはCanvas対応ブラウザが必要です。</canvas></template>
<style scoped>.spatial-canvas{width:100%;display:block;border:1px solid #d5e0ec;border-radius:10px;cursor:grab;touch-action:none}.spatial-canvas:active{cursor:grabbing}.spatial-canvas:focus-visible{outline:3px solid #cc8b14}</style>
