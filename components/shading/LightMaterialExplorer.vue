<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { diffuseRGB, displayRGB, renderDiffuseSphere, type RGB } from '../../packages/cg-algorithms/src/shading-light-color.ts'
import { linearColor } from '../../packages/cg-algorithms/src/shading-geometry.ts'
defineProps<{topic?:string}>()
const material=reactive<RGB>([.8,.04,.02]),light=reactive<RGB>([0,0,1])
const angle=ref(0),intensity=ref(1),teacher=ref(false),canvases=ref<HTMLCanvasElement[]>([])
const channels=['R','G','B'] as const
const groups=[{label:'物体',values:material},{label:'光源',values:light}]
const cosine=computed(()=>angle.value>=90?0:Math.cos(angle.value*Math.PI/180))
const output=computed(()=>diffuseRGB(material,light,cosine.value,intensity.value))
const reference=computed(()=>diffuseRGB(material,[1,1,1],cosine.value,intensity.value))
const css=(rgb:RGB)=>`rgb(${displayRGB(rgb).join(',')})`
const hex=(rgb:RGB)=>'#'+displayRGB(rgb).map(v=>v.toString(16).padStart(2,'0')).join('')
function inputChannel(values:RGB,i:number,event:Event){
 const input=event.target as HTMLInputElement,n=Number(input.value)
 values[i]=Number.isFinite(n)?Math.max(0,Math.min(1,n)):0
 input.value=String(values[i])
}
function pick(values:RGB,event:Event){Object.assign(values,linearColor((event.target as HTMLInputElement).value))}
function reset(){Object.assign(material,[.8,.04,.02]);Object.assign(light,[0,0,1]);angle.value=0;intensity.value=1}
const presets:{name:string;material:RGB;light:RGB}[]=[
 {name:'赤い材質 × 青色光',material:[.8,.04,.02],light:[0,0,1]},
 {name:'赤い材質 × 白色光',material:[.8,.04,.02],light:[1,1,1]},
 {name:'純赤 × シアン光',material:[1,0,0],light:[0,1,1]},
 {name:'白い材質 × 青色光',material:[1,1,1],light:[0,0,1]},
 {name:'黄色い材質 × 赤色光',material:[.8,.65,.02],light:[1,0,0]},
]
function preset(p:typeof presets[number]){reset();Object.assign(material,p.material);Object.assign(light,p.light)}
let frame=0
function draw(){
 frame=0
 canvases.value.forEach((canvas,i)=>{
  const pixels=renderDiffuseSphere(material,i===0?[1,1,1]:light,angle.value,intensity.value)
  const ctx=canvas.getContext('2d')!
  ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels),241,241),0,0)
  // Center marker outlines the sampled point without painting over its color.
  ctx.beginPath();ctx.arc(120,120,5,0,2*Math.PI);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke()
 })
}
function schedule(){if(!frame)frame=requestAnimationFrame(draw)}
onMounted(schedule)
watch([material,light,angle,intensity],schedule,{deep:true})
onBeforeUnmount(()=>cancelAnimationFrame(frame))
</script>
<template>
<section class="shading-explorer light-material-explorer" :class="{'teacher-mode':teacher}">
  <header><div><h2>光源色 × 物体色 → 見える色</h2><p>同じ材質に届く光だけを変えて、反射する色を比べます。</p></div><button @click="teacher=!teacher">{{teacher?'通常表示':'教員モード'}}</button></header>
  <div class="presets"><button v-for="p in presets" :key="p.name" @click="preset(p)">{{p.name}}</button><button @click="reset">初期状態に戻す</button></div>
  <div class="experiment">
    <div class="visual">
      <div class="spheres">
        <figure v-for="(name,i) in ['比較：白色光','実験：変更中の光源']" :key="name">
          <figcaption>{{name}}</figcaption>
          <div class="lamp"><span :style="{background:css(i===0?[1,1,1]:light)}"/> {{i===0?'白色光 (1, 1, 1)':'光源RGB ('+light.map(v=>v.toFixed(2)).join(', ')+')'}}</div>
          <canvas ref="canvases" width="241" height="241" role="img" :aria-label="name+'で照らした球。中央の丸印が計算表の点。'"/>
          <div class="sample"><span :style="{background:css(i===0?reference:output)}"/><div>中央の点・線形RGB<strong :data-output="i===0?'reference':'current'">{{(i===0?reference:output).map(v=>v.toFixed(3)).join(' / ')}}</strong></div></div>
        </figure>
      </div>
      <p class="hint">球の中央の丸印が、下の計算表に対応します。両側で材質・角度・光源強度は共通です。</p>
      <div class="observation" aria-live="polite">
        <strong v-if="output.every(v=>v===0)">反射する光がありません。</strong>
        <strong v-else-if="light[0]===0&&material[0]>.5">赤を多く反射する材質でも、赤い光が届かなければ赤は返りません。</strong>
        <strong v-else>届いた光のうち、材質が反射できる成分が返ります。</strong>
        <p>光源色と物体色は足し算ではなく、RGBの同じ成分どうしの掛け算です。</p>
      </div>
    </div>
    <div class="controls">
      <fieldset v-for="group in groups" :key="group.label"><legend>{{group.label==='物体'?'物体の拡散係数 k_d':'光源の相対RGB I_L'}}</legend>
        <label class="picker">{{group.label}}の色 <input type="color" :aria-label="group.label+'のカラーピッカー'" :value="hex(group.values)" @input="pick(group.values,$event)"/></label>
        <div v-for="(channel,i) in channels" :key="channel" class="channel">
          <label :for="'light-material-'+group.label+channel">{{group.label}} {{channel}}</label>
          <input :id="'light-material-'+group.label+channel" type="range" min="0" max="1" step="0.01" :value="group.values[i]" @input="inputChannel(group.values,i,$event)"/>
          <input type="number" min="0" max="1" step="0.01" :aria-label="group.label+' '+channel+' 数値'" :value="group.values[i]" @change="inputChannel(group.values,i,$event)"/>
        </div>
      </fieldset>
      <p class="hint">数値は線形RGB（0〜1）。カラーピッカーのsRGBは線形値に変換します。</p>
      <label class="extra">中央での入射角 θ <b>{{angle}}°</b><input v-model.number="angle" aria-label="中央での入射角 θ" type="range" min="0" max="120" step="1"/></label>
      <label class="extra">光源強度 <b>{{intensity.toFixed(2)}}</b><input v-model.number="intensity" aria-label="光源強度" type="range" min="0" max="1" step="0.01"/></label>
    </div>
  </div>
  <section class="calculation">
    <h3>中央の点では、何を掛けている？</h3>
    <p>I<sub>d</sub> = k<sub>d</sub> × I<sub>L</sub> × 光源強度 × max(0, N·L)　／　max(0, cos {{angle}}°) = {{cosine.toFixed(3)}}</p>
    <p class="scroll-hint">表は左右にスクロールできます。</p>
    <div class="table-scroll"><table><thead><tr><th>成分</th><th>物体 k<sub>d</sub></th><th>光源 I<sub>L</sub></th><th>強度</th><th>角度の係数</th><th>反射光（線形）</th><th>表示sRGB</th></tr></thead>
    <tbody><tr v-for="(channel,i) in channels" :key="channel"><th>{{channel}}</th><td>{{material[i]!.toFixed(3)}}</td><td>× {{light[i]!.toFixed(3)}}</td><td>× {{intensity.toFixed(2)}}</td><td>× {{cosine.toFixed(3)}}</td><td class="result">= {{output[i]!.toFixed(3)}}</td><td>{{displayRGB(output)[i]}} / 255</td></tr></tbody></table></div>
  </section>
  <details :open="teacher"><summary>観察のヒントと、このモデルの範囲</summary>
    <ol><li>「赤い材質 × 青色光」では、弱い青だけが返ることを確認します。</li><li>光源Rを増やすと赤が戻ります。物体Bを増やすと、青色光の下でも明るい青になります。</li><li>「純赤 × シアン光」は共通する成分がないため黒。「白い材質 × 青色光」では青が返ります。</li><li>入射角60°では中央の線形光量は半分。表示用sRGBの数字は、そのまま半分にはなりません。</li></ol>
    <p>第7回p.25〜26の教育用Lambertモデルです。鏡面反射・環境光・間接反射は加えていません。数値は正面の白色光を基準にした相対値で、画面にはsRGB変換して表示します。</p>
    <p>実物の色は光源の分光分布と物体の分光反射率にも依存します。このRGBモデルは、実在する塗料や照明の色を厳密に予測するものではありません。</p>
  </details>
