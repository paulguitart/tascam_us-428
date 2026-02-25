// Korg NanoKontrol2        
// "Cubase Kustom Tracking Remote"    
// v1.0.0
//
// By Paul Warner
//
// NOTE: In Cubase, pressing STOP while already stopped may jump to last start position.
// For STOP+LOC undo/redo chords, we accept this as a feature: it brings you back to
// where the last take occurred before undoing.
//
// NOTE: If you run out of zoom knob range, twist the knob quickly in the opposite direction
// to "grab" more travel in the desired range
//
// Wishlist Features
// -----------------
// Fix stop LED
// STOP+locator = undo/redo
// STOP+set = ...something else cool.. makeCommandBinding('Transport', 'Recall Cycle Marker 1') .. 1 thru 9
// Nuclear record blink? (maybe)

//-----------------------------------------------------------------------------
// 0. CUSTOM SETTINGS - change these CONST values to suit your own needs
//-----------------------------------------------------------------------------

// kustom channel for metronome fader, zoom knob, and selected track solo/mute
const ENABLE_KUSTOM_CHANNEL = true

// hold STOP button to save 
const ENABLE_STOP_HOLD_SAVE = true

/*
====================================================================================================
KORG NANOKONTROL2 v1.0 | COMMAND SUMMARY
====================================================================================================

GLOBAL COMMANDS:
----------------------------------------------------------------------------------------------------
STOP (Tap)             : Stop Transport
STOP (Hold 2s)         : TRIGGER SAVE (w/ red LED progress bar & confirm transport LED blink)
STOP + REW             : RETURN TO ZERO (RTZ)
REW / FF / PLAY / REC  : Standard Transport
BANK L / R             : Bank/Track Navigation

...TBD

====================================================================================================
*/

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var midiremote_api = require('midiremote_api_v1')
var deviceDriver = midiremote_api.makeDeviceDriver('Korg', 'nanoKontrol2Remote', 'Paul Warner')

var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
	.expectSysexIdentityResponse('42', '1301', '0000')

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// KORG DEVICE CONSTANTS - device codes for MIDI messages
//-----------------------------------------------------------------------------

const TRANSPORT_MIDI_CC = {
    Rewind: 43,
    FastForward: 44,
    Stop: 42,
    Play: 41,
    Record: 45,
    Cycle: 46
}

//-----------------------------------------------------------------------------
// STATE VARIABLES - custom control
//-----------------------------------------------------------------------------

if (ENABLE_STOP_HOLD_SAVE) {
	// long press STOP to save vars
	const STOP_SAVE_HOLD_MS = 2000
	const STOP_SAVE_PREDELAY_MS = 500
	const STOP_SAVE_RESET = -1
	var stopHoldStartMs = STOP_SAVE_RESET
	var stopSaveArmed = false		
	
	// save LED blink vars
	const SAVE_BLINK_RESET = -1
	const SAVE_BLINK_INTERVAL_MS = 140
	const SAVE_BLINK_TOGGLES = 10                // 10 toggles = 5 full blinks
	var saveBlink_isActive = false
	var saveBlink_lastMs = SAVE_BLINK_RESET
	var saveBlink_toggleCount = 0
	var saveBlink_stateOn = false	
}

//----------------------------------------------------------------------------------------------------------------------

