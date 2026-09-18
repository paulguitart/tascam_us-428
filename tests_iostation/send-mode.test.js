// Standalone Send-mode integration checks using captured host bindings.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
const state={},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
let touched=0,mappedTouch=0;const motors=[],bindings=[],colors={},lamps={},writes=[];
function host(value){return {value};}
const send={mLevel:host(.25),mOn:host(1),mPrePost:host(0)};
const track={mValue:{mVolume:host(.6)},mSends:{getByIndex:i=>{assert.equal(i,0);return send;}}};
const surface={makeCustomValueVariable:name=>({name,getProcessValue(){return this.host?this.host.value:0},setProcessValue(context,v){if(this.host){this.host.value=v;writes.push([name,v]);if(this.mOnProcessValueChange)this.mOnProcessValueChange(context,v)}}})};
const s={Math,Number,String,Date,isFinite,ENABLE_METRONOME_FADER:true,ENABLE_FADER_NUDGE:false,
 ENABLE_FADER_TOUCH_INPUT:true,ENABLE_FADER_TOUCH_PROTECTION:true,ENABLE_MIDI_OUTPUT_CACHE:true,
 ENABLE_FADER_UNITY_CALIBRATION:false,ENABLE_FADER_LOW_END_SNAP:false,FADER_LOW_END_THRESHOLD:.012,
 FADER_HOST_UNITY:.789087,FADER_HARDWARE_UNITY:.789087,FULL_BRIGHTNESS:1,SEND_DISABLED_BRIGHTNESS:.25,
 WHITE:[127,127,127],RED:[127,0,0],AMBER:[127,48,0],CYAN:[0,127,127],
 cPan:42,cTouch:77,cBypass:3,cShift:70,surface,
 fader:{mSurfaceValue:{}},var_faderInput:{},faderTouch:{getProcessValue:()=>touched},
 mappedFaderTouch:{setProcessValue:(_,v)=>mappedTouch=v},midiOut:{sendMidi:(_,m)=>motors.push(m)},
 faderModes:Object.fromEntries(['Track','StereoOut','Metronome','Dormant','Mouse','Send'].map(n=>[n,{mAction:{mActivate:{trigger(){}}}}])),
 faderTargetFeedback:{},hostStereoOut:{mValue:{mVolume:host(.4)}},hostTransport:{mMetronomeClickLevel:host(.5)},
 var_trackPrev:{},var_trackNext:{},faderNudgeAccess:{},knob:{getProcessValue:()=>.5},
 mSection:{knob_Press:{mSurfaceValue:{}}},selectedTrackToggleValues:{},buttons:{},
 isMouseLinkMode:m=>m==='Mouse'||m==='MouseFader',leaveMouseLink(){},syncMouseFader(){},
 updateKnobModeLEDs(context){s.updateSendModeLED(context);s.updateBypassLED(context)},
 isMetronomeBypassMode:()=>false,
 page:{mHostAccess:{mMouseCursor:{mValueUnderMouse:host(.2)},mTrackSelection:{mMixerChannel:track,mAction:{mPrevTrack:{},mNextTrack:{}}}},
 makeActionBinding(){},makeValueBinding(input,target){input.host=target;const b={input,target,setSubPage(p){this.subpage=p;return this}};bindings.push(b);return b;}}
};
vm.createContext(s);
function run(a,b){const start=source.indexOf(a),end=source.indexOf(b,start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),s)}
run('function isPanFaderBypassed(', '// Future footswitch assignments');
s.setRGBLED_color=(_,note,color,brightness=1)=>colors[note]={color:Array.from(color),brightness};
s.onLED=(_,note)=>lamps[note]=true;s.offLED=(_,note)=>lamps[note]=false;
s.setTransportLed=(_,note,on)=>lamps[note]=on;
run('function updateTouchLED(', '//-----------------------------------------------------------------------------');
run('function updateSendModeLED(', 'function updateKnobModeLEDs');
run('function resolveKnobModeButton(', 'var highPassColors');
run('function routeUnboundKnobTurn(', 'function assignKnobControls');
run('    var firstSend = page.mHostAccess', '    // Master-mode encoder');
s.assignSelectedTrackControls();
assert(bindings.some(b=>b.input===s.fader.mSurfaceValue&&b.target===send.mLevel&&b.subpage===s.faderModes.Send));
assert(bindings.some(b=>b.input===s.firstSendPrePostFeedbackValue&&b.target===send.mPrePost));
s.fader.mSurfaceValue.setProcessValue=(context,v)=>{
 const target=state.faderTarget==='Send'?send.mLevel:track.mValue.mVolume;
 target.value=v;writes.push(['fader',v]);s.faderTargetFeedback[state.faderTarget].mOnProcessValueChange(context);
};
run('function assignButtonRouting(', 'for (var buttonIndex =');
run('    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange =','    // Korg zoom pattern:');
const touchMapping={normalName:'Touch',shiftedName:'Latch',physicalButton:{mSurfaceValue:{}}};s.assignButtonRouting(touchMapping);
const bypassMapping={normalName:'Bypass',shiftedName:'BypassAll',physicalButton:{mSurfaceValue:{}}};s.assignButtonRouting(bypassMapping);
const touch=touchMapping.physicalButton.mSurfaceValue.mOnProcessValueChange;
const bypass=bypassMapping.physicalButton.mSurfaceValue.mOnProcessValueChange;
const push=s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange;
for(const panBypassed of ['', '1']){
 touched=0;state.mouseFaderWaitRelease='';state.panFaderBypassed=panBypassed;s.activateKnobMode(ctx,'Pan',{});
 s.activateKnobMode(ctx,'Send',{});assert.equal(state.faderTarget,'Send');assert.equal(state.shiftEnabled,'1');
 assert.equal(s.isPanFaderBypassed(ctx),false);assert.equal(state.panFaderBypassed,panBypassed);
 const trackBefore=track.mValue.mVolume.value;
 touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);assert.equal(mappedTouch,1);
 s.var_faderInput.mOnProcessValueChange(ctx,.4);assert.equal(send.mLevel.value,.4);assert.equal(track.mValue.mVolume.value,trackBefore);
 touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);
 s.routeUnboundKnobTurn(ctx,.9,.1);assert(Math.abs(track.mValue.mVolume.value-(trackBefore+.1))<1e-10);assert.equal(send.mLevel.value,.4);
 touch(ctx,1);touch(ctx,1);touch(ctx,0);assert.equal(send.mLevel.value,.789087);
 assert.deepEqual(colors[s.cTouch].color,s.WHITE);assert.equal(lamps[s.cTouch],true);
 for(const pre of [0,1])for(const on of [0,1]){
  send.mPrePost.value=pre;send.mOn.value=on;
  s.firstSendPrePostFeedbackValue.mOnProcessValueChange(ctx);
  s.firstSendEnabledFeedbackValue.mOnProcessValueChange(ctx);
  assert.deepEqual(colors[s.cPan],{color:pre?s.CYAN:s.AMBER,brightness:on?1:.25});assert.equal(lamps[s.cBypass],!on);
  push(ctx,1);push(ctx,1);push(ctx,0);assert.equal(send.mPrePost.value,1-pre);assert.equal(send.mOn.value,on);assert.equal(send.mLevel.value,.789087);
  bypass(ctx,1);bypass(ctx,1);bypass(ctx,0);assert.equal(send.mOn.value,1-on);assert.equal(send.mPrePost.value,1-pre);
  assert.equal(state.panFaderBypassed,panBypassed);
 }
 // Selected-track changes update both feedback bindings and the motor through the active fader binding.
 send.mLevel.value=.3;s.firstSendLevelFeedbackValue.mOnProcessValueChange(ctx);assert.equal(lamps[s.cTouch],false);
 s.fader.mSurfaceValue.mOnProcessValueChange(ctx,.3);assert.equal(motors.at(-1)[1]+(motors.at(-1)[2]<<7),Math.round(.3*16383));
 s.activateKnobMode(ctx,'Pan',{});assert.equal(state.faderTarget,'Track');assert.equal(s.isPanFaderBypassed(ctx),panBypassed==='1');
 assert.equal(lamps[s.cBypass],panBypassed==='1');
 const beforeWrites=writes.length,beforeMotor=motors.length;
 if(panBypassed){touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);s.var_faderInput.mOnProcessValueChange(ctx,.8);s.setMotorFader(ctx,.8);touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);assert.equal(writes.length,beforeWrites);assert.equal(motors.length,beforeMotor);}
}
// Entering send mode while holding a bypassed PAN fader waits for release, then works.
state.panFaderBypassed='1';s.activateKnobMode(ctx,'Pan',{});touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);
s.activateKnobMode(ctx,'Send',{});const heldWrites=writes.length;s.var_faderInput.mOnProcessValueChange(ctx,.2);assert.equal(writes.length,heldWrites);
touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);
s.var_faderInput.mOnProcessValueChange(ctx,.2);assert.equal(send.mLevel.value,.2);
console.log('PASS: send fader/TOUCH unity, independent track knob, pre/post push, all four PAN colors, BYPASS enable, feedback and saved PAN bypass restoration');

