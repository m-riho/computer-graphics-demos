import { kochCurve, sierpinskiTriangles, escapeTime } from '../../packages/cg-algorithms/src/nature-fractals.ts'

/** 幾何規則の反復と、複素数の漸化式の反復を比較する。 */
export function runExample() {
  const iteration = 3
  const koch = kochCurve(iteration)
  const triangles = sierpinskiTriangles(iteration)
  const limit = 80
  return {
    iteration,
    kochSegments:koch.length-1, // 4³ = 64 本
    sierpinskiTriangles:triangles.length, // 3³ = 27 個
    // Mandelbrot: z₀=0、評価位置が c。
    mandelbrotOrigin:escapeTime([0,0],[0,0],limit),
    mandelbrotOutside:escapeTime([0,0],[2,0],limit),
    // Julia: 評価位置が z₀、全画素で c を固定。
    juliaSample:escapeTime([1,0],[-.8,.156],limit),
    limit,
    interpretation:'戻り値=limit は、上限まで発散を検出しなかったという近似。',
  }
}
