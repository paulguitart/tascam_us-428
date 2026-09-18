const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
let now=1000;
const s={require:()=>require('../api/midiremote_api_v1'),Date:{now:()=>now}};vm.createContext(s);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','PreSonus_IOStation.js'),'utf8'),s);
const state={},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
let metronome=0;const writes=[],modes=[];
s.metronomeFeedbackValue.getProcessValue=()=>metronome;s.metronomeFeedbackValue.setProcessValue=(_,v)=>{metronome=v;writes.push(v)};
for(const name of ['Click','Pan'])s.buttons[name].setProcessValue=(c,v)=>{if(v){modes.push(name);s.activateKnobMode(c,name,{})}};
s.knob.getProcessValue=()=>.5;
const press=s.mSection.btn_Click.mSurfaceValue.mOnProcessValueChange;
function start(mode='Pan',shift='0'){s.activateKnobMode(ctx,mode,{});state.shiftEnabled=shift;writes.length=0;modes.length=0;now+=1000}
for(const shift of ['0','1']){
 start('Pan',shift);press(ctx,1);press(ctx,1);assert.equal(state.knobMode,'Pan');assert.deepEqual(modes,[]);
 now+=599;s.deviceDriver.mOnIdle(ctx);assert.deepEqual(writes,[]);press(ctx,0);press(ctx,0);assert.deepEqual(modes,['Click']);
 // Short tap in CLICK keeps existing previous-mode recall.
 now+=10;press(ctx,1);press(ctx,0);assert.equal(state.knobMode,'Pan');
 for(const initial of [0,1]){
  start('Pan',shift);metronome=initial;press(ctx,1);now+=600;s.deviceDriver.mOnIdle(ctx);
  assert.deepEqual(writes,[1-initial]);assert.equal(state.knobMode,'Pan');assert.equal(state.shiftEnabled,shift);
  now+=2000;press(ctx,1);s.deviceDriver.mOnIdle(ctx);press(ctx,0);press(ctx,0);
  assert.deepEqual(writes,[1-initial]);assert.deepEqual(modes,[]);
 }
}
// Late release crosses threshold without an intervening idle tick.
start();press(ctx,1);now+=600;press(ctx,0);assert.equal(writes.length,1);assert.deepEqual(modes,[]);
start('Click');press(ctx,1);now+=600;s.deviceDriver.mOnIdle(ctx);press(ctx,0);assert.equal(state.knobMode,'Click');assert.deepEqual(modes,[]);
// Disconnect/page exit cancels pending holds; a stale release cannot select a mode.
for(const cancel of [()=>s.resetHardwareState(ctx),()=>s.resetButtonRouting(ctx),()=>s.page.mOnDeactivate(ctx,{})]){
 start();press(ctx,1);cancel();now+=1000;s.deviceDriver.mOnIdle(ctx);press(ctx,0);assert.deepEqual(writes,[]);assert.deepEqual(modes,[]);
}
console.log('PASS: CLICK short release, previous-mode recall, threshold/late release, one toggle per hold, SHIFT/mode preservation and cancellation');
