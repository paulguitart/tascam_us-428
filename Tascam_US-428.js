
// Tascam US-428                           
// "Make your Cubase DAW feel like a Portastudio"    
// v2.0.0
//
// By Paul Warner    (special thanks to Minas Chantzides!!)
//
// Wishlist Features
// -----------------
// Long Press Stop - Save (with transport blink to confirm)
// Stop+Loc - undo/redo
// Stop+Wheel - fine adjust FX send level

//-----------------------------------------------------------------------------
// 0. CUSTOM SETTINGS - change these CONST values to suit your own needs
//-----------------------------------------------------------------------------

// if we just want to use the main controls & ignore faders.. set to true or false
const DISABLE_FADERS = true   

// hold SET for finer pan knob movement (pan or selected track volume)
const PAN_FINE_SCALE = 0.1

// master fader is fixed to cubase metronome level
const ENABLE_METRONOME_FADER = true

 // if we want to use the "LOW" EQ knobs for Low Cut PreFilter.. set to true or false
const LOW_EQ_PREFILTER_MODE = true   

// set this to 1 (recommended) unless you want to use multiple US-428 together on the same machine
const MAX_TASCAM_UNITS = 1

// exact port names (add/remove based on whatever MIDI device names show up on your system)
const EXACT_PORT_NAMES = [
    'US-428 Control',
    '2- US-428 Control',
    '3- US-428 Control',
    '4- US-428 Control'
]

/*
====================================================================================================
TASCAM US-428 v2.0 | MODE SUMMARY
====================================================================================================

1. BANKING & TRACK SELECTION (24-Tracks in 3 Banks)
----------------------------------------------------------------------------------------------------
F1 LED / BUTTON        : BANK A (Tracks 1-8)   | Hardware faders 1-8 control these slots.
F2 LED / BUTTON        : BANK B (Tracks 9-16)  | Lights indicate active focus range.
F3 LED / BUTTON        : BANK C (Tracks 17-24) | No screen needed to see where you are.
BANK L / R             : SELECT PREVIOUS/NEXT TRACK

2. MIXING & CHANNEL STRIP (ASGN & SOLO Toggles)
----------------------------------------------------------------------------------------------------
PAN KNOB               : [Normal] Pan Selected Track.  | [ASGN] Selected Track Volume.
SET BUTTON + PAN KNOB  : [Normal] Pan (+Fine Adjust).  | [ASGN] Volume (+Fine Adjust).
MASTER FADER           : [Normal] Stereo Out Volume.   | [ASGN] FX Send Slot 1 Level.
EQ BAND (HI->LOW)      : Gain/Freq/Q knobs.            | (All Modes) 
EQ BUTTONS (1-4)       : [Normal] Select EQ Band.      | [ASGN] EQ Band On/Off.
AUX BUTTONS (1-4)      : [Normal] Select AUX Send.     | [ASGN] Aux Send On/Off.
MUTE BUTTONS (1-8)     : [Normal] Mute On/Off.         | [SOLO] Solo On/Off.
MUTE LEDS (Yellow)     : [Normal] Mute State.          | [SOLO] Solo State.
SELECT BUTTONS (1-8)   : [Normal] Single Track Focus.  | [SOLO] Record Enable.
SELECT LEDS (Green)    : Track Focus (all)             | (All Modes)
REC LEDS (Red)         : Record Enable                 | (All Modes)

*LOW EQ MODE (Const)   : If PREFILTER_MODE = true, Low Band controls Pre-Filter Low Cut.
*METRONOME MODE (Const): If ENABLE_METRONOME_FADER = true, Master fader controls Cubase click level

NOTE: ASGN is the “ON/OFF + LED state” layer (EQ/AUX). Normal mode is the “select/adjust” layer.

4. TRANSPORT & JOGWHEEL
----------------------------------------------------------------------------------------------------
JOG WHEEL              : [Normal] FX Send (AUX 1-4).        | [ASGN] Horizontal Zoom.
LOCATE LEFT / RIGHT    : [Normal] Prev/Next Marker.         | [ASGN] Set Left/Right Locators.
SET BUTTON RELEASE     : Insert Marker                      | (All Modes)
STOP (Tap)             : Stop Transport
STOP (Hold 2s)         : TRIGGER SAVE (Progress shown on F1-F3, transport LED blink to confirm)
STOP + SET             : Cycle On/Off (All Modes).
STOP + LOC L           : UNDO
STOP + LOC R           : REDO
STOP + REW             : RETURN TO ZERO (RTZ)
----------------------------------------------------------------------------------------------------
*/

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('Tascam', 'US-428', 'Paul Warner')

// create objects that represent the midi ports of the hardware
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

