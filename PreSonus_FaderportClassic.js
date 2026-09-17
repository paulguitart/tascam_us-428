//-----------------------------------------------------------------------------
// PreSonus FaderPort Classic (Original / v1)
// Cubase MIDI Remote API boilerplate
//
// Hardware protocol confirmed on physical FaderPort Classic:
//
// Native mode:
//     91 00 64
//
// Buttons / switches:
//     A0 <switchID> 01 = pressed
//     A0 <switchID> 00 = released
//
// Physical capacitive fader touch:
//     A0 7F 01 = touched
//     A0 7F 00 = released
//
// Fader -> host:
//     B0 00 <coarse 7 bits>
//     B0 20 <fine 3 bits shifted into bits 4..6>
//     Physical resolution = 0..1023
//
// Host -> motor:
//     B0 00 <upper 3 bits>
//     B0 20 <lower 7 bits>
//
// Pan encoder:
//     E0 00 01 = clockwise
//     E0 00 7E = counter-clockwise
//
// NOTE:
// Steinberg's bindToNote() accepts Note On, Note Off AND Poly Pressure,
// so it can consume the FaderPort's A0 button/touch packets directly.
//-----------------------------------------------------------------------------

var midiremote_api = require('midiremote_api_v1')

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP
//-----------------------------------------------------------------------------

var deviceDriver = midiremote_api.makeDeviceDriver(
    'PreSonus',
    'FaderPort Classic',
    'Paul Warner'
)

var midiInput = deviceDriver.mPorts.makeMidiInput('FaderPort MIDI In')
var midiOutput = deviceDriver.mPorts.makeMidiOutput('FaderPort MIDI Out')

// Name-based detection is enough for the Classic.
// We do NOT require a SysEx identity response.
deviceDriver.makeDetectionUnit()
    .detectPortPair(midiInput, midiOutput)
    .expectInputNameContains('FaderPort')
    .expectOutputNameContains('FaderPort')

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// 2. FADERPORT CLASSIC PROTOCOL CONSTANTS
//-----------------------------------------------------------------------------

var FP_NATIVE_MODE = [0x91, 0x00, 0x64]

var FP = {
    // Top-left utility row
    USER:       0x00,   // hardware label USER; protocol name OUT
    PUNCH:      0x01,   // hardware label PUNCH; protocol name IN
    SHIFT:      0x02,

    // Transport
    REW:        0x03,
    FFWD:       0x04,
    STOP:       0x05,
    PLAY:       0x06,
    RECORD:     0x07,   // large transport Record button

    // Automation section
    TOUCH_MODE: 0x08,   // front-panel automation mode button
    WRITE:      0x09,
    READ:       0x0A,

    // View / utility buttons
    MIX:        0x0B,
    PROJECT:    0x0C,   // protocol name EDIT
    TRANSPORT:  0x0D,
    UNDO:       0x0E,
    LOOP:       0x0F,

    // Selected track
    TRACK_REC:  0x10,
    SOLO:       0x11,
    MUTE:       0x12,

    // Track navigation / bank
    PREV_TRACK: 0x13,   // hardware BACK; protocol LEFT
    BANK:       0x14,
    NEXT_TRACK: 0x15,   // hardware FORWARD; protocol RIGHT
    OUTPUT:     0x16,
    OFF:        0x17,

    // Physical capacitive fader touch
    FADER_TOUCH: 0x7F
}

// Fader CC pair.
var FP_FADER_MSB_CC = 0x00
var FP_FADER_LSB_CC = 0x20

// The Classic sends 10-bit positions embedded in a standard 14-bit CC pair.
// Raw 14-bit maximum produced by physical position 1023 is:
//     1023 * 16 = 16368
var FP_FADER_INPUT_RAW_MAX = 16368
var FP_FADER_POSITION_MAX = 1023

//-----------------------------------------------------------------------------
// 3. MIDI OUTPUT HELPERS
//-----------------------------------------------------------------------------

function sendNativeMode(activeDevice) {
    midiOutput.sendMidi(activeDevice, FP_NATIVE_MODE)
}

