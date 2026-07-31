# Cubase MIDI Remote scripting: a friendly quick-start

New to Steinberg's MIDI Remote API? Start here.

This primer gets you from an empty file to a tiny working controller script. It deliberately teaches only the essentials. Once your first controls work, continue with the [complete, code-backed guide](Cubase-MIDI-Remote-Scripting-Guide.md) for banking, subpages, long presses, custom routing, LED animation, SysEx, and larger-project structure.

## The whole idea in one minute

A MIDI Remote script connects three things:

```text
Your controller  ->  a control drawn in Cubase  ->  a Cubase function
     MIDI                  surface element               host target
```

For example:

```text
Fader sends CC 7  ->  surface fader  ->  selected-track volume
Button sends CC 41 -> surface button ->  transport Play
```

That is the basic pattern behind even the largest scripts in this repository:

1. Create a **driver** and identify its MIDI ports.
2. Create **surface elements** such as buttons, knobs, and faders.
3. Tell each element which MIDI message it receives.
4. Create a **mapping page** and connect each element to Cubase.

You do not need banking, subpages, timers, or custom variables for your first script.

## Before you write code

Gather these four facts about your controller:

| What you need | Example | How to find it |
| --- | --- | --- |
| MIDI input port name | `My Controller MIDI IN` | Cubase's MIDI port list or a MIDI monitor |
| MIDI output port name | `My Controller MIDI OUT` | Cubase's MIDI port list; not needed for an input-only device |
| Message type | Control Change (CC) or Note | Move/press the control while watching a MIDI monitor |
| Channel and number | Channel 1, CC 7 | Read the monitor's message details |

Also note what happens when a button is released. A normal momentary button usually sends a positive value when pressed and `0` when released.

> **Important:** MIDI channels in the API are zero-based. Hardware "MIDI channel 1" is written as `0`, channel 2 as `1`, and so on.

## Your first complete script

This example maps one fader to the selected track's volume and one button to Play. It assumes both controls send CC messages on hardware MIDI channel 1.

Copy it into a new `.js` file, then change the clearly marked values to match your controller.

```javascript
// Load Steinberg's MIDI Remote API.
var api = require('midiremote_api_v1')

// CHANGE THESE: the names shown in Cubase and your own author name.
var driver = api.makeDeviceDriver(
    'My Manufacturer',
    'My Controller',
    'Your Name'
)

// Create the ports used by this driver.
var midiInput = driver.mPorts.makeMidiInput()
var midiOutput = driver.mPorts.makeMidiOutput()

// CHANGE THESE: use a distinctive part of the real port names.
driver.makeDetectionUnit()
    .detectPortPair(midiInput, midiOutput)
    .expectInputNameContains('My Controller')
    .expectOutputNameContains('My Controller')

// Draw two controls in Cubase's MIDI Remote surface editor.
// The numbers are only x, y, width, and height on the screen.
var surface = driver.mSurface
var volumeFader = surface.makeFader(0, 0, 1.5, 6).setTypeVertical()
var playButton = surface.makeButton(2, 0, 2, 1)

// CHANGE THESE if necessary:
// 0 = hardware MIDI channel 1, 7 and 41 = the CC numbers.
volumeFader.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange(0, 7)

playButton.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange(0, 41)

// Create a page containing the Cubase assignments.
var page = driver.mMapping.makePage('Main')

// Connect the fader to the currently selected track's volume.
var selectedTrack = page.mHostAccess.mTrackSelection.mMixerChannel
page.makeValueBinding(
    volumeFader.mSurfaceValue,
    selectedTrack.mValue.mVolume
).setValueTakeOverModeScaled()

// Connect the button to Play.
page.makeValueBinding(
    playButton.mSurfaceValue,
    page.mHostAccess.mTransport.mValue.mStart
).setTypeToggle()
```

The five things most people need to change are:

1. Manufacturer, controller, and author names.
2. Input port text.
3. Output port text.
4. MIDI channel (`0` means hardware channel 1).
5. CC numbers (`7` and `41` in the example).

If the controller truly has no MIDI output, omit `midiOutput` and use single-input detection instead:

