const assert=require('node:assert/strict'), fs=require('fs'), vm=require('vm');
const source=fs.readFileSync(require('path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
const leds=[], writes=[], bindings=[];
let pan=.5;
const scope={ENABLE_PAN_COLOR:true,WHITE:[127,127,127],BLUE:[0,0,127],MAGENTA:[127,0,127],cPan:42,
 setRGBLED_color:(_,note,color)=>leds.push(Array.from(color)),onLED(){},
 surface:{makeCustomValueVariable:()=>({getProcessValue:()=>pan,setProcessValue:(_,v)=>{pan=v;writes.push(v);}})},
 page:{mHostAccess:{mTrackSelection:{mMixerChannel:{mValue:{mPan:{}}}}},makeValueBinding:(...args)=>bindings.push(args)},
 mSection:{knob_Press:{mSurfaceValue:{}}},toggleModeEffect:()=>writes.push('send')};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf('var panFeedbackValue ='),source.indexOf('function assignKnobControls(')),scope);
scope.setupPanFeedback();
assert.equal(bindings.length,1);assert.equal(bindings[0][1],scope.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan);
for(const [value,expected] of [[0,[0,0,127]],[.375,[31.75,31.75,127]],[.5,[127,127,127]],[.625,[127,31.75,127]],[1,[127,0,127]]]) assert.deepEqual(Array.from(scope.getPanColor(value)),expected);
// A tiny movement immediately produces approximately half of the target color.
assert(scope.getPanColor(.499999)[0] < 63.5);
assert(scope.getPanColor(.499999)[0] > 63);
assert(scope.getPanColor(.500001)[1] < 63.5);
assert(scope.getPanColor(.500001)[1] > 63);
scope.ENABLE_PAN_COLOR=false;assert.deepEqual(Array.from(scope.getPanColor(0)),[127,127,127]);scope.ENABLE_PAN_COLOR=true;
const state={knobMode:'Pan'}, ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
pan=0;scope.panFeedbackValue.mOnProcessValueChange(ctx);assert.deepEqual(leds.pop(),[0,0,127]);
state.knobMode='Send';scope.panFeedbackValue.mOnProcessValueChange(ctx);assert.equal(leds.length,0);
pan=1;state.knobMode='Pan';scope.updatePanLED(ctx);assert.deepEqual(leds.pop(),[127,0,127]);
const start=source.indexOf('    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange =');
vm.runInContext(source.slice(start,source.indexOf('    // Korg zoom pattern:',start)),scope);
const press=v=>scope.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,v);
press(1);press(1);press(0);assert.deepEqual(writes,[.5]);assert.equal(pan,.5);
scope.FADER_HOST_UNITY=.789087;
scope.knob={setProcessValue:(_,v)=>writes.push(v)};
state.knobMode='Send';press(1);press(1);press(0);assert.deepEqual(writes,[.5,.789087]);
console.log('PASS: pan gradient, color flag, host feedback, inactive LEDs, center push and Send level reset');
// Resetting level preserves either send enable state; the existing BYPASS handler still toggles it.
let sendEnabled=0,sendLevel=.2;
scope.isMetronomeBypassMode=()=>false;
scope.firstSendEnabledFeedbackValue={getProcessValue:()=>sendEnabled,setProcessValue:(_,v)=>{sendEnabled=v;}};
scope.knob.setProcessValue=(_,v)=>{sendLevel=v;};
const toggleStart=source.indexOf('function toggleModeEffect(context)');
vm.runInContext(source.slice(toggleStart,source.indexOf('function updateKnobModeLEDs',toggleStart)),scope);
for(const initial of [0,1]){
 sendEnabled=initial;sendLevel=.2;press(1);press(1);press(0);
 assert.equal(sendEnabled,initial);assert.equal(sendLevel,.789087);
 scope.toggleModeEffect(ctx);assert.equal(sendEnabled,1-initial);assert.equal(sendLevel,.789087);
 scope.toggleModeEffect(ctx);assert.equal(sendEnabled,initial);
}
console.log('PASS: Send reset preserves send enable state; BYPASS toggles without changing level');