// detect default MIDI port for TASCAM USB device
if (MAX_TASCAM_UNITS == 1) {
    deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
        .expectInputNameContains('US-428 Control')
        .expectOutputNameContains('US-428 Control')  
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
const TASCAM_MIDI_BEGIN = [0xF0, 0x4E, 0x0, 0x12]    // 0x0 is the default unit (device) number
const TASCAM_MIDI_END = 0xF7
const TASCAM_TRANSPORT_LED = 0x01
const TASCAM_MUTE_LED = 0x02
const TASCAM_SELECT_LED = 0x03
const TASCAM_REC_LED = 0x04
const TASCAM_NULL_LED = 0x05
const TASCAM_SOLO_LED = 0x06
const TASCAM_BANK_LEFT_LED = 0x07
const TASCAM_BANK_RIGHT_LED = 0x08
const TASCAM_HIGH_LED = 0x09
const TASCAM_HIGHMID_LED = 0x0A
const TASCAM_LOWMID_LED = 0x0B
const TASCAM_LOW_LED = 0x0C
const TASCAM_AUX_LED = 0x0D
const TASCAM_FUNCTION_LED = 0x0E
const TASCAM_ASGN_LED = 0x0F

// TASCAM AUX LED command codes
const AUX_LED_CODES = {    
    Aux1: 0,
    Aux2: 1,
    Aux3: 2,
    Aux4: 3
}

// TASCAM Function LED command codes
const FUNCTION_LED_CODES = {    
    F1: 0,
    F2: 1,
    F3: 2    
}

// toggle button indexes
const F1=0, F2=1, F3=2
const AUX1=0, AUX2=1, AUX3=2, AUX4=3

// device constants
const BANK_SIZE = 8
const TOTAL_TRACK_COUNT = 24
const MASTER_FADER_SCALE = 0.75   // 0.75 sets the max range of the fader to 0dB

// EQ button indexes
const EQ_BANDS = {
    None: -1,
    High: 0,
    HighMid: 1,
    LowMid: 2,
    Low: 3
}

//-----------------------------------------------------------------------------
// STATE VARIABLES - custom control
//-----------------------------------------------------------------------------

// selected control defaults
var selectedFunction = F1
var lastSelectedAux = AUX1
var lastSelectedEQBand = EQ_BANDS.Low

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
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

// pan
var knobPan = deviceDriver.mSurface.makeKnob(11.0, 2.0, 2.0, 2.0)

// null/metronome
var btnNull = deviceDriver.mSurface.makeButton(14.0, 2.0, 2.0, 1.0)

// jogwheel
var knobJogWheel = deviceDriver.mSurface.makeKnob(12.0, 4.0, 4.0, 4.0)

// aux buttons
var btnAuxes = []
btnAuxes[AUX1] = deviceDriver.mSurface.makeButton(0.0, 6.0, 2.0, 1.0)
btnAuxes[AUX2] = deviceDriver.mSurface.makeButton(2.0, 6.0, 2.0, 1.0)
btnAuxes[AUX3] = deviceDriver.mSurface.makeButton(4.0, 6.0, 2.0, 1.0)
btnAuxes[AUX4] = deviceDriver.mSurface.makeButton(6.0, 6.0, 2.0, 1.0)

// assign button
var btnAsgn = deviceDriver.mSurface.makeButton(0.0, 8.0, 2.0, 1.0)

// F1, F2, F3 buttons
var btnFunctions = []
btnFunctions[F1] = deviceDriver.mSurface.makeButton(2.0, 8.0, 2.0, 1.0)
btnFunctions[F2] = deviceDriver.mSurface.makeButton(4.0, 8.0, 2.0, 1.0)
btnFunctions[F3] = deviceDriver.mSurface.makeButton(6.0, 8.0, 2.0, 1.0)

// array of the EQ buttons
var btnEQBands = []
btnEQBands[EQ_BANDS.High] = deviceDriver.mSurface.makeButton(8.0, 10.0, 2.0, 1.0)
btnEQBands[EQ_BANDS.HighMid] = deviceDriver.mSurface.makeButton(10.0, 10.0, 2.0, 1.0)
btnEQBands[EQ_BANDS.LowMid] = deviceDriver.mSurface.makeButton(12.0, 10.0, 2.0, 1.0)
btnEQBands[EQ_BANDS.Low] = deviceDriver.mSurface.makeButton(14.0, 10.0, 2.0, 1.0)

// EQ knobs
var knobGain = deviceDriver.mSurface.makeKnob(0.0, 10.0, 2.0, 2.0)
var knobFreq = deviceDriver.mSurface.makeKnob(2.0, 10.0, 2.0, 2.0)
var knobQ = deviceDriver.mSurface.makeKnob(4.0, 10.0, 2.0, 2.0)

// master slot buttons
var btnSoloEnable = deviceDriver.mSurface.makeButton(17.0, 12.0, 2.0, 1.0)
var btnRecMaster = deviceDriver.mSurface.makeButton(17.0, 14.0, 2.0, 1.0)

// mute buttons
var btnMutes = []
btnMutes[0] = deviceDriver.mSurface.makeButton(0.0, 12.0, 2.0, 1.0)
btnMutes[1] = deviceDriver.mSurface.makeButton(2.0, 12.0, 2.0, 1.0)
btnMutes[2] = deviceDriver.mSurface.makeButton(4.0, 12.0, 2.0, 1.0)
btnMutes[3] = deviceDriver.mSurface.makeButton(6.0, 12.0, 2.0, 1.0)
btnMutes[4] = deviceDriver.mSurface.makeButton(8.0, 12.0, 2.0, 1.0)
btnMutes[5] = deviceDriver.mSurface.makeButton(10.0, 12.0, 2.0, 1.0)
btnMutes[6] = deviceDriver.mSurface.makeButton(12.0, 12.0, 2.0, 1.0)
btnMutes[7] = deviceDriver.mSurface.makeButton(14.0, 12.0, 2.0, 1.0)

// record enable buttons
var btnRecs = []
btnRecs[0] = deviceDriver.mSurface.makeButton(0.0, 14.0, 2.0, 1.0)
btnRecs[1] = deviceDriver.mSurface.makeButton(2.0, 14.0, 2.0, 1.0)
btnRecs[2] = deviceDriver.mSurface.makeButton(4.0, 14.0, 2.0, 1.0)
btnRecs[3] = deviceDriver.mSurface.makeButton(6.0, 14.0, 2.0, 1.0)
btnRecs[4] = deviceDriver.mSurface.makeButton(8.0, 14.0, 2.0, 1.0)
btnRecs[5] = deviceDriver.mSurface.makeButton(10.0, 14.0, 2.0, 1.0)
btnRecs[6] = deviceDriver.mSurface.makeButton(12.0, 14.0, 2.0, 1.0)
btnRecs[7] = deviceDriver.mSurface.makeButton(14.0, 14.0, 2.0, 1.0)

// select buttons (dummy buttons to hold select LED state)
var btnSelectsDummy = []
btnSelectsDummy[0] = deviceDriver.mSurface.makeButton(0.0, 18.0, 2.0, 1.0)
btnSelectsDummy[1] = deviceDriver.mSurface.makeButton(2.0, 18.0, 2.0, 1.0)
btnSelectsDummy[2] = deviceDriver.mSurface.makeButton(4.0, 18.0, 2.0, 1.0)
btnSelectsDummy[3] = deviceDriver.mSurface.makeButton(6.0, 18.0, 2.0, 1.0)
btnSelectsDummy[4] = deviceDriver.mSurface.makeButton(8.0, 18.0, 2.0, 1.0)
btnSelectsDummy[5] = deviceDriver.mSurface.makeButton(10.0, 18.0, 2.0, 1.0)
btnSelectsDummy[6] = deviceDriver.mSurface.makeButton(12.0, 18.0, 2.0, 1.0)
btnSelectsDummy[7] = deviceDriver.mSurface.makeButton(14.0, 18.0, 2.0, 1.0)

// channel faders
var fdrFaders = []
fdrFaders[0] = deviceDriver.mSurface.makeFader(0.0, 16.0, 2.0, 3.0)
fdrFaders[1] = deviceDriver.mSurface.makeFader(2.0, 16.0, 2.0, 3.0)
fdrFaders[2] = deviceDriver.mSurface.makeFader(4.0, 16.0, 2.0, 3.0)
fdrFaders[3] = deviceDriver.mSurface.makeFader(6.0, 16.0, 2.0, 3.0)
fdrFaders[4] = deviceDriver.mSurface.makeFader(8.0, 16.0, 2.0, 3.0)
fdrFaders[5] = deviceDriver.mSurface.makeFader(10.0, 16.0, 2.0, 3.0)
fdrFaders[6] = deviceDriver.mSurface.makeFader(12.0, 16.0, 2.0, 3.0)
fdrFaders[7] = deviceDriver.mSurface.makeFader(14.0, 16.0, 2.0, 3.0)

// master fader
var fdrMasterFader = deviceDriver.mSurface.makeFader(17.0, 16.0, 2.0, 3.0)

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

// null/metronome button MIDI binding
bindButtonToMIDI(btnNull, 40)

// pan knob MIDI binding
bindKnobToMIDI(knobPan, 77)

// jog wheel MIDI binding
bindKnobToMIDI(knobJogWheel, 96)
    
// AUX buttons MIDI bindings
bindButtonToMIDI(btnAuxes[AUX1], 48)
bindButtonToMIDI(btnAuxes[AUX2], 49)
bindButtonToMIDI(btnAuxes[AUX3], 50)
bindButtonToMIDI(btnAuxes[AUX4], 51)

// ASGN button MIDI binding
bindButtonToMIDI(btnAsgn, 52)

// F1, F2, F3 buttons MIDI bindings
bindButtonToMIDI(btnFunctions[F1], 53)
bindButtonToMIDI(btnFunctions[F2], 54)
bindButtonToMIDI(btnFunctions[F3], 55)

// EQ knobs MIDI bindings
bindKnobToMIDI(knobGain, 72)
bindKnobToMIDI(knobFreq, 73)
bindKnobToMIDI(knobQ, 74)
   
// EQ buttons MIDI bindings
bindButtonToMIDI(btnEQBands[EQ_BANDS.High], 44)
bindButtonToMIDI(btnEQBands[EQ_BANDS.HighMid], 45)
bindButtonToMIDI(btnEQBands[EQ_BANDS.LowMid], 46)
bindButtonToMIDI(btnEQBands[EQ_BANDS.Low], 47)

// master slot buttons MIDI bindings
bindButtonToMIDI(btnSoloEnable, 42)
bindButtonToMIDI(btnRecMaster, 41)

// channel slot buttons MIDI bindings
for (var slot=0; slot<8; slot++) {    
    bindButtonToMIDI(btnMutes[slot], 0 + slot)      // cc 0-7
    bindButtonToMIDI(btnRecs[slot], 32 + slot)      // cc 32-39
    bindFaderToMIDI(fdrFaders[slot], 64 + slot)     // cc 64-71
}

// master fader MIDI binding
bindFaderToMIDI(fdrMasterFader, 75)

//-----------------------------------------------------------------------------
// 2. FEEDBACK EVENTS - wire DAW events to buttons/lights
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
    }
}