```javascript
driver.makeDetectionUnit()
    .detectSingleInput(midiInput)
    .expectInputNameContains('My Controller')
```

You will not be able to send LED or display feedback without an output port.

If your button sends a MIDI note instead of a CC, replace its final binding line:

```javascript
.bindToControlChange(0, 41)
```

with:

```javascript
.bindToNote(0, 41)
```

Here `41` is the note number, not a CC number.

## Install and load it

Cubase creates its MIDI Remote script folders after you open the MIDI Remote area at least once. Put your file in this layout:

```text
<Driver Scripts>/Local/<manufacturer>/<controller>/<manufacturer>_<controller>.js
```

Typical locations are:

```text
Windows:
C:\Users\<Username>\Documents\Steinberg\<Cubase or Nuendo>\MIDI Remote\Driver Scripts

macOS:
/Users/<Username>/Documents/Steinberg/<Cubase or Nuendo>/MIDI Remote/Driver Scripts
```

Then:

1. Connect and power on the controller.
2. Open Cubase's MIDI Remote area.
3. Reload the MIDI Remote scripts, or restart Cubase for the first test.
4. Look for your manufacturer and controller names.
5. Select a track, move the fader, and press Play.

Keep Cubase's MIDI Remote Script Console visible while developing. A syntax error or misspelled API property will normally appear there.

## What each part means

### Driver

```javascript
var driver = api.makeDeviceDriver('Vendor', 'Device', 'Author')
```

This is the top-level object. It owns the ports, surface, detection rules, and mapping pages for one controller model.

### Surface element

```javascript
var button = driver.mSurface.makeButton(0, 0, 2, 1)
```

This draws a control in Cubase. Its coordinates affect only the on-screen layout; they do not choose a MIDI message or Cubase function.

### MIDI binding

```javascript
button.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange(0, 41)
```

This tells Cubase which hardware message operates the surface button.

### Host binding

```javascript
page.makeValueBinding(button.mSurfaceValue, someCubaseValue)
```

This gives the surface button a job inside Cubase.

Think of it as two separate wires:

```text
hardware --MIDI binding--> surface control --host binding--> Cubase
```

When something fails, test those two wires separately.

Inside the API, surface and host values are usually normalized from `0.0` to `1.0`. Raw MIDI output still uses byte values such as `0` to `127`.

## The three kinds of Cubase assignment

You will use these constantly:

| Binding | Use it for | Example |
| --- | --- | --- |
| Value binding | A Cubase value that has state | Volume, Pan, Mute, Record, Play |
| Command binding | A named Cubase Key Command | Save, Undo, Insert Marker |
| Action binding | A typed action exposed directly by the API | Select next track, activate a subpage |

### Value: toggle selected-track Mute

```javascript
page.makeValueBinding(
    button.mSurfaceValue,
    page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMute
).setTypeToggle()
```

### Command: Save

```javascript
page.makeCommandBinding(button.mSurfaceValue, 'File', 'Save')
```

Command category and name strings must match Cubase's Key Commands. If a command does nothing, verify the spelling and availability in the Cubase version you are testing.

### Action: select the next track

```javascript
page.makeActionBinding(
    button.mSurfaceValue,
    page.mHostAccess.mTrackSelection.mAction.mNextTrack
)
```

## A few useful starter mappings

Assume `button`, `knob`, `fader`, and `page` already exist.

```javascript
var selected = page.mHostAccess.mTrackSelection.mMixerChannel

// Continuous values
page.makeValueBinding(fader.mSurfaceValue, selected.mValue.mVolume)
page.makeValueBinding(knob.mSurfaceValue, selected.mValue.mPan)

// On/off values
page.makeValueBinding(button.mSurfaceValue, selected.mValue.mSolo)
    .setTypeToggle()

// Transport
page.makeValueBinding(
    button.mSurfaceValue,
    page.mHostAccess.mTransport.mValue.mRecord
).setTypeToggle()

// Named Cubase command
page.makeCommandBinding(button.mSurfaceValue, 'Edit', 'Undo')
```

Give every physical control its own surface element. The repeated name `button` above is shorthand for separate examples, not something to paste five times unchanged.