function switchDeviceToCcModeWithExternalLed(context) {
	var initData = [
		[0xF0, 0x7E, 0x00, 0x06, 0x02, 0x42, 0x13, 0x01, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0xF7],
		[0xF0, 0x42, 0x40, 0x00, 0x01, 0x13, 0x00, 0x5F, 0x42, 0x00, 0xF7],
		[0xF0, 0x7E, 0x00, 0x06, 0x02, 0x42, 0x13, 0x01, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0xF7],

		[0xF0, 0x42, 0x40, 0x00, 0x01, 0x13, 0x00, 0x7F, 0x7F, 0x02, 0x03, 0x05, 0x40, 0x00, 0x00, 0x00,
			0x01, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x10, 0x00, 0x00, 0x7F, 0x00,
			0x01, 0x00, 0x20, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x30, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
			0x40, 0x00, 0x7F, 0x00, 0x10, 0x00, 0x01, 0x00, 0x01, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x11,
			0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x21, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x31, 0x00, 0x00, 0x7F,
			0x00, 0x01, 0x00, 0x41, 0x00, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x02, 0x00, 0x00, 0x7F, 0x00,
			0x01, 0x00, 0x12, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x22, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
			0x32, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x42, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x00, 0x03,
			0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x13, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x23, 0x00, 0x00, 0x7F,
			0x00, 0x01, 0x00, 0x33, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x43, 0x00, 0x7F, 0x00, 0x00, 0x10,
			0x01, 0x00, 0x04, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x14, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
			0x24, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x34, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x44, 0x00,
			0x7F, 0x00, 0x10, 0x01, 0x00, 0x00, 0x05, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x15, 0x00, 0x00, 0x7F,
			0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x35, 0x00, 0x7F, 0x00, 0x00, 0x01,
			0x00, 0x45, 0x00, 0x7F, 0x00, 0x00, 0x10, 0x01, 0x00, 0x06, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
			0x16, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x26, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x36, 0x00,
			0x7F, 0x00, 0x01, 0x00, 0x46, 0x00, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x07, 0x00, 0x00, 0x7F,
			0x00, 0x01, 0x00, 0x17, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x27, 0x00, 0x7F, 0x00, 0x00, 0x01,
			0x00, 0x37, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x47, 0x00, 0x7F, 0x00, 0x10, 0x00, 0x01, 0x00,
			0x3A, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x3B, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x2E, 0x00,
			0x7F, 0x00, 0x01, 0x00, 0x3C, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x3D, 0x00, 0x00, 0x7F, 0x00,
			0x01, 0x00, 0x3E, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x2B, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
			0x2C, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x2A, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x29, 0x00,
			0x7F, 0x00, 0x01, 0x00, 0x2D, 0x00, 0x00, 0x7F, 0x00, 0x7F, 0x7F, 0x7F, 0x7F, 0x00, 0x7F, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0xF7]
	]

	for (var i = 0; i < initData.length; ++i) {
		midiOutput.sendMidi(context, initData[i]);
	}
}

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

function bindMidiCC(button, chn, num) {
	button.mSurfaceValue.mMidiBinding
		.setInputPort(midiInput)
		.setOutputPort(midiOutput)
		.bindToControlChange(chn, num)
}

function makeFaderStrip(channelIndex, x, y, surfaceElements) {
	var faderStrip = {}

	var buttonSize = 1.5
	faderStrip.btnSolo = surface.makeButton(x + 4 * channelIndex, y, buttonSize, buttonSize)
	faderStrip.btnMute = surface.makeButton(x + 4 * channelIndex, y + 2, buttonSize, buttonSize)
	faderStrip.btnRec = surface.makeButton(x + 4 * channelIndex, y + 4, buttonSize, buttonSize)
	faderStrip.fader = surface.makeFader(x + 4 * channelIndex + 1.85, y, 1.3, 5.5).setTypeVertical()

	surfaceElements.bottomLabelField.relateTo(faderStrip.btnSolo)
	surfaceElements.bottomLabelField.relateTo(faderStrip.btnMute)
	surfaceElements.bottomLabelField.relateTo(faderStrip.btnRec)
	surfaceElements.bottomLabelField.relateTo(faderStrip.fader)

	surfaceElements.bottomLabelFields[channelIndex].relateTo(faderStrip.btnSolo)
	surfaceElements.bottomLabelFields[channelIndex].relateTo(faderStrip.btnMute)
	surfaceElements.bottomLabelFields[channelIndex].relateTo(faderStrip.btnRec)
	surfaceElements.bottomLabelFields[channelIndex].relateTo(faderStrip.fader)

	faderStrip.btnSolo.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 32 + channelIndex)
	faderStrip.btnMute.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 48 + channelIndex)
	faderStrip.btnRec.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 64 + channelIndex)
	faderStrip.fader.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToControlChange(0, 0 + channelIndex)

	return faderStrip
}

