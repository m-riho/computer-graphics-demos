import test from 'node:test'
import assert from 'node:assert/strict'
const examples=['point_cloud','quadtree','octree','sdf','metaball','fractal','ifs_fern','lsystem','midpoint_displacement','perlin_noise','particle_system']
function finite(value){if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite)}
for(const name of examples)test(`student example ${name} runs directly in Node`,async()=>{
 const module=await import(`../examples/05-natural-modeling/${name}.ts`)
 const result=module.runExample();assert.ok(result&&typeof result==='object');finite(result)
 assert.ok(JSON.stringify(result).length>2)
})
