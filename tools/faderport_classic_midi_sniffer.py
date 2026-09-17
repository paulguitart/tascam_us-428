"""
FaderPort Classic MIDI Sniffer / Hardware Lab
Windows classic MIDI (WinMM) only.

NO EXTERNAL PACKAGES REQUIRED.
Uses only:
    - tkinter
    - ctypes
    - queue
    - time
    - Windows winmm.dll

Purpose:
    - Enumerate classic Windows MIDI INPUTS and OUTPUTS
    - Open a MIDI input and log every short MIDI message
    - Preserve exact raw hex bytes
    - Decode common MIDI messages
    - Decode documented PreSonus FaderPort Classic Native Mode switches
    - Optionally send the FaderPort Classic Native Mode command:
          91 00 64
    - Drive the motorized fader through full DOWN->UP / UP->DOWN sweeps
    - Toggle the SHIFT LED
    - Echo exact front-panel button presses after one second for LED discovery
    - Insert human-written marker lines into the capture log
    - Copy selected log text, or the entire log when nothing is selected

This intentionally contains NONE of the old Studio 192 preamp/gain/phantom code.
"""

import sys
import ctypes
import queue
import time
import tkinter as tk
from ctypes import wintypes
from tkinter import ttk, messagebox


if sys.platform != "win32":
    raise SystemExit("This sniffer uses Windows WinMM and must be run on Windows.")


# =============================================================================
# WinMM setup
# =============================================================================

winmm = ctypes.WinDLL("winmm")

MAXPNAMELEN = 32
MMSYSERR_NOERROR = 0

CALLBACK_NULL = 0x00000000
CALLBACK_FUNCTION = 0x00030000

MIM_OPEN = 0x3C1
MIM_CLOSE = 0x3C2
MIM_DATA = 0x3C3
MIM_LONGDATA = 0x3C4
MIM_ERROR = 0x3C5
MIM_LONGERROR = 0x3C6
MIM_MOREDATA = 0x3CC

DWORD_PTR = ctypes.c_size_t
HMIDIIN = ctypes.c_void_p
HMIDIOUT = ctypes.c_void_p
LPHMIDIIN = ctypes.POINTER(HMIDIIN)
LPHMIDIOUT = ctypes.POINTER(HMIDIOUT)


class MIDIINCAPSW(ctypes.Structure):
    _fields_ = [
        ("wMid", wintypes.WORD),
        ("wPid", wintypes.WORD),
        ("vDriverVersion", wintypes.DWORD),
        ("szPname", wintypes.WCHAR * MAXPNAMELEN),
        ("dwSupport", wintypes.DWORD),
    ]


class MIDIOUTCAPSW(ctypes.Structure):
    _fields_ = [
        ("wMid", wintypes.WORD),
        ("wPid", wintypes.WORD),
        ("vDriverVersion", wintypes.DWORD),
        ("szPname", wintypes.WCHAR * MAXPNAMELEN),
        ("wTechnology", wintypes.WORD),
        ("wVoices", wintypes.WORD),
        ("wNotes", wintypes.WORD),
        ("wChannelMask", wintypes.WORD),
        ("dwSupport", wintypes.DWORD),
    ]


# ---- MIDI input API ---------------------------------------------------------

winmm.midiInGetNumDevs.argtypes = []
winmm.midiInGetNumDevs.restype = wintypes.UINT

winmm.midiInGetDevCapsW.argtypes = [
    ctypes.c_size_t,
    ctypes.POINTER(MIDIINCAPSW),
    wintypes.UINT,
]
winmm.midiInGetDevCapsW.restype = wintypes.UINT

MIDIINPROC = ctypes.WINFUNCTYPE(
    None,
    HMIDIIN,
    wintypes.UINT,
    DWORD_PTR,
    DWORD_PTR,
    DWORD_PTR,
)

winmm.midiInOpen.argtypes = [
    LPHMIDIIN,
    wintypes.UINT,
    MIDIINPROC,
    DWORD_PTR,
    wintypes.DWORD,
]
winmm.midiInOpen.restype = wintypes.UINT

winmm.midiInStart.argtypes = [HMIDIIN]
winmm.midiInStart.restype = wintypes.UINT

winmm.midiInStop.argtypes = [HMIDIIN]
winmm.midiInStop.restype = wintypes.UINT

winmm.midiInReset.argtypes = [HMIDIIN]
winmm.midiInReset.restype = wintypes.UINT

winmm.midiInClose.argtypes = [HMIDIIN]
winmm.midiInClose.restype = wintypes.UINT

