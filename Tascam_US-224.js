// Tascam US-224             
// "Control your Cubase DAW like a Portastudio"    
// v2.0.0
//
// By Paul Warner
//
// NOTE: In Cubase, pressing STOP while already stopped may jump to last start position.
// For STOP+LOC undo/redo chords, we accept this as a feature: it brings you back to
// where the last take occurred before undoing.
//
// NOTE: If you run out of zoom wheel range, rotate the wheel quickly in the opposite direction
// to "grab" more travel in the desired range
//
// TODO? (tracking mode)-  STOP+REC MASTER BUTTON : Master Bus Insert On/Off


//-----------------------------------------------------------------------------
// 0. CUSTOM SETTINGS - change these CONST values to suit your own needs
//-----------------------------------------------------------------------------

// tracking mode -> true / normal mode -> false
const TRACKING_MODE = true

// 50 banks * 4 = 200 total tracks.. increase if you need more tracks
const MAX_BANK_COUNT = 50 

// if we just want to use the main controls & ignore faders.. set to true or false
const DISABLE_FADERS = false   

// nuclear LED MODE (lights all 4 red LED's for Record, in tracking mode only)
const ENABLE_NUCLEAR_BLINK = true

// hold STOP button to save 
const ENABLE_STOP_HOLD_SAVE = true

// if we want the normal jog wheel behavior to shuttle playhead instead of track select up/down
const SHUTTLE_MODE = false

// rec master button toggles selected track rec enable (tracking mode only)
const REC_ENABLE_MODE = true

// when audition is active, use jog wheel to control selected track volume
const AUDITION_VOLUME_WHEEL = true

// max number of cycle markers to toggle (cubase supports up to 9)
const CYCLE_MARKER_MAX = 8

// set this to 1 (recommended) unless you want to use multiple US-224 together on the same machine
const MAX_TASCAM_UNITS = 1

// exact port names (add/remove based on whatever MIDI device names show up on your system)
const EXACT_PORT_NAMES = [
    'US-224 Control',
    '2- US-224 Control',
    '3- US-224 Control',
    '4- US-224 Control'
]

/*
====================================================================================================
TASCAM US-224 v2.0 | MODE SUMMARY
====================================================================================================

GLOBAL COMMANDS (Both Modes):
----------------------------------------------------------------------------------------------------
STOP (Tap)             : Stop Transport
STOP (Hold 2s)         : Trigger Save (w/ red LED progress bar & confirm transport LED blink)
STOP + REW             : Return To Zero (RTZ)
REW / FF / PLAY / REC  : Standard Transport
BANK L / R             : Bank/Track Navigation

----------------------------------------------------------------------------------------------------
MODE A: TRACKING (TRACKING_MODE = true)
Focus: Performance & Speed. Locked to Tracks 1-4.
----------------------------------------------------------------------------------------------------
FADERS 1-4             : Volume for Tracks 1-4 (Fixed)
MASTER FADER           : Metronome Click Level
NULL BUTTON            : Metronome On/Off
SOLO BUTTON            : Cycle (Loop) On/Off
REC MASTER BUTTON      : Rec Enable Selected Track (REC_ENABLE_MODE) | Master Bus Insert On/Off
JOG WHEEL              : [Normal] Horizontal Zoom | [Audition] Selected Track Volume
STOP + LOC L           : Undo
STOP + LOC R           : Redo
STOP + SET             : Mute/Unmute Selected Track
BANK L / R             : Select Prev/Next Track
STOP + BANK L / R      : [Normal] Audition Prev/Next Track (Bank L/R again to clear solos)
                       : [Cycle]  Recall Prev/Next Cycle Marker
MUTE BUTTONS 1-4       : Mute On/Off for Tracks 1-4 (Fixed) (Yellow LED's)
SELECT BUTTONS 1-4     : Solo On/Off for Tracks 1-4 (Fixed) (Green LED's)
REC LEDS 1-4           : Nuclear Blink Red (Sync to Project Tempo during Record)
 
----------------------------------------------------------------------------------------------------
MODE B: NORMAL (TRACKING_MODE = false)
Focus: Full Mixer Control. Bank-aware.
----------------------------------------------------------------------------------------------------
FADERS 1-4             : Track Volume for Active Bank
NULL BUTTON            : Toggle Null Mode (Swaps Master Fader & Jog behavior)
SOLO BUTTON            : Toggle Solo Mode (Swaps Mute/Select behavior)
BANK L / R             : Shift Active Bank (Groups of 4)
REC MASTER BUTTON      : [Normal] Master Insert On/Off | [Null Mode] Metronome On/Off
MASTER FADER           : [Normal] Stereo Out           | [Null Mode] FX Return 1
JOG WHEEL              : [Normal] Shuttle/Track Select | [Null Mode] Horizontal Zoom
MUTE BUTTONS 1-4       : [Normal] Mute                 | [Solo Mode] Solo
MUTE LEDS 1-4          : [Normal] Mute                 | [Solo Mode] Solo
SELECT BUTTONS 1-4     : [Normal] Record Enable        | [Solo Mode] Select/Focus
SELECT LEDS 1-4        : Track Select Focus        (Current Bank, both modes)
REC LEDS 1-4           : Record Enable On/Off      (Current Bank, both modes)
====================================================================================================
*/

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('Tascam', 'US-224', 'Paul Warner')

// create objects that represent the midi ports of the hardware
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

// detect default MIDI port for TASCAM USB device
if (MAX_TASCAM_UNITS == 1) {
    deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
        .expectInputNameContains('US-224 Control')
        .expectOutputNameContains('US-224 Control')  
} else {	
	for (var i = 0; i < EXACT_PORT_NAMES.length; i++) {
		deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
			.expectInputNameEquals(EXACT_PORT_NAMES[i])
			.expectOutputNameEquals(EXACT_PORT_NAMES[i])				
	}
}

//-----------------------------------------------------------------------------
// TASCAM DEVICE CONSTANTS - device codes for MIDI messages
//-----------------------------------------------------------------------------

// TASCAM MIDI command codes for transport
const TRANSPORT_LED_COMMANDS = {
    Rewind: 0x13,
    FastForward: 0x14,
    Stop: 0x15,
    Play: 0x16,
    Record: 0x17
}

// TASCAM MIDI command codes for LED on/off
const LED_STATES = {
    On: 0x7F,  
    Off: 0x00
}   

// TASCAM MIDI command codes
const TASCAM_MIDI_BEGIN = [0xF0, 0x4E, 0x0, 0x12]    // Third value 0x0 is the default unit (device) number
const TASCAM_MIDI_END = 0xF7
const TASCAM_TRANSPORT_LED = 0x01
const TASCAM_MUTE_LED = 0x02
const TASCAM_SELECT_LED = 0x03
const TASCAM_REC_LED = 0x04
const TASCAM_NULL_LED = 0x05
const TASCAM_SOLO_LED = 0x06
const TASCAM_BANK_LEFT_LED = 0x07
const TASCAM_BANK_RIGHT_LED = 0x08

// device constants
const BANK_SIZE = 4
const TOTAL_TRACK_COUNT = BANK_SIZE * MAX_BANK_COUNT     
const MASTER_FADER_SCALE = 0.75              // 0.75 sets the max range of the fader to 0dB, 1.0 is full range

//-----------------------------------------------------------------------------
// STATE VARIABLES - custom control
//-----------------------------------------------------------------------------

// selected bank (normal mode)
var selectedBank = 0

// cycle markers (tracking mode)
var activeCycleMarker = 1

// mirror value to track if cycle is on/off (tracking mode)
var cycleButtonActive = false

if (TRACKING_MODE && ENABLE_NUCLEAR_BLINK) {
	// nuclear LED tempo mode vars
	const NUCLEAR_BLINK_RESET = -1
	const DEFAULT_BLINK_MS = 500
	const MINIMUM_BLINK_MS = 150
	var nuclear_tempoBpm = 60000 / DEFAULT_BLINK_MS
	var nuclear_msPerBeat = DEFAULT_BLINK_MS
	var nuclear_isRecording = false
	var nuclear_blinkState = false
	var nuclear_lastBlinkMs = NUCLEAR_BLINK_RESET
}

if (TRACKING_MODE) {	
	var auditionActive = false
	const AUDITION_SOLO_DELAY_MS = 250
	const AUDITION_SOLO_RESET = 0		
	var auditionSoloDueMs = AUDITION_SOLO_RESET	
}

