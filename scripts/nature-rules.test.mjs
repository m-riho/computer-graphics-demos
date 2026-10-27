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
