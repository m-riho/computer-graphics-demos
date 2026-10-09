import {compositeOverOpaque, type RGB} from '../../packages/cg-algorithms/src/index.ts'

export function runExample() {
  const foreground: RGB = [255, 0, 0] // 赤
  const background: RGB = [0, 0, 255] // 不透明な青
  // alphaだけを変える。同じ赤でも、背景の見え方が変わる。
  return [0, .25, .5, .75, 1].map(alpha => ({
    alpha,
    result: compositeOverOpaque(foreground, background, alpha),
  }))
}