if (ENABLE_STOP_HOLD_SAVE) {
	// long press STOP to save vars
	const STOP_SAVE_HOLD_MS = 2000
	const STOP_SAVE_PREDELAY_MS = 500
	const STOP_SAVE_RESET = -1
	var stopHoldStartMs = STOP_SAVE_RESET
	var stopSaveArmed = false		
	
	// save LED blink vars
	const SAVE_BLINK_RESET = -1
	const SAVE_BLINK_INTERVAL_MS = 150
	const SAVE_BLINK_TOGGLES = 6                // 6 toggles = 3 full blinks
	var saveBlink_isActive = false
	var saveBlink_lastMs = SAVE_BLINK_RESET
	var saveBlink_toggleCount = 0
	var saveBlink_stateOn = false	
}

//-----------------------------------------------------------------------------
// 2a. SURFACE LAYOUT - create control elements
//-----------------------------------------------------------------------------

// transport
var btnRewind = deviceDriver.mSurface.makeButton(0.0, 2.0, 2.0, 2.0)
var btnFastForward = deviceDriver.mSurface.makeButton(2.0, 2.0, 2.0, 2.0)
var btnStop = deviceDriver.mSurface.makeButton(4.0, 2.0, 2.0, 2.0)
var btnPlay = deviceDriver.mSurface.makeButton(6.0, 2.0, 2.0, 2.0)
var btnRecord = deviceDriver.mSurface.makeButton(8.0, 2.0, 2.0, 2.0)

// locators
var btnLocateLeft = deviceDriver.mSurface.makeButton(0.0, 0.0, 2.0, 1.0)
var btnLocateRight = deviceDriver.mSurface.makeButton(2.0, 0.0, 2.0, 1.0)
var btnLocateSet = deviceDriver.mSurface.makeButton(4.0, 0.0, 2.0, 1.0)

// bank buttons
var btnBankLeft = deviceDriver.mSurface.makeButton(6.0, 0.0, 2.0, 1.0)
var btnBankRight = deviceDriver.mSurface.makeButton(8.0, 0.0, 2.0, 1.0)

// null/metronome
var btnNull = deviceDriver.mSurface.makeButton(2.0, 8.0, 2.0, 1.0)

// jogwheel
var knobJogWheel = deviceDriver.mSurface.makeKnob(4.0, 6.0, 4.0, 4.0)

// master slot buttons
var btnSoloEnable = deviceDriver.mSurface.makeButton(9.0, 12.0, 2.0, 1.0)
var btnRecMaster = deviceDriver.mSurface.makeButton(9.0, 14.0, 2.0, 1.0)

// mute buttons
var btnMutes = []
btnMutes[0] = deviceDriver.mSurface.makeButton(0.0, 12.0, 2.0, 1.0)
btnMutes[1] = deviceDriver.mSurface.makeButton(2.0, 12.0, 2.0, 1.0)
btnMutes[2] = deviceDriver.mSurface.makeButton(4.0, 12.0, 2.0, 1.0)
btnMutes[3] = deviceDriver.mSurface.makeButton(6.0, 12.0, 2.0, 1.0)

if (! TRACKING_MODE) {
	// record enable buttons
	var btnRecs = []
	btnRecs[0] = deviceDriver.mSurface.makeButton(0.0, 14.0, 2.0, 1.0)
	btnRecs[1] = deviceDriver.mSurface.makeButton(2.0, 14.0, 2.0, 1.0)
	btnRecs[2] = deviceDriver.mSurface.makeButton(4.0, 14.0, 2.0, 1.0)
	btnRecs[3] = deviceDriver.mSurface.makeButton(6.0, 14.0, 2.0, 1.0)

	// select buttons (dummy buttons to hold track select LED state only)
	var btnSelectsDummy = []
	btnSelectsDummy[0] = deviceDriver.mSurface.makeButton(0.0, 18.0, 2.0, 1.0)
	btnSelectsDummy[1] = deviceDriver.mSurface.makeButton(2.0, 18.0, 2.0, 1.0)
	btnSelectsDummy[2] = deviceDriver.mSurface.makeButton(4.0, 18.0, 2.0, 1.0)
	btnSelectsDummy[3] = deviceDriver.mSurface.makeButton(6.0, 18.0, 2.0, 1.0)
} else {
	// select buttons (actual buttons for track solo)
	var btnSelects = []
	btnSelects[0] = deviceDriver.mSurface.makeButton(0.0, 18.0, 2.0, 1.0)
	btnSelects[1] = deviceDriver.mSurface.makeButton(2.0, 18.0, 2.0, 1.0)
	btnSelects[2] = deviceDriver.mSurface.makeButton(4.0, 18.0, 2.0, 1.0)
	btnSelects[3] = deviceDriver.mSurface.makeButton(6.0, 18.0, 2.0, 1.0)

	// dummy button to control selected track mute/unmute
	var btnDummySelectedMute = deviceDriver.mSurface.makeButton(2.0, 6.0, 2.0, 1.0)
	
	// dummy button to control selected track rec enable
	var btnDummySelectedRecEnable = deviceDriver.mSurface.makeButton(2.0, 7.0, 2.0, 1.0)
}

// channel faders
var fdrFaders = []
fdrFaders[0] = deviceDriver.mSurface.makeFader(0.0, 16.0, 2.0, 3.0)
fdrFaders[1] = deviceDriver.mSurface.makeFader(2.0, 16.0, 2.0, 3.0)
fdrFaders[2] = deviceDriver.mSurface.makeFader(4.0, 16.0, 2.0, 3.0)
fdrFaders[3] = deviceDriver.mSurface.makeFader(6.0, 16.0, 2.0, 3.0)

// master fader
var fdrMasterFader = deviceDriver.mSurface.makeFader(9.0, 16.0, 2.0, 3.0)

// labels
var lblJogWheel = deviceDriver.mSurface.makeLabelField(4.0, 10.2, 4.0, 0.8)

//-----------------------------------------------------------------------------
// 2b. SURFACE LAYOUT - midi bindings
//-----------------------------------------------------------------------------

// bind any button to MIDI
function bindButtonToMIDI(button, midi_CC) {
    button.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
    //  .setOutputPort(midiOutput)
        .bindToControlChange(15, midi_CC) // channel 15
}

// bind any knob to MIDI
function bindKnobToMIDI(knob, midi_CC) {
    knob.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
    //  .setOutputPort(midiOutput)
        .bindToControlChange(15, midi_CC) // channel 15
        .setTypeRelativeTwosComplement()
}

// bind any fader to MIDI
function bindFaderToMIDI(fader, midi_CC) {
    fader.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
    //  .setOutputPort(midiOutput)
        .bindToControlChange(15, midi_CC) // channel 15
}

// transport MIDI bindings
bindButtonToMIDI(btnRewind, 19)
bindButtonToMIDI(btnFastForward, 20)
bindButtonToMIDI(btnStop, 21)
bindButtonToMIDI(btnPlay, 22)
bindButtonToMIDI(btnRecord, 23)

// locator MIDI bindings
bindButtonToMIDI(btnLocateLeft, 24)
bindButtonToMIDI(btnLocateRight, 25)
bindButtonToMIDI(btnLocateSet, 26)

// bank buttons MIDI bindings
bindButtonToMIDI(btnBankLeft, 16)
bindButtonToMIDI(btnBankRight, 17)

// null button MIDI binding
bindButtonToMIDI(btnNull, 40)

// jog wheel MIDI binding
bindKnobToMIDI(knobJogWheel, 96)

// master slot buttons MIDI bindings
bindButtonToMIDI(btnSoloEnable, 42)
bindButtonToMIDI(btnRecMaster, 41)

// channel slot buttons MIDI bindings
for (var slot=0; slot<4; slot++) {
    bindButtonToMIDI(btnMutes[slot], 0 + slot)      // cc 0-3
    bindFaderToMIDI(fdrFaders[slot], 64 + slot)     // cc 64-67

    if (!TRACKING_MODE) {
        // NORMAL MODE: SELECT presses act as "REC enable" buttons
        bindButtonToMIDI(btnRecs[slot], 32 + slot)  // cc 32-35
    } else {
        // TRACKING MODE: SELECT presses are real "SELECT" buttons (solo)
        bindButtonToMIDI(btnSelects[slot], 32 + slot) // cc 32-35
    }
}

// master fader MIDI binding
bindFaderToMIDI(fdrMasterFader, 75)

//-----------------------------------------------------------------------------
// 2c. FEEDBACK EVENTS - wire DAW events to buttons/lights
//-----------------------------------------------------------------------------

