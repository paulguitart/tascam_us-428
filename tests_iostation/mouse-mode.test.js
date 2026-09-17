// Standalone LINK lifecycle and physical routing regression tests.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
const state={},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
let parameter=.32,locked=0,touched=0;const motors=[],writes=[],bindings=[];let touchOn=false,touchColor=null,bypassOn=false;
const s={Date,Math,Number,String,isFinite,
 ENABLE_METRONOME_FADER:true,FADER_HOST_UNITY:.789087,FADER_HARDWARE_UNITY:.7,
 ENABLE_FADER_TOUCH_INPUT:true,ENABLE_FADER_UNITY_CALIBRATION:true,ENABLE_FADER_LOW_END_SNAP:true,FADER_LOW_END_THRESHOLD:.02,
 ENABLE_FADER_TOUCH_PROTECTION:true,ENABLE_MIDI_OUTPUT_CACHE:true,
 GREEN:[0,127,0],MAGENTA:[127,0,127],cTouch:77,cBypass:3,
 setRGBLED_color:(_,note,color)=>{if(note===77)touchColor=color},
 setTransportLed:(_,note,on)=>{if(note===77)touchOn=on;if(note===3)bypassOn=on},
 cShift:6,onLED(){},offLED(){},updateTouchLED(){},updateKnobModeLEDs(){},updateBypassLED(){},
 isMetronomeBypassMode:()=>false,selectedTrackToggleValues:{},buttons:{},
 mappedFaderTouch:{setProcessValue(){}},faderTouch:{getProcessValue:()=>touched},fader:{mSurfaceValue:{}},var_faderInput:{},
 midiOut:{sendMidi:(_,m)=>motors.push(m)},mSection:{knob_Press:{mSurfaceValue:{}}},
 knob:{getProcessValue:()=>parameter},faderTargetFeedback:{},
 surface:{makeCustomValueVariable:()=>({setProcessValue(){}})},
 faderModes:Object.fromEntries(['Track','StereoOut','Metronome','Mouse'].map(k=>[k,{mAction:{mActivate:{trigger(){}}}}]))
};
vm.createContext(s);
function run(from,to){vm.runInContext(source.slice(source.indexOf(from),source.indexOf(to,source.indexOf(from))),s)}
run('function isMouseLinkMode(', 'var preGainFeedbackValue');
s.mouseLockFeedbackValue={getProcessValue:()=>locked,setProcessValue:(_,v)=>locked=v};
s.mouseParameterFeedbackValue={getProcessValue:()=>parameter,setProcessValue:(_,v)=>{parameter=v;writes.push(v)}};
run('function resolveKnobModeButton(', 'var highPassColors');
run('function toggleModeEffect(', 'function updateKnobModeLEDs');
run('function updateTouchLED(', 'function setupFaderTargetFeedback');
run('function clampFader(', '// Future footswitch assignments');
s.fader.mSurfaceValue.setProcessValue=(_,v)=>{parameter=v;writes.push(v);s.syncMouseFader(ctx)};
run('    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange =', '    // Korg zoom pattern:');
run('function assignButtonRouting(', 'for (var buttonIndex =');
{const start=source.indexOf('    knob.mOnProcessValueChange =');const end=source.indexOf('page.mOnActivate =',start);vm.runInContext(source.slice(start,end).trimEnd().slice(0,-1),s)}
s.setRGBLED_color=(_,note,color)=>{if(note===77)touchColor=color};
s.setTransportLed=(_,note,on)=>{if(note===77)touchOn=on;if(note===3)bypassOn=on};
const push=v=>s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,v);
function settle(){s.updateMouseLinkCapture(ctx,Number(state.mouseCaptureAt))}

