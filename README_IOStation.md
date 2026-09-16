# PreSonus IOStation MIDI Remote

`PreSonus_IOStation.js` maps the IOStation's FaderPort 2 control surface to Cubase MIDI Remote. The IOStation combines that surface with a separate ASIO audio interface in the same chassis; this script handles only the MIDI control surface. Its control behavior matches the FaderPort 2, but the IOStation exposes ports named `ioStation 24c MIDI In` and `ioStation 24c MIDI Out`, which the script detects. The original Christian & Werner script is preserved in `example_code/PreSonus_FaderPort_Werner.js` for reference.

## Included

- Original surface coordinates, control sizes, shapes and five control layers.
- 24 panel buttons, encoder rotation and push, footswitch, motor fader and touch input.
- `ioStation 24c MIDI In` / `ioStation 24c MIDI Out` input/output port detection.
- Channel-1 pitch-bend fader input/output through configurable hardware protection helpers; relative signed-bit CC 16 encoder input.
- LED off/on/flash and RGB helpers; direct normalized motor-position helper.
- One **Hardware** mapping page with Korg-style transport assignments.

Selected-track navigation, volume, Solo, Mute and Record Enable are assigned to Cubase, along with transport, Undo/Redo, Click and the knob modes. SHIFT toggles a software layer; its LED stays on while that layer is enabled. Solo, Mute and Arm LEDs follow the selected track. RGB colors are initialized to white. The Click LED indicates Click mode. Inactive Link, Pan, Channel and Scroll LEDs show metronome status in solid blue, pulsing red while recording. Other transport LEDs follow host state. No startup or shutdown fader movement is requested.

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

- With SHIFT off, Prev/Next select the previous/next Cubase track in the other knob modes. Marker mode assigns them to previous/next marker; Section assigns them to previous/next cycle-marker recall; Master assigns them to Set Left Locator / Set Right Locator.
- With SHIFT off, Write/Read toggle the selected track's automation Write/Read enable. WRITE lights red and READ lights green while enabled; both follow track selection and Cubase edits in every mode. SHIFT + Write (Trim) and SHIFT + Read (Off) remain unassigned, as do SHIFT + BYPASS (BypassAll) and TOUCH. With SHIFT off, BYPASS mirrors encoder push in Link/Pan (selected-track send 1 on/off), Channel (high-pass on/off), and Master (`Mixer > Bypass: Inserts on Main Mix`). It is unassigned in other modes.
- With SHIFT off, Solo/Mute/Arm toggle Solo, Mute and Record Enable for the selected track. Their LEDs follow the selected track's state, including changes made in Cubase.
- Pan, Link and Channel assign the fader to selected-track volume. Scroll, Section and Marker retain the previous fader assignment. In Master and Click modes it controls the first Stereo Out channel using the same FaderPort unity and motor calibration path as the track faders. The Master encoder controls the first FX Return channel. Host changes and track selection feed the fader motor through the existing touch-protection and calibration helpers.
- SHIFT does not change the fader assignment. Shifted Prev/Next retain Undo/Redo. PREV/NEXT LEDs stay on while their physical buttons are held and turn off on release, in every mode and SHIFT layer.
- Encoder rotation uses the knob modes below. Encoder push toggles the first send in Link and Pan modes, Cubase's metronome in Click mode, the high-pass filter in Channel mode, toggles Main Mix insert bypass in Master mode, and inserts a marker in Marker mode.

## Knob modes

Pan is selected when the Hardware page activates. Pan, Link and Channel assign selected-track volume; Master and Click assign Stereo Out. Scroll (including SHIFT + Scroll), Section and Marker keep whichever fader target was previously active. All use the same motor and calibration helpers.

| Button path | Knob assignment |
|---|---|
| Link | Selected-track send 1 level; encoder push or BYPASS toggles send on/off; fader controls selected-track volume |
| Pan | Selected-track pan; encoder push or BYPASS toggles send 1 on/off |
| Scroll or SHIFT + Scroll (Zoom) | Horizontal zoom using the Korg position-comparison pattern; knob push zooms to locators; fader retains its previous target |
| Master | Encoder controls FX Return 1; fader controls Stereo Out; encoder push or BYPASS toggles Main Mix inserts; Prev/Next set left/right locators |
| Click | Metronome level; fader controls Stereo Out; encoder push toggles the metronome |
| Channel | Selected-track high-pass cutoff; knob push or BYPASS toggles the filter |
| Section | Prev/Next recall cycle markers with wrapping; fader retains its previous target; knob rotation and push unassigned |
| Marker | Fader retains its previous target; Prev/Next locate markers; encoder push inserts a marker |

