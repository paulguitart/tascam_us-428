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