</section>
</template>
<style scoped>
.light-material-explorer{color:#153854;font-size:16px;line-height:1.5}.light-material-explorer *{box-sizing:border-box}header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}h2{font-size:27px;margin:0}h3{font-size:20px;margin:0 0 8px}p{margin:8px 0}button{border:1px solid #9bb5cc;border-radius:5px;padding:8px 12px;background:#f3f8ff;color:#14466d;cursor:pointer;font:inherit}header>button{white-space:nowrap}.presets{display:flex;flex-wrap:wrap;gap:7px;margin:18px 0}.experiment{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,1fr);gap:24px;align-items:start}.visual{position:sticky;top:12px}.spheres{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;min-width:0}figcaption{font-weight:700}.lamp{display:flex;align-items:center;gap:6px;font-size:12px;margin:8px 0;min-height:22px}.lamp>span{width:22px;height:22px;border:1px solid #8195a6;border-radius:50%;flex-shrink:0}canvas{width:100%;height:auto;background:#263344;border-radius:8px;display:block}.sample{display:flex;align-items:center;gap:8px;margin:10px 0;font-size:12px}.sample>span{width:32px;height:32px;border:1px solid #8299ad;border-radius:4px;flex-shrink:0}.sample strong{display:block;font-size:15px;font-variant-numeric:tabular-nums}.hint{font-size:13px;color:#50677d}.observation{background:#edf4fc;border-left:4px solid #005bac;padding:14px;margin:18px 0}.controls{min-width:0}fieldset{border:1px solid #cbdbea;border-radius:8px;margin:0 0 14px;padding:10px 14px}legend{font-weight:700;color:#005bac}.picker{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.picker input{width:110px;height:32px;padding:2px;border:1px solid #a4b9cc}.channel{display:grid;grid-template-columns:56px minmax(0,1fr) 70px;gap:8px;align-items:center;margin:10px 0}.channel input[type=number]{width:100%;min-width:0;padding:4px;border:1px solid #a4b9cc;border-radius:4px;font:inherit}.channel input[type=range],.extra input{width:100%;min-width:0;accent-color:#005bac}.extra{display:grid;grid-template-columns:1fr auto;margin:12px 0}.extra input{grid-column:1/-1}.calculation{margin:22px 0;background:#edf4fc;padding:16px;border-radius:8px}.calculation p{font-size:15px}.scroll-hint{display:none}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}th,td{padding:9px 7px;text-align:center;border-bottom:1px solid #cbdbea;white-space:nowrap}th{font-weight:600}.result{font-weight:700;color:#005bac}details{border-top:1px solid #cbdbea;padding-top:12px}summary{cursor:pointer;font-weight:600}li{margin:5px 0}.teacher-mode{font-size:19px}.teacher-mode .sample strong,.teacher-mode table{font-size:17px}@media(max-width:900px){.experiment{grid-template-columns:1fr}.visual{position:static}.controls{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}.controls>.hint{grid-column:1/-1}}@media(max-width:520px){header{display:block}header>button{margin-top:10px}h2{font-size:23px}.controls{display:block}.spheres{gap:8px}.sample strong{font-size:12px}.sample{display:block}.sample>span{display:inline-block}.lamp{font-size:10px;min-height:32px}.scroll-hint{display:block;font-size:12px;color:#50677d}.calculation{padding:10px}table{font-size:12px}th,td{padding:7px 4px}}
</style>