function makeKnobStrip(knobIndex, x, y, surfaceElements) {
	var knobStrip = {}

	knobStrip.knob = surface.makeKnob(x + 4 * knobIndex + 0.1, y, 1.8, 2.2)
	knobStrip.knob.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToControlChange(0, 16 + knobIndex)

	surfaceElements.bottomLabelField.relateTo(knobStrip.knob)
	surfaceElements.bottomLabelFields[knobIndex].relateTo(knobStrip.knob)

	return knobStrip
}

function makeTransport(x, y) {
	var transport = {}

	var w = 2
	var h = 2
	var spacing = 0.5

	var currX = x

	transport.btnCycle = surface.makeButton(currX, y - 1.6, 2, 1)
	bindMidiCC(transport.btnCycle, 0, TRANSPORT_MIDI_CC.Cycle)

	transport.btnRewind = surface.makeButton(currX, y, w, h)
	bindMidiCC(transport.btnRewind, 0, TRANSPORT_MIDI_CC.Rewind)
	currX = currX + w + spacing

	transport.btnFastForward = surface.makeButton(currX, y, w, h)
	bindMidiCC(transport.btnFastForward, 0, TRANSPORT_MIDI_CC.FastForward)
	currX = currX + w + spacing

	transport.btnStop = surface.makeButton(currX, y, w, h)
	bindMidiCC(transport.btnStop, 0, TRANSPORT_MIDI_CC.Stop)
	currX = currX + w + spacing

	transport.btnPlay = surface.makeButton(currX, y, w, h)
	bindMidiCC(transport.btnPlay, 0, TRANSPORT_MIDI_CC.Play)
	currX = currX + w + spacing

	transport.btnRecord = surface.makeButton(currX, y, w, h)
	bindMidiCC(transport.btnRecord, 0, TRANSPORT_MIDI_CC.Record)
	currX = currX + w + spacing

	return transport
}

function makeSurfaceElements() {
	var surfaceElements = {}

	surfaceElements.bottomLabelField = surface.makeLabelField(13, 10, 32, 1)

	var bottomLabelFields = []
	for (var i = 0; i < 8; ++i) {
		bottomLabelFields.push(surface.makeLabelField(13 + (i * 4), 8.5, 4, 1))
	}
	surfaceElements.bottomLabelFields = bottomLabelFields

	var x = 0
	var y = 2.75

	surfaceElements.btn_prevTrack = surface.makeButton(x, y, 2, 1)
	surfaceElements.btn_prevTrack.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 58)

	surfaceElements.btn_nextTrack = surface.makeButton(x + 2.5, y, 2, 1)
	surfaceElements.btn_nextTrack.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 59)

	surfaceElements.btn_insertMarker = surface.makeButton(x + 5, y + 2, 2, 1)
	surfaceElements.btn_insertMarker.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 60)

	surfaceElements.btn_prevMarker = surface.makeButton(x + 7.5, y + 2, 2, 1)
	surfaceElements.btn_prevMarker.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 61)

	surfaceElements.btn_nextMarker = surface.makeButton(x + 10, y + 2, 2, 1)
	surfaceElements.btn_nextMarker.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, 62)

	surfaceElements.numStrips = 8

	surfaceElements.knobStrips = {}
	surfaceElements.faderStrips = {}

	x = 14.5
	y = 0

	for (var i = 0; i < surfaceElements.numStrips; ++i) {
		surfaceElements.knobStrips[i] = makeKnobStrip(i, x, y, surfaceElements)
		surfaceElements.faderStrips[i] = makeFaderStrip(i, 13, 2.5, surfaceElements)
	}

	surfaceElements.transport = makeTransport(0, 6.3)
	surfaceElements.deviceName = surface.makeLabelField(0, 1, 8, 1)

	return surfaceElements
}

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// create all surface elements
var surfaceElements = makeSurfaceElements()

