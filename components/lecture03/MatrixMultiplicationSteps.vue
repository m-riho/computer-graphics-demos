<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { matrixProductTrace, matrixProductFrame } from '../../packages/cg-algorithms/src/matrix-product-steps.ts'

const props = defineProps<{ preset: 'vector2' | 'rotation3' | 'translation4' | 'matrix2' | 'matrix3' | 'matrix4'; active: boolean }>()
const presets = {
  vector2: { left: [[1,2],[3,4]], right: [[2],[1]], leftName: 'A', rightName: 'p' },
  rotation3: { left: [[0,-1,0],[1,0,0],[0,0,1]], right: [[1],[2],[3]], leftName: 'R', rightName: 'p' },
  translation4: { left: [[1,0,0,3],[0,1,0,-1],[0,0,1,2],[0,0,0,1]], right: [[1],[2],[3],[1]], leftName: 'T', rightName: 'pₕ' },
  matrix3: { left: [[1,2,0],[0,1,1],[2,0,1]], right: [[2,0,1],[1,1,0],[0,2,1]], leftName: 'A', rightName: 'B' },
  matrix4: { left: [[1,0,0,3],[0,1,0,-1],[0,0,1,2],[0,0,0,1]], right: [[0,-1,0,0],[1,0,0,0],[0,0,1,0],[0,0,0,1]], leftName: 'T', rightName: 'R' },
  matrix2: { left: [[1,2],[0,1]], right: [[2,0],[1,1]], leftName: 'A', rightName: 'B' },
}
const direction = ref(false), cursor = ref(0), playing = ref(false)
const example = computed(() => presets[props.preset])
const right = computed(() => props.preset === 'translation4' && direction.value ? [[1],[2],[3],[0]] : example.value.right)
const columns = computed(() => right.value[0].length)
const entries = computed(() => matrixProductTrace(example.value.left, right.value))
const frame = computed(() => matrixProductFrame(entries.value, cursor.value))
const active = computed(() => entries.value[frame.value.entry])
const sumReady = computed(() => frame.value.committed > frame.value.entry)
const grids = computed(() => [
  { name: `${example.value.leftName}：左の行列`, data: example.value.left, kind: 'left' },
  { name: `${example.value.rightName}：${columns.value === 1 ? '列ベクトル' : '右の行列'}`, data: right.value, kind: 'right' },
  { name: '結果', data: example.value.left.map((_, r) => Array.from({length: columns.value}, (_, c) => entries.value[r * columns.value + c].sum)), kind: 'result' },
])
let timer: ReturnType<typeof setInterval> | undefined
const factor = (n: number) => n < 0 ? `(${n})` : String(n)
const position = (row: number, column: number) => columns.value === 1 ? `結果の${row + 1}成分目` : `結果の${row + 1}行${column + 1}列`
function pause() { playing.value = false; if (timer !== undefined) clearInterval(timer); timer = undefined }
function reset() { pause(); cursor.value = 0 }
function move(delta: number) { pause(); cursor.value = Math.max(0, Math.min(frame.value.lastCursor, cursor.value + delta)) }
function finish() { pause(); cursor.value = frame.value.lastCursor }
function play() {
  if (playing.value) return pause()
  if (frame.value.done) cursor.value = 0
  playing.value = true
  timer = setInterval(() => { cursor.value++; if (frame.value.done) pause() }, 1100)
}
function visibility() { if (document.hidden) pause() }
watch([() => props.preset, direction], reset)
watch(() => props.active, active => { if (!active) pause() })
onMounted(() => { document.addEventListener('visibilitychange', visibility); window.addEventListener('beforeprint', pause) })
onUnmounted(() => { pause(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('beforeprint', pause) })
</script>

<template>
  <section class="matrix-product-steps" aria-label="行と列を追う行列の掛け算" :data-cursor="cursor" :data-playing="playing" :data-row="active.row" :data-column="active.column" :data-committed="frame.committed" :data-last="frame.lastCursor">
    <div class="product-controls screen-only">
      <button type="button" @click="play">{{ playing ? '一時停止' : '再生' }}</button>
      <button type="button" :disabled="cursor === 0" @click="move(-1)">前へ</button>
      <button type="button" :disabled="frame.done" @click="move(1)">次へ</button>
      <button type="button" @click="reset">最初から</button>
      <button type="button" @click="finish">結果をすべて表示</button>
      <label v-if="preset === 'translation4'"><input v-model="direction" type="checkbox" />方向（w = 0）</label>
    </div>
    <div v-for="view in ['screen', 'paper']" :key="view" :class="view === 'screen' ? 'product-screen screen-only' : 'product-paper'">
      <div class="product-legend"><span class="row-key">赤：左の行</span> × <span class="column-key">緑：右の列</span> → <span>{{ view === 'screen' ? '青枠：結果の位置' : '各成分を計算' }}</span></div>
      <div class="product-equation">
        <template v-for="(grid, side) in grids" :key="grid.kind">
          <span v-if="side" class="product-operator">{{ side === 1 ? '×' : '=' }}</span>
          <div class="product-matrix-wrap">
            <div class="product-matrix-name">{{ grid.name }}</div>
            <div class="product-matrix" role="table" :aria-label="grid.name">
              <div v-for="(row, r) in grid.data" :key="r" role="row" class="product-row">
                <span v-for="(number, c) in row" :key="c" role="cell" class="product-cell"
                  :data-result="grid.kind === 'result' ? `${r},${c}` : undefined"
                  :aria-label="`${r + 1}行${c + 1}列`"
                  :class="{
                    'selected-row': view === 'screen' && !frame.done && grid.kind === 'left' && r === active.row,
                    'selected-column': view === 'screen' && !frame.done && grid.kind === 'right' && c === active.column,
                    'selected-result': view === 'screen' && !frame.done && grid.kind === 'result' && r === active.row && c === active.column,
                    'current-factor': view === 'screen' && !frame.done && !sumReady && frame.visibleTerms > 0 && ((grid.kind === 'left' && r === active.row && c === frame.visibleTerms - 1) || (grid.kind === 'right' && c === active.column && r === frame.visibleTerms - 1))
                  }">{{ grid.kind === 'result' && view === 'screen' && r * columns + c >= frame.committed ? '?' : number }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
      <template v-if="view === 'screen'">
        <div class="product-stage" role="status" aria-live="polite">{{ frame.done ? 'すべての成分の計算が完了しました' : `${active.row + 1}行目 × ${columns === 1 ? 'ベクトル' : `${active.column + 1}列目`} → ${position(active.row, active.column)}` }}</div>
        <div class="product-terms">
          <template v-for="(term, k) in active.terms" :key="k">
            <span v-if="k" class="term-plus">＋</span>
            <div class="product-term" :class="{'term-current': !frame.done && !sumReady && frame.visibleTerms === k + 1, 'term-pending': k >= frame.visibleTerms}">
              <div><span class="row-key">{{ factor(term.left) }}</span> × <span class="column-key">{{ factor(term.right) }}</span></div>
              <b>{{ k < frame.visibleTerms ? term.product : '…' }}</b>
            </div>
          </template>
          <span class="term-plus">＝</span><strong class="product-sum">{{ sumReady ? active.sum : '?' }}</strong>
        </div>
        <div class="product-instruction">{{ frame.done ? '最初から、または再生で、もう一度計算を追えます。' : sumReady ? `積をすべて足し、${position(active.row, active.column)}に ${active.sum} を入れます。` : frame.visibleTerms === 0 ? '色を付けた行と列を選びました。次へ進むと、対応する成分を掛けます。' : `${frame.visibleTerms}組目の積を計算しました。すべての積がそろってから足します。` }}</div>
      </template>
      <div v-else class="product-print-work">
        <div v-for="entry in entries" :key="`${entry.row},${entry.column}`"><b>{{ position(entry.row, entry.column) }}：</b><span v-for="(term,k) in entry.terms" :key="k">{{ k ? ' + ' : '' }}<span class="row-key">{{ factor(term.left) }}</span> × <span class="column-key">{{ factor(term.right) }}</span></span> = {{ entry.terms.map(t => factor(t.product)).join(' + ') }} = <b>{{ entry.sum }}</b></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.matrix-product-steps{font-size:23px;line-height:1.35;color:var(--ink)}