Master fader controls an output channel, not Control Room. With multiple output buses, put the intended Stereo Out first in the output bank. The API binding does not identify a bus by its name or Main Mix designation. The encoder uses the first FX channel, so the intended FX Return 1 must be first in the FX bank. The fader uses the same FaderPort unity calibration as track faders. Encoder rotation remains full-range.

In Master mode, the BYPASS LED follows `mBypass` for insert slot 1 (`accessSlotAtIndex(0)`) through the `Stereo Out Insert 1` viewer on that first output channel. It lights when that slot is **not bypassed**. This reports slot 1's state, while the button command targets all Main Mix inserts. In Link and Pan, the LED follows selected-track send 1's `mOn`; in Channel, it follows the high-pass filter's `mLowCutOn`. Across these modes, **LED on means enabled; off means bypassed/disabled**. Feedback follows Cubase edits, track selection, and mode changes; the LED is off in other modes. SHIFT does not change this LED feedback. Link/Pan toggle the send to the FX destination, not the FX return channel or its inserts.

The active Link, Pan or Scroll mode is white; active Channel uses the high-pass colors below. The other buttons in this four-button group light solid `METRONOME_PULSE_COLOR` (blue by default) when the metronome is enabled, pulse red while recording regardless of metronome state, and turn off when neither recording nor the metronome is active. In Master, Click, Section or Marker mode, all four show metronome status. Master, Click, Section and Marker LEDs indicate only their respective active modes.

The recording-only red brightness pulse uses the Tascam script's tempo callback and idle-timer pattern: `60000 / BPM`, with a 120 BPM fallback and a 150 ms minimum interval. A smooth brightness cycle runs once per beat, from 15% to full brightness. It follows tempo rate, not the transport's beat position, and returns to solid blue (metronome enabled) or off (metronome disabled) when recording stops. Set `METRONOME_PULSE_COLOR` to choose the normal metronome color. Set `ENABLE_METRONOME_PULSE = false` for steady red during recording; adjust `METRONOME_PULSE_MIN_BRIGHTNESS` to change the pulse floor. Hardware smoothness depends on Cubase's idle callback cadence.

SHIFT + Pan (Flip), SHIFT + Master (F1) and SHIFT + Click (F2) keep their separate, unassigned paths. SHIFT + Scroll selects Zoom. Changing SHIFT alone does not change the current mode.

In Scroll/Zoom mode, knob push runs `Zoom > Zoom to Locators`, once per press. Zoom pulses commands for repeated movement and seeds its comparison value on mode entry to avoid an immediate zoom jump. Like the Korg pattern, reaching the normalized range endpoint may require reversing the knob before further travel is available; verify the relative encoder behavior in Cubase.

Channel mode uses Cubase’s Pre section Low Cut (high-pass) frequency and on/off controls. Selecting Channel does not enable the filter automatically; press the knob to toggle it. Cutoff adjustment leaves the current enable state and slope intact. The Channel LED shows metronome status outside High Pass mode, white when that mode is active with the filter disabled, and a cutoff-dependent color when enabled. SHIFT + Channel remains the unassigned ChannelLock path. In Master mode, encoder push runs Cubase's `Mixer > Bypass: Inserts on Main Mix` command. Marker mode uses Prev/Next to locate the previous/next marker and encoder push to insert one; encoder rotation is unused in that mode. Cubase 12 and 13+ use different command categories for marker insertion, which the script selects based on API feature availability. Knob push has no assigned action in Section mode.

Link controls send slot 1 (`mSends.getByIndex(0)`) on the selected track. Assign the intended FX destination to that slot in Cubase. Turning the knob changes its level without changing its enabled state; pressing the knob toggles its current on/off state. Pan mode also toggles this same send with knob push, while rotation adjusts pan. The fader and Prev/Next behave as in Pan mode. SHIFT + Link remains the unassigned LinkLock path. Section uses Prev/Next to recall cycle markers, whether Cycle is on or off. It uses the Korg command-pulse and wrap pattern with `CYCLE_MARKER_MAX = 7`. The per-device counter starts at 1, so the first Next recalls 2 and the first Prev wraps to 7. The counter persists across mode changes; it does not track recalls made elsewhere in Cubase or skip missing markers. Set the maximum to match your numbered cycle markers. Section retains the current fader target; its knob rotation and push remain unassigned. SHIFT + Section remains the unassigned F3 path. Quick Controls are left for later.

