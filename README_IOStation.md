# PreSonus IOStation MIDI Remote

`PreSonus_IOStation.js` maps the IOStation's FaderPort 2 control surface to Cubase MIDI Remote. The IOStation combines that surface with a separate ASIO audio interface in the same chassis; this script handles only the MIDI control surface. Its control behavior matches the FaderPort 2, but the IOStation exposes ports named `ioStation 24c MIDI In` and `ioStation 24c MIDI Out`, which the script detects. The original Christian & Werner script is preserved in `example_code/PreSonus_FaderPort_Werner.js` for reference.

## Included

- Original surface coordinates, control sizes, shapes and five control layers.
- 24 panel buttons, encoder rotation and push, footswitch, motor fader and touch input.
- `ioStation 24c MIDI In` / `ioStation 24c MIDI Out` input/output port detection.
- Channel-1 pitch-bend fader input/output through configurable hardware protection helpers; relative signed-bit CC 16 encoder input.
- LED off/on/flash and RGB helpers; direct normalized motor-position helper.
- One **Hardware** mapping page with Korg-style transport assignments.

Selected-track navigation, volume, Solo, Mute and Record Enable are assigned to Cubase, along with transport, Undo/Redo, Click and the knob modes. SHIFT toggles a software layer; its LED stays on while that layer is enabled. Solo, Mute and Arm LEDs follow the selected track. RGB colors are initialized to white. The Click LED flashes in Click mode regardless of metronome state; in every other mode it is steadily on when the metronome is enabled and off when disabled. The Master LED is on in Master and SHIFT + Master modes, and off in every other mode. Inactive Link, Pan, Channel and Scroll LEDs pulse red while recording. Their optional solid-blue metronome indication is disabled by default. Other transport LEDs follow host state. Startup selects unlocked LINK in knob mode, with SHIFT off and the fader dormant. Press TOUCH over a parameter to capture it, or explicitly select another mode to use its fader assignment. No startup or shutdown fader movement is requested.

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

- With SHIFT off, Prev/Next select the previous/next Cubase track in the other knob modes. Marker mode assigns them to previous/next marker; Section assigns them to previous/next cycle-marker recall; Scroll sets the left/right locators. Either Master mode nudges Stereo Out when `ENABLE_FADER_NUDGE` is enabled (the default), or sets the left/right locators when disabled.
- With SHIFT off, Write/Read toggle the selected track's automation Write/Read enable. WRITE lights red and READ lights green while enabled; both follow track selection and Cubase edits in every mode. SHIFT + Write (Trim) and SHIFT + Read (Off) remain unassigned. SHIFT + TOUCH (Latch) remains unassigned except in LINK, Send, and both Channel modes, where TOUCH keeps its mode-specific action. SHIFT + BYPASS (BypassAll) is unassigned outside modes that explicitly keep BYPASS active. With either SHIFT state, BYPASS toggles the shared remembered fader bypass in Pan, Scroll/Zoom, Section and Marker, selected-track Send 1 enable in Send mode (Pan knob push separately centers pan), and the metronome in Click mode. In normal Master, BYPASS toggles Main Mix insert bypass; in SHIFT + Master, it toggles FX Return 1 mute. In both Channel modes, BYPASS toggles phase/polarity and its LED indicates inversion; only knob push toggles high-pass on/off. Scroll, Section and Marker share PAN's fader-bypass flag; their knob-press actions stay unchanged. Only Click mode uses BYPASS for the metronome.
- With SHIFT off, Solo/Mute/Arm toggle Solo, Mute and Record Enable for the selected track. Their LEDs follow the selected track's state, including changes made in Cubase.
- Pan assigns the fader to selected-track volume. Both Channel layers assign the fader to selected-track Pre-section gain. Send assigns it to selected-track Send 1 level. Scroll, Section and Marker always select the selected-track volume fader. In Click mode it controls metronome level when `ENABLE_METRONOME_FADER = true` (the default); set it to `false` for Stereo Out. Master assigns the fader to Stereo Out; SHIFT + Master assigns it to the first FX Return channel. Both volume targets use the FaderPort unity and motor calibration path. Host changes feed the fader motor through the existing touch-protection and calibration helpers.
- SHIFT does not change the fader assignment. Shifted Prev/Next retain Undo/Redo. PREV/NEXT LEDs stay on while their physical buttons are held and turn off on release, in every mode and SHIFT layer.
- Encoder rotation uses the knob modes below. In Click and either Master mode it controls horizontal zoom. Encoder push centers pan in Pan mode, toggles Send 1 pre/post-fader in SHIFT + Pan mode, zooms to locators in Click and either Master mode, toggles high-pass in Channel mode, and inserts a marker in Marker mode.

