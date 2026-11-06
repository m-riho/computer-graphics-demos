import type { Vec2 } from './matrix4.ts'

/** 平行投影した断面を奥から手前へ並べる。x, y は −1〜1、z は高さ。 */
export function waveSections(count: number, elevation: number, phase: number): Vec2[][] {
  const angle = elevation * Math.PI / 180
  return Array.from({ length: count }, (_, row) => {
    const y = 1 - 2 * row / (count - 1)
    return Array.from({ length: 81 }, (_, column): Vec2 => {
      const x = column / 40 - 1
      const crest = x - 0.38 * Math.sin(2.4 * y + phase)
      const ripple = x + 0.54 + 0.15 * Math.cos(3 * y - phase)
      const z = 1 / (1 + 60 * crest ** 2) + 0.45 / (1 + 90 * ripple ** 2)
      return [320 + 220 * x + 64 * y,
        180 - (92 * y - 25 * x) * Math.sin(angle) - 112 * z * Math.cos(angle)]
    })
  })
}

/** 隣り合う断面の間を三角形で覆う。投影で面が折り重なっても塗りが相殺されないよう、
 *  SVG の nonzero 塗りで使う全三角形の頂点順を画面上でそろえる。 */
export function stripTriangles(back: Vec2[], front: Vec2[]): Vec2[][] {
  const triangles: Vec2[][] = []
  function add(a: Vec2, b: Vec2, c: Vec2) {
    const area = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])
    if (area !== 0) triangles.push(area > 0 ? [a,b,c] : [a,c,b])
  }
  for (let i = 1; i < back.length; i++) {
    add(back[i-1], back[i], front[i])
    add(back[i-1], front[i], front[i-1])
  }
  return triangles
}
