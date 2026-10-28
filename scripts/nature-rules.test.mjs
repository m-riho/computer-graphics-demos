import test from 'node:test'
import assert from 'node:assert/strict'
import { rewriteLSystem, traceTurtle, midpointStages } from '../packages/cg-algorithms/src/nature-rules.ts'
test('L-system expands simultaneously with F counts 1, 5, 25, 125',()=>{
 for(let n=0;n<4;n++)assert.equal(rewriteLSystem('F',{F:'F[+F]F[-F]F'},n).word.split('F').length-1,5**n)
 assert.equal(rewriteLSystem('X',{X:'F+X',F:'FF'},2).word,'FF+F+X')
 assert.ok(rewriteLSystem('F',{F:'FFFFFFFFFF'},10).truncated)
})
test('turtle restores both position and direction on pop and exposes execution stack',()=>{
 const result=traceTurtle('F[+F]F',90,1)
 assert.equal(result.segments.length,3)
 assert.ok(Math.abs(result.state.x)<1e-12)
 assert.ok(Math.abs(result.state.y-2)<1e-12)
 assert.equal(traceTurtle('F[+F]F',90,1,4).stack.length,1)
 assert.equal(traceTurtle(']F',90,1).error,'対応する [ がありません')
})
test('midpoint stages retain all previous points, use amplitude, and reproduce seed',()=>{
 const a=midpointStages(5,7,.8,.5)
 assert.equal(a.length,6);assert.equal(a[5].length,33)
 assert.deepEqual(a,midpointStages(5,7,.8,.5))
 assert.notDeepEqual(a,midpointStages(5,8,.8,.5))
 for(let stage=1;stage<a.length;stage++)assert.deepEqual(a[stage].filter((_,i)=>i%2===0),a[stage-1])
 assert.deepEqual(midpointStages(3,0,0,.5)[3],Array(9).fill(0))
})

// Splitting each face independently would duplicate shared midpoints and break these tests.
import * as rules from '../packages/cg-algorithms/src/nature-rules.ts'
import { meshAdjacency, validateMesh } from '../packages/cg-algorithms/src/mesh.ts'
test('triangle midpoint subdivision is a connected disk with shared edge vertices',()=>{
 assert.equal(typeof rules.triangleMidpointStages,'function')
 const stages=rules.triangleMidpointStages(5,7,.8,.5)
 for(let level=0;level<stages.length;level++){
  const {mesh}=stages[level],side=2**level,adj=meshAdjacency(mesh)
  assert.equal(mesh.faces.length,4**level)
  assert.equal(mesh.vertices.length,(side+1)*(side+2)/2)
  assert.equal(mesh.vertices.length-adj.edges.length+mesh.faces.length,1)
  assert.equal(adj.edgeFaces.filter(fs=>fs.length===1).length,3*side)
  assert.ok(adj.edgeFaces.every(fs=>fs.length===1||fs.length===2))
  assert.deepEqual(validateMesh(mesh),[])
  assert.equal(new Set(mesh.vertices.map(([x,,z])=>`${x},${z}`)).size,mesh.vertices.length)
 }
})
test('triangle displacement keeps previous vertices and uses one bounded offset per edge',()=>{
 assert.equal(typeof rules.triangleMidpointStages,'function')
 const stages=rules.triangleMidpointStages(3,7,.8,.5)
 assert.deepEqual(stages,rules.triangleMidpointStages(3,7,.8,.5))
 assert.notDeepEqual(stages,rules.triangleMidpointStages(3,8,.8,.5))
 assert.deepEqual(stages.slice(0,2),rules.triangleMidpointStages(1,7,.8,.5))
 for(let level=1;level<stages.length;level++){
  const previous=stages[level-1].mesh,now=stages[level]
  assert.deepEqual(now.mesh.vertices.slice(0,previous.vertices.length),previous.vertices)
  assert.equal(now.midpoints.length,meshAdjacency(previous).edges.length)
  for(const {vertex,a,b,offset} of now.midpoints){
   const m=now.mesh.vertices[vertex],u=previous.vertices[a],v=previous.vertices[b]
   assert.ok(Math.abs(m[1]-(u[1]+v[1])/2-offset)<1e-12)
   assert.equal(m[0],(u[0]+v[0])/2);assert.equal(m[2],(u[2]+v[2])/2)
   assert.ok(Math.abs(offset)<=.8*.5**(level-1))
  }
 }
})
test('triangle zero amplitude stays flat and invalid or huge inputs remain bounded',()=>{
 assert.equal(typeof rules.triangleMidpointStages,'function')
 assert.ok(rules.triangleMidpointStages(3,0,0,.5).every(s=>s.mesh.vertices.every(v=>v[1]===0)))
 const stages=rules.triangleMidpointStages(100,NaN,NaN,Infinity)
 assert.equal(stages.length,6)
 assert.ok(stages.every(s=>s.mesh.vertices.flat().every(Number.isFinite)))
 assert.equal(rules.triangleMidpointStages(-1,1,1,1).length,1)
})
