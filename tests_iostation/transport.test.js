// Run with: node tests_iostation/transport.test.js
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
let now = 10000;
const scope = { require: () => require('../api/midiremote_api_v1'), Date: { now: () => now } };
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8'), scope);
const state = {}, events = [], midi = [];
const context = { setState: (k,v) => { state[k] = v; }, getState: k => state[k] || '' };
for (const name of ['var_stopPressed','var_rewPressed','var_RTZPressed','var_savePressed']) {
    scope[name].setProcessValue = (_,value) => events.push([name,value]);
}
scope.midiOut.sendMidi = (_,bytes) => midi.push(Array.from(bytes));
const stop = value => scope.transport.btnStop.mSurfaceValue.mOnProcessValueChange(context,value);
const rew = value => scope.transport.btnRewind.mSurfaceValue.mOnProcessValueChange(context,value);
const idle = ms => { now += ms; scope.deviceDriver.mOnIdle(context); };
const count = name => events.filter(e => e[0] === name && e[1] === 1).length;
scope.resetTransport(context);
// Stop immediately, short tap never saves; rewind remains held until released.
stop(1); assert.equal(count('var_stopPressed'),1); idle(1499); stop(0); idle(1);
assert.equal(count('var_savePressed'),0);
rew(1); rew(0);
assert.deepStrictEqual(events.slice(-2),[['var_rewPressed',1],['var_rewPressed',0]]);
// Chord can be repeated, cancels save, and never starts rewind.
for (let i=0;i<2;i++) { stop(1); rew(1); rew(0); idle(2000); stop(0); }
assert.equal(count('var_RTZPressed'),2); assert.equal(count('var_rewPressed'),1);
assert.equal(count('var_savePressed'),0);
// Hold threshold and duplicate press protection; one save per hold.
stop(1); idle(1000); stop(1); idle(499); assert.equal(count('var_savePressed'),0);
idle(1); assert.equal(count('var_savePressed'),1);
// Host changes during animation are suppressed on animated LEDs, then restored.
const play = scope.transportFeedback.find(f => f.note === scope.cPlay);
play.value.getProcessValue = () => 1;
midi.length = 0; play.value.mOnProcessValueChange(context,1); assert.equal(midi.length,0);
const cycle = scope.transportFeedback.find(f => f.note === scope.cCycle);
cycle.value.mOnProcessValueChange(context,1); assert.deepStrictEqual(midi.pop(),[144,scope.cCycle,127]);
for (let i=0;i<9;i++) idle(140);
assert.equal(context.getState('saveBlinkCount'),'');
assert(midi.some(m => m[1] === scope.cPlay && m[2] === 127));
idle(5000); assert.equal(count('var_savePressed'),1); stop(0);
// Disabled save and device reset cancel pending timers.
scope.ENABLE_STOP_HOLD_SAVE = false; stop(1); idle(2000); stop(0);
assert.equal(count('var_savePressed'),1);
scope.ENABLE_STOP_HOLD_SAVE = true; stop(1); scope.resetTransport(context); idle(2000);
assert.equal(count('var_savePressed'),1);
console.log('PASS: stop, held rewind, repeated RTZ, hold threshold, save cancellation, LED animation/restore and reset');

