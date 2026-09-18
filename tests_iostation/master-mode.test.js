// Standalone checks for Master-mode BYPASS targets and LED polarity.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8');
assert(source.includes('page.makeCommandBinding(var_masterInsertBypassPressed,'));
assert(!source.includes('page.makeCommandBinding(buttons.Bypass,'));
const state = {};
let mute = 0, insertsBypassed = 0, bypassLed = false, masterLed = null;
const insertBypassPulses = [];
const context = { getState: key => state[key] || '', setState: (key, value) => { state[key] = value; } };
const scope = {
    cBypass: 3,
    cMaster: 0x3A,
    isTrackFaderBypassMode: () => false,
    isMetronomeBypassMode: () => false,
    isMouseLinkMode: () => false,
    setTransportLed: (ctx, note, enabled) => {
        if (note === 3) bypassLed = enabled;
        if (note === 0x3A) masterLed = enabled ? 127 : 0;
    },
    masterInsertBypassFeedback: { getProcessValue: () => insertsBypassed },
    var_masterInsertBypassPressed: {
        setProcessValue: (ctx, value) => insertBypassPulses.push(value)
    },
    pulseVar: (ctx, variable) => {
        variable.setProcessValue(ctx, 1);
        variable.setProcessValue(ctx, 0);
    },
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
runFunction('updateMasterLED', 'updateBypassLED');
runFunction('updateBypassLED', 'toggleModeEffect');
runFunction('toggleModeEffect', 'updateKnobModeLEDs');
const masterLEDCode = source.slice(source.indexOf('function updateMasterLED('), source.indexOf('\n}', source.indexOf('function updateMasterLED(')) + 2);
assert(!masterLEDCode.includes('masterInsertBypassFeedback'));

state.knobMode = 'MasterFX';
scope.updateBypassLED(context);
assert.equal(bypassLed, false);
assert.deepEqual(insertBypassPulses, []);
scope.toggleModeEffect(context);
assert.equal(mute, 1);
assert.deepEqual(insertBypassPulses, []);
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
scope.toggleModeEffect(context);
assert.deepEqual(insertBypassPulses, [1, 0]);
assert.equal(mute, 1); // Normal Master uses its own insert command trigger.
insertsBypassed = 1;
scope.updateBypassLED(context);
assert.equal(bypassLed, false);

state.knobMode = 'Pan';
insertsBypassed = 0;
scope.updateMasterLED(context);
assert.equal(masterLed, 0); // Off outside Master modes, even when inserts are active.
insertsBypassed = 1;
scope.updateMasterLED(context);
assert.equal(masterLed, 0);
for (const mode of ['Master', 'MasterFX']) {
    state.knobMode = mode;
    insertsBypassed = 0;
    scope.updateMasterLED(context);
    assert.equal(masterLed, 127); // On in either Master mode.
    insertsBypassed = 1;
    scope.updateMasterLED(context);
    assert.equal(masterLed, 127); // Still on when the Main Mix insert is bypassed.
}
state.knobMode = 'Master'; // Returning from SHIFT + Master keeps the mode LED on.
scope.updateMasterLED(context);
assert.equal(masterLed, 127);
state.knobMode = 'Click';
scope.updateMasterLED(context);
assert.equal(masterLed, 0);

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
console.log('PASS: separate Master and SHIFT + Master BYPASS actions; insert-independent Master mode LED and locator zoom verified');