winmm.midiInGetErrorTextW.argtypes = [
    wintypes.UINT,
    wintypes.LPWSTR,
    wintypes.UINT,
]
winmm.midiInGetErrorTextW.restype = wintypes.UINT


# ---- MIDI output API --------------------------------------------------------

winmm.midiOutGetNumDevs.argtypes = []
winmm.midiOutGetNumDevs.restype = wintypes.UINT

winmm.midiOutGetDevCapsW.argtypes = [
    ctypes.c_size_t,
    ctypes.POINTER(MIDIOUTCAPSW),
    wintypes.UINT,
]
winmm.midiOutGetDevCapsW.restype = wintypes.UINT

winmm.midiOutOpen.argtypes = [
    LPHMIDIOUT,
    wintypes.UINT,
    DWORD_PTR,
    DWORD_PTR,
    wintypes.DWORD,
]
winmm.midiOutOpen.restype = wintypes.UINT

winmm.midiOutShortMsg.argtypes = [
    HMIDIOUT,
    wintypes.DWORD,
]
winmm.midiOutShortMsg.restype = wintypes.UINT

winmm.midiOutReset.argtypes = [HMIDIOUT]
winmm.midiOutReset.restype = wintypes.UINT

winmm.midiOutClose.argtypes = [HMIDIOUT]
winmm.midiOutClose.restype = wintypes.UINT

winmm.midiOutGetErrorTextW.argtypes = [
    wintypes.UINT,
    wintypes.LPWSTR,
    wintypes.UINT,
]
winmm.midiOutGetErrorTextW.restype = wintypes.UINT


# =============================================================================
# WinMM helpers
# =============================================================================

def midi_in_error_text(code):
    buf = ctypes.create_unicode_buffer(256)
    result = winmm.midiInGetErrorTextW(code, buf, len(buf))
    if result == MMSYSERR_NOERROR and buf.value:
        return buf.value
    return f"WinMM MIDI input error {code}"


def midi_out_error_text(code):
    buf = ctypes.create_unicode_buffer(256)
    result = winmm.midiOutGetErrorTextW(code, buf, len(buf))
    if result == MMSYSERR_NOERROR and buf.value:
        return buf.value
    return f"WinMM MIDI output error {code}"


def list_midi_inputs():
    devices = []
    for device_id in range(winmm.midiInGetNumDevs()):
        caps = MIDIINCAPSW()
        result = winmm.midiInGetDevCapsW(
            device_id,
            ctypes.byref(caps),
            ctypes.sizeof(caps),
        )
        if result == MMSYSERR_NOERROR:
            devices.append((device_id, caps.szPname))
    return devices


def list_midi_outputs():
    devices = []
    for device_id in range(winmm.midiOutGetNumDevs()):
        caps = MIDIOUTCAPSW()
        result = winmm.midiOutGetDevCapsW(
            device_id,
            ctypes.byref(caps),
            ctypes.sizeof(caps),
        )
        if result == MMSYSERR_NOERROR:
            devices.append((device_id, caps.szPname))
    return devices


def packed_short_message(status, data1=0, data2=0):
    return (
        (status & 0xFF)
        | ((data1 & 0x7F) << 8)
        | ((data2 & 0x7F) << 16)
    )


# =============================================================================
# FaderPort Classic Native Mode knowledge
# =============================================================================

FADERPORT_NATIVE_MODE = (0x91, 0x00, 0x64)

# Device -> host SHIFT press ID is 0x02.
# Host -> device LED IDs are mirrored in groups of 8 on the Classic.
# A current working Classic implementation maps SHIFT press ID 0x02 -> LED ID 0x05.
FADERPORT_SHIFT_LED_ID = 0x05

FADER_MIN = 0
FADER_MAX = 1023
FADER_SWEEP_STEP = 8       # 128-ish motor targets per sweep
FADER_SWEEP_DELAY_MS = 8   # ~1 second end-to-end sweep

FADERPORT_SWITCHES = {
    0x00: "USER",
    0x01: "PUNCH",
    0x02: "SHIFT",
    0x03: "REW",
    0x04: "FFWD",
    0x05: "STOP",
    0x06: "PLAY",
    0x07: "RECORD",
    0x08: "TOUCH",
    0x09: "WRITE",
    0x0A: "READ",
    0x0B: "MIX",
    0x0C: "PROJ",
    0x0D: "TRANSPORT",
    0x0E: "UNDO",
    0x0F: "LOOP",
    0x10: "REC_ENABLE",
    0x11: "SOLO",
    0x12: "MUTE",
    0x13: "LEFT",
    0x14: "BANK",
    0x15: "RIGHT",
    0x16: "OUTPUT",
    0x17: "OFF",
    0x7E: "FOOTSWITCH",
}


