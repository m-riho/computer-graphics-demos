<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MeshView from '../lecture04/MeshView.vue'
import { midpointStages, triangleMidpointStages } from '../../packages/cg-algorithms/src/nature-rules'
import './lecture05.css'
const props=withDefaults(defineProps<{initialMode?:'line'|'triangle'}>(),{initialMode:'triangle'})
const mode=ref(props.initialMode)
const iterations=ref(mode.value==='triangle'?4:6),amplitude=ref(.8),decay=ref(.5),seed=ref(7),stage=ref(mode.value==='triangle'?2:4)
const wireframe=ref(true),previousVisible=ref(true),view=ref<InstanceType<typeof MeshView>>()
const maxIterations=computed(()=>mode.value==='triangle'?5:10)
const triangleStages=computed(()=>mode.value==='triangle'?triangleMidpointStages(iterations.value,seed.value,amplitude.value,decay.value):[])
const triangle=computed(()=>triangleStages.value[selectedStage.value])
const example=computed(()=>triangle.value?.midpoints[0])
const previousTriangle=computed(()=>selectedStage.value>0?triangleStages.value[selectedStage.value-1]?.mesh:undefined)
const highlighted=computed(()=>example.value?[example.value.a,example.value.b,example.value.vertex]:[])
const baseHeight=computed(()=>example.value&&previousTriangle.value?(previousTriangle.value.vertices[example.value.a][1]+previousTriangle.value.vertices[example.value.b][1])/2:0)
watch(mode,()=>{iterations.value=Math.min(iterations.value,maxIterations.value);stage.value=mode.value==='triangle'?Math.min(2,iterations.value):Math.min(4,iterations.value)},{flush:'sync'})
const stages=computed(()=>midpointStages(iterations.value,seed.value,amplitude.value,decay.value))
const current=computed(()=>stages.value[Math.min(stage.value,stages.value.length-1)] ?? stages.value[0])
const selectedStage=computed(()=>Math.min(stage.value,stages.value.length-1))
const scale=computed(()=>110/Math.max(1,...stages.value.flat().map(Math.abs)))
function points(values:number[]){return values.map((y,i)=>`${30+i/(values.length-1)*900},${140-y*scale.value}`).join(' ')}
const epsilon=computed(()=>selectedStage.value?current.value[1]-(current.value[0]+current.value[2])/2:0)
watch(iterations,()=>{stage.value=Math.max(0,Math.min(stage.value,stages.value.length-1))})
function reset(){mode.value=props.initialMode;iterations.value=mode.value==='triangle'?4:6;amplitude.value=.8;decay.value=.5;seed.value=7;stage.value=mode.value==='triangle'?2:4;wireframe.value=true;previousVisible.value=true;view.value?.resetView()}
</script>
<template>
  <section class="l5d midpoint-lab" aria-label="Midpoint Displacement Lab">
    <div class="l5d-controls">
      <label>Mode <select v-model="mode" aria-label="Midpoint mode"><option value="triangle">三角形ポリゴン（3D）</option><option value="line">線分（1D断面）</option></select></label>
      <label>Iteration {{ iterations }} <input v-model.number="iterations" type="range" min="0" :max="maxIterations"/></label>
      <label>Amplitude {{ amplitude }} <input v-model.number="amplitude" type="range" min="0" max="2" step=".05"/></label>
      <label>Decay {{ decay }} <input v-model.number="decay" type="range" min="0" max="1" step=".05"/></label>
      <label>Seed <input v-model.number="seed" type="number" min="0" max="999999"/></label>
    </div>
    <div class="l5d-controls"><label>途中段階 {{ selectedStage }} / {{ stages.length-1 }} <input v-model.number="stage" type="range" min="0" :max="stages.length-1"/></label><button @click="reset">Reset</button><button :disabled="selectedStage===0" @click="stage=selectedStage-1">戻る</button><button :disabled="selectedStage>=stages.length-1" @click="stage=selectedStage+1">Step</button><span>hₘ = (hₐ + hᵦ) / 2 + ε</span></div>
    <div v-if="mode==='triangle' && triangle" class="triangle-layout">
      <div>
        <MeshView ref="view" :mesh="triangle.mesh" :wireframe="wireframe" :original-mesh="previousVisible?previousTriangle:undefined" :highlight-vertices="highlighted" :height="260" :initial-pitch="52" :initial-yaw="24" :initial-zoom="1.15"/>
      </div>
      <div class="triangle-explanation">
        <h3>辺の中点を動かして、1枚 → 4枚</h3>
        <p>① 各辺に中点を追加<br/>② 中点の高さ Y に乱数変位 ε<br/>③ 中点を結び、4枚の三角形へ</p>
        <div class="l5d-controls triangle-toggles"><label><input v-model="wireframe" type="checkbox"/>辺を表示</label><label><input v-model="previousVisible" type="checkbox"/>前の段階（破線）</label></div>
        <div v-if="example" class="triangle-equation">
          <b>例：辺 v{{ example.a }}–v{{ example.b }} → v{{ example.vertex }}</b><br/>
          平均高 {{ baseHeight.toFixed(3) }} + ε {{ example.offset.toFixed(3) }}<br/>
          = 新しい高さ {{ triangle.mesh.vertices[example.vertex][1].toFixed(3) }}
        </div>
        <p v-else>Stepで最初の3つの中点を追加します。</p>
        <p class="l5d-note">XZ面を分割し、Yが高さ。黄色は計算例の両端と中点。隣の三角形も同じ中点を共有します。</p>
      </div>
    </div>
    <svg v-else class="l5d-visual" viewBox="0 0 960 265" role="img" aria-label="中点変位の地形断面。破線は前の段階、丸印は新しい中点。">
      <line x1="30" y1="140" x2="930" y2="140" stroke="#9aaabb" stroke-dasharray="4 5"/>
      <polygon :points="`30,248 ${points(current)} 930,248`" fill="#d8eee2"/>
      <polyline v-if="selectedStage>0" :points="points(stages[selectedStage-1])" fill="none" stroke="#8b6298" stroke-width="2" stroke-dasharray="6 4"/>
      <polyline :points="points(current)" fill="none" stroke="#006746" stroke-width="2.4"/>
      <template v-if="selectedStage<=6"><circle v-for="(y,i) in current" :key="i" :cx="30+i/(current.length-1)*900" :cy="140-y*scale" :r="i%2?3.6:2" :fill="i%2?'#c26100':'#006746'"/></template>
      <text x="30" y="25" style="font-size:18px" fill="#203649">破線: 前の段階 · ●: 追加した中点</text><text x="30" y="260" style="font-size:17px" fill="#203649">x = 0</text><text x="880" y="260" style="font-size:17px" fill="#203649">x = 1</text>
    </svg>
    <div v-if="mode==='triangle' && triangle" class="l5d-readout triangle-counts">三角形 {{ triangle.mesh.faces.length }} = 4^{{ selectedStage }} · 頂点 {{ triangle.mesh.vertices.length }} · 新しい中点 {{ triangle.midpoints.length }} · 変位幅 ±{{ triangle.strength.toFixed(3) }}</div>
    <div v-else class="l5d-readout">点数 {{ current.length }} = 2^{{ selectedStage }} + 1 · 今段階の変位幅 ±{{ (selectedStage ? amplitude * decay**(selectedStage-1) : 0).toFixed(3) }} · 左端区間 ε={{ epsilon.toFixed(3) }}</div>
    <p class="l5d-note">観察：Amplitudeを0にすると変位のない分割だけになる。Decayが大きいほど細部の凹凸が残る。同じSeedで再現。</p>
  </section>
</template>
<style scoped>.midpoint-lab>svg{height:265px;background:#f7fafc;border-radius:8px}.midpoint-lab input[type=range]{width:95px}
.triangle-layout{display:grid;grid-template-columns:1.1fr 1fr;gap:18px;align-items:start}
.triangle-explanation{font-size:16px}.triangle-explanation h3{font-size:18px}.triangle-explanation p{margin:6px 0}
.triangle-toggles{font-size:14px;gap:8px;margin:6px 0}.triangle-equation{background:#edf4fc;padding:6px 8px;font-variant-numeric:tabular-nums}
.midpoint-lab :deep(.mesh-view svg text){font-size:16px}
@media(max-width:700px){.triangle-layout{grid-template-columns:1fr}}
</style>
