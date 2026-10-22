import { booleanCSG, createPrimitive } from '../../packages/cg-algorithms/src/csg'

export function runExample() {
  // 入力：外向きの面で閉じた2つの立体。
  const block = createPrimitive('cube')
  const cutter = createPrimitive('cylinder', {
    position: [0, 0, 0],
    scale: 0.7,
    segments: 16,
  })

  // BSPは面を平面で分割し、内外に応じて残す面を決める。
  // 曲面は多面体近似。厳密なCAD用Booleanではない。
  const difference = booleanCSG(block, cutter, 'a-b')
  const intersection = booleanCSG(block, cutter, 'intersection')
  return {
    difference: { vertices: difference.vertices.length, faces: difference.faces.length },
    intersection: { vertices: intersection.vertices.length, faces: intersection.faces.length },
  }
}