function sendMidiTascam(context, message) {
    for (var i = 0; i < MAX_TASCAM_UNITS; i++) {        
		// copy the code template        
		var begin_code = TASCAM_MIDI_BEGIN.slice()
		
		// embed specific unit number into tascam MIDI code sequence
		begin_code[2] = i                            
		
        midiOutput.sendMidi(
            context,
            begin_code.concat(message).concat([TASCAM_MIDI_END])
        )
    }
}

function makeTransportDisplayFeedback(buttonSurfaceValue, commandID) {    
    buttonSurfaceValue.mOnProcessValueChange = function (context, newValue) {
        var ledState = newValue > 0 ? LED_STATES.On : LED_STATES.Off;
        sendMidiTascam(context, [TASCAM_TRANSPORT_LED, commandID, ledState])
				
        if (!TRACKING_MODE) return
		if (!ENABLE_NUCLEAR_BLINK) return
		
		return  // "always on" below is unused, since we are blinking now instead 
		
        // RECORD lights all 4 red REC LEDs
        if (commandID === TRANSPORT_LED_COMMANDS.Record) {       
            for (var slot = 0; slot < BANK_SIZE; slot++) {
                sendMidiTascam(context, [TASCAM_REC_LED, slot, ledState])
            }
        }				
    }
}

function setTransportLed(context, commandID, isOn) {
    sendMidiTascam(context, [TASCAM_TRANSPORT_LED, commandID, isOn ? LED_STATES.On : LED_STATES.Off])
}

function setAllTransportLeds(context, isOn) {	
    setTransportLed(context, TRANSPORT_LED_COMMANDS.Rewind,      isOn)
    setTransportLed(context, TRANSPORT_LED_COMMANDS.FastForward, isOn)
    setTransportLed(context, TRANSPORT_LED_COMMANDS.Play,        isOn)
    setTransportLed(context, TRANSPORT_LED_COMMANDS.Record,      isOn)
}

function blinkAllTransportLEDs(context) {
    // arm the animation; actual toggling happens in mOnIdle
    saveBlink_isActive = true
    saveBlink_lastMs = SAVE_BLINK_RESET
    saveBlink_toggleCount = 0
    saveBlink_stateOn = false
}

function forceFaderPositionsDump(context, channelStripNum) {
    // (Unused) Forces US-224 to send current fader position messages to host 
    // DUMP_FADER_POS:  F0 4E<UNIT> 12 10<STRIP #> <STATE> F7 
    // Note: <STRIP #>is a number in the range [0..3], corresponding to the
    // channel-strip #, and <STATE>is either 0x00 (LED OFF) or 0x7F (LED ON)
    sendMidiTascam(context, [0x10, channelStripNum])
}

function displayMuteLED(context, channelSlot, bankNum, isEnabled) {
    if (selectedBank != bankNum) return     // do not alter LED's for non-visible channels
    
    sendMidiTascam(context, [TASCAM_MUTE_LED, channelSlot,
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displayRecLED(context, channelSlot, bankNum, isEnabled) {
    if (selectedBank != bankNum) return     // do not alter LED's for non-visible channels

    sendMidiTascam(context, [TASCAM_REC_LED, channelSlot, 
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displaySelectLED(context, channelSlot, bankNum, isEnabled) {    
    if (selectedBank != bankNum) return     // do not alter LED's for non-visible channels

    sendMidiTascam(context, [TASCAM_SELECT_LED, channelSlot, 
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displayBankLeftLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_BANK_LEFT_LED, ledState])
}

function displayBankRightLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_BANK_RIGHT_LED, ledState])
}

function displaySoloLED(context) {    
    var ledState = isSoloModeEnabled(context) ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_SOLO_LED, ledState])
}

function displayCycleOnSoloLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_SOLO_LED, ledState])
}

function displayNullLED(context) {    
    var isEnabled = var_nullModeOn.getProcessValue(context)

    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_NULL_LED, ledState])
}

function displayMetronomeNullLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_NULL_LED, ledState])
}

function resetAllRecLEDs(context) {
	for (var slot=0; slot<BANK_SIZE; slot++)
		displayRecLED(context, slot, 0, false)	
}

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// create at least one mapping page
var page = deviceDriver.mMapping.makePage('Tascam US-224 Mixer Page')

// create a host mTimeDisplay reference for nuclear LED mode
var hostTimeDisplay = page.mHostAccess.mTransport.mTimeDisplay

// create host mixer zone for main channel section (should include audio and group channels)
var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels()
    .excludeSamplerChannels()
    .excludeVCAChannels() 

// build array of TOTAL_TRACK_COUNT host mixer bank channel items for main channel section
var hostChannelBank = makeNewHostChannelBank()

// create host accessing objects
var hostTransport_Rewind = page.mHostAccess.mTransport.mValue.mRewind
var hostTransport_FastForward = page.mHostAccess.mTransport.mValue.mForward
var hostTransport_Stop = page.mHostAccess.mTransport.mValue.mStop    // unused (instead using a transport command for STOP to avoid playhead jump-back)
var hostTransport_Start = page.mHostAccess.mTransport.mValue.mStart
var hostTransport_Record = page.mHostAccess.mTransport.mValue.mRecord
var host_MetronomeActive = page.mHostAccess.mTransport.mValue.mMetronomeActive
var host_CycleActive = page.mHostAccess.mTransport.mValue.mCycleActive
var host_SelectPrevTrack = page.mHostAccess.mTrackSelection.mAction.mPrevTrack
var host_SelectNextTrack = page.mHostAccess.mTrackSelection.mAction.mNextTrack
var host_SelectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
var host_SelectedMute = host_SelectedTrackChannel.mValue.mMute
var host_SelectedRecEnable = host_SelectedTrackChannel.mValue.mRecordEnable
var host_SelectedVolume = host_SelectedTrackChannel.mValue.mVolume

// create label texts onto the page
page.setLabelFieldText(lblJogWheel, TRACKING_MODE ? 'Zoom' : 'Shuttle/Zoom')

// create custom vars on host for NULL mode switching
var var_nullModeOn = deviceDriver.mSurface.makeCustomValueVariable("Null Mode On")
var var_nullModeOff = deviceDriver.mSurface.makeCustomValueVariable("Null Mode Off")

// create custom vars on host for SOLO mode switching
var var_soloModeOn = deviceDriver.mSurface.makeCustomValueVariable("Solo Mode On")
var var_soloModeOff = deviceDriver.mSurface.makeCustomValueVariable("Solo Mode Off")

// create custom vars to intercept simultaneous button presses for STOP+REW = RTZ
var var_rewPressed = deviceDriver.mSurface.makeCustomValueVariable("REW Pressed")
var var_RTZPressed = deviceDriver.mSurface.makeCustomValueVariable("RTZ Pressed")

if (TRACKING_MODE) {
	// locator button vars (tracking mode only)
	var var_locLeftPressed  = deviceDriver.mSurface.makeCustomValueVariable("LOC Left Pressed")
	var var_locRightPressed = deviceDriver.mSurface.makeCustomValueVariable("LOC Right Pressed")
	var var_locSetPressed = deviceDriver.mSurface.makeCustomValueVariable("LOC Set Pressed")

	// STOP chords locator button vars (tracking mode only)
	var var_undoPressed = deviceDriver.mSurface.makeCustomValueVariable("Undo Pressed")
	var var_redoPressed = deviceDriver.mSurface.makeCustomValueVariable("Redo Pressed")	
	var var_muteSelectedPressed = deviceDriver.mSurface.makeCustomValueVariable("Mute Selected Pressed")

	// BANK forward triggers (tracking mode only) (we fire these to manually trigger track nav)
	var var_selectPrevTrack  = deviceDriver.mSurface.makeCustomValueVariable("Select Prev Track")
	var var_selectNextTrack = deviceDriver.mSurface.makeCustomValueVariable("Select Next Track")
	
	// create custom vars for audition actions
	var var_auditionKillSolos = deviceDriver.mSurface.makeCustomValueVariable("Audition Kill Solos")
	var var_auditionSoloSelected = deviceDriver.mSurface.makeCustomValueVariable("Audition Solo Selected")	
	
	// mirror var to hold the state of host_CycleActive
	var var_cycleActiveMirror = deviceDriver.mSurface.makeCustomValueVariable("Cycle Active Mirror")

	// cycle marker command bindings | 1-based array: var_cycleMarkers[1]..[9]
	var var_cycleMarkers = new Array(CYCLE_MARKER_MAX + 1) 	
}

