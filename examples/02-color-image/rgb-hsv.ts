import { rgbToHsv, hsvToRgb, type RGB } from '../../packages/cg-algorithms/src/index.ts'

// 同じ色を、RGB成分と色相・彩度・明度の2通りで表します。
// Hは度、S/Vは%。Vは明るさの知覚値ではなく最大RGB成分です。
export function runExample() {
  const colors: RGB[] = [[255, 0, 0], [255, 128, 0], [128, 128, 128]]
  return colors.map(rgb => {
    const hsv = rgbToHsv(rgb)
    const restored = hsvToRgb(...hsv)
    return { RGB: rgb, HSV: hsv, restored }
  })
}
// 灰色ではS=0となり、色相は未定義です（この実装では0）。
// 核心の最大値・最小値による計算は共通color.tsで読めます。