function displaySelectedAuxLED(context, selectedAuxID) {
    lastSelectedAux = selectedAuxID
    
    // update AUX1 LED
    sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux1,
        (selectedAuxID == AUX1 ? LED_STATES.On : LED_STATES.Off)])

    // update AUX2 LED
    sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux2,
        (selectedAuxID == AUX2 ? LED_STATES.On : LED_STATES.Off)])

    // update AUX3 LED
    sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux3,
        (selectedAuxID == AUX3 ? LED_STATES.On : LED_STATES.Off)])

    // update AUX4 LED
    sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux4,
         (selectedAuxID == AUX4 ? LED_STATES.On : LED_STATES.Off)])
 
}

function displayAssignedAuxLED(context, aux, isEnabled)
{    
    switch (aux) {
        case AUX1: 
            sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux1, (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
        case AUX2: 
            sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux2, (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
        case AUX3: 
            sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux3, (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
        case AUX4: 
            sendMidiTascam(context, [TASCAM_AUX_LED, AUX_LED_CODES.Aux4, (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
    }
}

function forceFaderPositionsDump(context, channelStripNum) {
    // Forces US-428 to send current fader position messages to host 
    // DUMP_FADER_POS:  F0 4E<UNIT> 12 10<STRIP #> <STATE> F7 
    // Note: <STRIP #>is a number in the range [0..7], corresponding to the
    // channel-strip #, and <STATE>is either 0x00 (LED OFF) or 0x7F (LED ON)
    sendMidiTascam(context, [0x10, channelStripNum])
}

function displayMuteLED(context, channelSlot, Fn, isEnabled) {
    if (selectedFunction != Fn) return     // do not alter LED's for non-visible channels
    
    sendMidiTascam(context, [TASCAM_MUTE_LED, channelSlot,
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displayRecLED(context, channelSlot, Fn, isEnabled) {
    if (selectedFunction != Fn) return     // do not alter LED's for non-visible channels

    sendMidiTascam(context, [TASCAM_REC_LED, channelSlot, 
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displaySelectLED(context, channelSlot, Fn, isEnabled) {    
    if (selectedFunction != Fn) return     // do not alter LED's for non-visible channels

    sendMidiTascam(context, [TASCAM_SELECT_LED, channelSlot, 
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displayFunctionLED(context, Fn) {
    // update F1 LED
    sendMidiTascam(context, [TASCAM_FUNCTION_LED, FUNCTION_LED_CODES.F1, 
        (Fn == F1 ? LED_STATES.On : LED_STATES.Off)])

    // update F2 LED
    sendMidiTascam(context, [TASCAM_FUNCTION_LED, FUNCTION_LED_CODES.F2, 
        (Fn == F2 ? LED_STATES.On : LED_STATES.Off)])  

    // update F3 LED
    sendMidiTascam(context, [TASCAM_FUNCTION_LED, FUNCTION_LED_CODES.F3, 
        (Fn == F3 ? LED_STATES.On : LED_STATES.Off)])  
}

function displayBankLeftLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_BANK_LEFT_LED, ledState])
}

function displayBankRightLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_BANK_RIGHT_LED, ledState])
}

function displayAsgnLED(context) {    
    var isEnabled = var_assignModeOn.getProcessValue(context)

    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_ASGN_LED, ledState])
}

function displaySoloLED(context) {    
    var ledState = isSoloModeEnabled(context) ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_SOLO_LED, ledState])
}

function makeNullDisplayFeedback(button) {
    button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
        var isEnabled = newValue > 0                
        displayNullLED(context, isEnabled)    
    }
}

function displayNullLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_NULL_LED, ledState])
}

function displaySelectedEQLED(context, selectedEQBand) {  
    lastSelectedEQBand = selectedEQBand

    sendMidiTascam(context, [TASCAM_HIGH_LED, (selectedEQBand == EQ_BANDS.High ? LED_STATES.On : LED_STATES.Off)])
    sendMidiTascam(context, [TASCAM_HIGHMID_LED, (selectedEQBand == EQ_BANDS.HighMid ? LED_STATES.On : LED_STATES.Off)])
    sendMidiTascam(context, [TASCAM_LOWMID_LED, (selectedEQBand == EQ_BANDS.LowMid ? LED_STATES.On : LED_STATES.Off)])
    sendMidiTascam(context, [TASCAM_LOW_LED, (selectedEQBand == EQ_BANDS.Low ? LED_STATES.On : LED_STATES.Off)])
}

function displayAssignedEQLED(context, assignedEQBand, isEnabled) {  
    switch (assignedEQBand)
    {
        case EQ_BANDS.High:
            sendMidiTascam(context, [TASCAM_HIGH_LED, (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
        case EQ_BANDS.HighMid:
            sendMidiTascam(context, [TASCAM_HIGHMID_LED, (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
        case EQ_BANDS.LowMid:
            sendMidiTascam(context, [TASCAM_LOWMID_LED,  (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
        case EQ_BANDS.Low:
            sendMidiTascam(context, [TASCAM_LOW_LED,  (isEnabled ? LED_STATES.On : LED_STATES.Off)])
            break
    }
}

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// create at least one mapping page
var page = deviceDriver.mMapping.makePage('Tascam US-428 Mixer Page')

// create host mixer zone for main channel section (should include audio and group channels)
var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels()
    .excludeSamplerChannels()
    .excludeVCAChannels() 

// build array of 24 host mixer bank channel items for main channel section (3 banks of 8)
var hostChannelBank = makeNewHostChannelBank()

// create host accessing objects
var host_SelectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
var host_SelectedEQChannel = page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ
var hostTransport_Rewind = page.mHostAccess.mTransport.mValue.mRewind
var hostTransport_FastForward = page.mHostAccess.mTransport.mValue.mForward
var hostTransport_Stop = page.mHostAccess.mTransport.mValue.mStop    // unused, using a transport command for STOP to avoid playhead jump-back
var hostTransport_Start = page.mHostAccess.mTransport.mValue.mStart
var hostTransport_Record = page.mHostAccess.mTransport.mValue.mRecord
var host_MetronomeActive = page.mHostAccess.mTransport.mValue.mMetronomeActive
var host_SelectPrevTrack = page.mHostAccess.mTrackSelection.mAction.mPrevTrack
var host_SelectNextTrack = page.mHostAccess.mTrackSelection.mAction.mNextTrack
var host_FirstQuickControl = page.mHostAccess.mFocusedQuickControls.getByIndex(0)    // unused.. for now

// 4 host EQ bands for the selected channel
var host_EQBand = []
host_EQBand[EQ_BANDS.High] = host_SelectedEQChannel.mBand4
host_EQBand[EQ_BANDS.HighMid] = host_SelectedEQChannel.mBand3
host_EQBand[EQ_BANDS.LowMid] = host_SelectedEQChannel.mBand2
host_EQBand[EQ_BANDS.Low] = host_SelectedEQChannel.mBand1

// create custom var on host for current selected function bank
var var_selectedFunction = page.mCustom.makeHostValueVariable("Selected Function Bank")

// create custom vars on host for ASGN mode switching
var var_assignModeOn = deviceDriver.mSurface.makeCustomValueVariable("Assign Mode On")
var var_assignModeOff = deviceDriver.mSurface.makeCustomValueVariable("Assign Mode Off")

// create custom vars on host for SOLO mode switching
var var_soloModeOn = deviceDriver.mSurface.makeCustomValueVariable("Solo Mode On")
var var_soloModeOff = deviceDriver.mSurface.makeCustomValueVariable("Solo Mode Off")

// create custom vars to intercept simultaneous button presses for STOP+REW = RTZ
var var_rewPressed = deviceDriver.mSurface.makeCustomValueVariable("REW Pressed")
var var_RTZPressed = deviceDriver.mSurface.makeCustomValueVariable("RTZ Pressed")

// custom vars for SET commands and fine pan control
var var_insertMarkerPressed = deviceDriver.mSurface.makeCustomValueVariable("Insert Marker Pressed")
var var_cyclePressed = deviceDriver.mSurface.makeCustomValueVariable("Cycle Pressed")
var setButtonHeld = false
var setButtonUsed = false
var var_selectedVolume = deviceDriver.mSurface.makeCustomValueVariable("Selected Track Volume")
var var_selectedPan = deviceDriver.mSurface.makeCustomValueVariable("Selected Track Pan")
var var_panInput = page.mCustom.makeHostValueVariable("Pan Knob Movement")

// create custom var to intercept jogwheel value
var var_knobJogWheel = page.mCustom.makeHostValueVariable("JogWheel Position")

// custom vars for zooming
var var_zoomIn = deviceDriver.mSurface.makeCustomValueVariable('ZoomIn')
var var_zoomOut = deviceDriver.mSurface.makeCustomValueVariable('ZoomOut')
var lastZoomValue = -1;

//-----------------------------------------------------------------------------
// 4. SUBPAGES - *note! the order created matters- first one is open by default
//-----------------------------------------------------------------------------

// create RecMaster button asgn mode subpage area
var area_RecMasterButtonSubPages = page.makeSubPageArea("RecMaster Button Subpage Area")

// create RecMaster asgn Modes Subpage
var subpage_RecMasterNormalMode = area_RecMasterButtonSubPages.makeSubPage('RecMaster Normal Mode') 
var subpage_RecMasterAssignMode = area_RecMasterButtonSubPages.makeSubPage('RecMaster Assign Mode')

// create Pan knob asgn mode subpage area
var area_PanKnobSubPages = page.makeSubPageArea("Pan Knob Subpage Area")

// create Pan knob asgn Modes Subpage
var subpage_PanNormalMode = area_PanKnobSubPages.makeSubPage('Pan Knob Normal Mode') 
var subpage_PanAssignMode = area_PanKnobSubPages.makeSubPage('Pan Knob Assign Mode')

// create locators buttons asgn mode subpage area
var area_LocatorButtonsSubPages = page.makeSubPageArea("Locator Buttons Subpage Area")

// create locators asgn Modes Subpage
var subpage_LocatorsNormalMode = area_LocatorButtonsSubPages.makeSubPage('Locator Buttons Normal Mode') 
var subpage_LocatorsAssignMode = area_LocatorButtonsSubPages.makeSubPage('Locator Buttons Assign Mode')

// create aux mode buttons subpage area
var area_AuxButtonsSubPages = page.makeSubPageArea("AUX Buttons Subpage Area")

// create Aux Assign Modes Subpage
var subpage_AuxSelectMode = area_AuxButtonsSubPages.makeSubPage('AUX Select Mode') 
var subpage_AuxAssignMode = area_AuxButtonsSubPages.makeSubPage('AUX Assign Mode')

// create aux mode buttons subpage area
var area_JogwheelFXSendSubPages = page.makeSubPageArea('Jogwheel FX Send Subpage Area')

// create and assign subpages for each aux button
var subpage_JogwheelFXSendMode = []
subpage_JogwheelFXSendMode[AUX1] = makeFXSendSubpage(AUX1)
subpage_JogwheelFXSendMode[AUX2] = makeFXSendSubpage(AUX2)
subpage_JogwheelFXSendMode[AUX3] = makeFXSendSubpage(AUX3)
subpage_JogwheelFXSendMode[AUX4] = makeFXSendSubpage(AUX4)

// create extra subpage for jogwheel zoom mode
var subpage_JogwheelZoomMode = area_JogwheelFXSendSubPages.makeSubPage('Jogwheel Zoom Mode')

// create EQ Assign Modes Subpage area
var area_eqButtonsSubPages = page.makeSubPageArea('EQ Buttons Subpage Area')

// create EQ Assign Modes Subpages
var subpage_EQBandSelectMode = area_eqButtonsSubPages.makeSubPage('EQ Band Select Mode') 
var subpage_EQAssignMode = area_eqButtonsSubPages.makeSubPage('EQ Bands Assign Mode')

// create EQ Band Knobs Subpage area
var area_eqBandKnobsSubPages = page.makeSubPageArea("EQ Band Knobs Subpage Area")

// create subpages for each EQ band
var subpage_EQBand = []
subpage_EQBand[EQ_BANDS.High] = area_eqBandKnobsSubPages.makeSubPage('High EQ Band')
subpage_EQBand[EQ_BANDS.HighMid] = area_eqBandKnobsSubPages.makeSubPage('HighMid EQ Band')
subpage_EQBand[EQ_BANDS.LowMid] = area_eqBandKnobsSubPages.makeSubPage('LowMid EQ Band')
subpage_EQBand[EQ_BANDS.Low] = area_eqBandKnobsSubPages.makeSubPage('Low EQ Band')

// create fader bank sub pages
var area_FaderBankSubPages = page.makeSubPageArea('Fader Banks Subpage Area')
var subpage_FaderBank = makeBankSubPages(area_FaderBankSubPages, 'Fader Bank')

// create selected LED bank sub pages
var area_SelectedLEDSubPages = page.makeSubPageArea('Selected LED Subpage Area')
var subpage_SelectedLEDBank = makeBankSubPages(area_SelectedLEDSubPages, 'Selected LED Bank')

// create rec enable bank sub pages
var area_RecEnableBankSubPages = page.makeSubPageArea('Rec Enable Subpage Area')
var subpage_SelectEnableBank = makeBankSubPages(area_RecEnableBankSubPages, 'Select Enable Bank')
var subpage_RecEnableBank = makeBankSubPages(area_RecEnableBankSubPages, 'Rec Enable Bank')

// create mute/solo bank sub pages
var area_MuteSoloBankSubPages = page.makeSubPageArea('Mute/Solo Subpage Area')
var subpage_MuteBank = makeBankSubPages(area_MuteSoloBankSubPages, 'Mute Bank')
var subpage_SoloEnableBank = makeBankSubPages(area_MuteSoloBankSubPages, 'Solo Enable Bank')

function makeBankSubPages(area, name) {
    var subpages = []

    subpages[F1] = area.makeSubPage(name + '_F1')
    subpages[F2] = area.makeSubPage(name + '_F2')
    subpages[F3] = area.makeSubPage(name + '_F3')

    return subpages
}

function makeNewHostChannelBank() {
    var newBank = []
    for (var i=0; i<TOTAL_TRACK_COUNT; i++) { 
        newBank.push(hostMixerBankZone.makeMixerBankChannel()) 
    }
    return newBank;
}

function isSoloModeEnabled(context) {
    return var_soloModeOn.getProcessValue(context) 
}

function isAssignModeEnabled(context) {
    return var_assignModeOn.getProcessValue(context) 
}

function initCustomHostVars(context) {
    // initialize assign mode to off
    var_assignModeOn.setProcessValue(context, 0)
    var_assignModeOff.setProcessValue(context, 1)

    // initialize solo mode to off
    var_soloModeOn.setProcessValue(context, 0)
    var_soloModeOff.setProcessValue(context, 1)
}

//-----------------------------------------------------------------------------
// 5. ASSIGN FUNCTIONS - create host bindings
//-----------------------------------------------------------------------------

function assignBankButtonControls() {
    // bind bank left button to host prev track selection
    page.makeActionBinding(btnBankLeft.mSurfaceValue, host_SelectPrevTrack).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isButtonPressed = newValue > 0              
            displayBankLeftLED(context, isButtonPressed)
        }

    // bind bank right button to host next track selection
    page.makeActionBinding(btnBankRight.mSurfaceValue, host_SelectNextTrack).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isButtonPressed = newValue > 0
            displayBankRightLED(context, isButtonPressed)
        }    
}

function assignFunctionButton(Fn) {
    // bind F1, F2, F3 buttons to switching all subpages & LED displays
    page.makeValueBinding(btnFunctions[Fn].mSurfaceValue, var_selectedFunction).mOnValueChange =
        function(context, activeMapping, value, diff) {
            if (value > 0) {
                selectedFunction = Fn
                displayFunctionLED(context, Fn);
                subpage_FaderBank[Fn].mAction.mActivate.trigger(activeMapping)
                subpage_SelectedLEDBank[Fn].mAction.mActivate.trigger(activeMapping)
                
                if (isSoloModeEnabled(context)) {
                    subpage_SoloEnableBank[selectedFunction].mAction.mActivate.trigger(activeMapping)                      
                    subpage_RecEnableBank[Fn].mAction.mActivate.trigger(activeMapping) 
                } else {
                    subpage_MuteBank[selectedFunction].mAction.mActivate.trigger(activeMapping)                
                    subpage_SelectEnableBank[Fn].mAction.mActivate.trigger(activeMapping) 
                }                                
            }    
        }.bind({Fn})
}

function assignSoloEnableButton(Fn) {
    page.makeActionBinding(btnSoloEnable.mSurfaceValue, subpage_MuteBank[Fn].mAction.mActivate)
        .setSubPage(subpage_SoloEnableBank[Fn]).mOnValueChange = 
            function(context, activeMapping, newValue, diff) {
                if(newValue > 0) {
                    // button pressed (ignore button release)
                    toggleSoloModeVars(context)           
                    
                    subpage_SelectEnableBank[Fn].mAction.mActivate.trigger(activeMapping)     
                }
            }.bind({Fn})

    page.makeActionBinding(btnSoloEnable.mSurfaceValue, subpage_SoloEnableBank[Fn].mAction.mActivate)
        .setSubPage(subpage_MuteBank[Fn]).mOnValueChange = 
            function(context, activeMapping, newValue, diff) {
                if(newValue > 0) {
                    // button pressed (ignore button release)
                    toggleSoloModeVars(context) 
                    
                    subpage_RecEnableBank[Fn].mAction.mActivate.trigger(activeMapping)                                        
                }
            }.bind({Fn})
}

function assignChannelBanks() {
    // assign 3 banks of 8 faders to F1, F2, F3 subpages
    assignSingleChannelBank(F1)
    assignSingleChannelBank(F2)
    assignSingleChannelBank(F3)   
}

function assignSingleChannelBank(Fn) {    
    assignFunctionButton(Fn)
    assignFaderBank(Fn)
    assignSelectedLEDBank(Fn)
    assignRecEnableBank(Fn)
    assignSelectEnableBank(Fn)
    assignMuteBank(Fn)
    assignSoloEnableBank(Fn)
    assignSoloEnableButton(Fn)
} 

function assignFaderBank(Fn) {  
    // if we just want to use the main controls, we won't accidentally alter the mix.. bypass the Fader Bank bindings  
    if (DISABLE_FADERS) return  

    for (var slot=0; slot<BANK_SIZE; slot++)
    {       
        // reference host channel from main array     
        var hostChannel = getHostChannel(Fn, slot)

        // bind channel bank faders to host subpage events
        page.makeValueBinding(fdrFaders[slot].mSurfaceValue, hostChannel.mValue.mVolume)
            .setValueTakeOverModeScaled()
            .setSubPage(subpage_FaderBank[Fn])
    }
}

function assignSelectedLEDBank(Fn) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(Fn, slot)

        // bind channel bank selected channels to host subpage events
        page.makeValueBinding(btnSelectsDummy[slot].mSurfaceValue, hostChannel.mValue.mSelected)
            .setTypeToggle()
            .setSubPage(subpage_SelectedLEDBank[Fn])

        // bind select LED's to host events per bank/slot
        hostChannel.mValue.mSelected.mOnProcessValueChange = 
            function(context, activeMapping, newValue) {                 
                var isEnabled = newValue > 0
                displaySelectLED(context, this.slot, this.Fn, isEnabled)
            }.bind({slot, Fn})     
    }
}

function assignRecEnableBank(Fn) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(Fn, slot)

        // bind channel bank rec enables to host subpage events
        page.makeValueBinding(btnRecs[slot].mSurfaceValue, hostChannel.mValue.mRecordEnable)
            .setTypeToggle()
            .setSubPage(subpage_RecEnableBank[Fn])

        // bind record LED's to host events per bank/slot
        hostChannel.mValue.mRecordEnable.mOnProcessValueChange = 
            function(context, activeMapping, newValue) { 
                var isEnabled = newValue > 0
                displayRecLED(context, this.slot, this.Fn, isEnabled)
            }.bind({slot, Fn})         
    }
}

function assignSelectEnableBank(Fn) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(Fn, slot)

        // bind channel bank rec enables to host subpage events
        page.makeValueBinding(btnRecs[slot].mSurfaceValue, hostChannel.mValue.mSelected)
            .setTypeToggle()
            .setSubPage(subpage_SelectEnableBank[Fn])     
    }
}

function assignMuteBank(Fn) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(Fn, slot)

        // bind channel bank rec enables to host subpage events
        page.makeValueBinding(btnMutes[slot].mSurfaceValue, hostChannel.mValue.mMute)
            .setTypeToggle()
            .setSubPage(subpage_MuteBank[Fn])

        // bind record LED's to host events per bank/slot
        hostChannel.mValue.mMute.mOnProcessValueChange = 
            function(context, activeMapping, newValue) { 
                // do not alter mute LED's in solo mode                
                if (isSoloModeEnabled(context)) return

                var isEnabled = newValue > 0
                displayMuteLED(context, this.slot, this.Fn, isEnabled)
            }.bind({slot, Fn})         
    }
}

