// PreSonus FaderPort v2 - hardware boilerplate (Cubase MIDI Remote).
// Hardware definitions and surface geometry adapted from fp-wizard,
// September 10, 2026, by Christian & Werner. Simplified by Paul Warner.
// Original preserved at ../PreSonus_FaderPort.js.

//-----------------------------------------------------------------------------
// 0. CUSTOM SETTINGS
//-----------------------------------------------------------------------------

var ENABLE_STOP_HOLD_SAVE = true
var STOP_SAVE_HOLD_MS = 1500
var SAVE_BLINK_INTERVAL_MS = 140
var SAVE_BLINK_TOGGLES = 10             // 5 full blinks, like the Korg

// Hardware refinements. Volume-specific options stay off until we need them.
const ENABLE_FADER_TOUCH_INPUT = true       // ignore motor-generated input when not touched
const ENABLE_FADER_TOUCH_PROTECTION = true // don't drive the motor under your finger
const ENABLE_MIDI_OUTPUT_CACHE = true      // skip identical LED/motor messages
const ENABLE_FADER_LOW_END_SNAP = false
const FADER_LOW_END_THRESHOLD = 0.012       // inherited from fp-wizard; normalized travel
const ENABLE_FADER_UNITY_CALIBRATION = false
const FADER_HOST_UNITY = 0.789087           // original +6 dB setting; +12 dB uses 0.748222
const FADER_HARDWARE_UNITY = 0.789087       // measure your unit's U position before enabling
const ENABLE_FOOTSWITCH_NORMALIZATION = true
const FOOTSWITCH_NORMALLY_CLOSED = true
const FOOTSWITCH_IS_TOGGLE = false         // false: press/release; true: pulse on each edge
const ENABLE_HIGH_PASS_COLOR_GRADIENT = true // false: solid red when enabled
const FULL_BRIGHTNESS = 1
const HALF_BRIGHTNESS = 0.5

var deviceDriver = require('midiremote_api_v1')
    .makeDeviceDriver('PreSonus', 'FaderPortBasic', 'Paul Warner; based on Christian & Werner')
var midiIn = deviceDriver.mPorts.makeMidiInput()
var midiOut = deviceDriver.mPorts.makeMidiOutput()
deviceDriver.makeDetectionUnit().detectPortPair(midiIn, midiOut)
    .expectInputNameEquals('PreSonus FP2').expectOutputNameEquals('PreSonus FP2')

// MIDI channel arguments are zero-based. Keep the hardware in the same mode
// used with the original script; this script does not change its DAW mode.
// midi codes for controlling the FaderPort
var cSolo = 0x08, cMute = 0x10, cArm = 0x00, cShift = 0x46
var cBypass = 0x03, cTouch = 0x4D, cWrite = 0x4B, cRead = 0x4A
var cPrev = 0x2E, cNext = 0x2F, cKnobRotate = 0x10, cKnobPress = 0x20
var cLink = 0x05, cPan = 0x2A, cChannel = 0x36, cScroll = 0x38
var cMaster = 0x3A, cClick = 0x3B, cSection = 0x3C, cMarker = 0x3D
var cCycle = 0x56, cRWD = 0x5B, cFWD = 0x5C, cStop = 0x5D, cPlay = 0x5E, cRecord = 0x5F
var cFootswitch = 0x66, cFaderTouch = 0x68


// surface & layers
var surface = deviceDriver.mSurface
var cl_fader = surface.makeControlLayerZone('Z1').makeControlLayer('Fader')
var cl_uSection = surface.makeControlLayerZone('Z2').makeControlLayer('Upper Section')
var cl_mSection = surface.makeControlLayerZone('Z3').makeControlLayer('Middle Section')
var cl_tpSection = surface.makeControlLayerZone('Z4').makeControlLayer('Transport Section')
var cl_fsSection = surface.makeControlLayerZone('Z5').makeControlLayer('Footswitch')


// One page: transport assignments plus named paths for future workflows.
var page = deviceDriver.mMapping.makePage('Hardware')

// Physical fader layout is unchanged. Raw MIDI passes through the helpers below.
var fader = surface.makeFader(0.11, 0, 1.1, 5.728).setTypeVertical()
    .setControlLayer(cl_fader)
var var_faderInput = surface.makeCustomValueVariable('Raw Fader Input')
var_faderInput.mMidiBinding.setInputPort(midiIn).bindToPitchBend(0)
var faderTouch = surface.makeCustomValueVariable('Fader Touch')
faderTouch.mMidiBinding.setInputPort(midiIn).bindToNote(0, cFaderTouch)
if (fader.mSurfaceValue.mTouchState) {
    fader.mSurfaceValue.mTouchState.bindTo(faderTouch)
}

