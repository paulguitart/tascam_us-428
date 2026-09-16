const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const s={require:()=>require('../api/midiremote_api_v1')};vm.createContext(s);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8'),s);
const state={knobMode:'HighPass'},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
let enabled=0,frequency=.6;const writes=[];
s.highPassEnabledFeedbackValue.getProcessValue=()=>enabled;s.highPassEnabledFeedbackValue.setProcessValue=(_,v)=>{enabled=v;writes.push('enable')};
s.highPassFrequencyFeedbackValue.setProcessValue=(_,v)=>{frequency=v;writes.push('frequency')};
const push=s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange;
for(const initial of [0,1]){enabled=initial;frequency=.6;writes.length=0;push(ctx,1);push(ctx,1);push(ctx,0);assert.equal(frequency,0);assert.equal(enabled,initial);assert.deepEqual(writes,['frequency']);}
s.buttons.Bypass.setProcessValue=()=>{};const bypass=s.uSection.btn_Bypass.mSurfaceValue.mOnProcessValueChange;
bypass(ctx,1);bypass(ctx,0);assert.equal(enabled,0);assert.equal(frequency,0);
bypass(ctx,1);bypass(ctx,0);assert.equal(enabled,1);
console.log('PASS: high-pass push resets cutoff once without changing enable; BYPASS toggles enable');