// create at least one mapping page
var page = deviceDriver.mMapping.makePage('nanoKONTROL2 Remote')

// Label
page.setLabelFieldText(surfaceElements.deviceName, 'Kustom Remote Kontrol')

// create host accessing objects
var hostTransport_Rewind = page.mHostAccess.mTransport.mValue.mRewind
var hostTransport_FastForward = page.mHostAccess.mTransport.mValue.mForward
var hostTransport_Stop = page.mHostAccess.mTransport.mValue.mStop
var hostTransport_Start = page.mHostAccess.mTransport.mValue.mStart
var hostTransport_Record = page.mHostAccess.mTransport.mValue.mRecord
var host_MetronomeActive = page.mHostAccess.mTransport.mValue.mMetronomeActive
var host_CycleActive = page.mHostAccess.mTransport.mValue.mCycleActive
var host_SelectPrevTrack = page.mHostAccess.mTrackSelection.mAction.mPrevTrack
var host_SelectNextTrack = page.mHostAccess.mTrackSelection.mAction.mNextTrack
var host_SelectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
var host_SelectedMute = host_SelectedTrackChannel.mValue.mMute
var host_SelectedVolume = host_SelectedTrackChannel.mValue.mVolume

// ---- Markers (basic) ----
page.makeCommandBinding(surfaceElements.btn_insertMarker.mSurfaceValue, 'Transport', 'Insert Marker')
page.makeCommandBinding(surfaceElements.btn_prevMarker.mSurfaceValue, 'Transport', 'Locate Previous Marker')
page.makeCommandBinding(surfaceElements.btn_nextMarker.mSurfaceValue, 'Transport', 'Locate Next Marker')
page.makeValueBinding(surfaceElements.transport.btnCycle.mSurfaceValue, host_CycleActive).setTypeToggle()

// ---- Selected track navigation ----
page.makeActionBinding(surfaceElements.btn_prevTrack.mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mPrevTrack)
page.makeActionBinding(surfaceElements.btn_nextTrack.mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mNextTrack)

// ---- Mixer channels ----
var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone()
	.excludeInputChannels()
	.excludeOutputChannels()
	.excludeSamplerChannels()
	.excludeVCAChannels()

var host_SelectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
var hostMetronomeActive = page.mHostAccess.mTransport.mValue.mMetronomeActive
var hostMetronomeClickLevel = page.mHostAccess.mTransport.mValue.mMetronomeClickLevel

if (ENABLE_KUSTOM_CHANNEL) {
	var var_knobZoom = page.mCustom.makeHostValueVariable('Zoom Knob Position')
	var var_zoomIn  = surface.makeCustomValueVariable('Zoom In')
	var var_zoomOut = surface.makeCustomValueVariable('Zoom Out')
	var lastZoomValue = -1
}

if (ENABLE_STOP_HOLD_SAVE) {
	// long press STOP to save vars
	var var_stopPressed = surface.makeCustomValueVariable("Stop Pressed")
	var var_savePressed = surface.makeCustomValueVariable("Save Pressed")
	var var_stopLed = surface.makeCustomValueVariable("Stop LED Feedback")	
	page.makeValueBinding(var_stopLed, hostTransport_Stop).setTypeToggle()
}

// create custom vars to intercept simultaneous button presses for STOP+REW = RTZ
var var_rewPressed = surface.makeCustomValueVariable("REW Pressed")
var var_RTZPressed = surface.makeCustomValueVariable("RTZ Pressed")

