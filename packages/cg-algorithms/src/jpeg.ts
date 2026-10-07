import { clamp, finiteOr } from './number.ts'
const scale = (frequency: number): number => frequency === 0 ? 1 / Math.sqrt(2) : 1
const basis = (position: number, frequency: number): number =>
  Math.cos((2 * position + 1) * frequency * Math.PI / 16)
function validate(block: readonly number[]): void {
  if (block.length !== 64 || !block.every(Number.isFinite)) throw new RangeError('有限値64個の8×8ブロックが必要です')
}
/** 8×8輝度を128中心に移し、直交DCTで周波数成分へ変換。係数[0]はDC。 */
export function dctBlock(pixels: readonly number[]): number[] {
  validate(pixels)
  return Array.from({ length: 64 }, (_, i) => {
    const u = i % 8, v = Math.floor(i / 8)
    let sum = 0
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      sum += (pixels[y * 8 + x] - 128) * basis(x, u) * basis(y, v)
    }
    return scale(u) * scale(v) * sum / 4
  })
}
/** 同一刻みの模式量子化。実際のJPEGの周波数別量子化表とは異なる。 */
export function quantizeDct(coefficients: readonly number[], step: number): number[] {
  validate(coefficients)
  const safeStep = clamp(finiteOr(step, 1), 1, 255)
  return coefficients.map(value => Math.round(value / safeStep))
}
export function idctBlock(coefficients: readonly number[]): number[] {
  validate(coefficients)
  return Array.from({ length: 64 }, (_, i) => {
    const x = i % 8, y = Math.floor(i / 8)
    let sum = 0
    for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) {
      sum += scale(u) * scale(v) * coefficients[v * 8 + u] * basis(x, u) * basis(y, v)
    }
    return 128 + sum / 4
  })
}
/** ブラウザ品質とは別の教材用対応。品質が低いほど量子化を粗くする。 */
export function jpegQuantizationStep(quality: number): number {
  return 1 + Math.round((1 - clamp(finiteOr(quality, 0.15))) * 79)
}
export function makeJpegBlock(): number[] {
  return Array.from({ length: 64 }, (_, i) => 30 + (i % 8 < 4 ? 0 : 140) + Math.floor(i / 8) * 8)
}
