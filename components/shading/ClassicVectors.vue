<script setup lang="ts">
import { computed, useId } from 'vue'
import { directionFromAngles, specularTerms, type LightingDirection } from '../../packages/cg-algorithms/src/shading-classic.ts'
const props = withDefaults(defineProps<{ lightAngle:number; viewAngle?:number; viewAzimuth?:number; specular?:boolean; showView?:boolean }>(), {viewAngle:55,viewAzimuth:180,specular:false,showView:false})
const marker = `classic-arrow-${useId().replace(/:/g,'')}`
const vectors = computed(() => {
  const terms = specularTerms(props.lightAngle,props.viewAngle,props.viewAzimuth)
  const items: {name:string; color:string; direction:LightingDirection; dash?:string}[] = [
    {name:'N 法線',color:'#64e8bc',direction:[0,1,0]},
    {name:'L 光源方向',color:'#ffce70',direction:directionFromAngles(props.lightAngle)},
  ]
  if (props.showView || props.specular) items.push({name:'V 視線方向',color:'#84beff',direction:directionFromAngles(props.viewAngle,props.viewAzimuth),dash:'6 4'})
  if (props.specular) items.push({name:'R 反射方向',color:'#ff90bb',direction:terms.reflection},{name:'H ハーフベクトル',color:'#d1abff',direction:terms.halfway,dash:'3 4'})
  return items.map(item => ({...item,x:230+100*(item.direction[2]+.42*item.direction[0]),y:150-100*(item.direction[1]-.18*item.direction[0])}))
})
</script>
<template>
  <div class="classic-vectors">
    <svg viewBox="0 0 460 285" role="img" :aria-label="`表面点の法線と方向ベクトル。入射角${lightAngle}度`">
      <defs><marker :id="marker" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="context-stroke" /></marker></defs>
      <path d="M65 150 L335 150 L394 184 L124 184 Z" fill="#233b52" stroke="#6b859a" />
      <text x="20" y="27" fill="#d9e6f2" font-size="17">表面点Pで調べる（Nは+Y）</text>
      <g v-for="vector in vectors" :key="vector.name">
        <line x1="230" y1="150" :x2="vector.x" :y2="vector.y" :stroke="vector.color" stroke-width="3" :stroke-dasharray="vector.dash" :marker-end="`url(#${marker})`" />
      </g>
      <circle cx="230" cy="150" r="5" fill="white" />
      <text x="210" y="178" fill="white" font-size="18">P</text>
      <text x="20" y="53" fill="#ffce70" font-size="16">θL = {{ lightAngle }}°</text>
      <text v-if="showView || specular" x="20" y="77" fill="#84beff" font-size="16">θV = {{ viewAngle }}° / Δφ = {{ viewAzimuth }}°</text>
    </svg>
    <div class="vector-legend"><span v-for="vector in vectors" :key="vector.name" :style="{color:vector.color}">{{ vector.name }}</span></div>
    <small>L・Vは表面から光源・視点へ向く単位ベクトル。奥行き方向は斜投影。</small>
  </div>
</template>
<style scoped>
.classic-vectors{background:#102235;border:1px solid #36516a;border-radius:12px;padding:10px}.classic-vectors svg{display:block;width:100%;max-height:280px}.vector-legend{display:flex;flex-wrap:wrap;gap:8px 15px;font-size:14px;font-weight:650}.classic-vectors small{display:block;color:#bdccda;margin-top:8px;font-size:12px}
</style>
