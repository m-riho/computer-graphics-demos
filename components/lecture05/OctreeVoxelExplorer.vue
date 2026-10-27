<script setup lang="ts">
import { computed, ref } from 'vue'
import { voxelGrid, shapeOccupancy, buildOctree, treeStats, gridCubes, octreeCubes, shapeMesh, type ShapeName } from '../../packages/cg-algorithms/src/nature-spatial'
import SpatialCanvas from './SpatialCanvas.vue'
import './lecture05.css'
const shape=ref<ShapeName>('sphere'),depth=ref(3),mode=ref('octree'),showEmpty=ref(false),view=ref<InstanceType<typeof SpatialCanvas>>()
const grid=computed(()=>voxelGrid(depth.value,shapeOccupancy(shape.value))),tree=computed(()=>buildOctree(grid.value)),stats=computed(()=>treeStats(tree.value)),occupied=computed(()=>grid.value.data.reduce<number>((sum,n)=>sum+n,0)),mesh=computed(()=>shapeMesh(shape.value))
const cubes=computed(()=>mode.value==='surface'?undefined:mode.value==='octree'?octreeCubes(tree.value).filter(c=>showEmpty.value||c.occupied):gridCubes(grid.value,mode.value==='occupied'))
function reset(){shape.value='sphere';depth.value=3;mode.value='octree';showEmpty.value=false;view.value?.resetView()}
</script>
<template><section class="l5d octree-demo">
<div class="l5d-controls"><label>Shape <select v-model="shape"><option value="sphere">Sphere</option><option value="box">Box</option><option value="torus">Torus</option></select></label><label>Max depth <select v-model.number="depth"><option v-for="n in [1,2,3,4]" :value="n">{{ n }} ({{ 2**n }}³)</option></select></label><button @click="reset">Reset</button><button @click="view?.resetView()">Reset View</button></div>
<div class="l5d-controls"><button v-for="item in [{id:'occupied',label:'Occupied cells'},{id:'empty',label:'Empty cells'},{id:'octree',label:'Octree cells'},{id:'surface',label:'Original surface'}]" :key="item.id" :aria-pressed="mode===item.id" @click="mode=item.id">{{ item.label }}</button><label v-if="mode==='octree'"><input v-model="showEmpty" type="checkbox"/> 空の葉も表示</label></div>
<div class="l5d-grid2"><SpatialCanvas ref="view" :mesh="mesh" :cubes="cubes" :mode="mode" :height="260"/><div class="octree-data"><strong>x, y, z を分割 → 8 children</strong><table><thead><tr><th>データ構造</th><th>個数</th></tr></thead><tbody><tr><td>Uniform Grid</td><td>{{ grid.size }}³ = {{ grid.data.length }}</td></tr><tr><td>占有 / 空 cell</td><td>{{ occupied }} / {{ grid.data.length-occupied }}</td></tr><tr><td>Octree Leaf</td><td>{{ stats.leaves }}</td></tr><tr><td>Octree Internal</td><td>{{ stats.internal }}</td></tr><tr><td>Total / Depth</td><td>{{ stats.total }} / {{ stats.depth }}</td></tr></tbody></table><p>一様な8領域は1つの葉へ統合。<br/>青い面＝占有、細線の箱＝空。</p></div></div>
<p class="l5d-note">観察：境界は小cell、内部・外部は大cell。個数の比較はメモリのbyte数ではない。<br/>占有判定はcell中心の内外。粗いGridでは薄い形状が消えることがある。</p>
</section></template>
<style scoped>.octree-data{padding:10px;background:#f1f5f9;border-radius:8px}.octree-data table{border-collapse:collapse;width:100%;font-size:17px}.octree-data th,.octree-data td{text-align:left;border-bottom:1px solid #cbd5e1;padding:3px 5px}.octree-data p{margin:7px 0 0!important;font-size:16px!important}.octree-demo .l5d-note{font-size:16px!important}</style>
