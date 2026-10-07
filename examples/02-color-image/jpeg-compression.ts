import { makeJpegBlock, dctBlock, quantizeDct, idctBlock } from '../../packages/cg-algorithms/src/index.ts'

// JPEGの「周波数成分を粗く丸める」という考え方だけを取り出します。
// 色変換・色差間引き・エントロピー符号化を含むJPEGエンコーダではありません。
export function runExample() {
  const pixels = makeJpegBlock() // 8×8輝度ブロック
  const coefficients = dctBlock(pixels)
  const step: number = 40 // すべての周波数で同じ刻みを使う模式モデル
  const quantized = quantizeDct(coefficients, step)
  const reconstructed = idctBlock(quantized.map(value => value * step))
  return {
    quantizationStep: step,
    zeroCoefficients: quantized.filter(value => value === 0).length,
    beforeFirstRow: pixels.slice(0, 8),
    afterFirstRow: reconstructed.slice(0, 8),
  }
}
// 細かな係数が0になり、情報が失われます。逆変換しても完全には戻りません。
// 実際のJPEGでは周波数別の量子化表なども使います。
