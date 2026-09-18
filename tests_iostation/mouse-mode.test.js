// Standalone LINK lifecycle and physical routing regression tests.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
const state={},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
let parameter=.32,locked=0,touched=0;const motors=[],writes=[],bindings=[];let touchOn=false,touchColor=null,bypassOn=false,linkColor=null;
const s={Date,Math,Number,String,isFinite,
 ENABLE_METRONOME_FADER:true,FADER_HOST_UNITY:.789087,FADER_HARDWARE_UNITY:.7,
 ENABLE_FADER_TOUCH_INPUT:true,ENABLE_FADER_UNITY_CALIBRATION:true,ENABLE_FADER_LOW_END_SNAP:true,FADER_LOW_END_THRESHOLD:.02,
 ENABLE_FADER_TOUCH_PROTECTION:true,ENABLE_MIDI_OUTPUT_CACHE:true,
 cLink:5,WHITE:[127,127,127],AMBER:[127,64,0],GREEN:[0,127,0],LINK_LOWER_COLOR:[127,0,40],MAGENTA:[127,0,127],cTouch:77,cBypass:3,
 setRGBLED_color:(_,note,color)=>{if(note===77)touchColor=color;if(note===5)linkColor=color},
 setTransportLed:(_,note,on)=>{if(note===77)touchOn=on;if(note===3)bypassOn=on},
 cShift:6,onLED(){},offLED(){},updateTouchLED(){},updateKnobModeLEDs(){},updateBypassLED(){},
 isMetronomeBypassMode:()=>false,selectedTrackToggleValues:{},buttons:{},
 mappedFaderTouch:{setProcessValue(){}},faderTouch:{getProcessValue:()=>touched},fader:{mSurfaceValue:{}},var_faderInput:{},
 midiOut:{sendMidi:(_,m)=>motors.push(m)},mSection:{knob_Press:{mSurfaceValue:{}}},
 knob:{getProcessValue:()=>parameter,setProcessValue(){}},mouseKnobInput:{getProcessValue:()=>parameter,setProcessValue(){}},faderTargetFeedback:{},
 surface:{makeCustomValueVariable:()=>({setProcessValue(){}})},
 faderModes:Object.fromEntries(['Track','StereoOut','Metronome','Mouse','Dormant'].map(k=>[k,{mAction:{mActivate:{trigger(){}}}}]))
};
vm.createContext(s);
function run(from,to){vm.runInContext(source.slice(source.indexOf(from),source.indexOf(to,source.indexOf(from))),s)}
run('function isMouseLinkMode(', 'var preGainFeedbackValue');
s.mouseLockFeedbackValue={getProcessValue:()=>locked,setProcessValue:(_,v)=>locked=v};
s.mouseParameterFeedbackValue={getProcessValue:()=>parameter,setProcessValue:(_,v)=>{parameter=v;writes.push(v)}};
run('function resolveKnobModeButton(', 'var highPassColors');
run('function toggleModeEffect(', 'function updateKnobModeLEDs');
run('function updateTouchLED(', 'function setupFaderTargetFeedback');
run('function isPanFaderBypassed(', '// Future footswitch assignments');
s.fader.mSurfaceValue.setProcessValue=(_,v)=>{parameter=v;writes.push(v);s.syncMouseFader(ctx)};
run('    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange =', '    // Korg zoom pattern:');
run('function assignButtonRouting(', 'for (var buttonIndex =');
run('function routeUnboundKnobTurn(', 'function assignKnobControls(');
{const start=source.indexOf('    knob.mOnProcessValueChange =');const end=source.indexOf('page.mOnActivate =',start);vm.runInContext(source.slice(start,end).trimEnd().slice(0,-1),s)}
s.setRGBLED_color=(_,note,color)=>{if(note===77)touchColor=color;if(note===5)linkColor=color};
s.setTransportLed=(_,note,on)=>{if(note===77)touchOn=on;if(note===3)bypassOn=on};
s.onLED=()=>{};
const push=v=>s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,v);
function settle(){s.updateMouseLinkCapture(ctx,Number(state.mouseCaptureAt))}

