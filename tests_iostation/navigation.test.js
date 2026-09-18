// Standalone navigation checks without the Cubase API stub.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8');
const state = {}, events = [];
const context = { getState: key => state[key] || '', setState: (key, value) => { state[key] = value; } };
const scope = {
    ENABLE_FADER_NUDGE: true, CYCLE_MARKER_MAX: 3,
    surface: { makeCustomValueVariable: name => name },
    pulseVar: (_, value) => events.push(value),
    nudgeCurrentFader: (_, direction) => events.push(direction)
};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf('var var_cycleMarkers ='), source.indexOf('var var_armAllPressed =')), scope);
scope.var_cycleMarkers = [null, 'cycle1', 'cycle2', 'cycle3'];
function press(mode, direction, expected) {
    state.knobMode = mode;
    events.length = 0;
    scope.routeNavigationPress(context, direction);
    assert.deepEqual(events, [expected]);
}
// SCROLL uses the Zoom subpage; cycle recall wraps in both directions.
press('Zoom', 'Prev', 'cycle3');
press('Zoom', 'Next', 'cycle1');
press('Zoom', 'Next', 'cycle2');
for (const nudge of [true, false]) {
    scope.ENABLE_FADER_NUDGE = nudge;
    press('Section', 'Prev', 'Set Left Locator Pressed');
    press('Section', 'Next', 'Set Right Locator Pressed');
    assert.equal(state.activeCycleMarker, '2');
    for (const mode of ['Master', 'MasterFX']) {
        press(mode, 'Prev', nudge ? -1 : 'Set Left Locator Pressed');
        press(mode, 'Next', nudge ? 1 : 'Set Right Locator Pressed');
    }
}
press('Marker', 'Prev', 'Previous Marker Pressed');
press('Marker', 'Next', 'Next Marker Pressed');
press('Pan', 'Prev', 'Previous Track Pressed');
press('Pan', 'Next', 'Next Track Pressed');
console.log('PASS: SCROLL cycle recall/wrap, SECTION locators, Master options and other navigation');
