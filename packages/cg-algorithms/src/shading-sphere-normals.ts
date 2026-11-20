/** 球・円周の法線。点Pは中心原点・半径1の球上なのでN=P。 */
import { crossShading, normalizeShading, linearToSrgb, type ShadingVector } from './shading-geometry.ts'
export type NormalVector=ShadingVector
const radians=(degrees:number)=>degrees*Math.PI/180
const finite=(...values:number[])=>{if(values.some(v=>!Number.isFinite(v)))throw new RangeError('角度は有限値にします')}
export const dotNormal=(a:NormalVector,b:NormalVector)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
export const normalLight:NormalVector=normalizeShading([1,1,1])
export const normalSphereRadius=.29
/** αは大円の位置、φはその断面の方位。どちらも度。 */
export function sphereNormal(alpha:number,meridian:number):NormalVector {
 finite(alpha,meridian)
 const a=radians(alpha),m=radians(meridian)
 return [Math.cos(a)*Math.cos(m),Math.sin(a),Math.cos(a)*Math.sin(m)]
}
/** カメラは中心を見る正投影。projectのz=N·Vが正なら見える半球。 */
export function normalView(yaw:number,pitch:number){
 finite(yaw,pitch)
 const view=sphereNormal(pitch,yaw)
 const right=normalizeShading(crossShading(Math.abs(view[1])>.9999?[0,0,1]:[0,1,0],view))
 const up=crossShading(view,right)
 return {view,right,up,project:(n:NormalVector):NormalVector=>[dotNormal(n,right),dotNormal(n,up),dotNormal(n,view)]}
}
/** 全方向は連続的に無数にある。これは見やすく配置する有限個の代表矢印。 */
export function normalSamples(count=48):NormalVector[]{
 if(!Number.isInteger(count)||count<2||count>256)throw new RangeError('代表点の個数は2〜256の整数にします')
 return Array.from({length:count},(_,i)=>{
  const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5))
  return [r*Math.cos(a),y,r*Math.sin(a)]
 })
}
/** 固定白色平行光L=(1,1,1)/√3、Lambert拡散のみ、sRGB表示。 */
export function spherePixels(yaw:number,pitch:number,size=361):Uint8ClampedArray {
 if(!Number.isInteger(size)||size<3||size>721)throw new RangeError('画像サイズは3〜721の整数にします')
 const c=normalView(yaw,pitch),center=(size-1)/2,r=(size-1)*normalSphereRadius
 const data=new Uint8ClampedArray(size*size*4)
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x-center)/r,v=(center-y)/r,q=u*u+v*v
  if(q>1)continue
  const w=Math.sqrt(1-q)
  const n=c.right.map((value,k)=>value*u+c.up[k]!*v+c.view[k]!*w) as NormalVector
  const intensity=Math.max(0,dotNormal(n,normalLight)),index=4*(y*size+x)
  data.set([.2,.5,.8].map(value=>Math.round(255*linearToSrgb(value*intensity))).concat(255),index)
 }
 return data
}