## Optional: light an ordinary CC LED

Get input working before adding feedback. If the device accepts the same CC for its LED, a basic callback looks like this:

```javascript
playButton.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
    var ledValue = value > 0 ? 127 : 0
    midiOutput.sendMidi(activeDevice, [0xB0, 41, ledValue])
}
```

`0xB0` means Control Change on hardware MIDI channel 1, and `41` is the example's CC number. This will not work unchanged for every device. Some controllers use different CCs, notes, special operating modes, or manufacturer-specific SysEx for LEDs. The Tascam scripts in this repository are examples of custom SysEx feedback.

## When it does not work

Debug one layer at a time:

| Symptom | First thing to check |
| --- | --- |
| Controller is not detected | Exact input/output port names and whether another detection rule is needed |
| It appears, but a control never moves on screen | Message type, zero-based MIDI channel, and CC/note number |
| The on-screen control moves, but Cubase does nothing | Host binding and Script Console errors |
| Button fires twice, sticks, or behaves strangely | Whether the hardware sends both press and release values |
| Knob jumps or moves the wrong way | Whether it is relative rather than absolute, and which relative encoding it uses |
| Cubase moves correctly, but the LED is wrong | Treat feedback as a separate output problem |
| Nothing loads after an edit | JavaScript syntax, file location, and the Script Console |

Before loading, you can catch ordinary JavaScript syntax errors with:

```text
node --check your_script.js
```

That check cannot verify Cubase API names, host objects, or Key Command strings; only Cubase can do that.

## Beginner rules that prevent hours of confusion

- Make one control work end to end before generating eight channel strips.
- Verify incoming MIDI with a monitor; do not guess CC or note numbers.
- Remember that API MIDI channel `0` means hardware channel 1.
- Keep hardware input, Cubase behavior, and LED output as three separate tests.
- Use `var` and classic `function (...) { ... }` syntax for the safest API compatibility.
- Give each callback such as `mOnProcessValueChange` one owner; assigning it again replaces the earlier function.
- Do not begin with subpages or timers. Add them only after the basic mapping is stable.
- Reload often and keep a tiny Cubase test project handy.

## Where to go next

Once this starter script works, the [complete Cubase MIDI Remote scripting guide](Cubase-MIDI-Remote-Scripting-Guide.md) is the next step. Good entry points are:

- [Maintainable script structure](Cubase-MIDI-Remote-Scripting-Guide.md#3-a-maintainable-script-structure)
- [Surface elements and MIDI bindings](Cubase-MIDI-Remote-Scripting-Guide.md#6-surface-elements-and-midi-bindings)
- [The three host binding types](Cubase-MIDI-Remote-Scripting-Guide.md#7-host-access-and-the-three-binding-types)
- [Mixer channels and banking](Cubase-MIDI-Remote-Scripting-Guide.md#8-mixer-channels-selected-track-access-and-banking)
- [Subpages](Cubase-MIDI-Remote-Scripting-Guide.md#9-subpages-as-independent-state-machines)
- [Timers and long presses](Cubase-MIDI-Remote-Scripting-Guide.md#12-timers-long-presses-delayed-actions-and-animation)
- [LED and hardware feedback](Cubase-MIDI-Remote-Scripting-Guide.md#13-led-and-hardware-feedback)
- [Debugging playbook](Cubase-MIDI-Remote-Scripting-Guide.md#16-debugging-playbook)

The three repository scripts then serve as progressively richer examples:

1. [Korg nanoKONTROL2](../Korg_nanoKontrol2Remote.js) for a compact, mostly single-page controller.
2. [Tascam US-224](../Tascam_US-224.js) for adaptation, button chords, and timed behavior.
3. [Tascam US-428](../Tascam_US-428.js) for coordinated subpages, fixed banks, and complex hardware feedback.

For authoritative API names and signatures, use Steinberg's [generated MIDI Remote API reference](https://steinbergmedia.github.io/midiremote_api_doc/codedoc_api_reference/) or the bundled [`midiremote_api_v1.d.ts`](../api/midiremote_api_v1.d.ts).
