-- 007: Add musician-focused analysis fields
ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS lyrics TEXT,
  ADD COLUMN IF NOT EXISTS synced_lyrics TEXT,
  ADD COLUMN IF NOT EXISTS lyrics_source VARCHAR(50),
  ADD COLUMN IF NOT EXISTS chords JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scale VARCHAR(50);

COMMENT ON COLUMN analysis_results.lyrics IS 'Plain text lyrics fetched from a lyrics provider';
COMMENT ON COLUMN analysis_results.synced_lyrics IS 'Timestamped LRC lyrics when available';
COMMENT ON COLUMN analysis_results.lyrics_source IS 'Lyrics provider identifier';
COMMENT ON COLUMN analysis_results.chords IS 'Approximate chord timeline generated from chroma features';
COMMENT ON COLUMN analysis_results.scale IS 'Estimated musical scale derived from audio features';
