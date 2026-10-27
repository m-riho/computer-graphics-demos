<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { advanceParticles, createParticleState, particlePresets, type ParticleParameters } from '../../packages/cg-algorithms/src/nature-particles'
import './lecture05.css'
const root=ref<HTMLElement>()
const preset=ref<ParticleParameters['preset']>('Fire'),parameters=ref<ParticleParameters>({...particlePresets.Fire}),seed=ref(0),state=ref(createParticleState(0)),playing=ref(false),reducedMotion=ref(false),selectedId=ref<number|null>(null)
let frame=0,lastTime=0,accumulator=0,motionQuery:MediaQueryList|undefined, visibilityObserver:IntersectionObserver|undefined
const selected=computed(()=>state.value.particles.find(p=>p.id===selectedId.value)??state.value.particles[0])
function pause(){playing.value=false;cancelAnimationFrame(frame);frame=0;lastTime=0;accumulator=0}
function step(){state.value=advanceParticles(state.value,parameters.value,1/30)}
function tick(timestamp:number){
  if(!playing.value)return
  if(lastTime)accumulator+=Math.min(.1,(timestamp-lastTime)/1000)
  lastTime=timestamp
  while(accumulator>=1/30){step();accumulator-=1/30}
  frame=requestAnimationFrame(tick)
}
function toggle(){if(playing.value)pause();else if(!reducedMotion.value){playing.value=true;lastTime=0;frame=requestAnimationFrame(tick)}}
function initialize(){pause();state.value=createParticleState(seed.value);selectedId.value=null;for(let i=0;i<45;i++)step()}
function choosePreset(){parameters.value={...particlePresets[preset.value]};initialize()}
function reset(){preset.value='Fire';parameters.value={...particlePresets.Fire};seed.value=0;initialize()}
function motionChange(){reducedMotion.value=motionQuery?.matches??false;if(reducedMotion.value)pause()}
function visibilityChange(){if(document.hidden)pause()}
watch(seed,initialize)
onMounted(()=>{motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');motionChange();motionQuery.addEventListener('change',motionChange);document.addEventListener('visibilitychange',visibilityChange);visibilityObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>!entry.isIntersecting))pause()});if(root.value)visibilityObserver.observe(root.value)})
onBeforeUnmount(()=>{pause();visibilityObserver?.disconnect();motionQuery?.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',visibilityChange)})
// 印刷や初回表示も仕組みが読める静止した代表状態。自動再生はしない。
for(let i=0;i<45;i++)step()
</script>
<template>
  <section ref="root" class="l5d particle-lab" aria-label="Particle System Lab">
    <div class="l5d-controls">
      <label>Preset <select v-model="preset" @change="choosePreset"><option v-for="(_,name) in particlePresets" :key="name">{{ name }}</option></select></label>
      <button :disabled="reducedMotion" :aria-pressed="playing" @click="toggle">{{ playing?'Pause':'Resume' }}</button><button :disabled="playing" @click="step">Step 1/30秒</button><button @click="reset">Reset</button>
      <label>Seed <input v-model.number="seed" type="number" min="0" max="999999"/></label>
      <label>Wind <select v-model="parameters.windMode"><option value="constant">Constant</option><option value="noise">Noise</option></select></label>
    </div>
    <div class="particle-controls">
      <label>発生 / s {{ parameters.emissionRate }} <input v-model.number="parameters.emissionRate" type="range" min="0" max="200"/></label>
      <label>初速 {{ parameters.initialVelocity }} <input v-model.number="parameters.initialVelocity" type="range" min="0" max="220"/></label>
      <label>Spread {{ parameters.spread }}° <input v-model.number="parameters.spread" type="range" min="0" max="90"/></label>
      <label>Gravity {{ parameters.gravity }} <input v-model.number="parameters.gravity" type="range" min="-100" max="200"/></label>
      <label>Wind {{ parameters.wind }} <input v-model.number="parameters.wind" type="range" min="-100" max="100"/></label>
      <label>Life {{ parameters.lifetime }}s <input v-model.number="parameters.lifetime" type="range" min=".2" max="8" step=".1"/></label>
      <label>Size {{ parameters.size }} <input v-model.number="parameters.size" type="range" min="1" max="12"/></label>
    </div>
    <div class="l5d-grid2 particle-body">
      <svg viewBox="0 0 600 280" class="l5d-visual" role="img" aria-label="粒子の運動。丸をクリックすると粒子状態を表示。">
        <rect width="600" height="280" rx="8" fill="#162a3d"/><line x1="0" y1="267" x2="600" y2="267" stroke="#8295a7" stroke-dasharray="6 5"/>
        <circle v-for="particle in state.particles" :key="particle.id" :cx="particle.x" :cy="particle.y" :r="particle.size" :fill="particle.color" :opacity="Math.max(.1,1-particle.age/particle.lifetime)" :stroke="selected?.id===particle.id?'white':'none'" stroke-width="2" @click="selectedId=particle.id"/>
        <text x="14" y="25" fill="white" style="font-size:18px">{{ playing?'再生中':'一時停止' }} · {{ state.particles.length }} particles</text><text x="14" y="49" fill="#ccdeee" style="font-size:16px">life 0 → 寿命：透明度が下がる</text>
      </svg>
      <div class="particle-data"><h3>Generate → Update → Render → Remove</h3><div>t = {{ state.time.toFixed(2) }} s · dt = 1/30 s</div><div class="l5d-readout">このstep：生成 {{ state.generated }} / 更新・描画 {{ state.particles.length }} / 削除 {{ state.removed }}</div><p>v ← v + a Δt<br/>p ← p + v Δt · age ← age + Δt<br/>age ≥ lifetime → 削除</p><div v-if="selected" class="selected">粒子 #{{ selected.id }} · age {{ selected.age.toFixed(2) }}/{{ selected.lifetime.toFixed(1) }}s<br/>p = ({{ selected.x.toFixed(1) }}, {{ selected.y.toFixed(1) }})<br/>v = ({{ selected.vx.toFixed(1) }}, {{ selected.vy.toFixed(1) }}) · size {{ selected.size }}</div><div v-else>粒子なし。発生数を増やしてStep。</div></div>
    </div>
    <p class="l5d-note">{{ reducedMotion?'動きを減らす設定：Stepで進められます。':'観察：Noiseの風は位置と時刻で変化する。' }} 寿命・サイズ・初速は新しく生まれる粒子に適用。最大1,200粒。</p>
  </section>
</template>
<style scoped>
.particle-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px 10px;margin-bottom:8px}.particle-controls label{display:flex;justify-content:space-between;align-items:center;gap:5px;font-size:17px}.particle-controls input[type=range]{width:75px;min-width:45px}.particle-body{grid-template-columns:1.15fr 1fr;gap:12px}.particle-body svg{height:245px;overflow:hidden;cursor:pointer}.particle-data{font-size:17px}.particle-data h3{font-size:17px;white-space:nowrap}.particle-data p{margin:5px 0}.selected{font-size:16px;background:#f4f7fa;padding:4px 8px}.particle-lab .l5d-controls{gap:6px 12px}.particle-data .l5d-readout{margin-top:5px}
@media(max-width:700px){.particle-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.particle-body{grid-template-columns:1fr}.particle-body svg{height:auto;aspect-ratio:600/280}.particle-data h3{white-space:normal}}
</style>