## Basic editing and metronome

- With SHIFT enabled, Prev triggers Undo and Next triggers Redo, following the printed labels.
- With SHIFT off, Click selects the knob’s Click mode; encoder push toggles Cubase's metronome. Knob rotation adjusts metronome click level.
- With SHIFT off, Marker selects Marker mode; Prev/Next locate the previous/next marker, and encoder push inserts a marker.
- Metronome feedback follows Cubase state, including mouse changes, on the inactive Link/Pan/Channel/Scroll LEDs. Click lights only while Click mode is active.
- With SHIFT enabled, Click reaches the unassigned F2 path; it does not select Click mode or toggle the metronome.
- Cycle toggles loop mode and follows Cubase's cycle state with its LED. Cycle feedback remains live during Save confirmation blinking.

## Printed SHIFT functions

Press SHIFT once to enable the secondary paths and again to return to normal. This is the script's chosen behavior; hardware MIDI behavior still needs a live check. The `buttonMappings` table names every printed pair:

| Normal | SHIFT path |
|---|---|
| Solo / Mute / Arm | SoloClear / MuteClear / ArmAll |
| Bypass / Touch / Write / Read | BypassAll / Latch / Trim / Off |
| Prev / Next | Undo / Redo |
| Link / Pan / Channel / Scroll | LinkLock / Flip / ChannelLock / Zoom |
| Master / Click / Section / Marker | F1 / F2 / F3 / F4 |

Assign future actions to `buttons.F1`, `buttons.Flip`, etc. These are logical surface values that receive press/release events. Solo, Mute, Arm, Write, Read, Prev, Next, Undo and Redo have Cubase assignments; Link, Pan, Scroll, Zoom, Master, Click, Channel, Section and Marker select knob modes. Encoder push toggles the first send in Link and Pan modes, the metronome in Click mode, toggles the filter in Channel mode, toggles Main Mix insert bypass in Master mode, and inserts a marker in Marker mode. SHIFT + Solo runs `Edit > Deactivate All Solo`; SHIFT + Mute runs `Edit > Unmute All`. SHIFT + Arm alternates `Mixer > Arm All Audio Tracks` and `Mixer > Disarm All Audio Tracks`, following Werner�s selected-track arm feedback: an armed selected track sets the next action to Disarm All, and an unarmed one sets it to Arm All. This targets audio tracks and does not inspect the arm state of every track. Other named paths remain unassigned. The two printed Lock labels use separate names. The visible physical controls retain their original layout and primary labels.

Button release follows whichever path received the press, even if SHIFT changes while the button is held. Activation/deactivation clears the layer and held paths. Transport, encoder, fader and footswitch retain their direct paths. The printed RTZ transport chord is not implemented by this SHIFT layer.

The original custom modes, QuickTracks, EQ, broader send controls, meters and footswitch gestures are omitted. Selected hardware refinements are available through the settings below.

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

Calibration uses two straight segments that preserve both travel endpoints. Set FADER_HOST_UNITY to match Cubase's volume range (the original script uses 0.789087 for +6 dB and 0.748222 for +12 dB). Set FADER_HARDWARE_UNITY to the measured normalized raw input at your unit's printed U mark. Its default equals the host setting and makes no correction. Calibration and bottom snap are intended for volume mappings; leave them off for arbitrary parameters. Pan, Link and Channel assign selected-track volume; Master and Click assign Stereo Out; Scroll, Section and Marker retain the preceding target.

Use `var_footswitchPressed` for future pedal assignments. Toggle mode uses the first received message as a baseline, so that message produces no action; if the hardware supplies no initial state, the first physical switch change establishes it. Disabling normalization forwards raw 0/1 values. No pedal action is assigned yet.

## Loading in Cubase

Place the script in the Cubase MIDI Remote user-script tree under `PreSonus/IOStation/PreSonus_IOStation.js`, then reload scripts. Its device name is **IOStation**. The script detects input `ioStation 24c MIDI In` and output `ioStation 24c MIDI Out`. Disable the original script or other remote devices using those ports before testing this version.

Retain the hardware DAW mode used with the original script. Neither source sends a DAW-mode initialization handshake; this extraction does not establish which power-on mode your unit currently uses.

## Extending

The bottom of the script contains an inactive F1 example. Use `buttons` for routed functions; do not replace the physical button callbacks, which perform the routing. Main handles:

