<script setup lang="ts">
import { onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ step: number; max: number }>()
const emit = defineEmits<{ 'update:step': [value: number]; reset: [] }>()
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
  playing.value = false
}
function advance() {
  const next = Math.min(props.step + 1, props.max)
  emit('update:step', next)
  if (next >= props.max) stop()
}
function toggle() {
  if (playing.value) return stop()
  if (props.max <= 0) return
  if (props.step >= props.max) emit('update:step', 0)
  playing.value = true
  timer = setInterval(advance, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1800 : 900)
}
function reset() {
  stop()
  emit('reset')
}
function visibilityChanged() { if (document.hidden) stop() }
watch(() => props.max, stop)
onMounted(() => document.addEventListener('visibilitychange', visibilityChanged))
onDeactivated(stop)
onUnmounted(() => {
  stop()
  document.removeEventListener('visibilitychange', visibilityChanged)
})
</script>

<template>
  <div class="vis-playback" role="group" aria-label="ステップ操作">
    <button type="button" @click="reset" title="初期設定に戻す">Reset</button>
    <button type="button" :disabled="step >= max" @click="stop(); advance()">1ステップ進む</button>
    <button type="button" :disabled="max <= 0" :aria-pressed="playing" @click="toggle">{{ playing ? '一時停止' : '自動再生' }}</button>
    <output>ステップ {{ step }} / {{ max }}</output>
  </div>
</template>

<style scoped>
.vis-playback { display:flex; flex-wrap:wrap; align-items:center; gap:.55rem; margin:1rem 0; font:inherit; }
.vis-playback button { background:white; border:1px solid #9bb5cc; border-radius:5px; padding:.42em .85em; color:#14466d; font:inherit; cursor:pointer; }
.vis-playback button[aria-pressed=true] { background:#005bac; color:white; }
.vis-playback button:disabled { opacity:.55; cursor:default; }
.vis-playback output { color:#425d72; font-variant-numeric:tabular-nums; }
</style>
