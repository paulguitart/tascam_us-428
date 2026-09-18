
// PreSonus IO Station / Faderport V2 - Cubase MIDI Remote - by Paul Warner.
//
// Hardware definitions and surface geometry adapted from fp-wizard,
// September 10, 2026, by Christian & Werner.

//-----------------------------------------------------------------------------
// 0. CUSTOM SETTINGS
//-----------------------------------------------------------------------------

const CYCLE_MARKER_MAX = 9
const ENABLE_FADER_NUDGE = true // PREV/NEXT nudge Stereo Out in MASTER
const FADER_NUDGE_DB_INCREMENT = 0.5
const ENABLE_METRONOME_FADER = true // CLICK fader controls metronome level; false: Stereo Out

var ENABLE_STOP_HOLD_SAVE = true
var STOP_SAVE_HOLD_MS = 1500
var STOP_SAVE_PREDELAY_MS = 500       // wait before lighting the hold-progress LEDs
var SAVE_BLINK_INTERVAL_MS = 140
var SAVE_BLINK_TOGGLES = 10             // 5 full blinks, like the Korg

// Hardware refinements. Volume-specific options stay off until we need them.
const ENABLE_FADER_TOUCH_INPUT = true        // ignore motor-generated input when not touched
const ENABLE_FADER_TOUCH_PROTECTION = true   // don't drive the motor under your finger
const ENABLE_MIDI_OUTPUT_CACHE = true        // skip identical LED/motor messages
const ENABLE_FADER_LOW_END_SNAP = false
const ENABLE_FOOTSWITCH_NORMALIZATION = true
const FOOTSWITCH_NORMALLY_CLOSED = true
const FOOTSWITCH_IS_TOGGLE = false           // false: press/release; true: pulse on each edge
const ENABLE_HIGH_PASS_COLOR_GRADIENT = true // false: solid green when enabled

// Calibration values
const FADER_LOW_END_THRESHOLD = 0.012        // inherited from fp-wizard; normalized travel
const FADER_HOST_UNITY = 0.789087            // original +6 dB setting; +12 dB uses 0.748222
const FADER_HARDWARE_UNITY = 0.789087        // measure your unit's U position before enabling
const ENABLE_FADER_UNITY_CALIBRATION = false

// LED color values
const FULL_BRIGHTNESS = 1
const HALF_BRIGHTNESS = 0.5
const LED_OFF_COLOR = [0, 0, 0]
const RED = [127, 0, 0]
const GREEN = [0, 127, 0]
const BLUE =  [0, 0, 127]
const AMBER =  [127, 48, 0]
const MAGENTA = [127, 0, 127]
const LINK_LOWER_COLOR = [127, 0, 40] // red-leaning magenta; distinct from green and amber

// button color values
const ENABLE_PAN_COLOR = true             // white center, blue left, magenta right
const ENABLE_NUCLEAR_METRONOME_LEDS = false // spread metronome status across inactive mode buttons
const ENABLE_NUCLEAR_RECORD_BLINK = true    // spread recording red pulse across inactive mode buttons
const METRONOME_PULSE_COLOR = BLUE
const ENABLE_METRONOME_PULSE = true
const METRONOME_PULSE_MIN_BRIGHTNESS = 0.15
const WHITE = [127, 127, 127]

// RGB-capable buttons (for reference):
//
// TOUCH, WRITE, READ
// LINK, PAN, CHANNEL, SCROLL

/*
====================================================================================================
PRESONUS IO STATION / FADERPORT V2 BASIC | CURRENT USAGE SUMMARY
====================================================================================================

TRANSPORT:
----------------------------------------------------------------------------------------------------
PLAY / REC / CYCLE       : Start, Record and Cycle (Loop) on/off
REW / FF                 : Rewind / Fast Forward
STOP (Tap)               : Stop Transport
STOP (Hold 1.5s)         : Save; REW / FF / PLAY / REC LEDs blink to confirm
STOP + REW               : Return To Zero (press STOP, then REW)

SHIFT LAYER:
----------------------------------------------------------------------------------------------------
SHIFT                   : Latched layer toggle; press again to return to normal
SHIFT + SOLO / MUTE      : Clear all Solo / Mute
SHIFT + ARM              : Toggle Arm All / Disarm All Audio Tracks
TRANSPORT / FADER / KNOB : Keep their direct functions in either layer

ACTIVE PRINTED BUTTONS:
----------------------------------------------------------------------------------------------------
WRITE / READ (Normal)    : Toggle selected-track automation Write / Read; LEDs red / green
SOLO / MUTE / ARM (Normal): Toggle selected-track Solo / Mute / Record Enable
                           : LEDs follow the selected-track state
PREV / NEXT              : Select Previous / Next Track
SHIFT + PREV / NEXT      : Undo / Redo
LINK (Normal)            : Mouse parameter on knob; fader dormant; push restores captured starting value
                         : LINK LED white = unlocked, amber = locked
                         : Press LINK inside mode: clear lock if locked; otherwise toggle knob/fader
SHIFT inside LINK       : Toggle knob/fader; selection recalled on return, isolated from other modes
                         : TOUCH captures/locks (green = saved value, magenta = above, cyan = below); BYPASS disables controls
PAN (Normal)             : Select Pan knob mode; knob push centers pan
SCROLL / SHIFT + SCROLL  : Select Zoom knob mode
MASTER (Normal)          : Select Master mode; encoder controls FX Return 1, fader controls Stereo Out
CLICK (Normal)           : Select Click Level knob mode
KNOB PUSH (Click Mode)   : Metronome on/off; Click LED shows Click mode; inactive RGB mode LEDs optionally show metronome
CHANNEL (Normal)         : Select High Pass (Low Cut) knob mode for the selected track
SHIFT + CHANNEL         : Pre-gain; push resets 0 dB; BYPASS flips polarity (LED on = inverted)
SECTION (Normal)         : Prev/Next recall cycle markers (wrap); keep current fader target
MARKER (Normal)          : Select Marker mode; Prev/Next locate markers; knob push inserts marker

KNOB MODES:
----------------------------------------------------------------------------------------------------
SHIFT + PAN              : Selected Track Send 1 Level; press knob to reset to 0 dB
PAN                      : Selected Track Pan; press knob to center pan
ZOOM                     : Horizontal Zoom In / Out commands
MASTER                   : Encoder controls FX Return 1; fader controls Stereo Out Volume
CLICK                    : Metronome Click Level; fader controls Stereo Out Volume
HIGH PASS                : Selected Track Low Cut Frequency; push resets minimum; BYPASS toggles filter
HIGH PASS LED            : White when disabled; color indicates frequency when enabled
MARKER                   : Prev/Next locate previous/next marker; knob push inserts marker

FADER / FOOTSWITCH:
----------------------------------------------------------------------------------------------------
FADER                    : Selected Track Volume; MASTER / CLICK use Stereo Out; SCROLL / SECTION / MARKER keep prior target
                         : Input is ignored until touched
                         : Motor waits while touched, then applies any pending position
FOOTSWITCH               : Normalized to normally-closed press/release behavior by default

BYPASS BUTTON PATHS:
----------------------------------------------------------------------------------------------------
BYPASS                   : PAN/SHIFT + PAN: send 1
                         : CHANNEL: high pass
						 : CLICK, SCROLL, SECTION, MARKER: metronome enabled
                         : MASTER: Main Mix inserts (LED means not bypassed)
						 
UNASSIGNED BUTTON PATHS:
----------------------------------------------------------------------------------------------------
TOUCH                    : Normal path
SHIFT + BYPASS / TOUCH / WRITE / READ          : BypassAll / Latch / Trim / Off
SHIFT inside LINK        : Toggle remembered knob/fader selection
SHIFT + PAN              : Send 1 mode
SHIFT + CHANNEL          : High Pass mode
SHIFT + MASTER / CLICK   : Master / Click modes
SHIFT + SECTION          : Section mode
MARKER                   : Marker mode with or without SHIFT
FOOTSWITCH PRESS         : Logical press path available for a future assignment

====================================================================================================
*/

//-----------------------------------------------------------------------------
// DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var deviceDriver = require('midiremote_api_v1')
    .makeDeviceDriver('PreSonus', 'IOStation', 'Paul Warner')
var midiIn = deviceDriver.mPorts.makeMidiInput()
var midiOut = deviceDriver.mPorts.makeMidiOutput()

deviceDriver.makeDetectionUnit().detectPortPair(midiIn, midiOut)
    .expectInputNameEquals('ioStation 24c MIDI In').expectOutputNameEquals('ioStation 24c MIDI Out')

