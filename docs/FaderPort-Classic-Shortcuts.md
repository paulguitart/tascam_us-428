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

PUNCH and USER navigate markers with or without SHIFT. Shortcuts are chosen
when the action button is pressed; releasing SHIFT first does not trigger the
unshifted action. SHIFT + LOOP does not toggle cycle. LOOP, SOLO and MUTE LEDs
continue to follow Cubase state.

TOUCH lights only at unity (0 dB), following host volume feedback, including
mouse edits and track selection. Minimum and maximum do not light it. This is
the front-panel TOUCH button, separate from the fader's capacitive touch sensor;
motor feedback still waits while a finger is on the fader. TOUCH also resets
volume with SHIFT held.

`FADER_HOST_UNITY` uses the IOStation's `0.789087` default for Cubase's +6 dB
volume range. Set it to `0.748222` if using the +12 dB range. LED detection uses
the same narrow `1 / 16383` normalized tolerance as IOStation.

STOP + REW uses the IOStation's STOP-first gesture. Release and press REW again
while holding STOP to repeat Return to Zero. Releasing STOP first after the
chord does not start rewinding. STOP has no hold-to-save behavior.

Reload the script in Cubase, then check these combinations on the hardware.
Standalone mock routing checks: `node tools/test_faderport_classic_shortcuts.js`.
These checks validate routing, not execution of commands inside Cubase.
