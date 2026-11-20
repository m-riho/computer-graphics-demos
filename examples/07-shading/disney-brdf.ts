import { disneyDefaults, disneyBRDF } from '../../packages/cg-algorithms/src/shading-disney.ts'
// 光源・視点・材質色を固定し、金属度と粗さだけを変える。
// 戻り値はBRDFの線形RGB（sr⁻¹）。画面のRGB値ではない。
export function runExample(){
 return [0,1].flatMap(metallic=>[.2,.5,.8].map(roughness=>{
  const p={...disneyDefaults(),metallic,roughness}
  return {metallic,roughness,...disneyBRDF([0,0,1],[1,0,0],[.4,0,Math.sqrt(.84)],[0,0,1],p)}
 }))
}
