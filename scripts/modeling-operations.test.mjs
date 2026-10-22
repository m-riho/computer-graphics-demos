import test from 'node:test'
import assert from 'node:assert/strict'
import { createPrimitive, booleanCSG } from '../packages/cg-algorithms/src/csg.ts'
import { createProfile, extrude, revolve } from '../packages/cg-algorithms/src/sweep.ts'
import { bevelCube } from '../packages/cg-algorithms/src/bevel.ts'

function volume(mesh) {
  let result = 0
  for (const face of mesh.faces) for (let i = 1; i + 1 < face.length; i++) {
    const [a, b, c] = [mesh.vertices[face[0]], mesh.vertices[face[i]], mesh.vertices[face[i + 1]]]
    result += a[0] * (b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0])
  }
  return result / 6
}
function closed(mesh) {
  assert(mesh.vertices.every(v => v.every(Number.isFinite)))
  const edges = new Map()
  for (const f of mesh.faces) {
    assert(new Set(f).size >= 3)
    for (let i=0;i<f.length;i++) {
      const a=f[i], b=f[(i+1)%f.length], key=[a,b].sort((x,y)=>x-y).join(',')
      const entry=edges.get(key) ?? [0,0]; entry[0]++; entry[1]+=a<b?1:-1; edges.set(key,entry)
    }
  }
  for (const incidence of edges.values()) assert.deepEqual(incidence,[2,0])
}
const near = (a,b) => assert(Math.abs(a-b)<1e-6, `${a} != ${b}`)

test('extrusion seals convex and concave caps with outward winding', () => {
  for (const name of ['rectangle','circle','l-shape','vase']) {
    const mesh=extrude(createProfile(name),2); closed(mesh); assert(volume(mesh)>0)
  }
  near(volume(extrude(createProfile('rectangle'),2)),8)
  near(volume(extrude(createProfile('l-shape'),2)),6)
})
test('revolve welds axis poles and full-turn seam, caps partial turns', () => {
  for (const angle of [90,180,360]) for (const axis of ['x','y','z']) {
    const mesh=revolve(createProfile('vase'),angle,12,axis); closed(mesh); assert(volume(mesh)>0)
  }
  assert.equal(revolve(createProfile('rectangle'),0,12).faces.length,0)
})
test('rounded box stays closed and inside its original bounds as density grows', () => {
  const sharp=bevelCube(0,1); closed(sharp); near(volume(sharp),8)
  const coarse=bevelCube(.3,1), smooth=bevelCube(.3,5)
  closed(coarse); closed(smooth)
  assert(smooth.faces.length>coarse.faces.length)
  assert(volume(smooth)>volume(coarse)); assert(volume(smooth)<8)
  assert(smooth.vertices.every(v=>v.every(x=>Math.abs(x)<=1+1e-9)))
})
test('BSP Boolean cube volumes distinguish every operation', () => {
  const a=createPrimitive('cube'), b=createPrimitive('cube',{position:[1,0,0]})
  for (const [op,expected] of [['union',12],['intersection',4],['a-b',4],['b-a',4]]) near(volume(booleanCSG(a,b,op)),expected)
})
test('Boolean handles identical, disjoint, tangent, nested and empty solids', () => {
  const a=createPrimitive('cube'), empty={vertices:[],faces:[]}
  near(volume(booleanCSG(a,a,'union')),8)
  assert.equal(booleanCSG(a,a,'a-b').faces.length,0)
  for (const x of [2,3]) assert.equal(booleanCSG(a,createPrimitive('cube',{position:[x,0,0]}),'intersection').faces.length,0)
  near(volume(booleanCSG(a,createPrimitive('cube',{scale:.5}),'a-b')),7)
  near(volume(booleanCSG(a,empty,'union')),8)
  assert.equal(booleanCSG(a,empty,'intersection').faces.length,0)
  near(volume(booleanCSG(a,empty,'a-b')),8)
})
test('primitive sphere and cylinder are outward, closed surfaces usable by CSG', () => {
  for (const kind of ['sphere','cylinder']) {
    const b=createPrimitive(kind,{segments:12}); closed(b); assert(volume(b)>0)
    const cut=booleanCSG(createPrimitive('cube'),b,'a-b')
    assert(cut.vertices.every(v=>v.every(Number.isFinite)))
    assert(volume(cut)>=0 && volume(cut)<8)
  }
})
test('operation parameters reject nonfinite and unsupported inputs', () => {
  assert.throws(()=>extrude([[0,0],[1,0],[0,1]],NaN))
  assert.throws(()=>revolve(createProfile('vase'),Infinity,12))
  assert.throws(()=>bevelCube(NaN,3))
  assert.throws(()=>createPrimitive('cube',{scale:Infinity}))
})
test('every primitive pairing preserves closed edge connectivity through all operations', () => {
  for (const a of ['cube','sphere','cylinder']) for (const b of ['cube','sphere','cylinder']) for (const op of ['union','intersection','a-b','b-a']) {
    closed(booleanCSG(createPrimitive(a),createPrimitive(b,{position:[.4,.2,.1],scale:.7}),op))
  }
})
test('default cylindrical cutter passes through the block rather than forming a hidden cavity', () => {
  const b=createPrimitive('cylinder',{scale:.7})
  assert(Math.min(...b.vertices.map(v=>v[1])) < -1)
  assert(Math.max(...b.vertices.map(v=>v[1])) > 1)
  const m=booleanCSG(createPrimitive('cube'),b,'a-b'); closed(m)
  // Cross-section polygon area times the block height is the removed volume.
  const expected=8-(16/2*Math.sin(2*Math.PI/16)*.7**2)*2
  near(volume(m),expected)
})
test('circle profile keeps a positive radius for a nonsingular torus', () => {
  assert(createProfile('circle').every(([r])=>r>0))
  closed(revolve(createProfile('circle'),360,16))
})