const touchButton={normalName:'Touch',shiftedName:'Latch',physicalButton:{mSurfaceValue:{}}};
s.assignButtonRouting(touchButton);const touch=touchButton.physicalButton.mSurfaceValue.mOnProcessValueChange;
const turn=diff=>s.mouseKnobInput.mOnProcessValueChange(ctx,.5,diff);
s.activateKnobMode(ctx,'Mouse',{});assert.equal(state.faderTarget,'Dormant');assert.equal(locked,0);
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
touched=1;s.var_faderInput.mOnProcessValueChange(ctx,.01);assert.equal(parameter,.01);assert.deepEqual(touchColor,s.LINK_LOWER_COLOR);
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
state.knobMode='Send';s.updateBypassLED(ctx);assert.equal(bypassOn,true);
s.firstSendEnabledFeedbackValue.getProcessValue=()=>0;s.updateBypassLED(ctx);assert.equal(bypassOn,false);
console.log('PASS: LINK BYPASS LED on means bypassed in both variants; Send retains its enable indication');

// Physical LINK clears a lock first, then switches modes on a separate unlocked press.
s.pulseVar=(context,button)=>{button.setProcessValue(context,1);button.setProcessValue(context,0)};
const linkMapping={normalName:'Link',shiftedName:'MouseFader',physicalButton:{mSurfaceValue:{}}};
s.assignButtonRouting(linkMapping);
s.buttons.Link.setProcessValue=(context,v)=>{if(v)s.activateKnobMode(context,'Mouse',{})};
s.buttons.MouseFader.setProcessValue=(context,v)=>{if(v)s.activateKnobMode(context,'MouseFader',{})};
const link=linkMapping.physicalButton.mSurfaceValue.mOnProcessValueChange;
for(const mode of ['Mouse','MouseFader']) {
 state.knobMode=mode;state.shiftEnabled=mode==='MouseFader'?'1':'0';
 state.faderTarget=mode==='MouseFader'?'Mouse':'Dormant';
 locked=1;state.mouseStartingValue='0.47';state.mouseBypassed='1';
 s.updateMouseLinkLED(ctx);assert.deepEqual(linkColor,s.AMBER);
 const valueBefore=parameter;
 link(ctx,1);link(ctx,1);assert.equal(state.knobMode,mode);assert.equal(locked,0);
 assert.equal(state.mouseStartingValue,'');assert.deepEqual(linkColor,s.WHITE);
 assert.equal(touchOn,false);assert.equal(parameter,valueBefore);assert.equal(state.mouseBypassed,'1');
 link(ctx,0);link(ctx,1);link(ctx,1);link(ctx,0);
 assert.equal(state.knobMode,mode==='Mouse'?'MouseFader':'Mouse');
 assert.equal(state.shiftEnabled,mode==='Mouse'?'1':'0');assert.equal(locked,0);
}
// An unlocked LINK press also cancels a pending capture, preventing a late relock.
state.knobMode='Mouse';locked=0;s.beginMouseLinkCapture(ctx);
link(ctx,1);link(ctx,0);s.updateMouseLinkCapture(ctx,Date.now()+1000);
assert.equal(locked,0);assert.equal(state.mouseCaptureAt,'');
// SHIFT itself switches controls without calling LINK's discard handler.
s.uSection={btn_Shift:{mSurfaceValue:{}}};
run('uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange =', 'function resetButtonRouting');
state.knobMode='Mouse';state.shiftEnabled='0';locked=1;state.mouseStartingValue='0.47';
s.uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange(ctx,1);
s.uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange(ctx,0);
assert.equal(state.knobMode,'MouseFader');assert.equal(locked,1);assert.equal(state.mouseStartingValue,'0.47');
console.log('PASS: amber/white lock feedback, LINK clear-then-toggle, repeated press suppression, capture cancellation and SHIFT preserves lock');

