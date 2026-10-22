import { validateMesh, type Mesh } from './mesh.ts'
/** origin is the START vertex; destination is the END vertex. -1 means no unique twin. */
export interface HalfEdge { id:number; origin:number; destination:number; next:number; twin:number; face:number }
export function buildHalfEdges(mesh: Mesh): HalfEdge[] {
  const errors=validateMesh(mesh); if(errors.length) throw new Error(errors.join('; '))
  const result:HalfEdge[]=[], directed=new Map<string,number[]>()
  mesh.faces.forEach((face,f)=>{
    const start=result.length
    face.forEach((origin,i)=>{
      const destination=face[(i+1)%face.length], id=result.length
      result.push({id,origin,destination,next:start+(i+1)%face.length,twin:-1,face:f})
      const key=`${origin}:${destination}`; directed.set(key,[...(directed.get(key)??[]),id])
    })
  })
  result.forEach(h=>{
    const opposite=directed.get(`${h.destination}:${h.origin}`), same=directed.get(`${h.origin}:${h.destination}`)
    if(opposite?.length===1 && same?.length===1) h.twin=opposite[0]
  })
  return result
}
export function faceLoop(edges: HalfEdge[], start:number): number[] {
  const result:number[]=[], seen=new Set<number>(); let id=start
  while(edges[id] && !seen.has(id)) {seen.add(id);result.push(id);id=edges[id].next}
  return result
}
/** On an oriented closed manifold, twin then next cycles around the same origin. */
export function vertexLoop(edges:HalfEdge[],start:number):number[] {
  const result:number[]=[],seen=new Set<number>();let id=start
  while(edges[id] && !seen.has(id)) {seen.add(id);result.push(id);const twin=edges[id].twin;if(twin<0)break;id=edges[twin].next}
  return result
}
