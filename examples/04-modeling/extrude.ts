import { createProfile, extrude } from '../../packages/cg-algorithms/src/sweep'

export function runExample() {
  // 入力：反時計回りの閉じたL字断面。
  const profile = createProfile('l-shape')
  const distance = 2

  // 各断面頂点を z=-distance/2 と z=+distance/2 に配置。
  // 対応する頂点をつないで側面を作る。
  // 凹んだL字のふたはear clippingで三角形に分割する。
  const mesh = extrude(profile, distance)

  // 頂点の位置（geometry）と面の接続（topology）を確認。
  return {
    profileVertices: profile.length,
    vertices: mesh.vertices.length,
    faces: mesh.faces.length,
    firstSide: mesh.faces[mesh.faces.length - profile.length],
  }
}
