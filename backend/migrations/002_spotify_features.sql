-- 002: Add Spotify features column to analysis_results
ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS spotify_features JSONB DEFAULT '{}'::jsonb;

-- Add mood_confidence alongside existing mood column
ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS mood_confidence NUMERIC(5,4) DEFAULT 0;

COMMENT ON COLUMN analysis_results.spotify_features IS 'Spotify audio features (danceability, valence, etc.)';
COMMENT ON COLUMN analysis_results.mood_confidence IS 'ML model confidence for the predicted mood (0-1)';
