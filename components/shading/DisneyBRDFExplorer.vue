<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ShadingScene from './ShadingScene.vue'
import { linearColor } from '../../packages/cg-algorithms/src/shading-geometry.ts'
defineProps<{topic?:string}>()
const initial=()=>({metallic:0,roughness:.5,specular:.5,specularTint:0,anisotropic:0,subsurface:0,sheen:0,sheenTint:.5,clearcoat:0,clearcoatGloss:1})
type Parameter=keyof ReturnType<typeof initial>
const material=reactive(initial()),red=ref(201),green=ref(121),blue=ref(67)
const comparison=ref(true),teacher=ref(false),wireframe=ref(false)
const objectPitch=ref(0),objectYaw=ref(0),environmentRotation=ref(0),viewAngle=ref(65),exposure=ref(0)
const hex=computed(()=> '#'+[red.value,green.value,blue.value].map(v=>Math.max(0,Math.min(255,Math.round(Number(v)||0))).toString(16).padStart(2,'0')).join(''))
const reference=ref({...initial(),baseColor:'#c97943'})
const groups:{title:string;controls:{key:Parameter;label:string;role:string}[]}[]=[
 {title:'材質の土台',controls:[
  {key:'metallic',label:'Metallic',role:'0は非金属、1は金属。金属では鏡面反射がBase Colorに染まる。'},
  {key:'roughness',label:'Roughness',role:'主な反射の広がり。大きいほど映り込みがぼける。'},
  {key:'subsurface',label:'Subsurface',role:'拡散反射を表面下散乱風の形にする。透過や内部輸送は計算しない。'}]},
 {title:'主な鏡面反射',controls:[
  {key:'specular',label:'Specular',role:'非金属の正面反射率。0.5は4%。反射の広さは変えない。'},
  {key:'specularTint',label:'Specular Tint',role:'非金属の鏡面反射に、Base Colorの色味を加える。'},
  {key:'anisotropic',label:'Anisotropic',role:'方向による粗さの違い。ハイライトが一方向に伸びる。'}]},
 {title:'布の縁の反射',controls:[
  {key:'sheen',label:'Sheen',role:'布のように、かすめる角度で見える反射を補う。'},
  {key:'sheenTint',label:'Sheen Tint',role:'Sheenを無彩色からBase Color由来の色味へ変える。'}]},
 {title:'透明な上塗りの反射',controls:[
  {key:'clearcoat',label:'Clearcoat',role:'基材とは別のコート反射を重ねる。'},
  {key:'clearcoatGloss',label:'Clearcoat Gloss',role:'値が大きいほどコートの光沢が鋭い。Roughnessとは逆向き。'}]},
]
const common=computed(()=>({objectPitch:objectPitch.value,objectYaw:objectYaw.value,viewAngle:viewAngle.value,environmentRotation:environmentRotation.value,exposure:exposure.value,wireframe:wireframe.value}))
const currentSettings=computed(()=>({...material,baseColor:hex.value,...common.value}))
const referenceSettings=computed(()=>({...reference.value,...common.value}))
function setHex(value:string){red.value=parseInt(value.slice(1,3),16);green.value=parseInt(value.slice(3,5),16);blue.value=parseInt(value.slice(5,7),16)}
function rgbChanged(){red.value=Math.max(0,Math.min(255,Math.round(Number(red.value)||0)));green.value=Math.max(0,Math.min(255,Math.round(Number(green.value)||0)));blue.value=Math.max(0,Math.min(255,Math.round(Number(blue.value)||0)))}
function rotate(dx:number,dy:number){objectYaw.value=((objectYaw.value-dx*.6+180)%360+360)%360-180;objectPitch.value=Math.max(-180,Math.min(180,objectPitch.value-dy*.6))}
function resetRotation(){objectPitch.value=0;objectYaw.value=0}
function reset(){Object.assign(material,initial());setHex('#c97943');reference.value={...initial(),baseColor:'#c97943'};comparison.value=true;wireframe.value=false;environmentRotation.value=0;viewAngle.value=65;exposure.value=0;resetRotation()}
function preset(kind:string){
 Object.assign(material,initial())
 if(kind==='plastic'){setHex('#b82b25');material.roughness=.2}
 if(kind==='metal'){setHex('#d5a050');material.metallic=1;material.roughness=.3;material.anisotropic=.8}
 if(kind==='cloth'){setHex('#315c9c');material.roughness=.7;material.sheen=1}
 if(kind==='coat'){setHex('#b82b25');material.roughness=.5;material.clearcoat=1;material.clearcoatGloss=.85}
 if(kind==='soft'){setHex('#dfa171');material.roughness=.6;material.subsurface=1}
}
const inactive=computed(()=>{
 const notes:string[]=[]
 if(material.metallic===1)notes.push('Metallic=1：Subsurface・Specular・Specular Tint・Sheenは結果に寄与しません。')
 else if(material.sheen===0)notes.push('Sheen=0：Sheen Tintを変更しても結果は変わりません。')
 if(material.clearcoat===0)notes.push('Clearcoat=0：Clearcoat Glossを変更しても結果は変わりません。')
 return notes
})
const linear=computed(()=>linearColor(hex.value).map(v=>v.toFixed(3)).join(' / '))
</script>

