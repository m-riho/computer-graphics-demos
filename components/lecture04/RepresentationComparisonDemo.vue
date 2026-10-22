<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { cubeMesh, clampFinite, type Mesh } from '../../packages/cg-algorithms/src/mesh'
import './lecture04.css'
const mode=ref('Surface'),x=ref(.25),view=ref<InstanceType<typeof MeshView>>()
const mesh=cubeMesh()
const query=computed(()=>clampFinite(x.value,-1.8,1.8,.25))
const inside=computed(()=>Math.abs(query.value)<1?'内部':Math.abs(query.value)===1?'境界':'外部')
const probeMesh=computed<Mesh>(()=>({vertices:[[query.value,0,0]],faces:[]}))
function reset(){mode.value='Surface';x.value=.25;view.value?.resetView()}
</script>
<template><section class="modeling-demo" aria-label="Representation comparison">
  <div class="modeling-controls"><button v-for="m in ['Wireframe','Surface','Solid']" :key="m" type="button" :aria-pressed="mode===m" @click="mode=m">{{m}}</button><button type="button" @click="reset">Reset</button></div>
  <div class="modeling-grid"><MeshView ref="view" :mesh="mesh" :surface="mode!=='Wireframe'" :original-mesh="mode==='Solid'?probeMesh:undefined" :original-vertices="mode==='Solid'" :height="235"/>
    <div><table><thead><tr><th>表現</th><th>持つ情報</th></tr></thead><tbody><tr><td>Wireframe</td><td>8 vertices + 12 edges</td></tr><tr><td>Surface</td><td>さらに 6 faces</td></tr><tr><td>Solid</td><td>内部・外部を定義する規則</td></tr></tbody></table>
      <template v-if="mode==='Solid'"><p><label>検査点 x <input v-model.number="x" aria-label="検査点 x" type="range" min="-1.8" max="1.8" step="0.05"/></label></p><p class="modeling-stats">P = ({{query.toFixed(2)}}, 0, 0) → {{inside}}</p><p class="modeling-note">立方体なら |x|, |y|, |z| &lt; 1 が内部。白い点が検査点。</p></template>
      <p v-else class="modeling-note">{{mode==='Wireframe'?'線だけでは面の存在や内部は定義されない。':'面を塗る操作だけでは Solid にならない。閉じた境界と内部の解釈が必要。'}}</p>
    </div></div>
  <p class="modeling-note">観察：同じ形状でも、記録する情報と可能な問い合わせが異なる。</p>
</section></template>
