// Tascam US-224             
// "Control your Cubase DAW like a Portastudio"    
// v2.0.0
//
// By Paul Warner    (special thanks to Minas Chantzides!!)
//

//-----------------------------------------------------------------------------
// 0. CUSTOM SETTINGS - change these CONST values to suit your own needs
//-----------------------------------------------------------------------------

// tracking mode (simplified to mute/unmute tracks 1-4 with color rating system, metronome master fader+button, & cycle button)
const TRACKING_MODE = true

// if we just want to use the main controls & ignore faders.. set to true or false
const DISABLE_FADERS = true   

// if we want the normal jog wheel behavior to shuttle playhead instead of track select up/down
const SHUTTLE_MODE = false

// 50 banks * 4 = 200 total tracks.. increase if you need more tracks
const MAX_BANK_COUNT = 50 

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

// detect default MIDI port name for TASCAM USB device
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameContains('US-224 Control')
    .expectOutputNameContains('US-224 Control')    
    // .expectInputNameEquals('US-224 Control')
    // .expectOutputNameEquals('US-224 Control')    

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
const TASCAM_MIDI_BEGIN = [0xF0, 0x4E, 0x0, 0x12]
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
const MASTER_FADER_SCALE = 0.75                          // 0.75 sets the max range of the fader to 0dB

//-----------------------------------------------------------------------------
// STATE VARIABLES - custom control
//-----------------------------------------------------------------------------

// selected bank 
var selectedBank = 0

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

// null/metronome
var btnNull = deviceDriver.mSurface.makeButton(14.0, 2.0, 2.0, 1.0)

// jogwheel
var knobJogWheel = deviceDriver.mSurface.makeKnob(12.0, 4.0, 4.0, 4.0)

// master slot buttons
var btnSoloEnable = deviceDriver.mSurface.makeButton(17.0, 12.0, 2.0, 1.0)
var btnRecMaster = deviceDriver.mSurface.makeButton(17.0, 14.0, 2.0, 1.0)

// mute buttons
var btnMutes = []
btnMutes[0] = deviceDriver.mSurface.makeButton(0.0, 12.0, 2.0, 1.0)
btnMutes[1] = deviceDriver.mSurface.makeButton(2.0, 12.0, 2.0, 1.0)
btnMutes[2] = deviceDriver.mSurface.makeButton(4.0, 12.0, 2.0, 1.0)
btnMutes[3] = deviceDriver.mSurface.makeButton(6.0, 12.0, 2.0, 1.0)

// record enable buttons
var btnRecs = []
btnRecs[0] = deviceDriver.mSurface.makeButton(0.0, 14.0, 2.0, 1.0)
btnRecs[1] = deviceDriver.mSurface.makeButton(2.0, 14.0, 2.0, 1.0)
btnRecs[2] = deviceDriver.mSurface.makeButton(4.0, 14.0, 2.0, 1.0)
btnRecs[3] = deviceDriver.mSurface.makeButton(6.0, 14.0, 2.0, 1.0)

// select buttons (dummy buttons to hold select LED state)
var btnSelectsDummy = []
btnSelectsDummy[0] = deviceDriver.mSurface.makeButton(0.0, 18.0, 2.0, 1.0)
btnSelectsDummy[1] = deviceDriver.mSurface.makeButton(2.0, 18.0, 2.0, 1.0)
btnSelectsDummy[2] = deviceDriver.mSurface.makeButton(4.0, 18.0, 2.0, 1.0)
btnSelectsDummy[3] = deviceDriver.mSurface.makeButton(6.0, 18.0, 2.0, 1.0)

// channel faders
var fdrFaders = []
fdrFaders[0] = deviceDriver.mSurface.makeFader(0.0, 16.0, 2.0, 3.0)
fdrFaders[1] = deviceDriver.mSurface.makeFader(2.0, 16.0, 2.0, 3.0)
fdrFaders[2] = deviceDriver.mSurface.makeFader(4.0, 16.0, 2.0, 3.0)
fdrFaders[3] = deviceDriver.mSurface.makeFader(6.0, 16.0, 2.0, 3.0)

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
    bindButtonToMIDI(btnRecs[slot], 32 + slot)      // cc 32-35
    bindFaderToMIDI(fdrFaders[slot], 64 + slot)     // cc 64-71     
}

