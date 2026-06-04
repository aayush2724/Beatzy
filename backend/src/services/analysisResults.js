const { pool } = require('../db/client');
const { fetchLyrics } = require('./lyrics');
const logger = require('../utils/logger');

async function persistAnalysisResult({ jobId, mlResult }) {
  const songTitle = mlResult.song?.title;
  const songArtist = mlResult.song?.artist;
  const lyricsResult = await fetchLyrics({ title: songTitle, artist: songArtist });

  if (lyricsResult) {
    logger.info('Lyrics fetched', {
      jobId,
      source: lyricsResult.source,
      hasSyncedLyrics: Boolean(lyricsResult.syncedLyrics),
    });
  }

  await pool.query(
    `INSERT INTO analysis_results (
      job_id, song_title, song_artist, song_album, song_release_year,
      isrc, acr_id, bpm, energy_level, mood, mood_confidence,
      key_signature, time_signature, scale, chords,
      spectral_centroid, spectral_rolloff, zero_crossing_rate,
      yamnet_labels, confidence_scores,
      spotify_features,
      lyrics, synced_lyrics, lyrics_source,
      raw_acr_response, raw_ml_response
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
    ON CONFLICT (job_id) DO UPDATE SET
      song_title = EXCLUDED.song_title,
      song_artist = EXCLUDED.song_artist,
      song_album = EXCLUDED.song_album,
      song_release_year = EXCLUDED.song_release_year,
      isrc = EXCLUDED.isrc,
      acr_id = EXCLUDED.acr_id,
      bpm = EXCLUDED.bpm,
      energy_level = EXCLUDED.energy_level,
      mood = EXCLUDED.mood,
      mood_confidence = EXCLUDED.mood_confidence,
      key_signature = EXCLUDED.key_signature,
      time_signature = EXCLUDED.time_signature,
      scale = EXCLUDED.scale,
      chords = EXCLUDED.chords,
      spectral_centroid = EXCLUDED.spectral_centroid,
      spectral_rolloff = EXCLUDED.spectral_rolloff,
      zero_crossing_rate = EXCLUDED.zero_crossing_rate,
      yamnet_labels = EXCLUDED.yamnet_labels,
      confidence_scores = EXCLUDED.confidence_scores,
      spotify_features = EXCLUDED.spotify_features,
      lyrics = EXCLUDED.lyrics,
      synced_lyrics = EXCLUDED.synced_lyrics,
      lyrics_source = EXCLUDED.lyrics_source,
      raw_acr_response = EXCLUDED.raw_acr_response,
      raw_ml_response = EXCLUDED.raw_ml_response,
      updated_at = NOW()`,
    [
      jobId,
      songTitle,
      songArtist,
      mlResult.song?.album,
      mlResult.song?.release_year,
      mlResult.song?.isrc,
      mlResult.song?.acr_id,
      mlResult.audio?.bpm,
      mlResult.audio?.energy_level,
      mlResult.audio?.mood,
      mlResult.audio?.mood_confidence || 0,
      mlResult.audio?.key_signature,
      mlResult.audio?.time_signature,
      mlResult.audio?.scale,
      JSON.stringify(mlResult.audio?.chords || []),
      mlResult.audio?.spectral_centroid,
      mlResult.audio?.spectral_rolloff,
      mlResult.audio?.zero_crossing_rate,
      JSON.stringify(mlResult.yamnet?.labels || []),
      JSON.stringify(mlResult.yamnet?.confidence_scores || []),
      JSON.stringify(mlResult.spotify || {}),
      lyricsResult?.lyrics || null,
      lyricsResult?.syncedLyrics || null,
      lyricsResult?.source || null,
      JSON.stringify(mlResult.song || {}),
      JSON.stringify(mlResult),
    ]
  );
}

module.exports = { persistAnalysisResult };
