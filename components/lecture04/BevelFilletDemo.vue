<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { bevelCube } from '../../packages/cg-algorithms/src/bevel'
const width=ref(.3),segments=ref(4),wire=ref(false)
const view=ref<InstanceType<typeof MeshView>>(),beforeView=ref<InstanceType<typeof MeshView>>()
const original=bevelCube(0,1)
const state=computed(()=>{try{return {mesh:bevelCube(width.value,segments.value),error:''}}catch(error){return {mesh:{vertices:[],faces:[]},error:String(error)}}})
function reset(){width.value=.3;segments.value=4;wire.value=false;view.value?.resetView();beforeView.value?.resetView()}
</script>
<template>
  <section class="operation-demo" aria-label="Bevel Fillet demo">
    <div class="toolbar"><button :aria-pressed="width===0" @click="width=0;segments=1">Sharp</button><button :aria-pressed="width>0 && segments===1" @click="width=.3;segments=1">Chamfer / Bevel</button><button :aria-pressed="width>0 && segments>1" @click="width=.3;segments=4">Rounded / Fillet-like</button><button @click="reset">Reset</button></div>
    <div class="toolbar sliders"><label>Width <input v-model.number="width" aria-label="Bevel width" type="range" min="0" max=".8" step=".05"/>{{width.toFixed(2)}}</label><label>Segments <input v-model.number="segments" aria-label="Bevel segments" type="range" min="1" max="8" step="1"/>{{segments}}</label><label><input v-model="wire" type="checkbox"/> Wireframe</label></div>
    <div class="views"><div><strong>処理前：鋭い稜線</strong><MeshView ref="beforeView" :mesh="original" :wireframe="wire" :height="225"/></div><div><strong>処理後：V {{state.mesh.vertices.length}} / F {{state.mesh.faces.length}}</strong><MeshView ref="view" :mesh="state.mesh" :wireframe="wire" :height="225"/></div></div>
    <p v-if="state.error" role="alert">{{state.error}}</p><p v-else>観察：固定照明の明るい帯を見る。Widthは角を丸める範囲、Segmentsはその曲面を近似する面の細かさ。</p>
    <p class="note">内側の立方体＋円柱状の辺＋球面状の隅を構成する教材用rounded box。1分割は平面の面取り。CAD/DCCで用語は異なり、Filletは一般に丸みを指す。</p>
  </section>
</template>
<style scoped>
.operation-demo{font-size:14px;line-height:1.35;border:1px solid #cbd5e1;border-radius:10px;padding:10px;background:#fff;color:#16324f}.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.toolbar label{display:flex;align-items:center;gap:5px}button{font:inherit;border:1px solid #94a3b8;border-radius:5px;background:#f8fafc;padding:3px 8px}button[aria-pressed=true]{background:#dbeafe;border-color:#2563eb}.sliders{margin:9px 0}.sliders input[type=range]{width:150px}.views{display:grid;grid-template-columns:1fr 1fr;gap:12px}.views>div{min-width:0}.views strong{font-size:14px}.operation-demo p{margin:7px 0 0}.note{font-size:12px;color:#475569}@media(max-width:600px){.views{grid-template-columns:1fr}.sliders input[type=range]{width:100px}}
</style>
