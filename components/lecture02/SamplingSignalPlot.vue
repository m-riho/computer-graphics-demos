<script setup lang="ts">
import {computed} from 'vue'
import {aliasFrequency,cosineSignal,sampleSignal,nyquistSatisfied} from '../../packages/cg-algorithms/src/sampling-theorem.ts'
const props=defineProps<{frequency:number;density:number;spatial?:boolean}>()
const alias=computed(()=>aliasFrequency(props.frequency,props.density))
const showAlias=computed(()=>!nyquistSatisfied(props.frequency,props.density))
const curve=(f:number)=>Array.from({length:1001},(_,i)=>`${40+700*i/1000},${84-56*cosineSignal(f,i/1000)}`).join(' ')
const original=computed(()=>curve(props.frequency)),alternate=computed(()=>curve(alias.value))
const points=computed(()=>sampleSignal(props.frequency,props.density,Math.floor(props.density)+1).filter(p=>props.spatial?p.position<1:p.position<=1))
</script>
<template>
<figure class="sampling-plot">
<svg viewBox="0 0 780 180" role="img" :aria-label="spatial?'位置と明るさの元波形・標本点・代表alias':'時刻と座標の元波形・標本点・代表alias'">
<path d="M40 15V145H746M40 84H746" fill="none" stroke="#b2becb" />
<text x="12" y="32">1</text><text x="8" y="144">{{spatial?'0':'−1'}}</text>
<text x="37" y="168">0</text><text x="735" y="168" text-anchor="end">{{spatial?'x = 1':'t = 1 s'}}</text>
<polyline :points="original" fill="none" stroke="#175f9f" stroke-width="2.4"/>
<polyline v-if="showAlias" :points="alternate" fill="none" stroke="#a0480c" stroke-width="3" stroke-dasharray="9 6"/>
<circle v-for="(p,i) in points" :key="i" :cx="40+700*p.position" :cy="84-56*p.value" r="4.5" fill="white" stroke="#162d40" stroke-width="2"/>
</svg>
<figcaption>青実線：元信号　○：標本点<span v-if="showAlias">　茶破線：代表alias（{{alias.toFixed(2)}} {{spatial?'周期/幅1':'Hz'}}）</span></figcaption>
</figure>
</template>
<style scoped>
.sampling-plot{margin:0}.sampling-plot svg{width:100%;display:block}.sampling-plot text{font:17px sans-serif;fill:currentColor}.sampling-plot figcaption{font-size:17px;line-height:1.5;margin:4px 0 0}
@media(max-width:650px){.sampling-plot text{font-size:29px}.sampling-plot circle{r:6px}}
</style>
