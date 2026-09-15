# FaderPort v2 hardware boilerplate

Use `boilerplate/PreSonus_FaderPortBasic.js`. The original Christian & Werner script is preserved as `PreSonus_FaderPort.js` for reference.

## Included

- Original surface coordinates, control sizes, shapes and five control layers.
- 24 panel buttons, encoder rotation and push, footswitch, motor fader and touch input.
- Original `PreSonus FP2` input/output port detection.
- Direct channel-1 pitch-bend fader input/output and relative signed-bit CC 16 encoder input.
- LED off/on/flash and RGB helpers; direct normalized motor-position helper.
- One **Hardware** mapping page with Korg-style transport assignments.

Transport is assigned to Cubase; the other controls remain available for future assignments. SHIFT toggles a software layer; its LED stays on while that layer is enabled. RGB colors are initialized to white. Transport LEDs follow host state. No startup or shutdown fader movement is requested.

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

## Printed SHIFT functions

Press SHIFT once to enable the secondary paths and again to return to normal. This is the script's chosen behavior; hardware MIDI behavior still needs a live check. The `buttonMappings` table names every printed pair:

| Normal | SHIFT path |
|---|---|
| Solo / Mute / Arm | SoloClear / MuteClear / ArmAll |
| Bypass / Touch / Write / Read | BypassAll / Latch / Trim / Off |
| Prev / Next | Undo / Redo |
| Link / Pan / Channel / Scroll | LinkLock / Flip / ChannelLock / Zoom |
| Master / Click / Section / Marker | F1 / F2 / F3 / F4 |

Assign future actions to `buttons.F1`, `buttons.Flip`, `buttons.Master`, etc. These are logical surface values that receive press/release events, with no Cubase actions assigned yet. The two printed Lock labels use separate names. The visible physical controls retain their original layout and primary labels.

Button release follows whichever path received the press, even if SHIFT changes while the button is held. Activation/deactivation clears the layer and held paths. Transport, encoder, fader and footswitch retain their direct paths. The printed RTZ transport chord is not implemented by this SHIFT layer.

The original modes, modifiers, QuickTracks, EQ, sends, meters, timers, calibration curves, custom footswitch behavior and virtual control machinery are omitted.

## Loading in Cubase

Place the new script in the Cubase MIDI Remote user-script tree under `PreSonus/FaderPortBasic/PreSonus_FaderPortBasic.js`, then reload scripts. Its device name is **FaderPortBasic**. Assign the `PreSonus FP2` ports if automatic detection does not match the names on your machine. Disable the original script or other remote devices using those ports before testing this version.

Retain the hardware DAW mode used with the original script. Neither source sends a DAW-mode initialization handshake; this extraction does not establish which power-on mode your unit currently uses.

## Extending

The bottom of the script contains inactive examples for a selected-track volume mapping, Undo, F1 and button LED feedback. Use `buttons` for the routed functions; do not replace the physical button callbacks, which perform the routing. Main handles:

- `fader.mSurfaceValue`, `faderTouch`
- `uSection.btn_Solo`, `uSection.btn_Mute`, etc.
- `mSection.knob_vis.mSurfaceValue`, `mSection.knob_Press`
- `tpSection.btn_Play`, `tpSection.btn_Stop`, etc.
- `fsSection.btn_Footswitch`

From callbacks, pass the active device context to `onLED`, `offLED`, `flashingLED`, `setRGBLED` or `setMotorFader`. RGB components use 0..127; motor positions use 0..1. The direct motor helper skips movement while touch is active. Future host mappings use the fader's MIDI output binding and Cubase touch support. Touch binding is guarded for older API versions.

LED helpers control physical LEDs independently of the drawn buttons. Transport host feedback is already assigned; add feedback for other controls when implementing their assignments. Footswitch input is raw: polarity and toggle/momentary behavior should be handled when choosing its eventual function.

## Validation

JavaScript syntax and script construction against the repository's MIDI Remote API stub were checked. Output helper messages and motor touch suppression were checked with a captured MIDI output. Actual port detection, surface rendering, encoder direction, footswitch polarity and motor feedback still need a Cubase/hardware check.

Run `node faderport/boilerplate/routing.test.js` from the repository root to check all printed pairs, SHIFT toggling, held-button release across layer changes, device isolation and LED feedback.

Run `node faderport/boilerplate/transport.test.js` to check transport bindings, STOP/REW handling, repeated RTZ, save timing/cancellation and LED animation/restoration against the API stub. Cubase command execution and physical feedback still require live testing.
