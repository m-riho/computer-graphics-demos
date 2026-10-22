/** Shared indexed polygon mesh. Faces wind counterclockwise when viewed from outside. */
export type Vec3 = [number, number, number]
export interface Mesh { vertices: Vec3[]; faces: number[][] }
export function clampFinite(value: number, min: number, max: number, fallback = min): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback))
}
export function cubeMesh(): Mesh {
  return { vertices: [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
    faces: [[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]] }
}
export function edgeKey(a: number, b: number): string { return a < b ? `${a}:${b}` : `${b}:${a}` }
export function meshEdges(mesh: Mesh): [number, number][] {
  const edges = new Map<string, [number, number]>()
  for (const face of mesh.faces) for (let i=0;i<face.length;i++) {
    const a=face[i], b=face[(i+1)%face.length]
    edges.set(edgeKey(a,b), a<b ? [a,b] : [b,a])
  }
  return [...edges.values()]
}
export function meshAdjacency(mesh: Mesh) {
  const edges=meshEdges(mesh), edgeIds=new Map(edges.map(([a,b],i)=>[edgeKey(a,b),i]))
  const vertexEdges: number[][]=mesh.vertices.map(()=>[]), vertexFaces: number[][]=mesh.vertices.map(()=>[])
  const edgeFaces: number[][]=edges.map(()=>[])
  edges.forEach(([a,b],i)=>{vertexEdges[a]?.push(i); vertexEdges[b]?.push(i)})
  const faceEdges=mesh.faces.map((face,f)=>face.map((v,i)=>{
    vertexFaces[v]?.push(f)
    const e=edgeIds.get(edgeKey(v,face[(i+1)%face.length]))!; edgeFaces[e].push(f); return e
  }))
  return { edges, vertexEdges, vertexFaces, edgeFaces, faceEdges }
}
/** Structural and zero-area checks, not a geometric self-intersection detector. */
export function validateMesh(mesh: Mesh): string[] {
  const errors: string[]=[]
  mesh.vertices.forEach((v,i)=>{if(v.length!==3 || !v.every(Number.isFinite)) errors.push(`Vertex ${i}: finite xyz required`)})
  mesh.faces.forEach((face,f)=>{
    if(face.length<3 || new Set(face).size!==face.length || face.some(v=>!Number.isInteger(v)||v<0||v>=mesh.vertices.length)) { errors.push(`Face ${f}: invalid vertex indices`); return }
    const normal=[0,0,0]
    face.forEach((id,i)=>{const a=mesh.vertices[id],b=mesh.vertices[face[(i+1)%face.length]]; normal[0]+=(a[1]-b[1])*(a[2]+b[2]); normal[1]+=(a[2]-b[2])*(a[0]+b[0]);normal[2]+=(a[0]-b[0])*(a[1]+b[1])})
    if(Math.hypot(...normal)<1e-12) errors.push(`Face ${f}: zero area`)
  })
  return errors
}
/** Fan triangulation: use convex planar input faces. */
export function triangulateMesh(mesh: Mesh): Mesh {
  return {vertices:mesh.vertices.map(v=>[...v]),faces:mesh.faces.flatMap(f=>f.slice(1,-1).map((v,i)=>[f[0],v,f[i+2]]))}
}