// Verify the actual host targets and toggle modes installed by the assignment helper.
const bindings = [], commands = [];
scope.page.makeValueBinding = (input, host) => {
    const binding = { input, host, toggle: false, page: null };
    bindings.push(binding);
    const api = {};
    api.setTypeToggle = () => { binding.toggle = true; return api; };
    api.setSubPage = page => { binding.page = page; return api; };
    return api;
};
scope.page.makeCommandBinding = (input, category, command) => commands.push([input, category, command]);
scope.assignTransportControls();
assert.equal(bindings.length, 5);
assert.equal(bindings.filter(b => b.toggle).length, 3);
assert.strictEqual(bindings[0].host, scope.hostTransport.mStart);
assert.strictEqual(bindings[1].host, scope.hostTransport.mRecord);
assert.strictEqual(bindings[2].host, scope.hostTransport.mCycleActive);
assert.strictEqual(bindings[3].host, scope.hostTransport.mForward);
assert.strictEqual(bindings[4].host, scope.hostTransport.mRewind);
assert.deepStrictEqual(commands.map(c => c.slice(1)), [['Transport','Stop'],['Transport','Return to Zero'],['File','Save']]);
console.log('PASS: host transport bindings, toggle modes and command targets');
// Utility actions use the named SHIFT paths; Cycle retains its existing binding.
bindings.length = 0; commands.length = 0;
scope.assignUtilityControls();
assert.strictEqual(commands[0][0], scope.buttons.Undo);
assert.strictEqual(commands[1][0], scope.buttons.Redo);
assert.deepStrictEqual(commands.map(c => c.slice(1)), [['Edit','Undo'],['Edit','Redo']]);
assert.equal(bindings.length, 0);
assert(!scope.transportFeedback.some(feedback => feedback.note === scope.cClick));
const metronome = scope.metronomeFeedbackValue;
assert(metronome);
const metronomeHost = scope.hostMetronomeActive;
assert(metronomeHost);
let metronomeState = 0;
metronome.getProcessValue = () => metronomeState;
const setMetronome = value => {
    metronomeState = value;
    metronomeHost.mOnProcessValueChange(context, null, value);
};
context.setState('saveBlinkCount','0');
for (const feedback of [cycle]) {
    context.setState('midi.144.' + feedback.note, '');
    midi.length = 0;
    feedback.value.mOnProcessValueChange(context,0);
    feedback.value.mOnProcessValueChange(context,1);
    assert.deepStrictEqual(midi,[[144,feedback.note,0],[144,feedback.note,127]]);
}
function clickColor() {
    return [145,146,147].map(status => Number(context.getState('midi.' + status + '.' + scope.cClick)));
}
function clickLedOn() {
    return Number(context.getState('midi.144.' + scope.cClick)) === 127;
}
scope.resetHardwareState(context); midi.length=0;
context.setState('knobMode','Pan'); setMetronome(1);
assert.deepStrictEqual(clickColor(),[127,48,0]); // metronome on outside Click mode: amber
assert(clickLedOn());
scope.resetHardwareState(context); midi.length=0;
scope.knobModes.Click.mOnActivate(context);
assert.deepStrictEqual(clickColor(),[0,127,0]); // Click mode plus metronome on: green
assert(clickLedOn());
scope.resetHardwareState(context); midi.length=0;
setMetronome(0);
assert.deepStrictEqual(clickColor(),[0,0,127]); // Click mode with metronome off: blue
assert(clickLedOn());
scope.resetHardwareState(context); midi.length=0;
scope.knobModes.Pan.mOnActivate(context);
assert.deepStrictEqual(clickColor(),[0,0,0]); // neither state active: off
assert(!clickLedOn());
console.log('PASS: Undo/Redo paths, mode-scoped metronome toggle, and Click RGB state colors');
// Selected-track navigation and motor-fader volume use the existing logical paths.
const actions = [];
bindings.length = 0;
scope.page.makeActionBinding = (input, action) => {
    const binding = { input, action, page: null };
    actions.push(binding);
    return { setSubPage(page) { binding.page = page; return this; } };
};
scope.assignSelectedTrackControls();
const selection = scope.page.mHostAccess.mTrackSelection;
assert.equal(actions.length, 10);
for (const modeName of ['Pan', 'Zoom', 'Master', 'Click', 'HighPass']) {
    const mode = scope.knobModes[modeName];
    assert(actions.some(binding => binding.input === scope.buttons.Prev
        && binding.action === selection.mAction.mPrevTrack && binding.page === mode));
    assert(actions.some(binding => binding.input === scope.buttons.Next
        && binding.action === selection.mAction.mNextTrack && binding.page === mode));
}
assert(!actions.some(binding => binding.page === scope.knobModes.Marker));
assert.equal(bindings.length, 5);
for (const modeName of ['Pan', 'Zoom', 'Click', 'HighPass', 'Marker']) {
    assert(bindings.some(binding => binding.input === scope.fader.mSurfaceValue
        && binding.host === selection.mMixerChannel.mValue.mVolume
        && binding.page === scope.knobModes[modeName]));
}
console.log('PASS: selected-track Prev/Next and fader bindings stay scoped outside Master/Marker navigation');
