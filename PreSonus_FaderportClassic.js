// PreSonus FaderPort Classic (Original / v1)
// Cubase MIDI Remote
//
// By Paul Warner
//
// NOTE: BANK and PROJ lock the control under the mouse to the fader or knob.
// TRNS restores the value saved when entering either mode.. an escape hatch.
// TOUCH keeps its fixed unity reset, even when BANK controls a mouse parameter.
//

/*
====================================================================================================
PRESONUS FADERPORT CLASSIC | COMMAND SUMMARY
====================================================================================================

TRANSPORT / NAVIGATION:
----------------------------------------------------------------------------------------------------
STOP (Tap)             : Stop Transport
STOP (Hold 1.5s)       : Save (LED progress after 0.5s, then 5 confirmation blinks)
STOP + REW             : Return To Zero (RTZ); cancels hold-to-save
REW / FF               : Rewind / Fast Forward while held
PLAY                   : Toggle Playback
RECORD                 : Transport Record (large bottom-row button)
LOOP                   : Cycle (Loop) On/Off
PUNCH / USER           : Locate Previous / Next Marker
CHANNEL LEFT / RIGHT   : Select Previous / Next Track
UNDO                   : Undo

----------------------------------------------------------------------------------------------------
FADER / SELECTED TRACK:
----------------------------------------------------------------------------------------------------
FADER                  : Selected Track Volume; OUTPUT = Stereo Out; BANK = locked mouse parameter
OUTPUT                 : Switch Track / Stereo Out; exits BANK and enables the fader
                       : Selects knob Zoom mode; TRNS = Zoom to Locators (also while OFF)
					   : OUTPUT after OFF resumes Stereo Out if it was already selected
OFF                    : Disable / Enable fader input, touch automation and motor
					   : Exits BANK to track volume, still disabled; keeps OUTPUT selected
TOUCH                  : Reset current fader target to unity (0 dB for the configured volume range)
					   : Overrides OFF; BANK uses the same fixed value for the locked parameter
READ / WRITE           : Toggle selected-track Automation Read / Write
MUTE / SOLO / REC      : Toggle selected-track Mute / Solo / Record Enable (top-row Rec)

----------------------------------------------------------------------------------------------------
KNOB / MOUSE PARAMETER MODES:
----------------------------------------------------------------------------------------------------
PAN KNOB               : Selected Track Pan; MIX = Send 1 Level; PROJ = locked mouse parameter
                       : [OUTPUT Zoom] Turn left/right for Zoom Out/In, without a travel limit
MIX                    : Toggle Pan / Send 1; exits PROJ; leaves the fader target alone
                       : With OUTPUT selected, toggle Zoom / Send 1 instead
PROJ                   : Lock mouse parameter to knob; press again to restore prior Pan / Send mode
                       : With OUTPUT selected, exiting PROJ always returns to Zoom
BANK                   : Lock mouse parameter to fader; press again for normal track volume
					   : BANK and PROJ are mutually exclusive; either mode saves its entry value
TRNS                   : [Pan] Center | [MIX] Send 1 Unity | [PROJ / BANK] Restore saved entry value
                       : [OUTPUT Zoom] Zoom to Locators
OUTPUT ZOOM            : MIX / PROJ can select another knob mode while the fader stays on output
                       : Leaving OUTPUT while zooming restores the previous Pan / Send mode

----------------------------------------------------------------------------------------------------
SHIFT COMMANDS (Hold SHIFT, then press the other button):
----------------------------------------------------------------------------------------------------
SHIFT + UNDO           : Redo
SHIFT + PUNCH / USER   : Recall Previous / Next Cycle Marker (wraps 1..9)
SHIFT + LEFT / RIGHT   : Zoom Out / In (one step per press)
SHIFT + TRNS           : Zoom to Locators (all modes)
SHIFT + LOOP           : Insert Marker
SHIFT + SOLO           : Deactivate All Solo
SHIFT + MUTE           : Unmute All
SHIFT                  : Held modifier only; no standalone command

----------------------------------------------------------------------------------------------------
LED FEEDBACK / FADER PROTECTION:
----------------------------------------------------------------------------------------------------
BANK / PROJ / MIX      : Current mouse-fader / mouse-knob / Send 1 mode
OUTPUT + OFF           : Output target selected, fader disabled
TOUCH LED              : Current fader value near unity; goes dark while OFF
TRANSPORT / TRACK LEDs : Follow Cubase; save animation temporarily owns REW / FF / PLAY / RECORD
PHYSICAL FADER TOUCH   : Motor waits for release; target changes also gate input until release
====================================================================================================
*/

//-----------------------------------------------------------------------------
// HARDWARE PROTOCOL - confirmed on the physical FaderPort Classic
//-----------------------------------------------------------------------------
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
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var deviceDriver = midiremote_api.makeDeviceDriver(
	'PreSonus',
	'FaderPort Classic',
	'Paul Warner'
)

var midiInput = deviceDriver.mPorts.makeMidiInput('FaderPort MIDI In')
var midiOutput = deviceDriver.mPorts.makeMidiOutput('FaderPort MIDI Out')

// detect the Classic by port name (no SysEx identity response required)
deviceDriver.makeDetectionUnit()
	.detectPortPair(midiInput, midiOutput)
	.expectInputNameContains('FaderPort')
	.expectOutputNameContains('FaderPort')

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// DEVICE CONSTANTS / SETTINGS - MIDI codes, save timing and fader scaling
//-----------------------------------------------------------------------------

