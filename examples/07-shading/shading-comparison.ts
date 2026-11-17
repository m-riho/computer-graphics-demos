// 入力値を変更し、各パラメータの働きを確かめる。
import { createShadingSphere } from '../../packages/cg-algorithms/src/shading-geometry.ts'
export function runExample() {
 return [0,1,2,3].map(level => {
  const mesh=createShadingSphere(level)
  return {level,triangles:mesh.positions.length/9,firstVertex: Array.from(mesh.positions.slice(0,3)),vertexNormal:Array.from(mesh.normals.slice(0,3)),faceNormal:Array.from(mesh.faceNormals.slice(0,3))}
 })
}
