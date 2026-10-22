import { analyzeManifold, manifoldPreset, type ManifoldPreset } from '../../packages/cg-algorithms/src/manifold.ts'

/** 辺の面数だけでなく、頂点の近傍も検査する。 */
export function runExample() {
  const cases: ManifoldPreset[] = ['closed', 'open', 'three-faces', 'touching', 'internal']
  return cases.map(name => {
    const mesh = manifoldPreset(name)
    const report = analyzeManifold(mesh)
    return {
      name, kind: report.kind,
      boundaryEdges: report.boundaryEdges.length,
      nonManifoldEdges: report.badEdges.length,
      nonManifoldVertices: report.badVertices,
      components: report.components,
    }
  })
  // touching: 各辺に2面でも、頂点のlinkが2つの輪に分かれる。
  // internal: 独立した内部面は境界つき多様体だが、閉じた固体境界にはならない。
  // この検査は接続構造を対象とし、面どうしの幾何的な交差検査ではない。
}
