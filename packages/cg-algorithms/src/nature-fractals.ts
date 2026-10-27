import { seededRandom } from './natural-modeling.ts'
import type { Point2 } from './nature-fields.ts'

export function boundedInteger(value: number, min: number, max: number, fallback = min): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback
}
/** 1本を4本へ。正三角形の山を中央1/3に挿入する。 */
export function kochCurve(iteration: number): Point2[] {
  let points: Point2[] = [[0,0], [1,0]]
  for (let level = 0; level < boundedInteger(iteration,0,6); level++) {
    const next: Point2[] = [points[0]]
    for (let i = 1; i < points.length; i++) {
      const a = points[i-1], b = points[i], dx = (b[0]-a[0])/3, dy = (b[1]-a[1])/3
      next.push([a[0]+dx,a[1]+dy], [a[0]+1.5*dx-Math.sqrt(3)/2*dy,a[1]+1.5*dy+Math.sqrt(3)/2*dx], [a[0]+2*dx,a[1]+2*dy], b)
    }
    points = next
  }
  return points
}
export type Triangle2 = [Point2, Point2, Point2]
export function sierpinskiTriangles(iteration: number): Triangle2[] {
  let triangles: Triangle2[] = [[[0,0],[1,0],[.5,Math.sqrt(3)/2]]]
  const middle = (a: Point2,b: Point2): Point2 => [(a[0]+b[0])/2,(a[1]+b[1])/2]
  for (let level = 0; level < boundedInteger(iteration,0,6); level++) {
    const next: Triangle2[] = []
    for (const [a,b,c] of triangles) {
      const ab=middle(a,b), bc=middle(b,c), ca=middle(c,a)
      next.push([a,ab,ca],[ab,b,bc],[ca,bc,c])
    }
    triangles = next
  }
  return triangles
}
/** z←z²+c を反復。戻り値=limit は「この回数では発散を検出しない」。 */
export function escapeTime(initial: Point2, c: Point2, limit: number): number {
  if (![...initial,...c].every(Number.isFinite)) return 0
  limit = boundedInteger(limit,1,400,80)
  // Julia で |c|>2 も許すため、固定の2ではなく安全な逃走半径を用いる。
  const radiusSquared = Math.max(4, c[0]*c[0]+c[1]*c[1])
  let [x,y] = initial
  for (let n = 0; n < limit; n++) {
    const nextX = x*x-y*y+c[0]
    y = 2*x*y+c[1]; x = nextX
    if (x*x+y*y > radiusSquared) return n+1
  }
  return limit
}
export const FERN_TRANSFORMS = [
  { probability:.01, a:0, b:0, c:0, d:.16, e:0, f:0, label:'茎' },
  { probability:.85, a:.85, b:.04, c:-.04, d:.85, e:0, f:1.6, label:'全体を縮小' },
  { probability:.07, a:.20, b:-.26, c:.23, d:.22, e:0, f:1.6, label:'左の小葉' },
  { probability:.07, a:-.15, b:.28, c:.26, d:.24, e:0, f:.44, label:'右の小葉' },
] as const
/** x',y' の両方を変更前の x,y から計算する。係数は第5回の付録と共通。 */
export function fernTransform([x,y]: Point2, index: number): Point2 {
  const t = FERN_TRANSFORMS[boundedInteger(index,0,3)]
  return [t.a*x+t.b*y+t.e, t.c*x+t.d*y+t.f]
}
export type FernPoint = { point: Point2; transform: number }
/** 最初の20点を過渡状態として除外。出力点数とSeedが同じなら常に同じ点列。 */
export function fernPoints(count: number, seed: number): FernPoint[] {
  count = boundedInteger(count,0,100000)
  const random = seededRandom(Number.isFinite(seed) ? seed : 42), result: FernPoint[] = []
  let point: Point2 = [0,0]
  for (let k = 0; k < count+20; k++) {
    const r = random(); let index = 0, cumulative = FERN_TRANSFORMS[0].probability as number
    while (r >= cumulative && index < 3) { index++; cumulative += FERN_TRANSFORMS[index].probability }
    point = fernTransform(point,index)
    if (k >= 20) result.push({ point, transform:index })
  }
  return result
}
