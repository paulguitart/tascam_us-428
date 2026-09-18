const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const s={require:()=>require('../api/midiremote_api_v1')};
vm.createContext(s); vm.runInContext(fs.readFileSync(path.join(__dirname,'..','PreSonus_IOStation.js'),'utf8'),s);
const state={},midi=[],events=[],bindings=[],actions=[],commands=[];
const ctx={getState:k=>state[k]||'',setState:(k,v)=>{state[k]=v;}};
s.midiOut.sendMidi=(_,m)=>midi.push(Array.from(m));
s.knob.getProcessValue=()=>.5;
s.var_zoomIn.setProcessValue=(_,v)=>events.push(['in',v]);
s.var_zoomOut.setProcessValue=(_,v)=>events.push(['out',v]);
const locatorPulses=[];
s.var_zoomToLocators.setProcessValue=(_,v)=>locatorPulses.push(v);
function capture(list,info){list.push(info);return {setSubPage(page){info.page=page;return this;},setTypeToggle(){info.toggle=true;return this;},setValueTakeOverModeScaled(){info.scaled=true;return this;},mapToValueRange(min,max){info.range=[min,max];return this;}};}
s.page.makeValueBinding=(input,host)=>capture(bindings,{input,host});
s.page.makeActionBinding=(input,action)=>actions.push({input,action});
s.page.makeCommandBinding=(input,category,command)=>capture(commands,{input,category,command});
// The SDK stub creates a new Send object per lookup; keep host identity stable.
const sends=s.page.mHostAccess.mTrackSelection.mMixerChannel.mSends;
const firstSend=sends.getByIndex(0);
sends.getByIndex=index=>{assert.equal(index,0);return firstSend;};
s.assignKnobControls();
// Check destinations by mode rather than depending on registration order.
assert(!bindings.some(b=>b.input===s.mouseKnobInput)); // LINK input must have no host feedback path.
const expectedKnobs = [
    ['Pan',s.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan],
 ['PreGain',s.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mGain], ['HighPass',s.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mLowCutFreq]
];
for(const [mode,host] of expectedKnobs) {
 const matches=bindings.filter(b=>b.input===s.knob&&b.page===s.knobModes[mode]);
 assert.equal(matches.length,1);assert.strictEqual(matches[0].host,host);
}
assert(!bindings.some(b=>b.input===s.knob&&b.host===s.hostTransport.mMetronomeClickLevel));
assert(bindings.some(b=>b.input===s.firstSendLevelFeedbackValue&&b.host===firstSend.mLevel));
assert(!bindings.some(b=>b.input===s.knob&&b.host===firstSend.mLevel));
assert(!bindings.some(b=>b.input===s.knob&&(b.page===s.knobModes.Master||b.page===s.knobModes.MasterFX)));
assert(bindings.some(b=>b.input===s.firstSendEnabledFeedbackValue&&b.host===firstSend.mOn));
for(const mode of ['Zoom','Section','Marker','Master','MasterFX','Click']) {
 for(const [input,command] of [[s.var_zoomIn,'Zoom In'],[s.var_zoomOut,'Zoom Out']]) {
  assert(commands.some(b=>b.input===input&&b.category==='Zoom'&&b.command===command&&b.page===s.knobModes[mode]));
 }
}
for(const mode of ['Zoom','Section','Master','MasterFX','Click']) assert(commands.some(b=>b.input===s.var_zoomToLocators&&b.command==='Zoom to Locators'&&b.page===s.knobModes[mode]));
assert(!bindings.some(b=>b.input===s.fader.mSurfaceValue)); // Fader has independent subpages.
assert(!bindings.some(b=>b.input===s.knob&&(b.page===s.knobModes.Mouse||b.page===s.knobModes.MouseFader)));
for(const mapping of s.knobModeButtons) assert(actions.some(a=>a.input===mapping.button&&a.action===mapping.mode.mAction.mActivate));
assert(actions.some(a=>a.input===s.buttons.Scroll&&a.action===s.knobModes.Zoom.mAction.mActivate));
assert(actions.some(a=>a.input===s.buttons.Zoom&&a.action===s.knobModes.Zoom.mAction.mActivate));
assert(actions.some(a=>a.input===s.buttons.MasterFX&&a.action===s.knobModes.MasterFX.mAction.mActivate));
assert(actions.some(a=>a.input===s.buttons.Click&&a.action===s.knobModes.Click.mAction.mActivate));
assert(actions.some(a=>a.input===s.buttons.Marker&&a.action===s.knobModes.Marker.mAction.mActivate));
assert(commands.some(binding=>binding.input===s.var_masterInsertBypassPressed&&binding.category==='Mixer'
 &&binding.command==='Bypass: Inserts on Main Mix'&&binding.page===s.knobModes.Master));