// Original surface dimensions, positions, shapes and control layers.
function create_uSection(p_x, p_y) {
    var uSection = {}
    uSection.btn_Solo = surface.makeButton(p_x, p_y, 1.02, 0.7).setControlLayer(cl_uSection)
    uSection.btn_Mute = surface.makeButton(p_x + 1.02, p_y, 1.02, 0.7).setControlLayer(cl_uSection)
    uSection.btn_Arm = surface.makeButton(p_x + 2.04, p_y, 1.02, 0.7).setControlLayer(cl_uSection)
    uSection.btn_Shift = surface.makeButton(p_x + 3.06, p_y, 1.02, 0.7).setControlLayer(cl_uSection)
    uSection.btn_Bypass = surface.makeButton(p_x, p_y + 0.7, 1.02, 0.7).setControlLayer(cl_uSection)
    uSection.btn_Touch = surface.makeButton(p_x + 1.02, p_y + 0.7, 1.02, 0.7).setControlLayer(cl_uSection)
    uSection.btn_Write = surface.makeButton(p_x + 2.04, p_y + 0.7, 1.02, 0.7).setControlLayer(cl_uSection)
    uSection.btn_Read = surface.makeButton(p_x + 3.06, p_y + 0.7, 1.02, 0.7).setControlLayer(cl_uSection)

    return uSection
}

