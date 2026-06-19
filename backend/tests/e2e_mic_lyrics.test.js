"""
End-to-end test: Upload a real song, verify full pipeline including lyrics.
"""

import requests
import time
import json
import sys

BASE = "http://localhost:3000"
passed = 0
failed = 0

def check(label, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  ✓ {label}")
        passed += 1
    else:
        print(f"  ✗ {label} — {detail}")
        failed += 1


def main():
    global passed, failed

    print("=" * 60)
    print("END-TO-END TEST: Full Analysis Pipeline + Lyrics")
    print("=" * 60)

    # ── Step 0: Verify services ───────────────────────────────────────────
    print("\n[0] Verifying services...")
    r = requests.get(f"{BASE}/api/health", timeout=5)
    check("Backend is up", r.status_code == 200)

    # ── Step 1: Register user ─────────────────────────────────────────────
    print("\n[1] Registering test user...")
    email = f"e2e_{int(time.time())}@test.io"
    r = requests.post(f"{BASE}/api/auth/register", json={
        "name": "E2E Runner", "email": email, "password": "Test1234!"
    }, timeout=10)
    check("Registration succeeded", r.status_code == 201, f"status={r.status_code}")
    token = r.json().get("data", {}).get("accessToken")
    check("Got access token", bool(token))
    h = {"Authorization": f"Bearer {token}"}

    # ── Step 2: Search for a known song ───────────────────────────────────
    print("\n[2] Searching for a known song (Bohemian Rhapsody)...")
    r = requests.get(f"{BASE}/api/audio/search", params={"q": "Bohemian Rhapsody Queen"},
                     headers=h, timeout=15)
    check("Search succeeded", r.status_code == 200)
    tracks = r.json().get("data", [])
    check("Got search results", len(tracks) > 0, f"count={len(tracks)}")

    if not tracks:
        print("\nFATAL: No search results.")
        sys.exit(1)

    track = tracks[0]
    preview_url = track.get("preview_url")
    print(f"  Found: {track['title']} by {track['artist']}")
    check("Track has preview URL", bool(preview_url))

    if not preview_url:
        print("\nFATAL: No preview URL.")
        sys.exit(1)

    # ── Step 3: Submit for analysis ───────────────────────────────────────
    print("\n[3] Submitting audio for analysis...")
    r = requests.post(f"{BASE}/api/audio/analyze-url", json={
        "url": preview_url,
        "title": track["title"],
        "artist": track["artist"],
    }, headers=h, timeout=30)
    check("Analyze-url accepted", r.status_code == 202, f"status={r.status_code} body={r.text[:300]}")
    job_id = r.json().get("data", {}).get("jobId")
    check("Got job ID", bool(job_id))
    print(f"  Job ID: {job_id}")

    if not job_id:
        print("\nFATAL: No job ID.")
        sys.exit(1)

    # ── Step 4: Poll for results ──────────────────────────────────────────
    print("\n[4] Polling for results (max 3 min)...")
    result = None
    for attempt in range(60):
        time.sleep(3)
        r = requests.get(f"{BASE}/api/results/{job_id}", headers=h, timeout=10)
        data = r.json()
        status = data.get("status")

        if status == "complete":
            result = data.get("data")
            print(f"  Analysis complete after {(attempt+1)*3}s")
            break
        elif status == "failed":
            print(f"  ✗ FAILED: {data.get('error')}")
            sys.exit(1)
        elif attempt % 5 == 0:
            print(f"  Waiting... (attempt {attempt+1}, status={status})")

    check("Got analysis result", result is not None, "timed out")

    if not result:
        print("\nFATAL: No result.")
        sys.exit(1)

    # ── Step 5: Verify song identification ────────────────────────────────
    print("\n[5] Verifying song identification...")
    check("Song title present", bool(result.get("song_title")),
          f"title={result.get('song_title')}")
    check("Song artist present", bool(result.get("song_artist")),
          f"artist={result.get('song_artist')}")
    check("BPM present", result.get("bpm") is not None,
          f"bpm={result.get('bpm')}")
    check("Mood present", bool(result.get("mood")),
          f"mood={result.get('mood')}")
    check("Key signature present", bool(result.get("key_signature")),
          f"key={result.get('key_signature')}")
    print(f"\n  Song: {result.get('song_title')} by {result.get('song_artist')}")
    print(f"  BPM: {result.get('bpm')}, Key: {result.get('key_signature')}, Mood: {result.get('mood')}")

    # ── Step 6: Verify lyrics ─────────────────────────────────────────────
    print("\n[6] Verifying lyrics...")
    has_lyrics = bool(result.get("lyrics"))
    has_synced = bool(result.get("synced_lyrics"))
    lyrics_source = result.get("lyrics_source")

    check("Lyrics present", has_lyrics,
          f"lyrics={repr(result.get('lyrics'))[:100] if result.get('lyrics') else 'None'}")
    check("Lyrics source recorded", bool(lyrics_source),
          f"source={lyrics_source}")

    if has_lyrics:
        print(f"\n  Lyrics preview: {result.get('lyrics', '')[:150]}...")
        print(f"  Source: {lyrics_source}")
        print(f"  Synced lyrics: {'yes (' + str(len(result.get('synced_lyrics',''))) + ' chars)' if has_synced else 'no'}")

    # ── Step 7: Verify chords ─────────────────────────────────────────────
    print("\n[7] Verifying chords...")
    chords = result.get("chords")
    if chords and isinstance(chords, str):
        try:
            chords = json.loads(chords)
        except:
            pass
    has_chords = isinstance(chords, list) and len(chords) > 0
    check("Chords present", has_chords,
          f"chords={repr(chords)[:100] if chords else 'None'}")
    if has_chords:
        print(f"  Chord count: {len(chords)}")

    # ── Step 8: Verify Spotify metadata ───────────────────────────────────
    print("\n[8] Verifying Spotify metadata...")
    spotify = result.get("spotify_features")
    if spotify and isinstance(spotify, str):
        try:
            spotify = json.loads(spotify)
        except:
            pass
    check("Spotify features present", bool(spotify))
    if spotify:
        print(f"  Cover URL: {'present' if spotify.get('cover_url') else 'missing'}")

    # ── Summary ───────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    total = passed + failed
    print(f"RESULTS: {passed}/{total} passed, {failed} failed")
    print("=" * 60)

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
