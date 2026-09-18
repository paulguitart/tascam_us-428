// Standalone checks for Master-mode BYPASS targets and LED polarity.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8');
const state = {};
let mute = 0, insertsBypassed = 0, bypassLed = false;
const context = { getState: key => state[key] || '', setState: (key, value) => { state[key] = value; } };
const scope = {
    cBypass: 3,
    isTrackFaderBypassMode: () => false,
    isMetronomeBypassMode: () => false,
    isMouseLinkMode: () => false,
    setTransportLed: (ctx, note, enabled) => { if (note === 3) bypassLed = enabled; },
    masterInsertBypassFeedback: { getProcessValue: () => insertsBypassed },
    fxReturnMuteFeedback: {
        getProcessValue: () => mute,
        setProcessValue: (ctx, value) => { mute = value; scope.updateBypassLED(ctx); }
    }
};
vm.createContext(scope);
function runFunction(name, nextName) {
    const start = source.indexOf('function ' + name + '(');
    const end = source.indexOf('function ' + nextName + '(', start);
    assert(start >= 0 && end > start, `Could not find ${name}`);
    vm.runInContext(source.slice(start, end), scope);
}
runFunction('updateBypassLED', 'toggleModeEffect');
runFunction('toggleModeEffect', 'updateKnobModeLEDs');

state.knobMode = 'MasterFX';
scope.updateBypassLED(context);
assert.equal(bypassLed, false);
scope.toggleModeEffect(context);
assert.equal(mute, 1);
assert.equal(bypassLed, true);
scope.toggleModeEffect(context);
assert.equal(mute, 0);
assert.equal(bypassLed, false);
mute = 1; // Host-side mute changes drive the same LED feedback.
scope.updateBypassLED(context);
assert.equal(bypassLed, true);

state.knobMode = 'Master';
insertsBypassed = 0;
scope.updateBypassLED(context);
assert.equal(bypassLed, true);
insertsBypassed = 1;
scope.updateBypassLED(context);
assert.equal(bypassLed, false);

const zoomPulses = [];
scope.mSection = { knob_Press: { mSurfaceValue: {} } };
scope.var_zoomToLocators = { setProcessValue: (ctx, value) => zoomPulses.push(value) };
scope.pulseVar = (ctx, variable) => { variable.setProcessValue(ctx, 1); variable.setProcessValue(ctx, 0); };
const pushStart = source.indexOf('    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange =');
const pushEnd = source.indexOf('    // Korg zoom pattern:', pushStart);
assert(pushStart >= 0 && pushEnd > pushStart);
vm.runInContext(source.slice(pushStart, pushEnd), scope);
for (const mode of ['Master', 'MasterFX']) {
    state.knobMode = mode;
    scope.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(context, 1);
    scope.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(context, 0);
}
assert.deepEqual(zoomPulses, [1, 0, 1, 0]);
console.log('PASS: Master BYPASS reports Main Mix inserts; SHIFT + Master toggles FX Return mute with muted LED and both knob pushes zoom to locators');
