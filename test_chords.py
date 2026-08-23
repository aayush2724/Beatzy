import librosa
import numpy as np
import sys

def test_chords():
    # generate a sine wave for a C major chord (C E G)
    sr = 22050
    t = np.linspace(0, 4, int(sr * 4), endpoint=False) # 4 seconds
    c_maj = np.sin(2 * np.pi * 261.63 * t) + np.sin(2 * np.pi * 329.63 * t) + np.sin(2 * np.pi * 392.00 * t)
    
    # generate a sine wave for a G major chord (G B D)
    t = np.linspace(0, 3, int(sr * 3), endpoint=False) # 3 seconds
    g_maj = np.sin(2 * np.pi * 392.00 * t) + np.sin(2 * np.pi * 493.88 * t) + np.sin(2 * np.pi * 587.33 * t)
    
    # generate a fast F major chord (0.5 seconds)
    t = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    f_maj = np.sin(2 * np.pi * 349.23 * t) + np.sin(2 * np.pi * 440.00 * t) + np.sin(2 * np.pi * 523.25 * t)
    
    y = np.concatenate([c_maj, g_maj, f_maj])
    
    # From audio_service.py
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chord_templates = {
        'C': [1,0,0,0,1,0,0,1,0,0,0,0], 'Cmin': [1,0,0,1,0,0,0,1,0,0,0,0],
        'G': [0,0,1,0,0,0,0,1,0,0,0,1], 'F': [1,0,0,0,0,1,0,0,0,1,0,0],
    }
    chord_names = list(chord_templates.keys())
    templates = np.array(list(chord_templates.values())).T
    chord_scores = np.dot(templates.T, chroma)
    best_chords_idx = np.argmax(chord_scores, axis=0)
    
    frames_per_sec = sr / 512
    segments = []
    current_chord = chord_names[best_chords_idx[0]]
    start_time = 0.0
    
    for i, idx in enumerate(best_chords_idx):
        chord = chord_names[idx]
        if chord != current_chord:
            end_time = i / frames_per_sec
            if end_time - start_time > 1.5:
                segments.append({
                    "chord": current_chord,
                    "start": round(start_time, 1),
                    "end": round(end_time, 1)
                })
            current_chord = chord
            start_time = end_time
    print(segments)

test_chords()
