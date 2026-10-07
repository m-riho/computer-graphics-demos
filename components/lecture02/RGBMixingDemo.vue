<script setup lang="ts">
import {ref,computed} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {hex,type RGB} from '../../packages/cg-algorithms/src/index.ts'
const rgb=ref<RGB>([255,255,0]);const color=computed(()=>hex(rgb.value));const names=['R','G','B']
const presets: {name:string,value:RGB}[]=[{name:'Yellow',value:[255,255,0]},{name:'Cyan',value:[0,255,255]},{name:'Magenta',value:[255,0,255]},{name:'White',value:[255,255,255]}]
</script>
<template><DemoFrame label="光の3成分を足す" @reset="rgb=[255,255,0]">
<div class="controls"><label v-for="(n,i) in names">{{n}}<input :aria-label="n" type="range" min="0" max="255" v-model.number="rgb[i]" />{{rgb[i]}}</label></div>
<div class="panels"><div style="background:#000;height:270px;position:relative;isolation:isolate;"><div v-for="(n,i) in names" :style="{position:'absolute',width:'min(180px, 40%)',aspectRatio:'1',borderRadius:'50%',background:`rgb(${i===0?rgb[0]:0},${i===1?rgb[1]:0},${i===2?rgb[2]:0})`,mixBlendMode:'screen',left:['20%','40%','30%'][i],top:['5%','5%','30%'][i]}" /></div><div><div class="swatch" :style="{background:color}"/><div class="readout">RGB ({{rgb.join(', ')}}) · {{color}}</div><div class="controls screen-only" style="margin-top:18px;"><button v-for="p in presets" @click="rgb=[...p.value]">{{p.name}}</button></div></div></div>
<div class="hint">円の重なりは加法混色の模式図。画面の数値は0〜255の符号値で、光の強さとの厳密な比例は仮定しません。</div>
</DemoFrame></template>
