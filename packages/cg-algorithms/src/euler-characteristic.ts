import { meshEdges, clampFinite, validateMesh, type Mesh, type Vec3 } from './mesh.ts'
export function eulerCharacteristic(mesh:Mesh) {
  const vertices=mesh.vertices.length,edges=meshEdges(mesh).length,faces=mesh.faces.length
  return {vertices,edges,faces,chi:vertices-edges+faces}
}
export function splitEdge(mesh:Mesh,edgeIndex:number):Mesh {
  const edge=meshEdges(mesh)[edgeIndex]; if(!edge)throw new Error('Invalid edge')
  const [a,b]=edge, id=mesh.vertices.length
  const midpoint=mesh.vertices[a].map((x,i)=>(x+mesh.vertices[b][i])/2) as Vec3
  return {vertices:[...mesh.vertices.map(v=>[...v] as Vec3),midpoint],faces:mesh.faces.map(face=>face.flatMap((v,i)=>{
    const next=face[(i+1)%face.length];return (v===a&&next===b)||(v===b&&next===a)?[v,id]:[v]
  }))}
}
export function splitFace(mesh:Mesh,faceIndex:number):Mesh {
  const face=mesh.faces[faceIndex];if(!face||face.length<4)throw new Error('Choose a face with at least four vertices')
  // A previous edge split may have inserted collinear vertices. Choose a diagonal
  // that leaves positive area on both sides (convex input faces in this demo).
  for(let a=0;a<face.length;a++)for(let b=a+2;b<face.length;b++) {
    if(a===0&&b===face.length-1)continue
    const parts=[face.slice(a,b+1),[...face.slice(b),...face.slice(0,a+1)]]
    if(validateMesh({vertices:mesh.vertices,faces:parts}).length===0)
      return {vertices:mesh.vertices.map(v=>[...v]),faces:mesh.faces.flatMap((f,i)=>i===faceIndex?parts:[[...f]])}
  }
  throw new Error('No nondegenerate face diagonal')
}
export function torusMesh(majorSegments=12,minorSegments=6):Mesh {
  const n=Math.round(clampFinite(majorSegments,3,48,12)),m=Math.round(clampFinite(minorSegments,3,24,6))
  const vertices:Vec3[]=[],faces:number[][]=[]
  for(let i=0;i<n;i++)for(let j=0;j<m;j++){
    const u=i*2*Math.PI/n,v=j*2*Math.PI/m,r=1+.35*Math.cos(v)
    vertices.push([r*Math.cos(u),.35*Math.sin(v),r*Math.sin(u)])
  }
  for(let i=0;i<n;i++)for(let j=0;j<m;j++)faces.push([i*m+j,i*m+(j+1)%m,((i+1)%n)*m+(j+1)%m,((i+1)%n)*m+j])
  return {vertices,faces}
}
