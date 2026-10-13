import {multiplyMatrix4, transformPoint, type Vec3} from '../../packages/cg-algorithms/src/matrix4.ts'
import {translationMatrix} from '../../packages/cg-algorithms/src/transforms3d.ts'
import {cameraMatrix, inverseRigidTransform} from '../../packages/cg-algorithms/src/camera.ts'
import {projectPerspective} from '../../packages/cg-algorithms/src/projection.ts'

export function runExample() {
  const point: Vec3 = [1, 1, 1]
  const model = translationMatrix(0, 0, 0)
  const movingCamera = cameraMatrix([1, 0, 6], 10)
  const view = inverseRigidTransform(movingCamera)
  // A：カメラを移動・回転し、そのカメラから見た座標を求める。
  const cameraA = transformPoint(multiplyMatrix4(view, model), point)

  // B：カメラはC0に固定。対応する変換を物体側に施す。
  const fixedCamera = cameraMatrix([0, 0, 6])
  const modelB = multiplyMatrix4(fixedCamera, multiplyMatrix4(view, model))
  const fixedView = inverseRigidTransform(fixedCamera)
  const cameraB = transformPoint(multiplyMatrix4(fixedView, modelB), point)

  // 同じFOVと画面比率で投影すると一致する。
  // 背景を含む全シーンを対応変換することが条件。
  return {
    cameraA, cameraB,
    imageA:projectPerspective(cameraA, 60, 1.6),
    imageB:projectPerspective(cameraB, 60, 1.6),
  }
}
