<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import { linearMap2D, type Vector2 } from '../../packages/cg-algorithms/src/linear-map2d.ts'

const u = ref<[number, number]>([2, 0]), v = ref<[number, number]>([1, 1])
const point = ref<[number, number]>([1, 1]), showGrid = ref(true)
const presets = [
  { label: '付録の例', u: [2,0], v: [1,1] },
  { label: '恒等写像', u: [1,0], v: [0,1] },
  { label: '90°回転', u: [0,1], v: [-1,0] },
  { label: 'せん断', u: [1,0], v: [1,1] },
  { label: '左右反転', u: [-1,0], v: [0,1] },
  { label: '直線につぶす', u: [1,0], v: [2,0] },
] satisfies { label: string; u: [number, number]; v: [number, number] }[]
function preset(index: number) { u.value=[...presets[index].u]; v.value=[...presets[index].v] }
function reset() { preset(0); point.value=[1,1]; showGrid.value=true }
const result = computed(() => linearMap2D(u.value, v.value, point.value))
const map = (p: Vector2): Vector2 => linearMap2D(u.value, v.value, p).image
const format = (n: number) => Number(n.toFixed(2)).toString()
const tuple = (p: Vector2) => `(${p.map(format).join(', ')})`
const zero: Vector2 = [0,0]
const square: Vector2[] = [[0,0],[1,0],[1,1],[0,1]]
const grid: [Vector2, Vector2][] = []
for (let n=-2; n<=2; n++) grid.push([[n,-2],[n,2]],[[-2,n],[2,n]])
const panels = computed(() => [
  { title:'変換前', first:[1,0] as Vector2, second:[0,1] as Vector2, p:point.value,
    part:[point.value[0],0] as Vector2, square, grid, firstLabel:'e₁', secondLabel:'e₂', pointLabel:'p' },
  { title:'変換後', first:u.value, second:v.value, p:result.value.image,
    part:result.value.xPart, square:square.map(map), grid:grid.map(([a,b])=>[map(a),map(b)] as [Vector2, Vector2]),
    firstLabel:'f(e₁)', secondLabel:'f(e₂)', pointLabel:'f(p)' },
])
// Both panels use the same scale, fitted to the vectors and unit square. The grid continues beyond the viewport.
const extent = computed(() => Math.max(2, ...panels.value.flatMap(panel => [panel.first,panel.second,panel.p,panel.part,...panel.square].flatMap(p => p.map(Math.abs)))) + .8)
const scale = computed(() => 150 / extent.value)
const sx = (p: Vector2) => 200 + p[0]*scale.value
const sy = (p: Vector2) => 180 - p[1]*scale.value
const line = (a: Vector2, b: Vector2) => ({ x1:sx(a), y1:sy(a), x2:sx(b), y2:sy(b) })
const polygon = (points: Vector2[]) => points.map(p=>`${sx(p)},${sy(p)}`).join(' ')
const uid = useId().replace(/:/g,'')
const singular = computed(() => Math.abs(result.value.determinant)<1e-9)
</script>

