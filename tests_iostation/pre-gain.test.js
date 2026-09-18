const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const s={require:()=>require('../api/midiremote_api_v1')};vm.createContext(s);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8'),s);
const state={},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
let gain=.5,polarity=0;const colors=[],writes=[];
s.preGainFeedbackValue.getProcessValue=()=>gain;
s.preGainFeedbackValue.setProcessValue=(_,v)=>{gain=v;writes.push(v)};
s.polarityFeedbackValue.getProcessValue=()=>polarity;
s.polarityFeedbackValue.setProcessValue=(_,v)=>polarity=v;
s.setRGBLED_color=(_,note,color)=>colors.push(Array.from(color));s.onLED=()=>{};
let bypass;s.setTransportLed=(_,note,on)=>{if(note===s.cBypass)bypass=on};
state.knobMode='PreGain';
for(const [v,c] of [[.5,[127,127,127]],[0,[127,48,0]],[.499,[127,48,0]],[.501,[127,48,0]],[1,[127,48,0]]]){
  gain=v;s.preGainFeedbackValue.mOnProcessValueChange(ctx);assert.deepEqual(colors.pop(),c);
}
s.toggleModeEffect(ctx);s.updateBypassLED(ctx);assert.equal(polarity,1);assert.equal(bypass,true);
s.toggleModeEffect(ctx);s.updateBypassLED(ctx);assert.equal(polarity,0);assert.equal(bypass,false);
const slopeWrites=[];s.lowCutSlopeFeedbackValue.setDisplayValue=(_,v)=>slopeWrites.push(v);
gain=.1;const push=s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange;push(ctx,1);push(ctx,1);push(ctx,0);assert.deepEqual(writes,[]);assert.deepEqual(slopeWrites,['12']);
s.faderModes.Track.mAction.mActivate.trigger=()=>{};s.updateKnobModeLEDs=()=>{};s.updateTouchLED=()=>{};s.knob.getProcessValue=()=>.5;
s.activateKnobMode(ctx,'PreGain',{});assert.equal(state.faderTarget,'PreGain');
state.shiftEnabled='0';state.knobMode='HighPass';s.buttons.Bypass.setProcessValue=()=>{};
const press=s.uSection.btn_Bypass.mSurfaceValue.mOnProcessValueChange;press(ctx,1);press(ctx,1);press(ctx,0);assert.equal(polarity,1);
state.shiftEnabled='1';state.knobMode='PreGain';press(ctx,1);press(ctx,0);assert.equal(polarity,0);
state.knobMode='Pan';s.preGainFeedbackValue.mOnProcessValueChange(ctx);assert.equal(colors.length,0);
console.log('PASS: pre-gain white at 0 dB and amber otherwise; reset and phase BYPASS in both Channel modes');

// Exercise Channel/SHIFT transitions with action bindings simulated by their targets.
s.buttons.Channel.setProcessValue=(ctx,v)=>{if(v)s.activateKnobMode(ctx,'HighPass',{})};
s.buttons.PreGain.setProcessValue=(ctx,v)=>{if(v)s.activateKnobMode(ctx,'PreGain',{})};
let shiftLED=false;s.onLED=(_,note)=>{if(note===s.cShift)shiftLED=true};s.offLED=(_,note)=>{if(note===s.cShift)shiftLED=false};
s.activateKnobMode(ctx,'HighPass',{});assert.equal(state.shiftEnabled,'0');assert.equal(shiftLED,false);
const channel=s.mSection.btn_Channel.mSurfaceValue.mOnProcessValueChange;
channel(ctx,1);channel(ctx,1);channel(ctx,0);assert.equal(state.knobMode,'PreGain');assert.equal(state.shiftEnabled,'1');assert.equal(shiftLED,true);
channel(ctx,1);channel(ctx,0);assert.equal(state.knobMode,'HighPass');assert.equal(shiftLED,false);
const shift=s.uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange;
shift(ctx,1);shift(ctx,1);shift(ctx,0);assert.equal(state.knobMode,'PreGain');assert.equal(shiftLED,true);
shift(ctx,1);shift(ctx,0);assert.equal(state.knobMode,'HighPass');assert.equal(shiftLED,false);
s.activateKnobMode(ctx,'PreGain',{});s.activateKnobMode(ctx,'Pan',{});state.shiftEnabled='0';
assert.equal(s.resolveKnobModeButton(ctx,'Pan'),'PreGain');s.buttons.PreGain.setProcessValue(ctx,1);assert.equal(state.shiftEnabled,'1');assert.equal(shiftLED,true);
console.log('PASS: Channel toggles, immediate SHIFT transitions, duplicate presses and restored SHIFT LED');
