<script setup lang="ts">
import { computed } from 'vue';
const props=withDefaults(defineProps<{series:{name:string;color:string;values:number[]}[];xMin?:number;xMax?:number;xLabel?:string;unit?:string;yMax?:number;marker?:number}>(),{xMin:0,xMax:90,xLabel:'角度 θ (°)',unit:''});
const top=computed(()=>props.yMax ?? Math.max(.001,...props.series.flatMap(s=>s.values))*1.08);
const path=(values:number[])=>values.map((v,i)=>`${i?'L':'M'}${52+i/Math.max(1,values.length-1)*450},${225-Math.min(top.value,Math.max(0,v))/top.value*190}`).join(' ');
const number=(v:number)=>v>=100? v.toFixed(0):v.toFixed(v<.1?3:2);
</script>
<template>
 <figure class="advanced-plot">
  <svg viewBox="0 0 540 275" role="img" :aria-label="`${series.map(s=>s.name).join('と')}のグラフ。横軸${xLabel}、縦軸${unit}`">
   <g v-for="i in 5" :key="i"><line x1="52" x2="502" :y1="225-(i-1)*47.5" :y2="225-(i-1)*47.5" stroke="#d9e3ed"/><text x="46" :y="229-(i-1)*47.5" text-anchor="end">{{number(top*(i-1)/4)}}</text></g>
   <path d="M52 30 V225 H505" fill="none" stroke="#64748b"/>
   <path v-for="s in series" :key="s.name" :d="path(s.values)" fill="none" :stroke="s.color" stroke-width="3"/>
   <line v-if="marker!==undefined" :x1="52+(marker-xMin)/(xMax-xMin)*450" :x2="52+(marker-xMin)/(xMax-xMin)*450" y1="32" y2="225" stroke="#9f1239" stroke-dasharray="5 4"/>
   <text x="52" y="246" text-anchor="middle">{{xMin}}°</text><text x="502" y="246" text-anchor="middle">{{xMax}}°</text><text x="280" y="269" text-anchor="middle">{{xLabel}}</text><text x="54" y="20">{{unit}}</text>
  </svg>
  <figcaption><span v-for="s in series" :key="s.name"><i :style="{background:s.color}"/>{{s.name}}</span></figcaption>
 </figure>
</template>
<style scoped>
.advanced-plot{margin:0;width:100%;min-width:0}.advanced-plot svg{display:block;width:100%;background:#fff;border-radius:12px}.advanced-plot text{font:12px system-ui;fill:#334155}.advanced-plot figcaption{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;font-size:13px}.advanced-plot i{display:inline-block;width:15px;height:4px;margin-right:6px;vertical-align:middle}
</style>
