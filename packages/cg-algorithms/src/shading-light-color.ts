/** 第7回p.26：線形RGBの各成分を掛ける教育用の拡散反射モデル。 */
import { linearToSrgb, type ShadingVector } from './shading-geometry.ts'
export type RGB = ShadingVector
function unit(value:number):void {
  if(!Number.isFinite(value)||value<0||value>1)throw new RangeError('RGBと光源強度は0〜1の有限値にします')
}
/** materialは拡散係数、lightは光源の相対RGB光量。cosine=N·L。
 * 正面の白色光を基準にした相対値であり、放射輝度の絶対単位ではない。
 */
export function diffuseRGB(material:RGB,light:RGB,cosine=1,intensity=1):RGB {
  material.forEach(unit);light.forEach(unit);unit(intensity)
  if(!Number.isFinite(cosine)||cosine< -1||cosine>1)throw new RangeError('内積は−1〜1の有限値にします')
  const scale=Math.max(0,cosine)*intensity
  return material.map((channel,i)=>channel*light[i]!*scale) as RGB
}
/** 線形値をsRGBへ符号化してから8 bit表示値へ。 */
export function displayRGB(linear:RGB):RGB {
  linear.forEach(unit)
  return linear.map(value=>Math.round(255*linearToSrgb(value))) as RGB
}
/** カメラを+Zに置いた単位球の正射影。光源方向は(sinθ,0,cosθ)。
 * 中央の法線は(0,0,1)。環境光・鏡面・間接反射は加えない。
 * 背景画素は透明。画面とコードで同じdiffuseRGBを使用する。
 */
export function renderDiffuseSphere(material:RGB,light:RGB,angle=0,intensity=1,size=241):Uint8ClampedArray {
  if(!Number.isFinite(angle)||angle<0||angle>180)throw new RangeError('角度は0〜180度にします')
  if(!Number.isInteger(size)||size<3||size>513)throw new RangeError('画像サイズは3〜513の整数にします')
  diffuseRGB(material,light,1,intensity)
  const result=new Uint8ClampedArray(size*size*4),center=(size-1)/2,radius=center*.88
  const theta=angle*Math.PI/180,sin=Math.sin(theta),cos=Math.cos(theta)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(x-center)/radius,ny=(center-y)/radius,r2=nx*nx+ny*ny
    if(r2>1)continue
    const nz=Math.sqrt(1-r2),ndotl=Math.max(-1,Math.min(1,nx*sin+nz*cos))
    const rgb=displayRGB(diffuseRGB(material,light,ndotl,intensity)),offset=4*(y*size+x)
    result.set([...rgb,255],offset)
  }
  return result
}
