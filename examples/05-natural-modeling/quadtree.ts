/** 2D二値Grid → 一様判定 → 混在部分のみ4分割。 */
import { buildQuadtree, flattenTree, tilePreset, treeStats } from '../../packages/cg-algorithms/src/nature-spatial.ts'
export function runExample() {
  const blocks = buildQuadtree(tilePreset(8, 'blocks'))
  const checkerboard = buildQuadtree(tilePreset(8, 'checkerboard'))
  // buildQuadtreeの再帰順は NW, NE, SW, SE。
  // 一様領域は0/1の葉、混在領域は4つのchildrenを持つ内部ノード。
  return {
    gridCells: 64,
    blocks: treeStats(blocks),
    firstChildren: blocks.children.map(node => ({ id: node.id, value: node.value })),
    checkerboard: treeStats(checkerboard),
    occupiedBlocks: flattenTree(blocks).filter(node => node.value === 1).map(node => ({ x: node.x, y: node.y, size: node.size })),
    observation: 'Checkerboardは全cellまで分割するため、内部ノードの分だけ個数が増える。',
  }
}
