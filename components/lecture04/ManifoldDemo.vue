<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { analyzeManifold, manifoldPreset, type ManifoldPreset } from '../../packages/cg-algorithms/src/manifold'
import './lecture04.css'
const preset=ref<ManifoldPreset>('closed'),view=ref<InstanceType<typeof MeshView>>()
const options:[ManifoldPreset,string][]=[['closed','Closed cube'],['open','Open boundary'],['three-faces','3 faces sharing an edge'],['touching','Two solids touching at one vertex'],['internal','Internal face']]
const mesh=computed(()=>manifoldPreset(preset.value)),report=computed(()=>analyzeManifold(mesh.value))
const label=computed(()=>({'closed':'Closed manifold（閉じた多様体）','boundary':'Boundary manifold（境界つき多様体）','non-manifold':'Non-manifold（非多様体）','invalid':'Invalid mesh'}[report.value.kind]))
const reason=computed(()=>({closed:'各辺に2面。各頂点の周囲は1本の閉じた輪。',open:'境界辺に1面。境界頂点の周囲は1本の開いた鎖。','three-faces':'1本の辺に3面が接続し、近傍が平面にならない。',touching:'共有頂点の周囲が2つの輪に分かれる。辺の面数だけでは発見できない。',internal:'内部の独立した1枚の面も境界つき多様体。全体は2成分で、閉じた固体境界としては不適切。'}[preset.value]))
function reset(){preset.value='closed';view.value?.resetView()}
</script>
<template><section class="modeling-demo" aria-label="Manifold inspection"><div class="modeling-controls"><label>例 <select v-model="preset" aria-label="Manifold preset"><option v-for="[id,title] in options" :key="id" :value="id">{{title}}</option></select></label><button type="button" @click="reset">Reset</button></div><div class="modeling-grid"><MeshView ref="view" :mesh="mesh" :surface="preset!=='internal'" :highlight-vertices="report.badVertices" :highlight-edges="[...report.badEdges,...report.boundaryEdges]" :highlight-faces="preset==='internal'?[6]:[]" :height="235"/><div><p class="modeling-stats">{{label}}</p><p>{{reason}}</p><p>境界辺 {{report.boundaryEdges.length}} / 異常辺 {{report.badEdges.length}}<br/>異常頂点 {{report.badVertices.length}} / 連結成分 {{report.components}}</p><p class="modeling-note">太い破線＝境界または異常辺。ラベル付き頂点＝周囲が輪・鎖にならない頂点。</p></div></div><p class="modeling-note">Boolean・内外判定・3D printing には閉じ方と法線方向も必要。これは接続の検査であり、自己交差の幾何検査は含まない。</p></section></template>
