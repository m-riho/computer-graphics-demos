import { metaballContribution, metaballField, type FieldBall, type Point2 } from '../../packages/cg-algorithms/src/nature-fields.ts'

/** 影響値を足すことで、1つずつでは届かない等値線が中央でつながる。 */
export function runExample() {
  const balls: FieldBall[] = [
    { center:[0,0], radius:2, weight:1 },
    { center:[2,0], radius:2, weight:1 },
  ]
  const point: Point2 = [1,0]
  const threshold = .6
  const contributions = balls.map(ball=>metaballContribution(point,ball))
  // 各寄与は (1−1²/2²)³ = 0.421875。合計は 0.84375。
  const field = metaballField(point,balls)
  return {
    point, threshold, contributions, field,
    inside:field>=threshold,
    interpretation:'各寄与 < τ でも、和が τ を超えると首がつながる。',
  }
}
