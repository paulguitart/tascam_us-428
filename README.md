# Cubase MIDI Remote scripts: Tascam US-224, US-428 and Korg nanoKONTROL2

By Paul Warner. US-428 special thanks to Minas Chantzides.

Three controller layouts built around hands-on recording and mixing. The US-224 focuses on tracking and auditioning microphones; the US-428 provides mixer, EQ and send controls; the nanoKONTROL2 provides a compact tracking layout.

| Controller | Script | Layout |
|---|---|---|
| Tascam US-224 | [Tascam_US-224.js](Tascam_US-224.js) | Fixed four-track tracking mode or banked mixer mode |
| Tascam US-428 | [Tascam_US-428.js](Tascam_US-428.js) | Three eight-channel banks, selected-track mixing and mode switches |
| Korg nanoKONTROL2 | [Korg_nanoKontrol2Remote.js](Korg_nanoKontrol2Remote.js) | Seven fixed tracks plus a special eighth strip, or eight regular strips |

## Reading the controls

These are Cubase MIDI Remote JavaScript scripts, not audio drivers. Configure preferences in each script's `CUSTOM SETTINGS` section, then reload the script in Cubase after editing.

- A chord such as **STOP + SET** means hold STOP first, then press SET. SET + wheel means hold SET while turning the wheel.
- **Normal / NULL / ASGN / SOLO** describe latched modes, not buttons that must remain held. US-224 `TRACKING_MODE` is a script setting; its normal mixer mode is a separate layout.
- Channel-strip controls address the current fixed/banked mixer channels. Controls labeled **selected track** follow Cubase's selection, including tracks outside those banks.
- **Master insert bypass** uses Cubase's `Bypass: Inserts on Main Mix` command. **FX Return 1 volume** is the first FX channel's volume, not send slot 1. Jog-wheel sends are sends on the selected track.
- STOP still stops transport immediately when used as a modifier. Cubase may return to the last start position when STOP is pressed while already stopped.
- Zoom is the default jog-wheel function on both Tascams. If zoom travel runs out, rotate briefly and quickly in the opposite direction to regain travel.

The Tascam scripts detect their model's Control MIDI ports. Both default to one unit; `MAX_TASCAM_UNITS` and `EXACT_PORT_NAMES` support the scripts' multiple-unit configuration. The Korg uses MIDI identity detection and, by default, sends startup configuration for CC mode and external LED control.

## Tascam US-224

Current default: `TRACKING_MODE = true`. Tracking mode allocates one four-channel bank. Normal mode retains the original banked implementation: `MAX_BANK_COUNT = 50`, or 200 channels.

### Tracking mode

| Control | Action |
|---|---|
| Faders 1–4 | Volume for fixed tracks 1–4 |
| MUTE 1–4 | Mute fixed tracks 1–4; yellow LEDs show mute |
| SELECT 1–4 | Solo fixed tracks 1–4; green LEDs show solo |
| Master fader | Metronome OFF: stereo out. Metronome ON: click level |
| NULL | Metronome on/off; NULL LED shows its state |
| SOLO | Cycle on/off; SOLO LED shows cycle state |
| STOP + SOLO | Clear all solos and exit audition without changing track selection |
| REC MASTER | Selected-track record enable when `REC_ENABLE_MODE = true`; otherwise master insert bypass |
| STOP + REC MASTER | Master insert bypass, regardless of `REC_ENABLE_MODE` |
| Jog wheel | Horizontal zoom; selected-track volume during audition if enabled |
| BANK L/R | Select previous/next track |
| STOP + BANK L/R, cycle OFF | Audition previous/next track |
| STOP + BANK L/R, cycle ON | Recall previous/next cycle marker |
| LOC L/R | Locate previous/next marker |
| SET | Insert marker |
| STOP + LOC L/R | Undo/redo |
| STOP + SET | Toggle selected-track mute |
| STOP + REW | Return to zero |
| REW / FF / PLAY / REC | Transport controls |
| Hold STOP | Save after 2 seconds, when enabled |

**Auditioning microphones:** with cycle off, hold STOP and use BANK L/R to select and solo a track. The script clears existing solos and delays the selected-track solo by 250 ms to allow selection to settle. With `AUDITION_VOLUME_WHEEL = true`, the wheel adjusts that selected track's volume while auditioning.

To finish, use **STOP + SOLO**: selection stays put, all solos are cleared, pending audition solo is cancelled, and the wheel returns to zoom. The original behavior also remains: BANK L/R without STOP exits audition and moves selection. Cycle-marker navigation wraps through `1..CYCLE_MARKER_MAX` (currently 8).

**Recording and save LEDs:** nuclear mode toggles all four red REC LEDs while recording at `60000 / BPM` milliseconds per toggle. At 120 BPM that is 500 ms on, 500 ms off; it follows tempo, not the exact musical beat position. The fallback is 500 ms and the minimum interval is 150 ms. Recording stops clear these LEDs.

Holding STOP builds progress on those four red LEDs, then Save triggers three confirmation blinks on REW, FF, PLAY and RECORD. The hold is 2000 ms, with a 500 ms progress pre-delay; confirmation toggles every 150 ms. Releasing early or using an implemented STOP chord cancels the pending hold. Normal feedback is suppressed on the animated transport LEDs until confirmation finishes, then restored.

