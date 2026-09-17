// Standalone mode-history checks; no Cubase API stub required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'PreSonus_IOStation.js'), 'utf8');
const scope = {
    ENABLE_METRONOME_FADER: true, onLED() {}, offLED() {}, cShift: 6,
    faderModes: Object.fromEntries(['Track', 'StereoOut', 'Metronome', 'Mouse', 'Dormant'].map(name =>
        [name, { mAction: { mActivate: { trigger() {} } } }])),
    knob: { getProcessValue: () => 0.5 },
    updateTouchLED() {}, updateKnobModeLEDs() {},
    isMouseLinkMode: mode => mode === "Mouse" || mode === "MouseFader",
    leaveMouseLink() {}, beginMouseLinkCapture() {}, syncMouseFader() {},
    mappedFaderTouch: {setProcessValue(){}}, faderTouch: {getProcessValue:()=>0}
};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf('function resolveKnobModeButton('), source.indexOf('var highPassColors')), scope);
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
for (const [button, mode] of Object.entries({ Link: 'Mouse', Scroll: 'Zoom', Zoom: 'Zoom', Master: 'Master', Click: 'Click', Channel: 'HighPass', Section: 'Section', Marker: 'Marker' })) {
    scope.activateKnobMode(a, 'Pan');
    scope.activateKnobMode(a, mode);
    assert.equal(scope.resolveKnobModeButton(a, button), button === 'Channel' ? 'PreGain' : 'Pan');
    assert.equal(scope.resolveKnobModeButton(a, 'F2'), 'F2');
    assert.equal(scope.resolveKnobModeButton(b, button), button);
}
console.log('PASS: previous-mode toggling, repeated activation, aliases, shifted paths and device isolation');

// Exercise the actual physical-button router, including held-button releases.
const events = [];
scope.handleMouseLinkButton=context=>{const target=context.getState('knobMode')==='Mouse'?'MouseFader':'Link';events.push([target,1],[target,0]);};
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
        const expected = name === 'Link' && shift === '1' ? 'MouseFader' : name === 'Pan' && shift === '1' ? 'Send' : name === 'Channel' && shift === '1' ? 'PreGain' : name === 'Scroll' && shift === '1' ? 'Zoom' : name;
        assert.deepEqual(events, [[expected, 1], [expected, 0]]);
        // Pressing the active mode returns to Pan in either SHIFT state.
        context.setState('knobMode', name === 'Link' ? (shift === '1' ? 'MouseFader' : 'Mouse') : name === 'Pan' ? (shift === '1' ? 'Send' : 'Pan') : name === 'Channel' ? (shift === '1' ? 'PreGain' : 'HighPass') : name === 'Scroll' ? 'Zoom' : name);
        context.setState('previousKnobMode', 'Pan');
        context.setState('shiftEnabled', shift);
        events.length = 0;
        press(context, 1); press(context, 0);
        const target = name === 'Link' ? (shift === '1' ? 'Link' : 'MouseFader') : name === 'Channel' ? (shift === '1' ? 'Channel' : 'PreGain') : 'Pan';
        assert.deepEqual(events, [[target, 1], [target, 0]]);
        context.setState('knobMode', '');
    }
}
console.log('PASS: mode buttons respect the Channel SHIFT alternate, toggle back, suppress duplicate presses and release across SHIFT changes');

// Normal lower modes clear both the SHIFT routing state and LED; history restores alternates.
let shiftLed = false;
scope.onLED = (_, note) => { if (note === scope.cShift) shiftLed = true; };
scope.offLED = (_, note) => { if (note === scope.cShift) shiftLed = false; };
for (const alternate of ['PreGain', 'Send']) {
    for (const normal of ['Master', 'Click', 'Section', 'Marker', 'Pan', 'Zoom']) {
        const context = device();
        scope.activateKnobMode(context, alternate);
        assert.equal(context.getState('shiftEnabled'), '1'); assert.equal(shiftLed, true);
        scope.activateKnobMode(context, normal);
        assert.equal(context.getState('shiftEnabled'), '0'); assert.equal(shiftLed, false);
        const recalled = scope.resolveKnobModeButton(context, normal);
        assert.equal(recalled, alternate);
        scope.activateKnobMode(context, recalled);
        assert.equal(context.getState('shiftEnabled'), '1'); assert.equal(shiftLed, true);
        assert.equal(context.getState('previousKnobMode'), normal);
    }
}
console.log('PASS: Master/Click/Section/Marker/Pan/Zoom clear SHIFT and history restores both alternate modes and LED');

// Exercise SHIFT itself: switching Pan/Send is immediate, and release is inert.
scope.uSection={btn_Shift:{mSurfaceValue:{}}};
scope.pulseVar=(context,button)=>{button.setProcessValue(context,1);button.setProcessValue(context,0);};
for(const mode of ['Pan','Send','MouseFader'])scope.buttons[mode]={setProcessValue(context,value){if(value)scope.activateKnobMode(context,mode);}};
const shiftStart=source.indexOf('uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange =');
vm.runInContext(source.slice(shiftStart,source.indexOf('function resetButtonRouting',shiftStart)),scope);
const shift=scope.uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange,context=device();
scope.activateKnobMode(context,'Pan');
shift(context,1);shift(context,1);assert.equal(context.getState('knobMode'),'Send');assert.equal(shiftLed,true);
shift(context,0);assert.equal(context.getState('knobMode'),'Send');
shift(context,1);shift(context,0);assert.equal(context.getState('knobMode'),'Pan');assert.equal(shiftLed,false);
let toggles=0;scope.toggleModeEffect=()=>{toggles++;};
const bypassMapping={normalName:'Bypass',shiftedName:'BypassAll',physicalButton:{mSurfaceValue:{}}};
scope.assignButtonRouting(bypassMapping);
for(const mode of ['Pan','Send'])for(const layer of ['0','1']){
 scope.activateKnobMode(context,mode);context.setState('shiftEnabled',layer);events.length=0;
 const press=bypassMapping.physicalButton.mSurfaceValue.mOnProcessValueChange;
 press(context,1);press(context,1);press(context,0);
 assert.deepEqual(events,[['Bypass',1],['Bypass',0]]);
}
assert.equal(toggles,4);
scope.activateKnobMode(context,'Mouse');shift(context,1);shift(context,0);
assert.equal(context.getState('knobMode'),'MouseFader');
console.log('PASS: immediate Pan/Send SHIFT switching, duplicate suppression, BYPASS in both layers and stable Mouse mode');
