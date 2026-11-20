<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { lambert, orenNayar } from '../../packages/cg-algorithms/src/shading-classic.ts'
import { linearColor, linearToSrgb } from '../../packages/cg-algorithms/src/shading-geometry.ts'
const props=defineProps<{lightAngle:number;viewAngle:number;azimuth:number;sigma:number}>()
const emit=defineEmits<{azimuth:[value:number]}>()
const playing=ref(false)
let frame=0,previous=0,phase=0
function stop(){playing.value=false;cancelAnimationFrame(frame);frame=0;previous=0}
function tick(now:number){
 if(!playing.value)return
 if(previous)phase=(phase+Math.min((now-previous)/1000,.05)*30)%360
 previous=now
 emit('azimuth',Math.round(phase<=180?phase:360-phase))
 frame=requestAnimationFrame(tick)
}
function toggle(){
 if(playing.value){stop();return}
 phase=props.azimuth;previous=0;playing.value=true;frame=requestAnimationFrame(tick)
}
defineExpose({stop})
onBeforeUnmount(stop)
const diffuse=computed(()=>lambert(props.lightAngle))
const rough=computed(()=>orenNayar(props.lightAngle,props.viewAngle,props.azimuth,props.sigma))
const curve=computed(()=>Array.from({length:181},(_,phi)=>orenNayar(props.lightAngle,props.viewAngle,phi,props.sigma)))
const maximum=computed(()=>Math.max(1,Math.ceil(Math.max(diffuse.value,...curve.value)*10)/10))
const x=(phi:number)=>58+phi/180*480
const y=(value:number)=>192-value/maximum.value*150
const path=computed(()=>curve.value.map((value,phi)=>(phi?'L':'M')+x(phi).toFixed(2)+','+y(value).toFixed(2)).join(' '))
const color=(value:number)=>'rgb('+linearColor('#82bee8').map(c=>Math.round(255*linearToSrgb(Math.min(1,c*value)))).join(',')+')'
const cards=computed(()=>[{name:'Lambert',value:diffuse.value,note:'視点を動かしても一定'},{name:'Oren–Nayar',value:rough.value,note:props.sigma===0?'σ=0なのでLambertと一致':'視点・粗さに応じて変化'}])
</script>
<template>
<section class="oren-point-comparison">
  <header><div><h3>同じ点Pを見続けると？</h3><p>法線 N=(0,1,0) を固定。球の上端（+Y方向）と同じ法線を持つ面の比較です。</p></div><button type="button" :aria-pressed="playing" data-oren-play @click="toggle">{{playing?'一時停止':'視点を自動で往復'}}</button></header>
  <div class="point-cards"><div v-for="card in cards" :key="card.name" class="point-card">
    <span class="color-patch" :style="{background:color(card.value)}" role="img" :aria-label="card.name+'の固定点の反射色'"/>
    <div><strong>{{card.name}}</strong><output :data-oren-value="card.name">{{card.value.toFixed(5)}}</output><small>{{card.note}}</small></div>
  </div></div>
  <p class="units">数字は、正面入射時のLambert放射輝度を1とした相対値。色見本には球と同じ材質色を掛けています。</p>
  <div class="legend"><span class="lambert-key">破線：Lambert</span><span class="oren-key">実線：Oren–Nayar</span><span>現在の方位差 Δφ = {{azimuth}}°</span></div>
  <svg viewBox="0 0 580 245" role="img" aria-label="光源と視点の方位差と、固定点の相対放射輝度。Lambertは水平な破線、Oren–Nayarは粗さと方向に依存する実線。">
    <text x="58" y="22" class="axis-caption">点Pの相対放射輝度</text>
    <g v-for="value in [0,maximum/2,maximum]" :key="value"><line x1="58" x2="538" :y1="y(value)" :y2="y(value)" class="grid"/><text x="47" :y="y(value)+5" text-anchor="end">{{value.toFixed(1)}}</text></g>
    <g v-for="phi in [0,45,90,135,180]" :key="phi"><line :x1="x(phi)" :x2="x(phi)" y1="42" y2="192" class="grid"/><text :x="x(phi)" y="213" text-anchor="middle">{{phi}}°</text></g>
    <path :d="path" class="oren-line"/><line x1="58" x2="538" :y1="y(diffuse)" :y2="y(diffuse)" class="lambert-line"/>
    <line :x1="x(azimuth)" :x2="x(azimuth)" y1="38" y2="192" class="cursor"/>
    <circle :cx="x(azimuth)" :cy="y(rough)" r="5" fill="#ffce70"/><circle :cx="x(azimuth)" :cy="y(diffuse)" r="7" fill="none" stroke="#64e8bc" stroke-width="2"/>
    <text x="298" y="237" text-anchor="middle" class="axis-caption">光源と視点の方位差 Δφ</text>
  </svg>
  <p class="point-note">球の画像では、カメラを動かすと画面の同じ位置に映る表面点も変わります。視点依存性は、この固定点Pの色・数値・グラフで比べてください。</p>
  <p class="point-note">自動往復は光源と天頂角を固定し、視点の方位角だけを変更します。スライダー・プリセットの操作で停止します。</p>
</section>
</template>
<style scoped>
.oren-point-comparison{margin:16px 0;padding:16px;border:1px solid #446b72;border-radius:12px;background:#102235;color:#d8eff1;min-width:0}header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}h3{font-size:19px;color:#fff;margin:0 0 7px}p{margin:7px 0;font-size:13px}button{font:inherit;background:#24463f;color:#e7eff7;border:1px solid #4f8c7c;border-radius:7px;padding:8px 12px;cursor:pointer;flex-shrink:0}button:focus-visible{outline:3px solid #64e8bc}.point-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.point-card{display:flex;gap:12px;align-items:center;border:1px solid #36516a;border-radius:8px;padding:12px;min-width:0}.color-patch{width:65px;height:65px;border:1px solid #708ca3;border-radius:5px;flex-shrink:0}.point-card strong,.point-card output,.point-card small{display:block}.point-card output{font:700 24px/1.4 ui-monospace,monospace;color:#ffce70}.point-card small,.units,.point-note{font-size:12px;color:#bdd5df}.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;margin:18px 0 3px}.lambert-key{color:#64e8bc}.oren-key{color:#ffce70}svg{display:block;width:100%;height:auto;font:14px sans-serif}text{fill:#bdd5df}.axis-caption{fill:#e7eff7}.grid{stroke:#36516a;stroke-width:1}.oren-line{fill:none;stroke:#ffce70;stroke-width:3}.lambert-line{stroke:#64e8bc;stroke-width:2;stroke-dasharray:8 5}.cursor{stroke:#c4d6e6;stroke-width:1;stroke-dasharray:3 3}@media(max-width:950px){header{display:block}header button{margin:6px 0}.point-cards{grid-template-columns:1fr}.point-card{padding:9px}.color-patch{width:48px;height:48px}}@media(max-width:420px){.oren-point-comparison{padding:10px}svg{font-size:26px}.axis-caption{font-size:25px}}
</style>
