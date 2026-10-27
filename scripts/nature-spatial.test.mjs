import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleMesh, torusMesh } from '../packages/cg-algorithms/src/natural-modeling.ts'
const spatial = await import('../packages/cg-algorithms/src/nature-spatial.ts').catch(() => ({}))
test('surface sampling weights triangles by area and is reproducible', () => {
  const mesh = { vertices: [[0,0,0],[1,0,0],[0,1,0],[10,0,0],[12,0,0],[10,2,0]], faces: [[0,1,2],[3,4,5]] }
  const points=sampleMesh(mesh,10000,17)
  assert.deepEqual(points,sampleMesh(mesh,10000,17))
  const large=points.filter(p=>p[0]>=10).length
  assert.ok(large>7800&&large<8200)
  assert.ok(points.every(p=>p[2]===0))
})
test('quadtree merges uniform regions and visits NW NE SW SE', () => {
  assert.equal(typeof spatial.buildQuadtree,'function')
  const tree=spatial.buildQuadtree([[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]])
  assert.deepEqual(tree.children.map(n=>[n.id,n.x,n.y,n.value]),[['r.0',0,0,1],['r.1',2,0,0],['r.2',0,2,0],['r.3',2,2,1]])
  assert.deepEqual(spatial.treeStats(tree),{internal:1,leaves:4,depth:1,total:5})
  assert.equal(spatial.buildQuadtree([[0,0],[0,0]]).value,0)
})
test('checkerboard forces full depth and reconstructs every tile', () => {
  const grid=spatial.tilePreset(16,'checkerboard',4), tree=spatial.buildQuadtree(grid)
  assert.deepEqual(spatial.treeStats(tree),{internal:85,leaves:256,depth:4,total:341})
  for(const n of spatial.flattenTree(tree).filter(n=>!n.children.length))assert.equal(n.value,grid[n.y][n.x])
})
test('quadtree validates shape and binary values', () => {
  for(const grid of [[],[[0,1,0]],[[2]],Array.from({length:64},()=>Array(64).fill(0))])assert.throws(()=>spatial.buildQuadtree(grid),RangeError)
  assert.deepEqual(spatial.tilePreset(8,'random',3),spatial.tilePreset(8,'random',3))
})
test('octree partitions uniform voxel data exactly with eight children', () => {
  const grid=spatial.voxelGrid(3,(x,y,z)=>x<0&&y<0&&z<0)
  const tree=spatial.buildOctree(grid)
  assert.deepEqual(spatial.treeStats(tree),{internal:1,leaves:8,depth:1,total:9})
  const leaves=spatial.flattenTree(tree).filter(n=>!n.children.length)
  assert.equal(leaves.reduce((s,n)=>s+n.size**3,0),512)
  assert.equal(leaves.filter(n=>n.value===1).reduce((s,n)=>s+n.size**3,0),64)
  assert.equal(tree.children[0].value,1)
})
test('octree boundary values and maximum depth are bounded', () => {
  assert.equal(spatial.buildOctree(spatial.voxelGrid(0,()=>true)).value,1)
  assert.equal(spatial.voxelGrid(99,()=>true).size,16)
  assert.equal(spatial.voxelGrid(NaN,()=>false).size,8)
  assert.throws(()=>spatial.buildOctree({size:2,data:[1]}),RangeError)
  const grid=spatial.voxelGrid(4,spatial.shapeOccupancy('sphere'))
  const tree=spatial.buildOctree(grid)
  assert.ok(spatial.treeStats(tree).depth<=4)
  const volume=spatial.flattenTree(tree).filter(n=>!n.children.length&&n.value===1).reduce((s,n)=>s+n.size**3,0)
  assert.equal(volume,grid.data.reduce((a,b)=>a+b,0))
})
test('mesh voxelization retains torus hole and occupies its tube',()=>{
  const grid=spatial.voxelizeMesh(torusMesh(),4)
  const at=(x,y,z)=>grid.data[(z*grid.size+y)*grid.size+x]
  assert.equal(at(8,8,8),0)
  assert.equal(at(13,8,8),1)
  assert.ok(grid.data.some(v=>v===1))
})
