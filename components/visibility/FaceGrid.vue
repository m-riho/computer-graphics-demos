<script setup lang="ts">
import { computed } from 'vue'
import { faceColor, type VisibilityScene, type ColorBuffer, type DepthBuffer } from '../../packages/cg-algorithms/src/visibility-raster'

const props = withDefaults(defineProps<{
  scene: VisibilityScene; label: string; color?: ColorBuffer; depth?: DepthBuffer
  selected?: number; mode?: 'scene' | 'color' | 'depth'; differences?: boolean[]
}>(), { mode: 'color' })
const emit = defineEmits<{ select: [index: number] }>()
const cells = computed(() => Array.from({ length: props.scene.width * props.scene.height }, (_,i) => {
  const id = props.color?.[i] ?? null
  const depth = props.depth?.[i] ?? Infinity
  const value = Number.isFinite(depth) ? String(Number(depth.toFixed(2))) : '∞'
  const label = props.mode === 'depth' ? value : (id ?? '')
  return { x: i % props.scene.width, y: Math.floor(i / props.scene.width), id, label }
}))
const inks: Record<string,string> = { A: '#125da5', B: '#a74413', C: '#057665' }
// 通常の文字サイズで組版してからセル単位に縮小する。サブピクセルのフォント丸めを避ける。
function labelTransform(x: number, y: number, label: string) {
  const scale = Math.min(1 / 32, 0.067 / Math.max(1, label.length))
  return `translate(${x + 0.5} ${y + 0.51}) scale(${scale})`
}
function pointToCell(event: MouseEvent) {
  if (props.selected === undefined) return
  const svg = event.currentTarget as SVGSVGElement
  const matrix = svg.getScreenCTM()
  if (!matrix) return
  const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
  const x = Math.floor(local.x), y = Math.floor(local.y)
  if (x >= 0 && x < props.scene.width && y >= 0 && y < props.scene.height) emit('select', y * props.scene.width + x)
}
function navigate(event: KeyboardEvent) {
  if (props.selected === undefined) return
  const { width, height } = props.scene
  const x = props.selected % width, y = Math.floor(props.selected / width)
  const offsets: Record<string,[number, number]> = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }
  const move = offsets[event.key]
  if (!move) return
  event.preventDefault()
  event.stopPropagation()
  const nextX = Math.max(0, Math.min(width - 1, x + move[0]))
  const nextY = Math.max(0, Math.min(height - 1, y + move[1]))
  emit('select', nextY * width + nextX)
}
</script>

<template>
  <figure class="face-grid">
    <figcaption>{{ label }}</figcaption>
    <svg :viewBox="`0 0 ${scene.width} ${scene.height}`" :aria-label="label + (selected === undefined ? '' : '。クリックまたは矢印キーで画素を選択')"
      :role="selected === undefined ? 'img' : 'group'" :tabindex="selected === undefined ? undefined : 0"
      @click="pointToCell" @keydown="navigate">
      <g v-for="(cell,i) in cells" :key="i">
        <rect :x="cell.x" :y="cell.y" width="1" height="1" :fill="mode === 'color' ? faceColor(cell.id) : '#fff'" stroke="#b9cbd5" stroke-width=".025" />
        <text v-if="mode !== 'scene'" :transform="labelTransform(cell.x, cell.y, cell.label)" class="id">{{ cell.label }}</text>
        <circle v-else :cx="cell.x+.5" :cy="cell.y+.5" r=".045" fill="#899ba9" />
        <path v-if="differences?.[i]" :d="`M ${cell.x+.08} ${cell.y+.92} l .84 -.84`" stroke="#87164c" stroke-width=".13" />
      </g>
      <template v-if="mode === 'scene'">
        <polygon v-for="face in scene.triangles" :key="face.id" :points="face.vertices.map(v => v.slice(0,2).join(',')).join(' ')"
          fill="none" :stroke="inks[face.id] ?? '#4c4760'" stroke-width=".065"
          :stroke-dasharray="face.id === 'B' ? '.23 .095' : face.id === 'C' ? '.08 .07' : undefined" />
      </template>
      <g v-if="selected !== undefined && cells[selected]">
        <rect :x="cells[selected].x+.055" :y="cells[selected].y+.055" width=".89" height=".89" fill="none" stroke="#821552" stroke-width=".105" />
        <text v-if="mode === 'scene'" :transform="labelTransform(cells[selected].x, cells[selected].y, 'P')" class="id marker">P</text>
      </g>
    </svg>
  </figure>
</template>

<style scoped>
.face-grid { margin:0; min-width:0; }
.face-grid figcaption { margin:0 0 .45rem; line-height:1.4; font-weight:700; color:#183950; }
.face-grid svg { display:block; width:100%; height:auto; background:white; border:1px solid #9eb5c4; }
.face-grid svg[tabindex] { cursor:crosshair; touch-action:manipulation; }
.face-grid svg:focus-visible { outline:3px solid #005bac; outline-offset:2px; }
.face-grid .id { font-size:17px; font-family:ui-monospace, monospace; font-weight:650; dominant-baseline:middle; text-anchor:middle; fill:#163447; }
.face-grid .marker { fill:#821552; paint-order:stroke; stroke:white; stroke-width:2px; }
</style>
