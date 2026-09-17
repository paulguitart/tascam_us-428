# FaderPort Classic shortcuts

SHIFT is momentary: hold it while pressing another button. Its LED follows
the held state; SHIFT alone performs no Cubase action.

| Control | Action |
| --- | --- |
| PUNCH | Locate previous marker |
| USER | Locate next marker |
| UNDO | Undo |
| SHIFT + UNDO | Redo |
| LOOP | Toggle cycle |
| SHIFT + LOOP | Insert marker |
| SOLO | Toggle selected-track solo |
| SHIFT + SOLO | Deactivate all solos |
| MUTE | Toggle selected-track mute |
| SHIFT + MUTE | Unmute all |
| STOP | Stop immediately |
| Hold STOP, then press REW | Return to Zero |
| REW without STOP | Rewind while held |
| PLAY | Toggle playback; releasing the button keeps playback running |
| TOUCH | Reset selected-track volume to 0 dB |
| OFF | Toggle physical fader control and motor feedback off/on |
| OUTPUT | Toggle fader between selected track and Stereo Out; re-enable if OFF |
| MIX | Toggle knob between selected-track pan and send 1 level |
| TRNS | Center pan, or reset send 1 to 0 dB when MIX is lit |

MIX lights in send mode. Assign the desired FX destination to send slot 1 in
Cubase. Knob movement and TRNS change the level without enabling or disabling
the send. MIX and TRNS work with or without SHIFT, and independently of the
fader's OUTPUT/OFF state. Page activation starts the knob in pan mode.
`SEND_HOST_UNITY` defaults to `0.789087`, using the reference FaderPort script's
+6 dB send-range calibration; use `0.748222` for a +12 dB send range.

OFF lights while the fader is disabled. Physical movement and capacitive touch
then send no volume or touch changes to Cubase, and motor output is suppressed.
TOUCH reset is disabled and its LED is dark. Other controls keep working.
Re-enabling catches the motor up to the latest host volume; if the fader is
held, input and motor resume after release. Script activation starts enabled.
BANK remains unassigned.

OUTPUT lights when the fader targets Stereo Out. It uses the first output bus,
as in IOStation; place the intended master first if the project has multiple
output buses. TOUCH resets the active target to 0 dB. Pan and track buttons
still control the selected track. Switching targets while held waits for release
before accepting fader movement or moving the motor.

OUTPUT overrides OFF and restores output control. OFF can subsequently disable
that target again; it does not forget the selected target. OUTPUT pressed after
OFF restores Stereo Out even if it was already selected. When enabled, OUTPUT
toggles back to selected-track control. Page activation starts on selected track.

PUNCH and USER navigate markers with or without SHIFT. Shortcuts are chosen
when the action button is pressed; releasing SHIFT first does not trigger the
unshifted action. SHIFT + LOOP does not toggle cycle. LOOP, SOLO and MUTE LEDs
continue to follow Cubase state.

TOUCH indicates unity (0 dB), updating from the surface during a fader drag and
from host volume feedback when released, including mouse edits and track
selection. Minimum and maximum do not light it. This is
the front-panel TOUCH button, separate from the fader's capacitive touch sensor;
motor feedback still waits while a finger is on the fader. TOUCH also resets
volume with SHIFT held.

`FADER_HOST_UNITY` uses the IOStation's `0.789087` default for Cubase's +6 dB
volume range. Set it to `0.748222` if using the +12 dB range. LED detection allows
two Classic fader steps (`2 / 1023`) around unity. Once lit, it stays on until
the value moves more than three steps away, preventing flicker at the edge.
This is a near-unity guide, not an exact match to Cubase's displayed rounding.
Volume is not snapped; pressing TOUCH still resets to the exact configured
host unity value.

STOP + REW uses the IOStation's STOP-first gesture. Release and press REW again
while holding STOP to repeat Return to Zero. Releasing STOP first after the
chord does not start rewinding. STOP has no hold-to-save behavior.

Reload the script in Cubase, then check these combinations on the hardware.
Standalone mock routing checks: `node tools/test_faderport_classic_shortcuts.js`.
These checks validate routing, not execution of commands inside Cubase.
