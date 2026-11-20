import { normalizeShading, type ShadingVector } from './shading-geometry.ts'
export type Weights = [number, number, number]
export const lerpValue = (a:number,b:number,t:number):number => (1-t)*a+t*b

/** Three equal-length vertex normals, symmetrically tilted about +Z. */
export function interpolationNormals(spread=1): [ShadingVector,ShadingVector,ShadingVector] {
  const theta=spread*50*Math.PI/180, s=Math.sin(theta), c=Math.cos(theta)
  return [[-Math.sqrt(3)/2*s,-.5*s,c],[Math.sqrt(3)/2*s,-.5*s,c],[0,s,c]]
}
/** Directional light, fixed V=(0,0,1), grayscale linear intensity.
 * The same Blinn–Phong reflection formula is used for both shading methods.
 * Phong Shading describes interpolation, not the choice of reflection model.
 */
export function shadeInterpolationNormal(n:ShadingVector,lightAngle=0,specular=true) {
  const theta=lightAngle*Math.PI/180
  const light:ShadingVector=[Math.sin(theta),0,Math.cos(theta)]
  const half=normalizeShading([light[0],0,light[2]+1])
  const dot=(a:ShadingVector,b:ShadingVector)=>a.reduce((s,x,i)=>s+x*b[i]!,0)
  const ndotl=Math.max(0,dot(n,light))
  const diffuse=(specular?.25:.95)*ndotl
  const highlight=specular && ndotl>0 ? .7*Math.max(0,dot(n,half))**32 : 0
  return { diffuse, specular:highlight, total:.05+diffuse+highlight }
}
export function interpolateShading(weights:Weights,lightAngle=0,spread=1,specular=true) {
  const normals=interpolationNormals(spread)
  const rawNormal=[0,1,2].map(k=>normals.reduce((sum,n,i)=>sum+weights[i]!*n[k]!,0)) as ShadingVector
  const normal=normalizeShading(rawNormal)
  const vertexColors=normals.map(n=>shadeInterpolationNormal(n,lightAngle,specular).total)
  const gouraud=vertexColors.reduce((sum,c,i)=>sum+weights[i]!*c,0)
  const lighting=shadeInterpolationNormal(normal,lightAngle,specular)
  return { rawNormal,normal,vertexColors,gouraud,phong:lighting.total,lighting }
}
/** Closed animation route includes every vertex and the centroid. */
export function interpolationPath(t:number):Weights {
  const route:Weights[]=[[1,0,0],[0,1,0],[0,0,1],[1/3,1/3,1/3],[1,0,0]]
  const at=Math.max(0,Math.min(1,t))*(route.length-1)
  const i=Math.min(route.length-2,Math.floor(at)), f=at-i
  return route[i]!.map((a,k)=>lerpValue(a,route[i+1]![k]!,f)) as Weights
}

/** Barycentric coordinates of a point in a non-degenerate 2D triangle. */
export function triangleWeights(p:readonly number[], vertices:readonly (readonly number[])[]):Weights {
  const [a,b,c]=vertices
  const d=(b![1]!-c![1]!)*(a![0]!-c![0]!)+(c![0]!-b![0]!)*(a![1]!-c![1]!)
  if(Math.abs(d)<1e-12) throw new RangeError('三角形の面積が0です。')
  const wa=((b![1]!-c![1]!)*(p[0]!-c![0]!)+(c![0]!-b![0]!)*(p[1]!-c![1]!))/d
  const wb=((c![1]!-a![1]!)*(p[0]!-c![0]!)+(a![0]!-c![0]!)*(p[1]!-c![1]!))/d
  return [wa,wb,1-wa-wb]
}
