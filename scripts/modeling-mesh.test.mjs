import test from 'node:test';
import assert from 'node:assert/strict';
import { cubeMesh, meshEdges, meshAdjacency, validateMesh, triangulateMesh, clampFinite } from '../packages/cg-algorithms/src/mesh.ts';
import { buildHalfEdges, faceLoop, vertexLoop } from '../packages/cg-algorithms/src/half-edge.ts';
import { analyzeManifold, manifoldPreset } from '../packages/cg-algorithms/src/manifold.ts';
import { eulerCharacteristic, splitEdge, splitFace, torusMesh } from '../packages/cg-algorithms/src/euler-characteristic.ts';
test('cube connectivity gives 12 unique edges and degree three at each vertex', () => {
 const mesh=cubeMesh(); assert.equal(meshEdges(mesh).length,12);
 const adj=meshAdjacency(mesh); assert.deepEqual(adj.vertexEdges.map(x=>x.length),Array(8).fill(3));
 assert.deepEqual(adj.edgeFaces.map(x=>x.length),Array(12).fill(2)); assert.equal(triangulateMesh(mesh).faces.length,12);
 assert.equal(validateMesh(mesh).length,0);
});
test('invalid inputs are rejected before traversal', () => {
 assert.ok(validateMesh({vertices:[[NaN,0,0]],faces:[[0,1,2]]}).length);
 assert.ok(validateMesh({vertices:[[0,0,0],[1,0,0],[2,0,0]],faces:[[0,1,2]]}).length);
 assert.equal(clampFinite(NaN,0,4,2),2); assert.equal(clampFinite(9,0,4),4);
 assert.throws(()=>buildHalfEdges({vertices:[],faces:[[0,1,2]]}));
});
test('halfedge origin convention supports face and vertex closed loops', () => {
 const mesh=cubeMesh(), hs=buildHalfEdges(mesh); assert.equal(hs.length,24);
 for(const h of hs){assert.equal(hs[h.twin].twin,h.id); assert.equal(hs[h.next].origin,h.destination); assert.equal(hs[h.twin].origin,h.destination);}
 assert.equal(faceLoop(hs,0).length,4); const loop=vertexLoop(hs,0); assert.equal(loop.length,3);
 assert.ok(loop.every(id=>hs[id].origin===hs[0].origin));
});
test('manifold classification checks edges and connected vertex links', () => {
 assert.equal(analyzeManifold(cubeMesh()).kind,'closed');
 assert.equal(analyzeManifold(manifoldPreset('open')).kind,'boundary');
 assert.equal(analyzeManifold(manifoldPreset('three-faces')).kind,'non-manifold');
 const touching=analyzeManifold(manifoldPreset('touching')); assert.equal(touching.kind,'non-manifold'); assert.ok(touching.badVertices.length); assert.equal(touching.badEdges.length,0);
 const internal=analyzeManifold(manifoldPreset('internal')); assert.equal(internal.kind,'boundary'); assert.equal(internal.components,2);
 const reversed=cubeMesh(); reversed.faces[0].reverse(); assert.equal(analyzeManifold(reversed).kind,'closed'); assert.ok(analyzeManifold(reversed).orientationConflicts.length);
});
test('Euler characteristic survives edge and face splits and distinguishes torus', () => {
 const cube=cubeMesh(); assert.equal(eulerCharacteristic(cube).chi,2);
 const edge=splitEdge(cube,0); assert.deepEqual(eulerCharacteristic(edge),{vertices:9,edges:13,faces:6,chi:2});
 const face=splitFace(cube,0); assert.deepEqual(eulerCharacteristic(face),{vertices:8,edges:13,faces:7,chi:2});
 assert.equal(eulerCharacteristic(torusMesh()).chi,0); assert.equal(analyzeManifold(torusMesh()).kind,'closed');
 assert.equal(cube.vertices.length,8); assert.equal(cube.faces.length,6);
 assert.throws(()=>splitEdge(cube,999));
});
test('successive edge then face splits preserve nondegenerate faces',()=>{
 let mesh=cubeMesh(); for(let i=0;i<4;i++)mesh=splitEdge(mesh,0);
 mesh=splitFace(mesh,0);assert.deepEqual(validateMesh(mesh),[]);assert.equal(eulerCharacteristic(mesh).chi,2);
});
