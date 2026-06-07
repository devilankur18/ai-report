#!/usr/bin/env python3
import sys
import argparse
import json
import subprocess
import requests
from pathlib import Path

VENV_PYTHON = "/Users/ankur/dev/docx/ppt/browser-use-demo/.venv/bin/python3"

def resolve_paths(project_root: Path, client_id: str, voice_id: str):
    client_dir = project_root / "clients" / client_id
    voice_profile_path = client_dir / "voices" / f"{voice_id}.json"
    
    if not voice_profile_path.exists():
        raise FileNotFoundError(f"Voice profile not found at: {voice_profile_path}")
        
    return voice_profile_path, client_dir

def synthesize_voice(
    project_root: Path,
    client_id: str,
    voice_id: str,
    text: str,
    out_mp3: Path
):
    text = " ".join(text.split())
    voice_profile_path, client_dir = resolve_paths(project_root, client_id, voice_id)
    
    with open(voice_profile_path, "r", encoding="utf-8") as f:
        profile = json.load(f)
        
    engine = profile.get("engine", "mlx-qwen3-tts")
    
    tmp_prefix = out_mp3.stem + "_temp"
    tmp_dir = out_mp3.parent
    tmp_dir.mkdir(parents=True, exist_ok=True)
    expected_wav = tmp_dir / f"{tmp_prefix}_000.wav"

    if engine == "voicebox":
        profile_id = profile.get("profile_id")
        profile_name = profile.get("profile_name")
        default_engine = profile.get("default_engine")
        
        if not profile_id and not profile_name:
            raise ValueError("profile_id or profile_name must be specified in voicebox profile JSON")
            
        if profile_id:
            if not default_engine:
                print(f"[synthesis] Fetching profile details from Voicebox for ID '{profile_id}'…")
                resp = requests.get(f"http://127.0.0.1:17493/profiles/{profile_id}", timeout=10)
                if resp.status_code == 200:
                    profile_data = resp.json()
                    default_engine = profile_data.get("default_engine")
        else:
            # Query local voicebox profiles list to find the profile ID by name
            print(f"[synthesis] Fetching profiles from Voicebox to resolve name '{profile_name}'…")
            resp = requests.get("http://127.0.0.1:17493/profiles", timeout=10)
            if resp.status_code != 200:
                raise RuntimeError(f"Voicebox API error fetching profiles: {resp.status_code}")
            profiles = resp.json()
            matched = [p for p in profiles if p["name"].lower() == profile_name.lower()]
            if not matched:
                raise ValueError(f"Could not find Voicebox profile with name '{profile_name}'")
            profile_id = matched[0]["id"]
            if not default_engine:
                default_engine = matched[0].get("default_engine")
            print(f"[synthesis] Resolved profile name '{profile_name}' to ID: {profile_id}")
            
        if not default_engine:
            default_engine = "qwen"
            
        print(f"[synthesis] Requesting speech stream from Voicebox for profile ID {profile_id} (Engine: {default_engine})…")
        payload = {
            "profile_id": profile_id,
            "text": text,
            "engine": default_engine,
            "language": profile.get("language", "en")
        }
        if "model_size" in profile:
            payload["model_size"] = profile["model_size"]
        resp = requests.post("http://127.0.0.1:17493/generate/stream", json=payload, timeout=300)
        if resp.status_code != 200:
            raise RuntimeError(f"Voicebox API synthesis failed with status {resp.status_code}: {resp.text}")
            
        with open(expected_wav, "wb") as f:
            f.write(resp.content)
            
    else:
        model = profile.get("model")
        voice_type = profile.get("type", "preset")
        speed = profile.get("speed", 1.0)
        pitch = profile.get("pitch", 1.0)
        
        if not model:
            raise ValueError("Model repo/path must be specified in the voice profile.")
            
        print(f"[synthesis] Resolving voice profile '{voice_id}' for client '{client_id}'…")
        print(f"[synthesis] Engine: {engine} | Model: {model} | Type: {voice_type}")
        
        cmd = [
            VENV_PYTHON, "-m", "mlx_audio.tts.generate",
            "--model", model,
            "--text", text,
            "--output_path", str(tmp_dir),
            "--file_prefix", tmp_prefix,
            "--speed", str(speed),
            "--pitch", str(pitch)
        ]
        
        if voice_type == "preset":
            preset_name = profile.get("presetName")
            instruct = profile.get("instruct")
            if preset_name:
                cmd.extend(["--voice", preset_name])
            if instruct:
                cmd.extend(["--instruct", instruct])
                
        elif voice_type == "cloned":
            ref_audio = profile.get("refAudio")
            ref_text = profile.get("refText")
            
            if not ref_audio:
                raise ValueError("refAudio file path must be specified for cloned voice type.")
            if not ref_text:
                raise ValueError("refText transcript must be specified for cloned voice type.")
                
            ref_audio_path = client_dir / "assets" / ref_audio
            if not ref_audio_path.exists():
                raise FileNotFoundError(f"Reference audio file not found at: {ref_audio_path}")
                
            cmd.extend([
                "--ref_audio", str(ref_audio_path),
                "--ref_text", ref_text
            ])
        else:
            raise ValueError(f"Unknown voice type: {voice_type}")
            
        print(f"[synthesis] Executing local Qwen3-TTS via {VENV_PYTHON}…")
        print(f"[synthesis] Command: {' '.join(cmd)}")
        
        subprocess.run(cmd, check=True)

    if not expected_wav.exists():
        raise FileNotFoundError(f"Expected synthesized WAV file not found: {expected_wav}")
        
    # Convert to MP3 using ffmpeg
    print(f"[synthesis] Converting output WAV to MP3 using ffmpeg…")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(expected_wav), "-codec:a", "libmp3lame", "-b:a", "128k", str(out_mp3)],
        check=True,
        capture_output=True
    )
    
    # Clean up temporary WAV file
    expected_wav.unlink(missing_ok=True)
    print(f"[synthesis] ✅ Successfully generated voice audio at: {out_mp3}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synthesize voice for a client using their voice profile.")
    parser.add_argument("--client", required=True, help="Client ID (e.g. dr-snigdha-sinha)")
    parser.add_argument("--voice", required=True, help="Voice profile ID (e.g. cloned-snig)")
    parser.add_argument("--text", required=True, help="Text to speak")
    parser.add_argument("--output", required=True, help="Output MP3 file path")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent.resolve()
    out_path = Path(args.output).resolve()
    
    try:
        synthesize_voice(
            project_root=project_root,
            client_id=args.client,
            voice_id=args.voice,
            text=args.text,
            out_mp3=out_path
        )
    except Exception as e:
        print(f"[ERROR] Synthesis failed: {e}")
        sys.exit(1)
