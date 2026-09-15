// PreSonus FaderPort v2 - hardware boilerplate (Cubase MIDI Remote, ES5).
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

// Physical fader: direct 14-bit pitch bend, without calibration or scaling.
var fader = surface.makeFader(0.11, 0, 1.1, 5.728).setTypeVertical()
    .setControlLayer(cl_fader)
fader.mSurfaceValue.mMidiBinding.setInputPort(midiIn).setOutputPort(midiOut)
    .bindToPitchBend(0)
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
var buttonFunctions = [
    [uSection.btn_Solo, 'Solo', 'SoloClear'],
    [uSection.btn_Mute, 'Mute', 'MuteClear'],
    [uSection.btn_Arm, 'Arm', 'ArmAll'],
    [uSection.btn_Bypass, 'Bypass', 'BypassAll'],
    [uSection.btn_Touch, 'Touch', 'Latch'],
    [uSection.btn_Write, 'Write', 'Trim'],
    [uSection.btn_Read, 'Read', 'Off'],
    [mSection.btn_Prev, 'Prev', 'Undo'],
    [mSection.btn_Next, 'Next', 'Redo'],
    [mSection.btn_Link, 'Link', 'LinkLock'],
    [mSection.btn_Pan, 'Pan', 'Flip'],
    [mSection.btn_Channel, 'Channel', 'ChannelLock'],
    [mSection.btn_Scroll, 'Scroll', 'Zoom'],
    [mSection.btn_Master, 'Master', 'F1'],
    [mSection.btn_Click, 'Click', 'F2'],
    [mSection.btn_Section, 'Section', 'F3'],
    [mSection.btn_Marker, 'Marker', 'F4']
]

// Bind future Cubase actions to these logical values, e.g. buttons.F1 or
// buttons.Flip. Physical surface buttons remain the single MIDI input source.
var buttons = {}
function routeButton(button, normalName, shiftedName) {
    buttons[normalName] = surface.makeCustomValueVariable(normalName)
    buttons[shiftedName] = surface.makeCustomValueVariable(shiftedName)
    var stateKey = 'held.' + normalName
    button.mSurfaceValue.mOnProcessValueChange = function(context, value) {
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
for (var buttonIndex = 0; buttonIndex < buttonFunctions.length; buttonIndex++) {
    var definition = buttonFunctions[buttonIndex]
    routeButton(definition[0], definition[1], definition[2])
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
    for (var i = 0; i < buttonFunctions.length; i++) {
        var definition = buttonFunctions[i]
        context.setState('held.' + definition[1], '')
        buttons[definition[1]].setProcessValue(context, 0)
        buttons[definition[2]].setProcessValue(context, 0)
    }
}

// Transport, encoder push/rotation, fader and footswitch retain their direct
// paths in both layers. The printed RTZ transport chord is not a SHIFT label.

// Hardware output helpers. Pass the active device context from a callback.
// LEDs: note-on velocity 0 = off, 127 = on, 1 = hardware flashing.
function offLED(context, note) { midiOut.sendMidi(context, [0x90, note, 0x00]) }
function onLED(context, note) { midiOut.sendMidi(context, [0x90, note, 0x7F]) }
function flashingLED(context, note) { midiOut.sendMidi(context, [0x90, note, 0x01]) }

function midi7(value) { return Math.max(0, Math.min(127, Math.round(value))) }

// RGB-capable buttons: Touch, Write, Read, Link, Pan, Channel and Scroll.
// Set the color, then call onLED() or flashingLED() to choose the LED state.
function setRGBLED(context, note, r, g, b) {
    midiOut.sendMidi(context, [0x91, note, midi7(r)])
    midiOut.sendMidi(context, [0x92, note, midi7(g)])
    midiOut.sendMidi(context, [0x93, note, midi7(b)])
}

// Optional direct motor command: normalized position 0..1.
// Normal host mappings use the fader's output binding automatically instead.
function setMotorFader(context, position) {
    if (faderTouch.getProcessValue(context) > 0) { return }
    var value = Math.round(Math.max(0, Math.min(1, position)) * 16383)
    midiOut.sendMidi(context, [0xE0, value & 0x7F, (value >> 7) & 0x7F])
}

var ledNotes = [cSolo, cMute, cArm, cShift, cBypass, cTouch, cWrite, cRead,
    cPrev, cNext, cLink, cPan, cChannel, cScroll, cMaster, cClick, cSection,
    cMarker, cCycle, cRWD, cFWD, cStop, cPlay, cRecord]
var rgbNotes = [cTouch, cWrite, cRead, cLink, cPan, cChannel, cScroll]
function allLEDsOff(context) {
    for (var i = 0; i < ledNotes.length; i++) { offLED(context, ledNotes[i]) }
}
deviceDriver.mOnActivate = function(context) {
    resetButtonRouting(context)
    resetTransport(context)
    allLEDsOff(context)
    // Predictable neutral color until our mappings choose their own colors.
    for (var i = 0; i < rgbNotes.length; i++) {
        setRGBLED(context, rgbNotes[i], 127, 127, 127)
    }
}
deviceDriver.mOnDeactivate = function(context) {
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

assignTransportControls()
setupTransportFeedback()

// Future mappings go here. Examples (inactive):
// page.makeValueBinding(fader.mSurfaceValue,
//     page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)
// page.makeCommandBinding(buttons.Undo, 'Edit', 'Undo')
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
