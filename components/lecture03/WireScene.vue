<script setup lang="ts">
import {computed} from 'vue'
import {viewportTransform} from '../../packages/cg-algorithms/src/projection.ts'
import {cubeEdges} from '../../packages/cg-algorithms/src/geometry3d.ts'
import type {Vec2} from '../../packages/cg-algorithms/src/matrix4.ts'
import './lecture03.css'
const props=withDefaults(defineProps<{points:(Vec2|null)[];ghost?:(Vec2|null)[];extent?:number;ndc?:boolean;selected?:number;labels?:boolean;axisPoints?:Vec2[];title?:string;edges?:[number,number][]}>(),{extent:3,title:'立方体の座標と形'})
const width=420,height=260
function screen(p:Vec2):Vec2{if(props.ndc)return viewportTransform(p,width,height);return viewportTransform([p[0]/(props.extent*width/height),p[1]/props.extent],width,height)}
const points=computed(()=>props.points.map(p=>p&&p.every(Number.isFinite)?screen(p):null))
const ghost=computed(()=>props.ghost?.map(p=>p&&p.every(Number.isFinite)?screen(p):null))
const axisLength=computed(()=>props.ndc ? .8 : props.extent*.85)
const axes=computed(()=>(props.axisPoints??[[0,0],[axisLength.value,0],[0,axisLength.value]]).map(screen))
const edges=computed(()=>props.edges??cubeEdges)
</script>
<template><svg class="l3-wire" viewBox="0 0 420 260" role="img" :aria-label="title">
<title>{{title}}</title><rect width="420" height="260" fill="#f4f8fc" />
<path d="M0 130H420M210 0V260" stroke="#dce6ef" stroke-dasharray="3 5"/>
<g v-if="axes.length" stroke="#728699" stroke-width="1.5"><g v-for="(p,i) in axes.slice(1)" :key="i"><line :x1="axes[0][0]" :y1="axes[0][1]" :x2="p[0]" :y2="p[1]"/><text :x="p[0]+5" :y="p[1]-6" stroke="none" fill="#415970" style="font-size:14px">{{['X','Y','Z'][i]}}</text></g></g>
<g v-if="ghost" stroke="#8195a6" stroke-width="1.5" stroke-dasharray="5 4" fill="none"><template v-for="([a,b],i) in edges" :key="i"><line v-if="ghost[a]&&ghost[b]" :x1="ghost[a]![0]" :y1="ghost[a]![1]" :x2="ghost[b]![0]" :y2="ghost[b]![1]"/></template></g>
<g stroke="#005bac" stroke-width="2.6" fill="none"><template v-for="([a,b],i) in edges" :key="i"><line v-if="points[a]&&points[b]" :x1="points[a]![0]" :y1="points[a]![1]" :x2="points[b]![0]" :y2="points[b]![1]"/></template></g>
<template v-for="(p,i) in points" :key="i"><g v-if="p"><circle :cx="p[0]" :cy="p[1]" :r="i===selected?6:2.5" :fill="i===selected?'#cf6413':'#005bac'" :stroke="i===selected?'white':'none'" stroke-width="2"/><text v-if="labels||i===selected" :x="p[0]+8" :y="p[1]-8" style="font-size:15px" font-weight="600" fill="#203649">{{i===selected?'● ':''}}P{{i}}</text></g></template>
<text v-if="points.every(p=>!p)" x="210" y="133" text-anchor="middle" fill="#6a4b32" style="font-size:17px">投影できる点がありません</text>
</svg></template>
<style scoped>.l3-wire{width:100%;height:auto;display:block;border:1px solid var(--rule,#cbdbea);border-radius:6px;overflow:hidden}</style>
