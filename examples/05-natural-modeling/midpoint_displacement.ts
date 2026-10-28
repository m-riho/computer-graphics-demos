/** 線分と三角形で、同じ「中点平均＋乱数変位」を使う。 */
import { midpointStages, triangleMidpointStages } from '../../packages/cg-algorithms/src/nature-rules.ts'

export function runExample() {
  const iterations = 3
  const seed = 7
  const amplitude = .8
  const decay = .5
  // h_m = (h_a + h_b)/2 + epsilon。変位幅は段階ごとにdecay倍。
  const line = midpointStages(iterations, seed, amplitude, decay)
  // 三角形の各辺を二分し、1枚を4枚へ。共有辺の中点は一度だけ生成する。
  // 底面はXZ、高さはY。元の頂点は動かさず、新しい中点だけ変位させる。
  const triangles = triangleMidpointStages(iterations, seed, amplitude, decay)
  return {
    seed,
    linePointsPerStage: line.map(heights => heights.length),
    triangleCounts: triangles.map(({mesh}) => ({ vertices: mesh.vertices.length, faces: mesh.faces.length })),
    // 最初の3つの中点：どの辺から作り、どれだけ高さをずらしたか。
    firstMidpoints: triangles[1].midpoints,
    firstVertices: triangles[1].mesh.vertices,
    reproduced: JSON.stringify(triangles) === JSON.stringify(triangleMidpointStages(iterations, seed, amplitude, decay)),
  }
}
