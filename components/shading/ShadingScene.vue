<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createShadingRenderer, type ShadingSettings } from './shading-renderer'
import { createDisneyRenderer } from './disney-renderer'
const props=withDefaults(defineProps<{model:string;settings?:ShadingSettings;rotatable?:boolean}>(),{settings:()=>({}),rotatable:false})
const emit=defineEmits<{rotate:[dx:number,dy:number];resetRotation:[]}>()
const canvas=ref<HTMLCanvasElement>(),error=ref('')
const dragging=ref(false)
let pointer:number|undefined,lastX=0,lastY=0
function startRotation(event:PointerEvent) {
  if(!props.rotatable || !event.isPrimary || event.button!==0) return
  event.preventDefault();event.stopPropagation()
  pointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;dragging.value=true
  canvas.value?.focus({preventScroll:true});canvas.value?.setPointerCapture(pointer)
}
function moveRotation(event:PointerEvent) {
  if(!props.rotatable || pointer!==event.pointerId) return
  event.preventDefault()
  emit('rotate',event.clientX-lastX,event.clientY-lastY)
  lastX=event.clientX;lastY=event.clientY
}
function endRotation(event:PointerEvent) {
  if(pointer!==event.pointerId) return
  pointer=undefined;dragging.value=false
  if(canvas.value?.hasPointerCapture(event.pointerId)) canvas.value.releasePointerCapture(event.pointerId)
}
function keyRotation(event:KeyboardEvent) {
  if(!props.rotatable) return
  const delta:Record<string,[number,number]>={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}
  if(event.key!=='Home' && !delta[event.key]) return
  event.preventDefault();event.stopPropagation()
  if(event.key==='Home') emit('resetRotation')
  else emit('rotate',...delta[event.key]!)
}
let renderer:ReturnType<typeof createShadingRenderer>|undefined,observer:ResizeObserver|undefined,frame=0
function draw() {
  frame=0
  try {renderer?.render(props.model,props.settings)} catch(e) {error.value=e instanceof Error?e.message:String(e)}
}
function schedule() {if(!frame)frame=requestAnimationFrame(draw)}
function lost(event:Event) {event.preventDefault();error.value='WebGL コンテキストが失われました。復旧を待っています。'}
function restored() {renderer?.dispose(false);initialize()}
function initialize() {
  try {renderer=(props.model==='disney-brdf'?createDisneyRenderer:createShadingRenderer)(canvas.value!);error.value='';schedule()} catch(e) {error.value=e instanceof Error?e.message:String(e)}
}
onMounted(()=>{
  initialize();observer=new ResizeObserver(schedule);observer.observe(canvas.value!)
  canvas.value!.addEventListener('webglcontextlost',lost);canvas.value!.addEventListener('webglcontextrestored',restored)
})
watch(()=>[props.model,props.settings],schedule,{deep:true})
onBeforeUnmount(()=>{cancelAnimationFrame(frame);observer?.disconnect();renderer?.dispose();canvas.value?.removeEventListener('webglcontextlost',lost);canvas.value?.removeEventListener('webglcontextrestored',restored)})
</script>
<template>
  <div class="shading-scene" :data-model="model">
    <canvas ref="canvas" role="img" :class="{rotatable,dragging}" :tabindex="rotatable?0:undefined"
      :aria-label="`${model}：照明モデルの WebGL 描画${rotatable?'。ドラッグまたは矢印キーで物体を回転。Homeキーで向きを戻す。':''}`"
      @pointerdown="startRotation" @pointermove="moveRotation" @pointerup="endRotation" @pointercancel="endRotation" @lostpointercapture="endRotation" @keydown="keyRotation" />
    <p v-if="error" class="shading-error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped>
.shading-scene{position:relative;width:100%;min-width:0;aspect-ratio:4/3;min-height:180px;overflow:hidden;background:#091222;border-radius:12px}
canvas{display:block;width:100%;height:100%;position:absolute;inset:0}
canvas.rotatable{cursor:grab;touch-action:none}
canvas.dragging{cursor:grabbing}
canvas:focus-visible{outline:3px solid #64e8bc;outline-offset:-4px}
.shading-error{position:absolute;inset:12px;padding:12px;background:#3f1820;color:#fff;font-size:14px;overflow:auto;white-space:pre-wrap}
</style>
