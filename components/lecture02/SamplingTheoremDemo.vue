<script setup lang="ts">
import {computed,ref,onMounted,onUnmounted,watch} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import SamplingSignalPlot from './SamplingSignalPlot.vue'
import {aliasFrequency,cosineSignal,nyquistSatisfied,rotationState,sampleSpatialSignal,rasterizeLine} from '../../packages/cg-algorithms/src/sampling-theorem.ts'
import {srgbEncode} from '../../packages/cg-algorithms/src/index.ts'
const props=withDefaults(defineProps<{compact?:boolean}>(),{compact:false})
type Mode='time'|'space'|'cg'
const modes=[{id:'time' as const,label:'1. 時間：回転とストロボ'},{id:'space' as const,label:'2. 空間：縞模様'},{id:'cg' as const,label:'3. CG：斜め線とジャギー'}]
const mode=ref<Mode>('time'),wheel=ref(false),f=ref(4),fs=ref(12),paused=ref(true),time=ref(.125)
const spatialF=ref(4),pixels=ref(16),angle=ref(25),resolution=ref(20),aa=ref(false),grid=ref(true)
const presetNote=ref('1点を観察し、fsを下げて元の運動と比べましょう。')
const root=ref<HTMLElement>(),reduced=ref(false),printView=ref(false),visible=ref(false)
let frame=0,lastTime:number|undefined,observer:IntersectionObserver|undefined,media:MediaQueryList|undefined
// HTML range controls normally guarantee these bounds. Clamp defensive programmatic input too.
const safe=(r:{value:number},min:number,max:number,fallback:number)=>watch(()=>r.value,v=>{const next=Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;if(next!==v)r.value=next})
safe(f,.1,10,4);safe(fs,1,30,12);safe(spatialF,.5,32,4);safe(pixels,4,64,16);safe(angle,0,90,25);safe(resolution,8,48,20)
const rotation=computed(()=>rotationState(f.value,fs.value,time.value,wheel.value?8:1))
const temporalNyquist=computed(()=>nyquistSatisfied(f.value,fs.value))
const waveFrequency=computed(()=>wheel.value?8*f.value:f.value)
const spatialNyquist=computed(()=>nyquistSatisfied(spatialF.value,pixels.value))
const spatialAlias=computed(()=>aliasFrequency(spatialF.value,pixels.value))
const spatialSamples=computed(()=>sampleSpatialSignal(spatialF.value,Math.round(pixels.value)))
const bars=computed(()=>Array.from({length:400},(_,i)=>({x:i/400,v:.5+.5*cosineSignal(spatialF.value,(i+.5)/400),alias:.5+.5*cosineSignal(spatialAlias.value,(i+.5)/400)})))
const cells=computed(()=>rasterizeLine(Math.round(resolution.value),angle.value,aa.value))
const gray=(v:number)=>{const n=Math.round(255*srgbEncode(v));return `rgb(${n},${n},${n})`}
const direction=computed(()=>Math.abs(rotation.value.apparentFrequency)<1e-9?'静止':rotation.value.apparentFrequency<0?'逆方向':'正方向')
const speedText=computed(()=>`${direction.value}（${rotation.value.apparentFrequency.toFixed(2)} 回転/s）`)
const pointPresets=[{label:'十分な標本化',f:4,fs:12,note:'1点：12 > 2×4。帯域の上限を4 Hzと仮定した復元条件を満たします。'},
{label:'Nyquist付近',f:4,fs:8,note:'1点：境界の8 = 2×4。位相によって情報が欠けるため、安全な復元条件には含めません。'},
{label:'Aliasing',f:4,fs:6,note:'1点：4 Hzと−2 Hzの回転が、観測時刻には同じ位置になります。'},
{label:'止まって見える',f:4,fs:4,note:'1点：毎回ちょうど1回転後の位置を観測します。'},
{label:'逆回転',f:4,fs:5,note:'1点：本当は正方向4 Hzでも、観測点は逆方向1 Hzとも一致します。'}]
const wheelPresets=[{label:'正方向',f:.3,fs:8,note:'車輪：8本の同一スポーク。最小角変位を正方向として追う例。'},
{label:'ゆっくりした回転',f:1.1,fs:8,note:'車輪：実際は1.1回転/s、代表的な見かけは正方向0.1回転/s。'},
{label:'止まって見える',f:1,fs:8,note:'車輪：1/8回転ごとに、同じスポーク配置が現れます。'},
{label:'逆回転',f:.9,fs:8,note:'車輪：実際は正方向0.9回転/s、見かけは逆方向0.1回転/s。'}]
function preset(p:{f:number;fs:number;note:string}){f.value=p.f;fs.value=p.fs;presetNote.value=p.note;time.value=.125;paused.value=true}
function chooseMode(m:Mode){mode.value=m;paused.value=true}
function spacePreset(freq:number,n:number){spatialF.value=freq;pixels.value=n}
function reset(){mode.value='time';wheel.value=false;f.value=4;fs.value=12;time.value=.125;paused.value=true;spatialF.value=4;pixels.value=16;angle.value=25;resolution.value=20;aa.value=false;grid.value=true;presetNote.value='1点を観察し、fsを下げて元の運動と比べましょう。'}
function stop(){cancelAnimationFrame(frame);frame=0;lastTime=undefined}
function tick(stamp:number){
 if(lastTime!==undefined)time.value+=(stamp-lastTime)/1000
 lastTime=stamp;frame=requestAnimationFrame(tick)
}
function sync(){stop();if(!paused.value&&mode.value==='time'&&visible.value&&!document.hidden&&!printView.value)frame=requestAnimationFrame(tick)}
function motionPreference(){reduced.value=media?.matches??false;if(reduced.value)paused.value=true}
function beforePrint(){printView.value=true;paused.value=true;time.value=.125}
function afterPrint(){printView.value=false}
watch([paused,mode,visible,printView],sync)
watch([f,fs,wheel],()=>{time.value=.125})
onMounted(()=>{
 media=matchMedia('(prefers-reduced-motion: reduce)');motionPreference();media.addEventListener('change',motionPreference)
 printView.value=!!root.value?.closest('.print-slide-container')||location.pathname.includes('/print')
 observer=new IntersectionObserver(entries=>{visible.value=entries[0]?.isIntersecting??false},{threshold:.05});if(root.value)observer.observe(root.value)
 document.addEventListener('visibilitychange',sync);window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint)
})
onUnmounted(()=>{stop();observer?.disconnect();media?.removeEventListener('change',motionPreference);document.removeEventListener('visibilitychange',sync);window.removeEventListener('beforeprint',beforePrint);window.removeEventListener('afterprint',afterPrint)})
</script>