function assignSoloEnableBank(Fn) {    
    for (var slot=0; slot<BANK_SIZE; slot++)
    {   
        // reference host channel from main array     
        var hostChannel = getHostChannel(Fn, slot)

        // bind channel bank solo enables to host subpage events
        page.makeValueBinding(btnMutes[slot].mSurfaceValue, hostChannel.mValue.mSolo)
            .setTypeToggle()
            .setSubPage(subpage_SoloEnableBank[Fn])

        // bind record LED's to host events per bank/slot
        hostChannel.mValue.mSolo.mOnProcessValueChange = 
            function(context, activeMapping, newValue) { 
                // do not alter mute LED's when not in solo mode                
                if (!isSoloModeEnabled(context)) return

                var isEnabled = newValue > 0
                displayMuteLED(context, this.slot, this.Fn, isEnabled)
            }.bind({slot, Fn})         
    }
}

function getHostChannel(Fn, slot) {
    // address 24 host channels ... 3 banks of BANK_SIZE slots
    return hostChannelBank[Fn * BANK_SIZE + slot]
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
    
    // bind master fader to main stereo out channel, in normal non-"ASGN" mode
    page.makeValueBinding(fdrMasterFader.mSurfaceValue, stereoOutChannel.mValue.mVolume)
        .setValueTakeOverModeScaled()
        .setSubPage(subpage_RecMasterNormalMode)
        .mapToValueRange(0, MASTER_FADER_SCALE)    

    // bind master fader to first FX channel, in assign mode
    page.makeValueBinding(fdrMasterFader.mSurfaceValue, fxChannel.mValue.mVolume)
        .setValueTakeOverModeScaled()
        .setSubPage(subpage_RecMasterAssignMode)
} 

