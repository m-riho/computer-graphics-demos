<script setup lang="ts">
import {ref,computed} from 'vue'
import DemoFrame from '../common/DemoFrame.vue'
import {hsvToRgb,rgbToHsv,hex,type RGB} from '../../packages/cg-algorithms/src/index.ts'
const rgb=ref<RGB>([255,128,0]),hsv=ref<RGB>(rgbToHsv(rgb.value));const color=computed(()=>hex(rgb.value))
function fromRgb(){hsv.value=rgbToHsv(rgb.value)}
function fromHsv(){rgb.value=hsvToRgb(...hsv.value)}
function reset(){rgb.value=[255,128,0];fromRgb()}
</script>
<template><DemoFrame label="RGBとHSVを双方向に変換する" @reset="reset">
<div class="panels"><div><label v-for="(n,i) in ['R','G','B']" style="margin:14px 0;">{{n}}<input :aria-label="'RGB '+n" type="range" min="0" max="255" v-model.number="rgb[i]" @input="fromRgb"/>{{rgb[i]}}</label></div><div><label v-for="(n,i) in ['H','S','V']" style="margin:14px 0;">{{n}}<input :aria-label="'HSV '+n" type="range" min="0" :max="i===0?360:100" step="1" v-model.number="hsv[i]" @input="fromHsv"/>{{hsv[i].toFixed(1)}}{{i===0?'°':'%'}}</label></div></div>
<div class="swatch" :style="{background:color,height:'100px'}"/>
<div class="readout">RGB ({{rgb.join(', ')}}) · HSV ({{hsv.map(x=>x.toFixed(1)).join(', ')}}) · {{color}}</div>
<div class="hint">H：色相　S：彩度　V（HSBのB）：最大成分。S=0のとき色相は未定義（操作用に数値を保持／RGB変換時は0）。マンセルとは別の体系です。</div>
</DemoFrame></template>
