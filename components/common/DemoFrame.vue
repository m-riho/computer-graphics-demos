<script setup lang="ts">
defineProps<{label:string}>()
defineEmits<{reset:[]}>()
</script>
<template><section class="demo" :aria-label="label"><div class="demo-top"><strong>{{ label }}</strong><button class="screen-only" @click="$emit('reset')">Reset</button></div><slot /></section></template>
<style>
.demo {font-size:23px;line-height:1.4;color:var(--ink);}
.demo-top {display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.demo button,.demo select {font:inherit;background:var(--paper);color:var(--ink);border:1px solid var(--rule);border-radius:4px;padding:4px 13px;cursor:pointer;}
.demo button:focus-visible,.demo input:focus-visible {outline:3px solid var(--accent);}
.demo .controls {display:flex;flex-wrap:wrap;align-items:center;gap:12px 28px;margin-bottom:14px;}
.demo label {display:flex;gap:12px;align-items:center;}
.demo input[type=range] {width:180px;accent-color:var(--accent);}
.demo .panels {display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start;}
.demo figure {margin:0;}
.demo figcaption {font-size:20px;margin-top:6px;}
.demo .hint {font-size:19px;line-height:1.4;margin-top:10px;color:var(--muted);}
.demo canvas {width:100%;height:260px;object-fit:contain;display:block;}
.demo .swatch {height:125px;border:1px solid var(--rule);margin:10px 0;}
.demo .readout {font-variant-numeric:tabular-nums;font-size:22px;}
.demo svg {display:block;max-width:100%;}
.print-slide-container .demo input,.print-slide-container .demo select {pointer-events:none;}
</style>
