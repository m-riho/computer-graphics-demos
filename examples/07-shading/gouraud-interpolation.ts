import { interpolateShading } from '../../packages/cg-algorithms/src/shading-interpolation.ts'

// 同じ頂点法線・光源・材質から、補間する量を変えて比較。
// 点Pを各頂点と重心へ移し、法線と線形の明るさを調べる。
export function runExample() {
  return ([[1,0,0],[0,1,0],[0,0,1],[1/3,1/3,1/3]] as [number,number,number][]).map(weights => ({
    weights, ...interpolateShading(weights,0,1,true),
  }))
}