// Knob LINK has an unbound, dormant fader, even when track feedback arrives late.
let mappedTouch=-1;const activatedTargets=[];
s.mappedFaderTouch.setProcessValue=(_,v)=>mappedTouch=v;
for(const [name,mode] of Object.entries(s.faderModes))mode.mAction.mActivate.trigger=()=>activatedTargets.push(name);
state.mouseBypassed='';state.knobMode='MouseFader';state.faderTarget='Mouse';locked=1;
state.mouseStartingValue='0.47';parameter=.47;touched=1;state.pendingMotorPosition='.9';
s.activateKnobMode(ctx,'Mouse',{});
assert.equal(state.faderTarget,'Dormant');assert.equal(mappedTouch,0);assert.equal(state.pendingMotorPosition,'');
const dormantMotors=motors.length,dormantWrites=writes.length;
state.lastMotorPosition='7700';s.var_faderInput.mOnProcessValueChange(ctx,.8);
assert.equal(state.lastMotorPosition,'');
s.fader.mSurfaceValue.mOnProcessValueChange(ctx,.9);s.setMotorFader(ctx,.9);
s.faderTouch.mOnProcessValueChange(ctx,1);touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);
assert.equal(mappedTouch,0);assert.equal(motors.length,dormantMotors);assert.equal(writes.length,dormantWrites);
for(const [value,color] of [[.57,s.MAGENTA],[.37,s.LINK_LOWER_COLOR],[.47,s.GREEN],[.47-1e-7,s.GREEN]]){
 parameter=value;s.syncMouseFader(ctx);assert.deepEqual(touchColor,color);
}
assert.equal(motors.length,dormantMotors);
s.activateKnobMode(ctx,'MouseFader',{});assert.equal(motors.length,dormantMotors+1);
s.activateKnobMode(ctx,'Mouse',{});assert.deepEqual(activatedTargets,['Dormant','Mouse','Dormant']);
s.activateKnobMode(ctx,'Zoom',{});assert.equal(state.faderTarget,'Track');
console.log('PASS: dormant LINK fader blocks input, touch and stale motor feedback; SHIFT never selects track volume; directional TOUCH colors');

// One-shot encoder alignment: never unlock the hovered target or sync continuously.
let encoder=.9,delivery='sync';const encoderWrites=[],deferred=[],lockWrites=[];
s.mouseKnobInput.getProcessValue=()=>encoder;
s.mouseKnobInput.setProcessValue=(context,value)=>{
 const diff=value-encoder;encoder=value;encoderWrites.push(value);
 const callback=()=>s.mouseKnobInput.mOnProcessValueChange(context,value,diff);
 if(delivery==='sync')callback();else if(delivery==='deferred')deferred.push(callback);
};
s.mouseLockFeedbackValue.setProcessValue=(_,value)=>{locked=value;lockWrites.push(value);};
state.mouseBypassed='';s.activateKnobMode(ctx,'Mouse',{});
parameter=.32;s.beginMouseLinkCapture(ctx);settle();lockWrites.length=0;
assert.deepEqual(encoderWrites,[.32]); // Capture aligns once, without editing the host.
function detent(diff) {
 const next=Math.max(0,Math.min(1,encoder+diff));
 const applied=next-encoder;encoder=next;
 s.mouseKnobInput.mOnProcessValueChange(ctx,next,applied);
}
for(const callbackMode of ['sync','deferred','none']) {
 delivery=callbackMode;
 // Initial capture must have full travel even if the prior mode left the knob at an edge.
 for(const initialEncoder of [0,1]) {
  encoder=initialEncoder;parameter=.32;
  const before=writes.length,encoderBefore=encoderWrites.length;
  s.beginMouseLinkCapture(ctx);settle();
  while(deferred.length)deferred.shift()();
  assert.equal(writes.length,before);assert.equal(encoderWrites.length,encoderBefore+1);
  assert.equal(encoder,.32);assert.equal(parameter,.32);assert.equal(locked,1);
  lockWrites.length=0;
  for(let i=0;i<25;i++)detent(.05);
  assert.equal(parameter,1);
  for(let i=0;i<25;i++)detent(-.05);
  assert.equal(parameter,0);
  assert.deepEqual(lockWrites,[]); // Turning never releases the captured target.
 }

 for(let cycle=0;cycle<3;cycle++) {
  parameter=.9;encoder=.9;
  const before=writes.length,encoderBefore=encoderWrites.length;
  push(1);push(1);push(0);
  assert.equal(writes.length,before+1);assert.equal(encoderWrites.length,encoderBefore+1);
  while(deferred.length)deferred.shift()();
  assert.equal(writes.length,before+1);assert.equal(parameter,.32);assert.equal(encoder,.32);
  assert.equal(locked,1);assert.equal(state.mouseStartingValue,'0.32');
  for(let i=0;i<25;i++)detent(.05);
  assert.equal(parameter,1);
  push(1);push(0);while(deferred.length)deferred.shift()();
  for(let i=0;i<25;i++)detent(-.05);
  assert.equal(parameter,0);
 }
}
assert.deepEqual(lockWrites,[]);
const encoderBefore=encoderWrites.length;
parameter=.7;s.syncMouseFader(ctx);assert.equal(encoderWrites.length,encoderBefore);
s.activateKnobMode(ctx,'MouseFader',{});push(1);push(0);
assert.equal(parameter,.32);assert.equal(encoderWrites.length,encoderBefore);
s.activateKnobMode(ctx,'Mouse',{});state.mouseBypassed='1';
const before=writes.length;push(1);push(0);
assert.equal(writes.length,before);assert.equal(encoderWrites.length,encoderBefore);
assert.deepEqual(lockWrites,[]);
console.log('PASS: one encoder alignment per LINK knob reset, sync/deferred/no callback guards, repeated full travel, preserved lock and snapshot; no host-feedback/fader/bypass alignment');

