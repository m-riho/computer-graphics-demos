import { makeVisibilityScene, rasterizeTriangle, replayDepth } from '../../packages/cg-algorithms/src/visibility-raster.ts'

export function runExample() {
  const scene = makeVisibilityScene('lecture')
  const fragments = scene.triangles.flatMap(face => rasterizeTriangle(scene, face))
  const pixelP = 2 * scene.width + 3
  return replayDepth(scene, fragments, pixelP).history.map(hit => ({
    face: hit.faceId, candidate: hit.depth,
    storedBefore: Number.isFinite(hit.stored) ? hit.stored : '∞',
    accepted: hit.accepted,
    storedAfter: hit.accepted ? hit.depth : hit.stored,
  }))
}
