# FaderPort v2 hardware boilerplate

Use `boilerplate/PreSonus_FaderPortBasic.js`. The original Christian & Werner script is preserved as `PreSonus_FaderPort.js` for reference.

## Included

- Original surface coordinates, control sizes, shapes and five control layers.
- 24 panel buttons, encoder rotation and push, footswitch, motor fader and touch input.
- Original `PreSonus FP2` input/output port detection.
- Channel-1 pitch-bend fader input/output through configurable hardware protection helpers; relative signed-bit CC 16 encoder input.
- LED off/on/flash and RGB helpers; direct normalized motor-position helper.
- One **Hardware** mapping page with Korg-style transport assignments.

Selected-track navigation/volume, transport, Undo/Redo and Click are assigned to Cubase; the other controls remain available for future assignments. SHIFT toggles a software layer; its LED stays on while that layer is enabled. RGB colors are initialized to white. Transport LEDs follow host state. No startup or shutdown fader movement is requested.

## Transport

| Control | Action |
|---|---|
| Play / Record / Cycle | Toggle Cubase playback, recording or cycle |
| Rewind / Fast Forward | Active while held |
| Stop | Stop immediately using the Transport Stop command |
| Hold Stop for 1.5 seconds | Save once; blink REW, FF, PLAY and REC five times |
| Hold Stop, then press Rewind | Return to Zero; cancel the pending hold-to-save |

These follow `Korg_nanoKontrol2Remote.js`, including its actual 1500 ms save threshold. `ENABLE_STOP_HOLD_SAVE` disables hold-to-save without affecting Stop or Return to Zero. SHIFT does not change transport assignments. STOP may still return to the last start position when already stopped, depending on Cubase behavior, as noted in the Korg script.

LED feedback follows Cubase transport state independently of physical button presses. During save blinking, Stop and Cycle continue to update; the four animated LEDs return to current host state afterward. A blink confirms the Save command was sent, not that disk persistence was verified.

## Selected track

- With SHIFT off, Prev/Next select the previous/next Cubase track.
- The fader controls the selected track's volume. Host changes and track selection feed its motor through the existing touch-protection and calibration helpers.
- SHIFT does not change the fader assignment. Shifted Prev/Next retain Undo/Redo.
- Encoder rotation uses the knob modes below. Encoder push toggles the high-pass filter only in Channel mode.

## Knob modes

Pan is selected when the Hardware page activates. The fader continues to control selected-track volume in every knob mode.

| Button path | Knob assignment |
|---|---|
| Pan | Selected-track pan |
| Scroll or SHIFT + Scroll (Zoom) | Horizontal zoom using the Korg position-comparison pattern |
| Master | First output channel volume, matching the Korg Stereo Out bank approach |
| Click | Metronome level; pressing Click also toggles the metronome |
| Channel | Selected-track high-pass cutoff; knob push toggles the filter |

Master controls an output channel, not Control Room. With multiple output buses, put the intended Stereo Out first in the output bank. The API binding does not identify a bus by its name or Main Mix designation.

Pan, Scroll, Master and Channel LEDs identify their active modes. Click's LED continues to show metronome on/off, so Click mode with metronome off has no illuminated mode button; Cubase's Knob Mode subpage shows Click. SHIFT + Pan (Flip), SHIFT + Master (F1) and SHIFT + Click (F2) keep their separate, unassigned paths. SHIFT + Scroll selects the same Zoom mode as Scroll. Changing SHIFT alone does not change the current knob mode.

Zoom pulses commands for repeated movement and seeds its comparison value on mode entry to avoid an immediate zoom jump. Like the Korg pattern, reaching the normalized range endpoint may require reversing the knob before further travel is available; verify the relative encoder behavior in Cubase.

Channel mode uses Cubase’s Pre section Low Cut (high-pass) frequency and on/off controls. Selecting Channel does not enable the filter automatically; press the knob to toggle it. Cutoff adjustment leaves the current enable state and slope intact. The Channel LED is off outside High Pass mode, green when that mode is active with the filter disabled, and a cutoff-dependent color when enabled. SHIFT + Channel remains the unassigned ChannelLock path. Knob push has no assigned action in other modes.

Link, Section, Marker and Quick Controls are left for later.