### Original normal mixer mode (`TRACKING_MODE = false`)

NULL and SOLO are independent mode switches.

| Control | NULL off | NULL on |
|---|---|---|
| Master fader | Stereo out | FX Return 1 volume |
| Jog wheel | Horizontal zoom | Track selection (`SHUTTLE_MODE = false`) or playhead nudging (`true`) |
| REC MASTER | Master insert bypass | Metronome on/off |
| LOC L/R | Previous/next marker | Set left/right locator |
| SET | Insert marker | Cycle on/off |

BANK L/R changes banks of four; faders address that bank. With SOLO mode off, MUTE buttons mute and SELECT buttons select tracks. With SOLO mode on, MUTE buttons solo and SELECT buttons record-enable. These are the implemented bindings; the script header currently lists the SELECT roles the other way around. Green LEDs show selection; red LEDs show record enable; yellow LEDs follow mute/solo mode.

Tracking-only audition and STOP+REC MASTER / STOP+SOLO shortcuts do not apply here. STOP+REW and the configurable hold-to-save remain available. This mode retains legacy red-LED save progress; unlike tracking mode, its red LEDs also represent record enable.

### US-224 settings

| Setting | Current value | Purpose |
|---|---|---|
| `TRACKING_MODE` | `true` | Tracking layout instead of original mixer layout |
| `MAX_BANK_COUNT` | `50` | Normal-mode bank capacity; tracking uses only one bank |
| `DISABLE_FADERS` | `false` | Skip channel faders and normal-mode master bindings; tracking master assignment currently remains active |
| `ENABLE_NUCLEAR_BLINK` | `true` | Tracking record LED animation |
| `ENABLE_STOP_HOLD_SAVE` | `true` | Long-press Save |
| `REC_ENABLE_MODE` | `true` | Tracking REC MASTER alone toggles selected-track record enable |
| `AUDITION_VOLUME_WHEEL` | `true` | Selected-track volume while auditioning |
| `SHUTTLE_MODE` | `false` | Normal layout's NULL-wheel function: track selection rather than playhead nudging |
| `CYCLE_MARKER_MAX` | `8` | Tracking cycle-marker recall limit |

## Tascam US-428

Eight strips address **24 channels in three banks**: F1 selects 1–8, F2 selects 9–16, and F3 selects 17–24. F LEDs indicate the bank. BANK L/R independently selects the previous/next track. ASGN and SOLO are independent latched modes.

**Current defaults disable the eight channel faders and keep the master fader on click level.** Buttons, EQ, pan/volume knob and jog wheel remain available.

### Modes and mixing

| Control | Normal (ASGN off) | ASGN on |
|---|---|---|
| Jog wheel | Horizontal zoom | Selected AUX send level on selected track |
| SET + jog wheel | Faster zoom | Fine send adjustment, 0.1× movement |
| Pan knob | Selected-track pan, 0.1× movement | Selected-track volume, 0.1× movement |
| SET + pan knob | Pan at 2× unscaled movement | Volume at 2× unscaled movement |
| AUX 1–4 | Toggle corresponding send on/off | Select send for jog wheel |
| EQ band buttons | Select EQ band for knobs | Toggle corresponding band on/off |
| EQ knobs | Adjust selected band's gain/frequency/Q | Adjust selected band's gain/frequency/Q |
| REC MASTER | Master insert bypass | Open/close selected-track channel editor |
| NULL | Metronome on/off | Metronome on/off |
| STOP + SET | Insert marker | Cycle on/off |

SET+pan is **20 times faster than the default 0.1× setting**. These are normalized movement scales, not exact dB increments. With `LOW_EQ_PREFILTER_MODE = true`, the LOW band's gain knob controls pre-gain, frequency and Q controls adjust low-cut frequency and slope, and its ASGN button toggles low cut.

SOLO mode independently changes strip buttons:

| Control | SOLO off | SOLO on |
|---|---|---|
| MUTE 1–8 | Mute | Solo |
| SELECT 1–8 | Track selection | Record enable |
| Yellow LEDs | Mute state | Solo state |
| Green LEDs | Track selection | Track selection |
| Red LEDs | Record enable | Record enable |

### Master fader settings

| `ENABLE_METRONOME_FADER` | `DISABLE_FADERS` | Metronome | Normal | ASGN |
|---|---|---|---|---|
| `true` | `true` | Either | Click level | Click level |
| `true` | `false` | OFF | Stereo out | FX Return 1 volume |
| `true` | `false` | ON | Click level | Click level |
| `false` | `false` | Either | Stereo out | FX Return 1 volume |
| `false` | `true` | Either | Disabled | Disabled |

`DISABLE_FADERS` also disables all eight channel faders. Stereo out uses scaled takeover and `MASTER_FADER_SCALE = 0.75`, intended to cap the fader at 0 dB. FX Return 1 uses scaled takeover without that output cap.

### Navigation and chords

