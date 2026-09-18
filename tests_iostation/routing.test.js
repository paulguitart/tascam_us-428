// Run with: node tests_iostation/routing.test.js
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const scope = { require: () => require('../api/midiremote_api_v1') };
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8'), scope);
function device() {
    const state = {};
    return { setState: (k, v) => { state[k] = v; }, getState: k => state[k] || '' };
}
const a = device(), b = device(), events = [], midi = [];
for (const name of Object.keys(scope.buttons)) {
    scope.buttons[name].setProcessValue = (context, value) => events.push([name, value]);
}
const selectedTrackStates = { Solo: 0, Mute: 0, Arm: 0 }, toggleWrites = [];
for (const name of Object.keys(selectedTrackStates)) {
    const value = scope.selectedTrackToggleValues[name];
    value.getProcessValue = () => selectedTrackStates[name];
    value.setProcessValue = (context, nextValue) => {
        selectedTrackStates[name] = nextValue;
        toggleWrites.push([name, nextValue]);
    };
}
scope.midiOut.sendMidi = (context, bytes) => midi.push(Array.from(bytes));
const shift = value => scope.uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange(a, value);
const press = (mapping, value, context = a) => mapping.physicalButton.mSurfaceValue.mOnProcessValueChange(context, value);
// Every printed pair routes independently, with SHIFT remaining on after release.
for (const mapping of scope.buttonMappings) {
    scope.resetButtonRouting(a); events.length = 0;
    press(mapping, 1); press(mapping, 0);
    shift(1); shift(1); shift(0); // Duplicate press cannot toggle back off.
    press(mapping, 1); press(mapping, 1); press(mapping, 0);
    const shiftedTarget = mapping.normalName === 'Link' ? 'Link' : mapping.shiftedName;
    assert.deepStrictEqual(events, [[mapping.normalName, 1], [mapping.normalName, 0], [shiftedTarget, 1], [shiftedTarget, 0]]);
    assert.equal(a.getState('shiftEnabled'), '1');
}
// Selected-track buttons change host state once on press; duplicates and release do not undo it.
for (const name of Object.keys(selectedTrackStates)) {
    const mapping = scope.buttonMappings.find(item => item.normalName === name);
    scope.resetButtonRouting(a);
    selectedTrackStates[name] = 0;
    toggleWrites.length = 0;
    press(mapping, 1); press(mapping, 1); press(mapping, 0);
    assert.equal(selectedTrackStates[name], 1);
    assert.deepStrictEqual(toggleWrites, [[name, 1]]);
    press(mapping, 1); press(mapping, 0);
    assert.equal(selectedTrackStates[name], 0);
    assert.deepStrictEqual(toggleWrites, [[name, 1], [name, 0]]);
}
// Held mode button keeps the same path after SHIFT toggles off.
const master = scope.buttonMappings.find(mapping => mapping.normalName === 'Master');
events.length = 0;
press(master, 1); shift(1); shift(0); press(master, 0); press(master, 1); press(master, 0);
assert.deepStrictEqual(events, [['Master',1],['Master',0],['Master',1],['Master',0]]);
// Device contexts do not share SHIFT state.
shift(1); shift(0); events.length = 0;
press(master, 1, b); press(master, 0, b);
assert.deepStrictEqual(events, [['Master',1],['Master',0]]);
assert(midi.some(bytes => bytes.join() === '144,70,127'));
assert(midi.some(bytes => bytes.join() === '144,70,0'));
scope.deviceDriver.mOnDeactivate(a);
assert.equal(a.getState('shiftEnabled'), '0');
assert.equal(a.getState('held.Master'), '');
console.log('PASS: 17 printed pairs, selected-track toggles, latched SHIFT, duplicate presses, release routing, device isolation, LED feedback and reset');