<template>
<div ref="root" class="sampling-theorem" :class="{compact:props.compact}">
<DemoFrame label="時間・空間・CGで標本化を比べる" @reset="reset">
<nav class="mode-switch screen-only" aria-label="標本化のモード"><button v-for="m in modes" :key="m.id" :aria-pressed="mode===m.id" @click="chooseMode(m.id)">{{m.label}}</button><button v-if="props.compact" @click="reset" style="flex:0;min-width:auto;">Reset</button></nav>
<section v-if="mode==='time'" aria-label="時間方向の標本化">
<div class="controls screen-only">
<label>表示<select aria-label="回転の表示" v-model="wheel" @change="preset(wheel?wheelPresets[0]:pointPresets[0])"><option :value="false">1点</option><option :value="true">スポーク車輪（8本）</option></select></label>
<label>f <input aria-label="回転周波数 f" type="range" min="0.1" max="10" step="0.1" v-model.number="f" @input="presetNote='fsを変え、実際と観測の違いを調べましょう。'"/><output>{{f.toFixed(1)}} Hz</output></label>
<label>fs <input aria-label="標本化周波数 fs" type="range" min="1" max="30" step="0.5" v-model.number="fs" @input="presetNote='fsを変え、実際と観測の違いを調べましょう。'"/><output>{{fs.toFixed(1)}} Hz</output></label>
<button :disabled="printView" @click="paused=!paused">{{paused?'Resume（再生）':'Pause（一時停止）'}}</button>
</div>
<div class="presets screen-only"><span>{{wheel?'車輪の例':'1点の例'}}</span><button v-for="p in wheel?wheelPresets:pointPresets" :key="p.label" @click="preset(p)">{{p.label}}</button></div>
<p class="preset-note">{{presetNote}}</p>
<div class="motion-layout">
<div class="rotation-pair"><figure v-for="(a,i) in [rotation.actualAngle,rotation.observedAngle]" :key="i">
<figcaption>{{i===0?'実際の運動（連続の模型）':'ストロボの観測（保持表示）'}}</figcaption>
<svg viewBox="0 0 210 190" role="img" :aria-label="i===0?'実際の回転位置':'ストロボ時刻の回転位置'" :data-angle="a.toFixed(6)">
<circle cx="105" cy="94" r="70" fill="none" stroke="#b6c7d7" stroke-width="2"/>
<g :transform="`rotate(${-a*180/Math.PI} 105 94)`">
<template v-if="wheel"><line v-for="s in 8" :key="s" x1="105" y1="94" x2="175" y2="94" :transform="`rotate(${45*(s-1)} 105 94)`" :stroke="i===0?'#175f9f':'#a0480c'" stroke-width="5"/></template>
<template v-else><line x1="105" y1="94" x2="175" y2="94" stroke="#b6c7d7"/><circle cx="175" cy="94" r="10" :fill="i===0?'#175f9f':'#a0480c'"/></template>
</g><circle cx="105" cy="94" r="3" fill="#162d40"/>
<text x="105" y="185" text-anchor="middle">{{i===0?'正方向は反時計回り':`観測 n = ${rotation.sampleIndex}`}}</text>
</svg></figure></div>
<div class="condition" aria-live="polite">
<div>f = {{f.toFixed(1)}} Hz ／ fs = {{fs.toFixed(1)}} Hz</div>
<template v-if="!wheel"><strong>Nyquist条件：fs &gt; 2 fmax</strong><div>この1点のx・y座標では fmax = f</div><b data-testid="nyquist">{{fs.toFixed(1)}} &gt; {{(2*f).toFixed(1)}} {{temporalNyquist?'✓':'✗'}}</b><div>{{temporalNyquist?'帯域上限が既知なら理想的に復元可能':'元の運動を一意に復元できない'}}</div></template>
<template v-else><strong>車輪はAliasingの応用例</strong><div>8本なら同じ見た目が1回転に8回。</div><div>模様の基本周波数 = 8f = {{(8*f).toFixed(1)}} Hz</div><div>fs &gt; 2f だけでは判定できません。</div></template>
<div class="apparent">見かけの代表：<b data-testid="apparent">{{speedText}}</b></div>
</div></div>
<div class="formula">{{wheel?'模様の位相の模型：cos(2π · 8f · t)':'x(t) = cos(2πft)'}} <span>— 0〜1秒の固定区間</span></div>
<SamplingSignalPlot :frequency="waveFrequency" :density="fs" />
<p class="detail">サンプル点だけから元の周波数を一意に決められるでしょうか？ 破線は同じ点を通る代表解です。{{wheel?'車輪の図自体は高調波も含みます。基本周波数だけで画像全体の復元は保証しません。':'境界 fs = 2f では、この初期位相のcos波は重なりますが、他の位相の情報は保証されません。'}}</p>
<p class="detail">右は光った瞬間の状態を次の観測まで保持する模式表示です。理想復元ではありません。左も画面の更新間隔で描くため、高速時は波形と数値で判断してください。<span v-if="reduced"> 動きを減らす設定に合わせ、停止から開始しています。</span></p>
</section>

