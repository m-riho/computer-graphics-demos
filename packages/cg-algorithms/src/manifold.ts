import { cubeMesh, meshAdjacency, validateMesh, edgeKey, type Mesh, type Vec3 } from './mesh.ts'
export type ManifoldPreset = 'closed'|'open'|'three-faces'|'touching'|'internal'
export function manifoldPreset(name:ManifoldPreset):Mesh {
  const cube=cubeMesh()
  if(name==='open') return {...cube,faces:cube.faces.slice(0,-1)}
  if(name==='three-faces') return {vertices:[[0,-1,0],[0,1,0],[1,0,0],[-1,0,0],[0,0,1]],faces:[[0,1,2],[1,0,3],[0,1,4]]}
  if(name==='touching') {
    // Vertex 6 is deliberately shared by both cubes: geometrical coincidence alone is not connectivity.
    const other=cubeMesh(),map=other.vertices.map((_,i)=>i===0?6:7+i)
    return {vertices:[...cube.vertices,...other.vertices.slice(1).map(v=>v.map(x=>x+2) as Vec3)],faces:[...cube.faces,...other.faces.map(f=>f.map(v=>map[v]))]}
  }
  if(name==='internal') return {vertices:[...cube.vertices,[-.7,-.7,0],[.7,-.7,0],[.7,.7,0],[-.7,.7,0]],faces:[...cube.faces,[8,9,10,11]]}
  return cube
}
/** Combinatorial 2-manifold test: each vertex link must be one cycle or one path.
 * Does not establish geometric embeddedness, containment, or absence of intersecting faces.
 */
export function analyzeManifold(mesh:Mesh) {
  const errors=validateMesh(mesh), adj=meshAdjacency(mesh)
  const boundaryEdges=adj.edgeFaces.flatMap((fs,e)=>fs.length===1?[e]:[])
  const badEdges=adj.edgeFaces.flatMap((fs,e)=>fs.length>2||fs.length===0?[e]:[])
  const badVertices:number[]=[]
  mesh.vertices.forEach((_,v)=>{
    const link=new Map<number,number[]>()
    for(const f of adj.vertexFaces[v]) {
      const face=mesh.faces[f],i=face.indexOf(v),a=face[(i+face.length-1)%face.length],b=face[(i+1)%face.length]
      link.set(a,[...(link.get(a)??[]),b]);link.set(b,[...(link.get(b)??[]),a])
    }
    const keys=[...link.keys()], visited=new Set<number>(), stack=keys.length?[keys[0]]:[]
    while(stack.length){const n=stack.pop()!;if(visited.has(n))continue;visited.add(n);stack.push(...(link.get(n)??[]).filter(x=>!visited.has(x)))}
    const degrees=[...link.values()].map(n=>n.length), ends=degrees.filter(d=>d===1).length
    if(!keys.length || visited.size!==keys.length || degrees.some(d=>d<1||d>2) || !(ends===0||ends===2)) badVertices.push(v)
  })
  const directions=new Map<string,number[]>()
  mesh.faces.forEach(face=>face.forEach((a,i)=>{const b=face[(i+1)%face.length],key=edgeKey(a,b);directions.set(key,[...(directions.get(key)??[]),a<b?1:-1])}))
  const orientationConflicts=adj.edges.flatMap(([a,b],e)=>{const dirs=directions.get(edgeKey(a,b))!;return dirs.length===2&&dirs[0]===dirs[1]?[e]:[]})
  let components=0;const seen=new Set<number>()
  mesh.faces.forEach((_,f)=>{if(seen.has(f))return;components++;const stack=[f];while(stack.length){const id=stack.pop()!;if(seen.has(id))continue;seen.add(id);for(const v of mesh.faces[id])stack.push(...(adj.vertexFaces[v]??[]).filter(n=>!seen.has(n)))}})
  const kind: 'invalid'|'non-manifold'|'boundary'|'closed'=errors.length?'invalid':badEdges.length||badVertices.length?'non-manifold':boundaryEdges.length?'boundary':'closed'
  return {kind,boundaryEdges,badEdges,badVertices,orientationConflicts,components,errors}
}
