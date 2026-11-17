// 入力値を変え、操作版と同じ共通関数で確かめる。
import { combineLighting } from '../../packages/cg-algorithms/src/shading-classic.ts'
export function runExample() {
  return [0,.5,1].map(occlusion => combineLighting({ambient:.2,diffuse:.5,specular:.8,ambientOn:true,diffuseOn:true,specularOn:true,occlusion}))
}