var FP_NATIVE_MODE = [0x91, 0x00, 0x64]
// hold STOP to save; transport LED progress ends with Play / Record
var STOP_SAVE_HOLD_MS = 1500
var STOP_SAVE_PREDELAY_MS = 500
var SAVE_BLINK_INTERVAL_MS = 140
var SAVE_BLINK_TOGGLES = 10 // Five full blinks, matching IOStation/Korg.

var FP = {
	// Transport modifier row
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

// unity reset for Cubase's +6 dB volume range
// for the +12 dB volume range, use 0.748222 instead
var FADER_HOST_UNITY = 0.789087
// keep send unity separate in case your send range differs from channel volume
var SEND_HOST_UNITY = 0.789087
// A small landing zone makes unity practical to find with the 10-bit fader.
// A wider exit threshold prevents LED flicker at the edge; volume is not snapped.
var FADER_UNITY_TOLERANCE = 2 / FP_FADER_POSITION_MAX
var FADER_UNITY_EXIT_TOLERANCE = 3 / FP_FADER_POSITION_MAX

//-----------------------------------------------------------------------------
// HARDWARE HELPERS - native mode, button LEDs and motor output
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

// motor uses a different byte split from the incoming fader position
function sendFaderMotor(activeDevice, normalizedValue) {
	if (!isFaderEnabled(activeDevice) || faderIsTouched) return
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
	resetShortcutState(activeDevice)
	sendNativeMode(activeDevice)
	clearButtonLeds(activeDevice)
}

deviceDriver.mOnDeactivate = function(activeDevice) {
	resetShortcutState(activeDevice)
	clearButtonLeds(activeDevice)
}

//-----------------------------------------------------------------------------
// SURFACE HELPERS - create buttons and bind incoming switch messages
//-----------------------------------------------------------------------------

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
// 2. SURFACE LAYOUT / MIDI INPUT - create controls and decode physical movement
//-----------------------------------------------------------------------------

// Hardware layout: tall fader at left; six rows of controls at right.
var mainFader = surface.makeFader(0, 0, 1.5, 11.5).setTypeVertical()

// Gate raw MIDI before it reaches the host-bound surface value.
var rawFaderValue = surface.makeCustomValueVariable('Physical Fader Position')
rawFaderValue.mMidiBinding
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

var enabledFaderTouch = surface.makeCustomValueVariable('Enabled Fader Touch')
if (mainFader.mSurfaceValue.mTouchState) {
	mainFader.mSurfaceValue.mTouchState.bindTo(enabledFaderTouch)
}

// physical touch state.. don't let the motor fight your finger
var faderIsTouched = false
var lastHostVolume = 0

function isFaderEnabled(activeDevice) {
	return activeDevice.getState('classic.faderOff') !== '1'
		&& activeDevice.getState('classic.faderWaitRelease') !== '1'
		&& !(activeDevice.getState('classic.mouseFader') === '1'
			&& activeDevice.getState('classic.mouseLockAt') !== '')
}

rawFaderValue.mOnProcessValueChange = function(activeDevice, value) {
	if (!isFaderEnabled(activeDevice)) return
	mainFader.mSurfaceValue.setProcessValue(activeDevice, value)
	updateUnityLed(activeDevice, value)
}

faderTouchValue.mOnProcessValueChange = function(activeDevice, value, diff) {
	faderIsTouched = value > 0
	if (!faderIsTouched) activeDevice.setState('classic.faderWaitRelease', '')
	enabledFaderTouch.setProcessValue(activeDevice,
		isFaderEnabled(activeDevice) && faderIsTouched ? 1 : 0)

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
var panKnob = surface.makeKnob(2.2, 0, 1.2, 1.4)
var panKnobRaw = surface.makeCustomValueVariable('FaderPort Knob RAW')

panKnobRaw.mMidiBinding
	.setInputPort(midiInput)
	.bindToPitchBend(0)

var FP_KNOB_STEP = 1 / 200

panKnobRaw.mOnProcessValueChange = function(activeDevice, value) {
	if (activeDevice.getState('classic.zoomMode') === '1') {
		if (value < 0.25) zoomInCommand(activeDevice)
		else if (value > 0.75) zoomOutCommand(activeDevice)
		return
	}
	// Do not edit an unlocked hover target while PROJ is acquiring its lock.
	if (activeDevice.getState('classic.mouseMode') === '1'
			&& activeDevice.getState('classic.mouseLockAt') !== '') return
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

// Top row: Pan knob (above), Mute, Solo, Rec
var btnMute      = makeFpButton(FP.MUTE,       4.0, 0.2, 1.2, 1)
var btnSolo      = makeFpButton(FP.SOLO,       5.8, 0.2, 1.2, 1)
var btnTrackRec  = makeFpButton(FP.TRACK_REC,  7.6, 0.2, 1.2, 1)

// Channel Select: Left, Bank, Right, Output
var btnPrevTrack = makeFpButton(FP.PREV_TRACK, 2.2, 2.3, 1.2, 1)
var btnBank      = makeFpButton(FP.BANK,       4.0, 2.3, 1.2, 1)
var btnNextTrack = makeFpButton(FP.NEXT_TRACK, 5.8, 2.3, 1.2, 1)
var btnOutput    = makeFpButton(FP.OUTPUT,     7.6, 2.3, 1.2, 1)

// Fader Mode: Read, Write, Touch, Off
var btnRead      = makeFpButton(FP.READ,       2.2, 4.4, 1.2, 1)
var btnWrite     = makeFpButton(FP.WRITE,      4.0, 4.4, 1.2, 1)
var btnTouchMode = makeFpButton(FP.TOUCH_MODE, 5.8, 4.4, 1.2, 1)
var btnOff       = makeFpButton(FP.OFF,        7.6, 4.4, 1.2, 1)

// Window View: Mix, Proj, Trns, Undo
var btnMix       = makeFpButton(FP.MIX,        2.2, 6.5, 1.2, 1)
var btnProject   = makeFpButton(FP.PROJECT,    4.0, 6.5, 1.2, 1)
var btnTransport = makeFpButton(FP.TRANSPORT,  5.8, 6.5, 1.2, 1)
var btnUndo      = makeFpButton(FP.UNDO,       7.6, 6.5, 1.2, 1)

// Transport modifiers: Shift, Punch, User, Loop
var btnShift     = makeFpButton(FP.SHIFT,      2.2, 8.6, 1.2, 1)
var btnPunch     = makeFpButton(FP.PUNCH,      4.0, 8.6, 1.2, 1)
var btnUser      = makeFpButton(FP.USER,       5.8, 8.6, 1.2, 1)
var btnLoop      = makeFpButton(FP.LOOP,       7.6, 8.6, 1.2, 1)

// Bottom row: five transport buttons spanning the same width as the rows above.
var btnRew       = makeFpButton(FP.REW,        2.20, 10.5, 1.2, 1)
var btnFfwd      = makeFpButton(FP.FFWD,       3.55, 10.5, 1.2, 1)
var btnStop      = makeFpButton(FP.STOP,       4.90, 10.5, 1.2, 1)
var btnPlay      = makeFpButton(FP.PLAY,       6.25, 10.5, 1.2, 1)
var btnRecord    = makeFpButton(FP.RECORD,     7.60, 10.5, 1.2, 1)

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - track/output fader targets and pan/send/mouse knob modes
//-----------------------------------------------------------------------------

var page = deviceDriver.mMapping.makePage('Main')

var transportValues = page.mHostAccess.mTransport.mValue
var trackSelection = page.mHostAccess.mTrackSelection
var selectedChannel = trackSelection.mMixerChannel
var selectedValues = selectedChannel.mValue

// use the first output bus as Stereo Out
var outputZone = page.mHostAccess.mMixConsole.makeMixerBankZone().includeOutputChannels()
var stereoOut = outputZone.makeMixerBankChannel()
var faderTargetArea = page.makeSubPageArea('Fader Target')
var trackFaderMode = faderTargetArea.makeSubPage('Selected Track')
var outputFaderMode = faderTargetArea.makeSubPage('Stereo Out')
var mouseFaderMode = faderTargetArea.makeSubPage('Mouse Parameter')
var knobTargetArea = page.makeSubPageArea('Knob Target')
var panKnobMode = knobTargetArea.makeSubPage('Pan')
var sendKnobMode = knobTargetArea.makeSubPage('Send 1')
var mouseKnobMode = knobTargetArea.makeSubPage('Mouse Parameter')
var zoomKnobMode = knobTargetArea.makeSubPage('Output Zoom')
var mouseLockValue = surface.makeCustomValueVariable('Mouse Parameter Locked')
page.makeValueBinding(mouseLockValue, page.mHostAccess.mMouseCursor.mValueLocked)
// Keep mouse feedback separate from the fader's previous track/output value.
var mouseFaderFeedback = surface.makeCustomValueVariable('Mouse Fader Feedback')
page.makeValueBinding(mouseFaderFeedback, page.mHostAccess.mMouseCursor.mValueUnderMouse)
var firstSend = selectedChannel.mSends.getByIndex(0)
panKnobMode.mOnActivate = function(activeDevice) {
	activeDevice.setState('classic.zoomMode', '')
	leaveMouseKnobMode(activeDevice)
	activeDevice.setState('classic.sendMode', '')
	sendButtonLed(activeDevice, FP.MIX, false)
}
sendKnobMode.mOnActivate = function(activeDevice) {
	activeDevice.setState('classic.zoomMode', '')
	leaveMouseKnobMode(activeDevice)
	activeDevice.setState('classic.sendMode', '1')
	sendButtonLed(activeDevice, FP.MIX, true)
}
function leaveMouseKnobMode(activeDevice) {
	if (activeDevice.getState('classic.mouseFader') === '1') return
	activeDevice.setState('classic.mouseSavedValue', '')
	activeDevice.setState('classic.mouseMode', '')
	activeDevice.setState('classic.mouseLockAt', '')
	mouseLockValue.setProcessValue(activeDevice, 0)
	sendButtonLed(activeDevice, FP.PROJECT, false)
}
function leaveMouseFaderMode(activeDevice) {
	if (activeDevice.getState('classic.mouseFader') !== '1') return
	activeDevice.setState('classic.mouseSavedValue', '')
	activeDevice.setState('classic.mouseFader', '')
	activeDevice.setState('classic.mouseLockAt', '')
	mouseLockValue.setProcessValue(activeDevice, 0)
	sendButtonLed(activeDevice, FP.BANK, false)
}
mouseFaderMode.mOnActivate = function(activeDevice) {
	restoreOutputKnob(activeDevice)
	activeDevice.setState('classic.mouseSavedValue', '')
	activeDevice.setState('classic.mouseFader', '1')
	activeDevice.setState('classic.output', '')
	activeDevice.setState('classic.faderOff', '')
	activeDevice.setState('classic.faderWaitRelease', faderIsTouched ? '1' : '')
	enabledFaderTouch.setProcessValue(activeDevice, 0)
	mouseLockValue.setProcessValue(activeDevice, 0)
	activeDevice.setState('classic.mouseLockAt', String(Date.now() + 100))
	sendButtonLed(activeDevice, FP.OUTPUT, false)
	sendButtonLed(activeDevice, FP.OFF, false)
	sendButtonLed(activeDevice, FP.BANK, true)
}
mouseKnobMode.mOnActivate = function(activeDevice) {
	activeDevice.setState('classic.zoomMode', '')
	activeDevice.setState('classic.mouseSavedValue', '')
	activeDevice.setState('classic.mouseMode', '1')
	activeDevice.setState('classic.sendMode', '')
	// give Cubase an update interval to activate the mouse binding before locking
	mouseLockValue.setProcessValue(activeDevice, 0)
	activeDevice.setState('classic.mouseLockAt', String(Date.now() + 100))
	sendButtonLed(activeDevice, FP.MIX, false)
	sendButtonLed(activeDevice, FP.PROJECT, true)
}
zoomKnobMode.mOnActivate = function(activeDevice) {
	leaveMouseKnobMode(activeDevice)
	activeDevice.setState('classic.zoomMode', '1')
	activeDevice.setState('classic.sendMode', '')
	sendButtonLed(activeDevice, FP.MIX, false)
}

function restoreOutputKnob(activeDevice) {
	if (activeDevice.getState('classic.zoomMode') !== '1') return
	var target = activeDevice.getState('classic.zoomReturnSend') === '1' ? sendKnobMode : panKnobMode
	target.mAction.mActivate.trigger(getFaderTargetMapping(activeDevice))
}

deviceDriver.mOnIdle = function(activeDevice) {
	updateStopHoldSave(activeDevice, Date.now())
	var lockAt = activeDevice.getState('classic.mouseLockAt')
	if (lockAt === '' || Date.now() < Number(lockAt)) return
	activeDevice.setState('classic.mouseLockAt', '')
	if ((activeDevice.getState('classic.mouseMode') !== '1'
			&& activeDevice.getState('classic.mouseFader') !== '1')
			|| !getFaderTargetMapping(activeDevice)) return
	// keep the mouse target locked until we leave the mode
	mouseLockValue.setProcessValue(activeDevice, 1)
	// Snapshot once per PROJ/BANK entry, after the mouse binding has settled.
	activeDevice.setState('classic.mouseSavedValue',
		String(mouseFaderFeedback.getProcessValue(activeDevice)))
	if (activeDevice.getState('classic.mouseFader') === '1') {
		updateFaderHostVolume(activeDevice, mouseFaderFeedback.getProcessValue(activeDevice))
	}
}
var trackVolumeFeedback = surface.makeCustomValueVariable('Track Volume Feedback')
var outputVolumeFeedback = surface.makeCustomValueVariable('Output Volume Feedback')
page.makeValueBinding(trackVolumeFeedback, selectedValues.mVolume)
page.makeValueBinding(outputVolumeFeedback, stereoOut.mValue.mVolume)
// keep Cubase's ActiveMapping for subpage actions; button callbacks only get ActiveDevice
var faderTargetMappings = []

function getFaderTargetMapping(activeDevice) {
	var key = activeDevice.getState('classic.mappingIndex')
	return key === '' ? null : faderTargetMappings[Number(key)]
}

function activateFaderTarget(activeDevice, output) {
	leaveMouseFaderMode(activeDevice)
	if (output) {
		if (activeDevice.getState('classic.zoomMode') !== '1') {
			activeDevice.setState('classic.zoomReturnSend', activeDevice.getState(
				activeDevice.getState('classic.mouseMode') === '1' ? 'classic.mouseReturnSend' : 'classic.sendMode'))
		}
		zoomKnobMode.mAction.mActivate.trigger(getFaderTargetMapping(activeDevice))
	} else {
		restoreOutputKnob(activeDevice)
	}
	enabledFaderTouch.setProcessValue(activeDevice, 0)
	activeDevice.setState('classic.output', output ? '1' : '')
	activeDevice.setState('classic.faderOff', activeDevice.getState('classic.exitMouseOff'))
	// Cubase may activate the requested subpage after the button callback returns.
	activeDevice.setState('classic.exitMouseOff', '')
	activeDevice.setState('classic.faderWaitRelease', faderIsTouched ? '1' : '')
	lastHostVolume = (output ? outputVolumeFeedback : trackVolumeFeedback).getProcessValue(activeDevice)
	sendButtonLed(activeDevice, FP.OUTPUT, output)
	sendButtonLed(activeDevice, FP.OFF, activeDevice.getState('classic.faderOff') === '1')
	updateUnityLed(activeDevice, lastHostVolume)
	sendFaderMotor(activeDevice, lastHostVolume)
}
trackFaderMode.mOnActivate = function(activeDevice) { activateFaderTarget(activeDevice, false) }
outputFaderMode.mOnActivate = function(activeDevice) { activateFaderTarget(activeDevice, true) }
page.mOnActivate = function(activeDevice, activeMapping) {
	var key = activeDevice.getState('classic.mappingIndex')
	if (key === '') {
		key = String(faderTargetMappings.length)
		activeDevice.setState('classic.mappingIndex', key)
	}
	faderTargetMappings[Number(key)] = activeMapping
	trackFaderMode.mAction.mActivate.trigger(activeMapping)
	panKnobMode.mAction.mActivate.trigger(activeMapping)
}
page.mOnDeactivate = function(activeDevice) {
	cancelStopHoldSave(activeDevice)
	leaveMouseFaderMode(activeDevice)
	leaveMouseKnobMode(activeDevice)
	var key = activeDevice.getState('classic.mappingIndex')
	if (key !== '') faderTargetMappings[Number(key)] = null
}

//-----------------------------------------------------------------------------
// FEEDBACK EVENTS - host state drives LEDs, separately from physical presses
//-----------------------------------------------------------------------------

// Stateful LEDs follow Cubase, including changes made with the mouse and track
// selection. Button releases must not extinguish an active host state.
function followHostLed(switchId, hostValue) {
	hostValue.mOnProcessValueChange = function(activeDevice, activeMapping, value) {
		// Keep the latest host state while the save animation owns these LEDs.
		activeDevice.setState('classic.led.' + switchId, value > 0 ? '1' : '')
		if (saveLedIsOwned(activeDevice, switchId)) return
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

//-----------------------------------------------------------------------------
// 4. BUTTON ROUTING - held SHIFT, command pulses and mode switches
//-----------------------------------------------------------------------------

// SHIFT is a held modifier, never a latch or a host command.
btnShift.mSurfaceValue.mOnProcessValueChange = function(activeDevice, value) {
	activeDevice.setState('classic.shift', value > 0 ? '1' : '')
	sendButtonLed(activeDevice, FP.SHIFT, value > 0)
}

// Physical inputs stay separate from host feedback. Resolve shortcuts only on
// press so releasing SHIFT before the other button cannot fire its normal action.
var shortcutStateKeys = ['classic.shift', 'classic.stop', 'classic.rew', 'classic.unityLed',
	'classic.faderOff', 'classic.faderWaitRelease', 'classic.output', 'classic.sendMode',
	'classic.mouseMode', 'classic.mouseReturnSend', 'classic.mouseLockAt',
	'classic.mouseFader', 'classic.exitMouseOff', 'classic.mouseSavedValue',
    'classic.stopHoldStart', 'classic.stopProgress', 'classic.saveBlinkCount', 'classic.saveBlinkAt',
    'classic.zoomMode', 'classic.zoomReturnSend']
var rewindInput = surface.makeCustomValueVariable('Rewind Held')

function resetShortcutState(activeDevice) {
	for (var i = 0; i < shortcutStateKeys.length; ++i) {
		activeDevice.setState(shortcutStateKeys[i], '')
	}
	rewindInput.setProcessValue(activeDevice, 0)
	enabledFaderTouch.setProcessValue(activeDevice, 0)
	faderIsTouched = false
	mouseLockValue.setProcessValue(activeDevice, 0)
}

function makeCommandTrigger(name, category, command) {
	var input = surface.makeCustomValueVariable(name)
	page.makeCommandBinding(input, category, command).filterByValue(1)
	return function(activeDevice) {
		input.setProcessValue(activeDevice, 1)
		input.setProcessValue(activeDevice, 0)
	}
}

function makeHostToggle(name, hostValue) {
	var value = surface.makeCustomValueVariable(name)
	page.makeValueBinding(value, hostValue)
	return function(activeDevice) {
		value.setProcessValue(activeDevice, value.getProcessValue(activeDevice) > 0 ? 0 : 1)
	}
}

function routeShortcut(button, name, normalAction, shiftedAction) {
	var stateKey = 'classic.held.' + name
	shortcutStateKeys.push(stateKey)
	button.mSurfaceValue.mOnProcessValueChange = function(activeDevice, value) {
		if (value <= 0) {
			activeDevice.setState(stateKey, '')
			return
		}
		if (activeDevice.getState(stateKey) === '1') return
		activeDevice.setState(stateKey, '1')
		var shifted = activeDevice.getState('classic.shift') === '1'
		var action = shifted && shiftedAction ? shiftedAction : normalAction
		action(activeDevice)
	}
}

// cycle marker recall wraps through numbered slots, independent of Cycle on/off
var CYCLE_MARKER_MAX = 9
var cycleMarkerCommands = []
for (var cycleNumber = 1; cycleNumber <= CYCLE_MARKER_MAX; ++cycleNumber) {
	cycleMarkerCommands[cycleNumber] = makeCommandTrigger('Cycle Marker ' + cycleNumber,
		'Transport', 'Recall Cycle Marker ' + cycleNumber)
}
function recallCycleMarker(activeDevice, direction) {
	var number = (Number(activeDevice.getState('classic.activeCycleMarker')) || 1) + direction
	if (number < 1) number = CYCLE_MARKER_MAX
	if (number > CYCLE_MARKER_MAX) number = 1
	activeDevice.setState('classic.activeCycleMarker', String(number))
	cycleMarkerCommands[number](activeDevice)
}

var zoomInCommand = makeCommandTrigger('Zoom In', 'Zoom', 'Zoom In')
var zoomOutCommand = makeCommandTrigger('Zoom Out', 'Zoom', 'Zoom Out')
var zoomLocatorsCommand = makeCommandTrigger('Zoom to Locators', 'Zoom', 'Zoom to Locators')

routeShortcut(btnUndo, 'undo',
	makeCommandTrigger('Undo', 'Edit', 'Undo'),
	makeCommandTrigger('Redo', 'Edit', 'Redo'))
routeShortcut(btnPunch, 'previousMarker',
	makeCommandTrigger('Previous Marker', 'Transport', 'Locate Previous Marker'),
	function(activeDevice) { recallCycleMarker(activeDevice, -1) })
routeShortcut(btnUser, 'nextMarker',
	makeCommandTrigger('Next Marker', 'Transport', 'Locate Next Marker'),
	function(activeDevice) { recallCycleMarker(activeDevice, 1) })
routeShortcut(btnLoop, 'loop',
	makeHostToggle('Cycle State', transportValues.mCycleActive),
	makeCommandTrigger('Insert Marker',
		mainFader.mSurfaceValue.mTouchState ? 'Marker' : 'Transport', 'Insert Marker'))
routeShortcut(btnSolo, 'solo',
	makeHostToggle('Selected Solo State', selectedValues.mSolo),
	makeCommandTrigger('Clear All Solos', 'Edit', 'Deactivate All Solo'))
routeShortcut(btnMute, 'mute',
	makeHostToggle('Selected Mute State', selectedValues.mMute),
	makeCommandTrigger('Unmute All', 'Edit', 'Unmute All'))
routeShortcut(btnTouchMode, 'resetVolume', function(activeDevice) {
	if (activeDevice.getState('classic.faderOff') === '1') {
		activeDevice.setState('classic.faderOff', '')
		// Reset the host now, but keep a held fader gated until release.
		activeDevice.setState('classic.faderWaitRelease', faderIsTouched ? '1' : '')
		enabledFaderTouch.setProcessValue(activeDevice, 0)
		sendButtonLed(activeDevice, FP.OFF, false)
	} else if (!isFaderEnabled(activeDevice)) return
	mainFader.mSurfaceValue.setProcessValue(activeDevice, FADER_HOST_UNITY)
})
routeShortcut(btnOff, 'faderOff', function(activeDevice) {
	var turnOff = activeDevice.getState('classic.faderOff') !== '1'
	if (activeDevice.getState('classic.mouseFader') === '1') {
		activeDevice.setState('classic.exitMouseOff', '1')
		leaveMouseFaderMode(activeDevice)
		trackFaderMode.mAction.mActivate.trigger(getFaderTargetMapping(activeDevice))
	}
	activeDevice.setState('classic.faderOff', turnOff ? '1' : '')
	// Re-enabling under a finger must not jump Cubase to the parked position.
	activeDevice.setState('classic.faderWaitRelease', !turnOff && faderIsTouched ? '1' : '')
	enabledFaderTouch.setProcessValue(activeDevice, 0)
	sendButtonLed(activeDevice, FP.OFF, turnOff)
	updateUnityLed(activeDevice, lastHostVolume)
	if (!turnOff) sendFaderMotor(activeDevice, lastHostVolume)
})
routeShortcut(btnOutput, 'output', function(activeDevice) {
	var activeMapping = getFaderTargetMapping(activeDevice)
	if (!activeMapping) return
	// OFF followed by OUTPUT always restores the output target, even if its
	// subpage was already selected (re-activating it may not fire a callback).
	if (activeDevice.getState('classic.faderOff') === '1'
			&& activeDevice.getState('classic.output') === '1') {
		activateFaderTarget(activeDevice, true)
		return
	}
	var target = activeDevice.getState('classic.output') === '1' ? trackFaderMode : outputFaderMode
	target.mAction.mActivate.trigger(activeMapping)
})
routeShortcut(btnMix, 'mix', function(activeDevice) {
	var activeMapping = getFaderTargetMapping(activeDevice)
	if (!activeMapping) return
	var defaultMode = activeDevice.getState('classic.output') === '1' ? zoomKnobMode : panKnobMode
	var target = activeDevice.getState('classic.sendMode') === '1' ? defaultMode : sendKnobMode
	target.mAction.mActivate.trigger(activeMapping)
})
routeShortcut(btnBank, 'mouseFader', function(activeDevice) {
	var activeMapping = getFaderTargetMapping(activeDevice)
	if (!activeMapping) return
	if (activeDevice.getState('classic.mouseFader') === '1') {
		trackFaderMode.mAction.mActivate.trigger(activeMapping)
		return
	}
	if (activeDevice.getState('classic.mouseMode') === '1') {
		var previous = activeDevice.getState('classic.mouseReturnSend') === '1' ? sendKnobMode : panKnobMode
		previous.mAction.mActivate.trigger(activeMapping)
	}
	mouseFaderMode.mAction.mActivate.trigger(activeMapping)
})
routeShortcut(btnProject, 'mouseMode', function(activeDevice) {
	var activeMapping = getFaderTargetMapping(activeDevice)
	if (!activeMapping) return
	if (activeDevice.getState('classic.mouseFader') === '1') {
		trackFaderMode.mAction.mActivate.trigger(activeMapping)
	}
	if (activeDevice.getState('classic.mouseMode') === '1') {
		var previous = activeDevice.getState('classic.mouseReturnSend') === '1' ? sendKnobMode : panKnobMode
		// OUTPUT remains the fader target; exiting PROJ returns its knob to zoom.
		if (activeDevice.getState('classic.output') === '1') previous = zoomKnobMode
		previous.mAction.mActivate.trigger(activeMapping)
	} else {
		activeDevice.setState('classic.mouseReturnSend', activeDevice.getState('classic.sendMode'))
		mouseKnobMode.mAction.mActivate.trigger(activeMapping)
	}
})
routeShortcut(btnTransport, 'resetKnob', function(activeDevice) {
	if (!getFaderTargetMapping(activeDevice)) return
	if (activeDevice.getState('classic.zoomMode') === '1') {
		zoomLocatorsCommand(activeDevice)
		return
	}
	if (activeDevice.getState('classic.mouseMode') === '1'
			|| activeDevice.getState('classic.mouseFader') === '1') {
		var saved = activeDevice.getState('classic.mouseSavedValue')
		if (activeDevice.getState('classic.mouseLockAt') !== '' || saved === '') return
		if (activeDevice.getState('classic.mouseFader') === '1') {
			if (!isFaderEnabled(activeDevice)) return
			// Restore through the mouse binding, independently of the physical
			// fader's touch/surface state. Do not wait for another host callback
			// to position the motor (sendFaderMotor still protects held touch).
			mouseFaderFeedback.setProcessValue(activeDevice, Number(saved))
			updateFaderHostVolume(activeDevice, Number(saved))
		} else {
			panKnob.mSurfaceValue.setProcessValue(activeDevice, Number(saved))
		}
		return
	}
	panKnob.mSurfaceValue.setProcessValue(activeDevice,
		activeDevice.getState('classic.sendMode') === '1' ? SEND_HOST_UNITY : 0.5)
}, zoomLocatorsCommand)

//-----------------------------------------------------------------------------
// 5. TRANSPORT - STOP chords, hold-to-save and confirmation LEDs
//-----------------------------------------------------------------------------

var stopCommand = makeCommandTrigger('Stop', 'Transport', 'Stop')
var saveCommand = makeCommandTrigger('Save', 'File', 'Save')
var saveLedButtons = [FP.REW, FP.FFWD, FP.PLAY, FP.RECORD]
var stopProgressButtons = [FP.FFWD, FP.REW, FP.PLAY, FP.RECORD]

function saveLedIsOwned(activeDevice, switchId) {
	return saveLedButtons.indexOf(switchId) >= 0
		&& (activeDevice.getState('classic.stopProgress') !== ''
			|| activeDevice.getState('classic.saveBlinkCount') !== '')
}

function restoreSaveLeds(activeDevice) {
	for (var i = 0; i < saveLedButtons.length; ++i) {
		var id = saveLedButtons[i]
		sendButtonLed(activeDevice, id, activeDevice.getState('classic.led.' + id) === '1')
	}
}

function resetStopProgress(activeDevice) {
	activeDevice.setState('classic.stopHoldStart', '')
	var hadProgress = activeDevice.getState('classic.stopProgress') !== ''
	activeDevice.setState('classic.stopProgress', '')
	if (hadProgress && activeDevice.getState('classic.saveBlinkCount') === '') restoreSaveLeds(activeDevice)
}

function cancelStopHoldSave(activeDevice) {
	var hadAnimation = activeDevice.getState('classic.saveBlinkCount') !== ''
	resetStopProgress(activeDevice)
	activeDevice.setState('classic.saveBlinkCount', '')
	activeDevice.setState('classic.saveBlinkAt', '')
	if (hadAnimation) restoreSaveLeds(activeDevice)
}

function updateStopHoldSave(activeDevice, now) {
	var start = activeDevice.getState('classic.stopHoldStart')
	if (start !== '') {
		var elapsed = now - Number(start)
		if (elapsed >= STOP_SAVE_HOLD_MS) {
			activeDevice.setState('classic.saveBlinkCount', '0')
			activeDevice.setState('classic.saveBlinkAt', '')
			resetStopProgress(activeDevice)
			saveCommand(activeDevice)
		} else if (elapsed >= STOP_SAVE_PREDELAY_MS
				&& activeDevice.getState('classic.saveBlinkCount') === '') {
			var duration = Math.max(1, STOP_SAVE_HOLD_MS - STOP_SAVE_PREDELAY_MS)
			var progress = Math.min(stopProgressButtons.length,
				1 + Math.floor((elapsed - STOP_SAVE_PREDELAY_MS) * stopProgressButtons.length / duration))
			if (activeDevice.getState('classic.stopProgress') !== String(progress)) {
				activeDevice.setState('classic.stopProgress', String(progress))
				for (var i = 0; i < stopProgressButtons.length; ++i) {
					sendButtonLed(activeDevice, stopProgressButtons[i], i < progress)
				}
			}
		}
	}
	var blink = activeDevice.getState('classic.saveBlinkCount')
	if (blink === '') return
	var last = activeDevice.getState('classic.saveBlinkAt')
	if (last !== '' && now - Number(last) < SAVE_BLINK_INTERVAL_MS) return
	var count = Number(blink)
	for (var j = 0; j < saveLedButtons.length; ++j) {
		sendButtonLed(activeDevice, saveLedButtons[j], count % 2 === 0)
	}
	activeDevice.setState('classic.saveBlinkAt', String(now))
	activeDevice.setState('classic.saveBlinkCount', String(count + 1))
	if (count + 1 >= SAVE_BLINK_TOGGLES) {
		activeDevice.setState('classic.saveBlinkCount', '')
		restoreSaveLeds(activeDevice)
	}
}

var returnToZero = makeCommandTrigger('Return to Zero', 'Transport', 'Return to Zero')
btnStop.mSurfaceValue.mOnProcessValueChange = function(activeDevice, value) {
	if (value > 0) {
		if (activeDevice.getState('classic.stop') === '1') return
		activeDevice.setState('classic.stop', '1')
		stopCommand(activeDevice)
		if (activeDevice.getState('classic.rew') !== '1') {
			activeDevice.setState('classic.stopHoldStart', String(Date.now()))
		}
	} else {
		activeDevice.setState('classic.stop', '')
		resetStopProgress(activeDevice)
	}
}
btnRew.mSurfaceValue.mOnProcessValueChange = function(activeDevice, value) {
	if (value > 0) {
		if (activeDevice.getState('classic.rew') === '1') return
		activeDevice.setState('classic.rew', '1')
		if (activeDevice.getState('classic.stop') === '1') {
			resetStopProgress(activeDevice)
			returnToZero(activeDevice)
		} else {
			rewindInput.setProcessValue(activeDevice, 1)
		}
	} else {
		activeDevice.setState('classic.rew', '')
		rewindInput.setProcessValue(activeDevice, 0)
	}
}

//-----------------------------------------------------------------------------
// 6. HOST BINDINGS / FADER FEEDBACK - volume, knob, transport and track controls
//-----------------------------------------------------------------------------

// fader target bindings, unity LED and motor feedback

function updateUnityLed(activeDevice, value) {
	var wasLit = activeDevice.getState('classic.unityLed') === '1'
	var tolerance = wasLit ? FADER_UNITY_EXIT_TOLERANCE : FADER_UNITY_TOLERANCE
	var lit = activeDevice.getState('classic.faderOff') !== '1'
		&& Math.abs(value - FADER_HOST_UNITY) <= tolerance
	activeDevice.setState('classic.unityLed', lit ? '1' : '')
	sendButtonLed(activeDevice, FP.TOUCH_MODE, lit)
}

// Surface changes arrive during a physical drag, even when host feedback waits
// for touch release. LED feedback must not wait for motor feedback.
mainFader.mSurfaceValue.mOnProcessValueChange = function(activeDevice, value) {
	updateUnityLed(activeDevice, value)
}

page.makeValueBinding(
	mainFader.mSurfaceValue,
	selectedValues.mVolume
).setValueTakeOverModeJump()
	.setSubPage(trackFaderMode)

page.makeValueBinding(mainFader.mSurfaceValue, stereoOut.mValue.mVolume)
	.setValueTakeOverModeJump()
	.setSubPage(outputFaderMode)
page.makeValueBinding(mainFader.mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
	.setValueTakeOverModeJump()
	.setSubPage(mouseFaderMode)
page.mHostAccess.mMouseCursor.mValueUnderMouse.mOnProcessValueChange = function(activeDevice, activeMapping, value) {
	if (activeDevice.getState('classic.mouseFader') !== '1') return
	updateFaderHostVolume(activeDevice, value)
}

// Manual motor feedback is necessary because the Classic's host->motor packet
// format is NOT the same as its fader->host 14-bit CC encoding.
selectedValues.mVolume.mOnProcessValueChange = function(
	activeDevice,
	activeMapping,
	value
) {
	if (activeDevice.getState('classic.output') === '1'
			|| activeDevice.getState('classic.mouseFader') === '1') return
	updateFaderHostVolume(activeDevice, value)
}

stereoOut.mValue.mVolume.mOnProcessValueChange = function(activeDevice, activeMapping, value) {
	if (activeDevice.getState('classic.output') !== '1') return
	updateFaderHostVolume(activeDevice, value)
}

function updateFaderHostVolume(activeDevice, value) {
	lastHostVolume = value
	// Do not fight the user's finger.
	if (!faderIsTouched) {
		updateUnityLed(activeDevice, value)
		sendFaderMotor(activeDevice, value)
	}
}

// pan knob - only the active subpage receives changes

page.makeValueBinding(
	panKnob.mSurfaceValue,
	selectedValues.mPan
).setSubPage(panKnobMode)
page.makeValueBinding(panKnob.mSurfaceValue, firstSend.mLevel)
	.setSubPage(sendKnobMode)
page.makeValueBinding(panKnob.mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
	.setSubPage(mouseKnobMode)

// transport

page.makeValueBinding(
	rewindInput,
	transportValues.mRewind
)

page.makeValueBinding(
	btnFfwd.mSurfaceValue,
	transportValues.mForward
)

page.makeValueBinding(
	btnPlay.mSurfaceValue,
	transportValues.mStart
).setTypeToggle()

page.makeValueBinding(
	btnRecord.mSurfaceValue,
	transportValues.mRecord
)

// channel arrows - normal track selection or SHIFT zoom commands

function makeTrackNavigationTrigger(name, action) {
	var input = surface.makeCustomValueVariable(name)
	page.makeActionBinding(input, action).filterByValue(1)
	return function(activeDevice) {
		input.setProcessValue(activeDevice, 1)
		input.setProcessValue(activeDevice, 0)
	}
}
routeShortcut(btnPrevTrack, 'previousTrack',
	makeTrackNavigationTrigger('Previous Track Pressed', trackSelection.mAction.mPrevTrack),
	zoomOutCommand)
routeShortcut(btnNextTrack, 'nextTrack',
	makeTrackNavigationTrigger('Next Track Pressed', trackSelection.mAction.mNextTrack),
	zoomInCommand)

// selected-track record enable and automation

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

//-----------------------------------------------------------------------------
// END
//-----------------------------------------------------------------------------
