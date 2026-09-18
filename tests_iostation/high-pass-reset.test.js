const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','PreSonus_IOStation.js'),'utf8').replace(/\r\n/g,'\n');
const s={};vm.createContext(s);
const toggleStart=source.indexOf('function toggleModeEffect(context)');
const toggleEnd=source.indexOf('function updateKnobModeLEDs(',toggleStart);
assert(toggleStart>=0&&toggleEnd>toggleStart);
vm.runInContext(source.slice(toggleStart,toggleEnd),s);
s.state={knobMode:'HighPass',highPassEnabled:'0',knobPressRouted:''};
s.ctx={getState:k=>s.state[k]||'',setState:(k,v)=>s.state[k]=v};
let enabled=0;const writes=[];
s.highPassEnabledFeedbackValue={getProcessValue:()=>enabled,setProcessValue:(_,v)=>{enabled=v;s.state.highPassEnabled=v?'1':'0';writes.push(v)}};
s.isTrackFaderBypassMode=()=>false;s.isMouseLinkMode=()=>false;s.isMetronomeBypassMode=()=>false;
s.updateHighPassLED=()=>{};s.updateBypassLED=()=>{};
const pushStart=source.indexOf('mSection.knob_Press.mSurfaceValue.mOnProcessValueChange = function(context, value) {');
const pushEnd=source.indexOf('// Korg zoom pattern:',pushStart);
assert(pushStart>=0&&pushEnd>pushStart);
s.mSection={knob_Press:{mSurfaceValue:{}}};
vm.runInContext(source.slice(pushStart,pushEnd),s);
const push=s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange;
for(const [initial,expected] of [[0,1],[1,0]]){
  enabled=initial;s.state.highPassEnabled=String(initial);writes.length=0;
  push(s.ctx,1);push(s.ctx,1);push(s.ctx,0);
  assert.equal(enabled,expected);assert.deepEqual(writes,[expected]);
}
// BYPASS uses the same mode effect and remains a high-pass toggle.
s.toggleModeEffect(s.ctx);assert.equal(enabled,1);
s.toggleModeEffect(s.ctx);assert.equal(enabled,0);
console.log('PASS: Channel knob push toggles high-pass once per press; BYPASS toggle remains intact');