//-----------------------------------------------------------------------------
// IOSTATION/FADERPORT v2 DEVICE CONSTANTS - device codes for MIDI messages
//-----------------------------------------------------------------------------

// MIDI channel arguments are zero-based. This script does not change its DAW mode.
var cSolo = 0x08, cMute = 0x10, cArm = 0x00, cShift = 0x46
var cBypass = 0x03, cTouch = 0x4D, cWrite = 0x4B, cRead = 0x4A
var cPrev = 0x2E, cNext = 0x2F, cKnobRotate = 0x10, cKnobPress = 0x20
var cLink = 0x05, cPan = 0x2A, cChannel = 0x36, cScroll = 0x38
var cMaster = 0x3A, cClick = 0x3B, cSection = 0x3C, cMarker = 0x3D
var cCycle = 0x56, cRWD = 0x5B, cFWD = 0x5C, cStop = 0x5D, cPlay = 0x5E, cRecord = 0x5F
var cFootswitch = 0x66, cFaderTouch = 0x68

//-----------------------------------------------------------------------------
// SURFACE LAYOUT - create control elements
//-----------------------------------------------------------------------------

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
var mappedFaderTouch = surface.makeCustomValueVariable('Mapped Fader Touch')
faderTouch.mMidiBinding.setInputPort(midiIn).bindToNote(0, cFaderTouch)
var cubase13OrHigher = !!fader.mSurfaceValue.mTouchState
if (cubase13OrHigher) {
    fader.mSurfaceValue.mTouchState.bindTo(mappedFaderTouch)
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
// Sole encoder MIDI receiver. The host-bound visible knob is driven only outside LINK.
var mouseKnobInput = surface.makeCustomValueVariable('LINK Encoder Input')
mouseKnobInput.mMidiBinding.setInputPort(midiIn)
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
    { physicalButton: mSection.btn_Link, normalName: 'Link', shiftedName: 'MouseFader' },
    { physicalButton: mSection.btn_Pan, normalName: 'Pan', shiftedName: 'Send' },
    { physicalButton: mSection.btn_Channel, normalName: 'Channel', shiftedName: 'PreGain' },
    { physicalButton: mSection.btn_Scroll, normalName: 'Scroll', shiftedName: 'Zoom' },
    { physicalButton: mSection.btn_Master, normalName: 'Master', shiftedName: 'Master' },
    { physicalButton: mSection.btn_Click, normalName: 'Click', shiftedName: 'Click' },
    { physicalButton: mSection.btn_Section, normalName: 'Section', shiftedName: 'Section' },
    { physicalButton: mSection.btn_Marker, normalName: 'Marker', shiftedName: 'Marker' }
]

// Mode buttons behave the same in both SHIFT layers.
// Physical surface buttons remain the single MIDI input source.
var buttons = {}
var selectedTrackToggleValues = {}

//-----------------------------------------------------------------------------
// HELPERS 
//-----------------------------------------------------------------------------

// Pulse command inputs without changing held-button or toggle behavior.
function pulseVar(context, v) {
    v.setProcessValue(context, 1.0)
    v.setProcessValue(context, 0.0)
}

function toggleSelectedTrackValue(context, name) {
    var stateValue = selectedTrackToggleValues[name]
    if (!stateValue) return
    var isOn = stateValue.getProcessValue(context) > 0
    stateValue.setProcessValue(context, isOn ? 0 : 1)
}

function assignButtonRouting(mapping) {
    var normalName = mapping.normalName
    var shiftedName = mapping.shiftedName
    buttons[normalName] = surface.makeCustomValueVariable(normalName)
    if (shiftedName !== normalName) buttons[shiftedName] = surface.makeCustomValueVariable(shiftedName)
    var stateKey = 'held.' + normalName
    mapping.physicalButton.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        // Navigation LEDs follow the physical buttons in every mode and SHIFT layer.
        if (normalName === 'Prev') {
            setTransportLed(context, cPrev, value > 0)
        } else if (normalName === 'Next') {
            setTransportLed(context, cNext, value > 0)
        }
        var activeName = context.getState(stateKey)
        if (value > 0) {
            if (activeName) { return } // Ignore repeated press messages.
            if (normalName === 'Link' && isMouseLinkMode(context.getState('knobMode'))) {
                context.setState(stateKey, 'LinkHandled')
                handleMouseLinkButton(context)
                return
            }
            activeName = context.getState('shiftEnabled') === '1' ? shiftedName : normalName
            if (normalName === 'Bypass' && (context.getState('knobMode') === 'PreGain' || isMouseLinkMode(context.getState('knobMode')) || context.getState('knobMode') === 'Pan' || context.getState('knobMode') === 'Send')) activeName = 'Bypass'
            if (normalName === 'Touch' && isMouseLinkMode(context.getState('knobMode'))) activeName = 'Touch'
            activeName = resolveKnobModeButton(context, activeName)
            context.setState(stateKey, activeName)
            // Selected-track state bindings toggle on press; their release must not clear the host value.
            if (activeName === normalName && selectedTrackToggleValues[normalName]) {
                toggleSelectedTrackValue(context, normalName)
            }
            if (activeName === 'Prev' || activeName === 'Next') {
                routeNavigationPress(context, activeName)
            }
            if (activeName === 'ArmAll') {
                toggleArmAll(context)
            }
            if (activeName === 'Bypass') {
                // Route the physical press directly, just like the knob push.
                toggleModeEffect(context)
            }
            if (activeName === 'Touch') {
                if (isMouseLinkMode(context.getState('knobMode'))) beginMouseLinkCapture(context)
                else resetCurrentFader(context)
            }
            buttons[activeName].setProcessValue(context, 1)
        } else if (activeName) {
            // Release the path that received the press, even if SHIFT changed meanwhile.
            if (activeName !== 'LinkHandled') buttons[activeName].setProcessValue(context, 0)
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
    var mode = context.getState('knobMode')
    if (mode === 'HighPass' || mode === 'PreGain') {
        pulseVar(context, enabled ? buttons.PreGain : buttons.Channel)
    } else if (mode === 'Pan' || mode === 'Send') {
        pulseVar(context, enabled ? buttons.Send : buttons.Pan)
    } else if (isMouseLinkMode(mode)) {
        pulseVar(context, enabled ? buttons.MouseFader : buttons.Link)
    }
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
        if (shiftedButton !== normalButton) shiftedButton.setProcessValue(context, 0)
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
    // Use an ES5 body check; Cubase does not parse ES2015 default parameters.
    if (typeof brightness === 'undefined') brightness = FULL_BRIGHTNESS
    brightness = Math.max(0, Math.min(1, brightness))
    sendHardwareMidi(context, 0x91, note, midi7(midi7(r) * brightness))
    sendHardwareMidi(context, 0x92, note, midi7(midi7(g) * brightness))
    sendHardwareMidi(context, 0x93, note, midi7(midi7(b) * brightness))
}
function setRGBLED_color(context, note, color, brightness) {
    setRGBLED(context, note, color[0], color[1], color[2], brightness)
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
    if (context.getState('faderTarget') === 'Dormant'
        || (context.getState('faderTarget') === 'Mouse' && !isMouseLinkControlEnabled(context))) {
        context.setState('pendingMotorPosition', '')
        return
    }
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
    if (context.getState('faderTarget') === 'Dormant'
        || (context.getState('faderTarget') === 'Mouse' && !isMouseLinkControlEnabled(context))) {
        // A manual move while dormant must not suppress the next linked motor target.
        context.setState('lastMotorPosition', '')
        context.setState('pendingMotorPosition', '')
        return
    }
    if (context.getState('mouseFaderWaitRelease') === '1') return
    if (ENABLE_FADER_TOUCH_INPUT && faderTouch.getProcessValue(context) <= 0) return
    // Manual motion invalidates the last motor target and any older deferred move.
    context.setState('lastMotorPosition', '')
    context.setState('pendingMotorPosition', '')
    value = clampFader(value)
    if (context.getState('faderTarget') !== 'Mouse') {
        value = snapFaderBottom(value)
        value = scaleFaderUnity(value, FADER_HARDWARE_UNITY, FADER_HOST_UNITY)
    }
    context.setState('processingFaderInput', '1')
    fader.mSurfaceValue.setProcessValue(context, value)
    context.setState('processingFaderInput', '')
}

fader.mSurfaceValue.mOnProcessValueChange = function(context, value) {
    if (context.getState('faderTarget') === 'Dormant') return
    if (context.getState('processingFaderInput') === '1') return
    if (context.getState('faderTarget') === 'Mouse') {
        if (isMouseLinkControlEnabled(context)) setMotorFader(context, clampFader(value))
        return
    }
    value = scaleFaderUnity(clampFader(value), FADER_HOST_UNITY, FADER_HARDWARE_UNITY)
    setMotorFader(context, snapFaderBottom(value))
}

faderTouch.mOnProcessValueChange = function(context, value) {
    if (value > 0 && context.getState('faderTarget') === 'Mouse' && !isMouseLinkControlEnabled(context)) {
        context.setState('mouseFaderWaitRelease', '1')
    }
    mappedFaderTouch.setProcessValue(context,
        context.getState('faderTarget') === 'Dormant' || context.getState('mouseFaderWaitRelease') === '1'
        || (context.getState('faderTarget') === 'Mouse' && !isMouseLinkControlEnabled(context)) ? 0 : value)
    if (value > 0) return
    context.setState('mouseFaderWaitRelease', '')
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
        pulseVar(context, var_footswitchPressed)
    } else {
        var isPressed = FOOTSWITCH_NORMALLY_CLOSED ? !isOn : isOn
        var_footswitchPressed.setProcessValue(context, isPressed ? 1 : 0)
    }
}

