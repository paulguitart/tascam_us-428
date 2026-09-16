const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, 'PreSonus_FaderPortBasic.js'), 'utf8');
function load(settings = {}) {
    let code = source;
    for (const [name, value] of Object.entries(settings)) {
        code = code.replace(new RegExp('const ' + name + ' = [^\\r\\n]+'), 'const ' + name + ' = ' + value);
    }
    const scope = { require: () => require('../../api/midiremote_api_v1') };
    vm.createContext(scope); vm.runInContext(code, scope);
    const state = {}, messages = [], input = [], pedal = [];
    const context = { getState: k => state[k] || '', setState: (k,v) => { state[k] = v; } };
    let touched = 0;
    scope.faderTouch.getProcessValue = () => touched;
    scope.midiOut.sendMidi = (_, bytes) => messages.push(Array.from(bytes));
    scope.fader.mSurfaceValue.setProcessValue = (ctx, value) => {
        input.push(value);
        scope.fader.mSurfaceValue.mOnProcessValueChange(ctx, value);
    };
    scope.var_footswitchPressed.setProcessValue = (_, value) => pedal.push(value);
    return { scope, context, messages, input, pedal,
        touch: value => { touched = value; scope.faderTouch.mOnProcessValueChange(context,value); },
        raw: value => scope.var_faderInput.mOnProcessValueChange(context,value),
        host: value => scope.fader.mSurfaceValue.mOnProcessValueChange(context,value),
        foot: value => scope.fsSection.btn_Footswitch.mSurfaceValue.mOnProcessValueChange(context,value) };
}
let h=load();
h.raw(.4); assert.equal(h.input.length,0);
h.touch(1); h.raw(.4); assert.deepStrictEqual(h.input,[.4]); assert.equal(h.messages.length,0);
h.host(.5); h.host(.75); assert.equal(h.messages.length,0);
h.touch(0); assert.deepStrictEqual(h.messages.pop(),[224,127,95]);
h.host(.75); assert.equal(h.messages.length,0);
h.host(0); h.host(1); h.host(0);
assert.deepStrictEqual(h.messages,[[224,0,0],[224,127,127],[224,0,0]]);
h.messages.length=0;
h.scope.onLED(h.context,8); h.scope.onLED(h.context,8); assert.equal(h.messages.length,1);
h.scope.setRGBLED(h.context,77,127,0,0,1); h.scope.setRGBLED(h.context,77,127,0,0,1);
assert.equal(h.messages.length,4);
h.scope.resetHardwareState(h.context); h.scope.onLED(h.context,8); assert.equal(h.messages.length,5);
// A newer manual move supersedes a deferred host move.
h.messages.length=0; h.touch(1); h.host(.8); h.raw(.3); h.touch(0); assert.equal(h.messages.length,0);
h.host(.8); assert.equal(h.messages.length,1);
h.foot(1); h.foot(0); h.foot(1); assert.deepStrictEqual(h.pedal.slice(-3),[0,1,0]);
h=load({ENABLE_FADER_TOUCH_INPUT:false, ENABLE_FADER_TOUCH_PROTECTION:false, ENABLE_MIDI_OUTPUT_CACHE:false});
h.raw(.2); assert.deepStrictEqual(h.input,[.2]); h.touch(1); h.host(.5); h.host(.5); assert.equal(h.messages.length,2);
h=load({ENABLE_FADER_UNITY_CALIBRATION:true,FADER_HOST_UNITY:.75,FADER_HARDWARE_UNITY:.8,ENABLE_FADER_LOW_END_SNAP:true});
for (const value of [0,.1,.75,.9,1]) {
    const physical=h.scope.scaleFaderUnity(value,.75,.8);
    assert(Math.abs(h.scope.scaleFaderUnity(physical,.8,.75)-value)<1e-12);
}
assert(Math.abs(h.scope.scaleFaderUnity(.75,.75,.8)-.8)<1e-12);
h.touch(1); h.raw(.005); assert.equal(h.input.pop(),0);
h.touch(0); h.host(.005); assert.deepStrictEqual(h.messages.pop(),[224,0,0]);
h=load({FOOTSWITCH_NORMALLY_CLOSED:false}); h.foot(0); h.foot(1); h.foot(0); assert.deepStrictEqual(h.pedal,[0,1,0]);
h=load({FOOTSWITCH_IS_TOGGLE:true}); h.foot(0); h.foot(0); h.foot(1); h.foot(0); assert.deepStrictEqual(h.pedal,[1,0,1,0]);
h=load({ENABLE_FOOTSWITCH_NORMALIZATION:false}); h.foot(1); h.foot(0); assert.deepStrictEqual(h.pedal,[1,0]);
console.log('PASS: touch/input protection, deferred motor output, MIDI cache/reset, calibration round trips, low-end snap, pedal modes and disabled flags');
h=load();
h.scope.setRGBLED(h.context,77,127,40,0,.5);
assert.deepStrictEqual(h.messages,[[145,77,64],[146,77,20],[147,77,0]]);
h.scope.setRGBLED(h.context,77,127,40,0,.5); assert.equal(h.messages.length,3);
h=load(); h.scope.setRGBLED(h.context,77,127,127,127,0);
assert(h.messages.every(message=>message[2]===0));
console.log('PASS: RGB brightness scaling, zero brightness and cached scaled output');

h=load();
h.scope.setRGBLED(h.context,77,127,40,0,1);
h.scope.setRGBLED(h.context,77,127,40,0,.5);
h.scope.setRGBLED(h.context,77,127,40,0,1);
assert.deepStrictEqual(h.messages.slice(-2),[[145,77,127],[146,77,40]]);
assert.equal(vm.runInContext('FULL_BRIGHTNESS',h.scope),1);
assert.equal(vm.runInContext('HALF_BRIGHTNESS',h.scope),.5);
console.log('PASS: explicit per-call brightness and cache refresh when brightness changes');
