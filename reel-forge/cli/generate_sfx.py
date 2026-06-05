#!/usr/bin/env python3
import math
import struct
import wave
import os
import random

def write_wav(filename, sample_rate, data):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)  # mono
        f.setsampwidth(2)  # 16-bit (2 bytes)
        f.setframerate(sample_rate)
        # Convert floating values to signed 16-bit integers
        packed_data = bytearray()
        for val in data:
            val = max(-32768, min(32767, int(val)))
            packed_data.extend(struct.pack('<h', val))
        f.writeframes(packed_data)

def generate_sfx():
    sample_rate = 44100
    random.seed(42)  # Deterministic synthesis
    
    # ── 1. whoosh.wav (0.5s sweep)
    # Freq sweeps from 100Hz to 900Hz, amplitude rises then falls
    whoosh_data = []
    duration = 0.5
    num_samples = int(sample_rate * duration)
    for i in range(num_samples):
        t = i / sample_rate
        freq = 100 + 800 * (t / duration)
        amp = math.sin(math.pi * (t / duration)) * 20000
        val = math.sin(2 * math.pi * freq * t) * amp
        whoosh_data.append(val)
    write_wav('public/audio/sfx/whoosh.wav', sample_rate, whoosh_data)

    # ── 2. pop.wav (0.12s pop)
    # Freq sweeps fast from 650Hz down to 250Hz, volume decays fast
    pop_data = []
    duration = 0.12
    num_samples = int(sample_rate * duration)
    for i in range(num_samples):
        t = i / sample_rate
        freq = 650 - 400 * (t / duration)
        amp = math.exp(-t * 35) * 22000
        val = math.sin(2 * math.pi * freq * t) * amp
        pop_data.append(val)
    write_wav('public/audio/sfx/pop.wav', sample_rate, pop_data)

    # ── 3. ding.wav (1.0s chime bell)
    # Sine wave at 1600Hz + harmonic at 3200Hz, slow exponential decay
    ding_data = []
    duration = 1.0
    num_samples = int(sample_rate * duration)
    for i in range(num_samples):
        t = i / sample_rate
        amp = math.exp(-t * 3.5) * 16000
        val = (math.sin(2 * math.pi * 1600 * t) + 0.35 * math.sin(2 * math.pi * 3200 * t)) * amp
        ding_data.append(val)
    write_wav('public/audio/sfx/ding.wav', sample_rate, ding_data)

    # ── 4. boom.wav (0.8s heavy low impact)
    # Freq sweeps from 130Hz down to 30Hz, slow volume decay
    boom_data = []
    duration = 0.8
    num_samples = int(sample_rate * duration)
    for i in range(num_samples):
        t = i / sample_rate
        freq = 130 - 100 * (t / duration)
        amp = math.exp(-t * 5.5) * 26000
        val = math.sin(2 * math.pi * freq * t) * amp
        boom_data.append(val)
    write_wav('public/audio/sfx/boom.wav', sample_rate, boom_data)

    # ── 5. click.wav (0.015s typewriter mechanical click)
    # Fast high-frequency sine click combined with a decay white noise burst
    click_data = []
    duration = 0.015
    num_samples = int(sample_rate * duration)
    for i in range(num_samples):
        t = i / sample_rate
        # Fast-decaying high-pitched sine click
        sine_part = math.sin(2 * math.pi * 2200 * t) * math.exp(-t * 250) * 15000
        # Fast-decaying noise snap
        noise_part = (random.random() * 2 - 1) * math.exp(-t * 350) * 9000
        val = sine_part + noise_part
        click_data.append(val)
    write_wav('public/audio/sfx/click.wav', sample_rate, click_data)

if __name__ == "__main__":
    generate_sfx()
    print("✅ Programmatic sound effects generated successfully in public/audio/sfx/")