// Track STOP press/release (does NOT replace normal Stop binding)
if (ENABLE_STOP_HOLD_SAVE) {
	
	function resetStopProgress(context) {		
		stopSaveArmed = false
		// reset long press timer
		stopHoldStartMs = STOP_SAVE_RESET

		// TODO
		//if (!ENABLE_NUCLEAR_BLINK || !nuclear_isRecording) {
		//	resetAllRecLEDs(context)
		//}				
	}
	
	surfaceElements.transport.btnStop.mSurfaceValue.mOnProcessValueChange =
		function(context, newValue, diff) {
			var stopPressed = (newValue > 0)
			if (stopPressed) {			
				// normal STOP behavior: fire stop var
				var_stopPressed.setProcessValue(context, 1.0)
			
				// arm long press timer
				stopHoldStartMs = Date.now()
				stopSaveArmed = true
			} else {                                 
				// release stop var
				var_stopPressed.setProcessValue(context, 0.0)

				// keep the stop LED on since we're stopped
				var_stopLed.setProcessValue(context, 1.0)
								
				// reset "progress indicator" LED's
				if (stopSaveArmed) {
					resetStopProgress(context)
				}			
			}
		}	
		
		var_stopLed.mOnProcessValueChange = function (context, newValue) {
			// If we're blinking transport LEDs for SAVE confirm, don't fight the blink.
			if (saveBlink_isActive) return

			sendMidiKorg(context, TRANSPORT_MIDI_CC.Stop, newValue > 0)
		}		
}

//-----------------------------------------------------------------------------
// 4. ASSIGN FUNCTIONS - create host bindings
//-----------------------------------------------------------------------------

function assignTransportControls() {

    // https://steinbergmedia.github.io/midiremote_api_doc/examples/commandbindings

    // bind buttons to host transport events
	page.makeValueBinding(surfaceElements.transport.btnPlay.mSurfaceValue, hostTransport_Start).setTypeToggle()
	page.makeValueBinding(surfaceElements.transport.btnRecord.mSurfaceValue, hostTransport_Record).setTypeToggle()
	page.makeValueBinding(surfaceElements.transport.btnFastForward.mSurfaceValue, hostTransport_FastForward)
    page.makeValueBinding(var_rewPressed, hostTransport_Rewind)
    page.makeCommandBinding(var_RTZPressed, "Transport", "Return to Zero")    
	
	// use transport command, because mStop causes playhead to jump back
	if (ENABLE_STOP_HOLD_SAVE) {
		page.makeCommandBinding(var_stopPressed, "Transport", "Stop")	
	} else {
		page.makeCommandBinding(surfaceElements.transport.btnStop.mSurfaceValue, "Transport", "Stop")    
	}
    
    // catch STOP+REW buttons to send RTZ command, or forward single REW button command, thru custom variable
    surfaceElements.transport.btnRewind.mSurfaceValue.mOnProcessValueChange = 
        function(context, newValue, diff) {			
			var rewindPressed = newValue > 0
            var stopPressed = surfaceElements.transport.btnStop.mSurfaceValue.getProcessValue(context)
			
            if (stopPressed && rewindPressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)				
				
                var_RTZPressed.setProcessValue(context, 1.0)          // stop is also pressed.. fire an RTZ
			} else {
				var_rewPressed.setProcessValue(context, newValue)     // stop isn't pressed.. fire a normal rewind
			}			
        }        
}