Outside LINK modes, TOUCH resets the current fader target: selected-track or Stereo Out volume goes to 0 dB using `FADER_HOST_UNITY`; metronome level goes to maximum. In both Channel modes, TOUCH resets selected-track Pre-section gain to 0 dB (process value 0.5), regardless of SHIFT. TOUCH lights red at maximum, amber at minimum, and white at 0 dB (`FADER_HOST_UNITY`) for channel/output volume; otherwise it is off. Detection allows one 14-bit MIDI step of tolerance. Metronome maximum is red, including after a TOUCH reset; it has no white 0 dB indication. It follows host edits and track changes. Scroll, Section and Marker use selected-track volume, so TOUCH resets that track to 0 dB. SHIFT + TOUCH remains unassigned in other modes outside LINK and Send. In both LINK modes, TOUCH captures the mouse parameter and shows green at the saved value, magenta above it, or red-leaning magenta below it. Motor movement follows the existing touch protection.

## Fader nudging

`ENABLE_FADER_NUDGE = true` assigns PREV/NEXT in either Master mode to lower/raise Stereo Out. `FADER_NUDGE_DB_INCREMENT = 0.5` sets the volume step in dB. Scroll always assigns PREV/NEXT to Set Left/Right Locator; its fader controls selected-track volume. SHIFT + PREV/NEXT still perform Undo/Redo. Section and Marker navigation stays unchanged.

Set `ENABLE_FADER_NUDGE = false` to restore Master's Set Left/Right Locator actions. Scroll keeps those locator actions with either flag setting. Volume nudging reads Cubase's current displayed dB value and requests that value plus/minus `FADER_NUDGE_DB_INCREMENT` through Direct Access, with no lookup grid. Cubase handles its volume limits and display precision. At -infinity or an unavailable value, nudging does nothing; use TOUCH or the fader to restore a finite level. Direct Access must be supported by the Cubase version. If unavailable, volume nudging does nothing rather than substitute an approximate step. Host feedback continues to drive the motor and TOUCH LED.

## Knob modes

Press the active mode's button again to return to the previous mode. For example, Pan -> Click -> Click returns to Pan; pressing Pan again returns to Click. Selecting PAN, CHANNEL or MASTER enters its normal mode even when SHIFT is latched. Press SHIFT while one of those pairs is active to switch between Pan/Send 1, High Pass/Pre Gain, or Stereo Out/FX Return 1. LINK keeps its remembered knob/fader selection. History stores both the previous mode and its SHIFT bit, then restores both when you return by pressing the active mode button again. Before the first mode change, Pan stays active. History resets when the mapping activates. Restored modes use their prior fader behavior; Scroll, Section and Marker select track volume.

Pan is selected when the Hardware page activates. Pan assigns selected-track volume; both Channel layers assign Pre-section gain; Send assigns Send 1 level; Master assigns Stereo Out; SHIFT + Master assigns FX Return 1; Click assigns metronome level (Stereo Out when `ENABLE_METRONOME_FADER = false`). Scroll (including SHIFT + Scroll), Section and Marker always select track volume. Volume targets use the same motor and calibration helpers. Both Channel layers use pre-gain with an uncalibrated full-range fader and physical center at 0 dB.

