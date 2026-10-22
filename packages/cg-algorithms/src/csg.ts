import type { Mesh, Vec3 } from './mesh.ts'
import { extrude, revolve } from './sweep.ts'

export type PrimitiveKind = 'cube' | 'sphere' | 'cylinder'
export type BooleanOperation = 'union' | 'intersection' | 'a-b' | 'b-a'
const EPS=1e-7
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const mix=(a:Vec3,b:Vec3,t:number):Vec3=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]
interface Polygon { points:Vec3[]; normal:Vec3; offset:number }
function polygon(points:Vec3[]):Polygon|null {
  if(points.length<3)return null
  let normal:Vec3=[0,0,0]
  for(let i=1;i+1<points.length;i++){normal=cross(sub(points[i],points[0]),sub(points[i+1],points[0]));if(Math.hypot(...normal)>EPS)break}
  const length=Math.hypot(...normal)
  if(length<=EPS)return null
  normal=normal.map(x=>x/length) as Vec3
  return {points,normal,offset:dot(normal,points[0])}
}
/** Classify a polygon against a plane, splitting every crossing edge. */
function split(p:Polygon, plane:Polygon, coplanarFront:Polygon[],coplanarBack:Polygon[],front:Polygon[],back:Polygon[]) {
  const distances=p.points.map(v=>dot(plane.normal,v)-plane.offset)
  const signs=distances.map(d=>d>EPS?1:d < -EPS?2:0)
  const type=signs.reduce<number>((a,b)=>a|b,0)
  if(type===0)(dot(p.normal,plane.normal)>0?coplanarFront:coplanarBack).push(p)
  else if(type===1)front.push(p)
  else if(type===2)back.push(p)
  else {
    const f:Vec3[]=[], b:Vec3[]=[]
    for(let i=0;i<p.points.length;i++) {
      const j=(i+1)%p.points.length, v=p.points[i]
      if(signs[i]!==2)f.push(v)
      if(signs[i]!==1)b.push(v)
      if((signs[i]|signs[j])===3){const cut=mix(v,p.points[j],distances[i]/(distances[i]-distances[j]));f.push(cut);b.push(cut)}
    }
    const fp=polygon(f),bp=polygon(b);if(fp)front.push(fp);if(bp)back.push(bp)
  }
}
/** BSP leaves implicitly classify outside (front) and inside (back). */
class BSP {
  plane:Polygon|null=null
  polygons:Polygon[]=[]
  front:BSP|null=null
  back:BSP|null=null
  constructor(polygons:Polygon[]=[]){this.build(polygons)}
  build(polygons:Polygon[]) {
    if(!polygons.length)return
    if(!this.plane)this.plane=polygons[0]
    const front:Polygon[]=[],back:Polygon[]=[]
    for(const p of polygons)split(p,this.plane,this.polygons,this.polygons,front,back)
    if(front.length){this.front??=new BSP();this.front.build(front)}
    if(back.length){this.back??=new BSP();this.back.build(back)}
  }
  all():Polygon[]{return [...this.polygons,...(this.front?.all()??[]),...(this.back?.all()??[])]}
  invert(){
    const flip=(p:Polygon):Polygon=>({points:[...p.points].reverse(),normal:p.normal.map(x=>-x) as Vec3,offset:-p.offset})
    this.polygons=this.polygons.map(flip);if(this.plane)this.plane=flip(this.plane)
    this.front?.invert();this.back?.invert();[this.front,this.back]=[this.back,this.front]
  }
  clip(polygons:Polygon[]):Polygon[]{
    if(!this.plane)return polygons
    let front:Polygon[]=[],back:Polygon[]=[]
    for(const p of polygons)split(p,this.plane,front,back,front,back)
    if(this.front)front=this.front.clip(front)
    back=this.back?this.back.clip(back):[]
    return [...front,...back]
  }
  clipTo(other:BSP){this.polygons=other.clip(this.polygons);this.front?.clipTo(other);this.back?.clipTo(other)}
}
function toPolygons(mesh:Mesh):Polygon[]{
  if(mesh.vertices.some(v=>v.length!==3 || !v.every(Number.isFinite)) || mesh.faces.some(f=>f.length<3 || f.some(i=>!Number.isInteger(i)||i<0||i>=mesh.vertices.length)))throw new RangeError('Invalid mesh.')
  return mesh.faces.flatMap(face=>{
    // Input is expected to have convex planar faces; this also handles triangles.
    const p=polygon(face.map(i=>mesh.vertices[i]));return p?[p]:[]
  })
}
function toMesh(polygons:Polygon[]):Mesh {
  const vertices:Vec3[]=[],faces:number[][]=[],lookup=new Map<string,number>()
  for(const p of polygons){
    const face=p.points.map(v=>{const key=v.map(x=>Math.round(x/EPS)).join(',');if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push([...v])}return lookup.get(key)!})
    const clean=face.filter((v,i)=>v!==face[(i+face.length-1)%face.length])
    if(new Set(clean).size>=3)faces.push(clean)
  }
  // A split on one polygon can leave a T-junction on its neighbor. Insert that
  // shared vertex into both boundaries, so the exported connectivity agrees.
  const joined=faces.map(face=>face.flatMap((a,i)=>{
    const b=face[(i+1)%face.length], direction=sub(vertices[b],vertices[a]), length2=dot(direction,direction)
    const interior:{id:number;t:number}[]=[]
    vertices.forEach((v,id)=>{
      if(id===a||id===b)return
      const offset=sub(v,vertices[a]),t=dot(offset,direction)/length2
      if(t<=EPS||t>=1-EPS)return
      if(Math.hypot(...cross(offset,direction))<=EPS*Math.sqrt(length2))interior.push({id,t})
    })
    return [a,...interior.sort((x,y)=>x.t-y.t).map(v=>v.id)]
  }))
  return {vertices,faces:joined}
}
/** Educational floating-point BSP Boolean. Closed, consistently outward,
 * convex-faced inputs only. Not a CAD-grade exact-predicate solid kernel.
 * Curved primitives are polygon approximations, not voxel fields.
 */
