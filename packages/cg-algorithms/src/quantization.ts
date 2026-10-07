import { clamp, finiteOr } from './number.ts'
/** 0〜1の成分を2^bits段階へ。位置・画素数は変えない。 */
export function quantize(value: number, bits: number): number {
  const levels = 2 ** Math.round(clamp(finiteOr(bits, 8), 1, 8))
  return Math.round(clamp(value) * (levels - 1)) / (levels - 1)
}
export function quantizeRgba(source: Uint8ClampedArray, bits: number): Uint8ClampedArray {
  if (source.length % 4 !== 0) throw new RangeError('RGBAデータは4成分単位で指定してください')
  const result = new Uint8ClampedArray(source)
  for (let i = 0; i < result.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      result[i + channel] = 255 * quantize(source[i + channel] / 255, bits)
    }
  }
  return result // αと元配列は変更しない。
}
