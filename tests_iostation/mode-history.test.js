// Standalone mode-history checks; no Cubase API stub required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8');
const scope = {
    ENABLE_METRONOME_FADER: true,
    faderModes: Object.fromEntries(['Track', 'StereoOut', 'Metronome'].map(name =>
        [name, { mAction: { mActivate: { trigger() {} } } }])),
    knob: { getProcessValue: () => 0.5 },
    updateTouchLED() {}, updateKnobModeLEDs() {}
};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf('function resolveKnobModeButton('), source.indexOf('// Blend only red')), scope);
function device() {
    const state = {};
    return { getState: key => state[key] || '', setState: (key, value) => { state[key] = value; } };
}
const a = device(), b = device();
scope.activateKnobMode(a, 'Pan');
assert.equal(scope.resolveKnobModeButton(a, 'Pan'), 'Pan');
scope.activateKnobMode(a, 'Click');
assert.equal(scope.resolveKnobModeButton(a, 'Click'), 'Pan');
scope.activateKnobMode(a, 'Pan');
assert.equal(scope.resolveKnobModeButton(a, 'Pan'), 'Click');
scope.activateKnobMode(a, 'Pan');
assert.equal(a.getState('previousKnobMode'), 'Click');
for (const [button, mode] of Object.entries({ Link: 'Link', Scroll: 'Zoom', Zoom: 'Zoom', Master: 'Master', Click: 'Click', Channel: 'HighPass', Section: 'Section', Marker: 'Marker' })) {
    scope.activateKnobMode(a, 'Pan');
    scope.activateKnobMode(a, mode);
    assert.equal(scope.resolveKnobModeButton(a, button), 'Pan');
    assert.equal(scope.resolveKnobModeButton(a, 'F2'), 'F2');
    assert.equal(scope.resolveKnobModeButton(b, button), button);
}
console.log('PASS: previous-mode toggling, repeated activation, aliases, shifted paths and device isolation');

// Exercise the actual physical-button router, including held-button releases.
const events = [];
scope.buttons = {};
scope.selectedTrackToggleValues = {};
scope.surface = { makeCustomValueVariable: name => ({
    setProcessValue(context, value) { events.push([name, value]); }
}) };
scope.buttons.Pan = scope.surface.makeCustomValueVariable('Pan');
vm.runInContext(source.slice(source.indexOf('function assignButtonRouting('), source.indexOf('for (var buttonIndex =')).trimEnd(), scope);
for (const name of ['Link', 'Pan', 'Channel', 'Scroll', 'Master', 'Click', 'Section', 'Marker']) {
    const match = source.match(new RegExp("normalName: '" + name + "', shiftedName: '([^']+)'"));
    const mapping = { normalName: name, shiftedName: match[1], physicalButton: { mSurfaceValue: {} } };
    scope.assignButtonRouting(mapping);
    const context = device();
    for (const shift of ['0', '1']) {
        context.setState('shiftEnabled', shift);
        events.length = 0;
        const press = mapping.physicalButton.mSurfaceValue.mOnProcessValueChange;
        press(context, 1);
        press(context, 1);
        context.setState('shiftEnabled', shift === '1' ? '0' : '1');
        press(context, 0);
        const expected = name === 'Channel' && shift === '1' ? 'PreGain' : name === 'Scroll' && shift === '1' ? 'Zoom' : name;
        assert.deepEqual(events, [[expected, 1], [expected, 0]]);
        // Pressing the active mode returns to Pan in either SHIFT state.
        context.setState('knobMode', name === 'Channel' ? (shift === '1' ? 'PreGain' : 'HighPass') : name === 'Scroll' ? 'Zoom' : name);
        context.setState('previousKnobMode', 'Pan');
        context.setState('shiftEnabled', shift);
        events.length = 0;
        press(context, 1); press(context, 0);
        assert.deepEqual(events, [['Pan', 1], ['Pan', 0]]);
        context.setState('knobMode', '');
    }
}
console.log('PASS: mode buttons respect the Channel SHIFT alternate, toggle back, suppress duplicate presses and release across SHIFT changes');
