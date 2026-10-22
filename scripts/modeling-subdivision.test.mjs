import test from 'node:test';
import assert from 'node:assert/strict';
import { cubeMesh, meshEdges } from '../packages/cg-algorithms/src/mesh.ts';
import { subdivisionInput, subdivide, catmullClark, loopSubdivision, modifiedButterfly, dooSabin } from '../packages/cg-algorithms/src/subdivision.ts';
const methods = ['catmull-clark', 'loop', 'butterfly', 'doo-sabin'];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
function closed(mesh) {
  const edges = new Map();
  for (const f of mesh.faces) for (let i = 0; i < f.length; i++) {
    const a = f[i], b = f[(i + 1) % f.length], key = [a,b].sort((x,y)=>x-y).join(':');
    const entry = edges.get(key) ?? []; entry.push([a,b]); edges.set(key,entry);
  }
  for (const pair of edges.values()) { assert.equal(pair.length,2); assert.deepEqual(pair[0],pair[1].toReversed()); }
  assert.equal(mesh.vertices.length - edges.size + mesh.faces.length, 2);
}
test('Catmull-Clark cube uses face, edge and valence-three vertex rules', () => {
  const input = cubeMesh(), output = catmullClark(input);
  assert.deepEqual([output.vertices.length,meshEdges(output).length,output.faces.length],[26,48,24]);
  input.vertices[0].forEach((x,i)=>near(output.vertices[0][i],x*5/9));
  const center = input.faces[0].reduce((p,i)=>p.map((x,k)=>x+input.vertices[i][k]/4),[0,0,0]);
  center.forEach((x,i)=>near(output.vertices[8+12][i],x));
  closed(output);
});
test('Loop uses original cosine beta on valence four and 3/8 edge mask', () => {
  const input = subdivisionInput('loop'), output = loopSubdivision(input);
  near(output.vertices[0][0], 33/64);
  const first = meshEdges(input)[0], expected = input.vertices[first[0]].map((x,i)=>(x+input.vertices[first[1]][i])*3/8);
  expected.forEach((x,i)=>near(output.vertices[input.vertices.length][i],x));
  assert.deepEqual([output.vertices.length,meshEdges(output).length,output.faces.length],[18,48,32]); closed(output);
});
test('Modified Butterfly preserves old points and applies valence-four mask', () => {
  const input = subdivisionInput('butterfly'), output = modifiedButterfly(input);
  assert.deepEqual(output.vertices.slice(0,6),input.vertices);
  const first=meshEdges(input)[0], expected=input.vertices[first[0]].map((x,i)=>(x+input.vertices[first[1]][i])*5/8);
  expected.forEach((x,i)=>near(output.vertices[6][i],x)); closed(output);
});
test('Modified Butterfly supports valence-three extraordinary vertices', () => {
  const tetra={vertices:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],faces:[[0,2,1],[0,1,3],[0,3,2],[1,2,3]]};
  const out=modifiedButterfly(tetra), [a,b]=meshEdges(tetra)[0];
  tetra.vertices[a].forEach((x,i)=>near(out.vertices[4][i],(x+tetra.vertices[b][i])*2/3)); closed(out);
});
test('Doo-Sabin creates face, edge and vertex faces with correct corner weights', () => {
  const input=cubeMesh(), output=dooSabin(input), f=input.faces[0];
  const weights=[9/16,3/16,1/16,3/16];
  for(let k=0;k<3;k++) near(output.vertices[0][k],f.reduce((s,v,i)=>s+weights[i]*input.vertices[v][k],0));
  assert.deepEqual([output.vertices.length,meshEdges(output).length,output.faces.length],[24,48,26]);
  assert.equal(output.faces.filter(f=>f.length===3).length,8); closed(output);
});
test('all four schemes remain finite and closed through level four without mutating input', () => {
  for(const method of methods){
    const input=subdivisionInput(method), snapshot=structuredClone(input);
    for(let level=0;level<=4;level++) {
      const result=subdivide(input,method,level); closed(result);
      assert.ok(result.vertices.flat().every(Number.isFinite));
      if(method==='butterfly') assert.deepEqual(result.vertices.slice(0,input.vertices.length),input.vertices);
      if(level>0 && method!=='butterfly') for(const p of input.vertices) assert.ok(!result.vertices.some(q=>q.every((x,i)=>Math.abs(x-p[i])<1e-10)));
    }
    assert.deepEqual(input,snapshot);
  }
});
test('invalid, open, inconsistent, touching and non-triangular meshes fail explicitly', () => {
  assert.throws(()=>loopSubdivision(cubeMesh()), /triangle/i);
  assert.throws(()=>modifiedButterfly(cubeMesh()), /triangle/i);
  const open=cubeMesh();open.faces.pop();assert.throws(()=>catmullClark(open),/closed/i);
  const reversed=cubeMesh();reversed.faces[0].reverse();assert.throws(()=>dooSabin(reversed),/orient/i);
  const invalid=cubeMesh();invalid.vertices[0][0]=NaN;assert.throws(()=>catmullClark(invalid),/finite/i);
  const a=cubeMesh(), b=cubeMesh();
  const touching={vertices:[...a.vertices,...b.vertices.slice(1)],faces:[...a.faces,...b.faces.map(f=>f.map(i=>i===0?0:i+7))]};
  assert.throws(()=>catmullClark(touching),/manifold/i);
  for(const level of [-1,5,NaN,1.5]) assert.throws(()=>subdivide(cubeMesh(),'catmull-clark',level),/level/i);
  assert.throws(()=>subdivide(cubeMesh(),'unknown',1),/method/i);
});
test('zero-area closed meshes are rejected before refinement', () => {
  const flat=cubeMesh();flat.vertices=flat.vertices.map(()=>[0,0,0]);
  assert.throws(()=>catmullClark(flat),/area/i);
});
test('Modified Butterfly general extraordinary mask gives known valence-five prediction', () => {
  const n=5, vertices=Array.from({length:n},(_,i)=>[Math.cos(2*Math.PI*i/n),Math.sin(2*Math.PI*i/n),0]);
  vertices.push([0,0,1],[0,0,-1]);
  const faces=[];
  for(let i=0;i<n;i++) {const j=(i+1)%n;faces.push([i,j,n],[j,i,n+1]);}
  const input={vertices,faces}, output=modifiedButterfly(input);
  const edge=meshEdges(input).findIndex(([a,b])=>a===0&&b===n);
  // At the valence-5 pole: (1/2,0,3/4). At the valence-4 equator: (3/4,0,1/2).
  [5/8,0,5/8].forEach((x,i)=>near(output.vertices[vertices.length+edge][i],x));
  closed(output);
});
test('Modified Butterfly uses eight-point mask on a regular valence-six edge', () => {
  const input=modifiedButterfly(subdivisionInput('butterfly'));
  const edges=meshEdges(input), degree=input.vertices.map(()=>0);
  edges.forEach(([a,b])=>{degree[a]++;degree[b]++;});
  const edge=edges.findIndex(([a,b])=>degree[a]===6&&degree[b]===6), [a,b]=edges[edge];
  const adjacent=input.faces.map((f,i)=>({f,i})).filter(({f})=>f.includes(a)&&f.includes(b));
  const weights=new Map([[a,1/2],[b,1/2]]);
  for(const {f,i} of adjacent){
    const c=f.find(v=>v!==a&&v!==b);weights.set(c,(weights.get(c)??0)+1/8);
    for(const endpoint of [a,b]) {
      const outer=input.faces.find((q,j)=>j!==i&&q.includes(endpoint)&&q.includes(c)).find(v=>v!==endpoint&&v!==c);
      weights.set(outer,(weights.get(outer)??0)-1/16);
    }
  }
  const expected=[0,1,2].map(k=>[...weights].reduce((s,[v,w])=>s+input.vertices[v][k]*w,0));
  const output=modifiedButterfly(input);
  expected.forEach((x,i)=>near(output.vertices[input.vertices.length+edge][i],x));
});
test('all schemes commute with affine coordinate changes', () => {
  const transform=([x,y,z])=>[2*x+.3*y+1,-y+2,.5*z-x-4];
  for(const method of methods){
    const input=subdivisionInput(method), transformed={vertices:input.vertices.map(transform),faces:input.faces};
    const a=subdivide(input,method,2), b=subdivide(transformed,method,2);
    a.vertices.map(transform).forEach((p,v)=>p.forEach((x,k)=>near(x,b.vertices[v][k])));
  }
});
