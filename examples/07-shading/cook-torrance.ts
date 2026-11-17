// 入力値を変更し、各パラメータの働きを確かめる。
import { cookTorrance } from '../../packages/cg-algorithms/src/shading-advanced.ts'
export function runExample() {
 return [.1,.25,.6].map(alpha => ({alpha,...cookTorrance(35,-20,alpha,.04,'ggx')}))
}
