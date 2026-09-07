// Run with node --test tools/tests/amazon-click.test.js. No analytics requests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../../assets/js/site.js'), 'utf8');
function setup({path='/', href='https://www.amazon.co.jp/dp/B0C2YK1CS6?tag=aidesklabo-22', area='budget', gtag=true, target=true}={}) {
  const handlers={}, sent=[];
  const link={href, closest(s) {return (s==='#showcaseTrack' && area==='ranking') || (s==='.card' && area==='budget') || (s==='article .card' && area==='article') ? {} : s==='section' ? {querySelector:()=>area==='budget'?{}:null} : null;}};
  const window={location:{pathname:path},matchMedia:()=>({matches:false})};
  if(gtag) window.gtag=(...args)=>sent.push(args);
  const document={addEventListener:(n,fn)=>{(handlers[n] ||= []).push(fn);},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
  vm.runInNewContext(source,{window,document,URL});
  function fire(type='click',button=0,extra={}) {
    const e={type,button,target:target?{closest:s=>s==='a.btn-amazon'?link:null}:null,preventDefault(){throw Error('Navigation intercepted');},...extra};
    handlers[type].forEach(fn=>fn(e));
  }
  return {sent,fire,window,link};
}
test('normal, keyboard and modifier activation send once each; no navigation interception',()=>{
  const s=setup(); s.fire();s.fire('click',0,{detail:0});s.fire('click',0,{ctrlKey:true});s.fire('click',0,{metaKey:true});
  assert.equal(s.sent.length,4);
  assert.equal(s.sent[0][0],'event');assert.equal(s.sent[0][1],'amazon_click');
  assert.deepEqual(JSON.parse(JSON.stringify(s.sent[0][2])),{send_to:'G-M4L5M94YCB',product_asin:'B0C2YK1CS6',placement:'home_budget',page_path:'/'});
});
test('middle button only once; ignore right clicks',()=>{const s=setup();s.fire('click',1);s.fire('auxclick',1);s.fire('auxclick',2);s.fire('click',2);assert.equal(s.sent.length,1);});
test('placements and index normalization',()=>{for(const [path,area,want] of [['/index.html','ranking','home_ranking'],['/reviews/a/index.html','article','article_product'],['/','unknown','other']]){const s=setup({path,area});s.fire();assert.equal(s.sent[0][2].placement,want);assert.equal(s.sent[0][2].page_path,path.replace(/\/index\.html$/,'/'));}});
test('reject non-Amazon, malformed, non-HTTPS and invalid ASIN URLs',()=>{for(const href of ['garbage','https://amazon.co.jp.evil.test/dp/B0C2YK1CS6','https://evil.test/dp/B0C2YK1CS6','http://amazon.co.jp/dp/B0C2YK1CS6','https://amazon.co.jp/dp/B0C2YK1CS6X','https://amazon.co.jp/dp/short']){const s=setup({href});s.fire();assert.equal(s.sent.length,0,href);}});
test('missing targets and blocked analytics remain harmless',()=>{for(const options of [{gtag:false},{target:false}]){const s=setup(options);assert.doesNotThrow(()=>s.fire());assert.equal(s.sent.length,0);}const s=setup();s.window.gtag=()=>{throw Error('blocked');};assert.doesNotThrow(()=>s.fire());});
