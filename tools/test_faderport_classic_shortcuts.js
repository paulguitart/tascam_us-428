// Standalone routing checks; no Cubase installation or MIDI hardware required.
// Run: node tools/test_faderport_classic_shortcuts.js
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

function load(hasTouch = true) {
    let now = 1000
    const commands = [], midi = [], bindings = []
    const activeModes = new WeakMap()
    const chain = new Proxy({}, { get: () => () => chain })
    function value() {
        const states = new WeakMap()
        return {
            mMidiBinding: chain,
            receiveHostValue(device, next) { states.set(device, next) },
            getProcessValue(device) { return states.get(device) || 0 },
            setProcessValue(device, next) {
                const previous = states.get(device) || 0
                states.set(device, next)
                for (const binding of bindings.filter(b => b.input === this)) {
                    if (binding.subpage && (!activeModes.get(device)
                        || activeModes.get(device).get(binding.subpage.area) !== binding.subpage)) continue
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
            mMouseCursor: { mValueUnderMouse: value(), mValueLocked: value() },
            mMixConsole: { makeMixerBankZone: () => ({
                includeOutputChannels: () => ({ makeMixerBankChannel: () => ({ mValue: hostValues() }) })
            }) },
            mTrackSelection: { mMixerChannel: { mValue: hostValues(),
                mSends: { getByIndex: index => {
                    assert.strictEqual(index, 0)
                    return { mLevel: value(), mOn: value() }
                } }
            }, mAction: {} }
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
        makeSubPageArea() { const area = {}; return { makeSubPage() {
            const mode = { area, mAction: { mActivate: { trigger(mapping) {
                assert(mapping && mapping.device, 'Subpage activation requires ActiveMapping, not ActiveDevice')
                const device = mapping.device
                if (!activeModes.has(device)) activeModes.set(device, new Map())
                activeModes.get(device).set(area, mode)
                for (const b of bindings.filter(b => b.subpage === mode && b.host)) {
                    b.input.receiveHostValue(device, b.host.getProcessValue(device))
                }
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
    const ctx = vm.createContext({ Date: { now: () => now }, require: () => ({ makeDeviceDriver: () => driver }) })
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
    const idle = (ms = 100) => { now += ms; driver.mOnIdle(d) }
    return { ctx, d, device, press, tap, commands, midi, driver, bindings, page, mapping, idle }
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
assert.deepStrictEqual(commands.splice(0), [
    'Transport/Locate Previous Marker', 'Transport/Locate Next Marker',
    'Transport/Recall Cycle Marker 9', 'Transport/Recall Cycle Marker 1'
])
press('btnShift')
press('btnUser'); press('btnUser') // Duplicate press must recall only once.
press('btnShift', 0); press('btnUser', 0)
assert.deepStrictEqual(commands.splice(0), ['Transport/Recall Cycle Marker 2'])
press('btnShift'); tap('btnPunch'); press('btnShift', 0)
assert.deepStrictEqual(commands.splice(0), ['Transport/Recall Cycle Marker 1'])
assert.strictEqual(ctx.transportValues.mCycleActive.getProcessValue(d), 0,
    'Cycle marker navigation must not enable looping')

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
assert.strictEqual(c.selectedValues.mVolume.getProcessValue(od), 0.6, 'OFF blocks movement')
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
console.log('PASS: OFF gates input, touch automation and motor; safe re-enable and lifecycle reset')

for (const useOutput of [false, true]) {
    for (const held of [false, true]) {
        const reset = load(), rc = reset.ctx, rd = reset.d
        if (useOutput) reset.tap('btnOutput')
        const target = useOutput ? rc.stereoOut.mValue.mVolume : rc.selectedValues.mVolume
        target.setProcessValue(rd, 0.3)
        reset.tap('btnOff')
        if (held) rc.faderTouchValue.mOnProcessValueChange(rd, 1)
        reset.midi.length = 0
        reset.tap('btnTouchMode')
        assert.strictEqual(rd.getState('classic.faderOff'), '')
        assert.strictEqual(rd.getState('classic.output'), useOutput ? '1' : '')
        assert.strictEqual(target.getProcessValue(rd), rc.FADER_HOST_UNITY)
        assert(reset.midi.some(msg => msg.join() === '160,16,0'), 'TOUCH clears OFF LED')
        target.mOnProcessValueChange(rd, {}, rc.FADER_HOST_UNITY)
        if (held) {
            rc.rawFaderValue.mOnProcessValueChange(rd, 0.1)
            assert.strictEqual(target.getProcessValue(rd), rc.FADER_HOST_UNITY)
            assert.strictEqual(rc.enabledFaderTouch.getProcessValue(rd), 0)
            assert(reset.midi.every(msg => msg[0] !== 0xB0), 'Reset must not fight a held fader')
            rc.faderTouchValue.mOnProcessValueChange(rd, 0)
        }
        assert.strictEqual(rc.isFaderEnabled(rd), true)
        const unityPosition = Math.round(rc.FADER_HOST_UNITY * 1023)
        assert.deepStrictEqual(reset.midi.filter(msg => msg[0] === 0xB0).slice(-2),
            [[0xB0, 0, unityPosition >> 7], [0xB0, 0x20, unityPosition & 127]])
        rc.rawFaderValue.mOnProcessValueChange(rd, 0.4)
        assert.strictEqual(target.getProcessValue(rd), 0.4)
    }
}
console.log('PASS: TOUCH overrides OFF and resets track/output to unity, with safe held-fader release and resumed input')

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

const knob = load(), kc = knob.ctx, kd = knob.d
kc.selectedValues.mPan.setProcessValue(kd, 0.3)
kc.firstSend.mLevel.setProcessValue(kd, 0.65)
knob.tap('btnTransport')
assert.strictEqual(kc.selectedValues.mPan.getProcessValue(kd), 0.5)
assert.strictEqual(kc.firstSend.mLevel.getProcessValue(kd), 0.65)
knob.tap('btnMix')
assert.strictEqual(kd.getState('classic.sendMode'), '1')
assert.deepStrictEqual(knob.midi.slice(-1)[0], [0xA0, 0x0C, 1])
kc.panKnobRaw.mOnProcessValueChange(kd, 0.01)
assert.strictEqual(kc.firstSend.mLevel.getProcessValue(kd), 0.65 + kc.FP_KNOB_STEP)
assert.strictEqual(kc.selectedValues.mPan.getProcessValue(kd), 0.5)
knob.tap('btnTransport')
assert.strictEqual(kc.firstSend.mLevel.getProcessValue(kd), kc.SEND_HOST_UNITY)
assert.strictEqual(kc.firstSend.mOn.getProcessValue(kd), 0, 'Reset does not enable the send')
knob.tap('btnOutput')
kc.panKnobRaw.mOnProcessValueChange(kd, 0.99)
assert.strictEqual(kc.firstSend.mLevel.getProcessValue(kd), kc.SEND_HOST_UNITY - kc.FP_KNOB_STEP)
assert.strictEqual(kd.getState('classic.output'), '1')
knob.tap('btnOff')
knob.tap('btnTransport')
assert.strictEqual(kc.firstSend.mLevel.getProcessValue(kd), kc.SEND_HOST_UNITY)
knob.tap('btnMix')
assert.strictEqual(kd.getState('classic.sendMode'), '')
assert.strictEqual(kc.isFaderEnabled(kd), false, 'MIX must not defeat OFF')
assert.strictEqual(kd.getState('classic.output'), '1', 'MIX must not change fader target')
kc.panKnobRaw.mOnProcessValueChange(kd, 0.01)
assert.strictEqual(kc.selectedValues.mPan.getProcessValue(kd), 0.5 + kc.FP_KNOB_STEP)
assert.strictEqual(kc.firstSend.mLevel.getProcessValue(kd), kc.SEND_HOST_UNITY)
knob.tap('btnTransport')
assert.strictEqual(kc.selectedValues.mPan.getProcessValue(kd), 0.5)
assert.deepStrictEqual(knob.commands, [])
console.log('PASS: MIX pan/send routing, TRNS resets, mode LED, independent fader modes, send enable preserved')

const mouse = load(), mc = mouse.ctx, md = mouse.d
const hovered = mouse.page.mHostAccess.mMouseCursor.mValueUnderMouse
const locked = mouse.page.mHostAccess.mMouseCursor.mValueLocked
hovered.setProcessValue(md, 0.42)
mc.mouseFaderFeedback.receiveHostValue(md, 0.42)
mouse.tap('btnProject')
assert.strictEqual(locked.getProcessValue(md), 0, 'Lock waits until after mode activation')
mc.panKnobRaw.mOnProcessValueChange(md, 0.01)
assert.strictEqual(hovered.getProcessValue(md), 0.42, 'Do not edit while lock is pending')
mouse.idle(50)
assert.strictEqual(locked.getProcessValue(md), 0)
mouse.idle(50)
assert.strictEqual(locked.getProcessValue(md), 1)
assert.strictEqual(md.getState('classic.mouseMode'), '1')
assert.deepStrictEqual(mouse.midi.slice(-1)[0], [0xA0, 0x0B, 1])
mc.panKnobRaw.mOnProcessValueChange(md, 0.01)
assert.strictEqual(hovered.getProcessValue(md), 0.42 + mc.FP_KNOB_STEP)
assert.strictEqual(mc.selectedValues.mPan.getProcessValue(md), 0)
mouse.tap('btnTransport')
assert.strictEqual(hovered.getProcessValue(md), 0.42, 'TRNS restores the PROJ entry value')
mouse.tap('btnOutput'); mouse.tap('btnOff')
assert.strictEqual(locked.getProcessValue(md), 1)
mouse.tap('btnProject')
assert.strictEqual(locked.getProcessValue(md), 0)
assert.strictEqual(md.getState('classic.mouseMode'), '')
assert.strictEqual(md.getState('classic.sendMode'), '')
mouse.tap('btnMix'); mouse.tap('btnProject'); mouse.tap('btnProject')
assert.strictEqual(md.getState('classic.sendMode'), '1', 'PROJ restores prior send mode')
mouse.tap('btnProject'); mouse.tap('btnMix')
assert.strictEqual(locked.getProcessValue(md), 0, 'MIX releases mouse lock')
assert.strictEqual(md.getState('classic.sendMode'), '1')
mouse.tap('btnProject')
mouse.page.mOnDeactivate(md)
assert.strictEqual(locked.getProcessValue(md), 0)
mouse.page.mOnActivate(md, mouse.mapping)
assert.strictEqual(md.getState('classic.mouseMode'), '')
mouse.tap('btnProject')
mouse.driver.mOnDeactivate(md)
assert.strictEqual(locked.getProcessValue(md), 0)
console.log('PASS: PROJ locks mouse target, routes knob exclusively, restores prior mode and saved value on TRNS, unlocks on exit')

const pendingMouse = load(), pm = pendingMouse.ctx, pd = pendingMouse.d
const requests = []
const originalLockWrite = pm.mouseLockValue.setProcessValue
pm.mouseLockValue.setProcessValue = function(device, next) {
    requests.push(next)
    originalLockWrite.call(this, device, next)
}
pendingMouse.tap('btnProject'); pendingMouse.tap('btnProject'); pendingMouse.idle()
assert(!requests.includes(1), 'Leaving PROJ must cancel delayed lock')
requests.length = 0
pendingMouse.tap('btnProject'); pendingMouse.tap('btnMix'); pendingMouse.idle()
assert(!requests.includes(1), 'MIX must cancel delayed lock')
requests.length = 0
pendingMouse.tap('btnProject'); pendingMouse.idle(); pendingMouse.idle()
assert.strictEqual(requests.filter(v => v === 1).length, 1, 'Lock once; do not keep retargeting')
pendingMouse.tap('btnProject'); requests.length = 0
pendingMouse.tap('btnProject'); pendingMouse.page.mOnDeactivate(pd); pendingMouse.idle()
assert(!requests.includes(1), 'Page deactivation must cancel delayed lock')
console.log('PASS: deferred mouse lock fires once and cancels on PROJ/MIX/page exit')

for (const modeButton of [null, 'btnMix', 'btnProject']) {
    const zoom = load(), zc = zoom.ctx, zd = zoom.d
    zc.selectedValues.mPan.setProcessValue(zd, 0.3)
    zc.firstSend.mLevel.setProcessValue(zd, 0.65)
    if (modeButton) zoom.tap(modeButton)
    zoom.press('btnShift')
    zoom.press('btnTransport'); zoom.press('btnTransport')
    zoom.press('btnShift', 0); zoom.press('btnTransport', 0)
    assert.deepStrictEqual(zoom.commands, ['Zoom/Zoom to Locators'])
    assert.strictEqual(zc.selectedValues.mPan.getProcessValue(zd), 0.3)
    assert.strictEqual(zc.firstSend.mLevel.getProcessValue(zd), 0.65)
}
console.log('PASS: SHIFT+TRNS zooms to locators in every knob mode without resetting pan/send or repeating on release')

const bank = load(), bc = bank.ctx, bd = bank.d
const bh = bank.page.mHostAccess.mMouseCursor.mValueUnderMouse
const bl = bank.page.mHostAccess.mMouseCursor.mValueLocked
bc.trackVolumeFeedback.setProcessValue(bd, 0.3)
bh.setProcessValue(bd, 0.6)
bc.mouseFaderFeedback.receiveHostValue(bd, 0.6)
bank.tap('btnBank')
assert.strictEqual(bd.getState('classic.mouseFader'), '1')
assert.deepStrictEqual(bank.midi.slice(-1)[0], [0xA0, 0x13, 1])
bc.rawFaderValue.mOnProcessValueChange(bd, 0.1)
bank.tap('btnTouchMode')
assert.strictEqual(bh.getProcessValue(bd), 0.6, 'Pending lock blocks fader edits and reset')
bank.idle()
assert.strictEqual(bl.getProcessValue(bd), 1)
assert.strictEqual(bc.lastHostVolume, 0.6)
bc.rawFaderValue.mOnProcessValueChange(bd, 0.7)
assert.strictEqual(bh.getProcessValue(bd), 0.7)
assert.strictEqual(bc.selectedValues.mVolume.getProcessValue(bd), 0.3)
bank.tap('btnTouchMode')
assert.strictEqual(bh.getProcessValue(bd), bc.FADER_HOST_UNITY)
bank.midi.length = 0
bc.selectedValues.mVolume.mOnProcessValueChange(bd, {}, 0.2)
bc.stereoOut.mValue.mVolume.mOnProcessValueChange(bd, {}, 0.2)
assert.strictEqual(bank.midi.length, 0, 'Track/output feedback must not move mouse fader')
bc.faderTouchValue.mOnProcessValueChange(bd, 1)
bh.mOnProcessValueChange(bd, {}, 0.8)
assert.strictEqual(bank.midi.length, 0, 'Mouse feedback must not fight touch')
bc.faderTouchValue.mOnProcessValueChange(bd, 0)
assert(bank.midi.some(msg => msg[0] === 0xB0))
bank.tap('btnMix')
assert.strictEqual(bl.getProcessValue(bd), 1, 'Knob pan/send mode preserves BANK lock')
bank.tap('btnProject')
assert.strictEqual(bd.getState('classic.mouseFader'), '')
assert.strictEqual(bd.getState('classic.mouseMode'), '1')
bank.idle()
bank.tap('btnBank')
assert.strictEqual(bd.getState('classic.mouseMode'), '')
assert.strictEqual(bd.getState('classic.sendMode'), '1')
bank.idle()
bank.tap('btnBank')
assert.strictEqual(bl.getProcessValue(bd), 0)
assert.strictEqual(bd.getState('classic.output'), '')
bc.rawFaderValue.mOnProcessValueChange(bd, 0.4)
assert.strictEqual(bc.selectedValues.mVolume.getProcessValue(bd), 0.4)
for (const exitButton of ['btnBank', 'btnOff', 'btnOutput']) {
    bank.tap('btnBank')
    bank.midi.length = 0
    bank.tap(exitButton)
    bank.idle()
    assert.strictEqual(bl.getProcessValue(bd), 0, 'Exit cancels pending lock')
    assert.strictEqual(bd.getState('classic.mouseFader'), '')
    if (exitButton === 'btnOff') {
        assert.strictEqual(bc.isFaderEnabled(bd), false)
        assert(bank.midi.every(msg => msg[0] !== 0xB0), 'OFF must not move motor on exit')
        bank.tap('btnTouchMode')
        assert.strictEqual(bc.selectedValues.mVolume.getProcessValue(bd), bc.FADER_HOST_UNITY)
    }
    if (exitButton === 'btnOutput') assert.strictEqual(bd.getState('classic.output'), '1')
}
bank.tap('btnBank'); bank.idle(); bank.tap('btnBank')
assert.strictEqual(bd.getState('classic.output'), '', 'BANK returns to track even when entered from output')
bank.tap('btnBank'); bank.page.mOnDeactivate(bd); bank.idle()
assert.strictEqual(bl.getProcessValue(bd), 0)
assert.strictEqual(bd.getState('classic.mouseFader'), '')
console.log('PASS: BANK fader routing, reset, motor protection, exclusive PROJ, exit targets and pending-lock cancellation')

// A subpage action is asynchronous in Cubase; do not rely on immediate activation.
for (const exitButton of ['btnOff', 'btnBank']) {
    const delayed = load(), dc = delayed.ctx, dd = delayed.d
    dc.trackVolumeFeedback.setProcessValue(dd, 0.25)
    dc.mouseFaderFeedback.receiveHostValue(dd, 0.6)
    delayed.tap('btnBank'); delayed.idle()
    const activate = dc.trackFaderMode.mAction.mActivate
    const originalTrigger = activate.trigger
    let pendingMapping
    activate.trigger = mapping => { pendingMapping = mapping }
    delayed.tap(exitButton)
    if (exitButton === 'btnOff') {
        assert.strictEqual(dd.getState('classic.mouseFader'), '', 'OFF releases BANK immediately')
        assert.strictEqual(delayed.page.mHostAccess.mMouseCursor.mValueLocked.getProcessValue(dd), 0)
    }
    delayed.midi.length = 0
    originalTrigger(pendingMapping)
    assert.strictEqual(dd.getState('classic.mouseFader'), '')
    assert.strictEqual(dd.getState('classic.faderOff'), exitButton === 'btnOff' ? '1' : '')
    assert.strictEqual(dd.getState('classic.exitMouseOff'), '')
    dc.rawFaderValue.mOnProcessValueChange(dd, 0.8)
    assert.strictEqual(dc.selectedValues.mVolume.getProcessValue(dd), exitButton === 'btnOff' ? 0.25 : 0.8)
    if (exitButton === 'btnOff') {
        dc.selectedValues.mVolume.mOnProcessValueChange(dd, {}, 0.4)
        dc.faderTouchValue.mOnProcessValueChange(dd, 0)
        assert(delayed.midi.every(msg => msg[0] !== 0xB0), 'Delayed OFF exit keeps the motor disabled')
    }
}
const stale = load(), sc = stale.ctx, sd = stale.d
stale.tap('btnBank')
sc.mainFader.mSurfaceValue.receiveHostValue(sd, 0.15) // Old track value still on surface.
sc.mouseFaderFeedback.receiveHostValue(sd, 0.75) // Actual mouse parameter feedback.
stale.idle()
assert.strictEqual(sc.lastHostVolume, 0.75, 'Mouse lock must not initialize motor from stale track value')
console.log('PASS: delayed OFF/BANK exits and independent mouse feedback for initial motor position')

const snapshot = load(), sn = snapshot.ctx, snd = snapshot.d
const snHost = snapshot.page.mHostAccess.mMouseCursor.mValueUnderMouse
for (const initial of [0.37, 0, 1]) {
    snHost.setProcessValue(snd, initial)
    sn.mouseFaderFeedback.receiveHostValue(snd, initial)
    snapshot.tap('btnProject')
    snapshot.tap('btnTransport')
    assert.strictEqual(snHost.getProcessValue(snd), initial, 'No reset before snapshot')
    snapshot.idle()
    snHost.setProcessValue(snd, 0.63)
    sn.mouseFaderFeedback.receiveHostValue(snd, 0.63)
    snapshot.idle()
    snapshot.press('btnShift'); snapshot.tap('btnTransport'); snapshot.press('btnShift', 0)
    assert.strictEqual(snHost.getProcessValue(snd), 0.63, 'Shift zoom must not restore snapshot')
    snapshot.tap('btnTransport')
    assert.strictEqual(snHost.getProcessValue(snd), initial, 'Each PROJ entry captures a fresh value, including zero')
    snHost.setProcessValue(snd, 0.8)
    snapshot.tap('btnTransport')
    assert.strictEqual(snHost.getProcessValue(snd), initial, 'Repeated TRNS restores the same snapshot')
    snapshot.tap('btnProject')
    assert.strictEqual(snd.getState('classic.mouseSavedValue'), '')
}
console.log('PASS: PROJ snapshots persist across edits, refresh on re-entry, handle zero/one and preserve SHIFT+TRNS')

const bankReset = load(), br = bankReset.ctx, brd = bankReset.d
const brHost = bankReset.page.mHostAccess.mMouseCursor.mValueUnderMouse
for (const initial of [0.28, 0, 1]) {
    brHost.setProcessValue(brd, initial)
    br.mouseFaderFeedback.receiveHostValue(brd, initial)
    bankReset.tap('btnBank')
    bankReset.tap('btnTransport')
    assert.strictEqual(brHost.getProcessValue(brd), initial, 'BANK reset waits for snapshot')
    bankReset.idle()
    br.rawFaderValue.mOnProcessValueChange(brd, 0.63)
    br.mouseFaderFeedback.receiveHostValue(brd, 0.63)
    bankReset.idle()
    bankReset.press('btnShift'); bankReset.tap('btnTransport'); bankReset.press('btnShift', 0)
    assert.strictEqual(brHost.getProcessValue(brd), 0.63)
    br.faderTouchValue.mOnProcessValueChange(brd, 1)
    bankReset.midi.length = 0
    bankReset.tap('btnTransport')
    assert.strictEqual(brHost.getProcessValue(brd), initial)
    brHost.mOnProcessValueChange(brd, {}, initial)
    assert(bankReset.midi.every(msg => msg[0] !== 0xB0), 'Restore must not fight held fader')
    br.faderTouchValue.mOnProcessValueChange(brd, 0)
    const position = Math.round(initial * 1023)
    assert.deepStrictEqual(bankReset.midi.slice(-2),
        [[0xB0, 0, position >> 7], [0xB0, 0x20, position & 127]])
    assert.strictEqual(br.selectedValues.mPan.getProcessValue(brd), 0)
    assert.strictEqual(br.selectedValues.mVolume.getProcessValue(brd), 0)
    bankReset.tap('btnTouchMode')
    assert.strictEqual(brHost.getProcessValue(brd), br.FADER_HOST_UNITY)
    bankReset.tap('btnTransport')
    assert.strictEqual(brHost.getProcessValue(brd), initial, 'TOUCH must not replace the snapshot')
    bankReset.tap('btnBank')
    assert.strictEqual(brd.getState('classic.mouseSavedValue'), '')
}
console.log('PASS: BANK TRNS restores fresh snapshots through fader, protects held motor, isolates track/pan, preserves TOUCH and SHIFT+TRNS')
