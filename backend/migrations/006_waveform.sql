-- 006: Add waveform data column to analysis_results
ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS waveform_data JSONB DEFAULT NULL;

COMMENT ON COLUMN analysis_results.waveform_data IS 'Downsampled amplitude envelope for frontend rendering';