// Hardware-tested: LED addresses reverse the input IDs within each group of 8.
// E.g. SHIFT input 02 -> LED 05; MIX input 0B -> LED 0C.
function sendButtonLed(activeDevice, switchId, enabled) {
    midiOutput.sendMidi(activeDevice, [0xA0, switchId ^ 0x07, enabled ? 1 : 0])
}

function clearButtonLeds(activeDevice) {
    for (var switchId = 0; switchId < 0x18; ++switchId) {
        sendButtonLed(activeDevice, switchId, false)
    }
}

// This is the motor-output format we verified experimentally with full sweeps.
function sendFaderMotor(activeDevice, normalizedValue) {
    var value = normalizedValue

    if (value < 0) value = 0
    if (value > 1) value = 1

    var position = Math.round(value * FP_FADER_POSITION_MAX)

    var upper3 = (position >> 7) & 0x07
    var lower7 = position & 0x7F

    midiOutput.sendMidi(activeDevice, [0xB0, FP_FADER_MSB_CC, upper3])
    midiOutput.sendMidi(activeDevice, [0xB0, FP_FADER_LSB_CC, lower7])
}

// Enter Native Mode whenever Cubase activates the device.
deviceDriver.mOnActivate = function(activeDevice) {
    sendNativeMode(activeDevice)
    clearButtonLeds(activeDevice)
}

deviceDriver.mOnDeactivate = function(activeDevice) {
    clearButtonLeds(activeDevice)
}

//-----------------------------------------------------------------------------
// 4. SURFACE HELPERS
//-----------------------------------------------------------------------------

// IMPORTANT:
// bindToNote(channel, pitch) also consumes Poly Pressure A0 messages.
// FaderPort buttons are A0 <switchID> <0/1>, so this maps them directly.
function makeFpButton(switchId, x, y, w, h) {
    var button = surface.makeButton(x, y, w, h).setTypePush()

    button.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote(0, switchId)
        .setValueRange(0, 1)

    return button
}

//-----------------------------------------------------------------------------
// 5. SURFACE LAYOUT + MIDI BINDINGS
//-----------------------------------------------------------------------------

// Main motor fader
var mainFader = surface.makeFader(0, 0, 2, 8).setTypeVertical()

mainFader.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange14Bit(0, FP_FADER_MSB_CC)
    .setValueRange(0, FP_FADER_INPUT_RAW_MAX)
    .setTypeAbsolute()

// Physical capacitive fader touch.
// Cubase MIDI Remote API v1.1+ can bind this to the fader's real touch state.
var faderTouchValue = surface.makeCustomValueVariable('Physical Fader Touch')

faderTouchValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, FP.FADER_TOUCH)
    .setValueRange(0, 1)

if (mainFader.mSurfaceValue.mTouchState) {
    mainFader.mSurfaceValue.mTouchState.bindTo(faderTouchValue)
}

// Track whether a finger is physically on the fader.
// We also use this to suppress our CUSTOM motor feedback while touched.
var faderIsTouched = false
var lastHostVolume = 0

faderTouchValue.mOnProcessValueChange = function(activeDevice, value, diff) {
    faderIsTouched = value > 0

    // On release, catch the motor up to the latest host value.
    if (!faderIsTouched) {
        sendFaderMotor(activeDevice, lastHostVolume)
    }
}

// Pan knob.
//
// Classic sends relative movement disguised as Pitch Bend:
//     E0 00 01 = clockwise
//     E0 00 7E = counter-clockwise
//
// Decode that once here, then expose panKnob.mSurfaceValue
// as a normal Cubase 0..1 control value.
var panKnob = surface.makeKnob(2.5, 0, 2, 2)
var panKnobRaw = surface.makeCustomValueVariable('FaderPort Knob RAW')

panKnobRaw.mMidiBinding
    .setInputPort(midiInput)
    .bindToPitchBend(0)

var FP_KNOB_STEP = 1 / 200

panKnobRaw.mOnProcessValueChange = function(activeDevice, value) {
    var cleanValue = panKnob.mSurfaceValue.getProcessValue(activeDevice)

    if (value < 0.25) {
        cleanValue += FP_KNOB_STEP
    } else if (value > 0.75) {
        cleanValue -= FP_KNOB_STEP
    } else {
        return
    }

    if (cleanValue < 0) cleanValue = 0
    if (cleanValue > 1) cleanValue = 1

    panKnob.mSurfaceValue.setProcessValue(activeDevice, cleanValue)
}

