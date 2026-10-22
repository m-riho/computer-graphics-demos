import type { Mesh, Vec3 } from './mesh.ts'

export type Profile = [number, number][]
export type ProfileName = 'rectangle' | 'circle' | 'l-shape' | 'vase'
export type SweepAxis = 'x' | 'y' | 'z'

/** Closed, counterclockwise profiles. For revolution, x is radius and y is height. */
export function createProfile(name: ProfileName, scale = 1): Profile {
  if (!Number.isFinite(scale) || scale <= 0 || scale > 10) throw new RangeError('Profile scale must be in (0, 10].')
  let points: Profile
  if (name === 'rectangle') points = [[0,-1],[2,-1],[2,1],[0,1]]
  else if (name === 'l-shape') points = [[0,-1],[2,-1],[2,0],[1,0],[1,1],[0,1]]
  else if (name === 'vase') points = [[0,-1],[.65,-1],[.9,-.65],[.85,-.15],[.45,.45],[.55,1],[0,1]]
  else if (name === 'circle') points = Array.from({length:24}, (_, i) => [1.2+Math.cos(i*Math.PI/12), Math.sin(i*Math.PI/12)])
  else throw new RangeError('Unknown profile.')
  return points.map(([x,y]) => [x*scale,y*scale])
}
const cross2 = (a: number[], b: number[], c: number[]) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
function checked(profile: Profile): Profile {
  if (profile.length<3 || profile.length>256 || profile.some(p => p.length!==2 || !p.every(Number.isFinite))) throw new RangeError('A finite simple profile is required.')
  const points = profile.map(p=>[...p] as [number,number])
  const area = points.reduce((s,p,i)=>s+p[0]*points[(i+1)%points.length][1]-p[1]*points[(i+1)%points.length][0],0)
  if (Math.abs(area)<1e-10) throw new RangeError('Profile has zero area.')
  if (area<0) points.reverse()
  return points
}
/** Ear clipping preserves the concave notch of the L profile. Simple polygons only. */
export function triangulateProfile(profile: Profile): number[][] {
  const remaining = profile.map((_,i)=>i), triangles: number[][]=[]
  while (remaining.length>3) {
    let found=false
    for (let i=0;i<remaining.length;i++) {
      const a=remaining[(i+remaining.length-1)%remaining.length], b=remaining[i], c=remaining[(i+1)%remaining.length]
      if (cross2(profile[a],profile[b],profile[c])<=1e-10) continue
      if (remaining.some(v=>v!==a && v!==b && v!==c && cross2(profile[a],profile[b],profile[v])>=-1e-10 && cross2(profile[b],profile[c],profile[v])>=-1e-10 && cross2(profile[c],profile[a],profile[v])>=-1e-10)) continue
      triangles.push([a,b,c]); remaining.splice(i,1); found=true; break
    }
    if (!found) throw new RangeError('Profile must be simple, without repeated vertices.')
  }
  triangles.push([...remaining]); return triangles
}

export function extrude(profile: Profile, distance = 2): Mesh {
  if (!Number.isFinite(distance) || distance<0 || distance>20) throw new RangeError('Distance must be in [0, 20].')
  const points=checked(profile), n=points.length
  if (distance===0) return {vertices:[],faces:[]}
  const vertices: Vec3[]=[...points.map(([x,y]):Vec3=>[x,y,-distance/2]),...points.map(([x,y]):Vec3=>[x,y,distance/2])]
  const caps=triangulateProfile(points)
  const faces=[...caps.map(f=>[...f].reverse()),...caps.map(f=>f.map(i=>i+n))]
  for (let i=0;i<n;i++) { const j=(i+1)%n; faces.push([i,j,j+n,i+n]) }
  return {vertices,faces}
}

/** Rotate a closed radius/height profile. Axis vertices and the 360° seam are welded. */
export function revolve(profile: Profile, angleDegrees=360, segments=24, axis: SweepAxis='y'): Mesh {
  if (!Number.isFinite(angleDegrees) || angleDegrees<0 || angleDegrees>360 || !Number.isInteger(segments) || segments<3 || segments>128 || !['x','y','z'].includes(axis)) throw new RangeError('Invalid revolution parameters.')
  const points=checked(profile)
  if (points.some(p=>p[0]<-1e-10)) throw new RangeError('Radius must be nonnegative.')
  if (angleDegrees===0) return {vertices:[],faces:[]}
  const full=angleDegrees===360, rings=full?segments:segments+1
  const vertices: Vec3[]=[], faces:number[][]=[], lookup=new Map<string,number>()
  const ids: number[][]=[]
  for (let s=0;s<rings;s++) {
    const angle=angleDegrees*Math.PI/180*s/segments
    ids.push(points.map(([r,h])=> {
      const p:Vec3=[r*Math.cos(angle),h,-r*Math.sin(angle)]
      const v:Vec3=axis==='x'?[p[1],p[2],p[0]]:axis==='z'?[p[2],p[0],p[1]]:p
      const key=v.map(x=>Math.round(x*1e10)).join(',')
      if (!lookup.has(key)) {lookup.set(key,vertices.length); vertices.push(v)}
      return lookup.get(key)!
    }))
  }
  const add=(face:number[])=> { const f=face.filter((v,i)=>v!==face[(i+face.length-1)%face.length]); if(new Set(f).size>=3) faces.push(f) }
  for(let s=0;s<segments;s++) for(let i=0;i<points.length;i++) {
    const j=(i+1)%points.length, t=(s+1)%rings
    add([ids[s][i],ids[t][i],ids[t][j],ids[s][j]])
  }
  if(!full) for(const f of triangulateProfile(points)) {add(f.map(i=>ids[0][i]));add([...f].reverse().map(i=>ids[rings-1][i]))}
  return {vertices,faces}
}