assert(!commands.some(binding=>binding.input===s.buttons.Bypass));
assert(!commands.some(binding=>binding.input===s.var_masterInsertBypassPressed&&binding.page===s.knobModes.MasterFX));
s.assignSelectedTrackControls();
const fxFaderBinding=bindings.find(b=>b.input===s.fader.mSurfaceValue&&b.host===s.fxChannel.mValue.mVolume&&b.page===s.faderModes.FXReturn);
assert(fxFaderBinding);
assert(bindings.some(b=>b.input===s.faderTargetFeedback.FXReturn&&b.host===s.fxChannel.mValue.mVolume));
assert(bindings.some(b=>b.input===s.fxReturnMuteFeedback&&b.host===s.fxChannel.mValue.mMute));
for(const mode of ['Pan','HighPass']){
 s.knobModes[mode].mOnActivate(ctx);s.knob.mOnProcessValueChange(ctx,.6,.1);
 assert.equal(events.length,0);assert.equal(ctx.getState('knobMode'),mode);
}
s.knobModes.Click.mOnActivate(ctx);s.knob.mOnProcessValueChange(ctx,.6,.1);
assert.deepStrictEqual(events,[['in',1],['in',0]]);assert.equal(ctx.getState('knobMode'),'Click');
events.length=0;
s.knobModes.Master.mOnActivate(ctx);
assert.equal(ctx.getState('faderTarget'),'StereoOut');assert.equal(ctx.getState('shiftEnabled'),'0');
events.length=0;s.knob.mOnProcessValueChange(ctx,.6,.1);assert.deepStrictEqual(events,[['in',1],['in',0]]);
s.knobModes.MasterFX.mOnActivate(ctx);
assert.equal(ctx.getState('faderTarget'),'FXReturn');assert.equal(ctx.getState('shiftEnabled'),'1');
events.length=0;s.knob.mOnProcessValueChange(ctx,.6,.1);assert.deepStrictEqual(events,[['in',1],['in',0]]);
s.knobModes.Zoom.mOnActivate(ctx);
s.knob.mOnProcessValueChange(ctx,.5,0);assert.equal(events.length,0);
s.knob.mOnProcessValueChange(ctx,.51,.01);s.knob.mOnProcessValueChange(ctx,.52,.01);
s.knob.mOnProcessValueChange(ctx,.51,-.01);
assert.deepStrictEqual(events,[['in',1],['in',0],['in',1],['in',0],['out',1],['out',0]]);
assert(midi.some(m=>m[1]===s.cScroll&&m[2]===127));
// Re-entering Zoom seeds its current position, avoiding a stale-mode comparison.
s.knobModes.Pan.mOnActivate(ctx);s.knob.getProcessValue=()=>.1;s.knobModes.Zoom.mOnActivate(ctx);
events.length=0;s.knob.mOnProcessValueChange(ctx,.1,0);assert.equal(events.length,0);
s.knob.mOnProcessValueChange(ctx,.09,-.01);assert.deepStrictEqual(events,[['out',1],['out',0]]);
console.log('PASS: isolated knob bindings, mode selectors, LED state, repeated zoom pulses and mode-entry baseline');

