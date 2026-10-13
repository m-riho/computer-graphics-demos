import {multiplyMatrix4, transformPoint, type Vec3} from '../../packages/cg-algorithms/src/matrix4.ts'
import {translationMatrix, rotationZMatrix} from '../../packages/cg-algorithms/src/transforms3d.ts'

export function runExample() {
  const point: Vec3 = [1, 0, 0]
  const center: Vec3 = [0, 0, 0]
  const rotate = rotationZMatrix(90)
  const translate = translationMatrix(2, 0, 0)
  // 列ベクトルでは右側の行列から適用する。
  const rotateThenTranslate = multiplyMatrix4(translate, rotate)
  const translateThenRotate = multiplyMatrix4(rotate, translate)
  return [
    {
      order:'回転 → 移動', matrix:rotateThenTranslate,
      point:transformPoint(rotateThenTranslate, point), // [2,1,0]
      center:transformPoint(rotateThenTranslate, center), // [2,0,0]
    },
    {
      order:'移動 → 回転', matrix:translateThenRotate,
      point:transformPoint(translateThenRotate, point), // [0,3,0]
      center:transformPoint(translateThenRotate, center), // [0,2,0]
    },
  ]
  // 後者では、移動後の中心もワールド原点のまわりを回る。
}
