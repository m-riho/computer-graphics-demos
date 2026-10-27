<script setup lang="ts">
import { computed, ref } from 'vue'
import { torusMesh, sampleMesh } from '../../packages/cg-algorithms/src/natural-modeling'
import { voxelizeMesh, gridCubes } from '../../packages/cg-algorithms/src/nature-spatial'
import SpatialCanvas from './SpatialCanvas.vue'
import './lecture05.css'
const modes=['Mesh','Wireframe','Vertices','Point Cloud','Voxel'],mode=ref('Mesh'),count=ref(1000),seed=ref(42),depth=ref(4),color=ref(false),view=ref<InstanceType<typeof SpatialCanvas>>()
const mesh=torusMesh(),samples=computed(()=>sampleMesh(mesh,Math.max(100,Math.min(100000,Number(count.value)||1000)),Number(seed.value)||0))
const voxels=computed(()=>voxelizeMesh(mesh,depth.value)),cubes=computed(()=>gridCubes(voxels.value,true))
const points=computed(()=>mode.value==='Vertices'?mesh.vertices:mode.value==='Point Cloud'?samples.value:undefined)
const description=computed(()=>mode.value==='Mesh'?'頂点の座標 + 面を作る頂点番号 → 接続関係（Connectivity）を持つ':mode.value==='Wireframe'?'Meshの辺を描く表示方法。元の頂点・面・接続関係は変わらない。':mode.value==='Vertices'?'元Meshの頂点だけを表示。面や辺の接続関係は描かない。':mode.value==='Point Cloud'?'三角形を面積比で選び、面内へ一様に点を配置。元頂点の抜き出しではない。':'閉じたMeshへのray交差で各cell中心の内外を判定し、占有cellを表示。')
function reset(){mode.value='Mesh';count.value=1000;seed.value=42;depth.value=4;color.value=false;view.value?.resetView()}
</script>
<template><section class="l5d character-demo">
  <div class="l5d-controls"><button v-for="name in modes" :key="name" :aria-pressed="mode===name" @click="mode=name">{{ name }}</button><button @click="reset">Reset</button><button @click="view?.resetView()">Reset View</button></div>
  <div class="l5d-controls options"><template v-if="mode==='Point Cloud'"><label>点数 <select v-model.number="count"><option v-for="n in [100,500,1000,10000,100000]" :value="n">{{ n.toLocaleString() }}</option></select></label><label>Seed <input v-model.number="seed" type="number" min="0" max="4294967295" aria-label="Sampling seed"/></label><label><input v-model="color" type="checkbox"/> 高さで色分け</label></template><label v-else-if="mode==='Voxel'">Grid <select v-model.number="depth"><option :value="3">8³</option><option :value="4">16³</option></select></label><span v-else>共通モデル：教材用の自作トーラス</span></div>
  <div class="l5d-grid2"><SpatialCanvas ref="view" :mesh="mesh" :points="points" :cubes="mode==='Voxel'?cubes:undefined" :mode="mode.toLowerCase()" :color="color" :height="270"/><div class="representation-data"><strong>{{ mode }} のデータ</strong><p>{{ description }}</p><dl><dt>元Mesh</dt><dd>{{ mesh.vertices.length }} vertices / {{ mesh.faces.length*3/2 }} edges / {{ mesh.faces.length }} faces</dd><template v-if="mode==='Point Cloud'"><dt>表示点</dt><dd>{{ samples.length.toLocaleString() }} points · Seed {{ Number(seed)||0 }}</dd><dt>接続情報</dt><dd>なし（座標のみ）</dd></template><template v-if="mode==='Voxel'"><dt>全cell / 占有cell</dt><dd>{{ voxels.size**3 }} / {{ cubes.length }}</dd></template><template v-else-if="mode==='Vertices'"><dt>表示点</dt><dd>{{ mesh.vertices.length }} 元頂点</dd></template></dl></div></div>
  <p class="l5d-note">観察：同じ形でも保存するデータが違う。Point Cloudは何点で形を認識できる？</p>
</section></template>
<style scoped>.options{min-height:32px}.options input[type=number]{width:105px}.representation-data{padding:12px;background:#f1f5f9;border-radius:8px}.representation-data p{margin:8px 0!important;line-height:1.45}.representation-data dl{margin:8px 0}.representation-data dt{font-weight:600}.representation-data dd{margin:0 0 8px}.character-demo .l5d-grid2{grid-template-columns:1.2fr 1fr}@media(max-width:700px){.character-demo .l5d-grid2{grid-template-columns:1fr}}</style>
