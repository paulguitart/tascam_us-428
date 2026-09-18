const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const s = { require: () => require('../api/midiremote_api_v1') };
vm.createContext(s);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8'), s);
const state = {}, ctx = {getState: k => state[k] || '', setState: (k,v) => state[k] = v};
let touched = 0, send = 1, mappedTouch = 0, bypassLED = false;
const motors = [], inputs = [];
s.midiOut.sendMidi = (_,m) => {if (m[0] === 0xE0) motors.push(Array.from(m));};
s.setTransportLed = (_,note,on) => {if (note === s.cBypass) bypassLED = on;};
s.faderTouch.getProcessValue = () => touched;
s.mappedFaderTouch.setProcessValue = (_,v) => mappedTouch = v;
s.fader.mSurfaceValue.setProcessValue = (_,v) => inputs.push(v);
s.firstSendEnabledFeedbackValue.getProcessValue = () => send;
s.firstSendEnabledFeedbackValue.setProcessValue = (_,v) => send = v;
s.faderTargetFeedback.Track.getProcessValue = () => .6;
s.activateKnobMode(ctx, 'Pan', {});
s.updateBypassLED(ctx);assert.equal(bypassLED, false);
s.toggleModeEffect(ctx);assert.equal(bypassLED, true);assert.equal(send, 1);
for (const mode of ['Pan']) {
 s.activateKnobMode(ctx, mode, {});
 const before = motors.length;
 touched = 1;s.faderTouch.mOnProcessValueChange(ctx,1);
 s.var_faderInput.mOnProcessValueChange(ctx,.8);
 s.fader.mSurfaceValue.mOnProcessValueChange(ctx,.9);
 s.setMotorFader(ctx,.7);
 touched = 0;s.faderTouch.mOnProcessValueChange(ctx,0);
 assert.equal(mappedTouch,0);assert.equal(inputs.length,0);assert.equal(motors.length,before);
 assert.equal(state.pendingMotorPosition,'');
}
// Send's fader ignores PAN bypass; its button changes send enable only.
s.activateKnobMode(ctx,'Send',{});assert.equal(s.isPanFaderBypassed(ctx),false);assert.equal(state.faderTarget,'Send');
s.toggleModeEffect(ctx);s.updateBypassLED(ctx);
assert.equal(send,0);assert.equal(bypassLED,false);assert.equal(state.panFaderBypassed,'1');
s.activateKnobMode(ctx,'Pan',{});s.updateBypassLED(ctx);assert.equal(bypassLED,true);
// Re-enable under the finger: no motor motion or input until touch release.
touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);
const before=motors.length;s.toggleModeEffect(ctx);
assert.equal(bypassLED,false);assert.equal(motors.length,before);
s.var_faderInput.mOnProcessValueChange(ctx,.9);assert.equal(inputs.length,0);
touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);assert.equal(motors.length,before+1);
touched=1;s.faderTouch.mOnProcessValueChange(ctx,1);assert.equal(mappedTouch,1);
s.var_faderInput.mOnProcessValueChange(ctx,.7);assert.equal(inputs.length,1);
// Remember across mode changes, but do not bypass other modes' faders.
touched=0;s.faderTouch.mOnProcessValueChange(ctx,0);s.toggleModeEffect(ctx);
s.activateKnobMode(ctx,'HighPass',{});assert.equal(s.isPanFaderBypassed(ctx),false);
touched=1;s.var_faderInput.mOnProcessValueChange(ctx,.5);assert.equal(inputs.length,2);
s.activateKnobMode(ctx,'Pan',{});assert.equal(mappedTouch,0);assert.equal(s.isPanFaderBypassed(ctx),true);
console.log('PASS: PAN fader bypass gates input/motor/touch, Send ignores it with independent enable LED, held release safety and mode-local recall');
