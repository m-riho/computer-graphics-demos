import {clamp} from './number.ts'
import type {RGB} from './color.ts'

/**
 * 不透明な背景への source-over 合成。RGBは0〜255、alphaは0〜1。
 * この教材ではsRGB符号値をそのまま重み付けし、最後に8 bitへ丸める。
 * 光量を物理的に混ぜる線形光での計算とは区別する。
 */
export function compositeOverOpaque(
  foreground: Readonly<RGB>, background: Readonly<RGB>, alpha: number,
): RGB {
  const opacity = clamp(alpha)
  return foreground.map((channel, i) => Math.round(
    clamp(channel, 0, 255) * opacity + clamp(background[i], 0, 255) * (1 - opacity),
  )) as RGB
}