if (ENABLE_STOP_HOLD_SAVE) {
	// long press STOP to save vars
	var var_stopPressed = deviceDriver.mSurface.makeCustomValueVariable("Stop Pressed")
	var var_savePressed = deviceDriver.mSurface.makeCustomValueVariable("Save Pressed")
}

// dummy host vars to bind bank button triggers
var var_bankLeftPressed = page.mCustom.makeHostValueVariable("Bank Left Pressed")
var var_bankRightPressed = page.mCustom.makeHostValueVariable("Bank Right Pressed")

// create custom vars for jog shuttle left/right
var var_JogShuttleLeft = deviceDriver.mSurface.makeCustomValueVariable("Jog Shuttle Left")
var var_JogShuttleRight = deviceDriver.mSurface.makeCustomValueVariable("Jog Shuttle Right")
var lastShuttleValue = -1

// custom custom vars for jogwheel zoom/volume
var var_knobJogWheel = page.mCustom.makeHostValueVariable("Jogwheel Position")
var var_zoomIn = deviceDriver.mSurface.makeCustomValueVariable("Zoom In")
var var_zoomOut = deviceDriver.mSurface.makeCustomValueVariable("Zoom Out")
var lastZoomValue = -1

//-----------------------------------------------------------------------------
// 4. SUBPAGES - *note! the order created matters- first one is open by default
//-----------------------------------------------------------------------------

// create RecMaster button NULL mode subpage area
var area_RecMasterButtonSubPages = page.makeSubPageArea('RecMaster Button Subpage Area')

// create RecMaster NULL modes subpage
var subpage_RecMasterNormalMode = area_RecMasterButtonSubPages.makeSubPage('RecMaster Normal Mode') 
var subpage_RecMasterNullMode = area_RecMasterButtonSubPages.makeSubPage('RecMaster Null Mode')

// create locators buttons NULL mode subpage area
var area_LocatorButtonsSubPages = page.makeSubPageArea('Locator Buttons Subpage Area')

// create locators NULL modes subpage
var subpage_LocatorsNormalMode = area_LocatorButtonsSubPages.makeSubPage('Locator Buttons Normal Mode') 
var subpage_LocatorsNullMode = area_LocatorButtonsSubPages.makeSubPage('Locator Buttons Null Mode')

// create aux mode buttons subpage area
var area_NullButtonSubPages = page.makeSubPageArea('NULL Button Subpage Area')

// create aux assign modes subpage
var subpage_NullNormalMode = area_NullButtonSubPages.makeSubPage('NULL Normal Mode') 
var subpage_NullAssignMode = area_NullButtonSubPages.makeSubPage('NULL Assign Mode')

// create fader bank subpages
var area_FaderBankSubPages = page.makeSubPageArea('Fader Banks Subpage Area')
var subpage_FaderBank = makeBankSubPages(area_FaderBankSubPages, 'Fader Bank')

// create selected LED bank subpages
var area_SelectedLEDSubPages = page.makeSubPageArea('Selected LED Subpage Area')
var subpage_SelectedLEDBank = makeBankSubPages(area_SelectedLEDSubPages, 'Selected LED Bank')

// create rec enable bank subpages
var area_RecEnableBankSubPages = page.makeSubPageArea('Rec Enable Subpage Area')
var subpage_SelectEnableBank = makeBankSubPages(area_RecEnableBankSubPages, 'Select Enable Bank')
var subpage_RecEnableBank = makeBankSubPages(area_RecEnableBankSubPages, 'Rec Enable Bank')

// create mute/solo bank subpages
var area_MuteSoloBankSubPages = page.makeSubPageArea('Mute/Solo Subpage Area')
var subpage_MuteBank = makeBankSubPages(area_MuteSoloBankSubPages, 'Mute Bank')
var subpage_SoloEnableBank = makeBankSubPages(area_MuteSoloBankSubPages, 'Solo Enable Bank')

// create jogwheel zoom/volume mode subpages
var area_JogwheelSubPages = page.makeSubPageArea('Jogwheel Subpage Area')
var subpage_JogwheelZoomMode = area_JogwheelSubPages.makeSubPage('Jogwheel Zoom Mode')

if (TRACKING_MODE && AUDITION_VOLUME_WHEEL) {
	var subpage_JogwheelVolumeMode = area_JogwheelSubPages.makeSubPage('Jogwheel Track Volume Mode')
}

function makeBankSubPages(area, name) {
    var subpages = []

    for (var bankNum=0; bankNum<MAX_BANK_COUNT; bankNum++) {
        subpages[bankNum] = area.makeSubPage('Bank_' + bankNum + '_' + name)
    }

    return subpages
}

function makeNewHostChannelBank() {
    var hostBankAll = []
    for (var i=0; i<TOTAL_TRACK_COUNT; i++) { 
        hostBankAll.push(hostMixerBankZone.makeMixerBankChannel()) 
    }
    return hostBankAll;
}

function isSoloModeEnabled(context) {
    return var_soloModeOn.getProcessValue(context) 
}

function isNullModeEnabled(context) {
    return var_nullModeOn.getProcessValue(context) 
}

function initCustomHostVars(context) {
    // initialize assign mode to off
    var_nullModeOn.setProcessValue(context, 0)
    var_nullModeOff.setProcessValue(context, 1)

    // initialize solo mode to off
    var_soloModeOn.setProcessValue(context, 0)
    var_soloModeOff.setProcessValue(context, 1)
}

//-----------------------------------------------------------------------------
// CYCLE FUNCTIONS - helpers for navigating cycle markers
//-----------------------------------------------------------------------------

function setupCycleMarkerCommands() {
	for (var i = 1; i <= CYCLE_MARKER_MAX; i++) {
		var_cycleMarkers[i] = deviceDriver.mSurface.makeCustomValueVariable("Cycle Marker " + i)
		page.makeCommandBinding(var_cycleMarkers[i], "Transport", "Recall Cycle Marker " + i)
	}
}

function wrapCycleNumber(n) {
	if (n < 1) return CYCLE_MARKER_MAX     // (Cubase cycle markers are 1-based)
	if (n > CYCLE_MARKER_MAX) return 1
	return n
}

function fireCycleRecall(context, number) {
	var v = var_cycleMarkers[number]
	if (!v) return	
	v.setProcessValue(context, 1.0)
	v.setProcessValue(context, 0.0)
}

function recallPrevCycle(context) {
	activeCycleMarker = wrapCycleNumber(activeCycleMarker - 1)
	fireCycleRecall(context, activeCycleMarker)
}

function recallNextCycle(context) {
	activeCycleMarker = wrapCycleNumber(activeCycleMarker + 1)
	fireCycleRecall(context, activeCycleMarker)
}

//-----------------------------------------------------------------------------
// 5. ASSIGN FUNCTIONS - create host bindings
//-----------------------------------------------------------------------------

function assignBankButtonControls_BankSelect() {
    // bind bank left button to prev bank selection    
    page.makeValueBinding(btnBankLeft.mSurfaceValue, var_bankLeftPressed).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isBankLeftPressed = newValue > 0              
            displayBankLeftLED(context, isBankLeftPressed)
            
			if (isBankLeftPressed && selectedBank > 0) {
                selectedBank--
                triggerBankSwitch(context, activeMapping, selectedBank)
            }
        }

    // bind bank right button to next bank selection
    page.makeValueBinding(btnBankRight.mSurfaceValue, var_bankRightPressed).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isBankRightPressed = newValue > 0
            displayBankRightLED(context, isBankRightPressed)

            if (isBankRightPressed && selectedBank < (MAX_BANK_COUNT-1)) {
                selectedBank++
                triggerBankSwitch(context, activeMapping, selectedBank)
            }
        }    
}

function triggerBankSwitch(context, activeMapping, bankNum) {
    subpage_FaderBank[bankNum].mAction.mActivate.trigger(activeMapping)
    subpage_SelectedLEDBank[bankNum].mAction.mActivate.trigger(activeMapping)
    
    if (isSoloModeEnabled(context)) {
        subpage_SoloEnableBank[bankNum].mAction.mActivate.trigger(activeMapping)                      
        subpage_RecEnableBank[bankNum].mAction.mActivate.trigger(activeMapping) 
    } else {
        subpage_MuteBank[bankNum].mAction.mActivate.trigger(activeMapping)                
        subpage_SelectEnableBank[bankNum].mAction.mActivate.trigger(activeMapping) 
    }        
}

