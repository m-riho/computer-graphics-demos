<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createShadingRenderer, type ShadingSettings } from './shading-renderer'
const props=withDefaults(defineProps<{model:string;settings?:ShadingSettings}>(),{settings:()=>({})})
const canvas=ref<HTMLCanvasElement>(),error=ref('')
let renderer:ReturnType<typeof createShadingRenderer>|undefined,observer:ResizeObserver|undefined,frame=0
function draw() {
  frame=0
  try {renderer?.render(props.model,props.settings)} catch(e) {error.value=e instanceof Error?e.message:String(e)}
}
function schedule() {if(!frame)frame=requestAnimationFrame(draw)}
function lost(event:Event) {event.preventDefault();error.value='WebGL コンテキストが失われました。復旧を待っています。'}
function restored() {renderer?.dispose(false);initialize()}
function initialize() {
  try {renderer=createShadingRenderer(canvas.value!);error.value='';schedule()} catch(e) {error.value=e instanceof Error?e.message:String(e)}
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
    <canvas ref="canvas" role="img" :aria-label="`${model}：照明モデルの WebGL 描画`" />
    <p v-if="error" class="shading-error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped>
.shading-scene{position:relative;width:100%;min-width:0;aspect-ratio:4/3;min-height:180px;overflow:hidden;background:#091222;border-radius:12px}
canvas{display:block;width:100%;height:100%;position:absolute;inset:0}
.shading-error{position:absolute;inset:12px;padding:12px;background:#3f1820;color:#fff;font-size:14px;overflow:auto;white-space:pre-wrap}
</style>
