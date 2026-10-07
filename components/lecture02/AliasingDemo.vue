<script setup lang="ts">
import {ref,computed} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {lineCoverage} from '../../packages/cg-algorithms/src/index.ts'
const angle=ref(25),resolution=ref(20),aa=ref(false),grid=ref(true)
const cells=computed(()=>Array.from({length:resolution.value**2},(_,i)=>{const x=i%resolution.value,y=Math.floor(i/resolution.value),v=Math.round(255*(1-lineCoverage(x,y,resolution.value,angle.value,aa.value)));return {x,y,color:`rgb(${v},${v},${v})`}}))
function reset(){angle.value=25;resolution.value=20;aa.value=false;grid.value=true}
</script>
<template><DemoFrame label="斜め線を画素に置き換える" @reset="reset">
<div class="controls"><label>角度<input aria-label="線の角度" type="range" min="0" max="90" v-model.number="angle"/>{{angle}}°</label><label>解像度<select aria-label="描画解像度" v-model.number="resolution"><option v-for="n in [12,20,32,48]">{{n}}</option></select></label><label><input aria-label="アンチエイリアシング" type="checkbox" v-model="aa"/>AA</label><label><input type="checkbox" v-model="grid"/>格子</label></div>
<div class="panels"><svg viewBox="0 0 320 320" style="height:310px" role="img" aria-label="拡大した画素格子"><rect v-for="c in cells" :x="c.x*320/resolution" :y="c.y*320/resolution" :width="320/resolution" :height="320/resolution" :fill="c.color" :stroke="grid?'#a0a0a0':'none'" stroke-width=".4"/></svg><div><p>OFF：画素の中心だけで判定</p><p>ON：画素内の4×4点を調べ、<br>覆われた割合を濃淡で表す</p><p class="readout">{{resolution}}×{{resolution}}画素<br>AA {{aa?'ON':'OFF'}}／角度 {{angle}}°</p></div></div>
<div class="hint">拡大表示。線幅は約1.3画素。AAは境界の中間値を作り、階段状の見え方を和らげます。</div>
</DemoFrame></template>
