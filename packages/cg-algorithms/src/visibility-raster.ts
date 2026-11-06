import type { Vec2, Vec3 } from './matrix4.ts'

// 平行投影した教材座標。x は右、y は下、z はカメラ面から奥へ測った距離。
export interface VisibilityTriangle { id: string; vertices: [Vec3, Vec3, Vec3] }
export interface VisibilityCamera { near: number; far: number }
export interface VisibilityScene {
  width: number
  height: number
  camera: VisibilityCamera
  triangles: VisibilityTriangle[]
}
export type ScenePreset = 'ordered' | 'crossing' | 'cycle' | 'lecture'
export interface Fragment { x: number; y: number; faceId: string; depth: number }
export type ColorBuffer = (string | null)[]
export type DepthBuffer = number[]
export interface VisibilityResult { color: ColorBuffer; depth: DepthBuffer }
export interface DepthDecision extends Fragment { stored: number; accepted: boolean }
export const VISIBILITY_EPSILON = 1e-9

/** 各プリセットの全方式が同じ頂点、カメラ、標本格子を参照する。 */
export function makeVisibilityScene(preset: ScenePreset): VisibilityScene {
  const camera = { near: 0, far: 32 }
  if (preset === 'lecture' || preset === 'ordered') {
    // p.33–36 の正面図。図の枠の左上から一辺40のセル単位に変換した頂点。
    const [a,b,c] = preset === 'lecture' ? [8,5,12] : [12,8,5]
    return { width: 7, height: 5, camera, triangles: [
      { id: 'A', vertices: [[0.15,4.8,a], [2.5,0.12,a], [6.3,3.4,a]] },
      { id: 'B', vertices: [[0.8,1.55,b], [6.8,0.15,b], [4.85,4.92,b]] },
      { id: 'C', vertices: [[0.3,0.38,c], [6.83,2.95,c], [0.6,4.92,c]] },
    ] }
  }
  if (preset === 'crossing') {
    // 投影が一致する2面。左端と右端で深度順が反転する。
    return { width: 16, height: 12, camera, triangles: [
      { id: 'A', vertices: [[0.4,11.6,3], [7.8,0.4,7], [15.6,11.6,11]] },
      { id: 'B', vertices: [[0.4,11.6,11], [7.8,0.4,7], [15.6,11.6,3]] },
    ] }
  }
  // 右下ではAがBより手前、上ではBがCより手前、左下ではCがAより手前。
  return { width: 24, height: 18, camera, triangles: [
    { id: 'A', vertices: [[0,12,12], [0,17,12], [24,14,2.4]] },
    { id: 'B', vertices: [[7,0,2], [20,18,11.9], [24,16,10.8]] },
    { id: 'C', vertices: [[17,0,13], [1,17,3.65], [6,18,3.1]] },
  ] }
}

type Point = Vec2 | Vec3
/** 有向辺 AB と標本 P の相対位置。符号がどちら側にあるかを表す。 */
export function edgeFunction(a: Point, b: Point, p: Point): number {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
}

function isTopLeft(a: Vec3, b: Vec3): boolean {
  const dy = b[1] - a[1]
  return dy < 0 || (dy === 0 && b[0] > a[0])
}

/** 辺値・重心係数は A,B,C の対辺の順。頂点順を反転しても採用標本は同じ。 */
export function sampleTriangle(vertices: [Vec3, Vec3, Vec3], point: Vec2) {
  const [a,b,c] = vertices
  const area = edgeFunction(a,b,c)
  if (Math.abs(area) <= VISIBILITY_EPSILON) return null
  const sign = Math.sign(area)
  const edges: Vec3 = [sign * edgeFunction(b,c,point), sign * edgeFunction(c,a,point), sign * edgeFunction(a,b,point)]
  const directedEdges: [Vec3,Vec3][] = [[b,c],[c,a],[a,b]]
  const included = directedEdges.map(([start,end]) => sign > 0 ? isTopLeft(start,end) : isTopLeft(end,start)) as [boolean,boolean,boolean]
  const covered = edges.every((value,i) => value > VISIBILITY_EPSILON || (Math.abs(value) <= VISIBILITY_EPSILON && included[i]))
  const weights = edges.map(value => value / Math.abs(area)) as Vec3
  // λA + λB + λC = 1。定深度平面で丸め誤差を増やさない差分形式。
  const depth = a[2] + weights[1] * (b[2]-a[2]) + weights[2] * (c[2]-a[2])
  return { edges, included, covered, weights, depth }
}

/** 画面内の外接矩形を走査し、各画素中心を一度調べる。 */
export function rasterizeTriangle(scene: VisibilityScene, triangle: VisibilityTriangle): Fragment[] {
  const xs = triangle.vertices.map(v => v[0])
  const ys = triangle.vertices.map(v => v[1])
  const left = Math.max(0, Math.ceil(Math.min(...xs) - 0.5))
  const right = Math.min(scene.width-1, Math.floor(Math.max(...xs) - 0.5))
  const top = Math.max(0, Math.ceil(Math.min(...ys) - 0.5))
  const bottom = Math.min(scene.height-1, Math.floor(Math.max(...ys) - 0.5))
  const fragments: Fragment[] = []
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const sample = sampleTriangle(triangle.vertices, [x+0.5, y+0.5])
      if (sample?.covered && scene.camera.near < sample.depth && sample.depth <= scene.camera.far) {
        fragments.push({ x, y, faceId: triangle.id, depth: sample.depth })
      }
    }
  }
  return fragments
}

export function passesDepth(candidate: number, stored: number, rule: 'LESS' | 'LEQUAL' = 'LESS'): boolean {
  return rule === 'LESS' ? candidate < stored : candidate <= stored
}

function emptyBuffers(scene: VisibilityScene): VisibilityResult {
  const count = scene.width * scene.height
  return { color: Array(count).fill(null), depth: Array(count).fill(Infinity) }
}

/** 1画素の更新前深度と採否を記録しながら、全画素のバッファを更新する。 */
export function replayDepth(scene: VisibilityScene, fragments: Fragment[], selected = -1) {
  const { color, depth } = emptyBuffers(scene)
  const history: DepthDecision[] = []
  for (const fragment of fragments) {
    const pixel = fragment.y * scene.width + fragment.x
    const stored = depth[pixel]
    const accepted = passesDepth(fragment.depth, stored)
    if (pixel === selected) history.push({ ...fragment, stored, accepted })
    if (accepted) {
      color[pixel] = fragment.faceId
      depth[pixel] = fragment.depth
    }
  }
  return { color, depth, history }
}

export function renderZBuffer(scene: VisibilityScene, triangles = scene.triangles): VisibilityResult {
  const fragments = triangles.flatMap(face => rasterizeTriangle(scene, face))
  const { color, depth } = replayDepth(scene, fragments)
  return { color, depth }
}

/** 面の描画順に無条件で上書きする。最後に塗った面の ID が残る。 */
export function renderPainter(scene: VisibilityScene, triangles = scene.triangles): { color: ColorBuffer } {
  const color: ColorBuffer = Array(scene.width * scene.height).fill(null)
  for (const triangle of triangles) {
    for (const fragment of rasterizeTriangle(scene, triangle)) {
      color[fragment.y * scene.width + fragment.x] = triangle.id
    }
  }
  return { color }
}

export function faceColor(id: string | null): string {
  const colors: Record<string,string> = { A: '#b8d8f2', B: '#fac6a6', C: '#a2ddd1' }
  return id === null ? '#ffffff' : colors[id] ?? '#dbd4eb'
}
