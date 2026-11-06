import { sampleTriangle, type VisibilityTriangle } from '../../packages/cg-algorithms/src/visibility-raster.ts'

export function runExample() {
  const vertices: VisibilityTriangle['vertices'] = [[1, 1, 0.2], [5, 1, 0.6], [1, 5, 1]]
  // 画素 (2, 1) の中心で、各頂点の対辺の値、重み、補間深度を読む。
  return sampleTriangle(vertices, [2.5, 1.5])
}
