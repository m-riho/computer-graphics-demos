<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import ShadingScene from './ShadingScene.vue';
import AdvancedPlot from './AdvancedPlot.vue';
import { shadingCatalog } from './catalog';
import { lambertBrdf,empiricalLobe,ndf,sampleNdf,projectedNdfIntegral,fresnelDielectric,schlick,cookTorrance,roughnessToAlpha,pbrParameters,srgbHexToLinear,repartitionIrradiance,renderingSum,type NdfKind,type LobeKind } from '../../packages/cg-algorithms/src/shading-advanced';
const props=defineProps<{topic:string}>();
const teacher=ref(false);
const slideReference=computed(()=>shadingCatalog.find(d=>d.id===props.topic)?.slideReference??'');
const initial=()=>({light:35,view:-20,exponent:20,lobe:'lambert' as LobeKind,fixed:'light',contribution:false,rho:.6,alpha:.4,ndf:'ggx' as NdfKind,samples:48,distribution:'ndf',angle:45,etaI:1,etaT:1.5,fresnelMode:'both',graph:true,roughness:.5,f0:.04,factor:'brdf',metallic:0,ior:1.5,color:'#c99155',glass:false,count:3,brdfMode:'constant',constant:.2});
const state=reactive(initial());
const irradiances=ref([1,.5,.25]);
const directions=ref([-50,0,50]);
function reset(){Object.assign(state,initial());irradiances.value=[1,.5,.25];directions.value=[-50,0,50];}
watch(()=>props.topic,reset);
const meta=computed(()=>({
 'brdf-lobe':{title:'BRDF Lobe Explorer',goal:'入射方向と出射方向を分け、反射特性と光の寄与を区別する。',predict:'Lambert面で視点だけを動かすと、BRDFは変わるだろうか？',observe:'固定する方向を切り替え、ローブの山と出射方向の関係を観察しよう。',formula:'Lambert: fᵣ = ρ / π　　ΔLₒ = fᵣ Lᵢ cos θᵢ Δωᵢ',explain:'Lambertのローブはρ/π [sr⁻¹]。Phongはmax(R·V,0)ⁿ、Blinn–Phongはmax(N·H,0)ᵐという無次元の経験的ローブを表示する。後者は正規化されたBRDFではなく、エネルギー保存も保証しない。'},
 'microfacet-ndf':{title:'Microfacet / NDF Explorer',goal:'粗さαと微小面法線の広がり、投影面積での正規化を理解する。',predict:'粗さを小さくするとDのピークが1を超えてもよいだろうか？',observe:'GGXとBeckmannの裾、サンプル数を増やしたときの分布の安定性を比べよう。',formula:'∫Ω⁺ D(m) (N·m) dωₘ = 1　　p(m) = D(m) cos θₘ',explain:'法線は一様乱数ではなく、投影NDF p(m)=D(m)cosθₘの逆累積分布から生成する。角度ヒストグラムの密度は2πD(θ)cosθ sinθ [rad⁻¹]。図の小片は独立した法線の模式図で、連続した実表面の形状を復元したものではない。'},
 'fresnel':{title:'Fresnel Explorer',goal:'入射角、屈折率、反射率の関係を厳密式と近似式で比べる。',predict:'空気からガラスへ正面で入る光は、何%反射するだろうか？',observe:'60°以上で2曲線の差を調べ、ガラス→空気では臨界角を越えてみよう。',formula:'F = (Rₛ + Rₚ)/2　　F₀ = ((ηᵢ−ηₜ)/(ηᵢ+ηₜ))²　　FSchlick = F₀+(1−F₀)(1−cosθ)⁵',explain:'吸収しない誘電体・無偏光の境界を扱う。Snellの法則ηᵢsinθᵢ=ηₜsinθₜで透過方向を求め、sinθₜ≥1なら全反射。透過の表示1−Fはパワー比であり、透過放射輝度の比とは異なる。Schlick単体は全反射を表せないため、全反射判定を優先する。'},
 'cook-torrance':{title:'Cook–Torrance DFG Explorer',goal:'法線分布D、反射率F、遮蔽Gが鏡面BRDFを作る仕組みを理解する。',predict:'Dが大きくても、FやGが小さければ反射は強いだろうか？',observe:'視線を表面すれすれに動かし、Gの減少と分母の変化を併せて確認しよう。',formula:'fₛ = DFG / (4(N·L)(N·V))　　G = 1/(1+Λ(L)+Λ(V))',explain:'Height-correlated Smithを使用。GGXのΛは厳密式、BeckmannのΛは有理関数近似。Dは法線分布密度 [sr⁻¹]、FとGは無次元、最終BRDFは [sr⁻¹]。グラフごとに縦軸の尺度が変わる。単一散乱モデルのため微小面間の多重反射は省略する。'},
 'principled':{title:'Metallic / Roughness / IOR Explorer',goal:'材質入力と、反射色・ハイライト幅・拡散反射の対応を理解する。',predict:'Metallic=1のとき、IORだけを変えると反射色は変わるだろうか？',observe:'同じBase Colorのプラスチックと金属で、反射の色と粗さの影響を比べよう。',formula:'F₀ = (1−metallic)((IOR−1)/(IOR+1))² + metallic × BaseColor　　α = roughness²',explain:'BlenderのMetallic・Roughness・IORに対応する教育用の部分モデル。GGX鏡面と、(1−metallic)(1−F)で重み付けしたLambert拡散を組み合わせる。Base ColorをsRGBから線形RGBへ変換して計算し、表示でsRGBへ戻す。Principled BSDF全体の再現ではなく、コート・異方性・表面下散乱は含めない。'},
 'rendering-equation':{title:'Rendering Equation Explorer',goal:'複数の入射方向からの寄与を足し、出射放射輝度を求める。',predict:'全体の照度を保ったまま入射方向を増やすと、Lambert面の明るさは変わるだろうか？',observe:'方向数を変えてから、個々の照度やBRDFを変え、合計に効く量を調べよう。',formula:'Lₒ(ωₒ) = Σᵢ fᵣ(ωᵢ,ωₒ) ΔEᵢ　　ΔEᵢ = Lᵢ cosθᵢ Δωᵢ',explain:'この画面は各方向の放射照度ΔEᵢ [W/m²]を直接入力する。余弦と立体角は既にΔEᵢに含まれるため、さらに掛けない。方向数を変えると現在の総照度を等分して保つ。方向の異なる鏡面BRDFでは、総照度が同じでも視線方向への寄与は変わりうる。'},
} as Record<string,{title:string;goal:string;predict:string;observe:string;formula:string;explain:string}>)[props.topic]);
const f=(n:number,d=3)=>Number.isFinite(n)?n.toFixed(d):'—';
const cos=(a:number)=>Math.cos(a*Math.PI/180);
const point=(a:number,r=125,cx=260,cy=220)=>({x:cx+Math.sin(a*Math.PI/180)*r,y:cy-Math.cos(a*Math.PI/180)*r});
const alpha=computed(()=>props.topic==='microfacet-ndf'?state.alpha:roughnessToAlpha(state.roughness));
const sceneSettings=computed(()=>({lightAngle:Math.abs(state.light),lightAzimuth:state.light<0?180:0,viewAngle:Math.abs(state.view),viewAzimuth:state.view<0?180:0,roughness:state.roughness,alpha:alpha.value,f0:state.f0,ndf:state.ndf,metallic:state.metallic,ior:state.ior,baseColor:state.color,diffuseOn:props.topic==='principled'&&!state.glass,ambient:0,ks:1,intensity:2}));
const dfg=computed(()=>cookTorrance(state.light,state.view,alpha.value,state.f0,state.ndf));
const fresnel=computed(()=>fresnelDielectric(state.angle,state.etaI,state.etaT));
const schlickValue=computed(()=>fresnel.value.totalInternalReflection?1:state.etaI===state.etaT?0:schlick(cos(state.angle),fresnel.value.f0));
const selectedF=computed(()=>state.fresnelMode==='schlick'?schlickValue.value:fresnel.value.reflectance);
const material=computed(()=>pbrParameters(state.metallic,state.ior,srgbHexToLinear(state.color)));
const normals=computed(()=>Array.from({length:state.samples},(_,i)=>sampleNdf(state.ndf,state.alpha,(i+.5)/state.samples,(i*.618033988749895)%1)));
const integral=computed(()=>projectedNdfIntegral(state.ndf,state.alpha));
const lobeValue=computed(()=>state.lobe==='lambert'?lambertBrdf(state.rho):empiricalLobe(state.lobe,state.light,state.view,state.exponent));
const lobeScale=computed(()=>state.lobe==='lambert'?1/Math.PI:1);
const lobePath=computed(()=>Array.from({length:181},(_,i)=>{
 const a=i-90,li=state.fixed==='light'?state.light:a,vo=state.fixed==='light'?a:state.view;
 let v=state.lobe==='lambert'?lambertBrdf(state.rho):empiricalLobe(state.lobe,li,vo,state.exponent);
 if(state.contribution)v*=Math.max(0,cos(li));
 const p=point(a,160*v/lobeScale.value);return `${i?'L':'M'}${p.x},${p.y}`;
}).join(' '));
const curve=computed(()=>{
 if(props.topic==='fresnel'){
  const exact=Array.from({length:181},(_,i)=>fresnelDielectric(i/2,state.etaI,state.etaT).reflectance);
  const approx=Array.from({length:181},(_,i)=>{const r=fresnelDielectric(i/2,state.etaI,state.etaT);return r.totalInternalReflection?1:state.etaI===state.etaT?0:schlick(cos(i/2),r.f0);});
  return [...(state.fresnelMode!=='schlick'?[{name:'厳密式',color:'#2563eb',values:exact}]:[]),...(state.fresnelMode!=='exact'?[{name:'Schlick（全反射判定付き）',color:'#e05252',values:approx}]:[])];
 }
 if(props.topic==='microfacet-ndf'){
  const values=Array.from({length:181},(_,i)=>{const a=i/2;const d=ndf(state.ndf,cos(a),state.alpha);return state.distribution==='ndf'?d:2*Math.PI*d*cos(a)*Math.sin(a*Math.PI/180);});
  const series=[{name:state.distribution==='ndf'?'D(θ)':'角度密度 pθ(θ)',color:'#2563eb',values}];
  if(state.distribution==='samples'){
   const bins=Array(18).fill(0);for(const n of normals.value)bins[Math.min(17,Math.floor(Math.acos(n[1])*180/Math.PI/5))]++;
   series.push({name:'サンプル頻度（5°ビン）',color:'#d97706',values:Array.from({length:181},(_,i)=>bins[Math.min(17,Math.floor(i/10))]/state.samples/(5*Math.PI/180))});
  }return series;
 }
 const key=state.factor as 'D'|'F'|'G'|'brdf';
 return [{name:key==='brdf'?'最終 鏡面BRDF':key,color:'#2563eb',values:Array.from({length:179},(_,i)=>cookTorrance(state.light,i-89,alpha.value,state.f0,state.ndf)[key])}];
});
const contributions=computed(()=>directions.value.map((a,i)=>{
 const brdf=state.brdfMode==='constant'?state.constant:state.brdfMode==='lambert'?lambertBrdf(state.rho):cookTorrance(a,state.view,roughnessToAlpha(state.roughness),state.f0,'ggx').brdf;
 return {angle:a,irradiance:irradiances.value[i]??0,brdf,value:brdf*(irradiances.value[i]??0)};
}));
const total=computed(()=>renderingSum(contributions.value.map(c=>c.brdf),irradiances.value));
const totalE=computed(()=>irradiances.value.reduce((a,b)=>a+b,0));
function changeCount(){irradiances.value=repartitionIrradiance(irradiances.value,state.count);directions.value=Array.from({length:state.count},(_,i)=>state.count===1?0:-70+140*i/(state.count-1));}
function preset(name:string){
 reset();
 if(name==='narrow'){state.lobe='phong';state.exponent=80;}
 if(name==='wide'){state.lobe='blinn-phong';state.exponent=20;}
 if(name==='smooth')state.alpha=.12;
 if(name==='rough'){state.alpha=.75;state.roughness=.85;}
 if(name==='beckmann')state.ndf='beckmann';
 if(name==='water')state.etaT=1.333;
 if(name==='high-ior')state.etaT=2;
 if(name==='tir'){state.etaI=1.5;state.etaT=1;state.angle=50;}
 if(name==='grazing'){state.light=75;state.view=-75;}
 if(name==='metal'){state.metallic=1;state.roughness=.2;}
 if(name==='rough-metal'){state.metallic=1;state.roughness=.75;}
 if(name==='paint'){state.color='#d64d48';state.roughness=.3;}
 if(name==='glass'){state.glass=true;state.color='#e4f3ff';state.roughness=.06;}
 if(name==='equal'){irradiances.value=[1.75/3,1.75/3,1.75/3];}
}
const presets=computed(()=>({
 'brdf-lobe':[['lambert','Lambert'],['narrow','鋭いPhong'],['wide','広いBlinn–Phong']],
 'microfacet-ndf':[['smooth','滑らか α=0.12'],['rough','粗い α=0.75'],['beckmann','Beckmann']],
 'fresnel':[['glass','空気 → ガラス'],['water','空気 → 水'],['high-ior','空気 → IOR 2.0'],['tir','ガラス → 空気（全反射）']],
 'cook-torrance':[['default','標準 GGX'],['grazing','すれすれ入射'],['rough','粗い表面'],['beckmann','Beckmann']],
 'principled':[['plastic','プラスチック'],['metal','金属'],['rough-metal','粗い金属'],['paint','塗装面'],['glass','ガラス（反射のみ）']],
 'rendering-equation':[['lecture','講義の例：0.35'],['equal','総照度を均等配分']],
} as Record<string,string[][]>)[props.topic]??[]);
</script>

