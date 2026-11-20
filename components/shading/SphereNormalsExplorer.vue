<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { sphereNormal, normalView, normalSamples, spherePixels, dotNormal, normalLight, normalSphereRadius, type NormalVector } from '../../packages/cg-algorithms/src/shading-sphere-normals.ts'
import { linearToSrgb } from '../../packages/cg-algorithms/src/shading-geometry.ts'
defineProps<{topic?:string}>()
const alpha=ref(35),meridian=ref(0),yaw=ref(40),pitch=ref(25),showBack=ref(true),showSamples=ref(true),teacher=ref(false),playing=ref(false)
const canvas=ref<HTMLCanvasElement>(),circle=ref<SVGSVGElement>(),uid='sphere-normal-'+useId().replace(/:/g,'')
const n=computed(()=>sphereNormal(alpha.value,meridian.value)),camera=computed(()=>normalView(yaw.value,pitch.value))
const nv=computed(()=>dotNormal(n.value,camera.value.view)),nl=computed(()=>dotNormal(n.value,normalLight)),brightness=computed(()=>Math.max(0,nl.value))
const status=computed(()=>Math.abs(nv.value)<1e-8?'輪郭上':nv.value>0?'見える側':'裏側（隠れる側）')
const rgb=computed(()=>'rgb('+[.2,.5,.8].map(c=>Math.round(255*linearToSrgb(c*brightness.value))).join(',')+')')
const radius=360*normalSphereRadius,representatives=normalSamples(40)
const cx=(a:number,r=radius)=>180+r*Math.cos(a*Math.PI/180),cy=(a:number,r=radius)=>180-r*Math.sin(a*Math.PI/180)
const arc=computed(()=>Array.from({length:Math.ceil(alpha.value/5)+1},(_,i)=>{const a=Math.min(alpha.value,i*5);return (i?'L':'M')+cx(a,32)+','+cy(a,32)}).join(' '))
const axes:{name:string;a:number;m:number}[]=[{name:'+X',a:0,m:0},{name:'−X',a:180,m:0},{name:'+Y',a:90,m:0},{name:'−Y',a:270,m:0},{name:'+Z',a:0,m:90},{name:'−Z',a:180,m:90}]
let playFrame=0,drawFrame=0,lastTime=0,traveled=0,startAlpha=0,cachedKey='',cachedPixels:ImageData|undefined
function stop(){playing.value=false;cancelAnimationFrame(playFrame);playFrame=0;lastTime=0}
function tick(time:number){
 if(!playing.value)return
 if(lastTime)traveled+=Math.min((time-lastTime)/1000,.05)*45
 lastTime=time
 alpha.value=(startAlpha+Math.min(360,traveled))%360
 if(traveled>=360){stop();return}
 playFrame=requestAnimationFrame(tick)
}
function toggle(){if(playing.value){stop();return}playing.value=true;startAlpha=alpha.value;traveled=0;lastTime=0;playFrame=requestAnimationFrame(tick)}
function resetView(){yaw.value=40;pitch.value=25}
function reset(){stop();alpha.value=35;meridian.value=0;showBack.value=true;showSamples.value=true;resetView()}
function preset(axis:typeof axes[number]){stop();alpha.value=axis.a;meridian.value=axis.m}
function setCircle(event:PointerEvent){
 const rect=circle.value!.getBoundingClientRect(),x=(event.clientX-rect.left)*360/rect.width-180,y=180-(event.clientY-rect.top)*360/rect.height
 if(Math.hypot(x,y)<12)return
 stop();alpha.value=Math.round((Math.atan2(y,x)*180/Math.PI+360)%360)
}
function circleDown(event:PointerEvent){if(!event.isPrimary||event.button!==0)return;event.preventDefault();circle.value!.focus();circle.value!.setPointerCapture(event.pointerId);setCircle(event)}
function circleMove(event:PointerEvent){if(circle.value?.hasPointerCapture(event.pointerId))setCircle(event)}
function releaseCircle(event:PointerEvent){if(circle.value?.hasPointerCapture(event.pointerId))circle.value.releasePointerCapture(event.pointerId)}
function circleKey(event:KeyboardEvent){
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return
 event.preventDefault();event.stopPropagation();stop()
 alpha.value=event.key==='Home'?0:(alpha.value+(['ArrowRight','ArrowUp'].includes(event.key)?3:357))%360
}
let dragPointer:number|undefined,lastX=0,lastY=0
function sphereDown(event:PointerEvent){if(!event.isPrimary||event.button!==0)return;event.preventDefault();dragPointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;canvas.value!.focus();canvas.value!.setPointerCapture(event.pointerId)}
function turn(dx:number,dy:number){yaw.value=(yaw.value-dx*.5+720)%360;pitch.value=Math.max(-85,Math.min(85,pitch.value+dy*.5))}
function sphereMove(event:PointerEvent){if(dragPointer!==event.pointerId)return;turn(event.clientX-lastX,event.clientY-lastY);lastX=event.clientX;lastY=event.clientY}
function sphereUp(event:PointerEvent){if(dragPointer!==event.pointerId)return;dragPointer=undefined;if(canvas.value?.hasPointerCapture(event.pointerId))canvas.value.releasePointerCapture(event.pointerId)}
function sphereKey(event:KeyboardEvent){
 const delta:Record<string,[number,number]>={ArrowLeft:[-6,0],ArrowRight:[6,0],ArrowUp:[0,-6],ArrowDown:[0,6]}
 if(event.key!=='Home'&&!delta[event.key])return
 event.preventDefault();event.stopPropagation();if(event.key==='Home')resetView();else turn(...delta[event.key]!)
}
function draw(){
 drawFrame=0
 const context=canvas.value?.getContext('2d');if(!context)return
 const ctx:CanvasRenderingContext2D=context
 const key=yaw.value+':'+pitch.value
 if(key!==cachedKey){cachedPixels=new ImageData(new Uint8ClampedArray(spherePixels(yaw.value,pitch.value)),361,361);cachedKey=key}
 ctx.clearRect(0,0,361,361);ctx.putImageData(cachedPixels!,0,0)
 const project=(v:NormalVector)=>{const p=camera.value.project(v);return {x:180+radius*p[0],y:180-radius*p[1],z:p[2]}}
 function segment(a:NormalVector,b:NormalVector,color:string,dashed=false,width=1.5){
  const p=project(a),q=project(b);ctx.beginPath();ctx.setLineDash(dashed?[4,4]:[]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([])
 }
 function arrow(v:NormalVector,color:string,scale=1.3,dashed=false,width=1.5){
  const q=v.map(x=>x*scale) as NormalVector,p=project(v),end=project(q);segment(v,q,color,dashed,width)
  const d=Math.hypot(end.x-p.x,end.y-p.y);ctx.fillStyle=color
  if(d<3){ctx.beginPath();ctx.arc(end.x,end.y,3,0,2*Math.PI);ctx.fill();return}
  const a=Math.atan2(end.y-p.y,end.x-p.x);ctx.beginPath();ctx.moveTo(end.x,end.y);ctx.lineTo(end.x-6*Math.cos(a-.45),end.y-6*Math.sin(a-.45));ctx.lineTo(end.x-6*Math.cos(a+.45),end.y-6*Math.sin(a+.45));ctx.closePath();ctx.fill()
 }
 // Dashed back-facing annotations are intentionally shown through the opaque sphere.
 if(showSamples.value)for(const v of representatives){const back=dotNormal(v,camera.value.view)<0;if(!back||showBack.value)arrow(v,back?'#8399b366':'#40c69a',1.3,back)}
 for(let a=0;a<360;a+=3){const p=sphereNormal(a,meridian.value),q=sphereNormal(a+3,meridian.value),back=dotNormal(sphereNormal(a+1.5,meridian.value),camera.value.view)<0;if(!back||showBack.value)segment(p,q,back?'#d8af6f99':'#ffce70',back,1.5)}
 const p=project(n.value),back=nv.value< -1e-8
 if(!back||showBack.value){
  segment([0,0,0],n.value,'#e6b75a',true,1.5);arrow(n.value,back?'#ffb86b':'#ffd15c',1.3,back,3)
  ctx.beginPath();ctx.arc(p.x,p.y,4,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#e98c20';ctx.stroke();ctx.font='bold 14px sans-serif';ctx.fillStyle='#ffce70';ctx.fillText('P',p.x+6,p.y-7)
 }
 ctx.font='12px sans-serif';ctx.fillStyle='#d9e5f2';ctx.fillText('C',183,195)
 // Blender-style axis colors; this gizmo tracks the camera, not the selected normal.
 for(const [v,label,color] of [[[1,0,0],'X','#f05b68'],[[0,1,0],'Y','#5dd25d'],[[0,0,1],'Z','#609cfa']] as [NormalVector,string,string][]){const p=camera.value.project(v);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(45,316);ctx.lineTo(45+28*p[0],316-28*p[1]);ctx.stroke();ctx.fillStyle=color;ctx.fillText(label,45+37*p[0]-4,316-37*p[1]+4)}
}
function schedule(){if(!drawFrame)drawFrame=requestAnimationFrame(draw)}
watch([alpha,meridian,yaw,pitch,showBack,showSamples],schedule)
onMounted(schedule)
onBeforeUnmount(()=>{stop();cancelAnimationFrame(drawFrame)})
</script>
<template>
<section class="shading-explorer sphere-normals-explorer" :class="{'teacher-mode':teacher}" @input.capture="stop">
  <header><div><h2>球面には、全ての方向の法線がある</h2><p>円周から始めて、断面を回しながら球面へ広げます。</p></div><button @click="teacher=!teacher">{{teacher?'通常表示':'教員モード'}}</button></header>
  <div class="presets"><span>法線を軸方向へ：</span><button v-for="axis in axes" :key="axis.name" @click="preset(axis)">{{axis.name}}</button><button @click="toggle">{{playing?'一時停止':'円周を一周'}}</button><button @click="reset">初期状態に戻す</button></div>
  <div class="controls">
    <label>円周上の位置 α <output>{{alpha}}°</output><input v-model.number="alpha" aria-label="円周上の位置 α" type="range" min="0" max="360" step="1"/></label>
    <label>断面の向き φ <output>{{meridian}}°</output><input v-model.number="meridian" aria-label="断面の向き φ" type="range" min="0" max="180" step="1"/></label>
  </div>
  <div class="views">
    <figure><figcaption>① 円を真正面から見る</figcaption>
      <svg ref="circle" class="circle-view" viewBox="0 0 360 360" tabindex="0" role="slider" aria-label="円周上の点Pを動かす" :aria-valuenow="alpha" aria-valuemin="0" aria-valuemax="360" :aria-valuetext="alpha+'度'" @pointerdown="circleDown" @pointermove="circleMove" @pointerup="releaseCircle" @pointercancel="releaseCircle" @keydown="circleKey">
        <defs><marker :id="uid+'-green'" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#18876b"/></marker><marker :id="uid+'-selected'" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#bb6900"/></marker></defs>
        <line x1="28" y1="180" x2="332" y2="180" class="axis"/><line x1="180" y1="28" x2="180" y2="332" class="axis"/>
        <circle cx="180" cy="180" :r="radius" fill="#edf4fc" stroke="#466e96" stroke-width="2"/>
        <g v-if="showSamples"><line v-for="i in 12" :key="i" :x1="cx((i-1)*30)" :y1="cy((i-1)*30)" :x2="cx((i-1)*30,radius*1.3)" :y2="cy((i-1)*30,radius*1.3)" stroke="#18876b" stroke-width="1.6" :marker-end="'url(#'+uid+'-green)'"/></g>
        <line x1="180" y1="180" :x2="cx(alpha)" :y2="cy(alpha)" stroke="#bb6900" stroke-dasharray="5 4"/>
        <path :d="arc" fill="none" stroke="#bb6900"/><text x="220" y="172" fill="#995800">α</text>
        <line :x1="cx(alpha)" :y1="cy(alpha)" :x2="cx(alpha,radius*1.3)" :y2="cy(alpha,radius*1.3)" stroke="#bb6900" stroke-width="3" :marker-end="'url(#'+uid+'-selected)'"/>
        <circle :cx="cx(alpha)" :cy="cy(alpha)" r="4" fill="#fff" stroke="#bb6900" stroke-width="2"/>
        <text :x="cx(alpha)+7" :y="cy(alpha)-7" fill="#995800">P</text><circle cx="180" cy="180" r="2.5" fill="#153854"/><text x="164" y="198">C</text>
        <text x="186" y="24">+Y</text><text x="180" y="351" text-anchor="middle" class="slice-label">横方向 = (cos φ, 0, sin φ)</text>
      </svg>
      <p>円周をクリック・ドラッグすると点Pが動きます。矢印キーでも操作できます。法線は常に中心Cから外向きです。</p>
    </figure>
    <figure><figcaption>② 同じ断面を、球の中に見る</figcaption>
      <canvas ref="canvas" width="361" height="361" tabindex="0" role="img" aria-label="球の断面と法線。ドラッグまたは矢印キーで視点を回転。Homeキーで視点を戻す。" @pointerdown="sphereDown" @pointermove="sphereMove" @pointerup="sphereUp" @pointercancel="sphereUp" @lostpointercapture="sphereUp" @keydown="sphereKey"/>
      <p>球をドラッグして視点を回します。橙は左と同じ円と選択法線、緑は代表法線。破線は裏側の透過表示です。</p>
    </figure>
  </div>
  <div class="options"><label><input v-model="showSamples" type="checkbox"/>代表的な法線を表示</label><label><input v-model="showBack" type="checkbox"/>裏側の法線も透かして表示</label><button @click="resetView">球の視点だけ戻す</button></div>
  <div class="readout">
    <div><strong>選択点Pの単位法線 N</strong><output data-normal-value>{{n.map(v=>(Math.abs(v)<.0005?0:v).toFixed(3)).join(' / ')}}</output><span>長さ |N| = {{Math.hypot(...n).toFixed(3)}}　／　N = (P − C) / r</span></div>
    <div><strong>この視点からは</strong><output data-visibility>{{status}}</output><span>N·V = {{nv.toFixed(3)}}（正なら見える側）</span></div>
    <div><strong>選択点の拡散反射</strong><output data-brightness><i :style="{background:rgb}"/>{{brightness.toFixed(3)}}</output><span>max(0, N·L)　／　白色平行光Lは固定</span></div>
  </div>
  <div class="takeaway"><strong>αを一周させると、断面内の全方向。φも変えると、球面の全方向。</strong><p>矢印は代表点だけを表示しています。実際の法線方向は連続的に無数にあります。右の画像で見えるのは、カメラを向いた半球だけです。</p></div>
  <details :open="teacher"><summary>授業で確かめること・表示の条件</summary><ol><li>「円周を一周」で、位置と法線が同じ角度で動くことを観察します。</li><li>断面の向きφを変え、+X・−X・+Y・−Y・+Z・−Zのプリセットで6方向を確認します。</li><li>球の視点を回します。同じ点の法線と拡散反射は変わらず、見える側／裏側の判定が変わります。</li><li>透過表示を切ると、裏側の法線が隠れます。法線が視線と重なると、投影された矢印は点状に見えます。矢印の3D長さは共通の縮尺で描いており、画面上の長さは視線との角度で変わります。</li></ol><p>中心C=(0,0,0)、半径r=1、正投影。光源方向はL=(1,1,1)/√3、材質は線形RGB (0.2,0.5,0.8)。球の陰影と色見本はLambert拡散のみで、表示時にsRGB変換します。裏側の点の数値は、その面から出る光を表し、現在のカメラから見えることを意味しません。</p><p>円・球の幾何形状は常に同じです。断面や代表法線は説明のために重ねた図です。一枚の球の画像で、BRDFの全ての入射・出射方向の組を網羅できるわけではありません。</p></details>
</section>
</template>
<style scoped>
.sphere-normals-explorer{color:#153854;line-height:1.55;font-size:16px}.sphere-normals-explorer *{box-sizing:border-box}header{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}h2{font-size:27px;margin:0}p{margin:8px 0}button{font:inherit;padding:7px 12px;border:1px solid #9bb5cc;border-radius:5px;color:#14466d;background:#f3f8ff;cursor:pointer}header button{white-space:nowrap}.presets{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:18px 0}.controls{display:grid;grid-template-columns:1fr 1fr;gap:20px;background:#edf4fc;padding:15px;border-radius:8px}.controls label{display:grid;grid-template-columns:1fr auto;gap:4px}.controls output{font-weight:700;color:#005bac}.controls input{grid-column:1/-1;width:100%;accent-color:#005bac}.views{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}figure{margin:0;min-width:0}figcaption{font-weight:700;margin:0 0 8px}figure p{font-size:14px;color:#50677d}svg,canvas{display:block;width:100%;height:auto;border:1px solid #cbdbea;border-radius:8px;touch-action:none}.circle-view{cursor:crosshair;background:white;color:#153854;font:14px sans-serif}.slice-label{font-size:13px}.axis{stroke:#a9bfd3;stroke-dasharray:3 4}canvas{background:#152539;cursor:grab}svg:focus-visible,canvas:focus-visible{outline:3px solid #398acb;outline-offset:2px}.options{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center}.options label{display:flex;gap:8px;align-items:center}.options input{width:18px;height:18px;accent-color:#005bac}.readout{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px;margin:20px 0}.readout>div{border:1px solid #cbdbea;border-radius:8px;padding:13px}.readout strong,.readout span{display:block}.readout span{font-size:12px;color:#50677d}.readout output{display:flex;align-items:center;gap:9px;font-size:20px;font-weight:700;color:#005bac;margin:9px 0;font-variant-numeric:tabular-nums}.readout i{display:inline-block;width:28px;height:28px;border:1px solid #9bb5cc;border-radius:4px}.takeaway{background:#edf4fc;border-left:4px solid #005bac;padding:16px;margin:16px 0}details{border-top:1px solid #cbdbea;padding-top:12px}summary{cursor:pointer;font-weight:700}li{margin:8px 0}.teacher-mode{font-size:19px}@media(max-width:850px){.views{gap:12px}.readout{grid-template-columns:1fr}.readout output{font-size:19px}}@media(max-width:600px){header{display:block}header button{margin-top:12px}h2{font-size:23px}.controls,.views{grid-template-columns:1fr}.circle-view{font-size:17px}.slice-label{font-size:15px}.readout output{font-size:18px}}
</style>
