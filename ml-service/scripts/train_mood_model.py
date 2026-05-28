#!/usr/bin/env python3
"""
Beatzy Mood Classifier — Synthetic Training Script.

Generates a synthetic dataset mapping audio features (BPM, energy, spectral
centroid, zero‑crossing rate, 13 MFCCs) to mood labels, then trains a
Random Forest classifier and saves it as a joblib artifact.

Usage:
    python -m scripts.train_mood_model          # from ml-service/
    python scripts/train_mood_model.py          # or directly

The resulting model is saved to  models/mood_classifier.joblib
"""

import os
import pathlib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import joblib

# ── Constants ────────────────────────────────────────────────────────────────

MOOD_LABELS = ["energetic", "happy", "calm", "sad", "excited", "melancholic", "neutral"]

FEATURE_NAMES = [
    "bpm", "energy_level", "spectral_centroid", "zero_crossing_rate",
    *[f"mfcc_{i}" for i in range(13)],
]

N_SAMPLES_PER_CLASS = 600  # total = 600 × 7 = 4 200 samples

MODEL_DIR = pathlib.Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODEL_DIR / "mood_classifier.joblib"


# ── Synthetic feature generators (per mood) ──────────────────────────────────

def _gen(n: int, bpm_range, energy_range, centroid_range, zcr_range):
    """Return (n, 17) array of synthetic features for one mood cluster."""
    rng = np.random.default_rng()
    bpm = rng.uniform(*bpm_range, size=n)
    energy = rng.uniform(*energy_range, size=n)
    centroid = rng.uniform(*centroid_range, size=n)
    zcr = rng.uniform(*zcr_range, size=n)
    mfccs = rng.normal(loc=0, scale=15, size=(n, 13))
    return np.column_stack([bpm, energy, centroid, zcr, mfccs])


MOOD_PARAMS = {
    #              bpm           energy       centroid         zcr
    "energetic":   ((140, 200), (0.08, 0.20), (3000, 6000), (0.10, 0.25)),
    "happy":       ((120, 150), (0.05, 0.12), (2500, 4500), (0.06, 0.15)),
    "calm":        ((60, 90),   (0.01, 0.05), (1000, 2500), (0.02, 0.06)),
    "sad":         ((50, 85),   (0.01, 0.03), (800, 2000),  (0.01, 0.05)),
    "excited":     ((100, 160), (0.06, 0.15), (2800, 5500), (0.08, 0.20)),
    "melancholic": ((70, 100),  (0.02, 0.04), (1200, 2800), (0.03, 0.07)),
    "neutral":     ((90, 120),  (0.03, 0.07), (2000, 3500), (0.05, 0.10)),
}


def generate_dataset():
    """Build (X, y) arrays from synthetic cluster parameters."""
    X_parts, y_parts = [], []
    for label, params in MOOD_PARAMS.items():
        X_parts.append(_gen(N_SAMPLES_PER_CLASS, *params))
        y_parts.extend([label] * N_SAMPLES_PER_CLASS)
    return np.vstack(X_parts), np.array(y_parts)


# ── Training ─────────────────────────────────────────────────────────────────

def train():
    print("╔══════════════════════════════════════════════╗")
    print("║  Beatzy — Mood Classifier Training Pipeline  ║")
    print("╚══════════════════════════════════════════════╝\n")

    # 1. Generate synthetic data
    X, y = generate_dataset()
    print(f"[1/4] Generated {len(X):,} samples  ({len(MOOD_LABELS)} classes, "
          f"{N_SAMPLES_PER_CLASS} per class)")
    print(f"       Feature shape: {X.shape}")

    # 2. Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y,
    )
    print(f"[2/4] Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    # 3. Train Random Forest
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # Cross‑val
    cv_scores = cross_val_score(clf, X_train, y_train, cv=5, scoring="f1_macro")
    print(f"[3/4] 5‑fold CV macro‑F1:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # 4. Evaluate on held‑out test set
    y_pred = clf.predict(X_test)
    print("\n[4/4] Test‑set classification report:\n")
    print(classification_report(y_test, y_pred, digits=3))

    # 5. Save model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": clf, "feature_names": FEATURE_NAMES, "labels": MOOD_LABELS}, MODEL_PATH)
    size_kb = os.path.getsize(MODEL_PATH) / 1024
    print(f"✓  Model saved → {MODEL_PATH}  ({size_kb:.0f} KB)")
    print(f"   Features:  {FEATURE_NAMES}")
    print(f"   Labels:    {MOOD_LABELS}\n")


if __name__ == "__main__":
    train()
