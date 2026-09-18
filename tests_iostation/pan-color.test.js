const assert=require('node:assert/strict'), fs=require('fs'), vm=require('vm');
const source=fs.readFileSync(require('path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
const leds=[], writes=[], bindings=[], nav={};
let pan=.5;
const scope={isMouseLinkMode: mode=>mode==="Mouse"||mode==="MouseFader",ENABLE_PAN_COLOR:true,WHITE:[127,127,127],BLUE:[0,0,127],MAGENTA:[127,0,127],cPan:42,cPrev:46,cNext:47,setTransportLed:(_,n,on)=>nav[n]=on,
 setRGBLED_color:(_,note,color)=>leds.push(Array.from(color)),onLED(){},
 surface:{makeCustomValueVariable:()=>({getProcessValue:()=>pan,setProcessValue:(_,v)=>{pan=v;writes.push(v);}})},
 page:{mHostAccess:{mTrackSelection:{mMixerChannel:{mValue:{mPan:{}}}}},makeValueBinding:(...args)=>bindings.push(args)},
 mSection:{knob_Press:{mSurfaceValue:{}}},toggleModeEffect:()=>writes.push('send')};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf('var panFeedbackValue ='),source.indexOf('function assignKnobControls(')),scope);
scope.setupPanFeedback();
assert.equal(bindings.length,1);assert.equal(bindings[0][1],scope.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan);
const state={knobMode:'Pan'}, ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
for(const [v,left,right] of [[0,true,false],[.499999,true,false],[.5,true,true],[.500001,false,true],[1,false,true],[NaN,false,false]]){
 pan=v;scope.panFeedbackValue.mOnProcessValueChange(ctx);
 assert.deepEqual(leds.pop(),[127,127,127]);assert.equal(nav[46],left);assert.equal(nav[47],right);
}
state.knobMode='Send';scope.panFeedbackValue.mOnProcessValueChange(ctx);assert.equal(leds.length,0);
state.knobMode='Pan';
const start=source.indexOf('    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange =');
vm.runInContext(source.slice(start,source.indexOf('    // Korg zoom pattern:',start)),scope);
const press=v=>scope.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,v);
press(1);press(1);press(0);assert.deepEqual(writes,[.5]);assert.equal(pan,.5);
scope.FADER_HOST_UNITY=.789087;
let pre=0;scope.updateSendModeLED=()=>{};scope.updateBypassLED=()=>{};
scope.firstSendPrePostFeedbackValue={getProcessValue:()=>pre,setProcessValue:(_,v)=>{pre=v;writes.push(v)}};
state.knobMode='Send';press(1);press(1);press(0);assert.deepEqual(writes,[.5,1]);
console.log('PASS: white PAN, direction LEDs, host feedback, inactive LEDs, center push and Send pre/post toggle');
// Resetting level preserves either send enable state; the existing BYPASS handler still toggles it.
let sendEnabled=0,sendLevel=.2;
scope.isMetronomeBypassMode=()=>false;
vm.runInContext(source.slice(source.indexOf('function isTrackFaderBypassMode('),source.indexOf('function clampFader(')),scope);
scope.firstSendEnabledFeedbackValue={getProcessValue:()=>sendEnabled,setProcessValue:(_,v)=>{sendEnabled=v;}};

const toggleStart=source.indexOf('function toggleModeEffect(context)');
vm.runInContext(source.slice(toggleStart,source.indexOf('function updateKnobModeLEDs',toggleStart)),scope);
for(const initial of [0,1]){
 sendEnabled=initial;sendLevel=.2;press(1);press(1);press(0);
 assert.equal(sendEnabled,initial);assert.equal(sendLevel,.2);
 scope.toggleModeEffect(ctx);assert.equal(sendEnabled,1-initial);assert.equal(sendLevel,.2);
 scope.toggleModeEffect(ctx);assert.equal(sendEnabled,initial);
}
console.log('PASS: Send pre/post toggle preserves send level and enable state; BYPASS toggles without changing level');
// Exercise physical navigation and mode transitions with the API-free SDK stub.
const full={require:()=>require('../api/midiremote_api_v1')};vm.createContext(full);vm.runInContext(source,full);
const live={},device={getState:k=>live[k]||'',setState:(k,v)=>live[k]=v},lights={},pulses=[];
full.setTransportLed=(_,n,on)=>lights[n]=on;full.knob.getProcessValue=()=>.5;
full.panFeedbackValue.getProcessValue=()=>pan;
full.buttons.Prev.setProcessValue=(_,v)=>pulses.push(['Prev',v]);full.buttons.Next.setProcessValue=(_,v)=>pulses.push(['Next',v]);
const prev=full.mSection.btn_Prev.mSurfaceValue.mOnProcessValueChange,next=full.mSection.btn_Next.mSurfaceValue.mOnProcessValueChange;
pan=.2;full.activateKnobMode(device,'Pan',{});
prev(device,1);prev(device,0);next(device,1);next(device,0);
assert.deepEqual(pulses,[['Prev',1],['Prev',0],['Next',1],['Next',0]]);
assert.equal(lights[full.cPrev],true);assert.equal(lights[full.cNext],false);
pan=.5;full.panFeedbackValue.mOnProcessValueChange(device);assert.equal(lights[full.cPrev],true);assert.equal(lights[full.cNext],true);
full.activateKnobMode(device,'Send',{});assert.equal(lights[full.cPrev],false);assert.equal(lights[full.cNext],false);
prev(device,1);assert.equal(lights[full.cPrev],true);prev(device,0);assert.equal(lights[full.cPrev],false);
pan=.9;full.panFeedbackValue.mOnProcessValueChange(device);assert.equal(lights[full.cNext],false);
full.activateKnobMode(device,'Pan',{});assert.equal(lights[full.cPrev],false);assert.equal(lights[full.cNext],true);
prev(device,1);full.activateKnobMode(device,'HighPass',{});assert.equal(lights[full.cPrev],true);assert.equal(lights[full.cNext],false);prev(device,0);assert.equal(lights[full.cPrev],false);
console.log('PASS: navigation actions unchanged, PAN direction survives button release, mode exit restores press LEDs, host feedback isolated outside PAN');
// Repeated physical PAN presses toggle its own pair, ignoring prior mode history.
full.buttons.Pan.setProcessValue=(c,v)=>{if(v)full.activateKnobMode(c,'Pan',{})};
full.buttons.Send.setProcessValue=(c,v)=>{if(v)full.activateKnobMode(c,'Send',{})};
let shiftOn=false;full.onLED=(_,n)=>{if(n===full.cShift)shiftOn=true};full.offLED=(_,n)=>{if(n===full.cShift)shiftOn=false};
const panButton=full.mSection.btn_Pan.mSurfaceValue.mOnProcessValueChange;
for(const prior of ['Click','HighPass','Mouse']){
 full.activateKnobMode(device,prior,{});
 for(const [mode,target,shift] of [['Pan','Track',false],['Send','Send',true],['Pan','Track',false],['Send','Send',true]]){
  panButton(device,1);panButton(device,1);panButton(device,0);
  assert.equal(live.knobMode,mode);assert.equal(live.faderTarget,target);
  assert.equal(live.shiftEnabled,shift?'1':'0');assert.equal(shiftOn,shift);
 }
}
console.log('PASS: physical PAN toggles PAN/Send with matching fader and SHIFT LED, duplicate suppression and no previous-mode recall');