| Button path | Knob assignment |
|---|---|
| Link | Mouse parameter on knob; push restores captured starting value; BYPASS disables/enables parameter controls; fader is dormant |
| SHIFT + Link | Mouse parameter on fader; knob rotation disabled; knob push restores captured starting value; TOUCH captures and locks the parameter; BYPASS disables/enables parameter controls |
| SHIFT + Pan | Fader controls Send 1; TOUCH resets send to 0 dB; knob controls track volume; knob push toggles pre/post; BYPASS toggles send on/off |
| Pan | Selected-track pan; encoder push centers pan; fader controls track volume; BYPASS toggles remembered fader bypass |
| Scroll or SHIFT + Scroll (Zoom) | Horizontal zoom using the Korg position-comparison pattern; knob push zooms to locators; fader controls selected-track volume with shared PAN bypass; Prev/Next set left/right locators |
| Master | Encoder controls horizontal zoom; push zooms to locators; fader controls Stereo Out; BYPASS toggles Main Mix inserts; Prev/Next nudge Stereo Out (set left/right locators when nudging is disabled) |
| SHIFT + Master | Encoder controls horizontal zoom; push zooms to locators; fader controls FX Return 1; BYPASS toggles FX Return mute; its LED lights when muted; Prev/Next retain Master navigation |
| Click | Knob controls horizontal zoom; push zooms to locators; fader controls metronome level (`ENABLE_METRONOME_FADER = true`); BYPASS toggles the metronome |
| SHIFT + Channel | Fader: Pre gain; TOUCH: 0 dB; knob: low-cut slope; push: 12 dB/oct; BYPASS: phase/polarity |
| Channel | Fader: Pre gain; TOUCH: 0 dB; knob: selected-track high-pass cutoff; knob push toggles the filter; BYPASS toggles phase/polarity in either Channel mode |
| Section | Prev/Next recall cycle markers with wrapping; fader controls selected-track volume with shared PAN bypass; knob rotates horizontal zoom; knob push zooms to locators |
| Marker | Fader controls selected-track volume with shared PAN bypass; Prev/Next locate markers; knob rotates horizontal zoom; encoder push inserts a marker |

Master mode fader controls an output channel, not Control Room. With multiple output buses, put the intended Stereo Out first in the output bank. The API binding does not identify a bus by its name or Main Mix designation. SHIFT + Master uses the first FX channel for its fader, so the intended FX Return 1 must be first in the FX bank. Both fader assignments use the same FaderPort unity calibration as track faders. Both Master modes use encoder rotation for horizontal zoom.

In normal Master, the BYPASS LED follows `mBypass` for insert slot 1 (`accessSlotAtIndex(0)`) through the `Stereo Out Insert 1` viewer on the first output channel. It lights when that slot is **not bypassed**. This reports slot 1's state, while the button command targets all Main Mix inserts. In SHIFT + Master, the BYPASS LED follows the first FX channel's `mMute` and lights when FX Return 1 is muted. In Send, the LED lights when selected-track send 1 is disabled (`mOn` = 0); in Pan, Scroll/Zoom, Section and Marker it lights when the shared track-fader bypass is active; in either Channel mode, it follows phase/polarity and lights when polarity is inverted; in Click, it follows the metronome's `mMetronomeActive`. In Send, Pan, Scroll/Zoom, Section and Marker, **BYPASS LED on means bypassed**. In Click, LED on means enabled. In normal Master, it means Main Mix inserts are active; in SHIFT + Master, it means FX Return 1 is muted. Feedback follows Cubase edits, track selection, and mode changes; the LED is off in other modes. Send BYPASS toggles the send to the FX destination, not the FX return channel or its inserts.

The Master mode LED is on while Master or SHIFT + Master is selected and off in all other modes. It is independent of the Main Mix insert state. The normal Master BYPASS command still targets all Main Mix inserts, and SHIFT + Master BYPASS toggles FX Return mute through its separate route.

