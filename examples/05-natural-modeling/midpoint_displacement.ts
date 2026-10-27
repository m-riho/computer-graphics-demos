/** 各区間の中点へ乱数変位を加える1D地形。 */
import { midpointStages } from '../../packages/cg-algorithms/src/nature-rules.ts'

export function runExample() {
  const iterations = 4
  const seed = 7
  const amplitude = .8
  const decay = .5
  // h_m = (h_a + h_b)/2 + epsilon
  // epsilonの範囲は初回±amplitude。各段階でdecay倍する。
  const stages = midpointStages(iterations, seed, amplitude, decay)
  return {
    seed,
    pointsPerStage: stages.map(heights => heights.length),
    firstSubdivision: stages[1],
    finalHeights: stages[iterations],
    // 同じseedなら生成順も結果も同じになる。
    reproduced: JSON.stringify(stages) === JSON.stringify(midpointStages(iterations, seed, amplitude, decay)),
  }
}