function assignBankButtonControls_TrackSelect() {
	page.makeActionBinding(var_selectPrevTrack, host_SelectPrevTrack)
	page.makeActionBinding(var_selectNextTrack, host_SelectNextTrack)	
	
    // bind bank left button to multiple possible controls
	page.makeValueBinding(btnBankLeft.mSurfaceValue, var_bankLeftPressed).mOnValueChange =
		function (context, activeMapping, newValue, diff) {	
            var isBankPressed = newValue > 0              
			var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0			
					
            displayBankLeftLED(context, isBankPressed)

			if (isBankPressed && stopPressed && cycleButtonActive) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)

				// special chord behavior when cycle light is on
				recallPrevCycle(context)
				
				// exit, don't track nav during cycle recall
				return
			} else if (isBankPressed && stopPressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)				

				// enter/continue audition track select mode
				auditionSelectedTrack(context, activeMapping)
			} else if (isBankPressed && !stopPressed && auditionActive) {
				// exit audition track select mode when stop button is released
				auditionExit(context, activeMapping)				
			}
			
			// forward button state to normal prev-track navigation (when no cycle override occurred)
			var_selectPrevTrack.setProcessValue(context, newValue)	
        }

    // bind bank right button to multiple possible controls
	page.makeValueBinding(btnBankRight.mSurfaceValue, var_bankRightPressed).mOnValueChange =
		function (context, activeMapping, newValue, diff) {		
            var isBankPressed = newValue > 0              
			var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0			
			
            displayBankRightLED(context, isBankPressed)
			
			if (isBankPressed && stopPressed && cycleButtonActive) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)

				// special chord behavior when cycle light is on
				recallNextCycle(context)
				
				// exit, don't track nav during cycle recall				
				return
			} else if (isBankPressed && stopPressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)				

				// enter/continue audition track select mode
				auditionSelectedTrack(context, activeMapping)
			} else if (isBankPressed && !stopPressed && auditionActive) {
				// exit audition track select mode when stop button is released
				auditionExit(context, activeMapping)		
			}

			// forward button state to normal next-track navigation (when no cycle override occurred)
			var_selectNextTrack.setProcessValue(context, newValue)				
        }    
}

function assignAuditionCommands() {
    page.makeCommandBinding(var_auditionKillSolos, "Edit", "Deactivate All Solo")
    page.makeCommandBinding(var_auditionSoloSelected, "Edit", "Solo")
}

function pulseVar(context, v) {
    v.setProcessValue(context, 1.0)
    v.setProcessValue(context, 0.0)
}

function auditionExit(context, activeMapping) {
	auditionActive = false

	// deactivate all solos				
	pulseVar(context, var_auditionKillSolos)	

	// reset timer to ensure any previously queued solo's are cancelled
    auditionSoloDueMs = AUDITION_SOLO_RESET

	if (AUDITION_VOLUME_WHEEL) {
		// trigger zoom wheel subpage
		subpage_JogwheelZoomMode.mAction.mActivate.trigger(activeMapping)	
	}
}

function auditionSelectedTrack(context, activeMapping) {
	auditionActive = true

	// deactivate all solos				
    pulseVar(context, var_auditionKillSolos)
	
    // schedule solo slightly later during .onIdle() so Cubase has some time to finish track selection
    auditionSoloDueMs = Date.now() + AUDITION_SOLO_DELAY_MS

	if (AUDITION_VOLUME_WHEEL) {
		// trigger track volume wheel subpage
		subpage_JogwheelVolumeMode.mAction.mActivate.trigger(activeMapping)
	}
}

function assignSoloEnableButton(bankNum) {
    page.makeActionBinding(btnSoloEnable.mSurfaceValue, subpage_MuteBank[bankNum].mAction.mActivate)
        .setSubPage(subpage_SoloEnableBank[bankNum]).mOnValueChange = 
            function(context, activeMapping, newValue, diff) {
                if(newValue > 0) {
                    // button pressed (ignore button release)
                    toggleSoloModeVars(context)           
                    
                    subpage_SelectEnableBank[bankNum].mAction.mActivate.trigger(activeMapping)     
                }
            }.bind({bankNum})

    page.makeActionBinding(btnSoloEnable.mSurfaceValue, subpage_SoloEnableBank[bankNum].mAction.mActivate)
        .setSubPage(subpage_MuteBank[bankNum]).mOnValueChange = 
            function(context, activeMapping, newValue, diff) {
                if(newValue > 0) {
                    // button pressed (ignore button release)
                    toggleSoloModeVars(context) 
                    
                    subpage_RecEnableBank[bankNum].mAction.mActivate.trigger(activeMapping)                                        
                }
            }.bind({bankNum})
}

function assignSoloBank_Single() {
    for (var slot=0; slot<BANK_SIZE; slot++) {
        var hostChannel = getHostChannel(0, slot)

        // SELECT toggles SOLO
        page.makeValueBinding(btnSelects[slot].mSurfaceValue, hostChannel.mValue.mSolo)
            .setTypeToggle()

        // SOLO state drives SELECT LED
        hostChannel.mValue.mSolo.mOnProcessValueChange =
            function(context, activeMapping, newValue) {
                displaySelectLED(context, this.slot, 0, newValue > 0)
            }.bind({ slot: slot })
    }
}

function assignChannelBanks_Multi() {
    // assign MAX_BANK_COUNT banks of BANK_SIZE faders
    for (var bankNum = 0; bankNum < MAX_BANK_COUNT; bankNum++) {
        assignChannelBank(bankNum)
    }    
}

function assignChannelBank(bankNum) {    
    assignFaderBank(bankNum)
    assignSelectedLEDBank(bankNum)
    assignRecEnableBank(bankNum)
    assignSelectEnableBank(bankNum)
    assignMuteBank(bankNum)
    assignSoloEnableBank(bankNum)
    assignSoloEnableButton(bankNum)
}

function assignMuteBank_Single() {    
    assignFaderBank(0)
    assignMuteBank(0)
}

function assignFaderBank(bankNum) {  
    // if we just want to use the main controls, we won't accidentally alter the mix.. bypass the Fader Bank bindings  
    if (DISABLE_FADERS) return  

    for (var slot=0; slot<BANK_SIZE; slot++)
    {       
        // reference host channel from main array     
        var hostChannel = getHostChannel(bankNum, slot)

        // bind channel bank faders to host subpage events
        page.makeValueBinding(fdrFaders[slot].mSurfaceValue, hostChannel.mValue.mVolume)
            .setValueTakeOverModeScaled()
            .setSubPage(subpage_FaderBank[bankNum])
    }
}

function assignSelectedLEDBank(bankNum) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(bankNum, slot)

        // bind channel bank selected channels to host subpage events
        page.makeValueBinding(btnSelectsDummy[slot].mSurfaceValue, hostChannel.mValue.mSelected)
            .setTypeToggle()
            .setSubPage(subpage_SelectedLEDBank[bankNum])

        // bind select LED's to host events per bank/slot
        hostChannel.mValue.mSelected.mOnProcessValueChange = 
            function(context, activeMapping, newValue) {                 
                var isEnabled = newValue > 0
                displaySelectLED(context, this.slot, this.bankNum, isEnabled)
            }.bind({slot, bankNum})     
    }
}

function assignRecEnableBank(bankNum) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(bankNum, slot)

        // bind channel bank rec enables to host subpage events
        page.makeValueBinding(btnRecs[slot].mSurfaceValue, hostChannel.mValue.mRecordEnable)
            .setTypeToggle()
            .setSubPage(subpage_RecEnableBank[bankNum])

        // bind record LED's to host events per bank/slot
        hostChannel.mValue.mRecordEnable.mOnProcessValueChange = 
            function(context, activeMapping, newValue) { 
                var isEnabled = newValue > 0
                displayRecLED(context, this.slot, this.bankNum, isEnabled)
            }.bind({slot, bankNum})         
    }
}

function assignSelectEnableBank(bankNum) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(bankNum, slot)

        // bind channel bank rec enables to host subpage events
        page.makeValueBinding(btnRecs[slot].mSurfaceValue, hostChannel.mValue.mSelected)
            .setTypeToggle()
            .setSubPage(subpage_SelectEnableBank[bankNum])     
    }
}

