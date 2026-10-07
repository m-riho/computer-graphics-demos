<script setup lang="ts">
import {ref,computed} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {toneMap} from '../../packages/cg-algorithms/src/index.ts'
const exposure=ref(0),enabled=ref(true);const scene=[.01,.04,.18,1,4,16]
const rows=computed(()=>scene.map(l=>{const mapped=toneMap(l,exposure.value,enabled.value);return {l,x:mapped.exposed,y:mapped.linear,code:mapped.encodedByte}}))
</script>
<template><DemoFrame label="広い輝度範囲を表示範囲へ収める" @reset="exposure=0;enabled=true">
<div class="controls"><label>露出<input aria-label="露出" type="range" min="-4" max="4" step=".5" v-model.number="exposure"/>{{exposure}} EV</label><label><input aria-label="トーンマッピング" type="checkbox" v-model="enabled"/>トーンマッピング</label></div>
<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;" class="readout tone-patches"><div v-for="a in rows"><div>L={{a.l}}</div><div :style="{height:'155px',margin:'12px 0',border:'1px solid var(--rule)',background:`rgb(${a.code},${a.code},${a.code})`}"/><div>{{a.y.toFixed(3)}}</div></div></div>
<div class="readout" style="margin-top:20px">{{enabled?'ON：L′ = x / (1+x)（単純Reinhard）':'OFF：L′ = min(x, 1)（白飛び）'}}<br>x = 元の相対輝度 × 2^EV</div>
<div class="hint">上：元の相対輝度（物理単位ではない）。下：表示用の線形値0〜1。模式的なHDRデータを通常の画面へ表示しています。</div>
</DemoFrame></template>