.product-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:4px 0 14px}
.product-controls button{font:inherit;font-size:20px;background:var(--paper);color:var(--ink);border:1px solid var(--rule);border-radius:5px;padding:6px 12px;cursor:pointer}
.product-controls button:disabled{opacity:.4;cursor:default}.product-controls button:focus-visible,.product-controls input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.product-controls label{display:flex;gap:6px;align-items:center;font-size:20px;margin-left:8px}
.product-legend{text-align:center;font-size:19px;margin:5px 0 8px}.row-key{color:var(--axis-x);font-weight:700}.column-key{color:var(--axis-y);font-weight:700}
.product-equation{display:flex;justify-content:center;align-items:center;gap:35px;margin:8px 0 12px}
.product-matrix-wrap{text-align:center}.product-matrix-name{font-size:20px;font-weight:600;margin-bottom:7px}
.product-matrix{width:fit-content;margin:0 auto;border-left:3px solid var(--ink);border-right:3px solid var(--ink);border-radius:8px;padding:2px 8px;font-size:27px;font-variant-numeric:tabular-nums}
.product-row{display:flex}.product-cell{display:inline-flex;width:47px;height:32px;align-items:center;justify-content:center;border:2px solid transparent;box-sizing:border-box}
.selected-row{color:var(--axis-x);background:color-mix(in srgb,var(--axis-x) 12%,var(--paper))}.selected-column{color:var(--axis-y);background:color-mix(in srgb,var(--axis-y) 12%,var(--paper))}
.selected-result{border-color:var(--accent);background:var(--soft)}.current-factor{border-color:currentColor;font-weight:800}
.product-operator{font-size:30px;padding-top:25px}.product-stage{background:var(--soft);padding:7px 12px;font-size:22px;font-weight:700;text-align:center}
.product-terms{display:flex;gap:12px;align-items:center;justify-content:center;margin:12px 0 8px;min-height:78px}
.product-term{min-width:108px;text-align:center;padding:5px 10px;border:2px solid transparent;border-radius:5px}.product-term b{display:block;margin-top:3px}.term-current{border-color:var(--accent);background:var(--soft)}.term-pending{opacity:.4}
.term-plus,.product-sum{font-size:27px}.product-instruction{text-align:center;font-size:19px;min-height:26px}
.product-paper{display:none}.product-print-work{font-size:22px;line-height:1.6;margin:12px auto;width:fit-content}
.print-slide-container .product-paper{display:block}.print-slide-container .product-screen{display:none!important}
@media print{.product-paper{display:block}.product-screen{display:none!important}}
</style>
