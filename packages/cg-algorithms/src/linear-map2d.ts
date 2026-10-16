/** Column-vector convention. u and v are images of (1,0) and (0,1). */
export type Vector2 = readonly [number, number]
function checkVector(p: Vector2): void {
  if (!Array.isArray(p) || p.length !== 2 || !Array.from(p).every(Number.isFinite))
    throw new RangeError('2つの有限な数で2次元ベクトルを指定します')
}
/** Row-major storage: the first column is u, the second column is v. */
export function matrixFromBasis2D(u: Vector2, v: Vector2): [number, number, number, number] {
  checkVector(u); checkVector(v)
  return [u[0], v[0], u[1], v[1]]
}
/** f(x e1 + y e2) = x f(e1) + y f(e2). No inverse is needed, even if det = 0. */
export function linearMap2D(u: Vector2, v: Vector2, p: Vector2) {
  const matrix = matrixFromBasis2D(u, v)
  checkVector(p)
  const xPart: Vector2 = [p[0] * u[0], p[0] * u[1]]
  const yPart: Vector2 = [p[1] * v[0], p[1] * v[1]]
  const image: Vector2 = [xPart[0] + yPart[0], xPart[1] + yPart[1]]
  const determinant = u[0] * v[1] - u[1] * v[0]
  if (![...xPart, ...yPart, ...image, determinant].every(Number.isFinite))
    throw new RangeError('計算結果が数値の範囲を超えています')
  return { matrix, xPart, yPart, image, determinant }
}
