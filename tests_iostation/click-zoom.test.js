// Standalone checks that Click-mode knob turns use the existing zoom path.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8').replace(/\r\n/g, '\n');
const pulses = [];
const scope = {
    var_zoomIn: { setProcessValue: (context, value) => pulses.push(['in', value]) },
    var_zoomOut: { setProcessValue: (context, value) => pulses.push(['out', value]) },
    pulseVar: (context, variable) => {
        variable.setProcessValue(context, 1);
        variable.setProcessValue(context, 0);
    }
};
const state = { knobMode: 'Click' };
const context = { getState: key => state[key] || '', setState: (key, value) => { state[key] = value; } };
vm.createContext(scope);
const routeStart = source.indexOf('function routeUnboundKnobTurn(');
const routeEnd = source.indexOf('function assignKnobControls(', routeStart);
assert(routeStart >= 0 && routeEnd > routeStart);
vm.runInContext(source.slice(routeStart, routeEnd), scope);

scope.routeUnboundKnobTurn(context, 0.6, 0.1);
scope.routeUnboundKnobTurn(context, 0.5, -0.1);
assert.deepEqual(pulses, [['in', 1], ['in', 0], ['out', 1], ['out', 0]]);

const assignStart = source.indexOf('function assignKnobControls(');
const assignEnd = source.indexOf('knobModes.MouseFader.mOnActivate', assignStart);
const assignments = source.slice(assignStart, assignEnd);
assert(assignments.includes('knobModes.MasterFX, knobModes.Click'));
assert(!assignments.includes('makeValueBinding(knob, hostTransport.mMetronomeClickLevel)'));
assert(source.includes("|| mode === 'Click'\n                || mode === 'Master'"));
assert(source.includes("page.makeValueBinding(fader.mSurfaceValue, hostTransport.mMetronomeClickLevel)"));
assert(source.includes("setSubPage(knobModes.Click)"));

const locatorPulses = [];
let metronomeToggles = 0;
scope.var_zoomToLocators = { setProcessValue: (context, value) => locatorPulses.push(value) };
scope.mSection = { knob_Press: { mSurfaceValue: {} } };
scope.toggleMetronome = () => { metronomeToggles++; };
scope.isTrackFaderBypassMode = () => false;
scope.isMouseLinkMode = () => false;
scope.isMetronomeBypassMode = mode => mode === 'Click';
const pushStart = source.indexOf('    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange =');
const pushEnd = source.indexOf('    // Korg zoom pattern:', pushStart);
assert(pushStart >= 0 && pushEnd > pushStart);
vm.runInContext(source.slice(pushStart, pushEnd), scope);
scope.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(context, 1);
scope.mSection.knob_Press.mSurfaceValue.mOnProcessValueChange(context, 0);
assert.deepEqual(locatorPulses, [1, 0]);
assert.equal(metronomeToggles, 0);

const effectStart = source.indexOf('function toggleModeEffect(');
const effectEnd = source.indexOf('function updateKnobModeLEDs(', effectStart);
assert(effectStart >= 0 && effectEnd > effectStart);
vm.runInContext(source.slice(effectStart, effectEnd), scope);
scope.toggleModeEffect(context);
assert.equal(metronomeToggles, 1); // BYPASS remains the Click-mode metronome toggle.
console.log('PASS: Click knob rotation and push zoom; BYPASS still toggles the metronome and the fader remains mapped');
