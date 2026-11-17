// 入力値を変更し、各パラメータの働きを確かめる。
import { lambert } from '../../packages/cg-algorithms/src/shading-classic.ts'
export function runExample() {
 // 同じカメラと形状で選んだ面の法線を固定する。
 return [0,60,120].map(incidence => ({incidence, visibleFace:'固定した面', diffuse:lambert(incidence,1,1)}))
}