function assignMasterFader_Metronome() {
	// cubase metronome level is non-destructive to the mix, so we ignore DISABLE_FADERS here
    var clickLevel = page.mHostAccess.mTransport.mValue.mMetronomeClickLevel
    page.makeValueBinding(fdrMasterFader.mSurfaceValue, clickLevel)
}

function assignASGNVarsToModes() {
    // bind assign mode variable ON state, (trigger aux assign mode subpage first)
    page.makeActionBinding(var_assignModeOn, subpage_AuxAssignMode.mAction.mActivate).mOnValueChange =
        function(context, activeMapping, newValue, diff) {
            if (newValue > 0) {   
                // then trigger remaining assign mode subpages             
                subpage_EQAssignMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_RecMasterAssignMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_PanAssignMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_LocatorsAssignMode.mAction.mActivate.trigger(activeMapping)                                     
                subpage_JogwheelZoomMode.mAction.mActivate.trigger(activeMapping)
            }    
        }

    // bind assign mode variable OFF state, (trigger aux select mode subpage first)
    page.makeActionBinding(var_assignModeOff, subpage_AuxSelectMode.mAction.mActivate).mOnValueChange =
        function(context, activeMapping, newValue, diff) {
            if (newValue > 0) {                
                // then trigger remaining normal mode subpages
                subpage_EQBandSelectMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_RecMasterNormalMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_PanNormalMode.mAction.mActivate.trigger(activeMapping)                                
                subpage_LocatorsNormalMode.mAction.mActivate.trigger(activeMapping)     
                subpage_JogwheelFXSendMode[lastSelectedAux].mAction.mActivate.trigger(activeMapping)
            }    
        }    
}

