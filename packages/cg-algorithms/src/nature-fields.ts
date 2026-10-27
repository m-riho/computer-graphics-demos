import { sphereSdf, combineSdf } from './natural-modeling.ts'

export type Point2 = [number, number]
export type Circle2 = { center: Point2; radius: number }
export type FieldBall = Circle2 & { weight: number }
export type BooleanOperation = 'union' | 'intersection' | 'difference'

/** 球の z=0 断面。既存の SDF と符号規約を共有する。 */
export function circleDistance(point: Point2, circle: Circle2): number {
  return sphereSdf([...point, 0], [...circle.center, 0], circle.radius)
}
export function evaluateCircleBoolean(point: Point2, a: Circle2, b: Circle2, operation: BooleanOperation) {
  const dA = circleDistance(point, a), dB = circleDistance(point, b)
  return { dA, dB, value: combineSdf(dA, dB, operation) }
}
/** 教育用の有限支持カーネル。中心で weight、半径外で 0、境界で滑らかに 0 へ。 */
export function metaballContribution(point: Point2, ball: FieldBall): number {
  if (!(ball.radius > 0) || !Number.isFinite(ball.radius) || !Number.isFinite(ball.weight)) return 0
  const dx = point[0] - ball.center[0], dy = point[1] - ball.center[1]
  const t = 1 - (dx * dx + dy * dy) / (ball.radius * ball.radius)
  return t > 0 ? Math.max(0, ball.weight) * t * t * t : 0
}
export function metaballField(point: Point2, balls: FieldBall[]): number {
  return balls.reduce((sum, ball) => sum + metaballContribution(point, ball), 0)
}
export type ScalarGrid = { columns: number; rows: number; width: number; height: number; values: number[] }
/** columns×rows 個のセル、その角 (columns+1)×(rows+1) で評価する。 */
export function sampleScalarField(field: (x: number, y: number) => number, columns: number, rows: number, width: number, height: number): ScalarGrid {
  columns = Math.max(1, Math.min(240, Math.floor(columns) || 1))
  rows = Math.max(1, Math.min(160, Math.floor(rows) || 1))
  const values: number[] = []
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) values.push(field(x * width / columns, y * height / rows))
  return { columns, rows, width, height, values }
}
/** 各セルを2三角形へ分割し、辺を線形補間して等値線を近似する。 */
export function contourSegments(grid: ScalarGrid, threshold: number): [Point2, Point2][] {
  const segments: [Point2, Point2][] = []
  const { columns, rows, width, height, values } = grid
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const corners: Point2[] = [[x,y], [x+1,y], [x+1,y+1], [x,y+1]]
    for (const indices of [[0,1,2], [0,2,3]]) {
      const crossings: Point2[] = []
      for (let edge = 0; edge < 3; edge++) {
        const a = corners[indices[edge]], b = corners[indices[(edge+1)%3]]
        const va = values[a[1]*(columns+1)+a[0]], vb = values[b[1]*(columns+1)+b[0]]
        if ((va < threshold) === (vb < threshold)) continue
        const t = (threshold-va)/(vb-va)
        crossings.push([(a[0]+t*(b[0]-a[0]))*width/columns, (a[1]+t*(b[1]-a[1]))*height/rows])
      }
      if (crossings.length === 2) segments.push([crossings[0], crossings[1]])
    }
  }
  return segments
}
