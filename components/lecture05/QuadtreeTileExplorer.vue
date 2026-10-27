<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { buildQuadtree, flattenTree, tilePreset, type SpatialNode, type TileName } from '../../packages/cg-algorithms/src/nature-spatial'
import './lecture05.css'
const rootElement=ref<HTMLElement>()
let visibility:IntersectionObserver|undefined
const size=ref(8),preset=ref<TileName>('blocks'),seed=ref(42),grid=ref(tilePreset(8,'blocks')),processed=ref(999),selected=ref('r'),playing=ref(false),treePane=ref<HTMLDivElement>(),reduced=ref(false)
const presets:{value:TileName;label:string}[]=[{value:'blocks',label:'Large Blocks'},{value:'circle',label:'Circle'},{value:'checkerboard',label:'Checkerboard'},{value:'random',label:'Random'},{value:'clear',label:'Clear'}]
const root=computed(()=>buildQuadtree(grid.value)),nodes=computed(()=>flattenTree(root.value)),index=computed(()=>new Map(nodes.value.map((n,i)=>[n.id,i])))
const complete=computed(()=>processed.value>=nodes.value.length)
const visible=computed(()=>nodes.value.filter(n=>n.id==='r'||(index.value.get(n.id.slice(0,n.id.lastIndexOf('.')))??Infinity)<processed.value))
const leaves=computed(()=>visible.value.filter(n=>!n.children.length||(index.value.get(n.id)??0)>=processed.value))
const active=computed(()=>nodes.value.find(n=>n.id===selected.value)??root.value)
const internal=computed(()=>visible.value.filter(n=>n.children.length&&(index.value.get(n.id)??0)<processed.value).length)
const knownLeaves=computed(()=>visible.value.filter(n=>!n.children.length&&(index.value.get(n.id)??0)<processed.value).length)
const pending=computed(()=>visible.value.length-internal.value-knownLeaves.value)
let timer:ReturnType<typeof setInterval>|undefined
function stop(){playing.value=false;if(timer)clearInterval(timer);timer=undefined}
function load(){stop();grid.value=tilePreset(size.value,preset.value,Number(seed.value)||0);processed.value=0;selected.value='r'}
function choose(id:string){selected.value=id;const row=visible.value.findIndex(n=>n.id===id);if(treePane.value&&row>=0)treePane.value.scrollTop=Math.max(0,row*28-90)}
function step(){if(complete.value)processed.value=0;const next=nodes.value[processed.value];processed.value++;if(next)choose(next.id);if(complete.value)stop()}
function build(){stop();processed.value=nodes.value.length;selected.value='r'}
function auto(){if(playing.value){stop();return}if(reduced.value)return;if(complete.value)processed.value=0;playing.value=true;timer=setInterval(step,550)}
function edit(x:number,y:number){stop();const next=grid.value.map(row=>[...row]);next[y][x]=next[y][x]?0:1;grid.value=next;processed.value=0;selected.value='r'}
function reset(){stop();size.value=8;preset.value='blocks';seed.value=42;grid.value=tilePreset(8,'blocks');processed.value=999;selected.value='r';resetView()}
function resetView(){selected.value='r';if(treePane.value)treePane.value.scrollTop=0}
function value(n:SpatialNode){return (index.value.get(n.id)??0)>=processed.value?'?':n.value===null?'分割':String(n.value)}
function fill(n:SpatialNode){return value(n)==='?'?'#e6eaf0':n.value===1?'#255a87':n.value===0?'#fff':'#dbeafe'}
function name(n:SpatialNode){return n.id==='r'?'Root':['NW','NE','SW','SE'][Number(n.id.at(-1))]}
function parentRow(n:SpatialNode){return visible.value.findIndex(v=>v.id===n.id.slice(0,n.id.lastIndexOf('.')))}
watch([size,preset],load,{flush:'sync'})
let media:MediaQueryList|undefined
function motion(){reduced.value=media?.matches??false;if(reduced.value)stop()}
onMounted(()=>{visibility=new IntersectionObserver(entries=>{if(entries.some(e=>!e.isIntersecting))stop()});if(rootElement.value)visibility.observe(rootElement.value);media=window.matchMedia('(prefers-reduced-motion: reduce)');motion();media.addEventListener('change',motion)})
onBeforeUnmount(()=>{visibility?.disconnect();stop();media?.removeEventListener('change',motion)})
</script>
<template><section ref="rootElement" class="l5d quadtree-demo">
<div class="l5d-controls"><label>Grid <select v-model.number="size"><option :value="8">8 × 8</option><option :value="16">16 × 16</option></select></label><select v-model="preset" aria-label="Tile preset"><option v-for="p in presets" :value="p.value">{{ p.label }}</option></select><label v-if="preset==='random'">Seed <input v-model.number="seed" type="number" @change="load"/></label><button @click="build">Build</button><button @click="step">Step</button><button :disabled="reduced" :aria-pressed="playing" @click="auto">{{ playing?'Pause':'Auto' }}</button><button @click="reset">Reset</button><button @click="resetView">Reset View</button></div>
<div class="quad-panes"><div><strong>Original Tile Grid</strong><svg viewBox="0 0 256 256" class="tile-grid" aria-label="編集できる二値タイル"><template v-for="(row,y) in grid" :key="y"><rect v-for="(v,x) in row" :key="x" :x="x*256/size" :y="y*256/size" :width="256/size" :height="256/size" :fill="v?'#255a87':'white'" stroke="#a5b5c6" tabindex="0" role="button" :aria-label="`タイル ${x},${y}: ${v}。クリックで反転`" @click="edit(x,y)" @keydown.enter.prevent="edit(x,y)" @keydown.space.prevent="edit(x,y)"/></template><rect :x="active.x*256/size+2" :y="active.y*256/size+2" :width="active.size*256/size-4" :height="active.size*256/size-4" fill="none" stroke="#e9a308" stroke-width="4" stroke-dasharray="7 4" pointer-events="none"/></svg><small>クリック：0 ↔ 1</small></div>
<div><strong>Spatial Subdivision</strong><svg viewBox="0 0 256 256" class="tile-grid" aria-label="領域を選ぶと木の対応ノードを強調"><g v-for="n in leaves" :key="n.id" tabindex="0" role="button" :aria-label="`${n.id} ${n.size}×${n.size} value ${value(n)}`" @click="choose(n.id)" @keydown.enter.prevent="choose(n.id)" @keydown.space.prevent="choose(n.id)"><rect :x="n.x*256/size+1" :y="n.y*256/size+1" :width="n.size*256/size-2" :height="n.size*256/size-2" :fill="fill(n)" stroke="#334155"/><text v-if="n.size*256/size>=28" :x="(n.x+n.size/2)*256/size" :y="(n.y+n.size/2)*256/size+6" text-anchor="middle" :fill="n.value===1&&value(n)!=='?'?'white':'#334155'" style="font-size:19px">{{ value(n) }}</text></g><rect :x="active.x*256/size+2" :y="active.y*256/size+2" :width="active.size*256/size-4" :height="active.size*256/size-4" fill="none" stroke="#e9a308" stroke-width="4" stroke-dasharray="7 4" pointer-events="none"/></svg><small>0: 空 / 1: 占有 / ?: 未判定</small></div>
<div><strong>Quadtree（選択可）</strong><div ref="treePane" class="tree-pane"><svg :viewBox="`0 0 320 ${Math.max(256,visible.length*28)}`" :style="{height:`${Math.max(256,visible.length*28)}px`}" aria-label="四分木。各行は実際のノード。左上、右上、左下、右下の順序。"><g v-for="(n,row) in visible" :key="n.id"><path v-if="n.id!=='r'" :d="`M ${12+(n.depth-1)*22} ${parentRow(n)*28+14} V ${row*28+14} H ${12+n.depth*22}`" fill="none" stroke="#8899ac"/><g role="button" tabindex="0" :aria-label="`${n.id} ${name(n)} ${value(n)}`" @click="choose(n.id)" @keydown.enter.prevent="choose(n.id)" @keydown.space.prevent="choose(n.id)"><rect :x="n.depth*22+2" :y="row*28+2" :width="310-n.depth*22" height="24" rx="4" :fill="selected===n.id?'#fff0bd':'#f3f6fa'" :stroke="selected===n.id?'#aa6900':'none'"/><text :x="n.depth*22+9" :y="row*28+20" fill="#26394e" style="font-size:17px">{{ name(n) }} {{ n.size }}² : {{ value(n) }}</text></g></g></svg></div><small>子順序：NW → NE → SW → SE</small></div></div>
<div class="l5d-readout">Cells {{ size*size }} · Internal {{ internal }} · Leaf {{ knownLeaves }} · Depth {{ Math.max(...visible.map(n=>n.depth)) }} · 未判定 {{ pending }}</div>
<p class="l5d-note">{{ complete?'構築完了：Checkerboardではノード数がcell数を上回る。必ず省メモリとは限らない。':`Step：一様判定 → 混在なら4分割 → 再帰。選択 ${active.id} (${active.size}×${active.size})` }}<span v-if="reduced"> 動きを抑える設定：Stepで操作。</span></p>
</section></template>
<style scoped>.quad-panes{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:12px}.quad-panes>div{min-width:0}.quad-panes strong{display:block;font-size:17px;margin-bottom:3px}.tile-grid{display:block;width:100%;height:245px;background:#f8fafc}.tile-grid [role=button]{cursor:pointer}.quad-panes small{display:block;font-size:14px}.tree-pane{height:245px;overflow:auto;background:#f8fafc;border:1px solid #cbd5e1}.tree-pane svg{width:100%;min-width:270px;display:block}.tree-pane [role=button]{cursor:pointer}.quadtree-demo input{width:70px}.quadtree-demo .l5d-note{font-size:16px!important}.quad-panes [role=button]:focus-visible{outline:3px solid #d38a00}@media(max-width:700px){.quad-panes{grid-template-columns:1fr}.tile-grid{height:260px}}</style>