function assignFXSends() {
    assignFXSendButtons(AUX1)
    assignFXSendButtons(AUX2)
    assignFXSendButtons(AUX3)
    assignFXSendButtons(AUX4)
}

function assignFXSendButtons(AUX) {
    // bind AUX button press to toggle FX send on/off within the AUX Assign Mode subpage
    page.makeValueBinding(btnAuxes[AUX].mSurfaceValue, host_SelectedTrackChannel.mSends.getByIndex(AUX).mOn)
        .setTypeToggle()
        .setSubPage(subpage_AuxAssignMode)
    
    // bind AUX button press to activate corresponding Jogwheel send subpage within the AUX Select Mode subpage
    page.makeActionBinding(btnAuxes[AUX].mSurfaceValue, subpage_JogwheelFXSendMode[AUX].mAction.mActivate)
        .setSubPage(subpage_AuxSelectMode)
}

function makeFXSendSubpage(AUX) {
    // create subpage
    var subpage = area_JogwheelFXSendSubPages.makeSubPage('AUX' + AUX + ' FX Send Jogwheel')
    
    // bind jogweel to the corresponding FX send, per subpage    
    page.makeValueBinding(knobJogWheel.mSurfaceValue, host_SelectedTrackChannel.mSends.getByIndex(AUX).mLevel)
        .setValueTakeOverModeScaled()
        .setSubPage(subpage)
    
    // bind LED updates to subpage switches
    subpage.mOnActivate = function(context, activeMapping) { displaySelectedAuxLED(context, AUX) }
    
    return subpage
}

function makeAUXLEDsDisplayFeedback() {
    // display the last selected AUX led when select subpage is activated
    subpage_AuxSelectMode.mOnActivate = function(context) { displaySelectedAuxLED(context, lastSelectedAux) } 

    // display LED's for enabled AUX's in assign mode
    assignAuxAssignLED(AUX1)
    assignAuxAssignLED(AUX2)
    assignAuxAssignLED(AUX3)
    assignAuxAssignLED(AUX4)
}

