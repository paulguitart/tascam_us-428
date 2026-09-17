// Standalone routing checks; no Cubase installation or MIDI hardware required.
// Run: node tools/test_faderport_classic_shortcuts.js
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

function load(hasTouch = true) {
    const commands = [], midi = [], bindings = []
    const activeModes = new WeakMap()
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
                    if (binding.subpage && activeModes.get(device) !== binding.subpage) continue
                    // Do not assume that a custom-value pulse synchronously
                    // executes a Cubase action. OUTPUT must use direct activation.
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
            mMixConsole: { makeMixerBankZone: () => ({
                includeOutputChannels: () => ({ makeMixerBankChannel: () => ({ mValue: hostValues() }) })
            }) },
            mTrackSelection: { mMixerChannel: { mValue: hostValues() }, mAction: {} }
        },
        makeValueBinding(input, host) {
            const binding = { input, host }
            bindings.push(binding)
            const result = new Proxy({}, { get: (_, key) => arg => {
                if (key === 'setTypeToggle') binding.toggle = true
                if (key === 'setSubPage') binding.subpage = arg
                return result
            } })
            return result
        },
        makeCommandBinding(input, category, command) {
            bindings.push({ input, command: category + '/' + command }); return chain
        },
        makeActionBinding(input, action) { bindings.push({ input, action }); return chain },
        makeSubPageArea() { return { makeSubPage() {
            const mode = { mAction: { mActivate: { trigger(mapping) {
                assert(mapping && mapping.device, 'Subpage activation requires ActiveMapping, not ActiveDevice')
                const device = mapping.device
                activeModes.set(device, mode)
                if (mode.mOnActivate) mode.mOnActivate(device, mapping)
            } } } }
            return mode
        } } }
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
    const mapping = { device: d }
    page.mOnActivate(d, mapping)
    const press = (name, v = 1, target = d) => ctx[name].mSurfaceValue.mOnProcessValueChange(target, v)
    const tap = name => { press(name); press(name, 0) }
    return { ctx, d, device, press, tap, commands, midi, driver, bindings, page, mapping }
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

// Drag feedback must work before any host callback or capacitive release.
ctx.faderTouchValue.mOnProcessValueChange(d, 1)
const nearestUnity = Math.round(ctx.FADER_HOST_UNITY * 1023) / 1023
for (const [position, lit] of [
    [nearestUnity - 4 / 1023, 0], [nearestUnity, 1],
    [nearestUnity + 1 / 1023, 1], [nearestUnity + 4 / 1023, 0], [0, 0], [1, 0]
]) {
    t.midi.length = 0
    ctx.mainFader.mSurfaceValue.mOnProcessValueChange(d, position)
    assert.deepStrictEqual(t.midi, [[0xA0, 0x0F, lit]])
    ctx.selectedValues.mVolume.mOnProcessValueChange(d, {}, 0.25)
    assert.deepStrictEqual(t.midi, [[0xA0, 0x0F, lit]], 'Deferred host state must not override drag LED')
}
ctx.faderTouchValue.mOnProcessValueChange(d, 0)
t.midi.length = 0
ctx.selectedValues.mVolume.mOnProcessValueChange(d, {}, nearestUnity)
assert.deepStrictEqual(t.midi[0], [0xA0, 0x0F, 1])
console.log('PASS: live drag unity indication at 10-bit resolution, stale host suppression, host feedback after release')

// Enter near unity; small movements at the boundary must not flicker.
ctx.updateUnityLed(d, 0)
for (const [steps, lit] of [[2.5, 0], [1.9, 1], [2.5, 1], [3.1, 0], [-1.9, 1], [-2.5, 1], [-3.1, 0]]) {
    t.midi.length = 0
    ctx.updateUnityLed(d, ctx.FADER_HOST_UNITY + steps / 1023)
    assert.deepStrictEqual(t.midi, [[0xA0, 0x0F, lit]])
}
assert.strictEqual(ctx.selectedValues.mVolume.getProcessValue(d), ctx.FADER_HOST_UNITY,
    'Indicator changes must not alter the reset volume')
console.log('PASS: forgiving unity landing zone and hysteresis on both sides')

