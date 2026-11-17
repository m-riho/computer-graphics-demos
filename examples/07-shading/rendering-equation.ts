// 入力値を変更し、各パラメータの働きを確かめる。
import { renderingSum, repartitionIrradiance } from '../../packages/cg-algorithms/src/shading-advanced.ts'
export function runExample() {
 const irradiance=[1,.5,.25]
 return {lecture:renderingSum([.2,.2,.2],irradiance), splitInto6:renderingSum(Array(6).fill(.2),repartitionIrradiance(irradiance,6))}
}
