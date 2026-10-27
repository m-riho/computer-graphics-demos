<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fernPoints, FERN_TRANSFORMS, boundedInteger } from '../../packages/cg-algorithms/src/nature-fractals'
import './lecture05.css'
const count=ref(10000),seed=ref(42),colorByTransform=ref(false)
const safeSeed=computed(()=>boundedInteger(Number(seed.value),0,4294967295,42))
const points=computed(()=>fernPoints(Number(count.value),safeSeed.value))
const frequencies=computed(()=>{const counts=[0,0,0,0];for(const p of points.value)counts[p.transform]++;return counts})
const last=computed(()=>points.value.at(-1))
const canvas=ref<HTMLCanvasElement|null>(null)
const colors=['#8b4513','#12654e','#075ea8','#9d2877']
function draw(){
 const ctx=canvas.value?.getContext('2d');if(!ctx)return
 ctx.fillStyle='#f4f8f7';ctx.fillRect(0,0,400,300)
 for(const {point:[x,y],transform} of points.value){ctx.fillStyle=colorByTransform.value?colors[transform]:'#12654e';ctx.fillRect(200+x*27,287-y*27,1.35,1.35)}
}
watch([points,colorByTransform],draw,{flush:'post'});onMounted(draw)
function reset(){count.value=10000;seed.value=42;colorByTransform.value=false}
</script>
<template><section class="l5d ifs-demo" aria-label="IFS による Barnsley fern">
 <div class="l5d-controls"><label>Point Count <select v-model.number="count" aria-label="IFS の点数"><option v-for="n in [10,100,1000,10000,100000]" :key="n" :value="n">{{n.toLocaleString()}}</option></select></label><label>Seed <input v-model.number="seed" aria-label="IFS の Seed" type="number" min="0" max="4294967295" step="1" @change="seed=safeSeed"></label><label><input v-model="colorByTransform" type="checkbox"> 変換ごとに色分け</label><button @click="reset">Reset</button></div>
 <div class="l5d-grid2 ifs-grid"><canvas ref="canvas" class="l5d-visual fern-canvas" width="400" height="300" role="img" aria-label="4 つのアフィン変換の反復で生成したシダの点群"/>
 <div><h3>選択 → 変換 → 繰り返す</h3><div class="l5d-readout">pₖ₊₁ = Aᵢ pₖ + bᵢ</div><table><thead><tr><th>変換 i</th><th>確率</th><th>生成点数</th></tr></thead><tbody><tr v-for="(t,i) in FERN_TRANSFORMS" :key="i"><td><span class="transform-key" :style="{background:colorByTransform?colors[i]:'#12654e'}">{{i+1}}</span> {{t.label}}</td><td>{{Math.round(t.probability*100)}}%</td><td>{{frequencies[i].toLocaleString()}}</td></tr></tbody></table><p v-if="last">最後は変換 {{last.transform+1}}<br>p = ({{last.point[0].toFixed(3)}}, {{last.point[1].toFixed(3)}})</p><p>使用 Seed：{{safeSeed}}<br>描画点数：{{points.length.toLocaleString()}}</p></div></div>
 <p class="l5d-note">点数を10から増やすと、同じ規則から全体の形が現れます。同じ Seed は同じ点列。初めの20点は除外。色は最後に適用した変換です。</p>
</section></template>
<style scoped>
.ifs-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fern-canvas{height:300px;object-fit:contain;background:#f4f8f7}.transform-key{display:inline-block;color:white;border-radius:3px;padding:0 5px;font-weight:700}.ifs-demo table{margin:8px 0}.ifs-demo input[type=number]{width:100px}@media(max-width:700px){.ifs-grid{grid-template-columns:1fr}.fern-canvas{height:260px}}
</style>