function create_mSection(p_x, p_y) {
    var mSection = {}
    mSection.btn_Prev = surface.makeButton(p_x, p_y + 0.17, 1, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Next = surface.makeButton(p_x + 3.06, p_y + 0.17, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.knob_Panel = surface.makeBlindPanel(p_x + 0.952, p_y - 0.25, 2.158, 1.55)
    mSection.knob_vis = surface.makeKnob(p_x + 1, p_y - 0.08, 1.3, 1.3).setControlLayer(cl_mSection)
    mSection.knob_Press = surface.makeButton(p_x + 2.117, p_y + 0.108, 0.825, 0.825)
        .setShapeCircle().setControlLayer(cl_mSection)
    mSection.btn_Link = surface.makeButton(p_x, p_y + 1.26, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Pan = surface.makeButton(p_x + 1.02, p_y + 1.26, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Channel = surface.makeButton(p_x + 2.04, p_y + 1.26, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Scroll = surface.makeButton(p_x + 3.06, p_y + 1.26, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Master = surface.makeButton(p_x, p_y + 1.96, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Click = surface.makeButton(p_x + 1.02, p_y + 1.96, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Section = surface.makeButton(p_x + 2.04, p_y + 1.96, 1.02, 0.7).setControlLayer(cl_mSection)
    mSection.btn_Marker = surface.makeButton(p_x + 3.06, p_y + 1.96, 1.02, 0.7).setControlLayer(cl_mSection)

    return mSection
}

function create_tpSection(p_x, p_y) {
    var tpSection = {}
    tpSection.btn_Cycle = surface.makeButton(p_x + 0.45, p_y, 1.02, 1.02)
        .setShapeCircle().setControlLayer(cl_tpSection)
    tpSection.btn_RWD = surface.makeButton(p_x + 1.53, p_y, 1.02, 1.02)
        .setShapeCircle().setControlLayer(cl_tpSection)
    tpSection.btn_FWD = surface.makeButton(p_x + 2.61, p_y, 1.02, 1.02)
        .setShapeCircle().setControlLayer(cl_tpSection)
    tpSection.btn_Stop = surface.makeButton(p_x, p_y + 0.95, 1.02, 1.02)
        .setShapeCircle().setControlLayer(cl_tpSection)
    tpSection.btn_Play = surface.makeButton(p_x + 1.41, p_y + 1.05, 1.25, 1.25)
        .setShapeCircle().setControlLayer(cl_tpSection)
    tpSection.btn_Record = surface.makeButton(p_x + 3.06, p_y + 0.95, 1.02, 1.02)
        .setShapeCircle().setControlLayer(cl_tpSection)

    return tpSection
}

function create_fsSection(p_x, p_y) {
    var fsSection = {}
    fsSection.btn_Footswitch = surface.makeButton(p_x, p_y, 1.1, 1.1).setShapeCircle()
        .setControlLayer(cl_fsSection)

    return fsSection
}

var uSection = create_uSection(1.6, 0)
var mSection = create_mSection(1.6, 1.87)
var tpSection = create_tpSection(1.6, 4.92)
var fsSection = create_fsSection(0.11, 6.118)

// Button inputs only: LED output is explicit through the helpers below.
// This avoids treating an incoming press as persistent host/LED state.
function bindButton(button, note) {
    button.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, note)
}
bindButton(uSection.btn_Solo, cSolo)
bindButton(uSection.btn_Mute, cMute)
bindButton(uSection.btn_Arm, cArm)
bindButton(uSection.btn_Shift, cShift)
bindButton(uSection.btn_Bypass, cBypass)
bindButton(uSection.btn_Touch, cTouch)
bindButton(uSection.btn_Write, cWrite)
bindButton(uSection.btn_Read, cRead)
bindButton(mSection.btn_Prev, cPrev)
bindButton(mSection.btn_Next, cNext)
bindButton(mSection.btn_Link, cLink)
bindButton(mSection.btn_Pan, cPan)
bindButton(mSection.btn_Channel, cChannel)
bindButton(mSection.btn_Scroll, cScroll)
bindButton(mSection.btn_Master, cMaster)
bindButton(mSection.btn_Click, cClick)
bindButton(mSection.btn_Section, cSection)
bindButton(mSection.btn_Marker, cMarker)
bindButton(tpSection.btn_Cycle, cCycle)
bindButton(tpSection.btn_RWD, cRWD)
bindButton(tpSection.btn_FWD, cFWD)
bindButton(tpSection.btn_Stop, cStop)
bindButton(tpSection.btn_Play, cPlay)
bindButton(tpSection.btn_Record, cRecord)
bindButton(fsSection.btn_Footswitch, cFootswitch)
bindButton(mSection.knob_Press, cKnobPress)
mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
    .bindToControlChange(0, cKnobRotate).setTypeRelativeSignedBit()

// Printed button functions. SHIFT is a software latch: press once to enable,
// press again to disable. This is our routing policy, not a firmware mode change.
// The two printed "Lock" labels have distinct names so they can be assigned separately.
var buttonMappings = [
    { physicalButton: uSection.btn_Solo, normalName: 'Solo', shiftedName: 'SoloClear' },
    { physicalButton: uSection.btn_Mute, normalName: 'Mute', shiftedName: 'MuteClear' },
    { physicalButton: uSection.btn_Arm, normalName: 'Arm', shiftedName: 'ArmAll' },
    { physicalButton: uSection.btn_Bypass, normalName: 'Bypass', shiftedName: 'BypassAll' },
    { physicalButton: uSection.btn_Touch, normalName: 'Touch', shiftedName: 'Latch' },
    { physicalButton: uSection.btn_Write, normalName: 'Write', shiftedName: 'Trim' },
    { physicalButton: uSection.btn_Read, normalName: 'Read', shiftedName: 'Off' },
    { physicalButton: mSection.btn_Prev, normalName: 'Prev', shiftedName: 'Undo' },
    { physicalButton: mSection.btn_Next, normalName: 'Next', shiftedName: 'Redo' },
    { physicalButton: mSection.btn_Link, normalName: 'Link', shiftedName: 'LinkLock' },
    { physicalButton: mSection.btn_Pan, normalName: 'Pan', shiftedName: 'Flip' },
    { physicalButton: mSection.btn_Channel, normalName: 'Channel', shiftedName: 'ChannelLock' },
    { physicalButton: mSection.btn_Scroll, normalName: 'Scroll', shiftedName: 'Zoom' },
    { physicalButton: mSection.btn_Master, normalName: 'Master', shiftedName: 'F1' },
    { physicalButton: mSection.btn_Click, normalName: 'Click', shiftedName: 'F2' },
    { physicalButton: mSection.btn_Section, normalName: 'Section', shiftedName: 'F3' },
    { physicalButton: mSection.btn_Marker, normalName: 'Marker', shiftedName: 'F4' }
]

// Bind future Cubase actions to these logical values, e.g. buttons.F1 or
// buttons.Flip. Physical surface buttons remain the single MIDI input source.
var buttons = {}
function assignButtonRouting(mapping) {
    var normalName = mapping.normalName
    var shiftedName = mapping.shiftedName
    buttons[normalName] = surface.makeCustomValueVariable(normalName)
    buttons[shiftedName] = surface.makeCustomValueVariable(shiftedName)
    var stateKey = 'held.' + normalName
    mapping.physicalButton.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        var activeName = context.getState(stateKey)
        if (value > 0) {
            if (activeName) { return } // Ignore repeated press messages.
            activeName = context.getState('shiftEnabled') === '1' ? shiftedName : normalName
            context.setState(stateKey, activeName)
            buttons[activeName].setProcessValue(context, 1)
        } else if (activeName) {
            // Release the path that received the press, even if SHIFT changed meanwhile.
            buttons[activeName].setProcessValue(context, 0)
            context.setState(stateKey, '')
        }
    }
}
for (var buttonIndex = 0; buttonIndex < buttonMappings.length; buttonIndex++) {
    assignButtonRouting(buttonMappings[buttonIndex])
}

uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange = function(context, value) {
    if (value <= 0) {
        context.setState('shiftPressed', '')
        return
    }
    if (context.getState('shiftPressed') === '1') { return }
    context.setState('shiftPressed', '1')
    var enabled = context.getState('shiftEnabled') !== '1'
    context.setState('shiftEnabled', enabled ? '1' : '0')
    if (enabled) { onLED(context, cShift) } else { offLED(context, cShift) }
}

function resetButtonRouting(context) {
    context.setState('shiftEnabled', '0')
    context.setState('shiftPressed', '')
    for (var i = 0; i < buttonMappings.length; i++) {
        var mapping = buttonMappings[i]
        var normalButton = buttons[mapping.normalName]
        var shiftedButton = buttons[mapping.shiftedName]

        context.setState('held.' + mapping.normalName, '')
        normalButton.setProcessValue(context, 0)
        shiftedButton.setProcessValue(context, 0)
    }
}

// Transport, encoder push/rotation, fader and footswitch retain their direct
// paths in both layers. The printed RTZ transport chord is not a SHIFT label.

//-----------------------------------------------------------------------------
// HARDWARE HELPERS - one output path for LED and motor protection/caching
//-----------------------------------------------------------------------------

function sendHardwareMidi(context, status, address, value) {
    var cacheKey = 'midi.' + status + '.' + address
    if (ENABLE_MIDI_OUTPUT_CACHE && context.getState(cacheKey) === String(value)) return
    midiOut.sendMidi(context, [status, address, value])
    context.setState(cacheKey, String(value))
}

function offLED(context, note) { sendHardwareMidi(context, 0x90, note, 0) }
function onLED(context, note) { sendHardwareMidi(context, 0x90, note, 127) }
function flashingLED(context, note) { sendHardwareMidi(context, 0x90, note, 1) }
function midi7(value) { return Math.max(0, Math.min(127, Math.round(value))) }
function clampFader(value) { return Math.max(0, Math.min(1, value)) }

// RGB color and on/off/flash state are separate hardware messages.
function setRGBLED(context, note, r, g, b, brightness) {
    brightness = Math.max(0, Math.min(1, brightness))
    sendHardwareMidi(context, 0x91, note, midi7(midi7(r) * brightness))
    sendHardwareMidi(context, 0x92, note, midi7(midi7(g) * brightness))
    sendHardwareMidi(context, 0x93, note, midi7(midi7(b) * brightness))
}

// Two straight segments preserve both endpoints and align the two unity marks.
// Swapping the marks gives the exact inverse for hardware-to-host input.
function scaleFaderUnity(value, sourceUnity, targetUnity) {
    if (!ENABLE_FADER_UNITY_CALIBRATION) return value
    if (sourceUnity <= 0 || sourceUnity >= 1 || targetUnity <= 0 || targetUnity >= 1) return value
    if (value <= sourceUnity) return value * targetUnity / sourceUnity
    return targetUnity + (value - sourceUnity) * (1 - targetUnity) / (1 - sourceUnity)
}

function snapFaderBottom(value) {
    return ENABLE_FADER_LOW_END_SNAP && value < FADER_LOW_END_THRESHOLD ? 0 : value
}

// Raw physical position 0..1. All motor commands, including mapped feedback,
// pass here. Cache the complete 14-bit position, not its individual MIDI bytes.
function setMotorFader(context, position) {
    if (typeof position !== 'number' || !isFinite(position)) return
    position = clampFader(position)
    if (ENABLE_FADER_TOUCH_PROTECTION && faderTouch.getProcessValue(context) > 0) {
        context.setState('pendingMotorPosition', String(position))
        return
    }
    context.setState('pendingMotorPosition', '')
    var value = Math.round(position * 16383)
    if (ENABLE_MIDI_OUTPUT_CACHE && context.getState('lastMotorPosition') === String(value)) return
    midiOut.sendMidi(context, [0xE0, value & 0x7F, (value >> 7) & 0x7F])
    context.setState('lastMotorPosition', String(value))
}

var_faderInput.mOnProcessValueChange = function(context, value) {
    if (ENABLE_FADER_TOUCH_INPUT && faderTouch.getProcessValue(context) <= 0) return
    // Manual motion invalidates the last motor target and any older deferred move.
    context.setState('lastMotorPosition', '')
    context.setState('pendingMotorPosition', '')
    value = snapFaderBottom(clampFader(value))
    value = scaleFaderUnity(value, FADER_HARDWARE_UNITY, FADER_HOST_UNITY)
    context.setState('processingFaderInput', '1')
    fader.mSurfaceValue.setProcessValue(context, value)
    context.setState('processingFaderInput', '')
}

fader.mSurfaceValue.mOnProcessValueChange = function(context, value) {
    if (context.getState('processingFaderInput') === '1') return
    value = scaleFaderUnity(clampFader(value), FADER_HOST_UNITY, FADER_HARDWARE_UNITY)
    setMotorFader(context, snapFaderBottom(value))
}

faderTouch.mOnProcessValueChange = function(context, value) {
    if (value > 0) return
    var pendingPosition = context.getState('pendingMotorPosition')
    if (pendingPosition !== '') setMotorFader(context, Number(pendingPosition))
}

// Future footswitch assignments use this logical value, not the raw button.
var var_footswitchPressed = surface.makeCustomValueVariable('Footswitch Pressed')
fsSection.btn_Footswitch.mSurfaceValue.mOnProcessValueChange = function(context, value) {
    var isOn = value > 0
    if (!ENABLE_FOOTSWITCH_NORMALIZATION) {
        var_footswitchPressed.setProcessValue(context, isOn ? 1 : 0)
        return
    }
    if (FOOTSWITCH_IS_TOGGLE) {
        var previousState = context.getState('footswitchLastState')
        var currentState = isOn ? '1' : '0'
        context.setState('footswitchLastState', currentState)
        // First message establishes the pedal's state; it is not a press.
        if (previousState === '' || previousState === currentState) return
        var_footswitchPressed.setProcessValue(context, 1)
        var_footswitchPressed.setProcessValue(context, 0)
    } else {
        var isPressed = FOOTSWITCH_NORMALLY_CLOSED ? !isOn : isOn
        var_footswitchPressed.setProcessValue(context, isPressed ? 1 : 0)
    }
}

function resetHardwareState(context) {
    context.setState('lastMotorPosition', '')
    context.setState('pendingMotorPosition', '')
    context.setState('processingFaderInput', '')
    context.setState('footswitchLastState', '')
    var_footswitchPressed.setProcessValue(context, 0)
    // Clear cached output so reconnect/reload always refreshes the hardware.
    for (var i = 0; i < ledNotes.length; i++) {
        for (var status = 0x90; status <= 0x93; status++) {
            context.setState('midi.' + status + '.' + ledNotes[i], '')
        }
    }
}

var ledNotes = [cSolo, cMute, cArm, cShift, cBypass, cTouch, cWrite, cRead,
    cPrev, cNext, cLink, cPan, cChannel, cScroll, cMaster, cClick, cSection,
    cMarker, cCycle, cRWD, cFWD, cStop, cPlay, cRecord]
var rgbNotes = [cTouch, cWrite, cRead, cLink, cPan, cChannel, cScroll]
function allLEDsOff(context) {
    for (var i = 0; i < ledNotes.length; i++) { offLED(context, ledNotes[i]) }
}
deviceDriver.mOnActivate = function(context) {
    resetHardwareState(context)
    resetButtonRouting(context)
    resetTransport(context)
    allLEDsOff(context)
    // Predictable neutral color until our mappings choose their own colors.
    for (var i = 0; i < rgbNotes.length; i++) {
        setRGBLED(context, rgbNotes[i], 127, 127, 127, FULL_BRIGHTNESS)
    }
}
deviceDriver.mOnDeactivate = function(context) {
    resetHardwareState(context)
    resetTransport(context)
    var_rewPressed.setProcessValue(context, 0)
    var_stopPressed.setProcessValue(context, 0)
    resetButtonRouting(context)
    allLEDsOff(context)
}

//-----------------------------------------------------------------------------
// TRANSPORT - Korg-style assignments, STOP chords and hold-to-save
//-----------------------------------------------------------------------------

var transport = {
	btnCycle: tpSection.btn_Cycle,
	btnRewind: tpSection.btn_RWD,
	btnFastForward: tpSection.btn_FWD,
	btnStop: tpSection.btn_Stop,
	btnPlay: tpSection.btn_Play,
	btnRecord: tpSection.btn_Record
}
var hostTransport = page.mHostAccess.mTransport.mValue
var var_stopPressed = surface.makeCustomValueVariable('Stop Pressed')
var var_rewPressed = surface.makeCustomValueVariable('REW Pressed')
var var_RTZPressed = surface.makeCustomValueVariable('RTZ Pressed')
var var_savePressed = surface.makeCustomValueVariable('Save Pressed')
var transportFeedback = []
var confirmTransportNotes = [cRWD, cFWD, cPlay, cRecord]

function resetStopProgress(context) {
	context.setState('stopHoldStartMs', '')
}

function resetTransport(context) {
	resetStopProgress(context)
	context.setState('stopPressed', '')
	context.setState('rewPressed', '')
	context.setState('saveBlinkCount', '')
	context.setState('saveBlinkLastMs', '')
}

function assignTransportControls() {
	page.makeValueBinding(transport.btnPlay.mSurfaceValue, hostTransport.mStart).setTypeToggle()
	page.makeValueBinding(transport.btnRecord.mSurfaceValue, hostTransport.mRecord).setTypeToggle()
	page.makeValueBinding(transport.btnCycle.mSurfaceValue, hostTransport.mCycleActive).setTypeToggle()
	page.makeValueBinding(transport.btnFastForward.mSurfaceValue, hostTransport.mForward)
	page.makeValueBinding(var_rewPressed, hostTransport.mRewind)
	page.makeCommandBinding(var_stopPressed, 'Transport', 'Stop')
	page.makeCommandBinding(var_RTZPressed, 'Transport', 'Return to Zero')
	page.makeCommandBinding(var_savePressed, 'File', 'Save')

	// STOP acts immediately. Holding it can also save, once per press.
	transport.btnStop.mSurfaceValue.mOnProcessValueChange = function(context, newValue) {
		if (newValue > 0) {
			if (context.getState('stopPressed') === '1') return
			context.setState('stopPressed', '1')
			var_stopPressed.setProcessValue(context, 1)
			if (ENABLE_STOP_HOLD_SAVE && context.getState('rewPressed') !== '1') {
				context.setState('stopHoldStartMs', String(Date.now()))
			}
		} else {
			context.setState('stopPressed', '')
			var_stopPressed.setProcessValue(context, 0)
			resetStopProgress(context)
		}
	}

	// STOP first, then REW = RTZ. Pulse the command so every chord can retrigger.
	transport.btnRewind.mSurfaceValue.mOnProcessValueChange = function(context, newValue) {
		if (newValue > 0) {
			if (context.getState('rewPressed') === '1') return
			context.setState('rewPressed', '1')
			if (context.getState('stopPressed') === '1') {
				resetStopProgress(context)
				var_RTZPressed.setProcessValue(context, 1)
				var_RTZPressed.setProcessValue(context, 0)
			} else {
				var_rewPressed.setProcessValue(context, 1)
			}
		} else {
			context.setState('rewPressed', '')
			var_rewPressed.setProcessValue(context, 0)
		}
	}
}

// Printed functions use the logical button paths, so SHIFT routing stays in one place.
function assignUtilityControls() {
	page.makeCommandBinding(buttons.Undo, 'Edit', 'Undo')
	page.makeCommandBinding(buttons.Redo, 'Edit', 'Redo')
	page.makeValueBinding(buttons.Click, hostTransport.mMetronomeActive).setTypeToggle()
}

function assignSelectedTrackControls() {
	var hostTrackSelection = page.mHostAccess.mTrackSelection
	var hostSelectedTrack = hostTrackSelection.mMixerChannel

	page.makeActionBinding(buttons.Prev, hostTrackSelection.mAction.mPrevTrack)
	page.makeActionBinding(buttons.Next, hostTrackSelection.mAction.mNextTrack)
	page.makeValueBinding(fader.mSurfaceValue, hostSelectedTrack.mValue.mVolume)
}

//-----------------------------------------------------------------------------
// FEEDBACK EVENTS - host state drives LEDs, separately from physical presses
//-----------------------------------------------------------------------------

function setTransportLed(context, note, isOn) {
	if (isOn) { onLED(context, note) } else { offLED(context, note) }
}

function sendTransportFeedback(hostValue, note, name) {
	var ledValue = surface.makeCustomValueVariable(name + ' LED Feedback')
	page.makeValueBinding(ledValue, hostValue)
	transportFeedback.push({ note: note, value: ledValue })
	ledValue.mOnProcessValueChange = function(context, newValue) {
		// Save animation owns only REW, FF, PLAY and REC; STOP/CYCLE remain live.
		if (context.getState('saveBlinkCount') !== '' && confirmTransportNotes.indexOf(note) >= 0) return
		setTransportLed(context, note, newValue > 0)
	}
}

function setupTransportFeedback() {
	sendTransportFeedback(hostTransport.mRewind, cRWD, 'Rewind')
	sendTransportFeedback(hostTransport.mForward, cFWD, 'Fast Forward')
	sendTransportFeedback(hostTransport.mStop, cStop, 'Stop')
	sendTransportFeedback(hostTransport.mStart, cPlay, 'Play')
	sendTransportFeedback(hostTransport.mRecord, cRecord, 'Record')
	sendTransportFeedback(hostTransport.mCycleActive, cCycle, 'Cycle')
	// CLICK shows metronome state in either SHIFT layer; F2 remains unassigned.
	sendTransportFeedback(hostTransport.mMetronomeActive, cClick, 'Metronome')
}

function setConfirmTransportLEDs(context, isOn) {
	for (var i = 0; i < confirmTransportNotes.length; i++) {
		setTransportLed(context, confirmTransportNotes[i], isOn)
	}
}

function restoreTransportLEDs(context) {
	for (var i = 0; i < transportFeedback.length; i++) {
		var feedback = transportFeedback[i]
		setTransportLed(context, feedback.note, feedback.value.getProcessValue(context) > 0)
	}
}

function blinkConfirmTransportLEDs(context) {
	context.setState('saveBlinkCount', '0')
	context.setState('saveBlinkLastMs', '')
}

deviceDriver.mOnIdle = function(context) {
	var now = Date.now()
	var holdStart = context.getState('stopHoldStartMs')
	if (ENABLE_STOP_HOLD_SAVE && holdStart !== '' && now - Number(holdStart) >= STOP_SAVE_HOLD_MS) {
		resetStopProgress(context)
		var_savePressed.setProcessValue(context, 1)
		var_savePressed.setProcessValue(context, 0)
		blinkConfirmTransportLEDs(context)
	}

	var blinkCount = context.getState('saveBlinkCount')
	if (blinkCount === '') return
	var lastBlink = context.getState('saveBlinkLastMs')
	if (lastBlink !== '' && now - Number(lastBlink) < SAVE_BLINK_INTERVAL_MS) return

	var count = Number(blinkCount)
	setConfirmTransportLEDs(context, count % 2 === 0)
	count++
	context.setState('saveBlinkLastMs', String(now))
	context.setState('saveBlinkCount', String(count))
	if (count >= SAVE_BLINK_TOGGLES) {
		context.setState('saveBlinkCount', '')
		restoreTransportLEDs(context)
	}
}

//-----------------------------------------------------------------------------
// KNOB MODES - one assignment at a time, selected by the printed buttons
//-----------------------------------------------------------------------------

var knob = mSection.knob_vis.mSurfaceValue
var knobModeArea = page.makeSubPageArea('Knob Mode')
var knobModes = {
    Pan: knobModeArea.makeSubPage('Pan'),
    Zoom: knobModeArea.makeSubPage('Zoom'),
    Master: knobModeArea.makeSubPage('Master'),
    Click: knobModeArea.makeSubPage('Click'),
    HighPass: knobModeArea.makeSubPage('High Pass')
}
var knobModeButtons = [
    { button: buttons.Pan, mode: knobModes.Pan },
    { button: buttons.Scroll, mode: knobModes.Zoom },
    { button: buttons.Zoom, mode: knobModes.Zoom },
    { button: buttons.Master, mode: knobModes.Master },
    { button: buttons.Click, mode: knobModes.Click },
    { button: buttons.Channel, mode: knobModes.HighPass }
]
var var_zoomIn = surface.makeCustomValueVariable('Zoom In')
var var_zoomOut = surface.makeCustomValueVariable('Zoom Out')

// Same output-bank approach as the Korg: the FIRST output channel is Stereo Out.
// Projects with multiple output buses must place the intended master first.
var hostStereoOutZone = page.mHostAccess.mMixConsole.makeMixerBankZone().includeOutputChannels()
var hostStereoOut = hostStereoOutZone.makeMixerBankChannel()

function updateKnobModeLEDs(context) {
    var mode = context.getState('knobMode')
    setTransportLed(context, cPan, mode === 'Pan')
    setTransportLed(context, cScroll, mode === 'Zoom')
    setTransportLed(context, cMaster, mode === 'Master')
    updateHighPassLED(context)
    // CLICK continues to indicate metronome on/off. Cubase displays the Click subpage.
}

function activateKnobMode(context, mode) {
    context.setState('knobMode', mode)
    // Seed zoom from the current knob value so switching modes doesn't zoom.
    context.setState('lastZoomValue', String(Math.floor((knob.getProcessValue(context) || 0) * 1000)))
    updateKnobModeLEDs(context)
}

// More color landmarks below 300 Hz, where we normally use the high-pass.
// Enabled colors never pass through green; green means selected but disabled.
var highPassColors = [
    { hz: 20,   red: 127, green: 0,  blue: 0 },   // red
    { hz: 80,   red: 127, green: 40, blue: 0 },   // orange
    { hz: 150,  red: 127, green: 0,  blue: 45 },  // pink
    { hz: 300,  red: 127, green: 0,  blue: 127 }, // magenta
    { hz: 1000, red: 48,  green: 0,  blue: 127 } // violet; clamp above this
]

function getHighPassColor(hz) {
    if (!ENABLE_HIGH_PASS_COLOR_GRADIENT || !isFinite(hz) || hz <= highPassColors[0].hz) {
        return highPassColors[0]
    }
    for (var i = 1; i < highPassColors.length; i++) {
        var upper = highPassColors[i]
        var lower = highPassColors[i - 1]
        if (hz <= upper.hz) {
            // Log frequency spacing gives more detail at the low end.
            var blend = Math.log(hz / lower.hz) / Math.log(upper.hz / lower.hz)
            return {
                red: lower.red + blend * (upper.red - lower.red),
                green: lower.green + blend * (upper.green - lower.green),
                blue: lower.blue + blend * (upper.blue - lower.blue)
            }
        }
    }
    return highPassColors[highPassColors.length - 1]
}

function parseFrequencyHz(value, units) {
    var text = String(value).replace(/\s/g, '').replace(',', '.')
    var match = text.match(/^([0-9]+(?:\.[0-9]+)?)(k?hz)?$/i)
    if (!match) return NaN
    var unit = String(units || match[2] || 'Hz').replace(/\s/g, '').toLowerCase()
    if (unit !== 'hz' && unit !== 'khz') return NaN
    return Number(match[1]) * (unit === 'khz' ? 1000 : 1)
}

function updateHighPassLED(context) {
    if (context.getState('knobMode') !== 'HighPass') {
        offLED(context, cChannel)
        return
    }
    if (context.getState('highPassEnabled') !== '1') {
        setRGBLED(context, cChannel, 0, 127, 0, FULL_BRIGHTNESS)
    } else {
        var color = getHighPassColor(Number(context.getState('highPassHz')))
        setRGBLED(context, cChannel, color.red, color.green, color.blue, FULL_BRIGHTNESS)
    }
    onLED(context, cChannel)
}

function setupHighPassFeedback() {
    var preFilter = page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter
    var enabled = surface.makeCustomValueVariable('High Pass Enabled Feedback')
    var frequency = surface.makeCustomValueVariable('High Pass Frequency Feedback')
    // Always follow the selected track, including when another knob mode is active.
    page.makeValueBinding(enabled, preFilter.mLowCutOn)
    page.makeValueBinding(frequency, preFilter.mLowCutFreq)
    enabled.mOnProcessValueChange = function(context, value) {
        context.setState('highPassEnabled', value > 0 ? '1' : '0')
        updateHighPassLED(context)
    }
    // Read Cubase's displayed Hz rather than guessing its normalized frequency curve.
    frequency.mOnDisplayValueChange = function(context, value, units) {
        var hz = parseFrequencyHz(value, units)
        context.setState('highPassHz', isFinite(hz) ? String(hz) : '')
        updateHighPassLED(context)
    }
}

function assignKnobControls() {
    for (var i = 0; i < knobModeButtons.length; i++) {
        var mapping = knobModeButtons[i]
        page.makeActionBinding(mapping.button, mapping.mode.mAction.mActivate)
    }
    page.makeValueBinding(knob, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan)
        .setSubPage(knobModes.Pan)
    page.makeValueBinding(knob, hostStereoOut.mValue.mVolume)
        .setSubPage(knobModes.Master)
    page.makeValueBinding(knob, hostTransport.mMetronomeClickLevel)
        .setSubPage(knobModes.Click)
    // Cubase calls its high-pass filter "Low Cut" in the Pre section.
    var hostPreFilter = page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter
    page.makeValueBinding(knob, hostPreFilter.mLowCutFreq)
        .setSubPage(knobModes.HighPass)
    page.makeValueBinding(mSection.knob_Press.mSurfaceValue, hostPreFilter.mLowCutOn)
        .setTypeToggle().setSubPage(knobModes.HighPass)
    page.makeCommandBinding(var_zoomIn, 'Zoom', 'Zoom In').setSubPage(knobModes.Zoom)
    page.makeCommandBinding(var_zoomOut, 'Zoom', 'Zoom Out').setSubPage(knobModes.Zoom)

    knobModes.Pan.mOnActivate = function(context) { activateKnobMode(context, 'Pan') }
    knobModes.Zoom.mOnActivate = function(context) { activateKnobMode(context, 'Zoom') }
    knobModes.Master.mOnActivate = function(context) { activateKnobMode(context, 'Master') }
    knobModes.Click.mOnActivate = function(context) { activateKnobMode(context, 'Click') }
    knobModes.HighPass.mOnActivate = function(context) { activateKnobMode(context, 'HighPass') }

    // Korg zoom pattern: compare successive knob positions and fire zoom commands.
    // Pulse each command so consecutive detents in the same direction retrigger.
    knob.mOnProcessValueChange = function(context, newValue, diff) {
        if (context.getState('knobMode') !== 'Zoom') return
        var newZoomValue = Math.floor(newValue * 1000)
        var lastZoomValue = Number(context.getState('lastZoomValue'))
        var zoomCommand
        if (newZoomValue < lastZoomValue || (newZoomValue <= 0 && diff < 0)) {
            zoomCommand = var_zoomOut
        } else if (newZoomValue > lastZoomValue || (newZoomValue >= 1000 && diff > 0)) {
            zoomCommand = var_zoomIn
        }
        context.setState('lastZoomValue', String(newZoomValue))
        if (zoomCommand) {
            zoomCommand.setProcessValue(context, 1)
            zoomCommand.setProcessValue(context, 0)
        }
    }
}

page.mOnActivate = function(context, activeMapping) {
    knobModes.Pan.mAction.mActivate.trigger(activeMapping)
    activateKnobMode(context, 'Pan')
    restoreTransportLEDs(context)
}

assignTransportControls()
assignUtilityControls()
assignSelectedTrackControls()
assignKnobControls()
setupTransportFeedback()
setupHighPassFeedback()

// Future mappings go here. Examples (inactive):
// buttons.F1.mOnProcessValueChange = function(context, value) {
//     if (value > 0) { /* Future F1 action. */ }
// }
// buttons.Solo.mOnProcessValueChange = function(context, value) {
//     if (value > 0) { onLED(context, cSolo) } else { offLED(context, cSolo) }
// }

// legal notes
//
// FaderPort is a registrated trademark of PreSonus(R) Audio Electronics, Inc.
// Cubase is a registrated trademark of Steinberg(R) Media Technologies GmbH
//
// THE SOFTWARE (THIS SCRIPT) IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
// OR OTHER DEALINGS IN THE SOFTWARE.
//
//--------------------------------------------------------------------------------------------
