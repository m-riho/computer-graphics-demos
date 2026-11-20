import { sphereNormal, normalView, dotNormal, normalLight } from '../../packages/cg-algorithms/src/shading-sphere-normals.ts'
/** 単位球では位置Pと外向き単位法線Nが一致する。6方向で確かめる。 */
export function runExample(){
 const camera=normalView(40,25)
 return [[0,0],[180,0],[90,0],[270,0],[0,90],[180,90]].map(([alpha,phi])=>{
  const normal=sphereNormal(alpha!,phi!)
  return {alpha,phi,normal,length:Math.hypot(...normal),visible:dotNormal(normal,camera.view)>0,diffuse:Math.max(0,dotNormal(normal,normalLight))}
 })
}