<section v-else-if="mode==='space'" aria-label="空間方向の標本化">
<div class="controls"><label>縞の周波数<input aria-label="縞の空間周波数" type="range" min="0.5" max="32" step="0.5" v-model.number="spatialF"/><output>{{spatialF}} 周期/幅1</output></label><label>画素数<input aria-label="空間の画素数" type="range" min="4" max="64" step="1" v-model.number="pixels"/><output>{{pixels}} 点/幅1</output></label></div>
<div class="presets"><button @click="spacePreset(4,16)">十分な標本化</button><button @click="spacePreset(4,8)">Nyquist境界</button><button @click="spacePreset(7,8)">別の低周波に見える</button><button @click="spacePreset(8,8)">縞が消える</button><button @click="spacePreset(6,8)">別周期に見える</button></div>
<p class="formula">I(x) = 0.5 + 0.5 cos(2πfx)　／ fs &gt; 2f：{{pixels}} &gt; {{2*spatialF}} {{spatialNyquist?'✓':'✗'}}</p>
<div class="stripe-figure">
<figure><figcaption>1. 連続的な元模様（幅1）</figcaption><svg viewBox="0 0 700 40" role="img" aria-label="元の連続的な縞"><rect v-for="(p,i) in bars" :key="i" :x="700*p.x" width="1.8" height="40" :fill="gray(p.v)"/></svg></figure>
<figure><figcaption>2. 標本化位置 x = n / fs</figcaption><svg viewBox="0 0 700 25" role="img" aria-label="等間隔の標本化位置"><path d="M0 12H700" stroke="#b6c7d7"/><circle v-for="(p,i) in spatialSamples" :key="i" :cx="700*p.position" cy="12" r="3" fill="#175f9f"/></svg></figure>
<figure><figcaption>3. 取得値を1画素ずつ保持（拡大）</figcaption><svg viewBox="0 0 700 40" role="img" aria-label="取得した画素値の保持表示"><rect v-for="(p,i) in spatialSamples" :key="i" :x="700*p.position" :width="700/pixels+.1" height="40" :fill="gray(p.value)"/></svg></figure>
<figure><figcaption>4. 同じ標本点を通る代表波：{{Math.abs(spatialAlias).toFixed(1)}} 周期/幅1</figcaption><svg viewBox="0 0 700 40" role="img" aria-label="代表aliasを連続的な縞として表示"><rect v-for="(p,i) in bars" :key="i" :x="700*p.x" width="1.8" height="40" :fill="gray(p.alias)"/></svg></figure>
</div>
<SamplingSignalPlot :frequency="spatialF" :density="pixels" spatial />
<p class="detail">標本点は各区間の左端です。3は保持表示、4は低周波の代表解で、標本から元画像を復元した保証ではありません。細かい縞が粗い縞へ化ける現象は、モアレの理解につながります。</p>
</section>

