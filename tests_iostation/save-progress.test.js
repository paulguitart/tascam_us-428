const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8').replace(/\r\n/g, '\n');
let now = 10000;
const leds = {}, events = [];
const variable = name => ({ setProcessValue: (_, value) => events.push([name, value]) });
const scope = {
 Date: {now: () => now}, ENABLE_STOP_HOLD_SAVE: true, STOP_SAVE_HOLD_MS: 1500,
 STOP_SAVE_PREDELAY_MS: 500, SAVE_BLINK_INTERVAL_MS: 140, SAVE_BLINK_TOGGLES: 10,
 confirmTransportNotes: [1,2,3,4], stopProgressNotes: [2,1,3,4],
 transportFeedback: [1,2,3,4,5].map(note => ({note, value: {getProcessValue: () => note === 3 ? 1 : 0}})),
 setTransportLed: (_, note, on) => {leds[note] = on;}, updateMetronomeModeLEDs() {}, updateMouseLinkCapture() {}, updateClickHold() {},
 deviceDriver: {}, hostTransport: {}, page: {makeValueBinding: () => ({setTypeToggle() {}}), makeCommandBinding() {}},
 transport: Object.fromEntries(['btnPlay','btnRecord','btnCycle','btnFastForward','btnStop','btnRewind'].map(name => [name,{mSurfaceValue:{}}]))
};
for (const name of ['var_stopPressed','var_rewPressed','var_RTZPressed','var_savePressed']) scope[name] = variable(name);
scope.pulseVar = (context, value) => {value.setProcessValue(context,1); value.setProcessValue(context,0);};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf('function resetStopProgress('), source.indexOf('//-----------------------------------------------------------------------------\n// CYCLE MARKERS')), scope);
vm.runInContext(source.slice(source.indexOf('function setConfirmTransportLEDs('), source.indexOf('var knob =')), scope);
const state = {}, context = {getState: key => state[key] || '', setState: (key,value) => {state[key] = value;}};
scope.assignTransportControls();
const stop = v => scope.transport.btnStop.mSurfaceValue.mOnProcessValueChange(context,v);
const rew = v => scope.transport.btnRewind.mSurfaceValue.mOnProcessValueChange(context,v);
const tick = offset => {now = 10000 + offset; scope.deviceDriver.mOnIdle(context);};
const saves = () => events.filter(([name,value]) => name === 'var_savePressed' && value === 1).length;
scope.resetTransport(context);
stop(1); tick(499); assert.equal(state.stopProgressCount, '');
for (const [time, count] of [[500,1],[750,2],[1000,3],[1250,4]]) {
 tick(time); assert.equal(state.stopProgressCount, String(count));
 assert.deepEqual(scope.stopProgressNotes.map(n => leds[n]), scope.stopProgressNotes.map((_,i) => i < count));
}
stop(1); tick(1499); assert.equal(saves(),0);
tick(1500); assert.equal(saves(),1); assert.equal(state.stopProgressCount,'');
stop(0); assert.notEqual(state.saveBlinkCount,'');
for (let i=1;i<10;i++) tick(1500+i*140);
assert.equal(state.saveBlinkCount,''); assert.equal(leds[3],true); assert.equal(leds[2],false);
tick(4000); assert.equal(saves(),1);
// Early release and RTZ both cancel a partially illuminated sequence.
for (const cancel of [() => stop(0), () => {rew(1); rew(0); stop(0);}]) {
 now=10000; stop(1); tick(750); cancel();
 assert.equal(state.stopProgressCount,''); assert.equal(leds[3],true); assert.equal(leds[2],false);
 tick(2000); assert.equal(saves(),1);
}
now=10000; stop(1); tick(750); scope.resetTransport(context); tick(2000); assert.equal(saves(),1);
now=10000; stop(1); tick(750); scope.ENABLE_STOP_HOLD_SAVE=false; tick(1000);
assert.equal(state.stopProgressCount,''); tick(2000); assert.equal(saves(),1);
console.log('PASS: delayed ordered progress, save threshold, duplicate press, blink completion, release, RTZ, reset and disabled-save cancellation');