const preFilter=s.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter;
const cutoff=bindings.find(binding=>binding.host===preFilter.mLowCutFreq);
s.setupHighPassFeedback();
const enable=bindings.find(binding=>binding.host===preFilter.mLowCutOn);
assert.strictEqual(cutoff.input,s.knob);
assert.strictEqual(cutoff.page,s.knobModes.HighPass);
assert.strictEqual(enable.input,s.highPassEnabledFeedbackValue);
assert(!bindings.some(binding=>binding.input===s.mSection.knob_Press.mSurfaceValue));
assert(actions.some(action=>action.input===s.buttons.Channel&&action.action===s.knobModes.HighPass.mAction.mActivate));
s.knobModes.HighPass.mOnActivate(ctx);
assert(midi.some(message=>message[1]===s.cChannel&&message[2]===127));
s.knobModes.Pan.mOnActivate(ctx);
assert.deepStrictEqual(midi.filter(message=>message[1]===s.cChannel).pop(),[144,s.cChannel,0]);
console.log('PASS: Channel selects high-pass; cutoff and feedback are scoped to that mode; mode LED clears on exit');
// High-pass LED uses only enable state: white off and red on.
bindings.length=0;s.setupHighPassFeedback();
const enabledFeedback=bindings.find(b=>b.host===preFilter.mLowCutOn).input;
s.knobModes.HighPass.mOnActivate(ctx);
function lastColor(status){return midi.filter(message=>message[0]===status && message[1]===s.cChannel).pop()[2];}
enabledFeedback.mOnProcessValueChange(ctx,0);
assert.deepStrictEqual([lastColor(145),lastColor(146),lastColor(147)],[127,127,127]);
enabledFeedback.mOnProcessValueChange(ctx,1);
assert.deepStrictEqual([lastColor(145),lastColor(146),lastColor(147)],[127,0,0]);
s.knobModes.Pan.mOnActivate(ctx);
enabledFeedback.mOnProcessValueChange(ctx,0);
assert.deepStrictEqual(midi.filter(message=>message[0]===144&&message[1]===s.cChannel).pop(),[144,s.cChannel,0]);
console.log('PASS: High Pass LED is white when off and red when on; host feedback and off-mode LED verified');

const markerModeCommands=commands.filter(binding=>binding.page===s.knobModes.Marker);
assert(commands.some(binding=>binding.input===s.var_markerPrev&&binding.category==='Transport'&&binding.command==='Locate Previous Marker'));
assert(commands.some(binding=>binding.input===s.var_markerNext&&binding.category==='Transport'&&binding.command==='Locate Next Marker'));
const markerInsertCommand=s.cubase13OrHigher?'Marker':'Transport';
assert.equal(markerModeCommands.filter(binding=>binding.category===markerInsertCommand&&binding.command==='Insert Marker').length,1);
const markerPulses=[];
const metronomePulses=[];
let metronomeValue=0;
s.var_markerInsertPressed.setProcessValue=(_,value)=>markerPulses.push(value);
s.metronomeFeedbackValue.getProcessValue=()=>metronomeValue;
s.metronomeFeedbackValue.setProcessValue=(_,value)=>{metronomeValue=value;metronomePulses.push(value)};
s.knobModes.Pan.mOnActivate(ctx);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,0);
assert.deepStrictEqual(markerPulses,[]);
s.knobModes.Marker.mOnActivate(ctx);
assert.equal(ctx.getState('knobMode'),'Marker');
assert(midi.some(message=>message[0]===144&&message[1]===s.cMarker&&message[2]===127));
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1); // Duplicate down messages are ignored.
assert.deepStrictEqual(markerPulses,[1,0]);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,0);
s.knobModes.Pan.mOnActivate(ctx);
assert.deepStrictEqual(midi.filter(message=>message[0]===144&&message[1]===s.cMarker).pop(),[144,s.cMarker,0]);
s.knobModes.Click.mOnActivate(ctx);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,0);
assert.deepStrictEqual(locatorPulses,[1,0]);
assert.deepStrictEqual(metronomePulses,[]);
s.knobModes.Master.mOnActivate(ctx);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,0);
s.knobModes.MasterFX.mOnActivate(ctx);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);
s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,0);
assert.deepStrictEqual(locatorPulses,[1,0,1,0,1,0]);
console.log('PASS: Marker navigation/insert, Click zoom push and Zoom to Locators push in both Master modes');

