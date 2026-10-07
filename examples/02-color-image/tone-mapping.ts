import { toneMap } from '../../packages/cg-algorithms/src/index.ts'

// 相対輝度を露出で調整してから、単純Reinhardで表示範囲へ収めます。
// 最後にsRGB符号値へ変換し、通常のディスプレイで比較します。
export function runExample() {
  const luminances: number[] = [0.01, 0.18, 1, 4, 16]
  const exposure: number = 0
  return luminances.map(luminance => ({
    luminance,
    clipped: toneMap(luminance, exposure, false).linear,
    compressed: toneMap(luminance, exposure, true).linear,
    screenByte: toneMap(luminance, exposure, true).encodedByte,
  }))
}
// クリップは1以上を同じ白にしますが、Reinhardは明部の差を残します。
// 入力は相対値であり、HDRディスプレイ自体を再現するものではありません。
