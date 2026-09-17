// Standalone routing checks; no Cubase installation or MIDI hardware required.
// Run: node tools/test_faderport_classic_shortcuts.js
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

function load(hasTouch = true) {
    const commands = [], midi = [], bindings = []
    const chain = new Proxy({}, { get: () => () => chain })
    function value() {
        const states = new WeakMap()
        return {
            mMidiBinding: chain,
            getProcessValue(device) { return states.get(device) || 0 },
            setProcessValue(device, next) {
                const previous = states.get(device) || 0
                states.set(device, next)
                for (const binding of bindings.filter(b => b.input === this)) {
                    if (binding.command && next === 1) commands.push(binding.command)
                    if (binding.host) {
                        if (!binding.toggle) binding.host.setProcessValue(device, next)
                        else if (next > 0 && previous <= 0) {
                            binding.host.setProcessValue(device, binding.host.getProcessValue(device) > 0 ? 0 : 1)
                        }
                    }
                }
            }
        }
    }
    function control() {
        const c = { mSurfaceValue: value() }
        if (hasTouch) c.mSurfaceValue.mTouchState = chain
        c.setTypePush = c.setTypeVertical = () => c
        return c
    }
    const hostValues = () => new Proxy({}, {
        get(target, key) { return target[key] || (target[key] = value()) }
    })
    const page = {
        mHostAccess: {
            mTransport: { mValue: hostValues() },
            mTrackSelection: { mMixerChannel: { mValue: hostValues() }, mAction: {} }
        },
        makeValueBinding(input, host) {
            const binding = { input, host }
            bindings.push(binding)
            return new Proxy({}, { get: (_, key) => () => {
                if (key === 'setTypeToggle') binding.toggle = true
                return chain
            } })
        },
        makeCommandBinding(input, category, command) {
            bindings.push({ input, command: category + '/' + command }); return chain
        },
        makeActionBinding() { return chain }
    }
    const driver = {
        mPorts: {
            makeMidiInput: () => ({}),
            makeMidiOutput: () => ({ sendMidi: (device, bytes) => midi.push(Array.from(bytes)) })
        },
        makeDetectionUnit: () => chain,
        mSurface: { makeButton: control, makeFader: control, makeKnob: control,
            makeCustomValueVariable: value },
        mMapping: { makePage: () => page }
    }
    const ctx = vm.createContext({ require: () => ({ makeDeviceDriver: () => driver }) })
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../PreSonus_FaderportClassic.js'), 'utf8'), ctx)
    function device() {
        const state = {}
        return { getState: k => state[k] || '', setState: (k, v) => { state[k] = v } }
    }
    const d = device()
    driver.mOnActivate(d)
    const press = (name, v = 1, target = d) => ctx[name].mSurfaceValue.mOnProcessValueChange(target, v)
    const tap = name => { press(name); press(name, 0) }
    return { ctx, d, device, press, tap, commands, midi, driver, bindings }
}

const t = load()
const { ctx, d, press, tap, commands } = t
tap('btnShift')
assert.deepStrictEqual(commands, [])
assert.deepStrictEqual(t.midi.slice(-2), [[0xA0, 5, 1], [0xA0, 5, 0]])
tap('btnUndo')
press('btnShift')
press('btnUndo')
press('btnUndo') // Duplicate press must not repeat.
press('btnShift', 0)
press('btnUndo', 0) // Releasing SHIFT first must not undo.
tap('btnUndo')
assert.deepStrictEqual(commands.splice(0), ['Edit/Undo', 'Edit/Redo', 'Edit/Undo'])
for (const shifted of [false, true]) {
    if (shifted) press('btnShift')
    tap('btnPunch'); tap('btnUser')
    if (shifted) press('btnShift', 0)
}
assert.deepStrictEqual(commands.splice(0), Array(2).fill([
    'Transport/Locate Previous Marker', 'Transport/Locate Next Marker'
]).flat())