function resetHardwareState(context) {
    context.setState('lastMotorPosition', '')
    context.setState('pendingMotorPosition', '')
    context.setState('processingFaderInput', '')
    context.setState('mouseFaderWaitRelease', '')
    context.setState('mouseCaptureAt', '')
    context.setState('mouseStartingValue', '')
    context.setState('mouseBypassed', '')
    context.setState('footswitchLastState', '')
    mappedFaderTouch.setProcessValue(context, 0)
    context.setState('knobPressRouted', '')
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
        setRGBLED(context, rgbNotes[i], 127, 127, 127)
    }
    setRGBLED_color(context, cWrite, RED)
    setRGBLED_color(context, cRead, GREEN)
    updateClickLED(context)
    updateBypassLED(context)
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
var hostMetronomeActive = hostTransport.mMetronomeActive
var metronomeFeedbackValue = null
var highPassEnabledFeedbackValue = null
var highPassFrequencyFeedbackValue = null
var firstSendEnabledFeedbackValue = null
var confirmTransportNotes = [cRWD, cFWD, cPlay, cRecord]
var stopProgressNotes = [cFWD, cRWD, cPlay, cRecord]

function resetStopProgress(context) {
	context.setState('stopHoldStartMs', '')
    var hadProgress = context.getState('stopProgressCount') !== ''
    context.setState('stopProgressCount', '')
    if (hadProgress && context.getState('saveBlinkCount') === '') restoreTransportLEDs(context)
}