- `fader.mSurfaceValue`, `faderTouch`
- `uSection.btn_Solo`, `uSection.btn_Mute`, etc.
- `mSection.knob_vis.mSurfaceValue`, `mSection.knob_Press`
- `tpSection.btn_Play`, `tpSection.btn_Stop`, etc.
- `var_footswitchPressed` (normalized input); `fsSection.btn_Footswitch` is the raw physical control

From callbacks, pass the active device context to `onLED`, `offLED`, `flashingLED`, `setRGBLED`, `setRGBLED_color` or `setMotorFader`. RGB components use 0..127; motor positions use 0..1. The motor helper takes raw physical travel and applies touch protection and output caching. Future host mappings use `fader.mSurfaceValue`; its feedback callback applies optional scaling/snap and sends through that same motor helper. Touch binding is guarded for older API versions.

LED helpers control physical LEDs independently of the drawn buttons. Transport, selected-track Solo/Mute/Arm/Write/Read, and high-pass feedback are already assigned. Footswitch normalization is configured with the hardware settings above.

## Validation

Run `node --check PreSonus_IOStation.js` from the repository root for a JavaScript syntax check. The test scripts are in `tests_iostation/` and use `api/midiremote_api_v1`; that API stub is not included in this workspace, so the behavioral tests need it available locally.

- `node tests_iostation/routing.test.js` checks printed-button routing, SHIFT toggling, held-button release across layer changes, device isolation and LED feedback.
- `node tests_iostation/transport.test.js` checks transport bindings, STOP/REW handling, repeated RTZ, save timing/cancellation and LED animation/restoration.
- `node tests_iostation/hardware.test.js` checks touch protection, deferred motor commands, cache reset, calibration round trips, low-end snap, pedal normalization and optional RGB brightness defaults.
- `node tests_iostation/knob.test.js` checks knob and fader mode targets, Master fader binding, insert-bypass push, selectors, mode LEDs, marker controls, repeated zoom pulses and mode-entry baselines.

Actual port detection, Cubase command execution, surface rendering, encoder direction, footswitch polarity and motor feedback still need a Cubase/hardware check.

### High-pass color feedback

With High Pass mode selected, disabled is white. When enabled, the color blends from red to magenta with logarithmic frequency spacing, then stays magenta at and above 300 Hz:

| Cutoff | Color |
|---|---|
| 20 Hz and below | Red |
| 20–300 Hz | Red-to-magenta blend |
| 300 Hz and above | Magenta |

These colors indicate cutoff frequency, not measured attenuation or slope. The `highPassColors` endpoints can be tuned after checking the actual LEDs. Set `ENABLE_HIGH_PASS_COLOR_GRADIENT = false` for solid red whenever enabled. The state and frequency follow the selected track and mouse edits even outside this mode; the cutoff color appears only while this mode is selected; otherwise Channel shows metronome status. Cubase's displayed Hz/kHz is used rather than assuming a normalized frequency curve. Missing/unrecognized display text falls back to red. Actual color appearance and host display callbacks need live verification.

### RGB brightness

`setRGBLED(context, note, r, g, b, brightness)` defaults brightness to `FULL_BRIGHTNESS` (1), so ordinary calls can omit it. Pass `HALF_BRIGHTNESS` (0.5) to halve component levels for an individual call. `setRGBLED_color(context, note, color, brightness)` accepts an RGB array such as `GREEN`; omitted brightness is forwarded as `undefined` and defaults to full in `setRGBLED`. This uses an ES5-compatible body check because [Steinberg's MIDI Remote user-script repository specifies ES5 JavaScript](https://github.com/steinbergmedia/midiremote-userscripts#about). Perceived brightness is not necessarily linear. Values are clamped to 0..1 before MIDI conversion.

This applies to Touch, Write, Read, Link, Pan, Channel and Scroll. The [PreSonus manual, sections 8.2.4 and LED tables](https://pae-web.presonusmusic.com/downloads/products/pdf/FaderPort_OwnersManual_V2_EN_051023.pdf) distinguishes these RGB buttons from the fixed-color transport LEDs and documents only off/on/flashing for the latter. A 50%-idle/full-on transport brightness effect is therefore not implemented; transport LEDs continue to show host state.

PREV/NEXT presses are routed directly to separate track, marker, cycle-recall, or locator-setting inputs according to the active mode. SECTION never sends a track-navigation action; SHIFT still routes to Undo/Redo.
