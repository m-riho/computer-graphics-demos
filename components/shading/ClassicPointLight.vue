<script setup lang="ts">
import { computed, useId } from 'vue'
import { pointIlluminance } from '../../packages/cg-algorithms/src/shading-classic.ts'
const props = defineProps<{ distance:number; angle:number; intensity:number; azimuth:number }>()
const marker = `point-arrow-${useId().replace(/:/g,'')}`
const illumination = computed(() => pointIlluminance(props.distance,props.angle,props.intensity))
const position = computed(() => {
  const theta=props.angle*Math.PI/180, phi=props.azimuth*Math.PI/180
  return { x:props.distance*Math.sin(theta)*Math.sin(phi),y:props.distance*Math.cos(theta),z:props.distance*Math.sin(theta)*Math.cos(phi) }
})
const light = computed(() => ({x:230+22*(position.value.z+.4*position.value.x),y:150-22*(position.value.y-.18*position.value.x)}))
const graphMaximum = computed(() => Math.max(.1,props.intensity*4))
const curve = computed(() => Array.from({length:101},(_,i) => {const r=.5+i*4.5/100;return `${50+(r-.5)/4.5*350},${210-pointIlluminance(r,props.angle,props.intensity)/graphMaximum.value*165}`}).join(' '))
const graphPoint = computed(() => ({x:50+(props.distance-.5)/4.5*350,y:210-illumination.value/graphMaximum.value*165}))
</script>
<template>
  <div class="point-panels">
    <figure>
      <svg viewBox="0 0 460 300" role="img" aria-label="点光源と表面点の位置関係">
        <defs><marker :id="marker" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="context-stroke" /></marker></defs>
        <path d="M80 150 L330 150 L385 180 L135 180 Z" fill="#233b52" stroke="#6b859a" />
        <line x1="230" y1="150" x2="230" y2="65" stroke="#64e8bc" stroke-width="3" :marker-end="`url(#${marker})`" />
        <text x="235" y="58" fill="#64e8bc">N</text>
        <line x1="230" y1="150" :x2="light.x" :y2="light.y" stroke="#ffce70" stroke-width="3" :marker-end="`url(#${marker})`" />
        <circle :cx="light.x" :cy="light.y" r="9" fill="#ffce70" />
        <circle cx="230" cy="150" r="5" fill="white" />
        <text x="210" y="177" fill="white">P</text>
        <text x="20" y="27" fill="#ffce70">r = {{ distance.toFixed(2) }} m / θ = {{ angle }}°</text>
        <text x="20" y="283" fill="#bdccda" font-size="13">光源位置 ({{ position.x.toFixed(2) }}, {{ position.y.toFixed(2) }}, {{ position.z.toFixed(2) }}) m</text>
      </svg>
      <figcaption>球面座標で光源位置を指定。方位を変えても距離と入射角は一定。</figcaption>
    </figure>
    <figure>
      <svg viewBox="0 0 460 300" role="img" aria-label="距離と照度の逆二乗グラフ">
        <text x="20" y="24" fill="#d9e6f2">照度 E [W/m²]</text>
        <path d="M50 40 V210 H410" fill="none" stroke="#a1b4c6" />
        <g v-for="r in [1,2,3,4,5]" :key="r">
          <line :x1="50+(r-.5)/4.5*350" :x2="50+(r-.5)/4.5*350" y1="210" y2="216" stroke="#a1b4c6" />
          <text :x="50+(r-.5)/4.5*350" y="239" text-anchor="middle" fill="#bdccda">{{ r }}</text>
        </g>
        <text x="41" y="214" text-anchor="end" fill="#bdccda">0</text>
        <text x="41" y="50" text-anchor="end" fill="#bdccda">{{ graphMaximum.toFixed(1) }}</text>
        <polyline :points="curve" fill="none" stroke="#64e8bc" stroke-width="3" />
        <circle :cx="graphPoint.x" :cy="graphPoint.y" r="6" fill="#ffce70" />
        <text x="210" y="272" fill="#d9e6f2">距離 r [m]</text>
      </svg>
      <figcaption>角度・光源強度を固定して距離だけを変えた曲線。</figcaption>
    </figure>
  </div>
</template>
<style scoped>
.point-panels{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;border:1px solid #36516a;border-radius:12px;padding:10px;background:#102235}svg{width:100%;display:block}text{font:16px sans-serif}figcaption{font-size:13px;color:#bdccda;line-height:1.6}@media(max-width:700px){.point-panels{grid-template-columns:1fr}}
</style>
