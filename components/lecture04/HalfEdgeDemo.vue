<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { cubeMesh, meshEdges, edgeKey, clampFinite } from '../../packages/cg-algorithms/src/mesh'
import { buildHalfEdges, faceLoop, vertexLoop } from '../../packages/cg-algorithms/src/half-edge'
import './lecture04.css'
const mesh=cubeMesh(),halfEdges=buildHalfEdges(mesh),edges=meshEdges(mesh)
const selected=ref(4),loop=ref<number[]>([]),action=ref('half-edge を選択'),view=ref<InstanceType<typeof MeshView>>()
const id=computed(()=>Math.round(clampFinite(selected.value,0,halfEdges.length-1,4)))
const h=computed(()=>halfEdges[id.value])
const highlighted=computed(()=>(loop.value.length?loop.value:[id.value]).map(i=>edges.findIndex(([a,b])=>edgeKey(a,b)===edgeKey(halfEdges[i].origin,halfEdges[i].destination))))
function move(kind:'next'|'twin'){selected.value=h.value[kind];loop.value=[];action.value=kind==='next'?'同じ face の次の辺へ':'反対向きの辺を通って隣の face へ'}
function showLoop(kind:'face'|'vertex'){loop.value=kind==='face'?faceLoop(halfEdges,id.value):vertexLoop(halfEdges,id.value);action.value=kind==='face'?'next を繰り返して face を一周':'twin → next を繰り返して origin の周囲を一周'}
function reset(){selected.value=4;loop.value=[];action.value='half-edge を選択';view.value?.resetView()}
</script>
<template><section class="modeling-demo" aria-label="Half-edge traversal"><div class="modeling-controls"><label>half-edge <select v-model.number="selected" aria-label="half-edge" @change="loop=[]"><option v-for="e in halfEdges" :key="e.id" :value="e.id">h{{e.id}}: v{{e.origin}} → v{{e.destination}}</option></select></label><button type="button" @click="move('next')">next</button><button type="button" @click="move('twin')">twin</button><button type="button" @click="showLoop('face')">face</button><button type="button" @click="showLoop('vertex')">vertex</button><button type="button" @click="reset">Reset</button></div>
<div class="modeling-grid"><MeshView ref="view" :mesh="mesh" :highlight-edges="highlighted" :highlight-vertices="[h.origin]" :highlight-faces="[h.face]" :directed-edge="[h.origin,h.destination]" :height="235"/><div><p class="modeling-stats">h{{h.id}} : v{{h.origin}} → v{{h.destination}}</p><p>origin = v{{h.origin}} / next = h{{h.next}}</p><p>twin = h{{h.twin}} / face = f{{h.face}}</p><p>{{action}}</p><p v-if="loop.length">巡回：{{loop.map(i=>`h${i}`).join(' → ')}} → h{{id}}</p><p class="modeling-note">矢印＝選択 half-edge、黄色面＝所属 face、太い破線＝巡回した辺。</p></div></div><p class="modeling-note">origin は始点と定義。next は面上を移動、twin は同じ辺を逆向きに移動する。</p>
</section></template>
