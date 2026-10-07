<script setup lang="ts">
import {ref,computed} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {coneResponse} from '../../packages/cg-algorithms/src/index.ts'
// Broad overlapping curves explain the principle, not individual physiology.
const wavelength=ref(550),names=['S','M','L'],colors=['#3158c4','#21834b','#b44435']
const response=computed(()=>coneResponse(wavelength.value))
const curves=names.map((_,k)=>Array.from({length:81},(_,i)=>`${i?'L':'M'}${60+i*9},${245-coneResponse(380+i*5)[k]*200}`).join(' '))
</script>
<template><DemoFrame label="波長を動かして、3つの応答を見る" @reset="wavelength=550">
<div class="controls"><label>波長 <input aria-label="波長" type="range" min="380" max="780" v-model.number="wavelength" />{{ wavelength }} nm</label><span>可視域の目安：380〜780 nm</span></div>
<div class="panels" style="grid-template-columns:3fr 1fr;"><svg viewBox="0 0 820 310" role="img" aria-label="S M L分光感度の模式曲線"><path d="M60 35 V245 H780" fill="none" stroke="currentColor"/><text x="15" y="30" style="font-size:20px">相対感度</text><path v-for="(d,i) in curves" :key="i" :d="d" fill="none" :stroke="colors[i]" stroke-width="4"/><line :x1="60+(wavelength-380)*1.8" :x2="60+(wavelength-380)*1.8" y1="40" y2="245" stroke="currentColor" stroke-dasharray="6 5"/><text v-for="w in [380,480,580,680,780]" :x="60+(w-380)*1.8" y="278" text-anchor="middle" style="font-size:20px">{{ w }}</text><text x="640" y="306" style="font-size:20px">波長（nm）</text></svg>
<div><div v-for="(n,i) in names" :key="n" style="margin:14px 0;"><strong :style="{color:colors[i]}">{{n}}</strong> {{response[i].toFixed(2)}}<div :style="{height:'15px',width:(response[i]*100)+'%',background:colors[i]}" /></div></div></div>
<div class="hint">曲線と数値は説明用の模式モデル（実測値ではない）。L＝赤、M＝緑、S＝青そのものではありません。</div>
</DemoFrame></template>