function assignAuxAssignLED(AUX) {
    // bind aux LED display to button value in assign mode
    btnAuxes[AUX].mSurfaceValue.mOnProcessValueChange = function(context, newValue, diff) {
        if (isAssignModeEnabled(context)) {
            // display LED's based on host band state, only within assign mode
            var isEnabled = newValue > 0        
            displayAssignedAuxLED(context, AUX, isEnabled)        
        }
    }.bind({AUX})
}

function toggleAssignModeVars(context) {
    // swap states of assign mode custom variables
    var assignModeOn = var_assignModeOn.getProcessValue(context)
    var assignModeOff = var_assignModeOff.getProcessValue(context)

    var_assignModeOn.setProcessValue(context, assignModeOff)
    var_assignModeOff.setProcessValue(context, assignModeOn)
    
    displayAsgnLED(context)
}

function toggleSoloModeVars(context) {
    // swap states of solo mode custom variables
    var soloModeOn = var_soloModeOn.getProcessValue(context)
    var soloModeOff = var_soloModeOff.getProcessValue(context)

    var_soloModeOn.setProcessValue(context, soloModeOff)
    var_soloModeOff.setProcessValue(context, soloModeOn)
    
    displaySoloLED(context)
}

function assignASGNButtonToVars() {
    btnAsgn.mSurfaceValue.mOnProcessValueChange = function(context, newValue, diff) {        
        if(newValue > 0) {
            // button pressed (ignore button release)
            toggleAssignModeVars(context)            
        }
    }
}

function assignEQBandControls() {     
    assignEQBandControl(EQ_BANDS.High)    
    assignEQBandControl(EQ_BANDS.HighMid)    
    assignEQBandControl(EQ_BANDS.LowMid)    
    assignEQBandControl(EQ_BANDS.Low)    
}

function assignEQBandControl(eqBand)
{       
    // bind EQ LED to band subpage activations
    subpage_EQBand[eqBand].mOnActivate = function(context) { displaySelectedEQLED(context, eqBand) }

    // bind EQ band button presses to activate corresponding band subpage within the EQ band select subpage
    page.makeActionBinding(btnEQBands[eqBand].mSurfaceValue, subpage_EQBand[eqBand].mAction.mActivate)
        .setSubPage(subpage_EQBandSelectMode)

    if ( LOW_EQ_PREFILTER_MODE && eqBand == EQ_BANDS.Low) {      
        // special functionality mode to bind LOW EQ band to control pre-filter low cut instead
        var hostPreFilter = page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter

        // bind EQ knobs to low prefilter host items, within band subpage
        page.makeValueBinding(knobGain.mSurfaceValue, hostPreFilter.mGain).setValueTakeOverModeScaled().setSubPage(subpage_EQBand[eqBand])        
        page.makeValueBinding(knobFreq.mSurfaceValue, hostPreFilter.mLowCutFreq).setValueTakeOverModeScaled().setSubPage(subpage_EQBand[eqBand])        
        page.makeValueBinding(knobQ.mSurfaceValue, hostPreFilter.mLowCutSlope).setValueTakeOverModeJump().setSubPage(subpage_EQBand[eqBand])

        // bind EQ button to toggle low prefilter on/off within the EQ assign subpage
        page.makeValueBinding(btnEQBands[eqBand].mSurfaceValue, hostPreFilter.mLowCutOn)
            .setTypeToggle()
            .setSubPage(subpage_EQAssignMode)

    } else {      
        // finish binding normal EQ mode
        var hostEQ = host_EQBand[eqBand]

        // bind EQ knobs to host eq band items, within band subpage        
        page.makeValueBinding(knobGain.mSurfaceValue, hostEQ.mGain).setValueTakeOverModeScaled().setSubPage(subpage_EQBand[eqBand])        
        page.makeValueBinding(knobFreq.mSurfaceValue, hostEQ.mFreq).setValueTakeOverModeScaled().setSubPage(subpage_EQBand[eqBand])        
        page.makeValueBinding(knobQ.mSurfaceValue, hostEQ.mQ).setValueTakeOverModeScaled().setSubPage(subpage_EQBand[eqBand])          

        // bind EQ button to toggle band on/off within the EQ assign subpage
        page.makeValueBinding(btnEQBands[eqBand].mSurfaceValue, hostEQ.mOn)
            .setTypeToggle()
            .setSubPage(subpage_EQAssignMode)
    }
}
 
function makeEQLEDsDisplayFeedback() {
    // display the last selected EQ led when select subpage is activated
    subpage_EQBandSelectMode.mOnActivate = function(context) { displaySelectedEQLED(context, lastSelectedEQBand) }

    // display LED's for enabled EQ's in assign mode
    assignEQAssignLED(EQ_BANDS.High)
    assignEQAssignLED(EQ_BANDS.HighMid)
    assignEQAssignLED(EQ_BANDS.LowMid)
    assignEQAssignLED(EQ_BANDS.Low)
}

function assignEQAssignLED(eqBand) {
    // bind high LED display to button value in assign mode
    btnEQBands[eqBand].mSurfaceValue.mOnProcessValueChange = function(context, newValue, diff) {        
        if (isAssignModeEnabled(context)) {
            // display LED's based on host band state, only within assign mode
            var isEnabled = newValue > 0
            displayAssignedEQLED(context, eqBand, isEnabled)        
        }
    }.bind({eqBand})
}

function assignTransportControls() {

    // https://steinbergmedia.github.io/midiremote_api_doc/examples/commandbindings

    // bind buttons to host transport events
    page.makeValueBinding(btnPlay.mSurfaceValue, hostTransport_Start).setTypeToggle()
    page.makeValueBinding(btnRecord.mSurfaceValue, hostTransport_Record).setTypeToggle()     
    page.makeValueBinding(btnFastForward.mSurfaceValue, hostTransport_FastForward)    
    page.makeValueBinding(var_rewPressed, hostTransport_Rewind)
    page.makeCommandBinding(btnStop.mSurfaceValue, "Transport", "Stop")    // use transport command, because mStop causes playhead to jump back
    page.makeCommandBinding(var_RTZPressed, "Transport", "Return to Zero")    
    
    // catch STOP+REW buttons to send RTZ command, or forward single REW button command, thru custom variable
    btnRewind.mSurfaceValue.mOnProcessValueChange = 
        function(context, newValue, diff) {			
			var rewindPressed = newValue > 0
            var stopPressed = btnStop.mSurfaceValue.getProcessValue(context)
			
            if (stopPressed && rewindPressed) {
                var_RTZPressed.setProcessValue(context, 1.0)          // stop is also pressed.. fire an RTZ
			} else {
				var_rewPressed.setProcessValue(context, newValue)     // stop isn't pressed.. fire a normal rewind
			}			
        }  		
}