// master fader MIDI binding
bindFaderToMIDI(fdrMasterFader, 75)

//-----------------------------------------------------------------------------
// 2. FEEDBACK EVENTS - wire DAW events to buttons/lights
//-----------------------------------------------------------------------------

function sendMidiTascam(context, message) {
    midiOutput.sendMidi(context, TASCAM_MIDI_BEGIN.concat(message).concat([TASCAM_MIDI_END]))
}

function makeTransportDisplayFeedback(buttonSurfaceValue, commandID) {    
    buttonSurfaceValue.mOnProcessValueChange = function (context, newValue) {
        var ledState = newValue > 0 ? LED_STATES.On : LED_STATES.Off;
        sendMidiTascam(context, [TASCAM_TRANSPORT_LED, commandID, ledState])
    }
}

function forceFaderPositionsDump(context, channelStripNum) {
    // Forces US-428 to send current fader position messages to host 
    // DUMP_FADER_POS:  F0 4E<UNIT> 12 10<STRIP #> <STATE> F7 
    // Note: <STRIP #>is a number in the range [0..7], corresponding to the
    // channel-strip #, and <STATE>is either 0x00 (LED OFF) or 0x7F (LED ON)
    sendMidiTascam(context, [0x10, channelStripNum])
}

function displayMuteLED(context, channelSlot, bankNum, isEnabled) {
    // do not alter LED's for non-visible channels
    if (selectedBank != bankNum) return
    
    // update Mute LED
    sendMidiTascam(context, [TASCAM_MUTE_LED, channelSlot,
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displayRecLED(context, channelSlot, bankNum, isEnabled) {
    // do not alter LED's for non-visible channels
    if (selectedBank != bankNum) return

    // update Rec LED
    sendMidiTascam(context, [TASCAM_REC_LED, channelSlot, 
        (isEnabled ? LED_STATES.On : LED_STATES.Off)])
}

function displaySelectLED(context, channelSlot, bankNum, isEnabled) {    
    // do not alter LED's for non-visible channels
    if (selectedBank != bankNum) return

    // update Select LED
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

function displayNullLED(context) {    
    var isEnabled = var_nullModeOn.getProcessValue(context)

    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_NULL_LED, ledState])
}

function displayMetronomeNullLED(context, isEnabled) {    
    var ledState = isEnabled ? LED_STATES.On : LED_STATES.Off;
    sendMidiTascam(context, [TASCAM_NULL_LED, ledState])
}

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// create at least one mapping page
var page = deviceDriver.mMapping.makePage('Tascam US-224 Mixer Page')

// create host mixer zone for main channel section
var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels()
    .excludeSamplerChannels()
    .excludeVCAChannels() 
//  .includeAudioChannels()

// build array of TOTAL_TRACK_COUNT host mixer bank channel items for main channel section
var hostChannelBank = makeNewHostChannelBank()

// create host accessing objects
var hostTransportRewind = page.mHostAccess.mTransport.mValue.mRewind
var hostTransportFastForward = page.mHostAccess.mTransport.mValue.mForward
var hostTransportStop = page.mHostAccess.mTransport.mValue.mStop    // unused (instead using a transport command for STOP to avoid playhead jump-back)
var hostTransportStart = page.mHostAccess.mTransport.mValue.mStart
var hostTransportRecord = page.mHostAccess.mTransport.mValue.mRecord
var hostMetronomeActive = page.mHostAccess.mTransport.mValue.mMetronomeActive
var hostSelectPrevTrack = page.mHostAccess.mTrackSelection.mAction.mPrevTrack
var hostSelectNextTrack = page.mHostAccess.mTrackSelection.mAction.mNextTrack

// create custom vars on host for NULL mode switching
var var_nullModeOn = deviceDriver.mSurface.makeCustomValueVariable("Null Mode On")
var var_nullModeOff = deviceDriver.mSurface.makeCustomValueVariable("Null Mode Off")

// create custom vars on host for SOLO mode switching
var var_soloModeOn = deviceDriver.mSurface.makeCustomValueVariable("Solo Mode On")
var var_soloModeOff = deviceDriver.mSurface.makeCustomValueVariable("Solo Mode Off")

// create custom vars to intercept simultaneous button presses for STOP+REW = RTZ
var var_rewPressed = deviceDriver.mSurface.makeCustomValueVariable("REW Pressed")
var var_RTZPressed = deviceDriver.mSurface.makeCustomValueVariable("RTZ Pressed")

// dummy host vars to bind bank button triggers
var var_bankLeftPressed = page.mCustom.makeHostValueVariable("Bank Left Pressed")
var var_bankRightPressed = page.mCustom.makeHostValueVariable("Bank Right Pressed")

// create custom vars for jog shuttle left/right
var var_JogShuttleLeft = deviceDriver.mSurface.makeCustomValueVariable('Jog Shuttle Left')
var var_JogShuttleRight = deviceDriver.mSurface.makeCustomValueVariable('Jog Shuttle Right')
var lastShuttleValue = -1;

// custom custom vars for zooming
var var_zoomIn = deviceDriver.mSurface.makeCustomValueVariable('Zoom In')
var var_zoomOut = deviceDriver.mSurface.makeCustomValueVariable('Zoom Out')
var lastZoomValue = -1;

//-----------------------------------------------------------------------------
// 4. SUBPAGES - *note! the order created matters- first one is open by default
//-----------------------------------------------------------------------------

// create RecMaster button NULL mode subpage area
var area_RecMasterButtonSubPages = page.makeSubPageArea("RecMaster Button Subpage Area")

// create RecMaster NULL Modes Subpage
var subpage_RecMasterNormalMode = area_RecMasterButtonSubPages.makeSubPage('RecMaster Normal Mode') 
var subpage_RecMasterNullMode = area_RecMasterButtonSubPages.makeSubPage('RecMaster Null Mode')

// create locators buttons NULL mode subpage area
var area_LocatorButtonsSubPages = page.makeSubPageArea("Locator Buttons Subpage Area")

// create locators NULL Modes Subpage
var subpage_LocatorsNormalMode = area_LocatorButtonsSubPages.makeSubPage('Locator Buttons Normal Mode') 
var subpage_LocatorsNullMode = area_LocatorButtonsSubPages.makeSubPage('Locator Buttons Null Mode')

// create aux mode buttons subpage area
var area_NullButtonSubPages = page.makeSubPageArea("NULL Button Subpage Area")

// create Aux Assign Modes Subpage
var subpage_NullNormalMode = area_NullButtonSubPages.makeSubPage('NULL Normal Mode') 
var subpage_NullAssignMode = area_NullButtonSubPages.makeSubPage('NULL Assign Mode')

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
// 5. ASSIGN FUNCTIONS - create host bindings
//-----------------------------------------------------------------------------

function assignBankButtonControls() {
    // bind bank left button to prev bank selection    
    page.makeValueBinding(btnBankLeft.mSurfaceValue, var_bankLeftPressed).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isButtonPressed = newValue > 0              
            displayBankLeftLED(context, isButtonPressed)
            
            if (isButtonPressed && selectedBank > 0) {
                selectedBank--
                triggerBankSwitch(context, activeMapping, selectedBank)
            }
        }

    // bind bank right button to next bank selection
    page.makeValueBinding(btnBankRight.mSurfaceValue, var_bankRightPressed).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isButtonPressed = newValue > 0
            displayBankRightLED(context, isButtonPressed)

            if (isButtonPressed && selectedBank < MAX_BANK_COUNT) {
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

function assignBankButtonControlsTrackSelect() {
    // bind bank left button to host prev track selection
    page.makeActionBinding(btnBankLeft.mSurfaceValue, hostSelectPrevTrack).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isButtonPressed = newValue > 0              
            displayBankLeftLED(context, isButtonPressed)
        }

    // bind bank right button to host next track selection
    page.makeActionBinding(btnBankRight.mSurfaceValue, hostSelectNextTrack).mOnValueChange = 
        function (context, activeMapping, newValue, diff) {            
            var isButtonPressed = newValue > 0
            displayBankRightLED(context, isButtonPressed)
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

function assignChannelBanks() {
    // assign MAX_BANK_COUNT banks of BANK_SIZE faders
    for (var bankNum = 0; bankNum < MAX_BANK_COUNT; bankNum++) {
        assignSingleChannelBank(bankNum)
    }    
}

function assignSingleChannelBank(bankNum) {    
    assignFaderBank(bankNum)
    assignSelectedLEDBank(bankNum)
    assignRecEnableBank(bankNum)
    assignSelectEnableBank(bankNum)
    assignMuteBank(bankNum)
    assignSoloEnableBank(bankNum)
    assignSoloEnableButton(bankNum)
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

function assignMasterFader() {
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

function assignMetronomeButton()
{    
    // bind null button to host metronome enable
    page.makeValueBinding(btnNull.mSurfaceValue, hostMetronomeActive).setTypeToggle()
}

function assignMetronomeFader() {
    var clickLevel = page.mHostAccess.mTransport.mValue.mMetronomeClickLevel
    page.makeValueBinding(fdrMasterFader.mSurfaceValue, clickLevel)
}

// UNUSED - binds master fader to last clicked group channel
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

function assignNullVarsToModes() {
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

function assignNullButtonToVars() {
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
    page.makeValueBinding(btnPlay.mSurfaceValue, hostTransportStart).setTypeToggle()
    page.makeValueBinding(btnRecord.mSurfaceValue, hostTransportRecord).setTypeToggle()     
    page.makeValueBinding(btnFastForward.mSurfaceValue, hostTransportFastForward)    
    page.makeValueBinding(var_rewPressed, hostTransportRewind)
    page.makeCommandBinding(btnStop.mSurfaceValue, "Transport", "Stop")    // (use transport command, because mStop causes playhead to jump back)
    page.makeCommandBinding(var_RTZPressed, "Transport", "Return to Zero")    
    
    // catch STOP+REW buttons to send RTZ command, or pass single REW button command, thru custom variable
    btnRewind.mSurfaceValue.mOnProcessValueChange = 
        function(context, newValue, diff) {
            var stopPressed = btnStop.mSurfaceValue.getProcessValue(context)
            if (stopPressed) {
                var_RTZPressed.setProcessValue(context, 1.0)                            
            } else {                
                var_rewPressed.setProcessValue(context, newValue)            
            }
        }        
}

function assignLocatorControls() {    
    // bind locator buttons to host marker commands, in regular non-"NULL" mode
    page.makeCommandBinding(btnLocateLeft.mSurfaceValue, "Transport", "Locate Previous Marker").setSubPage(subpage_LocatorsNormalMode)
    page.makeCommandBinding(btnLocateRight.mSurfaceValue, "Transport", "Locate Next Marker").setSubPage(subpage_LocatorsNormalMode)
    page.makeCommandBinding(btnLocateSet.mSurfaceValue, "Transport", "Insert Marker").setSubPage(subpage_LocatorsNormalMode)

    // bind locator buttons to host cycle commands, in "NULL" mode
    page.makeCommandBinding(btnLocateLeft.mSurfaceValue, "Transport", "Set Left Locator").setSubPage(subpage_LocatorsNullMode)
    page.makeCommandBinding(btnLocateRight.mSurfaceValue, "Transport", "Set Right Locator").setSubPage(subpage_LocatorsNullMode)
    page.makeCommandBinding(btnLocateSet.mSurfaceValue, "Transport", "Cycle").setSubPage(subpage_LocatorsNullMode)
}

function assignRecMasterButton()
{
    // bind rec master button to metronome in "NULL" mode
    page.makeValueBinding(btnRecMaster.mSurfaceValue, hostMetronomeActive)
        .setTypeToggle()
        .setSubPage(subpage_RecMasterNullMode)

    // bind rec master button to enable/bypass mastering effect on main bus, in regular non-"NULL" mode
    page.makeCommandBinding(btnRecMaster.mSurfaceValue, "Mixer", "Bypass: Inserts on Main Mix")
        .setSubPage(subpage_RecMasterNormalMode)
}

function assignJogWheelDualMode() {    
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
                var newZoomValue = Math.floor(newValue * 1000);

                if(newZoomValue <= 0) {
                    var_zoomOut.setProcessValue(context, 1000)
                }
                if(newZoomValue > lastZoomValue || newZoomValue >= 1000) {
                    var_zoomIn.setProcessValue(context, 1)
                }
                if(newZoomValue < lastZoomValue) {
                    var_zoomOut.setProcessValue(context, 1)
                }
                lastZoomValue = newZoomValue;
            } else {
                // trigger jog wheel controls in normal shuttle mode
                var newShuttleValue = Math.floor(newValue * 1000);

                if(newShuttleValue <= 0) {
                    var_JogShuttleLeft.setProcessValue(context, 1000)
                }
                if(newShuttleValue < lastShuttleValue) {                    
                    var_JogShuttleLeft.setProcessValue(context, 1)
                }
                if(newShuttleValue > lastShuttleValue || newShuttleValue >= 1000) { 
                    var_JogShuttleRight.setProcessValue(context, 1)
                }
                lastShuttleValue = newShuttleValue; 
            }
        }              
}

function assignJogWheelZoomOnly() {
    // bind zoom commands
    page.makeCommandBinding(var_zoomIn,  'Zoom', 'Zoom In')
    page.makeCommandBinding(var_zoomOut, 'Zoom', 'Zoom Out')

    knobJogWheel.mSurfaceValue.mOnProcessValueChange =
        function(context, newValue, diff) {

            var newZoomValue = Math.floor(newValue * 1000)

            if (newZoomValue <= 0) {
                var_zoomOut.setProcessValue(context, 1000)
            }
            if (newZoomValue > lastZoomValue || newZoomValue >= 1000) {
                var_zoomIn.setProcessValue(context, 1)
            }
            if (newZoomValue < lastZoomValue) {
                var_zoomOut.setProcessValue(context, 1)
            }

            lastZoomValue = newZoomValue
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

// wire up bindings from surface controls to host events
assignTransportControls()
assignRecMasterButton()
assignLocatorControls()

if (TRACKING_MODE) {
	// bind master fader to click level
    assignMetronomeFader()

	// bind null LED to metronome button
	makeNullDisplayMetronomeFeedback(btnNull)

	// bind null button to metronome
	assignMetronomeButton()

	// bind Jog wheel to dedicated zoom control
	assignJogWheelZoomOnly() 
	
	// bind bank buttons to track select
	assignBankButtonControlsTrackSelect()	
	assignSingleChannelBank(0)  
	
} else {                                        // NORMAL MODE
	// bind master fader in normal mode
    assignMasterFader()

	// bind null button and LED's to mode switches
	assignNullButtonToVars()
	assignNullVarsToModes()	
	
	// bind Jog Wheel to dual shuttle and zoom mode depending on SHUTTLE_MODE
	assignJogWheelDualMode()	
	
	// bind bank buttons to bank select (in groups of BANK_SIZE)
	assignBankButtonControls()
	assignChannelBanks()	
}

// this happens when the TASCAM device is first connected
deviceDriver.mOnActivate = function(context) {        
    // reset LED's to begin    
    displaySoloLED(context)
    displayBankLeftLED(context, false)
    displayBankRightLED(context, false)    
    
    // init variables for NULL & SOLO mode switching states, should trigger things to light up with Cubase
    initCustomHostVars(context)   
}