function assignMuteBank(bankNum) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(bankNum, slot)

        // bind channel bank rec enables to host subpage events
        page.makeValueBinding(btnMutes[slot].mSurfaceValue, hostChannel.mValue.mMute)
            .setTypeToggle()
            .setSubPage(subpage_MuteBank[bankNum])

        // bind record LED's to host events per bank/slot
        hostChannel.mValue.mMute.mOnProcessValueChange = 
            function(context, activeMapping, newValue) { 
                // do not alter mute LED's in solo mode                
                if (isSoloModeEnabled(context)) return

                var isEnabled = newValue > 0
                displayMuteLED(context, this.slot, this.bankNum, isEnabled)
            }.bind({slot, bankNum})         
    }
}

function assignSoloEnableBank(bankNum) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(bankNum, slot)

        // bind channel bank solo enables to host subpage events
        page.makeValueBinding(btnMutes[slot].mSurfaceValue, hostChannel.mValue.mSolo)
            .setTypeToggle()
            .setSubPage(subpage_SoloEnableBank[bankNum])

        // bind record LED's to host events per bank/slot
        hostChannel.mValue.mSolo.mOnProcessValueChange = 
            function(context, activeMapping, newValue) { 
                // do not alter mute LED's when not in solo mode                
                if (!isSoloModeEnabled(context)) return

                var isEnabled = newValue > 0
                displayMuteLED(context, this.slot, this.bankNum, isEnabled)
            }.bind({slot, bankNum})         
    }
}

function getHostChannel(bankNum, slot) {
    // address host channels by BANK_SIZE slots
    return hostChannelBank[bankNum * BANK_SIZE + slot]
}

function assignMasterFader_DualMode() {
    // if we just want to use the main controls, we won't accidentally alter the mix.. bypass the master fader bindings
    if (DISABLE_FADERS) return  

    // create host master stereo out channel
    var hostMixerZoneStereoOut = page.mHostAccess.mMixConsole.makeMixerBankZone().includeOutputChannels()
    var stereoOutChannel = hostMixerZoneStereoOut.makeMixerBankChannel()     

    // create host FX channel
    var hostMixerZoneFX = page.mHostAccess.mMixConsole.makeMixerBankZone().includeFXChannels()
    var fxChannel = hostMixerZoneFX.makeMixerBankChannel()
    
    // bind master fader to main stereo out channel, in normal non-"NULL" mode
    page.makeValueBinding(fdrMasterFader.mSurfaceValue, stereoOutChannel.mValue.mVolume)
        .setValueTakeOverModeScaled()
        .setSubPage(subpage_RecMasterNormalMode)
        .mapToValueRange(0, MASTER_FADER_SCALE)    

    // bind master fader to first FX channel, in assign mode
    page.makeValueBinding(fdrMasterFader.mSurfaceValue, fxChannel.mValue.mVolume)
        .setValueTakeOverModeScaled()
        .setSubPage(subpage_RecMasterNullMode)
} 

function makeNullDisplayMetronomeFeedback(button) {
    button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
        var isEnabled = newValue > 0                
        displayMetronomeNullLED(context, isEnabled)    
    }
}

function makeSoloDisplayCycleFeedback(button) {
    button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
        var isEnabled = newValue > 0                
        displayCycleOnSoloLED(context, isEnabled)    
    }
}

function showStopHoldProgress(context, now) {
    var elapsed = now - stopHoldStartMs

    // Shift timeline so progress starts AFTER the predelay
    var adjustedElapsed = elapsed - STOP_SAVE_PREDELAY_MS
    var adjustedHold = STOP_SAVE_HOLD_MS - STOP_SAVE_PREDELAY_MS

    var t = adjustedElapsed / adjustedHold    // 0.0 -> 1.0
    t = Math.max(0, Math.min(1, t))
	
    // 4 LEDs: 0..4 lit
    var lit = Math.floor(t * (BANK_SIZE + 1))  // gives 0..4
    for (var i=0; i<BANK_SIZE; i++) {
        sendMidiTascam(context, [TASCAM_REC_LED, i, (i < lit) ? LED_STATES.On : LED_STATES.Off])
    }
}

function assignNullButton_Metronome()
{    
    // bind null button to host metronome enable
    page.makeValueBinding(btnNull.mSurfaceValue, host_MetronomeActive).setTypeToggle()
}

function assignSoloButton_Cycle()
{    
    // bind solo button to host cycle enable
    page.makeValueBinding(btnSoloEnable.mSurfaceValue, host_CycleActive).setTypeToggle()
	
    // add a silent mirror so we can query state in other command logic
    page.makeValueBinding(var_cycleActiveMirror, host_CycleActive)
        .mOnValueChange = function (context, activeMapping, newValue, diff) {
            cycleButtonActive = newValue > 0
        }	
}

function assignMasterFader_Metronome() {
    var clickLevel = page.mHostAccess.mTransport.mValue.mMetronomeClickLevel
    page.makeValueBinding(fdrMasterFader.mSurfaceValue, clickLevel)
}

// UNUSED for reference- binds master fader to last clicked group channel
function assignGroupMasterFader() {
	// create host Group 1 channel
    var hostMixerZoneGroups = page.mHostAccess.mMixConsole.makeMixerBankZone().includeGroupChannels()
    var groupChannel = hostMixerZoneGroups.makeMixerBankChannel()

	// bind master fader to Group 1 channel
    page.makeValueBinding(
        fdrMasterFader.mSurfaceValue,
        groupChannel.mValue.mVolume
    )    
}

function assignNullVars_DualMode() {
    // bind assign mode variable ON state, (trigger NULL assign mode subpage first)
    page.makeActionBinding(var_nullModeOn, subpage_NullAssignMode.mAction.mActivate).mOnValueChange =
        function(context, activeMapping, newValue, diff) {
            if (newValue > 0) {   
                // then trigger remaining assign mode subpages             
                subpage_RecMasterNullMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_LocatorsNullMode.mAction.mActivate.trigger(activeMapping)                                     
            }    
        }

    // bind assign mode variable OFF state, (trigger NULL normal mode subpage first)
    page.makeActionBinding(var_nullModeOff, subpage_NullNormalMode.mAction.mActivate).mOnValueChange =
        function(context, activeMapping, newValue, diff) {
            if (newValue > 0) {                
                // then trigger remaining normal mode subpages
                subpage_RecMasterNormalMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_LocatorsNormalMode.mAction.mActivate.trigger(activeMapping)     
            }    
        }    
}

function toggleNullModeVars(context) {
    // swap states of assign mode custom variables
    var nullModeOn = var_nullModeOn.getProcessValue(context)
    var nullModeOff = var_nullModeOff.getProcessValue(context)

    var_nullModeOn.setProcessValue(context, nullModeOff)
    var_nullModeOff.setProcessValue(context, nullModeOn)

    displayNullLED(context)
}

function toggleSoloModeVars(context) {
    // swap states of solo mode custom variables
    var soloModeOn = var_soloModeOn.getProcessValue(context)
    var soloModeOff = var_soloModeOff.getProcessValue(context)

    var_soloModeOn.setProcessValue(context, soloModeOff)
    var_soloModeOff.setProcessValue(context, soloModeOn)
    
    displaySoloLED(context)
}

function assignNullButton_Vars() {
    btnNull.mSurfaceValue.mOnProcessValueChange = function(context, newValue, diff) {        
        if(newValue > 0) {
            // button pressed (ignore button release)
            toggleNullModeVars(context)            
        }
    }
}

function assignTransportControls() {

    // https://steinbergmedia.github.io/midiremote_api_doc/examples/commandbindings

    // bind buttons to host transport events
    page.makeValueBinding(btnPlay.mSurfaceValue, hostTransport_Start).setTypeToggle()
    page.makeValueBinding(btnRecord.mSurfaceValue, hostTransport_Record).setTypeToggle()     
    page.makeValueBinding(btnFastForward.mSurfaceValue, hostTransport_FastForward)    
    page.makeValueBinding(var_rewPressed, hostTransport_Rewind)
    page.makeCommandBinding(var_RTZPressed, "Transport", "Return to Zero")    
	
	// use transport command, because mStop causes playhead to jump back
	if (ENABLE_STOP_HOLD_SAVE) {
		page.makeCommandBinding(var_stopPressed, "Transport", "Stop")	
	} else {
		page.makeCommandBinding(btnStop.mSurfaceValue, "Transport", "Stop")    
	}
    
    // catch STOP+REW buttons to send RTZ command, or forward single REW button command, thru custom variable
    btnRewind.mSurfaceValue.mOnProcessValueChange = 
        function(context, newValue, diff) {			
			var rewindPressed = newValue > 0
            var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0
			
            if (stopPressed && rewindPressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)				
				
                var_RTZPressed.setProcessValue(context, 1.0)          // stop is also pressed.. fire an RTZ
			} else {
				var_rewPressed.setProcessValue(context, newValue)     // stop isn't pressed.. fire a normal rewind
			}			
        }        
}

