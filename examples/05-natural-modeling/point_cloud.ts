/** 同じMeshから「元頂点」と「表面サンプル点」を比較する。 */
import { torusMesh, sampleMesh } from '../../packages/cg-algorithms/src/natural-modeling.ts'
import { voxelizeMesh } from '../../packages/cg-algorithms/src/nature-spatial.ts'
export function runExample() {
  const mesh = torusMesh(40, 12)
  // 三角形を面積に比例する確率で選び、重心座標で面内を一様に標本化。
  // 同じseedなら同じ点が得られる。元頂点の抽出ではない。
  const points = sampleMesh(mesh, 1000, 42)
  // 閉じたMeshへのray交差で、16³ cellの中心が内側か判定する。
  const voxels = voxelizeMesh(mesh, 4)
  return {
    meshVertices: mesh.vertices.length,
    meshFaces: mesh.faces.length,
    surfaceSamples: points.length,
    firstThreeSamples: points.slice(0, 3),
    gridCells: voxels.data.length,
    occupiedCells: voxels.data.filter(value => value === 1).length,
  }
}
