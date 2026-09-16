const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const s={require:()=>require('../../api/midiremote_api_v1')};
vm.createContext(s); vm.runInContext(fs.readFileSync(path.join(__dirname,'PreSonus_FaderPortBasic.js'),'utf8'),s);
const state={},midi=[],events=[],bindings=[],actions=[],commands=[];
const ctx={getState:k=>state[k]||'',setState:(k,v)=>{state[k]=v;}};
s.midiOut.sendMidi=(_,m)=>midi.push(Array.from(m));
s.knob.getProcessValue=()=>.5;
s.var_zoomIn.setProcessValue=(_,v)=>events.push(['in',v]);
s.var_zoomOut.setProcessValue=(_,v)=>events.push(['out',v]);
function capture(list,info){list.push(info);return {setSubPage(page){info.page=page;return this;},setTypeToggle(){info.toggle=true;return this;}};}
s.page.makeValueBinding=(input,host)=>capture(bindings,{input,host});
s.page.makeActionBinding=(input,action)=>actions.push({input,action});
s.page.makeCommandBinding=(input,category,command)=>capture(commands,{input,category,command});
s.assignKnobControls();
assert.equal(bindings.length,5);assert.equal(actions.length,6);assert.equal(commands.length,2);
assert.strictEqual(bindings[0].host,s.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan);
assert.strictEqual(bindings[0].page,s.knobModes.Pan);
assert.strictEqual(bindings[1].host,s.hostStereoOut.mValue.mVolume);
assert.strictEqual(bindings[1].page,s.knobModes.Master);
assert.strictEqual(bindings[2].host,s.hostTransport.mMetronomeClickLevel);
assert.strictEqual(bindings[2].page,s.knobModes.Click);
assert(actions.some(a=>a.input===s.buttons.Scroll&&a.action===s.knobModes.Zoom.mAction.mActivate));
assert(actions.some(a=>a.input===s.buttons.Zoom&&a.action===s.knobModes.Zoom.mAction.mActivate));
for(const mode of ['Pan','Master','Click','HighPass']){
 s.knobModes[mode].mOnActivate(ctx);s.knob.mOnProcessValueChange(ctx,.6,.1);
 assert.equal(events.length,0);assert.equal(ctx.getState('knobMode'),mode);
}
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
const enable=bindings.find(binding=>binding.host===preFilter.mLowCutOn);
assert.strictEqual(cutoff.input,s.knob);
assert.strictEqual(cutoff.page,s.knobModes.HighPass);
assert.strictEqual(enable.input,s.mSection.knob_Press.mSurfaceValue);
assert.strictEqual(enable.page,s.knobModes.HighPass);
assert.equal(enable.toggle,true);
assert(actions.some(action=>action.input===s.buttons.Channel&&action.action===s.knobModes.HighPass.mAction.mActivate));
s.knobModes.HighPass.mOnActivate(ctx);
assert(midi.some(message=>message[1]===s.cChannel&&message[2]===127));
s.knobModes.Pan.mOnActivate(ctx);
assert.deepStrictEqual(midi.filter(message=>message[1]===s.cChannel).pop(),[144,s.cChannel,0]);
console.log('PASS: Channel selects high-pass; cutoff and push-toggle are scoped to that mode; mode LED clears on exit');
// High-pass color feedback uses host display values, including Hz/kHz formatting.
assert.equal(s.parseFrequencyHz('80.0','Hz'),80);
assert.equal(s.parseFrequencyHz('0,3','kHz'),300);
assert.equal(s.parseFrequencyHz('1.0 kHz',''),1000);
assert(Number.isNaN(s.parseFrequencyHz('Unavailable','Hz')));
assert.equal(s.getHighPassColor(20).red,127);
assert.equal(s.getHighPassColor(80).green,40);
assert.equal(s.getHighPassColor(300).blue,127);
for(let hz=20;hz<=20000;hz+=13){
 const color=s.getHighPassColor(hz);
 assert(color.red>color.green || color.blue>color.green);
 for(const component of ['red','green','blue']) assert(color[component]>=0 && color[component]<=127);
}
bindings.length=0;s.setupHighPassFeedback();
const enabledFeedback=bindings.find(b=>b.host===preFilter.mLowCutOn).input;
const frequencyFeedback=bindings.find(b=>b.host===preFilter.mLowCutFreq).input;
s.knobModes.HighPass.mOnActivate(ctx);
function lastColor(status){return midi.filter(message=>message[0]===status && message[1]===s.cChannel).pop()[2];}
enabledFeedback.mOnProcessValueChange(ctx,0);
assert.deepStrictEqual([lastColor(145),lastColor(146),lastColor(147)],[0,127,0]);
frequencyFeedback.mOnDisplayValueChange(ctx,'300','Hz');
enabledFeedback.mOnProcessValueChange(ctx,1);
assert.deepStrictEqual([lastColor(145),lastColor(146),lastColor(147)],[127,0,127]);
frequencyFeedback.mOnDisplayValueChange(ctx,'80','Hz');
assert.deepStrictEqual([lastColor(145),lastColor(146),lastColor(147)],[127,40,0]);
frequencyFeedback.mOnDisplayValueChange(ctx,'Unknown','');
assert.deepStrictEqual([lastColor(145),lastColor(146),lastColor(147)],[127,0,0]);
s.knobModes.Pan.mOnActivate(ctx);
enabledFeedback.mOnProcessValueChange(ctx,0);
frequencyFeedback.mOnDisplayValueChange(ctx,'150','Hz');
assert.deepStrictEqual(midi.filter(message=>message[0]===144&&message[1]===s.cChannel).pop(),[144,s.cChannel,0]);
console.log('PASS: Hz parsing, non-green gradient, host-driven enabled/frequency colors and off-mode LED');