<template>
<section v-if="meta" class="shading-explorer advanced-explorer" :class="{'teacher-mode':teacher}">
 <header><div><p class="eyebrow">SHADING / BRDF / PBR</p><h2>{{meta.title}}</h2><p>{{meta.goal}}</p></div><button class="teacher" @click="teacher=!teacher" :aria-pressed="teacher">{{teacher?'学生自習モード':'教員実演モード'}}</button></header>
 <p v-if="!teacher" class="prediction"><strong>予測</strong> {{meta.predict}}</p>
 <div class="presets"><span>プリセット</span><button v-for="[id,label] in presets" :key="id" @click="preset(id)">{{label}}</button><button class="reset" @click="reset">初期状態に戻す</button></div>
 <div class="workspace">
 <aside class="controls" aria-label="操作パネル">
  <template v-if="topic==='brdf-lobe'">
   <label>反射モデル<select v-model="state.lobe"><option value="lambert">Lambert BRDF</option><option value="phong">Phong（経験的ローブ）</option><option value="blinn-phong">Blinn–Phong（経験的ローブ）</option></select></label>
   <label>固定する方向<select v-model="state.fixed"><option value="light">入射方向 L を固定（Vを走査）</option><option value="view">出射方向 V を固定（Lを走査）</option></select></label>
   <label>表示する量<select v-model="state.contribution"><option :value="false">BRDF / ローブ関数</option><option :value="true">反射光の寄与（Li Δω=1）</option></select></label>
   <label v-if="state.lobe!=='lambert'">鏡面指数 {{state.exponent}}<input v-model.number="state.exponent" type="range" min="1" max="150" step="1"/></label>
   <label v-else>反射率 ρ {{f(state.rho,2)}}<input v-model.number="state.rho" type="range" min="0" max="1" step=".01"/></label>
  </template>
  <template v-if="['brdf-lobe','cook-torrance','principled'].includes(topic)">
   <label>光源方向 θL {{state.light}}°<input v-model.number="state.light" type="range" min="-89" max="89" step="1"/></label>
   <label>視点方向 θV {{state.view}}°<input v-model.number="state.view" type="range" min="-89" max="89" step="1"/></label>
  </template>
  <template v-if="topic==='microfacet-ndf'">
   <label>微小面の粗さ α {{f(state.alpha,2)}}<input v-model.number="state.alpha" type="range" min=".05" max="1" step=".01"/></label>
   <label>法線サンプル数 {{state.samples}}<input v-model.number="state.samples" type="range" min="12" max="192" step="12"/></label>
   <label>分布表示<select v-model="state.distribution"><option value="ndf">NDF D(θ)</option><option value="density">角度の確率密度</option><option value="samples">確率密度 + サンプル頻度</option></select></label>
  </template>
  <label v-if="['microfacet-ndf','cook-torrance'].includes(topic)">法線分布 NDF<select v-model="state.ndf"><option value="ggx">GGX</option><option value="beckmann">Beckmann</option></select></label>
  <template v-if="topic==='fresnel'">
   <label>入射角 θ {{state.angle}}°<input v-model.number="state.angle" type="range" min="0" max="90" step="1"/></label>
   <label>入射側の屈折率 ηᵢ {{f(state.etaI,3)}}<input v-model.number="state.etaI" type="range" min="1" max="2.5" step=".001"/></label>
   <label>透過側の屈折率 ηₜ {{f(state.etaT,3)}}<input v-model.number="state.etaT" type="range" min="1" max="2.5" step=".001"/></label>
   <label>反射率の計算法<select v-model="state.fresnelMode"><option value="both">厳密式とSchlickを比較</option><option value="exact">厳密式</option><option value="schlick">Schlick近似 + 全反射判定</option></select></label>
   <label class="check"><input v-model="state.graph" type="checkbox"/>グラフ表示</label>
  </template>
  <template v-if="['cook-torrance','principled'].includes(topic)">
   <label>UI Roughness {{f(state.roughness,2)}}<input v-model.number="state.roughness" type="range" min="0" max="1" step=".01"/></label><p class="hint">α = roughness² = {{f(alpha,4)}}<br/>完全鏡面の特異点は α ≥ 0.001 で制限。</p>
  </template>
  <template v-if="topic==='cook-torrance'">
   <label>垂直入射反射率 F₀ {{f(state.f0,2)}}<input v-model.number="state.f0" type="range" min="0" max="1" step=".01"/></label>
   <label>グラフに表示する量<select v-model="state.factor"><option value="D">D：法線分布密度 [sr⁻¹]</option><option value="F">F：反射率 [0–1]</option><option value="G">G：遮蔽係数 [0–1]</option><option value="brdf">最終 鏡面BRDF [sr⁻¹]</option></select></label>
  </template>
  <template v-if="topic==='principled'">
   <label>Metallic {{f(state.metallic,2)}}<input v-model.number="state.metallic" type="range" min="0" max="1" step=".01"/></label>
   <label>IOR {{f(state.ior,2)}}<input v-model.number="state.ior" type="range" min="1" max="2.5" step=".01"/></label>
   <label>Base Color（sRGB） {{state.color}}<input v-model="state.color" type="color"/></label>
   <label class="check"><input v-model="state.glass" type="checkbox"/>ガラス：反射成分のみ</label>
  </template>
  <template v-if="topic==='rendering-equation'">
   <label>入射方向の数 {{state.count}}<input v-model.number="state.count" @input="changeCount" type="range" min="1" max="8" step="1"/></label>
   <label>BRDF<select v-model="state.brdfMode"><option value="constant">一定値（講義の例）</option><option value="lambert">Lambert：ρ/π</option><option value="microfacet">Cook–Torrance GGX</option></select></label>
   <label v-if="state.brdfMode==='constant'">一定BRDF {{f(state.constant,2)}} sr⁻¹<input v-model.number="state.constant" type="range" min="0" max=".318" step=".01"/></label>
   <label v-if="state.brdfMode==='lambert'">反射率 ρ {{f(state.rho,2)}}<input v-model.number="state.rho" type="range" min="0" max="1" step=".01"/></label>
   <template v-if="state.brdfMode==='microfacet'"><label>UI Roughness {{f(state.roughness,2)}}<input v-model.number="state.roughness" type="range" min=".1" max="1" step=".01"/></label><label>F₀ {{f(state.f0,2)}}<input v-model.number="state.f0" type="range" min="0" max="1" step=".01"/></label></template>
   <label>出射方向 θV {{state.view}}°<input v-model.number="state.view" type="range" min="-89" max="89" step="1"/></label>
   <fieldset v-for="(_,i) in irradiances" :key="i"><legend>方向 {{i+1}}</legend><label>放射照度 ΔE{{i+1}} {{f(irradiances[i],2)}} W/m²<input v-model.number="irradiances[i]" type="range" min="0" max="3" step=".01"/></label><label>入射角 θ{{i+1}} {{directions[i]}}°<input v-model.number="directions[i]" type="range" min="-85" max="85" step="1"/></label></fieldset>
  </template>
 </aside>
 <div class="visuals">
  <template v-if="topic==='brdf-lobe'">
   <svg class="diagram" viewBox="0 0 520 280" role="img" aria-label="表面、法線N、光源方向L、視線方向Vと反射ローブ"><path d="M40 220H480" stroke="#64748b" stroke-width="4"/><path d="M260 220V30" stroke="#66788e" stroke-dasharray="5 5"/><text x="270" y="30">N</text><path :d="lobePath" fill="#93c5fd55" stroke="#2563eb" stroke-width="3"/><line x1="260" y1="220" :x2="point(state.light,165).x" :y2="point(state.light,165).y" stroke="#d97706" stroke-width="4"/><text :x="point(state.light,180).x" :y="point(state.light,180).y">L</text><line x1="260" y1="220" :x2="point(state.view,135).x" :y2="point(state.view,135).y" stroke="#be185d" stroke-width="4"/><text :x="point(state.view,150).x" :y="point(state.view,150).y">V</text><text x="20" y="255">断面：半径は値に比例（{{state.fixed==='light'?'L固定 / V走査':'V固定 / L走査'}}）</text></svg>
   <div class="readouts"><div><small>{{state.lobe==='lambert'?'BRDF [sr⁻¹]':'経験的ローブ [無次元]'}}</small><strong>{{f(lobeValue,4)}}</strong></div><div><small>cos θL</small><strong>{{f(cos(state.light),4)}}</strong></div><div><small>{{state.lobe==='lambert'?'ΔLo [W/(m²·sr)]':'ローブ × cos θL（相対値）'}}</small><strong>{{f(lobeValue*cos(state.light),4)}}</strong></div></div><p class="hint">寄与表示では LᵢΔωᵢ = 1 W/m² と仮定。Lambert以外は物理単位を持たない比較値。</p>
  </template>
  <template v-if="topic==='microfacet-ndf'">
   <div class="split-visual"><ShadingScene model="cook-torrance" :settings="sceneSettings"/><AdvancedPlot :series="curve" :unit="state.distribution==='ndf'?'D [sr⁻¹]':'角度密度 [rad⁻¹]'" x-label="微小面法線の角度 θm (°)"/></div>
   <svg class="diagram micro" viewBox="0 0 600 170" role="img" aria-label="NDFから生成した微小面の断面と法線"><text x="18" y="24">独立した微小面の断面と法線（側面投影）</text><g v-for="(n,i) in normals.slice(0,48)" :key="i" :transform="`translate(${20+i*560/Math.min(state.samples,48)},110)`"><line :x1="-5*n[1]" :y1="5*n[0]" :x2="5*n[1]" :y2="-5*n[0]" stroke="#64748b" stroke-width="4"/><line x1="0" y1="0" :x2="n[0]*42" :y2="-n[1]*42" stroke="#2563eb" stroke-width="2"/></g><text x="18" y="153">断面は最大48小片。サンプル全数 {{state.samples}} は頻度分布に使用。</text></svg>
   <div class="readouts"><div><small>投影面積での積分（数値計算）</small><strong>{{f(integral,5)}}</strong></div><div><small>D(N) [sr⁻¹]</small><strong>{{f(ndf(state.ndf,1,state.alpha),3)}}</strong></div></div>
  </template>
  <template v-if="topic==='fresnel'">
   <svg class="diagram" viewBox="0 0 520 350" role="img" aria-label="境界面での入射光、反射光、屈折光"><defs><marker id="advanced-ray-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L6,3 L0,6" fill="context-stroke"/></marker></defs><rect x="20" y="175" width="480" height="165" fill="#dbeafe"/><path d="M20 175H500 M260 15V330" stroke="#64748b" stroke-dasharray="5 4"/><text x="25" y="40">ηᵢ = {{state.etaI}}</text><text x="25" y="320">ηₜ = {{state.etaT}}</text><line :x1="point(-state.angle,135,260,175).x" :y1="point(-state.angle,135,260,175).y" x2="260" y2="175" stroke="#d97706" stroke-width="4" marker-end="url(#advanced-ray-arrow)"/><line x1="260" y1="175" :x2="point(state.angle,135,260,175).x" :y2="point(state.angle,135,260,175).y" stroke="#db2777" :stroke-width="2+selectedF*7" marker-end="url(#advanced-ray-arrow)"/><line v-if="fresnel.transmittedAngle!==null" x1="260" y1="175" :x2="point(180-fresnel.transmittedAngle,140,260,175).x" :y2="point(180-fresnel.transmittedAngle,140,260,175).y" stroke="#2563eb" :stroke-width="2+(1-selectedF)*7" marker-end="url(#advanced-ray-arrow)"/><text x="25" y="65" fill="#a16207">入射光</text><text x="390" y="40" fill="#be185d">反射 {{f(selectedF*100,1)}}%</text><text x="320" y="320" fill="#1d4ed8">{{fresnel.totalInternalReflection?'全反射：透過なし':`透過 ${f((1-selectedF)*100,1)}%`}}</text></svg>
   <AdvancedPlot v-if="state.graph" :series="curve" unit="反射率 F [0–1]" :y-max="1" :marker="state.angle"/>
   <div class="readouts"><div><small>厳密 Fresnel</small><strong>{{f(fresnel.reflectance*100,2)}}%</strong></div><div><small>Schlick + 全反射判定</small><strong>{{f(schlickValue*100,2)}}%</strong></div><div><small>透過角 θt</small><strong>{{fresnel.transmittedAngle===null?'全反射':f(fresnel.transmittedAngle,1)+'°'}}</strong></div></div>
  </template>
  <template v-if="topic==='cook-torrance'">
   <div class="split-visual"><ShadingScene model="cook-torrance" :settings="sceneSettings"/><AdvancedPlot :series="curve" :x-min="-89" :x-max="89" x-label="視点方向 θV (°)" :unit="state.factor==='F'||state.factor==='G'?'無次元 [0–1]':'密度 / BRDF [sr⁻¹]'" :y-max="state.factor==='F'||state.factor==='G'?1:undefined" :marker="state.view"/></div>
   <div class="readouts"><div><small>D [sr⁻¹]</small><strong>{{f(dfg.D,4)}}</strong></div><div><small>F [無次元]</small><strong>{{f(dfg.F,4)}}</strong></div><div><small>G [無次元]</small><strong>{{f(dfg.G,4)}}</strong></div><div><small>fₛ [sr⁻¹]</small><strong>{{f(dfg.brdf,5)}}</strong></div></div><p class="hint">数値は平面上のN・L・Vで評価。球面は各画素の法線で同じ式を計算。球は常に最終鏡面反射、グラフは選択した量。</p>
  </template>
  <template v-if="topic==='principled'">
   <ShadingScene model="pbr" :settings="sceneSettings"/>
   <div class="readouts"><div><small>線形RGBの F₀</small><strong class="rgb">{{material.f0.map(v=>f(v,3)).join(' / ')}}</strong></div><div><small>拡散の金属度係数 1−m</small><strong>{{state.glass?'0（反射のみ）':f(material.diffuseWeight,2)}}</strong></div></div>
   <p v-if="state.glass" class="notice">ガラスは反射成分のみです。透過・屈折・内部吸収を描画していないため、透明な物体の見た目は再現しません。</p>
   <p class="hint">指向性光源で材質を比較。環境マップ、間接光、多重散乱の補償は含まない。塗装面は単層の誘電体として近似。</p>
  </template>
  <template v-if="topic==='rendering-equation'">
   <svg class="diagram" viewBox="0 0 520 290" role="img" aria-label="複数の入射方向から表面点Pに届く光と視線方向"><path d="M35 230H485" stroke="#64748b" stroke-width="4"/><path d="M260 230V35" stroke="#64748b" stroke-dasharray="5 5"/><text x="270" y="35">N</text><g v-for="(c,i) in contributions" :key="i"><line x1="260" y1="230" :x2="point(c.angle,155,260,230).x" :y2="point(c.angle,155,260,230).y" stroke="#d97706" :stroke-width="1+c.irradiance*3"/><circle :cx="point(c.angle,155,260,230).x" :cy="point(c.angle,155,260,230).y" r="13" fill="#fef3c7"/><text :x="point(c.angle,155,260,230).x" :y="point(c.angle,155,260,230).y+5" text-anchor="middle">{{i+1}}</text></g><line x1="260" y1="230" :x2="point(state.view,110,260,230).x" :y2="point(state.view,110,260,230).y" stroke="#be185d" stroke-width="4"/><text :x="point(state.view,125,260,230).x" :y="point(state.view,125,260,230).y">V</text><text x="250" y="255">P</text></svg>
   <div class="readouts"><div><small>総放射照度 ΣΔE [W/m²]</small><strong>{{f(totalE,3)}}</strong></div><div><small>出射放射輝度 Lo [W/(m²·sr)]</small><strong data-testid="radiance-total">{{f(total,3)}}</strong></div></div>
   <div class="contribution-table"><table><thead><tr><th>方向</th><th>ΔE [W/m²]</th><th>fᵣ [sr⁻¹]</th><th>寄与 [W/(m²·sr)]</th></tr></thead><tbody><tr v-for="(c,i) in contributions" :key="i"><td>{{i+1}}</td><td>{{f(c.irradiance,3)}}</td><td>{{f(c.brdf,3)}}</td><td><span class="contribution-bar" :style="{width:`${Math.min(100,c.value/Math.max(total,.001)*100)}%`}"/>{{f(c.value,3)}}</td></tr></tbody></table></div>
  </template>
  <p class="formula">{{meta.formula}}</p>
 </div>
 </div>
 <details :open="!teacher" class="explanation"><summary>観察と説明</summary><p><strong>操作・観察</strong> {{meta.observe}}</p><p>{{meta.explain}}</p><p class="hint">{{slideReference}}。関連スライドへのリンクは、このデモの案内を参照。</p><p v-if="['microfacet-ndf','fresnel','cook-torrance','principled'].includes(topic)" class="hint">数式の参考：<a href="https://www.pbr-book.org/4ed/Reflection_Models/Roughness_Using_Microfacet_Theory" target="_blank" rel="noreferrer">PBRT 4e §9.6 微小面理論</a> · <a href="https://www.pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission" target="_blank" rel="noreferrer">§9.3 反射と透過</a></p></details>
