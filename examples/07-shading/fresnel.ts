// 入力値を変更し、各パラメータの働きを確かめる。
import { fresnelDielectric } from '../../packages/cg-algorithms/src/shading-advanced.ts'
export function runExample() {
 return [0,30,60,89].map(angle => ({angle,...fresnelDielectric(angle,1,1.5)}))
}
