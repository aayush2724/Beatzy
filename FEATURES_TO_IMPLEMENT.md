# 🎵 Missing Features to Implement

## 1. **Listen Live (Shazam-like Detection)** ✅ Partially Done
**Status:** Frontend implemented, needs MicRecorder component

**What exists:**
- Tab UI in Upload.jsx
- `<MicRecorder onRecorded={handleFile} />` component usage

**What's missing:**
- `frontend/src/components/MicRecorder.jsx` component file
- Should record audio from microphone
- Convert to WAV/MP3 blob
- Pass to analysis pipeline

---

## 2. **Song Search** ✅ Partially Done
**Status:** Frontend implemented, needs backend API

**What exists:**
- Search UI in Upload.jsx
- Search form and results display
- `searchSongs()` API function call

**What's missing:**
- `GET /api/songs/search?q=query` backend endpoint
- Should search Spotify API for tracks
- Return track metadata (title, artist, album, preview_url, cover_url)

---

## 3. **Enhanced Analysis Results** ❌ Missing
**Status:** Not implemented

**Current analysis provides:**
- BPM, key signature, time signature
- Energy level, mood
- Spectral centroid, rolloff, zero crossing rate
- YAMNet labels
- Song identification (ACRCloud)
- Spotify features

**What's missing:**
- **Lyrics** - Full song lyrics
- **Chords** - Chord progression throughout the song
- **Scale** - Musical scale (major/minor, mode)
- **Instrument Playability** - How to play on guitar, piano, etc.
- **Tabs/Sheet Music** - Guitar tabs, piano sheet music

---

## Required Changes

### Frontend
1. Create `MicRecorder.jsx` component
2. Enhance `Results.jsx` to display new fields

### Backend
1. Add `/api/songs/search` endpoint
2. Enhance analysis worker to fetch:
   - Lyrics (Genius API / Musixmatch API)
   - Chords (Chordify API / Hooktheory API)
   - Scale detection (from key signature)
   - Instrument guides (generate from chords)
3. Update database schema to store new fields

### APIs Needed
- **Genius API** - for lyrics
- **Chordify API** or **Hooktheory** - for chords
- **Spotify API** - for song search (already configured)

---

## Priority Order
1. ✅ Fix MicRecorder component (high priority)
2. ✅ Add song search endpoint (high priority)
3. 🔄 Add lyrics fetching (medium priority)
4. 🔄 Add chord detection (medium priority)
5. 🔄 Add scale/instrument guides (low priority)