for (const [button, host, command] of [
    ['btnLoop', ctx.transportValues.mCycleActive, 'Marker/Insert Marker'],
    ['btnSolo', ctx.selectedValues.mSolo, 'Edit/Deactivate All Solo'],
    ['btnMute', ctx.selectedValues.mMute, 'Edit/Unmute All']
]) {
    const binding = t.bindings.find(b => b.host === host)
    // Simulate Cubase synchronizing the logical value after a mouse/track change.
    binding.input.setProcessValue(d, 1)
    tap(button)
    assert.strictEqual(host.getProcessValue(d), 0)
    tap(button)
    assert.strictEqual(host.getProcessValue(d), 1)
    press('btnShift'); press(button); press('btnShift', 0); press(button, 0)
    assert.strictEqual(host.getProcessValue(d), 1, 'Shift command must not toggle host value')
    assert.deepStrictEqual(commands.splice(0), [command])
}

press('btnRew')
assert.strictEqual(ctx.rewindInput.getProcessValue(d), 1)
press('btnRew', 0)
assert.strictEqual(ctx.rewindInput.getProcessValue(d), 0)
press('btnStop'); press('btnRew'); press('btnRew')
assert.strictEqual(ctx.rewindInput.getProcessValue(d), 0)
press('btnRew', 0); press('btnRew') // Repeat chord while STOP stays down.
press('btnStop', 0)
assert.strictEqual(ctx.rewindInput.getProcessValue(d), 0)
press('btnRew', 0)
assert.deepStrictEqual(commands.splice(0), [
    'Transport/Stop', 'Transport/Return to Zero', 'Transport/Return to Zero'
])
press('btnShift')
const other = t.device()
press('btnUndo', 1, other); press('btnUndo', 0, other)
assert.deepStrictEqual(commands.splice(0), ['Edit/Undo'])
press('btnRew')
t.driver.mOnDeactivate(d)
assert.strictEqual(ctx.rewindInput.getProcessValue(d), 0)
t.driver.mOnActivate(d)
tap('btnUndo')
assert.deepStrictEqual(commands.splice(0), ['Edit/Undo'])
const legacy = load(false)
legacy.press('btnShift'); legacy.tap('btnLoop')
assert.deepStrictEqual(legacy.commands, ['Transport/Insert Marker'])
console.log('PASS: held SHIFT, exclusive shortcuts, markers, host toggles, RTZ, release order, duplicate presses, device isolation, lifecycle reset, legacy marker command')

const playback = t.bindings.find(b => b.input === ctx.btnPlay.mSurfaceValue)
assert.strictEqual(playback.toggle, true)
ctx.btnPlay.mSurfaceValue.setProcessValue(d, 1)
ctx.btnPlay.mSurfaceValue.setProcessValue(d, 0)
assert.strictEqual(ctx.transportValues.mStart.getProcessValue(d), 1, 'PLAY release must keep playing')
ctx.btnPlay.mSurfaceValue.setProcessValue(d, 1)
ctx.btnPlay.mSurfaceValue.setProcessValue(d, 0)
assert.strictEqual(ctx.transportValues.mStart.getProcessValue(d), 0)

tap('btnTouchMode')
assert.strictEqual(ctx.selectedValues.mVolume.getProcessValue(d), ctx.FADER_HOST_UNITY)
// Explicitly deliver host feedback, as Cubase does for mouse/track/reset changes.
for (const [level, lit] of [
    [ctx.FADER_HOST_UNITY, 1],
    [ctx.FADER_HOST_UNITY + ctx.FADER_UNITY_TOLERANCE / 2, 1],
    [ctx.FADER_HOST_UNITY + ctx.FADER_UNITY_TOLERANCE * 2, 0],
    [0, 0], [1, 0]
]) {
    t.midi.length = 0
    ctx.selectedValues.mVolume.mOnProcessValueChange(d, {}, level)
    assert.deepStrictEqual(t.midi[0], [0xA0, 0x0F, lit])
}
ctx.faderTouchValue.mOnProcessValueChange(d, 1)
t.midi.length = 0
tap('btnTouchMode')
ctx.selectedValues.mVolume.mOnProcessValueChange(d, {}, ctx.FADER_HOST_UNITY)
assert(t.midi.every(bytes => bytes[0] !== 0xB0), 'Reset must not fight a held fader')
ctx.faderTouchValue.mOnProcessValueChange(d, 0)
assert.strictEqual(t.midi.filter(bytes => bytes[0] === 0xB0).length, 2)
console.log('PASS: PLAY toggle, TOUCH unity reset/LED, off at min/max, motor touch protection')
