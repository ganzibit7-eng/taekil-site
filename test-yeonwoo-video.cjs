const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function harness({reduced=false,saveData=false,reject=false,observer=true}={}){
 const events={},mediaEvents={},connectionEvents={},items=[];let intersect;
 const classes=new Set();
 const video={dataset:{videoSrc:'assets/yeonwoo-listening.mp4'},paused:true,loads:0,plays:0,attrs:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},getAttribute(k){return this.attrs[k]||null},setAttribute(k,v){this.attrs[k]=v},set src(v){this.attrs.src=v},getBoundingClientRect:()=>({width:390,height:630,top:0,bottom:630}),load(){this.loads++},play(){this.plays++;if(reject)return Promise.reject(new Error('blocked'));this.paused=false;return Promise.resolve()},pause(){this.paused=true},addEventListener:(k,v)=>items[k]=v};
 const media={matches:reduced,addEventListener:(k,v)=>mediaEvents[k]=v};
 const connection={saveData,addEventListener:(k,v)=>connectionEvents[k]=v};
 const document={hidden:false,querySelector:s=>s==='video.ai-chat-bgvideo'?video:null,getElementById:()=>null,addEventListener:(k,v)=>events[k]=v};
 const context={document,navigator:{connection},matchMedia:()=>media,innerHeight:850,window:observer?{IntersectionObserver:true}:{},IntersectionObserver:class{constructor(cb){intersect=cb}observe(){}},Promise};
 vm.runInNewContext(fs.readFileSync(__dirname+'/yeonwoo-video.js','utf8'),context);
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 return {video,classes,document,media,connection,events,mediaEvents,connectionEvents,items,tick,async see(value){intersect([{target:video,isIntersecting:value,intersectionRatio:value?1:0}]);await tick()}};
}
test('visible videos load lazily, mute and loop; offscreen playback pauses',async()=>{const h=harness();assert.equal(h.video.loads,0);await h.see(true);assert.equal(h.video.loads,1);assert.equal(h.video.muted,true);assert.equal(h.video.loop,true);assert.equal(h.video.playsInline,true);assert.equal(h.video.paused,false);await h.see(false);assert.equal(h.video.paused,true);assert.equal(h.classes.has('yeonwoo-playing'),false);await h.see(true);assert.equal(h.video.loads,1);assert.equal(h.video.paused,false)});
test('background tab pauses and visible tab resumes',async()=>{const h=harness();await h.see(true);h.document.hidden=true;h.events.visibilitychange();assert.equal(h.video.paused,true);h.document.hidden=false;h.events.visibilitychange();await h.tick();assert.equal(h.video.paused,false)});
for(const setting of ['reduced','saveData'])test(setting+' initially keeps poster without video download',async()=>{const h=harness({[setting]:true});await h.see(true);assert.equal(h.video.loads,0);assert.equal(h.classes.has('yeonwoo-playing'),false);if(setting==='reduced'){h.media.matches=false;h.mediaEvents.change()}else{h.connection.saveData=false;h.connectionEvents.change()}await h.tick();assert.equal(h.video.paused,false)});
test('play rejection and media error retain image fallback without retry loop',async()=>{for(const reject of [true,false]){const h=harness({reject});await h.see(true);if(!reject)h.items.error();await h.see(false);await h.see(true);assert.equal(h.video.plays,1);assert.equal(h.video.paused,true);assert.equal(h.classes.has('yeonwoo-playing'),false)}});
test('unsupported observer keeps static posters',()=>{const h=harness({observer:false});assert.equal(h.video.loads,0);assert.equal(h.video.plays,0)});