# =============================================================================
# MIDI decoding
# =============================================================================

def message_length(status):
    """Number of bytes in a MIDI short message."""
    if status < 0x80:
        return 1

    if 0x80 <= status <= 0xEF:
        command = status & 0xF0
        return 2 if command in (0xC0, 0xD0) else 3

    # System Common / Real Time short messages
    if status in (0xF1, 0xF3):
        return 2
    if status == 0xF2:
        return 3
    return 1


def format_hex(status, data1, data2):
    length = message_length(status)
    values = [status, data1, data2][:length]
    return " ".join(f"{x:02X}" for x in values)


def signed_7bit_twos_complement(value):
    value &= 0x7F
    return value - 128 if value & 0x40 else value


def decode_midi(status, data1, data2):
    # Actual capacitive fader touch (empirically confirmed on the Classic).
    # This is separate from the front-panel automation-mode TOUCH button (ID 0x08).
    if status == 0xA0 and data1 == 0x7F:
        if data2 == 0x01:
            state = "TOUCHED"
        elif data2 == 0x00:
            state = "RELEASED"
        else:
            state = f"STATUS={data2}"
        return f"FADERPORT FADER TOUCH  {state}"

    # FaderPort Classic Native Mode switches
    if status == 0xA0 and data1 in FADERPORT_SWITCHES:
        name = FADERPORT_SWITCHES[data1]
        if data2 == 0x01:
            state = "PRESSED"
        elif data2 == 0x00:
            state = "RELEASED"
        else:
            state = f"STATUS={data2}"
        return f"FADERPORT SWITCH  {name:<10} {state}"

    # FaderPort Classic fader halves
    if status == 0xB0 and data1 in (0x00, 0x20):
        half = "HIGH" if data1 == 0x00 else "LOW"
        return f"FADERPORT FADER   {half:<4} value={data2:3d}"

    # FaderPort Classic encoder
    if status == 0xE0 and data1 == 0x00:
        delta = signed_7bit_twos_complement(data2)
        direction = "RIGHT" if delta > 0 else "LEFT" if delta < 0 else "NONE"
        return f"FADERPORT ENCODER {direction:<5} delta={delta:+d}"

    # Generic MIDI decode
    if 0x80 <= status <= 0xEF:
        command = status & 0xF0
        channel = (status & 0x0F) + 1

        if command == 0x80:
            return f"NOTE OFF          ch={channel:2d} note={data1:3d} vel={data2:3d}"
        if command == 0x90:
            kind = "NOTE OFF" if data2 == 0 else "NOTE ON"
            return f"{kind:<17} ch={channel:2d} note={data1:3d} vel={data2:3d}"
        if command == 0xA0:
            return f"POLY PRESSURE     ch={channel:2d} key={data1:3d} val={data2:3d}"
        if command == 0xB0:
            return f"CONTROL CHANGE    ch={channel:2d} cc={data1:3d} val={data2:3d}"
        if command == 0xC0:
            return f"PROGRAM CHANGE    ch={channel:2d} program={data1:3d}"
        if command == 0xD0:
            return f"CHANNEL PRESSURE  ch={channel:2d} val={data1:3d}"
        if command == 0xE0:
            value14 = data1 | (data2 << 7)
            return f"PITCH BEND        ch={channel:2d} value={value14:5d}"

    system_names = {
        0xF1: "MTC QUARTER FRAME",
        0xF2: "SONG POSITION",
        0xF3: "SONG SELECT",
        0xF6: "TUNE REQUEST",
        0xF8: "TIMING CLOCK",
        0xFA: "START",
        0xFB: "CONTINUE",
        0xFC: "STOP",
        0xFE: "ACTIVE SENSING",
        0xFF: "SYSTEM RESET",
    }
    return system_names.get(status, f"MIDI STATUS 0x{status:02X}")


# =============================================================================
# MIDI input object
# =============================================================================

