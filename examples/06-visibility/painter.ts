import { makeVisibilityScene, renderPainter, renderZBuffer } from '../../packages/cg-algorithms/src/visibility-raster.ts'

export function runExample() {
  const scene = makeVisibilityScene('crossing')
  const nearest = renderZBuffer(scene).color
  return [scene.triangles, [...scene.triangles].reverse()].map(order => {
    const painted = renderPainter(scene, order).color
    return {
      drawOrder: order.map(face => face.id),
      wrongPixels: painted.filter((id, i) => id !== nearest[i]).length,
    }
  })
}
