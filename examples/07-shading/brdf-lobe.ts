// 入力値を変更し、各パラメータの働きを確かめる。
import { lambertBrdf, empiricalLobe } from '../../packages/cg-algorithms/src/shading-advanced.ts'
export function runExample() {
 return [-60,-30,0,30,60].map(view => ({view, lambert:lambertBrdf(.6), phongShape:empiricalLobe('phong',30,view,20)}))
}