<template>
<DemoFrame label="基底の移り先を決めて、平面全体を変換する" class="l3-demo basis-map" @reset="reset">
  <div class="l3-buttons"><button v-for="(item,i) in presets" :key="item.label" @click="preset(i)" :aria-pressed="u.every((n,k)=>n===item.u[k]) && v.every((n,k)=>n===item.v[k])">{{item.label}}</button></div>
  <div class="basis-inputs">
    <fieldset class="basis-first"><legend>① e₁ = (1, 0) の移り先 f(e₁)</legend><label v-for="(axis,i) in ['x','y']" :key="axis">{{axis}}<input v-model.number="u[i]" type="range" min="-2" max="2" step=".1" :aria-label="`e1の移り先 ${axis}`"><output>{{format(u[i])}}</output></label></fieldset>
    <fieldset class="basis-second"><legend>② e₂ = (0, 1) の移り先 f(e₂)</legend><label v-for="(axis,i) in ['x','y']" :key="axis">{{axis}}<input v-model.number="v[i]" type="range" min="-2" max="2" step=".1" :aria-label="`e2の移り先 ${axis}`"><output>{{format(v[i])}}</output></label></fieldset>
    <fieldset><legend>③ 確かめる点 p = (x, y)</legend><label v-for="(axis,i) in ['x','y']" :key="axis">{{axis}}<input v-model.number="point[i]" type="range" min="-2" max="2" step=".1" :aria-label="`点pの ${axis}`"><output>{{format(point[i])}}</output></label></fieldset>
  </div>
  <div class="basis-equation" aria-label="基底の移り先を列に並べた行列">
    <b>A =</b><table aria-label="2×2変換行列"><tbody><tr v-for="row in [0,1]" :key="row"><td class="basis-first" :data-matrix="`${row},0`">{{format(result.matrix[row*2])}}</td><td class="basis-second" :data-matrix="`${row},1`">{{format(result.matrix[row*2+1])}}</td></tr></tbody></table>
    <span><span class="basis-first">第1列 = f(e₁)</span><br><span class="basis-second">第2列 = f(e₂)</span></span>
    <p>この2列だけで、すべての点の移り先が決まります。</p>
  </div>
  <div class="basis-figures">
    <figure v-for="(panel,index) in panels" :key="panel.title">
      <figcaption>{{panel.title}}：{{panel.pointLabel}} = {{tuple(panel.p)}}</figcaption>
      <svg viewBox="0 0 400 360" role="img" :aria-label="`${panel.title}の格子・基底ベクトル・点`">
        <defs><marker v-for="(color,name) in {red:'#bc3449',green:'#177442',blue:'#005bac'}" :id="`${uid}-${name}-${index}`" :key="name" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" :fill="color" /></marker></defs>
        <g class="basis-axes"><line x1="14" y1="180" x2="386" y2="180"/><line x1="200" y1="14" x2="200" y2="346"/></g>
        <g v-if="showGrid" class="basis-grid"><line v-for="(edge,k) in panel.grid" :key="k" v-bind="line(...edge)" /></g>
        <polygon :points="polygon(panel.square)" fill="#005bac" fill-opacity=".1" stroke="#005bac" stroke-width="1.5" />
        <g class="basis-decomposition"><line v-bind="line(zero,panel.part)" stroke="#bc3449"/><line v-bind="line(panel.part,panel.p)" stroke="#177442"/></g>
        <line v-if="panel.p.some(n=>n!==0)" v-bind="line(zero,panel.p)" stroke="#005bac" stroke-width="2" :marker-end="`url(#${uid}-blue-${index})`" />
        <line v-if="panel.first.some(n=>n!==0)" v-bind="line(zero,panel.first)" stroke="#bc3449" stroke-width="3" :marker-end="`url(#${uid}-red-${index})`" />
        <line v-if="panel.second.some(n=>n!==0)" v-bind="line(zero,panel.second)" stroke="#177442" stroke-width="3" :marker-end="`url(#${uid}-green-${index})`" />
        <circle :cx="sx(panel.p)" :cy="sy(panel.p)" r="4" fill="#005bac" />
        <text :x="sx(panel.first)+8" :y="sy(panel.first)+20" fill="#bc3449">{{panel.firstLabel}}</text>
        <text :x="sx(panel.second)-12" :y="sy(panel.second)-12" text-anchor="end" fill="#177442">{{panel.secondLabel}}</text>
        <text :x="sx(panel.p)+12" :y="sy(panel.p)-14" fill="#005bac">{{panel.pointLabel}}</text>
        <text :x="sx([1,0])" y="199" text-anchor="middle" class="basis-tick">1</text><text x="192" :y="sy([0,1])+5" text-anchor="end" class="basis-tick">1</text>
        <circle cx="200" cy="180" r="3" fill="#203649"/><text x="185" y="199">O</text><text x="380" y="173">x</text><text x="208" y="20">y</text>
      </svg>
    </figure>
  </div>
  <label class="basis-grid-toggle"><input v-model="showGrid" type="checkbox">格子を表示</label>
  <p class="l3-note">左右は同じ縮尺です（矢印と点が収まるよう自動調整）。薄い青は単位正方形とその像。破線は赤の成分に緑の成分を足す道筋です。</p>
  <div class="basis-calculation">
    <p>変換前：p = <span class="basis-first">{{format(point[0])}} e₁</span> + <span class="basis-second">{{format(point[1])}} e₂</span> = {{tuple(point)}}</p>
    <p>変換後：f(p) = <span class="basis-first">{{format(point[0])}} f(e₁)</span> + <span class="basis-second">{{format(point[1])}} f(e₂)</span></p>
    <p class="basis-result">= <span class="basis-first">{{tuple(result.xPart)}}</span> + <span class="basis-second">{{tuple(result.yPart)}}</span> = <strong data-image>{{tuple(result.image)}}</strong></p>
    <p class="l3-note">線形写像は、足し算と定数倍を保ちます。だから基底の像を決めれば、同じ係数 x, y を使って任意の点の像を計算できます。</p>
  </div>
  <p v-if="singular" class="basis-collapse" role="status">{{u.every(n=>n===0)&&v.every(n=>n===0)?'2本ともゼロなので、平面全体が原点に移ります。':'2本の移り先が一次独立でないため、平面全体が原点を通る直線につぶれます。'}} この場合も線形写像は一意に決まりますが、元に戻す逆写像はありません。</p>
  <p class="l3-note">これは線形写像なので、原点は原点に移ります。平行移動を含むアフィン変換では、原点の移り先も指定する必要があります。</p>