With `ENABLE_PAN_COLOR = true` (default), active Pan is white at exact center. Moving off center starts at 50% blue (left) or magenta (right), then a square-root curve increases the blend to full color at either edge. Set it to `false` for solid white. Color follows selected-track pan changes in Cubase. The active Send mode shows an amber PAN LED for post-fader or cyan for pre-fader, dim when disabled and bright when enabled; Scroll is white; active Channel uses the two-state colors described below. The other buttons in this four-button group pulse red while recording when `ENABLE_NUCLEAR_RECORD_BLINK = true` (the default), regardless of metronome state. Set `ENABLE_NUCLEAR_METRONOME_LEDS = true` to also show solid `METRONOME_PULSE_COLOR` (blue by default) when the metronome is enabled; this option defaults to `false`. Recording indication takes priority. Otherwise, inactive buttons are off. In Master, Click, Section or Marker mode, these options apply to all four buttons. Neither flag changes the BYPASS LED or the transport RECORD LED. Master, Section and Marker LEDs indicate their active modes. Click flashes for its active mode and otherwise displays the global metronome state.

The recording-only red brightness pulse uses the Tascam script's tempo callback and idle-timer pattern: `60000 / BPM`, with a 120 BPM fallback and a 150 ms minimum interval. A smooth brightness cycle runs once per beat, from 15% to full brightness. It follows tempo rate, not the transport's beat position, and returns to solid blue only if the metronome and `ENABLE_NUCLEAR_METRONOME_LEDS` are both enabled; otherwise it turns off when recording stops. Set `METRONOME_PULSE_COLOR` to choose the normal metronome color. Set `ENABLE_NUCLEAR_RECORD_BLINK = false` to disable the recording indication on this group entirely. With that flag enabled, set `ENABLE_METRONOME_PULSE = false` for steady red during recording; adjust `METRONOME_PULSE_MIN_BRIGHTNESS` to change the pulse floor. Hardware smoothness depends on Cubase's idle callback cadence.

Selecting a mode with SHIFT already latched enters its normal function, apart from LINK's remembered knob/fader choice. Pressing SHIFT while PAN, CHANNEL or MASTER is active switches immediately to the corresponding alternate function; other modes stay selected. Returning to a previous mode with a repeated active-mode press restores the saved SHIFT bit along with the mode. Both Master modes use encoder rotation for zoom and push to zoom to locators.

In Scroll/Zoom, Section, Click, and both Master modes, knob push runs `Zoom > Zoom to Locators`, once per press. Scroll/Zoom, Section, Marker, Click, and both Master modes share horizontal zoom rotation. BYPASS remains the metronome toggle in Click mode. Zoom pulses commands for repeated movement and seeds its comparison value on mode entry to avoid an immediate zoom jump. Like the Korg pattern, reaching the normalized range endpoint may require reversing the knob before further travel is available; verify the relative encoder behavior in Cubase.

Channel mode uses Cubase’s Pre section Low Cut (high-pass) frequency and on/off controls. Selecting Channel does not enable the filter automatically; knob push is the only control that toggles it. BYPASS toggles phase/polarity in both Channel modes, and its LED lights when polarity is inverted. Cutoff adjustment leaves the current enable state and slope intact. In High Pass mode, the Channel LED is white when the filter is off and red when it is on. SHIFT + Channel also shows white when high-pass is off and red when on; TOUCH resets gain to 0 dB; the knob steps low-cut slope and knob push resets slope to 12 dB/oct. In normal Master, BYPASS toggles Main Mix insert bypass; in SHIFT + Master, BYPASS toggles FX Return 1 mute. Marker mode uses Prev/Next to locate the previous/next marker and encoder push to insert one; encoder rotation controls horizontal zoom. Cubase 12 and 13+ use different command categories for marker insertion, which the script selects based on API feature availability.