function assignLocatorControls_DualMode() {    
    // bind locator buttons to host marker commands, in regular non-"NULL" mode
    page.makeCommandBinding(btnLocateLeft.mSurfaceValue, "Transport", "Locate Previous Marker").setSubPage(subpage_LocatorsNormalMode)
    page.makeCommandBinding(btnLocateRight.mSurfaceValue, "Transport", "Locate Next Marker").setSubPage(subpage_LocatorsNormalMode)
    page.makeCommandBinding(btnLocateSet.mSurfaceValue, "Transport", "Insert Marker").setSubPage(subpage_LocatorsNormalMode)

    // bind locator buttons to host cycle commands, in "NULL" mode
    page.makeCommandBinding(btnLocateLeft.mSurfaceValue, "Transport", "Set Left Locator").setSubPage(subpage_LocatorsNullMode)
    page.makeCommandBinding(btnLocateRight.mSurfaceValue, "Transport", "Set Right Locator").setSubPage(subpage_LocatorsNullMode)
    page.makeCommandBinding(btnLocateSet.mSurfaceValue, "Transport", "Cycle").setSubPage(subpage_LocatorsNullMode)
}

function assignLocatorControls_TrackingMode() {    
    // bind locator buttons to host marker commands
    page.makeCommandBinding(var_locSetPressed, "Transport", "Insert Marker")
	page.makeCommandBinding(var_locLeftPressed,  "Transport", "Locate Previous Marker")
	page.makeCommandBinding(var_locRightPressed, "Transport", "Locate Next Marker")
	page.makeCommandBinding(var_undoPressed, "Edit", "Undo")
	page.makeCommandBinding(var_redoPressed, "Edit", "Redo")

	// bind dummy button to host selected track mute (*note- can't use .setTypeToggle() here)
	page.makeValueBinding(btnDummySelectedMute.mSurfaceValue, host_SelectedMute)
	
	btnLocateLeft.mSurfaceValue.mOnProcessValueChange =
		function(context, newValue, diff) {
			var locLeftPressed = (newValue > 0)
			var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0

			if (stopPressed && locLeftPressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)
				
				var_undoPressed.setProcessValue(context, 1.0)          // stop is also pressed.. fire an undo
			} else {
				var_locLeftPressed.setProcessValue(context, newValue)  // stop isn't pressed.. fire a normal locLeft
			}
		}

	btnLocateRight.mSurfaceValue.mOnProcessValueChange =
		function(context, newValue, diff) {
			var locRightPressed = (newValue > 0)
			var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0
			
			if (stopPressed && locRightPressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)

				var_redoPressed.setProcessValue(context, 1.0)           // stop is also pressed.. fire a redo
			} else {
				var_locRightPressed.setProcessValue(context, newValue)  // stop isn't pressed.. fire a normal locRight
			}
		}			

	btnLocateSet.mSurfaceValue.mOnProcessValueChange =
		function(context, newValue, diff) {
			var locSetPressed = (newValue > 0)
			var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0

			if (stopPressed && locSetPressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)

				// Read current mute from dummy button
				var isMuted = btnDummySelectedMute.mSurfaceValue.getProcessValue(context)
				
				// stop is also pressed.. fire a mute selected track toggle (via dummy button)
				btnDummySelectedMute.mSurfaceValue.setProcessValue(context, isMuted > 0 ? 0.0 : 1.0)		
			} else {
				// stop isn't pressed.. fire a normal locSet
				var_locSetPressed.setProcessValue(context, newValue)
			}
		}		
}

function assignRecMasterButtonDualMode()
{
    // bind rec master button to metronome in "NULL" mode
    page.makeValueBinding(btnRecMaster.mSurfaceValue, host_MetronomeActive)
        .setTypeToggle()
        .setSubPage(subpage_RecMasterNullMode)

    // bind rec master button to enable/bypass mastering effect on main bus, in regular non-"NULL" mode
    page.makeCommandBinding(btnRecMaster.mSurfaceValue, "Mixer", "Bypass: Inserts on Main Mix")
        .setSubPage(subpage_RecMasterNormalMode)
}

function assignRecMasterButtonBusOnly()
{
    // bind rec master button to enable/bypass mastering effect on main bus
    page.makeCommandBinding(btnRecMaster.mSurfaceValue, "Mixer", "Bypass: Inserts on Main Mix")
}

function assignRecMasterButtonRecEnable()
{
	// bind dummy button to host selected track record enable (*note- can't use .setTypeToggle() here)
	page.makeValueBinding(btnDummySelectedRecEnable.mSurfaceValue, host_SelectedRecEnable)	

	btnRecMaster.mSurfaceValue.mOnProcessValueChange =
		function(context, newValue, diff) {
			var recEnablePressed = (newValue > 0)
			var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0

			if (stopPressed && recEnablePressed) {
				// reset stop longpress save until next press
				if (ENABLE_STOP_HOLD_SAVE) resetStopProgress(context)
				
				// stop is also pressed.. fire a master bus insert toggle
				// TODO-  page.makeCommandBinding(btnRecMaster.mSurfaceValue, "Mixer", "Bypass: Inserts on Main Mix")
			} else if (recEnablePressed) {
				// Read current rec enable from dummy button
				var isRecEnabled = btnDummySelectedRecEnable.mSurfaceValue.getProcessValue(context)
				
				// stop isn't pressed.. fire a rec enable selected track toggle (via dummy button)				
				btnDummySelectedRecEnable.mSurfaceValue.setProcessValue(context, isRecEnabled > 0 ? 0.0 : 1.0)
			}
		}	
}

function assignSaveCommand()
{
	// this var is triggered by long press of STOP button (when "ENABLE_STOP_HOLD_SAVE" mode enabled)
	page.makeCommandBinding(var_savePressed, "File", "Save")
}

function assignJogWheel_DualMode() {    
    if (SHUTTLE_MODE) {
        // bind custom vars to host jog/shuttle
        page.makeCommandBinding(var_JogShuttleLeft, 'Transport', 'Nudge Cursor Left')
        page.makeCommandBinding(var_JogShuttleRight, 'Transport', 'Nudge Cursor Right')
    } else {
        // bind custom vars to jog host up/down track select
        page.makeCommandBinding(var_JogShuttleLeft, 'Navigate', 'Up')
        page.makeCommandBinding(var_JogShuttleRight, 'Navigate', 'Down')
    }
    
    // bind custom vars to host zoom
    page.makeCommandBinding(var_zoomIn, 'Zoom', 'Zoom In')
    page.makeCommandBinding(var_zoomOut, 'Zoom', 'Zoom Out')

    // bind jogweel to shuttle/zoom 
    knobJogWheel.mSurfaceValue.mOnProcessValueChange =      
        function(context, newValue, diff) {
            if (isNullModeEnabled(context)) {				
                // trigger jog wheel controls in zoom mode
                var newZoomValue = Math.floor(newValue * 1000)

				if (newZoomValue < lastZoomValue || newZoomValue <= 0) {
					var_zoomOut.setProcessValue(context, 1)
				} else if (newZoomValue > lastZoomValue || newZoomValue >= 1000) {
					var_zoomIn.setProcessValue(context, 1)
				}				
				lastZoomValue = newZoomValue				
				
            } else {
                // trigger jog wheel controls in normal shuttle mode
				var newShuttleValue = Math.floor(newValue * 1000)

				if (newShuttleValue < lastShuttleValue || newShuttleValue <= 0) {
					var_JogShuttleLeft.setProcessValue(context, 1)
				} else if (newShuttleValue > lastShuttleValue || newShuttleValue >= 1000) {
					var_JogShuttleRight.setProcessValue(context, 1)
				}
				
				lastShuttleValue = newShuttleValue			
            }
        }              
}

