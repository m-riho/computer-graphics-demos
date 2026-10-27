import { circleDistance, evaluateCircleBoolean, type Circle2, type Point2 } from '../../packages/cg-algorithms/src/nature-fields.ts'

/** 負なら内部、0なら境界、正なら外部。 */
export function runExample() {
  const a: Circle2 = { center:[0,0], radius:2 }
  const b: Circle2 = { center:[2,0], radius:2 }
  const point: Point2 = [1,0]
  const dA = circleDistance(point,a) // sqrt(1²+0²)−2 = −1
  const dB = circleDistance(point,b) // sqrt((1−2)²+0²)−2 = −1
  // 同じ評価点で、min / max / max(dA,−dB) を比較する。
  return {
    point, dA, dB,
    union:evaluateCircleBoolean(point,a,b,'union').value,
    intersection:evaluateCircleBoolean(point,a,b,'intersection').value,
    difference:evaluateCircleBoolean(point,a,b,'difference').value,
    interpretation:'両方の円の内部。A−B では取り除かれる。',
  }
}