</section>
</template>

<style scoped>
.shading-explorer{font-family:system-ui,sans-serif;color:#172b45;background:#f4f7fb;border:1px solid #d6e1ee;border-radius:18px;padding:22px;font-size:15px;line-height:1.65;max-width:100%;box-sizing:border-box}.advanced-explorer header{display:flex;gap:18px;align-items:flex-start;justify-content:space-between}.advanced-explorer h2{font-size:25px;line-height:1.3;margin:0 0 8px}.advanced-explorer p{margin:8px 0}.eyebrow{font-size:11px!important;font-weight:750;letter-spacing:.13em;color:#4e6c92}.prediction{padding:12px 15px;background:#e7f0ff;border-left:4px solid #3b82f6;border-radius:4px}.presets{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:17px 0}.presets>span{font-size:12px;color:#526780}.advanced-explorer button{font:inherit;font-size:13px;line-height:1.4;background:#fff;border:1px solid #b9cadf;border-radius:8px;padding:8px 11px;color:#213e64;cursor:pointer}.advanced-explorer button:hover{background:#e3edfa}.advanced-explorer button:focus-visible,.advanced-explorer input:focus-visible,.advanced-explorer select:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}.advanced-explorer button.reset{margin-left:auto;color:#7f1d1d}.teacher{white-space:nowrap}.workspace{display:grid;grid-template-columns:minmax(220px,270px) minmax(0,1fr);gap:18px;align-items:start}.controls{display:grid;gap:15px;padding:16px;background:#fff;border:1px solid #dbe4ef;border-radius:12px}.controls label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:650}.controls input[type=range]{width:100%;accent-color:#2563eb;min-height:24px;margin:0}.controls input[type=color]{width:100%;height:35px;border:1px solid #cbd5e1;border-radius:6px}.controls select{width:100%;min-width:0;padding:8px 6px;background:#f8fafc;border:1px solid #b9cadf;border-radius:6px;color:#172b45;font:inherit;font-weight:400}.controls .check{flex-direction:row;align-items:center}.controls fieldset{border:1px solid #d4deeb;border-radius:8px;padding:10px;display:grid;gap:10px;min-width:0}.controls legend{font-size:12px;color:#526780}.visuals{display:grid;gap:14px;min-width:0}.diagram{display:block;width:100%;max-height:360px;background:#fff;border:1px solid #dbe4ef;border-radius:12px}.diagram text{font:14px system-ui;fill:#334155}.diagram.micro{max-height:180px}.split-visual{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:center}.readouts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px}.readouts>div{padding:12px 14px;background:#e8eff9;border-radius:10px;min-width:0}.readouts small{display:block;font-size:11px;color:#4a607d}.readouts strong{display:block;font-size:24px;color:#193c68;font-variant-numeric:tabular-nums}.readouts strong.rgb{font-size:20px}.formula{padding:13px 16px;background:#162f50;color:#eff6ff;border-radius:10px;font-family:system-ui;overflow-wrap:anywhere;font-size:15px!important}.hint{font-size:12px!important;color:#526780}.notice{background:#fff4ce;border-left:4px solid #d97706;padding:10px 14px}.explanation{margin-top:17px;padding:12px 16px;background:white;border-radius:10px}.explanation summary{cursor:pointer;font-weight:700}.explanation a{color:#1d4ed8;text-decoration:underline}.contribution-table{overflow:auto}.contribution-table table{width:100%;font-size:12px;border-collapse:collapse;background:#fff}.contribution-table th,.contribution-table td{padding:9px;border-bottom:1px solid #d6e1ee;text-align:right;white-space:nowrap}.contribution-table td:last-child{position:relative;isolation:isolate}.contribution-bar{position:absolute;left:0;top:4px;bottom:4px;background:#bfdbfe;z-index:-1}.teacher-mode{font-size:18px}.teacher-mode .controls label{font-size:16px}.teacher-mode h2{font-size:30px}.teacher-mode .diagram{max-height:460px}.teacher-mode .workspace{grid-template-columns:minmax(260px,310px) minmax(0,1fr)}@media(max-width:1000px){.split-visual{grid-template-columns:1fr}.workspace{grid-template-columns:220px minmax(0,1fr)}}@media(max-width:680px){.shading-explorer{padding:12px}.advanced-explorer header{display:block}.advanced-explorer h2{font-size:22px}.workspace,.teacher-mode .workspace{grid-template-columns:1fr}.controls{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:12px}.controls fieldset{grid-column:1/-1}.controls label{font-size:12px}.advanced-explorer button.reset{margin-left:0}.readouts strong{font-size:20px}.teacher{margin-top:8px}.split-visual{grid-template-columns:1fr}.formula{font-size:13px!important}.controls .hint{grid-column:1/-1}}
</style>