// Navigation modes must never inherit Send, output, metronome or dormant fader targets.
run('function isMetronomeBypassMode(', '// BYPASS is fixed-color');
s.metronomeFeedbackValue={getProcessValue:()=>1};s.masterInsertBypassFeedback={getProcessValue:()=>0};
let metronomeToggles=0;s.toggleMetronome=()=>metronomeToggles++;
const trackModes=['Pan','Zoom','Section','Marker'];
for(const previous of ['Pan','Send','Master','Click','Mouse','MouseFader']){
 for(const destination of trackModes)for(const bypassed of ['', '1']){
  touched=0;state.panFaderBypassed=bypassed;state.mouseFaderWaitRelease='';
  state.knobMode=previous;state.faderTarget=previous==='Send'?'Send':previous==='Master'?'StereoOut':previous==='Click'?'Metronome':previous==='Mouse'?'Dormant':previous==='MouseFader'?'Mouse':'Track';
  state.pendingMotorPosition='.9';
  let activatedTarget=null;
  s.faderModes.Track.mAction.mActivate.trigger=()=>activatedTarget='Track';
  s.activateKnobMode(ctx,destination,{});
  assert.equal(activatedTarget,'Track');assert.equal(state.faderTarget,'Track');
  assert.equal(state.pendingMotorPosition,'');assert.equal(lamps[s.cBypass],bypassed==='1');
  const beforeWrite=writes.length,beforeMotor=motors.length,sendBefore=send.mLevel.value;
  touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);s.var_faderInput.mOnProcessValueChange(ctx,.37);
  s.fader.mSurfaceValue.mOnProcessValueChange(ctx,.37);touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);
  assert.equal(send.mLevel.value,sendBefore);
  if(bypassed){assert.equal(writes.length,beforeWrite);assert.equal(motors.length,beforeMotor);assert.equal(mappedTouch,0);}
  else {assert.equal(track.mValue.mVolume.value,.37);assert.equal(writes.length,beforeWrite+1);}
  // Both SHIFT layers use the same fader bypass and never toggle the metronome.
  for(const layer of ['0','1']){
   state.shiftEnabled=layer;const before=state.panFaderBypassed==='1';
   bypass(ctx,1);bypass(ctx,1);bypass(ctx,0);
   assert.equal(state.panFaderBypassed==='1',!before);assert.equal(lamps[s.cBypass],!before);
  }
 }
}
assert.equal(metronomeToggles,0);
// Disable once, traverse all shared modes, then re-enable under a held fader.
state.panFaderBypassed='';s.activateKnobMode(ctx,'Pan',{});bypass(ctx,1);bypass(ctx,0);
for(const destination of trackModes){s.activateKnobMode(ctx,destination,{});assert.equal(s.isPanFaderBypassed(ctx),true);assert.equal(lamps[s.cBypass],true);}
touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);const beforeHeld=writes.length;
bypass(ctx,1);bypass(ctx,0);s.var_faderInput.mOnProcessValueChange(ctx,.9);assert.equal(writes.length,beforeHeld);
touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);
s.var_faderInput.mOnProcessValueChange(ctx,.42);assert.equal(track.mValue.mVolume.value,.42);
touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);
// Zoom remains an encoder-only command; fader events above never dispatch it.
const zoomCommands=[];s.var_zoomIn={name:'in'};s.var_zoomOut={name:'out'};s.pulseVar=(_,v)=>zoomCommands.push(v.name);
for(const destination of ['Zoom','Section','Marker']){
 s.activateKnobMode(ctx,destination,{});const before=zoomCommands.length;
 touched=1;s.var_faderInput.mOnProcessValueChange(ctx,.51);touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);
 assert.equal(zoomCommands.length,before);
 s.routeUnboundKnobTurn(ctx,.6,.1);s.routeUnboundKnobTurn(ctx,.5,-.1);assert.deepEqual(zoomCommands.slice(-2),['in','out']);
}
s.activateKnobMode(ctx,'Click',{});state.shiftEnabled='0';bypass(ctx,1);bypass(ctx,0);assert.equal(metronomeToggles,1);
console.log('PASS: PAN/Zoom/Section/Marker force track volume from every prior target, share BYPASS across SHIFT layers, preserve held-fader safety and keep zoom on encoder only');