</DemoFrame>
</template>
<style scoped>
.basis-map{--first:#bc3449;--second:#177442}.basis-first{color:var(--first)}.basis-second{color:var(--second)}
.basis-inputs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.basis-inputs fieldset{margin:0;min-width:0;padding:12px;border:1px solid var(--rule);border-radius:6px}.basis-inputs legend{font-size:16px;font-weight:700;padding:0 4px}.basis-inputs label{display:flex;gap:10px;margin:6px 0;font-size:17px}.basis-inputs input[type=range]{flex:1;min-width:40px;width:100%}.basis-first input{accent-color:var(--first)!important}.basis-second input{accent-color:var(--second)!important}.basis-inputs output{min-width:32px;text-align:right}
.basis-equation{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin:20px 0;font-size:19px}.basis-equation table{border-left:2px solid var(--ink);border-right:2px solid var(--ink);border-radius:5px;font-variant-numeric:tabular-nums;border-spacing:0;margin:0}.basis-equation td{padding:1px 15px;text-align:center;font-size:22px;font-weight:700}.basis-equation>span{font-size:17px}.basis-equation p{flex:1;min-width:180px}
.basis-figures{display:grid;grid-template-columns:1fr 1fr;gap:18px}.basis-figures figure{border:1px solid var(--rule);border-radius:6px;background:#fff;overflow:hidden}.basis-figures figcaption{font-size:18px;font-weight:700;text-align:center;margin:10px 4px 0}.basis-figures svg{width:100%;height:auto}.basis-axes{stroke:#8698a7;stroke-width:1}.basis-grid{stroke:#c2d1df;stroke-width:1}.basis-decomposition{stroke-width:3;stroke-dasharray:6 4}.basis-figures text{font-size:15px;font-weight:700;paint-order:stroke;stroke:#fff;stroke-width:3;stroke-linejoin:round}.basis-figures .basis-tick{font-size:11px;font-weight:400;fill:#50677d}.basis-grid-toggle{font-size:16px;margin-top:12px;gap:8px!important}.basis-calculation{background:var(--soft);border-left:3px solid var(--accent);padding:12px 18px;margin:16px 0;font-size:20px}.basis-result{font-size:22px}.basis-collapse{padding:12px 16px;background:#fff5df;border-left:3px solid #986416;font-size:17px}
@media(max-width:700px){.basis-inputs,.basis-figures{grid-template-columns:1fr}.basis-calculation{font-size:17px;padding:10px}.basis-result{font-size:19px}.basis-equation{gap:12px}.basis-inputs legend{font-size:16px}}
</style>