<section v-else aria-label="CGの標本化">
<div class="controls"><label>角度<input aria-label="統合デモの線の角度" type="range" min="0" max="90" step="1" v-model.number="angle"/><output>{{angle}}°</output></label><label>画素解像度<input aria-label="統合デモの画素解像度" type="range" min="8" max="48" step="1" v-model.number="resolution"/><output>{{resolution}}×{{resolution}}</output></label><label><input type="checkbox" v-model="aa" aria-label="統合デモのAA"/>AA</label><label><input type="checkbox" v-model="grid" aria-label="統合デモの格子"/>格子</label></div>
<div class="cg-pair"><figure><figcaption>連続的な斜め線</figcaption><svg viewBox="0 0 320 320" role="img" aria-label="画素化する前の線"><rect width="320" height="320" fill="white"/><line x1="22.4" y1="160" x2="297.6" y2="160" :transform="`rotate(${angle} 160 160)`" stroke="#111" :stroke-width="1.3*320/resolution"/></svg></figure><figure><figcaption>画素格子へ標本化（拡大）</figcaption><svg viewBox="0 0 320 320" role="img" aria-label="標本化した線と被覆率" data-testid="raster"><rect v-for="(c,i) in cells" :key="i" :x="c.x*320/resolution" :y="c.y*320/resolution" :width="320/resolution" :height="320/resolution" :fill="gray(1-c.coverage)" :stroke="grid?'#9ca9b5':'none'" stroke-width=".5"/></svg></figure></div>
<p class="formula">{{aa?'AA ON：画素内4×4点で被覆率を近似し、濃淡へ':'AA OFF：画素中心の1点だけで白か黒を判定'}}</p>
<div class="processes"><div><strong>そのまま標本化</strong><p>連続的な図形 → 有限の画素格子で標本化 → 高い空間周波数を十分表現できない → Aliasing → Jaggy</p></div><div><strong>AAの考え方</strong><p>連続的な図形 → 低域通過フィルタリング → サンプリング → Aliasingを低減</p></div></div>
<p class="detail">急な輪郭にも高周波成分が含まれます。AAは画素数を増やさず、境界が通る位置を中間値に反映します。4×4点の平均は近似なので、Aliasingが完全に消えるとは限りません。線幅は約1.3画素に固定した比較です。</p>
</section>
<details class="correspondence" :open="!props.compact"><summary>時間と空間をつなげて考える</summary><p>動く物体 → 一定時間ごとに観測 → 時間サンプリング<br>連続画像 → 一定間隔のpixelで観測 → 空間サンプリング</p><table><thead><tr><th>時間方向</th><th>画像・空間方向</th></tr></thead><tbody><tr><td>時間 t</td><td>位置 x, y</td></tr><tr><td>運動の周波数</td><td>空間周波数</td></tr><tr><td>ストロボ周波数</td><td>pixel sampling frequency</td></tr><tr><td>時間aliasing</td><td>空間aliasing</td></tr></tbody></table><p>同じ標本点を通る信号は複数あります。帯域上限の仮定と fs &gt; 2 fmax が、信号を選ぶために必要です。</p></details>
</DemoFrame>
</div>
</template>

