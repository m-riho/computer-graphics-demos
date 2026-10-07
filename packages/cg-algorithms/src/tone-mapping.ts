import { clamp, finiteOr } from './number.ts'
import { srgbEncode } from './gamma.ts'
/** 非負の相対輝度を0〜1へ圧縮する単純Reinhard。 */
export function reinhard(luminance: number): number {
  const value = clamp(luminance, 0, 1e12)
  return value / (1 + value)
}
export function toneMap(luminance: number, exposure: number, enabled = true):
  { exposed: number; linear: number; encodedByte: number } {
  const exposed = clamp(luminance, 0, 1e12) * 2 ** clamp(finiteOr(exposure, 0), -32, 32)
  const linear = enabled ? reinhard(exposed) : clamp(exposed)
  return { exposed, linear, encodedByte: Math.round(255 * srgbEncode(linear)) }
}
