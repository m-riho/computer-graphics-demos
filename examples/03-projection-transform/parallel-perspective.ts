import { projectParallel, projectPerspective } from '../../packages/cg-algorithms/src/projection.ts'
import type { Vec3 } from '../../packages/cg-algorithms/src/matrix4.ts'

export function runExample() {
  // 右手系のカメラ座標。前方は -Z なので、z=-8 は z=-4 より遠い。
  // 同じ長さ2の辺を、二つの奥行きに置いて比較する。
  const nearLeft: Vec3 = [-1, 0, -4]
  const nearRight: Vec3 = [1, 0, -4]
  const farLeft: Vec3 = [-1, 0, -8]
  const farRight: Vec3 = [1, 0, -8]
  const points = [nearLeft, nearRight, farLeft, farRight]

  const parallel = points.map(point => projectParallel(point))
  const perspective = points.map(point => projectPerspective(point, 90, 1))
  const parallelNearWidth = parallel[1][0] - parallel[0][0]
  const parallelFarWidth = parallel[3][0] - parallel[2][0]
  // この例では全点が視点の前にあるので、結果は null にならない。
  const perspectiveNearWidth = perspective[1]![0] - perspective[0]![0]
  const perspectiveFarWidth = perspective[3]![0] - perspective[2]![0]

  // 平行では2と2。透視では0.5と0.25：距離が2倍なら大きさは半分。
  return { parallelNearWidth, parallelFarWidth, perspectiveNearWidth, perspectiveFarWidth }
}