// Send edits must never share the physical knob's automatic host-binding path.
// Drive actual mode activation and knob callbacks, including endpoint detents.
let sendLevel=.35;
const sendWrites=[];
s.firstSendLevelFeedbackValue.getProcessValue=()=>sendLevel;
s.firstSendLevelFeedbackValue.setProcessValue=(_,value)=>{sendLevel=value;sendWrites.push(value);};
for(const zoomMode of ['Zoom','Section','Marker']) {
 s.knobModes.Send.mOnActivate(ctx);
 events.length=0;sendWrites.length=0;sendLevel=.35;
 s.knob.mOnProcessValueChange(ctx,.9,.05);
 assert(Math.abs(sendLevel-.4)<1e-12);assert.equal(sendWrites.length,1);
 assert.deepStrictEqual(events,[]);
 s.knobModes[zoomMode].mOnActivate(ctx);
 sendWrites.length=0;events.length=0;
 for(const [value,diff] of [[.11,.01],[.10,-.01],[0,-.01],[0,-.01],[1,.01],[1,.01]]) {
  s.knob.mOnProcessValueChange(ctx,value,diff);
 }
 assert.deepStrictEqual(events,[['in',1],['in',0],['out',1],['out',0],['out',1],['out',0],['out',1],['out',0],['in',1],['in',0],['in',1],['in',0]]);
 // Host edits during zoom must not cause a Send write, even on knob push.
 sendLevel=.7;
 s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,1);
 s.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(ctx,0);
 assert.deepStrictEqual(sendWrites,[]);assert.equal(sendLevel,.7);
 s.knobModes.Send.mOnActivate(ctx);
 s.knob.mOnProcessValueChange(ctx,0,.02);
 assert(Math.abs(sendLevel-.72)<1e-12); // Resumes from host value, not the zoom position.
 for(const diff of [0,NaN,Infinity]) s.knob.mOnProcessValueChange(ctx,.5,diff);
 assert.equal(sendWrites.length,1);
 sendLevel=.99;s.knob.mOnProcessValueChange(ctx,1,.1);assert.equal(sendLevel,1);
 sendLevel=.01;s.knob.mOnProcessValueChange(ctx,0,-.1);assert.equal(sendLevel,0);
}
console.log('PASS: Send-to-zoom isolation in Scroll/Section/Marker, host changes, return to Send and level limits');

// One physical receiver, with explicit routing: host-bound PAN cannot hear LINK turns.
const script=fs.readFileSync(path.join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
assert.equal((script.match(/bindToControlChange\(0, cKnobRotate\)/g)||[]).length,1);
let raw=.5,hostKnob=.5;const forwarded=[];
s.knob.getProcessValue=()=>hostKnob;
s.knob.setProcessValue=(_,value)=>{hostKnob=value;forwarded.push(value);};
s.mouseKnobInput.setProcessValue=(context,value)=>{
 const diff=value-raw;raw=value;s.mouseKnobInput.mOnProcessValueChange(context,value,diff);
};
function physicalTurn(diff){const next=Math.max(0,Math.min(1,raw+diff));const applied=next-raw;raw=next;s.mouseKnobInput.mOnProcessValueChange(ctx,next,applied);}
for(const mode of ['Pan','PreGain','HighPass']) {
 state.knobMode=mode;raw=.5;hostKnob=.5;forwarded.length=0;
 for(let i=0;i<30;i++)physicalTurn(.05);
 assert.equal(hostKnob,1);assert.equal(forwarded.length,30);
 for(let i=0;i<30;i++)physicalTurn(-.05);
 assert.equal(hostKnob,0);assert.equal(forwarded.length,60);
}
for(const mode of ['Zoom','Section','Marker','Master','MasterFX','Click']) {
 state.knobMode=mode;raw=.5;forwarded.length=0;events.length=0;
 for(let i=0;i<30;i++)physicalTurn(.05);
 assert.equal(events.length,60);assert.deepStrictEqual(forwarded,[]);
}
for(const mode of ['Mouse','MouseFader']) {
 state.knobMode=mode;state.mouseStartingValue='';raw=.5;forwarded.length=0;
 physicalTurn(.05);physicalTurn(-.05);
 assert.deepStrictEqual(forwarded,[]); // Unlocked LINK cannot forward MIDI to PAN.
}
console.log('PASS: sole MIDI receiver, normal-mode routing and full travel, repeated zoom, and zero PAN forwarding in unlocked LINK');

// Model a native callback property that supports registration but cannot be read back.
Object.defineProperty(s.knob,'mOnProcessValueChange',{
 configurable:true,get(){throw new Error('DukValue is uninitialized');},set(){}
});
for(const mode of ['Zoom','Section','Marker','Master','MasterFX','Click']) {
 state.knobMode=mode;state.mouseKnobResetEcho='';raw=.5;events.length=0;
 physicalTurn(.05);physicalTurn(-.05);physicalTurn(.05);
 assert.deepStrictEqual(events,[['in',1],['in',0],['out',1],['out',0],['in',1],['in',0]]);
}
state.knobMode='Send';raw=.5;sendLevel=.4;sendWrites.length=0;
physicalTurn(.05);assert(Math.abs(sendLevel-.45)<1e-12);assert.equal(sendWrites.length,1);
console.log('PASS: zoom and Send route without reading native callback properties');
