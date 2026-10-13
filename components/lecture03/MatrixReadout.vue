<script setup lang="ts">
withDefaults(defineProps<{matrix:number[];label?:string;digits?:number}>(),{digits:2,label:'4×4行列'})
function value(n:number,d:number){return Math.abs(n)<.5*10**(-d)?'0':Number(n.toFixed(d)).toString()}
</script>
<template><div class="l3-matrix-wrap"><div class="l3-matrix-label">{{label}}</div><table class="l3-matrix" :aria-label="label"><tbody><tr v-for="row in 4" :key="row"><td v-for="col in 4" :key="col">{{value(matrix[(row-1)*4+col-1],digits)}}</td></tr></tbody></table></div></template>
<style scoped>.l3-matrix-wrap{min-width:0}.l3-matrix-label{font-size:.9em;font-weight:600;margin-bottom:6px}.l3-matrix{border-left:2px solid #47728f;border-right:2px solid #47728f;border-radius:7px;width:100%;border-collapse:separate!important;font-size:17px!important;font-variant-numeric:tabular-nums;text-align:center;margin:0!important}.l3-matrix td{padding:3px 5px!important;border:0!important;text-align:center!important;white-space:nowrap}.compact .l3-matrix{font-size:16px!important}</style>
