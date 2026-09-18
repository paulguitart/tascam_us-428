// API-free host simulation: no running Cubase or MIDI hardware required.
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
let code=fs.readFileSync(path.join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
// Deliberately enable volume transforms: PreGain must bypass both.
for(const [key,value] of Object.entries({ENABLE_FADER_UNITY_CALIBRATION:true,ENABLE_FADER_LOW_END_SNAP:true,FADER_HOST_UNITY:.75,FADER_HARDWARE_UNITY:.8}))
 code=code.replace(new RegExp('const '+key+' = [^\\r\\n]+'),'const '+key+' = '+value);
const s={require:()=>require('../api/midiremote_api_v1')};vm.createContext(s);vm.runInContext(code,s);
const state={},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
const bindings=[];s.page.makeValueBinding=(input,host)=>{const b={input,host,setSubPage(page){this.page=page;return this}};bindings.push(b);return b};
s.assignSelectedTrackControls();s.setupPreGainFeedback();
assert(/page\.makeValueBinding\(knob, hostPreFilter\.mLowCutFreq\)\s*\.setSubPage\(knobModes\.HighPass\)/.test(code));
assert(!/makeValueBinding\(knob, hostPreFilter\.(mGain|mLowCutSlope)\)/.test(code));
const pre=s.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter;
assert(bindings.some(b=>b.input===s.fader.mSurfaceValue&&b.host===pre.mGain&&b.page===s.faderModes.PreGain));
assert(bindings.some(b=>b.input===s.fader.mSurfaceValue&&b.host===s.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume&&b.page===s.faderModes.Track));
assert(bindings.some(b=>b.input===s.lowCutSlopeFeedbackValue&&b.host===pre.mLowCutSlope));
let gain=.5,volume=.3,touched=0;const motors=[],colors={},lamps={},writes=[];
s.midiOut.sendMidi=(_,m)=>{if(m[0]===224)motors.push(m[1]+128*m[2])};
s.setRGBLED_color=(_,n,c)=>colors[n]=Array.from(c);s.setTransportLed=(_,n,on)=>lamps[n]=on;
s.faderTouch.getProcessValue=()=>touched;s.knob.getProcessValue=()=>.5;
s.preGainFeedbackValue.getProcessValue=()=>gain;
s.preGainFeedbackValue.setProcessValue=(c,v)=>{gain=v;writes.push(['gain',v]);s.preGainFeedbackValue.mOnProcessValueChange(c,v)};
s.faderTargetFeedback.Track.getProcessValue=()=>volume;
s.faderTargetFeedback.Track.setProcessValue=(_,v)=>{volume=v;writes.push(['volume',v])};
s.fader.mSurfaceValue.setProcessValue=(c,v)=>{if(state.faderTarget==='PreGain')s.preGainFeedbackValue.setProcessValue(c,v);else volume=v};
s.activateKnobMode(ctx,'PreGain',{});assert.equal(state.faderTarget,'PreGain');assert.equal(motors.pop(),8192);
for(const v of [0,.005,.25,.5,.75,1]){
 touched=1;s.var_faderInput.mOnProcessValueChange(ctx,v);assert.equal(gain,v);assert.equal(volume,.3);
 touched=0;state.lastMotorPosition='';s.preGainFeedbackValue.mOnProcessValueChange(ctx,v);assert.equal(motors.pop(),Math.round(v*16383));
 state.lastMotorPosition='';s.fader.mSurfaceValue.mOnProcessValueChange(ctx,v);assert.equal(motors.pop(),Math.round(v*16383));
}
s.resetCurrentFader(ctx);assert.equal(gain,.5);assert.equal(volume,.3);assert.equal(motors.pop(),8192);assert.deepEqual(colors[s.cTouch],[127,127,127]);assert.equal(lamps[s.cTouch],true);
for(const [v,color,on] of [[0,[127,48,0],true],[1,[127,0,0],true],[.3,null,false]]){
 gain=v;s.preGainFeedbackValue.mOnProcessValueChange(ctx,v);assert.equal(lamps[s.cTouch],on);if(color)assert.deepEqual(colors[s.cTouch],color);
}
// Host feedback chooses arbitrary nonuniform enum positions; never assumed quarters.
const process={6:.03,12:.19,24:.41,36:.73,48:.97};let slope=48;const slopeWrites=[];
s.lowCutSlopeFeedbackValue.getDisplayValue=()=>slope+' dB/oct';
s.lowCutSlopeFeedbackValue.getProcessValue=()=>process[slope];
s.lowCutSlopeFeedbackValue.setDisplayValue=()=>assert.fail('Display text writes caused the 48 dB regression');
const mapping={};s.activateFaderNudge(ctx,mapping);
const choices=[6,12,24,36,48];
let deferred=false,displaySlope=slope;
s.lowCutSlopeFeedbackValue.getDisplayValue=()=>displaySlope+' dB/oct';
function hostStep(m,d){
 assert.equal(m,mapping);
 slope=choices[Math.max(0,Math.min(4,choices.indexOf(slope)+d))];
 slopeWrites.push(slope);
 if(!deferred){displaySlope=slope;s.lowCutSlopeFeedbackValue.mOnDisplayValueChange(ctx,slope+' dB/oct')}
}
pre.mLowCutSlope.increment=m=>hostStep(m,1);
pre.mLowCutSlope.decrement=m=>hostStep(m,-1);
s.lowCutSlopeFeedbackValue.setProcessValue=()=>assert.fail('No guessed normalized writes');
s.mouseKnobInput.setProcessValue=()=>assert.fail('PreGain must not recenter encoder');
s.knob.setProcessValue=()=>assert.fail('PreGain must not align mapped encoder');
const push=()=>{s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,0)};
const turn=(v,d)=>s.mouseKnobInput.mOnProcessValueChange(ctx,v,d);
push();assert.deepEqual(slopeWrites,[36,24,12]);turn(0,-.01);assert.equal(slope,6);
push();turn(1,.01);assert.equal(slope,24);turn(1,.01);assert.equal(slope,36);turn(1,.01);assert.equal(slope,48);turn(1,.01);assert.equal(slope,48);
for(let i=0;i<5;i++)turn(0,-.01);assert.equal(slope,6);
for(const [choice,p] of Object.entries(process))assert.equal(Number(state['lowCutSlopeProcess'+choice]),p);
for(const d of [0,NaN,Infinity])turn(.5,d);assert.equal(slope,6);
// Reset from every choice, even when feedback is delivered after all host steps.
for(const initial of choices){
 slope=displaySlope=initial;deferred=true;push();assert.equal(slope,12);
 deferred=false;displaySlope=slope;turn(0,-.01);assert.equal(slope,6);
 push();turn(1,.01);assert.equal(slope,24);
}
slope=displaySlope=6;
// Both CHANNEL layers share pre-gain; SHIFT must not move or retarget it.
volume=.3;
for(const mode of ['HighPass','PreGain','HighPass']){
 s.activateKnobMode(ctx,mode,{});assert.equal(state.faderTarget,'PreGain');
 touched=1;s.var_faderInput.mOnProcessValueChange(ctx,.8);assert.equal(gain,.8);assert.equal(volume,.3);
 touched=0;state.lastMotorPosition='';s.fader.mSurfaceValue.mOnProcessValueChange(ctx,.75);assert.equal(motors.pop(),Math.round(.75*16383));
 s.resetCurrentFader(ctx);assert.equal(gain,.5);assert.equal(volume,.3);assert.deepEqual(colors[s.cTouch],[127,127,127]);
 gain=.9;s.preGainFeedbackValue.mOnProcessValueChange(ctx,gain);assert.equal(motors.pop(),Math.round(.9*16383));
 for(const on of [0,1]){
  s.highPassEnabledFeedbackValue.mOnProcessValueChange(ctx,on);
  assert.deepEqual(colors[s.cChannel],on?[127,0,0]:[127,127,127]);
  gain=.1;s.preGainFeedbackValue.mOnProcessValueChange(ctx,gain);
  assert.deepEqual(colors[s.cChannel],on?[127,0,0]:[127,127,127]);
 }
}
// PAN still has calibrated track volume.
s.activateKnobMode(ctx,'Pan',{});assert.equal(state.faderTarget,'Track');
touched=1;s.var_faderInput.mOnProcessValueChange(ctx,.8);assert(Math.abs(volume-.75)<1e-12);touched=0;
s.activateKnobMode(ctx,'HighPass',{});
let enabled=0,phase=0;s.highPassEnabledFeedbackValue.getProcessValue=()=>enabled;s.highPassEnabledFeedbackValue.setProcessValue=(_,v)=>enabled=v;
s.polarityFeedbackValue.getProcessValue=()=>phase;s.polarityFeedbackValue.setProcessValue=(_,v)=>phase=v;
state.highPassEnabled='0';push();assert.equal(enabled,1);assert.equal(slope,6);
for(const mode of ['HighPass','PreGain']){state.knobMode=mode;s.toggleModeEffect(ctx);s.updateBypassLED(ctx);assert.equal(lamps[s.cBypass],phase>0)}
assert.equal(enabled,1);
console.log('PASS: both Channel fader targets, full-range feedback/motor mapping, reset/LEDs, native slope enum stepping, endless turns after reset, shared CHANNEL pre-gain/filter LEDs and PAN calibration isolation');
