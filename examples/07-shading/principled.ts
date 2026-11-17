// 入力値を変更し、各パラメータの働きを確かめる。
import { pbrParameters, srgbHexToLinear } from '../../packages/cg-algorithms/src/shading-advanced.ts'
export function runExample() {
 const linearBase=srgbHexToLinear('#c99155')
 return [0,.5,1].map(metallic => ({metallic,...pbrParameters(metallic,1.5,linearBase)}))
}
