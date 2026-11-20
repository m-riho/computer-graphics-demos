import { beamFootprint } from '../../packages/cg-algorithms/src/shading-incidence.ts'

// 光の進行方向に垂直な断面積を1、奥行きを1とした平行光。
// 同じ光量が広い床面へ分散するため、面積と照度は反比例する。
export function runExample() {
  return [0, 30, 60, 80].map(angle => {
    const beam = beamFootprint(angle)
    return { angle, floorArea: beam.floorWidth,
      relativeIlluminance: beam.relativeIlluminance,
      relativeFlux: beam.floorWidth * beam.relativeIlluminance }
  })
}
