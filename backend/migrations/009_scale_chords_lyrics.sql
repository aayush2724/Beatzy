-- 009: Add missing columns for scale, chords, and lyrics to analysis_results
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS scale VARCHAR(20);
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS chords JSONB DEFAULT '[]'::jsonb;
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS lyrics TEXT;
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS synced_lyrics TEXT;
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS lyrics_source VARCHAR(50);
