<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { cubeMesh, meshAdjacency, clampFinite } from '../../packages/cg-algorithms/src/mesh'
import './lecture04.css'
const mode=ref('Vertex'),selection=ref(0),offset=ref(0),view=ref<InstanceType<typeof MeshView>>()
const mesh=computed(()=>{const m=cubeMesh();m.vertices[6][0]+=clampFinite(offset.value,-.7,.8,0);return m})
const adj=computed(()=>meshAdjacency(mesh.value))
const count=computed(()=>mode.value==='Edge'?adj.value.edges.length:mode.value==='Face'?mesh.value.faces.length:mesh.value.vertices.length)
const id=computed(()=>Math.round(clampFinite(selection.value,0,count.value-1)))
const vertices=computed(()=>mode.value==='Face'?mesh.value.faces[id.value]:mode.value==='Edge'?adj.value.edges[id.value]:[id.value])
const edges=computed(()=>mode.value==='Edge'?[id.value]:mode.value==='Face'?adj.value.faceEdges[id.value]:adj.value.vertexEdges[id.value])
const faces=computed(()=>mode.value==='Face'?[id.value]:mode.value==='Edge'?adj.value.edgeFaces[id.value]:adj.value.vertexFaces[id.value])
function reset(){mode.value='Vertex';selection.value=0;offset.value=0;view.value?.resetView()}
</script>
<template><section class="modeling-demo" aria-label="Mesh explorer"><div class="modeling-controls"><button v-for="m in ['Vertex','Edge','Face','Geometry','Topology']" :key="m" type="button" :aria-pressed="mode===m" @click="mode=m;selection=(m==='Geometry'||m==='Topology')?6:0">{{m}}</button><button type="button" @click="reset">Reset</button></div>
<div class="modeling-grid"><MeshView ref="view" :mesh="mesh" :highlight-vertices="vertices" :highlight-edges="edges" :highlight-faces="mode==='Face'?faces:[]" :height="235"/><div>
<p><label>選択 {{mode==='Edge'?'edge':mode==='Face'?'face':'vertex'}} <select v-model.number="selection" aria-label="選択要素"><option v-for="n in count" :key="n" :value="n-1">{{n-1}}</option></select></label></p>
<p class="modeling-stats">V = 8 / E = 12 / F = 6</p><p>Vertex IDs: {{vertices.join(', ')}}</p><p>Edge IDs: {{edges.join(', ')}}</p><p>Face IDs: {{faces.join(', ')}}</p>
<p v-if="mode==='Vertex'||mode==='Geometry'||mode==='Topology'">v{{id}} = ({{mesh.vertices[id].map(x=>x.toFixed(2)).join(', ')}})</p>
<label v-if="mode==='Geometry'||mode==='Topology'">v6 の x 移動 <input v-model.number="offset" aria-label="Geometry displacement" type="range" min="-0.7" max="0.8" step="0.05"/></label>
</div></div><p class="modeling-note">{{mode==='Geometry'||mode==='Topology'?'観察：v6 の座標を変えても、接続する頂点・辺・面の番号は変わらない。Geometry = 位置 / Topology = 接続。':'観察：要素を選び、黄色の頂点・太い破線の辺と接続データを対応させよう。'}}</p>
</section></template>
