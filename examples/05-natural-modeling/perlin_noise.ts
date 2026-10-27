/** 教員Notebookと同じ8方向の単位勾配・NumPy RandomState互換shuffle。 */
import { Perlin2D, noiseToGray } from '../../packages/cg-algorithms/src/nature-noise.ts'

export function runExample() {
  const noise = new Perlin2D(0)
  const x = 2.3, y = 3.7
  // 隅から評価点への変位、勾配との内積、fadeによる補間を観察する。
  const step = noise.details(x, y)
  // octaveごとに周波数を2倍、振幅を0.5倍にして足す。
  const fractalSigned = noise.fractal(x, y, 6, .5, 2)
  return {
    point: [x, y],
    cell: step.cell,
    gradients: step.gradients,
    displacements: step.displacements,
    dots: step.dots,
    fadeWeights: step.weights,
    xInterpolations: step.rows,
    signedValue: step.value, // -0.23926379486292323 (浮動小数の丸め差のみ)
    displayGray: noiseToGray(step.value),
    fractalSigned,
    fractalGray: noiseToGray(fractalSigned), // 表示変換は合成後に1回
  }
}
