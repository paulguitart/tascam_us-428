//------------------------------------------------------------------------------------------------------
// fp-wizard  -  MIDI Remote Script  -  PreSonus FaderPort (1 motorfader)  &  Steinberg Cubase / Nuendo
//
// Version from Sept 10, 2026 - JavaScript ES5 - 18380 lines of code total
// tested with FaderPort v2, firmware v3.74 & Cubase 12.0.70, 13.0.55, 14.0.41, 15.0.30
//
//
// created by
//
// Christian, 17573 lines of code = 96 %
//
// and Werner, remaining 807 lines from January 16, 2023
//
//------------------------------------------------------------------------------------------------------


// DRIVER SETUP

var deviceDriver = require('midiremote_api_v1')
    .makeDeviceDriver('PreSonus', 'FaderPort', 'Sept 10, 2026 Christian & Werner')

var midiIn = deviceDriver.mPorts.makeMidiInput(), midiOut = deviceDriver.mPorts.makeMidiOutput()
deviceDriver.makeDetectionUnit().detectPortPair(midiIn, midiOut)
    .expectInputNameEquals('PreSonus FP2').expectOutputNameEquals('PreSonus FP2')


// USER-SPECIFIC CONFIGURATION

// If 'Volume Max' in the section 'Other Project Settings' of Cubase is set to +6 dB,
// the code below should be: const Volume_Max_12 = false
// For +12 dB, the code below should be: var Volume_Max_12 = true
//
var Volume_Max_12 = false

// If a fader volume of 0 dB in Cubase should correspond exactly to the postion "U"
// within the scale on the FaderPort, the code below should be: const sync_0dB_to_U = true
//
const sync_0dB_to_U = true

// If sync_0dB_to_U is set to true, the following sync-factors must be set also:
// The (compression or stretch) sync-factors must be set individually for the FaderPort,
// as these settings are different for each device manufactured.
//
const xU_6  = 0.964   // sync-factor if 'Volume Max' is set to +6 dB
const xU_12 = 1.014   // sync-factor if 'Volume Max' is set to +12 dB

// Only to determine the sync-factors, set determine_sync_factors to true.
// The sync-factors are then shown in the MIDI Remote message console if you move the fader
// on the FaderPort exactly to position "U" within the scale on the FaderPort.
//
const determine_sync_factors = false

// If the motorfader controls the volume, the minimum value of the volume can be limited
// to a technical stable value, whereby lower values are then pulled down to -oo dB.
// If this is desired, the code below should be: const limit_low_Fader_Value = true
//
const limit_low_Fader_Value = true

// Normally the script starts in Pan Mode when it's loaded, but if the script should instead
// start in Master Mode, the code below should be: const start_with_Master_Mode = true
//
const start_with_Master_Mode = false

// The Solo Button can be swapped with the Mute Button. The button at the top left of the
// FaderPort is then used for the Mute function and the button beside for the Solo function.
// With the swap, the FaderPort is better adapted to Cubase but the buttons on the FaderPort
// have to be relabeled. If the script is in Custom Mode, the swap does not take place.
// If the swap should be active, the code below should be: const swap_SoloMute = true
//
const swap_SoloMute = false

// Setting regarding the use of the PF Mode:
// If the integrated PF Mode (PreFilter Mode) should not to be used by the script,
// what only means, that when leaving the EQ Mode by pressing the Master Button,
// a change to the Pan Mode takes place instead of a change to the PF Mode,
// the code below should be: const enable_PF_Mode = false
//
const enable_PF_Mode = true

// Setting regarding the use of the Cue Send Mode:
// If the integrated Cue Send Mode should not to be used by the script,
// what only means, that when leaving the Send Mode by pressing the Master Button,
// a change to the Pan Mode takes place instead of a change to the Cue Send Mode,
// the code below should be: const enable_CueSend_Mode = false
//
const enable_CueSend_Mode = true

// If the EQ LEDs, when the EQ is switched on, are to display the abs. EQ gain values,
// whereby this is represented by a gliding color from white to red,
// the code below should be: const gliding_LED_color_for_EQ_Gains = true
// Otherwise the EQ LEDs light up in full power red when the EQ Band is switched on.
//
const gliding_LED_color_for_EQ_Gains = true

// If a color distinction between negative (cyan) and positive (red) gains is desired,
// the code below should be: neg_and_pos_EQ_Gains_in_different_colors = true
//
const neg_and_pos_EQ_Gains_in_different_colors = true

// When all 5 EQ setting 'special memory' memories and all 5 value under mouse setting
// 'special memory' memories should to be cleared when switching to another project,
// the code below should be: const clear_special_memory_when_changing_projects = true
//
const clear_special_memory_when_changing_projects = false

// If the resolution (low / normal / high) set in the AI Mode
// should be automatically reset to nornmal after exiting the AI Mode,
// the code below should be: const reset_resolution_of_AI_Mode_after_exit = true
//
const reset_resolution_of_AI_Mode_after_exit = true

// If the resolution (low / normal / high) set in the QC Mode
// should be automatically reset to nornmal after exiting the QC Mode,
// the code below should be: const reset_resolution_of_QC_Mode_after_exit = true
//
const reset_resolution_of_QC_Mode_after_exit = true

// If the synchronization of the motorfader within the Send Mode should be automatically
// changed from the actual Send Value to the actual Volume after exiting the Send Mode,
// the code below should be: reset_sync_motorfader_within_Send_Mode_after_exit = true
//
const reset_sync_motorfader_within_Send_Mode_after_exit = true

// If the GTS (Global Track Scroll) functionality should be used in such a way,
// that by pressing the Rotate Knob a toggeling of the monitor state of the selected track
// will proceed, the code below should be: GTS_functionality_with_Mute = false
//
const GTS_functionality_with_Mute = true

// If you switch frequently between the Scroll Mode and the Zoom Mode, it can be inefficient
// if the simultaneous change of the fader between volume and 'value under mouse' leads to a
// movement of the motor. To prevent this, you can configure the Zoom Mode so that the motor
// is switched off when the Zoom Mode is activated.
// To do this, the code below should be: turn_off_moter_when_Zoom_Mode_is_active = true
//
const turn_off_motor_when_Zoom_Mode_is_active = true

// When the Navigation Mode is enabled, the global button combinations
// Cycle + (Link / Pan / Channel / Scroll) are assigned to the four navigation functions
// (Left / Up / Down / Right) and not to the functions for setting the Quick Tracks 1..4.
// The Navigation Mode can be disabled using the button combination Bypass + RWD and
// enabled using the combination Bypass + FWD. If the Navigation Mode should be enabled
// when the script starts, the code below should be: enable_Navigation_Mode = true
//
const enable_Navigation_Mode = false

// If holding down the buttons of a button combination for to navigate should cause the
// corresponding navigation command to be repeatedly executed until the buttons are released,
// the code below should be: automatic_Navigation = true
//
const automatic_Navigation = true


// VU-Meter

// There is a realtime VU-Meter implemented in fp-wizard. While this VU-Meter is operating,
// the Touch LED lights up in different colors corresponding to the exceeding of different
// volume thresholds. These thresholds can be adjusted in the following code array
// const VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip. The documentation of
// fp-wizard contains a table with 36 different thresholds for specific dB values that can
// be entered in this array. Please note that 9 values must always be defined in ascending
// order. The default universal adjustments represent the following thresholds in dB:
//  > -48 dB, > -24 dB, > -12 dB, > -6 dB, > -3 dB, > -1.5 dB, > 0 dB, > +1.5 dB, > +3 dB
//
const VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip
    = [0.0028151, 0.044616, 0.17763, 0.3544, 0.5006, 0.5950, 0.7072, 0.8404, 0.9989]

// If a Clipping within the VU-Meter should generally not be triggered,
// the code below should be: allow_VUMeter_Clipping = false
//
const allow_VUMeter_Clipping = true

// If the VU_Meter should always remain switched off,
// the code below should be: disable_VUMeter_generally = true
//
const disable_VUMeter_generally = false


// Footswitch

// A footswitch with a soft button as NC-contact (normally closed) is assumed as standard.
// If a hard toggle switch is used as footswitch,
// the code below should be: const Footswitch_soft = false
//
const Footswitch_soft = true

// If a footswitch with a soft button as NC-contact (normally closed) is used,
// the code below should be: const Footswitch_soft_type = 0
// If a footswitch with a soft button as NO-contact (normally opened) is used,
// the code below should be: const Footswitch_soft_type = 1
//
const Footswitch_soft_type = 0


// Further adjustments that can be made in the INTERNAL DEFINITIONS
// are explained in the documentation (see pdf-files listed above).
//

// INTERNAL DEFINITIONS

// pages                         // all subpages on mapping pages pageMain, pageShift,
const pages = {                  // pageEQ, pagePF, pageSend, pageCueSend, pageQC, pageAudio
    page_none: 0x01,

// Pan Mode                      // Button Pan (Main)
    page_Pan: 0x02,

// Channel Mode                  // Button Channel (Main)
    page_Channel: 0x03,

// Scroll Mode                   // Button Scroll (Main)
    page_Scroll: 0x04,

// CR Volume Mode                // Button Master (Main)
    page_Master: 0x05,

// toggle Click Mode             // Button Click (Main)
    page_Click: 0x06,

// Event Mode                    // Button Section (Main)
    page_Section: 0x07,          // (new for this Button)

// Marker Mode                   // Button Marker (Main)
    page_Marker: 0x08,           // new value

// Hitpoint Mode                 // Button Pan (Shift)
    page_Hitpoint: 0x09,

// AI Mode                       // Button Channel (Shift)
// = Advanced Integration Mode   // activate knob for value under mouse
    page_Lock: 0x0A,             // new value

// Zoom Mode                     // Button Scroll (Shift)
    page_Zoom: 0x0B,             // new value

// EQ Mode Enter                 // Button Master (Shift) switches to EQ Mode
    // no separate page

// Quantize Mode                 // Button Click (Shift)
    page_Quantize: 0x0C,

// Nudge Mode                    // Button Section (Shift)
    page_Nudge: 0x0D,            // (Nudge Mode moved from Main Page to Shift Page)

// CS Bypass Mode                // Button Marker (Shift)
// = Channel Strip Bypass Mode
    page_CS_Bypass: 0x0E,

// EQ Mode Band 1                // Button Link (EQ)
    // no separate page

// EQ Mode Band 2                // Button Pan (EQ)
    // no separate page

// EQ Mode Band 3                // Button Channel (EQ)
    // no separate page

// EQ Mode Band 4                // Button Scroll (EQ)
    // no separate page

// EQ Mode Exit                  // Button Master (EQ) switches forward to PF Mode
    // no separate page

// EQ Mode Gain                  // Button Click (EQ)
    page_EQ_Gain: 0x11,

// EQ Mode Freq                  // Button Section (EQ)
    page_EQ_Freq: 0x12,

// EQ Mode Q                     // Button Marker (EQ)
    page_EQ_Q: 0x13,

// PF Mode Switch                // Button Link (PF)
    // no separate page          // off  /  on  /  +180  /  +180 only
                                 // grey / orangered / magenta / pink

// PF Mode PreGain LED           // Button Pan (PF)
    // no separate page          // < -30 dB / < -12 dB / < 0 dB / = 0 dB / > 0 dB / > +12 dB / > +30 dB
                                 // grey  /  blue  /  cyan  /  green  /  yellow  /  orange  /  orangered
                                 // < -47 dB (full left) / > +47 dB (full right) =  no color  /  magenta

// PF Mode LCut Slope            // Button Channel (PF)
    // no separate page          // off / 6 dB / 12 dB / 24 dB / 36 dB / 48 dB
                                 // grey / blue / cyan / green / yellow / orange

// PF Mode HCut Slope            // Button Scroll (PF)
    // no separate page          // off / 6 dB / 12 dB / 24 dB / 36 dB / 48 dB
                                 // grey / blue / cyan / green / yellow / orange

// PF Mode Exit                  // Button Master (PF) switches to Pan Mode (Main)
    // no separate page

// PF Mode PreGain               // Button Click (PF)
    page_PF_PreGain: 0x14,

// PF Mode LCut Freq             // Button Section (PF)
    page_PF_LCut_Freq: 0x15,

// PF Mode HCut Freq             // Button Marker (PF)
    page_PF_HCut_Freq: 0x16,

// Send Mode Level 1 + Level 5   // Button Link (Send)
    // no separate page          // < -42 dB / < -24 dB / < -12 dB / < -6 dB / < 0 dB / = 0 dB / > 0 dB
                                 // blue  /  cyan  /  green  /  yellow  /  orange  /  orangered  /  red
                                 // -oo dB (full left) /  > +6 dB (full right)  =  darkgrey  /  magenta

// Send Mode Level 2 + Level 6   // Button Pan (Send)
    // no separate page

// Send Mode Level 3 + Level 7   // Button Channel (Send)
    // no separate page

// Send Mode Level 4 + Level 8   // Button Scroll (Send)
    // no separate page

// Send Mode Exit                // Button Master (Send) switches forward to Cue Send Mode
    // no separate page

// Send Mode pre/post            // Button Click (Send)
    // no separate page          // pre = LED on (green) / post = LED off

// Send Mode LevelA (1..4)       // Button Section (Send)
    page_Send_LevelA: 0x21,

// Send Mode LevelB (5..8)       // Button Marker (Send)
    page_Send_LevelB: 0x22,

// Cue Send Mode Param 1         // Button Link (Cue Send)
    // no separate page
                                 // when Param = Level:
                                 // < -42 dB / < -24 dB / < -12 dB / < -6 dB / < 0 dB / = 0 dB / > 0 dB
                                 // blue  /  cyan  /  green  /  yellow  /  orange  /  orangered  /  red
                                 // -oo dB (full left) /  > +6 dB (full right)  =  darkgrey  /  magenta

                                 // when Param = Pan:
                                 // 100% L / > 50% L / <= 50% L / center / <= 50% R / > 50% R / 100% R
                                 // darkgrey /  blue /  cyan /  green /  yellow /  orange /  orangered

// Cue Send Mode Param 2         // Button Pan (Cue Send)
    // no separate page

// Cue Send Mode Param 3         // Button Channel (Cue Send)
    // no separate page

// Cue Send Mode Param 4         // Button Scroll (Cue Send)
    // no separate page

// Cue Send Mode Exit            // Button Master (Cue Send) switches to Pan Mode (Main)
    // no separate page

// Cue Send Mode pre/post        // Button Click (Cue Send)
    // no separate page          // pre = LED on (green) / post = LED off

// Cue Send Mode Level (1..4)    // Button Section (Cue Send)
    page_CueSend_Level: 0x23,

// Cue Send Mode Pan (1..4)      // Button Marker (Cue Send)
    page_CueSend_Pan: 0x24,

// QC Mode QC 1                  // Button Link (QC)
    page_QC1: 0x31,

// QC Mode QC 2                  // Button Pan (QC)
    page_QC2: 0x32,

// QC Mode QC 3                  // Button Channel (QC)
    page_QC3: 0x33,

// QC Mode QC 4                  // Button Scroll (QC)
    page_QC4: 0x34,

// QC Mode QC 5                  // Button Master (QC)
    page_QC5: 0x35,

// QC Mode QC 6                  // Button Click (QC)
    page_QC6: 0x36,

// QC Mode QC 7                  // Button Section (QC)
    page_QC7: 0x37,

// QC Mode QC 8                  // Button Marker (QC)
    page_QC8: 0x38,

// Audio Mode function 1         // Button Link (Audio)
    // no separate page          // when Param = Volume: editors, LED cyan_light
                                 // when Param = Fade: delete Fade, LED grey

// Audio Mode function 2         // Button Pan (Audio)
    // no separate page          // when Param = Volume: play selection, LED green_medium
                                 // when Param = Fade: standard, LED blue

// Audio Mode function 3         // Button Channel (Audio)
    // no separate page          // when Param = Volume: crossfade, LED violet
                                 // when Param = Fade: to/from cursor, LED yellow_medium

// Audio Mode function 4         // Button Scroll (Audio)
    // no separate page          // when Param = Volume: bounce, LED orangered
                                 // when Param = Fade: to/from range, LED white_medium

// Audio Mode Exit               // Button Master (Audio) switches to Pan Mode (Main)
    // no separate page

// Audio Mode Volume             // Button Click (Audio)
    page_Audio_Volume: 0x41,

// Audio Mode Fade in            // Button Section (Audio)
    page_Audio_FadeIn: 0x42,

// Audio Mode Fade out           // Button Marker (Audio)
    page_Audio_FadeOut: 0x43
}

// variables to handle mapping pages and subpages
var active_page = pages.page_none
var last_active_pageMain = pages.page_none
var last_active_pageShift = pages.page_none
var last_active_pageQC = pages.page_QC1
var last_active_pageAudio = pages.page_Audio_Volume
var pageMain_is_active = false
var pageShift_is_active = false
var active_pageMain_before = pages.page_none
var active_pageMain_before_Click = pages.page_Pan
var active_pageShift_before = pages.page_none
var last_active_pageMain_with_virtual_knob = pages.page_Pan
var last_active_pageShift_with_virtual_knob = pages.page_Lock
var return_from_CS_Bypass = pages.page_Zoom
var last_btn_Shift_press_activated_Custom_Mode = false
var last_btn_Shift_press_changed_Custom_Mode_bank = false
var actual_Custom_Mode_bank = 'A'
var last_pageCustomA = 0
var last_pageCustomB = 0

// virtual knobs
const virtual_knobs = {
    knob_Pan: 0x01,
    knob_CRLevel: 0x02,
    knob_ClickLevel: 0x03,
    knob_ValueUnderMouse: 0x04,
    knob_EQ_Band1_Gain: 0x05,
    knob_EQ_Band2_Gain: 0x06,
    knob_EQ_Band3_Gain: 0x07,
    knob_EQ_Band4_Gain: 0x08,
    knob_EQ_Band1_Freq: 0x09,
    knob_EQ_Band2_Freq: 0x0A,
    knob_EQ_Band3_Freq: 0x0B,
    knob_EQ_Band4_Freq: 0x0C,
    knob_EQ_Band1_Q: 0x0D,
    knob_EQ_Band2_Q: 0x0E,
    knob_EQ_Band3_Q: 0x0F,
    knob_EQ_Band4_Q: 0x10,
    knob_PF_PreGain: 0x11,
    knob_PF_LCut_Freq: 0x12,
    knob_PF_HCut_Freq: 0x13,
    knob_Send_Level1: 0x14,
    knob_Send_Level2: 0x15,
    knob_Send_Level3: 0x16,
    knob_Send_Level4: 0x17,
    knob_Send_Level5: 0x18,
    knob_Send_Level6: 0x19,
    knob_Send_Level7: 0x1A,
    knob_Send_Level8: 0x1B,
    knob_CueSend_Level1: 0x1C,
    knob_CueSend_Level2: 0x1D,
    knob_CueSend_Level3: 0x1E,
    knob_CueSend_Level4: 0x1F,
    knob_CueSend_Pan1: 0x20,
    knob_CueSend_Pan2: 0x21,
    knob_CueSend_Pan3: 0x22,
    knob_CueSend_Pan4: 0x23,
    knob_QC1: 0x24,
    knob_QC2: 0x25,
    knob_QC3: 0x26,
    knob_QC4: 0x27,
    knob_QC5: 0x28,
    knob_QC6: 0x29,
    knob_QC7: 0x2A,
    knob_QC8: 0x2B
}

// EQ Parameters for Knob
const EQ_Params = {
    EQ_none: 0x01,
    EQ_Gain: 0x02,
    EQ_Freq: 0x03,
    EQ_Q: 0x04
}

// PF Parameters for Knob
const PF_Params = {
    PF_none: 0x01,
    PF_PreGain: 0x02,
    PF_LCut_Freq: 0x03,
    PF_HCut_Freq: 0x04
}

// Cue Send Parameters for Knob
const CueSend_Params = {
    CueSend_none: 0x01,
    CueSend_Level: 0x02,
    CueSend_Pan: 0x03
}

// Motorfader Modes
const motorfader_modes = {
    mf_mode_on: 0x00,
    mf_mode_off: 0x01,
    mf_mode_direct: 0x02,
    mf_mode_QCx: 0x03
}

const RGB_Colors = {
    c_none: 0x00,
    c_red: 0x01,                 // full power red
    c_green: 0x02,               // full power green
    c_green_light: 0x03,
    c_green_medium: 0x04,
    c_green_grey: 0x05,
    c_blue: 0x06,                // full power blue
    c_blue_light: 0x07,
    c_blue_medium: 0x08,
    c_blue_grey: 0x09,
    c_cyan: 0x0A,
    c_cyan_light: 0x0B,
    c_cyan_medium: 0x0C,
    c_white_medium: 0x0D,
    c_grey: 0x0E,
    c_darkgrey: 0x0F,
    c_yellow_medium: 0xA0,
    c_orange: 0xA1,
    c_orange_light: 0xA2,
    c_orangered: 0xA3,
    c_pink: 0xA4,
    c_magenta: 0xA5,
    c_magenta_medium: 0xA6,
    c_violet: 0xA7,
    c_off: 0xA8
}

// midi codes for controlling the FaderPort
const cSolo = 0x08, cMute = 0x10, cArm = 0x00, cShift = 0x46
const cBypass = 0x03, cTouch = 0x4D, cWrite = 0x4B, cRead = 0x4A
const cPrev = 0x2E, cNext = 0x2F, cKnobRotate = 0x10, cKnobPress = 0x20
const cLink = 0x05, cPan = 0x2A, cChannel = 0x36, cScroll = 0x38
const cMaster = 0x3A, cClick = 0x3B, cSection = 0x3C, cMarker = 0x3D
const cCycle = 0x56, cRWD = 0x5B, cFWD = 0x5C, cStop = 0x5D, cPlay = 0x5E, cRecord = 0x5F
const cFootswitch = 0x66, cFaderTouch = 0x68

// constants and variables for to handle automatic navigation
const navigation_step_delay_ms_first = 400
const navigation_step_delay_ms_normal = 200
var navigation_timestamp = 0

// constants and variables for to handle the positions 0 dB and -20 dB
const c0dB_6 = 0.789087     // value for   0 dB when 'Volume Max' is set to +6 dB
const cn20dB_6 = 0.255059   // value for -20 dB when 'Volume Max' is set to +6 dB
const c0dB_12 = 0.748222    // value for   0 dB when 'Volume Max' is set to +12 dB
const cn20dB_12 = 0.329997  // value for -20 dB when 'Volume Max' is set to +12 dB
var CRLevel_Value_0dB = c0dB_6
var CRLevel_Value_n20dB = cn20dB_6
var CRLevel_Value_before_set_to_0dB = CRLevel_Value_0dB  // for toggle 0dB function
var original_CRLevel_Value_0dB = CRLevel_Value_0dB
var Fader_Value_0dB = c0dB_6

const number_of_volume_grid_6_values = 80
var volume_grid_6 = [
    // step size 2.0 dB: -70 dB .. -40 dB, step size 1.0 dB: -40 dB .. -12 dB,
    // step size 0.5 dB: -12 dB .. +6 dB
    0.014343, 0.016093, 0.018057, 0.020260, 0.022732, 0.025506, 0.028618, 0.032110,
    0.036028, 0.040424, 0.045357, 0.050891, 0.057101, 0.064068, 0.071885, 0.080657,
    0.085436, 0.090498, 0.095861, 0.101541, 0.107558, 0.113931, 0.120682, 0.127832,
    0.135407, 0.143430, 0.151929, 0.160932, 0.170467, 0.180568, 0.191267, 0.202601,
    0.214606, 0.227322, 0.240791, 0.255059, 0.270172, 0.286181, 0.303139, 0.321101,
    0.340127, 0.360281, 0.381629, 0.404242, 0.416046, 0.428195, 0.440698, 0.453567,
    0.466811, 0.480442, 0.494471, 0.508910, 0.523771, 0.539065, 0.554806, 0.570849,
    0.583842, 0.597605, 0.612183, 0.627625, 0.643983, 0.661309, 0.679662, 0.699102,
    0.719695, 0.741507, 0.764612, 0.789087, 0.801584, 0.814822, 0.828844, 0.843697,
    0.859431, 0.876096, 0.893749, 0.912448, 0.932255, 0.953236, 0.975460, 0.999001]

const number_of_volume_grid_12_values = 92
var volume_grid_12 = [
    // step size 2.0 dB: -70 dB .. -40 dB, step size 1.0 dB: -40 dB .. -12 dB,
    // step size 0.5 dB: -12 dB .. +12 dB
    0.036159, 0.039616, 0.043283, 0.047178, 0.051325, 0.055749, 0.060477, 0.065543,
    0.070985, 0.076845, 0.083173, 0.090030, 0.097482, 0.105612, 0.114516, 0.124311,
    0.129585, 0.135136, 0.140988, 0.147165, 0.153694, 0.160608, 0.167941, 0.175732,
    0.184026, 0.192873, 0.202329, 0.212462, 0.223345, 0.235065, 0.247722, 0.261435,
    0.276339, 0.292599, 0.310407, 0.329997, 0.350907, 0.371818, 0.392729, 0.413639,
    0.434550, 0.455461, 0.476371, 0.497282, 0.507737, 0.518193, 0.528648, 0.539103,
    0.549559, 0.560014, 0.570469, 0.580925, 0.591380, 0.601835, 0.612291, 0.622746,
    0.633202, 0.643657, 0.654112, 0.664568, 0.675023, 0.685478, 0.695934, 0.706389,
    0.716844, 0.727300, 0.737755, 0.748222, 0.758666, 0.769121, 0.779576, 0.790032,
    0.800487, 0.810942, 0.821398, 0.831853, 0.842308, 0.852764, 0.863219, 0.873674,
    0.884130, 0.894585, 0.905040, 0.915496, 0.925951, 0.936406, 0.946862, 0.957317,
    0.967772, 0.978228, 0.988683, 0.999139]

// constants for the number of steps when setting the resolution of the Rotary Knob
const low_resolution_steps = 16
const high_resolution_steps = 384

// variables to handle AI Mode
var low_resolution_AI_Mode_locked = false             // state variable
var high_resolution_AI_Mode_locked = false            // dto.
var set_low_resolution_AI_Mode_with_Prev = false      // dto.
var set_high_resolution_AI_Mode_with_Next = false     // dto.
var lock_low_resolution_AI_Mode_with_Prev = false     // dto.
var lock_high_resolution_AI_Mode_with_Next = false    // dto.
var toggle_lock_resolution_AI_Mode_with_Click = false
var set_min_value_AI_Mode_with_Prev = false           // button control variable
var set_max_value_AI_Mode_with_Next = false           // dto.
var ValueUnderMouse_changed_with_button = false
var to_AI_Mode_with_Shift = false
var ignore_release_btn_Channel = false

var specialmemory_ValueUnderMouse_has_data = [false, false, false, false, false]
var specialmemory_ValueUnderMouse = [0.0, 0.0, 0.0, 0.0, 0.0]

// to remember if Write done for special memory [1..4]
var specialmemory_ValueUnderMouse_Write_done = false

// to remember if Read done for special memory [1..4]
var specialmemory_ValueUnderMouse_Read_done = false

// variables to handle EQ Mode
var EQ_Mode_running = false
var directly_to_EQ_Mode = false
var selected_EQ_Param = EQ_Params.EQ_Gain
var last_selected_EQ_Param = EQ_Params.EQ_Gain        // always when EQ Mode Enter
var disable_set_EQ_Param_to_default = false
var selected_EQ_Band = 4                              // start with High Freq Band
var last_selected_EQ_Band = 4                         // dto.

const number_of_norm_frequencies = 224
var norm_frequency_grid = [
    // 5 Hz: 20..120 Hz, 10 Hz: 120..400 Hz, 20 Hz: 400..1000 Hz,
    // 50 Hz: 1000..2500 Hz, 100 Hz: 2500..8000 Hz, 200 Hz: 8000..20000 Hz
    0.000000, 0.148583, 0.174252, 0.191277, 0.204355, 0.215113, 0.224321, 0.232414,
    0.239659, 0.246238, 0.252275, 0.257864, 0.263074, 0.267960, 0.272565, 0.276923,
    0.281062, 0.285007, 0.288777, 0.292389, 0.295858, 0.302412, 0.308522, 0.314252,
    0.319652, 0.324763, 0.329618, 0.334244, 0.338665, 0.342901, 0.346969, 0.350883,
    0.354656, 0.358299, 0.361822, 0.365234, 0.368542, 0.371754, 0.374875, 0.377911,
    0.380868, 0.383750, 0.386562, 0.389306, 0.391987, 0.394608, 0.397172, 0.399682,
    0.402140, 0.406911, 0.411501, 0.415925, 0.420198, 0.424329, 0.428330, 0.432210,
    0.435977, 0.439637, 0.443198, 0.446666, 0.450046, 0.453343, 0.456562, 0.459706,
    0.462780, 0.465787, 0.468730, 0.471613, 0.474438, 0.477207, 0.479924, 0.482590,
    0.485208, 0.487779, 0.490306, 0.492790, 0.495232, 0.497635, 0.500000, 0.505753,
    0.511295, 0.516643, 0.521811, 0.526813, 0.531662, 0.536366, 0.540936, 0.545381,
    0.549707, 0.553922, 0.558032, 0.562044, 0.565961, 0.569790, 0.573535, 0.577199,
    0.580788, 0.584303, 0.587749, 0.591129, 0.594445, 0.597700, 0.600897, 0.604038,
    0.607125, 0.610160, 0.613146, 0.616084, 0.618975, 0.624627, 0.630111, 0.635441,
    0.640625, 0.645672, 0.650590, 0.655386, 0.660068, 0.664642, 0.669112, 0.673484,
    0.677763, 0.681954, 0.686060, 0.690086, 0.694034, 0.697908, 0.701712, 0.705448,
    0.709119, 0.712727, 0.716275, 0.719765, 0.723199, 0.726580, 0.729909, 0.733187,
    0.736417, 0.739601, 0.742739, 0.745833, 0.748885, 0.751896, 0.754867, 0.757800,
    0.760694, 0.763553, 0.766376, 0.769164, 0.771919, 0.774642, 0.777333, 0.779993,
    0.782623, 0.785224, 0.787796, 0.790340, 0.792857, 0.795348, 0.797813, 0.800253,
    0.802668, 0.805058, 0.807426, 0.809770, 0.814392, 0.818927, 0.823380, 0.827753,
    0.832051, 0.836275, 0.840429, 0.844515, 0.848537, 0.852495, 0.856393, 0.860232,
    0.864015, 0.867743, 0.871418, 0.875042, 0.878616, 0.882142, 0.885622, 0.889056,
    0.892447, 0.895795, 0.899102, 0.902368, 0.905595, 0.908784, 0.911936, 0.915052,
    0.918133, 0.921180, 0.924193, 0.927174, 0.930123, 0.933041, 0.935929, 0.938787,
    0.941616, 0.944417, 0.947191, 0.949937, 0.952658, 0.955352, 0.958021, 0.960666,
    0.963286, 0.965883, 0.968457, 0.971008, 0.973536, 0.976043, 0.978529, 0.980993,
    0.983437, 0.985861, 0.988265, 0.990649, 0.993015, 0.995361, 0.997690, 1.000000]

var specialmemory_EQ_has_data = [false, false, false, false, false]
var specialmemory_EQ_Band1_State = [0.0, 0.0, 0.0, 0.0, 0.0]   // not as boolean
var specialmemory_EQ_Band2_State = [0.0, 0.0, 0.0, 0.0, 0.0]   // dto.
var specialmemory_EQ_Band3_State = [0.0, 0.0, 0.0, 0.0, 0.0]   // dto.
var specialmemory_EQ_Band4_State = [0.0, 0.0, 0.0, 0.0, 0.0]   // dto.
var specialmemory_EQ_Band1_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band2_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band3_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band4_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band1_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band2_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band3_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band4_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band1_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band2_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band3_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band4_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band1_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band2_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band3_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]
var specialmemory_EQ_Band4_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]

// to remember if Write done for special memory [1..4]
var specialmemory_EQ_Write_done = false

// to remember if Read done for special memory [1..4]
var specialmemory_EQ_Read_done = false

// variables to handle PF Mode
var PF_Mode_running = false
var selected_PF_Param = PF_Params.PF_PreGain          // always when PF Mode Enter
var last_selected_PF_Param = PF_Params.PF_PreGain
var disable_set_PF_Param_to_default = false

const number_of_HCut_frequencies = 139
var HCut_frequency_grid = [
    // 10 Hz: 50..200 Hz, 20 Hz: 200..800 Hz, 50 Hz: 800..2000 Hz,
    // 100 Hz: 2000..4000 Hz, 200 Hz: 4000..8000 Hz, 400 Hz: 8000..19200 Hz,
    // 20000 Hz
    0.000000, 0.177297, 0.207604, 0.227681, 0.243093, 0.255762, 0.266602, 0.276140,
    0.284648, 0.292384, 0.299482, 0.306052, 0.312175, 0.317916, 0.323326, 0.328445,
    0.337939, 0.346605, 0.354594, 0.362015, 0.368953, 0.375474, 0.381633, 0.387472,
    0.393026, 0.398327, 0.403398, 0.408262, 0.412937, 0.417439, 0.421782, 0.425979,
    0.430040, 0.433974, 0.437792, 0.441499, 0.445104, 0.448613, 0.452030, 0.455363,
    0.458614, 0.461790, 0.464892, 0.467926, 0.470895, 0.473802, 0.480815, 0.487498,
    0.493883, 0.500000, 0.505873, 0.511524, 0.516970, 0.522229, 0.527313, 0.532237,
    0.537011, 0.541645, 0.546148, 0.550529, 0.554795, 0.558952, 0.563007, 0.566965,
    0.570832, 0.574611, 0.578309, 0.581927, 0.585471, 0.588944, 0.595688, 0.602182,
    0.608448, 0.614501, 0.620359, 0.626035, 0.631542, 0.636890, 0.642091, 0.647152,
    0.652082, 0.656889, 0.661580, 0.666160, 0.670636, 0.675013, 0.679296, 0.683489,
    0.687596, 0.691622, 0.699444, 0.706979, 0.714252, 0.721281, 0.728086, 0.734681,
    0.741082, 0.747300, 0.753348, 0.759235, 0.764971, 0.770565, 0.776025, 0.781357,
    0.786569, 0.791666, 0.796654, 0.801538, 0.806323, 0.811014, 0.820129, 0.828913,
    0.837392, 0.845589, 0.853525, 0.861219, 0.868686, 0.875941, 0.882999, 0.889869,
    0.896565, 0.903095, 0.909469, 0.915694, 0.921780, 0.927732, 0.933557, 0.939261,
    0.944851, 0.950330, 0.955704, 0.960978, 0.966155, 0.971240, 0.976236, 0.981147,
    0.985976, 0.990726, 1.000000]

// variables to handle Send Mode
var Send_Mode_running = false
var enter_Send_Mode = false
var selected_Send = 1
var last_selected_Send = 1
var must_set_actual_Send_Level_Bank = false
var disable_set_Send_LevelA_to_Min_or_0dB = true
var disable_set_Send_LevelB_to_Min_or_0dB = false
var all_8_Send_Levels_were_set_to_oo = false
var old_knob_Send_Level_Values = [-0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1]
var old_Send_On_Values = [-0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1]
var old_Send_Pre_Values = [-0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1]
var avoid_set_Send_Level_LED_for_Send_LevelA = false
var sync_motorfader_within_Send_Mode_to_Send_Value = false
var selected_Send_changed_while_sync_motorfader_to_Send_Value = false

// variables to handle Cue Send Mode
var CueSend_Mode_running = false
var selected_CueSend = 1
var last_selected_CueSend = 1
var selected_CueSend_Param = CueSend_Params.CueSend_Level
var last_selected_CueSend_Param = CueSend_Params.CueSend_Level
var disable_set_CueSend_Level_to_Min_or_0dB = true
var all_4_CueSend_Levels_were_set_to_oo = false
var old_knob_CueSend_Level_Values = [-0.1, -0.1, -0.1, -0.1]
var old_knob_CueSend_Pan_Values = [-0.1, -0.1, -0.1, -0.1]
var old_CueSend_On_Values = [-0.1, -0.1, -0.1, -0.1]
var old_CueSend_Pre_Values = [-0.1, -0.1, -0.1, -0.1]

// variable for to realize the functionality 'toggle -oo dB / 0 dB / actual'
// within the Send Mode: Index 0..3 for bank LevelA, Index 4..7 for bank LevelB
// and within the Cue Send Mode: Index 8..11
var xSend_Level_Value_before_set_to_Min_or_0dB
    = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

// variables to handle QC Mode
var QC_Mode_running = false
var must_set_actual_QC = false
var fader_QC = 1
var fader_QC_selectable = false
var fader_QC_was_set = false
var QC_old_value = 0.0
var QC_new_value = 0.0
var fader_was_set_with_Touch_within_QC_Mode = false
var low_resolution_QC_Mode_locked = false            // state variable
var high_resolution_QC_Mode_locked = false           // dto.
var set_low_resolution_QC_Mode_with_Prev = false     // button control variable
var set_high_resolution_QC_Mode_with_Next = false    // dto.
var lock_low_resolution_QC_Mode_with_Prev = false    // dto.
var lock_high_resolution_QC_Mode_with_Next = false   // dto.
var toggle_lock_resolution_QC_Mode_with_Click = false
var set_min_value_QC_Mode_with_Prev = false          // button control variable
var set_max_value_QC_Mode_with_Next = false          // dto.

// recall variable for all Quick Controls, set when switching to QC Mode
var recall_QCs = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
var must_renew_recall_QCs = false

// QC_value_option for to toggle between min / mid / max / old
// option 0 = for initialization when the subpage was entered
// option 1 = min, this will set the value to 0
// option 2 = mid, this will set the value to 0.5
// option 3 = max, this will set the value to 1.0
// option 4 = old, this loads the value that was set when the subpage was entered
var QC_value_option = [0, 0, 0, 0, 0, 0, 0, 0]  // each array-item represents a QCx

// variables to handle Audio Mode
var Audio_Mode_running = false
var enter_Audio_Mode = false
var must_set_actual_Audio_Mode = false

// surface & layers
var surface = deviceDriver.mSurface
var cl_fader = surface.makeControlLayerZone('Z1').makeControlLayer('Fader')
var cl_uSection = surface.makeControlLayerZone('Z2').makeControlLayer('Upper Section')
var cl_mSection = surface.makeControlLayerZone('Z3').makeControlLayer('Middle Section')
var cl_tpSection = surface.makeControlLayerZone('Z4').makeControlLayer('Transport Section')
var cl_fsSection = surface.makeControlLayerZone('Z5').makeControlLayer('Footswitch')

// variables to handle QuickTracks
var UndefinedTrack = '*?*X*?*X*?*'
var FirstTrack = UndefinedTrack
var LastTrack = UndefinedTrack
var PreviousTrack = UndefinedTrack
var QuickTrack1 = UndefinedTrack
var QuickTrack2 = UndefinedTrack
var QuickTrack3 = UndefinedTrack
var QuickTrack4 = UndefinedTrack
var FirstTrack_distances = []
var LastTrack_distances = []
var QuickTrack1_distances = []
var QuickTrack2_distances = []
var QuickTrack3_distances = []
var QuickTrack4_distances = []
var selected_QuickTrack = -1
var selected_QuickTrack_distance = 0
var number_of_Tracks = 0
var TrackList = []
var tmp_TrackList = []
var ActualTrack = ''
var distance_to_FirstTrack = 0
var distance_to_LastTrack = 0
var QT_check_all_tracks_or_select_QuickTrack_running = false
var QT_abort_check_all_tracks = false
var QT_count_to_distance = 0
var QT_step_delay_ms_normal = 2               // possibly higher required, min. 2
var QT_step_delay_ms_when_check = 300         // possibly higher required, min. 300
var QT_step_delay_ms_when_check_turbo = 150   // possibly higher required, min. 150
var QT_check_turbo = true    // use MIDI Remote DirectAccess from Cubase 13 onwards
var QT_timestamp_at_start_of_loop = 0
var QT_loop_end_step_count = 0
var QT_max_equal_titles = 5
var QT_to_track_with_name_max_steps = QT_max_equal_titles
var QT_mode_after_to_track_with_name = 1  // check all tracks
var cycle_stop_combination_init = false
var cycle_stop_combination_init_timestamp = new Date().getTime()

// variables for to handle to move Fader to initial volume
// of QuickTrack 1..4 or to -oo dB / 0 dB / last
// by pressing Touch + Link / Pan / Channel / Scroll / Master / Click / Section
var QuickVolume1 = -0.1
var QuickVolume2 = -0.1
var QuickVolume3 = -0.1
var QuickVolume4 = -0.1
var last_Volume = -0.1

// special variables for directly controlling the motorfader
var fader_is_set_to_volume = true
var last_volume_DisplayValue = ''
var FP_last_write_value = -1
var shutdown_fader_on_close = true

// variables to avoid flicker when switching between Main Page and Shift Page
var return_from_main_anti_flicker = false
var return_from_shift_anti_flicker = false
var first_pan_activate = true
var first_zoom_activate = true
var first_shift_activate = true
var EQ_Mode_was_active = false
var bypass_LED_reset_within_onDeactivate_SubPage_Lock = false
var prevent_turnOffLinkLED_when_OnTitleChange = false
var disable_all_LED_functions = true

// other variables
var script_loaded = false
var script_deactivated = false
var knob_FP_prev_Value = 0.0  // saves previous value
var knob_was_rotated_within_Zoom_Mode = false
var knob_was_rotated_while_btn_Cycle_running = false
var knob_was_pressed_while_btn_Cycle_running = false
var knob_was_rotated_while_btn_Bypass_running = false
var knob_was_pressed_while_btn_Bypass_running = false
var ignore_next_GPS_trigger_while_btn_Bypass_pressed = false
var FP_locked = false
var lock_FP_within_QC_Mode = false
var stop_functionality_locked = false
var stop_functionality_locked_changed = false
var actual_motorfader_mode = motorfader_modes.mf_mode_on
var return_from_GTS = false

// Whether Cubase 13 or a higher version is installed
// is determined in the function hostBinding_fader.
var Cubase13_or_higher_installed = false

// the following variables are explained in the code below
var set_LEDs_at_start = true
var switch_to_Main_Page_at_start = true
var first_knob_CRLevel_Value_assign = true
var disable_Click_off = false
var disable_set_Pan_to_center = false
var disable_set_CRLevel_to_0dB_or_before_dB = false
var toShift_or_toCustom_when_Pan_Mode = false
var btn_Shift_running = false
var btn_Shift_running_fixed = false
var Custom_Mode_running = false
var toggle_Arm_Unarm_next = false
var next_grid_type_selected = false
var Scroll_Mode_per_frame = false
var Link_Pan_Channel_Scroll_running = false
var Link_Pan_Channel_Scroll_perform_down = false
var btn_Bypass_pressed_to_toggle_listen_state = false
var btn_Bypass_pressed_to_toggle_monitor_state = false
var btn_Bypass_pressed_to_toggle_editChannel = false
var btn_Bypass_pressed_to_toggle_Mixer_Window = false
var btn_Bypass_pressed_to_toggle_Video_Window = false
var btn_Bypass_pressed_within_EQ_Mode = false
var btn_Bypass_pressed_within_Send_Mode = false
var btn_Bypass_pressed_to_call_Bypass_Write_functions = false
var btn_Bypass_pressed_to_toggle_Automation_Panel = false
var btn_Bypass_pressed_to_toggle_Markers_Window = false
var btn_Bypass_pressed_to_set_left_selSide_to_cursor = false
var btn_Bypass_pressed_to_set_right_selSide_to_cursor = false
var btn_Bypass_pressed_to_disable_Navigation_Mode = false
var btn_Bypass_pressed_to_enable_Navigation_Mode = false
var btn_Bypass_pressed_to_start_Loop_Selection = false
var btn_Bypass_pressed_to_set_actual_fsMode = false
var btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode = false
var btn_Bypass_pressed_for_toggle_between_pan_and_pan2 = false
var btn_Write_running_since_Bypass_Write_pressed = false
var btn_Scroll_pressed_to_enter_Zoom_Mode = false
var btn_Scroll_pressed_for_zoom_command = false
var btn_Read_running_since_toggling_Automation_Panel = false
var listen_or_monitor_state_was_set_to_on = false
var perform_hide_all_automation_when_Bypass_is_pressed_next = false
var perform_show_all_automation_when_Touch_is_pressed_next = false
var Pan2_active = false
var Pan_Value_changed_with_button = false
var special_memory_was_written = false
var special_memory_was_read = false
var perform_clear_special_memory_Write = false
var perform_clear_special_memory_Read = false

// state counter variable, required for some repress-button-functionalities:
// [0, 1] = not enable // [2] = enable
var enable_toggle_lock_with_button = 0

// Use special data structure as 24 virtual LEDs to reduce midi data traffic.
// s (state) assumes these values: 0 = undefined, 1 = off, 2 = on, 3 = flashing
// The RGB setting [0x00, 0x00, 0x00] is interpreted as undefined.
//
var virt_LEDs_s = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
var virt_LEDs_r = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
var virt_LEDs_g = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
var virt_LEDs_b = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]


function reset_virt_LEDs() {
    // set all virtual LEDs to undefinded
    for (i = 0; i < 24; i++) {
        virt_LEDs_s[i] = 0
        virt_LEDs_r[i] = 0
        virt_LEDs_g[i] = 0
        virt_LEDs_b[i] = 0
    }
}

// determine array index of a button code
function LED_Index(cButton) {
    switch (cButton) {
        case cSolo    : return 0
        case cMute    : return 1
        case cArm     : return 2
        case cShift   : return 3
        case cBypass  : return 4
        case cTouch   : return 5
        case cWrite   : return 6
        case cRead    : return 7
        case cPrev    : return 8
        case cNext    : return 9
        case cLink    : return 10
        case cPan     : return 11
        case cChannel : return 12
        case cScroll  : return 13
        case cMaster  : return 14
        case cClick   : return 15
        case cSection : return 16
        case cMarker  : return 17
        case cCycle   : return 18
        case cRWD     : return 19
        case cFWD     : return 20
        case cStop    : return 21
        case cPlay    : return 22
        case cRecord  : return 23
    }
}

// determine the code of an LED of the middle section by Index (1..8)
function mLED_code(Index) {
    switch (Index) {
        case 1: return cLink
        case 2: return cPan
        case 3: return cChannel
        case 4: return cScroll
        case 5: return cMaster
        case 6: return cClick
        case 7: return cSection
        case 8: return cMarker
    }
}

function offLED(device, cButton) {
    if (disable_all_LED_functions) {
        return
    }
    if (virt_LEDs_s[LED_Index(cButton)] == 1) {
        // hardware is already in the desired state
        return
    }
    virt_LEDs_s[LED_Index(cButton)] = 1

    // only control hardware if a change is absolutely necessary
    midiOut.sendMidi(device, [0x90, cButton, 0x00])
}

function onLED(device, cButton) {
    if (disable_all_LED_functions) {
        return
    }
    if (virt_LEDs_s[LED_Index(cButton)] == 2) {
        // hardware is already in the desired state
        return
    }
    virt_LEDs_s[LED_Index(cButton)] = 2

    // only control hardware if a change is absolutely necessary
    midiOut.sendMidi(device, [0x90, cButton, 0x7F])
}

function flashingLED(device, cButton) {
    if (disable_all_LED_functions) {
        return
    }
    if (virt_LEDs_s[LED_Index(cButton)] == 3) {
        // hardware is already in the desired state
        return
    }
    virt_LEDs_s[LED_Index(cButton)] = 3

    // only control hardware if a change is absolutely necessary
    midiOut.sendMidi(device, [0x90, cButton, 0x01])
}

function setRGBLED(device, cButton, r, g, b) {
    if (disable_all_LED_functions) {
        return
    }
    // 7 bit for r, g, b = mandantory range from 0x00 to 0x7F
    if ((virt_LEDs_r[LED_Index(cButton)] == r)
    && (virt_LEDs_g[LED_Index(cButton)] == g)
    && (virt_LEDs_b[LED_Index(cButton)] == b)) {
        // hardware is already in the desired state
        return
    }
    virt_LEDs_r[LED_Index(cButton)] = r
    virt_LEDs_g[LED_Index(cButton)] = g
    virt_LEDs_b[LED_Index(cButton)] = b

    // only control hardware if a change is absolutely necessary
    midiOut.sendMidi(device, [0x91, cButton, r])
    midiOut.sendMidi(device, [0x92, cButton, g])
    midiOut.sendMidi(device, [0x93, cButton, b])
}

function setColorLED(device, cButton, RGB_Color) {
    switch (RGB_Color) {
        case (RGB_Colors.c_red):       // full power
            setRGBLED(device, cButton, 0x7F, 0x00, 0x00)
            break
        case (RGB_Colors.c_green):     // full power
            setRGBLED(device, cButton, 0x00, 0x7F, 0x00)
            break
        case (RGB_Colors.c_green_light):
            setRGBLED(device, cButton, 0x20, 0x70, 0x20)
            break
        case (RGB_Colors.c_green_medium):
            setRGBLED(device, cButton, 0x00, 0x60, 0x00)
            break
        case (RGB_Colors.c_green_grey):
            setRGBLED(device, cButton, 0x16, 0x28, 0x16)
            break
        case (RGB_Colors.c_blue):      // full power
            setRGBLED(device, cButton, 0x00, 0x00, 0x7F)
            break
        case (RGB_Colors.c_blue_light):
            setRGBLED(device, cButton, 0x0C, 0x0C, 0x7F)
            break
        case (RGB_Colors.c_blue_medium):
            setRGBLED(device, cButton, 0x00, 0x00, 0x60)
            break
        case (RGB_Colors.c_blue_grey):
            setRGBLED(device, cButton, 0x13, 0x13, 0x40)
            break
        case (RGB_Colors.c_cyan):
            setRGBLED(device, cButton, 0x00, 0x7F, 0x7F)
            break
        case (RGB_Colors.c_cyan_light):
            setRGBLED(device, cButton, 0x20, 0x70, 0x70)
            break
        case (RGB_Colors.c_cyan_medium):
            setRGBLED(device, cButton, 0x00, 0x37, 0x37)
            break
        case (RGB_Colors.c_white_medium):
            setRGBLED(device, cButton, 0x48, 0x48, 0x48)
            break
        case (RGB_Colors.c_grey):
            setRGBLED(device, cButton, 0x20, 0x20, 0x20)
            break
        case (RGB_Colors.c_darkgrey):
            setRGBLED(device, cButton, 0x0A, 0x0A, 0x0A)
            break
        case (RGB_Colors.c_yellow_medium):
            setRGBLED(device, cButton, 0x40, 0x40, 0x00)
            break
        case (RGB_Colors.c_orange):
            setRGBLED(device, cButton, 0x59, 0x26, 0x00)
            break
        case (RGB_Colors.c_orange_light):
            setRGBLED(device, cButton, 0x6A, 0x2C, 0x10)
            break
        case (RGB_Colors.c_orangered):
            setRGBLED(device, cButton, 0x68, 0x0C, 0x00)
            break
        case (RGB_Colors.c_pink):
            setRGBLED(device, cButton, 0x70, 0x20, 0x70)
            break
        case (RGB_Colors.c_magenta):
            setRGBLED(device, cButton, 0x7F, 0x00, 0x7F)
            break
        case (RGB_Colors.c_magenta_medium):
            setRGBLED(device, cButton, 0x40, 0x00, 0x40)
            break
        case (RGB_Colors.c_violet):
            setRGBLED(device, cButton, 0x19, 0x00, 0x7F)
            break
        case (RGB_Colors.c_off):
            // Note: 0x00, 0x00, 0x00 is forbidden here.
            setRGBLED(device, cButton, 0x02, 0x02, 0x02)
            break
    }
}

function prev_volume_grid_value (value) {
    // search for next lower value in volume grid
    var new_value = 0.0
    var scan_value = value - 0.0001
    var scan_index = 1
    if (Volume_Max_12) {
        while ((volume_grid_12[number_of_volume_grid_12_values - scan_index]
            >= scan_value) && (scan_index <= number_of_volume_grid_12_values)) {
            scan_index++
        }
        if (scan_index <= number_of_volume_grid_12_values) {
            new_value = volume_grid_12[number_of_volume_grid_12_values - scan_index]
        }
    } else {
        while ((volume_grid_6[number_of_volume_grid_6_values - scan_index]
            >= scan_value) && (scan_index <= number_of_volume_grid_6_values)) {
            scan_index++
        }
        if (scan_index <= number_of_volume_grid_6_values) {
            new_value = volume_grid_6[number_of_volume_grid_6_values - scan_index]
        }
    }
    return new_value
}

function next_volume_grid_value (value) {
    // search for next higher value in volume grid
    var new_value = 1.0
    var scan_value = value + 0.0001
    var scan_index = 1
    if (Volume_Max_12) {
        while ((volume_grid_12[scan_index - 1]
            <= scan_value) && (scan_index <= number_of_volume_grid_12_values)) {
            scan_index++
        }
        if (scan_index <= number_of_volume_grid_12_values) {
            new_value = volume_grid_12[scan_index - 1]
        }
    } else {
        while ((volume_grid_6[scan_index - 1]
            <= scan_value) && (scan_index <= number_of_volume_grid_6_values)) {
            scan_index++
        }
        if (scan_index <= number_of_volume_grid_6_values) {
            new_value = volume_grid_6[scan_index - 1]
        }
    }
    return new_value
}

function makeCommandBinding_on_all_pages_except_custom
    (var_param, cmd_param1, cmd_param2) {

    pageMain.makeCommandBinding(var_param, cmd_param1, cmd_param2)
    pageShift.makeCommandBinding(var_param, cmd_param1, cmd_param2)
    pageEQ.makeCommandBinding(var_param, cmd_param1, cmd_param2)
    pagePF.makeCommandBinding(var_param, cmd_param1, cmd_param2)
    pageSend.makeCommandBinding(var_param, cmd_param1, cmd_param2)
    pageCueSend.makeCommandBinding(var_param, cmd_param1, cmd_param2)
    pageQC.makeCommandBinding(var_param, cmd_param1, cmd_param2)
    pageAudio.makeCommandBinding(var_param, cmd_param1, cmd_param2)
}


// FADER

function create_fader(p_x, p_y, p_height) {
    var fader = {}
    fader.var_faderIn = surface.makeFader(p_x, p_y, 1.1, p_height).setTypeVertical()
        .setControlLayer(cl_fader)
    fader.var_faderOut = surface.makeCustomValueVariable('var_faderOut')
    fader.var_faderTouched = surface.makeCustomValueVariable('var_faderTouched')

    // FP_read & FP_write have the direct link to the hardware.
    fader.FP_read = surface.makeCustomValueVariable('FP_read')
    fader.FP_write = surface.makeCustomValueVariable('FP_write')

    // Note: The processing chains work as follows:
    //       FaderPort > FP_read > faderIn > host (volume, value under mouse, etc.)
    //       host (volume, value under mouse, etc.) > faderOut > FP_write > FaderPort

    fader.var_faderIn.mSurfaceValue
        .mOnDisplayValueChange = function(context, objectTitle, valueTitle) {
        last_volume_DisplayValue = objectTitle
    }

    fader.var_faderIn.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (debug_fader)
            console.log('001) var_faderIn_ValueChange: ' + value.toString())

        // If the 'Volume Max' setting is changed within Cubase and the user-specific
        // script setting Volume_Max_12 is no longer correct, a self-learning procedure
        // can be executed. For this, switch to the Pan Mode, hold down the Touch Button,
        // and slowly press the Master, the Click and again the Master Button in sequence
        // while the Touch Button is pressed down. This will temporarily synchronize
        // the script setting Volume_Max_12 with the 'Volume Max' setting of Cubase.
        // If the current fader position is set to 0 dB, the synchronization takes place
        // automatically. The preparation of the synchronization takes place here:

        if (fader_is_set_to_volume) {
            // In four cases, a necessary toggeling for Volume_Max can be detected.
            if (
                // Mismatch detection if displayed 0.00 dB doesn't fit.
                ((last_volume_DisplayValue == '0.00') &&
                (((Volume_Max_12) &&
                ((Math.round(1000*value) / 1000) == (Math.round(1000*c0dB_6) / 1000)))
                ||
                ((!Volume_Max_12) &&
                ((Math.round(1000*value) / 1000) == (Math.round(1000*c0dB_12) / 1000)))))

            || // Further mismatch detection if Volume_Max not yet switched to +6 dB.
               ((last_volume_DisplayValue == '-0.85') && (Volume_Max_12)
                && ((Math.round(1000*value) / 1000) == (Math.round(1000*c0dB_12) / 1000)))

            || // Further mismatch detection if Volume_Max not yet switched to +12 dB.
               ((last_volume_DisplayValue == '1.95') && (!Volume_Max_12)
                && ((Math.round(1000*value) / 1000) == (Math.round(1000*c0dB_6) / 1000)))

            ) {
                Volume_Max_12 = !Volume_Max_12
                if (Volume_Max_12) {
                    CRLevel_Value_0dB = c0dB_12
                    CRLevel_Value_n20dB = cn20dB_12
                    Fader_Value_0dB = c0dB_12
                    console.log('Volume Max changed to +12 dB')
                } else {
                    CRLevel_Value_0dB = c0dB_6
                    CRLevel_Value_n20dB = cn20dB_6
                    Fader_Value_0dB = c0dB_6
                    console.log('Volume Max changed to +6 dB')
                }
                CRLevel_Value_before_set_to_0dB = CRLevel_Value_0dB
                original_CRLevel_Value_0dB = CRLevel_Value_0dB

                // Clear all stored volumes as the corresponding dB values have changed.
                QuickVolume1 = -0.1
                QuickVolume2 = -0.1
                QuickVolume3 = -0.1
                QuickVolume4 = -0.1
                last_Volume = -0.1
            }
        }

        // If the QC Mode is running and the fader is assigned to a QCx,
        // only transfer the value of the fader to the knob.
        if ((QC_Mode_running)
        && (actual_motorfader_mode == motorfader_modes.mf_mode_QCx)) {
            if (active_page == pages.page_QC1) {
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_QC1_Value.getProcessValue(context))
            } else if (active_page == pages.page_QC2) {
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_QC2_Value.getProcessValue(context))
            } else if (active_page == pages.page_QC3) {
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_QC3_Value.getProcessValue(context))
            } else if (active_page == pages.page_QC4) {
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_QC4_Value.getProcessValue(context))
            }
            return
        }

        // Disable motor if GTS is running
        // or 'check all tracks' is running or 'select QuickTrack' is running
        // or the motor should be turn off within the Zoom Mode
        // or the motorfader mode is not set to QCx
        // and [knob controls value under mouse or motorfader mode is not set to on].
        if ((btn_Cycle_running)
        || (QT_check_all_tracks_or_select_QuickTrack_running)
        || ((turn_off_motor_when_Zoom_Mode_is_active) && (active_page == pages.page_Zoom))
        || ((actual_motorfader_mode != motorfader_modes.mf_mode_QCx)
            && ((active_page == pages.page_Lock)
            || (actual_motorfader_mode != motorfader_modes.mf_mode_on)))) {

            return
        }

        fader.var_faderOut.setProcessValue(context, value)
    }

    fader.calculate_sync_0dB_to_U = function(value) {
        // Function for adjusting the postion of the motorfader on the FaderPort.
        // The "U"-Position should correspond to 0 dB in Cubase.
        if (CRLevel_Value_0dB == c0dB_6) {
            // when Volume Max is set to +6 dB
            if (value > c0dB_6) {
                // adjust stretching above 0 dB gliding to value 1.0
                value = (value * xU_6)
                    + ((1 - xU_6) * (value - c0dB_6) / (1 - c0dB_6))
            } else {
                // stretching for +6 dB Max when volume <= 0 dB
                value = value * xU_6
            }
        } else if (CRLevel_Value_0dB == c0dB_12) {
            // when Volume Max is set to +12 dB
            if (value > c0dB_12) {
                // adjust stretching above 0 dB gliding to value 1.0
                value = (value * xU_12)
                    + ((1 - xU_12) * (value - c0dB_12) / (1 - c0dB_12))
            } else {
                // stretching for +12 dB Max when volume <= 0 dB
                value = value * xU_12
            }
        }
        return value
    }

    fader.var_faderOut.mOnProcessValueChange = function(context, value) {
        if (debug_fader)
            console.log('002) var_faderOut_ValueChange: ' + value.toString())

        if ((sync_0dB_to_U) && (fader_is_set_to_volume)) {
            value = fader.calculate_sync_0dB_to_U(value)
        }

        if ((limit_low_Fader_Value) && (fader_is_set_to_volume)) {
            // pull down values lower than this technical value to -oo dB
            if (value < 0.012) {
                value = 0
            }
        }

        // perform FP_write.setProcessValue only if value has changed
        if (value != FP_last_write_value) {
            FP_last_write_value = value

            // Exception: As long as the motorfader is touched
            // or the entire FaderPort is locked, the motorfader must not move by itself,
            // but FP_last_write_value must remain set
            // for cases where fader movements were made with the mouse within Cubase.
            if ((fader.var_faderTouched.getProcessValue(context)) || (FP_locked)) {
                if (debug_fader) {
                    console.log('003) var_faderOut_ValueChange, discontinued')
                }
            } else if (!((Send_Mode_running)
            && (sync_motorfader_within_Send_Mode_to_Send_Value))) {
                fader.FP_write.setProcessValue(context, value)
            }
        }
    }

    fader.FP_read.mOnProcessValueChange = function(context, value) {
        if ((FP_locked) || !(fader.var_faderTouched.getProcessValue(context)))
            return
        if (debug_fader)
            console.log('004) FP_read_ValueChange: ' + value.toString())

        if ((determine_sync_factors)
        && (value / c0dB_6 >= 0.91) && (value / c0dB_6 < 1.01)) {
            // Detect and show sync-factors
            // within a range near postion "U" on the FaderPort.
            // Note: determine_sync_factors must be set to false
            // after determining the sync-factors.
            var sf6 = (Math.round(1000*value / c0dB_6) / 1000).toString()
            while (sf6.length < 5) {
                sf6 = sf6 + '0'
            }
            var sf12 = (Math.round(1000*value / c0dB_12) / 1000).toString()
            while (sf12.length < 5) {
                sf12 = sf12 + '0'
            }
            console.log('sync-factors'
                + '   xU_6 = ' + sf6  + '   xU_12 = ' + sf12)
        }

        if ((limit_low_Fader_Value) && (fader_is_set_to_volume)) {
            // pull down values lower than this technical value to -oo dB
            if (value < 0.012) {
                value = 0
            }
        }

        if ((sync_0dB_to_U) && (fader_is_set_to_volume)) {
            // Adjusting the postion of the motorfader on the FaderPort.
            // The "U"-Position should correspond to 0 dB in Cubase.
            if (CRLevel_Value_0dB == c0dB_6) {
                // when Volume Max is set to +6 dB
                if (value > (c0dB_6 * xU_6)) {
                    // adjust stretching above 0 dB gliding to value 1.0
                    value = (value / xU_6)
                        - (((1 / xU_6) - 1) * (value - (c0dB_6 * xU_6))
                            / (1 - (c0dB_6 * xU_6)))
                } else {
                    // stretching for +6 dB Max when volume <= 0 dB
                    value = value / xU_6
                }
            } else if (CRLevel_Value_0dB == c0dB_12) {
                // when Volume Max is set to +12 dB
                if (value > (c0dB_12 * xU_12)) {
                    // adjust stretching above 0 dB gliding to value 1.0
                    value = (value / xU_12)
                        - (((1/xU_12) - 1) * (value - (c0dB_12 * xU_12))
                            / (1 - (c0dB_12 * xU_12)))
                } else {
                    // stretching for +12 dB Max when volume <= 0 dB
                    value = value / xU_12
                }
            }
        }

        if ((Send_Mode_running) && (sync_motorfader_within_Send_Mode_to_Send_Value)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        } else {
            fader.var_faderIn.mSurfaceValue.setProcessValue(context, value)
        }

        // Force next FP_write
        // if the fader was moved manually at the FaderPort.
        FP_last_write_value = -1
    }

    fader.FP_write.mOnProcessValueChange = function(context, value) {
        if (debug_fader)
            console.log('005) FP_write_ValueChange: ' + value.toString())
    }

    fader.show_actual_motorfader_mode = function(context) {
        switch (actual_motorfader_mode) {
            case motorfader_modes.mf_mode_on:
                setColorLED(context, cTouch, RGB_Colors.c_blue_medium)
                break
            case motorfader_modes.mf_mode_off:
                setColorLED(context, cTouch, RGB_Colors.c_pink)
                break
            case motorfader_modes.mf_mode_direct:
                setColorLED(context, cTouch, RGB_Colors.c_cyan)
                break
            case motorfader_modes.mf_mode_QCx:
                setColorLED(context, cTouch, RGB_Colors.c_grey)
                break
        }
        onLED(context, cTouch)
    }

    fader.sync_motorfader_with_QCx = function(context) {
        if (actual_motorfader_mode == motorfader_modes.mf_mode_QCx) {
            switch (fader_QC) {
                case 1:
                    fader.var_faderOut.setProcessValue(context,
                        mSection.knob_QC1_Value.getProcessValue(context))
                    break
                case 2:
                    fader.var_faderOut.setProcessValue(context,
                        mSection.knob_QC2_Value.getProcessValue(context))
                    break
                case 3:
                    fader.var_faderOut.setProcessValue(context,
                        mSection.knob_QC3_Value.getProcessValue(context))
                    break
                case 4:
                    fader.var_faderOut.setProcessValue(context,
                        mSection.knob_QC4_Value.getProcessValue(context))
                    break
            }
        }
    }
    return fader
}

function midiBinding_fader() {
    // FP_read & FP_write have the direct link to the hardware.
    fader.FP_read.mMidiBinding.setInputPort(midiIn).bindToPitchBend(0)
    fader.FP_write.mMidiBinding.setOutputPort(midiOut).bindToPitchBend(0)
    fader.var_faderTouched.mMidiBinding.setInputPort(midiIn).bindToNote(0, cFaderTouch)
}

function hostBinding_fader() {

    // Whether the fader is being touched can only be determined from Cubase 13 onwards.
    if (fader.var_faderIn.mSurfaceValue.mTouchState) {
        Cubase13_or_higher_installed = true
        fader.var_faderIn.mSurfaceValue.mTouchState.bindTo(fader.var_faderTouched)
    }

    pageMain.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageMain.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)
    pageShift.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageShift.mHostAccess.mMouseCursor.mValueUnderMouse)

    // When Custom Mode, set motorfader mode to control value under mouse.
    pageCustomA0.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageCustomA0.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomA1.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageCustomA1.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomA2.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageCustomA2.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomB0.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageCustomB0.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomB1.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageCustomB1.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomB2.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageCustomB2.mHostAccess.mMouseCursor.mValueUnderMouse)

    // When EQ Mode, set motorfader mode to control volume of selected track.
    pageEQ.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageEQ.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)

    // When PF Mode, set motorfader mode to control volume of selected track.
    pagePF.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pagePF.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)

    // When Send Mode, set motorfader mode to control volume of selected track.
    pageSend.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageSend.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)

    // When Cue Send Mode, set motorfader mode to control volume of selected track.
    pageCueSend.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageCueSend.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)

    // When QC Mode, set motorfader mode to control volume of selected track as standard.
    // Change may occur if motorfader mode is set to QCx.
    pageQC.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageQC.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)

    // When Audio Mode, set motorfader mode to control volume of selected track.
    pageAudio.makeValueBinding(fader.var_faderIn.mSurfaceValue,
        pageAudio.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)
}

function assigning_fader_before_HostBinding_within_Send_Mode() {
    if (sync_motorfader_within_Send_Mode_to_Send_Value) {
        // sync to Send, assigning the fader before HostBinding
        pageSend.makeValueBinding(fader.var_faderIn.mSurfaceValue,
            pageSend.mHostAccess.mTrackSelection.mMixerChannel
                .mSends.getByIndex(selected_Send - 1).mLevel)
    } else {
        // sync to Volume, assigning the fader before HostBinding
        pageSend.makeValueBinding(fader.var_faderIn.mSurfaceValue,
            pageSend.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)
   }
}


// UPPER SECTION

// global variable for to remember state if Bypass Button is pressed down
var btn_Bypass_running = false

// global variables for to remember state if Write / Read Buttons are pressed down
var btn_Write_running = false
var btn_Read_running = false

// global variables for to remember state if Write / Read Buttons were pressed
var after_Write_running_wait = false
var after_Read_running_wait = false

// global variables for to remember state if Touch Button is pressed down
// f.e. for the button combination Stop + Touch to disable the VU-Meter LED
var btn_Touch_running_fixed = false
var btn_Touch_running_while_clear = false
var btn_Touch_running_doubleclick = false
var disable_VUMeter_with_Stop_after_Touch = false

var VUMeter_peak_was_shown_after_stop = false

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

    // use custom variable for to handle volume of selected track
    uSection.var_Volume
        = surface.makeCustomValueVariable('var_Volume')

    // use custom variables for to handle toggle solo of selected track
    uSection.var_solo
        = surface.makeCustomValueVariable('var_solo')
    uSection.var_soloCmd
        = surface.makeCustomValueVariable('var_soloCmd')

    // use custom variable for to handle solo defeat of selected track
    uSection.var_solo_defeat
        = surface.makeCustomValueVariable('var_solo_defeat')

    // use custom variable for to handle unsolo all tracks
    uSection.var_unsolo_all
        = surface.makeCustomValueVariable('var_unsolo_all')

    // use custom variables for to handle toggle mute of selected track
    uSection.var_mute
        = surface.makeCustomValueVariable('var_mute')
    uSection.var_muteCmd
        = surface.makeCustomValueVariable('var_muteCmd')

    // use custom variable for to handle unmute all tracks
    uSection.var_unmute_all
        = surface.makeCustomValueVariable('var_unmute_all')

    // use custom variables for to handle toggle arm of selected track
    uSection.var_arm
        = surface.makeCustomValueVariable('var_arm')
    uSection.var_armCmd
        = surface.makeCustomValueVariable('var_armCmd')

    // use custom variables for to handle arm all audio tracks
    uSection.var_arm_all
        = surface.makeCustomValueVariable('var_arm_all')

    // use custom variables for to handle unarm all audio tracks
    uSection.var_unarm_all
        = surface.makeCustomValueVariable('var_unarm_all')

    // use custom variable for to handle next grid type function
    uSection.var_next_grid_type
        = surface.makeCustomValueVariable('var_next_grid_type')

    // use custom variable for to handle toggle bypass cue sends of selected track
    uSection.var_bypass_cue_sends
        = surface.makeCustomValueVariable('var_bypass_cue_sends')

    // use custom variables for to handle VU-Meter and clear commands
    uSection.var_VUMeter
        = surface.makeCustomValueVariable('var_VUMeter')
    uSection.var_Clear_VUMeters
        = surface.makeCustomValueVariable('var_Clear_VUMeters')
    uSection.var_Clear_AudioPerformancePeaks
        = surface.makeCustomValueVariable('var_Clear_AudioPerformancePeaks')

    // use custom variable for to handle if Focus Quick Controls are locked
    uSection.var_FocusLockedValue
        = surface.makeCustomValueVariable('var_FocusLockedValue')

    // use custom variable for to handle
    // toggle enable all / disable all selected audio tracks
    uSection.var_enable_disable_audio_tracks
        = surface.makeCustomValueVariable('var_enable_disable_audio_tracks')

    // use custom variable for to handle toggle automation write of selected track
    uSection.var_automation_write
        = surface.makeCustomValueVariable('var_automation_write')

    // use custom variable for to handle toggle automation read of selected track
    uSection.var_automation_read
        = surface.makeCustomValueVariable('var_automation_read')

    // use custom variable for to handle toggle automation read of all selected tracks
    uSection.var_automation_write_all
        = surface.makeCustomValueVariable('var_automation_write_all')

    // use custom variable for to handle toggle automation read of all selected tracks
    uSection.var_automation_read_all
        = surface.makeCustomValueVariable('var_automation_read_all')

    // use custom variable for to hide automation everywhere (except Custom Mode)
    uSection.var_hide_automation
        = surface.makeCustomValueVariable('var_hide_automation')

    // use custom variable for to hide all automation everywhere (except Custom Mode)
    uSection.var_hide_all_automation
        = surface.makeCustomValueVariable('var_hide_all_automation')

    // use custom variable for to show used automation everywhere (except Custom Mode)
    uSection.var_show_automation
        = surface.makeCustomValueVariable('var_show_automation')

    // use custom variable for to show all used automation everywhere (except Custom Mode)
    uSection.var_show_all_automation
        = surface.makeCustomValueVariable('var_show_all_automation')

    // use custom variable for to suspend all automation everywhere (except Custom Mode)
    uSection.var_suspend_all_automation
        = surface.makeCustomValueVariable('var_suspend_all_automation')

    // use custom variable for to toggle automation mode everywhere (except Custom Mode)
    uSection.var_next_automation_mode
        = surface.makeCustomValueVariable('var_next_automation_mode')

    // use custom variable for to handle toggle automation trim (except Custom Mode)
    uSection.var_automation_trim
        = surface.makeCustomValueVariable('var_automation_trim')

    // use custom variables for to handle page mapping
    uSection.var_pageMain_Activate
        = surface.makeCustomValueVariable('var_pageMain_Activate')
    uSection.var_pageShift_Activate
        = surface.makeCustomValueVariable('var_pageShift_Activate')
    uSection.var_pageEQ_Activate
        = surface.makeCustomValueVariable('var_pageEQ_Activate')
    uSection.var_pagePF_Activate
        = surface.makeCustomValueVariable('var_pagePF_Activate')
    uSection.var_pageSend_Activate
        = surface.makeCustomValueVariable('var_pageSend_Activate')
    uSection.var_pageCueSend_Activate
        = surface.makeCustomValueVariable('var_pageCueSend_Activate')
    uSection.var_pageQC_Activate
        = surface.makeCustomValueVariable('var_pageQC_Activate')
    uSection.var_pageAudio_Activate
        = surface.makeCustomValueVariable('var_pageAudio_Activate')


    uSection.var_solo.mOnProcessValueChange = function(context, value) {
        if ((value)
        && ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running))) {
            if (swap_SoloMute) {
                onLED(context, cMute)
            } else {
                onLED(context, cSolo)
            }
        } else {
            if (swap_SoloMute) {
                offLED(context, cMute)
            } else {
                offLED(context, cSolo)
            }
        }
    }

    var bak_Link_virt_LEDs_r = 0
    var bak_Link_virt_LEDs_g = 0
    var bak_Link_virt_LEDs_b = 0
    var bak_Link_virt_LEDs_s = 0

    uSection.set_Link_LED_when_Bypass_Solo_Mute = function(context, mode) {
        // mode = 1 for listen, mode = 2 for monitor status

        // prevent duplicate function calls with a special color change in succession
        // so that the storage of the old status of the Link LED is not lost
        if (((virt_LEDs_r[LED_Index(cLink)] == 0x0C)
            && (virt_LEDs_g[LED_Index(cLink)] == 0x0C)
            && (virt_LEDs_b[LED_Index(cLink)] == 0x0C))
        || ((virt_LEDs_r[LED_Index(cLink)] == 0x7E)
            && (virt_LEDs_g[LED_Index(cLink)] == 0x00)
            && (virt_LEDs_b[LED_Index(cLink)] == 0x00))
        || ((virt_LEDs_r[LED_Index(cLink)] == 0x7F)
            && (virt_LEDs_g[LED_Index(cLink)] == 0x50)
            && (virt_LEDs_b[LED_Index(cLink)] == 0x11))) {
            return
        }
        // save color and state of the Link LED
        bak_Link_virt_LEDs_r = virt_LEDs_r[LED_Index(cLink)]
        bak_Link_virt_LEDs_g = virt_LEDs_g[LED_Index(cLink)]
        bak_Link_virt_LEDs_b = virt_LEDs_b[LED_Index(cLink)]
        bak_Link_virt_LEDs_s = virt_LEDs_s[LED_Index(cLink)]

        // set Link LED to color for off / listen on / mute on
        if (!listen_or_monitor_state_was_set_to_on) {
            setRGBLED(context, cLink, 0x0C, 0x0C, 0x0C)   // special off color value
        } else if (mode == 1) {
            setRGBLED(context, cLink, 0x7E, 0x00, 0x00)   // special listen color value
        } else if (mode == 2) {
            setRGBLED(context, cLink, 0x7F, 0x50, 0x11)   // special monitor color value
        }
        onLED(context, cLink)
    }

    uSection.restore_Link_LED_after_Bypass_Solo_Mute = function(context) {
        // only execute if the colors of the link LED have not changed in the meantime
        if (((virt_LEDs_r[LED_Index(cLink)] == 0x0C)
            && (virt_LEDs_g[LED_Index(cLink)] == 0x0C)
            && (virt_LEDs_b[LED_Index(cLink)] == 0x0C))
        || ((virt_LEDs_r[LED_Index(cLink)] == 0x7E)
            && (virt_LEDs_g[LED_Index(cLink)] == 0x00)
            && (virt_LEDs_b[LED_Index(cLink)] == 0x00))
        || ((virt_LEDs_r[LED_Index(cLink)] == 0x7F)
            && (virt_LEDs_g[LED_Index(cLink)] == 0x50)
            && (virt_LEDs_b[LED_Index(cLink)] == 0x11))) {

            setRGBLED(context, cLink,
                bak_Link_virt_LEDs_r, bak_Link_virt_LEDs_g, bak_Link_virt_LEDs_b)

            switch (bak_Link_virt_LEDs_s) {
                case 1:
                    offLED(context, cLink)
                    break
                case 2:
                    onLED(context, cLink)
                    break
                case 3:
                    flashingLED(context, cLink)
                    break
            }
        }
    }

    var btn_Solo_release_timestamp = new Date().getTime()
    var btn_Solo_release_ActualTrack = ''

    uSection.btn_Solo.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value == 0) {
            uSection.restore_Link_LED_after_Bypass_Solo_Mute(context)
            btn_Solo_release_timestamp = new Date().getTime()
            btn_Solo_release_ActualTrack = ActualTrack
        }

        if ((value == 0) || (Custom_Mode_running))
            return

        if (btn_Bypass_running) {
            // Listen Mode is only available for normal tracks
            if (ActualTrack != '') {
                btn_Bypass_pressed_to_toggle_listen_state = true
                if (Cubase13_or_higher_installed) {
                    toggle_listen()
                    uSection.set_Link_LED_when_Bypass_Solo_Mute(context, 1)
                }
            }
            return
        }

        // The button combination Shift + Solo activates the Audio Mode.
        if (btn_Shift_running_fixed) {
            if (value) {
                if (!Audio_Mode_running) {
                    enter_Audio_Mode = true
                    if (last_active_pageAudio == pages.page_Audio_Volume) {
                        must_set_actual_Audio_Mode = false
                    } else {
                        must_set_actual_Audio_Mode = true
                    }
                    uSection.var_pageAudio_Activate.setProcessValue(context, 1)
                }
            }
            return
        }

        if ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running)) {
            // toggle solo of selected track
            uSection.var_soloCmd.setProcessValue(context, 1)

            var actual_timestamp = new Date().getTime()
            // interpret delay within 350 ms as doubleclick for to perform 'solo defeat'
            if (((actual_timestamp - btn_Solo_release_timestamp) < 350)
            && (ActualTrack == btn_Solo_release_ActualTrack)) {
                uSection.var_solo_defeat.setProcessValue(context, 1)
                uSection.var_solo.setProcessValue(context, 0)
            }

        } else if ((pageShift_is_active) || (EQ_Mode_running) || (PF_Mode_running)) {
            uSection.var_unsolo_all.setProcessValue(context, 1)
        }
    }

    uSection.var_mute.mOnProcessValueChange = function(context, value) {
        if ((value)
        && ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running))) {
            if (swap_SoloMute) {
                onLED(context, cSolo)
            } else {
                onLED(context, cMute)
            }
        } else {
            if (swap_SoloMute) {
                offLED(context, cSolo)
            } else {
                offLED(context, cMute)
            }
        }
    }

    uSection.btn_Mute.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value == 0) {
            uSection.restore_Link_LED_after_Bypass_Solo_Mute(context)
        }

        if ((value == 0) || (Custom_Mode_running))
            return

        if (btn_Bypass_running) {
            btn_Bypass_pressed_to_toggle_monitor_state = true
            toggle_monitor_state(context)
            if (ActualTrack != '') {
                uSection.set_Link_LED_when_Bypass_Solo_Mute(context, 2)
            }
            return
        }

        if ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running)) {
            // toggle mute of selected track
            uSection.var_muteCmd.setProcessValue(context, 1)

        } else if ((pageShift_is_active) || (EQ_Mode_running) || (PF_Mode_running)) {
            uSection.var_unmute_all.setProcessValue(context, 1)
        }
    }

    uSection.var_arm.mOnProcessValueChange = function(context, value) {
        if (value) {
            toggle_Arm_Unarm_next = true
        } else {
            toggle_Arm_Unarm_next = false
        }

        if ((value)
        && ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running))) {
            onLED(context, cArm)
        } else {
            offLED(context, cArm)
        }
    }

    uSection.btn_Arm.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return

        // when skip back to Main Page:
        // Pressing the Arm Button while holding the Shift Button activates the AI Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            if (value) {
                to_AI_Mode_with_Shift = true
                last_active_pageShift = pages.page_Lock
                uSection.var_pageShift_Activate.setProcessValue(context, 1)
            }
            return
        }

        // when skip to Shift Main Page:
        // Pressing the Arm Button while holding the Shift Button activates the AI Mode.
        if ((btn_Shift_running_fixed) && (pageShift_is_active)
        && (active_page != pages.page_Lock)) {
            if (value) {
                to_AI_Mode_with_Shift = true
                mSection.var_ActivateLock.setProcessValue(context, 1)
            }
            return
        }

        if (btn_Bypass_running) {
            if (value) {
                uSection.var_next_grid_type.setProcessValue(context, 1)
                next_grid_type_selected = true
            }
            return
        }

        if ((pageShift_is_active) || (EQ_Mode_running) || (PF_Mode_running)) {
            // toggle arm/unarm all
            if (value) {
                if (toggle_Arm_Unarm_next) {
                    uSection.var_unarm_all.setProcessValue(context, 1)
                } else {
                    uSection.var_arm_all.setProcessValue(context, 1)
                }
                toggle_Arm_Unarm_next = !toggle_Arm_Unarm_next
            }
        } else {
            // toggle arm, normal function
            if (value) {
                uSection.var_armCmd.setProcessValue(context, 1)
            }
        }
    }

    uSection.var_FocusLockedValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            flashingLED(context, cTouch)
        } else {
            offLED(context, cTouch)
        }
    }

    var btn_Shift_release_timestamp = new Date().getTime()

    uSection.btn_Shift.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        btn_Shift_running = (value)
        btn_Shift_running_fixed = (value)

        if (!value) {
            btn_Shift_release_timestamp = new Date().getTime()
        }

        if (value) {
            var actual_timestamp = new Date().getTime()

            // check whether bank B should be activated in Custom Mode
            if (last_btn_Shift_press_activated_Custom_Mode) {
                last_btn_Shift_press_activated_Custom_Mode = false
                // interpret delay within 400 ms as doubleclick for to switch to bank B
                // within the Custom Mode directly after it was activated
                if ((actual_timestamp - btn_Shift_release_timestamp) <= 400) {
                    mSection.var_ActivateCustomB0.setProcessValue(context, 1)
                    return
                }
            }

            // interpret delay within 400 ms as doubleclick for to enter to QC Mode
            if ((actual_timestamp - btn_Shift_release_timestamp) <= 400) {

                // force subpage change if not equal to QC 1 (subpage for Link Button)
                if (last_active_pageQC == pages.page_QC1) {
                    must_set_actual_QC = false
                } else {
                    must_set_actual_QC = true
                }

                must_renew_recall_QCs = true
                uSection.var_pageQC_Activate.setProcessValue(context, 1)

            } else if (btn_Bypass_running) {
                // activate Custom Mode, bank A, for the button combination Bypass + Shift
                btn_Bypass_running = false
                btn_Read_running = false
                btn_Write_running = false
                btn_Prev_running = false
                btn_Next_running = false
                last_btn_Shift_press_activated_Custom_Mode = true
                mSection.var_ActivateCustomA0.setProcessValue(context, 1)

            } else if ((btn_Scroll_running) && (Custom_Mode_running)) {
                btn_Scroll_running = false
                last_btn_Shift_press_changed_Custom_Mode_bank = true

                // change Custom Mode bank
                if (actual_Custom_Mode_bank == 'A') {
                    if (last_pageCustomB == 0) {
                        mSection.var_ActivateCustomB0.setProcessValue(context, 1)
                    } else if (last_pageCustomB == 1) {
                        mSection.var_ActivateCustomB1.setProcessValue(context, 1)
                    } else if (last_pageCustomB == 2) {
                        mSection.var_ActivateCustomB2.setProcessValue(context, 1)
                    }
                } else if (actual_Custom_Mode_bank == 'B') {
                    if (last_pageCustomA == 0) {
                        mSection.var_ActivateCustomA0.setProcessValue(context, 1)
                    } else if (last_pageCustomA == 1) {
                        mSection.var_ActivateCustomA1.setProcessValue(context, 1)
                    } else if (last_pageCustomA == 2) {
                        mSection.var_ActivateCustomA2.setProcessValue(context, 1)
                    }
                }

            } else if (pageMain_is_active) {
                if (last_active_pageMain == pages.page_Pan) {
                    // prevent center of pan when SubPage_Pan is reactivated
                    toShift_or_toCustom_when_Pan_Mode = true
                } else {
                    toShift_or_toCustom_when_Pan_Mode = false
                }
                uSection.var_pageShift_Activate.setProcessValue(context, 1)

            } else {
                uSection.var_pageMain_Activate.setProcessValue(context, 1)
            }
        }
    }

    uSection.var_bypass_cue_sends.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return
        if (value) {
            onLED(context, cBypass)
        } else {
            offLED(context, cBypass)
        }
    }

    uSection.var_automation_write.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return
        setColorLED(context, cWrite, RGB_Colors.c_red)
        if (value) {
            onLED(context, cWrite)
        } else {
            offLED(context, cWrite)
        }
    }

    uSection.var_automation_read.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return
        setColorLED(context, cRead, RGB_Colors.c_green)
        if (value) {
            onLED(context, cRead)
        } else {
            offLED(context, cRead)
        }
    }

    uSection.clear_btn_Bypass_action_variables = function(context) {
        next_grid_type_selected = false
        directly_to_EQ_Mode = false
        knob_was_rotated_while_btn_Bypass_running = false
        knob_was_pressed_while_btn_Bypass_running = false
        btn_Bypass_pressed_to_toggle_listen_state = false
        btn_Bypass_pressed_to_toggle_monitor_state = false
        btn_Bypass_pressed_to_toggle_editChannel = false
        btn_Bypass_pressed_to_toggle_Mixer_Window = false
        btn_Bypass_pressed_to_toggle_Video_Window = false
        btn_Bypass_pressed_within_EQ_Mode = false
        btn_Bypass_pressed_within_Send_Mode = false
        btn_Bypass_pressed_to_call_Bypass_Write_functions = false
        btn_Bypass_pressed_to_toggle_Automation_Panel = false
        btn_Bypass_pressed_to_toggle_Markers_Window = false
        btn_Bypass_pressed_to_set_left_selSide_to_cursor = false
        btn_Bypass_pressed_to_set_right_selSide_to_cursor = false
        btn_Bypass_pressed_to_disable_Navigation_Mode = false
        btn_Bypass_pressed_to_enable_Navigation_Mode = false
        btn_Bypass_pressed_to_start_Loop_Selection = false
        btn_Bypass_pressed_to_set_actual_fsMode = false
        btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode = false
        btn_Bypass_pressed_for_toggle_between_pan_and_pan2 = false
        stop_functionality_locked_changed = false
        enter_Send_Mode = false
        enter_Audio_Mode = false

        offLED(context, cPrev)
        offLED(context, cNext)
    }

    uSection.btn_Bypass.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running) {
            // ensure the possibility of jumping back to the Main Page
            btn_Bypass_running = false
            return
        }

        ignore_next_GPS_trigger_while_btn_Bypass_pressed = false

        // value refers to Bypass Button pressed down or not
        btn_Bypass_running = (value)

        if ((next_grid_type_selected)
        || (directly_to_EQ_Mode)
        || (knob_was_rotated_while_btn_Bypass_running)
        || (knob_was_pressed_while_btn_Bypass_running)
        || (btn_Bypass_pressed_to_toggle_listen_state)
        || (btn_Bypass_pressed_to_toggle_monitor_state)
        || (btn_Bypass_pressed_to_toggle_editChannel)
        || (btn_Bypass_pressed_to_toggle_Mixer_Window)
        || (btn_Bypass_pressed_to_toggle_Video_Window)
        || (btn_Bypass_pressed_within_EQ_Mode)
        || (btn_Bypass_pressed_within_Send_Mode)
        || (btn_Bypass_pressed_to_call_Bypass_Write_functions)
        || (btn_Bypass_pressed_to_toggle_Automation_Panel)
        || (btn_Bypass_pressed_to_toggle_Markers_Window)
        || (btn_Bypass_pressed_to_set_left_selSide_to_cursor)
        || (btn_Bypass_pressed_to_set_right_selSide_to_cursor)
        || (btn_Bypass_pressed_to_disable_Navigation_Mode)
        || (btn_Bypass_pressed_to_enable_Navigation_Mode)
        || (btn_Bypass_pressed_to_start_Loop_Selection)
        || (btn_Bypass_pressed_to_set_actual_fsMode)
        || (btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode)
        || (btn_Bypass_pressed_for_toggle_between_pan_and_pan2)) {

            if (knob_was_rotated_while_btn_Bypass_running) {
                mSection.param_to_knob_FP_Value(context)
            }

            uSection.clear_btn_Bypass_action_variables(context)
            return
        }

        if ((btn_Write_running_since_Bypass_Write_pressed)
        && (!btn_Bypass_pressed_to_call_Bypass_Write_functions)) {
            if (value) {
                if (perform_hide_all_automation_when_Bypass_is_pressed_next) {
                    uSection.var_hide_all_automation.setProcessValue(context, 1)
                } else {
                    uSection.var_hide_automation.setProcessValue(context, 1)
                    perform_hide_all_automation_when_Bypass_is_pressed_next = true
                }
                perform_show_all_automation_when_Touch_is_pressed_next = false
            }
            return
        }

        if ((btn_Read_running_since_toggling_Automation_Panel)
        && (!btn_Bypass_pressed_to_toggle_Automation_Panel)) {
            if (value) {
                uSection.var_suspend_all_automation.setProcessValue(context, 1)
            }
            return
        }

        if ((value) && (btn_Stop_running)) {
            // toggle stop_functionality_locked
            if (stop_functionality_locked) {
                stop_functionality_locked = false
            } else {
                stop_functionality_locked = true
            }

            if (stop_functionality_locked) {
                flashingLED(context, cStop)
            } else {
                onLED(context, cStop)
            }

            stop_functionality_locked_changed = true
            return
        }

        if (stop_functionality_locked_changed) {
            uSection.clear_btn_Bypass_action_variables(context)
            return
        }

        if (value) {
            // when the Bypass Button is pressed
            if ((pageMain_is_active) && (btn_Touch_running_while_clear)) {
                btn_Touch_running_while_clear = false
                btn_Touch_running_doubleclick = false
                wait_until_Touch_Button_is_released = false
                uSection.VUMeter_Initialize(context)

                // activate Send Mode
                if ((last_selected_Send >= 1) && (last_selected_Send <= 4)) {
                    disable_set_Send_LevelA_to_Min_or_0dB = true
                } else {
                    disable_set_Send_LevelB_to_Min_or_0dB = true
                }
                must_set_actual_Send_Level_Bank = true

                if ((selected_Send >= 5) && (must_set_actual_Send_Level_Bank)) {
                    avoid_set_Send_Level_LED_for_Send_LevelA = true
                }

                reset_old_knob_Send_Values()
                enter_Send_Mode = true

                // Since activating the following page can trigger the callback function
                // knob_FP_Value.mOnProcessValueChange, GPS must not be triggered once
                // the next time the callback function is executed.
                ignore_next_GPS_trigger_while_btn_Bypass_pressed = true

                assigning_fader_before_HostBinding_within_Send_Mode()
                uSection.var_pageSend_Activate.setProcessValue(context, 1)
            }

        } else {
            // when the Bypass Button is released
            // no execution if the Send Mode was started with the Bypass Button
            if ((btn_Touch_running_fixed == false) && (enter_Send_Mode == false)
            && ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
            || (QC_Mode_running)
            || ((Audio_Mode_running) && (enter_Audio_Mode == false)))) {
                // toggle bypass cue sends of selected track
                if (uSection.var_bypass_cue_sends.getProcessValue(context)) {
                    uSection.var_bypass_cue_sends.setProcessValue(context, 0)
                } else {
                    uSection.var_bypass_cue_sends.setProcessValue(context, 1)
                }
            } else if ((btn_Touch_running_fixed == false) && (enter_Send_Mode == false)
            && ((pageShift_is_active) || (EQ_Mode_running) || (PF_Mode_running))) {
                // toggle toggle enable all / disable all selected audio tracks
                uSection.var_enable_disable_audio_tracks.setProcessValue(context, 1)
            }
            uSection.clear_btn_Bypass_action_variables(context)
        }
    }

    // variables to handle VU-Meter LED
    // The data of the VU-Meter is buffered to minimize midi data flow.
    // Technique and behavior for this see below in the code.
    var VUMeter_Buffer_Size = 10
    var VUMeter_Buffer_Index = 0
    var VUMeter_clipped = false
    var disable_VUMeters_temporarily = false
    var wait_until_Touch_Button_is_released = false
    var peak_value = 0.0
    var peak_max_value = 0.0

    // helper variables to minimize the number of commands to the hardware
    var VUMeter_color = RGB_Colors.c_off
    var VUMeter_OnLED = false

    var threshold_grey =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[0]
    var threshold_blue =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[1]
    var threshold_cyan =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[2]
    var threshold_green =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[3]
    var threshold_yellow =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[4]
    var threshold_orange =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[5]
    var threshold_red =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[6]
    var threshold_magenta =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[7]
    var threshold_clip =
              VUMeter_grey_blue_cyan_green_yellow_orange_red_magenta_clip[8]

    uSection.VUMeter_Initialize = function(context) {
        if (disable_VUMeter_generally)
            return
        VUMeter_clipped = false
        VUMeter_color = RGB_Colors.c_off
        VUMeter_OnLED = false

        // if disable_VUMeters_temporarily is true, the Touch LED is controlled
        // by the callback function btn_Touch.mSurfaceValue.mOnProcessValueChange
        if ((disable_VUMeters_temporarily == false)
        && (Send_Mode_running == false) && (CueSend_Mode_running == false)
        && (QC_Mode_running == false) && (Audio_Mode_running == false)) {
           offLED(context, cTouch)
           setColorLED(context, cTouch, RGB_Colors.c_off)
        }

        VUMeter_Buffer_Index = 0
        peak_value = 0.0
        peak_max_value = 0.0
        if (debug_VUMeter)
            console.log('006) uSection.VUMeter_Initialize done')
    }

    uSection.show_VUMeter_peak_max_value = function(context) {
        if ((pageShift_is_active) || (Custom_Mode_running) || (VUMeter_clipped)
        || (disable_VUMeter_generally) || (disable_VUMeters_temporarily)
        || (Send_Mode_running) || (CueSend_Mode_running) || (Audio_Mode_running)) {
            return
        }

        if (peak_max_value < threshold_grey) {
            setColorLED(context, cTouch, RGB_Colors.c_off)
            offLED(context, cTouch)
            VUMeter_OnLED = false
        } else {
            if (peak_max_value < threshold_blue) {
                setColorLED(context, cTouch, RGB_Colors.c_darkgrey)
            } else if (peak_max_value < threshold_cyan) {
                setColorLED(context, cTouch, RGB_Colors.c_blue)
            } else if (peak_max_value < threshold_green) {
                setColorLED(context, cTouch, RGB_Colors.c_cyan_medium)
            } else if (peak_max_value < threshold_yellow) {
                setColorLED(context, cTouch, RGB_Colors.c_green_medium)
            } else if (peak_max_value < threshold_orange) {
                setColorLED(context, cTouch, RGB_Colors.c_yellow_medium)
            } else if (peak_max_value < threshold_red) {
                setColorLED(context, cTouch, RGB_Colors.c_orange)
            } else if (peak_max_value < threshold_magenta) {
                setColorLED(context, cTouch, RGB_Colors.c_red)
            } else {
                setColorLED(context, cTouch, RGB_Colors.c_magenta)
            }
            onLED(context, cTouch)
            VUMeter_OnLED = true
        }

        VUMeter_color = RGB_Colors.c_none  // force color setting
        VUMeter_Buffer_Index = 0
        peak_value = 0.0
        peak_max_value = 0.0
        if (debug_VUMeter)
            console.log('007) show_VUMeter_peak_max_value done')
    }

    // switching between tracks must reset the VU-Meter, here for MAIN mapping
    // ignore reset, when track before switching was clipped
    pageMain.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSelected.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        if ((pageShift_is_active) || (Custom_Mode_running) || (VUMeter_clipped)
        || (disable_VUMeter_generally)) {
            return
        }

        uSection.VUMeter_Initialize(activeDevice)
        if (debug_VUMeter)
            console.log('008) MAIN mapping - selected track changed')
    }

    // switching between tracks must reset the VU-Meter, here for EQ mapping
    // ignore reset, when track before switching was clipped
    pageEQ.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSelected.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        if ((pageShift_is_active) || (Custom_Mode_running) || (VUMeter_clipped)
        || (disable_VUMeter_generally)) {
            return
        }

        uSection.VUMeter_Initialize(activeDevice)
        if (debug_VUMeter)
            console.log('009) EQ mapping - selected track changed')
    }

    // switching between tracks must reset the VU-Meter, here for PF mapping
    // ignore reset, when track before switching was clipped
    pagePF.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSelected.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        if ((pageShift_is_active) || (Custom_Mode_running) || (VUMeter_clipped)
        || (disable_VUMeter_generally)) {
            return
        }

        uSection.VUMeter_Initialize(activeDevice)
        if (debug_VUMeter)
            console.log('010) PF mapping - selected track changed')
    }

    // handle data of the VU-Meter that is generated from Cubase
    uSection.var_VUMeter.mOnProcessValueChange = function(context, value) {
        if ((pageShift_is_active) || (Custom_Mode_running) || (VUMeter_clipped)
        || (wait_until_Touch_Button_is_released)
        || (disable_VUMeter_generally) || (disable_VUMeters_temporarily)) {
            return
        }

        // in case of stop, immediately stop the handling
        // and do not process the slow shutdown of the Cubase VU-Meter
        if (actual_tpState == tpStates.tpState_stopped) {
            if (VUMeter_peak_was_shown_after_stop == false) {
                uSection.show_VUMeter_peak_max_value(context)
                VUMeter_peak_was_shown_after_stop = true
                if (debug_VUMeter)
                    console.log('011) var_VUMeter: VUMeter peak max shown')
            }
            return
        }
        VUMeter_peak_was_shown_after_stop = false

        if (allow_VUMeter_Clipping) {
            // when clipping, turn LED of VU-Meter to flashing magenta and exit
            if (value >= threshold_clip) {
                VUMeter_clipped = true
                VUMeter_color = RGB_Colors.c_magenta
                setColorLED(context, cTouch, VUMeter_color)
                flashingLED(context, cTouch)
                if (debug_VUMeter)
                    console.log('012) VU-Meter clipped')
                return
            }
        }

        // buffering the new value
        // = read a number of values and react only to the maximum of these values
        if (VUMeter_Buffer_Index == VUMeter_Buffer_Size) {
            VUMeter_Buffer_Index = 0
            peak_value = 0
        }
        VUMeter_Buffer_Index++
        if (value > peak_value) {
            peak_value = value
        }

        // after the read cycle of the buffering is completed according to the
        // buffer size set LED-color of VU-Meter to the detected buffered peak value
        if (VUMeter_Buffer_Index == VUMeter_Buffer_Size) {
            if (peak_value < threshold_grey) {
                if (VUMeter_OnLED)         {
                    VUMeter_OnLED = false
                    offLED(context, cTouch)
                    VUMeter_color = RGB_Colors.c_off
                    setColorLED(context, cTouch, VUMeter_color)
                }
            } else {
                if (peak_value < threshold_blue) {
                    if (VUMeter_color != RGB_Colors.c_darkgrey) {
                        VUMeter_color = RGB_Colors.c_darkgrey
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                } else if (peak_value < threshold_cyan) {
                    if (VUMeter_color != RGB_Colors.c_blue) {
                        VUMeter_color = RGB_Colors.c_blue
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                } else if (peak_value < threshold_green) {
                    if (VUMeter_color != RGB_Colors.c_cyan_medium) {
                        VUMeter_color = RGB_Colors.c_cyan_medium
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                } else if (peak_value < threshold_yellow) {
                    if (VUMeter_color != RGB_Colors.c_green_medium) {
                        VUMeter_color = RGB_Colors.c_green_medium
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                } else if (peak_value < threshold_orange) {
                    if (VUMeter_color != RGB_Colors.c_yellow_medium) {
                        VUMeter_color = RGB_Colors.c_yellow_medium
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                } else if (peak_value < threshold_red) {
                    if (VUMeter_color != RGB_Colors.c_orange) {
                        VUMeter_color = RGB_Colors.c_orange
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                } else if (peak_value < threshold_magenta) {
                    if (VUMeter_color != RGB_Colors.c_red) {
                        VUMeter_color = RGB_Colors.c_red
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                } else {
                    if (VUMeter_color != RGB_Colors.c_magenta) {
                        VUMeter_color = RGB_Colors.c_magenta
                        setColorLED(context, cTouch, VUMeter_color)
                    }
                }
                if (VUMeter_OnLED == false) {
                    VUMeter_OnLED = true
                    onLED(context, cTouch)
                }
            }
            // update maximum peak value
            if (peak_value > peak_max_value) {
                peak_max_value = peak_value
            }
        }
    }

    var btn_Touch_release_timestamp = new Date().getTime()

    uSection.btn_Touch.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return

        btn_Touch_running_fixed = (value)
        btn_Touch_running_doubleclick = false

        if (select_Volume_of_QuickTrack_1_4_done) {
            select_Volume_of_QuickTrack_1_4_done = false
            offLED(context, cPrev)
            offLED(context, cNext)
        }

        if ((btn_Write_running_since_Bypass_Write_pressed)
        && (!btn_Bypass_pressed_to_call_Bypass_Write_functions)) {
            if (value) {
                if (perform_show_all_automation_when_Touch_is_pressed_next) {
                    uSection.var_show_all_automation.setProcessValue(context, 1)
                } else {
                    uSection.var_show_automation.setProcessValue(context, 1)
                    perform_show_all_automation_when_Touch_is_pressed_next = true
                }
                perform_hide_all_automation_when_Bypass_is_pressed_next = false
            }
            return
        }

        if ((btn_Read_running_since_toggling_Automation_Panel)
        && (!btn_Bypass_pressed_to_toggle_Automation_Panel)) {
            if (value) {
                uSection.var_next_automation_mode.setProcessValue(context, 1)
            }
            return
        }

        var actual_timestamp = new Date().getTime()
        // If the delay between releasing the Touch Button and pressing the Touch Button
        // is less than 250 ms, set btn_Touch_running_doubleclick to true.
        if ((value) && ((actual_timestamp - btn_Touch_release_timestamp) < 250)) {
            btn_Touch_running_doubleclick = true
        }

        if (!value) {
            btn_Touch_release_timestamp = new Date().getTime()
        }

        // handling of release of button when Shift Page is active
        if ((pageShift_is_active) && (value == 0)) {
            if (actual_motorfader_mode == motorfader_modes.mf_mode_QCx) {
                pageQC.makeValueBinding(fader.var_faderIn.mSurfaceValue,
                    pageQC.mHostAccess.mFocusedQuickControls.getByIndex(fader_QC - 1))
            } else {
                pageQC.makeValueBinding(fader.var_faderIn.mSurfaceValue,
                    pageQC.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)
            }

            // when value == 0 and fader_QC_selectable == true,
            // restore 4 LEDs (Link, Pan, Channel, Scroll) for Shift Page
            if (fader_QC_selectable) {
                fader_QC_selectable = false
                mSection.set_edit_Instrument_LED(context)

                setColorLED(context, cPan, RGB_Colors.c_magenta)
                if (active_page == pages.page_Hitpoint) {
                    onLED(context, cPan)
                } else {
                    offLED(context, cPan)
                }

                setColorLED(context, cChannel, RGB_Colors.c_pink)
                if (active_page == pages.page_Lock) {
                    if (mSection.var_ValueLocked.getProcessValue(context)) {
                    // as long as the value is locked, the Channel LED is flashing
                        flashingLED(context, cChannel)
                    } else {
                        onLED(context, cChannel)
                    }
                } else {
                    offLED(context, cChannel)
                }

                setColorLED(context, cScroll, RGB_Colors.c_white_medium)
                if (active_page == pages.page_Zoom) {
                    onLED(context, cScroll)
                } else {
                    offLED(context, cScroll)
                }
            }
            return
        }

        if ((btn_Bypass_running) && (value)) {
            if ((pageMain_is_active) || (pageShift_is_active)
            || (EQ_Mode_running) || (PF_Mode_running) || (CueSend_Mode_running)
            || (QC_Mode_running) || (Audio_Mode_running)) {
                uSection.VUMeter_Initialize(context)
                btn_Touch_running_while_clear = false
                btn_Touch_running_doubleclick = false
                wait_until_Touch_Button_is_released = false

                // activate Send Mode
                if ((last_selected_Send >= 1) && (last_selected_Send <= 4)) {
                    disable_set_Send_LevelA_to_Min_or_0dB = true
                } else {
                    disable_set_Send_LevelB_to_Min_or_0dB = true
                }
                must_set_actual_Send_Level_Bank = true

                if ((selected_Send >= 5) && (must_set_actual_Send_Level_Bank)) {
                    avoid_set_Send_Level_LED_for_Send_LevelA = true
                }

                reset_old_knob_Send_Values()
                enter_Send_Mode = true

                // Since activating the following page can trigger the callback function
                // knob_FP_Value.mOnProcessValueChange, GPS must not be triggered once
                // the next time the callback function is executed.
                ignore_next_GPS_trigger_while_btn_Bypass_pressed = true

                assigning_fader_before_HostBinding_within_Send_Mode()
                uSection.var_pageSend_Activate.setProcessValue(context, 1)
            }
            return
        }

        if (Send_Mode_running) {
            if (value) {
                setColorLED(context, cTouch, RGB_Colors.c_white_medium)
                onLED(context, cTouch)

                uSection.VUMeter_Initialize(context)
                uSection.var_Clear_VUMeters.setProcessValue(context, 1)
                uSection.var_Clear_AudioPerformancePeaks.setProcessValue(context, 1)

                if (btn_Stop_running) {
                    // set all 8 Sends to -oo dB
                    mSection.knob_Send_Level1_Value.setProcessValue(context, 0)
                    mSection.knob_Send_Level2_Value.setProcessValue(context, 0)
                    mSection.knob_Send_Level3_Value.setProcessValue(context, 0)
                    mSection.knob_Send_Level4_Value.setProcessValue(context, 0)
                    mSection.knob_Send_Level5_Value.setProcessValue(context, 0)
                    mSection.knob_Send_Level6_Value.setProcessValue(context, 0)
                    mSection.knob_Send_Level7_Value.setProcessValue(context, 0)
                    mSection.knob_Send_Level8_Value.setProcessValue(context, 0)
                    all_8_Send_Levels_were_set_to_oo = true
                }
            } else {
                if (sync_motorfader_within_Send_Mode_to_Send_Value) {
                    setColorLED(context, cTouch, RGB_Colors.c_blue)
                } else {
                    setColorLED(context, cTouch, RGB_Colors.c_yellow_medium)
                }
                flashingLED(context, cTouch)
            }
            return
        }

        if (CueSend_Mode_running) {
            if (value) {
                setColorLED(context, cTouch, RGB_Colors.c_white_medium)
                onLED(context, cTouch)

                uSection.VUMeter_Initialize(context)
                uSection.var_Clear_VUMeters.setProcessValue(context, 1)
                uSection.var_Clear_AudioPerformancePeaks.setProcessValue(context, 1)

                if (btn_Stop_running) {
                    // set all 4 Cue Sends to -oo dB
                    mSection.knob_CueSend_Level1_Value.setProcessValue(context, 0)
                    mSection.knob_CueSend_Level2_Value.setProcessValue(context, 0)
                    mSection.knob_CueSend_Level3_Value.setProcessValue(context, 0)
                    mSection.knob_CueSend_Level4_Value.setProcessValue(context, 0)
                    all_4_CueSend_Levels_were_set_to_oo = true
                }
            } else {
                setColorLED(context, cTouch, RGB_Colors.c_orange)
                flashingLED(context, cTouch)
            }
            return
        }

        if (QC_Mode_running) {
            if (!value) {
                if (fader_was_set_with_Touch_within_QC_Mode) {
                    fader_was_set_with_Touch_within_QC_Mode = false
                } else if (lock_FP_within_QC_Mode) {
                    lock_FP_within_QC_Mode = false
                } else {
                    if (uSection.var_FocusLockedValue.getProcessValue(context)) {
                        uSection.var_FocusLockedValue.setProcessValue(context, 0)
                    } else {
                        uSection.var_FocusLockedValue.setProcessValue(context, 1)
                    }
                }
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                setColorLED(context, cTouch, RGB_Colors.c_white_medium)
                onLED(context, cTouch)

                uSection.VUMeter_Initialize(context)
                uSection.var_Clear_VUMeters.setProcessValue(context, 1)
                uSection.var_Clear_AudioPerformancePeaks.setProcessValue(context, 1)
            } else {
                setColorLED(context, cTouch, RGB_Colors.c_green)
                flashingLED(context, cTouch)
            }
            return
        }

        if (pageShift_is_active) {
            if (value) {
                switch (actual_motorfader_mode) {
                    case motorfader_modes.mf_mode_on:
                        actual_motorfader_mode = motorfader_modes.mf_mode_off
                        shutdown_fader_on_close = false
                        break
                    case motorfader_modes.mf_mode_off:
                        actual_motorfader_mode = motorfader_modes.mf_mode_direct
                        shutdown_fader_on_close = true
                        break
                    case motorfader_modes.mf_mode_direct:
                        actual_motorfader_mode = motorfader_modes.mf_mode_QCx
                        shutdown_fader_on_close = true
                        break
                    case motorfader_modes.mf_mode_QCx:
                        // Do not change motorfader mode if Quick Control has been
                        // defined for the fader by button (Link, Pan, Channel, Scroll),
                        // so that the Quick Control can be changed again quickly.
                        if (fader_QC_was_set) {
                            fader_QC_was_set = false
                        } else {
                            actual_motorfader_mode = motorfader_modes.mf_mode_on
                            shutdown_fader_on_close = true
                        }
                        break
                }
                fader.show_actual_motorfader_mode(context)

                if (actual_motorfader_mode == motorfader_modes.mf_mode_QCx) {
                    fader_QC_selectable = true

                    setColorLED(context, cLink, RGB_Colors.c_orange_light)
                    setColorLED(context, cPan, RGB_Colors.c_green_light)
                    setColorLED(context, cChannel, RGB_Colors.c_blue_light)
                    setColorLED(context, cScroll, RGB_Colors.c_blue_light)

                    setColorLED(context, mLED_code(fader_QC), RGB_Colors.c_grey)

                    onLED(context, cLink)
                    onLED(context, cPan)
                    onLED(context, cChannel)
                    onLED(context, cScroll)
                }

                if (actual_motorfader_mode == motorfader_modes.mf_mode_direct) {
                    // Redirection of data stream between Cubase and the FaderPort
                    // to unprocessed cc 115 so that the data is not sent
                    // via MIDI Remote, but as simple midi direct data to Cubase.
                    fader.var_faderIn.mSurfaceValue.mMidiBinding
                        .setInputPort(midiIn).bindToControlChange(0, 115)
                    fader.var_faderOut.mMidiBinding
                        .setOutputPort(midiOut).bindToControlChange(0, 115)
                } else {
                    // normal midiBinding of the fader
                    fader.FP_read.mMidiBinding
                        .setInputPort(midiIn).bindToPitchBend(0)
                    fader.FP_write.mMidiBinding
                        .setOutputPort(midiOut).bindToPitchBend(0)
                }
            }

        } else if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)) {
            // perform three clear commands by pressing the Touch Button
            // when Main Page is active or when EQ Mode is running
            if (value) {
                uSection.VUMeter_Initialize(context)
                uSection.var_Clear_VUMeters.setProcessValue(context, 1)
                uSection.var_Clear_AudioPerformancePeaks.setProcessValue(context, 1)
                if (debug_VUMeter)
                    console.log('013) clear done')
            }

            if (btn_Stop_running) {
                disable_VUMeters_temporarily = true

                // set LED color of Touch Button to orange, when it is pressed down
                // together with the Stop Button for to disable the VU-Meter LED
                if (value) {
                    if (debug_VUMeter)
                        console.log('014) VU-Meter LED temporarily off '
                            + '- Stop Button pressed before Touch Button')
                    wait_until_Touch_Button_is_released = true
                    setColorLED(context, cTouch, RGB_Colors.c_orange)
                    onLED(context, cTouch)
                } else {
                    // when the Touch Button is released
                    offLED(context, cTouch)
                    setColorLED(context, cTouch, RGB_Colors.c_off)
                    wait_until_Touch_Button_is_released = false
                }
            } else {
                // ignore handling for one time
                // when Stop Button was pressed afer Touch Button
                if (disable_VUMeter_with_Stop_after_Touch) {
                    disable_VUMeter_with_Stop_after_Touch = false
                    disable_VUMeters_temporarily = true
                } else {
                    disable_VUMeters_temporarily = false
                }

                // set LED color of Touch Button to white, when it is pressed down
                // to show that the clear commands were executed
                if (value) {
                    wait_until_Touch_Button_is_released = true
                    setColorLED(context, cTouch, RGB_Colors.c_white_medium)
                    onLED(context, cTouch)
                    btn_Touch_running_while_clear = true
                } else {
                    btn_Touch_running_while_clear = false
                    btn_Touch_running_doubleclick = false
                    // when the Touch Button is released
                    offLED(context, cTouch)
                    setColorLED(context, cTouch, RGB_Colors.c_off)
                    wait_until_Touch_Button_is_released = false
                }
            }
        }
    }

    uSection.specialmemory_ValueUnderMouse_Write = function(context, memory_no) {
        // allow write special memory for value under mouse 1x at once
        if (special_memory_was_written) {
            return
        }
        // write value under mouse to special memory
        specialmemory_ValueUnderMouse[memory_no]
            = mSection.knob_ValueUnderMouse_Value.getProcessValue(context)
        specialmemory_ValueUnderMouse_has_data[memory_no] = true
        special_memory_was_written = true
    }

    uSection.specialmemory_ValueUnderMouse_Read = function(context, memory_no) {
        // allow read special memory for value under mouse 1x at once
        if (special_memory_was_read) {
            return
        }
        // read value under mouse from special memory if data is available
        if (specialmemory_ValueUnderMouse_has_data[memory_no]) {
            mSection.knob_ValueUnderMouse_Value
                .setProcessValue(context, specialmemory_ValueUnderMouse[memory_no])
        }
        special_memory_was_read = true
    }

    uSection.specialmemory_EQ_Write = function(context, memory_no) {
        // allow write special memory for EQ 1x at once
        if (special_memory_was_written) {
            return
        }
        // write all EQ parameters to special memory

        specialmemory_EQ_Band1_State[memory_no]
            = mSection.var_EQ_Band1_State.getProcessValue(context)
        specialmemory_EQ_Band2_State[memory_no]
            = mSection.var_EQ_Band2_State.getProcessValue(context)
        specialmemory_EQ_Band3_State[memory_no]
            = mSection.var_EQ_Band3_State.getProcessValue(context)
        specialmemory_EQ_Band4_State[memory_no]
            = mSection.var_EQ_Band4_State.getProcessValue(context)

        specialmemory_EQ_Band1_Gain[memory_no]
            = mSection.knob_EQ_Band1_Gain_Value.getProcessValue(context)
        specialmemory_EQ_Band2_Gain[memory_no]
            = mSection.knob_EQ_Band2_Gain_Value.getProcessValue(context)
        specialmemory_EQ_Band3_Gain[memory_no]
            = mSection.knob_EQ_Band3_Gain_Value.getProcessValue(context)
        specialmemory_EQ_Band4_Gain[memory_no]
            = mSection.knob_EQ_Band4_Gain_Value.getProcessValue(context)

        specialmemory_EQ_Band1_Freq[memory_no]
            = mSection.knob_EQ_Band1_Freq_Value.getProcessValue(context)
        specialmemory_EQ_Band2_Freq[memory_no]
            = mSection.knob_EQ_Band2_Freq_Value.getProcessValue(context)
        specialmemory_EQ_Band3_Freq[memory_no]
            = mSection.knob_EQ_Band3_Freq_Value.getProcessValue(context)
        specialmemory_EQ_Band4_Freq[memory_no]
            = mSection.knob_EQ_Band4_Freq_Value.getProcessValue(context)

        specialmemory_EQ_Band1_Q[memory_no]
            = mSection.knob_EQ_Band1_Q_Value.getProcessValue(context)
        specialmemory_EQ_Band2_Q[memory_no]
            = mSection.knob_EQ_Band2_Q_Value.getProcessValue(context)
        specialmemory_EQ_Band3_Q[memory_no]
            = mSection.knob_EQ_Band3_Q_Value.getProcessValue(context)
        specialmemory_EQ_Band4_Q[memory_no]
            = mSection.knob_EQ_Band4_Q_Value.getProcessValue(context)

        specialmemory_EQ_Band1_FilterType[memory_no]
            = mSection.var_EQ_Band1_FilterType.getProcessValue(context)
        specialmemory_EQ_Band2_FilterType[memory_no]
            = mSection.var_EQ_Band2_FilterType.getProcessValue(context)
        specialmemory_EQ_Band3_FilterType[memory_no]
            = mSection.var_EQ_Band3_FilterType.getProcessValue(context)
        specialmemory_EQ_Band4_FilterType[memory_no]
            = mSection.var_EQ_Band4_FilterType.getProcessValue(context)

        specialmemory_EQ_has_data[memory_no] = true
        special_memory_was_written = true
    }

    uSection.specialmemory_EQ_Read = function(context, memory_no) {
        // allow read special memory for EQ 1x at once
        if (special_memory_was_read) {
            return
        }
        // read all EQ parameters from special memory if data available
        if (specialmemory_EQ_has_data[memory_no]) {

            mSection.var_EQ_Band1_State
                .setProcessValue(context, specialmemory_EQ_Band1_State[memory_no])
            mSection.var_EQ_Band2_State
                .setProcessValue(context, specialmemory_EQ_Band2_State[memory_no])
            mSection.var_EQ_Band3_State
                .setProcessValue(context, specialmemory_EQ_Band3_State[memory_no])
            mSection.var_EQ_Band4_State
                .setProcessValue(context, specialmemory_EQ_Band4_State[memory_no])

            mSection.knob_EQ_Band1_Gain_Value
                .setProcessValue(context, specialmemory_EQ_Band1_Gain[memory_no])
            mSection.knob_EQ_Band2_Gain_Value
                .setProcessValue(context, specialmemory_EQ_Band2_Gain[memory_no])
            mSection.knob_EQ_Band3_Gain_Value
                .setProcessValue(context, specialmemory_EQ_Band3_Gain[memory_no])
            mSection.knob_EQ_Band4_Gain_Value
                .setProcessValue(context, specialmemory_EQ_Band4_Gain[memory_no])

            mSection.knob_EQ_Band1_Freq_Value
                .setProcessValue(context, specialmemory_EQ_Band1_Freq[memory_no])
            mSection.knob_EQ_Band2_Freq_Value
                .setProcessValue(context, specialmemory_EQ_Band2_Freq[memory_no])
            mSection.knob_EQ_Band3_Freq_Value
                .setProcessValue(context, specialmemory_EQ_Band3_Freq[memory_no])
            mSection.knob_EQ_Band4_Freq_Value
                .setProcessValue(context, specialmemory_EQ_Band4_Freq[memory_no])

            mSection.knob_EQ_Band1_Q_Value
                .setProcessValue(context, specialmemory_EQ_Band1_Q[memory_no])
            mSection.knob_EQ_Band2_Q_Value
                .setProcessValue(context, specialmemory_EQ_Band2_Q[memory_no])
            mSection.knob_EQ_Band3_Q_Value
                .setProcessValue(context, specialmemory_EQ_Band3_Q[memory_no])
            mSection.knob_EQ_Band4_Q_Value
                .setProcessValue(context, specialmemory_EQ_Band4_Q[memory_no])

            mSection.var_EQ_Band1_FilterType
                .setProcessValue(context, specialmemory_EQ_Band1_FilterType[memory_no])
            mSection.var_EQ_Band2_FilterType
                .setProcessValue(context, specialmemory_EQ_Band2_FilterType[memory_no])
            mSection.var_EQ_Band3_FilterType
                .setProcessValue(context, specialmemory_EQ_Band3_FilterType[memory_no])
            mSection.var_EQ_Band4_FilterType
                .setProcessValue(context, specialmemory_EQ_Band4_FilterType[memory_no])
        }
        special_memory_was_read = true
    }

    uSection.btn_Write.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        btn_Write_running = false
        btn_Write_running_since_Bypass_Write_pressed = false
        perform_hide_all_automation_when_Bypass_is_pressed_next = false
        perform_show_all_automation_when_Touch_is_pressed_next = false

        if (Custom_Mode_running)
            return

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_call_Bypass_Write_functions = true
                btn_Write_running_since_Bypass_Write_pressed = true
            }
            return
        }

        if ((btn_Read_running_since_toggling_Automation_Panel)
        && (!btn_Bypass_pressed_to_toggle_Automation_Panel)) {
            if (value) {
                uSection.var_automation_trim.setProcessValue(context, 1)
            }
            return
        }

        if ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running)) {
            if (value) {
                setColorLED(context, cWrite, RGB_Colors.c_red)

                // toggle automation write of selected track
                if (uSection.var_automation_write.getProcessValue(context)) {
                     uSection.var_automation_write.setProcessValue(context, 0)
                } else {
                    uSection.var_automation_write.setProcessValue(context, 1)
                }
            }
            return
        }

        // Write Button LED & Read Button LED permanently switched on when
        // AI Mode or EQ Mode, so only switch when this is not the case
        // Note: value refers to Write automation of the selected track
        if ((active_page != pages.page_Lock) && (EQ_Mode_running == false)) {
            setColorLED(context, cWrite, RGB_Colors.c_red)  // moved here for on & off
            if (value) {
                onLED(context, cWrite)
            } else {
                offLED(context, cWrite)
            }
        } else {
            // value refers to Write Button pressed down or not
            btn_Write_running = (value)
        }

        // perform standard function for the Write Button when Main Page is not active
        // and active Mode is not AI Mode and not EQ Mode
        // and the Write Button is pressed down
        if ((value) && ((pageShift_is_active) || (PF_Mode_running))
        && (active_page != pages.page_Lock) && (EQ_Mode_running == false)) {
            uSection.var_automation_write_all.setProcessValue(context, 1)
            return
        }

        special_memory_was_written = false

        // clear special memory when Write Button and Read Button are pressed together
        if ((btn_Write_running) && (btn_Read_running)) {
            if (active_page == pages.page_Lock) {
                for (i = 0; i <= 4; i++) {
                    specialmemory_ValueUnderMouse_has_data[i] = false
                 }
            } else if (EQ_Mode_running) {
                for (i = 0; i <= 4; i++) {
                    specialmemory_EQ_has_data[i] = false
                 }
            }
            for (i = 1; i <= 4; i++) {
                onLED(context, mLED_code(i))
                setColorLED(context, mLED_code(i), RGB_Colors.c_violet)
            }
            setColorLED(context, cWrite, RGB_Colors.c_violet)
            setColorLED(context, cRead, RGB_Colors.c_violet)

            perform_clear_special_memory_Write = true
            perform_clear_special_memory_Read = true
            return
        }

        if ((perform_clear_special_memory_Write)
        || (perform_clear_special_memory_Read)) {
            if (perform_clear_special_memory_Write) {
                perform_clear_special_memory_Write = false
            }
            mSection.perform_specialmemory1234_restore_LEDs(context)
            return
        }

        // special color for Write Button LED
        // when AI Mode or EQ Mode and the Write Button is pressed down
        if ((value) && ((active_page == pages.page_Lock) || (EQ_Mode_running))) {
            if (((active_page == pages.page_Lock)
            && (specialmemory_ValueUnderMouse_has_data[0]))
            || ((EQ_Mode_running)
            && (specialmemory_EQ_has_data[0]))) {
                setColorLED(context, cWrite, RGB_Colors.c_magenta)
            } else {
                setColorLED(context, cWrite, RGB_Colors.c_orangered)
            }
        }

        // special colors for Link, Pan, Channel and Scroll Button LEDs + turn all on
        // when Write Button is pressed down according to
        // special memmory [1..4], color c_orangered for write means written
        if (value) {
            if (active_page == pages.page_Lock) {  // for AI Mode
                for (i = 1; i <= 4; i++) {
                    if (specialmemory_ValueUnderMouse_has_data[i]) {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_orangered)
                    } else {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_violet)
                    }
                }
            } else if (EQ_Mode_running) {  // for EQ Mode
                for (i = 1; i <= 4; i++) {
                    if (specialmemory_EQ_has_data[i]) {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_orangered)
                    } else {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_violet)
                    }
                }
            }
            if ((active_page == pages.page_Lock) || (EQ_Mode_running)) {
                prevent_turnOffLinkLED_when_OnTitleChange = true
                onLED(context, cLink)
                onLED(context, cPan)
                onLED(context, cChannel)
                onLED(context, cScroll)
                // allow execution for special memory 1..4 only 1x at once
                Link_Pan_Channel_Scroll_perform_down = true
            }
        }

        // perform Write Button functions if Write Button is released
        if ((value == 0) && (pageShift_is_active) && (EQ_Mode_running == false)) {
            if (active_page == pages.page_Lock) {
                // write value under mouse to special memory [0] if it was not done
                // done with Link / Pan / Channel / Scroll for special memory [1..4]
                if (specialmemory_ValueUnderMouse_Write_done) {
                    specialmemory_ValueUnderMouse_Write_done = false
                    // eventually restore the colors for no data for special memory [0]
                    if (specialmemory_ValueUnderMouse_has_data[0] == false) {
                        setColorLED(context, cWrite, RGB_Colors.c_violet)
                        setColorLED(context, cRead, RGB_Colors.c_violet)
                    } else {
                        setColorLED(context, cWrite, RGB_Colors.c_orangered)
                    }
                } else if (Link_Pan_Channel_Scroll_running == false) {
                    // write value under mouse to special memory [0]
                    uSection.specialmemory_ValueUnderMouse_Write(context, 0)
                    setColorLED(context, cWrite, RGB_Colors.c_orangered)
                    setColorLED(context, cRead, RGB_Colors.c_green_light)
                    mSection.perform_specialmemory1234_restore_LEDs(context)
                } else {
                    // Link / Pan / Channel / Scroll Button was not yet released
                    after_Write_running_wait = true
                }
            }
            // allow execution for special memory 1..4 only 1x at once
            Link_Pan_Channel_Scroll_perform_down = false

        } else if ((value == 0) && (EQ_Mode_running)) {
            // write EQ parameters to special memory [0] if it was not done
            // done with Link / Pan / Channel / Scroll for special memory [1..4]
            if (specialmemory_EQ_Write_done) {
                specialmemory_EQ_Write_done = false
                // eventually restore the colors for no data for special memory [0]
                if (specialmemory_EQ_has_data[0] == false) {
                    setColorLED(context, cWrite, RGB_Colors.c_violet)
                    setColorLED(context, cRead, RGB_Colors.c_violet)
                } else {
                    setColorLED(context, cWrite, RGB_Colors.c_orangered)
                }
            } else if (Link_Pan_Channel_Scroll_running == false) {
                // write EQ parameters to special memory [0]
                uSection.specialmemory_EQ_Write(context, 0)
                setColorLED(context, cWrite, RGB_Colors.c_orangered)
                setColorLED(context, cRead, RGB_Colors.c_green_light)
                mSection.perform_specialmemory1234_restore_LEDs(context)
            } else {
                // Link / Pan / Channel / Scroll Button was not yet released
                after_Write_running_wait = true
            }
            // allow execution for special memory 1..4 only 1x at once
            Link_Pan_Channel_Scroll_perform_down = false
        }
    }

    uSection.btn_Read.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        btn_Read_running = false
        btn_Read_running_since_toggling_Automation_Panel = false

        if (Custom_Mode_running)
            return

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_toggle_Automation_Panel = true
                btn_Read_running_since_toggling_Automation_Panel = true
                mSection.var_Automation_Panel.setProcessValue(context, 1)
            }
            return
        }

        if ((pageMain_is_active) || (Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running)) {
            if (value) {
                setColorLED(context, cRead, RGB_Colors.c_green)

                // toggle automation read of selected track
                if (uSection.var_automation_read.getProcessValue(context)) {
                     uSection.var_automation_read.setProcessValue(context, 0)
                } else {
                    uSection.var_automation_read.setProcessValue(context, 1)
                }
            }
            return
        }

        // Write Button LED & Read Button LED permanently switched on when
        // AI Mode or EQ Mode, so only switch when this is not the case
        // Note: value refers to Read automation of the selected track
        if ((active_page != pages.page_Lock) && (EQ_Mode_running == false)) {
            setColorLED(context, cRead, RGB_Colors.c_green)  // moved here for on & off
            if (value) {
                onLED(context, cRead)
            } else {
                offLED(context, cRead)
            }
        } else {
            // value refers to Read Button pressed down or not
            btn_Read_running = (value)
        }

        // perform standard function for the Read Button when Main Page is not active
        // and active Mode is not AI Mode and not EQ Mode
        // and the Read Button is pressed down
        if ((value) && ((pageShift_is_active) || (PF_Mode_running))
        && (active_page != pages.page_Lock) && (EQ_Mode_running == false)) {
            uSection.var_automation_read_all.setProcessValue(context, 1)
            return
        }

        special_memory_was_read = false

        // clear special memory when Write Button and Read Button are pressed together
        if ((btn_Write_running) && (btn_Read_running)) {
            if (active_page == pages.page_Lock) {
                for (i = 0; i <= 4; i++) {
                    specialmemory_ValueUnderMouse_has_data[i] = false
                 }
            } else if (EQ_Mode_running) {
                for (i = 0; i <= 4; i++) {
                    specialmemory_EQ_has_data[i] = false
                 }
            }
            for (i = 1; i <= 4; i++) {
                onLED(context, mLED_code(i))
                setColorLED(context, mLED_code(i), RGB_Colors.c_violet)
            }

            setColorLED(context, cWrite, RGB_Colors.c_violet)
            setColorLED(context, cRead, RGB_Colors.c_violet)

            perform_clear_special_memory_Write = true
            perform_clear_special_memory_Read = true
            return
        }

        if ((perform_clear_special_memory_Write)
        || (perform_clear_special_memory_Read)) {
            if (perform_clear_special_memory_Read) {
                perform_clear_special_memory_Read = false
            }
            mSection.perform_specialmemory1234_restore_LEDs(context)
            return
        }

        // special colors for Link, Pan, Channel and Scroll Button LEDs + turn all on
        // when Read Button is pressed down according to
        // special memmory [1..4], color c_green_light for read means readable
        if (value) {
            if (active_page == pages.page_Lock) {  // for AI Mode
                for (i = 1; i <= 4; i++) {
                    if (specialmemory_ValueUnderMouse_has_data[i]) {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_green_light)
                    } else {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_violet)
                    }
                }
            } else if (EQ_Mode_running) {  // for EQ Mode
                for (i = 1; i <= 4; i++) {
                    if (specialmemory_EQ_has_data[i]) {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_green_light)
                    } else {
                        setColorLED(context, mLED_code(i), RGB_Colors.c_violet)
                    }
                }
            }

            if ((active_page == pages.page_Lock) || (EQ_Mode_running)) {
                prevent_turnOffLinkLED_when_OnTitleChange = true
                onLED(context, cLink)
                onLED(context, cPan)
                onLED(context, cChannel)
                onLED(context, cScroll)
                // allow execution for special memory 1..4 only 1x at once
                Link_Pan_Channel_Scroll_perform_down = true
            }
        }

        // perform Read Button functions if Read Button is released
        if ((value == 0) && (pageShift_is_active) && (EQ_Mode_running == false)) {
            if (active_page == pages.page_Lock) {
                // read value under mouse from special memory [0] if it was not done
                // done with Link / Pan / Channel / Scroll for special memory [1..4]
                if (specialmemory_ValueUnderMouse_Read_done) {
                    specialmemory_ValueUnderMouse_Read_done = false
                } else if (Link_Pan_Channel_Scroll_running == false) {
                    // read value under mouse from special memory [0] if data available
                    uSection.specialmemory_ValueUnderMouse_Read(context, 0)
                    mSection.perform_specialmemory1234_restore_LEDs(context)
                } else {
                    // Link / Pan / Channel / Scroll Button was not yet released
                    after_Read_running_wait = true
                }
            }
            // allow execution for special memory 1..4 only 1x at once
            Link_Pan_Channel_Scroll_perform_down = false

        } else if ((value == 0) && (EQ_Mode_running)) {
            // read EQ parameters from special memory [0] if it was not done
            // done with Link / Pan / Channel / Scroll for special memory [1..4]
            if (specialmemory_EQ_Read_done) {
                specialmemory_EQ_Read_done = false
            } else if (Link_Pan_Channel_Scroll_running == false) {
                // read EQ parameters from special memory [0] if data available
                uSection.specialmemory_EQ_Read(context, 0)
                mSection.perform_specialmemory1234_restore_LEDs(context)
            } else {
                // Link / Pan / Channel / Scroll Button was not yet released
                after_Read_running_wait = true
            }
            // allow execution for special memory 1..4 only 1x at once
            Link_Pan_Channel_Scroll_perform_down = false
        }
    }
    return uSection
}

function midiBinding_uSection() {
    if (swap_SoloMute) {
        uSection.btn_Solo.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cMute)
        uSection.btn_Mute.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cSolo)
    } else {
        uSection.btn_Solo.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cSolo)
        uSection.btn_Mute.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cMute)
    }
    uSection.btn_Arm.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cArm)
    uSection.btn_Shift.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cShift)
    uSection.btn_Bypass.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cBypass)
    uSection.btn_Touch.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cTouch)
    uSection.btn_Write.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cWrite)
    uSection.btn_Read.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cRead)
}

function hostBinding_uSection() {
    var mixChannelMain = pageMain.mHostAccess.mTrackSelection.mMixerChannel
    var mixChannelShift = pageShift.mHostAccess.mTrackSelection.mMixerChannel
    var mixChannelEQ = pageEQ.mHostAccess.mTrackSelection.mMixerChannel
    var mixChannelPF = pagePF.mHostAccess.mTrackSelection.mMixerChannel
    var mixChannelSend = pageSend.mHostAccess.mTrackSelection.mMixerChannel
    var mixChannelCueSend = pageCueSend.mHostAccess.mTrackSelection.mMixerChannel
    var mixChannelQC = pageQC.mHostAccess.mTrackSelection.mMixerChannel
    var mixChannelAudio = pageAudio.mHostAccess.mTrackSelection.mMixerChannel

    // Main Page must be accessible from anywhere
    pageShift.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageCustomA0.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageCustomA1.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageCustomA2.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageCustomB0.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageCustomB1.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageCustomB2.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageEQ.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pagePF.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageSend.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageCueSend.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageQC.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)
    pageAudio.makeActionBinding(uSection.var_pageMain_Activate, pageMain.mAction.mActivate)

    // Shift Page must be accessible from Main Page
    pageMain.makeActionBinding(uSection.var_pageShift_Activate, pageShift.mAction.mActivate)

    // EQ Mode Page must be accessible from Main, Shift, PF, QC, Send, CueSend and Audio Page
    pageMain.makeActionBinding(uSection.var_pageEQ_Activate, pageEQ.mAction.mActivate)
    pageShift.makeActionBinding(uSection.var_pageEQ_Activate, pageEQ.mAction.mActivate)
    pagePF.makeActionBinding(uSection.var_pageEQ_Activate, pageEQ.mAction.mActivate)
    pageSend.makeActionBinding(uSection.var_pageEQ_Activate, pageEQ.mAction.mActivate)
    pageCueSend.makeActionBinding(uSection.var_pageEQ_Activate, pageEQ.mAction.mActivate)
    pageQC.makeActionBinding(uSection.var_pageEQ_Activate, pageEQ.mAction.mActivate)
    pageAudio.makeActionBinding(uSection.var_pageEQ_Activate, pageEQ.mAction.mActivate)

    // PF Mode Page must be accessible from EQ Page
    pageEQ.makeActionBinding(uSection.var_pagePF_Activate, pagePF.mAction.mActivate)

    // Send Mode Page must be accessible from Main, Shift, EQ, PF, QC, CueSend and Audio Page
    pageMain.makeActionBinding(uSection.var_pageSend_Activate, pageSend.mAction.mActivate)
    pageShift.makeActionBinding(uSection.var_pageSend_Activate, pageSend.mAction.mActivate)
    pageEQ.makeActionBinding(uSection.var_pageSend_Activate, pageSend.mAction.mActivate)
    pagePF.makeActionBinding(uSection.var_pageSend_Activate, pageSend.mAction.mActivate)
    pageCueSend.makeActionBinding(uSection.var_pageSend_Activate, pageSend.mAction.mActivate)
    pageQC.makeActionBinding(uSection.var_pageSend_Activate, pageSend.mAction.mActivate)
    pageAudio.makeActionBinding(uSection.var_pageSend_Activate, pageSend.mAction.mActivate)

    // Cue Send Mode Page must be accessible from Send Page
    pageSend.makeActionBinding(uSection.var_pageCueSend_Activate, pageCueSend.mAction.mActivate)

    // QC Mode Page must be accessible from anywhere
    pageMain.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageShift.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageCustomA0.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageCustomA1.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageCustomA2.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageCustomB0.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageCustomB1.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageCustomB2.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageEQ.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pagePF.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageSend.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageCueSend.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageQC.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)
    pageAudio.makeActionBinding(uSection.var_pageQC_Activate, pageQC.mAction.mActivate)

    // Audio Mode Page must be accessible from anywhere
    pageMain.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageShift.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageCustomA0.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageCustomA1.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageCustomA2.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageCustomB0.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageCustomB1.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageCustomB2.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageEQ.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pagePF.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageSend.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageCueSend.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)
    pageQC.makeActionBinding(uSection.var_pageAudio_Activate, pageAudio.mAction.mActivate)

    // use custom variables for to handle toggle solo of selected track
    pageMain.makeValueBinding(uSection.var_solo, mixChannelMain.mValue.mSolo)
    pageMain.makeCommandBinding(uSection.var_soloCmd, 'Edit', 'Solo')
    pageSend.makeValueBinding(uSection.var_solo, mixChannelSend.mValue.mSolo)
    pageSend.makeCommandBinding(uSection.var_soloCmd, 'Edit', 'Solo')
    pageCueSend.makeValueBinding(uSection.var_solo, mixChannelCueSend.mValue.mSolo)
    pageCueSend.makeCommandBinding(uSection.var_soloCmd, 'Edit', 'Solo')
    pageQC.makeValueBinding(uSection.var_solo, mixChannelQC.mValue.mSolo)
    pageQC.makeCommandBinding(uSection.var_soloCmd, 'Edit', 'Solo')
    pageAudio.makeValueBinding(uSection.var_solo, mixChannelAudio.mValue.mSolo)
    pageAudio.makeCommandBinding(uSection.var_soloCmd, 'Edit', 'Solo')

    // use custom variable for to handle toggle solo defeat of selected track
    pageMain.makeCommandBinding(uSection.var_solo_defeat, 'Edit', 'Solo Defeat')
    pageSend.makeCommandBinding(uSection.var_solo_defeat, 'Edit', 'Solo Defeat')
    pageCueSend.makeCommandBinding(uSection.var_solo_defeat, 'Edit', 'Solo Defeat')
    pageQC.makeCommandBinding(uSection.var_solo_defeat, 'Edit', 'Solo Defeat')
    pageAudio.makeCommandBinding(uSection.var_solo_defeat, 'Edit', 'Solo Defeat')

    // use custom variable for to handle unsolo all tracks
    pageShift.makeCommandBinding(uSection.var_unsolo_all, 'Edit', 'Deactivate All Solo')
    pageEQ.makeCommandBinding(uSection.var_unsolo_all, 'Edit', 'Deactivate All Solo')
    pagePF.makeCommandBinding(uSection.var_unsolo_all, 'Edit', 'Deactivate All Solo')

    // use custom variables for to handle toggle mute of selected track
    // for GTS (Global Track Scroll) functionality also available on Shift, EQ and PF Page
    pageMain.makeValueBinding(uSection.var_mute, mixChannelMain.mValue.mMute)
    pageMain.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')
    pageShift.makeValueBinding(uSection.var_mute, mixChannelShift.mValue.mMute)
    pageShift.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')
    pageEQ.makeValueBinding(uSection.var_mute, mixChannelEQ.mValue.mMute)
    pageEQ.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')
    pagePF.makeValueBinding(uSection.var_mute, mixChannelPF.mValue.mMute)
    pagePF.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')
    pageSend.makeValueBinding(uSection.var_mute, mixChannelSend.mValue.mMute)
    pageSend.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')
    pageCueSend.makeValueBinding(uSection.var_mute, mixChannelCueSend.mValue.mMute)
    pageCueSend.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')
    pageQC.makeValueBinding(uSection.var_mute, mixChannelQC.mValue.mMute)
    pageQC.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')
    pageAudio.makeValueBinding(uSection.var_mute, mixChannelAudio.mValue.mMute)
    pageAudio.makeCommandBinding(uSection.var_muteCmd, 'Edit', 'Mute')

    // use custom variable for to handle unmute all tracks
    pageShift.makeCommandBinding(uSection.var_unmute_all, 'Edit', 'Unmute All')
    pageEQ.makeCommandBinding(uSection.var_unmute_all, 'Edit', 'Unmute All')
    pagePF.makeCommandBinding(uSection.var_unmute_all, 'Edit', 'Unmute All')

    // use custom variables for to handle toggle arm of selected track
    pageMain.makeValueBinding(uSection.var_arm, mixChannelMain.mValue.mRecordEnable)
    pageMain.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')
    pageShift.makeValueBinding(uSection.var_arm, mixChannelShift.mValue.mRecordEnable)
    pageShift.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')
    pageEQ.makeValueBinding(uSection.var_arm, mixChannelEQ.mValue.mRecordEnable)
    pageEQ.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')
    pagePF.makeValueBinding(uSection.var_arm, mixChannelPF.mValue.mRecordEnable)
    pagePF.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')
    pageSend.makeValueBinding(uSection.var_arm, mixChannelSend.mValue.mRecordEnable)
    pageSend.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')
    pageCueSend.makeValueBinding(uSection.var_arm, mixChannelCueSend.mValue.mRecordEnable)
    pageCueSend.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')
    pageQC.makeValueBinding(uSection.var_arm, mixChannelQC.mValue.mRecordEnable)
    pageQC.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')
    pageAudio.makeValueBinding(uSection.var_arm, mixChannelAudio.mValue.mRecordEnable)
    pageAudio.makeCommandBinding(uSection.var_armCmd, 'Edit', 'Record Enable')

    // use custom variables for to handle arm all audio tracks
    pageShift.makeCommandBinding(uSection.var_arm_all, 'Mixer', 'Arm All Audio Tracks')
    pageEQ.makeCommandBinding(uSection.var_arm_all, 'Mixer', 'Arm All Audio Tracks')
    pagePF.makeCommandBinding(uSection.var_arm_all, 'Mixer', 'Arm All Audio Tracks')

    // use custom variables for to handle unarm all audio tracks
    pageShift.makeCommandBinding(uSection.var_unarm_all, 'Mixer', 'Disarm All Audio Tracks')
    pageEQ.makeCommandBinding(uSection.var_unarm_all, 'Mixer', 'Disarm All Audio Tracks')
    pagePF.makeCommandBinding(uSection.var_unarm_all, 'Mixer', 'Disarm All Audio Tracks')

    // use custom variable for to handle volume of selected track
    pageMain.makeValueBinding(uSection.var_Volume, mixChannelMain.mValue.mVolume)
    pageEQ.makeValueBinding(uSection.var_Volume, mixChannelEQ.mValue.mVolume)
    pagePF.makeValueBinding(uSection.var_Volume, mixChannelPF.mValue.mVolume)
    pageSend.makeValueBinding(uSection.var_Volume, mixChannelSend.mValue.mVolume)
    pageCueSend.makeValueBinding(uSection.var_Volume, mixChannelCueSend.mValue.mVolume)
    pageQC.makeValueBinding(uSection.var_Volume, mixChannelQC.mValue.mVolume)
    pageAudio.makeValueBinding(uSection.var_Volume, mixChannelAudio.mValue.mVolume)

    // use custom variable for to handle next grid type function everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_next_grid_type,
        'Edit', 'Select Next Grid Type')

    // use custom variable for to handle toggle bypass cue sends of selected track
    pageMain.makeValueBinding(uSection.var_bypass_cue_sends, mixChannelMain.mCueSends.mBypass)
    pageSend.makeValueBinding(uSection.var_bypass_cue_sends, mixChannelSend.mCueSends.mBypass)
    pageCueSend.makeValueBinding(uSection.var_bypass_cue_sends, mixChannelCueSend.mCueSends.mBypass)
    pageQC.makeValueBinding(uSection.var_bypass_cue_sends, mixChannelQC.mCueSends.mBypass)
    pageAudio.makeValueBinding(uSection.var_bypass_cue_sends, mixChannelAudio.mCueSends.mBypass)

    // use custom variable for to handle VU-Meter
    pageMain.makeValueBinding(uSection.var_VUMeter, mixChannelMain.mValue.mVUMeter)
    pageEQ.makeValueBinding(uSection.var_VUMeter, mixChannelEQ.mValue.mVUMeter)
    pagePF.makeValueBinding(uSection.var_VUMeter, mixChannelPF.mValue.mVUMeter)

    // use custom variables for to handle 'Clear VU-Meters of Mixer' commands
    pageMain.makeCommandBinding(uSection.var_Clear_VUMeters, 'Mixer', 'Meters: Reset')
    pageEQ.makeCommandBinding(uSection.var_Clear_VUMeters, 'Mixer', 'Meters: Reset')
    pagePF.makeCommandBinding(uSection.var_Clear_VUMeters, 'Mixer', 'Meters: Reset')
    pageSend.makeCommandBinding(uSection.var_Clear_VUMeters, 'Mixer', 'Meters: Reset')
    pageCueSend.makeCommandBinding(uSection.var_Clear_VUMeters, 'Mixer', 'Meters: Reset')
    pageAudio.makeCommandBinding(uSection.var_Clear_VUMeters, 'Mixer', 'Meters: Reset')

    // use custom variables for to handle 'Clear Audio Performance Peaks' commands
    pageMain.makeCommandBinding(uSection.var_Clear_AudioPerformancePeaks,
        'Audio Performance', 'Reset Processing Overload Indicator')
    pageEQ.makeCommandBinding(uSection.var_Clear_AudioPerformancePeaks,
        'Audio Performance', 'Reset Processing Overload Indicator')
    pagePF.makeCommandBinding(uSection.var_Clear_AudioPerformancePeaks,
        'Audio Performance', 'Reset Processing Overload Indicator')
    pageSend.makeCommandBinding(uSection.var_Clear_AudioPerformancePeaks,
        'Audio Performance', 'Reset Processing Overload Indicator')
    pageCueSend.makeCommandBinding(uSection.var_Clear_AudioPerformancePeaks,
        'Audio Performance', 'Reset Processing Overload Indicator')
    pageAudio.makeCommandBinding(uSection.var_Clear_AudioPerformancePeaks,
        'Audio Performance', 'Reset Processing Overload Indicator')

    // use custom variable for to handle if Focus Quick Controls are locked
    pageQC.makeValueBinding(uSection.var_FocusLockedValue,
        pageQC.mHostAccess.mFocusedQuickControls.mFocusLockedValue)

    // use custom variable for to handle
    // toggle enable all / disable all selected audio tracks
    pageShift.makeCommandBinding(uSection.var_enable_disable_audio_tracks,
        'Audio', 'Disable/Enable Track')
    pageEQ.makeCommandBinding(uSection.var_enable_disable_audio_tracks,
        'Audio', 'Disable/Enable Track')
    pagePF.makeCommandBinding(uSection.var_enable_disable_audio_tracks,
        'Audio', 'Disable/Enable Track')

    // use custom variable for to handle toggle automation write of selected track
    pageMain.makeValueBinding(uSection.var_automation_write,
        mixChannelMain.mValue.mAutomationWrite)
    pageSend.makeValueBinding(uSection.var_automation_write,
        mixChannelSend.mValue.mAutomationWrite)
    pageCueSend.makeValueBinding(uSection.var_automation_write,
        mixChannelCueSend.mValue.mAutomationWrite)
    pageQC.makeValueBinding(uSection.var_automation_write,
        mixChannelQC.mValue.mAutomationWrite)
    pageAudio.makeValueBinding(uSection.var_automation_write,
        mixChannelAudio.mValue.mAutomationWrite)

    // use custom variable for to handle toggle automation read of selected track
    pageMain.makeValueBinding(uSection.var_automation_read,
        mixChannelMain.mValue.mAutomationRead)
    pageSend.makeValueBinding(uSection.var_automation_read,
        mixChannelSend.mValue.mAutomationRead)
    pageCueSend.makeValueBinding(uSection.var_automation_read,
        mixChannelCueSend.mValue.mAutomationRead)
    pageQC.makeValueBinding(uSection.var_automation_read,
        mixChannelQC.mValue.mAutomationRead)
    pageAudio.makeValueBinding(uSection.var_automation_read,
        mixChannelAudio.mValue.mAutomationRead)

    // use custom variable for to handle toggle automation write of all selected tracks
    pageShift.makeCommandBinding(uSection.var_automation_write_all,
        'Automation', 'Toggle Write Enable Selected Tracks')
    pageEQ.makeCommandBinding(uSection.var_automation_write_all,
        'Automation', 'Toggle Write Enable Selected Tracks')
    pagePF.makeCommandBinding(uSection.var_automation_write_all,
        'Automation', 'Toggle Write Enable Selected Tracks')

    // use custom variable for to handle toggle automation read of all selected tracks
    pageShift.makeCommandBinding(uSection.var_automation_read_all,
        'Automation', 'Toggle Read Enable Selected Tracks')
    pageEQ.makeCommandBinding(uSection.var_automation_read_all,
        'Automation', 'Toggle Read Enable Selected Tracks')
    pagePF.makeCommandBinding(uSection.var_automation_read_all,
        'Automation', 'Toggle Read Enable Selected Tracks')

    // use custom variable for to hide automation everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_hide_automation,
        'Automation', 'Hide Automation')

    // use custom variable for to hide all automation everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_hide_all_automation,
        'Automation', 'Hide All Automation')

    // use custom variable for to show used automation everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_show_automation,
        'Automation', 'Show Used Automation (Selected Tracks)')

    // use custom variable for to show all used automation everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_show_all_automation,
        'Automation', 'Show All Used Automation')

    // use custom variable for to suspend all automation everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_suspend_all_automation,
        'Automation', 'Suspend Reading/Writing All')

    // use custom variable for to toggle automation mode everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_next_automation_mode,
        'Automation', 'Next Automation Mode')

    // use custom variable for to handle toggle automation trim (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(uSection.var_automation_trim,
        'Automation', 'Automation Mode - Trim')
}


// MIDDLE SECTION

function assign_virtual_knob(virtual_knob) {
    // disconnect virtual knobs
    pageMain.makeValueBinding(mSection.knob_Pan_Value, NOP_Main)
    pageMain.makeValueBinding(mSection.knob_CRLevel_Value, NOP_Main)
    pageShift.makeValueBinding(mSection.knob_ValueUnderMouse_Value, NOP_Shift)
    pageMain.makeValueBinding(mSection.knob_ClickLevel_Value, NOP_Main)

    // disconnect for EQ Mode not necessary
    // disconnect for PF Mode not necessary
    // disconnect for Send Mode not necessary
    // disconnect for Cue Send Mode not necessary
    // disconnect for QC Mode not necessary

    // assign special virtual knob
    if (virtual_knob == virtual_knobs.knob_Pan) {
        pageMain.makeValueBinding(mSection.knob_Pan_Value,
            pageMain.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan)
            .setSubPage(SubPage_Pan)
        if (debug_assign_virtual_knob)
            console.log('015) assign_virtual_knob: Pan')

    } else if (virtual_knob == virtual_knobs.knob_CRLevel) {
        pageMain.makeValueBinding(mSection.knob_CRLevel_Value,
            pageMain.mHostAccess.mControlRoom.mMainChannel.mLevelValue)
            .setSubPage(SubPage_Master)
        if (debug_assign_virtual_knob)
            console.log('016) assign_virtual_knob: CRLevel_Value')

    } else if (virtual_knob == virtual_knobs.knob_ClickLevel) {
        pageMain.makeValueBinding(mSection.knob_ClickLevel_Value,
            pageMain.mHostAccess.mTransport.mValue.mMetronomeClickLevel)
            .setSubPage(SubPage_Click)
        if (debug_assign_virtual_knob)
            console.log('017) assign_virtual_knob: ClickLevel')

    } else if (virtual_knob == virtual_knobs.knob_ValueUnderMouse) {
        pageShift.makeValueBinding(mSection.knob_ValueUnderMouse_Value,
            pageShift.mHostAccess.mMouseCursor.mValueUnderMouse)
            .setSubPage(SubPage_Lock)
        if (debug_assign_virtual_knob)
            console.log('018) assign_virtual_knob: ValueUnderMouse')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band1_Gain) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('019) assign_virtual_knob: EQ_Band1_Gain')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band2_Gain) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('020) assign_virtual_knob: EQ_Band2_Gain')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band3_Gain) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('021) assign_virtual_knob: EQ_Band3_Gain')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band4_Gain) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('022) assign_virtual_knob: EQ_Band4_Gain')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band1_Freq) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('023) assign_virtual_knob: EQ_Band1_Freq')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band2_Freq) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('024) assign_virtual_knob: EQ_Band2_Freq')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band3_Freq) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('025) assign_virtual_knob: EQ_Band3_Freq')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band4_Freq) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('026) assign_virtual_knob: EQ_Band4_Freq')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band1_Q) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('027) assign_virtual_knob: EQ_Band1_Q')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band2_Q) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('028) assign_virtual_knob: EQ_Band2_Q')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band3_Q) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('029) assign_virtual_knob: EQ_Band3_Q')

    } else if (virtual_knob == virtual_knobs.knob_EQ_Band4_Q) {
        // binding for EQ Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('030) assign_virtual_knob: EQ_Band4_Q')

    } else if (virtual_knob == virtual_knobs.knob_PF_PreGain) {
        // binding for PF Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('031) assign_virtual_knob: PF_PreGain')

    } else if (virtual_knob == virtual_knobs.knob_LCut_Freq) {
        // binding for PF Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('032) assign_virtual_knob: LCut_Freq')

    } else if (virtual_knob == virtual_knobs.knob_HCut_Freq) {
        // binding for PF Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('033) assign_virtual_knob: HCut_Freq')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level1) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('034) assign_virtual_knob: Send_Level1')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level2) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('035) assign_virtual_knob: Send_Level2')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level3) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('036) assign_virtual_knob: Send_Level3')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level4) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('037) assign_virtual_knob: Send_Level4')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level5) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('038) assign_virtual_knob: Send_Level5')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level6) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('039) assign_virtual_knob: Send_Level6')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level7) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('040) assign_virtual_knob: Send_Level7')

    } else if (virtual_knob == virtual_knobs.knob_Send_Level8) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('041) assign_virtual_knob: Send_Level8')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Level1) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('042) assign_virtual_knob: CueSend_Level1')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Level2) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('043) assign_virtual_knob: CueSend_Level2')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Level3) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('044) assign_virtual_knob: CueSend_Level3')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Level4) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('045) assign_virtual_knob: CueSend_Level4')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Pan1) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('046) assign_virtual_knob: CueSend_Pan1')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Pan2) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('047) assign_virtual_knob: CueSend_Pan2')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Pan3) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('048) assign_virtual_knob: CueSend_Pan3')

    } else if (virtual_knob == virtual_knobs.knob_CueSend_Pan4) {
        // binding for Send Mode is already correct for all parameters
        if (debug_assign_virtual_knob)
            console.log('049) assign_virtual_knob: CueSend_Pan4')

    } else if (virtual_knob == virtual_knobs.knob_QC1) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('050) assign_virtual_knob: QC1')

    } else if (virtual_knob == virtual_knobs.knob_QC2) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('051) assign_virtual_knob: QC2')

    } else if (virtual_knob == virtual_knobs.knob_QC3) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('052) assign_virtual_knob: QC3')

    } else if (virtual_knob == virtual_knobs.knob_QC4) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('053) assign_virtual_knob: QC4')

    } else if (virtual_knob == virtual_knobs.knob_QC5) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('054) assign_virtual_knob: QC5')

    } else if (virtual_knob == virtual_knobs.knob_QC6) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('055) assign_virtual_knob: QC6')

    } else if (virtual_knob == virtual_knobs.knob_QC7) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('056) assign_virtual_knob: QC7')

    } else if (virtual_knob == virtual_knobs.knob_QC8) {
        // binding for Quick Controls is already correct for all 8 subpages
        if (debug_assign_virtual_knob)
            console.log('057) assign_virtual_knob: QC8')

    } else {
        if (debug_assign_virtual_knob)
            console.log('058) assign_virtual_knob: no Knob assigned')
    }
}

// global variables for to remember state if Prev or Next Buttons are pressed down
// or Knob is pressed down,
// needed for the functions vertical zoom out off / in on waveform
var btn_Prev_running = false
var btn_Next_running = false

// global variables, necessary to realize the functionality for simultaneous pressing
// of the Prev Button and the Next Button
var wait_until_Prev_Button_is_released = false
var wait_until_Next_Button_is_released = false

// global variable for to remember the state if the Knob is pressed down
var knob_Press_running = false

// global variable for to remember the state if the Link Button is pressed down
var btn_Link_running = false

// global variable for to remember the state if the Pan Button is pressed down
var btn_Pan_running = false

// global variable for to remember the state if the Channel Button is pressed down
var btn_Channel_running = false

// global variable for to remember the state if the Scroll Button is pressed down
var btn_Scroll_running = false

// global variable for to remember the state if the Master Button is pressed down
var btn_Master_running = false

// global variable for to remember the state if the Click Button is pressed down
var btn_Click_running = false

// global variable for to remember the state if the Section Button is pressed down
var btn_Section_running = false

// global variable for to remember the state if the Marker Button is pressed down
var btn_Marker_running = false

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

    // variables for to remember if a vertical zoom out off / in on waveform was done
    var VerticalZoomOutOfWaveform_done = false
    var VerticalZoomInOnWaveform_done = false

    mSection.knob_FP_Value
        = surface.makeCustomValueVariable('knob_FP_Value')
    mSection.knob_Pan_Value
        = surface.makeCustomValueVariable('knob_Pan_Value')
    mSection.knob_CRLevel_Value
        = surface.makeCustomValueVariable('knob_CRLevel_Value')
    mSection.knob_ClickLevel_Value
        = surface.makeCustomValueVariable('knob_ClickLevel_Value')
    mSection.knob_ValueUnderMouse_Value
        = surface.makeCustomValueVariable('knob_ValueUnderMouse_Value')
    mSection.knob_Channel_Left
        = surface.makeCustomValueVariable('knob_Channel_Left')
    mSection.knob_Channel_Right
        = surface.makeCustomValueVariable('knob_Channel_Right')
    mSection.knob_Section_Left                                                     // now Event Mode
        = surface.makeCustomValueVariable('knob_Section_Left')
    mSection.knob_Section_Right
        = surface.makeCustomValueVariable('knob_Section_Right')
    mSection.knob_Marker_Left
        = surface.makeCustomValueVariable('knob_Marker_Left')
    mSection.knob_Marker_Right
        = surface.makeCustomValueVariable('knob_Marker_Right')
    mSection.knob_Hitpoint_Left
        = surface.makeCustomValueVariable('knob_Hitpoint_Left')
    mSection.knob_Hitpoint_Right
        = surface.makeCustomValueVariable('knob_Hitpoint_Right')
    mSection.knob_Zoom_Left
        = surface.makeCustomValueVariable('knob_Zoom_Left')
    mSection.knob_Zoom_Right
        = surface.makeCustomValueVariable('knob_Zoom_Right')
    mSection.knob_Quantize_Left
        = surface.makeCustomValueVariable('knob_Quantize_Left')
    mSection.knob_Quantize_Right
        = surface.makeCustomValueVariable('knob_Quantize_Right')
    mSection.knob_Nudge_Left                                                       // moved
        = surface.makeCustomValueVariable('knob_Nudge_Left')
    mSection.knob_Nudge_Right
        = surface.makeCustomValueVariable('knob_Nudge_Right')

    // use custom variables for functions within Audio Mode
    mSection.knob_Volume_Left
        = surface.makeCustomValueVariable('knob_Volume_Left')
    mSection.knob_Volume_Right
        = surface.makeCustomValueVariable('knob_Volume_Right')
    mSection.knob_FadeIn_Left
        = surface.makeCustomValueVariable('knob_FadeIn_Left')
    mSection.knob_FadeIn_Right
        = surface.makeCustomValueVariable('knob_FadeIn_Right')
    mSection.knob_FadeOut_Left
        = surface.makeCustomValueVariable('knob_FadeOut_Left')
    mSection.knob_FadeOut_Right
        = surface.makeCustomValueVariable('knob_FadeOut_Right')

    mSection.knob_EQ_Band1_Gain_Value
        = surface.makeCustomValueVariable('knob_EQ_Band1_Gain_Value')
    mSection.knob_EQ_Band2_Gain_Value
        = surface.makeCustomValueVariable('knob_EQ_Band2_Gain_Value')
    mSection.knob_EQ_Band3_Gain_Value
        = surface.makeCustomValueVariable('knob_EQ_Band3_Gain_Value')
    mSection.knob_EQ_Band4_Gain_Value
        = surface.makeCustomValueVariable('knob_EQ_Band4_Gain_Value')

    mSection.knob_EQ_Band1_Freq_Value
        = surface.makeCustomValueVariable('knob_EQ_Band1_Freq_Value')
    mSection.knob_EQ_Band2_Freq_Value
        = surface.makeCustomValueVariable('knob_EQ_Band2_Freq_Value')
    mSection.knob_EQ_Band3_Freq_Value
        = surface.makeCustomValueVariable('knob_EQ_Band3_Freq_Value')
    mSection.knob_EQ_Band4_Freq_Value
        = surface.makeCustomValueVariable('knob_EQ_Band4_Freq_Value')

    mSection.knob_EQ_Band1_Q_Value
        = surface.makeCustomValueVariable('knob_EQ_Band1_Q_Value')
    mSection.knob_EQ_Band2_Q_Value
        = surface.makeCustomValueVariable('knob_EQ_Band2_Q_Value')
    mSection.knob_EQ_Band3_Q_Value
        = surface.makeCustomValueVariable('knob_EQ_Band3_Q_Value')
    mSection.knob_EQ_Band4_Q_Value
        = surface.makeCustomValueVariable('knob_EQ_Band4_Q_Value')

    mSection.knob_PF_PreGain_Value
        = surface.makeCustomValueVariable('knob_PF_PreGain_Value')
    mSection.knob_PF_LCut_Freq_Value
        = surface.makeCustomValueVariable('knob_PF_LCut_Freq_Value')
    mSection.knob_PF_HCut_Freq_Value
        = surface.makeCustomValueVariable('knob_PF_HCut_Freq_Value')

    mSection.knob_Send_Level1_Value
        = surface.makeCustomValueVariable('knob_Send_Level1_Value')
    mSection.knob_Send_Level2_Value
        = surface.makeCustomValueVariable('knob_Send_Level2_Value')
    mSection.knob_Send_Level3_Value
        = surface.makeCustomValueVariable('knob_Send_Level3_Value')
    mSection.knob_Send_Level4_Value
        = surface.makeCustomValueVariable('knob_Send_Level4_Value')
    mSection.knob_Send_Level5_Value
        = surface.makeCustomValueVariable('knob_Send_Level5_Value')
    mSection.knob_Send_Level6_Value
        = surface.makeCustomValueVariable('knob_Send_Level6_Value')
    mSection.knob_Send_Level7_Value
        = surface.makeCustomValueVariable('knob_Send_Level7_Value')
    mSection.knob_Send_Level8_Value
        = surface.makeCustomValueVariable('knob_Send_Level8_Value')

    mSection.knob_CueSend_Level1_Value
        = surface.makeCustomValueVariable('knob_CueSend_Level1_Value')
    mSection.knob_CueSend_Level2_Value
        = surface.makeCustomValueVariable('knob_CueSend_Level2_Value')
    mSection.knob_CueSend_Level3_Value
        = surface.makeCustomValueVariable('knob_CueSend_Level3_Value')
    mSection.knob_CueSend_Level4_Value
        = surface.makeCustomValueVariable('knob_CueSend_Level4_Value')
    mSection.knob_CueSend_Pan1_Value
        = surface.makeCustomValueVariable('knob_CueSend_Pan1_Value')
    mSection.knob_CueSend_Pan2_Value
        = surface.makeCustomValueVariable('knob_CueSend_Pan2_Value')
    mSection.knob_CueSend_Pan3_Value
        = surface.makeCustomValueVariable('knob_CueSend_Pan3_Value')
    mSection.knob_CueSend_Pan4_Value
        = surface.makeCustomValueVariable('knob_CueSend_Pan4_Value')

    mSection.knob_QC1_Value
        = surface.makeCustomValueVariable('knob_QC1_Value')
    mSection.knob_QC2_Value
        = surface.makeCustomValueVariable('knob_QC2_Value')
    mSection.knob_QC3_Value
        = surface.makeCustomValueVariable('knob_QC3_Value')
    mSection.knob_QC4_Value
        = surface.makeCustomValueVariable('knob_QC4_Value')
    mSection.knob_QC5_Value
        = surface.makeCustomValueVariable('knob_QC5_Value')
    mSection.knob_QC6_Value
        = surface.makeCustomValueVariable('knob_QC6_Value')
    mSection.knob_QC7_Value
        = surface.makeCustomValueVariable('knob_QC7_Value')
    mSection.knob_QC8_Value
        = surface.makeCustomValueVariable('knob_QC8_Value')

    // use custom variables for all knob_Press functions
    mSection.var_MonitorEnable
        = surface.makeCustomValueVariable('var_MonitorEnable')
    mSection.var_MonitorEnableCmd
        = surface.makeCustomValueVariable('var_MonitorEnableCmd')
    mSection.var_ValueLocked
        = surface.makeCustomValueVariable('var_ValueLocked')
    mSection.var_ZoomFull
        = surface.makeCustomValueVariable('var_ZoomFull')
    mSection.var_SetQuantize_to_4th
        = surface.makeCustomValueVariable('var_SetQuantize_to_4th')

    // there are different commands for Cubase 12 und Cubase 13 for to insert a marker
    mSection.var_InsertMarkerCB12
        = surface.makeCustomValueVariable('var_InsertMarkerCB12')
    mSection.var_InsertMarkerCB13
        = surface.makeCustomValueVariable('var_InsertMarkerCB13')

    // use custom variable for vertical zoom out of waveform function
    mSection.var_VerticalZoomOutOfWaveform
        = surface.makeCustomValueVariable('var_VerticalZoomOutOfWaveform')

    // use custom variable for vertical zoom in on waveform function
    mSection.var_VerticalZoomInOnWaveform
        = surface.makeCustomValueVariable('var_VerticalZoomInOnWaveform')

    // use custom variables for additional zoom commands
    mSection.var_ZoomToSelectionFull
        = surface.makeCustomValueVariable('var_ZoomToSelectionFull')
    mSection.var_ZoomToSelection
        = surface.makeCustomValueVariable('var_ZoomToSelection')
    mSection.var_ZoomSelectedTracks
        = surface.makeCustomValueVariable('var_ZoomSelectedTracks')
    mSection.var_undoZoom
        = surface.makeCustomValueVariable('var_undoZoom')
    mSection.var_ZoomToLocators
        = surface.makeCustomValueVariable('var_ZoomToLocators')
    mSection.var_ZoomAllTracks
        = surface.makeCustomValueVariable('var_ZoomAllTracks')

    // use custom variable for to handle Control Room Source Select
    mSection.var_CR_Source_Select
        = surface.makeCustomValueVariable('var_CR_Source_Select')

    // use custom variable for to handle Control Room Monitor Select
    mSection.var_CR_Monitor_Select
        = surface.makeCustomValueVariable('var_CR_Monitor_Select')

    // use custom variable to show or hide all plugins
    mSection.var_show_hide_plugins
        = surface.makeCustomValueVariable('var_show_hide_plugins')

    // use custom variable to select next plugin window
    mSection.var_select_next_plugin_window
        = surface.makeCustomValueVariable('var_select_next_plugin_window')

    // use custom variable to close all plugin windows
    mSection.var_close_all_plugin_windows
        = surface.makeCustomValueVariable('var_close_all_plugin_windows')

    // use custom variables to edit Channel (open/close window)
    mSection.var_edit_Channel
        = surface.makeCustomValueVariable('var_edit_Channel')
    mSection.var_edit_Channel_Cmd
        = surface.makeCustomValueVariable('var_edit_Channel_Cmd')

    // use custom variable to edit Instrument(open/close window)
    mSection.var_edit_Instrument
        = surface.makeCustomValueVariable('var_edit_Instrument')

    mSection.var_ActivatePan
        = surface.makeCustomValueVariable('var_ActivatePan')
    mSection.var_ActivatePan_after_3ms
        = surface.makeCustomValueVariable('var_ActivatePan_after_3ms')

    mSection.var_ActivateChannel
        = surface.makeCustomValueVariable('var_ActivateChannel')
    mSection.var_ActivateScroll
        = surface.makeCustomValueVariable('var_ActivateScroll')

    mSection.var_ActivateMaster
        = surface.makeCustomValueVariable('var_ActivateMaster')
    mSection.var_ActivateMaster_after_3ms
        = surface.makeCustomValueVariable('var_ActivateMaster_after_3ms')

    mSection.var_ActivateClick
        = surface.makeCustomValueVariable('var_ActivateClick')
    mSection.var_ActivateClick_after_3ms
        = surface.makeCustomValueVariable('var_ActivateClick_after_3ms')

    // use custom variable for to set click to on/off
    mSection.var_MetronomeActive
        = surface.makeCustomValueVariable('var_MetronomeActive')

    mSection.var_ActivateSection
        = surface.makeCustomValueVariable('var_ActivateSection')
    mSection.var_ActivateMarker
        = surface.makeCustomValueVariable('var_ActivateMarker')
    mSection.var_ActivateHitpoint
        = surface.makeCustomValueVariable('var_ActivateHitpoint')

    mSection.var_ActivateLock
        = surface.makeCustomValueVariable('var_ActivateLock')
    mSection.var_ActivateLock_after_3ms
        = surface.makeCustomValueVariable('var_ActivateLock_after_3ms')

    mSection.var_ActivateZoom
        = surface.makeCustomValueVariable('var_ActivateZoom')
    mSection.var_ActivateQuantize
        = surface.makeCustomValueVariable('var_ActivateQuantize')
    mSection.var_ActivateNudge
        = surface.makeCustomValueVariable('var_ActivateNudge')
    mSection.var_ActivateCS_Bypass
        = surface.makeCustomValueVariable('var_ActivateCS_Bypass')
    mSection.var_ActivateEQ_Gain
        = surface.makeCustomValueVariable('var_ActivateEQ_Gain')
    mSection.var_ActivateEQ_Freq
        = surface.makeCustomValueVariable('var_ActivateEQ_Freq')
    mSection.var_ActivateEQ_Q
        = surface.makeCustomValueVariable('var_ActivateEQ_Q')
    mSection.var_ActivatePF_PreGain
        = surface.makeCustomValueVariable('var_ActivatePF_PreGain')
    mSection.var_ActivatePF_LCut_Freq
        = surface.makeCustomValueVariable('var_ActivatePF_LCut_Freq')
    mSection.var_ActivatePF_HCut_Freq
        = surface.makeCustomValueVariable('var_ActivatePF_HCut_Freq')
    mSection.var_ActivateSend_LevelA
        = surface.makeCustomValueVariable('var_ActivateSend_LevelA')
    mSection.var_ActivateSend_LevelB
        = surface.makeCustomValueVariable('var_ActivateSend_LevelB')
    mSection.var_ActivateCueSend_Level
        = surface.makeCustomValueVariable('var_ActivateCueSend_Level')
    mSection.var_ActivateCueSend_Pan
        = surface.makeCustomValueVariable('var_ActivateCueSend_Pan')
    mSection.var_ActivateQC1
        = surface.makeCustomValueVariable('var_ActivateQC1')
    mSection.var_ActivateQC2
        = surface.makeCustomValueVariable('var_ActivateQC2')
    mSection.var_ActivateQC3
        = surface.makeCustomValueVariable('var_ActivateQC3')
    mSection.var_ActivateQC4
        = surface.makeCustomValueVariable('var_ActivateQC4')
    mSection.var_ActivateQC5
        = surface.makeCustomValueVariable('var_ActivateQC5')
    mSection.var_ActivateQC6
        = surface.makeCustomValueVariable('var_ActivateQC6')
    mSection.var_ActivateQC7
        = surface.makeCustomValueVariable('var_ActivateQC7')
    mSection.var_ActivateQC8
        = surface.makeCustomValueVariable('var_ActivateQC8')
    mSection.var_ActivateAudio_Volume
        = surface.makeCustomValueVariable('var_ActivateAudio_Volume')
    mSection.var_ActivateAudio_FadeIn
        = surface.makeCustomValueVariable('var_ActivateAudio_FadeIn')
    mSection.var_ActivateAudio_FadeOut
        = surface.makeCustomValueVariable('var_ActivateAudio_FadeOut')

    // use custom variables for to activate Custom Pages
    mSection.var_ActivateCustomA0
        = surface.makeCustomValueVariable('var_ActivateCustomA0')
    mSection.var_ActivateCustomA1
        = surface.makeCustomValueVariable('var_ActivateCustomA1')
    mSection.var_ActivateCustomA2
        = surface.makeCustomValueVariable('var_ActivateCustomA2')
    mSection.var_ActivateCustomB0
        = surface.makeCustomValueVariable('var_ActivateCustomB0')
    mSection.var_ActivateCustomB1
        = surface.makeCustomValueVariable('var_ActivateCustomB1')
    mSection.var_ActivateCustomB2
        = surface.makeCustomValueVariable('var_ActivateCustomB2')

    // use custom variable for Prev Button to enable additional process functionality
    mSection.var_Prev
        = surface.makeCustomValueVariable('var_Prev')

    // use custom variable for Next Button to enable additional process functionality
    mSection.var_Next
        = surface.makeCustomValueVariable('var_Next')

    // use custom variable for to show or to hide the Markers Window
    mSection.var_Markers_Window
        = surface.makeCustomValueVariable('var_Markers_Window')

    // use custom variable for to show or to hide the Quantize Panel
    mSection.var_Quantize_Panel
        = surface.makeCustomValueVariable('var_Quantize_Panel')

    // use custom variable for to show or to hide the Mixer Window
    mSection.var_Mixer_Window
        = surface.makeCustomValueVariable('var_Mixer_Window')

    // use custom variable for to show or to hide the Video Window
    mSection.var_Video_Window
        = surface.makeCustomValueVariable('var_Video_Window')

    // use custom variable for to show or to hide the Automation Panel
    mSection.var_Automation_Panel
        = surface.makeCustomValueVariable('var_Automation_Panel')

    // use custom variable for handle global undo function
    mSection.var_global_undo
        = surface.makeCustomValueVariable('var_global_undo')

    // use custom variable for handle global redo function
    mSection.var_global_redo
        = surface.makeCustomValueVariable('var_global_redo')

    // use custom variable for handle global 'Left Selection Side to Cursor' function
    mSection.var_left_selSide_to_cursor
        = surface.makeCustomValueVariable('var_left_selSide_to_cursor')

    // use custom variable for handle global 'Right Selection Side to Cursor' function
    mSection.var_right_selSide_to_cursor
        = surface.makeCustomValueVariable('var_right_selSide_to_cursor')

    // use custom variables for on/off state of EQ-Bands
    mSection.var_EQ_Band1_State
        = surface.makeCustomValueVariable('var_EQ_Band1_State')
    mSection.var_EQ_Band2_State
        = surface.makeCustomValueVariable('var_EQ_Band2_State')
    mSection.var_EQ_Band3_State
        = surface.makeCustomValueVariable('var_EQ_Band3_State')
    mSection.var_EQ_Band4_State
        = surface.makeCustomValueVariable('var_EQ_Band4_State')

    // use custom variables for FilterType of EQ-Bands
    // only needed for 'Write / Read EQ paramaters to / from special memory' function
    mSection.var_EQ_Band1_FilterType
        = surface.makeCustomValueVariable('var_EQ_Band1_FilterType')
    mSection.var_EQ_Band2_FilterType
        = surface.makeCustomValueVariable('var_EQ_Band2_FilterType')
    mSection.var_EQ_Band3_FilterType
        = surface.makeCustomValueVariable('var_EQ_Band3_FilterType')
    mSection.var_EQ_Band4_FilterType
        = surface.makeCustomValueVariable('var_EQ_Band4_FilterType')

    // use custom variables for additional PreFilter settings,
    // which are not controlled by the Rotate Knob
    mSection.var_PF_Bypass
        = surface.makeCustomValueVariable('var_PF_Bypass')
    mSection.var_PF_PhaseSwitch
        = surface.makeCustomValueVariable('var_PF_PhaseSwitch')
    mSection.var_PF_LCut_On
        = surface.makeCustomValueVariable('var_PF_LCut_On')
    mSection.var_PF_LCut_Slope
        = surface.makeCustomValueVariable('var_PF_LCut_Slope')
    mSection.var_PF_HCut_On
        = surface.makeCustomValueVariable('var_PF_HCut_On')
    mSection.var_PF_HCut_Slope
        = surface.makeCustomValueVariable('var_PF_HCut_Slope')

    // use custom variables for additional Send settings,
    // which are not controlled by the Rotate Knob
    mSection.var_Send_On1
        = surface.makeCustomValueVariable('var_Send_On1')
    mSection.var_Send_On2
        = surface.makeCustomValueVariable('var_Send_On2')
    mSection.var_Send_On3
        = surface.makeCustomValueVariable('var_Send_On3')
    mSection.var_Send_On4
        = surface.makeCustomValueVariable('var_Send_On4')
    mSection.var_Send_On5
        = surface.makeCustomValueVariable('var_Send_On5')
    mSection.var_Send_On6
        = surface.makeCustomValueVariable('var_Send_On6')
    mSection.var_Send_On7
        = surface.makeCustomValueVariable('var_Send_On7')
    mSection.var_Send_On8
        = surface.makeCustomValueVariable('var_Send_On8')

    mSection.var_Send_Pre1
        = surface.makeCustomValueVariable('var_Send_Pre1')
    mSection.var_Send_Pre2
        = surface.makeCustomValueVariable('var_Send_Pre2')
    mSection.var_Send_Pre3
        = surface.makeCustomValueVariable('var_Send_Pre3')
    mSection.var_Send_Pre4
        = surface.makeCustomValueVariable('var_Send_Pre4')
    mSection.var_Send_Pre5
        = surface.makeCustomValueVariable('var_Send_Pre5')
    mSection.var_Send_Pre6
        = surface.makeCustomValueVariable('var_Send_Pre6')
    mSection.var_Send_Pre7
        = surface.makeCustomValueVariable('var_Send_Pre7')
    mSection.var_Send_Pre8
        = surface.makeCustomValueVariable('var_Send_Pre8')

    // use custom variables for additional Cue Send settings,
    // which are not controlled by the Rotate Knob
    mSection.var_CueSend_On1
        = surface.makeCustomValueVariable('var_CueSend_On1')
    mSection.var_CueSend_On2
        = surface.makeCustomValueVariable('var_CueSend_On2')
    mSection.var_CueSend_On3
        = surface.makeCustomValueVariable('var_CueSend_On3')
    mSection.var_CueSend_On4
        = surface.makeCustomValueVariable('var_CueSend_On4')
    mSection.var_CueSend_Pre1
        = surface.makeCustomValueVariable('var_CueSend_Pre1')
    mSection.var_CueSend_Pre2
        = surface.makeCustomValueVariable('var_CueSend_Pre2')
    mSection.var_CueSend_Pre3
        = surface.makeCustomValueVariable('var_CueSend_Pre3')
    mSection.var_CueSend_Pre4
        = surface.makeCustomValueVariable('var_CueSend_Pre4')

    // use custom variables for to handle CS Bypass Mode settings
    mSection.var_CS_Gate_On
        = surface.makeCustomValueVariable('var_CS_Gate_On')
    mSection.var_CS_Compr_On
        = surface.makeCustomValueVariable('var_CS_Compr_On')
    mSection.var_CS_Tools_On
        = surface.makeCustomValueVariable('var_CS_Tools_On')
    mSection.var_CS_Limit_On
        = surface.makeCustomValueVariable('var_CS_Limit_On')
    mSection.var_CS_Sat_On
        = surface.makeCustomValueVariable('var_CS_Sat_On')
    mSection.var_CS_Gate_Bypass
        = surface.makeCustomValueVariable('var_CS_Gate_Bypass')
    mSection.var_CS_Compr_Bypass
        = surface.makeCustomValueVariable('var_CS_Compr_Bypass')
    mSection.var_CS_Tools_Bypass
        = surface.makeCustomValueVariable('var_CS_Tools_Bypass')
    mSection.var_CS_Limit_Bypass
        = surface.makeCustomValueVariable('var_CS_Limit_Bypass')
    mSection.var_CS_Sat_Bypass
        = surface.makeCustomValueVariable('var_CS_Sat_Bypass')

    // use custom variable for to handle Audio, editors
    mSection.var_Audio_editors
        = surface.makeCustomValueVariable('var_Audio_editors')

    // use custom variable for to handle Audio, play selection
    mSection.var_Audio_play_selection
        = surface.makeCustomValueVariable('var_Audio_play_selection')

    // use custom variable for to handle Audio, crossfade
    mSection.var_Audio_crossfade
        = surface.makeCustomValueVariable('var_Audio_crossfade')

    // use custom variable for to handle Audio, bounce
    mSection.var_Audio_bounce
        = surface.makeCustomValueVariable('var_Audio_bounce')

    // use custom variable for to handle Audio, delete fade in
    mSection.var_Audio_delete_fade_in
        = surface.makeCustomValueVariable('var_Audio_delete_fade_in')

    // use custom variable for to handle Audio, standard fade in
    mSection.var_Audio_standard_fade_in
        = surface.makeCustomValueVariable('var_Audio_standard_fade_in')

    // use custom variable for to handle Audio, fade in to cursor
    mSection.var_Audio_fade_in_to_cursor
        = surface.makeCustomValueVariable('var_Audio_fade_in_to_cursor')

    // use custom variable for to handle Audio, fade in to range
    mSection.var_Audio_fade_in_to_range
        = surface.makeCustomValueVariable('var_Audio_fade_in_to_range')

    // use custom variable for to handle Audio, delete fade out
    mSection.var_Audio_delete_fade_out
        = surface.makeCustomValueVariable('var_Audio_delete_fade_out')

    // use custom variable for to handle Audio, standard fade out
    mSection.var_Audio_standard_fade_out
        = surface.makeCustomValueVariable('var_Audio_standard_fade_out')

    // use custom variable for to handle Audio, fade out from cursor
    mSection.var_Audio_fade_out_from_cursor
        = surface.makeCustomValueVariable('var_Audio_fade_out_from_cursor')

    // use custom variable for to handle Audio, fade out from range
    mSection.var_Audio_fade_out_from_range
        = surface.makeCustomValueVariable('var_Audio_fade_out_from_range')

    // QuickTracks, custom variable for checking from x forward to LastTrack
    mSection.var_forward_check_loop
        = surface.makeCustomValueVariable('var_forward_check_loop')

    // QuickTracks, custom variable for moving from LastTrack backward to x
    mSection.var_backward_from_LastTrack_loop
        = surface.makeCustomValueVariable('var_backward_from_LastTrack_loop')

    // QuickTracks, custom variable for checking from x backward to FirstTrack
    mSection.var_backward_check_loop
        = surface.makeCustomValueVariable('var_backward_check_loop')

    // QuickTracks, custom variable for moving from FirstTrack forward to x
    mSection.var_forward_from_FirstTrack_loop
        = surface.makeCustomValueVariable('var_forward_from_FirstTrack_loop')

    // QuickTracks, custom variable for selecting a QuickTrack
    mSection.var_select_QuickTrack_loop
        = surface.makeCustomValueVariable('var_select_QuickTrack_loop')

    // QuickTracks, custom variable for to go forward to track with name
    mSection.var_forward_to_track_with_name_loop
        = surface.makeCustomValueVariable('var_forward_to_track_with_name_loop')

    // QuickTracks, custom variable for to go backward to track with name
    mSection.var_backward_to_track_with_name_loop
        = surface.makeCustomValueVariable('var_backward_to_track_with_name_loop')

    // QuickTracks, custom variable for dedicated PrevTrack function
    mSection.var_PrevTrack
        = surface.makeCustomValueVariable('var_PrevTrack')

    // QuickTracks, custom variable for dedicated NextTrack function
    mSection.var_NextTrack
        = surface.makeCustomValueVariable('var_NextTrack')

    // Navigation Mode, custom variable for automatic navigation
    mSection.var_navigation_loop
        = surface.makeCustomValueVariable('var_navigation_loop')

    // QC8, custom variable
    // for to turn on the LEDs of the middle section and Marker LED to flashing
    mSection.var_onLEDs_for_QC8_after_180ms
        = surface.makeCustomValueVariable('var_onLEDs_for_QC8_after_180ms')

    // variables to implement the prevention of unwanted calls of callback functions
    var ignore_knob_FP_ValueChange_when_next_callback = false
    var ignore_knob_Pan_ValueChange_when_next_callback = false
    var ignore_knob_CRLevel_ValueChange_when_next_callback = false
    var ignore_knob_ClickLevel_ValueChange_when_next_callback = false
    var ignore_knob_ValueUnderMouse_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band1_Gain_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band2_Gain_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band3_Gain_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band4_Gain_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band1_Freq_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band2_Freq_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band3_Freq_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band4_Freq_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band1_Q_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band2_Q_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band3_Q_ValueChange_when_next_callback = false
    var ignore_knob_EQ_Band4_Q_ValueChange_when_next_callback = false
    var ignore_knob_PF_PreGain_ValueChange_when_next_callback = false
    var ignore_knob_PF_LCut_Freq_ValueChange_when_next_callback = false
    var ignore_knob_PF_HCut_Freq_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level1_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level2_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level3_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level4_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level5_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level6_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level7_ValueChange_when_next_callback = false
    var ignore_knob_Send_Level8_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Level1_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Level2_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Level3_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Level4_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Pan1_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Pan2_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Pan3_ValueChange_when_next_callback = false
    var ignore_knob_CueSend_Pan4_ValueChange_when_next_callback = false
    var ignore_knob_QC1_ValueChange_when_next_callback = false
    var ignore_knob_QC2_ValueChange_when_next_callback = false
    var ignore_knob_QC3_ValueChange_when_next_callback = false
    var ignore_knob_QC4_ValueChange_when_next_callback = false
    var ignore_knob_QC5_ValueChange_when_next_callback = false
    var ignore_knob_QC6_ValueChange_when_next_callback = false
    var ignore_knob_QC7_ValueChange_when_next_callback = false
    var ignore_knob_QC8_ValueChange_when_next_callback = false


    // Update Hardware...
    mSection.knob_Pan_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_Pan_ValueChange_when_next_callback) {
            ignore_knob_Pan_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_Pan) {
            var newvalue = value
            if (Math.abs(newvalue - mSection.knob_FP_Value.getProcessValue(context)) > 0.001) {
                mSection.knob_FP_Value.setProcessValue(context, value)
            }
        }
    }

    // Update Hardware...
    mSection.knob_CRLevel_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_CRLevel_ValueChange_when_next_callback) {
            ignore_knob_CRLevel_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_Master) {
            var newvalue = value
            if (Math.abs(newvalue - mSection.knob_FP_Value.getProcessValue(context)) > 0.001) {
                mSection.knob_FP_Value.setProcessValue(context, value)
            }
        }
    }

    // Update Hardware...
    mSection.knob_ClickLevel_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_ClickLevel_ValueChange_when_next_callback) {
            ignore_knob_ClickLevel_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_Click) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_ValueUnderMouse_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_ValueUnderMouse_ValueChange_when_next_callback) {
            ignore_knob_ValueUnderMouse_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_Lock) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band1_Gain_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band1_Gain_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band1_Gain_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (EQ_Mode_running) {
            if (mSection.var_EQ_Band1_State.getProcessValue(context)) {
                setColorLED_EQ_Gain(context, cLink, value)
            }
            if ((selected_EQ_Param == EQ_Params.EQ_Gain) && (selected_EQ_Band == 1)) {
                mSection.knob_FP_Value.setProcessValue(context, value)
            }
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band2_Gain_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band2_Gain_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band2_Gain_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (EQ_Mode_running) {
            if (mSection.var_EQ_Band2_State.getProcessValue(context)) {
                setColorLED_EQ_Gain(context, cPan, value)
            }
            if ((selected_EQ_Param == EQ_Params.EQ_Gain) && (selected_EQ_Band == 2)) {
                mSection.knob_FP_Value.setProcessValue(context, value)
            }
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band3_Gain_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band3_Gain_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band3_Gain_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (EQ_Mode_running) {
            if (mSection.var_EQ_Band3_State.getProcessValue(context)) {
                setColorLED_EQ_Gain(context, cChannel, value)
            }
            if ((selected_EQ_Param == EQ_Params.EQ_Gain) && (selected_EQ_Band == 3)) {
                mSection.knob_FP_Value.setProcessValue(context, value)
            }
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band4_Gain_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band4_Gain_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band4_Gain_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (EQ_Mode_running) {
            if (mSection.var_EQ_Band4_State.getProcessValue(context)) {
                setColorLED_EQ_Gain(context, cScroll, value)
            }
            if ((selected_EQ_Param == EQ_Params.EQ_Gain) && (selected_EQ_Band == 4)) {
                mSection.knob_FP_Value.setProcessValue(context, value)
            }
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band1_Freq_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band1_Freq_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band1_Freq_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
            && (selected_EQ_Param == EQ_Params.EQ_Freq) && (selected_EQ_Band == 1)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band2_Freq_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band2_Freq_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band2_Freq_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
            && (selected_EQ_Param == EQ_Params.EQ_Freq) && (selected_EQ_Band == 2)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band3_Freq_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band3_Freq_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band3_Freq_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
        && (selected_EQ_Param == EQ_Params.EQ_Freq) && (selected_EQ_Band == 3)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band4_Freq_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band4_Freq_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band4_Freq_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
            && (selected_EQ_Param == EQ_Params.EQ_Freq) && (selected_EQ_Band == 4)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band1_Q_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band1_Q_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band1_Q_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
            && (selected_EQ_Param == EQ_Params.EQ_Q) && (selected_EQ_Band == 1)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band2_Q_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band2_Q_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band2_Q_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
            && (selected_EQ_Param == EQ_Params.EQ_Q) && (selected_EQ_Band == 2)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band3_Q_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band3_Q_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band3_Q_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
            && (selected_EQ_Param == EQ_Params.EQ_Q) && (selected_EQ_Band == 3)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_EQ_Band4_Q_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_EQ_Band4_Q_ValueChange_when_next_callback) {
            ignore_knob_EQ_Band4_Q_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((EQ_Mode_running)
            && (selected_EQ_Param == EQ_Params.EQ_Q) && (selected_EQ_Band == 4)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_PF_PreGain_Value.mOnProcessValueChange = function(context, value) {
        if (PF_Mode_running)
            mSection.set_PF_PreGain_LED(context)
        if (ignore_knob_PF_PreGain_ValueChange_when_next_callback) {
            ignore_knob_PF_PreGain_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((PF_Mode_running) && (selected_PF_Param == PF_Params.PF_PreGain)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_PF_LCut_Freq_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_PF_LCut_Freq_ValueChange_when_next_callback) {
            ignore_knob_PF_LCut_Freq_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((PF_Mode_running) && (selected_PF_Param == PF_Params.PF_LCut_Freq)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }


    // Update Hardware...
    mSection.knob_PF_HCut_Freq_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_PF_HCut_Freq_ValueChange_when_next_callback) {
            ignore_knob_PF_HCut_Freq_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((PF_Mode_running) && (selected_PF_Param == PF_Params.PF_HCut_Freq)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // helper function to avoid redundant callbacks for Send_Level
    mSection.old_knob_Send_Level_equalValue = function(index_1_8, value) {
        if (old_knob_Send_Level_Values[index_1_8 - 1] == value) {
            return true
        } else {
            old_knob_Send_Level_Values[index_1_8 - 1] = value
            return false
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level1_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(1, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cLink)
        }
        if (ignore_knob_Send_Level1_ValueChange_when_next_callback) {
            ignore_knob_Send_Level1_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelA) && (selected_Send == 1)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level2_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(2, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cPan)
        }
        if (ignore_knob_Send_Level2_ValueChange_when_next_callback) {
            ignore_knob_Send_Level2_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelA) && (selected_Send == 2)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level3_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(3, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cChannel)
        }
        if (ignore_knob_Send_Level3_ValueChange_when_next_callback) {
            ignore_knob_Send_Level3_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelA) && (selected_Send == 3)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level4_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(4, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cScroll)
        }
        if (ignore_knob_Send_Level4_ValueChange_when_next_callback) {
            ignore_knob_Send_Level4_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelA) && (selected_Send == 4)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level5_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(5, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cLink)
        }
        if (ignore_knob_Send_Level5_ValueChange_when_next_callback) {
            ignore_knob_Send_Level5_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelB) && (selected_Send == 5)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level6_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(6, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cPan)
        }
        if (ignore_knob_Send_Level6_ValueChange_when_next_callback) {
            ignore_knob_Send_Level6_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelB) && (selected_Send == 6)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level7_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(7, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cChannel)
        }
        if (ignore_knob_Send_Level7_ValueChange_when_next_callback) {
            ignore_knob_Send_Level7_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelB) && (selected_Send == 7)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_Send_Level8_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_Send_Level_equalValue(8, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cScroll)
        }
        if (ignore_knob_Send_Level8_ValueChange_when_next_callback) {
            ignore_knob_Send_Level8_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((Send_Mode_running)
        && (active_page == pages.page_Send_LevelB) && (selected_Send == 8)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // helper function to avoid redundant callbacks for CueSend_Level
    mSection.old_knob_CueSend_Level_equalValue = function(index_1_4, value) {
        if (old_knob_CueSend_Level_Values[index_1_4 - 1] == value) {
            return true
        } else {
            old_knob_CueSend_Level_Values[index_1_4 - 1] = value
            return false
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Level1_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Level_equalValue(1, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cLink)
        }
        if (ignore_knob_CueSend_Level1_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Level1_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Level) && (selected_CueSend == 1)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Level2_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Level_equalValue(2, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cPan)
        }
        if (ignore_knob_CueSend_Level2_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Level2_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Level) && (selected_CueSend == 2)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Level3_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Level_equalValue(3, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cChannel)
        }
        if (ignore_knob_CueSend_Level3_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Level3_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Level) && (selected_CueSend == 3)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Level4_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Level_equalValue(4, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cScroll)
        }
        if (ignore_knob_CueSend_Level4_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Level4_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Level) && (selected_CueSend == 4)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // helper function to avoid redundant callbacks for CueSend_Pan
    mSection.old_knob_CueSend_Pan_equalValue = function(index_1_4, value) {
        if (old_knob_CueSend_Pan_Values[index_1_4 - 1] == value) {
            return true
        } else {
            old_knob_CueSend_Pan_Values[index_1_4 - 1] = value
            return false
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Pan1_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Pan_equalValue(1, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Pan)) {
            mSection.set_CueSend_Pan_LED(context, cLink)
        }
        if (ignore_knob_CueSend_Pan1_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Pan1_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Pan) && (selected_CueSend == 1)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Pan2_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Pan_equalValue(2, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Pan)) {
            mSection.set_CueSend_Pan_LED(context, cPan)
        }
        if (ignore_knob_CueSend_Pan2_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Pan2_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Pan) && (selected_CueSend == 2)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Pan3_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Pan_equalValue(3, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Pan)) {
            mSection.set_CueSend_Pan_LED(context, cChannel)
        }
        if (ignore_knob_CueSend_Pan3_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Pan3_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Pan) && (selected_CueSend == 3)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_CueSend_Pan4_Value.mOnProcessValueChange = function(context, value) {
        if (mSection.old_knob_CueSend_Pan_equalValue(4, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Pan)) {
            mSection.set_CueSend_Pan_LED(context, cScroll)
        }
        if (ignore_knob_CueSend_Pan4_ValueChange_when_next_callback) {
            ignore_knob_CueSend_Pan4_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if ((CueSend_Mode_running)
        && (selected_CueSend_Param == CueSend_Params.CueSend_Pan) && (selected_CueSend == 4)) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC1_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC1_ValueChange_when_next_callback) {
            ignore_knob_QC1_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC1) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC2_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC2_ValueChange_when_next_callback) {
            ignore_knob_QC2_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC2) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC3_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC3_ValueChange_when_next_callback) {
            ignore_knob_QC3_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC3) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC4_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC4_ValueChange_when_next_callback) {
            ignore_knob_QC4_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC4) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC5_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC5_ValueChange_when_next_callback) {
            ignore_knob_QC5_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC5) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC6_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC6_ValueChange_when_next_callback) {
            ignore_knob_QC6_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC6) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC7_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC7_ValueChange_when_next_callback) {
            ignore_knob_QC7_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC7) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    // Update Hardware...
    mSection.knob_QC8_Value.mOnProcessValueChange = function(context, value) {
        if (ignore_knob_QC8_ValueChange_when_next_callback) {
            ignore_knob_QC8_ValueChange_when_next_callback = false
            return
        }
        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Play_running) || (Custom_Mode_running)
        || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed)))
            return
        if (active_page == pages.page_QC8) {
            mSection.knob_FP_Value.setProcessValue(context, value)
        }
    }

    mSection.Send_Level_without_rubberband_effect = function(value) {
        // Avoid the rubberband effect at 0 dB by reducing the rubberband range.
        if ((value > (CRLevel_Value_0dB - 0.004)) && (value < (CRLevel_Value_0dB + 0.004))) {
            return CRLevel_Value_0dB
        } else if ((value <= (CRLevel_Value_0dB - 0.004))
        && (value > (CRLevel_Value_0dB - 0.008))) {
            return CRLevel_Value_0dB - 0.008
        } else if ((value >= (CRLevel_Value_0dB + 0.004))
        && (value < (CRLevel_Value_0dB + 0.008))) {
            return CRLevel_Value_0dB + 0.008
        } else {
            return value
        }
    }

    mSection.param_to_knob_FP_Value = function(context) {
        var v = -0.1
        switch (active_page) {
            case pages.page_Pan:
                v = mSection.knob_Pan_Value.getProcessValue(context)
                break
            case pages.page_Master:
                v = mSection.knob_CRLevel_Value.getProcessValue(context)
                break
            case pages.page_Click:
                v = mSection.knob_ClickLevel_Value.getProcessValue(context)
                break
            case pages.page_Lock:
                v = mSection.knob_ValueUnderMouse_Value.getProcessValue(context)
                break
            case pages.page_EQ_Gain:
                switch (selected_EQ_Band) {
                    case 1: v = mSection.knob_EQ_Band1_Gain_Value.getProcessValue(context); break
                    case 2: v = mSection.knob_EQ_Band2_Gain_Value.getProcessValue(context); break
                    case 3: v = mSection.knob_EQ_Band3_Gain_Value.getProcessValue(context); break
                    case 4: v = mSection.knob_EQ_Band4_Gain_Value.getProcessValue(context); break
                }
                break
            case pages.page_EQ_Freq:
                switch (selected_EQ_Band) {
                    case 1: v = mSection.knob_EQ_Band1_Freq_Value.getProcessValue(context); break
                    case 2: v = mSection.knob_EQ_Band2_Freq_Value.getProcessValue(context); break
                    case 3: v = mSection.knob_EQ_Band3_Freq_Value.getProcessValue(context); break
                    case 4: v = mSection.knob_EQ_Band4_Freq_Value.getProcessValue(context); break
                }
                break
            case pages.page_EQ_Q:
                switch (selected_EQ_Band) {
                    case 1: v = mSection.knob_EQ_Band1_Q_Value.getProcessValue(context); break
                    case 2: v = mSection.knob_EQ_Band2_Q_Value.getProcessValue(context); break
                    case 3: v = mSection.knob_EQ_Band3_Q_Value.getProcessValue(context); break
                    case 4: v = mSection.knob_EQ_Band4_Q_Value.getProcessValue(context); break
                }
                break
            case pages.page_PF_PreGain:
                v = mSection.knob_PF_PreGain_Value.getProcessValue(context)
                break
            case pages.page_PF_LCut_Freq:
                v = mSection.knob_PF_LCut_Freq_Value.getProcessValue(context)
                break
            case pages.page_PF_HCut_Freq:
                v = mSection.knob_PF_HCut_Freq_Value.getProcessValue(context)
                break
            case pages.page_Send_LevelA:
                switch (selected_Send) {
                    case 1: v = mSection.knob_Send_Level1_Value.getProcessValue(context); break
                    case 2: v = mSection.knob_Send_Level2_Value.getProcessValue(context); break
                    case 3: v = mSection.knob_Send_Level3_Value.getProcessValue(context); break
                    case 4: v = mSection.knob_Send_Level4_Value.getProcessValue(context); break
                }
                break
            case pages.page_Send_LevelB:
                switch (selected_Send) {
                    case 5: v = mSection.knob_Send_Level5_Value.getProcessValue(context); break
                    case 6: v = mSection.knob_Send_Level6_Value.getProcessValue(context); break
                    case 7: v = mSection.knob_Send_Level7_Value.getProcessValue(context); break
                    case 8: v = mSection.knob_Send_Level8_Value.getProcessValue(context); break
                }
                break
            case pages.page_CueSend_Level:
                switch (selected_CueSend) {
                    case 1: v = mSection.knob_CueSend_Level1_Value.getProcessValue(context); break
                    case 2: v = mSection.knob_CueSend_Level2_Value.getProcessValue(context); break
                    case 3: v = mSection.knob_CueSend_Level3_Value.getProcessValue(context); break
                    case 4: v = mSection.knob_CueSend_Level4_Value.getProcessValue(context); break
                }
                break
            case pages.page_CueSend_Pan:
                switch (selected_CueSend) {
                    case 1: v = mSection.knob_CueSend_Pan1_Value.getProcessValue(context); break
                    case 2: v = mSection.knob_CueSend_Pan2_Value.getProcessValue(context); break
                    case 3: v = mSection.knob_CueSend_Pan3_Value.getProcessValue(context); break
                    case 4: v = mSection.knob_CueSend_Pan4_Value.getProcessValue(context); break
                }
                break
            case pages.page_QC1: v = mSection.knob_QC1_Value.getProcessValue(context); break
            case pages.page_QC2: v = mSection.knob_QC2_Value.getProcessValue(context); break
            case pages.page_QC3: v = mSection.knob_QC3_Value.getProcessValue(context); break
            case pages.page_QC4: v = mSection.knob_QC4_Value.getProcessValue(context); break
            case pages.page_QC5: v = mSection.knob_QC5_Value.getProcessValue(context); break
            case pages.page_QC6: v = mSection.knob_QC6_Value.getProcessValue(context); break
            case pages.page_QC7: v = mSection.knob_QC7_Value.getProcessValue(context); break
            case pages.page_QC8: v = mSection.knob_QC8_Value.getProcessValue(context); break
        }

        if (v >= 0) {
            mSection.knob_FP_Value.setProcessValue(context, v)
        }
    }

    // Update Hardware...
    mSection.knob_FP_Value.mOnProcessValueChange = function(context, value) {
        if (debug_knob_FP_Value)
            console.log('059) mSection.knob_FP_Value.mOnProcessValueChange: ' + value.toString())

        if (ignore_knob_FP_ValueChange_when_next_callback) {
            ignore_knob_FP_ValueChange_when_next_callback = false
            return
        }

        if (FP_locked) {
            mSection.knob_FP_Value.setProcessValue(context, knob_FP_prev_Value)
            return
        }

        // evaluate if knob is turned left or right
        const Direction = {Direction_none: 0x00, Direction_Left: 0x01, Direction_Right: 0x02}
        var knob_Direction = Direction.Direction_none
        if ((knob_FP_prev_Value > value) || ((knob_FP_prev_Value == 0) && (value == 0)))
            knob_Direction = Direction.Direction_Left
        else if (((knob_FP_prev_Value < value) || (knob_FP_prev_Value == 1) && (value == 1)))
            knob_Direction = Direction.Direction_Right
        knob_FP_prev_Value = value

        // normal case in Custom Mode
        if ((!btn_Cycle_running) && (!btn_Stop_running) && (!btn_Play_running)
        && (Custom_Mode_running)) {
            return
        }

        if (btn_Cycle_running) {

            // GTS (Global Track Scroll) functionality
            if (knob_Direction == Direction.Direction_Left) {
                mSection.knob_Channel_Left.setProcessValue(context, 1)
            } else if (knob_Direction == Direction.Direction_Right) {
                mSection.knob_Channel_Right.setProcessValue(context, 1)
            }
            if (knob_Direction != Direction.Direction_none) {
                // remember if Rotate Knob was rotated for GTS functionality
                knob_was_rotated_while_btn_Cycle_running = true
            }
            return

        } else if ((btn_Stop_running) || (btn_Play_running)
            || ((btn_Bypass_running) && (!ignore_next_GPS_trigger_while_btn_Bypass_pressed))) {

            // GPS (Global Project Scroll) functionality
            // The functionalities when the knob is pressed remain as before.
            if (knob_Direction == Direction.Direction_Left) {
                tpSection.knob_Scroll_Left.setProcessValue(context, 1)
            } else if (knob_Direction == Direction.Direction_Right) {
                tpSection.knob_Scroll_Right.setProcessValue(context, 1)
            }
            if (knob_Direction != Direction.Direction_none) {
                if (btn_Bypass_running) {
                    // remember if Rotate Knob was rotated for GPS functionality
                    knob_was_rotated_while_btn_Bypass_running = true
                }
            }
            return

        } else {
            ignore_next_GPS_trigger_while_btn_Bypass_pressed = false

            // remember if Rotate Knob was rotated for Zoom Mode,
            // when Prev Button or Next Button was pressed
            if (active_page == pages.page_Zoom) {
                knob_was_rotated_within_Zoom_Mode = true
            }
        }

        if (Custom_Mode_running)
            return

        switch (active_page) {
            case pages.page_Pan:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                var newvalue = value
                if (Math.abs(mSection.knob_Pan_Value.getProcessValue(context) - newvalue) > 0.001) {

                    // normalization to even values L, L98, ... L4, L2, C, R2, R4, ... R98, R
                    if ((newvalue > 0.495) && (newvalue < 0.505)) {
                        mSection.knob_Pan_Value.setProcessValue(context, 0.50)
                        // adapt change of value to corresponding variable after rounding
                        // for some rounding cases, where otherwise a delayed retrieval could occur
                        mSection.knob_FP_Value.setProcessValue(context, 0.50)
                    } else switch (knob_Direction) {
                        case Direction.Direction_Left:
                            ignore_knob_Pan_ValueChange_when_next_callback = true
                            mSection.knob_Pan_Value.setProcessValue(context,
                                Math.floor(newvalue * 100) / 100)
                            // adapt change of value to corresponding variable after rounding
                            // for some rounding cases,
                            // where otherwise a delayed retrieval could occur
                            ignore_knob_FP_ValueChange_when_next_callback = true
                            mSection.knob_FP_Value.setProcessValue(context,
                                Math.floor(newvalue * 100) / 100)
                            break
                        case Direction.Direction_Right:
                            ignore_knob_Pan_ValueChange_when_next_callback = true
                            mSection.knob_Pan_Value.setProcessValue(context,
                                Math.ceil(newvalue * 100) / 100)
                            // adapt change of value to corresponding variable after rounding
                            // for some rounding cases,
                            // where otherwise a delayed retrieval could occur
                            ignore_knob_FP_ValueChange_when_next_callback = true
                            mSection.knob_FP_Value.setProcessValue(context,
                                Math.ceil(newvalue * 100) / 100)
                            break
                        case Direction.Direction_none:
                            ignore_knob_Pan_ValueChange_when_next_callback = true
                            mSection.knob_Pan_Value.setProcessValue(context,
                                Math.round(newvalue * 100) / 100)
                            // adapt change of value to corresponding variable after rounding
                            // for some rounding cases,
                            // where otherwise a delayed retrieval could occur
                            ignore_knob_FP_ValueChange_when_next_callback = true
                            mSection.knob_FP_Value.setProcessValue(context,
                                Math.round(newvalue * 100) / 100)
                            break
                    }
                }
                break
            case pages.page_Channel:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Channel_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Channel_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Scroll:
                if (knob_Direction == Direction.Direction_Left) {
                    tpSection.knob_Scroll_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    tpSection.knob_Scroll_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Master:
                // avoid the rubberband effect at -20 dB by reducing the rubberband range
                if ((value > (CRLevel_Value_n20dB - 0.005))
                && (value < (CRLevel_Value_n20dB + 0.005))) {
                    value = CRLevel_Value_n20dB
                } else if ((value <= (CRLevel_Value_n20dB - 0.005))
                && (value > (CRLevel_Value_n20dB - 0.01))) {
                    value = CRLevel_Value_n20dB - 0.01
                } else if ((value >= (CRLevel_Value_n20dB + 0.005))
                && (value < (CRLevel_Value_n20dB + 0.01))) {
                    value = CRLevel_Value_n20dB + 0.01
                }

                var newvalue = value
                if (Math.abs(mSection.knob_CRLevel_Value
                    .getProcessValue(context) - newvalue) > 0.001) {
                    // set values near 0 dB to 0.00 dB
                    if ((newvalue > (CRLevel_Value_0dB - 0.005))
                    && (newvalue < (CRLevel_Value_0dB + 0.005))) {
                        ignore_knob_CRLevel_ValueChange_when_next_callback = true
                        mSection.knob_CRLevel_Value.setProcessValue(context, CRLevel_Value_0dB)
                        // adapt change of value to corresponding variable after rounding
                        // for some rounding cases, where otherwise a delayed retrieval could occur
                        ignore_knob_FP_ValueChange_when_next_callback = true
                        mSection.knob_FP_Value.setProcessValue(context, CRLevel_Value_0dB)
                    } else {
                        ignore_knob_CRLevel_ValueChange_when_next_callback = true
                        mSection.knob_CRLevel_Value.setProcessValue(context, newvalue)
                    }
                }
                break
            case pages.page_Click:
                if (Math.abs(mSection.knob_ClickLevel_Value
                    .getProcessValue(context) - value) > 0.001) {
                    ignore_knob_ClickLevel_ValueChange_when_next_callback = true
                    mSection.knob_ClickLevel_Value.setProcessValue(context, value)
                }
                break
            case pages.page_Section:  // now Event Mode (Button Section without Shift)
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Section_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Section_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Marker:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Marker_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Marker_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Hitpoint:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Hitpoint_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Hitpoint_Right.setProcessValue(context, 1)
                }
            case pages.page_Lock:
                if ((!btn_Prev_running) && (!btn_Next_running)
                && (!low_resolution_AI_Mode_locked) && (!high_resolution_AI_Mode_locked)) {
                    // normal resolution AI Mode
                    if (Math.abs(mSection.knob_ValueUnderMouse_Value
                    .getProcessValue(context) - value) > 0.001) {
                        ignore_knob_ValueUnderMouse_ValueChange_when_next_callback = true
                        mSection.knob_ValueUnderMouse_Value.setProcessValue(context, value)
                    }
                } else { // low resolution or high resolution AI Mode
                    var old_value = mSection.knob_ValueUnderMouse_Value.getProcessValue(context)
                    if (Math.abs(value - old_value) > 0.0001) {
                        if (btn_Prev_running) {
                            set_low_resolution_AI_Mode_with_Prev = true
                        } else if (btn_Next_running) {
                            set_high_resolution_AI_Mode_with_Next = true
                        }

                        var value2 = old_value
                        if ((btn_Prev_running)
                        || ((!btn_Next_running) && (low_resolution_AI_Mode_locked))) {
                            // when the Prev Button is pressed down or the AI Mode was locked to
                            // low resolution, perform the AI Mode with low resolution
                            step_interval = (1 / low_resolution_steps)
                            value2 = Math.round(value2*low_resolution_steps)/low_resolution_steps
                        } else if ((btn_Next_running)
                        || ((!btn_Prev_running) && (high_resolution_AI_Mode_locked))) {
                            // when the Next Button is pressed down or the AI Mode was locked to
                            // high resolution, perform the AI Mode with high resolution
                            step_interval = (1 / high_resolution_steps)
                            value2 = Math.round(value2*high_resolution_steps)/high_resolution_steps
                        }

                        if (knob_Direction == Direction.Direction_Right) {
                            value2 = value2 + step_interval
                            if (value2 > 1) {
                                value2 = 1
                            }
                        } else if (knob_Direction == Direction.Direction_Left) {
                            value2 = value2 - step_interval
                            if (value2 < 0) {
                                value2 = 0
                            }
                        }

                        if (Math.abs(old_value - value2) > 0.0001) {
                            ignore_knob_ValueUnderMouse_ValueChange_when_next_callback = true
                            mSection.knob_ValueUnderMouse_Value.setProcessValue(context, value2)
                        }
                    }
                }
                break
            case pages.page_Zoom:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Zoom_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Zoom_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Quantize:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Quantize_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Quantize_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Nudge:
                 // the Nudge Mode was moved to the Shift Page
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Nudge_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Nudge_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_CS_Bypass:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Channel_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Channel_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_EQ_Gain:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if ((EQ_Mode_running) && (selected_EQ_Param == EQ_Params.EQ_Gain)) {

                    // rasterization, range = -24 dB .. +24 dB, step interval = 0.4 dB
                    var value2 = value
                    var scan_value = value
                    var neg_gain = scan_value < 0.5
                    if (neg_gain) {
                        scan_value = 1 - scan_value
                    }
                    var next_threshold = 0.5075
                    var step_count = 0
                    var step_interval = (1/120)
                    while ((scan_value > next_threshold) && (step_count < 60)) {
                        step_count++
                        next_threshold = next_threshold + step_interval
                    }
                    if (neg_gain) {
                        value2 = 0.5 - (step_count/120)
                    } else {
                        value2 = 0.5 + (step_count/120)
                    }
                    if (value2 < (value - step_interval)) {
                        value2 = value2 + step_interval
                    }

                    if (selected_EQ_Band == 1) {
                        if (Math.abs(mSection.knob_EQ_Band1_Gain_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band1_Gain_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band1_Gain_Value.setProcessValue(context, value2)
                        }
                    } else if (selected_EQ_Band == 2) {
                        if (Math.abs(mSection.knob_EQ_Band2_Gain_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band2_Gain_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band2_Gain_Value.setProcessValue(context, value2)
                        }
                    } else if (selected_EQ_Band == 3) {
                        if (Math.abs(mSection.knob_EQ_Band3_Gain_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band3_Gain_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band3_Gain_Value.setProcessValue(context, value2)
                        }
                    } else if (selected_EQ_Band == 4) {
                        if (Math.abs(mSection.knob_EQ_Band4_Gain_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band4_Gain_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band4_Gain_Value.setProcessValue(context, value2)
                        }
                    }
                }
                break
            case pages.page_EQ_Freq:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if ((EQ_Mode_running) && (selected_EQ_Param == EQ_Params.EQ_Freq)) {
                    // 5 Hz: 20..120 Hz, 10 Hz: 120..400 Hz, 20 Hz: 400..1000 Hz,
                    // 50 Hz: 1000..2500 Hz, 100 Hz: 2500..8000 Hz, 200 Hz: 8000..20000 Hz

                    var scan_value = -1
                    var scan_index = -1
                    var skip_index_list = [-1, -1, -1, -1]
                    // Depending on the EQ Band, some few frequencies of the grid that are close
                    // to the default values of the frequencies of the EQ Band cannot be used,
                    // as this would result in an automatic jump to that default value.
                    // These frequencies are skipped when the next frequency in the grid is scanned.

                    if (selected_EQ_Band == 1) {
                        if (Math.abs(mSection.knob_EQ_Band1_Freq_Value
                        .getProcessValue(context) - value) > 0.001) {
                            scan_value = Math.round(mSection.knob_EQ_Band1_Freq_Value
                            .getProcessValue(context)*1000000)/1000000
                            skip_index_list = [15, 17, 18, -1]  // 95, 105, 110 Hz
                        }
                    } else if (selected_EQ_Band == 2) {
                        if (Math.abs(mSection.knob_EQ_Band2_Freq_Value
                        .getProcessValue(context) - value) > 0.001) {
                            scan_value = Math.round(mSection.knob_EQ_Band2_Freq_Value
                            .getProcessValue(context)*1000000)/1000000
                            skip_index_list = [66, 67, 69, 70]  // 760, 780, 820, 840 Hz
                        }
                    } else if (selected_EQ_Band == 3) {
                        if (Math.abs(mSection.knob_EQ_Band3_Freq_Value
                        .getProcessValue(context) - value) > 0.001) {
                            scan_value = Math.round(mSection.knob_EQ_Band3_Freq_Value
                            .getProcessValue(context)*1000000)/1000000
                            skip_index_list = [96, 97, 99, 100]  // 1900, 1950, 2050, 2100 Hz
                        }
                    } else if (selected_EQ_Band == 4) {
                        if (Math.abs(mSection.knob_EQ_Band4_Freq_Value
                        .getProcessValue(context) - value) > 0.001) {
                            scan_value = Math.round(mSection.knob_EQ_Band4_Freq_Value
                            .getProcessValue(context)*1000000)/1000000
                            skip_index_list = [181, 182, 184, 185]  // 11600, 11800, 12200, 12400 Hz
                        }
                    }

                    if (scan_value >= 0) {
                        // Scanning in the frequency grid,
                        // depending on the direction of rotation of the knob.
                        if (knob_Direction == Direction.Direction_Right) {
                            scan_index = 0
                            while ((scan_value >= norm_frequency_grid[scan_index])
                            && (scan_index < number_of_norm_frequencies-1)) {
                                scan_index++
                            }
                            for (i = 0; i <= 3; i++) {
                                if (scan_index == skip_index_list[i]) {
                                    scan_index++
                                }
                            }
                        } else if (knob_Direction == Direction.Direction_Left) {
                            scan_index = number_of_norm_frequencies-1
                            while ((scan_value <= norm_frequency_grid[scan_index])
                            && (scan_index > 0)) {
                                scan_index--
                            }
                            for (i = 3; i >= 0; i--) {
                                if (scan_index == skip_index_list[i]) {
                                    scan_index--
                                }
                            }
                        }

                        if (scan_index >= 0) {
                            // when a suitable frequency has been found in the frequency grid
                            if (selected_EQ_Band == 1) {
                                ignore_knob_EQ_Band1_Freq_ValueChange_when_next_callback = true
                                mSection.knob_EQ_Band1_Freq_Value.setProcessValue(context,
                                    norm_frequency_grid[scan_index])
                            } else if (selected_EQ_Band == 2) {
                                ignore_knob_EQ_Band2_Freq_ValueChange_when_next_callback = true
                                mSection.knob_EQ_Band2_Freq_Value.setProcessValue(context,
                                    norm_frequency_grid[scan_index])
                            } else if (selected_EQ_Band == 3) {
                                ignore_knob_EQ_Band3_Freq_ValueChange_when_next_callback = true
                                mSection.knob_EQ_Band3_Freq_Value.setProcessValue(context,
                                    norm_frequency_grid[scan_index])
                            } else if (selected_EQ_Band == 4) {
                                ignore_knob_EQ_Band4_Freq_ValueChange_when_next_callback = true
                                mSection.knob_EQ_Band4_Freq_Value.setProcessValue(context,
                                    norm_frequency_grid[scan_index])
                            }
                        }
                    }
                }
                break
            case pages.page_EQ_Q:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if ((EQ_Mode_running) && (selected_EQ_Param == EQ_Params.EQ_Q)) {

                    // rasterization, range = 0.0 .. 12.0, step interval = 0.1
                    var value2 = value
                    var scan_value = value
                    var lower_mid = scan_value < 0.5
                    if (lower_mid) {
                        scan_value = 1 - scan_value
                    }
                    var next_threshold = 0.5075
                    var step_count = 0
                    var step_interval = (1/120)
                    while ((scan_value > next_threshold) && (step_count < 60)) {
                        step_count++
                        next_threshold = next_threshold + step_interval
                    }
                    if (lower_mid) {
                        value2 = 0.5 - (step_count/120)
                    } else {
                        value2 = 0.5 + (step_count/120)
                    }

                    if (selected_EQ_Band == 1) {
                        if (Math.abs(mSection.knob_EQ_Band1_Q_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band1_Q_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band1_Q_Value.setProcessValue(context, value2)
                        }
                    } else if (selected_EQ_Band == 2) {
                        if (Math.abs(mSection.knob_EQ_Band2_Q_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band2_Q_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band2_Q_Value.setProcessValue(context, value2)
                        }
                    } else if (selected_EQ_Band == 3) {
                        if (Math.abs(mSection.knob_EQ_Band3_Q_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band3_Q_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band3_Q_Value.setProcessValue(context, value2)
                        }
                    } else if (selected_EQ_Band == 4) {
                        if (Math.abs(mSection.knob_EQ_Band4_Q_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_EQ_Band4_Q_ValueChange_when_next_callback = true
                            mSection.knob_EQ_Band4_Q_Value.setProcessValue(context, value2)
                        }
                    }
                }
                break
            case pages.page_PF_PreGain:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if (PF_Mode_running) {
                    if (Math.abs(mSection.knob_PF_PreGain_Value
                    .getProcessValue(context) - value) > 0.001) {

                        // rasterization, range = -48 dB .. +48 dB, step interval = 0.8 dB
                        var value2 = value
                        var scan_value = value
                        var neg_gain = scan_value < 0.5
                        if (neg_gain) {
                            scan_value = 1 - scan_value
                        }
                        var next_threshold = 0.5075
                        var step_count = 0
                        var step_interval = (1/120)
                        while ((scan_value > next_threshold) && (step_count < 60)) {
                            step_count++
                            next_threshold = next_threshold + step_interval
                        }
                        if (neg_gain) {
                            value2 = 0.5 - (step_count/120)
                        } else {
                            value2 = 0.5 + (step_count/120)
                        }
                        if (value2 < (value - step_interval)) {
                            value2 = value2 + step_interval
                        }

                        ignore_knob_PF_PreGain_ValueChange_when_next_callback = true
                        mSection.knob_PF_PreGain_Value.setProcessValue(context, value2)
                    }
                }
                break
            case pages.page_PF_LCut_Freq:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if (PF_Mode_running) {
                    // 5 Hz: 20..120 Hz, 10 Hz: 120..400 Hz, 20 Hz: 400..1000 Hz,
                    // 50 Hz: 1000..2500 Hz, 100 Hz: 2500..4000 Hz, 200 Hz: 4000..8000 Hz,
                    // 400 Hz: 8000..20000 Hz

                    var scan_value = -1
                    var scan_index = -1
                    if (Math.abs(mSection.knob_PF_LCut_Freq_Value
                    .getProcessValue(context) - value) > 0.001) {
                        scan_value = Math.round(mSection.knob_PF_LCut_Freq_Value
                        .getProcessValue(context)*1000000)/1000000
                    }

                    if (scan_value >= 0) {
                        // Scanning in the frequency grid,
                        // depending on the direction of rotation of the knob.
                        if (knob_Direction == Direction.Direction_Right) {
                            scan_index = 0
                            while ((scan_value >= norm_frequency_grid[scan_index])
                            && (scan_index < number_of_norm_frequencies-1)) {
                                scan_index++
                                if (scan_index > 123) {
                                    // from 4000 Hz upwards every second index
                                    scan_index++
                                }
                            }
                        } else if (knob_Direction == Direction.Direction_Left) {
                            scan_index = number_of_norm_frequencies-1
                            while ((scan_value <= norm_frequency_grid[scan_index])
                            && (scan_index > 0)) {
                                scan_index--
                                if (scan_index > 123) {
                                    // from 4000 Hz upwards every second index
                                    scan_index--
                                }
                            }
                        }

                        if (scan_index >= 0) {
                            // when a suitable frequency has been found in the frequency grid
                            ignore_knob_PF_LCut_Freq_ValueChange_when_next_callback = true
                            mSection.knob_PF_LCut_Freq_Value.setProcessValue(context,
                                norm_frequency_grid[scan_index])
                        }
                    }
                }
                break
            case pages.page_PF_HCut_Freq:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if (PF_Mode_running) {
                    // 10 Hz: 50..200 Hz, 20 Hz: 200..800 Hz, 50 Hz: 800..2000 Hz,
                    // 100 Hz: 2000..4000 Hz, 200 Hz: 4000..8000 Hz, 400 Hz: 8000..19200 Hz,
                    // 20000 Hz

                    var scan_value = -1
                    var scan_index = -1
                    if (Math.abs(mSection.knob_PF_HCut_Freq_Value
                    .getProcessValue(context) - value) > 0.001) {
                        scan_value = Math.round(mSection.knob_PF_HCut_Freq_Value
                        .getProcessValue(context)*1000000)/1000000
                    }

                    if (scan_value >= 0) {
                        // Scanning in the frequency grid,
                        // depending on the direction of rotation of the knob.
                        if (knob_Direction == Direction.Direction_Right) {
                            scan_index = 0
                            while ((scan_value >= HCut_frequency_grid[scan_index])
                            && (scan_index < number_of_HCut_frequencies-1)) {
                                scan_index++
                            }
                        } else if (knob_Direction == Direction.Direction_Left) {
                            scan_index = number_of_HCut_frequencies-1
                            while ((scan_value <= HCut_frequency_grid[scan_index])
                            && (scan_index > 0)) {
                                scan_index--
                            }
                        }

                        if (scan_index >= 0) {
                            // when a suitable frequency has been found in the frequency grid
                            ignore_knob_PF_HCut_Freq_ValueChange_when_next_callback = true
                            mSection.knob_PF_HCut_Freq_Value.setProcessValue(context,
                                HCut_frequency_grid[scan_index])
                        }
                    }
                }
                break
            case pages.page_Send_LevelA:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if (Send_Mode_running) {
                    value = mSection.Send_Level_without_rubberband_effect(value)
                    if (selected_Send == 1) {
                        if (Math.abs(mSection.knob_Send_Level1_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level1_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level1_Value.setProcessValue(context, value)
                        }
                    } else if (selected_Send == 2) {
                        if (Math.abs(mSection.knob_Send_Level2_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level2_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level2_Value.setProcessValue(context, value)
                        }
                    } else if (selected_Send == 3) {
                        if (Math.abs(mSection.knob_Send_Level3_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level3_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level3_Value.setProcessValue(context, value)
                        }
                    } else if (selected_Send == 4) {
                        if (Math.abs(mSection.knob_Send_Level4_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level4_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level4_Value.setProcessValue(context, value)
                        }
                    }
                    if ((actual_motorfader_mode != motorfader_modes.mf_mode_off)
                    && (sync_motorfader_within_Send_Mode_to_Send_Value)) {
                        var fader_value = value
                        if (sync_0dB_to_U) {
                            fader_value = fader.calculate_sync_0dB_to_U(fader_value)
                        }
                        fader.FP_write.setProcessValue(context, fader_value)
                    }
                }
                break
            case pages.page_Send_LevelB:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if (Send_Mode_running) {
                    value = mSection.Send_Level_without_rubberband_effect(value)
                    if (selected_Send == 5) {
                        if (Math.abs(mSection.knob_Send_Level5_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level5_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level5_Value.setProcessValue(context, value)
                        }
                    } else if (selected_Send == 6) {
                        if (Math.abs(mSection.knob_Send_Level6_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level6_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level6_Value.setProcessValue(context, value)
                        }
                    } else if (selected_Send == 7) {
                        if (Math.abs(mSection.knob_Send_Level7_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level7_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level7_Value.setProcessValue(context, value)
                        }
                    } else if (selected_Send == 8) {
                        if (Math.abs(mSection.knob_Send_Level8_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_Send_Level8_ValueChange_when_next_callback = true
                            mSection.knob_Send_Level8_Value.setProcessValue(context, value)
                        }
                    }
                    if ((actual_motorfader_mode != motorfader_modes.mf_mode_off)
                    && (sync_motorfader_within_Send_Mode_to_Send_Value)) {
                        var fader_value = value
                        if (sync_0dB_to_U) {
                            fader_value = fader.calculate_sync_0dB_to_U(fader_value)
                        }
                        fader.FP_write.setProcessValue(context, fader_value)
                    }
                }
                break
            case pages.page_CueSend_Level:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if (CueSend_Mode_running) {
                    value = mSection.Send_Level_without_rubberband_effect(value)
                    if (selected_CueSend == 1) {
                        if (Math.abs(mSection.knob_CueSend_Level1_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_CueSend_Level1_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Level1_Value.setProcessValue(context, value)
                        }
                    } else if (selected_CueSend == 2) {
                        if (Math.abs(mSection.knob_CueSend_Level2_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_CueSend_Level2_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Level2_Value.setProcessValue(context, value)
                        }
                    } else if (selected_CueSend == 3) {
                        if (Math.abs(mSection.knob_CueSend_Level3_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_CueSend_Level3_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Level3_Value.setProcessValue(context, value)
                        }
                    } else if (selected_CueSend == 4) {
                        if (Math.abs(mSection.knob_CueSend_Level4_Value
                        .getProcessValue(context) - value) > 0.0001) {
                            ignore_knob_CueSend_Level4_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Level4_Value.setProcessValue(context, value)
                        }
                    }
                }
                break
            case pages.page_CueSend_Pan:
                // nameless tracks (marker tracks, etc.) or elements do not support this parameter
                if (ActualTrack == '') {
                    return
                }
                if (CueSend_Mode_running) {
                    if ((value > 0.495) && (value < 0.505)) {
                        value = 0.5
                    }
                    if (selected_CueSend == 1) {
                        if (Math.abs(mSection.knob_CueSend_Pan1_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_CueSend_Pan1_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Pan1_Value.setProcessValue(context, value)
                        }
                    } else if (selected_CueSend == 2) {
                        if (Math.abs(mSection.knob_CueSend_Pan2_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_CueSend_Pan2_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Pan2_Value.setProcessValue(context, value)
                        }
                    } else if (selected_CueSend == 3) {
                        if (Math.abs(mSection.knob_CueSend_Pan3_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_CueSend_Pan3_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Pan3_Value.setProcessValue(context, value)
                        }
                    } else if (selected_CueSend == 4) {
                        if (Math.abs(mSection.knob_CueSend_Pan4_Value
                        .getProcessValue(context) - value) > 0.001) {
                            ignore_knob_CueSend_Pan4_ValueChange_when_next_callback = true
                            mSection.knob_CueSend_Pan4_Value.setProcessValue(context, value)
                        }
                    }
                }
                break
            case pages.page_QC1:
            case pages.page_QC2:
            case pages.page_QC3:
            case pages.page_QC4:
            case pages.page_QC5:
            case pages.page_QC6:
            case pages.page_QC7:
            case pages.page_QC8:
                if ((!btn_Prev_running) && (!btn_Next_running)
                && (!low_resolution_QC_Mode_locked) && (!high_resolution_QC_Mode_locked)) {
                    // normal resolution QC Mode
                    switch (active_page) {
                        case pages.page_QC1:
                            if (Math.abs(mSection.knob_QC1_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC1_ValueChange_when_next_callback = true
                                mSection.knob_QC1_Value.setProcessValue(context, value)
                            }
                            break
                        case pages.page_QC2:
                            if (Math.abs(mSection.knob_QC2_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC2_ValueChange_when_next_callback = true
                                mSection.knob_QC2_Value.setProcessValue(context, value)
                            }
                            break
                        case pages.page_QC3:
                            if (Math.abs(mSection.knob_QC3_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC3_ValueChange_when_next_callback = true
                                mSection.knob_QC3_Value.setProcessValue(context, value)
                            }
                            break
                        case pages.page_QC4:
                            if (Math.abs(mSection.knob_QC4_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC4_ValueChange_when_next_callback = true
                                mSection.knob_QC4_Value.setProcessValue(context, value)
                            }
                            break
                        case pages.page_QC5:
                            if (Math.abs(mSection.knob_QC5_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC5_ValueChange_when_next_callback = true
                                mSection.knob_QC5_Value.setProcessValue(context, value)
                            }
                            break
                        case pages.page_QC6:
                            if (Math.abs(mSection.knob_QC6_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC6_ValueChange_when_next_callback = true
                                mSection.knob_QC6_Value.setProcessValue(context, value)
                            }
                            break
                        case pages.page_QC7:
                            if (Math.abs(mSection.knob_QC7_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC7_ValueChange_when_next_callback = true
                                mSection.knob_QC7_Value.setProcessValue(context, value)
                            }
                            break
                        case pages.page_QC8:
                            if (Math.abs(mSection.knob_QC8_Value
                            .getProcessValue(context) - value) > 0.001) {
                                ignore_knob_QC8_ValueChange_when_next_callback = true
                                mSection.knob_QC8_Value.setProcessValue(context, value)
                            }
                            break
                    }
                } else { // low resolution or high resolution QC Mode
                    var old_value = 0.0
                    switch (active_page) {
                        case pages.page_QC1:
                            old_value = mSection.knob_QC1_Value.getProcessValue(context)
                            break
                        case pages.page_QC2:
                            old_value = mSection.knob_QC2_Value.getProcessValue(context)
                            break
                        case pages.page_QC3:
                            old_value = mSection.knob_QC3_Value.getProcessValue(context)
                            break
                        case pages.page_QC4:
                            old_value = mSection.knob_QC4_Value.getProcessValue(context)
                            break
                        case pages.page_QC5:
                            old_value = mSection.knob_QC5_Value.getProcessValue(context)
                            break
                        case pages.page_QC6:
                            old_value = mSection.knob_QC6_Value.getProcessValue(context)
                            break
                        case pages.page_QC7:
                            old_value = mSection.knob_QC7_Value.getProcessValue(context)
                            break
                        case pages.page_QC8:
                            old_value = mSection.knob_QC8_Value.getProcessValue(context)
                            break
                    }

                    if (Math.abs(value - old_value) > 0.0001) {
                        if (btn_Prev_running) {
                            set_low_resolution_QC_Mode_with_Prev = true
                        } else if (btn_Next_running) {
                            set_high_resolution_QC_Mode_with_Next = true
                        }

                        var value2 = old_value
                        if ((btn_Prev_running)
                        || ((!btn_Next_running) && (low_resolution_QC_Mode_locked))) {
                            // when the Prev Button is pressed down,
                            // perform the QC Mode with low resolution
                            step_interval = (1 / low_resolution_steps)
                            value2 = Math.round(value2*low_resolution_steps)/low_resolution_steps
                        } else if ((btn_Next_running)
                        || ((!btn_Prev_running) && (high_resolution_QC_Mode_locked))) {
                            // when the Next Button is pressed down,
                            // perform the QC Mode with high resolution
                            step_interval = (1 / high_resolution_steps)
                            value2 = Math.round(value2*high_resolution_steps)/high_resolution_steps
                        }

                        if (knob_Direction == Direction.Direction_Right) {
                            value2 = value2 + step_interval
                            if (value2 > 1) {
                                value2 = 1
                            }
                        } else if (knob_Direction == Direction.Direction_Left) {
                            value2 = value2 - step_interval
                            if (value2 < 0) {
                                value2 = 0
                            }
                        }

                        if (Math.abs(old_value - value2) > 0.0001) {
                            switch (active_page) {
                                case pages.page_QC1:
                                    ignore_knob_QC1_ValueChange_when_next_callback = true
                                    mSection.knob_QC1_Value.setProcessValue(context, value2)
                                    break
                                case pages.page_QC2:
                                    ignore_knob_QC2_ValueChange_when_next_callback = true
                                    mSection.knob_QC2_Value.setProcessValue(context, value2)
                                    break
                                case pages.page_QC3:
                                    ignore_knob_QC3_ValueChange_when_next_callback = true
                                    mSection.knob_QC3_Value.setProcessValue(context, value2)
                                    break
                                case pages.page_QC4:
                                    ignore_knob_QC4_ValueChange_when_next_callback = true
                                    mSection.knob_QC4_Value.setProcessValue(context, value2)
                                    break
                                case pages.page_QC5:
                                    ignore_knob_QC5_ValueChange_when_next_callback = true
                                    mSection.knob_QC5_Value.setProcessValue(context, value2)
                                    break
                                case pages.page_QC6:
                                    ignore_knob_QC6_ValueChange_when_next_callback = true
                                    mSection.knob_QC6_Value.setProcessValue(context, value2)
                                    break
                                case pages.page_QC7:
                                    ignore_knob_QC7_ValueChange_when_next_callback = true
                                    mSection.knob_QC7_Value.setProcessValue(context, value2)
                                    break
                                case pages.page_QC8:
                                    ignore_knob_QC8_ValueChange_when_next_callback = true
                                    mSection.knob_QC8_Value.setProcessValue(context, value2)
                                    break
                            }
                        }
                    }
                }
                break
            case pages.page_Audio_Volume:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_Volume_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_Volume_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Audio_FadeIn:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_FadeIn_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_FadeIn_Right.setProcessValue(context, 1)
                }
                break
            case pages.page_Audio_FadeOut:
                if (knob_Direction == Direction.Direction_Left) {
                    mSection.knob_FadeOut_Left.setProcessValue(context, 1)
                } else if (knob_Direction == Direction.Direction_Right) {
                    mSection.knob_FadeOut_Right.setProcessValue(context, 1)
                }
                break
        }
    }

    var start_onLEDs_for_QC8_after_180ms = new Date().getTime()

    mSection.var_onLEDs_for_QC8_after_180ms.mOnProcessValueChange = function(context, value) {
        if (value != 0) {
            var time_now = new Date().getTime()
            if (time_now < start_onLEDs_for_QC8_after_180ms + 180) {
                mSection.var_onLEDs_for_QC8_after_180ms.setProcessValue(context, 1)
            } else {
                for (i = 1; i <= 7; i++) {
                    onLED(context, mLED_code(i))
                }
                flashingLED(context, cMarker)
                mSection.var_onLEDs_for_QC8_after_180ms.setProcessValue(context, 0)
            }
        }
    }

    mSection.btn_Prev.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        btn_Prev_running = value

        if (active_page != pages.page_Lock) {
            // in case that the AI Mode was closed while the Prev Button is pressed down
            set_low_resolution_AI_Mode_with_Prev = false
            lock_low_resolution_AI_Mode_with_Prev = false
            set_min_value_AI_Mode_with_Prev = false
        }

        if (!QC_Mode_running) {
            // in case that the QC Mode was closed while the Prev Button is pressed down
            set_low_resolution_QC_Mode_with_Prev = false
            lock_low_resolution_QC_Mode_with_Prev = false
            set_min_value_QC_Mode_with_Prev = false
        }

        if (wait_until_Prev_Button_is_released) {
            wait_until_Prev_Button_is_released = false
            offLED(context, cPrev)
            return
        }
        if (wait_until_Next_Button_is_released) {
            return
        }

        // unlock FaderPort if Prev Button and Next Button are pressed together
        if ((FP_locked) && (value) && (btn_Next_running)) {
            uSection.VUMeter_Initialize(context)
            midiBinding_uSection()
            midiBinding_mSection()
            if (!((QC_Mode_running) && (actual_motorfader_mode == motorfader_modes.mf_mode_QCx))) {
                // Ignore movements of the motorfader while the entire FaderPort was locked.
                fader.FP_write.setProcessValue(context, FP_last_write_value)
            }
            FP_locked = false
            offLED(context, cPrev)
            offLED(context, cNext)
            wait_until_Touch_Button_is_released = false
            wait_until_Prev_Button_is_released = true
            wait_until_Next_Button_is_released = true
            uSection.VUMeter_Initialize(context)
            return

        } else if (FP_locked) {
            return
        }

        if (Custom_Mode_running)
            return

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_set_left_selSide_to_cursor = true
                mSection.var_left_selSide_to_cursor.setProcessValue(context, 1)
            }
            return
        }

        if (btn_Touch_running_fixed) {
            if (value) {

                // If the current page controls a parameter that can be changed with the volume_grid
                // and a doubleclick was made with the Touch Button, reduce that parameter.

                if ((btn_Touch_running_doubleclick) && ((active_page == pages.page_Master)
                || (active_page == pages.page_Send_LevelA) || (active_page == pages.page_Send_LevelB)
                || (active_page == pages.page_CueSend_Level))) {

                    if (active_page == pages.page_Master) {
                        ignore_knob_CRLevel_ValueChange_when_next_callback = true
                        mSection.knob_CRLevel_Value
                            .setProcessValue(context, prev_volume_grid_value(
                            mSection.knob_CRLevel_Value.getProcessValue(context)))

                    } else if ((active_page == pages.page_Send_LevelA)
                    || (active_page == pages.page_Send_LevelB)) {
                        var prev_value = 0
                        switch (selected_Send) {
                            case 1:
                                ignore_knob_Send_Level1_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level1_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level1_Value.setProcessValue(context, prev_value)
                                break
                            case 2:
                                ignore_knob_Send_Level2_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level2_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level2_Value.setProcessValue(context, prev_value)
                                break
                            case 3:
                                ignore_knob_Send_Level3_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level3_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level3_Value.setProcessValue(context, prev_value)
                                break
                            case 4:
                                ignore_knob_Send_Level4_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level4_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level4_Value.setProcessValue(context, prev_value)
                                break
                            case 5:
                                ignore_knob_Send_Level5_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level5_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level5_Value.setProcessValue(context, prev_value)
                                break
                            case 6:
                                ignore_knob_Send_Level6_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level6_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level6_Value.setProcessValue(context, prev_value)
                                break
                            case 7:
                                ignore_knob_Send_Level7_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level7_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level7_Value.setProcessValue(context, prev_value)
                                break
                            case 8:
                                ignore_knob_Send_Level8_ValueChange_when_next_callback = true
                                prev_value = prev_volume_grid_value(mSection.knob_Send_Level8_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level8_Value.setProcessValue(context, prev_value)
                                break
                        }
                        if (actual_motorfader_mode != motorfader_modes.mf_mode_off) {
                            var fader_value = prev_value
                            if (sync_0dB_to_U) {
                                fader_value = fader.calculate_sync_0dB_to_U(fader_value)
                            }
                            fader.FP_write.setProcessValue(context, fader_value)
                        }

                    } else if (active_page == pages.page_CueSend_Level) {
                        switch (selected_CueSend) {
                            case 1:
                                ignore_knob_CueSend_Level1_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level1_Value
                                    .setProcessValue(context, prev_volume_grid_value(
                                     mSection.knob_CueSend_Level1_Value.getProcessValue(context)))
                                break
                            case 2:
                                ignore_knob_CueSend_Level2_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level2_Value
                                    .setProcessValue(context, prev_volume_grid_value(
                                     mSection.knob_CueSend_Level2_Value.getProcessValue(context)))
                                break
                            case 3:
                                ignore_knob_CueSend_Level3_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level3_Value
                                    .setProcessValue(context, prev_volume_grid_value(
                                     mSection.knob_CueSend_Level3_Value.getProcessValue(context)))
                                break
                            case 4:
                                ignore_knob_CueSend_Level4_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level4_Value
                                    .setProcessValue(context, prev_volume_grid_value(
                                     mSection.knob_CueSend_Level4_Value.getProcessValue(context)))
                                break
                        }
                    }
                    return
                }

                // Otherwise, search for next lower value in volume grid.

                if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                || (Send_Mode_running) || (CueSend_Mode_running)
                || ((QC_Mode_running) && (!fader_is_set_to_volume)) || (Audio_Mode_running)) {

                    uSection.var_Volume.setProcessValue(context, prev_volume_grid_value(
                        uSection.var_Volume.getProcessValue(context)))
                    return
                }
            }
        }

        if ((active_page == pages.page_Lock)
        && ((btn_Cycle_running == false) && (btn_Stop_running == false))) {
            if (value == 0) {
                if (set_low_resolution_AI_Mode_with_Prev) {
                    set_low_resolution_AI_Mode_with_Prev = false
                    lock_low_resolution_AI_Mode_with_Prev = false
                    set_min_value_AI_Mode_with_Prev = false
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_ValueUnderMouse_Value.getProcessValue(context))
                } else if (lock_low_resolution_AI_Mode_with_Prev) {
                    lock_low_resolution_AI_Mode_with_Prev = false
                    set_min_value_AI_Mode_with_Prev = false
                } else if (set_min_value_AI_Mode_with_Prev) {
                    set_min_value_AI_Mode_with_Prev = false
                } else {
                    // when the Prev Button was pressed alone
                    mSection.var_PrevTrack.setProcessValue(context, 1)
                }
                if (low_resolution_AI_Mode_locked) {
                    flashingLED(context, cPrev)
                } else {
                    offLED(context, cPrev)
                }
            } else {
                onLED(context, cPrev)
            }
            return
        }

        if (((QC_Mode_running) && (active_page == pages.page_QC8)
        && (value) && (btn_Next_running))
        && ((btn_Cycle_running == false) && (btn_Stop_running == false))) {

            // total recall of all Quick Controls
            mSection.knob_QC1_Value.setProcessValue(context,recall_QCs[0])
            mSection.knob_QC2_Value.setProcessValue(context,recall_QCs[1])
            mSection.knob_QC3_Value.setProcessValue(context,recall_QCs[2])
            mSection.knob_QC4_Value.setProcessValue(context,recall_QCs[3])
            mSection.knob_QC5_Value.setProcessValue(context,recall_QCs[4])
            mSection.knob_QC6_Value.setProcessValue(context,recall_QCs[5])
            mSection.knob_QC7_Value.setProcessValue(context,recall_QCs[6])
            mSection.knob_QC8_Value.setProcessValue(context,recall_QCs[7])

            wait_until_Prev_Button_is_released = true
            wait_until_Next_Button_is_released = true
            onLED(context, cPrev)
            onLED(context, cNext)

            for (i = 1; i <= 8; i++) {
                offLED(context, mLED_code(i))
            }
            start_onLEDs_for_QC8_after_180ms = new Date().getTime()
            mSection.var_onLEDs_for_QC8_after_180ms.setProcessValue(context, 1)

            return
        }

        if ((QC_Mode_running)
        && ((btn_Cycle_running == false) && (btn_Stop_running == false))) {
            if (value == 0) {
                if (set_low_resolution_QC_Mode_with_Prev) {
                    set_low_resolution_QC_Mode_with_Prev = false
                    lock_low_resolution_QC_Mode_with_Prev = false
                    set_min_value_QC_Mode_with_Prev = false
                    switch (active_page) {
                        case pages.page_QC1:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC1_Value.getProcessValue(context))
                            break
                        case pages.page_QC2:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC2_Value.getProcessValue(context))
                            break
                        case pages.page_QC3:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC3_Value.getProcessValue(context))
                            break
                        case pages.page_QC4:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC4_Value.getProcessValue(context))
                            break
                        case pages.page_QC5:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC5_Value.getProcessValue(context))
                            break
                        case pages.page_QC6:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC6_Value.getProcessValue(context))
                            break
                        case pages.page_QC7:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC7_Value.getProcessValue(context))
                            break
                        case pages.page_QC8:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC8_Value.getProcessValue(context))
                            break
                    }
                } else if (lock_low_resolution_QC_Mode_with_Prev) {
                    lock_low_resolution_QC_Mode_with_Prev = false
                    set_min_value_QC_Mode_with_Prev = false
                } else if (set_min_value_QC_Mode_with_Prev) {
                    set_min_value_QC_Mode_with_Prev = false
                } else {
                    // when the Prev Button was pressed alone
                    if (active_page == pages.page_QC8) {
                        mSection.var_show_hide_plugins.setProcessValue(context, 1)
                    } else {
                        mSection.var_PrevTrack.setProcessValue(context, 1)
                    }
                }
                if (low_resolution_QC_Mode_locked) {
                    flashingLED(context, cPrev)
                } else {
                    offLED(context, cPrev)
                }
            } else {
                onLED(context, cPrev)
            }
            return
        }

        if (value) {
            // when the Prev Button is pressed down
            onLED(context, cPrev)

            if (btn_Cycle_running) {
                global_undo_redo_done = true
                mSection.var_global_undo.setProcessValue(context, 1)
                return
            }

            if (btn_Stop_running) {
                // when a complete check all tracks loop has been performed
                if (number_of_Tracks > 0) {
                    // to first track
                    mSection.select_QuickTrack(context, 0)
                }
                return
            }

            if ((active_page != pages.page_Zoom) && (active_page != pages.page_QC8)) {
                // execute actual assigned standard function for the Prev Button
                mSection.var_Prev.setProcessValue(context, 1)
                if (debug_2)
                    console.log('060) btn_Prev - button processed, value = true')
            } else {
                // if Zoom Mode is active and Button Prev is pressed down
                // change Rotate Knob Rotating to vertical zoom to for selected tracks
                pageShift.makeCommandBinding(mSection.knob_Zoom_Left,
                    'Zoom', 'Zoom Out Tracks').setSubPage(SubPage_Zoom)
                pageShift.makeCommandBinding(mSection.knob_Zoom_Right,
                    'Zoom', 'Zoom In Tracks').setSubPage(SubPage_Zoom)

                mSection.var_ActivateZoom.setProcessValue(context, 1)
                knob_was_rotated_within_Zoom_Mode = false
            }

        } else if ((btn_Cycle_running == false) && (btn_Stop_running == false)) {
            // when the Prev Button is released
            if (active_page == pages.page_QC8) {
                // execute actual assigned standard function for the Prev Button
                // when releasing the Prev Button, as a function for pressing
                // both Buttons (Prev + Next) is implemented
                mSection.var_Prev.setProcessValue(context, 1)
                if (debug_2)
                    console.log('061) btn_Prev - button processed, value = false')
            }
            if (active_page == pages.page_Zoom) {
                // if Zoom Mode is active and Button Prev is released
                // change Rotate Knob rotating back to horizontal zoom
                pageShift.makeCommandBinding(mSection.knob_Zoom_Left,
                    'Zoom', 'Zoom Out').setSubPage(SubPage_Zoom)
                pageShift.makeCommandBinding(mSection.knob_Zoom_Right,
                    'Zoom', 'Zoom In').setSubPage(SubPage_Zoom)

                mSection.var_ActivateZoom.setProcessValue(context, 1)
            }
            // perform vertical zoom only when the Button Prev is released,
            // as there are two functions in doing so
            if (active_page == pages.page_Zoom) {
                if (VerticalZoomOutOfWaveform_done) {
                    VerticalZoomOutOfWaveform_done = false
                } else {
                    if (knob_was_rotated_within_Zoom_Mode == false) {
                        // execute standard vertical zoom out
                        // if Rotate Knob was not rotated
                        mSection.var_Prev.setProcessValue(context, 1)
                    } else {
                        knob_was_rotated_within_Zoom_Mode = false
                    }
                }
            }
            offLED(context, cPrev)

        } else {
            // when the Prev Button is released and btn_Cycle_running or btn_Stop_running
            offLED(context, cPrev)
        }
    }

    mSection.btn_Next.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        btn_Next_running = value

        if (active_page != pages.page_Lock) {
            // in case that the AI Mode was closed while the Next Button is pressed down
            set_high_resolution_AI_Mode_with_Next = false
            lock_high_resolution_AI_Mode_with_Next = false
            set_max_value_AI_Mode_with_Next = false
        }

        if (!QC_Mode_running) {
            // in case that the QC Mode was closed while the Next Button is pressed down
            set_high_resolution_QC_Mode_with_Next = false
            lock_high_resolution_QC_Mode_with_Next = false
            set_max_value_QC_Mode_with_Next = false
        }

        if (wait_until_Next_Button_is_released) {
            wait_until_Next_Button_is_released = false
            offLED(context, cNext)
            return
        }
        if (wait_until_Prev_Button_is_released) {
            return
        }

        // unlock FaderPort if Prev Button and Next Button are pressed together
        if ((FP_locked) && (value) && (btn_Prev_running)) {
            uSection.VUMeter_Initialize(context)
            midiBinding_uSection()
            midiBinding_mSection()
            if (!((QC_Mode_running) && (actual_motorfader_mode == motorfader_modes.mf_mode_QCx))) {
                // Ignore movements of the motorfader while the entire FaderPort was locked.
                fader.FP_write.setProcessValue(context, FP_last_write_value)
            }
            FP_locked = false
            offLED(context, cPrev)
            offLED(context, cNext)
            wait_until_Touch_Button_is_released = false
            wait_until_Prev_Button_is_released = true
            wait_until_Next_Button_is_released = true
            uSection.VUMeter_Initialize(context)
            return
        } else if (FP_locked) {
            return
        }

        if (Custom_Mode_running)
            return

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_set_right_selSide_to_cursor = true
                mSection.var_right_selSide_to_cursor.setProcessValue(context, 1)
            }
            return
        }

        if (btn_Touch_running_fixed) {
            if (value) {

                // If the current page controls a parameter that can be changed with the volume_grid
                // and a doubleclick was made with the Touch Button, increase that parameter.

                if ((btn_Touch_running_doubleclick) && ((active_page == pages.page_Master)
                || (active_page == pages.page_Send_LevelA) || (active_page == pages.page_Send_LevelB)
                || (active_page == pages.page_CueSend_Level))) {

                    if (active_page == pages.page_Master) {
                        ignore_knob_CRLevel_ValueChange_when_next_callback = true
                        mSection.knob_CRLevel_Value
                            .setProcessValue(context, next_volume_grid_value(
                            mSection.knob_CRLevel_Value.getProcessValue(context)))

                    } else if ((active_page == pages.page_Send_LevelA)
                    || (active_page == pages.page_Send_LevelB)) {
                        var next_value = 0
                        switch (selected_Send) {
                            case 1:
                                ignore_knob_Send_Level1_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level1_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level1_Value.setProcessValue(context, next_value)
                                break
                            case 2:
                                ignore_knob_Send_Level2_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level2_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level2_Value.setProcessValue(context, next_value)
                                break
                            case 3:
                                ignore_knob_Send_Level3_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level3_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level3_Value.setProcessValue(context, next_value)
                                break
                            case 4:
                                ignore_knob_Send_Level4_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level4_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level4_Value.setProcessValue(context, next_value)
                                break
                            case 5:
                                ignore_knob_Send_Level5_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level5_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level5_Value.setProcessValue(context, next_value)
                                break
                            case 6:
                                ignore_knob_Send_Level6_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level6_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level6_Value.setProcessValue(context, next_value)
                                break
                            case 7:
                                ignore_knob_Send_Level7_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level7_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level7_Value.setProcessValue(context, next_value)
                                break
                            case 8:
                                ignore_knob_Send_Level8_ValueChange_when_next_callback = true
                                next_value = next_volume_grid_value(mSection.knob_Send_Level8_Value
                                    .getProcessValue(context))
                                mSection.knob_Send_Level8_Value.setProcessValue(context, next_value)
                                break
                        }
                        if (actual_motorfader_mode != motorfader_modes.mf_mode_off) {
                            var fader_value = next_value
                            if (sync_0dB_to_U) {
                                fader_value = fader.calculate_sync_0dB_to_U(fader_value)
                            }
                            fader.FP_write.setProcessValue(context, fader_value)
                        }

                    } else if (active_page == pages.page_CueSend_Level) {
                        switch (selected_CueSend) {
                            case 1:
                                ignore_knob_CueSend_Level1_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level1_Value
                                    .setProcessValue(context, next_volume_grid_value(
                                     mSection.knob_CueSend_Level1_Value.getProcessValue(context)))
                                break
                            case 2:
                                ignore_knob_CueSend_Level2_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level2_Value
                                    .setProcessValue(context, next_volume_grid_value(
                                     mSection.knob_CueSend_Level2_Value.getProcessValue(context)))
                                break
                            case 3:
                                ignore_knob_CueSend_Level3_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level3_Value
                                    .setProcessValue(context, next_volume_grid_value(
                                     mSection.knob_CueSend_Level3_Value.getProcessValue(context)))
                                break
                            case 4:
                                ignore_knob_CueSend_Level4_ValueChange_when_next_callback = true
                                mSection.knob_CueSend_Level4_Value
                                    .setProcessValue(context, next_volume_grid_value(
                                     mSection.knob_CueSend_Level4_Value.getProcessValue(context)))
                                break
                        }
                    }
                    return
                }

                // otherwise, search for next higher value in volume grid

                if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                || (Send_Mode_running) || (CueSend_Mode_running)
                || ((QC_Mode_running) && (!fader_is_set_to_volume)) || (Audio_Mode_running)) {

                    uSection.var_Volume.setProcessValue(context, next_volume_grid_value(
                        uSection.var_Volume.getProcessValue(context)))
                    return
                }
            }
        }

        if ((active_page == pages.page_Lock)
        && ((btn_Cycle_running == false) && (btn_Stop_running == false))) {
            if (value == 0) {
                if (set_high_resolution_AI_Mode_with_Next) {
                    set_high_resolution_AI_Mode_with_Next = false
                    lock_high_resolution_AI_Mode_with_Next = false
                    set_max_value_AI_Mode_with_Next = false
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_ValueUnderMouse_Value.getProcessValue(context))
                } else if (lock_high_resolution_AI_Mode_with_Next) {
                    lock_high_resolution_AI_Mode_with_Next = false
                    set_max_value_AI_Mode_with_Next = false
                } else if (set_max_value_AI_Mode_with_Next) {
                    set_max_value_AI_Mode_with_Next = false
                } else {
                    // when the Next Button was pressed alone
                    mSection.var_NextTrack.setProcessValue(context, 1)
                }
                if (high_resolution_AI_Mode_locked) {
                    flashingLED(context, cNext)
                } else {
                    offLED(context, cNext)
                }
            } else {
                onLED(context, cNext)
            }
            return
        }

        if (((QC_Mode_running) && (active_page == pages.page_QC8)
        && (value) && (btn_Prev_running))
        && ((btn_Cycle_running == false) && (btn_Stop_running == false))) {

            // total recall of all Quick Controls
            mSection.knob_QC1_Value.setProcessValue(context,recall_QCs[0])
            mSection.knob_QC2_Value.setProcessValue(context,recall_QCs[1])
            mSection.knob_QC3_Value.setProcessValue(context,recall_QCs[2])
            mSection.knob_QC4_Value.setProcessValue(context,recall_QCs[3])
            mSection.knob_QC5_Value.setProcessValue(context,recall_QCs[4])
            mSection.knob_QC6_Value.setProcessValue(context,recall_QCs[5])
            mSection.knob_QC7_Value.setProcessValue(context,recall_QCs[6])
            mSection.knob_QC8_Value.setProcessValue(context,recall_QCs[7])

            wait_until_Prev_Button_is_released = true
            wait_until_Next_Button_is_released = true
            onLED(context, cPrev)
            onLED(context, cNext)

            for (i = 1; i <= 8; i++) {
                offLED(context, mLED_code(i))
            }
            start_onLEDs_for_QC8_after_180ms = new Date().getTime()
            mSection.var_onLEDs_for_QC8_after_180ms.setProcessValue(context, 1)

            return
        }

        if ((QC_Mode_running)
        && ((btn_Cycle_running == false) && (btn_Stop_running == false))) {
            if (value == 0) {
                if (set_high_resolution_QC_Mode_with_Next) {
                    set_high_resolution_QC_Mode_with_Next = false
                    lock_high_resolution_QC_Mode_with_Next = false
                    set_max_value_QC_Mode_with_Next = false
                    switch (active_page) {
                        case pages.page_QC1:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC1_Value.getProcessValue(context))
                            break
                        case pages.page_QC2:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC2_Value.getProcessValue(context))
                            break
                        case pages.page_QC3:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC3_Value.getProcessValue(context))
                            break
                        case pages.page_QC4:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC4_Value.getProcessValue(context))
                            break
                        case pages.page_QC5:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC5_Value.getProcessValue(context))
                            break
                        case pages.page_QC6:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC6_Value.getProcessValue(context))
                            break
                        case pages.page_QC7:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC7_Value.getProcessValue(context))
                            break
                        case pages.page_QC8:
                            mSection.knob_FP_Value.setProcessValue(context,
                                mSection.knob_QC8_Value.getProcessValue(context))
                            break
                    }
                } else if (lock_high_resolution_QC_Mode_with_Next) {
                    lock_high_resolution_QC_Mode_with_Next = false
                    set_max_value_QC_Mode_with_Next = false
                } else if (set_max_value_QC_Mode_with_Next) {
                    set_max_value_QC_Mode_with_Next = false
                } else {
                    // when the Next Button was pressed alone
                    if (active_page == pages.page_QC8) {
                        mSection.var_select_next_plugin_window.setProcessValue(context, 1)
                    } else {
                        mSection.var_NextTrack.setProcessValue(context, 1)
                    }
                }
                if (high_resolution_QC_Mode_locked) {
                    flashingLED(context, cNext)
                } else {
                    offLED(context, cNext)
                }
            } else {
                onLED(context, cNext)
            }
            return
        }

        if (value) {
            // when the Next Button is pressed down
            onLED(context, cNext)

            if (btn_Cycle_running) {
                global_undo_redo_done = true
                mSection.var_global_redo.setProcessValue(context, 1)
                return
            }

            if (btn_Stop_running) {
                // when a complete check all tracks loop has been performed
                if (number_of_Tracks > 0) {
                    // to last track
                    mSection.select_QuickTrack(context, 5)
                }
                return
            }

            if ((active_page != pages.page_Zoom) && (active_page != pages.page_QC8)) {
                // execute actual assigned standard function for the Next Button
                mSection.var_Next.setProcessValue(context, 1)
                if (debug_2)
                    console.log('062) btn_Next - button processed, value = true')
            } else {
                // if Zoom Mode is active and Button Next is pressed down
                // change Rotate Knob rotating to vertical zoom to for selected tracks
                pageShift.makeCommandBinding(mSection.knob_Zoom_Left,
                    'Zoom', 'Zoom Out Tracks').setSubPage(SubPage_Zoom)
                pageShift.makeCommandBinding(mSection.knob_Zoom_Right,
                    'Zoom', 'Zoom In Tracks').setSubPage(SubPage_Zoom)

                mSection.var_ActivateZoom.setProcessValue(context, 1)
                knob_was_rotated_within_Zoom_Mode = false
            }

        } else if ((btn_Cycle_running == false) && (btn_Stop_running == false)) {
            // when the Next Button is released
            if (active_page == pages.page_QC8) {
                // execute actual assigned standard function for the Next Button
                // when releasing the Next Button, as a function for pressing
                // both Buttons (Prev + Next) is implemented
                mSection.var_Next.setProcessValue(context, 1)
                if (debug_2)
                    console.log('063) btn_Next - button processed, value = false')
            }
            if (active_page == pages.page_Zoom) {
                // if Zoom Mode is active and Button Next is released
                // change Rotate Knob rotating back to horizontal zoom
                pageShift.makeCommandBinding(mSection.knob_Zoom_Left,
                    'Zoom', 'Zoom Out').setSubPage(SubPage_Zoom)
                pageShift.makeCommandBinding(mSection.knob_Zoom_Right,
                    'Zoom', 'Zoom In').setSubPage(SubPage_Zoom)

                mSection.var_ActivateZoom.setProcessValue(context, 1)
            }
            // perform vertical zoom only when the Next Button is released,
            // as there are two functions in doing so
            if (active_page == pages.page_Zoom) {
                if (VerticalZoomInOnWaveform_done) {
                    VerticalZoomInOnWaveform_done = false
                } else {
                    if (knob_was_rotated_within_Zoom_Mode == false) {
                        // execute standard vertical zoom in
                        // if Rotate Knob was not rotated
                        mSection.var_Next.setProcessValue(context, 1)
                    } else {
                        knob_was_rotated_within_Zoom_Mode = false
                    }
                }
            }
            offLED(context, cNext)

        } else {
            // when the Next Button is released and btn_Cycle_running or btn_Stop_running
            offLED(context, cNext)
        }
    }

    toggle_monitor_state = function(context) {
        if (mSection.var_MonitorEnable.getProcessValue(context)) {
            // toggle monitor state to off
            listen_or_monitor_state_was_set_to_on = false
        } else {
            // toggle monitor state to on
            listen_or_monitor_state_was_set_to_on = true
        }
        mSection.var_MonitorEnableCmd.setProcessValue(context, 1)
    }

    toggle_monitor_state_when_knob_Press = function(context, value) {
        if (value) {
            toggle_monitor_state(context)
            uSection.set_Link_LED_when_Bypass_Solo_Mute(context, 2)
        } else {
            uSection.restore_Link_LED_after_Bypass_Solo_Mute(context)
        }
    }

    // Update Hardware...
    mSection.knob_Press.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (FP_locked) {
            return
        } else if ((value) && ((btn_Touch_running_while_clear)
        || ((btn_Touch_running_fixed) && ((Send_Mode_running) || (CueSend_Mode_running)
        || (QC_Mode_running) || (Audio_Mode_running))))) {

            if ((btn_Touch_running_fixed) && (QC_Mode_running)) {
                lock_FP_within_QC_Mode = true
            }

            // lock FaderPort if Touch Button and Rotate Knob are pressed together
            FP_locked = true
            uSection.VUMeter_Initialize(context)

            // assign Buttons of Upper Section to non-occurring midi command to disable them,
            // but not for Touch Button
            uSection.btn_Solo.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            uSection.btn_Mute.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            uSection.btn_Arm.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            uSection.btn_Shift.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            uSection.btn_Bypass.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            uSection.btn_Write.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            uSection.btn_Read.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)

            // assign Buttons of Middle Section to non-occurring midi command to disable them,
            // but not for Prev Button and not for Next Button
            mSection.btn_Link.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            mSection.btn_Pan.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            mSection.btn_Channel.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            mSection.btn_Scroll.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            mSection.btn_Master.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            mSection.btn_Click.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            mSection.btn_Section.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)
            mSection.btn_Marker.mSurfaceValue
                .mMidiBinding.setInputPort(midiIn).bindToNote(0, 0x7F)

            flashingLED(context, cPrev)
            flashingLED(context, cNext)
            return
        }

        if (Custom_Mode_running) {
            return
        }

        if (btn_Bypass_running) {
            if (value) {
                knob_was_pressed_while_btn_Bypass_running = true
                Scroll_Mode_per_frame = !Scroll_Mode_per_frame
                if (active_page == pages.page_Scroll) {
                    if (Scroll_Mode_per_frame) {
                        flashingLED(context, cScroll)
                    } else {
                        onLED(context, cScroll)
                    }
                }
            }
            return
        }

        if ((btn_Cycle_running) && (value)) {
            knob_was_pressed_while_btn_Cycle_running = true
        }

        if ((GTS_functionality_with_Mute) && (btn_Cycle_running) && (value)) {
            uSection.var_muteCmd.setProcessValue(context, 1)
            return
        }

        // If the GTS (Global Track Scroll) functionality should be used in such a way,
        // that by pressing the Rotate Knob a toggeling of the monitor state of the selected track
        // will proceed, the corresponding code is executed from this following point.

        knob_Press_running = (value)

        switch (active_page) {
            case pages.page_Pan:
            case pages.page_Channel:
            case pages.page_Master:
            case pages.page_Click:
            case pages.page_Section:
            case pages.page_Nudge:
            case pages.page_CS_Bypass:
            case pages.page_EQ_Gain:
            case pages.page_EQ_Freq:
            case pages.page_EQ_Q:
            case pages.page_PF_PreGain:
            case pages.page_PF_LCut_Freq:
            case pages.page_PF_HCut_Freq:
            case pages.page_Send_LevelA:
            case pages.page_Send_LevelB:
            case pages.page_CueSend_Level:
            case pages.page_CueSend_Pan:
            case pages.page_Audio_Volume:
            case pages.page_Audio_FadeIn:
            case pages.page_Audio_FadeOut:
                toggle_monitor_state_when_knob_Press(context, value)
                break
            case pages.page_Scroll:
                if (btn_Cycle_running) {
                    // when GTS functionality is active
                    toggle_monitor_state_when_knob_Press(context, value)
                } else {
                    if (value) {  // when the knob is pressed down
                        Scroll_Mode_per_frame = !Scroll_Mode_per_frame
                        if (Scroll_Mode_per_frame) {
                            flashingLED(context, cScroll)
                        } else {
                            onLED(context, cScroll)
                        }
                    }
                }
                break
            case pages.page_Marker:
            case pages.page_Hitpoint:
                if (btn_Cycle_running) {
                    // when GTS functionality is active
                    toggle_monitor_state_when_knob_Press(context, value)
                } else {
                    if (value) {  // when the knob is pressed down
                        onLED(context, cPrev)
                        onLED(context, cNext)
                        if (Cubase13_or_higher_installed) {
                            mSection.var_InsertMarkerCB13.setProcessValue(context, 1)
                        } else {
                            mSection.var_InsertMarkerCB12.setProcessValue(context, 1)
                        }
                    } else {  // when the knob is released
                        offLED(context, cPrev)
                        offLED(context, cNext)
                    }
                }
                break
            case pages.page_Lock:
                if (btn_Cycle_running) {
                    // when GTS functionality is active
                    toggle_monitor_state_when_knob_Press(context, value)
                } else if ((btn_Prev_running) && (value)) {
                    set_min_value_AI_Mode_with_Prev = true
                    mSection.knob_ValueUnderMouse_Value.setProcessValue(context, 0.0)
                } else if ((btn_Next_running) && (value)) {
                    set_max_value_AI_Mode_with_Next = true
                    mSection.knob_ValueUnderMouse_Value.setProcessValue(context, 1.0)
                } else {
                    if (value) {  // when the knob is pressed down
                        if (mSection.var_ValueLocked.getProcessValue(context)) {
                            // toggle state with knob_Press to unlocked and handle Channel LED
                            mSection.var_ValueLocked.setProcessValue(context, 0)
                            onLED(context, cChannel)
                        } else {
                            // toggle state with knob_Press to locked and handle Channel LED
                            mSection.var_ValueLocked.setProcessValue(context, 1)
                            // as long as the value is locked, the Channel LED is flashing
                            flashingLED(context, cChannel)
                        }
                    }
                }
                break
            case pages.page_Zoom:
                if (btn_Cycle_running) {
                    // when GTS functionality is active
                    toggle_monitor_state_when_knob_Press(context, value)
                } else {
                    if (value) {  // when the knob is pressed down
                        if (btn_Prev_running) {
                            // if the Prev Button and the Knob are pressed down,
                            // proceed vertical zoom out of waveform
                            mSection.var_VerticalZoomOutOfWaveform.setProcessValue(context, 1)
                            VerticalZoomOutOfWaveform_done = true
                            if (debug_2)
                                console.log('064) knob_Press: VerticalZoomOutOfWaveform processed')
                        } else if (btn_Next_running) {
                            // if the Next Button and the Knob are pressed down,
                            // proceed vertical zoom in on waveform
                            mSection.var_VerticalZoomInOnWaveform.setProcessValue(context, 1)
                            VerticalZoomInOnWaveform_done = true
                            if (debug_2)
                                console.log('065) knob_Press: VerticalZoomInOnWaveform processed')
                        } else {
                            mSection.var_ZoomFull.setProcessValue(context, 1)
                        }
                    }
                }
                break
            case pages.page_Quantize:
                if (btn_Cycle_running) {
                    // when GTS functionality is active
                    toggle_monitor_state_when_knob_Press(context, value)
                } else {
                    if (value) {  // when the knob is pressed down
                        mSection.var_SetQuantize_to_4th.setProcessValue(context, 1)
                    }
                }
                break
            case pages.page_QC1:
            case pages.page_QC2:
            case pages.page_QC3:
            case pages.page_QC4:
            case pages.page_QC5:
            case pages.page_QC6:
            case pages.page_QC7:
            case pages.page_QC8:
                if (((btn_Prev_running) || (btn_Next_running)) && (value)) {
                    var new_value = 0.0
                    if (btn_Prev_running) {
                        set_min_value_QC_Mode_with_Prev = true
                        new_value = 0.0
                    } else if (btn_Next_running) {
                        set_max_value_QC_Mode_with_Next = true
                        new_value = 1.0
                    }
                    switch (active_page) {
                        case pages.page_QC1:
                            mSection.knob_QC1_Value.setProcessValue(context, new_value)
                            break
                        case pages.page_QC2:
                            mSection.knob_QC2_Value.setProcessValue(context, new_value)
                            break
                        case pages.page_QC3:
                            mSection.knob_QC3_Value.setProcessValue(context, new_value)
                            break
                        case pages.page_QC4:
                            mSection.knob_QC4_Value.setProcessValue(context, new_value)
                            break
                        case pages.page_QC5:
                            mSection.knob_QC5_Value.setProcessValue(context, new_value)
                            break
                        case pages.page_QC6:
                            mSection.knob_QC6_Value.setProcessValue(context, new_value)
                            break
                        case pages.page_QC7:
                            mSection.knob_QC7_Value.setProcessValue(context, new_value)
                            break
                        case pages.page_QC8:
                            mSection.knob_QC8_Value.setProcessValue(context, new_value)
                            break
                    }
                } else {
                    toggle_monitor_state_when_knob_Press(context, value)
                }
                break
        }
    }

    EQ_Param_or_EQ_Band_changed = function(context) {
        if (selected_EQ_Param == EQ_Params.EQ_Gain) {
            if (selected_EQ_Band == 1) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band1_Gain)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band1_Gain_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 2) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band2_Gain)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band2_Gain_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 3) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band3_Gain)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band3_Gain_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 4) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band4_Gain)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band4_Gain_Value.getProcessValue(context))
            }
        } else if (selected_EQ_Param == EQ_Params.EQ_Freq) {
            if (selected_EQ_Band == 1) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band1_Freq)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band1_Freq_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 2) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band2_Freq)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band2_Freq_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 3) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band3_Freq)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band3_Freq_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 4) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band4_Freq)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band4_Freq_Value.getProcessValue(context))
            }
        } else if (selected_EQ_Param == EQ_Params.EQ_Q) {
            if (selected_EQ_Band == 1) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band1_Q)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band1_Q_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 2) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band2_Q)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band2_Q_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 3) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band3_Q)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band3_Q_Value.getProcessValue(context))
            } else if (selected_EQ_Band == 4) {
                assign_virtual_knob(virtual_knobs.knob_EQ_Band4_Q)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_EQ_Band4_Q_Value.getProcessValue(context))
            }
        }

        if (debug_EQ_knob) {
            if (selected_EQ_Param == EQ_Params.EQ_Gain) {
                console.log('066) EQ_Param_or_EQ_Band_changed - EQ Mode Gain, Band '
                    + selected_EQ_Band)
            } else if (selected_EQ_Param == EQ_Params.EQ_Freq) {
                console.log('067) EQ_Param_or_EQ_Band_changed - EQ Mode Freq, Band '
                    + selected_EQ_Band)
            } else if (selected_EQ_Param == EQ_Params.EQ_Q) {
                console.log('068) EQ_Param_or_EQ_Band_changed - EQ Mode Q, Band '
                    + selected_EQ_Band)
            }
        }
    }

    // setColorLED_EQ_Gain: no Gain = white, with Gain = (cyan) / red, light .. full for >= 18 dB
    function setColorLED_EQ_Gain(context, cButton, EQ_Gain_Value) {
        if (gliding_LED_color_for_EQ_Gains) {
            var a = Math.abs(EQ_Gain_Value - 0.5)
            var c = 0  // for full red       // Gain >= 18 dB
            if (a >= 0.001) {
                // a is in this range: [0.001 .. 0.500]
                // calculate color value c
                if (a < 0.01876) {           // Gain < 0.9 dB  // Knob Step minimum
                    c = 68
                } else if (a < 0.03125) {    // Gain < 1.5 dB
                    c = 54
                } else if (a < 0.0625) {     // Gain < 3 dB
                    c = 42
                } else if (a < 0.09375) {    // Gain < 4.5 dB
                    c = 35
                } else if (a < 0.125) {      // Gain < 6 dB
                    c = 28
                } else if (a < 0.1875) {     // Gain < 9 dB
                    c = 21
                } else if (a < 0.25) {       // Gain < 12 dB
                    c = 14
                } else if (a < 0.3125) {     // Gain < 15 dB
                    c = 7
                } else if (a < 0.375) {      // Gain < 18 dB
                    c = 3
                }
                if ((neg_and_pos_EQ_Gains_in_different_colors) && (EQ_Gain_Value <= 0.499)) {
                    // gliding LED color from light cyan to full cyan for gain
                    setRGBLED(context, cButton, 2*c, 0x7F, 0x7F)
                } else {
                    // gliding LED color from light red to full red for gain
                    setRGBLED(context, cButton, 0x7F, c, c)
                }
            } else {
                // no Gain
                setColorLED(context, cButton, RGB_Colors.c_white_medium)
            }

        } else {
            setColorLED(context, cButton, RGB_Colors.c_red)
        }
    }

    // Update Hardware...
    mSection.var_EQ_Band1_State.mOnProcessValueChange = function(context, value) {
        if (EQ_Mode_running) {
            if (value) {
                setColorLED_EQ_Gain(context, cLink,
                    mSection.knob_EQ_Band1_Gain_Value.getProcessValue(context))
            } else {
                setColorLED(context, cLink, RGB_Colors.c_blue)
            }
        }
    }

    // Update Hardware...
    mSection.var_EQ_Band2_State.mOnProcessValueChange = function(context, value) {
        if (EQ_Mode_running) {
            if (value) {
                setColorLED_EQ_Gain(context, cPan,
                    mSection.knob_EQ_Band2_Gain_Value.getProcessValue(context))
            } else {
                setColorLED(context, cPan, RGB_Colors.c_blue)
            }
        }
    }

    // Update Hardware...
    mSection.var_EQ_Band3_State.mOnProcessValueChange = function(context, value) {
        if (EQ_Mode_running) {
            if (value) {
                setColorLED_EQ_Gain(context, cChannel,
                    mSection.knob_EQ_Band3_Gain_Value.getProcessValue(context))
            } else {
                setColorLED(context, cChannel, RGB_Colors.c_blue)
            }
        }
    }

    // Update Hardware...
    mSection.var_EQ_Band4_State.mOnProcessValueChange = function(context, value) {
        if (EQ_Mode_running) {
            if (value) {
                setColorLED_EQ_Gain(context, cScroll,
                    mSection.knob_EQ_Band4_Gain_Value.getProcessValue(context))
            } else {
                setColorLED(context, cScroll, RGB_Colors.c_blue)
            }
        }
    }

    // Update Hardware...
    mSection.show_EQ_Band_States = function(context) {
        if (mSection.var_EQ_Band1_State.getProcessValue(context)) {
            setColorLED_EQ_Gain(context, cLink,
                mSection.knob_EQ_Band1_Gain_Value.getProcessValue(context))
        } else {
            setColorLED(context, cLink, RGB_Colors.c_blue)
        }

        if (mSection.var_EQ_Band2_State.getProcessValue(context)) {
            setColorLED_EQ_Gain(context, cPan,
                mSection.knob_EQ_Band2_Gain_Value.getProcessValue(context))
        } else {
            setColorLED(context, cPan, RGB_Colors.c_blue)
        }

        if (mSection.var_EQ_Band3_State.getProcessValue(context)) {
            setColorLED_EQ_Gain(context, cChannel,
                mSection.knob_EQ_Band3_Gain_Value.getProcessValue(context))
        } else {
            setColorLED(context, cChannel, RGB_Colors.c_blue)
        }

        if (mSection.var_EQ_Band4_State.getProcessValue(context)) {
            setColorLED_EQ_Gain(context, cScroll,
                mSection.knob_EQ_Band4_Gain_Value.getProcessValue(context))
        } else {
            setColorLED(context, cScroll, RGB_Colors.c_blue)
        }
    }

    // Update Hardware...
    mSection.flashingLED_of_selected_EQ_Band = function(context) {
        for (i = 1; i <= 4; i++) {
            if (i == selected_EQ_Band) {
                flashingLED(context, mLED_code(i))
            } else {
                onLED(context, mLED_code(i))
            }
        }
    }

    // restore LEDs only for AI Mode or EQ Mode
    mSection.perform_specialmemory1234_restore_LEDs = function(context) {
        if (Custom_Mode_running)
            return

        // Link / Pan / Channel / Scroll LEDs are on at this point in time
        // therefore only switch off LED where necessary
        if (active_page == pages.page_Lock) {
            // restore LEDs when AI Mode
            if (specialmemory_ValueUnderMouse_has_data[0] == false) {
                setColorLED(context, cWrite, RGB_Colors.c_violet)
                setColorLED(context, cRead, RGB_Colors.c_violet)
            } else {
                setColorLED(context, cWrite, RGB_Colors.c_orangered)
            }
            offLED(context, cPan)
            offLED(context, cScroll)
            mSection.set_edit_Instrument_LED(context)
            prevent_turnOffLinkLED_when_OnTitleChange = false
            setColorLED(context, cPan, RGB_Colors.c_magenta)
            setColorLED(context, cChannel, RGB_Colors.c_pink)
            setColorLED(context, cScroll, RGB_Colors.c_white_medium)
            if (mSection.var_ValueLocked.getProcessValue(context)) {
                // as long as the value is locked, the Channel LED is flashing
                flashingLED(context, cChannel)
            }
        } else if (EQ_Mode_running) {
            // restore LEDs when EQ Mode
            if (specialmemory_EQ_has_data[0] == false) {
                setColorLED(context, cWrite, RGB_Colors.c_violet)
                setColorLED(context, cRead, RGB_Colors.c_violet)
            } else {
                setColorLED(context, cWrite, RGB_Colors.c_orangered)
            }
            mSection.show_EQ_Band_States(context)
            mSection.flashingLED_of_selected_EQ_Band(context)
        }
    }

    // inner summary code execution for special memory 1..4
    mSection.perform_inner_specialmemory1234_Write_Read
        = function(context, memory_no) {
        // all four cases (Write, Read, AI Mode, EQ Mode) are considered

        if ((btn_Write_running) || (after_Write_running_wait)) {
            if (active_page == pages.page_Lock) {
                uSection.specialmemory_ValueUnderMouse_Write(context, memory_no)
                specialmemory_ValueUnderMouse_Write_done = true
            } else if (EQ_Mode_running) {
                uSection.specialmemory_EQ_Write(context, memory_no)
                specialmemory_EQ_Write_done = true
            }

        } else if ((btn_Read_running) || (after_Read_running_wait)) {
            if (active_page == pages.page_Lock) {
                uSection.specialmemory_ValueUnderMouse_Read(context, memory_no)
                specialmemory_ValueUnderMouse_Read_done = true
            } else if (EQ_Mode_running) {
                uSection.specialmemory_EQ_Read(context, memory_no)
                specialmemory_EQ_Read_done = true
            }
        }
    }

    // outer summary code execution for special memory 1..4
    mSection.perform_outer_specialmemory1234_Write_Read
        = function(context, value, memory_no, xButton) {
        // all four cases (Write, Read, AI Mode, EQ Mode) are considered

        // allow execution only 1x at once
        if (value == 0) {
            Link_Pan_Channel_Scroll_perform_down = false
        }
        if ((value) && (Link_Pan_Channel_Scroll_perform_down == false)) {
            return
        }

        if (value) {
            if (btn_Write_running) {
                // set color to Magenta when overwriting, otherwise to OrangeRed
                if (active_page == pages.page_Lock) {
                    if  (specialmemory_ValueUnderMouse_has_data[memory_no]) {
                        setColorLED(context, xButton, RGB_Colors.c_magenta)
                    } else {
                        setColorLED(context, xButton, RGB_Colors.c_orangered)
                    }
                } else if (EQ_Mode_running) {
                    if (specialmemory_EQ_has_data[memory_no]) {
                        setColorLED(context, xButton, RGB_Colors.c_magenta)
                    } else {
                        setColorLED(context, xButton, RGB_Colors.c_orangered)
                    }
                }
            }

        } else {
             // perform also if Link / Pan / Channel / Scroll Button was not yet released
             mSection.perform_inner_specialmemory1234_Write_Read(context, memory_no)
             mSection.perform_specialmemory1234_restore_LEDs(context)
        }

        if (after_Write_running_wait) {
            specialmemory_ValueUnderMouse_Write_done = false
            specialmemory_EQ_Write_done = false
            after_Write_running_wait = false
        }

        if (after_Read_running_wait) {
            specialmemory_ValueUnderMouse_Read_done = false
            specialmemory_EQ_Read_done = false
            after_Read_running_wait = false
        }
    }

    // Update Hardware...
    mSection.btn_Link.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return

        btn_Link_running = (value)

        if ((btn_Write_running) && (btn_Read_running))
            return

        if (fader_QC_selectable) {
            if (value) {
                fader_QC = 1
                fader_QC_was_set = true
                setColorLED(context, cLink, RGB_Colors.c_grey)
                setColorLED(context, cPan, RGB_Colors.c_green_light)
                setColorLED(context, cChannel, RGB_Colors.c_blue_light)
                setColorLED(context, cScroll, RGB_Colors.c_blue_light)
            }
            return
        }

        if ((btn_Bypass_running) && (active_page == pages.page_Master)) {
            // Control Room Source Select
            if (value) {  // when the knob is pressed down
                btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode = true
                onLED(context, cPrev)
                onLED(context, cNext)
                mSection.var_CR_Source_Select.setProcessValue(context, 1)
            } else {  // when the knob is released
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        // when skip back to Main Page:
        // Pressing the Link Button while holding the Shift Button
        // activates the last Mode on the Shift Page and toggles the edit Instrument state.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            uSection.var_pageShift_Activate.setProcessValue(context, 1)

            // At this point the Shift Page may not yet be active,
            // so var_edit_Instrument has a hostBinding to both the Main Page and the Shift Page.

            if (mSection.var_edit_Instrument.getProcessValue(context)) {
                mSection.var_edit_Instrument.setProcessValue(context, 0)
            } else {
                if (Cubase13_or_higher_installed) {
                    if (ActualTrack_is_InstrumentTrack()) {
                        mSection.var_edit_Instrument.setProcessValue(context, 1)
                    } else {
                        mSection.var_edit_Instrument.setProcessValue(context, 0)
                    }
                } else {
                    mSection.var_edit_Instrument.setProcessValue(context, 1)
                }
            }
            return
        }

        if ((btn_Scroll_running) && (active_page == pages.page_Zoom)) {
            // zoom to selected tracks
            if (value) {
                setColorLED(context, cLink, RGB_Colors.c_white_medium)
                onLED(context, cLink)
                btn_Scroll_pressed_for_zoom_command = true
                mSection.var_ZoomToSelectionFull.setProcessValue(context, 1)
            } else {
                mSection.set_edit_Instrument_LED(context)
            }
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform QuickTracks functionality
            // depending on which Button (Cycle, Stop, Touch) was pressed in addition
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    if (enable_Navigation_Mode) {
                        tpSection.var_navigateLeft.setProcessValue(context, 1)
                        if (automatic_Navigation) {
                            navigation_step_delay_ms = navigation_step_delay_ms_first
                            navigation_timestamp = new Date().getTime()
                            mSection.var_navigation_loop.setProcessValue(context, 1)
                        }
                    } else if (ActualTrack != '') {
                        QuickTrack1 = QT_ActualTrack()
                        mSection.calculate_QuickTrack(context, 1)
                        QuickVolume1 = uSection.var_Volume.getProcessValue(context)
                    }
                    navigate_or_set_QuickTrack_1_4_done = true
                } else if (btn_Stop_running) {
                    // when a complete check all tracks loop has been performed
                    if (number_of_Tracks > 0) {
                        mSection.select_QuickTrack(context, 1)
                    }
                    select_QuickTrack_1_4_done = true
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running)
                    || (QC_Mode_running) || (Audio_Mode_running)) {
                        if ((QC_Mode_running) && (!fader_is_set_to_volume)) {
                            if (fader_QC == 1) {
                                fader.sync_motorfader_with_QCx(context)
                            }
                        } else if (QuickVolume1 >= 0.0) {
                            last_Volume = uSection.var_Volume.getProcessValue(context)

                            // move Fader to initial volume of QuickTrack1
                            uSection.var_Volume.setProcessValue(context, QuickVolume1)
                        }
                        if (QC_Mode_running) {
                            fader_was_set_with_Touch_within_QC_Mode = true
                        }
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if ((btn_Pan_running) && (active_page == pages.page_Pan)) {
            if (value) {
                setColorLED(context, cLink, RGB_Colors.c_yellow_medium)
                onLED(context, cLink)
                // set pan value to full left (value = 0) for Button Link
                mSection.knob_Pan_Value.setProcessValue(context, 0)
                mSection.knob_FP_Value.setProcessValue(context, 0)
                Pan_Value_changed_with_button = true
            } else {
                setColorLED(context, cLink, RGB_Colors.c_cyan_light)
                if (mSection.var_edit_Channel.getProcessValue(context)) {
                    onLED(context, cLink)
                } else {
                    offLED(context, cLink)
                }
            }
            return
        }

        if ((value == 0) && (Pan_Value_changed_with_button)) {
            Pan_Value_changed_with_button = true
            if (active_page == pages.page_Pan) {
                mSection.set_edit_Channel_LED(context)
            }
            return
        }

        if ((btn_Channel_running) && (active_page == pages.page_Lock)) {
            if (value) {
                setColorLED(context, cLink, RGB_Colors.c_pink)
                onLED(context, cLink)
                // set value under mouse to minimum (value = 0) for Button Link
                mSection.knob_ValueUnderMouse_Value.setProcessValue(context, 0)
                mSection.knob_FP_Value.setProcessValue(context, 0)
                ValueUnderMouse_changed_with_button = true
            } else {
                mSection.set_edit_Instrument_LED(context)
            }
            return
        }

        if ((pageMain_is_active) || ((btn_Bypass_running) && (active_page != pages.page_Master))) {
            // The button combination Bypass + Link within the Master Mode has been checked above.
            if (value) {
                // close all plugin windows
                if (btn_Bypass_running) {
                    btn_Bypass_pressed_to_toggle_editChannel = true
                    mSection.var_close_all_plugin_windows.setProcessValue(context, 1)
                }

                // toggle open/close 'edit Channel window'
                if (mSection.var_edit_Channel.getProcessValue(context)) {
                    mSection.var_edit_Channel.setProcessValue(context, 0)
                } else {
                    mSection.var_edit_Channel.setProcessValue(context, 1)
                }

                if (ActualTrack == '') {
                    // For special tracks, the 'edit Channel window' can only be closed
                    // using a MIDI Remote Command.
                    mSection.var_edit_Channel_Cmd.setProcessValue(context, 1)
                    if (pageMain_is_active) {
                        offLED(context, cLink)
                    }
                }
            }
            return
        }

        if (active_page == pages.page_CS_Bypass) {
            if ((value) && (mSection.var_CS_Gate_On.getProcessValue(context))) {
               // bypass switching is only possible when Gate is loaded
               if (mSection.var_CS_Gate_Bypass.getProcessValue(context)) {
                   mSection.var_CS_Gate_Bypass.setProcessValue(context, 0)
               } else {
                   mSection.var_CS_Gate_Bypass.setProcessValue(context, 1)
               }
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                if ((actual_motorfader_mode == motorfader_modes.mf_mode_QCx) && (fader_QC == 1)) {
                    setColorLED(context, cLink, RGB_Colors.c_grey)
                } else {
                    setColorLED(context, cLink, RGB_Colors.c_orange_light)
                }
                mSection.var_ActivateQC1.setProcessValue(context, 1)
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (active_page == pages.page_Audio_Volume) {
                    mSection.var_Audio_editors.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeIn) {
                    mSection.var_Audio_delete_fade_in.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeOut) {
                    mSection.var_Audio_delete_fade_out.setProcessValue(context, 1)
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if (PF_Mode_running) {
            if (value) {
                var PreFilter_on = (mSection.var_PF_Bypass.getProcessValue(context) == 0)
                var Phase_180 = (mSection.var_PF_PhaseSwitch.getProcessValue(context) == 1)

                // PF Mode Switch = off / on / +180 / +180 only
                // colors for this = darkgrey / orangered / magenta_medium / pink

                if ((!PreFilter_on) && (Phase_180)) {
                    // off
                    mSection.var_PF_Bypass.setProcessValue(context, 1)
                    mSection.var_PF_PhaseSwitch.setProcessValue(context, 0)
                } else if ((!PreFilter_on) && (!Phase_180)) {
                    // on
                    mSection.var_PF_Bypass.setProcessValue(context, 0)
                    mSection.var_PF_PhaseSwitch.setProcessValue(context, 0)
                } else if ((PreFilter_on) && (!Phase_180)) {
                    // +180
                    mSection.var_PF_Bypass.setProcessValue(context, 0)
                    mSection.var_PF_PhaseSwitch.setProcessValue(context, 1)
                } else if ((PreFilter_on) && (Phase_180)) {
                    // +180 only
                    mSection.var_PF_Bypass.setProcessValue(context, 1)
                    mSection.var_PF_PhaseSwitch.setProcessValue(context, 1)
                }
            }
            return
        }

        Link_Pan_Channel_Scroll_running = (value)

        // perform special memory functionality
        // when Write Button or Read buttons is pressed down or was pressed and released.
        if ((btn_Write_running) || (btn_Read_running)
        || (after_Write_running_wait) || (after_Read_running_wait)) {
            mSection.perform_outer_specialmemory1234_Write_Read(context, value, 1, cLink)
            return
        }

        if ((value) && (pageShift_is_active) && (EQ_Mode_running == false)) {
            // when Shift Page is active and not in EQ Mode toggle open/close edit Instrument window
            if (mSection.var_edit_Instrument.getProcessValue(context)) {
                mSection.var_edit_Instrument.setProcessValue(context, 0)
            } else {
                if (Cubase13_or_higher_installed) {
                    if (ActualTrack_is_InstrumentTrack()) {
                        mSection.var_edit_Instrument.setProcessValue(context, 1)
                    } else {
                        mSection.var_edit_Instrument.setProcessValue(context, 0)
                    }
                } else {
                    mSection.var_edit_Instrument.setProcessValue(context, 1)
                }
            }
            mSection.set_edit_Instrument_LED(context)

        } else if (EQ_Mode_running) {
            if (value) {
                if (selected_EQ_Band != 1) {
                    selected_EQ_Band = 1
                    mSection.flashingLED_of_selected_EQ_Band(context)
                    EQ_Param_or_EQ_Band_changed(context)
                    if (mSection.var_EQ_Band1_State.getProcessValue(context) == 0) {
                        mSection.var_EQ_Band1_State.setProcessValue(context, 1)
                    }
                } else {
                    if (mSection.var_EQ_Band1_State.getProcessValue(context)) {
                        mSection.var_EQ_Band1_State.setProcessValue(context, 0)
                    } else {
                        mSection.var_EQ_Band1_State.setProcessValue(context, 1)
                    }
                }
                mSection.show_EQ_Band_States(context)
                if (debug_EQ_Mode)
                   console.log('069) EQ Band 1 - button process')
            }

        } else if (Send_Mode_running) {
            if (value) {
                if (active_page == pages.page_Send_LevelA) {
                    if (selected_Send != 1) {
                        selected_Send = 1
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cLink)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelA)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On1.getProcessValue(context) == 0) {
                            mSection.var_Send_On1.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On1.getProcessValue(context)) {
                            mSection.var_Send_On1.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On1.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('070) Send 1 - button process')
                } else if (active_page == pages.page_Send_LevelB) {
                    if (selected_Send != 5) {
                        selected_Send = 5
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cLink)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelB)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On5.getProcessValue(context) == 0) {
                            mSection.var_Send_On5.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On5.getProcessValue(context)) {
                            mSection.var_Send_On5.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On5.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('071) Send 5 - button process')
                }
            }

        } else if (CueSend_Mode_running) {
            if (value) {
                if (active_page == pages.page_CueSend_Level) {
                    if (selected_CueSend != 1) {
                        selected_CueSend = 1
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cLink)
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Level)
                        CueSend_Param_or_selected_CueSend_changed(context)
                        if (mSection.var_CueSend_On1.getProcessValue(context) == 0) {
                            mSection.var_CueSend_On1.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_CueSend_On1.getProcessValue(context)) {
                            mSection.var_CueSend_On1.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_On1.setProcessValue(context, 1)
                        }
                    }
                    if (debug_CueSend_Mode)
                        console.log('072) CueSend Level 1 - button process')
                } else if (active_page == pages.page_CueSend_Pan) {
                    if (selected_CueSend != 1) {
                        selected_CueSend = 1
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Pan)
                        CueSend_Param_or_selected_CueSend_changed(context)
                    }
                    if (debug_Send_Mode)
                        console.log('073) CueSend Pan 1 - button process')
                }
            }
        }
    }

    // Update Hardware...
    mSection.var_edit_Channel.mOnProcessValueChange = function(context, value) {
        if ((pageMain_is_active) && (!btn_Write_running) && (!btn_Read_running)) {
            if (value) {
                onLED(context, cLink)
            } else {
                offLED(context, cLink)
            }
        }
    }

    mSection.set_edit_Channel_LED = function(context) {
        // forced setting of the Link LED
        if (pageMain_is_active) {
            setColorLED(context, cLink, RGB_Colors.c_cyan_light)
            if (mSection.var_edit_Channel.getProcessValue(context)) {
                onLED(context, cLink)
            } else {
                offLED(context, cLink)
            }
        }
    }

    // Update Hardware...
    mSection.var_edit_Instrument.mOnProcessValueChange = function(context, value) {
        if (active_page != pages.page_CS_Bypass) {
            // Make sure that the Shift Page is active,
            // as there is also a hostBinding on the Main Page.
            if ((pageShift_is_active) && (!btn_Write_running) && (!btn_Read_running)) {
                if (value) {
                    onLED(context, cLink)
                } else {
                    offLED(context, cLink)
                }
            }
        }
    }

    mSection.set_edit_Instrument_LED = function(context) {
        // forced setting of the Link LED
        if (pageShift_is_active) {
            setColorLED(context, cLink, RGB_Colors.c_cyan)
            if (mSection.var_edit_Instrument.getProcessValue(context)) {
                onLED(context, cLink)
            } else {
                offLED(context, cLink)
            }
        }
    }

    // Update Hardware...
    pageShift.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSelected.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        // While the Shift Page is active, a switch to a track that cannot have an instrument
        // will not trigger the callback function var_edit_Instrument.mOnProcessValueChange.
        // Therefore, the Link LED must first be switched off when changing tracks.
        if ((pageShift_is_active) && (active_page != pages.page_CS_Bypass)
        && (prevent_turnOffLinkLED_when_OnTitleChange == false)) {
            offLED(activeDevice, cLink)
        }
    }

    // Update Hardware...
    mSection.btn_Pan.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return

        btn_Pan_running = (value)

        if ((btn_Write_running) && (btn_Read_running))
            return

        if (fader_QC_selectable) {
            if (value) {
                fader_QC = 2
                fader_QC_was_set = true
                setColorLED(context, cLink, RGB_Colors.c_orange_light)
                setColorLED(context, cPan, RGB_Colors.c_grey)
                setColorLED(context, cChannel, RGB_Colors.c_blue_light)
                setColorLED(context, cScroll, RGB_Colors.c_blue_light)
            }
            return
        }

        // when skip back to Main Page:
        // Pressing the Pan Button while holding the Shift Button activates the Hitpoint Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            last_active_pageShift = pages.page_Hitpoint
            uSection.var_pageShift_Activate.setProcessValue(context, 1)
            return
        }

        if ((btn_Scroll_running) && (active_page == pages.page_Zoom)) {
            // horizontal zoom to selection
            if (value) {
                setColorLED(context, cPan, RGB_Colors.c_white_medium)
                onLED(context, cPan)
                btn_Scroll_pressed_for_zoom_command = true
                mSection.var_ZoomToSelection.setProcessValue(context, 1)
            } else {
                offLED(context, cPan)
                setColorLED(context, cPan, RGB_Colors.c_magenta)
            }
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform QuickTracks functionality
            // depending on which Button (Cycle, Stop, Touch) was pressed in addition
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    if (enable_Navigation_Mode) {
                        tpSection.var_navigateUp.setProcessValue(context, 1)
                        if (automatic_Navigation) {
                            navigation_step_delay_ms = navigation_step_delay_ms_first
                            navigation_timestamp = new Date().getTime()
                            mSection.var_navigation_loop.setProcessValue(context, 1)
                        }
                    } else if (ActualTrack != '') {
                        QuickTrack2 = QT_ActualTrack()
                        mSection.calculate_QuickTrack(context, 2)
                        QuickVolume2 = uSection.var_Volume.getProcessValue(context)
                    }
                    navigate_or_set_QuickTrack_1_4_done = true
                } else if (btn_Stop_running) {
                    // when a complete check all tracks loop has been performed
                    if (number_of_Tracks > 0) {
                        mSection.select_QuickTrack(context, 2)
                    }
                    select_QuickTrack_1_4_done = true
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running)
                    || (QC_Mode_running) || (Audio_Mode_running)) {
                        if ((QC_Mode_running) && (!fader_is_set_to_volume)) {
                            if (fader_QC == 2) {
                                fader.sync_motorfader_with_QCx(context)
                            }
                        } else if (QuickVolume2 >= 0.0) {
                            last_Volume = uSection.var_Volume.getProcessValue(context)

                            // move Fader to initial volume of QuickTrack2
                            uSection.var_Volume.setProcessValue(context, QuickVolume2)
                        }
                        if (QC_Mode_running) {
                            fader_was_set_with_Touch_within_QC_Mode = true
                        }
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if (pageMain_is_active) {
            if ((btn_Bypass_running) && (active_page == pages.page_Master)) {
                // Control Room Monitor Select
                if (value) {  // when the Pan Button is also pressed down
                    btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode = true
                    onLED(context, cPrev)
                    onLED(context, cNext)
                    mSection.var_CR_Monitor_Select.setProcessValue(context, 1)
                } else {
                    offLED(context, cPrev)
                    offLED(context, cNext)
                }
                return
            }

            if ((btn_Bypass_running) && (active_page == pages.page_Pan)
            && (Cubase13_or_higher_installed)) {
                // toggle between pan and pan2
                if (value) {  // when the Pan Button is also pressed down
                    btn_Bypass_pressed_for_toggle_between_pan_and_pan2 = true
                    Pan2_active = !Pan2_active
                    if (Pan2_active) {
                        midiBinding_knob_FP_Value(false)
                        midiBinding_knob_Pan2_Value(true)
                        setColorLED(context, cPan, RGB_Colors.c_orangered)
                    } else {
                        midiBinding_knob_Pan2_Value(false)
                        midiBinding_knob_FP_Value(true)
                        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
                    }
                }
                return
            }

            if (value) {
                assign_virtual_knob(virtual_knobs.knob_Pan)
                mSection.var_ActivatePan.setProcessValue(context, 1)
                return
            }
        }

        if (active_page == pages.page_CS_Bypass) {
            if ((value) && (mSection.var_CS_Compr_On.getProcessValue(context))) {
               // bypass switching is only possible when Compressor is loaded
               if (mSection.var_CS_Compr_Bypass.getProcessValue(context)) {
                   mSection.var_CS_Compr_Bypass.setProcessValue(context, 0)
               } else {
                   mSection.var_CS_Compr_Bypass.setProcessValue(context, 1)
               }
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                if ((actual_motorfader_mode == motorfader_modes.mf_mode_QCx) && (fader_QC == 2)) {
                    setColorLED(context, cPan, RGB_Colors.c_grey)
                } else {
                    setColorLED(context, cPan, RGB_Colors.c_green_light)
                }
                mSection.var_ActivateQC2.setProcessValue(context, 1)
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (active_page == pages.page_Audio_Volume) {
                    mSection.var_Audio_play_selection.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeIn) {
                    mSection.var_Audio_standard_fade_in.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeOut) {
                    mSection.var_Audio_standard_fade_out.setProcessValue(context, 1)
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if ((btn_Channel_running) && (active_page == pages.page_Lock)) {
            if (value) {
                setColorLED(context, cPan, RGB_Colors.c_pink)
                onLED(context, cPan)
                // set value under mouse to mid (value = 0.5) for Button Pan
                mSection.knob_ValueUnderMouse_Value.setProcessValue(context, 0.5)
                mSection.knob_FP_Value.setProcessValue(context, 0.5)
                ValueUnderMouse_changed_with_button = true
            } else {
                offLED(context, cPan)
                setColorLED(context, cPan, RGB_Colors.c_magenta)
            }
            return
        }

        if (PF_Mode_running)
            return

        if ((pageShift_is_active) && (btn_Write_running == false) && (btn_Read_running == false)
        && (after_Write_running_wait == false) && (after_Read_running_wait == false)) {
            if (value) {
                mSection.var_ActivateHitpoint.setProcessValue(context, 1)
            }
            return
        }

        Link_Pan_Channel_Scroll_running = (value)

        // perform special memory functionality
        // when Write Button or Read buttons is pressed down or was pressed and released.
        if ((btn_Write_running) || (btn_Read_running)
        || (after_Write_running_wait) || (after_Read_running_wait)) {
            mSection.perform_outer_specialmemory1234_Write_Read(context, value, 2, cPan)
            return
        }

        if (EQ_Mode_running) {
            if (value) {
                if (selected_EQ_Band != 2) {
                    selected_EQ_Band = 2
                    mSection.flashingLED_of_selected_EQ_Band(context)
                    EQ_Param_or_EQ_Band_changed(context)
                    if (mSection.var_EQ_Band2_State.getProcessValue(context) == 0) {
                        mSection.var_EQ_Band2_State.setProcessValue(context, 1)
                    }
                } else {
                    if (mSection.var_EQ_Band2_State.getProcessValue(context)) {
                        mSection.var_EQ_Band2_State.setProcessValue(context, 0)
                    } else {
                        mSection.var_EQ_Band2_State.setProcessValue(context, 1)
                    }
                }
                mSection.show_EQ_Band_States(context)
                if (debug_EQ_Mode)
                   console.log('074) EQ Band 2 - button process')
            }

        } else if (Send_Mode_running) {
            if (value) {
                if (active_page == pages.page_Send_LevelA) {
                    if (selected_Send != 2) {
                        selected_Send = 2
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cPan)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelA)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On2.getProcessValue(context) == 0) {
                            mSection.var_Send_On2.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On2.getProcessValue(context)) {
                            mSection.var_Send_On2.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On2.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('075) Send 2 - button process')
                } else if (active_page == pages.page_Send_LevelB) {
                    if (selected_Send != 6) {
                        selected_Send = 6
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cPan)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelB)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On6.getProcessValue(context) == 0) {
                            mSection.var_Send_On6.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On6.getProcessValue(context)) {
                            mSection.var_Send_On6.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On6.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('076) Send 6 - button process')
                }
            }

        } else if (CueSend_Mode_running) {
            if (value) {
                if (active_page == pages.page_CueSend_Level) {
                    if (selected_CueSend != 2) {
                        selected_CueSend = 2
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cPan)
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Level)
                        CueSend_Param_or_selected_CueSend_changed(context)
                        if (mSection.var_CueSend_On2.getProcessValue(context) == 0) {
                            mSection.var_CueSend_On2.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_CueSend_On2.getProcessValue(context)) {
                            mSection.var_CueSend_On2.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_On2.setProcessValue(context, 1)
                        }
                    }
                    if (debug_CueSend_Mode)
                        console.log('077) CueSend Level 2 - button process')
                } else if (active_page == pages.page_CueSend_Pan) {
                    if (selected_CueSend != 2) {
                        selected_CueSend = 2
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Pan)
                        CueSend_Param_or_selected_CueSend_changed(context)
                    }
                    if (debug_Send_Mode)
                        console.log('078) CueSend Pan 2 - button process')
                }
            }
        }
    }

    // Update Hardware...
    mSection.btn_Channel.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        var get_LCut_Slope
        if (Custom_Mode_running)
            return

        btn_Channel_running = (value)

        if ((btn_Write_running) && (btn_Read_running))
            return

        if (fader_QC_selectable) {
            if (value) {
                fader_QC = 3
                fader_QC_was_set = true
                setColorLED(context, cLink, RGB_Colors.c_orange_light)
                setColorLED(context, cPan, RGB_Colors.c_green_light)
                setColorLED(context, cChannel, RGB_Colors.c_grey)
                setColorLED(context, cScroll, RGB_Colors.c_blue_light)
            }
            return
        }

        // when skip back to Main Page:
        // Pressing the Channel Button while holding the Shift Button
        // activates the AI Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            to_AI_Mode_with_Shift = true
            last_active_pageShift = pages.page_Lock
            uSection.var_pageShift_Activate.setProcessValue(context, 1)
            return
        }

        if ((btn_Scroll_running) && (active_page == pages.page_Zoom)) {
            // full zoom to selection
            if (value) {
                setColorLED(context, cChannel, RGB_Colors.c_white_medium)
                onLED(context, cChannel)
                btn_Scroll_pressed_for_zoom_command = true
                mSection.var_ZoomSelectedTracks.setProcessValue(context, 1)
            } else {
                offLED(context, cChannel)
                setColorLED(context, cChannel, RGB_Colors.c_pink)
            }
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform QuickTracks functionality
            // depending on which Button (Cycle, Stop, Touch) was pressed in addition
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    if (enable_Navigation_Mode) {
                        tpSection.var_navigateDown.setProcessValue(context, 1)
                        if (automatic_Navigation) {
                            navigation_step_delay_ms = navigation_step_delay_ms_first
                            navigation_timestamp = new Date().getTime()
                            mSection.var_navigation_loop.setProcessValue(context, 1)
                        }
                    } else if (ActualTrack != '') {
                        QuickTrack3 = QT_ActualTrack()
                        mSection.calculate_QuickTrack(context, 3)
                        QuickVolume3 = uSection.var_Volume.getProcessValue(context)
                    }
                    navigate_or_set_QuickTrack_1_4_done = true
                } else if (btn_Stop_running) {
                    // when a complete check all tracks loop has been performed
                    if (number_of_Tracks > 0) {
                        mSection.select_QuickTrack(context, 3)
                    }
                    select_QuickTrack_1_4_done = true
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running)
                    || (QC_Mode_running) || (Audio_Mode_running)) {
                        if ((QC_Mode_running) && (!fader_is_set_to_volume)) {
                            if (fader_QC == 3) {
                                fader.sync_motorfader_with_QCx(context)
                            }
                        } else if (QuickVolume3 >= 0.0) {
                            last_Volume = uSection.var_Volume.getProcessValue(context)

                            // move Fader to initial volume of QuickTrack3
                            uSection.var_Volume.setProcessValue(context, QuickVolume3)
                        }
                        if (QC_Mode_running) {
                            fader_was_set_with_Touch_within_QC_Mode = true
                        }
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_toggle_Mixer_Window = true
                mSection.var_Mixer_Window.setProcessValue(context, 1)
            }
            return
        }

        if (active_page == pages.page_CS_Bypass) {
            if ((value) && (mSection.var_CS_Tools_On.getProcessValue(context))) {
               // bypass switching is only possible when Tools-Modul is loaded
               if (mSection.var_CS_Tools_Bypass.getProcessValue(context)) {
                   mSection.var_CS_Tools_Bypass.setProcessValue(context, 0)
               } else {
                   mSection.var_CS_Tools_Bypass.setProcessValue(context, 1)
               }
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                if ((actual_motorfader_mode == motorfader_modes.mf_mode_QCx) && (fader_QC == 3)) {
                    setColorLED(context, cChannel, RGB_Colors.c_grey)
                } else {
                    setColorLED(context, cChannel, RGB_Colors.c_blue_light)
                }
                mSection.var_ActivateQC3.setProcessValue(context, 1)
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (active_page == pages.page_Audio_Volume) {
                    mSection.var_Audio_crossfade.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeIn) {
                    mSection.var_Audio_fade_in_to_cursor.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeOut) {
                    mSection.var_Audio_fade_out_from_cursor.setProcessValue(context, 1)
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if ((btn_Pan_running) && (active_page == pages.page_Pan)) {
            if (value) {
                setColorLED(context, cChannel, RGB_Colors.c_yellow_medium)
                onLED(context, cChannel)
                // set pan value to full right (value = 1.0) for Button Channel
                mSection.knob_Pan_Value.setProcessValue(context, 1.0)
                mSection.knob_FP_Value.setProcessValue(context, 1.0)
                Pan_Value_changed_with_button = true
            } else {
                setColorLED(context, cChannel, RGB_Colors.c_white_medium)
                offLED(context, cChannel)
            }
            return
        }

        if ((value == 0) && (Pan_Value_changed_with_button)) {
            Pan_Value_changed_with_button = true
            if (active_page == pages.page_Pan) {
                setColorLED(context, cChannel, RGB_Colors.c_white_medium)
                offLED(context, cChannel)
            }
        }

        if (pageMain_is_active) {
            if (value) {
                mSection.var_ActivateChannel.setProcessValue(context, 1)
            }
            return
        }

        if (PF_Mode_running) {
            if (value) {
                // LCut Slope Value Steps = off / 6 dB / 12 dB / 24 dB / 36 dB / 48 dB
                // colors = darkgrey / blue / cyan_medium / green_medium / yellow_medium / orange

                // switch slope setting to next
                get_LCut_Slope = mSection.var_PF_LCut_Slope.getProcessValue(context)
                if (mSection.var_PF_LCut_On.getProcessValue(context) == 0) {
                    mSection.var_PF_LCut_Slope.setProcessValue(context, 0)
                    mSection.var_PF_LCut_On.setProcessValue(context, 1)
                } else if (get_LCut_Slope == 0.00) {
                    mSection.var_PF_LCut_Slope.setProcessValue(context, 0.25)
                } else if (get_LCut_Slope == 0.25) {
                    mSection.var_PF_LCut_Slope.setProcessValue(context, 0.50)
                } else if (get_LCut_Slope == 0.50) {
                    mSection.var_PF_LCut_Slope.setProcessValue(context, 0.75)
                } else if (get_LCut_Slope == 0.75) {
                    mSection.var_PF_LCut_Slope.setProcessValue(context, 1.00)
                } else if (get_LCut_Slope == 1.00) {
                    mSection.var_PF_LCut_Slope.setProcessValue(context, 0.00)
                    mSection.var_PF_LCut_On.setProcessValue(context, 0)
                }
            }
            return
        }

        if ((pageShift_is_active) && (btn_Write_running == false) && (btn_Read_running == false)
        && (after_Write_running_wait == false) && (after_Read_running_wait == false)) {
            if (to_AI_Mode_with_Shift) {
                to_AI_Mode_with_Shift = false
            } else {
                if ((value) && (active_page != pages.page_Lock)) {
                    // Channel LED permanent on when Channel Button is pressed down
                    onLED(context, cChannel)

                    // When activating the AI Mode from another Mode,
                    // respond immediately when the Channel Button is pressed down.
                    ignore_release_btn_Channel = true
                    mSection.var_ActivateLock.setProcessValue(context, 1)

                } else if ((!value) && (active_page == pages.page_Lock)) {
                    if (ignore_release_btn_Channel) {
                        ignore_release_btn_Channel = false
                    } else {
                        // When reactivating the AI Mode,
                        // respond when the Channel Button is released.
                        // Evaluation of the variable ValueUnderMouse_changed_with_button
                        // when running var_ActivateLock.
                        bypass_LED_reset_within_onDeactivate_SubPage_Lock = true
                        mSection.var_ActivateLock.setProcessValue(context, 1)
                    }
                }
            }
            return
        }

        Link_Pan_Channel_Scroll_running = (value)

        // perform special memory functionality
        // when Write Button or Read buttons is pressed down or was pressed and released.
        if ((btn_Write_running) || (btn_Read_running)
        || (after_Write_running_wait) || (after_Read_running_wait)) {
            mSection.perform_outer_specialmemory1234_Write_Read(context, value, 3, cChannel)
            return
        }

        if (EQ_Mode_running) {
            if (value) {
                if (selected_EQ_Band != 3) {
                    selected_EQ_Band = 3
                    mSection.flashingLED_of_selected_EQ_Band(context)
                    EQ_Param_or_EQ_Band_changed(context)
                    if (mSection.var_EQ_Band3_State.getProcessValue(context) == 0) {
                        mSection.var_EQ_Band3_State.setProcessValue(context, 1)
                    }
                } else {
                    if (mSection.var_EQ_Band3_State.getProcessValue(context)) {
                        mSection.var_EQ_Band3_State.setProcessValue(context, 0)
                    } else {
                        mSection.var_EQ_Band3_State.setProcessValue(context, 1)
                    }
                }
                mSection.show_EQ_Band_States(context)
                if (debug_EQ_Mode)
                   console.log('079) EQ Band 3 - button process')
            }

        } else if (Send_Mode_running) {
            if (value) {
                if (active_page == pages.page_Send_LevelA) {
                    if (selected_Send != 3) {
                        selected_Send = 3
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cChannel)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelA)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On3.getProcessValue(context) == 0) {
                            mSection.var_Send_On3.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On3.getProcessValue(context)) {
                            mSection.var_Send_On3.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On3.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('080) Send 3 - button process')
                } else if (active_page == pages.page_Send_LevelB) {
                    if (selected_Send != 7) {
                        selected_Send = 7
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cChannel)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelB)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On7.getProcessValue(context) == 0) {
                            mSection.var_Send_On7.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On7.getProcessValue(context)) {
                            mSection.var_Send_On7.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On7.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('081) Send 7 - button process')
                }
            }

        } else if (CueSend_Mode_running) {
            if (value) {
                if (active_page == pages.page_CueSend_Level) {
                    if (selected_CueSend != 3) {
                        selected_CueSend = 3
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cChannel)
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Level)
                        CueSend_Param_or_selected_CueSend_changed(context)
                        if (mSection.var_CueSend_On3.getProcessValue(context) == 0) {
                            mSection.var_CueSend_On3.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_CueSend_On3.getProcessValue(context)) {
                            mSection.var_CueSend_On3.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_On3.setProcessValue(context, 1)
                        }
                    }
                    if (debug_CueSend_Mode)
                        console.log('082) CueSend Level 3 - button process')
                } else if (active_page == pages.page_CueSend_Pan) {
                    if (selected_CueSend != 3) {
                        selected_CueSend = 3
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Pan)
                        CueSend_Param_or_selected_CueSend_changed(context)
                    }
                    if (debug_Send_Mode)
                        console.log('083) CueSend Pan 3 - button process')
                }
            }
        }
    }

    // Update Hardware...
    mSection.btn_Scroll.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        var get_HCut_Slope

        if (value)
            btn_Scroll_pressed_for_zoom_command = false

        if ((btn_Write_running) && (btn_Read_running))
            return

        btn_Scroll_running = (value)

        if ((Custom_Mode_running) && (value == 0)) {
            if (last_btn_Shift_press_changed_Custom_Mode_bank) {
                last_btn_Shift_press_changed_Custom_Mode_bank = false
                return
            }
            // toggle through Custom Pages within the actual bank after releasing the scroll Button
            if (actual_Custom_Mode_bank == 'A') {
                if (last_pageCustomA == 0) {
                    mSection.var_ActivateCustomA1.setProcessValue(context, 1)
                } else if (last_pageCustomA == 1) {
                    mSection.var_ActivateCustomA2.setProcessValue(context, 1)
                } else if (last_pageCustomA == 2) {
                    mSection.var_ActivateCustomA0.setProcessValue(context, 1)
                }
            } else if (actual_Custom_Mode_bank == 'B') {
                if (last_pageCustomB == 0) {
                    mSection.var_ActivateCustomB1.setProcessValue(context, 1)
                } else if (last_pageCustomB == 1) {
                    mSection.var_ActivateCustomB2.setProcessValue(context, 1)
                } else if (last_pageCustomB == 2) {
                    mSection.var_ActivateCustomB0.setProcessValue(context, 1)
                }
            }
            return
        }

        if (fader_QC_selectable) {
            if (value) {
                fader_QC = 4
                fader_QC_was_set = true
                setColorLED(context, cLink, RGB_Colors.c_orange_light)
                setColorLED(context, cPan, RGB_Colors.c_green_light)
                setColorLED(context, cChannel, RGB_Colors.c_blue_light)
                setColorLED(context, cScroll, RGB_Colors.c_grey)
            }
            return
        }

        // when skip back to Main Page:
        // Pressing the Scroll Button while holding the Shift Button activates Zoom Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            btn_Scroll_pressed_to_enter_Zoom_Mode = true
            last_active_pageShift = pages.page_Zoom
            uSection.var_pageShift_Activate.setProcessValue(context, 1)
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform QuickTracks functionality
            // depending on which Button (Cycle, Stop, Touch) was pressed in addition
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    if (enable_Navigation_Mode) {
                        tpSection.var_navigateRight.setProcessValue(context, 1)
                        if (automatic_Navigation) {
                            navigation_step_delay_ms = navigation_step_delay_ms_first
                            navigation_timestamp = new Date().getTime()
                            mSection.var_navigation_loop.setProcessValue(context, 1)
                        }
                    } else if (ActualTrack != '') {
                        QuickTrack4 = QT_ActualTrack()
                        mSection.calculate_QuickTrack(context, 4)
                        QuickVolume4 = uSection.var_Volume.getProcessValue(context)
                    }
                    navigate_or_set_QuickTrack_1_4_done = true
                } else if (btn_Stop_running) {
                    // when a complete check all tracks loop has been performed
                    if (number_of_Tracks > 0) {
                        mSection.select_QuickTrack(context, 4)
                    }
                    select_QuickTrack_1_4_done = true
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running)
                    || (QC_Mode_running) || (Audio_Mode_running)) {
                        if ((QC_Mode_running) && (!fader_is_set_to_volume)) {
                            if (fader_QC == 4) {
                                fader.sync_motorfader_with_QCx(context)
                            }
                        } else if (QuickVolume4 >= 0.0) {
                            last_Volume = uSection.var_Volume.getProcessValue(context)

                            // move Fader to initial volume of QuickTrack4
                            uSection.var_Volume.setProcessValue(context, QuickVolume4)
                        }
                        if (QC_Mode_running) {
                            fader_was_set_with_Touch_within_QC_Mode = true
                        }
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_toggle_Video_Window = true
                mSection.var_Video_Window.setProcessValue(context, 1)
            }
            return
        }

        if (pageMain_is_active) {
            if (value) {
                if (active_page == pages.page_Scroll) {
                    btn_Scroll_pressed_to_enter_Zoom_Mode = true
                    last_active_pageShift = pages.page_Zoom
                    uSection.var_pageShift_Activate.setProcessValue(context, 1)
                } else {
                    mSection.var_ActivateScroll.setProcessValue(context, 1)
                }
            }
            return
        }

        if (active_page == pages.page_CS_Bypass) {
            if ((value) && (mSection.var_CS_Limit_On.getProcessValue(context))) {
               // bypass switching is only possible when Limiter is loaded
               if (mSection.var_CS_Limit_Bypass.getProcessValue(context)) {
                   mSection.var_CS_Limit_Bypass.setProcessValue(context, 0)
               } else {
                   mSection.var_CS_Limit_Bypass.setProcessValue(context, 1)
               }
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                if ((actual_motorfader_mode == motorfader_modes.mf_mode_QCx) && (fader_QC == 4)) {
                    setColorLED(context, cScroll, RGB_Colors.c_grey)
                } else {
                    setColorLED(context, cScroll, RGB_Colors.c_blue_light)
                }
                mSection.var_ActivateQC4.setProcessValue(context, 1)
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (active_page == pages.page_Audio_Volume) {
                    mSection.var_Audio_bounce.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeIn) {
                    mSection.var_Audio_fade_in_to_range.setProcessValue(context, 1)
                } else if (active_page == pages.page_Audio_FadeOut) {
                    mSection.var_Audio_fade_out_from_range.setProcessValue(context, 1)
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if ((btn_Channel_running) && (active_page == pages.page_Lock)) {
            if (value) {
                setColorLED(context, cScroll, RGB_Colors.c_pink)
                onLED(context, cScroll)
                // set value under mouse to maximum (value = 1.0) for Button Scroll
                mSection.knob_ValueUnderMouse_Value.setProcessValue(context, 1.0)
                mSection.knob_FP_Value.setProcessValue(context, 1.0)
                ValueUnderMouse_changed_with_button = true
            } else {
                setColorLED(context, cScroll, RGB_Colors.c_white_medium)
                offLED(context, cScroll)
            }
            return
        }

        if (PF_Mode_running) {
            if (value) {
                // HCut Slope Value Steps = off / 6 dB / 12 dB / 24 dB / 36 dB / 48 dB
                // colors = darkgrey / blue / cyan_medium / green_medium / yellow_medium / orange

                // switch slope setting to next
                get_HCut_Slope = mSection.var_PF_HCut_Slope.getProcessValue(context)
                if (mSection.var_PF_HCut_On.getProcessValue(context) == 0) {
                    mSection.var_PF_HCut_Slope.setProcessValue(context, 0)
                    mSection.var_PF_HCut_On.setProcessValue(context, 1)
                } else if (get_HCut_Slope == 0.00) {
                    mSection.var_PF_HCut_Slope.setProcessValue(context, 0.25)
                } else if (get_HCut_Slope == 0.25) {
                    mSection.var_PF_HCut_Slope.setProcessValue(context, 0.50)
                } else if (get_HCut_Slope == 0.50) {
                    mSection.var_PF_HCut_Slope.setProcessValue(context, 0.75)
                } else if (get_HCut_Slope == 0.75) {
                    mSection.var_PF_HCut_Slope.setProcessValue(context, 1.00)
                } else if (get_HCut_Slope == 1.00) {
                    mSection.var_PF_HCut_Slope.setProcessValue(context, 0.00)
                    mSection.var_PF_HCut_On.setProcessValue(context, 0)
                }
            }
            return
        }

        if ((pageShift_is_active) && (btn_Write_running == false) && (btn_Read_running == false)
        && (after_Write_running_wait == false) && (after_Read_running_wait == false)) {
            if (active_page == pages.page_Zoom) {
                if (btn_Scroll_pressed_for_zoom_command) {
                    // if a zoom command is immediately called up when entering the Zoom Mode
                    btn_Scroll_pressed_to_enter_Zoom_Mode = false
                }
                if ((!value) && (!btn_Scroll_pressed_for_zoom_command)) {
                    if (!btn_Scroll_pressed_to_enter_Zoom_Mode) {
                        setColorLED(context, cScroll, RGB_Colors.c_green_medium)
                        last_active_pageMain = pages.page_Scroll
                        uSection.var_pageMain_Activate.setProcessValue(context, 1)
                    } else {
                        btn_Scroll_pressed_to_enter_Zoom_Mode = false
                    }
                }
            } else if (value) {
                btn_Scroll_pressed_to_enter_Zoom_Mode = true
                mSection.var_ActivateZoom.setProcessValue(context, 1)
            }
            return
        }

        Link_Pan_Channel_Scroll_running = (value)

        // perform special memory functionality
        // when Write Button or Read buttons is pressed down or was pressed and released.
        if ((btn_Write_running) || (btn_Read_running)
        || (after_Write_running_wait) || (after_Read_running_wait)) {
            mSection.perform_outer_specialmemory1234_Write_Read(context, value, 4, cScroll)
            return
        }

        if (EQ_Mode_running) {
            if (value) {
                if (selected_EQ_Band != 4) {
                    selected_EQ_Band = 4
                    mSection.flashingLED_of_selected_EQ_Band(context)
                    EQ_Param_or_EQ_Band_changed(context)
                    if (mSection.var_EQ_Band4_State.getProcessValue(context) == 0) {
                        mSection.var_EQ_Band4_State.setProcessValue(context, 1)
                    }
                } else {
                    if (mSection.var_EQ_Band4_State.getProcessValue(context)) {
                        mSection.var_EQ_Band4_State.setProcessValue(context, 0)
                    } else {
                        mSection.var_EQ_Band4_State.setProcessValue(context, 1)
                    }
                }
                mSection.show_EQ_Band_States(context)
                if (debug_EQ_Mode)
                   console.log('084) EQ Band 4 - button process')
            }

        } else if (Send_Mode_running) {
            if (value) {
                if (active_page == pages.page_Send_LevelA) {
                    if (selected_Send != 4) {
                        selected_Send = 4
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cScroll)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelA)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On4.getProcessValue(context) == 0) {
                            mSection.var_Send_On4.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On4.getProcessValue(context)) {
                            mSection.var_Send_On4.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On4.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('085) Send 4 - button process')
                } else if (active_page == pages.page_Send_LevelB) {
                    if (selected_Send != 8) {
                        selected_Send = 8
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cScroll)
                        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelB)
                        selected_Send_changed(context)
                        if (mSection.var_Send_On8.getProcessValue(context) == 0) {
                            mSection.var_Send_On8.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_Send_On8.getProcessValue(context)) {
                            mSection.var_Send_On8.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_On8.setProcessValue(context, 1)
                        }
                    }
                    if (debug_Send_Mode)
                        console.log('086) Send 8 - button process')
                }
            }

        } else if (CueSend_Mode_running) {
            if (value) {
                if (active_page == pages.page_CueSend_Level) {
                    if (selected_CueSend != 4) {
                        selected_CueSend = 4
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cScroll)
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Level)
                        CueSend_Param_or_selected_CueSend_changed(context)
                        if (mSection.var_CueSend_On4.getProcessValue(context) == 0) {
                            mSection.var_CueSend_On4.setProcessValue(context, 1)
                        }
                    } else {
                        if (mSection.var_CueSend_On4.getProcessValue(context)) {
                            mSection.var_CueSend_On4.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_On4.setProcessValue(context, 1)
                        }
                    }
                    if (debug_CueSend_Mode)
                        console.log('087) CueSend Level 4 - button process')
                } else if (active_page == pages.page_CueSend_Pan) {
                    if (selected_CueSend != 4) {
                        selected_CueSend = 4
                        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Pan)
                        CueSend_Param_or_selected_CueSend_changed(context)
                    }
                    if (debug_Send_Mode)
                        console.log('088) CueSend Pan 4 - button process')
                }
            }
        }
    }

    // Update Hardware...
    mSection.var_MetronomeActive.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return
        if (value) {
            onLED(context, cClick)
        } else {
            offLED(context, cClick)
            if (active_page == pages.page_Click) {
                // exit from toggle Click Mode to last Mode on Main Page
                if (active_pageMain_before_Click == pages.page_Pan) {
                    mSection.var_ActivatePan.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Channel) {
                    mSection.var_ActivateChannel.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Scroll) {
                    mSection.var_ActivateScroll.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Master) {
                    mSection.var_ActivateMaster.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Section) {
                    mSection.var_ActivateSection.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Marker) {
                    // prevent showing the Markers Window
                    active_pageMain_before = pages.page_none
                    mSection.var_ActivateMarker.setProcessValue(context, 1)
                } else {
                    mSection.var_ActivatePan.setProcessValue(context, 1)
                }
            }
        }
    }

    mSection.var_forward_check_loop.mOnProcessValueChange = function(context, value) {
        if ((value != 0) && (btn_Stop_running_fixed == false)) {
            var time_now = new Date().getTime()
            // delay required for the callback function mTrackSelection.mMixerChannel.mOnTitleChange
            // to correctly assign the parameter objectTitle for the respective track
            if (time_now < QT_timestamp_at_start_of_loop + QT_step_delay_ms_when_check) {
                mSection.var_forward_check_loop.setProcessValue(context, 1)
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()
                mSection.var_NextTrack.setProcessValue(context, 1)

                // The 'to next track' command is no longer executed
                // if up to QT_max_equal_titles tracks had the same name.
                // This is also the case if no further tracks are found.
                // The loop is then completed.
                if ((PreviousTrack != QT_ActualTrack())
                || (QT_loop_end_step_count < (QT_max_equal_titles - 1))) {
                    if (PreviousTrack == QT_ActualTrack()) {
                        QT_loop_end_step_count++
                    } else {
                        QT_loop_end_step_count = 0
                    }
                    if (PreviousTrack != UndefinedTrack) {
                        distance_to_LastTrack++
                    }
                    tmp_TrackList.push(QT_ActualTrack())
                    PreviousTrack = QT_ActualTrack()
                    mSection.var_forward_check_loop.setProcessValue(context, 1)
                } else {
                    // complete loop
                    distance_to_LastTrack = distance_to_LastTrack - (QT_max_equal_titles - 1)
                    mSection.var_forward_check_loop.setProcessValue(context, 0)
                }
            }

        } else {
            if (distance_to_LastTrack > 0) {
                QT_count_to_distance = 0
                QT_timestamp_at_start_of_loop = new Date().getTime()
                if (btn_Stop_running_fixed == false) {
                    // start next loop
                    mSection.var_backward_from_LastTrack_loop.setProcessValue(context, 1)
                } else {
                    // abort check all tracks
                    QT_abort_check_all_tracks = true
                    mSection.sort_tracks_after_loops(context)
                }
            } else {
                // last track had already been reached
                distance_to_FirstTrack = 0
                PreviousTrack = UndefinedTrack
                QT_loop_end_step_count = 0
                QT_timestamp_at_start_of_loop = new Date().getTime()
                if (btn_Stop_running_fixed == false) {
                    // start next loop
                    mSection.var_backward_check_loop.setProcessValue(context, 1)
                } else {
                    // abort check all tracks
                    QT_abort_check_all_tracks = true
                    mSection.sort_tracks_after_loops(context)
                }
            }
        }
    }

    mSection.var_backward_from_LastTrack_loop.mOnProcessValueChange = function(context, value) {
        if ((value != 0) && (btn_Stop_running_fixed == false)) {
            var time_now = new Date().getTime()
            // delay required for each step to be executed - the minimum 2 ms means at least 1 ms
            if (time_now < QT_timestamp_at_start_of_loop + QT_step_delay_ms_normal) {
                mSection.var_backward_from_LastTrack_loop.setProcessValue(context, 1)
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()
                mSection.var_PrevTrack.setProcessValue(context, 1)
                QT_count_to_distance++
                if (QT_count_to_distance < distance_to_LastTrack) {
                    mSection.var_backward_from_LastTrack_loop.setProcessValue(context, 1)
                } else {
                    // complete loop
                    mSection.var_backward_from_LastTrack_loop.setProcessValue(context, 0)
                }
            }

        } else {
            distance_to_FirstTrack = 0
            PreviousTrack = UndefinedTrack
            QT_loop_end_step_count = 0
            QT_timestamp_at_start_of_loop = new Date().getTime()
            if (btn_Stop_running_fixed == false) {
                // start next loop
                mSection.var_backward_check_loop.setProcessValue(context, 1)
            } else {
                // abort check all tracks
                QT_abort_check_all_tracks = true
                mSection.sort_tracks_after_loops(context)
            }
        }
    }

    mSection.var_backward_check_loop.mOnProcessValueChange = function(context, value) {
        if ((value != 0) && (btn_Stop_running_fixed == false)) {
            var time_now = new Date().getTime()
            // delay required for the callback function mTrackSelection.mMixerChannel.mOnTitleChange
            // to correctly assign the parameter objectTitle for the respective track
            if (time_now < QT_timestamp_at_start_of_loop + QT_step_delay_ms_when_check) {
                mSection.var_backward_check_loop.setProcessValue(context, 1)
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()
                mSection.var_PrevTrack.setProcessValue(context, 1)

                // The 'to previous track' command is no longer executed
                // if up to QT_max_equal_titles tracks had the same name.
                // This is also the case if no further previous tracks are found.
                // The loop is then completed.
                if ((PreviousTrack != QT_ActualTrack())
                || (QT_loop_end_step_count < (QT_max_equal_titles - 1))) {
                    if (PreviousTrack == QT_ActualTrack()) {
                        QT_loop_end_step_count++
                    } else {
                        QT_loop_end_step_count = 0
                    }
                    if (PreviousTrack != UndefinedTrack) {
                        distance_to_FirstTrack++
                    }
                    tmp_TrackList.push(QT_ActualTrack())
                    PreviousTrack = QT_ActualTrack()
                    mSection.var_backward_check_loop.setProcessValue(context, 1)
                } else {
                    // complete loop
                    distance_to_FirstTrack = distance_to_FirstTrack - (QT_max_equal_titles - 1)
                    mSection.var_backward_check_loop.setProcessValue(context, 0)
                }
            }

        } else {
            if (distance_to_FirstTrack > 0) {
                QT_count_to_distance = 0
                QT_timestamp_at_start_of_loop = new Date().getTime()
                if (btn_Stop_running_fixed == false) {
                    // start next loop
                    mSection.var_forward_from_FirstTrack_loop.setProcessValue(context, 1)
                } else {
                    // abort check all tracks
                    QT_abort_check_all_tracks = true
                    mSection.sort_tracks_after_loops(context)
                }
            } else {
                // first track had already been reached
                // final steps
                mSection.sort_tracks_after_loops(context)
            }
        }
    }

    mSection.var_forward_from_FirstTrack_loop.mOnProcessValueChange = function(context, value) {
        if ((value != 0) && (btn_Stop_running_fixed == false)) {
            var time_now = new Date().getTime()
            // delay required for each step to be executed - the minimum 2 ms means at least 1 ms
            if (time_now < QT_timestamp_at_start_of_loop + QT_step_delay_ms_normal) {
                mSection.var_forward_from_FirstTrack_loop.setProcessValue(context, 1)
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()
                mSection.var_NextTrack.setProcessValue(context, 1)
                QT_count_to_distance++
                if (QT_count_to_distance < distance_to_FirstTrack) {
                    mSection.var_forward_from_FirstTrack_loop.setProcessValue(context, 1)
                } else {
                    // complete loop
                    mSection.var_forward_from_FirstTrack_loop.setProcessValue(context, 0)
                }
            }
        } else {
            // final steps
            mSection.sort_tracks_after_loops(context)
        }
    }

    mSection.sort_tracks_after_loops = function(context) {
        if (QT_abort_check_all_tracks) {
            mSection.init_QuickTracks(context)
            QT_abort_check_all_tracks = false

       } else {
            shift = QT_max_equal_titles - 1
            number_of_Tracks = distance_to_FirstTrack + distance_to_LastTrack + 1
            TrackList = []

            TrackList.push(tmp_TrackList[number_of_Tracks + shift])

            // Transfer the names of tracks to the sorted TrackList
            // that were determined during the backward checking loop.
            if (distance_to_FirstTrack > 0) {
                for (i = 1; i <= distance_to_FirstTrack; i++) {
                    TrackList.push(tmp_TrackList[number_of_Tracks - i + shift])
                }
            }

            // Transfer the names of tracks to the sorted TrackList
            // that were determined during the forward checking loop.
            if (distance_to_LastTrack > 0) {
                for (i = 1; i <= distance_to_LastTrack; i++) {
                    TrackList.push(tmp_TrackList[i])
                }
            }

            tmp_TrackList = []

            // Delete trackname duplicates that may have resulted from a missing trackname update.
            for (i = 2; i <= TrackList.length; i++) {
                if (TrackList[i-1] == TrackList[i-2]) {
                    TrackList[i-1] = ''
                }
            }

            if (debug_check_all_tracks) {
                console.log('------------------------------------------------------')
                for (i = 1; i <= TrackList.length; i++) {
                    console.log('Track (' + i + ') = ' + TrackList[i-1])
                }
                console.log('------------------------------------------------------')
            }

            mSection.calculate_QuickTrack(context, 0)   // FirstTrack
            mSection.calculate_QuickTrack(context, 1)   // QuickTrack1
            mSection.calculate_QuickTrack(context, 2)   // QuickTrack2
            mSection.calculate_QuickTrack(context, 3)   // QuickTrack3
            mSection.calculate_QuickTrack(context, 4)   // QuickTrack4
            mSection.calculate_QuickTrack(context, 5)   // LastTrack
        }

        if (!( (virt_LEDs_s[LED_Index(cPrev)] == 2)
        || ((active_page == pages.page_Lock) && (low_resolution_AI_Mode_locked))
        || ((QC_Mode_running) && (low_resolution_QC_Mode_locked)) )) {
            // Don't turn off the Prev LED when it lights up permanently
            // or while it's flashing because the AI Mode or QC Mode was set to low resolution.
            offLED(context, cPrev)
        }

        if (!( (virt_LEDs_s[LED_Index(cNext)] == 2)
        || ((active_page == pages.page_Lock) && (high_resolution_AI_Mode_locked))
        || ((QC_Mode_running) && (high_resolution_QC_Mode_locked)) )) {
            // Don't turn off the Next LED when it lights up permanently
            // or while it's flashing because the AI Mode or QC Mode was set to high resolution.
            offLED(context, cNext)
        }

        QT_check_all_tracks_or_select_QuickTrack_running = false
    }

    // For a QuickTrack, build an array of distances to all other tracks.
    mSection.calculate_QuickTrack = function(context, QuickTrack_no) {
        var QuickTrack_position = 0

        switch (QuickTrack_no) {
            case 0: // FirstTrack (first track with a name)
                FirstTrack_distances = []
                QuickTrack_position = 0
                // looking for the first track with a name
                while ((QuickTrack_position < number_of_Tracks)
                && (TrackList[QuickTrack_position] == '')) {
                    QuickTrack_position++
                }
                // if no track that has a name
                if (QuickTrack_position == number_of_Tracks) {
                    QuickTrack_position = 0
                }
                FirstTrack = TrackList[QuickTrack_position]
                for (i = 1; i <= number_of_Tracks; i++) {
                    FirstTrack_distances.push(i - 1 - QuickTrack_position)
                }
                break
            case 1: // QuickTrack1
                QuickTrack1_distances = []
                for (i = 1; i <= number_of_Tracks; i++) {
                    QuickTrack1_distances.push(0)
                    if (TrackList[i - 1] == QuickTrack1) {
                        QuickTrack_position = i
                    }
                }
                if (QuickTrack_position != 0) {
                    for (i = 1; i <= number_of_Tracks; i++) {
                        QuickTrack1_distances[i - 1] = i - QuickTrack_position
                    }
                }
                break
            case 2: // QuickTrack2
                QuickTrack2_distances = []
                for (i = 1; i <= number_of_Tracks; i++) {
                    QuickTrack2_distances.push(0)
                    if (TrackList[i - 1] == QuickTrack2) {
                        QuickTrack_position = i
                    }
                }
                if (QuickTrack_position != 0) {
                    for (i = 1; i <= number_of_Tracks; i++) {
                        QuickTrack2_distances[i - 1] = i - QuickTrack_position
                    }
                }
                break
            case 3: // QuickTrack3
                QuickTrack3_distances = []
                for (i = 1; i <= number_of_Tracks; i++) {
                    QuickTrack3_distances.push(0)
                    if (TrackList[i - 1] == QuickTrack3) {
                        QuickTrack_position = i
                    }
                }
                if (QuickTrack_position != 0) {
                    for (i = 1; i <= number_of_Tracks; i++) {
                        QuickTrack3_distances[i - 1] = i - QuickTrack_position
                    }
                }
                break
            case 4: // QuickTrack4
                QuickTrack4_distances = []
                for (i = 1; i <= number_of_Tracks; i++) {
                    QuickTrack4_distances.push(0)
                    if (TrackList[i - 1] == QuickTrack4) {
                        QuickTrack_position = i
                    }
                }
                if (QuickTrack_position != 0) {
                    for (i = 1; i <= number_of_Tracks; i++) {
                        QuickTrack4_distances[i - 1] = i - QuickTrack_position
                    }
                }
                break
            case 5: // LastTrack (last track with a name)
                LastTrack_distances = []
                QuickTrack_position = number_of_Tracks - 1
                // looking for the last track with a name
                while ((QuickTrack_position >= 0)
                && (TrackList[QuickTrack_position] == '')) {
                    QuickTrack_position--
                }
                // if no track that has a name
                if (QuickTrack_position < 0) {
                    QuickTrack_position = number_of_Tracks - 1
                }
                LastTrack = TrackList[QuickTrack_position]
                for (i = 1; i <= number_of_Tracks; i++) {
                    LastTrack_distances.push(i - 1 - QuickTrack_position)
                }
                break
        }
    }

    mSection.init_QuickTracks = function(context) {
        // (number_of_Tracks == 0) means that no complete check all tracks loop was performed
        number_of_Tracks = 0

        FirstTrack_distances = []
        LastTrack_distances = []
        QuickTrack1_distances = []
        QuickTrack2_distances = []
        QuickTrack3_distances = []
        QuickTrack4_distances = []
        selected_QuickTrack = -1
        selected_QuickTrack_distance = 0
        TrackList = []
        tmp_TrackList = []
        PreviousTrack = UndefinedTrack
        distance_to_FirstTrack = 0
        distance_to_LastTrack = 0
        QT_count_to_distance = 0
        QT_timestamp_at_start_of_loop = 0
        QT_loop_end_step_count = 0
    }

    mSection.check_all_tracks = function(context) {
        if (Custom_Mode_running)
            return

        QT_check_all_tracks_or_select_QuickTrack_running = true

        // Feedback to show that the script is busy for some time.
        flashingLED(context, cPrev)
        flashingLED(context, cNext)

        mSection.init_QuickTracks(context)

        // Note:
        // If the delays  QT_step_delay_ms_when_check  and  QT_step_delay_ms_normal
        // are set too low, the entire check_all_tracks function is executed incorrectly.

        // start loops
        if (QT_ActualTrack() == '') {
            QT_mode_after_to_track_with_name = 1  // mode when check all tracks
            // Six loops are executed, whereby the previous loop calls the following loop.
            mSection.to_track_with_name(context)
        } else {
            // Four loops are executed, whereby the previous loop calls the following loop.
            mSection.var_forward_check_loop.setProcessValue(context, 1)
        }
    }

    mSection.var_select_QuickTrack_loop.mOnProcessValueChange = function(context, value) {
        if (value != 0) {
            var time_now = new Date().getTime()
            // delay required for each step to be executed - the minimum 2 ms means at least 1 ms
            if (time_now < QT_timestamp_at_start_of_loop + QT_step_delay_ms_normal) {
                mSection.var_select_QuickTrack_loop.setProcessValue(context, 1)
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()

                if (selected_QuickTrack_distance > 0) {
                    // backward
                    mSection.var_PrevTrack.setProcessValue(context, 1)
                    QT_count_to_distance++
                } else {
                    // forward
                    mSection.var_NextTrack.setProcessValue(context, 1)
                    QT_count_to_distance--
                }

                if (QT_count_to_distance != selected_QuickTrack_distance) {
                    mSection.var_select_QuickTrack_loop.setProcessValue(context, 1)
                } else {
                    // complete loop
                    mSection.var_select_QuickTrack_loop.setProcessValue(context, 0)
                }
            }
        } else {
            QT_check_all_tracks_or_select_QuickTrack_running = false
        }
    }

    mSection.determine_selected_QuickTrack_distance = function(context, QuickTrack_no) {
        var SearchTrack = QT_ActualTrack()
        var ActualTrack_position = 0

        selected_QuickTrack_distance = 0

        // search QT_ActualTrack() in TrackList
        if (SearchTrack != '') {
            for (i = 1; i <= number_of_Tracks; i++) {
                if (TrackList[i - 1] == SearchTrack) {
                    ActualTrack_position = i
                    break
                }
            }
        }

        if (ActualTrack_position != 0) {
            switch (QuickTrack_no) {
                case 0:
                    selected_QuickTrack_distance = FirstTrack_distances[ActualTrack_position - 1]
                    break
                case 1:
                    selected_QuickTrack_distance = QuickTrack1_distances[ActualTrack_position - 1]
                    break
                case 2:
                    selected_QuickTrack_distance = QuickTrack2_distances[ActualTrack_position - 1]
                    break
                case 3:
                    selected_QuickTrack_distance = QuickTrack3_distances[ActualTrack_position - 1]
                    break
                case 4:
                    selected_QuickTrack_distance = QuickTrack4_distances[ActualTrack_position - 1]
                    break
                case 5:
                    selected_QuickTrack_distance = LastTrack_distances[ActualTrack_position - 1]
                    break
            }
        }
    }

    mSection.select_QuickTrack = function(context, QuickTrack_no) {
        QT_check_all_tracks_or_select_QuickTrack_running = true
        selected_QuickTrack = QuickTrack_no

        // start loops
        if (QT_ActualTrack() == '') {
            QT_mode_after_to_track_with_name = 2  // mode when select QuickTrack
            // Three loops are executed, whereby the previous loop calls the following loop.
            mSection.to_track_with_name(context)
        } else {
            mSection.determine_selected_QuickTrack_distance(context, QuickTrack_no)
            if (selected_QuickTrack_distance != 0) {
                QT_count_to_distance = 0
                QT_timestamp_at_start_of_loop = new Date().getTime()

                // backward or forward is recognized automatically in the following loop
                mSection.var_select_QuickTrack_loop.setProcessValue(context, 1)
            } else {
                QT_check_all_tracks_or_select_QuickTrack_running = false
            }
        }
    }

    mSection.var_forward_to_track_with_name_loop.mOnProcessValueChange = function(context, value) {
        if ((value != 0)
        // enable abort option with Stop Button when check all tracks
        && !((btn_Stop_running_fixed) && (QT_mode_after_to_track_with_name == 1))) {
            var time_now = new Date().getTime()
            // delay required for the callback function mTrackSelection.mMixerChannel.mOnTitleChange
            // to correctly assign the parameter objectTitle for the respective track
            if (time_now < QT_timestamp_at_start_of_loop + QT_step_delay_ms_when_check) {
                mSection.var_forward_to_track_with_name_loop.setProcessValue(context, 1)
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()
                if ((QT_ActualTrack() == '')
                && (QT_count_to_distance <= QT_to_track_with_name_max_steps)) {
                    mSection.var_NextTrack.setProcessValue(context, 1)
                    QT_count_to_distance++
                    mSection.var_forward_to_track_with_name_loop.setProcessValue(context, 1)
                } else {
                    // complete loop
                    mSection.var_forward_to_track_with_name_loop.setProcessValue(context, 0)
                }
            }

        } else {
            if (QT_ActualTrack() == '') {
                QT_to_track_with_name_max_steps = QT_max_equal_titles - 1
                QT_count_to_distance = 0
                QT_timestamp_at_start_of_loop = new Date().getTime()

                // abort check all tracks if Stop Button pressed
                if ((btn_Stop_running_fixed) && (QT_mode_after_to_track_with_name == 1)) {
                    // abort check all tracks
                    QT_abort_check_all_tracks = true
                    mSection.sort_tracks_after_loops(context)
                } else {
                    // start next loop
                    mSection.var_backward_to_track_with_name_loop.setProcessValue(context, 1)
                }
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()
                if (QT_mode_after_to_track_with_name == 1) {
                    // check all tracks
                    mSection.var_forward_check_loop.setProcessValue(context, 1)
                } else if (QT_mode_after_to_track_with_name == 2) {
                    // select QuickTrack
                    mSection.determine_selected_QuickTrack_distance(context, selected_QuickTrack)
                    if (selected_QuickTrack_distance != 0) {
                        QT_count_to_distance = 0
                        QT_timestamp_at_start_of_loop = new Date().getTime()

                        // backward or forward is recognized automatically in the following loop
                        mSection.var_select_QuickTrack_loop.setProcessValue(context, 1)
                    } else {
                        QT_check_all_tracks_or_select_QuickTrack_running = false
                    }
                }
            }
        }
    }

    mSection.var_backward_to_track_with_name_loop.mOnProcessValueChange = function(context, value) {
        if ((value != 0)
        // enable abort option with Stop Button when check all tracks
        && !((btn_Stop_running_fixed) && (QT_mode_after_to_track_with_name == 1))) {
            var time_now = new Date().getTime()
            // delay required for the callback function mTrackSelection.mMixerChannel.mOnTitleChange
            // to correctly assign the parameter objectTitle for the respective track
            if (time_now < QT_timestamp_at_start_of_loop + QT_step_delay_ms_when_check) {
                mSection.var_backward_to_track_with_name_loop.setProcessValue(context, 1)
            } else {
                QT_timestamp_at_start_of_loop = new Date().getTime()
                if ((QT_ActualTrack() == '')
                && (QT_count_to_distance <= QT_to_track_with_name_max_steps)) {
                    mSection.var_PrevTrack.setProcessValue(context, 1)
                    QT_count_to_distance++
                    mSection.var_backward_to_track_with_name_loop.setProcessValue(context, 1)
                } else {
                    // complete loop
                    mSection.var_backward_to_track_with_name_loop.setProcessValue(context, 0)
                }
            }

        } else {
            QT_timestamp_at_start_of_loop = new Date().getTime()
            if (QT_mode_after_to_track_with_name == 1) {
                if (btn_Stop_running_fixed == false) {
                    // check all tracks
                    mSection.var_forward_check_loop.setProcessValue(context, 1)
                } else {
                    // abort check all tracks
                    QT_abort_check_all_tracks = true
                    mSection.sort_tracks_after_loops(context)
                }
            } else if (QT_mode_after_to_track_with_name == 2) {
                // select QuickTrack
                mSection.determine_selected_QuickTrack_distance(context, selected_QuickTrack)
                if (selected_QuickTrack_distance != 0) {
                    QT_count_to_distance = 0
                    QT_timestamp_at_start_of_loop = new Date().getTime()

                    // backward or forward is recognized automatically in the following loop
                    mSection.var_select_QuickTrack_loop.setProcessValue(context, 1)
                } else {
                    QT_check_all_tracks_or_select_QuickTrack_running = false
                }
            }
        }
    }

    mSection.to_track_with_name = function(context) {
        QT_to_track_with_name_max_steps = QT_max_equal_titles - 1
        QT_count_to_distance = 0
        QT_timestamp_at_start_of_loop = new Date().getTime()

        // start loops
        // Two loops are executed, whereby the previous loop calls the following loop.
        mSection.var_forward_to_track_with_name_loop.setProcessValue(context, 1)
    }

    mSection.var_navigation_loop.mOnProcessValueChange = function(context, value) {
        if (value != 0) {

            var navigation_direction = 0
            if (btn_Cycle_running) {
                if (btn_Link_running) {
                    navigation_direction = 1
                } else if (btn_Pan_running) {
                    navigation_direction = 2
                } else if (btn_Channel_running) {
                    navigation_direction = 3
                } else if (btn_Scroll_running) {
                    navigation_direction = 4
                }
            }

            if (navigation_direction > 0) {
                var time_now = new Date().getTime()
                // delay between navigation commands
                if (time_now < navigation_timestamp + navigation_step_delay_ms) {
                    mSection.var_navigation_loop.setProcessValue(context, 1)
                } else {
                    // proceed navigation command
                    switch (navigation_direction) {
                        case 1:
                            tpSection.var_navigateLeft.setProcessValue(context, 1)
                            break
                        case 2:
                            tpSection.var_navigateUp.setProcessValue(context, 1)
                            break
                        case 3:
                            tpSection.var_navigateDown.setProcessValue(context, 1)
                            break
                        case 4:
                            tpSection.var_navigateRight.setProcessValue(context, 1)
                            break
                    }

                    // continue navigation loop
                    navigation_timestamp = new Date().getTime()
                    navigation_step_delay_ms = navigation_step_delay_ms_normal
                    mSection.var_navigation_loop.setProcessValue(context, 1)
                }

           } else {
                // stop navigation loop
                navigation_step_delay_ms = navigation_step_delay_ms_first
                mSection.var_navigation_loop.setProcessValue(context, 0)
            }
        }
    }

    // Update Hardware...
    mSection.btn_Master.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running)
            return

        btn_Master_running = (value)

        if ((btn_Write_running) && (btn_Read_running))
            return

        if ((btn_Play_running) && (!lower_shuttleSpeed_running) && (!higher_shuttleSpeed_running)) {
            // Change the shuttle direction (backward <> forward)
            // when the Play Button and the Master Button are pressed together.
            if (value) {
                shuttle_reverse = !shuttle_reverse
                onLED(context, cRWD)
                onLED(context, cFWD)
                if (shuttle_reverse) {
                    backup_state_of_direction_LED = virt_LEDs_s[LED_Index(cPrev)]
                    onLED(context, cPrev)
                } else {
                    backup_state_of_direction_LED = virt_LEDs_s[LED_Index(cNext)]
                    onLED(context, cNext)
                }
            } else {
                offLED(context, cRWD)
                offLED(context, cFWD)
                if (shuttle_reverse) {
                    if (backup_state_of_direction_LED <= 1) {  // for undefinded and off {
                        offLED(context, cPrev)
                    } else if (backup_state_of_direction_LED == 3) {
                        flashingLED(context, cPrev)
                    }
                } else {
                    if (backup_state_of_direction_LED <= 1) {  // for undefinded and off {
                        offLED(context, cNext)
                    } else if (backup_state_of_direction_LED == 3) {
                        flashingLED(context, cNext)
                    }
                }
            }
            return
        }

        // when skip back to Main Page:
        // Pressing the Master Button while holding the Shift Button activates the EQ Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            uSection.var_pageEQ_Activate.setProcessValue(context, 1)
            return
        }

        if ((btn_Scroll_running) && (active_page == pages.page_Zoom)) {
            // undo zoom
            if (value) {
                onLED(context, cMaster)
                btn_Scroll_pressed_for_zoom_command = true
                mSection.var_undoZoom.setProcessValue(context, 1)
            } else {
                offLED(context, cMaster)
            }
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform Quick Marker or set volume to -oo dB functionality
            // depending on which Button (Cycle, Stop, Touch) was pressed in addition
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    set_Marker_1_4_done = true
                    tpSection.var_setMarker1.setProcessValue(context, 1)
                } else if (btn_Stop_running) {
                    to_Marker_1_4_done = true
                    tpSection.var_toMarker1.setProcessValue(context, 1)
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running) || (Audio_Mode_running)
                    || ((QC_Mode_running) && (fader_is_set_to_volume))) {
                        last_Volume = uSection.var_Volume.getProcessValue(context)

                        // move Fader to -oo dB
                        uSection.var_Volume.setProcessValue(context, 0.0)

                        if ((QC_Mode_running) && (fader_is_set_to_volume)) {
                            fader_was_set_with_Touch_within_QC_Mode = true
                        }
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        // Pressing the Master Button while holding the Bypass Button also activates the EQ Mode.
        if ((btn_Bypass_running) && (active_page != pages.page_Master)) {
            if (value) {
                directly_to_EQ_Mode = true
                if (!EQ_Mode_running) {
                    // Since activating the following page can trigger the callback function
                    // knob_FP_Value.mOnProcessValueChange, GPS must not be triggered once
                    // the next time the callback function is executed.
                    ignore_next_GPS_trigger_while_btn_Bypass_pressed = true

                    uSection.var_pageEQ_Activate.setProcessValue(context, 1)
                }
            }
            return
        }

        if (EQ_Mode_running) {
            if (value) {
                // Since activating the following page can trigger the callback function
                // knob_FP_Value.mOnProcessValueChange, GPS must not be triggered once
                // the next time the callback function is executed.
                ignore_next_GPS_trigger_while_btn_Bypass_pressed = true

                if (enable_PF_Mode) {
                    uSection.var_pagePF_Activate.setProcessValue(context, 1)
                } else {
                    uSection.var_pageMain_Activate.setProcessValue(context, 1)
                }
            }
            return
        }

        if (PF_Mode_running) {
            if (value) {
                uSection.var_pageMain_Activate.setProcessValue(context, 1)
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                mSection.var_ActivateQC5.setProcessValue(context, 1)
            }
            return
        }

        if (Send_Mode_running) {
            if (value) {
                // Since activating the following page can trigger the callback function
                // knob_FP_Value.mOnProcessValueChange, GPS must not be triggered once
                // the next time the callback function is executed.
                ignore_next_GPS_trigger_while_btn_Bypass_pressed = true

                if (enable_CueSend_Mode) {
                    reset_old_knob_CueSend_Values()
                    uSection.var_pageCueSend_Activate.setProcessValue(context, 1)
                } else {
                    uSection.var_pageMain_Activate.setProcessValue(context, 1)
                }
            }
            return
        }

        if (CueSend_Mode_running) {
            if (value) {
                uSection.var_pageMain_Activate.setProcessValue(context, 1)
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                uSection.var_pageMain_Activate.setProcessValue(context, 1)
            }
            return
        }

        if (pageMain_is_active) {
            if ((btn_Bypass_running) && (active_page == pages.page_Master)) {
                // Replace the CR master volume value for 0 dB with the current value.
                if (value) {  // when the knob is pressed down
                    btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode = true
                    onLED(context, cPrev)
                    onLED(context, cNext)
                    CRLevel_Value_0dB = mSection.knob_CRLevel_Value.getProcessValue(context)
                } else {  // when the knob is released
                    offLED(context, cPrev)
                    offLED(context, cNext)
                }
                return
            }
            if (value) {
                assign_virtual_knob(virtual_knobs.knob_CRLevel)
                mSection.var_ActivateMaster.setProcessValue(context, 1)
            }
            return
        }

        if (pageShift_is_active) {
            if (value) {
                uSection.var_pageEQ_Activate.setProcessValue(context, 1)
            }
            return
        }
    }

    // Update Hardware...
    mSection.btn_Click.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if ((Custom_Mode_running) || ((btn_Write_running) && (btn_Read_running)))
            return

        btn_Click_running = (value)

        if ((btn_Play_running) && (!lower_shuttleSpeed_running) && (!higher_shuttleSpeed_running)) {
            // Set the lower shuttle speed to 1/2x and the higher shuttle speed to 2x
            // when the Play Button and the Click Button are pressed together.
            if (value) {
                lower_shuttleSpeed_denominator = 2
                higher_shuttleSpeed_numerator = 2
                onLED(context, cRWD)
                onLED(context, cFWD)
            } else {
                offLED(context, cRWD)
                offLED(context, cFWD)
            }
            return
        }

        if ((toggle_lock_resolution_AI_Mode_with_Click) && (value == 0)) {
            toggle_lock_resolution_AI_Mode_with_Click = false
            if (active_page == pages.page_Lock) {
                offLED(context, cClick)
                return
            }
        }

        if ((toggle_lock_resolution_QC_Mode_with_Click) && (value == 0)) {
            toggle_lock_resolution_QC_Mode_with_Click = false
            if (QC_Mode_running) {
                if (active_page == pages.page_QC6) {
                    flashingLED(context, cClick)
                } else {
                    onLED(context, cClick)
                }
                return
            }
        }

        // when skip back to Main Page:
        // Pressing the Click Button while holding the Shift Button activates the Quantize Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            last_active_pageShift = pages.page_Quantize
            uSection.var_pageShift_Activate.setProcessValue(context, 1)
            return
        }

        if ((btn_Scroll_running) && (active_page == pages.page_Zoom)) {
            // horizontal zoom to locators
            if (value) {
                onLED(context, cClick)
                btn_Scroll_pressed_for_zoom_command = true
                mSection.var_ZoomToLocators.setProcessValue(context, 1)
            } else {
                offLED(context, cClick)
            }
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform Quick Marker or set volume to 0 dB functionality
            // depending on which Button (Cycle, Stop, Touch) was pressed in addition
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    set_Marker_1_4_done = true
                    tpSection.var_setMarker2.setProcessValue(context, 1)
                } else if (btn_Stop_running) {
                    to_Marker_1_4_done = true
                    tpSection.var_toMarker2.setProcessValue(context, 1)
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running) || (Audio_Mode_running)
                    || ((QC_Mode_running) && (fader_is_set_to_volume))) {
                        last_Volume = uSection.var_Volume.getProcessValue(context)

                        // move Fader to 0 dB
                        uSection.var_Volume.setProcessValue(context, Fader_Value_0dB)

                        if ((QC_Mode_running) && (fader_is_set_to_volume)) {
                            fader_was_set_with_Touch_within_QC_Mode = true
                        }
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if (((active_page == pages.page_Lock) && (value))
        && ((btn_Prev_running) || (btn_Next_running))) {

            // LED Feedback when the resolution of the Rotate Knob was changed within the AI Mode
            onLED(context, cClick)
            toggle_lock_resolution_AI_Mode_with_Click = true

            if (btn_Prev_running) {
                lock_low_resolution_AI_Mode_with_Prev = true
                low_resolution_AI_Mode_locked = !low_resolution_AI_Mode_locked
                if (low_resolution_AI_Mode_locked) {
                    high_resolution_AI_Mode_locked = false
                }
            }
            if (btn_Next_running) {
                lock_high_resolution_AI_Mode_with_Next = true
                high_resolution_AI_Mode_locked = !high_resolution_AI_Mode_locked
                if (high_resolution_AI_Mode_locked) {
                    low_resolution_AI_Mode_locked = false
                }
            }

            if (low_resolution_AI_Mode_locked) {
                flashingLED(context, cPrev)
            } else {
                offLED(context, cPrev)
            }
            if (high_resolution_AI_Mode_locked) {
                flashingLED(context, cNext)
            } else {
                offLED(context, cNext)
            }

            return
        }

        if (((QC_Mode_running) && (value))
        && ((btn_Prev_running) || (btn_Next_running))) {

            // LED Feedback when the resolution of the Rotate Knob was changed within the QC Mode
            offLED(context, cClick)  // turn Off for feedback because LED is On
            toggle_lock_resolution_QC_Mode_with_Click = true

            if (btn_Prev_running) {
                lock_low_resolution_QC_Mode_with_Prev = true
                low_resolution_QC_Mode_locked = !low_resolution_QC_Mode_locked
                if (low_resolution_QC_Mode_locked) {
                    high_resolution_QC_Mode_locked = false
                }
            }
            if (btn_Next_running) {
                lock_high_resolution_QC_Mode_with_Next = true
                high_resolution_QC_Mode_locked = !high_resolution_QC_Mode_locked
                if (high_resolution_QC_Mode_locked) {
                    low_resolution_QC_Mode_locked = false
                }
            }

            if (low_resolution_QC_Mode_locked) {
                flashingLED(context, cPrev)
            } else {
                offLED(context, cPrev)
            }
            if (high_resolution_QC_Mode_locked) {
                flashingLED(context, cNext)
            } else {
                offLED(context, cNext)
            }

            return
        }

        if (EQ_Mode_running) {
            if (btn_Bypass_running) {
                if (value) {
                    // change the filter type for the selected EQ Band
                    onLED(context, cPrev)
                    onLED(context, cNext)
                    btn_Bypass_pressed_within_EQ_Mode = true
                    // back to the first filter type after the last one
                    switch (selected_EQ_Band) {
                        case 1:  // 8 filter types available for EQ Band 1
                            var v = mSection.var_EQ_Band1_FilterType.getProcessValue(context)
                            if ((Math.round(10000*v) / 10000) == 1) {
                                mSection.var_EQ_Band1_FilterType.setProcessValue(context, 0)
                            } else {
                                mSection.var_EQ_Band1_FilterType.setProcessValue(context, v + 1/7)
                            }
                            break
                        case 2:  // 2 filter types available for EQ Band 2
                            if (mSection.var_EQ_Band2_FilterType.getProcessValue(context) == 1) {
                                mSection.var_EQ_Band2_FilterType.setProcessValue(context, 0)
                            } else {
                                mSection.var_EQ_Band2_FilterType.setProcessValue(context, 1)
                            }
                            break
                        case 3:  // 2 filter types available for EQ Band 3
                            if (mSection.var_EQ_Band3_FilterType.getProcessValue(context) == 1) {
                                mSection.var_EQ_Band3_FilterType.setProcessValue(context, 0)
                            } else {
                                mSection.var_EQ_Band3_FilterType.setProcessValue(context, 1)
                            }
                            break
                        case 4:  // 8 filter types available for EQ Band 4
                            var v = mSection.var_EQ_Band4_FilterType.getProcessValue(context)
                            if ((Math.round(10000*v) / 10000) == 1) {
                                mSection.var_EQ_Band4_FilterType.setProcessValue(context, 0)
                            } else {
                                mSection.var_EQ_Band4_FilterType.setProcessValue(context, v + 1/7)
                            }
                            break
                    }
                } else {
                    offLED(context, cPrev)
                    offLED(context, cNext)
                }
                return

            } else if (value) {
                mSection.var_ActivateEQ_Gain.setProcessValue(context, 1)
            }
            return
        }

        if (PF_Mode_running) {
            if (value) {
                mSection.var_ActivatePF_PreGain.setProcessValue(context, 1)
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                mSection.var_ActivateQC6.setProcessValue(context, 1)
            }
            return
        }

        if (Send_Mode_running) {
            if (btn_Bypass_running) {
                if (value) {
                    onLED(context, cPrev)
                    onLED(context, cNext)
                    btn_Bypass_pressed_within_Send_Mode = true

                    // toggle sync_motorfader_within_Send_Mode_to_Send_Value
                    sync_motorfader_within_Send_Mode_to_Send_Value =
                        !sync_motorfader_within_Send_Mode_to_Send_Value

                    var fader_value = 0
                    if (sync_motorfader_within_Send_Mode_to_Send_Value) {
                        // sync to Send, setting of fader_value
                        setColorLED(context, cTouch, RGB_Colors.c_blue)
                        fader_value = mSection.knob_FP_Value.getProcessValue(context)
                    } else {
                        // sync to Volume, setting of fader_value
                        setColorLED(context, cTouch, RGB_Colors.c_yellow_medium)
                        fader_value = uSection.var_Volume.getProcessValue(context)
                    }

                    if (actual_motorfader_mode != motorfader_modes.mf_mode_off) {
                        if (sync_0dB_to_U) {
                            fader_value = fader.calculate_sync_0dB_to_U(fader_value)
                        }
                        // force next FP_write
                        FP_last_write_value = -1
                        fader.FP_write.setProcessValue(context, fader_value)
                    }

                    assigning_fader_before_HostBinding_within_Send_Mode()

                    // activate Send SubPage again to perform HostBinding
                    selected_Send_changed_while_sync_motorfader_to_Send_Value = true
                    if (active_page == pages.page_Send_LevelA) {
                        mSection.var_ActivateSend_LevelA.setProcessValue(context, 1)
                    } else if (active_page == pages.page_Send_LevelB) {
                        mSection.var_ActivateSend_LevelB.setProcessValue(context, 1)
                    }
                } else {
                    offLED(context, cPrev)
                    offLED(context, cNext)
                }
                return

            } else if ((value)
                // only, when selected Send is on visible Send Bank
                && (((active_page == pages.page_Send_LevelA)
                    && (selected_Send >= 1) && (selected_Send <= 4))
                || ((active_page == pages.page_Send_LevelB)
                    && (selected_Send >= 5) && (selected_Send <= 8)))) {
                switch (selected_Send) {
                    case 1:
                        if (mSection.var_Send_Pre1.getProcessValue(context)) {
                            mSection.var_Send_Pre1.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre1.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cLink)
                        break
                    case 2:
                        if (mSection.var_Send_Pre2.getProcessValue(context)) {
                            mSection.var_Send_Pre2.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre2.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cPan)
                        break
                    case 3:
                        if (mSection.var_Send_Pre3.getProcessValue(context)) {
                            mSection.var_Send_Pre3.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre3.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cChannel)
                        break
                    case 4:
                        if (mSection.var_Send_Pre4.getProcessValue(context)) {
                            mSection.var_Send_Pre4.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre4.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cScroll)
                        break
                    case 5:
                        if (mSection.var_Send_Pre5.getProcessValue(context)) {
                            mSection.var_Send_Pre5.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre5.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cLink)
                        break
                    case 6:
                        if (mSection.var_Send_Pre6.getProcessValue(context)) {
                            mSection.var_Send_Pre6.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre6.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cPan)
                        break
                    case 7:
                        if (mSection.var_Send_Pre7.getProcessValue(context)) {
                            mSection.var_Send_Pre7.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre7.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cChannel)
                        break
                    case 8:
                        if (mSection.var_Send_Pre8.getProcessValue(context)) {
                            mSection.var_Send_Pre8.setProcessValue(context, 0)
                        } else {
                            mSection.var_Send_Pre8.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cScroll)
                        break
                }
            }
            return
        }

        if (CueSend_Mode_running) {
            if ((value) && (active_page == pages.page_CueSend_Level)) {
                switch (selected_CueSend) {
                    case 1:
                        if (mSection.var_CueSend_Pre1.getProcessValue(context)) {
                            mSection.var_CueSend_Pre1.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_Pre1.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cLink)
                        break
                    case 2:
                        if (mSection.var_CueSend_Pre2.getProcessValue(context)) {
                            mSection.var_CueSend_Pre2.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_Pre2.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cPan)
                        break
                    case 3:
                        if (mSection.var_CueSend_Pre3.getProcessValue(context)) {
                            mSection.var_CueSend_Pre3.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_Pre3.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cChannel)
                        break
                    case 4:
                        if (mSection.var_CueSend_Pre4.getProcessValue(context)) {
                            mSection.var_CueSend_Pre4.setProcessValue(context, 0)
                        } else {
                            mSection.var_CueSend_Pre4.setProcessValue(context, 1)
                        }
                        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cScroll)
                        break
                }
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                mSection.var_ActivateAudio_Volume.setProcessValue(context, 1)
            }
            return
        }

        if (pageMain_is_active) {
            if ((btn_Bypass_running) && (active_page == pages.page_Master)) {
                // Restore the original 0 dB value for the CR master volume.
                if (value) {  // when the knob is pressed down
                    btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode = true
                    onLED(context, cPrev)
                    onLED(context, cNext)
                    CRLevel_Value_0dB = original_CRLevel_Value_0dB
                } else {  // when the knob is released
                    offLED(context, cPrev)
                    offLED(context, cNext)
                }
                return
            }
            if (value) {
                // Since activating the following page can trigger the callback function
                // knob_FP_Value.mOnProcessValueChange, GPS must not be triggered once
                // the next time the callback function is executed.
                ignore_next_GPS_trigger_while_btn_Bypass_pressed = true

                assign_virtual_knob(virtual_knobs.knob_ClickLevel)
                mSection.var_ActivateClick.setProcessValue(context, 1)
            }
            return
        }

        if (pageShift_is_active) {
            if (value) {
                mSection.var_ActivateQuantize.setProcessValue(context, 1)
            }
            return
        }
    }

    // Update Hardware...
    mSection.btn_Section.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if ((Custom_Mode_running) || ((btn_Write_running) && (btn_Read_running)))
            return

        btn_Section_running = (value)

        if ((btn_Play_running) && (!lower_shuttleSpeed_running) && (!higher_shuttleSpeed_running)) {
            // Set the lower shuttle speed to 1/4x and the higher shuttle speed to 4x
            // when the Play Button and the Section Button are pressed together.
            if (value) {
                lower_shuttleSpeed_denominator = 4
                higher_shuttleSpeed_numerator = 4
                onLED(context, cRWD)
                onLED(context, cFWD)
            } else {
                offLED(context, cRWD)
                offLED(context, cFWD)
            }
            return
        }

        // when skip back to Main Page:
        // Pressing the Section Button while holding the Shift Button activates the Nudge Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            last_active_pageShift = pages.page_Nudge
            uSection.var_pageShift_Activate.setProcessValue(context, 1)
            return
        }

        if ((btn_Scroll_running) && (active_page == pages.page_Zoom)) {
            // horizontal zoom to event
            if (value) {
                onLED(context, cSection)
                btn_Scroll_pressed_for_zoom_command = true
                mSection.var_ZoomAllTracks.setProcessValue(context, 1)
            } else {
                offLED(context, cSection)
            }
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform Quick Marker or set volume to last volume functionality
            // depending on which Button (Cycle, Stop, Touch) was pressed in addition
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    set_Marker_1_4_done = true
                    tpSection.var_setMarker3.setProcessValue(context, 1)
                } else if (btn_Stop_running) {
                    to_Marker_1_4_done = true
                    tpSection.var_toMarker3.setProcessValue(context, 1)
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running) || (Audio_Mode_running)
                    || ((QC_Mode_running) && (fader_is_set_to_volume))) {
                        if (last_Volume >= 0) {
                            // move Fader to last volume
                            uSection.var_Volume.setProcessValue(context, last_Volume)

                            if ((QC_Mode_running) && (fader_is_set_to_volume)) {
                                fader_was_set_with_Touch_within_QC_Mode = true
                            }
                        }
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if (btn_Bypass_running) {
            if (value) {
                // activate Audio Mode for the button combination Bypass + Section
                enter_Audio_Mode = true
                if (last_active_pageAudio == pages.page_Audio_Volume) {
                    must_set_actual_Audio_Mode = false
                } else {
                    must_set_actual_Audio_Mode = true
                }
                uSection.var_pageAudio_Activate.setProcessValue(context, 1)
                return
            }
        }

        if (EQ_Mode_running) {
            if (value) {
                mSection.var_ActivateEQ_Freq.setProcessValue(context, 1)
            }
            return
        }

        if (PF_Mode_running) {
            if (value) {
                mSection.var_ActivatePF_LCut_Freq.setProcessValue(context, 1)
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                mSection.var_ActivateQC7.setProcessValue(context, 1)
            }
            return
        }

        if (Send_Mode_running) {
            if (value) {
                mSection.var_ActivateSend_LevelA.setProcessValue(context, 1)
            }
            return
        }

        if (CueSend_Mode_running) {
            if (value) {
                mSection.var_ActivateCueSend_Level.setProcessValue(context, 1)
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                mSection.var_ActivateAudio_FadeIn.setProcessValue(context, 1)
            }
            return
        }

        if (pageMain_is_active) {
            if (value) {
                mSection.var_ActivateSection.setProcessValue(context, 1)
            }
            return
        }

        if ((pageShift_is_active) && (active_page != pages.page_CS_Bypass)) {
            if (value) {
                mSection.var_ActivateNudge.setProcessValue(context, 1)
            }
            return
        }

        if (active_page == pages.page_CS_Bypass) {
            if ((value) && (mSection.var_CS_Sat_On.getProcessValue(context))) {
               // bypass switching is only possible when Limiter is loaded
               if (mSection.var_CS_Sat_Bypass.getProcessValue(context)) {
                   mSection.var_CS_Sat_Bypass.setProcessValue(context, 0)
               } else {
                   mSection.var_CS_Sat_Bypass.setProcessValue(context, 1)
               }
            }
            return
        }
    }

    // Update Hardware...
    mSection.btn_Marker.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if ((Custom_Mode_running) || ((btn_Write_running) && (btn_Read_running)))
            return

        btn_Marker_running = (value)

        if ((btn_Play_running) && (!lower_shuttleSpeed_running) && (!higher_shuttleSpeed_running)) {
            // Set the lower shuttle speed to 1/8x and the higher shuttle speed to 8x
            // when the Play Button and the Marker Button are pressed together.
            if (value) {
                lower_shuttleSpeed_denominator = 8
                higher_shuttleSpeed_numerator = 8
                onLED(context, cRWD)
                onLED(context, cFWD)
            } else {
                offLED(context, cRWD)
                offLED(context, cFWD)
            }
            return
        }

        // when skip back to Main Page:
        // Pressing the Marker Button while holding the Shift Buttonactivates the CS Bypass Mode.
        if ((btn_Shift_running) && (pageMain_is_active)) {
            last_active_pageShift = pages.page_CS_Bypass
            uSection.var_pageShift_Activate.setProcessValue(context, 1)
            return
        }

        if ((btn_Scroll_running) && (active_page == pages.page_Zoom)) {
            // ignore button combination Scroll + Marker within the Zoom Mode
            return
        }

        if ((btn_Cycle_running) || (btn_Stop_running) || (btn_Touch_running_fixed)) {
            // perform Quick Marker functionality
            if (value) {
                onLED(context, cPrev)
                onLED(context, cNext)
                if (btn_Cycle_running) {
                    set_Marker_1_4_done = true
                    tpSection.var_setMarker4.setProcessValue(context, 1)
                } else if (btn_Stop_running) {
                    to_Marker_1_4_done = true
                    tpSection.var_toMarker4.setProcessValue(context, 1)
                } else if (btn_Touch_running_fixed) {
                    if ((pageMain_is_active) || (EQ_Mode_running) || (PF_Mode_running)
                    || (Send_Mode_running) || (CueSend_Mode_running) || (QC_Mode_running)
                    || (Audio_Mode_running)) {
                        // clear all stored volumes
                        QuickVolume1 = -0.1
                        QuickVolume2 = -0.1
                        QuickVolume3 = -0.1
                        QuickVolume4 = -0.1
                        last_Volume = -0.1
                    }
                    select_Volume_of_QuickTrack_1_4_done = true
                }
            } else {
                offLED(context, cPrev)
                offLED(context, cNext)
            }
            return
        }

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_toggle_Markers_Window = true
                mSection.var_Markers_Window.setProcessValue(context, 1)
            }
            return
        }

        if (EQ_Mode_running) {
            if (value) {
                mSection.var_ActivateEQ_Q.setProcessValue(context, 1)
            }
            return
        }

        if (PF_Mode_running) {
            if (value) {
                mSection.var_ActivatePF_HCut_Freq.setProcessValue(context, 1)
            }
            return
        }

        if (QC_Mode_running) {
            if (value) {
                mSection.var_ActivateQC8.setProcessValue(context, 1)
            }
            return
        }

        if (Send_Mode_running) {
            if (value) {
                mSection.var_ActivateSend_LevelB.setProcessValue(context, 1)
            }
            return
        }

        if (CueSend_Mode_running) {
            if (value) {
                mSection.var_ActivateCueSend_Pan.setProcessValue(context, 1)
            }
            return
        }

        if (Audio_Mode_running) {
            if (value) {
                mSection.var_ActivateAudio_FadeOut.setProcessValue(context, 1)
            }
            return
        }

        if (pageMain_is_active) {
            if (value) {
                mSection.var_ActivateMarker.setProcessValue(context, 1)
            }
            return
        }

        if (pageShift_is_active) {
            if (value) {
                mSection.var_ActivateCS_Bypass.setProcessValue(context, 1)
            }
            return
        }
    }

    // Update Hardware...
    mSection.set_PF_Switch_LED = function(context) {
        var PreFilter_on = (mSection.var_PF_Bypass.getProcessValue(context) == 0)
        var Phase_180 = (mSection.var_PF_PhaseSwitch.getProcessValue(context) == 1)

        // PF Mode Switch = off / on / +180 / +180 only
        // colors for this = darkgrey / orangered / magenta_medium / pink

        if ((!PreFilter_on) && (!Phase_180)) {
            // off
            setColorLED(context, cLink, RGB_Colors.c_darkgrey)
        } else if ((PreFilter_on) && (!Phase_180)) {
            // on
            setColorLED(context, cLink, RGB_Colors.c_orangered)
        } else if ((PreFilter_on) && (Phase_180)) {
            // +180
            setColorLED(context, cLink, RGB_Colors.c_magenta_medium)
        } else if ((!PreFilter_on) && (Phase_180)) {
            // +180 only
            setColorLED(context, cLink, RGB_Colors.c_pink)
        }
    }

    // Update Hardware...
    mSection.var_PF_Bypass.mOnProcessValueChange = function(context, value) {
        if (PF_Mode_running) {
            mSection.set_PF_Switch_LED(context)
        }
    }

    // Update Hardware...
    mSection.var_PF_PhaseSwitch.mOnProcessValueChange = function(context, value) {
        if (PF_Mode_running) {
            mSection.set_PF_Switch_LED(context)
        }
    }

    // Update Hardware...
    mSection.set_PF_PreGain_LED = function(context) {
        var get_PreGain_Value
        get_PreGain_Value = mSection.knob_PF_PreGain_Value.getProcessValue(context)

        // PreGain dB Steps = < -30 dB / < -12 dB / < 0 dB / = 0 dB / > 0 dB / > +12 dB / > +30 dB
        // colors for this  = grey  /  blue  /  cyan  /  green  /  yellow  /  orange  /  orangered
        // special colors   = < -47 dB (full left) / > +47 dB (full right) =  no color  /  magenta

        if (get_PreGain_Value <= 0.01) {
            setColorLED(context, cPan, RGB_Colors.c_off)
        } else if ((get_PreGain_Value > 0.01) && (get_PreGain_Value < 0.1875)) {
            setColorLED(context, cPan, RGB_Colors.c_darkgrey)
        } else if ((get_PreGain_Value >= 0.1875) && (get_PreGain_Value < 0.375)) {
            setColorLED(context, cPan, RGB_Colors.c_blue)
        } else if ((get_PreGain_Value >= 0.375) && (get_PreGain_Value <= (0.5 - 0.005))) {
            setColorLED(context, cPan, RGB_Colors.c_cyan_medium)
        } else if ((get_PreGain_Value > (0.5 - 0.005)) && (get_PreGain_Value < (0.5 + 0.005))) {
            setColorLED(context, cPan, RGB_Colors.c_green_medium)
        } else if (get_PreGain_Value >= (0.5 + 0.005) && (get_PreGain_Value <= 0.625)) {
            setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        } else if ((get_PreGain_Value > 0.625) && (get_PreGain_Value <= 0.8125)) {
            setColorLED(context, cPan, RGB_Colors.c_orange)
        } else if ((get_PreGain_Value > 0.8125) && (get_PreGain_Value < 0.99)) {
            setColorLED(context, cPan, RGB_Colors.c_orangered)
        } else if (get_PreGain_Value >= 0.99) {
            setColorLED(context, cPan, RGB_Colors.c_magenta_medium)
        }
    }

    // Update Hardware...
    mSection.set_PF_LCut_off_or_Slope_LED = function(context) {
        var get_LCut_Slope
        get_LCut_Slope = mSection.var_PF_LCut_Slope.getProcessValue(context)

        // LCut Slope dB Steps = off / 6 dB / 12 dB / 24 dB / 36 dB / 48 dB
        // colors for this = darkgrey / blue / cyan_medium / green_medium / yellow_medium / orange

        if (mSection.var_PF_LCut_On.getProcessValue(context) == 0) {
            setColorLED(context, cChannel, RGB_Colors.c_darkgrey)
        } else if (get_LCut_Slope == 0.00) {
            setColorLED(context, cChannel, RGB_Colors.c_blue)
        } else if (get_LCut_Slope == 0.25) {
            setColorLED(context, cChannel, RGB_Colors.c_cyan_medium)
        } else if (get_LCut_Slope == 0.50) {
            setColorLED(context, cChannel, RGB_Colors.c_green_medium)
        } else if (get_LCut_Slope == 0.75) {
            setColorLED(context, cChannel, RGB_Colors.c_yellow_medium)
        } else if (get_LCut_Slope == 1.00) {
            setColorLED(context, cChannel, RGB_Colors.c_orange)
        }
    }

    // Update Hardware...
    mSection.var_PF_LCut_On.mOnProcessValueChange = function(context, value) {
        if (PF_Mode_running) {
            mSection.set_PF_LCut_off_or_Slope_LED(context)
        }
    }

    // Update Hardware...
    mSection.var_PF_LCut_Slope.mOnProcessValueChange = function(context, value) {
        if (PF_Mode_running) {
            mSection.set_PF_LCut_off_or_Slope_LED(context)
        }
    }

    // Update Hardware...
    mSection.set_PF_HCut_off_or_Slope_LED = function(context) {
        var get_HCut_Slope
        get_HCut_Slope = mSection.var_PF_HCut_Slope.getProcessValue(context)

        // HCut Slope dB steps = off / 6 dB / 12 dB / 24 dB / 36 dB / 48 dB
        // colors for this = darkgrey / blue / cyan_medium / green_medium / yellow_medium / orange

        if (mSection.var_PF_HCut_On.getProcessValue(context) == 0) {
            setColorLED(context, cScroll, RGB_Colors.c_darkgrey)
        } else if (get_HCut_Slope == 0.00) {
            setColorLED(context, cScroll, RGB_Colors.c_blue)
        } else if (get_HCut_Slope == 0.25) {
            setColorLED(context, cScroll, RGB_Colors.c_cyan_medium)
        } else if (get_HCut_Slope == 0.50) {
            setColorLED(context, cScroll, RGB_Colors.c_green_medium)
        } else if (get_HCut_Slope == 0.75) {
            setColorLED(context, cScroll, RGB_Colors.c_yellow_medium)
        } else if (get_HCut_Slope == 1.00) {
            setColorLED(context, cScroll, RGB_Colors.c_orange)
        }
    }

    // Update Hardware...
    mSection.var_PF_HCut_On.mOnProcessValueChange = function(context, value) {
        if (PF_Mode_running) {
            mSection.set_PF_HCut_off_or_Slope_LED(context)
        }
    }

    // Update Hardware...
    mSection.var_PF_HCut_Slope.mOnProcessValueChange = function(context, value) {
        if (PF_Mode_running) {
            mSection.set_PF_HCut_off_or_Slope_LED(context)
        }
    }

    // helper function to avoid redundant callbacks for Send_On
    mSection.old_Send_On_equalValue = function(index_1_8, value) {
        if (old_Send_On_Values[index_1_8 - 1] == value) {
            return true
        } else {
            old_Send_On_Values[index_1_8 - 1] = value
            return false
        }
    }

    // Update Hardware...
    mSection.var_Send_On1.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(1, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cLink)
        }
    }

    // Update Hardware...
    mSection.var_Send_On2.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(2, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cPan)
        }
    }

    // Update Hardware...
    mSection.var_Send_On3.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(3, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cChannel)
        }
    }

    // Update Hardware...
    mSection.var_Send_On4.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(4, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cScroll)
        }
    }

    // Update Hardware...
    mSection.var_Send_On5.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(5, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cLink)
        }
    }

    // Update Hardware...
    mSection.var_Send_On6.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(6, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cPan)
        }
    }

    // Update Hardware...
    mSection.var_Send_On7.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(7, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cChannel)
        }
    }

    // Update Hardware...
    mSection.var_Send_On8.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_On_equalValue(8, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cScroll)
        }
    }

    // helper function to avoid redundant callbacks for Send_Pre
    mSection.old_Send_Pre_equalValue = function(index_1_8, value) {
        if (old_Send_Pre_Values[index_1_8 - 1] == value) {
            return true
        } else {
            old_Send_Pre_Values[index_1_8 - 1] = value
            return false
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre1.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(1, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cLink)
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre2.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(2, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cPan)
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre3.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(3, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cChannel)
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre4.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(4, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelA)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cScroll)
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre5.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(5, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cLink)
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre6.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(6, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cPan)
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre7.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(7, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cChannel)
        }
    }

    // Update Hardware...
    mSection.var_Send_Pre8.mOnProcessValueChange = function(context, value) {
        if (mSection.old_Send_Pre_equalValue(8, value))
            return
        if ((Send_Mode_running) && (active_page == pages.page_Send_LevelB)) {
            mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cScroll)
        }
    }

    // helper function to avoid redundant callbacks for CueSend_On
    mSection.old_CueSend_On_equalValue = function(index_1_4, value) {
        if (old_CueSend_On_Values[index_1_4 - 1] == value) {
            return true
        } else {
            old_CueSend_On_Values[index_1_4 - 1] = value
            return false
        }
    }

    // Update Hardware...
    mSection.var_CueSend_On1.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_On_equalValue(1, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cLink)
        }
    }

    // Update Hardware...
    mSection.var_CueSend_On2.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_On_equalValue(2, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cPan)
        }
    }

    // Update Hardware...
    mSection.var_CueSend_On3.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_On_equalValue(3, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cChannel)
        }
    }

    // Update Hardware...
    mSection.var_CueSend_On4.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_On_equalValue(4, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cScroll)
        }
    }

    // helper function to avoid redundant callbacks for CueSend_Pre
    mSection.old_CueSend_Pre_equalValue = function(index_1_4, value) {
        if (old_CueSend_Pre_Values[index_1_4 - 1] == value) {
            return true
        } else {
            old_CueSend_Pre_Values[index_1_4 - 1] = value
            return false
        }
    }

    // Update Hardware...
    mSection.var_CueSend_Pre1.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_Pre_equalValue(1, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cLink)
        }
    }

    // Update Hardware...
    mSection.var_CueSend_Pre2.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_Pre_equalValue(2, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cPan)
        }
    }

    // Update Hardware...
    mSection.var_CueSend_Pre3.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_Pre_equalValue(3, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cChannel)
        }
    }

    // Update Hardware...
    mSection.var_CueSend_Pre4.mOnProcessValueChange = function(context, value) {
        if (mSection.old_CueSend_Pre_equalValue(4, value))
            return
        if ((CueSend_Mode_running) && (active_page == pages.page_CueSend_Level)) {
            mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cScroll)
        }
    }

    // Update Hardware...
    mSection.set_Send_Level_LED = function(context, page_Send, cButton) {  // + for Cue Send Level

       if (avoid_set_Send_Level_LED_for_Send_LevelA)
           return

        // Send_Level dB steps = < -42 dB / < -24 dB / < -12 dB / < -6 dB / < 0 dB / = 0 dB / > 0 dB
        // colors for this     = blue  /  cyan  /  green  /  yellow  /  orange  /  orangered  /  red
        // special colors      = -oo dB (full left) /  > +6 dB (full right)  =  darkgrey  /  magenta

        var Level = 0
        var On = false
        var Pre = false

        switch (page_Send) {
            case (pages.page_Send_LevelA):
                switch (cButton) {
                    case (cLink):
                        Level = mSection.knob_Send_Level1_Value.getProcessValue(context)
                        On = mSection.var_Send_On1.getProcessValue(context)
                        Pre = mSection.var_Send_Pre1.getProcessValue(context)
                        break
                    case (cPan):
                        Level = mSection.knob_Send_Level2_Value.getProcessValue(context)
                        On = mSection.var_Send_On2.getProcessValue(context)
                        Pre = mSection.var_Send_Pre2.getProcessValue(context)
                        break
                    case (cChannel):
                        Level = mSection.knob_Send_Level3_Value.getProcessValue(context)
                        On = mSection.var_Send_On3.getProcessValue(context)
                        Pre = mSection.var_Send_Pre3.getProcessValue(context)
                        break
                    case (cScroll):
                        Level = mSection.knob_Send_Level4_Value.getProcessValue(context)
                        On = mSection.var_Send_On4.getProcessValue(context)
                        Pre = mSection.var_Send_Pre4.getProcessValue(context)
                        break
                }
                mSection.set_Send_Pre_LED(context, pages.page_Send_LevelA, selected_Send)
                break
            case (pages.page_Send_LevelB):
                switch (cButton) {
                    case (cLink):
                        Level = mSection.knob_Send_Level5_Value.getProcessValue(context)
                        On = mSection.var_Send_On5.getProcessValue(context)
                        Pre = mSection.var_Send_Pre5.getProcessValue(context)
                        break
                    case (cPan):
                        Level = mSection.knob_Send_Level6_Value.getProcessValue(context)
                        On = mSection.var_Send_On6.getProcessValue(context)
                        Pre = mSection.var_Send_Pre6.getProcessValue(context)
                        break
                    case (cChannel):
                        Level = mSection.knob_Send_Level7_Value.getProcessValue(context)
                        On = mSection.var_Send_On7.getProcessValue(context)
                        Pre = mSection.var_Send_Pre7.getProcessValue(context)
                        break
                    case (cScroll):
                        Level = mSection.knob_Send_Level8_Value.getProcessValue(context)
                        On = mSection.var_Send_On8.getProcessValue(context)
                        Pre = mSection.var_Send_Pre8.getProcessValue(context)
                        break
                }
                mSection.set_Send_Pre_LED(context, pages.page_Send_LevelB, selected_Send)
                break
            case (pages.page_CueSend_Level):
                switch (cButton) {
                    case (cLink):
                        Level = mSection.knob_CueSend_Level1_Value.getProcessValue(context)
                        On = mSection.var_CueSend_On1.getProcessValue(context)
                        Pre = mSection.var_CueSend_Pre1.getProcessValue(context)
                        break
                    case (cPan):
                        Level = mSection.knob_CueSend_Level2_Value.getProcessValue(context)
                        On = mSection.var_CueSend_On2.getProcessValue(context)
                        Pre = mSection.var_CueSend_Pre2.getProcessValue(context)
                        break
                    case (cChannel):
                        Level = mSection.knob_CueSend_Level3_Value.getProcessValue(context)
                        On = mSection.var_CueSend_On3.getProcessValue(context)
                        Pre = mSection.var_CueSend_Pre3.getProcessValue(context)
                        break
                    case (cScroll):
                        Level = mSection.knob_CueSend_Level4_Value.getProcessValue(context)
                        On = mSection.var_CueSend_On4.getProcessValue(context)
                        Pre = mSection.var_CueSend_Pre4.getProcessValue(context)
                        break
                }
                mSection.set_Send_Pre_LED(context, pages.page_CueSend_Level, selected_CueSend)
                break
        }

        if ((On == false) && (Pre == false)) {
            setColorLED(context, cButton, RGB_Colors.c_blue_grey)   // set color for bypass and post
        } else if ((On == false) && (Pre == true)) {
            setColorLED(context, cButton, RGB_Colors.c_green_grey)  // set color for bypass and pre

        // when (Cue) Send is not bypassed
        } else if (!Volume_Max_12) {  // 'Volume Max' is set to +6 dB
            if (Level < 0.00001) {
                setColorLED(context, cButton, RGB_Colors.c_darkgrey)
            } else if ((Level >= 0.00001) && (Level < 0.0717)) {
                setColorLED(context, cButton, RGB_Colors.c_blue)
            } else if ((Level >= 0.0717) && (Level < 0.20260079)) {
                setColorLED(context, cButton, RGB_Colors.c_cyan_medium)
            } else if ((Level >= 0.20260079) && (Level < 0.40424174)) {
                setColorLED(context, cButton, RGB_Colors.c_green_medium)
            } else if ((Level >= 0.40424174) && (Level < 0.5708)) {
                setColorLED(context, cButton, RGB_Colors.c_yellow_medium)
            } else if ((Level >= 0.5708) && (Level <= (0.78908658 - 0.0006))) {
                setColorLED(context, cButton, RGB_Colors.c_orange)
            } else if ((Level > (0.78908658 - 0.0006)) && (Level < (0.78908658 + 0.0004))) {
                setColorLED(context, cButton, RGB_Colors.c_orangered)
            } else if ((Level >= (0.78908658 + 0.0004)) && (Level <= 0.99900073)) {
                setColorLED(context, cButton, RGB_Colors.c_red)
            } else if (Level > 0.99900073) {
                setColorLED(context, cButton, RGB_Colors.c_magenta_medium)
            }
        } else {  // 'Volume Max' is set to +12 dB
            if (Level < 0.00001) {
                setColorLED(context, cButton, RGB_Colors.c_darkgrey)
            } else if ((Level >= 0.00001) && (Level < 0.1145)) {
                setColorLED(context, cButton, RGB_Colors.c_blue)
            } else if ((Level >= 0.1145) && (Level < 0.2614)) {
                setColorLED(context, cButton, RGB_Colors.c_cyan_medium)
            } else if ((Level >= 0.2614) && (Level < 0.4972)) {
                setColorLED(context, cButton, RGB_Colors.c_green_medium)
            } else if ((Level >= 0.4972) && (Level < 0.6227)) {
                setColorLED(context, cButton, RGB_Colors.c_yellow_medium)
            } else if ((Level >= 0.6227) && (Level <= (0.7482223 - 0.0004))) {
                setColorLED(context, cButton, RGB_Colors.c_orange)
            } else if ((Level > (0.74822229 - 0.0004)) && (Level < (0.7482223 + 0.0004))) {
                setColorLED(context, cButton, RGB_Colors.c_orangered)
            } else if ((Level >= (0.7482223 + 0.0004)) && (Level <= 0.8737)) {
                setColorLED(context, cButton, RGB_Colors.c_red)
            } else if (Level > 0.8737) {
                setColorLED(context, cButton, RGB_Colors.c_magenta_medium)
            }
        }
    }

    // Update Hardware...
    mSection.set_Send_Pre_LED = function(context, page_Send, sel_xSend) {  // also for Cue Send Pre

        var Pre = false

        switch (page_Send) {
            case (pages.page_Send_LevelA):
                switch (sel_xSend) {
                    case (1):
                        Pre = mSection.var_Send_Pre1.getProcessValue(context)
                        break
                    case (2):
                        Pre = mSection.var_Send_Pre2.getProcessValue(context)
                         break
                    case (3):
                        Pre = mSection.var_Send_Pre3.getProcessValue(context)
                        break
                    case (4):
                        Pre = mSection.var_Send_Pre4.getProcessValue(context)
                        break
                }
                break
            case (pages.page_Send_LevelB):
                switch (sel_xSend) {
                    case (5):
                        Pre = mSection.var_Send_Pre5.getProcessValue(context)
                        break
                    case (6):
                        Pre = mSection.var_Send_Pre6.getProcessValue(context)
                        break
                    case (7):
                        Pre = mSection.var_Send_Pre7.getProcessValue(context)
                        break
                    case (8):
                        Pre = mSection.var_Send_Pre8.getProcessValue(context)
                        break
                }
                break
            case (pages.page_CueSend_Level):
                switch (sel_xSend) {
                    case (1):
                        Pre = mSection.var_CueSend_Pre1.getProcessValue(context)
                        break
                    case (2):
                        Pre = mSection.var_CueSend_Pre2.getProcessValue(context)
                         break
                    case (3):
                        Pre = mSection.var_CueSend_Pre3.getProcessValue(context)
                        break
                    case (4):
                        Pre = mSection.var_CueSend_Pre4.getProcessValue(context)
                        break
                }
                break
        }

        if (Pre) {
            onLED(context, cClick)
        } else {
            offLED(context, cClick)
        }
    }

    // Update Hardware...
    mSection.set_CueSend_Pan_LED = function(context, cButton) {

        // CueSend_Pan steps = 100% L / > 50% L / <= 50% L / center / <= 50% R / > 50% R / 100% R
        // colors for this   = darkgrey /  blue /  cyan /  green /  yellow /  orange /  orangered

        var Pan = 0.5

        switch (cButton) {
            case (cLink):
                Pan = mSection.knob_CueSend_Pan1_Value.getProcessValue(context)
                break
            case (cPan):
                Pan = mSection.knob_CueSend_Pan2_Value.getProcessValue(context)
                break
            case (cChannel):
                Pan = mSection.knob_CueSend_Pan3_Value.getProcessValue(context)
                break
            case (cScroll):
                Pan = mSection.knob_CueSend_Pan4_Value.getProcessValue(context)
                break
        }

        if (Pan < 0.00001) {
            setColorLED(context, cButton, RGB_Colors.c_darkgrey)
        } else if ((Pan >= 0.00001) && (Pan < 0.25)) {
            setColorLED(context, cButton, RGB_Colors.c_blue)
        } else if ((Pan >= 0.25) && (Pan <= 0.495)) {
            setColorLED(context, cButton, RGB_Colors.c_cyan_medium)
        } else if ((Pan > 0.495) && (Pan < 0.505)) {
            setColorLED(context, cButton, RGB_Colors.c_green_medium)
        } else if ((Pan >= 0.505) && (Pan <= 0.75)) {
            setColorLED(context, cButton, RGB_Colors.c_yellow_medium)
        } else if ((Pan > 0.75) && (Pan <= 0.99900073)) {
            setColorLED(context, cButton, RGB_Colors.c_orange)
        } else if (Pan > 0.99900073) {
            setColorLED(context, cButton, RGB_Colors.c_orangered)
        }
    }

    // Update Hardware...
    mSection.flashingLED_of_selected_Send = function(context, page_Send) {

        // As it is possible that nothing is selected
        // on Send Level Bank A or Send Level Bank B,
        // set all 4 LEDs to 'not flashing'.
        onLED(context, cLink)
        onLED(context, cPan)
        onLED(context, cChannel)
        onLED(context, cScroll)

        if (((page_Send == pages.page_Send_LevelA) && (selected_Send == 1))
        || ((page_Send == pages.page_Send_LevelB) && (selected_Send == 5))
        || ((page_Send == pages.page_CueSend_Level) && (selected_CueSend == 1))
        || ((page_Send == pages.page_CueSend_Pan) && (selected_CueSend == 1))) {
            flashingLED(context, cLink)

        } else if (((page_Send == pages.page_Send_LevelA) && (selected_Send == 2))
        || ((page_Send == pages.page_Send_LevelB) && (selected_Send == 6))
        || ((page_Send == pages.page_CueSend_Level) && (selected_CueSend == 2))
        || ((page_Send == pages.page_CueSend_Pan) && (selected_CueSend == 2))) {
            flashingLED(context, cPan)

        } else if (((page_Send == pages.page_Send_LevelA) && (selected_Send == 3))
        || ((page_Send == pages.page_Send_LevelB) && (selected_Send == 7))
        || ((page_Send == pages.page_CueSend_Level) && (selected_CueSend == 3))
        || ((page_Send == pages.page_CueSend_Pan) && (selected_CueSend == 3))) {
            flashingLED(context, cChannel)

        } else if (((page_Send == pages.page_Send_LevelA) && (selected_Send == 4))
        || ((page_Send == pages.page_Send_LevelB) && (selected_Send == 8))
        || ((page_Send == pages.page_CueSend_Level) && (selected_CueSend == 4))
        || ((page_Send == pages.page_CueSend_Pan) && (selected_CueSend == 4))) {
            flashingLED(context, cScroll)
        }
    }

    selected_Send_changed = function(context) {
        switch (selected_Send) {
            case 1:
                assign_virtual_knob(virtual_knobs.knob_Send_Level1)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level1_Value.getProcessValue(context))
                break
            case 2:
                assign_virtual_knob(virtual_knobs.knob_Send_Level2)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level2_Value.getProcessValue(context))
                break
            case 3:
                assign_virtual_knob(virtual_knobs.knob_Send_Level3)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level3_Value.getProcessValue(context))
                break
            case 4:
                assign_virtual_knob(virtual_knobs.knob_Send_Level4)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level4_Value.getProcessValue(context))
                break
            case 5:
                assign_virtual_knob(virtual_knobs.knob_Send_Level5)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level5_Value.getProcessValue(context))
                break
            case 6:
                assign_virtual_knob(virtual_knobs.knob_Send_Level6)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level6_Value.getProcessValue(context))
                break
            case 7:
                assign_virtual_knob(virtual_knobs.knob_Send_Level7)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level7_Value.getProcessValue(context))
                break
            case 8:
                assign_virtual_knob(virtual_knobs.knob_Send_Level8)
                mSection.knob_FP_Value.setProcessValue(context,
                    mSection.knob_Send_Level8_Value.getProcessValue(context))
                break
        }

        if (sync_motorfader_within_Send_Mode_to_Send_Value) {
            // sync to Send, assigning the fader before HostBinding
            pageSend.makeValueBinding(fader.var_faderIn.mSurfaceValue,
                pageSend.mHostAccess.mTrackSelection.mMixerChannel
                    .mSends.getByIndex(selected_Send - 1).mLevel)

            // activate Send SubPage again to perform HostBinding
            selected_Send_changed_while_sync_motorfader_to_Send_Value = true
            if (active_page == pages.page_Send_LevelA) {
                mSection.var_ActivateSend_LevelA.setProcessValue(context, 1)
            } else if (active_page == pages.page_Send_LevelB) {
                mSection.var_ActivateSend_LevelB.setProcessValue(context, 1)
            }
        }
    }

    CueSend_Param_or_selected_CueSend_changed = function(context) {
        if (selected_CueSend_Param == CueSend_Params.CueSend_Level) {
            switch (selected_CueSend) {
                case 1:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Level1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Level1_Value.getProcessValue(context))
                    break
                case 2:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Level2)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Level2_Value.getProcessValue(context))
                    break
                case 3:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Level3)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Level3_Value.getProcessValue(context))
                    break
                case 4:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Level4)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Level4_Value.getProcessValue(context))
                    break
            }
        } else if (selected_CueSend_Param == CueSend_Params.CueSend_Pan) {
            switch (selected_CueSend) {
                case 1:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Pan1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Pan1_Value.getProcessValue(context))
                    break
                case 2:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Pan2)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Pan2_Value.getProcessValue(context))
                    break
                case 3:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Pan3)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Pan3_Value.getProcessValue(context))
                    break
                case 4:
                    assign_virtual_knob(virtual_knobs.knob_CueSend_Pan4)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_CueSend_Pan4_Value.getProcessValue(context))
                    break
            }
        }
    }

    // Update Hardware...
    mSection.var_CS_Gate_On.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Gate_Bypass.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Compr_On.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Compr_Bypass.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Tools_On.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Tools_Bypass.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Limit_On.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Limit_Bypass.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Sat_On.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    // Update Hardware...
    mSection.var_CS_Sat_Bypass.mOnProcessValueChange = function(context, value) {
        if (active_page == pages.page_CS_Bypass) {
            mSection.set_CS_Bypass_LEDs(context)
        }
    }

    mSection.set_CS_Bypass_LEDs = function(context) {
        setColorLED(context, cLink, RGB_Colors.c_blue)
        setColorLED(context, cPan, RGB_Colors.c_blue)
        setColorLED(context, cChannel, RGB_Colors.c_blue)
        setColorLED(context, cScroll, RGB_Colors.c_blue)

        if (mSection.var_CS_Gate_On.getProcessValue(context) == 0) {
            offLED(context, cLink)
        } else if (mSection.var_CS_Gate_Bypass.getProcessValue(context) == 1) {
            onLED(context, cLink)
        } else {
            flashingLED(context, cLink)
        }

        if (mSection.var_CS_Compr_On.getProcessValue(context) == 0) {
            offLED(context, cPan)
        } else if (mSection.var_CS_Compr_Bypass.getProcessValue(context) == 1) {
            onLED(context, cPan)
        } else {
            flashingLED(context, cPan)
        }

        if (mSection.var_CS_Tools_On.getProcessValue(context) == 0) {
            offLED(context, cChannel)
        } else if (mSection.var_CS_Tools_Bypass.getProcessValue(context) == 1) {
            onLED(context, cChannel)
        } else {
            flashingLED(context, cChannel)
        }

        if (mSection.var_CS_Limit_On.getProcessValue(context) == 0) {
            offLED(context, cScroll)
        } else if (mSection.var_CS_Limit_Bypass.getProcessValue(context) == 1) {
            onLED(context, cScroll)
        } else {
            flashingLED(context, cScroll)
        }

        if (mSection.var_CS_Sat_On.getProcessValue(context) == 0) {
            offLED(context, cSection)
        } else if (mSection.var_CS_Sat_Bypass.getProcessValue(context) == 1) {
            onLED(context, cSection)
        } else {
            flashingLED(context, cSection)
        }
    }

    // Note:
    // The following callback functions mTrackSelection.mMixerChannel.mOnTitleChange are only called
    // during a change from track to track if the change is slow enough (approx. 300 ms).

    pageMain.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    pageShift.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    pageEQ.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    pagePF.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    pageSend.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    pageCueSend.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    pageQC.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    pageAudio.mHostAccess.mTrackSelection.mMixerChannel.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        ActualTrack = objectTitle
        if (ActualTrack == '') {
            offLED(activeDevice, cSolo)
            offLED(activeDevice, cMute)
            offLED(activeDevice, cArm)
        }
    }

    return mSection
}

function midiBinding_knob_FP_Value(connect_with_knob) {
    var midi_channel
    if (connect_with_knob) {
        midi_channel = 0  // select regular midi channel 1 to connect
    } else {
        midi_channel = 1  // select unsuitable midi channel 2 to disconnect
    }
    mSection.knob_FP_Value.mMidiBinding.setInputPort(midiIn)
        .bindToControlChange(midi_channel, cKnobRotate).setTypeRelativeSignedBit()
}

function midiBinding_mSection() {
    mSection.btn_Prev.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cPrev)
    mSection.btn_Next.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cNext)
    midiBinding_knob_FP_Value(true)
    mSection.knob_Press.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cKnobPress)
    mSection.btn_Link.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cLink)
    mSection.btn_Pan.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cPan)
    mSection.btn_Channel.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cChannel)
    mSection.btn_Scroll.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cScroll)
    mSection.btn_Master.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cMaster)
    mSection.btn_Click.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cClick)
    mSection.btn_Section.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cSection)
    mSection.btn_Marker.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cMarker)
}

function hostBinding_mSection() {

    // Creation of subpages moved to the Main Part of the Script

    // hostBinding of all knob_Press functions

    pageMain.makeValueBinding(mSection.var_MonitorEnable,
        pageMain.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pageMain.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')

    pageShift.makeValueBinding(mSection.var_MonitorEnable,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pageShift.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')

    pageEQ.makeValueBinding(mSection.var_MonitorEnable,
        pageEQ.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pageEQ.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')

    pagePF.makeValueBinding(mSection.var_MonitorEnable,
        pagePF.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pagePF.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')

    pageSend.makeValueBinding(mSection.var_MonitorEnable,
        pageSend.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pageSend.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')
    pageCueSend.makeValueBinding(mSection.var_MonitorEnable,
        pageCueSend.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pageCueSend.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')

    pageQC.makeValueBinding(mSection.var_MonitorEnable,
        pageQC.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pageQC.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')

    pageAudio.makeValueBinding(mSection.var_MonitorEnable,
        pageAudio.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
    pageAudio.makeCommandBinding(mSection.var_MonitorEnableCmd, 'Edit', 'Monitor')

    pageShift.makeValueBinding(mSection.var_ValueLocked,
        pageShift.mHostAccess.mMouseCursor.mValueLocked)

    pageShift.makeCommandBinding(mSection.var_ZoomFull,
        'Zoom', 'Zoom Full')

    pageShift.makeCommandBinding(mSection.var_SetQuantize_to_4th,
        'Quantize Category', 'Set Quantize to 4th')

    // knob_Press function in Marker Mode and Hitpoint Mode, special command for Cubase 12
    pageMain.makeCommandBinding(mSection.var_InsertMarkerCB12,
        'Transport', 'Insert Marker')
    pageShift.makeCommandBinding(mSection.var_InsertMarkerCB12,
        'Transport', 'Insert Marker')

    // knob_Press function in Marker Mode and Hitpoint Mode, special command for Cubase 13
    pageMain.makeCommandBinding(mSection.var_InsertMarkerCB13,
        'Marker', 'Insert Marker')
    pageShift.makeCommandBinding(mSection.var_InsertMarkerCB13,
        'Marker', 'Insert Marker')

    // hostBinding of vertical zoom in/out on/of waveform functions
    pageShift.makeCommandBinding(mSection.var_VerticalZoomOutOfWaveform,
        'Zoom', 'Zoom Out Of Waveform Vertically')
    pageShift.makeCommandBinding(mSection.var_VerticalZoomInOnWaveform,
        'Zoom', 'Zoom In On Waveform Vertically')

    // use custom variables for additional zoom commands
    pageShift.makeCommandBinding(mSection.var_ZoomToSelectionFull,
        'Zoom', 'Zoom to Selection')
    pageShift.makeCommandBinding(mSection.var_ZoomToSelection,
        'Zoom', 'Zoom to Selection Horizontally')
    pageShift.makeCommandBinding(mSection.var_ZoomSelectedTracks,
        'Zoom', 'Zoom Tracks Exclusive')
    pageShift.makeCommandBinding(mSection.var_undoZoom,
        'Zoom', 'Undo Zoom')
    pageShift.makeCommandBinding(mSection.var_ZoomToLocators,
        'Zoom', 'Zoom to Locators')
    pageShift.makeCommandBinding(mSection.var_ZoomAllTracks,
        'Zoom', 'Zoom Tracks Full')

    // make functionality to show or hide Mixer Window available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_Mixer_Window,
        'Devices', 'Mixer')

    // make functionality to show or hide Video Window available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_Video_Window,
        'Devices', 'Video')

    // make functionality to show or hide Automation Panel available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_Automation_Panel,
        'Automation', 'Open Panel')

    // make functionality to show or hide Markers Window available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_Markers_Window,
        'Project', 'Open Markers')

    // make functionality to handle global undo available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_global_undo,
        'Edit', 'Undo')

    // make functionality to handle global redo available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_global_redo,
        'Edit', 'Redo')

    // make 'Left Selection Side to Cursor' function available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_left_selSide_to_cursor,
        'Edit', 'Left Selection Side to Cursor')

    // make 'Right Selection Side to Cursor' function available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_right_selSide_to_cursor,
        'Edit', 'Right Selection Side to Cursor')

    // hostBinding of special PrevTrack and NextTrack functions
    // to realize the QuickTracks functionality

    pageMain.makeActionBinding(mSection.var_PrevTrack,
        pageMain.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageMain.makeActionBinding(mSection.var_NextTrack,
        pageMain.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageShift.makeActionBinding(mSection.var_PrevTrack,
        pageShift.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageShift.makeActionBinding(mSection.var_NextTrack,
        pageShift.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageEQ.makeActionBinding(mSection.var_PrevTrack,
        pageEQ.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageEQ.makeActionBinding(mSection.var_NextTrack,
        pageEQ.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pagePF.makeActionBinding(mSection.var_PrevTrack,
        pagePF.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pagePF.makeActionBinding(mSection.var_NextTrack,
        pagePF.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageSend.makeActionBinding(mSection.var_PrevTrack,
        pageSend.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageSend.makeActionBinding(mSection.var_NextTrack,
        pageSend.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCueSend.makeActionBinding(mSection.var_PrevTrack,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCueSend.makeActionBinding(mSection.var_NextTrack,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageQC.makeActionBinding(mSection.var_PrevTrack,
        pageQC.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageQC.makeActionBinding(mSection.var_NextTrack,
        pageQC.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageAudio.makeActionBinding(mSection.var_PrevTrack,
        pageAudio.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageAudio.makeActionBinding(mSection.var_NextTrack,
        pageAudio.mHostAccess.mTrackSelection.mAction.mNextTrack)

    // Bypass Button + Link Button within Master Mode - Control Room Source Select
    // use custom variable for to handle Control Room Source Select
    pageMain.makeCommandBinding(mSection.var_CR_Source_Select,
        'Control Room', 'Switch: Source Select')

    // Bypass Button + Pan Button within Master Mode - Control Room Monitor Select
    // use custom variable for to handle Control Room Monitor Select
    pageMain.makeCommandBinding(mSection.var_CR_Monitor_Select,
        'Control Room', 'Switch: Speakers Select')

    // make functionality to close all plugin windows available everywhere (except Custom Mode)
    makeCommandBinding_on_all_pages_except_custom(mSection.var_close_all_plugin_windows,
        'Windows', 'Close All Plug-in Windows')

    // Link Button - edit Channel
    // use custom variables to edit Channel (open/close window)
    pageMain.makeValueBinding(mSection.var_edit_Channel,
        pageMain.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pageMain.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    // make functionality to edit Channel also available everywhere (except Custom Mode)

    pageShift.makeValueBinding(mSection.var_edit_Channel,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pageShift.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    pageEQ.makeValueBinding(mSection.var_edit_Channel,
        pageEQ.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pageEQ.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    pagePF.makeValueBinding(mSection.var_edit_Channel,
        pagePF.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pagePF.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    pageSend.makeValueBinding(mSection.var_edit_Channel,
        pageSend.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pageSend.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    pageCueSend.makeValueBinding(mSection.var_edit_Channel,
        pageCueSend.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pageCueSend.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    pageQC.makeValueBinding(mSection.var_edit_Channel,
        pageQC.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pageQC.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    pageAudio.makeValueBinding(mSection.var_edit_Channel,
        pageAudio.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    pageAudio.makeCommandBinding(mSection.var_edit_Channel_Cmd, 'Edit', 'Edit Channel Settings')

    // Pan Button - Pan Mode
    pageMain.makeActionBinding(mSection.var_ActivatePan, SubPage_Pan.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivatePan, SubPage_Pan.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Pan Button is pressed
    // or not, therefore an activation of the subpage SubPage_Pan
    // is done directly under mSection.btn_Pan.mSurfaceValue

    pageMain.makeActionBinding(mSection.var_Prev,
        pageMain.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Pan)
    pageMain.makeActionBinding(mSection.var_Next,
        pageMain.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Pan)

    // the hostBinding of knob_Pan_Value here is needed for the start-situation
    if (debug_assign_virtual_knob)
        console.log('089) hostBinding_mSection: Pan')

    pageMain.makeValueBinding(mSection.knob_Pan_Value,
        pageMain.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan).setSubPage(SubPage_Pan)
    // handling of knob_Press moved to callback function of knob_Press

    // Channel Button - Channel Mode
    pageMain.makeActionBinding(mSection.var_ActivateChannel, SubPage_Channel.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateChannel, SubPage_Channel.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Channel Button is pressed
    // or not, therefore an activation of the subpage SubPage_Channel
    // is done directly under mSection.btn_Channel.mSurfaceValue

    pageMain.makeActionBinding(mSection.var_Prev,
        pageMain.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Channel)
    pageMain.makeActionBinding(mSection.var_Next,
        pageMain.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Channel)

    // handling of knob_Press moved to callback function of knob_Press

    // make functionality to scroll through tracks available everywhere
    // no use of command bindings here to support maximum performance

    pageMain.makeActionBinding(mSection.knob_Channel_Left,
        pageMain.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageMain.makeActionBinding(mSection.knob_Channel_Right,
        pageMain.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageShift.makeActionBinding(mSection.knob_Channel_Left,
        pageShift.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageShift.makeActionBinding(mSection.knob_Channel_Right,
        pageShift.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCustomA0.makeActionBinding(mSection.knob_Channel_Left,
        pageCustomA0.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCustomA0.makeActionBinding(mSection.knob_Channel_Right,
        pageCustomA0.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCustomA1.makeActionBinding(mSection.knob_Channel_Left,
        pageCustomA1.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCustomA1.makeActionBinding(mSection.knob_Channel_Right,
        pageCustomA1.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCustomA2.makeActionBinding(mSection.knob_Channel_Left,
        pageCustomA2.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCustomA2.makeActionBinding(mSection.knob_Channel_Right,
        pageCustomA2.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCustomB0.makeActionBinding(mSection.knob_Channel_Left,
        pageCustomB0.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCustomB0.makeActionBinding(mSection.knob_Channel_Right,
        pageCustomB0.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCustomB1.makeActionBinding(mSection.knob_Channel_Left,
        pageCustomB1.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCustomB1.makeActionBinding(mSection.knob_Channel_Right,
        pageCustomB1.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCustomB2.makeActionBinding(mSection.knob_Channel_Left,
        pageCustomB2.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCustomB2.makeActionBinding(mSection.knob_Channel_Right,
        pageCustomB2.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageEQ.makeActionBinding(mSection.knob_Channel_Left,
        pageEQ.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageEQ.makeActionBinding(mSection.knob_Channel_Right,
        pageEQ.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pagePF.makeActionBinding(mSection.knob_Channel_Left,
        pagePF.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pagePF.makeActionBinding(mSection.knob_Channel_Right,
        pagePF.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageSend.makeActionBinding(mSection.knob_Channel_Left,
        pageSend.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageSend.makeActionBinding(mSection.knob_Channel_Right,
        pageSend.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageCueSend.makeActionBinding(mSection.knob_Channel_Left,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageCueSend.makeActionBinding(mSection.knob_Channel_Right,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageQC.makeActionBinding(mSection.knob_Channel_Left,
        pageQC.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageQC.makeActionBinding(mSection.knob_Channel_Right,
        pageQC.mHostAccess.mTrackSelection.mAction.mNextTrack)

    pageAudio.makeActionBinding(mSection.knob_Channel_Left,
        pageAudio.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    pageAudio.makeActionBinding(mSection.knob_Channel_Right,
        pageAudio.mHostAccess.mTrackSelection.mAction.mNextTrack)

    // Scroll Button - Scroll Mode
    pageMain.makeActionBinding(mSection.var_ActivateScroll, SubPage_Scroll.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateScroll, SubPage_Scroll.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Scroll Button is pressed
    // or not, therefore an activation of the subpage SubPage_Scroll
    // is done directly under mSection.btn_Scroll.mSurfaceValue

    pageMain.makeCommandBinding(mSection.var_Prev,
        'Transport', 'Nudge Cursor Left').setSubPage(SubPage_Scroll)
    pageMain.makeCommandBinding(mSection.var_Next,
        'Transport', 'Nudge Cursor Right').setSubPage(SubPage_Scroll)

    // handling of knob_Press moved to callback function of knob_Press

    // Master Button - CR Volume Mode
    pageMain.makeActionBinding(mSection.var_ActivateMaster, SubPage_Master.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateMaster, SubPage_Master.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not, therefore an activation of the subpage SubPage_Master
    // is done directly under mSection.btn_Master.mSurfaceValue

    pageMain.makeActionBinding(mSection.var_Prev,
        pageMain.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Master)
    pageMain.makeActionBinding(mSection.var_Next,
        pageMain.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Master)

    // the hostBinding of knob_CRLevel_Value here is needed for the start-situation
    if (debug_assign_virtual_knob)
        console.log('090) hostBinding_mSection: CRLevel_Value')

    pageMain.makeValueBinding(mSection.knob_CRLevel_Value,
        pageMain.mHostAccess.mControlRoom.mMainChannel.mLevelValue).setSubPage(SubPage_Master)
    // handling of knob_Press moved to callback function of knob_Press

    // Click Button - toggle Click Mode
    pageMain.makeActionBinding(mSection.var_ActivateClick, SubPage_Click.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateClick, SubPage_Click.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Click Button is pressed
    // or not, therefore an activation of the subpage SubPage_Click
    // is done directly under mSection.btn_Click.mSurfaceValue

    // hostbinding of custom variable for to set click to on/off
    pageMain.makeValueBinding(mSection.var_MetronomeActive,
        pageMain.mHostAccess.mTransport.mValue.mMetronomeActive)
    pageMain.makeActionBinding(mSection.var_Prev,
        pageMain.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Click)
    pageMain.makeActionBinding(mSection.var_Next,
        pageMain.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Click)

    // the hostBinding of knob_ClickLevel_Value here is needed for the start-situation
    if (debug_assign_virtual_knob)
        console.log('091) hostBinding_mSection: ClickLevel')

    pageMain.makeValueBinding(mSection.knob_ClickLevel_Value,
        pageMain.mHostAccess.mTransport.mValue.mMetronomeClickLevel).setSubPage(SubPage_Click)
    // handling of knob_Press moved to callback function of knob_Press

    // Section Button - Event Mode (Button Section without Shift)  // changed from Nudge Mode
    pageMain.makeActionBinding(mSection.var_ActivateSection, SubPage_Section.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateSection, SubPage_Section.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_Section
    // is done directly under mSection.btn_Section.mSurfaceValue

    // all commands adjusted for the Event Mode
    pageMain.makeCommandBinding(mSection.var_Prev,
        'Transport', 'Locate Previous Event').setSubPage(SubPage_Section)
    pageMain.makeCommandBinding(mSection.var_Next,
        'Transport', 'Locate Next Event').setSubPage(SubPage_Section)
    pageMain.makeCommandBinding(mSection.knob_Section_Left,
        'Transport', 'Locate Previous Event').setSubPage(SubPage_Section)
    pageMain.makeCommandBinding(mSection.knob_Section_Right,
        'Transport', 'Locate Next Event').setSubPage(SubPage_Section)
    // handling of knob_Press moved to callback function of knob_Press

    // Marker Button - Marker Mode
    pageMain.makeActionBinding(mSection.var_ActivateMarker, SubPage_Marker.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateMarker, SubPage_Marker.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_Marker
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pageMain.makeCommandBinding(mSection.var_Prev,
        'Transport', 'Locate Previous Marker').setSubPage(SubPage_Marker)
    pageMain.makeCommandBinding(mSection.var_Next,
        'Transport', 'Locate Next Marker').setSubPage(SubPage_Marker)
    pageMain.makeCommandBinding(mSection.knob_Marker_Left,
        'Transport', 'Locate Previous Marker').setSubPage(SubPage_Marker)
    pageMain.makeCommandBinding(mSection.knob_Marker_Right,
        'Transport', 'Locate Next Marker').setSubPage(SubPage_Marker)
    // handling of knob_Press moved to callback function of knob_Press

    // Pan Mode - Page Handler
    // variable to realize toggle Center function for Pan Button
    // necessary initial setting for the case, when Pan at start is set to Center:
    var Pan_Value_before_set_to_Center = 0.5

    var start_ActivatePan_after_3ms = new Date().getTime()

    mSection.var_ActivatePan_after_3ms.mOnProcessValueChange = function(context, value) {
        if (value != 0) {
            var time_now = new Date().getTime()
            if (time_now < start_ActivatePan_after_3ms + 3) {
                mSection.var_ActivatePan_after_3ms.setProcessValue(context, 1)
            } else {
                mSection.var_ActivatePan.setProcessValue(context, 1)
                mSection.var_ActivatePan_after_3ms.setProcessValue(context, 0)
            }
        }
    }

    SubPage_Pan.mOnActivate = function(context) {
        if (debug_1)
            console.log('092) activate page Pan')

        if ((Pan2_active) && (Cubase13_or_higher_installed)) {
            Pan2_active = false
            disable_set_Pan_to_center = true
            midiBinding_knob_Pan2_Value(false)
            midiBinding_knob_FP_Value(true)
            setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        }

        var get_Pan_Value

        if (EQ_Mode_was_active == false) {
            if (first_pan_activate == false) { // no exit for the very first time on the Main Page
                // the first subpage SubPage_Pan on the Main Page will always be activated
                // when switched from Shift Page to Main Page
                // so Pan needs an anti-flicker-exit
                // when the last subpage on the Main Page was not Pan
                if ((return_from_shift_anti_flicker) && (last_active_pageMain != pages.page_Pan)) {
                    return_from_shift_anti_flicker = false
                    return
                }
            } else {
                // code at this point is executed only at startup
                // no color for the Touch LED as default
                offLED(context, cTouch)
                setColorLED(context, cTouch, RGB_Colors.c_off)

                first_pan_activate = false
            }
        } else {
            EQ_Mode_was_active = false
        }

        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Channel_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        setColorLED(context, cScroll, RGB_Colors.c_green_medium)
        onLED(context, cPan)

        // if the Pan Button is pressed twice reset track to Center
        if (active_pageMain_before == pages.page_Pan) {
            if (disable_set_Pan_to_center == false) {
                get_Pan_Value = mSection.knob_Pan_Value.getProcessValue(context)
                if ((get_Pan_Value > (0.5 - 0.005))
                && (get_Pan_Value < (0.5 + 0.005))) {
                    mSection.knob_Pan_Value.setProcessValue(context,
                        Pan_Value_before_set_to_Center)
                } else {
                    Pan_Value_before_set_to_Center = get_Pan_Value
                    mSection.knob_Pan_Value.setProcessValue(context, 0.5)
                }
            }
            disable_set_Pan_to_center = false
        }
        // disable not needed because of implicit call
        disable_set_CRLevel_to_0dB_or_before_dB = false

        assign_virtual_knob(virtual_knobs.knob_Pan)
        last_active_pageMain_with_virtual_knob = pages.page_Pan
        active_page = pages.page_Pan

        // needed for some cases for assign_virtual_knob
        if ((active_pageMain_before != pages.page_Pan)
        && (active_pageMain_before != pages.page_Master)) {
            if (toShift_or_toCustom_when_Pan_Mode) {
                toShift_or_toCustom_when_Pan_Mode = false
            }
            start_ActivatePan_after_3ms = new Date().getTime()
            mSection.var_ActivatePan_after_3ms.setProcessValue(context, 1)
        }
        if (toShift_or_toCustom_when_Pan_Mode) {
            toShift_or_toCustom_when_Pan_Mode = false
        }
        active_pageMain_before = active_page
        active_pageMain_before_Click = active_page
    }
    SubPage_Pan.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('093) deactivate page Pan')

        if ((Pan2_active) && (Cubase13_or_higher_installed)) {
            Pan2_active = false
            disable_set_Pan_to_center = true
            midiBinding_knob_Pan2_Value(false)
            midiBinding_knob_FP_Value(true)
            setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        }
        active_page = pages.page_none
    }

    // Channel Mode - Page Handler
    SubPage_Channel.mOnActivate = function(context) {
        if (debug_1)
            console.log('094) activate page Channel')
        offLED(context, cPan)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Channel_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        setColorLED(context, cScroll, RGB_Colors.c_green_medium)
        onLED(context, cChannel)

        // if the Channel Button is pressed twice open Custom Page A0
        if (active_pageMain_before == pages.page_Channel) {
            active_pageMain_before = pages.page_none
            mSection.var_ActivateCustomA0.setProcessValue(context, 1)
        }

        active_page = pages.page_Channel
        active_pageMain_before = active_page
        active_pageMain_before_Click = active_page
    }
    SubPage_Channel.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('095) deactivate page Channel')
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = true
        active_page = pages.page_none
    }

    // Scroll Mode - Page Handler
    SubPage_Scroll.mOnActivate = function(context) {
        if (debug_1)
            console.log('096) activate page Scroll')

        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cMaster)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Channel_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        setColorLED(context, cScroll, RGB_Colors.c_green_medium)

        if (Scroll_Mode_per_frame) {
            flashingLED(context, cScroll)
        } else {
            onLED(context, cScroll)
        }

        active_page = pages.page_Scroll
        active_pageMain_before = active_page
        active_pageMain_before_Click = active_page
    }
    SubPage_Scroll.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('097) deactivate page Scroll')
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = true
        active_page = pages.page_none
    }

    // CR Volume Mode - Page Handler

    var start_ActivateMaster_after_3ms = new Date().getTime()

    mSection.var_ActivateMaster_after_3ms.mOnProcessValueChange = function(context, value) {
        if (value != 0) {
            var time_now = new Date().getTime()
            if (time_now < start_ActivateMaster_after_3ms + 3) {
                mSection.var_ActivateMaster_after_3ms.setProcessValue(context, 1)
            } else {
                mSection.var_ActivateMaster.setProcessValue(context, 1)
                mSection.var_ActivateMaster_after_3ms.setProcessValue(context, 0)
            }
        }
    }

    SubPage_Master.mOnActivate = function(context) {
        if (debug_1)
            console.log('098) activate page Master')
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Channel_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        setColorLED(context, cScroll, RGB_Colors.c_green_medium)
        onLED(context, cMaster)

        // if the Master Button is pressed twice reset CRLevel to 0 dB
        // or if it was already set to 0 dB, set CRLevel to the value before
        if (active_pageMain_before == pages.page_Master) {
            if (disable_set_CRLevel_to_0dB_or_before_dB == false) {
                var get_CRLevel_Value =
                    mSection.knob_CRLevel_Value.getProcessValue(context)
                if ((get_CRLevel_Value > (CRLevel_Value_0dB - 0.005))
                && (get_CRLevel_Value < (CRLevel_Value_0dB + 0.005))) {
                    mSection.knob_CRLevel_Value
                        .setProcessValue(context, CRLevel_Value_before_set_to_0dB)
                } else {
                    CRLevel_Value_before_set_to_0dB = get_CRLevel_Value
                    mSection.knob_CRLevel_Value
                        .setProcessValue(context, CRLevel_Value_0dB)
                }
            }
            disable_set_CRLevel_to_0dB_or_before_dB = false
        }

        // disable not needed because of implicit call
        disable_set_Pan_to_center = false

        assign_virtual_knob(virtual_knobs.knob_CRLevel)
        last_active_pageMain_with_virtual_knob = pages.page_Master
        active_page = pages.page_Master

        // needed for some cases for assign_virtual_knob
        if ((active_pageMain_before != pages.page_Pan)
        && (active_pageMain_before != pages.page_Master)) {
            start_ActivateMaster_after_3ms = new Date().getTime()
            mSection.var_ActivateMaster_after_3ms.setProcessValue(context, 1)
        }
        active_pageMain_before = active_page
        active_pageMain_before_Click = active_page
    }
    SubPage_Master.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('099) deactivate page Master')
        active_page = pages.page_none
    }

    //toggle Click Mode - Page Handler

    var start_ActivateClick_after_3ms = new Date().getTime()

    mSection.var_ActivateClick_after_3ms.mOnProcessValueChange = function(context, value) {
        if (value != 0) {
            var time_now = new Date().getTime()
            if (time_now < start_ActivateClick_after_3ms + 3) {
                mSection.var_ActivateClick_after_3ms.setProcessValue(context, 1)
            } else {
                mSection.var_ActivateClick.setProcessValue(context, 1)
                mSection.var_ActivateClick_after_3ms.setProcessValue(context, 0)
            }
        }
    }

    SubPage_Click.mOnActivate = function(context) {
        if (debug_1)
            console.log('100) activate page Click')

        if (disable_Click_off == false) {
            if (mSection.var_MetronomeActive.getProcessValue(context) != 0) {
                // disable click and exit to last Mode on Main Page
                disable_Click_off = false
                mSection.var_MetronomeActive.setProcessValue(context, 0)
                offLED(context, cClick)
                if (active_pageMain_before_Click == pages.page_Pan) {
                    disable_set_Pan_to_center = true
                    mSection.var_ActivatePan.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Channel) {
                    // prevent subsequent jump to Custom Mode
                    active_pageMain_before = pages.page_none
                    mSection.var_ActivateChannel.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Scroll) {
                    mSection.var_ActivateScroll.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Master) {
                    mSection.var_ActivateMaster.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Section) {
                    mSection.var_ActivateSection.setProcessValue(context, 1)
                } else if (active_pageMain_before_Click == pages.page_Marker) {
                    // prevent toggle Markers Window
                    active_pageMain_before = pages.page_none
                    mSection.var_ActivateMarker.setProcessValue(context, 1)
                } else {
                    disable_set_Pan_to_center = true
                    mSection.var_ActivatePan.setProcessValue(context, 1)
                }
                return
            } else {
                mSection.var_MetronomeActive.setProcessValue(context, 1)
                onLED(context, cClick)
            }
        } else {
            disable_Click_off = false
        }

        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Channel_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        setColorLED(context, cScroll, RGB_Colors.c_green_medium)

        assign_virtual_knob(virtual_knobs.knob_ClickLevel)
        // SubPage_Click will never be the last active subpage on Main Page
        // so last_active_pageMain_with_virtual_knob is not set here

        active_page = pages.page_Click

        // needed for some cases for assign_virtual_knob
        if ((active_pageMain_before != pages.page_Pan)
        && (active_pageMain_before != pages.page_Master)
        && (active_pageMain_before != pages.page_Click)) {
            disable_Click_off = true
            start_ActivateClick_after_3ms = new Date().getTime()
            mSection.var_ActivateClick_after_3ms.setProcessValue(context, 1)
        }
        active_pageMain_before = active_page
    }
    SubPage_Click.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('101) deactivate page Click')
        active_page = pages.page_none
    }

    // Event Mode (Button Section without Shift) - Page Handler
    SubPage_Section.mOnActivate = function(context) {
        if (debug_1)
            console.log('102) activate page Section')
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cMarker)
        mSection.set_edit_Channel_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        setColorLED(context, cScroll, RGB_Colors.c_green_medium)
        onLED(context, cSection)

        active_page = pages.page_Section
        active_pageMain_before = active_page
        active_pageMain_before_Click = active_page
    }
    SubPage_Section.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('103) deactivate page Section')
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = true
        active_page = pages.page_none
    }

    // Marker Mode - Page Handler
    SubPage_Marker.mOnActivate = function(context) {
        if (debug_1)
            console.log('104) activate page Marker')
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cSection)
        mSection.set_edit_Channel_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_yellow_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        setColorLED(context, cScroll, RGB_Colors.c_green_medium)
        onLED(context, cMarker)

        // if the Marker Button is pressed twice show or to hide the Markers Window
        if (active_pageMain_before == pages.page_Marker) {
            mSection.var_Markers_Window.setProcessValue(context, 1)
        }

        active_page = pages.page_Marker
        active_pageMain_before = active_page
        active_pageMain_before_Click = active_page
    }
    SubPage_Marker.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('105 deactivate page Marker')
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = true
        active_page = pages.page_none
    }


    // * Shift Page *

    // Link Button - use custom variable to edit Instrument (open/close window)
    // Instrument state should also be switchable on the Main Page
    // before the Shift Page is activated.
    pageMain.makeValueBinding(mSection.var_edit_Instrument,
        pageMain.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen)
    pageShift.makeValueBinding(mSection.var_edit_Instrument,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen)

    // Pan Button (Shift) - Hitpoint Mode
    pageMain.makeActionBinding(mSection.var_ActivateHitpoint, SubPage_Hitpoint.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateHitpoint, SubPage_Hitpoint.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Pan Button is pressed
    // or not, therefore an activation of the subpage SubPage_Hitpoint
    // is done directly under mSection.btn_Pan.mSurfaceValue

    pageShift.makeCommandBinding(mSection.var_Prev,
        'Transport', 'Locate Previous Hitpoint').setSubPage(SubPage_Hitpoint)
    pageShift.makeCommandBinding(mSection.var_Next,
        'Transport', 'Locate Next Hitpoint').setSubPage(SubPage_Hitpoint)
    pageShift.makeCommandBinding(mSection.knob_Hitpoint_Left,
        'Transport', 'Locate Previous Hitpoint').setSubPage(SubPage_Hitpoint)
    pageShift.makeCommandBinding(mSection.knob_Hitpoint_Right,
        'Transport','Locate Next Hitpoint').setSubPage(SubPage_Hitpoint)
    // handling of knob_Press moved to callback function of knob_Press

    // Channel Button (Shift) = Lock Button - AI Mode
    pageMain.makeActionBinding(mSection.var_ActivateLock, SubPage_Lock.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateLock, SubPage_Lock.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Channel Button is pressed
    // or not, therefore an activation of the subpage SubPage_Lock
    // is done directly under mSection.btn_Channel.mSurfaceValue

    // handling of Prev Button is done directly under mSection.btn_Prev.mSurfaceValue
    // handling of Next Button is done directly under mSection.btn_Next.mSurfaceValue

    // the hostBinding of knob_ValueUnderMouse_Value here is needed for the start-situation
    if (debug_assign_virtual_knob)
        console.log('106) hostBinding_mSection: ValueUnderMouse')

    pageShift.makeValueBinding(mSection.knob_ValueUnderMouse_Value,
        pageShift.mHostAccess.mMouseCursor.mValueUnderMouse).setSubPage(SubPage_Lock)
    // handling of knob_Press moved to callback function of knob_Press

    // Scroll Button (Shift) = Zoom Button - Zoom Mode
    pageMain.makeActionBinding(mSection.var_ActivateZoom, SubPage_Zoom.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateZoom, SubPage_Zoom.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Scroll Button is pressed
    // or not, therefore an activation of the subpage SubPage_Zoom
    // is done directly under mSection.btn_Scroll.mSurfaceValue

    pageShift.makeCommandBinding(mSection.var_Prev,
        'Zoom', 'Zoom Out Vertically').setSubPage(SubPage_Zoom)
    pageShift.makeCommandBinding(mSection.var_Next,
        'Zoom', 'Zoom In Vertically').setSubPage(SubPage_Zoom)
    pageShift.makeCommandBinding(mSection.knob_Zoom_Left,
        'Zoom', 'Zoom Out').setSubPage(SubPage_Zoom)
    pageShift.makeCommandBinding(mSection.knob_Zoom_Right,
        'Zoom', 'Zoom In').setSubPage(SubPage_Zoom)
    // handling of knob_Press moved to callback function of knob_Press

    // Master Button (Shift) - EQ Mode Enter
    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not is done directly under mSection.btn_Master.mSurfaceValue

    // Click Button (Shift) - Quantize Mode
    pageMain.makeActionBinding(mSection.var_ActivateQuantize, SubPage_Quantize.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateQuantize, SubPage_Quantize.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Click Button is pressed
    // or not, therefore an activation of the subpage SubPage_Quantize
    // is done directly under mSection.btn_Click.mSurfaceValue

    pageShift.makeCommandBinding(mSection.var_Prev,
        'Quantize Category', 'Select Prev Quantize').setSubPage(SubPage_Quantize)
    pageShift.makeCommandBinding(mSection.var_Next,
        'Quantize Category', 'Select Next Quantize').setSubPage(SubPage_Quantize)
    pageShift.makeCommandBinding(mSection.knob_Quantize_Left,
        'Quantize Category', 'Select Prev Quantize').setSubPage(SubPage_Quantize)
    pageShift.makeCommandBinding(mSection.knob_Quantize_Right,
        'Quantize Category', 'Select Next Quantize').setSubPage(SubPage_Quantize)
    // handling of knob_Press moved to callback function of knob_Press

    // use custom variable to show or to hide the Quantize Panel
    pageShift.makeCommandBinding(mSection.var_Quantize_Panel, 'Quantize Category', 'Quantize Setup')

    // Section Button (Shift) - Nudge Mode  // moved to Shift Page
    // moved from Main Page to Shift Page
    pageMain.makeActionBinding(mSection.var_ActivateNudge, SubPage_Nudge.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateNudge, SubPage_Nudge.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_Nudge
    // is done directly under mSection.btn_Section.mSurfaceValue

    pageShift.makeCommandBinding(mSection.var_Prev,
        'Nudge', 'Left').setSubPage(SubPage_Nudge)
    pageShift.makeCommandBinding(mSection.var_Next,
        'Nudge', 'Right').setSubPage(SubPage_Nudge)
    pageShift.makeCommandBinding(mSection.knob_Nudge_Left,
        'Nudge', 'Left').setSubPage(SubPage_Nudge)
    pageShift.makeCommandBinding(mSection.knob_Nudge_Right,
        'Nudge', 'Right').setSubPage(SubPage_Nudge)
    // handling of knob_Press moved to callback function of knob_Press

    // Marker Button (Shift) - CS Bypass Mode
    pageMain.makeActionBinding(mSection.var_ActivateCS_Bypass,
        SubPage_CS_Bypass.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateCS_Bypass,
        SubPage_CS_Bypass.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_CS_Bypass
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pageShift.makeActionBinding(mSection.var_Prev,
        pageShift.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_CS_Bypass)
    pageShift.makeActionBinding(mSection.var_Next,
        pageShift.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_CS_Bypass)
    // handling of knob_Press moved to callback function of knob_Press

    // use custom variables for to handle CS Bypass Mode settings
    pageShift.makeValueBinding(mSection.var_CS_Gate_On,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mGate.mOn).setSubPage(SubPage_CS_Bypass)
    pageShift.makeValueBinding(mSection.var_CS_Gate_Bypass,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mGate.mBypass).setSubPage(SubPage_CS_Bypass)

    pageShift.makeValueBinding(mSection.var_CS_Compr_On,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mCompressor.mOn).setSubPage(SubPage_CS_Bypass)
    pageShift.makeValueBinding(mSection.var_CS_Compr_Bypass,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mCompressor.mBypass).setSubPage(SubPage_CS_Bypass)

    pageShift.makeValueBinding(mSection.var_CS_Tools_On,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mTools.mOn).setSubPage(SubPage_CS_Bypass)
    pageShift.makeValueBinding(mSection.var_CS_Tools_Bypass,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mTools.mBypass).setSubPage(SubPage_CS_Bypass)

    pageShift.makeValueBinding(mSection.var_CS_Limit_On,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mLimiter.mOn).setSubPage(SubPage_CS_Bypass)
    pageShift.makeValueBinding(mSection.var_CS_Limit_Bypass,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mLimiter.mBypass).setSubPage(SubPage_CS_Bypass)

    pageShift.makeValueBinding(mSection.var_CS_Sat_On,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mSaturator.mOn).setSubPage(SubPage_CS_Bypass)
    pageShift.makeValueBinding(mSection.var_CS_Sat_Bypass,
        pageShift.mHostAccess.mTrackSelection.mMixerChannel.mInsertAndStripEffects
            .mStripEffects.mSaturator.mBypass).setSubPage(SubPage_CS_Bypass)

    // Hitpoint Mode - Page Handler
    SubPage_Hitpoint.mOnActivate = function(context) {
        if (debug_1)
            console.log('107) activate page Hitpoint')

        offLED(context, cPrev)
        offLED(context, cNext)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Instrument_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_magenta)
        setColorLED(context, cChannel, RGB_Colors.c_pink)
        setColorLED(context, cScroll, RGB_Colors.c_white_medium)

        onLED(context, cPan)

        // if the Pan Button is pressed twice show or to hide the Markers Window
        if (active_pageShift_before == pages.page_Hitpoint) {
            mSection.var_Markers_Window.setProcessValue(context, 1)
        }

        active_page = pages.page_Hitpoint
        return_from_CS_Bypass = active_page
        active_pageShift_before = active_page
        enable_toggle_lock_with_button = 0

        if (reset_resolution_of_AI_Mode_after_exit) {
            low_resolution_AI_Mode_locked = false
            high_resolution_AI_Mode_locked = false
        }
    }
    SubPage_Hitpoint.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('108) deactivate page Hitpoint')
        active_page = pages.page_none
    }

    // AI Mode - Page Handler

    var start_ActivateLock_after_3ms = new Date().getTime()

    mSection.var_ActivateLock_after_3ms.mOnProcessValueChange = function(context, value) {
        if (value != 0) {
            var time_now = new Date().getTime()
            if (time_now < start_ActivateLock_after_3ms + 3) {
                mSection.var_ActivateLock_after_3ms.setProcessValue(context, 1)
            } else {
                mSection.var_ActivateLock.setProcessValue(context, 1)
                mSection.var_ActivateLock_after_3ms.setProcessValue(context, 0)
            }
        }
    }

    SubPage_Lock.mOnActivate = function(context) {
        if (debug_1)
            console.log('109) activate page Lock')

        // special colors for Write Button LED & Read Button LED
        if (specialmemory_ValueUnderMouse_has_data[0]) {
            setColorLED(context, cWrite, RGB_Colors.c_orangered)
            setColorLED(context, cRead, RGB_Colors.c_green_light)
        } else {
            setColorLED(context, cWrite, RGB_Colors.c_violet)
            setColorLED(context, cRead, RGB_Colors.c_violet)
        }

        // Write Button LED & Read Button LED permanently switched on
        onLED(context, cWrite)
        onLED(context, cRead)

        if (low_resolution_AI_Mode_locked) {
            flashingLED(context, cPrev)
        }
        if (high_resolution_AI_Mode_locked) {
            flashingLED(context, cNext)
        }

        offLED(context, cPan)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Instrument_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_magenta)
        setColorLED(context, cChannel, RGB_Colors.c_pink)
        setColorLED(context, cScroll, RGB_Colors.c_white_medium)

        assign_virtual_knob(virtual_knobs.knob_ValueUnderMouse)
        last_active_pageShift_with_virtual_knob = pages.page_Lock
        to_AI_Mode_with_Shift = false
        active_page = pages.page_Lock
        return_from_CS_Bypass = active_page

        // Remark to Users:
        // The lock function also remembers for which track the value was locked.
        // So if a track-specific value is locked and then the track is changed, it may be
        // that later when calling the AI Mode again you have the impression that there is an error,
        // because the still locked (hidden) value belongs to a different track.

        // if the Channel Button is pressed twice toggle lock current value
        if (ValueUnderMouse_changed_with_button) {
            // no toggeling of lock when the value under mouse was changed with button
            ValueUnderMouse_changed_with_button = false
        } else {
            if (enable_toggle_lock_with_button == 2) {
                if (active_pageShift_before == pages.page_Lock) {
                    if (mSection.var_ValueLocked.getProcessValue(context)) {
                        // toggle state to unlocked
                        mSection.var_ValueLocked.setProcessValue(context, 0)
                    } else {
                        // toggle state to locked
                        mSection.var_ValueLocked.setProcessValue(context, 1)
                    }
                }
            } else {
                // skip initial duplicate call
                enable_toggle_lock_with_button++
            }
        }

        // handle Channel LED
        if (mSection.var_ValueLocked.getProcessValue(context)) {
            // as long as the value is locked, the Channel LED is flashing
            flashingLED(context, cChannel)
        } else {
            onLED(context, cChannel)
        }

        // needed for some cases for assign_virtual_knob
        if (active_pageShift_before != pages.page_Lock) {
            bypass_LED_reset_within_onDeactivate_SubPage_Lock = true
            start_ActivateLock_after_3ms = new Date().getTime()
            mSection.var_ActivateLock_after_3ms.setProcessValue(context, 1)
        }
        active_pageShift_before = active_page
    }
    SubPage_Lock.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('110) deactivate page Lock')

        if (bypass_LED_reset_within_onDeactivate_SubPage_Lock) {
            bypass_LED_reset_within_onDeactivate_SubPage_Lock = false
        } else {
            // Write Button LED & Read Button LED normally switched off
            offLED(context, cWrite)
            offLED(context, cRead)

            // reload normal colors for Write Button LED & Read Button LED
            setColorLED(context, cWrite, RGB_Colors.c_red)
            setColorLED(context, cRead, RGB_Colors.c_green)
        }
        active_page = pages.page_none
    }

    // Zoom Mode - Page Handler
    SubPage_Zoom.mOnActivate = function(context) {
        if (debug_1)
            console.log('111) activate page Zoom')

        // Do not interpret reactivation from Prev/Next callback as 'press button twice'.
        if ((btn_Prev_running) || (btn_Next_running)) {
            // override none assignment made by the zoom deactivate callback function
            active_page = pages.page_Zoom
            return
        }

        if (first_shift_activate == false) {
            if (first_zoom_activate == false) { // no exit for the very first time on the Shift Page
                // the first subpage SubPage_Zoom on the Shit Page will always be activated
                // when switched from Main Page to Shift Page, so Zoom needs an anti-flicker-exit
                // when the last subpage on the Shift Page was not Zoom
                if ((return_from_main_anti_flicker) && (last_active_pageShift != pages.page_Zoom)) {
                    return_from_main_anti_flicker = false
                    return
                }
            }
        } else
            first_zoom_activate = false

        offLED(context, cPrev)
        offLED(context, cNext)
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Instrument_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_magenta)
        setColorLED(context, cChannel, RGB_Colors.c_pink)
        setColorLED(context, cScroll, RGB_Colors.c_white_medium)

        onLED(context, cScroll)
        active_page = pages.page_Zoom
        return_from_CS_Bypass = active_page
        active_pageShift_before = active_page
        enable_toggle_lock_with_button = 0

        if (reset_resolution_of_AI_Mode_after_exit) {
            low_resolution_AI_Mode_locked = false
            high_resolution_AI_Mode_locked = false
        }
    }
    SubPage_Zoom.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('112) deactivate page Zoom')
        btn_Scroll_pressed_for_zoom_command = false
        active_page = pages.page_none
    }

    // Quantize Mode - Page Handler
    SubPage_Quantize.mOnActivate = function(context) {
        if (debug_1)
            console.log('113) activate page Quantize')

        offLED(context, cPrev)
        offLED(context, cNext)
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cSection)
        offLED(context, cMarker)
        mSection.set_edit_Instrument_LED(context)
        setColorLED(context, cPan, RGB_Colors.c_magenta)
        setColorLED(context, cChannel, RGB_Colors.c_pink)
        setColorLED(context, cScroll, RGB_Colors.c_white_medium)
        onLED(context, cClick)

        // if the Click Button is pressed twice show or to hide the Quantize Panel
        if (active_pageShift_before == pages.page_Quantize) {
            mSection.var_Quantize_Panel.setProcessValue(context, 1)
        }

        active_page = pages.page_Quantize
        return_from_CS_Bypass = active_page
        active_pageShift_before = active_page
        enable_toggle_lock_with_button = 0

        if (reset_resolution_of_AI_Mode_after_exit) {
            low_resolution_AI_Mode_locked = false
            high_resolution_AI_Mode_locked = false
        }
    }
    SubPage_Quantize.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('114) deactivate page Quantize')
        active_page = pages.page_none
    }

    // Nudge Mode - Page Handler   // moved to Shift Page
    // moved from Main Page to Shift Page
    SubPage_Nudge.mOnActivate = function(context) {
        if (debug_1)
            console.log('115) activate page Nudge')

        offLED(context, cPrev)
        offLED(context, cNext)
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cMarker)
        setColorLED(context, cLink, RGB_Colors.c_cyan)
        setColorLED(context, cPan, RGB_Colors.c_magenta)
        setColorLED(context, cChannel, RGB_Colors.c_pink)
        setColorLED(context, cScroll, RGB_Colors.c_white_medium)
        onLED(context, cSection)

        active_page = pages.page_Nudge
        return_from_CS_Bypass = active_page
        active_pageShift_before = active_page
        enable_toggle_lock_with_button = 0

        if (reset_resolution_of_AI_Mode_after_exit) {
            low_resolution_AI_Mode_locked = false
            high_resolution_AI_Mode_locked = false
        }
    }
    SubPage_Nudge.mOnDeactivate = function(context) {  // moved to Shift Page
        if (debug_1)
            console.log('116) deactivate page Nudge')
        active_page = pages.page_none
    }

    // CS Bypass Mode - Page Handler
    SubPage_CS_Bypass.mOnActivate = function(context) {
        if (debug_1)
            console.log('117) activate page CS_Bypass')

        offLED(context, cPrev)
        offLED(context, cNext)
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)

        mSection.set_CS_Bypass_LEDs(context)   // setting of colors within
        onLED(context, cMarker)

        // if the Marker Button is pressed twice, return from CS Bypass Mode
        if (active_pageShift_before == pages.page_CS_Bypass) {
            if (return_from_CS_Bypass == pages.page_Hitpoint) {
                mSection.var_ActivateHitpoint.setProcessValue(context, 1)
            } else if (return_from_CS_Bypass == pages.page_Lock) {
                mSection.var_ActivateLock.setProcessValue(context, 1)
            } else if (return_from_CS_Bypass == pages.page_Zoom) {
                mSection.var_ActivateZoom.setProcessValue(context, 1)
            } else if (return_from_CS_Bypass == pages.page_Quantize) {
                mSection.var_ActivateQuantize.setProcessValue(context, 1)
            } else if (return_from_CS_Bypass == pages.page_Nudge) {
                mSection.var_ActivateNudge.setProcessValue(context, 1)
            }
        }
        active_page = pages.page_CS_Bypass
        active_pageShift_before = active_page
        enable_toggle_lock_with_button = 0

        if (reset_resolution_of_AI_Mode_after_exit) {
            low_resolution_AI_Mode_locked = false
            high_resolution_AI_Mode_locked = false
        }
    }
    SubPage_CS_Bypass.mOnDeactivate = function(context) {
        if (debug_1)
            console.log('118) deactivate page CS_Bypass')
        active_page = pages.page_none
    }


    // * Custom Pages *

    // hostbinding of custom variable for to open Custom Page A0
    // Custom Page A0 must be accessible from Main, Shift, EQ, PF, QC, Send, CueSend and Audio Page
    pageMain.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageShift.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageEQ.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pagePF.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageSend.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageCueSend.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageQC.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageAudio.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)

    // make Custom Pages on bank A accessible for to toggle through bank A
    pageCustomA0.makeActionBinding(mSection.var_ActivateCustomA1, pageCustomA1.mAction.mActivate)
    pageCustomA1.makeActionBinding(mSection.var_ActivateCustomA2, pageCustomA2.mAction.mActivate)
    pageCustomA2.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)

    // make Custom Pages on bank B accessible for to toggle through bank B
    pageCustomB0.makeActionBinding(mSection.var_ActivateCustomB1, pageCustomB1.mAction.mActivate)
    pageCustomB1.makeActionBinding(mSection.var_ActivateCustomB2, pageCustomB2.mAction.mActivate)
    pageCustomB2.makeActionBinding(mSection.var_ActivateCustomB0, pageCustomB0.mAction.mActivate)

    // all Custom Pages of bank A must be accessible from all Custom Pages of bank B
    pageCustomB0.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageCustomB0.makeActionBinding(mSection.var_ActivateCustomA1, pageCustomA1.mAction.mActivate)
    pageCustomB0.makeActionBinding(mSection.var_ActivateCustomA2, pageCustomA2.mAction.mActivate)
    pageCustomB1.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageCustomB1.makeActionBinding(mSection.var_ActivateCustomA1, pageCustomA1.mAction.mActivate)
    pageCustomB1.makeActionBinding(mSection.var_ActivateCustomA2, pageCustomA2.mAction.mActivate)
    pageCustomB2.makeActionBinding(mSection.var_ActivateCustomA0, pageCustomA0.mAction.mActivate)
    pageCustomB2.makeActionBinding(mSection.var_ActivateCustomA1, pageCustomA1.mAction.mActivate)
    pageCustomB2.makeActionBinding(mSection.var_ActivateCustomA2, pageCustomA2.mAction.mActivate)

    // make Custom Pages on bank B must be accessible from all Custom Pages of bank A
    pageCustomA0.makeActionBinding(mSection.var_ActivateCustomB0, pageCustomB0.mAction.mActivate)
    pageCustomA0.makeActionBinding(mSection.var_ActivateCustomB1, pageCustomB1.mAction.mActivate)
    pageCustomA0.makeActionBinding(mSection.var_ActivateCustomB2, pageCustomB2.mAction.mActivate)
    pageCustomA1.makeActionBinding(mSection.var_ActivateCustomB0, pageCustomB0.mAction.mActivate)
    pageCustomA1.makeActionBinding(mSection.var_ActivateCustomB1, pageCustomB1.mAction.mActivate)
    pageCustomA1.makeActionBinding(mSection.var_ActivateCustomB2, pageCustomB2.mAction.mActivate)
    pageCustomA2.makeActionBinding(mSection.var_ActivateCustomB0, pageCustomB0.mAction.mActivate)
    pageCustomA2.makeActionBinding(mSection.var_ActivateCustomB1, pageCustomB1.mAction.mActivate)
    pageCustomA2.makeActionBinding(mSection.var_ActivateCustomB2, pageCustomB2.mAction.mActivate)

    // set knob_vis to value under mouse as default for all Custom Pages
    pageCustomA0.makeValueBinding(mSection.knob_vis.mSurfaceValue,
        pageCustomA0.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomA1.makeValueBinding(mSection.knob_vis.mSurfaceValue,
        pageCustomA1.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomA2.makeValueBinding(mSection.knob_vis.mSurfaceValue,
        pageCustomA2.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomB0.makeValueBinding(mSection.knob_vis.mSurfaceValue,
        pageCustomB0.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomB1.makeValueBinding(mSection.knob_vis.mSurfaceValue,
        pageCustomB1.mHostAccess.mMouseCursor.mValueUnderMouse)
    pageCustomB2.makeValueBinding(mSection.knob_vis.mSurfaceValue,
        pageCustomB2.mHostAccess.mMouseCursor.mValueUnderMouse)

    // set default functions for Channel Button in Custom Mode for Exit to Main Page
    pageCustomA0.makeActionBinding(mSection.btn_Channel.mSurfaceValue,
        pageMain.mAction.mActivate)
    pageCustomA1.makeActionBinding(mSection.btn_Channel.mSurfaceValue,
        pageMain.mAction.mActivate)
    pageCustomA2.makeActionBinding(mSection.btn_Channel.mSurfaceValue,
        pageMain.mAction.mActivate)
    pageCustomB0.makeActionBinding(mSection.btn_Channel.mSurfaceValue,
        pageMain.mAction.mActivate)
    pageCustomB1.makeActionBinding(mSection.btn_Channel.mSurfaceValue,
        pageMain.mAction.mActivate)
    pageCustomB2.makeActionBinding(mSection.btn_Channel.mSurfaceValue,
        pageMain.mAction.mActivate)

    // set default function for Solo Button in Custom Mode, Page A0 to Show/Hide Left Zone
    pageCustomA0.makeCommandBinding(uSection.btn_Solo.mSurfaceValue,
        'Window Zones', 'Show/Hide Left Zone')

    // set default function for Mute Button in Custom Mode, Page A0 to Show/Hide Lower Zone
    pageCustomA0.makeCommandBinding(uSection.btn_Mute.mSurfaceValue,
        'Window Zones', 'Show/Hide Lower Zone')

    // set default function for Arm Button in Custom Mode, Page A0 to Show/Hide Right Zone
    pageCustomA0.makeCommandBinding(uSection.btn_Arm.mSurfaceValue,
        'Window Zones', 'Show/Hide Right Zone')

    // set default function for Prev Button in Custom Mode, Page A0 to undo
    pageCustomA0.makeCommandBinding(mSection.btn_Prev.mSurfaceValue, 'Edit', 'Undo')

    // set default function for Next Button in Custom Mode, Page A0 to redo
    pageCustomA0.makeCommandBinding(mSection.btn_Next.mSurfaceValue, 'Edit', 'Redo')


    // * EQ Page *

    var mixChannelEQ = pageEQ.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ

    // use custom variables for state of EQ Mode Bands 1..4
    pageEQ.makeValueBinding(mSection.var_EQ_Band1_State, mixChannelEQ.mBand1.mOn)
    pageEQ.makeValueBinding(mSection.var_EQ_Band2_State, mixChannelEQ.mBand2.mOn)
    pageEQ.makeValueBinding(mSection.var_EQ_Band3_State, mixChannelEQ.mBand3.mOn)
    pageEQ.makeValueBinding(mSection.var_EQ_Band4_State, mixChannelEQ.mBand4.mOn)

    // use custom variables for FilterType of EQ-Bands 1..4
    // only needed for 'Write / Read EQ paramaters to / from special memory' function
    pageEQ.makeValueBinding(mSection.var_EQ_Band1_FilterType, mixChannelEQ.mBand1.mFilterType)
    pageEQ.makeValueBinding(mSection.var_EQ_Band2_FilterType, mixChannelEQ.mBand2.mFilterType)
    pageEQ.makeValueBinding(mSection.var_EQ_Band3_FilterType, mixChannelEQ.mBand3.mFilterType)
    pageEQ.makeValueBinding(mSection.var_EQ_Band4_FilterType, mixChannelEQ.mBand4.mFilterType)

    // Master Button when EQ Mode - Exit from EQ Mode to PF Mode if enabled or otherwise to Pan Mode
    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not is done directly under mSection.btn_Master.mSurfaceValue

    // Click Button when EQ Mode - EQ Mode Gain
    pageEQ.makeActionBinding(mSection.var_ActivateEQ_Gain, SubPage_EQ_Gain.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Click Button is pressed
    // or not, therefore an activation of the subpage SubPage_EQ_Gain
    // is done directly under mSection.btn_Click.mSurfaceValue

    pageEQ.makeActionBinding(mSection.var_Prev,
        pageEQ.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_EQ_Gain)
    pageEQ.makeActionBinding(mSection.var_Next,
        pageEQ.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_EQ_Gain)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band1_Gain_Value,
        mixChannelEQ.mBand1.mGain).setSubPage(SubPage_EQ_Gain)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band2_Gain_Value,
        mixChannelEQ.mBand2.mGain).setSubPage(SubPage_EQ_Gain)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band3_Gain_Value,
        mixChannelEQ.mBand3.mGain).setSubPage(SubPage_EQ_Gain)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band4_Gain_Value,
        mixChannelEQ.mBand4.mGain).setSubPage(SubPage_EQ_Gain)
    // handling of knob_Press moved to callback function of knob_Press

    // Section Button when EQ Mode - EQ Mode Freq
    pageEQ.makeActionBinding(mSection.var_ActivateEQ_Freq, SubPage_EQ_Freq.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_EQ_Freq
    // is done directly under mSection.btn_Section.mSurfaceValue

    pageEQ.makeActionBinding(mSection.var_Prev,
        pageEQ.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_EQ_Freq)
    pageEQ.makeActionBinding(mSection.var_Next,
        pageEQ.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_EQ_Freq)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band1_Freq_Value,
        mixChannelEQ.mBand1.mFreq).setSubPage(SubPage_EQ_Freq)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band2_Freq_Value,
        mixChannelEQ.mBand2.mFreq).setSubPage(SubPage_EQ_Freq)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band3_Freq_Value,
        mixChannelEQ.mBand3.mFreq).setSubPage(SubPage_EQ_Freq)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band4_Freq_Value,
        mixChannelEQ.mBand4.mFreq).setSubPage(SubPage_EQ_Freq)
    // handling of knob_Press moved to callback function of knob_Press

    // Marker Button when EQ Mode - EQ Mode Q
    pageEQ.makeActionBinding(mSection.var_ActivateEQ_Q, SubPage_EQ_Q.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_EQ_Q
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pageEQ.makeActionBinding(mSection.var_Prev,
        pageEQ.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_EQ_Q)
    pageEQ.makeActionBinding(mSection.var_Next,
        pageEQ.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_EQ_Q)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band1_Q_Value,
        mixChannelEQ.mBand1.mQ).setSubPage(SubPage_EQ_Q)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band2_Q_Value,
        mixChannelEQ.mBand2.mQ).setSubPage(SubPage_EQ_Q)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band3_Q_Value,
        mixChannelEQ.mBand3.mQ).setSubPage(SubPage_EQ_Q)
    pageEQ.makeValueBinding(mSection.knob_EQ_Band4_Q_Value,
        mixChannelEQ.mBand4.mQ).setSubPage(SubPage_EQ_Q)
    // handling of knob_Press moved to callback function of knob_Press

    // EQ Mode Gain - Page Handler

    // variables to realize toggle EQ Gain default function, necessary initial setting
    // values corresponding to EQ Gain == [0.0 dB, 0.0 dB, 0.0 dB, 0.0 dB]
    var EQ_Gain_Value_before_set_to_Default = [0.5, 0.5, 0.5, 0.5]

    SubPage_EQ_Gain.mOnActivate = function(context) {
        if (debug_EQ_Mode)
            console.log('119) activate page EQ_Gain')

        var get_Gain_Value
        selected_EQ_Param = EQ_Params.EQ_Gain

        if ((last_selected_EQ_Param == selected_EQ_Param)
        && (last_selected_EQ_Band == selected_EQ_Band))  {
            if (disable_set_EQ_Param_to_default) {
                disable_set_EQ_Param_to_default = false
            } else {
                switch (selected_EQ_Band) {
                    case 1:
                        get_Gain_Value =
                            mSection.knob_EQ_Band1_Gain_Value.getProcessValue(context)
                        if ((get_Gain_Value > (0.5 - 0.005)) && (get_Gain_Value < (0.5 + 0.005))) {
                            mSection.knob_EQ_Band1_Gain_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[0])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[0])
                        } else {
                            EQ_Gain_Value_before_set_to_Default[0] = get_Gain_Value
                            mSection.knob_EQ_Band1_Gain_Value.setProcessValue(context, 0.5)
                            mSection.knob_FP_Value.setProcessValue(context, 0.5)
                        }
                        break
                    case 2:
                        get_Gain_Value =
                            mSection.knob_EQ_Band2_Gain_Value.getProcessValue(context)
                        if ((get_Gain_Value > (0.5 - 0.005)) && (get_Gain_Value < (0.5 + 0.005))) {
                            mSection.knob_EQ_Band2_Gain_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[1])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[1])
                        } else {
                            EQ_Gain_Value_before_set_to_Default[1] = get_Gain_Value
                            mSection.knob_EQ_Band2_Gain_Value.setProcessValue(context, 0.5)
                            mSection.knob_FP_Value.setProcessValue(context, 0.5)
                        }
                        break
                    case 3:
                        get_Gain_Value =
                            mSection.knob_EQ_Band3_Gain_Value.getProcessValue(context)
                        if ((get_Gain_Value > (0.5 - 0.005)) && (get_Gain_Value < (0.5 + 0.005))) {
                            mSection.knob_EQ_Band3_Gain_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[2])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[2])
                        } else {
                            EQ_Gain_Value_before_set_to_Default[2] = get_Gain_Value
                            mSection.knob_EQ_Band3_Gain_Value.setProcessValue(context, 0.5)
                            mSection.knob_FP_Value.setProcessValue(context, 0.5)
                        }
                        break
                    case 4:
                        get_Gain_Value =
                            mSection.knob_EQ_Band4_Gain_Value.getProcessValue(context)
                        if ((get_Gain_Value > (0.5 - 0.005)) && (get_Gain_Value < (0.5 + 0.005))) {
                            mSection.knob_EQ_Band4_Gain_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[3])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Gain_Value_before_set_to_Default[3])
                        } else {
                            EQ_Gain_Value_before_set_to_Default[3] = get_Gain_Value
                            mSection.knob_EQ_Band4_Gain_Value.setProcessValue(context, 0.5)
                            mSection.knob_FP_Value.setProcessValue(context, 0.5)
                        }
                        break
                }
            }
        }

        active_page = pages.page_EQ_Gain
        onLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)

        if (debug_EQ_Mode)
            console.log('120) activate EQ_Gain: last_selected_EQ_Band = '
                + last_selected_EQ_Band)
    }
    SubPage_EQ_Gain.mOnDeactivate = function(context) {
        if (debug_EQ_Mode)
            console.log('121) deactivate page EQ_Gain')

        last_selected_EQ_Param = selected_EQ_Param
        last_selected_EQ_Band = selected_EQ_Band
        active_page = pages.page_none
        if (debug_EQ_Mode)
            console.log('122) deactivate EQ_Gain: last_selected_EQ_Band = '
                + last_selected_EQ_Band)
    }

    // EQ Mode Freq - Page Handler

    // variables to realize toggle EQ Freq default function, necessary initial setting
    // values corresponding to EQ Freq == [100 Hz, 800 Hz, 2.000 Hz, 12.000 Hz]
    var EQ_Freq_Value_Default
        = [0.2810622752, 0.4744377434, 0.5877489448, 0.8890563846]
    var EQ_Freq_Value_before_set_to_Default
        = [0.2810622752, 0.4744377434, 0.5877489448, 0.8890563846]

    SubPage_EQ_Freq.mOnActivate = function(context) {
        if (debug_EQ_Mode)
            console.log('123) activate page EQ_Freq')

        var get_Freq_Value
        selected_EQ_Param = EQ_Params.EQ_Freq

        if ((last_selected_EQ_Param == selected_EQ_Param)
        && (last_selected_EQ_Band == selected_EQ_Band))  {
            if (disable_set_EQ_Param_to_default) {
                disable_set_EQ_Param_to_default = false
            } else {
                switch (selected_EQ_Band) {
                    case 1:
                        get_Freq_Value =
                            mSection.knob_EQ_Band1_Freq_Value.getProcessValue(context)
                        if ((get_Freq_Value > (EQ_Freq_Value_Default[0] - 0.005))
                        && (get_Freq_Value < (EQ_Freq_Value_Default[0] + 0.005))) {
                            mSection.knob_EQ_Band1_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[0])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[0])
                        } else {
                            EQ_Freq_Value_before_set_to_Default[0] = get_Freq_Value
                            mSection.knob_EQ_Band1_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[0])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[0])
                        }
                        break
                    case 2:
                        get_Freq_Value =
                            mSection.knob_EQ_Band2_Freq_Value.getProcessValue(context)
                        if ((get_Freq_Value > (EQ_Freq_Value_Default[1] - 0.005))
                        && (get_Freq_Value < (EQ_Freq_Value_Default[1] + 0.005))) {
                            mSection.knob_EQ_Band2_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[1])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[1])
                        } else {
                            EQ_Freq_Value_before_set_to_Default[1] = get_Freq_Value
                            mSection.knob_EQ_Band2_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[1])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[1])
                        }
                        break
                    case 3:
                        get_Freq_Value =
                            mSection.knob_EQ_Band3_Freq_Value.getProcessValue(context)
                        if ((get_Freq_Value > (EQ_Freq_Value_Default[2] - 0.005))
                        && (get_Freq_Value < (EQ_Freq_Value_Default[2] + 0.005))) {
                            mSection.knob_EQ_Band3_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[2])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[2])
                        } else {
                            EQ_Freq_Value_before_set_to_Default[2] = get_Freq_Value
                            mSection.knob_EQ_Band3_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[2])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[2])
                        }
                        break
                    case 4:
                        get_Freq_Value =
                            mSection.knob_EQ_Band4_Freq_Value.getProcessValue(context)
                        if ((get_Freq_Value > (EQ_Freq_Value_Default[3] - 0.005))
                        && (get_Freq_Value < (EQ_Freq_Value_Default[3] + 0.005))) {
                            mSection.knob_EQ_Band4_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[3])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_before_set_to_Default[3])
                        } else {
                            EQ_Freq_Value_before_set_to_Default[3] = get_Freq_Value
                            mSection.knob_EQ_Band4_Freq_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[3])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Freq_Value_Default[3])
                        }
                        break
                }
            }
        }

        active_page = pages.page_EQ_Freq
        offLED(context, cClick)
        onLED(context, cSection)
        offLED(context, cMarker)

        if (debug_EQ_Mode)
            console.log('124) activate EQ_Freq: last_selected_EQ_Band = '
                + last_selected_EQ_Band)
    }
    SubPage_EQ_Freq.mOnDeactivate = function(context) {
        if (debug_EQ_Mode)
            console.log('125) deactivate page EQ_Freq')

        last_selected_EQ_Param = selected_EQ_Param
        last_selected_EQ_Band = selected_EQ_Band
        active_page = pages.page_none
        if (debug_EQ_Mode)
            console.log('126) deactivate EQ_Freq: last_selected_EQ_Band = '
                + last_selected_EQ_Band)
    }

    // EQ Mode Q - Page Handler

    // variables to realize toggle EQ Q-Factor default function, necessary initial setting
    // values corresponding to Q-Factor == [1.0, 1.0, 1.0, 1.0]
    var EQ_Q_Value_Default
        = [0.0833333284, 0.0833333284, 0.0833333284, 0.0833333284]
    var EQ_Q_Value_before_set_to_Default
        = [0.0833333284, 0.0833333284, 0.0833333284, 0.0833333284]

    SubPage_EQ_Q.mOnActivate = function(context) {
        if (debug_EQ_Mode)
            console.log('127) activate page EQ_Q')

        var get_Q_Value
        selected_EQ_Param = EQ_Params.EQ_Q

        if ((last_selected_EQ_Param == selected_EQ_Param)
        && (last_selected_EQ_Band == selected_EQ_Band))  {
            if (disable_set_EQ_Param_to_default) {
                disable_set_EQ_Param_to_default = false
            } else {
                switch (selected_EQ_Band) {
                    case 1:
                        get_Q_Value =
                            mSection.knob_EQ_Band1_Q_Value.getProcessValue(context)
                        if ((get_Q_Value > (EQ_Q_Value_Default[0] - 0.005))
                        && (get_Q_Value < (EQ_Q_Value_Default[0] + 0.005))) {
                            mSection.knob_EQ_Band1_Q_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[0])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[0])
                        } else {
                            EQ_Q_Value_before_set_to_Default[0] = get_Q_Value
                            mSection.knob_EQ_Band1_Q_Value.setProcessValue(context,
                                EQ_Q_Value_Default[0])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_Default[0])
                        }
                        break
                    case 2:
                        get_Q_Value =
                            mSection.knob_EQ_Band2_Q_Value.getProcessValue(context)
                        if ((get_Q_Value > (EQ_Q_Value_Default[1] - 0.005))
                        && (get_Q_Value < (EQ_Q_Value_Default[1] + 0.005))) {
                            mSection.knob_EQ_Band2_Q_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[1])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[1])
                        } else {
                            EQ_Q_Value_before_set_to_Default[1] = get_Q_Value
                            mSection.knob_EQ_Band2_Q_Value.setProcessValue(context,
                                EQ_Q_Value_Default[1])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_Default[1])
                        }
                        break
                    case 3:
                        get_Q_Value =
                            mSection.knob_EQ_Band3_Q_Value.getProcessValue(context)
                        if ((get_Q_Value > (EQ_Q_Value_Default[2] - 0.005))
                        && (get_Q_Value < (EQ_Q_Value_Default[2] + 0.005))) {
                            mSection.knob_EQ_Band3_Q_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[2])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[2])
                        } else {
                            EQ_Q_Value_before_set_to_Default[2] = get_Q_Value
                            mSection.knob_EQ_Band3_Q_Value.setProcessValue(context,
                                EQ_Q_Value_Default[2])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_Default[2])
                        }
                        break
                    case 4:
                        get_Q_Value =
                            mSection.knob_EQ_Band4_Q_Value.getProcessValue(context)
                        if ((get_Q_Value > (EQ_Q_Value_Default[3] - 0.005))
                        && (get_Q_Value < (EQ_Q_Value_Default[3] + 0.005))) {
                            mSection.knob_EQ_Band4_Q_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[3])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_before_set_to_Default[3])
                        } else {
                            EQ_Q_Value_before_set_to_Default[3] = get_Q_Value
                            mSection.knob_EQ_Band4_Q_Value.setProcessValue(context,
                                EQ_Q_Value_Default[3])
                            mSection.knob_FP_Value.setProcessValue(context,
                                EQ_Q_Value_Default[3])
                        }
                        break
                }
            }
        }

        active_page = pages.page_EQ_Q
        offLED(context, cClick)
        offLED(context, cSection)
        onLED(context, cMarker)

        if (debug_EQ_Mode)
            console.log('128) activate EQ_Q: last_selected_EQ_Band = '
                + last_selected_EQ_Band)
    }
    SubPage_EQ_Q.mOnDeactivate = function(context) {
        if (debug_EQ_Mode)
            console.log('129) deactivate page EQ_Q')

        last_selected_EQ_Param = selected_EQ_Param
        last_selected_EQ_Band = selected_EQ_Band
        active_page = pages.page_none
        if (debug_EQ_Mode)
            console.log('130) deactivate EQ_Q: last_selected_EQ_Band = '
                + last_selected_EQ_Band)
    }


    // * PF Page *

    var mixChannelPF = pagePF.mHostAccess.mTrackSelection.mMixerChannel

    // use custom variables for additional PreFilter settings,
    // which are not controlled by the Rotate Knob
    pagePF.makeValueBinding(mSection.var_PF_Bypass, mixChannelPF.mPreFilter.mBypass)
    pagePF.makeValueBinding(mSection.var_PF_PhaseSwitch, mixChannelPF.mPreFilter.mPhaseSwitch)
    pagePF.makeValueBinding(mSection.var_PF_LCut_On, mixChannelPF.mPreFilter.mLowCutOn)
    pagePF.makeValueBinding(mSection.var_PF_LCut_Slope, mixChannelPF.mPreFilter.mLowCutSlope)
    pagePF.makeValueBinding(mSection.var_PF_HCut_On, mixChannelPF.mPreFilter.mHighCutOn)
    pagePF.makeValueBinding(mSection.var_PF_HCut_Slope, mixChannelPF.mPreFilter.mHighCutSlope)

    // Master Button when PF Mode - Exit from PF Mode to Pan Mode
    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not is done directly under mSection.btn_Master.mSurfaceValue

    // Click Button when PF Mode - PF Mode PreGain
    pagePF.makeActionBinding(mSection.var_ActivatePF_PreGain, SubPage_PF_PreGain.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Click Button is pressed
    // or not, therefore an activation of the subpage SubPage_PF_PreGain
    // is done directly under mSection.btn_Click.mSurfaceValue

    pagePF.makeActionBinding(mSection.var_Prev,
        pagePF.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_PF_PreGain)
    pagePF.makeActionBinding(mSection.var_Next,
        pagePF.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_PF_PreGain)
    pagePF.makeValueBinding(mSection.knob_PF_PreGain_Value,
        mixChannelPF.mPreFilter.mGain).setSubPage(SubPage_PF_PreGain)
    // handling of knob_Press moved to callback function of knob_Press

    // Section Button when PF Mode - PF Mode LCut_Freq
    pagePF.makeActionBinding(mSection.var_ActivatePF_LCut_Freq,
        SubPage_PF_LCut_Freq.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_PF_LCut_Freq
    // is done directly under mSection.btn_Section.mSurfaceValue

    pagePF.makeActionBinding(mSection.var_Prev,
        pagePF.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_PF_LCut_Freq)
    pagePF.makeActionBinding(mSection.var_Next,
        pagePF.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_PF_LCut_Freq)
    pagePF.makeValueBinding(mSection.knob_PF_LCut_Freq_Value,
        mixChannelPF.mPreFilter.mLowCutFreq).setSubPage(SubPage_PF_LCut_Freq)
    // handling of knob_Press moved to callback function of knob_Press

    // Marker Button when PF Mode - PF Mode HCut_Freq
    pagePF.makeActionBinding(mSection.var_ActivatePF_HCut_Freq,
        SubPage_PF_HCut_Freq.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_PF_HCut_Freq
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pagePF.makeActionBinding(mSection.var_Prev,
        pagePF.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_PF_HCut_Freq)
    pagePF.makeActionBinding(mSection.var_Next,
        pagePF.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_PF_HCut_Freq)
    pagePF.makeValueBinding(mSection.knob_PF_HCut_Freq_Value,
        mixChannelPF.mPreFilter.mHighCutFreq).setSubPage(SubPage_PF_HCut_Freq)
    // handling of knob_Press moved to callback function of knob_Press

    // PF Mode PreGain - Page Handler

    // variable to realize toggle PF PreGain default function, necessary initial setting
    // value corresponding to PF PreGain == 0.0 dB
    var PF_PreGain_Value_before_set_to_Default = 0.5

    SubPage_PF_PreGain.mOnActivate = function(context) {
        if (debug_PF_Mode)
            console.log('131) activate page PF_PreGain')

        var get_PreGain_Value
        selected_PF_Param = PF_Params.PF_PreGain

        if (last_selected_PF_Param == selected_PF_Param) {
            if (disable_set_PF_Param_to_default) {
                disable_set_PF_Param_to_default = false
            } else {
                get_PreGain_Value =
                    mSection.knob_PF_PreGain_Value.getProcessValue(context)
                if ((get_PreGain_Value > (0.5 - 0.005)) && (get_PreGain_Value < (0.5 + 0.005))) {
                    mSection.knob_PF_PreGain_Value.setProcessValue(context,
                        PF_PreGain_Value_before_set_to_Default)
                    mSection.knob_FP_Value.setProcessValue(context,
                        PF_PreGain_Value_before_set_to_Default)
                } else {
                    PF_PreGain_Value_before_set_to_Default = get_PreGain_Value
                    mSection.knob_PF_PreGain_Value.setProcessValue(context, 0.5)
                    mSection.knob_FP_Value.setProcessValue(context, 0.5)
                }
            }
        }

        active_page = pages.page_PF_PreGain
        assign_virtual_knob(virtual_knobs.knob_PF_PreGain)
        onLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)
    }
    SubPage_PF_PreGain.mOnDeactivate = function(context) {
        if (debug_PF_Mode)
            console.log('132) deactivate page PF_PreGain')

        last_selected_PF_Param = selected_PF_Param
        active_page = pages.page_none
    }

    // PF Mode LCut Freq - Page Handler

    // variable to realize toggle PF LCut Freq default function, necessary initial setting
    // value corresponding to PF LCut Freq == 20 Hz
    var PF_LCut_Freq_Value_before_set_to_Default = 0.0

    SubPage_PF_LCut_Freq.mOnActivate = function(context) {
        if (debug_PF_Mode)
            console.log('133) activate page PF_LCut_Freq')

        var get_LCut_Freq_Value
        selected_PF_Param = PF_Params.PF_LCut_Freq

        if (last_selected_PF_Param == selected_PF_Param) {
            if (disable_set_PF_Param_to_default) {
                disable_set_PF_Param_to_default = false
            } else {
                get_LCut_Freq_Value =
                    mSection.knob_PF_LCut_Freq_Value.getProcessValue(context)
                if (get_LCut_Freq_Value < 0.005) {
                    mSection.knob_PF_LCut_Freq_Value.setProcessValue(context,
                        PF_LCut_Freq_Value_before_set_to_Default)
                    mSection.knob_FP_Value.setProcessValue(context,
                        PF_LCut_Freq_Value_before_set_to_Default)
                } else {
                    PF_LCut_Freq_Value_before_set_to_Default = get_LCut_Freq_Value
                    mSection.knob_PF_LCut_Freq_Value.setProcessValue(context, 0.0)
                    mSection.knob_FP_Value.setProcessValue(context, 0.0)
                }
            }
        }

        active_page = pages.page_PF_LCut_Freq
        assign_virtual_knob(virtual_knobs.knob_PF_LCut_Freq)
        offLED(context, cClick)
        onLED(context, cSection)
        offLED(context, cMarker)
    }
    SubPage_PF_LCut_Freq.mOnDeactivate = function(context) {
        if (debug_PF_Mode)
            console.log('134) deactivate page PF_LCut_Freq')

        last_selected_PF_Param = selected_PF_Param
        active_page = pages.page_none
    }

    // PF Mode HCut Freq - Page Handler

    // variable to realize toggle PF HCut Freq default function, necessary initial setting
    // value corresponding to PF HCut Freq == 20.000 Hz
    var PF_HCut_Freq_Value_before_set_to_Default = 1.0

    SubPage_PF_HCut_Freq.mOnActivate = function(context) {
        if (debug_PF_Mode)
            console.log('135) activate page PF_HCut_Freq')

        var get_HCut_Freq_Value
        selected_PF_Param = PF_Params.PF_HCut_Freq

        if (last_selected_PF_Param == selected_PF_Param) {
            if (disable_set_PF_Param_to_default) {
                disable_set_PF_Param_to_default = false
            } else {
                get_HCut_Freq_Value =
                    mSection.knob_PF_HCut_Freq_Value.getProcessValue(context)
                if (get_HCut_Freq_Value > (1.0 - 0.005)) {
                    mSection.knob_PF_HCut_Freq_Value.setProcessValue(context,
                        PF_HCut_Freq_Value_before_set_to_Default)
                    mSection.knob_FP_Value.setProcessValue(context,
                        PF_HCut_Freq_Value_before_set_to_Default)
                } else {
                    PF_HCut_Freq_Value_before_set_to_Default = get_HCut_Freq_Value
                    mSection.knob_PF_HCut_Freq_Value.setProcessValue(context, 1.0)
                    mSection.knob_FP_Value.setProcessValue(context, 1.0)
                }
            }
        }

        active_page = pages.page_PF_HCut_Freq
        assign_virtual_knob(virtual_knobs.knob_PF_HCut_Freq)
        offLED(context, cClick)
        offLED(context, cSection)
        onLED(context, cMarker)
    }
    SubPage_PF_HCut_Freq.mOnDeactivate = function(context) {
        if (debug_PF_Mode)
            console.log('136) deactivate page PF_HCut_Freq')

        last_selected_PF_Param = selected_PF_Param
        active_page = pages.page_none
    }


    // * Send Page *

    var mixChannelSend = pageSend.mHostAccess.mTrackSelection.mMixerChannel.mSends

    // use custom variables for additional Send settings,
    // which are not controlled by the Rotate Knob

    pageSend.makeValueBinding(mSection.var_Send_On1,
        mixChannelSend.getByIndex(0).mOn).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_On2,
        mixChannelSend.getByIndex(1).mOn).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_On3,
        mixChannelSend.getByIndex(2).mOn).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_On4,
        mixChannelSend.getByIndex(3).mOn).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_On5,
        mixChannelSend.getByIndex(4).mOn).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.var_Send_On6,
        mixChannelSend.getByIndex(5).mOn).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.var_Send_On7,
        mixChannelSend.getByIndex(6).mOn).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.var_Send_On8,
        mixChannelSend.getByIndex(7).mOn).setSubPage(SubPage_Send_LevelB)

    pageSend.makeValueBinding(mSection.var_Send_Pre1,
        mixChannelSend.getByIndex(0).mPrePost).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_Pre2,
        mixChannelSend.getByIndex(1).mPrePost).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_Pre3,
        mixChannelSend.getByIndex(2).mPrePost).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_Pre4,
        mixChannelSend.getByIndex(3).mPrePost).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.var_Send_Pre5,
        mixChannelSend.getByIndex(4).mPrePost).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.var_Send_Pre6,
        mixChannelSend.getByIndex(5).mPrePost).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.var_Send_Pre7,
        mixChannelSend.getByIndex(6).mPrePost).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.var_Send_Pre8,
        mixChannelSend.getByIndex(7).mPrePost).setSubPage(SubPage_Send_LevelB)

    // Master Button when Send Mode - Exit from Send Mode to Cue Send Mode if enabled
    // or otherwise to Pan Mode
    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not is done directly under mSection.btn_Master.mSurfaceValue

    // Section Button when Send Mode - Send Mode LevelA (1..4)
    pageSend.makeActionBinding(mSection.var_ActivateSend_LevelA,
        SubPage_Send_LevelA.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_Send_LevelA
    // is done directly under mSection.btn_Section.mSurfaceValue

    pageSend.makeActionBinding(mSection.var_Prev,
        pageSend.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Send_LevelA)
    pageSend.makeActionBinding(mSection.var_Next,
        pageSend.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.knob_Send_Level1_Value,
        mixChannelSend.getByIndex(0).mLevel).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.knob_Send_Level2_Value,
        mixChannelSend.getByIndex(1).mLevel).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.knob_Send_Level3_Value,
        mixChannelSend.getByIndex(2).mLevel).setSubPage(SubPage_Send_LevelA)
    pageSend.makeValueBinding(mSection.knob_Send_Level4_Value,
        mixChannelSend.getByIndex(3).mLevel).setSubPage(SubPage_Send_LevelA)

    // Marker Button when Send Mode - Send Mode LevelB (5..8)
    pageSend.makeActionBinding(mSection.var_ActivateSend_LevelB,
        SubPage_Send_LevelB.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_Send_LevelB
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pageSend.makeActionBinding(mSection.var_Prev,
        pageSend.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Send_LevelB)
    pageSend.makeActionBinding(mSection.var_Next,
        pageSend.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.knob_Send_Level5_Value,
        mixChannelSend.getByIndex(4).mLevel).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.knob_Send_Level6_Value,
        mixChannelSend.getByIndex(5).mLevel).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.knob_Send_Level7_Value,
        mixChannelSend.getByIndex(6).mLevel).setSubPage(SubPage_Send_LevelB)
    pageSend.makeValueBinding(mSection.knob_Send_Level8_Value,
        mixChannelSend.getByIndex(7).mLevel).setSubPage(SubPage_Send_LevelB)

    get_xSend_Level_Value_when_button_pressed_again = function(context, get_Level_Value, Index) {
        if (get_Level_Value < 0.00001) {
            return CRLevel_Value_0dB
        } else if ((get_Level_Value > (CRLevel_Value_0dB - 0.001))
        && (get_Level_Value < (CRLevel_Value_0dB + 0.0003))) {
            return xSend_Level_Value_before_set_to_Min_or_0dB[Index]
        } else {
            xSend_Level_Value_before_set_to_Min_or_0dB[Index] = get_Level_Value
            return 0.0
        }
    }

    // Send Mode LevelA - Page Handler
    SubPage_Send_LevelA.mOnActivate = function(context) {
        if (debug_Send_Mode)
            console.log('137) activate page Send_LevelA')

        var get_Level_Value

        if ((selected_Send >= 5) && (must_set_actual_Send_Level_Bank)) {
            mSection.var_ActivateSend_LevelB.setProcessValue(context, 1)
        } else {
            onLED(context, cSection)
            offLED(context, cMarker)
        }
        must_set_actual_Send_Level_Bank = false

        active_page = pages.page_Send_LevelA

        if (selected_Send_changed_while_sync_motorfader_to_Send_Value) {
            selected_Send_changed_while_sync_motorfader_to_Send_Value = false
            if (actual_motorfader_mode != motorfader_modes.mf_mode_off) {
                var fader_value = mSection.knob_FP_Value.getProcessValue(context)
                if (sync_0dB_to_U) {
                    fader_value = fader.calculate_sync_0dB_to_U(fader_value)
                }
                FP_last_write_value = -1
                fader.FP_write.setProcessValue(context, fader_value)
                return
            }
        }

        reset_old_knob_Send_Values()
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cLink)
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cPan)
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cChannel)
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelA, cScroll)
        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelA)

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }
        // if the Section Button is pressed repeatedly set Send Level to -oo dB / 0 dB / actual
        if ((last_selected_Send >= 1) && (last_selected_Send <= 4)) {
            if (disable_set_Send_LevelA_to_Min_or_0dB == false) {
                var new_value = 0.0
                switch (selected_Send) {
                    case 1:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level1_Value.getProcessValue(context), 0)
                        mSection.knob_Send_Level1_Value.setProcessValue(context, new_value)
                        break
                    case 2:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level2_Value.getProcessValue(context), 1)
                        mSection.knob_Send_Level2_Value.setProcessValue(context, new_value)
                        break
                    case 3:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level3_Value.getProcessValue(context), 2)
                        mSection.knob_Send_Level3_Value.setProcessValue(context, new_value)
                        break
                    case 4:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level4_Value.getProcessValue(context), 3)
                        mSection.knob_Send_Level4_Value.setProcessValue(context, new_value)
                        break
                }
                mSection.knob_FP_Value.setProcessValue(context, new_value)
            }
            disable_set_Send_LevelA_to_Min_or_0dB = false
        }
    }
    SubPage_Send_LevelA.mOnDeactivate = function(context) {
        if ((selected_Send >= 5) && (selected_Send <= 8)) {
            disable_set_Send_LevelB_to_Min_or_0dB = true
        }
        avoid_set_Send_Level_LED_for_Send_LevelA = false
        last_selected_Send = selected_Send
        active_page = pages.page_none

        if (debug_Send_Mode)
            console.log('138) deactivate Send_LevelA: last_selected_Send = '
                + last_selected_Send)
    }

    // Send Mode LevelB - Page Handler
    SubPage_Send_LevelB.mOnActivate = function(context) {
        if (debug_Send_Mode)
            console.log('139) activate page Send_LevelB')

        var get_Level_Value

        avoid_set_Send_Level_LED_for_Send_LevelA = false
        offLED(context, cSection)
        onLED(context, cMarker)

        active_page = pages.page_Send_LevelB

        if (selected_Send_changed_while_sync_motorfader_to_Send_Value) {
            selected_Send_changed_while_sync_motorfader_to_Send_Value = false
            if (actual_motorfader_mode != motorfader_modes.mf_mode_off) {
                var fader_value = mSection.knob_FP_Value.getProcessValue(context)
                if (sync_0dB_to_U) {
                    fader_value = fader.calculate_sync_0dB_to_U(fader_value)
                }
                FP_last_write_value = -1
                fader.FP_write.setProcessValue(context, fader_value)
                return
            }
        }

        reset_old_knob_Send_Values()
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cLink)
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cPan)
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cChannel)
        mSection.set_Send_Level_LED(context, pages.page_Send_LevelB, cScroll)
        mSection.flashingLED_of_selected_Send(context, pages.page_Send_LevelB)

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        // if the Marker Button is pressed repeatedly set Send Level to -oo dB / 0 dB / actual
        if ((last_selected_Send >= 5) && (last_selected_Send <= 8)) {
            if (disable_set_Send_LevelB_to_Min_or_0dB == false) {
                var new_value = 0.0
                switch (selected_Send) {
                    case 5:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level5_Value.getProcessValue(context), 4)
                        mSection.knob_Send_Level5_Value.setProcessValue(context, new_value)
                        break
                    case 6:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level6_Value.getProcessValue(context), 5)
                        mSection.knob_Send_Level6_Value.setProcessValue(context, new_value)
                        break
                    case 7:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level7_Value.getProcessValue(context), 6)
                        mSection.knob_Send_Level7_Value.setProcessValue(context, new_value)
                        break
                    case 8:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_Send_Level8_Value.getProcessValue(context), 7)
                        mSection.knob_Send_Level8_Value.setProcessValue(context, new_value)
                        break
                }
                mSection.knob_FP_Value.setProcessValue(context, new_value)
            }
            disable_set_Send_LevelB_to_Min_or_0dB = false
        }
    }
    SubPage_Send_LevelB.mOnDeactivate = function(context) {
        if ((selected_Send >= 1) && (selected_Send <= 4)) {
            disable_set_Send_LevelA_to_Min_or_0dB = true
        }
        last_selected_Send = selected_Send

        active_page = pages.page_none
        if (debug_Send_Mode)
            console.log('140) deactivate Send_LevelB: last_selected_Send = '
                + last_selected_Send)
    }


    // * Cue Send Page *

    var mixChannelCueSend = pageCueSend.mHostAccess.mTrackSelection.mMixerChannel.mCueSends

    // use custom variables for additional Cue Send settings,
    // which are not controlled by the Rotate Knob
    pageCueSend.makeValueBinding(mSection.var_CueSend_On1,
        mixChannelCueSend.getByIndex(0).mOn).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.var_CueSend_On2,
        mixChannelCueSend.getByIndex(1).mOn).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.var_CueSend_On3,
        mixChannelCueSend.getByIndex(2).mOn).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.var_CueSend_On4,
        mixChannelCueSend.getByIndex(3).mOn).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.var_CueSend_Pre1,
        mixChannelCueSend.getByIndex(0).mPrePost).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.var_CueSend_Pre2,
        mixChannelCueSend.getByIndex(1).mPrePost).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.var_CueSend_Pre3,
        mixChannelCueSend.getByIndex(2).mPrePost).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.var_CueSend_Pre4,
        mixChannelCueSend.getByIndex(3).mPrePost).setSubPage(SubPage_CueSend_Level)

    // Master Button when Cue Send Mode - Exit from Cue Send Mode to Pan Mode
    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not is done directly under mSection.btn_Master.mSurfaceValue

    // Section Button when Cue Send Mode - Cue Send Mode Level (1..4)
    pageCueSend.makeActionBinding(mSection.var_ActivateCueSend_Level,
        SubPage_CueSend_Level.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_CueSend_Level
    // is done directly under mSection.btn_Section.mSurfaceValue

    pageCueSend.makeActionBinding(mSection.var_Prev,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeActionBinding(mSection.var_Next,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Level1_Value,
        mixChannelCueSend.getByIndex(0).mLevel).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Level2_Value,
        mixChannelCueSend.getByIndex(1).mLevel).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Level3_Value,
        mixChannelCueSend.getByIndex(2).mLevel).setSubPage(SubPage_CueSend_Level)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Level4_Value,
        mixChannelCueSend.getByIndex(3).mLevel).setSubPage(SubPage_CueSend_Level)

    // Marker Button when Cue Send Mode - Cue Send Mode Pan (1..4)
    pageCueSend.makeActionBinding(mSection.var_ActivateCueSend_Pan,
        SubPage_CueSend_Pan.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_CueSend_Pan
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pageCueSend.makeActionBinding(mSection.var_Prev,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_CueSend_Pan)
    pageCueSend.makeActionBinding(mSection.var_Next,
        pageCueSend.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_CueSend_Pan)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Pan1_Value,
        mixChannelCueSend.getByIndex(0).mPan).setSubPage(SubPage_CueSend_Pan)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Pan2_Value,
        mixChannelCueSend.getByIndex(1).mPan).setSubPage(SubPage_CueSend_Pan)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Pan3_Value,
        mixChannelCueSend.getByIndex(2).mPan).setSubPage(SubPage_CueSend_Pan)
    pageCueSend.makeValueBinding(mSection.knob_CueSend_Pan4_Value,
        mixChannelCueSend.getByIndex(3).mPan).setSubPage(SubPage_CueSend_Pan)

    // Cue Send Mode Level - Page Handler
    SubPage_CueSend_Level.mOnActivate = function(context) {
        if (debug_CueSend_Mode)
            console.log('141) activate page CueSend_Level')

        var get_Level_Value

        onLED(context, cSection)
        offLED(context, cMarker)

        selected_CueSend_Param = CueSend_Params.CueSend_Level
        active_page = pages.page_CueSend_Level

        reset_old_knob_CueSend_Values()
        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cLink)
        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cPan)
        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cChannel)
        mSection.set_Send_Level_LED(context, pages.page_CueSend_Level, cScroll)
        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Level)

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }
        // if the Section Button is pressed repeatedly set Cue Send Level to -oo dB / 0 dB / actual
        if (last_selected_CueSend_Param == selected_CueSend_Param) {
            if (disable_set_CueSend_Level_to_Min_or_0dB == false) {
                var new_value = 0.0
                switch (selected_CueSend) {
                    case 1:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_CueSend_Level1_Value.getProcessValue(context), 8)
                        mSection.knob_CueSend_Level1_Value.setProcessValue(context, new_value)
                        break
                    case 2:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_CueSend_Level2_Value.getProcessValue(context), 9)
                        mSection.knob_CueSend_Level2_Value.setProcessValue(context, new_value)
                        break
                    case 3:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_CueSend_Level3_Value.getProcessValue(context), 10)
                        mSection.knob_CueSend_Level3_Value.setProcessValue(context, new_value)
                        break
                    case 4:
                        new_value = get_xSend_Level_Value_when_button_pressed_again(context,
                            mSection.knob_CueSend_Level4_Value.getProcessValue(context), 11)
                        mSection.knob_CueSend_Level4_Value.setProcessValue(context, new_value)
                        break
                }
                mSection.knob_FP_Value.setProcessValue(context, new_value)
            }
            disable_set_CueSend_Level_to_Min_or_0dB = false
        }
    }
    SubPage_CueSend_Level.mOnDeactivate = function(context) {
        last_selected_CueSend_Param = selected_CueSend_Param
        last_selected_CueSend = selected_CueSend
        active_page = pages.page_none

        if (debug_CueSend_Mode)
            console.log('142) deactivate CueSend_Level: last_selected_CueSend = '
                + last_selected_CueSend)
    }

    // Cue Send Mode Pan - Page Handler
    // variable to realize toggle Center function for Marker Button
    // necessary initial setting for the case, when Pan at start is set to Center:
    var CueSend_Pan_Value_before_set_to_Center = [0.5, 0.5, 0.5, 0.5]

    SubPage_CueSend_Pan.mOnActivate = function(context) {
        if (debug_CueSend_Mode)
            console.log('143) activate page CueSend_Pan')

        var get_Pan_Value

        offLED(context, cSection)
        onLED(context, cMarker)
        offLED(context, cClick)

        selected_CueSend_Param = CueSend_Params.CueSend_Pan
        active_page = pages.page_CueSend_Pan

        reset_old_knob_CueSend_Values()
        mSection.set_CueSend_Pan_LED(context, cLink)
        mSection.set_CueSend_Pan_LED(context, cPan)
        mSection.set_CueSend_Pan_LED(context, cChannel)
        mSection.set_CueSend_Pan_LED(context, cScroll)
        mSection.flashingLED_of_selected_Send(context, pages.page_CueSend_Pan)

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }
        // if the Marker Button is pressed twice reset Cue Send Pan to Center
        if (last_selected_CueSend_Param == selected_CueSend_Param) {
            var new_value = 0.0
            switch (selected_CueSend) {
                case 1:
                    get_Pan_Value = mSection.knob_CueSend_Pan1_Value.getProcessValue(context)
                    if ((get_Pan_Value > (0.5 - 0.005)) && (get_Pan_Value < (0.5 + 0.005))) {
                        new_value = CueSend_Pan_Value_before_set_to_Center[0]
                    } else {
                        CueSend_Pan_Value_before_set_to_Center[0] = get_Pan_Value
                        new_value = 0.5
                    }
                    mSection.knob_CueSend_Pan1_Value.setProcessValue(context, new_value)
                    break
                case 2:
                    get_Pan_Value = mSection.knob_CueSend_Pan2_Value.getProcessValue(context)
                    if ((get_Pan_Value > (0.5 - 0.005)) && (get_Pan_Value < (0.5 + 0.005))) {
                        new_value = CueSend_Pan_Value_before_set_to_Center[1]
                    } else {
                        CueSend_Pan_Value_before_set_to_Center[1] = get_Pan_Value
                        new_value = 0.5
                    }
                    mSection.knob_CueSend_Pan2_Value.setProcessValue(context, new_value)
                    break
                case 3:
                    get_Pan_Value = mSection.knob_CueSend_Pan3_Value.getProcessValue(context)
                    if ((get_Pan_Value > (0.5 - 0.005)) && (get_Pan_Value < (0.5 + 0.005))) {
                        new_value = CueSend_Pan_Value_before_set_to_Center[2]
                    } else {
                        CueSend_Pan_Value_before_set_to_Center[2] = get_Pan_Value
                        new_value = 0.5
                    }
                    mSection.knob_CueSend_Pan3_Value.setProcessValue(context, new_value)
                    break
                case 4:
                    get_Pan_Value = mSection.knob_CueSend_Pan4_Value.getProcessValue(context)
                    if ((get_Pan_Value > (0.5 - 0.005)) && (get_Pan_Value < (0.5 + 0.005))) {
                        new_value = CueSend_Pan_Value_before_set_to_Center[3]
                    } else {
                        CueSend_Pan_Value_before_set_to_Center[3] = get_Pan_Value
                        new_value = 0.5
                    }
                    mSection.knob_CueSend_Pan4_Value.setProcessValue(context, new_value)
                    break
            }
            mSection.knob_FP_Value.setProcessValue(context, new_value)
        }
    }
    SubPage_CueSend_Pan.mOnDeactivate = function(context) {
        last_selected_CueSend_Param = selected_CueSend_Param
        last_selected_CueSend = selected_CueSend
        active_page = pages.page_none

        if (debug_CueSend_Mode)
            console.log('144) deactivate CueSend_Pan: last_selected_CueSend = '
                + last_selected_CueSend)
    }


    // * QC Page *

    // handling of Prev Button for QC1..8 is done directly under mSection.btn_Prev.mSurfaceValue
    // handling of Next Button for QC1..8 is done directly under mSection.btn_Next.mSurfaceValue

    // Link Button when QC Mode - QC 1
    pageQC.makeActionBinding(mSection.var_ActivateQC1, SubPage_QC1.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Link Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC1
    // is done directly under mSection.btn_Link.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC1_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(0)).setSubPage(SubPage_QC1)

    // Pan Button when QC Mode - QC 2
    pageQC.makeActionBinding(mSection.var_ActivateQC2, SubPage_QC2.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Pan Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC2
    // is done directly under mSection.btn_Pan.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC2_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(1)).setSubPage(SubPage_QC2)

    // Channel Button when QC Mode - QC 3
    pageQC.makeActionBinding(mSection.var_ActivateQC3, SubPage_QC3.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Channel Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC3
    // is done directly under mSection.btn_Channel.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC3_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(2)).setSubPage(SubPage_QC3)

    // Scroll Button when QC Mode - QC 4
    pageQC.makeActionBinding(mSection.var_ActivateQC4, SubPage_QC4.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Scroll Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC4
    // is done directly under mSection.btn_Scroll.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC4_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(3)).setSubPage(SubPage_QC4)

    // Master Button when QC Mode - QC 5
    pageQC.makeActionBinding(mSection.var_ActivateQC5, SubPage_QC5.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC5
    // is done directly under mSection.btn_Master.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC5_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(4)).setSubPage(SubPage_QC5)

    // Click Button when QC Mode - QC 6
    pageQC.makeActionBinding(mSection.var_ActivateQC6, SubPage_QC6.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Click Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC6
    // is done directly under mSection.btn_Click.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC6_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(5)).setSubPage(SubPage_QC6)

    // Section Button when QC Mode - QC 7
    pageQC.makeActionBinding(mSection.var_ActivateQC7, SubPage_QC7.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC7
    // is done directly under mSection.btn_Section.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC7_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(6)).setSubPage(SubPage_QC7)

    // Marker Button when QC Mode - QC 8
    pageQC.makeActionBinding(mSection.var_ActivateQC8, SubPage_QC8.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_QC8
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pageQC.makeValueBinding(mSection.knob_QC8_Value,
        pageQC.mHostAccess.mFocusedQuickControls.getByIndex(7)).setSubPage(SubPage_QC8)

    // use custom variable to show or hide all plugins, for Button Prev when QC8 is selected
    pageQC.makeCommandBinding(mSection.var_show_hide_plugins,
        'Windows', 'Show/Hide Plug-ins')

    // use custom variable to select next plugin window, for Button Next when QC8 is selected
    pageQC.makeCommandBinding(mSection.var_select_next_plugin_window,
        'Windows', 'Select Next Plug-in Window')

    function set_next_QC_value_option (QCx_0_7) {
        if (QC_value_option[QCx_0_7] == 0) {
            if (QC_old_value == 0) {
                QC_value_option[QCx_0_7] = 2
            } else {
                QC_value_option[QCx_0_7] = 1
            }
        } else if (QC_value_option[QCx_0_7] == 1) {
            QC_new_value = 0.0
            QC_value_option[QCx_0_7] = 2
        } else if (QC_value_option[QCx_0_7] == 2) {
            QC_new_value = 0.5
            QC_value_option[QCx_0_7] = 3
        } else if (QC_value_option[QCx_0_7] == 3) {
            QC_new_value = 1.0
            if ((QC_old_value == 0) || (QC_old_value == 0.5) || (QC_old_value == 1.0)) {
                QC_value_option[QCx_0_7] = 1
            } else {
                QC_value_option[QCx_0_7] = 4
            }
        } else if (QC_value_option[QCx_0_7] == 4) {
            QC_new_value = QC_old_value
            QC_value_option[QCx_0_7] = 1
        }
        for (i = 0; i <= 7; i++) {
            if (i != QCx_0_7) {
                QC_value_option[i] = 0
            }
        }
    }

    // QC Mode - QC 1 - Page Handler
    SubPage_QC1.mOnActivate = function(context) {
        if (must_renew_recall_QCs) {
            // save all Quick Controls for a possible recall
            recall_QCs[0] = mSection.knob_QC1_Value.getProcessValue(context)
            recall_QCs[1] = mSection.knob_QC2_Value.getProcessValue(context)
            recall_QCs[2] = mSection.knob_QC3_Value.getProcessValue(context)
            recall_QCs[3] = mSection.knob_QC4_Value.getProcessValue(context)
            recall_QCs[4] = mSection.knob_QC5_Value.getProcessValue(context)
            recall_QCs[5] = mSection.knob_QC6_Value.getProcessValue(context)
            recall_QCs[6] = mSection.knob_QC7_Value.getProcessValue(context)
            recall_QCs[7] = mSection.knob_QC8_Value.getProcessValue(context)
            must_renew_recall_QCs = false
        }

        // force change of subpage if not equal to QC 1 (subpage for Link Button)
        if (must_set_actual_QC) {
            must_set_actual_QC = false
            if (last_active_pageQC == pages.page_QC2) {
                mSection.var_ActivateQC2.setProcessValue(context, 1)
            } else if (last_active_pageQC == pages.page_QC3) {
                mSection.var_ActivateQC3.setProcessValue(context, 1)
            } else if (last_active_pageQC == pages.page_QC4) {
                mSection.var_ActivateQC4.setProcessValue(context, 1)
            } else if (last_active_pageQC == pages.page_QC5) {
                mSection.var_ActivateQC5.setProcessValue(context, 1)
            } else if (last_active_pageQC == pages.page_QC6) {
                mSection.var_ActivateQC6.setProcessValue(context, 1)
            } else if (last_active_pageQC == pages.page_QC7) {
                mSection.var_ActivateQC7.setProcessValue(context, 1)
            } else if (last_active_pageQC == pages.page_QC8) {
                mSection.var_ActivateQC8.setProcessValue(context, 1)
            }
        } else {
            flashingLED(context, cLink)
            active_page = pages.page_QC1

            if (return_from_GTS) {
                return_from_GTS = false
                return
            }

            if (QC_value_option[0] == 0) {
                // once, after SubPage_QC1 has been activated
                assign_virtual_knob(virtual_knobs.knob_QC1)
                QC_old_value = mSection.knob_QC1_Value.getProcessValue(context)
                mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
                set_next_QC_value_option(0)
            } else {
                set_next_QC_value_option(0)
                mSection.knob_QC1_Value.setProcessValue(context, QC_new_value)
                mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
            }
        }
    }
    SubPage_QC1.mOnDeactivate = function(context) {
        onLED(context, cLink)
        active_page = pages.page_none
    }

    // QC Mode - QC 2 - Page Handler
    SubPage_QC2.mOnActivate = function(context) {
        flashingLED(context, cPan)
        active_page = pages.page_QC2

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        if (QC_value_option[1] == 0) {
            // once, after SubPage_QC2 has been activated
            assign_virtual_knob(virtual_knobs.knob_QC2)
            QC_old_value = mSection.knob_QC2_Value.getProcessValue(context)
            mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
            set_next_QC_value_option(1)
        } else {
            set_next_QC_value_option(1)
            mSection.knob_QC2_Value.setProcessValue(context, QC_new_value)
            mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
        }
    }
    SubPage_QC2.mOnDeactivate = function(context) {
        onLED(context, cPan)
        active_page = pages.page_none
    }

    // QC Mode - QC 3 - Page Handler
    SubPage_QC3.mOnActivate = function(context) {
        flashingLED(context, cChannel)
        active_page = pages.page_QC3

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        if (QC_value_option[2] == 0) {
            // once, after SubPage_QC3 has been activated
            assign_virtual_knob(virtual_knobs.knob_QC3)
            QC_old_value = mSection.knob_QC3_Value.getProcessValue(context)
            mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
            set_next_QC_value_option(2)
        } else {
            set_next_QC_value_option(2)
            mSection.knob_QC3_Value.setProcessValue(context, QC_new_value)
            mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
        }
    }
    SubPage_QC3.mOnDeactivate = function(context) {
        onLED(context, cChannel)
        active_page = pages.page_none
    }

    // QC Mode - QC 4 - Page Handler
    SubPage_QC4.mOnActivate = function(context) {
        flashingLED(context, cScroll)
        active_page = pages.page_QC4

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        if (QC_value_option[3] == 0) {
            // once, after SubPage_QC4 has been activated
            assign_virtual_knob(virtual_knobs.knob_QC4)
            QC_old_value = mSection.knob_QC4_Value.getProcessValue(context)
            mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
            set_next_QC_value_option(3)
        } else {
            set_next_QC_value_option(3)
            mSection.knob_QC4_Value.setProcessValue(context, QC_new_value)
            mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
        }
    }
    SubPage_QC4.mOnDeactivate = function(context) {
        onLED(context, cScroll)
        active_page = pages.page_none
    }

    // QC Mode - QC 5 - Page Handler
    SubPage_QC5.mOnActivate = function(context) {
        flashingLED(context, cMaster)
        active_page = pages.page_QC5

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        if (QC_value_option[4] == 0) {
            // once, after SubPage_QC5 has been activated
            assign_virtual_knob(virtual_knobs.knob_QC5)
            QC_old_value = mSection.knob_QC5_Value.getProcessValue(context)
            mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
            set_next_QC_value_option(4)
        } else {
            set_next_QC_value_option(4)
            mSection.knob_QC5_Value.setProcessValue(context, QC_new_value)
            mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
        }
    }
    SubPage_QC5.mOnDeactivate = function(context) {
        onLED(context, cMaster)
        active_page = pages.page_none
    }

    // QC Mode - QC 6 - Page Handler
    SubPage_QC6.mOnActivate = function(context) {
        flashingLED(context, cClick)
        active_page = pages.page_QC6

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        if (QC_value_option[5] == 0) {
            // once, after SubPage_QC6 has been activated
            assign_virtual_knob(virtual_knobs.knob_QC6)
            QC_old_value = mSection.knob_QC6_Value.getProcessValue(context)
            mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
            set_next_QC_value_option(5)
        } else {
            set_next_QC_value_option(5)
            mSection.knob_QC6_Value.setProcessValue(context, QC_new_value)
            mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
        }
    }
    SubPage_QC6.mOnDeactivate = function(context) {
        onLED(context, cClick)
        active_page = pages.page_none
    }

    // QC Mode - QC 7 - Page Handler
    SubPage_QC7.mOnActivate = function(context) {
        flashingLED(context, cSection)
        active_page = pages.page_QC7

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        if (QC_value_option[6] == 0) {
            // once, after SubPage_QC7 has been activated
            assign_virtual_knob(virtual_knobs.knob_QC7)
            QC_old_value = mSection.knob_QC7_Value.getProcessValue(context)
            mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
            set_next_QC_value_option(6)
        } else {
            set_next_QC_value_option(6)
            mSection.knob_QC7_Value.setProcessValue(context, QC_new_value)
            mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
        }
    }
    SubPage_QC7.mOnDeactivate = function(context) {
        onLED(context, cSection)
        active_page = pages.page_none
    }

    // QC Mode - QC 8 - Page Handler
    SubPage_QC8.mOnActivate = function(context) {
        flashingLED(context, cMarker)
        active_page = pages.page_QC8

        if (return_from_GTS) {
            return_from_GTS = false
            return
        }

        if (QC_value_option[7] == 0) {
            // once, after SubPage_QC8 has been activated
            assign_virtual_knob(virtual_knobs.knob_QC8)
            QC_old_value = mSection.knob_QC8_Value.getProcessValue(context)
            mSection.knob_FP_Value.setProcessValue(context, QC_old_value)
            set_next_QC_value_option(7)
        } else {
            set_next_QC_value_option(7)
            mSection.knob_QC8_Value.setProcessValue(context, QC_new_value)
            mSection.knob_FP_Value.setProcessValue(context, QC_new_value)
        }
    }
    SubPage_QC8.mOnDeactivate = function(context) {
        onLED(context, cMarker)
        active_page = pages.page_none
    }

    // when switching between tracks, reload Quick Control
    pageQC.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSelected.mOnTitleChange
    = function(activeDevice, activeMapping, objectTitle) {
        if ((QC_Mode_running) && (btn_Cycle_running == false)) {
            if (active_page == pages.page_QC1) {
                assign_virtual_knob(virtual_knobs.knob_QC1)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC1_Value.getProcessValue(activeDevice))
            } else if (active_page == pages.page_QC2) {
                assign_virtual_knob(virtual_knobs.knob_QC2)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC2_Value.getProcessValue(activeDevice))
            } else if (active_page == pages.page_QC3) {
                assign_virtual_knob(virtual_knobs.knob_QC3)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC3_Value.getProcessValue(activeDevice))
            } else if (active_page == pages.page_QC4) {
                assign_virtual_knob(virtual_knobs.knob_QC4)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC4_Value.getProcessValue(activeDevice))
            } else if (active_page == pages.page_QC5) {
                assign_virtual_knob(virtual_knobs.knob_QC5)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC5_Value.getProcessValue(activeDevice))
            } else if (active_page == pages.page_QC6) {
                assign_virtual_knob(virtual_knobs.knob_QC6)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC6_Value.getProcessValue(activeDevice))
            } else if (active_page == pages.page_QC7) {
                assign_virtual_knob(virtual_knobs.knob_QC7)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC7_Value.getProcessValue(activeDevice))
            } else if (active_page == pages.page_QC8) {
                assign_virtual_knob(virtual_knobs.knob_QC8)
                mSection.knob_FP_Value.setProcessValue(activeDevice,
                    mSection.knob_QC8_Value.getProcessValue(activeDevice))
            }
        }
    }


    // * Audio Page *

    // Master Button when Audio Mode - Exit from Audio Mode to Pan Mode
    // no hostBinding here because of required handling for cases whether Master Button is pressed
    // or not is done directly under mSection.btn_Master.mSurfaceValue

    // Click Button when Audio Mode - Audio Mode Volume
    pageAudio.makeActionBinding(mSection.var_ActivateAudio_Volume,
        SubPage_Audio_Volume.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Click Button is pressed
    // or not, therefore an activation of the subpage SubPage_Audio_Volume
    // is done directly under mSection.btn_Click.mSurfaceValue

    pageAudio.makeActionBinding(mSection.var_Prev,
        pageAudio.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Audio_Volume)
    pageAudio.makeActionBinding(mSection.var_Next,
        pageAudio.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Audio_Volume)
    pageAudio.makeCommandBinding(mSection.knob_Volume_Left,
        'Audio', 'Decrement Event Volume').setSubPage(SubPage_Audio_Volume)
    pageAudio.makeCommandBinding(mSection.knob_Volume_Right,
        'Audio', 'Increment Event Volume').setSubPage(SubPage_Audio_Volume)

    // use custom variables for functions in Audio Mode Volume
    pageAudio.makeCommandBinding(mSection.var_Audio_editors,
        'Audio', 'Open Fade Editors')
    pageAudio.makeCommandBinding(mSection.var_Audio_play_selection,
        'Transport', 'Play Selection Range')
    pageAudio.makeCommandBinding(mSection.var_Audio_crossfade,
        'Audio', 'Crossfade')
    pageAudio.makeCommandBinding(mSection.var_Audio_bounce,
        'Audio', 'Bounce')

    // Section Button when Audio Mode - Audio Mode Fade in
    pageAudio.makeActionBinding(mSection.var_ActivateAudio_FadeIn,
        SubPage_Audio_FadeIn.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Section Button is pressed
    // or not, therefore an activation of the subpage SubPage_Audio_FadeIn
    // is done directly under mSection.btn_Section.mSurfaceValue

    pageAudio.makeActionBinding(mSection.var_Prev,
        pageAudio.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Audio_FadeIn)
    pageAudio.makeActionBinding(mSection.var_Next,
        pageAudio.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Audio_FadeIn)
    pageAudio.makeCommandBinding(mSection.knob_FadeIn_Left,
        'Audio', 'Decrement Fade In Length').setSubPage(SubPage_Audio_FadeIn)
    pageAudio.makeCommandBinding(mSection.knob_FadeIn_Right,
        'Audio', 'Increment Fade In Length').setSubPage(SubPage_Audio_FadeIn)

    // use custom variables for functions in Audio Mode Fade in
    pageAudio.makeCommandBinding(mSection.var_Audio_delete_fade_in,
        'Audio', 'Remove Fade In')
    pageAudio.makeCommandBinding(mSection.var_Audio_standard_fade_in,
        'Audio', 'Apply Standard Fade In')
    pageAudio.makeCommandBinding(mSection.var_Audio_fade_in_to_cursor,
        'Audio', 'Fade In to Cursor')
    pageAudio.makeCommandBinding(mSection.var_Audio_fade_in_to_range,
        'Audio', 'Fade In to Range Start')

    // Marker Button when Audio Mode - Audio Mode Fade out
    pageAudio.makeActionBinding(mSection.var_ActivateAudio_FadeOut,
        SubPage_Audio_FadeOut.mAction.mActivate)

    // no hostBinding here because of required handling for cases whether Marker Button is pressed
    // or not, therefore an activation of the subpage SubPage_Audio_FadeOut
    // is done directly under mSection.btn_Marker.mSurfaceValue

    pageAudio.makeActionBinding(mSection.var_Prev,
        pageAudio.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(SubPage_Audio_FadeOut)
    pageAudio.makeActionBinding(mSection.var_Next,
        pageAudio.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(SubPage_Audio_FadeOut)
    pageAudio.makeCommandBinding(mSection.knob_FadeOut_Left,
        'Audio', 'Increment Fade Out Length').setSubPage(SubPage_Audio_FadeOut)
    pageAudio.makeCommandBinding(mSection.knob_FadeOut_Right,
        'Audio', 'Decrement Fade Out Length').setSubPage(SubPage_Audio_FadeOut)

    // use custom variables for functions in Audio Mode Fade out
    pageAudio.makeCommandBinding(mSection.var_Audio_delete_fade_out,
        'Audio', 'Remove Fade Out')
    pageAudio.makeCommandBinding(mSection.var_Audio_standard_fade_out,
        'Audio', 'Apply Standard Fade Out')
    pageAudio.makeCommandBinding(mSection.var_Audio_fade_out_from_cursor,
        'Audio', 'Fade Out to Cursor')
    pageAudio.makeCommandBinding(mSection.var_Audio_fade_out_from_range,
        'Audio', 'Fade Out from Range End')

    // Audio Mode Volume (Button Click) - Page Handler
    SubPage_Audio_Volume.mOnActivate = function(context) {
        if (debug_1)
            console.log('145) activate page Audio_Volume')

        // force change of subpage if not equal to SubPage_Audio_Volume
        if (must_set_actual_Audio_Mode) {
            must_set_actual_Audio_Mode = false
            if (last_active_pageAudio == pages.page_Audio_FadeIn) {
                mSection.var_ActivateAudio_FadeIn.setProcessValue(context, 1)
                return
            } else if (last_active_pageAudio == pages.page_Audio_FadeOut) {
                mSection.var_ActivateAudio_FadeOut.setProcessValue(context, 1)
                return
            }
        }

        setColorLED(context, cLink, RGB_Colors.c_cyan_light)
        setColorLED(context, cPan, RGB_Colors.c_green_medium)
        setColorLED(context, cChannel, RGB_Colors.c_violet)
        setColorLED(context, cScroll, RGB_Colors.c_orangered)
        for (i = 1; i <= 4; i++) {
            onLED(context, mLED_code(i))
        }

        onLED(context, cMaster)
        onLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)

        active_page = pages.page_Audio_Volume
    }
    SubPage_Audio_Volume.mOnDeactivate = function(context) {
        active_page = pages.page_none
        if (debug_1)
            console.log('146) deactivate Audio_Volume')
    }

    // Audio Mode Fade in (Button Section) - Page Handler
    SubPage_Audio_FadeIn.mOnActivate = function(context) {
        if (debug_1)
            console.log('147) activate page Audio_FadeIn')

        setColorLED(context, cLink, RGB_Colors.c_grey)
        setColorLED(context, cPan, RGB_Colors.c_blue)
        setColorLED(context, cChannel, RGB_Colors.c_yellow_medium)
        setColorLED(context, cScroll, RGB_Colors.c_white_medium)
        for (i = 1; i <= 4; i++) {
            onLED(context, mLED_code(i))
        }

        onLED(context, cMaster)
        offLED(context, cClick)
        onLED(context, cSection)
        offLED(context, cMarker)

        active_page = pages.page_Audio_FadeIn
    }
    SubPage_Audio_FadeIn.mOnDeactivate = function(context) {
        active_page = pages.page_none
        if (debug_1)
            console.log('148) deactivate Audio_FadeIn')
    }

    // Audio Mode Fade out (Button Marker) - Page Handler
    SubPage_Audio_FadeOut.mOnActivate = function(context) {
        if (debug_1)
            console.log('149) activate page Audio_FadeOut')

        setColorLED(context, cLink, RGB_Colors.c_grey)
        setColorLED(context, cPan, RGB_Colors.c_blue)
        setColorLED(context, cChannel, RGB_Colors.c_yellow_medium)
        setColorLED(context, cScroll, RGB_Colors.c_white_medium)
        for (i = 1; i <= 4; i++) {
            onLED(context, mLED_code(i))
        }

        onLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        onLED(context, cMarker)

        active_page = pages.page_Audio_FadeOut
    }
    SubPage_Audio_FadeOut.mOnDeactivate = function(context) {
        active_page = pages.page_none
        if (debug_1)
            console.log('150) deactivate Audio_FadeOut')
    }


    pageMain.mOnActivate = function(context, mapping) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        if (Cubase13_or_higher_installed) {
            tDirectAccess.activate(mapping)
            pageMain_mapping = mapping
        }

        pageShift_is_active = false
        last_btn_Shift_press_changed_Custom_Mode_bank = false
        fader_is_set_to_volume = true
        fader_QC_selectable = false

        // Since the last active mapping page is called up during a Cubase session after deactivation
        // and subsequent activation of the deviceDriver (for example when changing projects),
        // but the Pan Mode or the Master Mode is called up immediately afterwards,
        // the LED functions are enabled for the first time with the first call-up of the Main Page
        // to prevent flicker effects when starting.
        if (disable_all_LED_functions) {
            disable_all_LED_functions = false
            onLED(context, cStop)
        }

        reset_virt_LEDs()
        offLED(context, cShift)

        if (FP_locked) {
            flashingLED(context, cPrev)
            flashingLED(context, cNext)
        } else {
            offLED(context, cPrev)
            offLED(context, cNext)
        }

        // the hostBinding of knob_CRLevel_Value here is needed for the start-situation
        if (first_knob_CRLevel_Value_assign) {
            if (debug_assign_virtual_knob)
                console.log('151) assign_virtual_knob: when first_knob_CRLevel_Value_assign')
            assign_virtual_knob(virtual_knobs.knob_CRLevel)
            first_knob_CRLevel_Value_assign = false
        }

        // set colors of Write & Read Buttons before waiting until pressed
        setColorLED(context, cWrite, RGB_Colors.c_red)
        setColorLED(context, cRead, RGB_Colors.c_green)

        pageMain_is_active = true
        if (debug_mapping_pages)
            console.log('152) page MAIN activated')
    }

    pageMain.mOnDeactivate = function(context) {
        pageMain_is_active = false

        uSection.VUMeter_Initialize(context)
        active_pageShift_before = pages.page_none
        if (active_page == pages.page_Click) {
            last_active_pageMain = active_pageMain_before_Click
        } else {
            last_active_pageMain = active_page
        }
        return_from_main_anti_flicker = true
        return_from_shift_anti_flicker = false

        enable_toggle_lock_with_button = 0
        Pan_Value_changed_with_button = false

        if (last_active_pageShift_with_virtual_knob == pages.page_Lock) {
            assign_virtual_knob(virtual_knobs.knob_ValueUnderMouse)
        } else { if (debug_assign_virtual_knob)
            console.log('153) pageMain.mOnDeactivate: no call of assign_virtual_knob')
        }

        if (debug_1)
            console.log('154) restore last active page: ' + last_active_pageShift)
        if (last_active_pageShift == pages.page_Hitpoint) {
            mSection.var_ActivateHitpoint.setProcessValue(context, 1)
        } else if (last_active_pageShift == pages.page_Lock) {
            mSection.var_ActivateLock.setProcessValue(context, 1)
        } else if (last_active_pageShift == pages.page_Zoom) {
            mSection.var_ActivateZoom.setProcessValue(context, 1)
        } else if (last_active_pageShift == pages.page_Quantize) {
            mSection.var_ActivateQuantize.setProcessValue(context, 1)
        } else if (last_active_pageShift == pages.page_Nudge) {
            mSection.var_ActivateNudge.setProcessValue(context, 1)
        } else if (last_active_pageShift == pages.page_CS_Bypass) {
            mSection.var_ActivateCS_Bypass.setProcessValue(context, 1)
        } else {
            mSection.var_ActivateZoom.setProcessValue(context, 1)
        }

        if (debug_mapping_pages)
            console.log('155) page MAIN deactivated')
    }

    pageShift.mOnActivate = function(context) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        pageMain_is_active = false
        fader_is_set_to_volume = false

        // Ensure that the button combination Shift + X (skip back to Main Page)
        // always runs via the Main Page and the Shift Button must be pressed again.
        btn_Shift_running = false

        offLED(context, cSolo)
        offLED(context, cMute)
        offLED(context, cArm)
        flashingLED(context, cShift)
        offLED(context, cWrite)
        offLED(context, cRead)
        offLED(context, cBypass)

        for (i = 1; i <= 8; i++) {
            offLED(context, mLED_code(i))
        }

        fader.show_actual_motorfader_mode(context)

        pageShift_is_active = true
        if (debug_mapping_pages)
            console.log('156) page SHIFT activated')
    }

    pageShift.mOnDeactivate = function(context) {
        pageShift_is_active = false

        // needed to avoid flicker when switching between Main Page and Shift Page
        first_shift_activate = false
        return_from_shift_anti_flicker = true
        return_from_main_anti_flicker = false

        if (active_pageMain_before == pages.page_Pan) {
            disable_set_Pan_to_center = true
        } else if (active_pageMain_before == pages.page_Master) {
            disable_set_CRLevel_to_0dB_or_before_dB = true
        }

        active_pageMain_before = pages.page_none
        last_active_pageShift = active_page
        offLED(context, cTouch)
        offLED(context, cPrev)
        offLED(context, cNext)

        if (reset_resolution_of_AI_Mode_after_exit) {
            low_resolution_AI_Mode_locked = false
            high_resolution_AI_Mode_locked = false
        }

        ValueUnderMouse_changed_with_button = false

        if (last_active_pageMain_with_virtual_knob == pages.page_Pan) {
            assign_virtual_knob(virtual_knobs.knob_Pan)
        } else if (last_active_pageMain_with_virtual_knob == pages.page_Master) {
            assign_virtual_knob(virtual_knobs.knob_CRLevel)
        } else { if (debug_assign_virtual_knob)
            console.log('157) pageShift.mOnDeactivate: no call of assign_virtual_knob')
        }

        if (debug_1)
            console.log('158) Restore last active page: ' + last_active_pageMain)
        if (last_active_pageMain == pages.page_Pan) {
            mSection.var_ActivatePan.setProcessValue(context, 1)
        } else if (last_active_pageMain == pages.page_Channel) {
            mSection.var_ActivateChannel.setProcessValue(context, 1)
        } else if (last_active_pageMain == pages.page_Scroll) {
            mSection.var_ActivateScroll.setProcessValue(context, 1)
        } else if (last_active_pageMain == pages.page_Master) {
            mSection.var_ActivateMaster.setProcessValue(context, 1)
        } else if (last_active_pageMain == pages.page_Section) {
            mSection.var_ActivateSection.setProcessValue(context, 1)
        } else if (last_active_pageMain == pages.page_Marker) {
            mSection.var_ActivateMarker.setProcessValue(context, 1)
        } else {
            mSection.var_ActivatePan.setProcessValue(context, 1)
        }

        // EQ Mode Enter = EQ Mode Gain (always), no explicit call needed
        // Gain is default = first subpage on EQ Page

        if (debug_mapping_pages)
            console.log('159) page SHIFT deactivated')
    }

    function CustomActivate(context, bank) {
        // enable knob_vis by setting the midi channel to 1
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(0, cKnobRotate).setTypeRelativeSignedBit()

        Custom_Mode_running = true
        actual_Custom_Mode_bank = bank
        fader_is_set_to_volume = false
        btn_Scroll_running = false

        // special color design for Custom Page
        setColorLED(context, cTouch, RGB_Colors.c_blue)
        setColorLED(context, cWrite, RGB_Colors.c_blue)
        setColorLED(context, cRead, RGB_Colors.c_blue)
        setColorLED(context, cLink, RGB_Colors.c_white_medium)
        setColorLED(context, cPan, RGB_Colors.c_white_medium)
        setColorLED(context, cChannel, RGB_Colors.c_white_medium)
        if (bank == 'A') {
            setColorLED(context, cScroll, RGB_Colors.c_orange)
        } else if (bank == 'B') {
            setColorLED(context, cScroll, RGB_Colors.c_orangered)
        }
        offLED(context, cSolo)
        offLED(context, cMute)
        offLED(context, cArm)
        offLED(context, cBypass)
        offLED(context, cTouch)
        offLED(context, cWrite)
        offLED(context, cRead)

        offLED(context, cLink)
        offLED(context, cPan)
        offLED(context, cChannel)
        onLED(context, cScroll)
        offLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)

        flashingLED(context, cShift)
    }

    function CustomDeactivate(context) {
        offLED(context, cSolo)
        offLED(context, cMute)
        offLED(context, cArm)
        offLED(context, cBypass)
        offLED(context, cTouch)
        offLED(context, cWrite)
        offLED(context, cRead)

        for (i = 1; i <= 8; i++) {
            offLED(context, mLED_code(i))
        }

        offLED(context, cPrev)
        offLED(context, cNext)

        // unlock current value under mouse if locked,
        // because the assignment to the value on the Custom Page is lost
        mSection.var_ValueLocked.setProcessValue(context, 0)

        Custom_Mode_running = false
        active_pageMain_before = pages.page_none
        active_pageShift_before = pages.page_none
        return_from_shift_anti_flicker = false
        return_from_main_anti_flicker = false

        // Pan Mode preparation on the Main Page
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = false
        var_ValueLocked = false
        enable_toggle_lock_with_button = 0
        last_active_pageMain = pages.page_Pan

        // Exit to Pan Mode (Main)
        assign_virtual_knob(virtual_knobs.knob_Pan)
        mSection.var_ActivatePan.setProcessValue(context, 1)
    }

    pageCustomA0.mOnActivate = function(context) {
        if (last_active_pageMain == pages.page_Pan) {
            toShift_or_toCustom_when_Pan_Mode = true
        } else {
            toShift_or_toCustom_when_Pan_Mode = false
        }

        // Ensure that the button combination Shift + X
        // (skip back to Main Page) always runs via the Main Page
        // and the Shift Button must be pressed again.
        btn_Shift_running = false

        last_pageCustomA = 0
        CustomActivate(context, 'A')
        onLED(context, cPrev)
        onLED(context, cNext)
        if (debug_mapping_pages)
            console.log('160) page CUSTOM A0 activated')
    }

    pageCustomA0.mOnDeactivate = function(context) {
        CustomDeactivate(context)
        if (debug_mapping_pages)
            console.log('161) page CUSTOM A0 deactivated')
    }

    pageCustomA1.mOnActivate = function(context) {
        last_pageCustomA = 1
        CustomActivate(context, 'A')
        onLED(context, cPrev)
        offLED(context, cNext)
        if (debug_mapping_pages)
            console.log('162) page CUSTOM A1 activated')
    }

    pageCustomA1.mOnDeactivate = function(context) {
        CustomDeactivate(context)
        if (debug_mapping_pages)
             console.log('163) page CUSTOM A1 deactivated')
    }

    pageCustomA2.mOnActivate = function(context) {
        last_pageCustomA = 2
        CustomActivate(context, 'A')
        offLED(context, cPrev)
        onLED(context, cNext)
        if (debug_mapping_pages)
            console.log('164) page CUSTOM A2 activated')
    }

    pageCustomA2.mOnDeactivate = function(context) {
        CustomDeactivate(context)
        if (debug_mapping_pages)
            console.log('165) page CUSTOM A2 deactivated')
    }

    pageCustomB0.mOnActivate = function(context) {
        if (last_active_pageMain == pages.page_Pan) {
            toShift_or_toCustom_when_Pan_Mode = true
        } else {
            toShift_or_toCustom_when_Pan_Mode = false
        }

        // Ensure that the button combination Shift + X
        // (skip back to Main Page) always runs via the Main Page
        // and the Shift Button must be pressed again.
        btn_Shift_running = false

        last_pageCustomB = 0
        CustomActivate(context, 'B')
        onLED(context, cPrev)
        onLED(context, cNext)
        if (debug_mapping_pages)
            console.log('166) page CUSTOM B0 activated')
    }

    pageCustomB0.mOnDeactivate = function(context) {
        CustomDeactivate(context)
        if (debug_mapping_pages)
            console.log('167) page CUSTOM B0 deactivated')
    }

    pageCustomB1.mOnActivate = function(context) {
        last_pageCustomB = 1
        CustomActivate(context, 'B')
        onLED(context, cPrev)
        offLED(context, cNext)
        if (debug_mapping_pages)
            console.log('168) page CUSTOM B1 activated')
    }

    pageCustomB1.mOnDeactivate = function(context) {
        CustomDeactivate(context)
        if (debug_mapping_pages)
             console.log('169) page CUSTOM B1 deactivated')
    }

    pageCustomB2.mOnActivate = function(context) {
        last_pageCustomB = 2
        CustomActivate(context, 'B')
        offLED(context, cPrev)
        onLED(context, cNext)
        if (debug_mapping_pages)
            console.log('170) page CUSTOM B2 activated')
    }

    pageCustomB2.mOnDeactivate = function(context) {
        CustomDeactivate(context)
        if (debug_mapping_pages)
            console.log('171) page CUSTOM B2 deactivated')
    }

    pageEQ.mOnActivate = function(context) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        // Ensure that the button combination Shift + X
        // (skip back to Main Page) always runs via the Main Page
        // and the Shift Button must be pressed again.
        btn_Shift_running = false

        EQ_Mode_running = true
        fader_is_set_to_volume = true

        EQ_Mode_was_active = true
        selected_EQ_Param = EQ_Params.EQ_Gain
        last_selected_EQ_Param = EQ_Params.EQ_Gain
        disable_set_EQ_Param_to_default = true

        offLED(context, cSolo)
        offLED(context, cMute)
        offLED(context, cArm)
        flashingLED(context, cShift)
        offLED(context, cBypass)
        onLED(context, cMaster)

        // special colors for Write Button LED & Read Button LED
        if (specialmemory_EQ_has_data[0]) {
            setColorLED(context, cWrite, RGB_Colors.c_orangered)
            setColorLED(context, cRead, RGB_Colors.c_green_light)
        } else {
            setColorLED(context, cWrite, RGB_Colors.c_violet)
            setColorLED(context, cRead, RGB_Colors.c_violet)
        }

        // Write Button LED & Read Button LED permanently switched on
        onLED(context, cWrite)
        onLED(context, cRead)

        mSection.show_EQ_Band_States(context)
        mSection.flashingLED_of_selected_EQ_Band(context)

        // EQ Mode Enter = EQ Mode Gain (always), no explicit call needed
        // Gain is default = first subpage on EQ Page

        if (debug_mapping_pages)
            console.log('172) page EQ activated, last selected EQ-Band = '
                + last_selected_EQ_Band)
    }

    pageEQ.mOnDeactivate = function(context) {
        uSection.VUMeter_Initialize(context)
        mSection.var_ActivateEQ_Gain.setProcessValue(context, 1)

        // Write Button LED & Read Button LED normally switched off
        offLED(context, cWrite)
        offLED(context, cRead)

        offLED(context, cLink)
        offLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)

        last_selected_EQ_Band = selected_EQ_Band
        last_selected_EQ_Param = selected_EQ_Param
        EQ_Mode_running = false

        // reload normal colors for Write Button LED & Read Button LED
        setColorLED(context, cWrite, RGB_Colors.c_red)
        setColorLED(context, cRead, RGB_Colors.c_green)

        // also execute Pan Mode preparation on the Main Page
        // when switching from EQ Mode to PF Mode for some special cases
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = false
        enable_toggle_lock_with_button = 0
        last_active_pageMain = pages.page_Pan
        return_from_shift_anti_flicker = false
        return_from_main_anti_flicker = false

        // Exit to Pan Mode (Main)
        assign_virtual_knob(virtual_knobs.knob_Pan)
        mSection.var_ActivatePan.setProcessValue(context, 1)

        if (debug_mapping_pages)
            console.log('173) page EQ deactivated, last selected EQ-Band = '
                + last_selected_EQ_Band)
    }

    pagePF.mOnActivate = function(context) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        PF_Mode_running = true
        fader_is_set_to_volume = true

        selected_PF_Param = PF_Params.PF_PreGain
        last_selected_PF_Param = PF_Params.PF_PreGain
        disable_set_PF_Param_to_default = true

        offLED(context, cSolo)
        offLED(context, cMute)
        offLED(context, cArm)
        flashingLED(context, cShift)
        offLED(context, cWrite)
        offLED(context, cRead)
        offLED(context, cBypass)

        // special colors in PF Mode in context to PreFilter settings
        mSection.set_PF_Switch_LED(context)             // Link Button LED
        mSection.set_PF_PreGain_LED(context)            // Pan Button LED
        mSection.set_PF_LCut_off_or_Slope_LED(context)  // Channel Button LED
        mSection.set_PF_HCut_off_or_Slope_LED(context)  // Scroll Button LED

        onLED(context, cLink)
        onLED(context, cPan)
        onLED(context, cChannel)
        onLED(context, cScroll)
        onLED(context, cMaster)
        onLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)

        // PF Mode Enter = PF Mode PreGain (always), no explicit call needed
        // PreGain is default = first subpage on PF Page

        if (debug_mapping_pages)
            console.log('174) page PF activated')
    }

    pagePF.mOnDeactivate = function(context) {
        uSection.VUMeter_Initialize(context)
        mSection.var_ActivatePF_PreGain.setProcessValue(context, 1)

        for (i = 1; i <= 8; i++) {
            offLED(context, mLED_code(i))
        }

        last_selected_PF_Param = selected_PF_Param
        PF_Mode_running = false

        // Pan Mode preparation on the Main Page
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = false
        enable_toggle_lock_with_button = 0
        last_active_pageMain = pages.page_Pan
        return_from_shift_anti_flicker = false
        return_from_main_anti_flicker = false

        // Exit to Pan Mode (Main)
        assign_virtual_knob(virtual_knobs.knob_Pan)
        mSection.var_ActivatePan.setProcessValue(context, 1)

        if (debug_mapping_pages)
            console.log('175) page PF deactivated')
    }

    pageSend.mOnActivate = function(context) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        Send_Mode_running = true
        fader_is_set_to_volume = true

        if (sync_motorfader_within_Send_Mode_to_Send_Value) {
            setColorLED(context, cTouch, RGB_Colors.c_blue)
        } else {
            setColorLED(context, cTouch, RGB_Colors.c_yellow_medium)
        }

        flashingLED(context, cTouch)
        setColorLED(context, cLink, RGB_Colors.c_off)
        setColorLED(context, cPan, RGB_Colors.c_off)
        setColorLED(context, cChannel, RGB_Colors.c_off)
        setColorLED(context, cScroll, RGB_Colors.c_off)

        onLED(context, cShift)
        onLED(context, cLink)
        onLED(context, cPan)
        onLED(context, cChannel)
        onLED(context, cScroll)
        onLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)

        if (debug_mapping_pages)
            console.log('176) page SEND activated')
    }

    pageSend.mOnDeactivate = function(context) {
        offLED(context, cTouch)
        Send_Mode_running = false

        if ((sync_motorfader_within_Send_Mode_to_Send_Value)
        && (actual_motorfader_mode != motorfader_modes.mf_mode_off)) {
            var fader_value = uSection.var_Volume.getProcessValue(context)
            if (sync_0dB_to_U) {
                fader_value = fader.calculate_sync_0dB_to_U(fader_value)
            }
            // force next FP_write
            FP_last_write_value = -1
            fader.FP_write.setProcessValue(context, fader_value)
        }

        if (reset_sync_motorfader_within_Send_Mode_after_exit) {
            sync_motorfader_within_Send_Mode_to_Send_Value = false
        }
        selected_Send_changed_while_sync_motorfader_to_Send_Value = false

        assigning_fader_before_HostBinding_within_Send_Mode()

        // also execute Pan Mode preparation on the Main Page
        // when switching from Send Mode to CueSend Mode for some special cases
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = false
        disable_set_CueSend_Level_to_Min_or_0dB = true
        enable_toggle_lock_with_button = 0
        last_active_pageMain = pages.page_Pan
        active_pageMain_before = pages.page_Pan
        return_from_shift_anti_flicker = false
        return_from_main_anti_flicker = false

        // Exit to Pan Mode (Main)
        assign_virtual_knob(virtual_knobs.knob_Pan)
        mSection.var_ActivatePan.setProcessValue(context, 1)

        if (debug_mapping_pages)
            console.log('177) page SEND deactivated')
    }

    pageCueSend.mOnActivate = function(context) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        CueSend_Mode_running = true
        fader_is_set_to_volume = true

        setColorLED(context, cTouch, RGB_Colors.c_orange)
        flashingLED(context, cTouch)
        setColorLED(context, cLink, RGB_Colors.c_off)
        setColorLED(context, cPan, RGB_Colors.c_off)
        setColorLED(context, cChannel, RGB_Colors.c_off)
        setColorLED(context, cScroll, RGB_Colors.c_off)

        onLED(context, cShift)
        onLED(context, cLink)
        onLED(context, cPan)
        onLED(context, cChannel)
        onLED(context, cScroll)
        onLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)

        if (debug_mapping_pages)
            console.log('178) page CUE SEND activated')
    }

    pageCueSend.mOnDeactivate = function(context) {
        offLED(context, cTouch)
        CueSend_Mode_running = false

        // Pan Mode preparation on the Main Page
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = false
        enable_toggle_lock_with_button = 0
        last_active_pageMain = pages.page_Pan
        return_from_shift_anti_flicker = false
        return_from_main_anti_flicker = false

        // Exit to Pan Mode (Main)
        assign_virtual_knob(virtual_knobs.knob_Pan)
        mSection.var_ActivatePan.setProcessValue(context, 1)

        if (debug_mapping_pages)
            console.log('179) page CUE SEND deactivated')
    }

    pageQC.mOnActivate = function(context) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        // Ensure that the button combination Shift + X
        // (skip back to Main Page) always runs via the Main Page
        // and the Shift Button must be pressed again.
        btn_Shift_running = false

        QC_Mode_running = true
        if (actual_motorfader_mode == motorfader_modes.mf_mode_QCx) {
            fader_is_set_to_volume = false
        } else {
            fader_is_set_to_volume = true
        }

        wait_until_Prev_Button_is_released = false
        wait_until_Next_Button_is_released = false
        uSection.VUMeter_Initialize(context)

        // color design for QC Page
        setColorLED(context, cTouch, RGB_Colors.c_grey)
        setColorLED(context, cWrite, RGB_Colors.c_red)
        setColorLED(context, cRead, RGB_Colors.c_green)

        setColorLED(context, cLink, RGB_Colors.c_orange_light)
        setColorLED(context, cPan, RGB_Colors.c_green_light)
        setColorLED(context, cChannel, RGB_Colors.c_blue_light)
        setColorLED(context, cScroll, RGB_Colors.c_blue_light)

        if (actual_motorfader_mode == motorfader_modes.mf_mode_QCx) {
            setColorLED(context, mLED_code(fader_QC), RGB_Colors.c_grey)
        }

        for (i = 1; i <= 8; i++) {
            onLED(context, mLED_code(i))
        }
        onLED(context, cShift)

        for (i = 0; i <= 7; i++) {
            QC_value_option[i] = 0
        }

        if (debug_mapping_pages)
            console.log('180) page QC activated')
    }

    pageQC.mOnDeactivate = function(context) {
        offLED(context, cTouch)

        for (i = 1; i <= 8; i++) {
            offLED(context, mLED_code(i))
        }

        for (i = 0; i <= 7; i++) {
            QC_value_option[i] = 0
        }

        offLED(context, cPrev)
        offLED(context, cNext)

        if (reset_resolution_of_QC_Mode_after_exit) {
            low_resolution_QC_Mode_locked = false
            high_resolution_QC_Mode_locked = false
        }

        last_active_pageQC = active_page
        QC_Mode_running = false
        wait_until_Prev_Button_is_released = false
        wait_until_Next_Button_is_released = false

        // Pan Mode preparation on the Main Page
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = false
        enable_toggle_lock_with_button = 0
        last_active_pageMain = pages.page_Pan
        return_from_shift_anti_flicker = false
        return_from_main_anti_flicker = false

        // Exit to Pan Mode (Main)
        assign_virtual_knob(virtual_knobs.knob_Pan)
        mSection.var_ActivatePan.setProcessValue(context, 1)

        if (debug_mapping_pages)
            console.log('181) page QC deactivated')
    }

    pageAudio.mOnActivate = function(context) {
        // disable knob_vis by setting the midi channel to 2
        mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(1, cKnobRotate).setTypeRelativeSignedBit()

        Audio_Mode_running = true
        fader_is_set_to_volume = true

        setColorLED(context, cTouch, RGB_Colors.c_green)
        flashingLED(context, cTouch)
        setColorLED(context, cLink, RGB_Colors.c_off)
        setColorLED(context, cPan, RGB_Colors.c_off)
        setColorLED(context, cChannel, RGB_Colors.c_off)
        setColorLED(context, cScroll, RGB_Colors.c_off)

        onLED(context, cShift)
        onLED(context, cLink)
        onLED(context, cPan)
        onLED(context, cChannel)
        onLED(context, cScroll)
        onLED(context, cMaster)
        offLED(context, cClick)
        offLED(context, cSection)
        offLED(context, cMarker)

        if (debug_mapping_pages)
            console.log('182) page AUDIO activated')
    }

    pageAudio.mOnDeactivate = function(context) {
        offLED(context, cTouch)
        last_active_pageAudio = active_page
        Audio_Mode_running = false

        for (i = 1; i <= 8; i++) {
            offLED(context, mLED_code(i))
        }

        // Pan Mode preparation on the Main Page
        disable_set_Pan_to_center = true
        disable_set_CRLevel_to_0dB_or_before_dB = false
        enable_toggle_lock_with_button = 0
        last_active_pageMain = pages.page_Pan
        return_from_shift_anti_flicker = false
        return_from_main_anti_flicker = false

        // Exit to Pan Mode (Main)
        assign_virtual_knob(virtual_knobs.knob_Pan)
        mSection.var_ActivatePan.setProcessValue(context, 1)

        if (debug_mapping_pages)
            console.log('183) page AUDIO deactivated')
    }
}


// TRANSPORT SECTION

const tpStates = {tpState_stopped: 0x01, tpState_playing: 0x02, tpState_recording: 0x03}
var actual_tpState = tpStates.tpState_stopped

const tpEvents = {tpEvent_Stop_FP: 0x01, tpEvent_Play_FP: 0x02, tpEvent_Record_FP: 0x03,
    tpEvent_Stop_CB: 0x04, tpEvent_Play_CB: 0x05, tpEvent_Record_CB: 0x06, tpEvent_FS: 0x07}

const RFWD_States = {btnState_none: 0x01, btnState_RWD: 0x02, btnState_FWD: 0x03, btnState_both: 0x04}
var actual_RFWD_State = RFWD_States.btnState_none

const fsModes = {fsMode_playStyle: 0x01, fsMode_recordStyle: 0x02}
var actual_fsMode = fsModes.fsMode_playStyle

const fsPress_time = {fsPress_time_short: 0x01, fsPress_time_1sec: 0x02, fsPress_time_3sec: 0x03}
var actual_fsPress_time = fsPress_time.fsPress_time_short

// global variable for to remember state if Stop Button is pressed down
// for possible jump to locator left for the button combination Stop + RWD,
// jump to locator right for the button combination Stop + FWD
// and for the button combination Stop + Touch to disable the VU-Meter LED
var btn_Stop_running = false
var btn_Stop_running_fixed = false

// global variable for to remember state if Play Button is pressed down
var btn_Play_running = false

// global variable for to remember state if Record Button is pressed down
var btn_Record_running = false

// variable to prevent return to start when the Play Button is pressed while holding the Stop Button
var ignore_Stop_repeat_once = false

// variables for to remember state if Cycle Button is pressed down
// for the 'set left/right locator to project cursor position' functionality,
// also for the GTS (Global Track Scroll) functionality,
// also for the global undo / global redo functionality
// and also for the Play_until_Next_Marker functionality
var btn_Cycle_running = false
var set_Marker_1_4_done = false
var to_Marker_1_4_done = false
var global_undo_redo_done = false
var navigate_or_set_QuickTrack_1_4_done = false
var select_QuickTrack_1_4_done = false
var select_Volume_of_QuickTrack_1_4_done = false
var btn_Cycle_has_set_locator = false
var btn_Cycle_for_Play_until_Next_Marker = false

// variables for to remember state if RWD or FWD Buttons are pressed down,
// needed for the function 'jump to end of project',
// when the Stop Button is pressed after RWD + FWD
var btn_RWD_running = false
var btn_FWD_running = false

// variables for shuttle functionality
var lower_shuttleSpeed_running = false
var higher_shuttleSpeed_running = false
var lower_shuttleSpeed_denominator = 2
var higher_shuttleSpeed_numerator = 2
var shuttle_reverse = false
var backup_state_of_direction_LED = 1  // off
var shuttle_functionality_locked = false
var shuttle_end_timestamp = new Date().getTime()

// variables for to handle Fast RWD and Fast FWD functionality
var fastRWD_running = false
var fastFWD_running = false
var btn_RWD_release_timestamp = new Date().getTime()
var btn_FWD_release_timestamp = new Date().getTime()
var ignore_next_fastRWD_attempt = true
var ignore_next_fastFWD_attempt = true

// variables to prevent redundant calls of transport functions
var old_var_Stop_value = -1.0
var old_var_Play_value = -1.0
var old_var_Record_value = -1.0

// After the Play Command, a delay of 250 ms is necessary so that a subsequent Stop Command
// can take place. It is therefore necessary to check whether this delay has taken place if a
// Stop Command (= Stop or Pause) is to be executed. This variable is used for this purpose:
var btn_Play_release_timestamp = new Date().getTime()

// basic variables for implementing the footswitch functionality
var fsStarted_Play_or_Record = false
var fsPressed_while_Stop = true
var fsPress_timestamp = new Date().getTime()
var perform_To_Left_Locator_when_next_fsPress_time_1sec = false

// variables for implementing the LED feedback of the footswitch functionality
var backup_state_of_Prev_LED = 1  // off
var backup_state_of_Next_LED = 1  // off
var backup_state_of_RWD_LED = 1   // off
var backup_state_of_FWD_LED = 1   // off
var PrevNext_LED_feedback_when_fsAction = 0   // LEDs: 0 = none, 1 = left, 2 = right, 3 = both
var RFWD_LED_feedback_when_fsAction = 0       // LEDs: 0 = none, 1 = left, 2 = right, 3 = both
var start_offLEDs_for_fsAction_after_350ms = new Date().getTime()


function tpStateToString(tpState) {
    switch (tpState) {
        case tpStates.tpState_stopped: return 'tpState_stopped'
        case tpStates.tpState_playing: return 'tpState_playing'
        case tpStates.tpState_recording: return 'tpState_recording'
    }
}

function tpEventToString(tpEvent) {
    switch (tpEvent) {
        case tpEvents.tpEvent_Stop_FP: return 'tpEvent_Stop_FP'
        case tpEvents.tpEvent_Play_FP: return 'tpEvent_Play_FP'
        case tpEvents.tpEvent_Record_FP: return 'tpEvent_Record_FP'
        case tpEvents.tpEvent_Stop_CB: return 'tpEvent_Stop_CB'
        case tpEvents.tpEvent_Play_CB: return 'tpEvent_Play_CB'
        case tpEvents.tpEvent_Record_CB: return 'tpEvent_Record_CB'
        case tpEvents.tpEvent_FS: return 'tpEvent_FS'
    }
}

function fsModeToString(fsMode) {
    switch (fsMode) {
        case fsModes.fsMode_playStyle: return 'fsMode_playStyle'
        case fsModes.fsMode_recordStyle: return 'fsMode_recordStyle'
    }
}

function enter_tpState_FP(context, tpState) {
    if (debug_tp)
        console.log('184) > enter_tpState_FP while ' + tpStateToString(tpState))
    if (tpState == tpStates.tpState_stopped) {
        if (stop_functionality_locked) {
            flashingLED(context, cStop)
        } else {
            onLED(context, cStop)
        }
        tpSection.var_Stop.setProcessValue(context, 1)
    } else if (tpState == tpStates.tpState_playing) {
        onLED(context, cPlay)
        tpSection.var_Play.setProcessValue(context, 1)
    } else if (tpState == tpStates.tpState_recording) {
        onLED(context, cPlay)
        onLED(context, cRecord)
        tpSection.var_Record.setProcessValue(context, 1)
    }
    actual_tpState = tpState
}

function enter_tpState_CB(context, tpState) {
    if (debug_tp)
        console.log('185) > enter_tpState_CB while ' + tpStateToString(tpState))
    if (tpState == tpStates.tpState_stopped) {
        if (stop_functionality_locked) {
            flashingLED(context, cStop)
        } else {
            onLED(context, cStop)
        }
    } else if (tpState == tpStates.tpState_playing) {
        onLED(context, cPlay)
    } else if (tpState == tpStates.tpState_recording) {
        onLED(context, cPlay)
        onLED(context, cRecord)
    }
    actual_tpState = tpState
}

function leave_tpState_FP(context, tpState) {
    if (debug_tp)
        console.log('186) > leave_tpState_FP while ' + tpStateToString(tpState))
    if (stop_functionality_locked) {
        flashingLED(context, cStop)
    } else {
        offLED(context, cStop)
    }
    offLED(context, cPlay)
    offLED(context, cRecord)
    if ((tpState == tpStates.tpState_recording) && (actual_tpState == tpStates.tpState_recording))
        tpSection.var_Record.setProcessValue(context, 0)
}

function leave_tpState_CB(context, tpState) {
    if (debug_tp)
        console.log('187) > leave_tpState_CB while ' + tpStateToString(tpState))
    if (stop_functionality_locked) {
        flashingLED(context, cStop)
    } else {
        offLED(context, cStop)
    }
    offLED(context, cPlay)
    offLED(context, cRecord)
}

function trigger_tpStateMachine(context, triggerEvent) {
    if (debug_tp)
        console.log('188) ' + tpEventToString(triggerEvent) + ' while ' + tpStateToString(actual_tpState))
    switch (actual_tpState) {
        case tpStates.tpState_stopped:
            if (triggerEvent == tpEvents.tpEvent_Stop_FP) {
                // prevent 'return to start'
                // when the Play Button is pressed while holding the Stop Button
                if (!ignore_Stop_repeat_once) {
                    tpSection.var_Stop_repeat.setProcessValue(context, 1)
                    perform_To_Left_Locator_when_next_fsPress_time_1sec = true
                }
                // If the Footswitch Mode has been changed in the meantime
                // and the Play LED or the Record LED is still flashing accordingly, turn it off.
                offLED(context, cPlay)
                offLED(context, cRecord)
            } else if (triggerEvent == tpEvents.tpEvent_Play_FP) {
                leave_tpState_FP(context, tpStates.tpState_stopped)
                enter_tpState_FP(context, tpStates.tpState_playing)
                perform_To_Left_Locator_when_next_fsPress_time_1sec = false
            } else if (triggerEvent == tpEvents.tpEvent_Record_FP) {
                leave_tpState_FP(context, tpStates.tpState_playing)
                enter_tpState_FP(context, tpStates.tpState_recording)
                perform_To_Left_Locator_when_next_fsPress_time_1sec = false
            } else if (triggerEvent == tpEvents.tpEvent_Play_CB) {
                leave_tpState_CB(context, tpStates.tpState_stopped)
                enter_tpState_CB(context, tpStates.tpState_playing)
                perform_To_Left_Locator_when_next_fsPress_time_1sec = false
            } else if (triggerEvent == tpEvents.tpEvent_Record_CB) {
                leave_tpState_CB(context, tpStates.tpState_stopped)
                enter_tpState_CB(context, tpStates.tpState_recording)
                perform_To_Left_Locator_when_next_fsPress_time_1sec = false
            } else if (triggerEvent == tpEvents.tpEvent_FS) {
                switch (actual_fsPress_time) {
                    case (fsPress_time.fsPress_time_short):
                        leave_tpState_FP(context, tpStates.tpState_stopped)
                        if (actual_fsMode == fsModes.fsMode_playStyle) {
                            enter_tpState_FP(context, tpStates.tpState_playing)
                            flashingLED(context, cPlay)
                        } else {
                            // footswitch functionality 'start recording & playback'
                            enter_tpState_FP(context, tpStates.tpState_recording)
                            flashingLED(context, cRecord)
                        }
                        fsStarted_Play_or_Record = true
                        fsPressed_while_Stop = true
                        perform_To_Left_Locator_when_next_fsPress_time_1sec = false
                        tpSection.LED_feedback_when_fsAction(context, 3, 0)
                        break
                    case (fsPress_time.fsPress_time_1sec):
                        if (perform_To_Left_Locator_when_next_fsPress_time_1sec) {
                            tpSection.var_Stop_and_RWD.setProcessValue(context, 1)
                            if (debug_tp)
                                console.log('189) > tpSection.var_Stop_and_RWD, value = 1')
                            tpSection.LED_feedback_when_fsAction(context, 0, 3)
                        } else {
                            tpSection.var_Stop_repeat.setProcessValue(context, 1)
                            if (debug_tp)
                                console.log('190) > tpSection.var_Stop_repeat, value = 1')
                            perform_To_Left_Locator_when_next_fsPress_time_1sec = true
                            tpSection.LED_feedback_when_fsAction(context, 0, 1)
                        }
                        break
                    case (fsPress_time.fsPress_time_3sec):
                        if (actual_fsMode == fsModes.fsMode_playStyle) {
                            actual_fsMode = fsModes.fsMode_recordStyle
                            offLED(context, cPlay)
                            flashingLED(context, cRecord)
                        } else {
                            actual_fsMode = fsModes.fsMode_playStyle
                            offLED(context, cRecord)
                            flashingLED(context, cPlay)
                        }
                        if (debug_tp)
                            console.log('191) > actual_fsMode toggled')
                        break
                }
            }
            break
        case tpStates.tpState_playing:
            perform_To_Left_Locator_when_next_fsPress_time_1sec = false
            fsStarted_Play_or_Record = false
            if (triggerEvent == tpEvents.tpEvent_Stop_FP) {
                leave_tpState_FP(context, tpStates.tpState_playing)
                enter_tpState_FP(context, tpStates.tpState_stopped)
            } else if (triggerEvent == tpEvents.tpEvent_Play_FP) {
                leave_tpState_FP(context, tpStates.tpState_playing)
                enter_tpState_FP(context, tpStates.tpState_stopped)
            } else if (triggerEvent == tpEvents.tpEvent_Record_FP) {
                enter_tpState_FP(context, tpStates.tpState_recording)
            } else if (triggerEvent == tpEvents.tpEvent_Stop_CB) {
                leave_tpState_CB(context, tpStates.tpState_playing)
                enter_tpState_CB(context, tpStates.tpState_stopped)
            } else if (triggerEvent == tpEvents.tpEvent_Record_CB) {
                leave_tpState_CB(context, tpStates.tpState_playing)
                enter_tpState_CB(context, tpStates.tpState_recording)
            } else if (triggerEvent == tpEvents.tpEvent_FS) {
                switch (actual_fsPress_time) {
                    case (fsPress_time.fsPress_time_short):
                        leave_tpState_FP(context, tpStates.tpState_playing)
                        if (actual_fsMode == fsModes.fsMode_playStyle) {
                            enter_tpState_FP(context, tpStates.tpState_stopped)
                            fsStarted_Play_or_Record = false
                        } else {
                            // footswitch functionality 'punch-in recording'
                            enter_tpState_FP(context, tpStates.tpState_recording)
                            flashingLED(context, cRecord)
                            fsStarted_Play_or_Record = true
                        }
                        fsPressed_while_Stop = false
                        tpSection.LED_feedback_when_fsAction(context, 3, 0)
                        break
                    case (fsPress_time.fsPress_time_1sec):
                        leave_tpState_FP(context, tpStates.tpState_playing)
                        enter_tpState_FP(context, tpStates.tpState_stopped)
                        fsStarted_Play_or_Record = false
                        tpSection.LED_feedback_when_fsAction(context, 3, 0)
                        break
                    case (fsPress_time.fsPress_time_3sec):
                        // toggeling Footswitch Mode without stop
                        if (actual_fsMode == fsModes.fsMode_playStyle) {
                            actual_fsMode = fsModes.fsMode_recordStyle
                            // only let the Next LED and the FWD LED flash briefly
                            tpSection.LED_feedback_when_fsAction(context, 2, 2)
                        } else {
                            actual_fsMode = fsModes.fsMode_playStyle
                            // only let the Prev LED and the RWD LEDflash briefly
                            tpSection.LED_feedback_when_fsAction(context, 1, 1)
                        }
                        if (debug_tp)
                            console.log('192) > actual_fsMode toggled')
                        break
                }
            }
            break
        case tpStates.tpState_recording:
            perform_To_Left_Locator_when_next_fsPress_time_1sec = false
            fsStarted_Play_or_Record = false
            if (triggerEvent == tpEvents.tpEvent_Stop_FP) {
                leave_tpState_FP(context, tpStates.tpState_recording)
                enter_tpState_FP(context, tpStates.tpState_stopped)
            } else if (triggerEvent == tpEvents.tpEvent_Play_FP) {
                leave_tpState_FP(context, tpStates.tpState_recording)
                enter_tpState_FP(context, tpStates.tpState_stopped)
            } else if (triggerEvent == tpEvents.tpEvent_Record_FP) {
                leave_tpState_FP(context, tpStates.tpState_recording)
                enter_tpState_FP(context, tpStates.tpState_playing)
            } else if (triggerEvent == tpEvents.tpEvent_Stop_CB) {
                leave_tpState_CB(context, tpStates.tpState_recording)
                enter_tpState_CB(context, tpStates.tpState_stopped)
            } else if (triggerEvent == tpEvents.tpEvent_Record_CB) {
                leave_tpState_CB(context, tpStates.tpState_recording)
                enter_tpState_CB(context, tpStates.tpState_playing)
            } else if (triggerEvent == tpEvents.tpEvent_FS) {
                switch (actual_fsPress_time) {
                    case (fsPress_time.fsPress_time_short):
                        leave_tpState_FP(context, tpStates.tpState_recording)
                        if (fsPressed_while_Stop) {
                            // footswitch functionality 'start recording & playback'
                            enter_tpState_FP(context, tpStates.tpState_stopped)
                        } else {
                            // footswitch functionality 'punch-out recording'
                            enter_tpState_FP(context, tpStates.tpState_playing)
                            fsStarted_Play_or_Record = true
                        }
                        tpSection.LED_feedback_when_fsAction(context, 3, 0)
                        break
                    case (fsPress_time.fsPress_time_1sec):
                        // if a punch-in/punch-out recording is running, it will be interrupted
                        leave_tpState_FP(context, tpStates.tpState_recording)
                        enter_tpState_FP(context, tpStates.tpState_stopped)
                        fsStarted_Play_or_Record = false
                        tpSection.LED_feedback_when_fsAction(context, 3, 0)
                        break
                    case (fsPress_time.fsPress_time_3sec):
                        // toggeling Footswitch Mode without stop
                        if (actual_fsMode == fsModes.fsMode_recordStyle) {
                            actual_fsMode = fsModes.fsMode_playStyle
                            // only let the Prev LED and the RWD LEDflash briefly
                            tpSection.LED_feedback_when_fsAction(context, 1, 1)
                        } else {
                            actual_fsMode = fsModes.fsMode_recordStyle
                            // only let the Next LED and the FWD LED flash briefly
                            tpSection.LED_feedback_when_fsAction(context, 2, 2)
                        }
                        if (debug_tp)
                            console.log('193) > actual_fsMode toggled')
                        break
                }
            }
            break
    }
    ignore_Stop_repeat_once = false

    if (debug_tp) {
        console.log('194) > actual_tpState = ' + tpStateToString(actual_tpState))
        console.log('195) > actual_fsMode = ' + fsModeToString(actual_fsMode))
        console.log('196) > fsStarted_Play_or_Record = ' + fsStarted_Play_or_Record.toString())
        console.log('197) > fsPressed_while_Stop = ' + fsPressed_while_Stop.toString())
    }

    steps_after_first_trigger_tpStateMachine(context)
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

    // use custom variables for to handle all transport functions including cycle function
    tpSection.var_Cycle = surface.makeCustomValueVariable('var_Cycle')
    tpSection.var_RWD = surface.makeCustomValueVariable('var_RWD')
    tpSection.var_FWD = surface.makeCustomValueVariable('var_FWD')
    tpSection.var_fastRWD = surface.makeCustomValueVariable('var_fastRWD')
    tpSection.var_fastFWD = surface.makeCustomValueVariable('var_fastFWD')
    tpSection.var_Cycle_and_RWD = surface.makeCustomValueVariable('var_Cycle_and_RWD')
    tpSection.var_Cycle_and_FWD = surface.makeCustomValueVariable('var_Cycle_and_FWD')
    tpSection.var_Stop_and_RWD = surface.makeCustomValueVariable('var_Stop_and_RWD')
    tpSection.var_Stop_and_FWD = surface.makeCustomValueVariable('var_Stop_and_FWD')
    tpSection.var_RTZ = surface.makeCustomValueVariable('var_RTZ')
    tpSection.var_END = surface.makeCustomValueVariable('var_END')
    tpSection.var_shuttle_div8 = surface.makeCustomValueVariable('var_shuttle_div8')
    tpSection.var_shuttle_div4 = surface.makeCustomValueVariable('var_shuttle_div4')
    tpSection.var_shuttle_div2 = surface.makeCustomValueVariable('var_shuttle_div2')
    tpSection.var_shuttle_2x = surface.makeCustomValueVariable('var_shuttle_2x')
    tpSection.var_shuttle_4x = surface.makeCustomValueVariable('var_shuttle_4x')
    tpSection.var_shuttle_8x = surface.makeCustomValueVariable('var_shuttle_8x')
    tpSection.var_rshuttle_div8 = surface.makeCustomValueVariable('var_rshuttle_div8')
    tpSection.var_rshuttle_div4 = surface.makeCustomValueVariable('var_rshuttle_div4')
    tpSection.var_rshuttle_div2 = surface.makeCustomValueVariable('var_rshuttle_div2')
    tpSection.var_rshuttle_2x = surface.makeCustomValueVariable('var_rshuttle_2x')
    tpSection.var_rshuttle_4x = surface.makeCustomValueVariable('var_rshuttle_4x')
    tpSection.var_rshuttle_8x = surface.makeCustomValueVariable('var_rshuttle_8x')
    tpSection.var_Stop = surface.makeCustomValueVariable('var_Stop')
    tpSection.var_Stop_repeat = surface.makeCustomValueVariable('var_Stop_repeat')
    tpSection.var_Play = surface.makeCustomValueVariable('var_Play')
    tpSection.var_Play_until_Next_Marker
        = surface.makeCustomValueVariable('var_Play_until_Next_Marker')
    tpSection.var_Record = surface.makeCustomValueVariable('var_Record')

    // use custom variables for to handle all scroll functions
    tpSection.knob_Scroll_Left = surface.makeCustomValueVariable('knob_Scroll_Left')
    tpSection.knob_Scroll_Right = surface.makeCustomValueVariable('knob_Scroll_Right')
    tpSection.knob_Scroll_Left_normal
        = surface.makeCustomValueVariable('knob_Scroll_Left_normal')
    tpSection.knob_Scroll_Right_normal
        = surface.makeCustomValueVariable('knob_Scroll_Right_normal')
    tpSection.knob_Scroll_Left_per_frame
        = surface.makeCustomValueVariable('knob_Scroll_Left_per_frame')
    tpSection.knob_Scroll_Right_per_frame
        = surface.makeCustomValueVariable('knob_Scroll_Right_per_frame')

    // use custom variables for to handle navigation commands
    tpSection.var_navigateLeft = surface.makeCustomValueVariable('var_navigateLeft')
    tpSection.var_navigateUp = surface.makeCustomValueVariable('var_navigateUp')
    tpSection.var_navigateDown = surface.makeCustomValueVariable('var_navigateDown')
    tpSection.var_navigateRight = surface.makeCustomValueVariable('var_navigateRight')

    // use custom variables for to handle Quick Markers
    tpSection.var_setMarker1 = surface.makeCustomValueVariable('var_setMarker1')
    tpSection.var_setMarker2 = surface.makeCustomValueVariable('var_setMarker2')
    tpSection.var_setMarker3 = surface.makeCustomValueVariable('var_setMarker3')
    tpSection.var_setMarker4 = surface.makeCustomValueVariable('var_setMarker4')
    tpSection.var_toMarker1 = surface.makeCustomValueVariable('var_toMarker1')
    tpSection.var_toMarker2 = surface.makeCustomValueVariable('var_toMarker2')
    tpSection.var_toMarker3 = surface.makeCustomValueVariable('var_toMarker3')
    tpSection.var_toMarker4 = surface.makeCustomValueVariable('var_toMarker4')

    // use custom variable for to start 'Loop Selection' function
    tpSection.var_Loop_Selection = surface.makeCustomValueVariable('var_Loop_Selection')

    // custom variable to turn off the LEDs that indicate a footswitch action
    mSection.var_offLEDs_for_fsAction_after_350ms
        = surface.makeCustomValueVariable('var_offLEDs_for_fsAction_after_350ms')

    mSection.var_offLEDs_for_fsAction_after_350ms.mOnProcessValueChange
    = function(context, value) {
        if (value != 0) {
            var time_now = new Date().getTime()
            if (time_now < start_offLEDs_for_fsAction_after_350ms + 350) {
                mSection.var_offLEDs_for_fsAction_after_350ms.setProcessValue(context, 1)
            } else {
                if (PrevNext_LED_feedback_when_fsAction > 0) {

                    if ((PrevNext_LED_feedback_when_fsAction == 1)
                    || (PrevNext_LED_feedback_when_fsAction == 3)) {      // Prev LED or both LEDs
                        if (backup_state_of_Prev_LED <= 1) {              // for undefinded and off
                            offLED(context, cPrev)
                        } else if (backup_state_of_Prev_LED == 3) {
                            flashingLED(context, cPrev)
                        }
                    }

                    if ((PrevNext_LED_feedback_when_fsAction == 2)
                    || (PrevNext_LED_feedback_when_fsAction == 3)) {      // Next LED or both LEDs
                        if (backup_state_of_Next_LED <= 1) {              // for undefinded and off
                            offLED(context, cNext)
                        } else if (backup_state_of_Next_LED == 3) {
                            flashingLED(context, cNext)
                        }
                    }

                    PrevNext_LED_feedback_when_fsAction = 0
                }

                if (RFWD_LED_feedback_when_fsAction > 0) {

                    if ((RFWD_LED_feedback_when_fsAction == 1)
                    || (RFWD_LED_feedback_when_fsAction == 3)) {          // RWD LED or both LEDs
                        if (backup_state_of_RWD_LED <= 1) {               // for undefinded and off
                            offLED(context, cRWD)
                        } else if (backup_state_of_RWD_LED == 3) {
                            flashingLED(context, cRWD)
                        }
                    }

                    if ((RFWD_LED_feedback_when_fsAction == 2)
                    || (RFWD_LED_feedback_when_fsAction == 3)) {          // FWD LED or both LEDs
                        if (backup_state_of_FWD_LED <= 1) {               // for undefinded and off
                            offLED(context, cFWD)
                        } else if (backup_state_of_FWD_LED == 3) {
                            flashingLED(context, cFWD)
                        }
                    }

                    RFWD_LED_feedback_when_fsAction = 0
                }

                mSection.var_offLEDs_for_fsAction_after_350ms.setProcessValue(context, 0)
            }
        }
    }

    tpSection.LED_feedback_when_fsAction = function(context, PrevNext_LEDs, RFWD_LEDs) {
        if (PrevNext_LEDs > 0) {
            if ((PrevNext_LEDs == 1) || (PrevNext_LEDs == 3)) {           // Prev LED or both LEDs
                backup_state_of_Prev_LED = virt_LEDs_s[LED_Index(cPrev)]
                onLED(context, cPrev)
            }
            if ((PrevNext_LEDs == 2) || (PrevNext_LEDs == 3)) {           // Next LED or both LEDs
                backup_state_of_Next_LED = virt_LEDs_s[LED_Index(cNext)]
                onLED(context, cNext)
            }
            PrevNext_LED_feedback_when_fsAction = PrevNext_LEDs
        }

        if (RFWD_LEDs > 0) {
            if ((RFWD_LEDs == 1) || (RFWD_LEDs == 3)) {                   // RWD LED or both LEDs
                backup_state_of_RWD_LED = virt_LEDs_s[LED_Index(cRWD)]
                onLED(context, cRWD)
            }
            if ((RFWD_LEDs == 2) || (RFWD_LEDs == 3)) {                   // FWD LED or both LEDs
                backup_state_of_FWD_LED = virt_LEDs_s[LED_Index(cFWD)]
                onLED(context, cFWD)
            }
            RFWD_LED_feedback_when_fsAction = RFWD_LEDs
        }

        start_offLEDs_for_fsAction_after_350ms = new Date().getTime()
        mSection.var_offLEDs_for_fsAction_after_350ms.setProcessValue(context, 1)
    }

    // function for to turn RWD off whether it was started normal or as Fast RWD
    tpSection.RWD_turn_off = function(context) {
        // always required, especially in Play Mode
        tpSection.var_RWD.setProcessValue(context, 0)
        if (fastRWD_running) {
            fastRWD_running = false
            // repeat command for a turn to off
            tpSection.var_fastRWD.setProcessValue(context, 1)
        }
    }

    // function for to turn FWD off whether it was started normal or as Fast FWD
    tpSection.FWD_turn_off = function(context) {
        // always required, especially in Play Mode
        tpSection.var_FWD.setProcessValue(context, 0)
        if (fastFWD_running) {
            fastFWD_running = false
            // repeat command for a turn to off
            tpSection.var_fastFWD.setProcessValue(context, 1)
        }
    }

    // function for to perform the relevant shuttle command at lower speed
    tpSection.perform_lower_shuttleSpeed_command = function(context) {
        if (shuttle_reverse) {
            switch (lower_shuttleSpeed_denominator) {
                case 2:
                    tpSection.var_rshuttle_div2.setProcessValue(context, 1)
                    break
                case 4:
                    tpSection.var_rshuttle_div4.setProcessValue(context, 1)
                    break
                case 8:
                    tpSection.var_rshuttle_div8.setProcessValue(context, 1)
                    break
            }
        } else {
            switch (lower_shuttleSpeed_denominator) {
                case 2:
                    tpSection.var_shuttle_div2.setProcessValue(context, 1)
                    break
                case 4:
                    tpSection.var_shuttle_div4.setProcessValue(context, 1)
                    break
                case 8:
                    tpSection.var_shuttle_div8.setProcessValue(context, 1)
                    break
            }
        }
    }

    // function for to perform the relevant shuttle command at higher speed
    tpSection.perform_higher_shuttleSpeed_command = function(context) {
        if (shuttle_reverse) {
            switch (higher_shuttleSpeed_numerator) {
                case 2:
                    tpSection.var_rshuttle_2x.setProcessValue(context, 1)
                    break
                case 4:
                    tpSection.var_rshuttle_4x.setProcessValue(context, 1)
                    break
                case 8:
                    tpSection.var_rshuttle_8x.setProcessValue(context, 1)
                    break
            }
        } else {
            switch (higher_shuttleSpeed_numerator) {
                case 2:
                    tpSection.var_shuttle_2x.setProcessValue(context, 1)
                    break
                case 4:
                    tpSection.var_shuttle_4x.setProcessValue(context, 1)
                    break
                case 8:
                    tpSection.var_shuttle_8x.setProcessValue(context, 1)
                    break
            }
        }
    }

    tpSection.btn_Cycle.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running) {
            // value 0/1 represents release/press, midi channel 1/2 and enable/disable knob_vis
            mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
                .bindToControlChange(value, cKnobRotate).setTypeRelativeSignedBit()
        }
        if (FP_locked)
            return

        if ((lower_shuttleSpeed_running) || (higher_shuttleSpeed_running)) {
            if (value) {
                shuttle_functionality_locked = !shuttle_functionality_locked
                if (shuttle_functionality_locked) {
                    flashingLED(context, cCycle)
                } else {
                    if (lower_shuttleSpeed_running) {
                        offLED(context, cRWD)
                        // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
                        old_var_Play_value = -1.0
                        // repeat command for a turn to off
                        shuttle_end_timestamp = new Date().getTime()
                        tpSection.perform_lower_shuttleSpeed_command(context)
                    }

                    if (higher_shuttleSpeed_running) {
                        offLED(context, cFWD)
                        // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
                        old_var_Play_value = -1.0
                        // repeat command for a turn to off
                        shuttle_end_timestamp = new Date().getTime()
                        tpSection.perform_higher_shuttleSpeed_command(context)
                    }

                    if (tpSection.var_Cycle.getProcessValue(context) == 0) {
                        offLED(context, cCycle)
                    } else {
                        onLED(context, cCycle)
                    }
                }
            }
            if ((!value) && (!shuttle_functionality_locked)) {
                lower_shuttleSpeed_running = false
                higher_shuttleSpeed_running = false
            }
            return
        }

        if (btn_Bypass_running) {
            if (value) {
                btn_Bypass_pressed_to_start_Loop_Selection = true
                tpSection.var_Loop_Selection.setProcessValue(context, 1)
            }
            return
        }

        if (value) {
            // turn on the Cycle LED when the Cycle Button is pressed down
            onLED(context, cCycle)
            btn_Cycle_running = true

            if (btn_Stop_running_fixed) {
                cycle_stop_combination_init = true
            }
            // do not set cycle_stop_combination_init to false when btn_Stop_running_fixed is false

            cycle_stop_combination_init_timestamp = new Date().getTime()

            if (actual_RFWD_State == RFWD_States.btnState_RWD) {
                if (debug_2)
                    console.log('198) set left locator, RWD Button pressed before Cycle Button')
                btn_Cycle_has_set_locator = true
                tpSection.RWD_turn_off(context)
                tpSection.var_Cycle_and_RWD.setProcessValue(context, 1)
                return
            } else if (actual_RFWD_State == RFWD_States.btnState_FWD) {
                if (debug_2)
                    console.log('199) set right locator, FWD Button pressed before Cycle Button')
                btn_Cycle_has_set_locator = true
                tpSection.FWD_turn_off(context)
                tpSection.var_Cycle_and_FWD.setProcessValue(context, 1)
                return
            }

            if (btn_Play_running) {
                btn_Cycle_for_Play_until_Next_Marker = true
                tpSection.var_Play_until_Next_Marker.setProcessValue(context, 1)
                return
            }

        } else {
            // when the Cycle Button is released
            if (Custom_Mode_running == false) {
                // steps after GTS (Global Track Scroll) functionality was running
                if (active_page == pages.page_Pan) {
                    disable_set_Pan_to_center = true
                    mSection.var_ActivatePan.setProcessValue(context, 1)
                } else if (active_page == pages.page_Scroll) {
                    active_pageMain_before = pages.page_none
                    mSection.var_ActivateScroll.setProcessValue(context, 1)
                } else if (active_page == pages.page_Channel) {
                    active_pageMain_before = pages.page_none
                    mSection.var_ActivateChannel.setProcessValue(context, 1)
                } else if (active_page == pages.page_Master) {
                    disable_set_CRLevel_to_0dB_or_before_dB = true
                    mSection.var_ActivateMaster.setProcessValue(context, 1)
                } else if (active_page == pages.page_Lock) {
                    enable_toggle_lock_with_button = 1
                    mSection.var_ActivateLock.setProcessValue(context, 1)
                } else if (active_page == pages.page_Click) {
                    disable_Click_off = true
                    mSection.var_ActivateClick.setProcessValue(context, 1)
                } else if (active_page == pages.page_EQ_Gain) {
                    disable_set_EQ_Param_to_default = true
                    mSection.var_ActivateEQ_Gain.setProcessValue(context, 1)
                } else if (active_page == pages.page_Section) {
                    active_pageMain_before = pages.page_none
                    mSection.var_ActivateSection.setProcessValue(context, 1)
                } else if (active_page == pages.page_Marker) {
                    active_pageMain_before = pages.page_none
                    mSection.var_ActivateMarker.setProcessValue(context, 1)
                } else if (active_page == pages.page_EQ_Freq) {
                    disable_set_EQ_Param_to_default = true
                    mSection.var_ActivateEQ_Freq.setProcessValue(context, 1)
                } else if (active_page == pages.page_EQ_Q) {
                    disable_set_EQ_Param_to_default = true
                    mSection.var_ActivateEQ_Q.setProcessValue(context, 1)
                } else if (active_page == pages.page_PF_PreGain) {
                    disable_set_PF_Param_to_default = true
                    mSection.var_ActivatePF_PreGain.setProcessValue(context, 1)
                } else if (active_page == pages.page_PF_LCut_Freq) {
                    disable_set_PF_Param_to_default = true
                    mSection.var_ActivatePF_LCut_Freq.setProcessValue(context, 1)
                } else if (active_page == pages.page_PF_HCut_Freq) {
                    disable_set_PF_Param_to_default = true
                    mSection.var_ActivatePF_HCut_Freq.setProcessValue(context, 1)
                } else if (active_page == pages.page_Send_LevelA) {
                    return_from_GTS = true
                    mSection.var_ActivateSend_LevelA.setProcessValue(context, 1)
                } else if (active_page == pages.page_Send_LevelB) {
                    return_from_GTS = true
                    mSection.var_ActivateSend_LevelB.setProcessValue(context, 1)
                } else if (active_page == pages.page_CueSend_Level) {
                    return_from_GTS = true
                    mSection.var_ActivateCueSend_Level.setProcessValue(context, 1)
                } else if (active_page == pages.page_CueSend_Pan) {
                    return_from_GTS = true
                    mSection.var_ActivateCueSend_Pan.setProcessValue(context, 1)

                // reload also Quick Control value because mOnTitleChange-event was paused
                // while GTS functionality was running
                } else if (active_page == pages.page_QC1) {
                    return_from_GTS = true
                    mSection.var_ActivateQC1.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC1_Value.getProcessValue(context))
                } else if (active_page == pages.page_QC2) {
                    return_from_GTS = true
                    mSection.var_ActivateQC2.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC2_Value.getProcessValue(context))
                } else if (active_page == pages.page_QC3) {
                    return_from_GTS = true
                    mSection.var_ActivateQC3.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC3_Value.getProcessValue(context))
                } else if (active_page == pages.page_QC4) {
                    return_from_GTS = true
                    mSection.var_ActivateQC4.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC4_Value.getProcessValue(context))
                } else if (active_page == pages.page_QC5) {
                    return_from_GTS = true
                    mSection.var_ActivateQC5.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC5_Value.getProcessValue(context))
                } else if (active_page == pages.page_QC6) {
                    return_from_GTS = true
                    mSection.var_ActivateQC6.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC6_Value.getProcessValue(context))
                } else if (active_page == pages.page_QC7) {
                    return_from_GTS = true
                    mSection.var_ActivateQC7.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC7_Value.getProcessValue(context))
                } else if (active_page == pages.page_QC8) {
                    return_from_GTS = true
                    mSection.var_ActivateQC8.setProcessValue(context, 1)
                    mSection.knob_FP_Value.setProcessValue(context,
                        mSection.knob_QC8_Value.getProcessValue(context))
                }
            }

            btn_Cycle_running = false

            // if the session of pressing the Cycle Button was to set a locator,
            // do not toggle the Cycle State;
            // for that only switch the LED on or off again correctly matching
            // do not toggle the Cycle State also for GTS (Global Track Scroll) functionality
            if ((btn_Cycle_has_set_locator) || (btn_Cycle_for_Play_until_Next_Marker)
            || (global_undo_redo_done)
            || (navigate_or_set_QuickTrack_1_4_done) || (set_Marker_1_4_done)
            || (knob_was_rotated_while_btn_Cycle_running)
            || (knob_was_pressed_while_btn_Cycle_running)
            || ((cycle_stop_combination_init)
            && (new Date().getTime() > (cycle_stop_combination_init_timestamp + 850)))) {

                if (tpSection.var_Cycle.getProcessValue(context) == 0) {
                    offLED(context, cCycle)
                } else {
                    onLED(context, cCycle)
                }

                if (btn_Cycle_has_set_locator) {
                    btn_Cycle_has_set_locator = false
                }

                if (btn_Cycle_for_Play_until_Next_Marker) {
                    btn_Cycle_for_Play_until_Next_Marker = false
                }

                if (global_undo_redo_done) {
                    global_undo_redo_done = false
                }

                if (navigate_or_set_QuickTrack_1_4_done) {
                    navigate_or_set_QuickTrack_1_4_done = false
                    if (Custom_Mode_running == false) {
                        offLED(context, cPrev)
                        offLED(context, cNext)
                    }
                }

                if (set_Marker_1_4_done) {
                    set_Marker_1_4_done = false
                    if (Custom_Mode_running == false) {
                        offLED(context, cPrev)
                        offLED(context, cNext)
                    }
                }

                if (knob_was_rotated_while_btn_Cycle_running) {
                    knob_was_rotated_while_btn_Cycle_running = false
                }

                if (knob_was_pressed_while_btn_Cycle_running) {
                    knob_was_pressed_while_btn_Cycle_running = false
                }

                // check all tracks, when Cycle Button and Stop Button are pressed ca. 1 second
                if ((cycle_stop_combination_init)
                && (new Date().getTime() > (cycle_stop_combination_init_timestamp + 850))) {
                    cycle_stop_combination_init = false

                    // Ignore if the Stop button is still pressed,
                    // otherwise the loop will be aborted immediately.
                    btn_Stop_running_fixed = false
                    mSection.check_all_tracks(context)
                }

            } else {
                // otherwise toggle the Cycle State
                if (tpSection.var_Cycle.getProcessValue(context)) {
                    offLED(context, cCycle)
                    tpSection.var_Cycle.setProcessValue(context, 0)
                } else {
                    onLED(context, cCycle)
                    tpSection.var_Cycle.setProcessValue(context, 1)
                }
            }

            cycle_stop_combination_init = false
        }
    }

    tpSection.btn_Stop.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (Custom_Mode_running) {
            // value 0/1 represents release/press, midi channel 1/2 and enable/disable knob_vis
            mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
                .bindToControlChange(value, cKnobRotate).setTypeRelativeSignedBit()
        }

        if ((FP_locked) || (shuttle_functionality_locked)
        || (lower_shuttleSpeed_running) || (higher_shuttleSpeed_running))
            return
        if (debug_tp)
            console.log('200) tpSection.btn_Stop, value = ' + value.toString())

        var actual_timestamp = new Date().getTime()
        // If the delay between releasing the Play Button and pressing the Stop Button
        // is less than 250 ms, ignore pressing the Play button.
        if ((value) && ((actual_timestamp - btn_Play_release_timestamp) < 250)) {
            if (debug_2) {
                console.log('201) ignore pressing btn_Stop too early')
            }
            return
        }

        btn_Stop_running_fixed = (value)

        if (value) {
            if (btn_Bypass_running) {
                // toggle stop_functionality_locked
                if (stop_functionality_locked) {
                   stop_functionality_locked = false
                } else {
                    stop_functionality_locked = true
                }
                stop_functionality_locked_changed = true

                // Since GPS is active when btn_Bypass_running, the callback function
                // knob_FP_Value.mOnProcessValueChange must not be triggered once
                // the next time the callback function is executed.
                ignore_next_GPS_trigger_while_btn_Bypass_pressed = true
            }

            if (stop_functionality_locked) {
                flashingLED(context, cStop)
            } else {
                onLED(context, cStop)
            }

            if (stop_functionality_locked_changed) {
                btn_Stop_running = true
                return
            }

            if (stop_functionality_locked == false) {
                trigger_tpStateMachine(context, tpEvents.tpEvent_Stop_FP)
            }

            if (btn_Cycle_running) {
                cycle_stop_combination_init = true
            }
            // do not set cycle_stop_combination_init to false when btn_Cycle_running is false

            cycle_stop_combination_init_timestamp = new Date().getTime()

            // disable VU-Meter LED if Touch Button is pressed on Main Page or in EQ Mode
            if (btn_Touch_running_while_clear) {
                disable_VUMeter_with_Stop_after_Touch = true
                disable_VUMeters_temporarily = true
                if (debug_VUMeter)
                    console.log('202) VUMeters temporarily off '
                        + '- Touch Button pressed before Stop Button')

                // set LED color of Touch Button to orange, when it is pressed down
                // together with the Stop Button for to disable the VU-Meter LED
                setColorLED(context, cTouch, RGB_Colors.c_orange)
                onLED(context, cTouch)
            }

            // jump to left locator for the button combination Stop + RWD
            if (actual_RFWD_State == RFWD_States.btnState_RWD) {
                if (debug_2)
                    console.log('203) to left locator, RWD Button pressed before Stop Button')
                tpSection.RWD_turn_off(context)
                tpSection.var_Stop_and_RWD.setProcessValue(context, 1)

            // jump to right locator for the button combination Stop + FWD
            } else if (actual_RFWD_State == RFWD_States.btnState_FWD) {
                if (debug_2)
                    console.log('204) to right locator, FWD Button pressed before Stop Button')
                tpSection.FWD_turn_off(context)
                tpSection.var_Stop_and_FWD.setProcessValue(context, 1)

            // jump to end of project for the button combination Stop + RWD + FWD
            } else if ((btn_RWD_running) && (btn_FWD_running)) {
                if (debug_2)
                    console.log('205) to end, RWD + FWD Buttons pressed before Stop Button')

                btn_Stop_running = false  // prevent two-pressed-button-retriggering
                actual_RFWD_State = RFWD_States.btnState_none

                // at this point the cursor is at zero and RWD and FWD have already been stopped
                tpSection.var_END.setProcessValue(context, 1)
                actual_RFWD_State = RFWD_States.btnState_none
                return

            } else {
                // remember state if Stop Button is pressed down for possible jump to
                // locator for the button combinations Stop + RWD and Stop + FWD
                // when the Stop Button is pressed first
                btn_Stop_running = true
            }

        } else {

            if (((all_8_Send_Levels_were_set_to_oo)
            && ((active_page == pages.page_Send_LevelA)
            || (active_page == pages.page_Send_LevelA)))

            || ((all_4_CueSend_Levels_were_set_to_oo)
            && (active_page == pages.page_CueSend_Level))) {
                mSection.knob_FP_Value.setProcessValue(context, 0)
            } else {
                mSection.param_to_knob_FP_Value(context)
            }

            all_8_Send_Levels_were_set_to_oo = false
            all_4_CueSend_Levels_were_set_to_oo = false

            if (to_Marker_1_4_done) {
                to_Marker_1_4_done = false
                offLED(context, cPrev)
                offLED(context, cNext)
            }

            if (select_QuickTrack_1_4_done) {
                select_QuickTrack_1_4_done = false
                offLED(context, cPrev)
                offLED(context, cNext)
            }

            btn_Stop_running = false
        }
    }

    tpSection.btn_Play.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (FP_locked)
            return
        if (debug_tp)
            console.log('206) tpSection.btn_Play, value = ' + value.toString())

        btn_Play_running = (value)

        if (shuttle_functionality_locked)
            return

        if (btn_Bypass_running) {
            if (value) {

                // Pressing the Bypass and the Play Button sets the Footswitch Mode to Play.
                btn_Bypass_pressed_to_set_actual_fsMode = true
                var old_fsMode = actual_fsMode
                actual_fsMode = fsModes.fsMode_playStyle

                if (actual_tpState != tpStates.tpState_stopped) {
                    // If the actual_fsMode is set during to a playback or recording,
                    // only the Prev LED and the RWD LED flash briefly
                    // as feedback that the eventually change will be applied not at once.
                    tpSection.LED_feedback_when_fsAction(context, 1, 1)

                } else {
                    offLED(context, cRecord)
                    flashingLED(context, cPlay)
                }

                if (debug_tp) {
                    if (actual_fsMode != old_fsMode) {
                        console.log('207) > actual_fsMode toggled')
                    }
                    console.log('208) > actual_fsMode = ' + fsModeToString(actual_fsMode))
                }
            }
            return
        }

        var actual_timestamp = new Date().getTime()
        // If the delay between releasing the Play Button and pressing the Play Button
        // is less than 250 ms, ignore pressing the Play button.
        // This is necessary due to real-time circumstances.
        if ((value) && ((actual_timestamp - btn_Play_release_timestamp) < 250)) {
            if (debug_2) {
                console.log('209) ignore pressing btn_Play too early')
            }
            return
        }

        if (btn_Stop_running_fixed) {
            // prevent 'return to start'
            // when the Play Button is pressed while holding the Stop Button
            ignore_Stop_repeat_once = true
            return
        }

        if (value) {
            if (btn_Cycle_running) {
                btn_Cycle_for_Play_until_Next_Marker = true
                tpSection.var_Play_until_Next_Marker.setProcessValue(context, 1)
            } else {
                fsPressed_while_Stop = true
                trigger_tpStateMachine(context, tpEvents.tpEvent_Play_FP)
            }
        } else {

            if ((lower_shuttleSpeed_running) && (!shuttle_functionality_locked)) {
                offLED(context, cRWD)
                lower_shuttleSpeed_running = false
                // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
                old_var_Play_value = -1.0
                // repeat command for a turn to off
                shuttle_end_timestamp = new Date().getTime()
                tpSection.perform_lower_shuttleSpeed_command(context)
            }

            if ((higher_shuttleSpeed_running) && (!shuttle_functionality_locked)) {
                offLED(context, cFWD)
                higher_shuttleSpeed_running = false
                // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
                old_var_Play_value = -1.0
                // repeat command for a turn to off
                shuttle_end_timestamp = new Date().getTime()
                tpSection.perform_higher_shuttleSpeed_command(context)
            }

            btn_Play_release_timestamp = new Date().getTime()

            mSection.param_to_knob_FP_Value(context)
        }
    }

    tpSection.btn_Record.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if ((FP_locked) || (shuttle_functionality_locked)
        || (lower_shuttleSpeed_running) || (higher_shuttleSpeed_running))
            return
        if (debug_tp)
            console.log('210) tpSection.btn_Record, value = ' + value.toString())

        btn_Record_running = (value)

        if (btn_Bypass_running) {
            if (value) {

                // Pressing the Bypass and the Record Button sets the Footswitch Mode to Record.
                btn_Bypass_pressed_to_set_actual_fsMode = true
                var old_fsMode = actual_fsMode
                actual_fsMode = fsModes.fsMode_recordStyle

                if (actual_tpState != tpStates.tpState_stopped) {
                    // If the actual_fsMode is set during to a playback or recording,
                    // only the Next LED and the FWD LED flash briefly
                    // as feedback that the eventually change will be applied not at once.
                    tpSection.LED_feedback_when_fsAction(context, 2, 2)

                } else {
                    offLED(context, cPlay)
                    flashingLED(context, cRecord)
                }

                if (debug_tp) {
                    if (actual_fsMode != old_fsMode) {
                        console.log('211) > actual_fsMode_fsMode toggled')
                    }
                    console.log('212) > actual_fsMode = ' + fsModeToString(actual_fsMode))
                }
            }
            return
        }

        if (value)
            trigger_tpStateMachine(context, tpEvents.tpEvent_Record_FP)
    }

    tpSection.var_Cycle.mOnProcessValueChange = function(context, value) {
        if (shuttle_functionality_locked) {
            flashingLED(context, cCycle)
        } else {
            if (value) {
                onLED(context, cCycle)
            } else {
                offLED(context, cCycle)
            }
        }
    }

    tpSection.var_Stop.mOnProcessValueChange = function(context, value) {
        // prevent redundant calls of var_Stop
        if (value == old_var_Stop_value)
           return
        old_var_Stop_value = value

        if (debug_tp)
            console.log('213) tpSection.var_Stop, value = ' + value.toString())
        if (value) {
            if (VUMeter_peak_was_shown_after_stop == false) {
                uSection.show_VUMeter_peak_max_value(context)
                VUMeter_peak_was_shown_after_stop = true
                if (debug_VUMeter)
                    console.log('214) var_Stop: show VUMeter peak max')
            }
            trigger_tpStateMachine(context, tpEvents.tpEvent_Stop_CB)
        }
    }

    tpSection.var_Play.mOnProcessValueChange = function(context, value) {
        // prevent redundant calls of var_Play
        if ((value == old_var_Play_value) && (value == 0))
           return
        old_var_Play_value = value

        if (debug_tp)
            console.log('215) tpSection.var_Play, value = ' + value.toString())
        if (value)
            trigger_tpStateMachine(context, tpEvents.tpEvent_Play_CB)
    }

    tpSection.var_Record.mOnProcessValueChange = function(context, value) {
        // prevent redundant calls of var_Record
        if (value == old_var_Record_value)
           return
        old_var_Record_value = value

        if (debug_tp)
            console.log('216) tpSection.var_Record, value = ' + value.toString())
        if (((value) &&
            ((actual_tpState == tpStates.tpState_stopped)
            || (actual_tpState == tpStates.tpState_playing)))
        || ((!value) && (actual_tpState == tpStates.tpState_recording)))  {
            trigger_tpStateMachine(context, tpEvents.tpEvent_Record_CB) }
    }

    tpSection.btn_RWD.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if ((FP_locked) || (shuttle_functionality_locked))
            return
        if (!value) {
            btn_RWD_release_timestamp = new Date().getTime()
        }

        // set left locator to project cursor position if Cycle Button is pressed down
        if (btn_Cycle_running) {
            if (value) {
                btn_Cycle_has_set_locator = true
                if (debug_2)
                    console.log('217) set left locator, Cycle Button pressed before RWD Button')
                tpSection.var_Cycle_and_RWD.setProcessValue(context, 1)
            }
            return
        }

        // shuttle play with lower speed, if Play Button is pressed and not the FWD Button
        if ((btn_Play_running) && (higher_shuttleSpeed_running == false)) {

            var actual_timestamp = new Date().getTime()
            // If the time after the last shuttle operation
            // is less than 250 ms, ignore pressing the FWD button.
            // This is necessary due to real-time circumstances.
            if ((value) && ((actual_timestamp - shuttle_end_timestamp) < 250)) {
                if (debug_2) {
                    console.log('218) ignore pressing btn_RWD too early')
                }
                return
            }

            if (value) {
                onLED(context, cRWD)
                tpSection.perform_lower_shuttleSpeed_command(context)
                lower_shuttleSpeed_running = true
            } else {
                offLED(context, cRWD)
                if (lower_shuttleSpeed_running) {
                    lower_shuttleSpeed_running = false
                    // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
                    old_var_Play_value = -1.0
                    // repeat command for a turn to off
                    shuttle_end_timestamp = new Date().getTime()
                    tpSection.perform_lower_shuttleSpeed_command(context)
                }
            }
            return

        } else if ((lower_shuttleSpeed_running) || (higher_shuttleSpeed_running)) {
            return
        }

        if (value) {
            btn_RWD_running = true
            if (actual_RFWD_State == RFWD_States.btnState_none) {
                actual_RFWD_State = RFWD_States.btnState_RWD
            } else if (actual_RFWD_State == RFWD_States.btnState_FWD) {
                actual_RFWD_State = RFWD_States.btnState_both
            }
        } else {
            btn_RWD_running = false
            if (actual_RFWD_State == RFWD_States.btnState_RWD) {
                actual_RFWD_State = RFWD_States.btnState_none
            } else if (actual_RFWD_State == RFWD_States.btnState_both) {
                actual_RFWD_State = RFWD_States.btnState_FWD
            }
        }

        if (btn_Bypass_running) {
            if (value) {
                if (btn_FWD_running == false) {
                    // disable Navigation Mode
                    onLED(context, cRWD)
                    enable_Navigation_Mode = false
                    btn_Bypass_pressed_to_disable_Navigation_Mode = true
                }
            } else {
                offLED(context, cRWD)
            }
            return
        }

        if (actual_RFWD_State == RFWD_States.btnState_both) {
            offLED(context, cRWD)
            offLED(context, cFWD)
            tpSection.RWD_turn_off(context)
            tpSection.FWD_turn_off(context)

            // if stopped, jump to end of project for the button combination Stop + RWD + FWD
            if (((actual_tpState == tpStates.tpState_stopped)
            && (btn_Stop_running)) || (btn_Stop_running_fixed)) {
                if (debug_2)
                    console.log('219) RWD: to end, Stop Button pressed before RWD + FWD Buttons')

                btn_Stop_running = false  // prevent two-pressed-button-retriggering
                actual_RFWD_State = RFWD_States.btnState_none
                tpSection.var_END.setProcessValue(context, 1)
                actual_RFWD_State = RFWD_States.btnState_none
                return
            } else if (value) {  // return to zero
                actual_RFWD_State = RFWD_States.btnState_none
                tpSection.var_RTZ.setProcessValue(context, 1)
                actual_RFWD_State = RFWD_States.btnState_none
            }

        } else {
            if (!value) {
                offLED(context, cRWD)
                tpSection.RWD_turn_off(context)
            } else {
                onLED(context, cRWD)
                var actual_timestamp = new Date().getTime()

                // interpret delay within 350 ms as doubleclick for to run Fast RWD
                if (((actual_timestamp - btn_RWD_release_timestamp) <= 350)
                && (ignore_next_fastRWD_attempt == false)) {
                    fastRWD_running = true
                }
                if (fastRWD_running) {
                    ignore_next_fastRWD_attempt = true
                    tpSection.var_fastRWD.setProcessValue(context, 1)
                } else {
                    ignore_next_fastRWD_attempt = false
                    tpSection.var_RWD.setProcessValue(context, 1)
                }
            }
        }

        // if stopped, jump to left locator for the button combination Stop + RWD
        if (((actual_tpState == tpStates.tpState_stopped)
        && (btn_Stop_running)) || (btn_Stop_running_fixed)) {
            if (value) {
                if (debug_2)
                    console.log('220) to left locator, Stop Button pressed before RWD Button')
                tpSection.RWD_turn_off(context)
                tpSection.FWD_turn_off(context)
                tpSection.var_Stop_and_RWD.setProcessValue(context, 1)
            }
        }
    }

    tpSection.btn_FWD.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if ((FP_locked) || (shuttle_functionality_locked))
            return
        if (!value) {
            btn_FWD_release_timestamp = new Date().getTime()
        }

        // set right locator to project cursor position if Cycle Button is pressed down
        if (btn_Cycle_running) {
            if (value) {
                btn_Cycle_has_set_locator = true
                if (debug_2)
                    console.log('221) set right locator, Cycle Button pressed before FWD Button')
                tpSection.var_Cycle_and_FWD.setProcessValue(context, 1)
            }
            return
        }

        // shuttle play with higher speed, if Play Button is pressed and not the RWD Button
        if ((btn_Play_running) && (lower_shuttleSpeed_running == false)) {

            var actual_timestamp = new Date().getTime()
            // If the time after the last shuttle operation
            // is less than 250 ms, ignore pressing the FWD button.
            // This is necessary due to real-time circumstances.
            if ((value) && ((actual_timestamp - shuttle_end_timestamp) < 250)) {
                if (debug_2) {
                    console.log('222) ignore pressing btn_FWD too early')
                }
                return
            }

            if (value) {
                onLED(context, cFWD)
                tpSection.perform_higher_shuttleSpeed_command(context)
                higher_shuttleSpeed_running = true
            } else {
                offLED(context, cFWD)
                if (higher_shuttleSpeed_running) {
                    higher_shuttleSpeed_running = false
                    // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
                    old_var_Play_value = -1.0
                    // repeat command for a turn to off
                    shuttle_end_timestamp = new Date().getTime()
                    tpSection.perform_higher_shuttleSpeed_command(context)
                }
            }
            return

        } else if ((lower_shuttleSpeed_running) || (higher_shuttleSpeed_running)) {
            return
        }

        if (value) {
            btn_FWD_running = true
            if (actual_RFWD_State == RFWD_States.btnState_none) {
                actual_RFWD_State = RFWD_States.btnState_FWD
            } else if (actual_RFWD_State == RFWD_States.btnState_RWD) {
                actual_RFWD_State = RFWD_States.btnState_both
            }
        } else {
            btn_FWD_running = false
            if (actual_RFWD_State == RFWD_States.btnState_FWD) {
                actual_RFWD_State = RFWD_States.btnState_none
            } else if (actual_RFWD_State == RFWD_States.btnState_both) {
                actual_RFWD_State = RFWD_States.btnState_RWD
            }
        }

        if (btn_Bypass_running) {
            if (value) {
                if (btn_RWD_running == false) {
                    // enable Navigation Mode
                    onLED(context, cFWD)
                    enable_Navigation_Mode = true
                    btn_Bypass_pressed_to_enable_Navigation_Mode = true
                }
            } else {
                offLED(context, cFWD)
            }
            return
        }

        if (actual_RFWD_State == RFWD_States.btnState_both) {
            offLED(context, cRWD)
            offLED(context, cFWD)
            tpSection.RWD_turn_off(context)
            tpSection.FWD_turn_off(context)

            // if stopped, jump to end of project for the button combination Stop + RWD + FWD
            if (((actual_tpState == tpStates.tpState_stopped)
            && (btn_Stop_running)) || (btn_Stop_running_fixed)) {
                if (debug_2)
                    console.log('223) FWD: to end, Stop Button pressed before RWD + FWD Buttons')

                btn_Stop_running = false  // prevent two-pressed-button-retriggering
                actual_RFWD_State = RFWD_States.btnState_none
                tpSection.var_END.setProcessValue(context, 1)
                actual_RFWD_State = RFWD_States.btnState_none
                return
            } else if (value) {  // return to zero
                actual_RFWD_State = RFWD_States.btnState_none
                tpSection.var_RTZ.setProcessValue(context, 1)
                actual_RFWD_State = RFWD_States.btnState_none
            }

        } else {
            if (!value) {
                offLED(context, cFWD)
                tpSection.FWD_turn_off(context)
            } else {
                onLED(context, cFWD)
                var actual_timestamp = new Date().getTime()

                // interpret delay within 350 ms as doubleclick for to run Fast FWD
                if (((actual_timestamp - btn_FWD_release_timestamp) <= 350)
                && (ignore_next_fastFWD_attempt == false)) {
                    fastFWD_running = true
                }
                if (fastFWD_running) {
                    ignore_next_fastFWD_attempt = true
                    tpSection.var_fastFWD.setProcessValue(context, 1)
                } else {
                    ignore_next_fastFWD_attempt = false
                    tpSection.var_FWD.setProcessValue(context, 1)
                }
            }
        }

        // if stopped, jump to right locator for the button combination Stop + FWD
        if (((actual_tpState == tpStates.tpState_stopped)
        && (btn_Stop_running)) || (btn_Stop_running_fixed)) {
            if (value) {
                if (debug_2)
                    console.log('224) to right locator, Stop Button pressed before FWD Button')
                tpSection.RWD_turn_off(context)
                tpSection.FWD_turn_off(context)
                tpSection.var_Stop_and_FWD.setProcessValue(context, 1)
            }
        }
    }

    tpSection.knob_Scroll_Left.mOnProcessValueChange = function(context, value) {
        if (value) {
            if (Scroll_Mode_per_frame) {
                tpSection.knob_Scroll_Left_per_frame.setProcessValue(context, 1)
            } else {
                tpSection.knob_Scroll_Left_normal.setProcessValue(context, 1)
            }
        }
    }

    tpSection.knob_Scroll_Right.mOnProcessValueChange = function(context, value) {
        if (value) {
            if (Scroll_Mode_per_frame) {
                tpSection.knob_Scroll_Right_per_frame.setProcessValue(context, 1)
            } else {
                tpSection.knob_Scroll_Right_normal.setProcessValue(context, 1)
            }
        }
    }
    return tpSection
}

function midiBinding_tpSection() {
    tpSection.btn_Cycle.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cCycle)
    tpSection.btn_RWD.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cRWD)
    tpSection.btn_FWD.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cFWD)
    tpSection.btn_Stop.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cStop)
    tpSection.btn_Play.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cPlay)
    tpSection.btn_Record.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cRecord)
}

function Binding_tpSection_pageX (pageX, page_is_customPage) {
    pageX.makeValueBinding(tpSection.var_Cycle,
        pageX.mHostAccess.mTransport.mValue.mCycleActive)
    pageX.makeValueBinding(tpSection.var_RWD,
        pageX.mHostAccess.mTransport.mValue.mRewind)
    pageX.makeValueBinding(tpSection.var_FWD,
        pageX.mHostAccess.mTransport.mValue.mForward)

    pageX.makeCommandBinding(tpSection.var_fastRWD,
        'Transport', 'Fast Rewind')
    pageX.makeCommandBinding(tpSection.var_fastFWD,
        'Transport', 'Fast Forward')
    pageX.makeCommandBinding(tpSection.var_Cycle_and_RWD,
        'Transport', 'Set Left Locator')
    pageX.makeCommandBinding(tpSection.var_Cycle_and_FWD,
        'Transport', 'Set Right Locator')
    pageX.makeCommandBinding(tpSection.var_Stop_and_RWD,
        'Transport', 'To Left Locator')
    pageX.makeCommandBinding(tpSection.var_Stop_and_FWD,
        'Transport', 'To Right Locator')
    pageX.makeCommandBinding(tpSection.var_RTZ,
        'Transport', 'Return to Zero')
    pageX.makeCommandBinding(tpSection.var_END,
        'Transport', 'Goto End')
    pageX.makeCommandBinding(tpSection.var_shuttle_div8,
        'Transport', 'Shuttle Play 1/8x')
    pageX.makeCommandBinding(tpSection.var_shuttle_div4,
        'Transport', 'Shuttle Play 1/4x')
    pageX.makeCommandBinding(tpSection.var_shuttle_div2,
        'Transport', 'Shuttle Play 1/2x')
    pageX.makeCommandBinding(tpSection.var_shuttle_2x,
        'Transport', 'Shuttle Play 2x')
    pageX.makeCommandBinding(tpSection.var_shuttle_4x,
        'Transport', 'Shuttle Play 4x')
    pageX.makeCommandBinding(tpSection.var_shuttle_8x,
        'Transport', 'Shuttle Play 8x')
    pageX.makeCommandBinding(tpSection.var_rshuttle_div8,
        'Transport', 'Shuttle Play Reverse 1/8x')
    pageX.makeCommandBinding(tpSection.var_rshuttle_div4,
        'Transport', 'Shuttle Play Reverse 1/4x')
    pageX.makeCommandBinding(tpSection.var_rshuttle_div2,
        'Transport', 'Shuttle Play Reverse 1/2x')
    pageX.makeCommandBinding(tpSection.var_rshuttle_2x,
        'Transport', 'Shuttle Play Reverse 2x')
    pageX.makeCommandBinding(tpSection.var_rshuttle_4x,
        'Transport', 'Shuttle Play Reverse 4x')
    pageX.makeCommandBinding(tpSection.var_rshuttle_8x,
        'Transport', 'Shuttle Play Reverse 8x')
    pageX.makeCommandBinding(tpSection.var_Stop_repeat,
        'Transport', 'Return to Start Position')
    pageX.makeCommandBinding(tpSection.var_Play_until_Next_Marker,
        'Transport', 'Play until Next Marker')

    pageX.makeValueBinding(tpSection.var_Stop,
        pageX.mHostAccess.mTransport.mValue.mStop)
    pageX.makeValueBinding(tpSection.var_Play,
        pageX.mHostAccess.mTransport.mValue.mStart)
    pageX.makeValueBinding(tpSection.var_Record,
        pageX.mHostAccess.mTransport.mValue.mRecord)

    pageX.makeCommandBinding(tpSection.knob_Scroll_Left_normal,
        'Transport', 'Nudge Cursor Left')
    pageX.makeCommandBinding(tpSection.knob_Scroll_Right_normal,
        'Transport', 'Nudge Cursor Right')
    pageX.makeCommandBinding(tpSection.knob_Scroll_Left_per_frame,
        'Transport', 'Nudge -1 Frame')
    pageX.makeCommandBinding(tpSection.knob_Scroll_Right_per_frame,
        'Transport', 'Nudge +1 Frame')

    if (!page_is_customPage) {
        pageX.makeCommandBinding(tpSection.var_Loop_Selection,
            'Transport', 'Loop Selection')

        pageX.makeCommandBinding(tpSection.var_navigateLeft,
            'Navigate', 'Left')
        pageX.makeCommandBinding(tpSection.var_navigateUp,
            'Navigate', 'Up')
        pageX.makeCommandBinding(tpSection.var_navigateDown,
            'Navigate', 'Down')
        pageX.makeCommandBinding(tpSection.var_navigateRight,
            'Navigate', 'Right')

        pageX.makeCommandBinding(tpSection.var_setMarker1,
            'Transport', 'Set Marker 1')
        pageX.makeCommandBinding(tpSection.var_setMarker2,
            'Transport', 'Set Marker 2')
        pageX.makeCommandBinding(tpSection.var_setMarker3,
            'Transport', 'Set Marker 3')
        pageX.makeCommandBinding(tpSection.var_setMarker4,
            'Transport', 'Set Marker 4')

        pageX.makeCommandBinding(tpSection.var_toMarker1,
            'Transport', 'To Marker 1')
        pageX.makeCommandBinding(tpSection.var_toMarker2,
            'Transport', 'To Marker 2')
        pageX.makeCommandBinding(tpSection.var_toMarker3,
            'Transport', 'To Marker 3')
        pageX.makeCommandBinding(tpSection.var_toMarker4,
            'Transport', 'To Marker 4')
    }
}

function hostBinding_tpSection() {
    Binding_tpSection_pageX(pageMain, 0)
    Binding_tpSection_pageX(pageShift, 0)

    // Custom Pages without Loop Selection functionality and without QuickMarkers
    Binding_tpSection_pageX(pageCustomA0, 1)
    Binding_tpSection_pageX(pageCustomA1, 1)
    Binding_tpSection_pageX(pageCustomA2, 1)
    Binding_tpSection_pageX(pageCustomB0, 1)
    Binding_tpSection_pageX(pageCustomB1, 1)
    Binding_tpSection_pageX(pageCustomB2, 1)

    Binding_tpSection_pageX(pageEQ, 0)
    Binding_tpSection_pageX(pagePF, 0)
    Binding_tpSection_pageX(pageSend, 0)
    Binding_tpSection_pageX(pageCueSend, 0)
    Binding_tpSection_pageX(pageQC, 0)
    Binding_tpSection_pageX(pageAudio, 0)
}


// FOOTSWITCH

function create_fsSection(p_x, p_y) {
    var fsSection = {}
    fsSection.btn_Footswitch = surface.makeButton(p_x, p_y, 1.1, 1.1).setShapeCircle()
        .setControlLayer(cl_fsSection)

    // Note:
    // Footswitch_soft_type == 0 for NC-contact (normally closed)
    // Footswitch_soft_type == 1 for NO-contact (normally opened)

    fsSection.btn_Footswitch.mSurfaceValue.mOnProcessValueChange = function(context, value) {

        // Only process footswitch action if no button is pressed and no lock is active.
        if ((FP_locked) || (shuttle_functionality_locked)
        || (lower_shuttleSpeed_running) || (higher_shuttleSpeed_running)
        || (QT_check_all_tracks_or_select_QuickTrack_running)
        || (btn_Shift_running) || (btn_Bypass_running) || (btn_Touch_running_fixed)
        || (btn_Write_running) || (btn_Read_running) || (btn_Prev_running) || (btn_Next_running)
        || (btn_Link_running) || (btn_Pan_running) || (btn_Channel_running) || (btn_Scroll_running)
        || (btn_Master_running) || (btn_Click_running) || (btn_Section_running)
        || (btn_Marker_running) || (knob_Press_running) || (btn_Cycle_running)
        || (btn_RWD_running) || (btn_FWD_running)|| (btn_Play_running) || (btn_Record_running)) {
            return
        }

        if (debug_tp)
            console.log('225) tpSection.btn_Footswitch, value = ' + value.toString())

        if (Footswitch_soft) {
            // Note: The value is inverted for a switch with NC-contact.
            if (value == Footswitch_soft_type) {
                // soft footswitch was pressed down
                fsPress_timestamp = new Date().getTime()
            } else {
                // soft footswitch was released
                var actual_timestamp = new Date().getTime()
                if ((actual_timestamp - fsPress_timestamp) < 10000) {
                    // Only process a footswitch press, if it's shorter than 10 seconds.
                    if ((actual_timestamp - fsPress_timestamp) > 2900) {
                        actual_fsPress_time = fsPress_time.fsPress_time_3sec
                    } else if ((actual_timestamp - fsPress_timestamp) > 900) {
                        actual_fsPress_time = fsPress_time.fsPress_time_1sec
                    } else {
                        actual_fsPress_time = fsPress_time.fsPress_time_short
                    }
                    trigger_tpStateMachine(context, tpEvents.tpEvent_FS)
                }
            }
        } else {
            // hard toggle switch is used as footswitch
            actual_fsPress_time = fsPress_time.fsPress_time_short
            trigger_tpStateMachine(context, tpEvents.tpEvent_FS)
        }
    }
    return fsSection
}

function midiBinding_fsSection() {
    fsSection.btn_Footswitch.mSurfaceValue.mMidiBinding.setInputPort(midiIn).bindToNote(0, cFootswitch)
}


steps_after_first_trigger_tpStateMachine = function(context) {
    if (set_LEDs_at_start) {
        reset_virt_LEDs()

        setColorLED(context, cWrite, RGB_Colors.c_red)
        setColorLED(context, cRead, RGB_Colors.c_green)
        onLED(context, cPan)
        offLED(context, cChannel)
        offLED(context, cScroll)
        offLED(context, cMaster)

        if (mSection.var_MetronomeActive.getProcessValue(context)) {
            onLED(context, cClick)
        } else {
            offLED(context, cClick)
        }
        offLED(context, cSection)
        offLED(context, cMarker)

        onLED(context, cStop)
        offLED(context, cPlay)
        offLED(context, cRecord)
        offLED(context, cRWD)
        offLED(context, cFWD)

        stop_functionality_locked = false
        stop_functionality_locked_change = false

        tpSection.var_Stop.setProcessValue(context, 1)
        tpSection.var_Play.setProcessValue(context, 0)
        tpSection.var_Record.setProcessValue(context, 0)

        set_LEDs_at_start = false
        uSection.var_FocusLockedValue.setProcessValue(context, 0)
    }

    if (switch_to_Main_Page_at_start)  {
        if (!pageMain_is_active) {
            // force reload of Main Page at start when all scripts are reloaded
            uSection.var_pageMain_Activate.setProcessValue(context, 1)
        }
        // set to false because of multiple calls
        switch_to_Main_Page_at_start = false

        if (FP_locked) {
            midiBinding_uSection()
            midiBinding_mSection()
            FP_locked = false
            wait_until_Touch_Button_is_released = false
        }

        if (lower_shuttleSpeed_running) {
            // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
            old_var_Play_value = -1.0
            // repeat command for a turn to off
            tpSection.perform_lower_shuttleSpeed_command(context)
            lower_shuttleSpeed_running = false
        }

        if (higher_shuttleSpeed_running) {
            // force tpEvent_Play_CB when tpSection.var_Play.mOnProcessValueChange
            old_var_Play_value = -1.0
            // repeat command for a turn to off
            tpSection.perform_higher_shuttleSpeed_command(context)
            higher_shuttleSpeed_running = false
        }

        // virtual Link LED must not contain reset values at startup
        setColorLED(context, cLink, RGB_Colors.c_cyan_light)
        if (mSection.var_edit_Channel.getProcessValue(context)) {
            onLED(context, cLink)
        } else {
            offLED(context, cLink)
        }

        // welcome: Prev LED & Next LED light up briefly
        tpSection.LED_feedback_when_fsAction(context, 3, 0)
    }

    if (start_with_Master_Mode) {
        mSection.var_ActivateMaster.setProcessValue(context, 1)

        // set to false because of multiple calls
        start_with_Master_Mode = false
    }

    if (!script_loaded) {
        script_loaded = true
        console.log('loading script completed')
    }
}


reset_old_knob_Send_Values = function() {
    for (i = 0; i <= 7; i++) {
        old_knob_Send_Level_Values [i] = 0
        old_Send_On_Values[i] = 0
        old_Send_Pre_Values[i] = 0
    }
}

reset_old_knob_CueSend_Values = function() {
    for (i = 0; i <= 3; i++) {
        old_knob_CueSend_Level_Values[i] = 0
        old_knob_CueSend_Pan_Values[i] = 0
        old_CueSend_On_Values[i] = 0
        old_CueSend_Pre_Values[i] = 0
    }
}

reset_global_vars = function(context) {
    active_page = pages.page_none
    last_active_pageMain = pages.page_none
    last_active_pageShift = pages.page_none
    last_active_pageQC = pages.page_QC1
    last_active_pageAudio = pages.page_Audio_Volume
    pageMain_is_active = false
    pageShift_is_active = false
    active_pageMain_before = pages.page_none
    active_pageMain_before_Click = pages.page_Pan
    active_pageShift_before = pages.page_none
    last_active_pageMain_with_virtual_knob = pages.page_Pan
    last_active_pageShift_with_virtual_knob = pages.page_Lock
    return_from_CS_Bypass = pages.page_Zoom
    last_btn_Shift_press_activated_Custom_Mode = false
    last_btn_Shift_press_changed_Custom_Mode_bank = false
    actual_Custom_Mode_bank = 'A'
    last_pageCustomA = 0
    last_pageCustomB = 0
    low_resolution_AI_Mode_locked = false
    high_resolution_AI_Mode_locked = false
    set_low_resolution_AI_Mode_with_Prev = false
    set_high_resolution_AI_Mode_with_Next = false
    lock_low_resolution_AI_Mode_with_Prev = false
    lock_high_resolution_AI_Mode_with_Next = false
    toggle_lock_resolution_AI_Mode_with_Click = false
    set_min_value_AI_Mode_with_Prev = false
    set_max_value_AI_Mode_with_Next = false
    ValueUnderMouse_changed_with_button = false
    to_AI_Mode_with_Shift = false
    ignore_release_btn_Channel = false
    if (clear_special_memory_when_changing_projects) {
        specialmemory_ValueUnderMouse_has_data = [false, false, false, false, false]
        specialmemory_ValueUnderMouse = [0.0, 0.0, 0.0, 0.0, 0.0]
    }
    specialmemory_ValueUnderMouse_Write_done = false
    specialmemory_ValueUnderMouse_Read_done = false
    EQ_Mode_running = false
    directly_to_EQ_Mode = false
    selected_EQ_Param = EQ_Params.EQ_Gain
    last_selected_EQ_Param = EQ_Params.EQ_Gain
    disable_set_EQ_Param_to_default = false
    selected_EQ_Band = 4
    last_selected_EQ_Band = 4
    if (clear_special_memory_when_changing_projects) {
      specialmemory_EQ_has_data = [false, false, false, false, false]
      specialmemory_EQ_Band1_State = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band2_State = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band3_State = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band4_State = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band1_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band2_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band3_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band4_Gain = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band1_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band2_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band3_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band4_Freq = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band1_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band2_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band3_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band4_Q = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band1_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band2_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band3_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]
      specialmemory_EQ_Band4_FilterType = [0.0, 0.0, 0.0, 0.0, 0.0]
    }
    specialmemory_EQ_Write_done = false
    specialmemory_EQ_Read_done = false
    PF_Mode_running = false
    selected_PF_Param = PF_Params.PF_PreGain
    last_selected_PF_Param = PF_Params.PF_PreGain
    disable_set_PF_Param_to_default = false
    QC_Mode_running = false
    must_set_actual_QC = false
    fader_QC = 1
    fader_QC_selectable = false
    fader_QC_was_set = false
    fader_was_set_with_Touch_within_QC_Mode = false
    low_resolution_QC_Mode_locked = false
    high_resolution_QC_Mode_locked = false
    set_low_resolution_QC_Mode_with_Prev = false
    set_high_resolution_QC_Mode_with_Next = false
    lock_low_resolution_QC_Mode_with_Prev = false
    lock_high_resolution_QC_Mode_with_Next = false
    toggle_lock_resolution_QC_Mode_with_Click = false
    set_min_value_QC_Mode_with_Prev = false
    set_max_value_QC_Mode_with_Next = false
    recall_QCs = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    must_renew_recall_QCs = false
    for (i = 0; i <= 7; i++) {
        QC_value_option[i] = 0
    }
    Send_Mode_running = false
    enter_Send_Mode = false
    selected_Send = 1
    last_selected_Send = 1
    must_set_actual_Send_Level_Bank = false
    disable_set_Send_LevelA_to_Min_or_0dB = true
    disable_set_Send_LevelB_to_Min_or_0dB = false
    all_8_Send_Levels_were_set_to_oo = false
    avoid_set_Send_Level_LED_for_Send_LevelA = false
    sync_motorfader_within_Send_Mode_to_Send_Value = false
    selected_Send_changed_while_sync_motorfader_to_Send_Value = false
    CueSend_Mode_running = false
    selected_CueSend = 1
    last_selected_CueSend = 1
    selected_CueSend_Param = CueSend_Params.CueSend_Level
    last_selected_CueSend_Param = CueSend_Params.CueSend_Level
    disable_set_CueSend_Level_to_Min_or_0dB = true
    all_4_CueSend_Levels_were_set_to_oo = false
    xSend_Level_Value_before_set_to_Min_or_0dB
        = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    Audio_Mode_running = false
    enter_Audio_Mode = false
    must_set_actual_Audio_Mode = false
    FirstTrack = UndefinedTrack
    LastTrack = UndefinedTrack
    PreviousTrack = UndefinedTrack
    QuickTrack1 = UndefinedTrack
    QuickTrack2 = UndefinedTrack
    QuickTrack3 = UndefinedTrack
    QuickTrack4 = UndefinedTrack
    FirstTrack_distances = []
    LastTrack_distances = []
    QuickTrack1_distances = []
    QuickTrack2_distances = []
    QuickTrack3_distances = []
    QuickTrack4_distances = []
    selected_QuickTrack = -1
    selected_QuickTrack_distance = 0
    number_of_Tracks = 0
    TrackList = []
    tmp_TrackList = []
    ActualTrack = ''
    distance_to_FirstTrack = 0
    distance_to_LastTrack = 0
    QT_check_all_tracks_or_select_QuickTrack_running = false
    QT_abort_check_all_tracks = false
    QT_count_to_distance = 0
    QT_timestamp_at_start_of_loop = 0
    QT_loop_end_step_count = 0
    QT_mode_after_to_track_with_name = 1
    cycle_stop_combination_init = false
    cycle_stop_combination_init_timestamp = new Date().getTime()
    QuickVolume1 = -0.1
    QuickVolume2 = -0.1
    QuickVolume3 = -0.1
    QuickVolume4 = -0.1
    last_Volume = -0.1
    fader_is_set_to_volume = true
    last_volume_DisplayValue = ''
    FP_last_write_value = -1
    shutdown_fader_on_close = true
    return_from_main_anti_flicker = false
    return_from_shift_anti_flicker = false
    first_pan_activate = true
    first_zoom_activate = true
    first_shift_activate = true
    EQ_Mode_was_active = false
    bypass_LED_reset_within_onDeactivate_SubPage_Lock = false
    prevent_turnOffLinkLED_when_OnTitleChange = false
    disable_all_LED_functions = true
    knob_was_rotated_within_Zoom_Mode = false
    knob_was_rotated_while_btn_Cycle_running = false
    knob_was_pressed_while_btn_Cycle_running = false
    knob_was_rotated_while_btn_Bypass_running = false
    knob_was_pressed_while_btn_Bypass_running = false
    ignore_next_GPS_trigger_while_btn_Bypass_pressed = false
    FP_locked = false
    lock_FP_within_QC_Mode = false
    stop_functionality_locked = false
    stop_functionality_locked_changed = false
    actual_motorfader_mode = motorfader_modes.mf_mode_on
    return_from_GTS = false
    set_LEDs_at_start = true
    switch_to_Main_Page_at_start = true
    first_knob_CRLevel_Value_assign = true
    disable_Click_off = false
    disable_set_Pan_to_center = false
    disable_set_CRLevel_to_0dB_or_before_dB = false
    toShift_or_toCustom_when_Pan_Mode = false
    btn_Shift_running = false
    btn_Shift_running_fixed = false
    Custom_Mode_running = false
    toggle_Arm_Unarm_next = false
    next_grid_type_selected = false
    Scroll_Mode_per_frame = false
    Link_Pan_Channel_Scroll_running = false
    Link_Pan_Channel_Scroll_perform_down = false
    btn_Bypass_pressed_to_toggle_listen_state = false
    btn_Bypass_pressed_to_toggle_monitor_state = false
    btn_Bypass_pressed_to_toggle_editChannel = false
    btn_Bypass_pressed_to_toggle_Mixer_Window = false
    btn_Bypass_pressed_to_toggle_Video_Window = false
    btn_Bypass_pressed_within_EQ_Mode = false
    btn_Bypass_pressed_within_Send_Mode = false
    btn_Bypass_pressed_to_call_Bypass_Write_functions = false
    btn_Bypass_pressed_to_toggle_Automation_Panel = false
    btn_Bypass_pressed_to_toggle_Markers_Window = false
    btn_Bypass_pressed_to_set_left_selSide_to_cursor = false
    btn_Bypass_pressed_to_set_right_selSide_to_cursor = false
    btn_Bypass_pressed_to_disable_Navigation_Mode = false
    btn_Bypass_pressed_to_enable_Navigation_Mode = false
    btn_Bypass_pressed_to_start_Loop_Selection = false
    btn_Bypass_pressed_to_set_actual_fsMode = false
    btn_Bypass_pressed_with_Middle_Section_Button_within_Master_Mode = false
    btn_Bypass_pressed_for_toggle_between_pan_and_pan2 = false
    btn_Scroll_pressed_to_enter_Zoom_Mode = false
    btn_Scroll_pressed_for_zoom_command = false
    btn_Write_running_since_Bypass_Write_pressed = false
    btn_Read_running_since_toggling_Automation_Panel = false
    perform_hide_all_automation_when_Bypass_is_pressed_next = false
    perform_show_all_automation_when_Touch_is_pressed_next = false
    Pan2_active = false
    Pan_Value_changed_with_button = false
    special_memory_was_written = false
    special_memory_was_read = false
    perform_clear_special_memory_Write = false
    perform_clear_special_memory_Read = false
    enable_toggle_lock_with_button = 0
    reset_virt_LEDs()
    btn_Bypass_running = false
    btn_Write_running = false
    btn_Read_running = false
    after_Write_running_wait = false
    after_Read_running_wait = false
    btn_Touch_running_fixed = false
    btn_Touch_running_while_clear = false
    btn_Touch_running_doubleclick = false
    disable_VUMeter_with_Stop_after_Touch = false
    VUMeter_peak_was_shown_after_stop = false
    btn_Prev_running = false
    btn_Next_running = false
    knob_Press_running = false
    btn_Link_running = false
    btn_Pan_running = false
    btn_Channel_running = false
    btn_Scroll_running = false
    btn_Master_running = false
    btn_Click_running = false
    btn_Section_running = false
    btn_Marker_running = false
    wait_until_Prev_Button_is_released = false
    wait_until_Next_Button_is_released = false
    actual_tpState = tpStates.tpState_stopped
    actual_RFWD_State = RFWD_States.btnState_none
    btn_Stop_running = false
    btn_Stop_running_fixed = false
    btn_Play_running = false
    btn_Record_running = false
    ignore_Stop_repeat_once = false
    btn_Cycle_running = false
    set_Marker_1_4_done = false
    to_Marker_1_4_done = false
    global_undo_redo_done = false
    navigate_or_set_QuickTrack_1_4_done = false
    select_QuickTrack_1_4_done = false
    select_Volume_of_QuickTrack_1_4_done = false
    btn_Cycle_has_set_locator = false
    btn_Cycle_for_Play_until_Next_Marker = false
    btn_RWD_running = false
    btn_FWD_running = false
    lower_shuttleSpeed_denominator = 2
    higher_shuttleSpeed_numerator = 2
    shuttle_reverse = false
    backup_state_of_direction_LED = 1  // off
    shuttle_functionality_locked = false
    fastRWD_running = false
    fastFWD_running = false
    ignore_next_fastRWD_attempt = true
    ignore_next_fastFWD_attempt = true
    old_var_Stop_value = -1.0
    old_var_Play_value = -1.0
    old_var_Record_value = -1.0
    actual_fsMode = fsModes.fsMode_playStyle
    fsStarted_Play_or_Record = false
    fsPressed_while_Stop = true
    perform_To_Left_Locator_when_next_fsPress_time_1sec = false
    backup_state_of_Prev_LED = 1
    backup_state_of_Next_LED = 1
    backup_state_of_RWD_LED = 1
    backup_state_of_FWD_LED = 1
    PrevNext_LED_feedback_when_fsAction = false
    RFWD_LED_feedback_when_fsAction = false
}


deviceDriver.mOnActivate = function(context) {
    if (debug_2)
        console.log('226) activate deviceDriver')

    disable_all_LED_functions = true

    // Note: The variable disable_all_LED_functions is set
    // to false with the first call-up of the Main Page.

    if (sync_0dB_to_U = true) {
        // reset motorfader at start
        midiOut.sendMidi(context, [0xE0, 0x00, 0x00])
    }

    if (script_deactivated) {
        console.log('fp-wizard de- & reactivated')
        script_deactivated = false
    }
}


// When deactivate device, switch off all LEDs and
// shutdown fader if Motorfader Mode is not set to off.

var save_start_with_Master_Mode = start_with_Master_Mode

deviceDriver.mOnDeactivate = function(context) {
    if (debug_2)
        console.log('227) deactivate deviceDriver')

    // enable knob_vis by setting the midi channel to 1
    // This instruction is mandatory, otherwise the assignments
    // within the MIDI Remote Manager could be lost.
    mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
        .bindToControlChange(0, cKnobRotate).setTypeRelativeSignedBit()

    reset_virt_LEDs()

    // set colors of RGB LEDs to Off
    setColorLED(context, cTouch, RGB_Colors.c_off)
    setColorLED(context, cWrite, RGB_Colors.c_off)
    setColorLED(context, cRead, RGB_Colors.c_off)

    for (i = 1; i <= 4; i++) {
        setColorLED(context, mLED_code(i), RGB_Colors.c_off)
    }

    // switch off LEDs
    offLED(context, cSolo)
    offLED(context, cMute)
    offLED(context, cArm)
    offLED(context, cShift)
    offLED(context, cBypass)
    offLED(context, cTouch)
    offLED(context, cWrite)
    offLED(context, cRead)
    offLED(context, cPrev)
    offLED(context, cNext)

    for (i = 1; i <= 8; i++) {
        offLED(context, mLED_code(i))
    }

    offLED(context, cCycle)
    offLED(context, cRWD)
    offLED(context, cFWD)
    offLED(context, cStop)
    offLED(context, cPlay)
    offLED(context, cRecord)

    mSection.init_QuickTracks(context)
    QT_check_all_tracks_or_select_QuickTrack_running = false
    QT_abort_check_all_tracks = false

    set_LEDs_at_start = true
    switch_to_Main_Page_at_start = true
    start_with_Master_Mode = save_start_with_Master_Mode

    // shutdown fader if Motorfader Mode is not set to off
    if (shutdown_fader_on_close) {
        midiOut.sendMidi(context, [0xE0, 0x00, 0x00])
    }

    reset_global_vars(context)
    script_deactivated = true
}


// MAIN

var debug_1 = false
var debug_2 = false
var debug_tp = false
var debug_mapping_pages = false
var debug_fader = false
var debug_knob_FP_Value = false
var debug_assign_virtual_knob = false
var debug_EQ_knob = false
var debug_EQ_Mode = false
var debug_PF_Mode = false
var debug_Send_Mode = false
var debug_CueSend_Mode = false
var debug_VUMeter = false
var debug_check_all_tracks = false

if (debug_2)
    console.log('228) MAIN Initialization started')

if (Volume_Max_12) {
    CRLevel_Value_0dB = c0dB_12
    CRLevel_Value_n20dB = cn20dB_12
    CRLevel_Value_before_set_to_0dB = CRLevel_Value_0dB
    Fader_Value_0dB = c0dB_12
    console.log('Volume Max is set to +12 dB')
} else {
    console.log('Volume Max is set to +6 dB')
}

if (Footswitch_soft) {
    if (Footswitch_soft_type == 0) {
        console.log('Footswitch is set to soft NC')
    } else {
        console.log('Footswitch is set to soft NO')
    }
} else {
    console.log('Footswitch is set to hard')
}

// The names of the mapping pages do not contain an underscore
// to distinguish them from the names of the subpages.

var pageMain = deviceDriver.mMapping.makePage('PreSonus FP2 MAIN')
var pageShift = deviceDriver.mMapping.makePage('PreSonus FP2 SHIFT')
var pageCustomA0 = deviceDriver.mMapping.makePage('PreSonus FP2 CUSTOM A0')
var pageCustomA1 = deviceDriver.mMapping.makePage('PreSonus FP2 CUSTOM A1')
var pageCustomA2 = deviceDriver.mMapping.makePage('PreSonus FP2 CUSTOM A2')
var pageCustomB0 = deviceDriver.mMapping.makePage('PreSonus FP2 CUSTOM B0')
var pageCustomB1 = deviceDriver.mMapping.makePage('PreSonus FP2 CUSTOM B1')
var pageCustomB2 = deviceDriver.mMapping.makePage('PreSonus FP2 CUSTOM B2')
var pageEQ = deviceDriver.mMapping.makePage('PreSonus FP2 EQ')
var pagePF = deviceDriver.mMapping.makePage('PreSonus FP2 PF')
var pageSend = deviceDriver.mMapping.makePage('PreSonus FP2 SEND')
var pageCueSend = deviceDriver.mMapping.makePage('PreSonus FP2 CUE SEND')
var pageQC = deviceDriver.mMapping.makePage('PreSonus FP2 QC')
var pageAudio = deviceDriver.mMapping.makePage('PreSonus FP2 AUDIO')

var SubPageArea_Main = pageMain.makeSubPageArea('SubPageArea Main')
var SubPageArea_Shift = pageShift.makeSubPageArea('SubPageArea Shift')
var SubPageArea_EQ = pageEQ.makeSubPageArea('SubPageArea EQ')
var SubPageArea_PF = pagePF.makeSubPageArea('SubPageArea PF')
var SubPageArea_Send = pageSend.makeSubPageArea('SubPageArea Send')
var SubPageArea_CueSend = pageCueSend.makeSubPageArea('SubPageArea CueSend')
var SubPageArea_QC = pageQC.makeSubPageArea('SubPageArea QC')
var SubPageArea_Audio = pageAudio.makeSubPageArea('SubPageArea Audio')

// The first subpage SubPage_Pan on pageMain will always be activated
// when switched from pageShift to pageMain, so SubPage_Pan needs an anti-flicker-exit
// when the last subpage on pageMain was not SubPage_Pan.

// SubPage_Pan is the first subpage on pageMain - do not change this.
var SubPage_Pan = SubPageArea_Main.makeSubPage('Pan')
var SubPage_Channel = SubPageArea_Main.makeSubPage('Channel')
var SubPage_Scroll = SubPageArea_Main.makeSubPage('Scroll')
var SubPage_Master = SubPageArea_Main.makeSubPage('Master')
var SubPage_Click = SubPageArea_Main.makeSubPage('Click')
var SubPage_Section = SubPageArea_Main.makeSubPage('Section')
var SubPage_Marker = SubPageArea_Main.makeSubPage('Marker')

// The first subpage SubPage_Zoom on pageShift will always be activated
// when switched from pageMain to pageShift, so SubPage_Zoom needs an anti-flicker-exit
// when the last subpage on pageShift was not SubPage_Zoom.

// SubPage_Zoom is the first subpage on pageShift - do not change this!
var SubPage_Zoom = SubPageArea_Shift.makeSubPage('Zoom')
var SubPage_Hitpoint = SubPageArea_Shift.makeSubPage('Hitpoint')
var SubPage_Lock = SubPageArea_Shift.makeSubPage('Lock')
var SubPage_Quantize = SubPageArea_Shift.makeSubPage('Quantize')
var SubPage_Nudge = SubPageArea_Shift.makeSubPage('Nudge')  // now on Shift Page
var SubPage_CS_Bypass = SubPageArea_Shift.makeSubPage('CS_Bypass')

// SubPage_EQ_Gain is the first subpage on pageEQ - do not change this!
var SubPage_EQ_Gain = SubPageArea_EQ.makeSubPage('EQ_Gain')
var SubPage_EQ_Freq = SubPageArea_EQ.makeSubPage('EQ_Freq')
var SubPage_EQ_Q = SubPageArea_EQ.makeSubPage('EQ_Q')

// SubPage_PF_PreGain is the first subpage on pagePF - do not change this!
var SubPage_PF_PreGain = SubPageArea_PF.makeSubPage('PF_PreGain')
var SubPage_PF_LCut_Freq = SubPageArea_PF.makeSubPage('PF_LCut_Freq')
var SubPage_PF_HCut_Freq = SubPageArea_PF.makeSubPage('PF_HCut_Freq')

// SubPage_Send_LevelA is the first subpage on pageSend - do not change this
// Send_LevelA for Send Level 1..4, Send_LevelB for Send Level 5..8
var SubPage_Send_LevelA = SubPageArea_Send.makeSubPage('Send_LevelA')
var SubPage_Send_LevelB = SubPageArea_Send.makeSubPage('Send_LevelB')

// SubPage_CueSend_Level is the first subpage on pageCueSend - do not change this!
// CueSend_Level for Send Cue Level 1..4, CueSend_Pan for Send Pan Value 1..4
var SubPage_CueSend_Level = SubPageArea_CueSend.makeSubPage('CueSend_Level')
var SubPage_CueSend_Pan = SubPageArea_CueSend.makeSubPage('CueSend_Pan')

// SubPage_QC1 is the first subpage on pageQC - do not change this!
var SubPage_QC1 = SubPageArea_QC.makeSubPage('QC1')
var SubPage_QC2 = SubPageArea_QC.makeSubPage('QC2')
var SubPage_QC3 = SubPageArea_QC.makeSubPage('QC3')
var SubPage_QC4 = SubPageArea_QC.makeSubPage('QC4')
var SubPage_QC5 = SubPageArea_QC.makeSubPage('QC5')
var SubPage_QC6 = SubPageArea_QC.makeSubPage('QC6')
var SubPage_QC7 = SubPageArea_QC.makeSubPage('QC7')
var SubPage_QC8 = SubPageArea_QC.makeSubPage('QC8')

// SubPage_Audio_Volume is the first subpage on pageAudio - do not change this!
var SubPage_Audio_Volume = SubPageArea_Audio.makeSubPage('Audio_Volume')
var SubPage_Audio_FadeIn = SubPageArea_Audio.makeSubPage('Audio_FadeIn')
var SubPage_Audio_FadeOut = SubPageArea_Audio.makeSubPage('Audio_FadeOut')

// Create global methods as no operation (NOP) reference.
// These methods are required when using the function assign_virtual_knob.
var NOP_Main = pageMain.mCustom.makeHostValueVariable('NOP_pageMain')
var NOP_Shift = pageShift.mCustom.makeHostValueVariable('NOP_pageShift')

// FADER, create and bind surface element
var fader = create_fader(0.11, 0, 5.728)
midiBinding_fader()

// Whether Cubase 13 or a higher version is installed
// is determined in the following function call.
hostBinding_fader()

if (!Cubase13_or_higher_installed)
    console.log('fadertouch, listen & pan2 not available in Cubase 12')

if (determine_sync_factors)
    console.log('Note: determine_sync_factors is set to true')

// UPPER SECTION, create and bind surface elements
var uSection = create_uSection(1.6, 0)
midiBinding_uSection()
hostBinding_uSection()

// MIDDLE SECTION, create and bind surface elements
var mSection = create_mSection(1.6, 1.87)
midiBinding_mSection()

// Whether Cubase 13 or a higher version is installed
// must have been determined beforehand.
hostBinding_mSection()

// TRANSPORT SECTION, create and bind surface elements
var tpSection = create_tpSection(1.6, 4.92)
midiBinding_tpSection()
hostBinding_tpSection()

// FOOTSWITCH, create and bind surface element
var fsSection = create_fsSection(0.11, 6.118)
midiBinding_fsSection()

// Use special data structure as 24 virtual LEDs to reduce midi data traffic.
reset_virt_LEDs()


// special code for implementing the pan2 (= tag 4204) and listen (= tag 4111) functionality
// and to detect whether the actual track is an instrument track or not

if (Cubase13_or_higher_installed) {
    var knob_Pan2_Value = surface.makeKnob(0.06, 6.11, 0, 0)  // hidden: no width, no height
    var var_Pan2_Value = surface.makeCustomValueVariable('var_Pan2_Value')
    var hostvar_Pan2_Value = pageMain.mCustom.makeHostValueVariable('hostvar_Pan2_Value')
    var tDirectAccess = pageMain.mHostAccess.makeDirectAccess(pageMain.mHostAccess
        .mTrackSelection.mMixerChannel)

    tDirectAccess.mOnObjectChange = function(context, mapping, ObjID) {
        var Pan_ObjID = tDirectAccess.getChildObjectID(mapping, ObjID, 2)
        var Pan2_Value = tDirectAccess.getParameterProcessValue(mapping, Pan_ObjID, 4204)
    }

    tDirectAccess.mOnParameterChange = function(context, mapping, ObjID, tag) {
        var Pan2_Value = tDirectAccess.getParameterProcessValue(mapping, ObjID, tag)
    }

    function set_Pan2_Value(mapping, diff) {
        var ObjID = tDirectAccess.getBaseObjectID(mapping)
        var Pan_ObjID = tDirectAccess.getChildObjectID(mapping, ObjID, 2)
        var Pan2_Value = tDirectAccess.getParameterProcessValue(mapping, Pan_ObjID, 4204)

        // calculate Pan2_Value with
        // normalization to even values L, L98, ... L4, L2, C, R2, R4, ... R98, R
        if (diff > 0) {
            Pan2_Value = Math.ceil((Pan2_Value + 1/255) * 100) / 100
            if (Pan2_Value > 1) {
                Pan2_Value = 1
            }
        } else if (diff < 0) {
            Pan2_Value = Math.floor((Pan2_Value - 1/255) * 100) / 100
            if (Pan2_Value < 0) {
                Pan2_Value = 0
            }
        }
        if (diff != 0) {
            // 0 is excluded for safety reasons, as this value represents a toggle event.
            // However, this cannot occur for Pan2_Value.
            tDirectAccess.setParameterProcessValue(mapping, Pan_ObjID, 4204, Pan2_Value)
        }
    }

    knob_Pan2_Value.mSurfaceValue.mOnProcessValueChange = function(context, value, diff) {
        if ((diff < 0) || (value == 0)) {
            var_Pan2_Value.setProcessValue(context, -(Math.random() + 1))
        } else {
            var_Pan2_Value.setProcessValue(context, Math.random() + 1)
        }
    }

    pageMain.makeValueBinding(var_Pan2_Value, hostvar_Pan2_Value).mOnValueChange
        = function(context, mapping, value) {
            set_Pan2_Value(mapping, value)
    }

    function midiBinding_knob_Pan2_Value(connect_with_knob) {
        var midi_channel

        if (connect_with_knob) {
            midi_channel = 0  // select regular midi channel 1 to connect
        } else {
            midi_channel = 1  // select unsuitable midi channel 2 to disconnect
        }
        knob_Pan2_Value.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
            .bindToControlChange(midi_channel, cKnobRotate).setTypeRelativeSignedBit()
    }

    var pageMain_mapping  // pageMain_mapping is set within pageMain.mOnActivate

    function toggle_listen() {  // available on all other mapping pages
        var ObjID = tDirectAccess.getBaseObjectID(pageMain_mapping)

        if (tDirectAccess.getParameterProcessValue(pageMain_mapping, ObjID, 4111)) {
            tDirectAccess.setParameterProcessValue(pageMain_mapping, ObjID, 4111, 0)
            listen_or_monitor_state_was_set_to_on = false
        } else {
            tDirectAccess.setParameterProcessValue(pageMain_mapping, ObjID, 4111, 1)
            listen_or_monitor_state_was_set_to_on = true
        }
    }

    function ActualTrack_is_InstrumentTrack() {  // available on all other mapping pages
        var ObjID = tDirectAccess.getBaseObjectID(pageMain_mapping)

        if (tDirectAccess.getObjectUniqueName(pageMain_mapping, ObjID)
        .substring(0, 5) == 'Synth') {  // same value 'Synth' for each instrument category
            return true
        } else {
            return false
        }
    }

    function ActualTrack_UniqueName() {  // available on all other mapping pages
        var ObjID = tDirectAccess.getBaseObjectID(pageMain_mapping)

        return tDirectAccess.getObjectUniqueName(pageMain_mapping, ObjID)
    }

    if (QT_check_turbo) {
        QT_step_delay_ms_when_check = QT_step_delay_ms_when_check_turbo
    }
}

function QT_ActualTrack() {
    // If QT_check_turbo is set to true and at least Cubase 13 is installed,
    // MIDI Remote DirectAccess is used to return the UniqueName at the set turbo speed,
    // otherwise the normal trackname is returned.
    if ((Cubase13_or_higher_installed) && (QT_check_turbo)) {
        return ActualTrack_UniqueName()
    } else {
        return ActualTrack
    }
}


// special code for implementing the knob_vis functionality on Custom Pages

// enable knob_vis by setting the midi channel to 1
// This instruction is mandatory, otherwise the assignments
// within the MIDI Remote Manager could be lost.
mSection.knob_vis.mSurfaceValue.mMidiBinding.setInputPort(midiIn)
    .bindToControlChange(0, cKnobRotate).setTypeRelativeSignedBit()


if (debug_2)
    console.log('229) MAIN Initialization finished')






//--------------------------------------------------------------------------------------------
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