<template>
<section class="shading-explorer disney-explorer">
 <header><div><h2>Disney Principled BRDF</h2><p>11個の入力から、材質の見え方を探る</p></div><button type="button" :aria-pressed="teacher" @click="teacher=!teacher">教員モード</button></header>
 <div class="disney-buttons"><button v-for="item in [['plastic','樹脂'],['metal','金属'],['cloth','布'],['coat','コート塗装'],['soft','散乱風の拡散']]" :key="item[0]" type="button" @click="preset(item[0]!)">{{ item[1] }}</button><button type="button" @click="reset">初期状態に戻す</button></div>
 <div class="disney-layout">
  <div class="disney-visual">
   <div class="disney-views" :class="{single:!comparison}">
    <figure v-if="comparison"><figcaption>比較用の材質</figcaption><ShadingScene model="disney-brdf" :settings="referenceSettings" rotatable @rotate="rotate" @reset-rotation="resetRotation" /></figure>
    <figure><figcaption>調整中の材質</figcaption><ShadingScene model="disney-brdf" :settings="currentSettings" rotatable @rotate="rotate" @reset-rotation="resetRotation" /></figure>
   </div>
   <p class="disney-caption">ドラッグ・タッチ・矢印キーで回転。両側の形・照明・視点・露出は同じです。</p>
   <div class="disney-buttons"><label><input v-model="comparison" type="checkbox" />比較表示</label><button type="button" @click="reference={...material,baseColor:hex}">現在の材質を比較用に保存</button></div>
   <div class="disney-stats"><span>Base Color（sRGB）<b>{{ red }} / {{ green }} / {{ blue }}</b></span><span>線形RGB<b>{{ linear }}</b></span><span>非金属・Tint=0での正面反射率<b>{{ (8*material.specular).toFixed(1) }}%</b></span></div>
   <p v-for="note in inactive" :key="note" class="disney-note">{{ note }}</p>
   <details :open="teacher"><summary>観察のヒント</summary><p>「金属」でAnisotropic、「布」でSheenとSheen Tint、「コート塗装」でClearcoatとGlossを動かします。見比べたい状態を保存してから、一つの値だけを変えてください。</p></details>
   <details><summary>照明・視点・向き</summary>
    <label>照明の回転：{{ environmentRotation }}°<input v-model.number="environmentRotation" aria-label="照明の回転" type="range" min="0" max="360" step="1" /></label>
    <label>視点の天頂角：{{ viewAngle }}°<input v-model.number="viewAngle" aria-label="視点の天頂角" type="range" min="5" max="85" step="1" /></label>
    <label>表示露出：{{ exposure }} EV<input v-model.number="exposure" aria-label="表示露出" type="range" min="-3" max="3" step=".25" /></label>
    <label><input v-model="wireframe" type="checkbox" />回転確認用の格子を表示</label><button type="button" @click="resetRotation">向きを戻す</button>
   </details>
  </div>
  <div class="disney-controls">
   <fieldset><legend>Base Color（基調色）</legend>
    <input type="color" :value="hex" aria-label="Base Color" @input="setHex(($event.target as HTMLInputElement).value)" />
    <div class="disney-rgb"><label>Red<input v-model.number="red" aria-label="Red" type="number" min="0" max="255" step="1" @change="rgbChanged" /></label><label>Green<input v-model.number="green" aria-label="Green" type="number" min="0" max="255" step="1" @change="rgbChanged" /></label><label>Blue<input v-model.number="blue" aria-label="Blue" type="number" min="0" max="255" step="1" @change="rgbChanged" /></label></div>
    <small>sRGBの0〜255を入力。計算前に線形RGBへ変換します。</small>
   </fieldset>
   <fieldset v-for="group in groups" :key="group.title"><legend>{{ group.title }}</legend>
    <label v-for="control in group.controls" :key="control.key" class="disney-control">
     <span>{{ control.label }}<strong>{{ material[control.key].toFixed(2) }}</strong></span>
     <input v-model.number="material[control.key]" :aria-label="control.label" type="range" min="0" max="1" step=".01" />
     <small>{{ control.role }}</small>
    </label>
   </fieldset>
  </div>
 </div>
 <details class="disney-method" :open="teacher"><summary>このデモのモデル・計算方法</summary>
  <p>Burley（2012）のDisney BRDF。拡散、異方性GGXの主な鏡面反射、Sheen、GTR1のClearcoatを合成します。Smith Gには2012年論文の粗さ再マップを使います。Subsurfaceは局所的な近似で、透過・内部散乱・GIは扱いません。</p>
  <p>自作の仮想スタジオ環境を、反射成分ごとに64方向ずつ標本化します。見やすさのため表示露出とReinhardトーンマッピングを使い、最後にsRGBへ変換します。少数サンプルなので、粗い材質で小さな模様が見える場合があります。粗さ0は分布幅0.001で近似します。</p>
  <p>球は対称形なので、等方的な材質では回転しても同じに見えます。Anisotropicや格子を使うと向きを確認できます。Clearcoatは原モデルの加算近似で、厳密な多層の光輸送ではありません。</p>
  <p>出典：<a href="https://disneyanimation.com/publications/physically-based-shading-at-disney/" target="_blank" rel="noopener">Burley, Physically-Based Shading at Disney（2012）</a>。図・照明環境・実装は本教材で作成。</p>
 </details>
