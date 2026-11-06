import type { RGB } from './color.ts'
import { compositeOverOpaque } from './alpha-blending.ts'
import type { VisibilityTriangle } from './visibility-raster.ts'
import { makeVisibilityScene, passesDepth, sampleTriangle } from './visibility-raster.ts'

type Vertices = VisibilityTriangle['vertices']
type Interval = [number, number]
export type VisibleSpan = { left: number, right: number, faceId: string }

/** 水平辺を飛ばし、上端を含み下端を除く。頂点を通る行でも同じ交点を二度数えない。 */
export function scanlineSpan(vertices: Vertices, y: number): Interval | null {
  const intersections: number[] = []
  for (let i = 0; i < 3; i++) {
    const a = vertices[i], b = vertices[(i + 1) % 3]
    if (y < Math.min(a[1], b[1]) || y >= Math.max(a[1], b[1])) continue
    const t = (y - a[1]) / (b[1] - a[1])
    intersections.push(a[0] + t * (b[0] - a[0]))
  }
  if (intersections.length !== 2) return null
  const [left, right] = intersections.sort((a, b) => a - b)
  return left < right ? [left, right] : null
}

/** 各面の左右端と、重なりの中で二つの深度が等しくなる x で走査線を分割する。 */
export function scanVisibleSpans(triangles: readonly VisibilityTriangle[], y: number): VisibleSpan[] {
  const slices = triangles.flatMap(face => {
    const bounds = scanlineSpan(face.vertices, y)
    if (!bounds) return []
    const [left, right] = bounds
    const start = sampleTriangle(face.vertices, [left, y])
    const end = sampleTriangle(face.vertices, [right, y])
    if (!start || !end) return []
    const slope = (end.depth - start.depth) / (right - left)
    const depthAt = (x: number) => start.depth + (x - left) * slope
    return [{faceId: face.id, left, right, slope, depthAt}]
  })
  const cuts = new Set(slices.flatMap(slice => [slice.left, slice.right]))
  for (let i = 0; i < slices.length; i++) {
    const a = slices[i]
    for (const b of slices.slice(i + 1)) {
      const left = Math.max(a.left, b.left), right = Math.min(a.right, b.right)
      if (left >= right || a.slope === b.slope) continue
      const cross = left + (b.depthAt(left) - a.depthAt(left)) / (a.slope - b.slope)
      if (left < cross && cross < right) cuts.add(cross)
    }
  }
  const ends = [...cuts].sort((a, b) => a - b)
  const spans: VisibleSpan[] = []
  for (let i = 1; i < ends.length; i++) {
    const left = ends[i - 1], right = ends[i], middle = (left + right) / 2
    let nearest = Infinity, faceId: string | undefined
    for (const slice of slices) {
      if (middle < slice.left || middle >= slice.right) continue
      const depth = slice.depthAt(middle)
      if (passesDepth(depth, nearest)) {
        nearest = depth
        faceId = slice.faceId
      }
    }
    if (faceId === undefined) continue
    const previous = spans[spans.length - 1]
    if (previous?.faceId === faceId && previous.right === left) previous.right = right
    else spans.push({left, right, faceId})
  }
  return spans
}

/** p.40 の面 A と、一定深度の面 B を同じ走査線で切る。 */
export function makeScanlineTriangles(): [VisibilityTriangle, VisibilityTriangle] {
  const a = makeVisibilityScene('lecture').triangles[0].vertices
  const b: Vertices = [[.8, 2.9, 0], [4.4, .15, 0], [6.8, 4.9, 0]]
  for (const v of a) v[2] = 1 + v[0]
  for (const v of b) v[2] = 4.5
  return [{id:'A', vertices:a}, {id:'B', vertices:b}]
}

export type ColorLayer = { id: string, depth: number, color: RGB, alpha: number }
export type LayerStep = { id: string, candidate: number, before: number, accepted: boolean, stored: number, color: RGB }

/** 1画素に届いた面を順に処理する。深度テスト、色の合成、深度の書込みを分けて読む。 */
export function traceLayers(layers: readonly ColorLayer[], background: RGB, rule: 'LESS' | 'LEQUAL', writeDepth: boolean): LayerStep[] {
  let color = background, stored = Infinity
  const history: LayerStep[] = []
  for (const layer of layers) {
    const before = stored
    const accepted = passesDepth(layer.depth, stored, rule)
    if (accepted) {
      color = compositeOverOpaque(layer.color, color, layer.alpha)
      if (writeDepth) stored = layer.depth
    }
    history.push({id:layer.id, candidate:layer.depth, before, accepted, stored, color})
  }
  return history
}
