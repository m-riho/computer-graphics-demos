/** Geometry and color operations shared by the lecture 07 renderer and tests. */
export type ShadingVector = [number, number, number]
export function normalizeShading(v: ShadingVector): ShadingVector {
  const length = Math.hypot(...v)
  return length > 1e-12 ? v.map(x => x / length) as ShadingVector : [0, 1, 0]
}
export function crossShading(a: ShadingVector, b: ShadingVector): ShadingVector {
  return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
}
const subtract = (a: ShadingVector,b: ShadingVector): ShadingVector => [a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const dot = (a: ShadingVector,b: ShadingVector) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
/** Polar angle measured from +Y; azimuth 0 is +Z and azimuth 90 is +X. */
export function directionFromAngles(polar: number, azimuth = 0): ShadingVector {
  const p=polar*Math.PI/180,a=azimuth*Math.PI/180
  return [Math.sin(p)*Math.sin(a),Math.cos(p),Math.sin(p)*Math.cos(a)]
}
export const srgbToLinear = (value: number) => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4
export const linearToSrgb = (value: number) => value <= .0031308 ? 12.92*value : 1.055*value**(1/2.4)-.055
export function linearColor(hex: string): ShadingVector {
  const color=/^#[0-9a-f]{6}$/i.test(hex)?hex:'#619bd1'
  return [1,3,5].map(i=>srgbToLinear(parseInt(color.slice(i,i+2),16)/255)) as ShadingVector
}
export interface ShadingMesh { positions: Float32Array; normals: Float32Array; faceNormals: Float32Array; centroids: Float32Array }
export function createShadingSphere(subdivisions=3): ShadingMesh {
  const t=(1+Math.sqrt(5))/2
  const vertices: ShadingVector[] = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>normalizeShading(v as ShadingVector))
  let faces: ShadingVector[][] = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]].map(f=>f.map(i=>vertices[i]!))
  for(let level=0;level<Math.max(0,Math.min(3,Math.round(subdivisions)));level++) {
    const midpoint=(a:ShadingVector,b:ShadingVector)=>normalizeShading([a[0]+b[0],a[1]+b[1],a[2]+b[2]])
    faces=faces.flatMap(([a,b,c])=>{const ab=midpoint(a!,b!),bc=midpoint(b!,c!),ca=midpoint(c!,a!);return [[a!,ab,ca],[b!,bc,ab],[c!,ca,bc],[ab,bc,ca]]})
  }
  const positions:number[]=[],normals:number[]=[],faceNormals:number[]=[],centroids:number[]=[]
  for(const [a,b,c] of faces) {
    const n=normalizeShading(crossShading(subtract(b!,a!),subtract(c!,a!)))
    const center:ShadingVector=[(a![0]+b![0]+c![0])/3,(a![1]+b![1]+c![1])/3,(a![2]+b![2]+c![2])/3]
    for(const v of [a!,b!,c!]) {positions.push(...v);normals.push(...v);faceNormals.push(...n);centroids.push(...center)}
  }
  return {positions:new Float32Array(positions),normals:new Float32Array(normals),faceNormals:new Float32Array(faceNormals),centroids:new Float32Array(centroids)}
}
/** AO = obscured cosine-weighted hemisphere fraction, finite radius 2 world units.
 * Rays intersect a unit sphere and (optionally) the plane Y=-1. It is independent
 * of the direct light, so moving the light cannot change this occlusion factor.
 */
export function ambientOcclusion(position: ShadingVector, normal: ShadingVector, floor: boolean, samples=32): number {
  if(!floor) return 0 // A convex sphere cannot occlude its own outward hemisphere.
  const n=normalizeShading(normal),t=normalizeShading(crossShading(Math.abs(n[1])<.95?[0,1,0]:[1,0,0],n)),b=crossShading(n,t)
  const origin=position.map((x,i)=>x+n[i]!*.002) as ShadingVector
  let occluded=0
  for(let i=0;i<samples;i++) {
    const radius=Math.sqrt((i+.5)/samples),phi=i*2.399963229728653
    const local=[radius*Math.cos(phi),radius*Math.sin(phi),Math.sqrt(1-radius*radius)]
    const ray=t.map((x,j)=>x*local[0]!+b[j]!*local[1]!+n[j]!*local[2]!) as ShadingVector
    const halfB=dot(origin,ray),disc=halfB*halfB-dot(origin,origin)+1
    const sphereHit=disc>=0 ? -halfB-Math.sqrt(disc) : -1
    const planeHit=ray[1]<-1e-8 ? (origin[1]<=-1 ? .002 : (-1-origin[1])/ray[1]) : -1
    if((sphereHit>.001&&sphereHit<2)||(planeHit>.001&&planeHit<2)) occluded++
  }
  return occluded/samples
}