function assignChannelControls() {
	for (var i = 0; i < 8; ++i) {
		var channel = hostMixerBankZone.makeMixerBankChannel()

		var fader = surfaceElements.faderStrips[i].fader.mSurfaceValue
		var pan   = surfaceElements.knobStrips[i].knob.mSurfaceValue
		var mute  = surfaceElements.faderStrips[i].btnMute.mSurfaceValue
		var solo  = surfaceElements.faderStrips[i].btnSolo.mSurfaceValue
		var rec   = surfaceElements.faderStrips[i].btnRec.mSurfaceValue

		if (ENABLE_KUSTOM_CHANNEL && i === 7) {
			// Strip 8 special behavior
			page.makeValueBinding(fader, hostMetronomeClickLevel).setValueTakeOverModeScaled()
			page.makeValueBinding(rec,   hostMetronomeActive).setTypeToggle()
			page.makeValueBinding(solo,  host_SelectedTrackChannel.mValue.mSolo).setTypeToggle()
			page.makeValueBinding(mute,  host_SelectedTrackChannel.mValue.mMute).setTypeToggle()
		} else {
			// Default mapping (tracks 1–8)
			page.makeValueBinding(fader, channel.mValue.mVolume).setValueTakeOverModeScaled()
			page.makeValueBinding(pan,   channel.mValue.mPan).setValueTakeOverModeScaled()
			page.makeValueBinding(mute,  channel.mValue.mMute).setTypeToggle()
			page.makeValueBinding(solo,  channel.mValue.mSolo).setTypeToggle()
			page.makeValueBinding(rec,   channel.mValue.mRecordEnable).setTypeToggle()
		}
	}
}

function assignZoomKnob() {
	// bind zoom commands
    page.makeCommandBinding(var_zoomIn,  'Zoom', 'Zoom In')
    page.makeCommandBinding(var_zoomOut, 'Zoom', 'Zoom Out')

	var knobZoom = surfaceElements.knobStrips[7].knob.mSurfaceValue

    page.makeValueBinding(knobZoom, var_knobZoom)
        .mOnValueChange = function(context, activeMapping, newValue, diff) {

            var newZoomValue = Math.floor(newValue * 1000)

			if (newZoomValue < lastZoomValue || newZoomValue <= 0) {
				var_zoomOut.setProcessValue(context, 1)
			} else if (newZoomValue > lastZoomValue || newZoomValue >= 1000) {
				var_zoomIn.setProcessValue(context, 1)
			}
			
            lastZoomValue = newZoomValue
        }
}

function assignSaveCommand()
{
	// this var is triggered by long press of STOP button (when "ENABLE_STOP_HOLD_SAVE" mode enabled)
	page.makeCommandBinding(var_savePressed, "File", "Save")
}

//-----------------------------------------------------------------------------
// 5. FEEDBACK EVENTS - wire DAW events to buttons/lights
//-----------------------------------------------------------------------------

function sendFeedbackOut(button, ccNr) {
	button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
		midiOutput.sendMidi(context, [0xb0, ccNr, Math.round(newValue * 127)])
	}
}

function setupFeedback() {
	sendFeedbackOut(surfaceElements.transport.btnRewind, TRANSPORT_MIDI_CC.Rewind)
	sendFeedbackOut(surfaceElements.transport.btnFastForward, TRANSPORT_MIDI_CC.FastForward)
	sendFeedbackOut(surfaceElements.transport.btnPlay, TRANSPORT_MIDI_CC.Play)
	sendFeedbackOut(surfaceElements.transport.btnCycle, TRANSPORT_MIDI_CC.Cycle)
	sendFeedbackOut(surfaceElements.transport.btnRecord, TRANSPORT_MIDI_CC.Record)

	if (!ENABLE_STOP_HOLD_SAVE) {
		sendFeedbackOut(surfaceElements.transport.btnStop, TRANSPORT_MIDI_CC.Stop)
	}
	
	for (var i = 0; i < 8; ++i) {
		sendFeedbackOut(surfaceElements.faderStrips[i].btnSolo, 32 + i)
		sendFeedbackOut(surfaceElements.faderStrips[i].btnMute, 48 + i)
		sendFeedbackOut(surfaceElements.faderStrips[i].btnRec, 64 + i)
	}
}

function sendMidiKorg(context, cc, isOn) {
    // nanoKONTROL2 LEDs: 0 = off, 127 = on
    midiOutput.sendMidi(context, [0xB0, cc, isOn ? 127 : 0])
}