## Basic editing and metronome

- With SHIFT enabled, Prev triggers Undo and Next triggers Redo, following the printed labels.
- With SHIFT off, Click selects the knob’s Click mode and toggles the metronome. The Click LED follows Cubase's metronome state, including changes made with the mouse, and remains a metronome indicator while SHIFT is on.
- With SHIFT enabled, Click reaches the unassigned F2 path and does not toggle the metronome.
- Cycle already toggles loop mode and follows Cubase's cycle state with its LED. Both Click and Cycle feedback remain live during Save confirmation blinking.

## Printed SHIFT functions

Press SHIFT once to enable the secondary paths and again to return to normal. This is the script's chosen behavior; hardware MIDI behavior still needs a live check. The `buttonMappings` table names every printed pair:

| Normal | SHIFT path |
|---|---|
| Solo / Mute / Arm | SoloClear / MuteClear / ArmAll |
| Bypass / Touch / Write / Read | BypassAll / Latch / Trim / Off |
| Prev / Next | Undo / Redo |
| Link / Pan / Channel / Scroll | LinkLock / Flip / ChannelLock / Zoom |
| Master / Click / Section / Marker | F1 / F2 / F3 / F4 |

Assign future actions to `buttons.F1`, `buttons.Flip`, `buttons.Master`, etc. These are logical surface values that receive press/release events. Prev, Next, Undo, Redo and Click have Cubase assignments; Pan, Scroll, Zoom, Master and Channel select knob modes. The other named paths remain unassigned. The two printed Lock labels use separate names. The visible physical controls retain their original layout and primary labels.

Button release follows whichever path received the press, even if SHIFT changes while the button is held. Activation/deactivation clears the layer and held paths. Transport, encoder, fader and footswitch retain their direct paths. The printed RTZ transport chord is not implemented by this SHIFT layer.

The original custom modes, QuickTracks, EQ, sends, meters and footswitch gestures are omitted. Selected hardware refinements are available through the settings below.

## Hardware settings

These are top-level `const` settings; edit and reload the script.

| Setting | Default | Purpose |
|---|---|---|
| ENABLE_FADER_TOUCH_INPUT | true | Accept raw fader input only while touched |
| ENABLE_FADER_TOUCH_PROTECTION | true | Defer motor commands until touch release |
| ENABLE_MIDI_OUTPUT_CACHE | true | Suppress identical LED states/colors and 14-bit motor targets |
| ENABLE_FADER_LOW_END_SNAP | false | Snap physical positions below FADER_LOW_END_THRESHOLD (0.012) to zero |
| ENABLE_FADER_UNITY_CALIBRATION | false | Align the printed U mark with host unity using reversible scaling |
| ENABLE_FOOTSWITCH_NORMALIZATION | true | Provide a consistent logical pedal input |
| FOOTSWITCH_NORMALLY_CLOSED | true | Invert momentary pedal polarity; false selects normally open |
| FOOTSWITCH_IS_TOGGLE | false | Pulse the logical pedal on each toggle edge instead of forwarding press/release |

Motor protection remembers the latest deferred target. A newer manual movement clears an older deferred target. Output caches reset on activation/deactivation and manual fader movement invalidates the motor cache. Incoming fader movement does not immediately echo back to the motor.

Calibration uses two straight segments that preserve both travel endpoints. Set FADER_HOST_UNITY to match Cubase's volume range (the original script uses 0.789087 for +6 dB and 0.748222 for +12 dB). Set FADER_HARDWARE_UNITY to the measured normalized raw input at your unit's printed U mark. Its default equals the host setting and makes no correction. Calibration and bottom snap are intended for volume mappings; leave them off for arbitrary parameters. The fader is assigned to selected-track volume.

Use `var_footswitchPressed` for future pedal assignments. Toggle mode uses the first received message as a baseline, so that message produces no action; if the hardware supplies no initial state, the first physical switch change establishes it. Disabling normalization forwards raw 0/1 values. No pedal action is assigned yet.

## Loading in Cubase

Place the new script in the Cubase MIDI Remote user-script tree under `PreSonus/FaderPortBasic/PreSonus_FaderPortBasic.js`, then reload scripts. Its device name is **FaderPortBasic**. Assign the `PreSonus FP2` ports if automatic detection does not match the names on your machine. Disable the original script or other remote devices using those ports before testing this version.

