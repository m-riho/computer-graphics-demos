<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { lsystemPresets, rewriteLSystem, traceTurtle } from '../../packages/cg-algorithms/src/nature-rules'
import './lecture05.css'
const preset = ref<keyof typeof lsystemPresets>('Tree'), axiom = ref('F'), rule = ref('F=F[+F]F[-F]F'), iterations = ref(3), angle = ref(25), stepLength = ref(5), cursor = ref(40000)
const parsed = computed(() => {
  const rules: Record<string, string> = {}; let error = ''
  for (const row of rule.value.split(';')) {
    const parts = row.split(/=|→/).map(s => s.trim())
    if (parts.length !== 2 || parts[0].length !== 1) error = 'Rule は F=… の形式（複数は ; 区切り）'
    else rules[parts[0]] = parts[1]
  }
  return { rules, error }
})
const generated = computed(() => rewriteLSystem(axiom.value, parsed.value.rules, iterations.value))
const complete = computed(() => traceTurtle(generated.value.word, angle.value, stepLength.value))
const execution = computed(() => traceTurtle(generated.value.word, angle.value, stepLength.value, Math.min(cursor.value, generated.value.word.length)))
const drawing = computed(() => {
  const full = complete.value.segments.flatMap(([x,y,a,b]) => [[x,y],[a,b]])
  let lowX=0,highX=0,lowY=0,highY=1
  for(const [x,y] of full){lowX=Math.min(lowX,x);highX=Math.max(highX,x);lowY=Math.min(lowY,y);highY=Math.max(highY,y)}
  const scale = Math.min(4, 430 / Math.max(1,highX-lowX), 240 / Math.max(1,highY-lowY))
  const point = (x:number,y:number) => [240+(x-(lowX+highX)/2)*scale,250-(y-lowY)*scale]
  return { path: execution.value.segments.map(([x,y,a,b]) => `M${point(x,y).join(',')}L${point(a,b).join(',')}`).join(' '), tip: point(execution.value.state.x,execution.value.state.y) }
})
function choosePreset() {
  const p = lsystemPresets[preset.value]; axiom.value=p.axiom;rule.value=Object.entries(p.rules).map(([s,r])=>`${s}=${r}`).join(';');iterations.value=p.iterations;angle.value=p.angle;stepLength.value=5;cursor.value=40000
}
function reset(){preset.value='Tree';choosePreset()}
watch([axiom,rule,iterations,angle,stepLength],()=>{cursor.value=40000})
function step(){cursor.value=execution.value.executed>=generated.value.word.length?1:execution.value.executed+1}
const preview = computed(() => generated.value.word.length > 160 ? `${generated.value.word.slice(0,160)}…` : generated.value.word)
</script>
<template>
  <section class="l5d lsystem-lab" aria-label="L-system Lab">
    <div class="l5d-controls">
      <label>Preset <select v-model="preset" @change="choosePreset"><option v-for="(_,name) in lsystemPresets" :key="name">{{ name }}</option></select></label>
      <label>Axiom <input v-model="axiom" type="text" maxlength="80" class="axiom" aria-label="Axiom"/></label>
      <label class="rule">Rule <input v-model="rule" type="text" maxlength="240" aria-label="Rule"/></label>
      <button @click="reset">Reset</button>
    </div>
    <div class="l5d-controls">
      <label>Iteration {{ iterations }} <input v-model.number="iterations" type="range" min="0" max="6"/></label>
      <label>Angle {{ angle }}° <input v-model.number="angle" type="range" min="0" max="90" step=".5"/></label>
      <label>Step Length {{ stepLength }} <input v-model.number="stepLength" type="range" min="1" max="10" step=".5"/></label>
      <button @click="cursor=0">実行を最初へ</button><button @click="step">Step</button><button @click="cursor=40000">全実行</button>
    </div>
    <div class="l5d-grid2">
      <div class="string-pane">
        <h3>Generated String → Turtle</h3>
        <div>length {{ generated.word.length.toLocaleString() }} · F {{ generated.word.split('F').length-1 }}</div>
        <pre aria-label="生成文字列">{{ preview }}</pre>
        <div>F数：{{ generated.counts.join(' → ') }}</div>
        <div class="l5d-readout">実行 {{ execution.executed }} / {{ generated.word.length }} · 次: <b>{{ generated.word[execution.executed] ?? '終了' }}</b><br/>Stack depth: {{ execution.stack.length }} · [ push / ] pop<br/>位置 ({{ execution.state.x.toFixed(1) }}, {{ execution.state.y.toFixed(1) }}) · 向き {{ (execution.state.heading*180/Math.PI).toFixed(1) }}°</div>
        <div class="stack" aria-label="Turtle stack"><span v-if="!execution.stack.length">stack: 空</span><div v-for="(state,i) in execution.stack.slice(-3)" :key="i">({{ state.x.toFixed(1) }}, {{ state.y.toFixed(1) }}) θ={{ (state.heading*180/Math.PI).toFixed(0) }}°</div></div>
      </div>
      <svg class="l5d-visual" viewBox="0 0 480 265" role="img" aria-label="生成文字列をタートルで描いた形状">
        <path :d="drawing.path" fill="none" stroke="#176243" stroke-width="1.6"/>
        <circle :cx="drawing.tip[0]" :cy="drawing.tip[1]" r="4" fill="#c26100"/><text x="10" y="22" style="font-size:17px" fill="#203649">F: 前進 · + / −: 回転</text>
      </svg>
    </div>
    <p v-if="parsed.error || execution.error || generated.truncated" class="l5d-note" role="status">{{ parsed.error || (generated.truncated ? '文字列は40,000字で停止。Iterationを下げて全体を確認してください。' : execution.error) }}</p>
    <p v-else class="l5d-note">観察：[ ] は位置と向きを保存・復元する。枝が画面を超える場合は縮小表示。Stepで確認。</p>
  </section>
</template>
<style scoped>
.axiom{width:65px}.rule{flex:1;min-width:260px}.rule input{width:100%;min-width:0}.string-pane{min-width:0}.string-pane pre{font-size:17px;max-height:69px;overflow-wrap:anywhere;background:#f5f8fa;padding:5px}.stack{font-family:monospace;font-size:16px;line-height:1.25;min-height:22px;max-height:60px;overflow:auto}.lsystem-lab svg{height:265px;background:#f5faf7;border-radius:8px}.lsystem-lab .l5d-controls{gap:6px 11px}.lsystem-lab input[type=range]{width:85px}
@media(max-width:700px){.lsystem-lab .l5d-grid2{grid-template-columns:1fr}.rule{min-width:180px}}
</style>