SHIFT + Pan controls send slot 1 (`mSends.getByIndex(0)`) on the selected track. Assign the intended FX destination to that slot in Cubase. The fader adjusts its level; TOUCH resets it to 0 dB using `FADER_HOST_UNITY`, with the usual white unity, amber minimum and red maximum TOUCH feedback. The knob adjusts selected-track volume, and knob press toggles Send 1 pre/post-fader through `mPrePost` without changing level or enable. Pan mode adjusts pan with rotation and centers it with knob push. BYPASS still toggles send 1. Prev/Next retain their existing navigation behavior. Section uses Prev/Next to recall cycle markers, whether Cycle is on or off. It uses the Korg command-pulse and wrap pattern with `CYCLE_MARKER_MAX = 7`. The per-device counter starts at 1, so the first Next recalls 2 and the first Prev wraps to 7. The counter persists across mode changes; it does not track recalls made elsewhere in Cubase or skip missing markers. Set the maximum to match your numbered cycle markers. Section uses selected-track volume on the fader; knob rotation controls horizontal zoom and knob push zooms to locators. Quick Controls are left for later.

## Basic editing and metronome

- With SHIFT enabled, Prev triggers Undo and Next triggers Redo, following the printed labels.
- With either SHIFT state, Click selects its mode; knob rotation controls horizontal zoom and encoder push zooms to locators. BYPASS toggles Cubase's metronome. The fader controls metronome click level when `ENABLE_METRONOME_FADER = true`.
- With either SHIFT state, Marker selects Marker mode; Prev/Next locate the previous/next marker, and encoder push inserts a marker.
- Metronome feedback follows Cubase state, including mouse changes, on the CLICK-mode BYPASS LED and the global CLICK LED and, when enabled by `ENABLE_NUCLEAR_METRONOME_LEDS`, the inactive Pan/Send/Channel/Scroll LEDs. Click flashes while Click mode is active; outside it, the LED steadily follows metronome on/off.
- SHIFT + Click selects or toggles Click mode, just like Click alone.
- Cycle toggles loop mode and follows Cubase's cycle state with its LED. Cycle feedback remains live during Save confirmation blinking.

## Printed SHIFT functions

Press SHIFT once to enable the secondary layer and again to return to normal. In PAN, CHANNEL and MASTER, SHIFT switches the active mode to its paired function. Selecting a different mode while SHIFT is latched enters that mode normally; LINK keeps its remembered knob/fader choice. The `buttonMappings` table lists each printed pair:

| Normal | SHIFT path |
|---|---|
| Solo / Mute / Arm | SoloClear / MuteClear / ArmAll |
| Bypass / Touch / Write / Read | BypassAll / Latch / Trim / Off |
| Prev / Next | Undo / Redo |
| Link / Pan / Channel / Scroll | Mouse Fader / Send 1 / Pre Gain / Zoom |
| Master | FX Return 1 fader with zoom knob; push zooms to locators; BYPASS toggles FX Return mute and lights when muted |
| Click / Section / Marker | Same modes as without SHIFT |

Assign future commands to unused non-mode paths such as `buttons.Trim`. These are logical surface values that receive press/release events. Solo, Mute, Arm, Write, Read, Prev, Next, Undo and Redo have Cubase assignments; Link, Pan, Scroll, Zoom, Master, MasterFX, Click, Channel, Section and Marker select knob modes. Encoder push centers pan in Pan mode, resets the first send to 0 dB in SHIFT + Pan mode, zooms to locators in Click and both Master modes, toggles high-pass in Channel mode, and inserts a marker in Marker mode. Click BYPASS toggles the metronome. Normal Master BYPASS toggles Main Mix insert bypass; SHIFT + Master BYPASS toggles FX Return 1 mute. SHIFT + Solo runs `Edit > Deactivate All Solo`; SHIFT + Mute runs `Edit > Unmute All`. SHIFT + Arm alternates `Mixer > Arm All Audio Tracks` and `Mixer > Disarm All Audio Tracks`, following Werner�s selected-track arm feedback: an armed selected track sets the next action to Disarm All, and an unarmed one sets it to Arm All. This targets audio tracks and does not inspect the arm state of every track. Other named paths remain unassigned. The printed Lock, Flip and F1-F4 labels do not have separate actions. The visible physical controls retain their original layout and primary labels.

Button release follows whichever path received the press, even if SHIFT changes while the button is held. Activation/deactivation clears the layer and held paths. Transport, encoder, fader and footswitch retain their direct paths. The printed RTZ transport chord is not implemented by this SHIFT layer.

