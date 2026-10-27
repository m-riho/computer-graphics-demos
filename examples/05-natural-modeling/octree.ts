/** 3Dで各軸を半分にすると、子は2×2×2 = 8個。 */
import { voxelGrid, shapeOccupancy, buildOctree, flattenTree, treeStats } from '../../packages/cg-algorithms/src/nature-spatial.ts'
export function runExample() {
  // 解析的なSphereの内外を、8³個のcell中心で標本化する。
  const grid = voxelGrid(3, shapeOccupancy('sphere'))
  const tree = buildOctree(grid)
  const occupiedLeaves = flattenTree(tree).filter(node => !node.children.length && node.value === 1)
  // 大きさsの葉が、元Gridのs³個のcellをまとめて表す。
  const reconstructedOccupied = occupiedLeaves.reduce((sum, node) => sum + node.size ** 3, 0)
  return {
    uniformGridCells: grid.data.length,
    occupiedGridCells: grid.data.filter(value => value === 1).length,
    octree: treeStats(tree),
    reconstructedOccupied,
    observation: '一様領域は統合されるが、境界付近には小さい葉が残る。',
  }
}