function assignLocatorControls() {    
    // bind locator buttons to host marker commands, in regular non-"ASGN" mode
    page.makeCommandBinding(btnLocateLeft.mSurfaceValue, "Transport", "Locate Previous Marker").setSubPage(subpage_LocatorsNormalMode)
    page.makeCommandBinding(btnLocateRight.mSurfaceValue, "Transport", "Locate Next Marker").setSubPage(subpage_LocatorsNormalMode)

    // bind locator buttons to host cycle commands, in "ASGN" mode
    page.makeCommandBinding(btnLocateLeft.mSurfaceValue, "Transport", "Set Left Locator").setSubPage(subpage_LocatorsAssignMode)
    page.makeCommandBinding(btnLocateRight.mSurfaceValue, "Transport", "Set Right Locator").setSubPage(subpage_LocatorsAssignMode)
    // SET inserts a marker on release, unless used for fine adjustment or cycle
    page.makeCommandBinding(var_insertMarkerPressed, "Transport", "Insert Marker")
    page.makeCommandBinding(var_cyclePressed, "Transport", "Cycle")

    btnLocateSet.mSurfaceValue.mOnProcessValueChange = function(context, newValue, diff) {
        var isPressed = newValue > 0
        if (isPressed === setButtonHeld) return
        setButtonHeld = isPressed

        if (isPressed) {
            setButtonUsed = false
            var stopPressed = btnStop.mSurfaceValue.getProcessValue(context) > 0
            if (stopPressed) {
                setButtonUsed = true
                var_cyclePressed.setProcessValue(context, 1.0)
                var_cyclePressed.setProcessValue(context, 0.0)
            }
        } else {
            if (!setButtonUsed) {
                var_insertMarkerPressed.setProcessValue(context, 1.0)
                var_insertMarkerPressed.setProcessValue(context, 0.0)
            }
            setButtonUsed = false
        }
    }
}

function assignPanControl()
{
    // mirror current selected track values so each movement starts from the host value
    page.makeValueBinding(var_selectedPan, host_SelectedTrackChannel.mValue.mPan)
    page.makeValueBinding(var_selectedVolume, host_SelectedTrackChannel.mValue.mVolume)

    // keep relative input centered so the knob never runs out of travel
    subpage_PanNormalMode.mOnActivate = function(context, activeMapping) {
        knobPan.mSurfaceValue.setProcessValue(context, 0.5)
    }
    subpage_PanAssignMode.mOnActivate = function(context, activeMapping) {
        knobPan.mSurfaceValue.setProcessValue(context, 0.5)
    }

    // ASGN selects volume instead of pan; SET gives finer movement in either mode
    page.makeValueBinding(knobPan.mSurfaceValue, var_panInput)
        .mOnValueChange = function(context, activeMapping, newValue, diff) {
            if (newValue === 0.5) return     // ignore our own recenter feedback

            var movement = newValue - 0.5
            knobPan.mSurfaceValue.setProcessValue(context, 0.5)

            if (setButtonHeld) {
                setButtonUsed = true        // do not insert a marker when SET is released
                movement *= PAN_FINE_SCALE
            }

            var target = isAssignModeEnabled(context) ? var_selectedVolume : var_selectedPan
            var newTargetValue = target.getProcessValue(context) + movement
            target.setProcessValue(context, Math.max(0, Math.min(1, newTargetValue)))
        }
}

function assignMetronomeButton()
{    
    // bind null button to host metronome enable
    page.makeValueBinding(btnNull.mSurfaceValue, host_MetronomeActive).setTypeToggle()
}

function assignRecMasterButton()
{
    // bind rec master button to open channel editor (to view EQ, sends, etc), in "ASGN" mode
    page.makeValueBinding(btnRecMaster.mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
        .setTypeToggle()
        .setSubPage(subpage_RecMasterAssignMode)

    // bind rec master button to enable/bypass mastering effect on main bus, in regular non-"ASGN" mode
    page.makeCommandBinding(btnRecMaster.mSurfaceValue, "Mixer", "Bypass: Inserts on Main Mix")
        .setSubPage(subpage_RecMasterNormalMode)
}

function assignZoomToJogWheel() {    
    // bind custom vars to zoom
    page.makeCommandBinding(var_zoomIn, 'Zoom', 'Zoom In')
    page.makeCommandBinding(var_zoomOut, 'Zoom', 'Zoom Out')
   
    page.makeValueBinding(knobJogWheel.mSurfaceValue, var_knobJogWheel)
        .setSubPage(subpage_JogwheelZoomMode)
        .mOnValueChange =
            function(context, activeMapping, newValue, diff) {            

                // only allow zoom if we are in assign mode       
                if (!isAssignModeEnabled(context)) return

                // zoom wheel magic courtesy of Ryan C Knaggs!
                var newZoomValue = Math.floor(newValue * 100);
                if(newZoomValue <= 0) {
                    var_zoomOut.setProcessValue(context, 1000)
                }
                if(newZoomValue > lastZoomValue) {
                    // Increase
                    var_zoomIn.setProcessValue(context, 1)
                }
                if(newZoomValue < lastZoomValue) {
                    // Decrease
                    var_zoomOut.setProcessValue(context, 1)
                }
                lastZoomValue = newZoomValue;
            }    
}

//-----------------------------------------------------------------------------
// 6. MAIN SECTION - call surface/host bindings
//-----------------------------------------------------------------------------

// bind transport LED's
makeTransportDisplayFeedback(btnStop.mSurfaceValue, TRANSPORT_LED_COMMANDS.Stop)
makeTransportDisplayFeedback(btnPlay.mSurfaceValue, TRANSPORT_LED_COMMANDS.Play)
makeTransportDisplayFeedback(btnRecord.mSurfaceValue, TRANSPORT_LED_COMMANDS.Record)
makeTransportDisplayFeedback(btnFastForward.mSurfaceValue, TRANSPORT_LED_COMMANDS.FastForward)
makeTransportDisplayFeedback(var_rewPressed, TRANSPORT_LED_COMMANDS.Rewind)   // REW button uses a custom VAR to intercept STOP+REW RTZ function

// bind LED's for EQ assign/select buttons
makeEQLEDsDisplayFeedback()

// bind LED's for AUX assign/select buttons
makeAUXLEDsDisplayFeedback()

// bind metronome LED's
makeNullDisplayFeedback(btnNull)

// wire up bindings from surface controls to host events
assignTransportControls()
assignRecMasterButton()
assignLocatorControls()
assignBankButtonControls()
assignPanControl()
assignMetronomeButton()
assignChannelBanks()
assignASGNButtonToVars()
assignASGNVarsToModes()
assignFXSends()
assignEQBandControls()
assignZoomToJogWheel() 

if (ENABLE_METRONOME_FADER) {
	// bind master fader to click level
    assignMasterFader_Metronome()
} else {
	// bind master fader to dual mode Stereo Out level and FX channel 1 level
	assignMasterFader_DualMode()
}
 
// this happens when the TASCAM device is first connected
deviceDriver.mOnActivate = function(context) {        
    // reset LED's to begin    
    displayAsgnLED(context)
    displaySoloLED(context)
    displayFunctionLED(context, selectedFunction)
    displaySelectedEQLED(context, lastSelectedEQBand)
    displaySelectedAuxLED(context, lastSelectedAux)
    displayBankLeftLED(context, false)
    displayBankRightLED(context, false)    
    
    // init variables for ASGN & SOLO mode switching states, should trigger things to light up with Cubase
    initCustomHostVars(context)   
}
