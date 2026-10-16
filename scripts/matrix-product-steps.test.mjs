import test from 'node:test'
import assert from 'node:assert/strict'
import { matrixProductTrace, matrixProductFrame } from '../packages/cg-algorithms/src/matrix-product-steps.ts'

test('row-column trace records factors, products and result position in reading order',()=>{
 const trace=matrixProductTrace([[1,2],[3,4]],[[2],[1]])
 assert.deepEqual(trace,[{row:0,column:0,terms:[{left:1,right:2,product:2},{left:2,right:1,product:2}],sum:4},{row:1,column:0,terms:[{left:3,right:2,product:6},{left:4,right:1,product:4}],sum:10}])
 const product=matrixProductTrace([[1,2],[0,1]],[[2,0],[1,1]])
 assert.deepEqual(product.map(x=>[x.row,x.column,x.sum]),[[0,0,4],[0,1,2],[1,0,1],[1,1,1]])
})
test('3D rotation and 4D homogeneous point/direction preserve signed terms and zero factors',()=>{
 assert.deepEqual(matrixProductTrace([[0,-1,0],[1,0,0],[0,0,1]],[[1],[2],[3]]).map(x=>x.sum),[-2,1,3])
 const t=[[1,0,0,3],[0,1,0,-1],[0,0,1,2],[0,0,0,1]]
 assert.deepEqual(matrixProductTrace(t,[[1],[2],[3],[1]]).map(x=>x.sum),[4,1,5,1])
 assert.deepEqual(matrixProductTrace(t,[[1],[2],[3],[0]]).map(x=>x.sum),[1,2,3,0])
})
test('frames select, multiply one pair at a time, commit then advance to the next output cell',()=>{
 const trace=matrixProductTrace([[1,2],[3,4]],[[2],[1]])
 assert.deepEqual(matrixProductFrame(trace,0),{entry:0,visibleTerms:0,committed:0,done:false,lastCursor:8})
 assert.deepEqual(matrixProductFrame(trace,1),{entry:0,visibleTerms:1,committed:0,done:false,lastCursor:8})
 assert.equal(matrixProductFrame(trace,2).visibleTerms,2)
 assert.equal(matrixProductFrame(trace,2).committed,0)
 assert.equal(matrixProductFrame(trace,3).committed,1)
 assert.equal(matrixProductFrame(trace,4).entry,1)
 assert.equal(matrixProductFrame(trace,4).visibleTerms,0)
 assert.equal(matrixProductFrame(trace,7).committed,2)
 assert.deepEqual(matrixProductFrame(trace,8),{entry:1,visibleTerms:2,committed:2,done:true,lastCursor:8})
 assert.deepEqual(matrixProductFrame(trace,100),matrixProductFrame(trace,8))
 assert.deepEqual(matrixProductFrame(trace,-2),matrixProductFrame(trace,0))
})
test('trace rejects invalid dimensions and nonfinite arithmetic without modifying inputs',()=>{
 const a=[[1,2],[3,4]], b=[[2],[1]], before=JSON.stringify([a,b]);matrixProductTrace(a,b);assert.equal(JSON.stringify([a,b]),before)
 for(const [x,y] of [[[],b],[[[1],[2]],b],[[[1,2],[3]],b],[[[1,NaN],[3,4]],b],[[[Infinity,1],[2,3]],b], [a,[[1,2],[3]]]])assert.throws(()=>matrixProductTrace(x,y),RangeError)
 assert.throws(()=>matrixProductTrace([[1e308,1e308],[1,1]],[[2],[2]]),RangeError)
})
