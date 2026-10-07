import { hex, type RGB } from '../../packages/cg-algorithms/src/index.ts'

// 3成分はディスプレイへ渡す0〜255の符号値です。
// Rだけ、Gだけ、両方を入れた場合の表示色を比較します。
export function runExample() {
  const colors: RGB[] = [[255, 0, 0], [0, 255, 0], [255, 255, 0]]
  return colors.map(rgb => ({ RGB: rgb, displayColor: hex(rgb) }))
}
// [255,255,0] は黄色、[255,255,255] は白です。
// 数値と物理的な光量との比例関係は仮定していません。
