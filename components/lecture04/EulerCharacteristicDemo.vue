<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { cubeMesh } from '../../packages/cg-algorithms/src/mesh'
import { eulerCharacteristic, splitEdge, splitFace, torusMesh } from '../../packages/cg-algorithms/src/euler-characteristic'
import './lecture04.css'
const preset=ref('Cube'),mesh=ref(cubeMesh()),steps=ref(0),view=ref<InstanceType<typeof MeshView>>()
const counts=computed(()=>eulerCharacteristic(mesh.value))
const splitFaceIndex=computed(()=>mesh.value.faces.findIndex(f=>f.length>=4))
function load(){mesh.value=preset.value==='Torus'?torusMesh():cubeMesh();steps.value=0}
function split(kind:'edge'|'face'){mesh.value=kind==='edge'?splitEdge(mesh.value,0):splitFace(mesh.value,splitFaceIndex.value);steps.value++}
function reset(){preset.value='Cube';load();view.value?.resetView()}
</script>
<template><section class="modeling-demo" aria-label="Euler characteristic"><div class="modeling-controls"><label>形状 <select v-model="preset" aria-label="Euler shape" @change="load"><option>Cube</option><option>Torus</option></select></label><button type="button" :disabled="steps>=12" @click="split('edge')">Split Edge</button><button type="button" :disabled="steps>=12||splitFaceIndex<0" @click="split('face')">Split Face</button><button type="button" @click="reset">Reset</button></div><div class="modeling-grid"><MeshView ref="view" :mesh="mesh" :original-vertices="true" :height="235"/><div><p class="modeling-stats">χ = V − E + F<br/>= {{counts.vertices}} − {{counts.edges}} + {{counts.faces}} = <strong>{{counts.chi}}</strong></p><p>Split Edge: ΔV = +1, ΔE = +1</p><p>Split Face: ΔE = +1, ΔF = +1</p><p>どちらも Δχ = 0（操作 {{steps}} 回）</p><p class="modeling-note">Cube は球面と同じ χ = 2。穴が1つの Torus は χ = 0。</p></div></div><p class="modeling-note">観察：分割で要素数が変わっても χ は保存。連結・閉じた向き付け可能な曲面では χ = 2 − 2g（g は穴の数）。</p></section></template>