The original custom modes, QuickTracks, EQ, broader send controls, meters and footswitch gestures are omitted. Selected hardware refinements are available through the settings below.

With `ENABLE_METRONOME_FADER = true`, leaving Click for Scroll, Section, or Marker retains the metronome fader assignment, following the existing keep-previous-target behavior.

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

Calibration uses two straight segments that preserve both travel endpoints. Set FADER_HOST_UNITY to match Cubase's volume range (the original script uses 0.789087 for +6 dB and 0.748222 for +12 dB). Set FADER_HARDWARE_UNITY to the measured normalized raw input at your unit's printed U mark. Its default equals the host setting and makes no correction. Calibration and bottom snap are intended for volume mappings; leave them off for arbitrary parameters. Pan assigns selected-track volume; both Channel layers assign Pre-section gain; Send assigns Send 1 level; Master assigns Stereo Out; Click assigns metronome level (Stereo Out when `ENABLE_METRONOME_FADER = false`); Scroll, Section and Marker select track volume.

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
- `node tests_iostation/knob.test.js` checks knob and fader mode targets, Click and SHIFT + Master zoom routing, FX Return 1 fader binding, zoom push in both Master modes, selectors, mode LEDs, marker controls, repeated zoom pulses and mode-entry baselines.
- `node tests_iostation/master-mode.test.js` checks separate Master and SHIFT + Master BYPASS actions, Master mode LED state independent of inserts, and FX Return mute feedback.
- `node tests_iostation/click-zoom.test.js` checks that Click knob turns and push route to zoom, while BYPASS remains the metronome toggle and the fader retains click level.

Actual port detection, Cubase command execution, surface rendering, encoder direction, footswitch polarity and motor feedback still need a Cubase/hardware check.

### Channel mode LED feedback

The active Channel LED uses two simple states per mode. In both Channel layers, white means the high-pass filter is off and red means it is on. Pre-gain feedback is on TOUCH. Host edits and selected-track changes update the LED. The Channel LED follows the nuclear LED flags while neither Channel mode is active.

### RGB brightness

