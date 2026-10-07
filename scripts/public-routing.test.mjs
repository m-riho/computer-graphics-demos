import test from 'node:test'
import assert from 'node:assert/strict'
import {defineSessions} from '../public-site/src/session-model.ts'
import {resolveRoute,sessionHref,topicHref} from '../public-site/src/routing.ts'
const second={id:'02',number:2,title:'色とデジタル画像',description:'色',topics:[{id:'sampling',title:'標本化'}]}
const third={id:'03',number:3,title:'テスト用の別回',description:'テスト',topics:[{id:'sampling',title:'別回の同名ID'}]}
const catalog=defineSessions([third,second])
test('adding a session preserves order and scopes matching topic IDs',()=>{
 assert.deepEqual(catalog.map(s=>s.id),['02','03'])
 assert.equal(resolveRoute('/',catalog).kind,'home')
 assert.equal(resolveRoute('/sessions/03',catalog).session,third)
 const a=resolveRoute('/sessions/02/sampling/demo',catalog),b=resolveRoute('/sessions/03/sampling/code',catalog)
 assert.equal(a.topic,second.topics[0]);assert.equal(b.topic,third.topics[0]);assert.equal(b.mode,'code')
 assert.equal(sessionHref(third),'#/sessions/03');assert.equal(topicHref(third,third.topics[0],'code'),'#/sessions/03/sampling/code')
})
test('old topic URLs resolve only to session 02',()=>{
 assert.equal(resolveRoute('/sampling',catalog).session,second)
 assert.equal(resolveRoute('/sampling/code',catalog).topic,second.topics[0])
 assert.equal(resolveRoute('/sampling/demo',[third]).kind,'not-found')
})
test('unknown sessions, topics and malformed URLs are not content pages',()=>{
 for(const url of ['/sessions/99','/sessions/03/unknown/demo','/sessions/02/sampling/edit','/sessions/02/sampling/demo/extra','/sampling/code/extra','/license/extra','//sessions/02'])assert.equal(resolveRoute(url,catalog).kind,'not-found',url)
 assert.equal(resolveRoute('/license',catalog).kind,'license')
})
test('catalog rejects ambiguous IDs and incomplete sessions',()=>{
 assert.throws(()=>defineSessions([second,second]))
 assert.throws(()=>defineSessions([second,{...third,number:2}]))
 assert.throws(()=>defineSessions([{...third,id:'../03'}]))
 assert.throws(()=>defineSessions([{...third,topics:[]}]))
 assert.throws(()=>defineSessions([{...third,topics:[third.topics[0],third.topics[0]]}]))
})