<style scoped>
.sampling-theorem{--theorem-blue:#175f9f;--theorem-soft:#edf4fa}.sampling-theorem :deep(.demo){font-size:20px}.mode-switch,.presets{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}.mode-switch button{flex:1;min-width:160px;padding:9px}.mode-switch button[aria-pressed=true]{background:#175f9f;color:white;border-color:#175f9f}.presets{align-items:center;font-size:17px}.preset-note{font-size:17px;min-height:26px;margin:8px 0 12px!important}.sampling-theorem :deep(.controls){gap:12px 20px}.sampling-theorem :deep(label){flex-wrap:wrap;gap:8px}.sampling-theorem :deep(input[type=range]){width:135px}.sampling-theorem output{font-size:17px;min-width:63px;font-variant-numeric:tabular-nums}.motion-layout{display:grid;grid-template-columns:1.1fr 1fr;gap:22px;align-items:center}.rotation-pair,.cg-pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}.rotation-pair svg{width:100%;max-height:210px}.rotation-pair figcaption,.cg-pair figcaption{font-size:17px;line-height:1.45;text-align:center}.rotation-pair text{font:15px sans-serif;fill:currentColor}.condition{font-size:18px;line-height:1.65;padding:10px 16px;border-left:3px solid #175f9f}.condition strong{display:block}.condition b[data-testid=nyquist]{font-size:26px}.apparent{margin-top:10px}.formula{font-size:19px;font-weight:600;margin:12px 0 2px!important}.formula span{font-size:16px;font-weight:400}.detail{font-size:17px;line-height:1.6;margin:12px 0!important}.stripe-figure{margin:16px 0}.stripe-figure figure{margin:0 0 12px}.stripe-figure figcaption{font-size:17px;margin-bottom:5px}.stripe-figure svg{width:100%;height:40px;overflow:visible}.stripe-figure text{font:18px sans-serif;fill:currentColor}.cg-pair{max-width:780px;margin:20px auto}.cg-pair svg{width:100%;max-height:300px;border:1px solid #c8d1da;shape-rendering:crispEdges}.cg-pair figure:first-child svg{shape-rendering:auto}.processes{display:grid;grid-template-columns:1fr 1fr;gap:24px;font-size:18px;margin-top:20px}.processes p{font-size:18px;line-height:1.65}.correspondence{border-top:1px solid #c8d1da;margin-top:20px;padding-top:14px;font-size:18px}.correspondence summary{cursor:pointer;font-weight:700}.correspondence p{font-size:18px;line-height:1.6}.correspondence table{width:100%;font-size:17px;border-collapse:collapse}.correspondence td,.correspondence th{padding:7px 10px;border-bottom:1px solid #d5dfe8;text-align:left}.sampling-theorem :deep(button:focus-visible),.sampling-theorem :deep(select:focus-visible){outline:3px solid #1c73b9;outline-offset:3px}
.compact :deep(.demo){font-size:17px}.compact :deep(.demo-top){display:none}.compact .mode-switch{margin:0 0 8px}.compact .mode-switch button{padding:4px;font-size:17px}.compact :deep(.controls){font-size:17px;gap:6px 12px;margin-bottom:6px}.compact :deep(input[type=range]){width:100px}.compact :deep(button){padding:3px 8px}.compact .presets{font-size:15px;margin:5px 0}.compact .preset-note{font-size:15px;margin:5px 0!important;min-height:0}.compact .rotation-pair svg{max-height:145px}.compact .condition{font-size:16px;line-height:1.4}.compact .condition b[data-testid=nyquist]{font-size:21px}.compact .apparent{margin-top:4px}.compact .motion-layout{grid-template-columns:1fr 1fr}.compact .formula{font-size:17px;margin:5px 0!important}.compact :deep(.sampling-plot svg){height:110px}.compact :deep(.sampling-plot figcaption){font-size:15px}.compact .detail,.compact .correspondence{display:none}.compact .stripe-figure{margin:4px 0}.compact .stripe-figure figure{margin:0 0 4px}.compact .stripe-figure figcaption{font-size:15px;margin:0}.compact .stripe-figure svg{height:27px}.compact .cg-pair{margin:8px auto;max-width:650px}.compact .cg-pair svg{max-height:220px}.compact .processes{font-size:16px;margin-top:7px}.compact .processes p{font-size:16px;line-height:1.4;margin:4px 0}.compact .rotation-pair figcaption,.compact .cg-pair figcaption{font-size:16px}
@media(max-width:650px){.motion-layout{grid-template-columns:1fr}.rotation-pair{gap:5px}.rotation-pair figcaption{font-size:14px}.condition{font-size:16px}.mode-switch button{flex-basis:100%}.sampling-theorem :deep(label){max-width:100%}.sampling-theorem :deep(input[type=range]){width:135px}.processes{grid-template-columns:1fr;gap:4px}.cg-pair{gap:8px}.cg-pair figcaption{font-size:14px}.correspondence td,.correspondence th{padding:5px;font-size:14px;overflow-wrap:anywhere}.sampling-theorem :deep(.sampling-plot svg){min-height:110px}.stripe-figure svg{height:35px}.stripe-figure figcaption{font-size:16px}}
@media print{.screen-only{display:none!important}}
</style>