| Control | Action |
|---|---|
| LOCATE L/R | Previous/next marker, both modes |
| SET + LOCATE L/R | Set left/right locator, both modes |
| STOP + LOCATE L/R | Undo/redo, both modes; STOP takes priority over SET |
| STOP + REW | Return to zero |
| STOP + SET | Normal: Insert Marker. ASGN: Cycle on/off |
| SET alone / release | No command; SET is a hold modifier |
| REW / FF / PLAY / REC | Transport controls |
| STOP | Stop immediately; continue holding to Save when enabled |

Hold-to-save uses **only transport LEDs**, leaving channel record-enable LEDs alone:

1. At 500 ms, FF and PLAY light together.
2. At 1250 ms, REW joins them.
3. At 1650 ms, RECORD joins them.
4. At 2000 ms, Save triggers, followed by three blinks of all four at 150 ms per toggle.

Releasing early cancels the hold. STOP chords cancel pending Save. Normal transport feedback is remembered during the animation and restored afterward; STOP's own LED is not part of the animation.

### US-428 settings

| Setting | Current value | Purpose |
|---|---|---|
| `DISABLE_FADERS` | `true` | Disable channel faders and, unless overridden by metronome mode, master fader |
| `ENABLE_METRONOME_FADER` | `true` | Master-fader behavior in the table above |
| `ENABLE_STOP_HOLD_SAVE` | `true` | Hold STOP to Save |
| `PAN_FINE_SCALE` | `0.1` | Default pan/volume knob sensitivity |
| `PAN_FAST_SCALE` | `2.0` | Pan/volume sensitivity while SET is held |
| `FX_SEND_FINE_SCALE` | `0.1` | Send sensitivity while SET is held |
| `ZOOM_FAST_STEPS` | `6` | Total requested zoom steps for a boosted movement |
| `ZOOM_REPEAT_MS` | `50` | Minimum spacing between extra zoom steps |
| `LOW_EQ_PREFILTER_MODE` | `true` | Use LOW controls for low-cut filtering |

Boosted zoom fires one step immediately, then queues extra steps through the idle callback. New wheel input replaces pending steps rather than accumulating a backlog. Releasing SET or entering ASGN cancels remaining repeats. Actual timing depends on Cubase's idle callback frequency.

## Korg nanoKONTROL2

Current default: `ENABLE_KUSTOM_CHANNEL = true`. Strips 1–7 control fixed tracks 1–7, while strip 8 provides metronome, master output, zoom and selected-track controls. There is no bank navigation or ASGN/NULL mode.

### Channel strips

| Control | Strips 1–7 | Special strip 8 |
|---|---|---|
| Fader | Fixed track volume | Metronome OFF: stereo out. ON: click level |
| Knob | Fixed track pan | Horizontal zoom |
| SOLO | Fixed track solo | Selected-track solo |
| MUTE | Fixed track mute | Selected-track mute |
| REC | Fixed track record enable | Metronome on/off |

With `ENABLE_KUSTOM_CHANNEL = false`, **all eight strips** use the regular fixed-track volume, pan, mute, solo and record-enable mapping. The special strip's zoom and metronome/output mapping are not installed.

### Transport and navigation

| Control | Action |
|---|---|
| REW / FF / PLAY / REC | Transport controls |
| STOP | Stop immediately |
| Hold STOP | Save after **1.5 seconds**, when enabled |
| STOP + REW | Return to zero |
| CYCLE | Cycle on/off |
| TRACK L/R | Select previous/next track |
| STOP + TRACK L/R | Undo/redo |
| MARKER L/R | Previous/next marker |
| MARKER SET | Insert marker |
| STOP + MARKER L/R | Previous/next cycle marker, wrapping through 1–7 by default |
| STOP + MARKER SET | Master insert bypass |

Save confirmation flashes REW, FF, PLAY and RECORD **five times**, with 140 ms between toggles. STOP is excluded and keeps its own LED feedback. There is no nuclear recording blink or progressive channel-REC animation. During confirmation, ordinary feedback cannot overwrite those four transport LEDs; their states are restored afterward. STOP chords cancel the pending save hold.

### Korg settings

| Setting | Current value | Purpose |
|---|---|---|
| `ENABLE_KUSTOM_CHANNEL` | `true` | Special strip 8 instead of an eighth regular track strip |
| `ENABLE_STOP_HOLD_SAVE` | `true` | Long-press Save |
| `FORCE_DEVICE_CC_MODE` | `true` | Send startup CC-mode/external-LED configuration |
| `TRACK_FADER_SCALE` | `1.0` | Full normalized track-fader range |
| `MASTER_FADER_SCALE` | `0.75` | Stereo-out limit for special strip 8 |
| `CYCLE_MARKER_MAX` | `7` | Cycle-marker recall limit |

## Timing and feedback notes

Timers use elapsed milliseconds in Cubase's idle callback; they do not busy-wait. Save confirmation means the script sent the Save command, not that disk writing has finished. LED animation timing and repeated zoom commands can vary with Cubase's callback scheduling.

The tables describe the implemented mappings and current script settings. After changing a script, test mode switching, modifier release and LED feedback on the hardware before relying on a new layout during a session.
