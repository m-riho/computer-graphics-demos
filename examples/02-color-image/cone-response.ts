import { coneResponse } from '../../packages/cg-algorithms/src/index.ts'

// 錐体応答を説明する模式モデル。実測感度の再現ではありません。
// 入力の波長（nm）だけを変え、S/M/Lの応答の重なりを比較します。
export function runExample() {
  const wavelengths: number[] = [440, 535, 565, 650]
  return wavelengths.map(wavelength => {
    const [short, medium, long] = coneResponse(wavelength)
    return { wavelength, S: short, M: medium, L: long }
  })
}
// S=青、M=緑、L=赤の光そのものではありません。
// 数値を動物の見え方や色覚診断に使わないでください。