`setRGBLED(context, note, r, g, b, brightness)` defaults brightness to `FULL_BRIGHTNESS` (1), so ordinary calls can omit it. Pass `HALF_BRIGHTNESS` (0.5) to halve component levels for an individual call. `setRGBLED_color(context, note, color, brightness)` accepts an RGB array such as `GREEN`; omitted brightness is forwarded as `undefined` and defaults to full in `setRGBLED`. This uses an ES5-compatible body check because [Steinberg's MIDI Remote user-script repository specifies ES5 JavaScript](https://github.com/steinbergmedia/midiremote-userscripts#about). Perceived brightness is not necessarily linear. Values are clamped to 0..1 before MIDI conversion.

This applies to Touch, Write, Read, Link, Pan, Channel and Scroll. The [PreSonus manual, sections 8.2.4 and LED tables](https://pae-web.presonusmusic.com/downloads/products/pdf/FaderPort_OwnersManual_V2_EN_051023.pdf) distinguishes these RGB buttons from the fixed-color transport LEDs and documents only off/on/flashing for the latter. A 50%-idle/full-on transport brightness effect is therefore not implemented; transport LEDs continue to show host state.

PREV/NEXT presses are routed directly to separate track, marker, cycle-recall, or locator-setting inputs according to the active mode. SECTION never sends a track-navigation action; SHIFT still routes to Undo/Redo.

### STOP hold progress

Holding STOP waits 500 ms, then lights FORWARD, REWIND, PLAY and REC cumulatively at 250 ms intervals. At 1.5 seconds it saves once and runs the existing five confirmation blinks. Releasing early or using STOP + REW cancels the progress and restores current transport feedback. STOP and CYCLE LEDs remain live throughout. `STOP_SAVE_PREDELAY_MS` controls the initial delay; `STOP_SAVE_HOLD_MS` controls the total hold time.

PLAY uses the working `hostTransport.mStart` value binding. Its LED follows Cubase playback state through separate feedback.

## Channel: pre-gain fader, cutoff and slope

Both Channel layers put selected-track Pre-section gain (`mPreFilter.mGain`) on the fader, preserving the full -infinity to +48 dB range. Process values 0, 0.5 and 1 map directly to bottom, physical center (0 dB) and top. Volume unity calibration and low-end snapping do not apply to either Channel layer. Navigation follows the existing SHIFT layer. Channel is white when high-pass is off and red when on in both layers, independent of gain. TOUCH resets pre-gain to 0 dB; host feedback drives the motor and TOUCH LED (white at zero, amber at minimum, red at maximum, off otherwise). Without SHIFT, the knob adjusts high-pass frequency and push toggles the filter. With SHIFT, the knob steps `mPreFilter.mLowCutSlope` through 6, 12, 24, 36 and 48 dB/oct; push resets to 12 dB/oct. Rotation calls the native slope `increment`/`decrement` methods. Push reads the current slope from host display feedback and sends the enum steps needed to reach 12; no display-value writes or guessed normalized constants are used. Display feedback records the host process values. Neither action recenters either encoder value; the next detent after reset selects 6 or 24. BYPASS toggles phase/polarity in Pre Gain mode as well as normal Channel mode, with its LED on when inverted. Host edits and track selection update both LEDs. While either Channel mode is active, pressing CHANNEL toggles High Pass ↔ Pre Gain, and pressing SHIFT switches immediately to the matching mode. SHIFT is off for High Pass and on for Pre Gain, including when restored through another button’s mode history. Channel uses this two-mode toggle instead of previous-mode recall. Other modes retain their existing SHIFT behavior.

## Mouse Parameter Link modes

LINK assigns Cubase's supported mouse parameter to the knob and leaves the fader dormant, with no track-volume binding, fader input, touch automation or motor movement. Within LINK, SHIFT switches that same parameter to the fader and disables knob rotation. LINK remembers its own knob/fader selection: pressing LINK from another mode recalls that selection, independently of the other mode's SHIFT state (knob control by default). Leaving LINK for PAN, CHANNEL or another mode selects that mode's normal function, without carrying LINK's SHIFT state over. Pressing SHIFT while either LINK mode is active switches immediately between them, preserving the locked target and its captured starting value. LINK is white while unlocked and amber while locked, in either mode; SHIFT lights in fader mode. Entry from another mode is always unlocked/white.

While inside either LINK mode, pressing the physical LINK button when amber clears the lock and saved starting value, turns LINK white and TOUCH off, and keeps the current knob/fader mode. It leaves the parameter at its current value. Pressing LINK while white switches knob/fader mode and updates SHIFT, also cancelling any pending capture. Neither action resets the bypass switch. The SHIFT button alone switches knob/fader mode without clearing the lock or saved value. Select another mode button to exit LINK.

Entering LINK starts unlocked, with parameter controls inactive and TOUCH unlit. Hover over a supported Cubase or plug-in parameter and press TOUCH to capture it. After approximately 100 ms for the binding to settle, the script locks the target and stores its starting value. Press TOUCH again to capture a new target under the mouse. TOUCH performs no 0 dB reset in either LINK mode.

TOUCH is green while the locked parameter matches its saved starting value within one 14-bit MIDI step, magenta when above that range, and red-leaning magenta when below it. Feedback follows hardware edits and Cubase edits, including while bypassed. Knob press restores the starting value in either LINK mode, once per press, returning TOUCH to green. Moving back to the saved value manually also clears the dirty indication. In knob LINK mode only, capture and reset each align the encoder position once with the saved value while suppressing its reset callback; the existing target stays locked. Ordinary turns and host feedback do not write back to the encoder. One unbound relative encoder input receives the physical MIDI turns. In LINK it routes only to the locked mouse parameter, and does nothing while unlocked or in fader LINK. Outside LINK it forwards turns to the active normal control; the host-bound PAN knob has no direct MIDI input. Feedback on the normal PAN knob cannot be interpreted as another LINK turn.

BYPASS disables/enables parameter editing without releasing the lock or changing the stored starting value. While bypassed, parameter knob/fader input, knob-press restore, touch automation for the parameter, and mouse-fader motor movement are disabled; TOUCH continues displaying clean/dirty status and can capture a new target. In LINK modes, BYPASS LED on means bypass is active; off means bypass is inactive. The LED reflects the bypass switch independently of whether a parameter has been locked. Switching SHIFT preserves bypass, lock and the saved value. The fader is always dormant in knob LINK mode. In fader LINK mode it moves and edits only while a parameter is locked and controls are enabled. Switching between LINK variants never selects track volume.

The mouse fader uses the full normalized parameter range without volume calibration or bottom snapping. Motor feedback follows the parameter and waits while the fader is touched. Switching into or out of fader LINK while holding the fader blocks input and touch automation until release. Leaving LINK clears its lock and capture; Scroll, Section and Marker restore track volume when leaving either LINK mode.

SHIFT + PAN selects Send 1 fader mode, with amber/cyan PAN feedback. SHIFT switches PAN/Send 1, CHANNEL/Pre Gain and MASTER/FX Return 1 while their mode pair is active. Other mode buttons enter their normal function when selected with SHIFT latched. Mode history saves and restores the SHIFT bit along with the previous mode. LINK keeps its separate remembered knob/fader choice. Saved LINK values are temporary and are cleared on exit or reload.

In Send mode, knob edits are explicitly routed to the current selected-track volume. The fader has a dedicated Send 1 subpage binding. Knob push toggles pre/post once per physical press. Host edits and track selection update Send 1 level, enable and pre/post feedback.

PAN displays post-fader in AMBER and pre-fader in CYAN. Send disabled uses `SEND_DISABLED_BRIGHTNESS = 0.25`; enabled uses full brightness. BYPASS remains a fixed-color indicator: on when Send 1 is disabled/bypassed, off when enabled because the physical BYPASS button is not RGB-capable.

Send mode ignores `panFaderBypassed` without modifying it. Returning to PAN restores the previous fader-bypass state and BYPASS LED. Switching fader targets while touched waits for release before accepting edits. TOUCH in Send mode resets only send level and leaves track volume, pre/post and send enable unchanged.

`node tests_iostation/send-mode.test.js` checks the Send fader binding, track-volume knob, TOUCH unity reset/LED, pre/post toggle, all four PAN color/brightness combinations, send enable and PAN bypass restoration without the Cubase API stub.

PAN, SCROLL/ZOOM, SECTION and MARKER always bind the fader to selected-track volume and share `panFaderBypassed`. BYPASS works in either SHIFT layer: LED on means the fader is bypassed. The flag persists across these modes and other mode visits. Input, motor movement and touch automation are blocked while bypassed; re-enabling under a held fader waits for release. These BYPASS buttons never change the metronome. Encoder zoom and navigation actions remain independent of the fader.

SHIFT + Channel regression: `node tests_iostation/channel-layers.test.js` checks isolated bindings, gain input/host motor feedback, TOUCH reset/LEDs, slope feedback with deliberately nonuniform process values, reset followed by rotation, and normal CHANNEL behavior. Run all checks with `Get-ChildItem tests_iostation/*.test.js | ForEach-Object { node $_.FullName }`.

Cubase/hardware verification still required: confirm -infinity / 0 dB / +48 dB at bottom / center / top, motor and LEDs after TOUCH and track selection, and all five native slope steps including immediate detents in both directions after push. Confirm repeated relative detents at encoder endpoints, and both CHANNEL layers’ pre-gain fader and filter LED, plus cutoff/filter toggle/phase behavior. API-free tests simulate host feedback; they cannot establish actual Cubase enum process values. See the [MIDI Remote API](https://steinbergmedia.github.io/midiremote_api_doc/codedoc_api_reference/) and [Cubase filter settings](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/mixconsole/mixconsole_making_filter_settings_t.html).
