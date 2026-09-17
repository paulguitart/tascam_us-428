# FaderPort Classic LED mapping

Measured on the hardware using exact echoes of Native Mode button presses.
All 24 addresses produced a front-panel LED in the reported test.

Input: `A0 <switch ID> 01` (press), `A0 <switch ID> 00` (release).
Output: `A0 <LED ID> 01` (on), `A0 <LED ID> 00` (off).
**LED ID = switch ID XOR 07**, reversing each group of eight IDs.
The packet documentation's claim that the same message lights the same
switch does not match these observations.

| Button | Input ID | LED output ID |
| --- | --- | --- |
| USER (OUT in SDK) | 00 | 07 |
| PUNCH (IN in SDK) | 01 | 06 |
| SHIFT | 02 | 05 |
| REW | 03 | 04 |
| FFWD | 04 | 03 |
| STOP | 05 | 02 |
| PLAY | 06 | 01 |
| RECORD (MREC in SDK) | 07 | 00 |
| TOUCH | 08 | 0F |
| WRITE | 09 | 0E |
| READ | 0A | 0D |
| MIX | 0B | 0C |
| PROJ (EDIT in SDK) | 0C | 0B |
| TRANSPORT | 0D | 0A |
| UNDO | 0E | 09 |
| LOOP | 0F | 08 |
| REC ENABLE | 10 | 17 |
| SOLO | 11 | 16 |
| MUTE | 12 | 15 |
| LEFT | 13 | 14 |
| BANK | 14 | 13 |
| RIGHT | 15 | 12 |
| OUTPUT | 16 | 11 |
| OFF | 17 | 10 |

MIX input ID 0B lighting PROJ when echoed is the same address reversal,
not evidence that the input IDs should be swapped. The input names remain
based on the SDK, with hardware label aliases above.

The Cubase script drives transport, loop, mute, solo, record enable, automation
read and write LEDs from host state. SHIFT follows its held state. Other LEDs
remain off until their corresponding functions are implemented. Activation
and deactivation clear LEDs; Cubase host-value callbacks supply state feedback.
Verify initial state after activation as well as mouse changes and track changes
in Cubase. The sniffer retains exact echo mode (no remapping), and labels the
resulting LED using this measured table.