</section>
</template>

<style scoped>
.disney-explorer{color:#153854;font:17px/1.55 'Hiragino Sans',sans-serif;}
.disney-explorer *{box-sizing:border-box;}
.disney-explorer h2{font-size:1.5em;font-weight:bold;margin:0;}
.disney-explorer p{margin:.5em 0;}
.disney-explorer header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.disney-explorer header p,.disney-caption{color:#50677d;font-size:.88em;}
.disney-buttons{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:14px 0;}
.disney-explorer button{font:inherit;color:#14466d;background:#f1f7ff;border:1px solid #9bb5cc;border-radius:6px;padding:7px 12px;cursor:pointer;}
.disney-explorer button[aria-pressed=true]{color:white;background:#005bac;}
.disney-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:22px;align-items:start;}
.disney-visual{position:sticky;top:12px;min-width:0;}
.disney-views{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
.disney-views.single{grid-template-columns:1fr;}
.disney-explorer figure{margin:0;min-width:0;}
.disney-explorer figcaption{font-weight:bold;margin-bottom:7px;}
.disney-controls fieldset{min-width:0;border:1px solid #cbdbea;border-radius:8px;margin:0 0 16px;padding:12px 14px;}
.disney-controls legend{font-weight:bold;color:#005bac;padding:0 6px;}
.disney-control{display:block;margin-bottom:16px;}
.disney-control:last-child{margin-bottom:2px;}
.disney-control span{display:flex;justify-content:space-between;gap:8px;}
.disney-control strong{color:#005bac;}
.disney-explorer input[type=range]{width:100%;display:block;accent-color:#005bac;margin:10px 0;}
.disney-explorer input[type=color]{width:100%;height:40px;padding:2px;background:white;border:1px solid #9bb5cc;border-radius:4px;}
.disney-rgb{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0;}
.disney-rgb input{display:block;width:100%;padding:6px;font:inherit;color:inherit;border:1px solid #9bb5cc;border-radius:4px;}
.disney-explorer small{display:block;color:#50677d;font-size:.82em;}
.disney-stats{display:grid;gap:10px;background:#edf4fc;padding:14px;border-radius:7px;}
.disney-stats span{display:block;font-size:.9em;}
.disney-stats b{display:block;color:#005bac;}
.disney-note{border-left:3px solid #bd790e;padding-left:10px;font-size:.86em;}
.disney-explorer details{border-top:1px solid #cbdbea;padding-top:10px;margin-top:12px;}
.disney-explorer details label{display:block;margin:12px 0;}
.disney-method{font-size:.9em;}
.disney-explorer :is(button,input,summary):focus-visible{outline:3px solid #db8400;outline-offset:3px;}
@media(max-width:900px){.disney-layout{grid-template-columns:1fr;}.disney-visual{position:static;}.disney-explorer{font-size:16px;}}
@media(max-width:450px){.disney-views{grid-template-columns:1fr;}}
</style>