Retain the hardware DAW mode used with the original script. Neither source sends a DAW-mode initialization handshake; this extraction does not establish which power-on mode your unit currently uses.

## Extending

The bottom of the script contains inactive examples for F1 and button LED feedback. Use `buttons` for the routed functions; do not replace the physical button callbacks, which perform the routing. Main handles:

- `fader.mSurfaceValue`, `faderTouch`
- `uSection.btn_Solo`, `uSection.btn_Mute`, etc.
- `mSection.knob_vis.mSurfaceValue`, `mSection.knob_Press`
- `tpSection.btn_Play`, `tpSection.btn_Stop`, etc.
- `var_footswitchPressed` (normalized input); `fsSection.btn_Footswitch` is the raw physical control

From callbacks, pass the active device context to `onLED`, `offLED`, `flashingLED`, `setRGBLED` or `setMotorFader`. RGB components use 0..127; motor positions use 0..1. The motor helper takes raw physical travel and applies touch protection and output caching. Future host mappings use `fader.mSurfaceValue`; its feedback callback applies optional scaling/snap and sends through that same motor helper. Touch binding is guarded for older API versions.

LED helpers control physical LEDs independently of the drawn buttons. Transport host feedback is already assigned; add feedback for other controls when implementing their assignments. Footswitch normalization is configured with the hardware settings above.

## Validation

JavaScript syntax and script construction against the repository's MIDI Remote API stub were checked. Output helper messages and motor touch suppression were checked with a captured MIDI output. Actual port detection, surface rendering, encoder direction, footswitch polarity and motor feedback still need a Cubase/hardware check.

Run `node faderport/boilerplate/routing.test.js` from the repository root to check all printed pairs, SHIFT toggling, held-button release across layer changes, device isolation and LED feedback.

Run `node faderport/boilerplate/transport.test.js` to check transport bindings, STOP/REW handling, repeated RTZ, save timing/cancellation and LED animation/restoration against the API stub. Cubase command execution and physical feedback still require live testing.

Run `node faderport/boilerplate/hardware.test.js` to check touch protection, deferred motor commands, cache reset, calibration round trips, low-end snap, pedal normalization and disabled options. Live hardware validation remains necessary.

Run `node faderport/boilerplate/knob.test.js` to check mode binding targets, selectors, mode LEDs, repeated zoom pulses and mode-entry baselines. Live encoder behavior and first-output selection still need Cubase verification.

### High-pass color feedback

With High Pass mode selected, disabled is green. Enabled uses a smoothly blended gradient with logarithmic frequency spacing:

| Cutoff | Color |
|---|---|
| 20 Hz and below | Red |
| 80 Hz | Orange |
| 150 Hz | Pink |
| 300 Hz | Magenta |
| 1 kHz and above | Violet |

Most landmarks are below 300 Hz. These indicate cutoff frequency, not measured attenuation or slope. The named `highPassColors` entries can be tuned after checking the actual LEDs. Set `ENABLE_HIGH_PASS_COLOR_GRADIENT = false` for solid red whenever enabled. The state and frequency follow the selected track and mouse edits even outside this mode; the LED lights only while this mode is selected. Cubase's displayed Hz/kHz is used rather than assuming a normalized frequency curve. Missing/unrecognized display text falls back to red. Actual color appearance and host display callbacks need live verification.

### RGB brightness

`setRGBLED(context, note, r, g, b, brightness)` takes an explicit brightness argument. Current calls pass `FULL_BRIGHTNESS` (1); pass `HALF_BRIGHTNESS` (0.5) to halve component levels for an individual call. Perceived brightness is not necessarily linear. Values are clamped to 0..1 before MIDI conversion.

This applies to Touch, Write, Read, Link, Pan, Channel and Scroll. The [PreSonus manual, sections 8.2.4 and LED tables](https://pae-web.presonusmusic.com/downloads/products/pdf/FaderPort_OwnersManual_V2_EN_051023.pdf) distinguishes these RGB buttons from the fixed-color transport LEDs and documents only off/on/flashing for the latter. A 50%-idle/full-on transport brightness effect is therefore not implemented; transport LEDs continue to show host state.
