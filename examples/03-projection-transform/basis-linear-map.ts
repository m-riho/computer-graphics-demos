import { linearMap2D, type Vector2 } from '../../packages/cg-algorithms/src/linear-map2d.ts'

export function runExample() {
  // 決めるのは、標準基底 e1=(1,0) と e2=(0,1) の移り先だけ。
  const u: Vector2 = [2, 0]  // f(e1)：行列の第1列
  const v: Vector2 = [1, 1]  // f(e2)：行列の第2列
  const p: Vector2 = [1, 2] // p = 1 e1 + 2 e2
  const result = linearMap2D(u, v, p)
  return {
    basisImages: { u, v },
    matrixRows: [result.matrix.slice(0, 2), result.matrix.slice(2)],
    p,
    xTimesFirstColumn: result.xPart,
    yTimesSecondColumn: result.yPart,
    image: result.image, // 1(2,0) + 2(1,1) = (4,2)
    // 移り先が平行でも写像は決まる。ただし平面が直線につぶれる。
    collapsed: linearMap2D([1,0], [2,0], p).image,
  }
}