function assignJogWheel_TrackingMode() {
	// bind zoom commands
    page.makeCommandBinding(var_zoomIn,  'Zoom', 'Zoom In')
    page.makeCommandBinding(var_zoomOut, 'Zoom', 'Zoom Out')

	if (AUDITION_VOLUME_WHEEL) {
		page.makeValueBinding(knobJogWheel.mSurfaceValue, host_SelectedVolume)
			.setValueTakeOverModeScaled()
			.setSubPage(subpage_JogwheelVolumeMode)

		subpage_JogwheelZoomMode.mOnActivate = function(context, activeMapping) {
			knobValue = knobJogWheel.mSurfaceValue.getProcessValue(context)
			lastZoomValue = Math.floor(knobValue * 1000)
		}
	}

    page.makeValueBinding(knobJogWheel.mSurfaceValue, var_knobJogWheel)
        .setSubPage(subpage_JogwheelZoomMode)
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

// host tempo listener for nuclear LED mode
hostTimeDisplay.mOnChangeTempoBPM = function (activeDevice, activeMapping, tempoBPM) {
    // replace garbage tempo values
    if (!isFinite(tempoBPM) || tempoBPM <= 0) {
        console.log("WARNING: Defaulting invalid tempo: " + tempoBPM)
		tempoBPM = 60000 / DEFAULT_BLINK_MS       
    }
    
	nuclear_tempoBpm = tempoBPM
	
	// compute milliseconds
	nuclear_msPerBeat = 60000 / tempoBPM
	
	// sanity guardrail (never faster than ~400 BPM blinking)
	nuclear_msPerBeat = Math.max(MINIMUM_BLINK_MS, nuclear_msPerBeat)  
}

// record listener to handle rec LED's in nuclear mode
hostTransport_Record.mOnProcessValueChange = function (context, activeMapping, value) {
    nuclear_isRecording = value > 0

    // when recording stops, reset rec LED's to off
    if (!nuclear_isRecording) {
        nuclear_blinkState = false
        nuclear_lastBlinkMs = NUCLEAR_BLINK_RESET
        for (var slot = 0; slot < BANK_SIZE; slot++) {
            sendMidiTascam(context, [TASCAM_REC_LED, slot, LED_STATES.Off])
        }
        return
    }

    // arm: force immediate blink on next idle pass
    nuclear_lastBlinkMs = NUCLEAR_BLINK_RESET

	// repair invalid blink interval, don't silently kill blinking (shouldn't ever happen)
	if (!isFinite(nuclear_msPerBeat) || nuclear_msPerBeat < MINIMUM_BLINK_MS)
		nuclear_msPerBeat = DEFAULT_BLINK_MS		
}

// Track STOP press/release (does NOT replace normal Stop binding)
if (ENABLE_STOP_HOLD_SAVE) {
	
	function resetStopProgress(context) {		
		stopSaveArmed = false
		// reset long press timer
		stopHoldStartMs = STOP_SAVE_RESET

		if (!ENABLE_NUCLEAR_BLINK || !nuclear_isRecording) {
			resetAllRecLEDs(context)
		}				
	}
	
	btnStop.mSurfaceValue.mOnProcessValueChange =
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

			// reset "progress indicator" LED's
			if (stopSaveArmed) {
				resetStopProgress(context)
			}			
		}
	}	
}

// nuclear mode idle timer to blink red LED's during recording & handle STOP long press to save
if ((TRACKING_MODE && ENABLE_NUCLEAR_BLINK) || ENABLE_STOP_HOLD_SAVE) {
	
	// measured this at about 10 calls per second FYI (a bit less during record)
    deviceDriver.mOnIdle = function (context, activeMapping) {
        var now = Date.now()

		// ---- AUDITION delayed SOLO TRACK ----
		if (TRACKING_MODE && auditionActive) {
			if (auditionSoloDueMs !== AUDITION_SOLO_RESET && now >= auditionSoloDueMs) {
				// fire the delayed Solo once (after Cubase finishes changing selection)
				auditionSoloDueMs = AUDITION_SOLO_RESET
				pulseVar(context, var_auditionSoloSelected)
			}
		}

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
				if (!ENABLE_NUCLEAR_BLINK || !nuclear_isRecording)
					resetAllRecLEDs(context)				
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
			} else if (!ENABLE_NUCLEAR_BLINK || !nuclear_isRecording) {
				showStopHoldProgress(context, now)
			}				
		}

		// ---- NUCLEAR RECORD LED BLINK ----
		if (ENABLE_NUCLEAR_BLINK && nuclear_isRecording) {
			// blink on quarter notes (or switch to /2 for eighths, *2 for half notes)
			if (
				nuclear_lastBlinkMs !== NUCLEAR_BLINK_RESET &&
				(now - nuclear_lastBlinkMs) < nuclear_msPerBeat
			) return
			
			nuclear_lastBlinkMs = now
			nuclear_blinkState = !nuclear_blinkState
			
			var ledState = nuclear_blinkState ? LED_STATES.On : LED_STATES.Off

			// fire all 4 rec LED's
			for (var slot = 0; slot < BANK_SIZE; slot++) {
				sendMidiTascam(context, [TASCAM_REC_LED, slot, ledState])
			}
		}	
    }
}

//-----------------------------------------------------------------------------
// 6. MAIN SECTION - call surface/host bindings
//-----------------------------------------------------------------------------

// bind transport LED's
makeTransportDisplayFeedback(btnPlay.mSurfaceValue, TRANSPORT_LED_COMMANDS.Play)
makeTransportDisplayFeedback(btnRecord.mSurfaceValue, TRANSPORT_LED_COMMANDS.Record)
makeTransportDisplayFeedback(btnFastForward.mSurfaceValue, TRANSPORT_LED_COMMANDS.FastForward)
makeTransportDisplayFeedback(var_rewPressed, TRANSPORT_LED_COMMANDS.Rewind)   // REW button uses a custom VAR to intercept STOP+REW RTZ function

// wire up bindings from surface controls to host events
assignTransportControls()

if (ENABLE_STOP_HOLD_SAVE) {		
	// bind "save" command to STOP longpress var
	assignSaveCommand()
}

if (TRACKING_MODE) {
	// bind master fader to click level
    assignMasterFader_Metronome()

	// bind null LED to metronome button
	makeNullDisplayMetronomeFeedback(btnNull)

	// bind null button to metronome
	assignNullButton_Metronome()

	// create command bindings to recall cycles (1 thru CYCLE_MARKER_MAX)
	setupCycleMarkerCommands()
	
	// bind Jog wheel to dedicated zoom control (with audition track volume, when enabled)
	assignJogWheel_TrackingMode() 
	
	// bind bank buttons to track select (with audition logic)
	assignBankButtonControls_TrackSelect()

	// bind vars to control audition solo logic in cubase
	assignAuditionCommands()
	
	// bind fixed mute and solo banks for tracks 1-4
	assignMuteBank_Single() 
	assignSoloBank_Single()

	// bind locator controls to markers and undo/redo/mute "STOP" chords
	assignLocatorControls_TrackingMode()
	
	// bind solo LED to host cycle state
	makeSoloDisplayCycleFeedback(btnSoloEnable)
	
	// bind solo button to host cycle on/off
	assignSoloButton_Cycle()

	if ( REC_ENABLE_MODE ) {
		// bind rec master button to record enable selected track
		assignRecMasterButtonRecEnable()		
	} else {
		// bind rec master button to decicated master bus inserts bypass
		assignRecMasterButtonBusOnly()
	}
			
} else {                                        // NORMAL MODE
	// bind master fader in normal mode
    assignMasterFader_DualMode()

	// bind null button and LED's to mode switches
	assignNullButton_Vars()
	assignNullVars_DualMode()	
	
	// bind Jog Wheel to dual shuttle and zoom mode depending on SHUTTLE_MODE
	assignJogWheel_DualMode()	
	
	// bind bank buttons to bank select (in groups of BANK_SIZE)
	assignBankButtonControls_BankSelect()
	assignChannelBanks_Multi()
	
	// bind locator controls to cycle and metronome modes
	assignLocatorControls_DualMode()	
	
	// bind rec master button to metronome and master bus
	assignRecMasterButton_DualMode()	
}

//-----------------------------------------------------------------------------
// 7. DEVICE ON ACTIVATE
//-----------------------------------------------------------------------------

// this happens when the TASCAM device is first connected
deviceDriver.mOnActivate = function(context) {        
	if ( ! TRACKING_MODE )
	{		
		// init variables for NULL & SOLO mode switching states, should trigger things to light up with Cubase
		initCustomHostVars(context)  	
		
		// init solo LED to reflect var state
		displaySoloLED(context)		
	} else {		
		// reset all record LED's to off
		resetAllRecLEDs(context)
	}
		
    // reset bank LED's to off
    displayBankLeftLED(context, false)
    displayBankRightLED(context, false)    
}
