<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { meshEdges, type Mesh } from '../../packages/cg-algorithms/src/mesh'
import { subdivide, subdivisionInput, type SubdivisionMethod } from '../../packages/cg-algorithms/src/subdivision'

const method = ref<SubdivisionMethod>('catmull-clark')
const level = ref(1)
const controlMesh = ref(true), wireframe = ref(true), originalVertices = ref(true), resultSurface = ref(true)
const view = ref<InstanceType<typeof MeshView> | null>(null)
const methods: { value: SubdivisionMethod; label: string }[] = [
  { value: 'catmull-clark', label: 'Catmull–Clark' }, { value: 'loop', label: 'Loop' },
  { value: 'butterfly', label: 'Butterfly' }, { value: 'doo-sabin', label: 'Doo–Sabin' },
]
const triangular = computed(() => method.value === 'loop' || method.value === 'butterfly')
const interpolating = computed(() => method.value === 'butterfly')
const input = computed(() => subdivisionInput(method.value))
// Preserve the original cage positions independently of both display toggles.
const overlay = computed<Mesh>(() => ({ vertices: input.value.vertices, faces: controlMesh.value ? input.value.faces : [] }))
const calculation = computed(() => {
  try {
    return { mesh: subdivide(input.value, method.value, Number(level.value)), error: '' }
  } catch (error) {
    return { mesh: input.value, error: error instanceof Error ? error.message : '細分割に失敗しました。' }
  }
})
const result = computed(() => calculation.value.mesh)
const counts = computed(() => ({ v: result.value.vertices.length, e: meshEdges(result.value).length, f: result.value.faces.length }))
const preserved = computed(() => input.value.vertices.filter(p => result.value.vertices.some(q => p.every((x, k) => Math.abs(x - q[k]) < 1e-10))).length)
const rule = computed(() => ({
  'catmull-clark': '各面を四角形へ分割。面点・辺点を追加し、旧頂点も周囲の平均で移動。',
  loop: '三角形を4分割。辺点は両端と対頂点の重み付き平均、旧頂点も移動。',
  butterfly: 'Modified Butterfly を使用。旧頂点は固定し、新しい辺点だけを計算。不規則頂点は専用の重み。',
  'doo-sabin': '面の各角に新しい点を置く。元の面・辺・頂点のそれぞれに対応する面を生成。',
}[method.value]))
function reset() {
  method.value = 'catmull-clark'; level.value = 1
  controlMesh.value = true; wireframe.value = true; originalVertices.value = true; resultSurface.value = true
  view.value?.resetView()
}
</script>

<template>
  <section class="subdivision-lab" aria-label="Subdivision Lab">
    <div class="method-controls" role="group" aria-label="Subdivision method">
      <button v-for="item in methods" :key="item.value" type="button" :aria-pressed="method === item.value" @click="method = item.value">{{ item.label }}</button>
      <button class="reset" type="button" @click="reset">Reset</button>
    </div>
    <div class="subdivision-body">
      <div class="preview">
        <MeshView ref="view" :mesh="result" :height="260" :wireframe="wireframe" :surface="resultSurface" :original-mesh="overlay" :original-vertices="originalVertices" />
        <div class="legend">○ 元の頂点　┄ 制御メッシュ　<span>塗り：細分割後の面</span></div>
      </div>
      <div class="explanation">
        <label class="level-control">Subdivision Level <output>{{ level }}</output>
          <input v-model.number="level" type="range" min="0" max="4" step="1" aria-label="Subdivision Level" />
        </label>
        <div class="toggles">
          <label><input v-model="controlMesh" type="checkbox" /> Control Mesh</label>
          <label><input v-model="wireframe" type="checkbox" /> Wireframe</label>
          <label><input v-model="originalVertices" type="checkbox" /> Original Vertices</label>
          <label><input v-model="resultSurface" type="checkbox" /> Result Surface</label>
        </div>
        <p class="family"><strong>{{ triangular ? 'Triangle-based' : 'Quad-oriented' }}</strong> · {{ triangular ? '三角形の正八面体' : '四角形の立方体' }}から開始</p>
        <p class="behavior"><strong>{{ interpolating ? 'Interpolating（補間型）' : 'Approximating（近似型）' }}</strong><br />{{ interpolating ? '元の頂点の座標を保持' : '元の頂点を一般には通らない' }}</p>
        <p class="rule">{{ rule }}</p>
        <div class="counts" aria-live="polite"><span>V <b>{{ counts.v }}</b></span><span>E <b>{{ counts.e }}</b></span><span>F <b>{{ counts.f }}</b></span></div>
        <p class="preserved">元の位置にある結果頂点：{{ preserved }} / {{ input.vertices.length }}<span v-if="Number(level) === 0">（Level 0：入力）</span></p>
      </div>
    </div>
    <p v-if="calculation.error" role="alert" class="error">{{ calculation.error }}</p>
    <p v-else class="observation"><b>観察：</b>Level を上げ、○と面の位置を比べる。Loop ↔ Butterfly は同じ三角形入力で比較できる。</p>
    <p class="scope">閉じた向きの揃った manifold に限定。境界・crease は対象外。有限回の細分割メッシュを表示。</p>
  </section>
</template>

<style scoped>
.subdivision-lab { box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:12px; background:#fff; color:#172b44; font-size:14px; line-height:1.4; }
.method-controls { display:flex; align-items:center; gap:7px; margin-bottom:8px; flex-wrap:wrap; }
.method-controls button { padding:5px 12px; border:1px solid #94a3b8; border-radius:7px; background:#f1f5f9; color:#172b44; font:inherit; cursor:pointer; }
.method-controls button[aria-pressed="true"] { color:#fff; background:#235986; border-color:#235986; box-shadow:inset 0 -3px 0 #0d334f; }
.method-controls .reset { margin-left:auto; }
.subdivision-body { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(300px,1fr); gap:14px; align-items:start; }
.preview,.explanation { min-width:0; }
.legend { text-align:center; color:#5b317b; font-size:12px; margin-top:3px; }
.level-control { display:flex; align-items:center; gap:8px; font-weight:600; flex-wrap:wrap; }
.level-control output { min-width:20px; text-align:center; background:#e5edf6; border-radius:4px; }
.level-control input { flex:1; min-width:90px; accent-color:#235986; }
.toggles { display:grid; grid-template-columns:1fr 1fr; gap:4px 8px; margin:9px 0; font-size:13px; }
.toggles label { display:flex; align-items:center; gap:5px; white-space:nowrap; }
input[type="checkbox"] { margin:0; accent-color:#235986; }
.explanation p { margin:6px 0; }
.family { font-size:12px; color:#465970; }
.behavior { padding:6px 9px; background:#eaf2f8; border-left:4px solid #38658a; border-radius:3px; }
.rule { min-height:40px; font-size:13px; }
.counts { display:flex; justify-content:space-around; gap:8px; padding:5px; border:1px solid #cbd5e1; border-radius:5px; font-variant-numeric:tabular-nums; }
.counts b { font-size:17px; }
.preserved { font-size:12px; }
.observation,.error { margin:8px 0 3px; font-size:13px; }
.scope { margin:0; color:#596a7f; font-size:11px; }
.error { color:#9a3412; }
button:focus-visible,input:focus-visible { outline:3px solid #d08c00; outline-offset:2px; }
@media(max-width:640px) { .subdivision-body { grid-template-columns:1fr; } .method-controls { gap:5px; } .method-controls button { padding:5px 8px; font-size:12px; } .method-controls .reset { margin-left:0; } .rule { min-height:0; } }
</style>
