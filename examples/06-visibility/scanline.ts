import { makeScanlineTriangles, scanlineSpan, scanVisibleSpans } from '../../packages/cg-algorithms/src/visibility-labs.ts'

export function runExample() {
  const triangles = makeScanlineTriangles()
  const y = 2.5
  // 各面の候補区間と、深度比較後の可視区間を同じ行で比べる。
  return {
    covered: triangles.map(face => ({ face: face.id, span: scanlineSpan(face.vertices, y) })),
    visible: scanVisibleSpans(triangles, y),
  }
}
