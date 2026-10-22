import { createProfile, revolve } from '../../packages/cg-algorithms/src/sweep'

export function runExample() {
  // (r, h) は回転軸からの距離と高さ。
  const profile = createProfile('vase')
  const segments = 16

  // y軸の周囲を1周。軸上の頂点と継ぎ目は共有される。
  const full = revolve(profile, 360, segments, 'y')

  // 途中で止めると、始端・終端の断面にもふたを作る。
  const partial = revolve(profile, 270, segments, 'y')
  return {
    fullTurn: { vertices: full.vertices.length, faces: full.faces.length },
    partialTurn: { vertices: partial.vertices.length, faces: partial.faces.length },
    // segmentsは回転角の分割数。増やすと曲面近似が細かくなる。
    segments,
  }
}