class MidiIn:
    def __init__(self, event_queue):
        self.handle = HMIDIIN()
        self.event_queue = event_queue
        self.callback = MIDIINPROC(self._callback)  # MUST remain alive

    @property
    def is_open(self):
        return bool(self.handle.value)

    def _callback(self, h_midi_in, msg, instance, param1, param2):
        # This callback runs on a WinMM thread.
        # Never touch Tk directly from here.
        if msg in (MIM_DATA, MIM_MOREDATA):
            packed = int(param1)
            status = packed & 0xFF
            data1 = (packed >> 8) & 0xFF
            data2 = (packed >> 16) & 0xFF
            timestamp_ms = int(param2)

            self.event_queue.put(
                ("midi", time.perf_counter(), timestamp_ms, status, data1, data2)
            )

        elif msg == MIM_ERROR:
            self.event_queue.put(
                ("error", f"WinMM reported malformed short MIDI data: 0x{int(param1):08X}")
            )

    def open(self, device_id):
        self.close()

        handle = HMIDIIN()
        result = winmm.midiInOpen(
            ctypes.byref(handle),
            int(device_id),
            self.callback,
            0,
            CALLBACK_FUNCTION,
        )
        if result != MMSYSERR_NOERROR:
            raise RuntimeError(midi_in_error_text(result))

        self.handle = handle

        result = winmm.midiInStart(self.handle)
        if result != MMSYSERR_NOERROR:
            winmm.midiInClose(self.handle)
            self.handle = HMIDIIN()
            raise RuntimeError(midi_in_error_text(result))

    def close(self):
        if self.is_open:
            winmm.midiInStop(self.handle)
            winmm.midiInReset(self.handle)
            winmm.midiInClose(self.handle)
            self.handle = HMIDIIN()


# =============================================================================
# MIDI output object
# =============================================================================

class MidiOut:
    def __init__(self):
        self.handle = HMIDIOUT()

    @property
    def is_open(self):
        return bool(self.handle.value)

    def open(self, device_id):
        self.close()

        handle = HMIDIOUT()
        result = winmm.midiOutOpen(
            ctypes.byref(handle),
            int(device_id),
            0,
            0,
            CALLBACK_NULL,
        )
        if result != MMSYSERR_NOERROR:
            raise RuntimeError(midi_out_error_text(result))

        self.handle = handle

    def send_short(self, status, data1=0, data2=0):
        if not self.is_open:
            raise RuntimeError("No MIDI output is open.")

        packed = packed_short_message(status, data1, data2)
        result = winmm.midiOutShortMsg(self.handle, packed)
        if result != MMSYSERR_NOERROR:
            raise RuntimeError(midi_out_error_text(result))

    def send_fader_10bit(self, position):
        """Drive the Classic motor fader to a physical 10-bit position 0..1023.

        Classic motor feedback is asymmetric:
            host -> FaderPort:
                B0 00 <upper 3 bits of 10-bit value>
                B0 20 <lower 7 bits of 10-bit value>
        """
        if not self.is_open:
            raise RuntimeError("No MIDI output is open.")

        position = max(FADER_MIN, min(FADER_MAX, int(position)))
        data_high = (position >> 7) & 0x07
        data_low = position & 0x7F

        self.send_short(0xB0, 0x00, data_high)
        self.send_short(0xB0, 0x20, data_low)

    def close(self):
        if self.is_open:
            winmm.midiOutReset(self.handle)
            winmm.midiOutClose(self.handle)
            self.handle = HMIDIOUT()


# =============================================================================
# Tk GUI
# =============================================================================

