import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
const source = fs.readFileSync(new URL('../quartz/static/wiki-analytics.js', import.meta.url), 'utf8')
function boot(href='https://wiki.zhanzhanai.com/map', preferences={}) {
  const handlers={}, scripts=[], storage=new Map(), calls=[]
  const location=new URL(href)
  const context={URL,URLSearchParams,Set,location,navigator:preferences,innerHeight:800,setTimeout,clearTimeout,
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    document:{head:{append:s=>scripts.push(s)},createElement:()=>({dataset:{}}),addEventListener:(e,f)=>handlers[e]=f,querySelector:()=>null},
    addEventListener:()=>{},umami:{track:(...args)=>calls.push(args)}}
  context.window=context
  vm.runInNewContext(source,context)
  return {context,handlers,scripts,storage,calls}
}
assert.equal(boot('http://localhost:4327/').scripts.length,0)
assert.equal(boot(undefined,{doNotTrack:'1'}).scripts.length,0)
assert.equal(boot(undefined,{globalPrivacyControl:true}).scripts.length,0)
assert.equal(boot('https://wiki.zhanzhanai.com/privacy?analytics=off').scripts.length,0)
const test=boot()
assert.equal(test.scripts.length,1)
const sanitized=test.context.wikiAnalyticsFilter('event',{url:'/map?secret=hidden&utm_source=douyin&utm_campaign=video_01#private',referrer:'https://example.com/secret?q=password'})
assert.equal(sanitized.url,'/map?utm_source=douyin&utm_campaign=video_01')
assert.equal(sanitized.referrer,'https://example.com')
test.scripts[0].onload();test.handlers.nav();test.handlers.nav()
assert.equal(test.calls.length,1)
test.context.location.pathname='/input';test.handlers.nav()
assert.equal(test.calls.length,2)
test.storage.set('umami.disabled','1')
assert.equal(test.context.wikiAnalyticsFilter('event',{}),false)
console.log('PASS: domain, privacy signals, opt-out, URL minimization, SPA deduplication')
