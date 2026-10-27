<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { midpointStages } from '../../packages/cg-algorithms/src/nature-rules'
import './lecture05.css'
const iterations=ref(6),amplitude=ref(.8),decay=ref(.5),seed=ref(7),stage=ref(4)
const stages=computed(()=>midpointStages(iterations.value,seed.value,amplitude.value,decay.value))
const current=computed(()=>stages.value[Math.min(stage.value,stages.value.length-1)] ?? stages.value[0])
const selectedStage=computed(()=>Math.min(stage.value,stages.value.length-1))
const scale=computed(()=>110/Math.max(1,...stages.value.flat().map(Math.abs)))
function points(values:number[]){return values.map((y,i)=>`${30+i/(values.length-1)*900},${140-y*scale.value}`).join(' ')}
const epsilon=computed(()=>selectedStage.value?current.value[1]-(current.value[0]+current.value[2])/2:0)
watch(iterations,()=>{stage.value=Math.max(0,Math.min(stage.value,stages.value.length-1))})
function reset(){iterations.value=6;amplitude.value=.8;decay.value=.5;seed.value=7;stage.value=4}
</script>
<template>
  <section class="l5d midpoint-lab" aria-label="Midpoint Displacement Lab">
    <div class="l5d-controls">
      <label>Iteration {{ iterations }} <input v-model.number="iterations" type="range" min="0" max="10"/></label>
      <label>Amplitude {{ amplitude }} <input v-model.number="amplitude" type="range" min="0" max="2" step=".05"/></label>
      <label>Decay {{ decay }} <input v-model.number="decay" type="range" min="0" max="1" step=".05"/></label>
      <label>Seed <input v-model.number="seed" type="number" min="0" max="999999"/></label><button @click="reset">Reset</button>
    </div>
    <div class="l5d-controls"><label>途中段階 {{ selectedStage }} / {{ stages.length-1 }} <input v-model.number="stage" type="range" min="0" :max="stages.length-1"/></label><button :disabled="selectedStage===0" @click="stage=selectedStage-1">戻る</button><button :disabled="selectedStage>=stages.length-1" @click="stage=selectedStage+1">Step</button><span>hₘ = (hₐ + hᵦ) / 2 + ε</span></div>
    <svg class="l5d-visual" viewBox="0 0 960 265" role="img" aria-label="中点変位の地形断面。破線は前の段階、丸印は新しい中点。">
      <line x1="30" y1="140" x2="930" y2="140" stroke="#9aaabb" stroke-dasharray="4 5"/>
      <polygon :points="`30,248 ${points(current)} 930,248`" fill="#d8eee2"/>
      <polyline v-if="selectedStage>0" :points="points(stages[selectedStage-1])" fill="none" stroke="#8b6298" stroke-width="2" stroke-dasharray="6 4"/>
      <polyline :points="points(current)" fill="none" stroke="#006746" stroke-width="2.4"/>
      <template v-if="selectedStage<=6"><circle v-for="(y,i) in current" :key="i" :cx="30+i/(current.length-1)*900" :cy="140-y*scale" :r="i%2?3.6:2" :fill="i%2?'#c26100':'#006746'"/></template>
      <text x="30" y="25" style="font-size:18px" fill="#203649">破線: 前の段階 · ●: 追加した中点</text><text x="30" y="260" style="font-size:17px" fill="#203649">x = 0</text><text x="880" y="260" style="font-size:17px" fill="#203649">x = 1</text>
    </svg>
    <div class="l5d-readout">点数 {{ current.length }} = 2^{{ selectedStage }} + 1 · 今段階の変位幅 ±{{ (selectedStage ? amplitude * decay**(selectedStage-1) : 0).toFixed(3) }} · 左端区間 ε={{ epsilon.toFixed(3) }}</div>
    <p class="l5d-note">観察：Decayを大きくすると細部の凹凸が残る。同じSeedなら段階を戻しても同じ地形になる。</p>
  </section>
</template>
<style scoped>.midpoint-lab svg{height:265px;background:#f7fafc;border-radius:8px}.midpoint-lab input[type=range]{width:95px}</style>
