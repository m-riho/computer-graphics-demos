/** 第5回の図と操作例で共有する計算。外部ライブラリに依存しない。 */
export type Vec3 = [number, number, number]
export type TriangleMesh = { vertices: Vec3[]; faces: [number, number, number][] }
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296 }
}
export function randomSeries(count: number, seed: number): number[] {
  const random = seededRandom(seed)
  return Array.from({ length: count }, () => random() * 2 - 1)
}
export function torusMesh(around = 40, tube = 12): TriangleMesh {
  const vertices: Vec3[] = [], faces: [number, number, number][] = []
  for (let i = 0; i < around; i++) for (let j = 0; j < tube; j++) {
    const u = i / around * Math.PI * 2, v = j / tube * Math.PI * 2
    vertices.push([(1 + .36 * Math.cos(v)) * Math.cos(u), .36 * Math.sin(v), (1 + .36 * Math.cos(v)) * Math.sin(u)])
  }
  for (let i = 0; i < around; i++) for (let j = 0; j < tube; j++) {
    const a = i * tube + j, b = ((i + 1) % around) * tube + j
    const c = ((i + 1) % around) * tube + (j + 1) % tube, d = i * tube + (j + 1) % tube
    faces.push([a,c,b], [a,d,c])
  }
  return { vertices, faces }
}
/** 三角形を面積比で選び、重心座標で面内に一様に点を置く。 */
export function sampleMesh(mesh: TriangleMesh, count: number, seed = 42): Vec3[] {
  const random = seededRandom(seed), cumulative: number[] = []; let total = 0
  for (const [i,j,k] of mesh.faces) {
    const a=mesh.vertices[i], b=mesh.vertices[j], c=mesh.vertices[k]
    const u=b.map((x,d)=>x-a[d]), v=c.map((x,d)=>x-a[d])
    total += Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]) / 2
    cumulative.push(total)
  }
  if (!(total>0)) return []
  return Array.from({length:count},()=>{
    const target=random()*total; let lo=0, hi=cumulative.length-1
    while(lo<hi){const m=(lo+hi)>>>1;if(cumulative[m]<target)lo=m+1;else hi=m}
    const [i,j,k]=mesh.faces[lo], s=Math.sqrt(random()), t=random()
    return [0,1,2].map(d=>(1-s)*mesh.vertices[i][d]+s*(1-t)*mesh.vertices[j][d]+s*t*mesh.vertices[k][d]) as Vec3
  })
}
export function lsystem(iterations: number): string {
  let word='F'
  for(let i=0;i<iterations;i++) word=word.replaceAll('F','F[+F]F[-F]F')
  return word
}
export function turtle(word: string, angle: number): [number,number,number,number][] {
  let x=0,y=0,heading=Math.PI/2; const stack: Vec3[] = [], segments: [number,number,number,number][]=[]
  for(const symbol of word){
    if(symbol==='F'){const nx=x+Math.cos(heading),ny=y+Math.sin(heading);segments.push([x,y,nx,ny]);x=nx;y=ny}
    else if(symbol==='+')heading+=angle*Math.PI/180
    else if(symbol==='-')heading-=angle*Math.PI/180
    else if(symbol==='[')stack.push([x,y,heading])
    else if(symbol===']'){const state=stack.pop();if(state)[x,y,heading]=state}
  }
  return segments
}
/** 1D中点変位法。各段階で変位の振幅を減衰。 */
export function midpoint(levels: number, seed: number, decay: number): number[] {
  const random=seededRandom(seed);let points=[0,0],amplitude=1
  for(let level=0;level<levels;level++){
    const next=[points[0]]
    for(let i=0;i<points.length-1;i++)next.push((points[i]+points[i+1])/2+(random()*2-1)*amplitude,points[i+1])
    points=next;amplitude*=decay
  }
  return points
}
/** 教材用の滑らかな値ノイズ。Perlinの勾配ノイズそのものではない。 */
export function valueNoise(x: number, lattice: number[]): number {
  const i=Math.floor(x), t=x-i, smooth=t*t*(3-2*t)
  const at=(n:number)=>lattice[((n%lattice.length)+lattice.length)%lattice.length]
  return at(i)*(1-smooth)+at(i+1)*smooth
}
export function sphereSdf(p: Vec3, center: Vec3, radius: number): number {return Math.hypot(...p.map((x,i)=>x-center[i]))-radius}
export function combineSdf(a:number,b:number,operation:'union'|'intersection'|'difference'):number {
  return operation==='union'?Math.min(a,b):operation==='intersection'?Math.max(a,b):Math.max(a,-b)
}