class App(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("FaderPort Classic MIDI Sniffer / Hardware Lab")
        self.geometry("1050x680")
        self.minsize(850, 500)

        self.events = queue.Queue()
        self.midi_in = MidiIn(self.events)
        self.midi_out = MidiOut()

        self.input_devices = []
        self.output_devices = []

        self.input_var = tk.StringVar()
        self.output_var = tk.StringVar()
        self.status_var = tk.StringVar(value="Not connected")
        self.marker_var = tk.StringVar()
        self.echo_var = tk.BooleanVar(value=False)
        self.echo_after_ids = set()

        self.first_event_time = None

        self.sweep_after_id = None
        self.sweep_positions = []
        self.sweep_index = 0
        self.sweep_label = ""

        self._build_ui()
        self.refresh_devices()

        self.after(20, self.process_events)
        self.protocol("WM_DELETE_WINDOW", self.on_close)

    def _build_ui(self):
        controls = ttk.Frame(self, padding=10)
        controls.pack(fill="x")

        # ------------------------------------------------------------------
        # MIDI ports
        # ------------------------------------------------------------------

        ttk.Label(controls, text="MIDI input:").grid(
            row=0, column=0, sticky="e", padx=(0, 6), pady=3
        )

        self.input_combo = ttk.Combobox(
            controls,
            textvariable=self.input_var,
            state="readonly",
            width=50,
        )
        self.input_combo.grid(row=0, column=1, sticky="ew", pady=3)

        self.connect_button = ttk.Button(
            controls,
            text="Connect Input",
            command=self.connect_input,
        )
        self.connect_button.grid(row=0, column=2, padx=(8, 0), pady=3)

        ttk.Label(controls, text="MIDI output:").grid(
            row=1, column=0, sticky="e", padx=(0, 6), pady=3
        )

        self.output_combo = ttk.Combobox(
            controls,
            textvariable=self.output_var,
            state="readonly",
            width=50,
        )
        self.output_combo.grid(row=1, column=1, sticky="ew", pady=3)
        self.output_combo.bind("<<ComboboxSelected>>", lambda _event: self.stop_echo())

        self.native_button = ttk.Button(
            controls,
            text="Send Native Mode  [91 00 64]",
            command=self.send_native_mode,
        )
        self.native_button.grid(row=1, column=2, padx=(8, 0), pady=3)

        # ------------------------------------------------------------------
        # Hardware torture bench
        # ------------------------------------------------------------------

        hardware = ttk.LabelFrame(
            controls,
            text="Hardware Tests",
            padding=(8, 6),
        )
        hardware.grid(
            row=2,
            column=0,
            columnspan=3,
            sticky="ew",
            pady=(8, 4),
        )

        ttk.Button(
            hardware,
            text="Fader Sweep: DOWN -> UP",
            command=lambda: self.start_fader_sweep("up"),
        ).pack(side="left")

        ttk.Button(
            hardware,
            text="Fader Sweep: UP -> DOWN",
            command=lambda: self.start_fader_sweep("down"),
        ).pack(side="left", padx=(7, 0))

        ttk.Separator(
            hardware,
            orient="vertical",
        ).pack(side="left", fill="y", padx=10)

        ttk.Button(
            hardware,
            text="SHIFT LED ON",
            command=lambda: self.set_shift_led(True),
        ).pack(side="left")

        ttk.Button(
            hardware,
            text="SHIFT LED OFF",
            command=lambda: self.set_shift_led(False),
        ).pack(side="left", padx=(7, 0))

        ttk.Label(
            hardware,
            text="  press ID 02 / LED ID 05",
        ).pack(side="left", padx=(4, 0))

        # ------------------------------------------------------------------
        # Log utilities
        # ------------------------------------------------------------------

        utility_row = ttk.Frame(controls)
        utility_row.grid(
            row=4,
            column=0,
            columnspan=3,
            sticky="ew",
            pady=(5, 3),
        )

        ttk.Button(
            utility_row,
            text="Refresh Devices",
            command=self.refresh_devices,
        ).pack(side="left")

        ttk.Button(
            utility_row,
            text="Clear Log",
            command=self.clear_log,
        ).pack(side="left", padx=(7, 0))

        ttk.Button(
            utility_row,
            text="Copy Log",
            command=self.copy_log,
        ).pack(side="left", padx=(7, 0))

        ttk.Label(
            utility_row,
            text="Marker:",
        ).pack(side="left", padx=(18, 5))

        self.marker_entry = ttk.Entry(
            utility_row,
            textvariable=self.marker_var,
            width=40,
        )
        self.marker_entry.pack(side="left", fill="x", expand=True)
        self.marker_entry.bind("<Return>", lambda _event: self.insert_marker())

        ttk.Button(
            utility_row,
            text="Insert Marker",
            command=self.insert_marker,
        ).pack(side="left", padx=(7, 0))

        controls.columnconfigure(1, weight=1)

        led_row = ttk.Frame(controls)
        led_row.grid(row=3, column=0, columnspan=3, sticky="ew", pady=4)
        ttk.Checkbutton(
            led_row,
            text="Echo exact button press after 1 second",
            variable=self.echo_var,
            command=self.toggle_echo,
        ).pack(side="left")
        ttk.Button(
            led_row, text="All LEDs off", command=self.clear_leds,
        ).pack(side="left", padx=10)
        ttk.Label(led_row, text="Presses only; LEDs stay on until cleared.").pack(side="left")

        ttk.Label(
            self,
            textvariable=self.status_var,
            padding=(10, 0, 10, 7),
        ).pack(fill="x")

        # ------------------------------------------------------------------
        # Log
        # ------------------------------------------------------------------

        log_frame = ttk.Frame(self, padding=(10, 0, 10, 10))
        log_frame.pack(fill="both", expand=True)

        self.log = tk.Text(
            log_frame,
            wrap="none",
            font=("Consolas", 10),
            undo=False,
        )
        self.log.pack(side="left", fill="both", expand=True)

        yscroll = ttk.Scrollbar(
            log_frame,
            orient="vertical",
            command=self.log.yview,
        )
        yscroll.pack(side="right", fill="y")
        self.log.configure(yscrollcommand=yscroll.set)

        self.append_log(
            "FaderPort Classic MIDI Sniffer / Hardware Lab\n"
            "--------------------------------------------------------------------------\n"
            "1. Choose the FaderPort MIDI INPUT and click Connect Input.\n"
            "2. Press/move controls and watch the raw MIDI.\n"
            "3. Hardware Tests use the selected FaderPort MIDI OUTPUT.\n"
            "4. Sweep tests automatically ensure Native Mode before driving the motor.\n"
            "5. Motor movement requires the Classic's external power supply.\n"
            "6. Marker box: type e.g. 'STOP BUTTON', then Enter.\n"
            "7. Copy Log copies highlighted text, or the whole log if nothing is selected.\n"
            "8. Enable exact echo, tap a button, wait 1 second, then mark which LED lit.\n"
            "   Releases, fader touch, encoder and footswitch are not echoed.\n"
            "   No LED ID remapping: the light may belong to a different button.\n"
            "--------------------------------------------------------------------------\n"
        )

    # ----------------------------------------------------------------------
    # Log helpers
    # ----------------------------------------------------------------------

    def append_log(self, text):
        self.log.insert("end", text)
        self.log.see("end")

    def clear_log(self):
        self.log.delete("1.0", "end")
        self.first_event_time = None
        self.status_var.set("Log cleared")

    def insert_marker(self):
        text = self.marker_var.get().strip()
        if not text:
            return

        if self.first_event_time is None:
            prefix = "           "
        else:
            elapsed = time.perf_counter() - self.first_event_time
            prefix = f"{elapsed:9.3f}s  "

        line = f"{prefix}========== MARKER: {text} ==========\n"
        self.append_log(line)
        print(line, end="")

        self.marker_var.set("")
        self.marker_entry.focus_set()
        self.status_var.set(f"Marker inserted: {text}")

    def copy_log(self):
        ranges = self.log.tag_ranges("sel")

        if ranges:
            text = self.log.get(ranges[0], ranges[1])
            what = "selected log text"
        else:
            text = self.log.get("1.0", "end-1c")
            what = "full log"

        self.clipboard_clear()
        self.clipboard_append(text)
        self.update_idletasks()

        self.status_var.set(f"Copied {what} to clipboard")

    # ----------------------------------------------------------------------
    # Device handling
    # ----------------------------------------------------------------------

    def refresh_devices(self):
        self.stop_echo()
        self.cancel_sweep(log_it=False)
        self.midi_in.close()
        self.midi_out.close()

        self.input_devices = list_midi_inputs()
        self.output_devices = list_midi_outputs()

        input_labels = [
            f"{device_id}: {name}"
            for device_id, name in self.input_devices
        ]
        output_labels = [
            f"{device_id}: {name}"
            for device_id, name in self.output_devices
        ]

        self.input_combo["values"] = input_labels
        self.output_combo["values"] = output_labels

        def choose_faderport(devices):
            for i, (_, name) in enumerate(devices):
                if "faderport" in name.lower():
                    return i
            return 0 if devices else -1

        input_index = choose_faderport(self.input_devices)
        output_index = choose_faderport(self.output_devices)

        if input_index >= 0:
            self.input_combo.current(input_index)
        else:
            self.input_var.set("")

        if output_index >= 0:
            self.output_combo.current(output_index)
        else:
            self.output_var.set("")

        self.connect_button.config(text="Connect Input")

        self.status_var.set(
            f"Found {len(self.input_devices)} MIDI input(s), "
            f"{len(self.output_devices)} MIDI output(s)."
        )

    def connect_input(self):
        self.stop_echo()
        selection = self.input_combo.current()

        if selection < 0 or selection >= len(self.input_devices):
            messagebox.showwarning(
                "No MIDI input",
                "Choose a MIDI input device first.",
            )
            return

        device_id, name = self.input_devices[selection]

        try:
            self.midi_in.open(device_id)
        except Exception as exc:
            self.status_var.set("MIDI input connection failed")
            messagebox.showerror("MIDI input error", str(exc))
            return

        self.first_event_time = None
        self.status_var.set(f"LISTENING: {device_id}: {name}")
        self.connect_button.config(text="Reconnect Input")

        self.append_log(
            f"\n=== INPUT OPEN: {device_id}: {name} ===\n"
        )

    def open_selected_output(self):
        selection = self.output_combo.current()

        if selection < 0 or selection >= len(self.output_devices):
            raise RuntimeError("Choose the FaderPort MIDI output first.")

        device_id, name = self.output_devices[selection]

        self.midi_out.close()
        self.midi_out.open(device_id)

        return device_id, name

    def ensure_native_mode_on_open_output(self):
        self.midi_out.send_short(*FADERPORT_NATIVE_MODE)

    # ----------------------------------------------------------------------
    # Native mode / LED output
    # ----------------------------------------------------------------------

    def stop_echo(self):
        was_enabled = self.echo_var.get()
        self.echo_var.set(False)
        for after_id in self.echo_after_ids:
            self.after_cancel(after_id)
        self.echo_after_ids.clear()
        if was_enabled:
            self.append_log("=== EXACT ECHO OFF; pending sends cancelled ===\n")

    def toggle_echo(self):
        if not self.echo_var.get():
            self.stop_echo()
            self.append_log("=== EXACT ECHO OFF; pending sends cancelled ===\n")
            return
        self.cancel_sweep(log_it=False)
        try:
            if not self.midi_in.is_open:
                raise RuntimeError("Connect the FaderPort MIDI input first.")
            device_id, name = self.open_selected_output()
            self.ensure_native_mode_on_open_output()
        except Exception as exc:
            self.stop_echo()
            messagebox.showerror("LED echo error", str(exc))
            return
        finally:
            self.midi_out.close()
        self.append_log(
            f"=== EXACT ECHO ON -> {device_id}: {name}; sent Native Mode 91 00 64; "
            "delay 1 second; press only; no ID remapping ===\n"
        )

    def queue_button_echo(self, status, data1, data2):
        if not (self.echo_var.get() and status == 0xA0
                and 0x00 <= data1 <= 0x17 and data2 == 0x01):
            return
        raw = format_hex(status, data1, data2)
        button = FADERPORT_SWITCHES[data1]

        def send_echo():
            self.echo_after_ids.discard(after_id)
            if not self.echo_var.get():
                return
            self.cancel_sweep(log_it=False)
            try:
                device_id, name = self.open_selected_output()
                self.midi_out.send_short(status, data1, data2)
            except Exception as exc:
                self.append_log(f"*** ECHO FAILED: {raw}: {exc}\n")
                self.stop_echo()
                return
            finally:
                self.midi_out.close()
            elapsed = time.perf_counter() - self.first_event_time if self.first_event_time is not None else 0
            line = (
                f"{elapsed:9.3f}s  >>> SENT TO {device_id}: {name}: {raw}  "
                f"[exact echo of {button} press; LED = {FADERPORT_SWITCHES[data1 ^ 0x07]}]\n"
            )
            self.append_log(line)
            print(line, end="")

        after_id = self.after(1000, send_echo)
        self.echo_after_ids.add(after_id)
        self.append_log(f"    QUEUED +1s: {raw}  [{button} press]\n")

    def clear_leds(self):
        self.stop_echo()
        self.cancel_sweep(log_it=False)
        try:
            device_id, name = self.open_selected_output()
            self.ensure_native_mode_on_open_output()
            for led_id in range(0x18):
                self.midi_out.send_short(0xA0, led_id, 0x00)
                self.append_log(f">>> SENT TO {device_id}: {name}: A0 {led_id:02X} 00  [LED clear]\n")
        except Exception as exc:
            messagebox.showerror("LED clear error", str(exc))
        finally:
            self.midi_out.close()

    def send_native_mode(self):
        self.cancel_sweep(log_it=False)

        try:
            device_id, name = self.open_selected_output()
            self.ensure_native_mode_on_open_output()
        except Exception as exc:
            self.midi_out.close()
            messagebox.showerror("MIDI output error", str(exc))
            return
        finally:
            self.midi_out.close()

        hex_msg = " ".join(f"{x:02X}" for x in FADERPORT_NATIVE_MODE)
        self.append_log(
            f">>> SENT TO {device_id}: {name}: {hex_msg}  "
            f"[FaderPort Classic Native Mode]\n"
        )
        self.status_var.set(f"Native Mode command sent to {name}")

    def set_shift_led(self, enabled):
        self.cancel_sweep(log_it=False)

        try:
            device_id, name = self.open_selected_output()
            self.ensure_native_mode_on_open_output()

            value = 0x01 if enabled else 0x00
            self.midi_out.send_short(
                0xA0,
                FADERPORT_SHIFT_LED_ID,
                value,
            )
        except Exception as exc:
            messagebox.showerror("MIDI output error", str(exc))
            return
        finally:
            self.midi_out.close()

        state = "ON" if enabled else "OFF"
        self.append_log(
            f">>> SHIFT LED {state}: "
            f"A0 {FADERPORT_SHIFT_LED_ID:02X} {value:02X}  "
            f"[physical SHIFT press ID is 02]\n"
        )
        self.status_var.set(f"SHIFT LED command sent: {state}")

    # ----------------------------------------------------------------------
    # Motor fader output
    # ----------------------------------------------------------------------

    def start_fader_sweep(self, direction):
        self.cancel_sweep(log_it=False)

        try:
            device_id, name = self.open_selected_output()
            self.ensure_native_mode_on_open_output()
        except Exception as exc:
            self.midi_out.close()
            messagebox.showerror("MIDI output error", str(exc))
            return

        if direction == "up":
            positions = list(range(FADER_MIN, FADER_MAX + 1, FADER_SWEEP_STEP))
            if positions[-1] != FADER_MAX:
                positions.append(FADER_MAX)
            label = "DOWN -> UP"
        else:
            positions = list(range(FADER_MAX, FADER_MIN - 1, -FADER_SWEEP_STEP))
            if positions[-1] != FADER_MIN:
                positions.append(FADER_MIN)
            label = "UP -> DOWN"

        self.sweep_positions = positions
        self.sweep_index = 0
        self.sweep_label = label

        self.append_log(
            f">>> FADER SWEEP START: {label}  "
            f"0..1023 motor protocol, step={FADER_SWEEP_STEP}, "
            f"delay={FADER_SWEEP_DELAY_MS}ms\n"
        )
        self.status_var.set(f"Fader sweep running: {label}")

        self.run_next_sweep_step()

    def run_next_sweep_step(self):
        if self.sweep_index >= len(self.sweep_positions):
            label = self.sweep_label
            self.sweep_after_id = None
            self.sweep_positions = []
            self.sweep_index = 0
            self.sweep_label = ""
            self.midi_out.close()

            self.append_log(
                f">>> FADER SWEEP COMPLETE: {label}\n"
            )
            self.status_var.set(f"Fader sweep complete: {label}")
            return

        position = self.sweep_positions[self.sweep_index]

        try:
            self.midi_out.send_fader_10bit(position)
        except Exception as exc:
            self.midi_out.close()
            self.sweep_after_id = None
            self.sweep_positions = []
            self.sweep_index = 0
            self.sweep_label = ""
            messagebox.showerror("Fader sweep error", str(exc))
            return

        self.sweep_index += 1
        self.sweep_after_id = self.after(
            FADER_SWEEP_DELAY_MS,
            self.run_next_sweep_step,
        )

    def cancel_sweep(self, log_it=True):
        active = self.sweep_after_id is not None or bool(self.sweep_positions)

        if self.sweep_after_id is not None:
            try:
                self.after_cancel(self.sweep_after_id)
            except tk.TclError:
                pass

        self.sweep_after_id = None
        self.sweep_positions = []
        self.sweep_index = 0
        self.sweep_label = ""

        if active:
            self.midi_out.close()
            if log_it:
                self.append_log(">>> FADER SWEEP CANCELLED\n")

    # ----------------------------------------------------------------------
    # Incoming WinMM events
    # ----------------------------------------------------------------------

    def process_events(self):
        try:
            while True:
                event = self.events.get_nowait()

                if event[0] == "midi":
                    _, perf_time, device_ms, status, data1, data2 = event

                    if self.first_event_time is None:
                        self.first_event_time = perf_time

                    elapsed = perf_time - self.first_event_time
                    raw = format_hex(status, data1, data2)
                    decoded = decode_midi(status, data1, data2)

                    line = (
                        f"{elapsed:9.3f}s  "
                        f"dev={device_ms:8d}ms  "
                        f"{raw:<10}  "
                        f"{decoded}\n"
                    )

                    self.append_log(line)
                    print(line, end="")
                    self.queue_button_echo(status, data1, data2)

                elif event[0] == "error":
                    self.append_log(f"*** {event[1]}\n")

        except queue.Empty:
            pass

        self.after(20, self.process_events)

    def on_close(self):
        self.stop_echo()
        self.cancel_sweep(log_it=False)
        self.midi_in.close()
        self.midi_out.close()
        self.destroy()


if __name__ == "__main__":
    App().mainloop()