// Utility / mode row
var btnUser      = makeFpButton(FP.USER,       5.0, 0.0, 1, 1)
var btnPunch     = makeFpButton(FP.PUNCH,      6.0, 0.0, 1, 1)
var btnShift     = makeFpButton(FP.SHIFT,      7.0, 0.0, 1, 1)
var btnLoop      = makeFpButton(FP.LOOP,       8.0, 0.0, 1, 1)

// View / utility
var btnMix       = makeFpButton(FP.MIX,        5.0, 1.2, 1, 1)
var btnProject   = makeFpButton(FP.PROJECT,    6.0, 1.2, 1, 1)
var btnTransport = makeFpButton(FP.TRANSPORT,  7.0, 1.2, 1, 1)
var btnUndo      = makeFpButton(FP.UNDO,       8.0, 1.2, 1, 1)

// Automation
var btnRead      = makeFpButton(FP.READ,       5.0, 2.4, 1, 1)
var btnWrite     = makeFpButton(FP.WRITE,      6.0, 2.4, 1, 1)
var btnTouchMode = makeFpButton(FP.TOUCH_MODE, 7.0, 2.4, 1, 1)
var btnOff       = makeFpButton(FP.OFF,        8.0, 2.4, 1, 1)

// Track navigation
var btnPrevTrack = makeFpButton(FP.PREV_TRACK, 5.0, 3.6, 1, 1)
var btnBank      = makeFpButton(FP.BANK,       6.0, 3.6, 1, 1)
var btnNextTrack = makeFpButton(FP.NEXT_TRACK, 7.0, 3.6, 1, 1)
var btnOutput    = makeFpButton(FP.OUTPUT,     8.0, 3.6, 1, 1)

// Selected-track buttons
var btnMute      = makeFpButton(FP.MUTE,       5.0, 4.8, 1, 1)
var btnSolo      = makeFpButton(FP.SOLO,       6.0, 4.8, 1, 1)
var btnTrackRec  = makeFpButton(FP.TRACK_REC,  7.0, 4.8, 1, 1)

// Transport
var btnRew       = makeFpButton(FP.REW,        4.0, 6.4, 1, 1)
var btnFfwd      = makeFpButton(FP.FFWD,       5.2, 6.4, 1, 1)
var btnStop      = makeFpButton(FP.STOP,       6.4, 6.4, 1, 1)
var btnPlay      = makeFpButton(FP.PLAY,       7.6, 6.4, 1, 1)
var btnRecord    = makeFpButton(FP.RECORD,     8.8, 6.4, 1, 1)

//-----------------------------------------------------------------------------
// 6. HOST MAPPING
//-----------------------------------------------------------------------------

var page = deviceDriver.mMapping.makePage('Main')

var transportValues = page.mHostAccess.mTransport.mValue
var trackSelection = page.mHostAccess.mTrackSelection
var selectedChannel = trackSelection.mMixerChannel
var selectedValues = selectedChannel.mValue

// Stateful LEDs follow Cubase, including changes made with the mouse and track
// selection. Button releases must not extinguish an active host state.
function followHostLed(switchId, hostValue) {
    hostValue.mOnProcessValueChange = function(activeDevice, activeMapping, value) {
        sendButtonLed(activeDevice, switchId, value > 0)
    }
}

followHostLed(FP.REW, transportValues.mRewind)
followHostLed(FP.FFWD, transportValues.mForward)
followHostLed(FP.STOP, transportValues.mStop)
followHostLed(FP.PLAY, transportValues.mStart)
followHostLed(FP.RECORD, transportValues.mRecord)
followHostLed(FP.LOOP, transportValues.mCycleActive)
followHostLed(FP.MUTE, selectedValues.mMute)
followHostLed(FP.SOLO, selectedValues.mSolo)
followHostLed(FP.TRACK_REC, selectedValues.mRecordEnable)
followHostLed(FP.READ, selectedValues.mAutomationRead)
followHostLed(FP.WRITE, selectedValues.mAutomationWrite)

