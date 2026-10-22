import type { Mesh, Vec3 } from './mesh.ts'

/** Boundary of a core cube offset by a sphere of radius width.
 * Samples lie on planes, edge cylinders and corner spheres; faces are planar facets.
 * segments=1 gives a coarse planar bevel, higher values approximate rounded fillets.
 */
export function bevelCube(width = .25, segments = 3): Mesh {
  if (!Number.isFinite(width) || width<0 || width>.9 || !Number.isInteger(segments) || segments<1 || segments>12) throw new RangeError('Width: [0, .9], segments: integer [1, 12].')
  const c=1-width, coords:number[]=[]
  if(width===0) coords.push(-1,1)
  else {
    for(let i=0;i<=segments;i++) coords.push(-1+width*i/segments)
    for(let i=0;i<=segments;i++) coords.push(c+width*i/segments)
  }
  const vertices:Vec3[]=[], faces:number[][]=[], lookup=new Map<string,number>()
  const vertex=(p:Vec3)=> {
    const q=p.map(x=>Math.max(-c,Math.min(c,x))) as Vec3
    const d=p.map((x,i)=>x-q[i]), length=Math.hypot(...d)
    const v=(width===0?p:q.map((x,i)=>x+width*d[i]/length)) as Vec3
    const key=v.map(x=>Math.round(x*1e10)).join(',')
    if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push(v)}
    return lookup.get(key)!
  }
  for(let axis=0;axis<3;axis++) for(const sign of [-1,1]) {
    const u=(axis+1)%3, v=(axis+2)%3
    const ids=coords.map(a=>coords.map(b=> {const p:Vec3=[0,0,0];p[axis]=sign;p[u]=a;p[v]=b;return vertex(p)}))
    for(let i=0;i<coords.length-1;i++) for(let j=0;j<coords.length-1;j++) {
      const f=[ids[i][j],ids[i+1][j],ids[i+1][j+1],ids[i][j+1]]
      if(sign<0) f.reverse()
      // Triangles remain planar even where a cell samples the spherical corners.
      faces.push([f[0],f[1],f[2]],[f[0],f[2],f[3]])
    }
  }
  return {vertices,faces}
}