function updateStopProgress(context, elapsed) {
    // Confirmation from an earlier save takes priority over a new hold.
    if (context.getState('saveBlinkCount') !== '' || elapsed < STOP_SAVE_PREDELAY_MS) return
    var duration = Math.max(1, STOP_SAVE_HOLD_MS - STOP_SAVE_PREDELAY_MS)
    var count = Math.min(stopProgressNotes.length,
        1 + Math.floor((elapsed - STOP_SAVE_PREDELAY_MS) * stopProgressNotes.length / duration))
    if (context.getState('stopProgressCount') === String(count)) return
    context.setState('stopProgressCount', String(count))
    for (var i = 0; i < stopProgressNotes.length; i++) {
        setTransportLed(context, stopProgressNotes[i], i < count)
    }
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
				pulseVar(context, var_RTZPressed)
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
// CYCLE MARKERS - Korg recall/wrap pattern, independent of Cycle on/off
//-----------------------------------------------------------------------------
var var_cycleMarkers = new Array(CYCLE_MARKER_MAX + 1)

// Dedicated host inputs prevent a navigation press from reaching two targets.
var var_trackPrev = surface.makeCustomValueVariable('Previous Track Pressed')
var var_trackNext = surface.makeCustomValueVariable('Next Track Pressed')
var var_markerPrev = surface.makeCustomValueVariable('Previous Marker Pressed')
var var_markerNext = surface.makeCustomValueVariable('Next Marker Pressed')
var var_setLeftLocatorPressed = surface.makeCustomValueVariable('Set Left Locator Pressed')
var var_setRightLocatorPressed = surface.makeCustomValueVariable('Set Right Locator Pressed')

function routeNavigationPress(context, direction) {
    var mode = context.getState('knobMode')

    if (ENABLE_FADER_NUDGE && mode === 'Master') {
        nudgeCurrentFader(context, direction === 'Prev' ? -1 : 1)
    } else if (mode === 'Section') {
        if (direction === 'Prev') {
            recallPrevCycle(context)
        } else {
            recallNextCycle(context)
        }
    } else if (mode === 'Marker') {
        if (direction === 'Prev') {
            pulseVar(context, var_markerPrev)
        } else {
            pulseVar(context, var_markerNext)
        }
    } else if (mode === 'Zoom' || mode === 'Master') {
        if (direction === 'Prev') {
            pulseVar(context, var_setLeftLocatorPressed)
        } else {
            pulseVar(context, var_setRightLocatorPressed)
        }
    } else {
        if (direction === 'Prev') {
            pulseVar(context, var_trackPrev)
        } else {
            pulseVar(context, var_trackNext)
        }
    }
}

function setupCycleMarkerCommands() {
    for (var i = 1; i <= CYCLE_MARKER_MAX; i++) {
        var_cycleMarkers[i] = surface.makeCustomValueVariable('Cycle Marker ' + i)
        page.makeCommandBinding(var_cycleMarkers[i], 'Transport', 'Recall Cycle Marker ' + i)
    }

}

function wrapCycleNumber(n) {
    if (n < 1) return CYCLE_MARKER_MAX
    if (n > CYCLE_MARKER_MAX) return 1
    return n
}

function fireCycleRecall(context, number) {
    var v = var_cycleMarkers[number]
    if (!v) return
    pulseVar(context, v)
}

function recallPrevCycle(context) {
    var number = wrapCycleNumber((Number(context.getState('activeCycleMarker')) || 1) - 1)
    context.setState('activeCycleMarker', String(number))
    fireCycleRecall(context, number)
}

function recallNextCycle(context) {
    var number = wrapCycleNumber((Number(context.getState('activeCycleMarker')) || 1) + 1)
    context.setState('activeCycleMarker', String(number))
    fireCycleRecall(context, number)
}

var var_armAllPressed = surface.makeCustomValueVariable('Arm All Audio Tracks Pressed')
var var_disarmAllPressed = surface.makeCustomValueVariable('Disarm All Audio Tracks Pressed')

function toggleArmAll(context) {
    // Alternate presses; selected-track arm feedback also keeps this state current.
    // Set the next state before sending, so synchronous host feedback takes priority.
    if (context.getState('disarmAllNext') === '1') {
        context.setState('disarmAllNext', '0')
        pulseVar(context, var_disarmAllPressed)
    } else {
        context.setState('disarmAllNext', '1')
        pulseVar(context, var_armAllPressed)
    }
}

// Printed functions use the logical button paths, so SHIFT routing stays in one place.
function assignUtilityControls() {
    page.makeCommandBinding(buttons.SoloClear, 'Edit', 'Deactivate All Solo')
    page.makeCommandBinding(buttons.MuteClear, 'Edit', 'Unmute All')
    page.makeCommandBinding(var_armAllPressed, 'Mixer', 'Arm All Audio Tracks')
    page.makeCommandBinding(var_disarmAllPressed, 'Mixer', 'Disarm All Audio Tracks')
	page.makeCommandBinding(var_setLeftLocatorPressed, 'Transport', 'Set Left Locator')
	page.makeCommandBinding(var_setRightLocatorPressed, 'Transport', 'Set Right Locator')
	page.makeCommandBinding(buttons.Undo, 'Edit', 'Undo')
	page.makeCommandBinding(buttons.Redo, 'Edit', 'Redo')
}

// Direct access reads/writes Cubase's displayed dB value; no volume curve approximation.
var faderNudgeAccess = {}
var faderNudgeMappings = []

function activateFaderNudge(context, activeMapping) {
    var key = context.getState('faderNudgeMapping')
    if (key === '') {
        key = String(faderNudgeMappings.length)
        context.setState('faderNudgeMapping', key)
    }
    faderNudgeMappings[Number(key)] = activeMapping
    for (var name in faderNudgeAccess) faderNudgeAccess[name].activate(activeMapping)
}

function deactivateFaderNudge(context, activeMapping) {
    for (var name in faderNudgeAccess) faderNudgeAccess[name].deactivate(activeMapping)
    var key = context.getState('faderNudgeMapping')
    if (key !== '') faderNudgeMappings[Number(key)] = null
}

function parseFaderDb(text) {
    var match = String(text).replace(/\s/g, '').replace(',', '.')
        .match(/^([+-]?[0-9]+(?:\.[0-9]+)?)(?:dB)?$/i)
    return match ? Number(match[1]) : NaN
}

function nudgeCurrentFader(context, direction) {
    var target = context.getState('faderTarget')
    var value = faderTargetFeedback[target]
    if (!value) return
    if (target === 'Metronome') return // Metronome level stays on its knob/fader controls.
    if (!isFinite(FADER_NUDGE_DB_INCREMENT) || FADER_NUDGE_DB_INCREMENT <= 0) return
    var key = context.getState('faderNudgeMapping')
    var activeMapping = key === '' ? null : faderNudgeMappings[Number(key)]
    var access = faderNudgeAccess[target]
    if (!access || !activeMapping) return
    access.update(activeMapping)
    var objectID = access.getBaseObjectID(activeMapping)
    var count = access.getNumberOfParameters(activeMapping, objectID)
    // Channel Volume is tag 1025 (enumerate to confirm it exists on this object).
    // Resolve the live base object each press so track selection cannot leave a stale target.
    for (var i = 0; i < count; i++) {
        var tag = access.getParameterTagByIndex(activeMapping, objectID, i)
        if (tag !== 1025) continue
        if (access.getParameterEditLockState(activeMapping, objectID, tag)) return
        var units = String(access.getParameterDisplayUnits(activeMapping, objectID, tag) || '').replace(/\s/g, '')
        // MIDI track volume has no dB scale; do not treat its 0..127 value as dB.
        var display = access.getParameterDisplayValue(activeMapping, objectID, tag)
        if (units && !/^db$/i.test(units)) return
        var current = parseFaderDb(display)
        if (!isFinite(current)) return // -infinity is not a finite dB starting point.
        var next = Math.round((current + direction * FADER_NUDGE_DB_INCREMENT) * 1000000) / 1000000
        var text = String(next)
        if (String(display).indexOf(',') >= 0) text = text.replace('.', ',')
        access.setParameterDisplayValue(activeMapping, objectID, tag, text)
        return
    }
}

var faderTargetFeedback = {}

function updateTouchLED(context) {
    if (isMouseLinkMode(context.getState('knobMode'))) {
        var saved = context.getState('mouseStartingValue')
        var locked = saved !== '' && context.getState('mouseCaptureAt') === ''
            && mouseLockFeedbackValue.getProcessValue(context) > 0
        if (locked) {
            var difference = mouseParameterFeedbackValue.getProcessValue(context) - Number(saved)
            var tolerance = 1 / 16383
            setRGBLED_color(context, cTouch, difference > tolerance ? MAGENTA : difference < -tolerance ? LINK_LOWER_COLOR : GREEN)
        }
        setTransportLed(context, cTouch, locked)
        return
    }
    var target = context.getState('faderTarget')
    var value = faderTargetFeedback[target]
    var color = null
    if (value) {
        var level = value.getProcessValue(context)
        var tolerance = 1 / 16383
        if (level >= 1 - tolerance) color = RED
        else if (level <= tolerance) color = AMBER
        // Match the reset value directly; display callbacks may omit dB units.
        else if (target !== 'Metronome' && Math.abs(level - FADER_HOST_UNITY) <= tolerance) color = WHITE
    }
    if (color) setRGBLED_color(context, cTouch, color)
    setTransportLed(context, cTouch, !!color)
}

function resetCurrentFader(context) {
    var target = context.getState('faderTarget')
    if (isMouseLinkMode(context.getState('knobMode'))) return
    var value = faderTargetFeedback[target]
    if (value) value.setProcessValue(context, target === 'Metronome' ? 1 : FADER_HOST_UNITY)
}

function setupFaderTargetFeedback(name, hostValue) {
    var value = surface.makeCustomValueVariable(name + ' Fader Reset Feedback')
    faderTargetFeedback[name] = value
    page.makeValueBinding(value, hostValue)
    value.mOnProcessValueChange = function(context) {
        if (context.getState('faderTarget') === name) updateTouchLED(context)
    }

}

function assignSelectedTrackControls() {
    var hostTrackSelection = page.mHostAccess.mTrackSelection
    var hostSelectedTrack = hostTrackSelection.mMixerChannel

    page.makeActionBinding(var_trackPrev, hostTrackSelection.mAction.mPrevTrack)
    page.makeActionBinding(var_trackNext, hostTrackSelection.mAction.mNextTrack)
    // Independent fader subpages let Scroll, Section and Marker preserve the previous assignment.
    page.makeValueBinding(fader.mSurfaceValue, hostSelectedTrack.mValue.mVolume)
        .setSubPage(faderModes.Track)
    page.makeValueBinding(fader.mSurfaceValue, hostStereoOut.mValue.mVolume)
        .setSubPage(faderModes.StereoOut)
    page.makeValueBinding(fader.mSurfaceValue, hostTransport.mMetronomeClickLevel)
        .setSubPage(faderModes.Metronome)
    page.makeValueBinding(fader.mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
        .setSubPage(faderModes.Mouse)
    if (ENABLE_FADER_NUDGE && page.mHostAccess.makeDirectAccess) {
        faderNudgeAccess.Track = page.mHostAccess.makeDirectAccess(hostSelectedTrack)
        faderNudgeAccess.StereoOut = page.mHostAccess.makeDirectAccess(hostStereoOut)
    }
    setupFaderTargetFeedback('Track', hostSelectedTrack.mValue.mVolume)
    setupFaderTargetFeedback('StereoOut', hostStereoOut.mValue.mVolume)
    setupFaderTargetFeedback('Metronome', hostTransport.mMetronomeClickLevel)
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
        if (note === cRecord) {
            context.setState('metronomeRecording', newValue > 0 ? '1' : '0')
            context.setState('metronomePulseStart', '')
            updateMetronomeModeLEDs(context, Date.now())
        }
		// Save animation owns only REW, FF, PLAY and REC; STOP/CYCLE remain live.
		if ((context.getState('saveBlinkCount') !== '' || context.getState('stopProgressCount') !== '')
            && confirmTransportNotes.indexOf(note) >= 0) return
		setTransportLed(context, note, newValue > 0)
	}
}

function updateClickLED(context) {
    setTransportLed(context, cClick, context.getState('knobMode') === 'Click')
}

// Tascam pattern: host BPM -> milliseconds per beat -> Date.now() idle timer.
// This follows tempo rate, not the transport's musical beat position.
var hostTimeDisplay = page.mHostAccess.mTransport.mTimeDisplay
hostTimeDisplay.mOnChangeTempoBPM = function(context, activeMapping, tempoBPM) {
    if (!isFinite(tempoBPM) || tempoBPM <= 0) tempoBPM = 120
    context.setState('metronomeMsPerBeat', String(Math.max(150, 60000 / tempoBPM)))
    context.setState('metronomePulseStart', '')
}

function updateMetronomeModeLEDs(context, now) {
    var enabled = ENABLE_NUCLEAR_METRONOME_LEDS && context.getState('metronomeEnabled') === '1'
    var recording = ENABLE_NUCLEAR_RECORD_BLINK && context.getState('metronomeRecording') === '1'
    var color = recording ? RED : METRONOME_PULSE_COLOR
    var brightness = 1
    if (recording && ENABLE_METRONOME_PULSE) {
        var start = context.getState('metronomePulseStart')
        if (start === '' || now < Number(start)) {
            start = String(now)
            context.setState('metronomePulseStart', start)
        }
        var interval = Number(context.getState('metronomeMsPerBeat')) || 500
        var phase = ((now - Number(start)) % interval) / interval
        brightness = METRONOME_PULSE_MIN_BRIGHTNESS
            + (1 - METRONOME_PULSE_MIN_BRIGHTNESS) * (1 + Math.cos(2 * Math.PI * phase)) / 2
    }
    var mode = context.getState('knobMode')
    var notes = [cLink, cPan, cChannel, cScroll]
    var modes = ['Mouse', 'Pan', 'HighPass', 'Zoom']
    for (var i = 0; i < notes.length; i++) {
        if (isMouseLinkMode(mode) && notes[i] === cLink) {
            updateMouseLinkLED(context)
        } else if (mode === 'Send' && notes[i] === cPan) {
            setRGBLED_color(context, cPan, BLUE)
            onLED(context, cPan)
        } else if (mode === 'PreGain' && notes[i] === cChannel) {
            updatePreGainLED(context)
        } else if (mode === modes[i]) {
            if (mode === 'HighPass') updateHighPassLED(context)
            else if (mode === 'Pan') updatePanLED(context)
            else {
                setRGBLED_color(context, notes[i], WHITE)
                onLED(context, notes[i])
            }
        } else if (recording || enabled) {
            setRGBLED_color(context, notes[i], color, brightness)
            onLED(context, notes[i])
        } else {
            offLED(context, notes[i])
        }
    }
}

function setupMetronomeFeedback() {
    metronomeFeedbackValue = surface.makeCustomValueVariable('Metronome LED Feedback')
    page.makeValueBinding(metronomeFeedbackValue, hostMetronomeActive)
    metronomeFeedbackValue.mOnProcessValueChange = function(context, newValue) {
        var enabled = newValue > 0 ? '1' : '0'
        if (context.getState('metronomeEnabled') !== enabled) {
            context.setState('metronomePulseStart', '')
        }
        context.setState('metronomeEnabled', enabled)
        updateMetronomeModeLEDs(context, Date.now())
        updateBypassLED(context)
    }
}

function toggleMetronome(context) {
    var currentValue = Number(metronomeFeedbackValue.getProcessValue(context))
    metronomeFeedbackValue.setProcessValue(context, currentValue > 0 ? 0 : 1)
}

function setupTransportFeedback() {
	sendTransportFeedback(hostTransport.mRewind, cRWD, 'Rewind')
	sendTransportFeedback(hostTransport.mForward, cFWD, 'Fast Forward')
	sendTransportFeedback(hostTransport.mStop, cStop, 'Stop')
	sendTransportFeedback(hostTransport.mStart, cPlay, 'Play')
	sendTransportFeedback(hostTransport.mRecord, cRecord, 'Record')
	sendTransportFeedback(hostTransport.mCycleActive, cCycle, 'Cycle')
}

function sendSelectedTrackFeedback(hostValue, note, name, color) {
    var ledValue = surface.makeCustomValueVariable(name + ' LED Feedback')
    page.makeValueBinding(ledValue, hostValue)
    ledValue.mOnProcessValueChange = function(context, newValue) {
        if (note === cArm) {
            context.setState('disarmAllNext', newValue > 0 ? '1' : '0')
        }
        if (color) {
            setRGBLED_color(context, note, color)
        }
        setTransportLed(context, note, newValue > 0)
    }
    return ledValue
}

function setupSelectedTrackFeedback() {
	var selectedTrack = page.mHostAccess.mTrackSelection.mMixerChannel.mValue
	selectedTrackToggleValues.Solo = sendSelectedTrackFeedback(selectedTrack.mSolo, cSolo, 'Selected Track Solo')
	selectedTrackToggleValues.Mute = sendSelectedTrackFeedback(selectedTrack.mMute, cMute, 'Selected Track Mute')
	selectedTrackToggleValues.Arm = sendSelectedTrackFeedback(selectedTrack.mRecordEnable, cArm, 'Selected Track Record Enable')
    selectedTrackToggleValues.Write = sendSelectedTrackFeedback(selectedTrack.mAutomationWrite, cWrite, 'Selected Track Automation Write', RED)
    selectedTrackToggleValues.Read = sendSelectedTrackFeedback(selectedTrack.mAutomationRead, cRead, 'Selected Track Automation Read', GREEN)
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
    updateMouseLinkCapture(context, now)
    updateMetronomeModeLEDs(context, now)
	var holdStart = context.getState('stopHoldStartMs')
	if (ENABLE_STOP_HOLD_SAVE && holdStart !== '') {
        var elapsed = now - Number(holdStart)
        if (elapsed >= STOP_SAVE_HOLD_MS) {
            // Transfer LED ownership directly from progress to confirmation.
            blinkConfirmTransportLEDs(context)
            resetStopProgress(context)
            pulseVar(context, var_savePressed)
        } else {
            updateStopProgress(context, elapsed)
        }
    } else if (!ENABLE_STOP_HOLD_SAVE && holdStart !== '') {
        resetStopProgress(context)
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
var faderModeArea = page.makeSubPageArea('Fader Target')
var faderModes = {
    Dormant: faderModeArea.makeSubPage('Dormant'), // No host binding or motor movement.
    Track: faderModeArea.makeSubPage('Selected Track'),
    StereoOut: faderModeArea.makeSubPage('Stereo Out'),
    Metronome: faderModeArea.makeSubPage('Metronome Level'),
    Mouse: faderModeArea.makeSubPage('Mouse Parameter')
}
var knobModeArea = page.makeSubPageArea('Knob Mode')
var knobModes = {
    Mouse: knobModeArea.makeSubPage('Mouse Parameter'), // Safe default: unlocked, fader dormant.
    Send: knobModeArea.makeSubPage('Send 1'),
    MouseFader: knobModeArea.makeSubPage('Mouse Fader (Knob Disabled)'),
    Pan: knobModeArea.makeSubPage('Pan'),
    Zoom: knobModeArea.makeSubPage('Zoom'),
    Master: knobModeArea.makeSubPage('Master'),
    Click: knobModeArea.makeSubPage('Click'),
    HighPass: knobModeArea.makeSubPage('High Pass'),
    PreGain: knobModeArea.makeSubPage('Pre Gain'),
    Section: knobModeArea.makeSubPage('Section'),
    Marker: knobModeArea.makeSubPage('Marker')
}
var knobModeButtons = [
    { button: buttons.Send, mode: knobModes.Send },
    { button: buttons.Link, mode: knobModes.Mouse },
    { button: buttons.MouseFader, mode: knobModes.MouseFader },
    { button: buttons.Pan, mode: knobModes.Pan },
    { button: buttons.Scroll, mode: knobModes.Zoom },
    { button: buttons.Zoom, mode: knobModes.Zoom },
    { button: buttons.Master, mode: knobModes.Master },
    { button: buttons.Click, mode: knobModes.Click },
    { button: buttons.Channel, mode: knobModes.HighPass },
    { button: buttons.PreGain, mode: knobModes.PreGain },
    { button: buttons.Section, mode: knobModes.Section },
    { button: buttons.Marker, mode: knobModes.Marker }
]
var firstSendLevelFeedbackValue
var var_zoomIn = surface.makeCustomValueVariable('Zoom In')
var var_zoomOut = surface.makeCustomValueVariable('Zoom Out')
var var_zoomToLocators = surface.makeCustomValueVariable('Zoom to Locators')
var var_markerInsertPressed = surface.makeCustomValueVariable('Marker Insert Pressed')
var var_masterInsertPressed = surface.makeCustomValueVariable('Master Insert Pressed')

// Same output-bank approach as the Korg: the FIRST output channel is Stereo Out.
// Projects with multiple output buses must place the intended master first.
var hostStereoOutZone = page.mHostAccess.mMixConsole.makeMixerBankZone().includeOutputChannels()
var hostStereoOut = hostStereoOutZone.makeMixerBankChannel()
var stereoOutInsert1 = hostStereoOut.mInsertAndStripEffects
    .makeInsertEffectViewer('Stereo Out Insert 1')
    .accessSlotAtIndex(0)
var masterInsertBypassed = stereoOutInsert1.mBypass
var masterInsertBypassFeedback = surface.makeCustomValueVariable('Master Insert Bypass LED Feedback')
page.makeValueBinding(masterInsertBypassFeedback, masterInsertBypassed)
masterInsertBypassFeedback.mOnProcessValueChange = function(context) {
    updateBypassLED(context)
}
var hostMixerZoneFX = page.mHostAccess.mMixConsole.makeMixerBankZone().includeFXChannels()
var fxChannel = hostMixerZoneFX.makeMixerBankChannel()

function isMetronomeBypassMode(mode) {
    return mode === 'Click' || mode === 'Zoom' || mode === 'Section' || mode === 'Marker'
}

function updateBypassLED(context) {
    var mode = context.getState('knobMode')
    var enabled = false
    if (mode === 'Master') {
        enabled = masterInsertBypassFeedback.getProcessValue(context) === 0
    } else if (mode === 'Send' || mode === 'Pan') {
        enabled = firstSendEnabledFeedbackValue && firstSendEnabledFeedbackValue.getProcessValue(context) > 0
    } else if (isMetronomeBypassMode(mode)) {
        enabled = metronomeFeedbackValue && metronomeFeedbackValue.getProcessValue(context) > 0
    } else if (isMouseLinkMode(mode)) {
        enabled = context.getState('mouseBypassed') === '1'
    } else if (mode === 'PreGain') {
        enabled = polarityFeedbackValue && polarityFeedbackValue.getProcessValue(context) > 0
    } else if (mode === 'HighPass') {
        enabled = highPassEnabledFeedbackValue && highPassEnabledFeedbackValue.getProcessValue(context) > 0
    }
    setTransportLed(context, cBypass, !!enabled)
}

// BYPASS toggles the mode effect; Pan knob push separately centers pan.
function toggleModeEffect(context) {
    var mode = context.getState('knobMode')
    if (isMouseLinkMode(mode)) {
        context.setState('mouseBypassed', context.getState('mouseBypassed') === '1' ? '' : '1')
        context.setState('pendingMotorPosition', '')
        if (context.getState('faderTarget') === 'Mouse') {
            context.setState('mouseFaderWaitRelease', faderTouch.getProcessValue(context) > 0 ? '1' : '')
            mappedFaderTouch.setProcessValue(context, 0)
        }
        syncMouseFader(context)
        updateBypassLED(context)
        return
    }
    if (isMetronomeBypassMode(mode)) {
        toggleMetronome(context)
        return
    }
    var value = mode === 'Send' || mode === 'Pan' ? firstSendEnabledFeedbackValue
        : mode === 'HighPass' ? highPassEnabledFeedbackValue
        : mode === 'PreGain' ? polarityFeedbackValue : null
    if (value) {
        value.setProcessValue(context, value.getProcessValue(context) > 0 ? 0 : 1)
    }
}

function updateKnobModeLEDs(context) {
    var mode = context.getState('knobMode')
    updateMetronomeModeLEDs(context, Date.now())
    setTransportLed(context, cMaster, mode === 'Master')
    setTransportLed(context, cSection, mode === 'Section')
    setTransportLed(context, cMarker, mode === 'Marker')
    updateClickLED(context)
    updateBypassLED(context)
}

function resolveKnobModeButton(context, name) {
    var modeNames = { Link: 'Mouse', MouseFader: 'MouseFader', Send: 'Send', Pan: 'Pan', Scroll: 'Zoom', Zoom: 'Zoom',
        Master: 'Master', Click: 'Click', Channel: 'HighPass', PreGain: 'PreGain', Section: 'Section', Marker: 'Marker' }
    var current = context.getState('knobMode')
    // LINK owns its knob/fader selection; the other modes' SHIFT cannot override it.
    if (!isMouseLinkMode(current) && (name === 'Link' || name === 'MouseFader')) {
        return context.getState('linkShiftEnabled') === '1' ? 'MouseFader' : 'Link'
    }
    // Leaving LINK selects normal modes, regardless of its fader-selection SHIFT.
    if (isMouseLinkMode(current)) {
        if (name === 'Send') name = 'Pan'
        else if (name === 'PreGain') name = 'Channel'
        else if (name === 'Zoom') name = 'Scroll'
    }
    // Channel always alternates its two functions, independent of mode history.
    if ((name === 'Channel' || name === 'PreGain') && (current === 'HighPass' || current === 'PreGain')) {
        return current === 'HighPass' ? 'PreGain' : 'Channel'
    }
    var previous = context.getState('previousKnobMode')
    var requestedMode = modeNames[name]
    // Non-mode buttons keep their normal action.
    if (!requestedMode) return name
    // Pressing a different mode selects it normally.
    if (requestedMode !== context.getState('knobMode')) return name
    // Pressing the active mode can only go back if a previous mode exists.
    if (!previous) return name
    for (var buttonName in modeNames) {
        if (modeNames[buttonName] === previous) return buttonName
    }
    return name
}

function activateKnobMode(context, mode, activeMapping) {
    var current = context.getState('knobMode')
    if (current && current !== mode) context.setState('previousKnobMode', current)
    var enteringLink = isMouseLinkMode(mode) && !isMouseLinkMode(current)
    if (isMouseLinkMode(current) && !isMouseLinkMode(mode)) leaveMouseLink(context)
    if (enteringLink) leaveMouseLink(context)
    // Mouse control ends on mode exit, even for modes that normally retain the fader.
    if (isMouseLinkMode(current) || (mode !== 'Zoom' && mode !== 'Section' && mode !== 'Marker')) {
        var target = mode === 'MouseFader' ? faderModes.Mouse : mode === 'Mouse' ? faderModes.Dormant
            : mode === 'Pan' || mode === 'Send' || mode === 'HighPass' || mode === 'PreGain'
            ? faderModes.Track
            : mode === 'Click' && ENABLE_METRONOME_FADER ? faderModes.Metronome
            : mode === 'Zoom' || mode === 'Section' || mode === 'Marker' ? faderModes.Track : faderModes.StereoOut
        context.setState('faderTarget', target === faderModes.Dormant ? 'Dormant' : target === faderModes.Mouse ? 'Mouse' : target === faderModes.Track ? 'Track'
            : target === faderModes.Metronome ? 'Metronome' : 'StereoOut')
        context.setState('pendingMotorPosition', '')
        if (isMouseLinkMode(current) || isMouseLinkMode(mode)) {
            context.setState('mouseFaderWaitRelease', faderTouch.getProcessValue(context) > 0 ? '1' : '')
            mappedFaderTouch.setProcessValue(context, 0)
        }
        target.mAction.mActivate.trigger(activeMapping)
    }
    context.setState('knobMode', mode)
    if (isMouseLinkMode(mode)) context.setState('linkShiftEnabled', mode === 'MouseFader' ? '1' : '0')
    if (mode === 'MouseFader' && !enteringLink) syncMouseFader(context)
    // These normal modes clear SHIFT; recalled alternates restore it from their mode.
    if (mode === 'HighPass' || mode === 'PreGain' || mode === 'Send' || isMouseLinkMode(mode)
        || mode === 'Master' || mode === 'Click' || mode === 'Section' || mode === 'Marker'
        || mode === 'Pan' || mode === 'Zoom') {
        var alternate = mode === 'PreGain' || mode === 'Send' || mode === 'MouseFader'
        context.setState('shiftEnabled', alternate ? '1' : '0')
        if (alternate) onLED(context, cShift)
        else offLED(context, cShift)
    }
    updateTouchLED(context)
    // Seed zoom from the current knob value so switching modes doesn't zoom.
    context.setState('lastZoomValue', String(Math.floor((knob.getProcessValue(context) || 0) * 1000)))
    updateKnobModeLEDs(context)
}

// Blend green to magenta through the useful low-cut range; clamp above 300 Hz.
// White marks a disabled filter; inactive mode buttons follow the nuclear LED flags.
var highPassColors = [
    { hz: 20, red: GREEN[0], green: GREEN[1], blue: GREEN[2] },
    { hz: 300, red: MAGENTA[0], green: MAGENTA[1], blue: MAGENTA[2] }
]

function getHighPassColor(hz) {
    if (!ENABLE_HIGH_PASS_COLOR_GRADIENT || !isFinite(hz) || hz <= highPassColors[0].hz) {
        return highPassColors[0]
    }
    if (hz >= highPassColors[1].hz) return highPassColors[1]

    // Log frequency spacing through green, amber, purple and magenta.
    // Normalize brightness; the chosen stops avoid blue and a gray/white midpoint.
    var blend = Math.log(hz / highPassColors[0].hz)
        / Math.log(highPassColors[1].hz / highPassColors[0].hz)
    var stops = [GREEN, AMBER, [100, 0, 127], MAGENTA]
    var position = blend * (stops.length - 1)
    var index = Math.floor(position)
    var amount = position - index
    var rgb = stops[index].map(function(component, i) {
        return component + (stops[index + 1][i] - component) * amount
    })
    var scale = 127 / Math.max(rgb[0], rgb[1], rgb[2])
    return { red: rgb[0] * scale, green: rgb[1] * scale, blue: rgb[2] * scale }
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
    if (context.getState('knobMode') !== 'HighPass') return
    if (context.getState('highPassEnabled') !== '1') {
        setRGBLED_color(context, cChannel, WHITE)
    } else {
        var color = getHighPassColor(Number(context.getState('highPassHz')))
        setRGBLED(context, cChannel, color.red, color.green, color.blue)
    }
    onLED(context, cChannel)
}

function setupHighPassFeedback() {
    var preFilter = page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter
    var enabled = surface.makeCustomValueVariable('High Pass Enabled Feedback')
    var frequency = surface.makeCustomValueVariable('High Pass Frequency Feedback')
    highPassEnabledFeedbackValue = enabled
    highPassFrequencyFeedbackValue = frequency
    // Always follow the selected track, including when another knob mode is active.
    page.makeValueBinding(enabled, preFilter.mLowCutOn)
    page.makeValueBinding(frequency, preFilter.mLowCutFreq)
    enabled.mOnProcessValueChange = function(context, value) {
        context.setState('highPassEnabled', value > 0 ? '1' : '0')
        updateHighPassLED(context)
        updateBypassLED(context)
    }
    // Read Cubase's displayed Hz rather than guessing its normalized frequency curve.
    frequency.mOnDisplayValueChange = function(context, value, units) {
        var hz = parseFrequencyHz(value, units)
        context.setState('highPassHz', isFinite(hz) ? String(hz) : '')
        updateHighPassLED(context)
    }
}

// Both LINK variants share one target and one captured starting value.
function isMouseLinkMode(mode) {
    return mode === 'Mouse' || mode === 'MouseFader'
}

function updateMouseLinkLED(context) {
    if (!isMouseLinkMode(context.getState('knobMode'))) return
    setRGBLED_color(context, cLink, mouseLockFeedbackValue.getProcessValue(context) > 0 ? AMBER : WHITE)
    onLED(context, cLink)
}

function discardMouseLinkLock(context) {
    context.setState('pendingMotorPosition', '')
    context.setState('mouseCaptureAt', '')
    context.setState('mouseStartingValue', '')
    if (context.getState('faderTarget') === 'Mouse') {
        context.setState('mouseFaderWaitRelease', faderTouch.getProcessValue(context) > 0 ? '1' : '')
        mappedFaderTouch.setProcessValue(context, 0)
    }
    mouseLockFeedbackValue.setProcessValue(context, 0)
    updateMouseLinkLED(context)
    updateTouchLED(context)
    updateBypassLED(context)
}

function handleMouseLinkButton(context) {
    var locked = mouseLockFeedbackValue.getProcessValue(context) > 0
    var mode = context.getState('knobMode')
    discardMouseLinkLock(context)
    if (!locked) pulseVar(context, mode === 'Mouse' ? buttons.MouseFader : buttons.Link)
}

function isMouseLinkControlEnabled(context) {
    return isMouseLinkMode(context.getState('knobMode'))
        && context.getState('mouseBypassed') !== '1'
        && context.getState('mouseCaptureAt') === ''
        && context.getState('mouseStartingValue') !== ''
        && mouseLockFeedbackValue.getProcessValue(context) > 0
}

function beginMouseLinkCapture(context) {
    context.setState('pendingMotorPosition', '')
    context.setState('mouseStartingValue', '')
    context.setState('mouseCaptureAt', String(Date.now() + 100))
    if (context.getState('faderTarget') === 'Mouse') {
        context.setState('mouseFaderWaitRelease', faderTouch.getProcessValue(context) > 0 ? '1' : '')
        mappedFaderTouch.setProcessValue(context, 0)
    }
    mouseLockFeedbackValue.setProcessValue(context, 0)
    updateMouseLinkLED(context)
    updateTouchLED(context)
    updateBypassLED(context)
}

function updateMouseLinkCapture(context, now) {
    var at = context.getState('mouseCaptureAt')
    if (at === '' || now < Number(at) || !isMouseLinkMode(context.getState('knobMode'))) return
    mouseLockFeedbackValue.setProcessValue(context, 1)
    context.setState('mouseStartingValue', String(mouseParameterFeedbackValue.getProcessValue(context)))
    context.setState('mouseCaptureAt', '')
    alignMouseKnobOnce(context, Number(context.getState('mouseStartingValue')))
    updateMouseLinkLED(context)
    syncMouseFader(context)
    updateBypassLED(context)
}

// Only explicit capture/reset actions align the encoder; never host feedback or turns.
function alignMouseKnobOnce(context, value) {
    if (context.getState('knobMode') !== 'Mouse' || !isFinite(value)) return
    var resetting = context.getState('mouseKnobResetting')
    context.setState('mouseKnobResetting', '1')
    try {
        context.setState('mouseKnobResetEcho', String(clampFader(value)))
        mouseKnobInput.setProcessValue(context, clampFader(value))
    } finally {
        context.setState('mouseKnobResetting', resetting)
    }
}

function restoreMouseLinkValue(context) {
    var saved = context.getState('mouseStartingValue')
    if (!isMouseLinkControlEnabled(context)) return
    // Preserve the locked target. Only a knob-mode reset realigns the encoder,
    // once per press; ordinary host feedback never writes to the knob.
    context.setState('mouseKnobResetting', '1')
    try {
        mouseParameterFeedbackValue.setProcessValue(context, Number(saved))
        alignMouseKnobOnce(context, Number(saved))
    } finally {
        context.setState('mouseKnobResetting', '')
    }
    syncMouseFader(context)
}

function syncMouseFader(context) {
    updateTouchLED(context)
    if (context.getState('faderTarget') !== 'Mouse' || !isMouseLinkControlEnabled(context)) return
    setMotorFader(context, mouseParameterFeedbackValue.getProcessValue(context))
}

function leaveMouseLink(context) {
    context.setState('mouseBypassed', '')
    context.setState('pendingMotorPosition', '')
    context.setState('mouseCaptureAt', '')
    context.setState('mouseStartingValue', '')
    mouseLockFeedbackValue.setProcessValue(context, 0)
}

var mouseLockFeedbackValue = null
var mouseParameterFeedbackValue = null
function setupMouseLockFeedback() {
    mouseLockFeedbackValue = surface.makeCustomValueVariable('Mouse Parameter Locked')
    page.makeValueBinding(mouseLockFeedbackValue, page.mHostAccess.mMouseCursor.mValueLocked)
    mouseLockFeedbackValue.mOnProcessValueChange = function(context) {
        if (mouseLockFeedbackValue.getProcessValue(context) <= 0) context.setState('mouseStartingValue', '')
        updateMouseLinkLED(context)
        updateTouchLED(context)
        updateBypassLED(context)
    }
    mouseParameterFeedbackValue = surface.makeCustomValueVariable('Mouse Parameter Feedback')
    page.makeValueBinding(mouseParameterFeedbackValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
    faderTargetFeedback.Mouse = mouseParameterFeedbackValue
    mouseParameterFeedbackValue.mOnProcessValueChange = function(context) { syncMouseFader(context) }
}

var preGainFeedbackValue = null
var polarityFeedbackValue = null

function getPreGainColor(value) {
    if (!isFinite(value)) return WHITE
    var gain = Math.max(0, Math.min(1, value))
    var amount = Math.abs(gain - 0.5) * 2
    var extreme = gain < 0.5 ? BLUE : RED
    return WHITE.map(function(component, i) { return component + (extreme[i] - component) * amount })
}

function updatePreGainLED(context) {
    if (context.getState('knobMode') !== 'PreGain') return
    setRGBLED_color(context, cChannel, getPreGainColor(preGainFeedbackValue.getProcessValue(context)))
    onLED(context, cChannel)
}

function setupPreGainFeedback() {
    var pre = page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter
    preGainFeedbackValue = surface.makeCustomValueVariable('Pre Gain Feedback')
    polarityFeedbackValue = surface.makeCustomValueVariable('Polarity Feedback')
    page.makeValueBinding(preGainFeedbackValue, pre.mGain)
    page.makeValueBinding(polarityFeedbackValue, pre.mPhaseSwitch)
    preGainFeedbackValue.mOnProcessValueChange = function(context) { updatePreGainLED(context) }
    polarityFeedbackValue.mOnProcessValueChange = function(context) { updateBypassLED(context) }
}

var panFeedbackValue = null

function getPanColor(value) {
    if (!ENABLE_PAN_COLOR || !isFinite(value)) return WHITE
    var pan = Math.max(0, Math.min(1, value))
    var amount = Math.abs(pan - 0.5) * 2
    // Center stays white; off-center starts at 50% color and rises quickly.
    if (amount > 0) amount = 0.5 + 0.5 * Math.sqrt(amount)
    var extreme = pan < 0.5 ? BLUE : MAGENTA
    return [
        WHITE[0] + (extreme[0] - WHITE[0]) * amount,
        WHITE[1] + (extreme[1] - WHITE[1]) * amount,
        WHITE[2] + (extreme[2] - WHITE[2]) * amount
    ]
}

function updatePanLED(context) {
    if (context.getState('knobMode') !== 'Pan') return
    var value = panFeedbackValue ? panFeedbackValue.getProcessValue(context) : 0.5
    setRGBLED_color(context, cPan, getPanColor(value))
    onLED(context, cPan)
}

function setupPanFeedback() {
    panFeedbackValue = surface.makeCustomValueVariable('Selected Track Pan')
    // Always follow host edits and track selection, even outside Pan mode.
    page.makeValueBinding(panFeedbackValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan)
    panFeedbackValue.mOnProcessValueChange = function(context) {
        updatePanLED(context)
    }
}

// Plain JS dispatch: never read/call Cubase-owned callback properties from script code.
function routeUnboundKnobTurn(context, newValue, diff) {
    if (!isFinite(diff) || diff === 0) return
    var mode = context.getState('knobMode')
    if (mode === 'Send') {
        if (isFinite(diff) && diff !== 0) {
            var sendLevel = firstSendLevelFeedbackValue.getProcessValue(context)
            firstSendLevelFeedbackValue.setProcessValue(context, clampFader(sendLevel + diff))
        }
        return
    }
    if (mode !== 'Zoom' && mode !== 'Section' && mode !== 'Marker') return
    var zoomCommand
    if (diff < 0) {
        zoomCommand = var_zoomOut
    } else if (diff > 0) {
        zoomCommand = var_zoomIn
    }
    if (zoomCommand) {
        pulseVar(context, zoomCommand)
    }
}

function assignKnobControls() {
    for (var i = 0; i < knobModeButtons.length; i++) {
        var mapping = knobModeButtons[i]
        page.makeActionBinding(mapping.button, mapping.mode.mAction.mActivate)
    }
    page.makeValueBinding(knob, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan)
        .setSubPage(knobModes.Pan)
    var firstSend = page.mHostAccess.mTrackSelection.mMixerChannel.mSends.getByIndex(0)
    // No direct MIDI-knob binding to Send: every write is gated by the current mode.
    firstSendLevelFeedbackValue = surface.makeCustomValueVariable('First Send Level')
    page.makeValueBinding(firstSendLevelFeedbackValue, firstSend.mLevel)
    // Mouse knob writes are routed explicitly below so BYPASS can disable input.
    // Follow host/track changes so BYPASS toggles the current send state.
    var sendEnabled = surface.makeCustomValueVariable('First Send Enabled')
    firstSendEnabledFeedbackValue = sendEnabled
    page.makeValueBinding(sendEnabled, firstSend.mOn)
    sendEnabled.mOnProcessValueChange = function(context) {
        updateBypassLED(context)
    }
    // Master-mode encoder controls the first FX Return channel.
    page.makeValueBinding(knob, fxChannel.mValue.mVolume)
        .setValueTakeOverModeScaled()
        .setSubPage(knobModes.Master)
    page.makeValueBinding(knob, hostTransport.mMetronomeClickLevel)
        .setSubPage(knobModes.Click)
    // The encoder push is routed below so it remains a momentary press path;
    // mode-specific host values are toggled explicitly by the handler.
    // Cubase calls its high-pass filter "Low Cut" in the Pre section.
    var hostPreFilter = page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter
    page.makeValueBinding(knob, hostPreFilter.mGain).setSubPage(knobModes.PreGain)
    page.makeValueBinding(knob, hostPreFilter.mLowCutFreq)
        .setSubPage(knobModes.HighPass)
    var zoomModes = [knobModes.Zoom, knobModes.Section, knobModes.Marker]
    for (var zoomIndex = 0; zoomIndex < zoomModes.length; zoomIndex++) {
        page.makeCommandBinding(var_zoomIn, 'Zoom', 'Zoom In').setSubPage(zoomModes[zoomIndex])
        page.makeCommandBinding(var_zoomOut, 'Zoom', 'Zoom Out').setSubPage(zoomModes[zoomIndex])
    }
    page.makeCommandBinding(var_zoomToLocators, 'Zoom', 'Zoom to Locators').setSubPage(knobModes.Zoom)
    page.makeCommandBinding(var_zoomToLocators, 'Zoom', 'Zoom to Locators').setSubPage(knobModes.Section)
    if (cubase13OrHigher) {
        page.makeCommandBinding(var_markerInsertPressed,
            'Marker', 'Insert Marker').setSubPage(knobModes.Marker)
    } else {
        page.makeCommandBinding(var_markerInsertPressed,
            'Transport', 'Insert Marker').setSubPage(knobModes.Marker)
    }
    page.makeCommandBinding(buttons.Bypass,
        'Mixer', 'Bypass: Inserts on Main Mix').setSubPage(knobModes.Master)
    page.makeCommandBinding(var_masterInsertPressed,
        'Mixer', 'Bypass: Inserts on Main Mix').setSubPage(knobModes.Master)
    page.makeCommandBinding(var_markerPrev,
        'Transport', 'Locate Previous Marker')
    page.makeCommandBinding(var_markerNext,
        'Transport', 'Locate Next Marker')

    knobModes.MouseFader.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'MouseFader', activeMapping) }
    knobModes.Mouse.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Mouse', activeMapping) }
    knobModes.Send.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Send', activeMapping) }
    knobModes.Pan.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Pan', activeMapping) }
    knobModes.Zoom.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Zoom', activeMapping) }
    knobModes.Master.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Master', activeMapping) }
    knobModes.Click.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Click', activeMapping) }
    knobModes.PreGain.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'PreGain', activeMapping) }
    knobModes.HighPass.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'HighPass', activeMapping) }
    knobModes.Section.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Section', activeMapping) }
    knobModes.Marker.mOnActivate = function(context, activeMapping) { activateKnobMode(context, 'Marker', activeMapping) }

    // Route encoder pushes for the active command mode. Click uses the
    // host-bound custom metronome variable rather than a page binding.
    // Cubase 12 and 13+ expose Insert Marker under different command categories.
    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value <= 0) {
            context.setState('knobPressRouted', '')
            return
        }
        if (context.getState('knobPressRouted') === '1') return
        context.setState('knobPressRouted', '1')

        var mode = context.getState('knobMode')
        if (mode === 'Pan') {
            panFeedbackValue.setProcessValue(context, 0.5)
        } else if (mode === 'PreGain') {
            preGainFeedbackValue.setProcessValue(context, 0.5)
        } else if (isMouseLinkMode(mode)) {
            restoreMouseLinkValue(context)
        } else if (mode === 'Send') {
            firstSendLevelFeedbackValue.setProcessValue(context, FADER_HOST_UNITY)
        } else if (mode === 'Click') {
            toggleMetronome(context)
        } else if (mode === 'HighPass') {
            highPassFrequencyFeedbackValue.setProcessValue(context, 0)
        } else if (mode === 'Marker') {
            pulseVar(context, var_markerInsertPressed)
        } else if (mode === 'Zoom' || mode === 'Section') {
            pulseVar(context, var_zoomToLocators)
        } else if (mode === 'Master') {
            pulseVar(context, var_masterInsertPressed)
        }
    }

    // Korg zoom pattern: pulse commands per detent, using relative direction.
    knob.mOnProcessValueChange = function(context, newValue, diff) {
        routeUnboundKnobTurn(context, newValue, diff)
    }
    mouseKnobInput.mOnProcessValueChange = function(context, newValue, diff) {
        // Consume the one programmatic capture/reset callback, including deferred delivery.
        var resetEcho = context.getState('mouseKnobResetEcho')
        if (resetEcho !== '') {
            context.setState('mouseKnobResetEcho', '')
            if (Math.abs(newValue - Number(resetEcho)) < 1e-9) return
        }
        if (context.getState('mouseKnobResetting') === '1') return
        var mode = context.getState('knobMode')
        if (!isMouseLinkMode(mode)) {
            if (!mode || !isFinite(diff) || diff === 0) return
            // Recenter only the unbound input; normal host bindings keep their own position.
            context.setState('mouseKnobResetEcho', '0.5')
            mouseKnobInput.setProcessValue(context, 0.5)
            if (mode === 'Send' || mode === 'Zoom' || mode === 'Section' || mode === 'Marker') {
                routeUnboundKnobTurn(context, newValue, diff)
            } else {
                knob.setProcessValue(context, clampFader(knob.getProcessValue(context) + diff))
            }
            return
        }
        if (mode === 'Mouse') {
            if (isMouseLinkControlEnabled(context) && isFinite(diff) && diff !== 0) {
                var current = mouseParameterFeedbackValue.getProcessValue(context)
                mouseParameterFeedbackValue.setProcessValue(context, clampFader(current + diff))
                updateTouchLED(context)
            }
            return
        }
    }

}

page.mOnActivate = function(context, activeMapping) {
    activateFaderNudge(context, activeMapping)
    context.setState('knobMode', '')
    context.setState('previousKnobMode', '')
    knobModes.Mouse.mAction.mActivate.trigger(activeMapping)
    activateKnobMode(context, 'Mouse', activeMapping)
    restoreTransportLEDs(context)
}

page.mOnDeactivate = function(context, activeMapping) {
    leaveMouseLink(context)
    deactivateFaderNudge(context, activeMapping)
}

assignTransportControls()
assignUtilityControls()
assignKnobControls()
assignSelectedTrackControls()
setupCycleMarkerCommands()
setupTransportFeedback()
setupMetronomeFeedback()
setupSelectedTrackFeedback()
setupHighPassFeedback()
setupPreGainFeedback()
setupMouseLockFeedback()
setupPanFeedback()