// SHIFT has no host mapping yet; show its physical held state.
btnShift.mSurfaceValue.mOnProcessValueChange = function(activeDevice, value) {
    sendButtonLed(activeDevice, FP.SHIFT, value > 0)
}

// ----- Selected-track volume / motor fader ----------------------------------

page.makeValueBinding(
    mainFader.mSurfaceValue,
    selectedValues.mVolume
).setValueTakeOverModeJump()

// Manual motor feedback is necessary because the Classic's host->motor packet
// format is NOT the same as its fader->host 14-bit CC encoding.
selectedValues.mVolume.mOnProcessValueChange = function(
    activeDevice,
    activeMapping,
    value
) {
    lastHostVolume = value

    // Do not fight the user's finger.
    if (!faderIsTouched) {
        sendFaderMotor(activeDevice, value)
    }
}

// ----- Physical touch -------------------------------------------------------
//
// mainFader.mSurfaceValue.mTouchState.bindTo(faderTouchValue)
// above gives Cubase actual touch-sensitive automation behavior.

// ----- Pan knob -------------------------------------------------------------

page.makeValueBinding(
    panKnob.mSurfaceValue,
    selectedValues.mPan
)

// ----- Transport ------------------------------------------------------------

page.makeValueBinding(
    btnRew.mSurfaceValue,
    transportValues.mRewind
)

page.makeValueBinding(
    btnFfwd.mSurfaceValue,
    transportValues.mForward
)

page.makeValueBinding(
    btnStop.mSurfaceValue,
    transportValues.mStop
)

page.makeValueBinding(
    btnPlay.mSurfaceValue,
    transportValues.mStart
)

page.makeValueBinding(
    btnRecord.mSurfaceValue,
    transportValues.mRecord
)

page.makeValueBinding(
    btnLoop.mSurfaceValue,
    transportValues.mCycleActive
).setTypeToggle()

// ----- Track selection ------------------------------------------------------

page.makeActionBinding(
    btnPrevTrack.mSurfaceValue,
    trackSelection.mAction.mPrevTrack
).filterByValue(1)

page.makeActionBinding(
    btnNextTrack.mSurfaceValue,
    trackSelection.mAction.mNextTrack
).filterByValue(1)

// ----- Selected-track channel states ----------------------------------------

page.makeValueBinding(
    btnMute.mSurfaceValue,
    selectedValues.mMute
).setTypeToggle()

page.makeValueBinding(
    btnSolo.mSurfaceValue,
    selectedValues.mSolo
).setTypeToggle()

page.makeValueBinding(
    btnTrackRec.mSurfaceValue,
    selectedValues.mRecordEnable
).setTypeToggle()

page.makeValueBinding(
    btnRead.mSurfaceValue,
    selectedValues.mAutomationRead
).setTypeToggle()

page.makeValueBinding(
    btnWrite.mSurfaceValue,
    selectedValues.mAutomationWrite
).setTypeToggle()

// ----- Commands we can safely map now --------------------------------------

page.makeCommandBinding(
    btnUndo.mSurfaceValue,
    'Edit',
    'Undo'
).filterByValue(1)

//-----------------------------------------------------------------------------
// 7. UNASSIGNED / NEXT-PASS CONTROLS
//-----------------------------------------------------------------------------
//
// These are ALREADY fully recognized by the surface and ready to map:
//
//     btnShift
//     btnUser          // A0 00
//     btnPunch         // A0 01
//     btnMix           // A0 0B
//     btnProject       // A0 0C
//     btnTransport     // A0 0D
//     btnTouchMode     // A0 08
//     btnOff           // A0 17
//     btnBank          // A0 14
//     btnOutput        // A0 16
//
// USER / PUNCH are good candidates for previous/next marker, but leave the
// Cubase command names uncommitted until verified in the actual Command list.
//
// SHIFT is also intentionally left as a real button surface value so we can
// build modifier/subpage behavior cleanly in the next pass.
//
//-----------------------------------------------------------------------------
// END
//-----------------------------------------------------------------------------
