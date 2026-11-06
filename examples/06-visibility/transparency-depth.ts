import { traceLayers, type ColorLayer } from '../../packages/cg-algorithms/src/visibility-labs.ts'

export function runExample() {
  const layers: ColorLayer[] = [
    { id: 'A', depth: 3, color: [20, 103, 167], alpha: 0.5 },
    { id: 'B', depth: 7, color: [216, 112, 28], alpha: 0.5 },
  ]
  // 深度書込みを切り、白い背景に両方の面を重ねる。
  return [layers, [...layers].reverse()].map(order => ({
    order: order.map(layer => layer.id),
    color: traceLayers(order, [255, 255, 255], 'LESS', false).at(-1)?.color,
  }))
}