// Page startup must explicitly activate knob LINK and never select a motorized target.
s.page={};s.activateFaderNudge=()=>{};s.restoreTransportLEDs=()=>{};
const activatedKnobModes=[];
s.knobModes=Object.fromEntries(['Mouse','Pan'].map(mode=>[mode,{mAction:{mActivate:{trigger(mapping){
 activatedKnobModes.push(mode);s.activateKnobMode(ctx,mode,mapping);
}}}}]));
run('page.mOnActivate =', 'page.mOnDeactivate =');
for(const priorMode of ['', 'MouseFader', 'Pan']) {
 state.knobMode=priorMode;state.shiftEnabled='1';state.linkShiftEnabled='1';
 state.faderTarget='Track';state.mouseStartingValue='.7';state.mouseCaptureAt='123';locked=1;
 state.pendingMotorPosition='.9';activatedTargets.length=0;activatedKnobModes.length=0;
 const motorBefore=motors.length,writeBefore=writes.length;
 s.page.mOnActivate(ctx,{});
 assert.deepEqual(activatedKnobModes,['Mouse']);
 assert(activatedTargets.length>0&&activatedTargets.every(target=>target==='Dormant'));
 assert.equal(state.knobMode,'Mouse');assert.equal(state.faderTarget,'Dormant');
 assert.equal(state.shiftEnabled,'0');assert.equal(state.linkShiftEnabled,'0');
 assert.equal(locked,0);assert.equal(state.mouseStartingValue,'');assert.equal(state.mouseCaptureAt,'');
 assert.equal(state.pendingMotorPosition,'');assert.equal(state.previousKnobMode,'');
 s.var_faderInput.mOnProcessValueChange(ctx,.8);s.syncMouseFader(ctx);
 assert.equal(motors.length,motorBefore);assert.equal(writes.length,writeBefore);
}
console.log('PASS: fresh/reloaded page starts in unlocked knob LINK, clears SHIFT and stale capture, and leaves fader dormant without motor or parameter writes');

// Selected-track pan feedback can reach the shared surface; it must not be input to LINK.
s.knob.setProcessValue=()=>assert.fail('LINK alignment must not write the host-bound knob');
state.mouseBypassed='';s.activateKnobMode(ctx,'Mouse',{});
delivery='sync';parameter=.5;s.beginMouseLinkCapture(ctx);settle();
const feedbackQueue=[];
for(const feedbackDelivery of ['sync','deferred']) {
 let editCount=0;
 s.mouseParameterFeedbackValue.setProcessValue=(context,value)=>{
  assert(++editCount<10,'Pan feedback loop');
  const delta=value-parameter;parameter=value;writes.push(value);
  const feedback=()=>{s.knob.mOnProcessValueChange(context,value,delta);s.syncMouseFader(context);};
  if(feedbackDelivery==='sync')feedback();else feedbackQueue.push(feedback);
 };
 parameter=.5;encoder=.5;
 const before=writes.length;
 // The physical CC reaches both surface inputs; only the isolated LINK input edits.
 s.knob.mOnProcessValueChange(ctx,.55,.05);detent(.05);
 while(feedbackQueue.length)feedbackQueue.shift()();
 assert.equal(editCount,1);assert.equal(writes.length,before+1);
 assert(Math.abs(parameter-.55)<1e-12);
 // Unsolicited/shared-surface feedback does not move the locked value.
 s.knob.mOnProcessValueChange(ctx,.9,.35);assert.equal(editCount,1);
 push(1);push(0);while(feedbackQueue.length)feedbackQueue.shift()();
 assert.equal(editCount,2);assert.equal(parameter,.5);
 for(const mode of ['MouseFader']) {
  state.knobMode=mode;s.mouseKnobInput.mOnProcessValueChange(ctx,.8,.1);
 }
 assert.equal(editCount,2);state.knobMode='Mouse';
}
console.log('PASS: selected-track pan feedback cannot re-enter LINK edits, including deferred callbacks and reset; isolated input edits only in knob LINK');
