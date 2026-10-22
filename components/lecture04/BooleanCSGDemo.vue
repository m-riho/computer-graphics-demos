<script setup lang="ts">
import { computed, ref } from 'vue'
import MeshView from './MeshView.vue'
import { booleanCSG, createPrimitive, type BooleanOperation, type PrimitiveKind } from '../../packages/cg-algorithms/src/csg'
const aKind=ref<PrimitiveKind>('cube'),bKind=ref<PrimitiveKind>('cylinder'),operation=ref<BooleanOperation>('a-b')
const x=ref(0),y=ref(0),z=ref(0),scale=ref(.7),wire=ref(false),node=ref<'result'|'a'|'b'>('result')
const inputView=ref<InstanceType<typeof MeshView>>(),resultView=ref<InstanceType<typeof MeshView>>()
const primitives:PrimitiveKind[]=['cube','sphere','cylinder']
const operations:{value:BooleanOperation;label:string}[]=[{value:'union',label:'Union ∪'},{value:'intersection',label:'Intersection ∩'},{value:'a-b',label:'A − B'},{value:'b-a',label:'B − A'}]
const state=computed(()=>{try{
  const a=createPrimitive(aKind.value),b=createPrimitive(bKind.value,{position:[x.value,y.value,z.value],scale:scale.value})
  return {a,b,result:booleanCSG(a,b,operation.value),error:''}
}catch(error){const empty={vertices:[],faces:[]};return {a:empty,b:empty,result:empty,error:String(error)}}})
const selected=computed(()=>node.value==='a'?state.value.a:node.value==='b'?state.value.b:state.value.result)
function reset(){aKind.value='cube';bKind.value='cylinder';operation.value='a-b';x.value=0;y.value=0;z.value=0;scale.value=.7;wire.value=false;node.value='result';inputView.value?.resetView();resultView.value?.resetView()}
</script>
<template>
  <section class="operation-demo" aria-label="Boolean CSG demo">
    <div class="toolbar"><label>A <select v-model="aKind" aria-label="Primitive A"><option v-for="kind in primitives" :key="kind">{{kind}}</option></select></label><label>B <select v-model="bKind" aria-label="Primitive B"><option v-for="kind in primitives" :key="kind">{{kind}}</option></select></label><button v-for="op in operations" :key="op.value" :aria-pressed="operation===op.value" @click="operation=op.value;node='result'">{{op.label}}</button><button @click="reset">Reset</button></div>
    <div class="toolbar sliders"><label v-for="axis in ['x','y','z']" :key="axis">B {{axis}}<template v-if="axis==='x'"><input v-model.number="x" aria-label="B position X" type="range" min="-2.5" max="2.5" step=".1"/><output>{{x.toFixed(1)}}</output></template><template v-else-if="axis==='y'"><input v-model.number="y" aria-label="B position Y" type="range" min="-2.5" max="2.5" step=".1"/><output>{{y.toFixed(1)}}</output></template><template v-else><input v-model.number="z" aria-label="B position Z" type="range" min="-2.5" max="2.5" step=".1"/><output>{{z.toFixed(1)}}</output></template></label><label>B scale <input v-model.number="scale" aria-label="B scale" type="range" min=".3" max="1.5" step=".1"/><output>{{scale.toFixed(1)}}</output></label></div>
    <div class="views"><div><strong>入力：A 面 / B 破線</strong><MeshView ref="inputView" :mesh="state.a" :original-mesh="state.b" :wireframe="false" :height="205"/></div><div><strong>{{node==='result'?'演算結果':`部分形状 ${node.toUpperCase()}`}} · V {{selected.vertices.length}} / F {{selected.faces.length}}</strong><MeshView ref="resultView" :mesh="selected" :wireframe="wire" :height="205"/><span v-if="!selected.faces.length" class="empty">空集合 ∅（体積を持つ結果なし）</span></div></div>
    <div class="toolbar tree" aria-label="CSG tree"><span>CSG tree</span><button :aria-pressed="node==='a'" @click="node='a'">A: {{aKind}}</button><span>↘</span><button :aria-pressed="node==='result'" @click="node='result'">{{operations.find(o=>o.value===operation)?.label}}</button><span>↗</span><button :aria-pressed="node==='b'" @click="node='b'">B: {{bKind}}</button><label><input v-model="wire" type="checkbox"/> Wireframe</label></div>
    <p v-if="state.error" role="alert">{{state.error}}</p><p v-else>観察：Bを動かすと、残る面・切断面は？ Cube − Cylinder → 穴のある部品 → Bevel。</p>
    <p class="note">教育用BSP：面を平面で分割。曲面は多面体近似。接触付近には浮動小数点の限界があり、CADの厳密演算とは異なる。</p>
  </section>
</template>
<style scoped>
.operation-demo{font-size:14px;line-height:1.35;border:1px solid #cbd5e1;border-radius:10px;padding:10px;background:#fff;color:#16324f}.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:7px}.toolbar label{display:flex;align-items:center;gap:4px}button,select{font:inherit;border:1px solid #94a3b8;border-radius:5px;background:#f8fafc;padding:3px 8px}button[aria-pressed=true]{background:#dbeafe;border-color:#2563eb}.sliders{margin:7px 0}.sliders input{width:105px}.sliders output{min-width:28px;font-variant-numeric:tabular-nums}.views{display:grid;grid-template-columns:1fr 1fr;gap:12px}.views>div{min-width:0;position:relative}.views strong{font-size:14px}.tree{margin-top:5px}.tree button{font-size:12px}.empty{position:absolute;top:110px;left:25%;background:white;padding:5px}.operation-demo p{margin:5px 0 0}.note{font-size:12px;color:#475569}@media(max-width:600px){.views{grid-template-columns:1fr}.sliders input{width:85px}}
</style>
