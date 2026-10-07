import { quantize } from '../../packages/cg-algorithms/src/index.ts'

// 位置を動かさず、各画素の値だけを少ない段階へ丸めます。
// bits=2なら2^2=4段階。標本化（画素数の変更）とは別処理です。
export function runExample() {
  const values: number[] = [0, 0.1, 0.4, 0.7, 0.9, 1]
  const bits: number = 2
  return values.map(input => ({ input, quantized: quantize(input, bits) }))
}
// 4段階は0, 1/3, 2/3, 1です。
// 丸めによる値の差が量子化誤差です。
