/** 空間分割の教育用実装。座標範囲は [-1.5, 1.5]^3。 */
import { seededRandom, torusMesh, type TriangleMesh, type Vec3 } from './natural-modeling.ts'
export type Binary = 0 | 1
export type SpatialNode = { id: string; x: number; y: number; z: number; size: number; depth: number; value: Binary | null; children: SpatialNode[] }
export type VoxelGrid = { size: number; data: Binary[] }
export type SpatialCube = { center: Vec3; size: number; occupied: boolean }
export type ShapeName = 'sphere' | 'box' | 'torus'
export type TileName = 'blocks' | 'circle' | 'checkerboard' | 'random' | 'clear'
export function boundedDepth(value: number): number { return Number.isFinite(value) ? Math.max(0,Math.min(4,Math.floor(value))) : 3 }
function validSize(size: number, maximum: number): boolean { return Number.isInteger(size) && size > 0 && size <= maximum && (size & (size-1)) === 0 }
export function tilePreset(size: number, preset: TileName, seed = 42): Binary[][] {
  if (!validSize(size,16)) throw new RangeError('Grid size must be a power of two, at most 16.')
  const random = seededRandom(seed)
  return Array.from({length:size},(_,y)=>Array.from({length:size},(_,x)=>{
    const filled = preset==='blocks' ? (x<size/2)===(y<size/2) : preset==='circle' ? Math.hypot(x+.5-size/2,y+.5-size/2)<size*.36 : preset==='checkerboard' ? (x+y)%2===0 : preset==='random' ? random()<.5 : false
    return filled ? 1 : 0
  }))
}
export function buildQuadtree(grid: Binary[][]): SpatialNode {
  const size=grid.length
  if(!validSize(size,16)||grid.some(row=>row.length!==size||row.some(v=>v!==0&&v!==1)))throw new RangeError('Expected a square binary grid, power-of-two size <= 16.')
  function visit(x:number,y:number,size:number,depth:number,id:string):SpatialNode {
    const first=grid[y][x]
    let uniform=true
    for(let j=y;j<y+size;j++)for(let i=x;i<x+size;i++)if(grid[j][i]!==first)uniform=false
    const node:SpatialNode={id,x,y,z:0,size,depth,value:uniform?first:null,children:[]}
    // 左上 → 右上 → 左下 → 右下（NW, NE, SW, SE）。混在領域だけ再帰。
    if(!uniform){const half=size/2;for(let k=0;k<4;k++)node.children.push(visit(x+(k%2)*half,y+Math.floor(k/2)*half,half,depth+1,`${id}.${k}`))}
    return node
  }
  return visit(0,0,size,0,'r')
}
export function flattenTree(root:SpatialNode):SpatialNode[] { return [root,...root.children.flatMap(flattenTree)] }
export function treeStats(root:SpatialNode):{internal:number;leaves:number;depth:number;total:number} {
  const nodes=flattenTree(root),internal=nodes.filter(n=>n.children.length>0).length
  return {internal,leaves:nodes.length-internal,depth:Math.max(...nodes.map(n=>n.depth)),total:nodes.length}
}
export function shapeOccupancy(shape:ShapeName):(x:number,y:number,z:number)=>boolean {
  return (x,y,z)=>shape==='sphere'?Math.hypot(x,y,z)<=1.12:shape==='box'?Math.max(Math.abs(x),Math.abs(y),Math.abs(z))<=.93:Math.hypot(Math.hypot(x,z)-1,y)<=.36
}
/** セル中心が立体の内部なら1。境界セルの厳密な交差判定とは異なる。 */
export function voxelGrid(depth:number,inside:(x:number,y:number,z:number)=>boolean):VoxelGrid {
  const size=2**boundedDepth(depth),data:Binary[]=[]
  for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++)data.push(inside((x+.5)*3/size-1.5,(y+.5)*3/size-1.5,(z+.5)*3/size-1.5)?1:0)
  return {size,data}
}
/** 閉じたメッシュを +x ray の交差回数で内外判定する。教材モデルの範囲は固定。 */
export function voxelizeMesh(mesh:TriangleMesh,depth:number):VoxelGrid {
  const size=2**boundedDepth(depth),data:Binary[]=Array(size**3).fill(0)
  for(let z=0;z<size;z++)for(let y=0;y<size;y++){
    const py=(y+.5)*3/size-1.5,pz=(z+.5)*3/size-1.5,intersections:number[]=[]
    for(const [ia,ib,ic] of mesh.faces){
      const a=mesh.vertices[ia],b=mesh.vertices[ib],c=mesh.vertices[ic]
      // yz平面の重心座標から ray と三角形の交点 x を求める。
      const determinant=(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1])
      if(Math.abs(determinant)<1e-12)continue
      const u=((py-a[1])*(c[2]-a[2])-(pz-a[2])*(c[1]-a[1]))/determinant
      const v=((b[1]-a[1])*(pz-a[2])-(b[2]-a[2])*(py-a[1]))/determinant
      if(u>=-1e-10&&v>=-1e-10&&u+v<=1+1e-10)intersections.push(a[0]+u*(b[0]-a[0])+v*(c[0]-a[0]))
    }
    intersections.sort((a,b)=>a-b)
    // 隣接三角形の共有辺に当たった場合は同じ交点を二重に数えない。
    const unique=intersections.filter((v,i)=>i===0||Math.abs(v-intersections[i-1])>1e-8)
    for(let x=0;x<size;x++){const px=(x+.5)*3/size-1.5;data[(z*size+y)*size+x]=unique.filter(hit=>hit>px).length%2?1:0}
  }
  return {size,data}
}
export function buildOctree(grid:VoxelGrid):SpatialNode {
  if(!validSize(grid.size,16)||grid.data.length!==grid.size**3||grid.data.some(v=>v!==0&&v!==1))throw new RangeError('Expected a binary cubic grid, power-of-two size <= 16.')
  const at=(x:number,y:number,z:number)=>grid.data[(z*grid.size+y)*grid.size+x]
  function visit(x:number,y:number,z:number,size:number,depth:number,id:string):SpatialNode{
    const first=at(x,y,z);let uniform=true
    for(let k=z;k<z+size;k++)for(let j=y;j<y+size;j++)for(let i=x;i<x+size;i++)if(at(i,j,k)!==first)uniform=false
    const node:SpatialNode={id,x,y,z,size,depth,value:uniform?first:null,children:[]}
    // xのbit → yのbit → zのbit。各軸を半分にすると 2×2×2 = 8。
    if(!uniform){const half=size/2;for(let k=0;k<8;k++)node.children.push(visit(x+(k&1)*half,y+((k>>1)&1)*half,z+((k>>2)&1)*half,half,depth+1,`${id}.${k}`))}
    return node
  }
  return visit(0,0,0,grid.size,0,'r')
}
export function gridCubes(grid:VoxelGrid,occupied:boolean):SpatialCube[]{
  const cubes:SpatialCube[]=[]
  for(let z=0;z<grid.size;z++)for(let y=0;y<grid.size;y++)for(let x=0;x<grid.size;x++)if(Boolean(grid.data[(z*grid.size+y)*grid.size+x])===occupied)cubes.push({center:[(x+.5)*3/grid.size-1.5,(y+.5)*3/grid.size-1.5,(z+.5)*3/grid.size-1.5],size:3/grid.size,occupied})
  return cubes
}
export function octreeCubes(root:SpatialNode):SpatialCube[]{return flattenTree(root).filter(n=>!n.children.length).map(n=>({center:[(n.x+n.size/2)*3/root.size-1.5,(n.y+n.size/2)*3/root.size-1.5,(n.z+n.size/2)*3/root.size-1.5] as Vec3,size:n.size*3/root.size,occupied:n.value===1}))}
/** 基準曲面の描画用メッシュ。Sphere/Boxの占有判定は解析形状を使う。 */
export function shapeMesh(shape:ShapeName):TriangleMesh {
  if(shape==='torus')return torusMesh()
  if(shape==='box')return {vertices:[[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]].map(p=>p.map(v=>v*.93) as Vec3),faces:[[0,2,1],[1,2,3],[4,5,6],[5,7,6],[0,1,4],[1,5,4],[2,6,3],[3,6,7],[0,4,2],[2,4,6],[1,3,5],[3,7,5]]}
  const vertices:Vec3[]=[],faces:[number,number,number][]=[]
  const around=32,rings=16
  for(let j=0;j<=rings;j++)for(let i=0;i<around;i++){const a=i*2*Math.PI/around,b=j*Math.PI/rings;vertices.push([1.12*Math.sin(b)*Math.cos(a),1.12*Math.cos(b),1.12*Math.sin(b)*Math.sin(a)])}
  for(let j=0;j<rings;j++)for(let i=0;i<around;i++){const a=j*around+i,b=j*around+(i+1)%around,c=a+around,d=b+around;faces.push([a,b,c],[b,d,c])}
  return {vertices,faces}
}