function setTransportLed(context, cc, isOn) {
    if (cc === undefined) return
    sendMidiKorg(context, cc, isOn)
}

function setAllTransportLeds(context, isOn) {	
    setTransportLed(context, TRANSPORT_MIDI_CC.Rewind,      isOn)
    setTransportLed(context, TRANSPORT_MIDI_CC.FastForward, isOn)
    setTransportLed(context, TRANSPORT_MIDI_CC.Stop,        isOn)
    setTransportLed(context, TRANSPORT_MIDI_CC.Play,        isOn)
    setTransportLed(context, TRANSPORT_MIDI_CC.Record,      isOn)
}

function blinkAllTransportLEDs(context) {
    // arm the animation; actual toggling happens in mOnIdle
    saveBlink_isActive = true
    saveBlink_lastMs = SAVE_BLINK_RESET
    saveBlink_toggleCount = 0
    saveBlink_stateOn = false
}

// idle timer to handle STOP long press to save
if (ENABLE_STOP_HOLD_SAVE) {
	
	// measured this at about 10 calls per second FYI (a bit less during record)
    deviceDriver.mOnIdle = function (context, activeMapping) {
        var now = Date.now()

		// ---- SAVE CONFIRM BLINK ----
		if (saveBlink_isActive) {

			// do nothing until the next blink time interval is reached
			if (saveBlink_lastMs !== SAVE_BLINK_RESET && (now - saveBlink_lastMs) < SAVE_BLINK_INTERVAL_MS)
				return

			// time interval reached, proceed to advancing animation blink state
			saveBlink_lastMs = now
			saveBlink_stateOn = !saveBlink_stateOn

			// toggle LED's on/off depending on updated blink state
			setAllTransportLeds(context, saveBlink_stateOn)

			// reset saveBlink to inactive once we reach the end of the animation
			saveBlink_toggleCount++
			if (saveBlink_toggleCount >= SAVE_BLINK_TOGGLES) {
				saveBlink_isActive = false
				saveBlink_lastMs = SAVE_BLINK_RESET
				saveBlink_toggleCount = 0
				saveBlink_stateOn = false

				// reset "progress indicator" LED's
				//if (!ENABLE_NUCLEAR_BLINK || !nuclear_isRecording)
				//	resetAllRecLEDs(context)				
			}
		}

		// ---- STOP HOLD SAVE ----
		if (ENABLE_STOP_HOLD_SAVE && stopSaveArmed && stopHoldStartMs !== STOP_SAVE_RESET) {
			if ((now - stopHoldStartMs) >= STOP_SAVE_HOLD_MS) {
				// fire a save trigger (pulse)
				var_savePressed.setProcessValue(context, 1.0)
				var_savePressed.setProcessValue(context, 0.0)
				
				// disarm so it fires once per hold
				stopSaveArmed = false
				stopHoldStartMs = STOP_SAVE_RESET

				// blink transport LEDs to confirm
				blinkAllTransportLEDs(context)				
			//} else if (!ENABLE_NUCLEAR_BLINK || !nuclear_isRecording) {
			//	showStopHoldProgress(context, now)
			}				
		}
    }
}

//-----------------------------------------------------------------------------
// 6. MAIN SECTION - call surface/host bindings
//-----------------------------------------------------------------------------

setupFeedback()

assignTransportControls()
assignChannelControls()

if (ENABLE_STOP_HOLD_SAVE) {	
	assignSaveCommand()        // bind "save" command to STOP longpress var
}

if (ENABLE_KUSTOM_CHANNEL) {
	assignZoomKnob()           // bind zoom in/out to knob #8
}

//-----------------------------------------------------------------------------
// 7. DEVICE ON ACTIVATE
//-----------------------------------------------------------------------------

deviceDriver.mOnActivate = function (context) {
	// switchDeviceToCcModeWithExternalLed(context)
}

page.mOnActivate = function (context) {

	console.log('nanoKONTROL2 Tracking Remote page activated')

}