const touchButton={normalName:'Touch',shiftedName:'Latch',physicalButton:{mSurfaceValue:{}}};
s.assignButtonRouting(touchButton);const touch=touchButton.physicalButton.mSurfaceValue.mOnProcessValueChange;
const turn=diff=>s.knob.mOnProcessValueChange(ctx,.5,diff);
s.activateKnobMode(ctx,'Mouse',{});assert.equal(state.faderTarget,'Track');assert.equal(locked,0);
assert.equal(touchOn,false);turn(.1);assert.equal(parameter,.32);
// TOUCH explicitly captures; held repeats must not restart capture.
touch(ctx,1);const deadline=state.mouseCaptureAt;touch(ctx,1);assert.equal(state.mouseCaptureAt,deadline);touch(ctx,0);
assert.equal(state['held.Touch'],'');assert.equal(touchOn,false);
s.updateMouseLinkCapture(ctx,Number(deadline)-1);assert.equal(locked,0);
settle();assert.equal(locked,1);assert.equal(state.mouseStartingValue,'0.32');
assert.equal(touchOn,true);assert.deepEqual(touchColor,s.GREEN);
turn(.1);assert(Math.abs(parameter-.42)<1e-12);assert.deepEqual(touchColor,s.MAGENTA);
push(1);const resetWrites=writes.length;push(1);push(0);assert.equal(writes.length,resetWrites);
assert.equal(parameter,.32);assert.deepEqual(touchColor,s.GREEN);
// Returning manually or via Cubase also clears dirty status, within fader resolution.
parameter=.6;s.syncMouseFader(ctx);assert.deepEqual(touchColor,s.MAGENTA);
parameter=.32+1e-7;s.syncMouseFader(ctx);assert.deepEqual(touchColor,s.GREEN);
s.activateKnobMode(ctx,'MouseFader',{});assert.equal(state.shiftEnabled,'1');assert.equal(state.faderTarget,'Mouse');
assert.equal(state.mouseStartingValue,'0.32');turn(.1);assert.equal(parameter,.32+1e-7);
// Bypass retains the lock and snapshot and blocks rotation, fader, reset and motor output.
s.toggleModeEffect(ctx);assert.equal(locked,1);assert.equal(state.mouseStartingValue,'0.32');
const count=writes.length,motorCount=motors.length;touched=1;
s.var_faderInput.mOnProcessValueChange(ctx,.8);push(1);push(0);turn(.1);
assert.equal(writes.length,count);parameter=.7;s.syncMouseFader(ctx);
assert.equal(motors.length,motorCount);assert.deepEqual(touchColor,s.MAGENTA);
s.toggleModeEffect(ctx);assert.equal(locked,1);assert.equal(state.mouseStartingValue,'0.32');
s.var_faderInput.mOnProcessValueChange(ctx,.6);assert.equal(writes.length,count); // Held fader waits for release.
touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);
push(1);push(0);assert.equal(parameter,.32);assert.deepEqual(touchColor,s.GREEN);
// Parameter input bypasses volume calibration and low-end snapping.
touched=1;s.var_faderInput.mOnProcessValueChange(ctx,.01);assert.equal(parameter,.01);assert.deepEqual(touchColor,s.MAGENTA);
s.var_faderInput.mOnProcessValueChange(ctx,.7);assert.equal(parameter,.7);
touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);
// Shifted TOUCH captures a new target/value instead of applying volume unity.
parameter=.47;touch(ctx,1);assert.equal(state['held.Touch'],'Touch');touch(ctx,0);settle();
assert.equal(parameter,.47);assert.equal(state.mouseStartingValue,'0.47');assert.deepEqual(touchColor,s.GREEN);
s.activateKnobMode(ctx,'Mouse',{});assert.equal(state.mouseStartingValue,'0.47');
turn(.2);assert(Math.abs(parameter-.67)<1e-12);assert.deepEqual(touchColor,s.MAGENTA);
s.toggleModeEffect(ctx);const beforeKnob=writes.length;turn(-.1);push(1);push(0);assert.equal(writes.length,beforeKnob);
assert.equal(locked,1);s.toggleModeEffect(ctx);push(1);push(0);assert.equal(parameter,.47);
// Retained fader modes cannot keep controlling a mouse target after leaving LINK.
s.activateKnobMode(ctx,'MouseFader',{});s.activateKnobMode(ctx,'Zoom',{});
assert.equal(state.faderTarget,'Track');assert.equal(locked,0);assert.equal(state.mouseStartingValue,'');
s.activateKnobMode(ctx,'MouseFader',{});assert.equal(locked,0);assert.equal(touchOn,false);
assert(!source.includes('page.makeValueBinding(knob, page.mHostAccess.mMouseCursor.mValueUnderMouse)'));
console.log('PASS: explicit TOUCH capture, clean/dirty LEDs, reset, bypass retains lock and blocks controls, SHIFT handoff and safe fader routing');

// LINK's BYPASS lamp reports the bypass switch, independently of lock/capture.
run('function updateBypassLED(', '// BYPASS toggles');
for (const mode of ['Mouse','MouseFader']) {
 state.knobMode=mode;
 for (const lock of [0,1]) for (const bypass of ['', '1']) {
  locked=lock;state.mouseBypassed=bypass;s.updateBypassLED(ctx);
  assert.equal(bypassOn,bypass==='1');
 }
}
s.firstSendEnabledFeedbackValue={getProcessValue:()=>1};
state.knobMode='Pan';s.updateBypassLED(ctx);assert.equal(bypassOn,true);
s.firstSendEnabledFeedbackValue.getProcessValue=()=>0;s.updateBypassLED(ctx);assert.equal(bypassOn,false);
console.log('PASS: LINK BYPASS LED on means bypassed in both variants; Pan retains its enable indication');