export function booleanCSG(a:Mesh,b:Mesh,operation:BooleanOperation):Mesh {
  if(!['union','intersection','a-b','b-a'].includes(operation))throw new RangeError('Unknown Boolean operation.')
  if(operation==='b-a')return booleanCSG(b,a,'a-b')
  const pa=toPolygons(a),pb=toPolygons(b)
  if(!pa.length||!pb.length){
    if(operation==='intersection'||(operation==='a-b'&&!pa.length))return {vertices:[],faces:[]}
    return toMesh(operation==='a-b'?pa:pa.length?pa:pb)
  }
  const A=new BSP(pa),B=new BSP(pb)
  if(operation==='union'){
    A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.all())
  } else if(operation==='a-b'){
    A.invert();A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.all());A.invert()
  } else {
    A.invert();B.clipTo(A);B.invert();A.clipTo(B);B.clipTo(A);A.build(B.all());A.invert()
  }
  return toMesh(A.all())
}

/** Cube/sphere bounds ±1; cylinder radius 1, half-height 1.6 for a through cutter. */
export function createPrimitive(kind:PrimitiveKind, options:{position?:Vec3;scale?:number;segments?:number}={}):Mesh {
  const {position=[0,0,0],scale=1,segments=16}=options
  if(position.length!==3||!position.every(Number.isFinite)||!Number.isFinite(scale)||scale<=0||scale>10||!Number.isInteger(segments)||segments<6||segments>48)throw new RangeError('Invalid primitive parameters.')
  let mesh:Mesh
  if(kind==='cube')mesh=extrude([[-1,-1],[1,-1],[1,1],[-1,1]],2)
  else if(kind==='cylinder')mesh=revolve([[0,-1.6],[1,-1.6],[1,1.6],[0,1.6]],360,segments)
  else if(kind==='sphere'){
    const profile:[number,number][]=[]
    const rings=Math.floor(segments/2)
    for(let i=0;i<=rings;i++){const angle=-Math.PI/2+Math.PI*i/rings;profile.push([Math.max(0,Math.cos(angle)),Math.sin(angle)])}
    mesh=revolve(profile,360,segments)
  } else throw new RangeError('Unknown primitive.')
  return {vertices:mesh.vertices.map(v=>v.map((x,i)=>x*scale+position[i]) as Vec3),faces:mesh.faces}
}
