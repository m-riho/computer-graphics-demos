import test from 'node:test'
import assert from 'node:assert/strict'
import { matrixFromBasis2D, linearMap2D } from '../packages/cg-algorithms/src/linear-map2d.ts'

test('basis images become columns, and any vector is the same linear combination', () => {
 const u=[2,0],v=[1,1],p=[-2,3]
 assert.deepEqual(matrixFromBasis2D(u,v),[2,1,0,1])
 assert.deepEqual(linearMap2D(u,v,[1,0]).image,u)
 assert.deepEqual(linearMap2D(u,v,[0,1]).image,v)
 assert.deepEqual(linearMap2D(u,v,p),{matrix:[2,1,0,1],xPart:[-4,-0],yPart:[3,3],image:[-1,3],determinant:2})
 assert.deepEqual(p,[-2,3])
})
test('origin, rotation, reflection and collapse are valid linear maps', () => {
 assert.deepEqual(linearMap2D([0,1],[-1,0],[2,3]).image,[-3,2])
 assert.equal(linearMap2D([-1,0],[0,1],[2,3]).determinant,-1)
 assert.deepEqual(linearMap2D([1,0],[2,0],[2,3]).image,[8,0])
 assert.equal(linearMap2D([1,0],[2,0],[2,3]).determinant,0)
 assert.deepEqual(linearMap2D([0,0],[0,0],[2,3]).image,[0,0])
 assert.deepEqual(linearMap2D([2,-1],[-1,2],[0,0]).image,[0,0])
})
test('linearity holds for signed and fractional coefficients', () => {
 const u=[.5,-1.5],v=[2,.25],p=[1,-2],q=[3,4]
 const a=linearMap2D(u,v,p).image,b=linearMap2D(u,v,q).image
 assert.deepEqual(linearMap2D(u,v,[p[0]+q[0],p[1]+q[1]]).image,a.map((n,i)=>n+b[i]))
 assert.deepEqual(linearMap2D(u,v,p.map(n=>-2*n)).image,a.map(n=>-2*n))
})
test('invalid or nonfinite vectors and overflow are rejected', () => {
 for(const v of [[1],[],[1,2,3],[NaN,1],[1,Infinity]]) assert.throws(()=>linearMap2D(v,[0,1],[1,1]),RangeError)
 assert.throws(()=>linearMap2D([1,0],[0,1],[NaN,0]),RangeError)
 assert.throws(()=>linearMap2D([1e308,0],[0,1],[2,0]),RangeError)
})
