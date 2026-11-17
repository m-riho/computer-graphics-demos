// 入力値を変更し、各パラメータの働きを確かめる。
import { projectedNdfIntegral, sampleNdf } from '../../packages/cg-algorithms/src/shading-advanced.ts'
export function runExample() {
 return ['ggx','beckmann'].map(kind => ({kind, integral:projectedNdfIntegral(kind as 'ggx'|'beckmann',.4), normal:sampleNdf(kind as 'ggx'|'beckmann',.4,.5,.25)}))
}