const off = load()
const c = off.ctx, od = off.d
c.rawFaderValue.mOnProcessValueChange(od, 0.6)
assert.strictEqual(c.selectedValues.mVolume.getProcessValue(od), 0.6)
c.faderTouchValue.mOnProcessValueChange(od, 1)
assert.strictEqual(c.enabledFaderTouch.getProcessValue(od), 1)
off.tap('btnOff')
assert.strictEqual(c.enabledFaderTouch.getProcessValue(od), 0)
assert(off.midi.some(msg => msg.join() === '160,16,1'), 'OFF LED must light')
off.midi.length = 0
c.rawFaderValue.mOnProcessValueChange(od, 0.2)
off.tap('btnTouchMode')
assert.strictEqual(c.selectedValues.mVolume.getProcessValue(od), 0.6, 'OFF blocks movement and unity reset')
c.selectedValues.mVolume.mOnProcessValueChange(od, {}, 0.8)
c.faderTouchValue.mOnProcessValueChange(od, 0)
assert(off.midi.every(msg => msg[0] !== 0xB0), 'OFF blocks motor including release')
c.selectedValues.mVolume.mOnProcessValueChange(od, {}, c.FADER_HOST_UNITY)
assert.deepStrictEqual(off.midi.slice(-1)[0], [0xA0, 0x0F, 0])
c.faderTouchValue.mOnProcessValueChange(od, 1)
off.tap('btnOff')
off.midi.length = 0
c.rawFaderValue.mOnProcessValueChange(od, 0.1)
assert.strictEqual(c.selectedValues.mVolume.getProcessValue(od), 0.6)
assert.strictEqual(c.enabledFaderTouch.getProcessValue(od), 0)
assert.strictEqual(off.midi.length, 0)
c.faderTouchValue.mOnProcessValueChange(od, 0)
const target = Math.round(c.FADER_HOST_UNITY * 1023)
assert.deepStrictEqual(off.midi.slice(-2), [[0xB0, 0, target >> 7], [0xB0, 0x20, target & 127]])
c.rawFaderValue.mOnProcessValueChange(od, 0.7)
assert.strictEqual(c.selectedValues.mVolume.getProcessValue(od), 0.7)
off.tap('btnOff')
off.driver.mOnDeactivate(od)
off.driver.mOnActivate(od)
assert.strictEqual(c.isFaderEnabled(od), true)
console.log('PASS: OFF gates input, touch automation, reset and motor; safe re-enable and lifecycle reset')

const output = load(), oc = output.ctx, outDevice = output.d
oc.trackVolumeFeedback.setProcessValue(outDevice, 0.4)
oc.outputVolumeFeedback.setProcessValue(outDevice, 0.8)
output.tap('btnOff')
output.tap('btnOutput')
assert.strictEqual(oc.isFaderEnabled(outDevice), true)
assert.strictEqual(outDevice.getState('classic.output'), '1')
assert.strictEqual(oc.lastHostVolume, 0.8)
oc.rawFaderValue.mOnProcessValueChange(outDevice, 0.7)
assert.strictEqual(oc.stereoOut.mValue.mVolume.getProcessValue(outDevice), 0.7)
assert.strictEqual(oc.selectedValues.mVolume.getProcessValue(outDevice), 0.4)
output.tap('btnTouchMode')
assert.strictEqual(oc.stereoOut.mValue.mVolume.getProcessValue(outDevice), oc.FADER_HOST_UNITY)
output.midi.length = 0
oc.selectedValues.mVolume.mOnProcessValueChange(outDevice, {}, 0.2)
assert.strictEqual(output.midi.length, 0, 'Inactive track must not move output fader')
output.tap('btnOff')
assert.strictEqual(oc.isFaderEnabled(outDevice), false)
output.tap('btnOutput')
assert.strictEqual(oc.isFaderEnabled(outDevice), true)
assert.strictEqual(outDevice.getState('classic.output'), '1', 'OUTPUT after OFF restores output')
oc.faderTouchValue.mOnProcessValueChange(outDevice, 1)
output.midi.length = 0
output.tap('btnOutput') // Return to track, but wait for the held fader to release.
assert.strictEqual(outDevice.getState('classic.output'), '')
oc.rawFaderValue.mOnProcessValueChange(outDevice, 0.1)
assert.strictEqual(oc.selectedValues.mVolume.getProcessValue(outDevice), 0.4)
assert(output.midi.every(msg => msg[0] !== 0xB0))
oc.faderTouchValue.mOnProcessValueChange(outDevice, 0)
oc.rawFaderValue.mOnProcessValueChange(outDevice, 0.5)
assert.strictEqual(oc.selectedValues.mVolume.getProcessValue(outDevice), 0.5)
assert.strictEqual(oc.stereoOut.mValue.mVolume.getProcessValue(outDevice), oc.FADER_HOST_UNITY)
console.log('PASS: OUTPUT target isolation, OFF precedence, output unity reset, inactive feedback, held target switch')

output.page.mOnDeactivate(outDevice)
assert.strictEqual(oc.getFaderTargetMapping(outDevice), null)
output.tap('btnOutput')
assert.strictEqual(outDevice.getState('classic.output'), '')
const replacementMapping = { device: outDevice }
output.page.mOnActivate(outDevice, replacementMapping)
assert.strictEqual(oc.getFaderTargetMapping(outDevice), replacementMapping)
output.tap('btnOutput')
assert.strictEqual(outDevice.getState('classic.output'), '1')
assert(output.midi.some(msg => msg.join() === '160,17,1'), 'OUTPUT sends its measured LED address')
console.log('PASS: direct OUTPUT subpage activation with distinct mapping context and page lifecycle')
