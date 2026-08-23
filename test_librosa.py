import librosa
import numpy as np
y = np.zeros(1000)
try:
    y_r = librosa.resample(y, orig_sr=22050, target_sr=16000)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
