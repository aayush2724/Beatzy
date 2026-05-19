-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  google_id VARCHAR(255) UNIQUE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- Audio Jobs
CREATE TABLE IF NOT EXISTS audio_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(500) NOT NULL,
  s3_key TEXT NOT NULL,
  s3_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audio_jobs_user_id ON audio_jobs(user_id);
CREATE INDEX idx_audio_jobs_status ON audio_jobs(status);
CREATE INDEX idx_audio_jobs_created ON audio_jobs(created_at DESC);

-- Analysis Results
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID UNIQUE NOT NULL REFERENCES audio_jobs(id) ON DELETE CASCADE,
  -- Song identification
  song_title VARCHAR(500),
  song_artist VARCHAR(500),
  song_album VARCHAR(500),
  song_release_year INTEGER,
  isrc VARCHAR(20),
  acr_id VARCHAR(255),
  -- Audio features
  bpm NUMERIC(6,2),
  energy_level NUMERIC(4,3),
  mood VARCHAR(50),
  key_signature VARCHAR(20),
  time_signature VARCHAR(10),
  spectral_centroid NUMERIC(10,4),
  spectral_rolloff NUMERIC(10,4),
  zero_crossing_rate NUMERIC(10,6),
  -- YAMNet
  yamnet_labels JSONB,
  confidence_scores JSONB,
  -- Raw responses
  raw_acr_response JSONB,
  raw_ml_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_results_job_id ON analysis_results(job_id);
CREATE INDEX idx_results_mood ON analysis_results(mood);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix VARCHAR(15) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  request_count BIGINT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Usage Tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES audio_jobs(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  plan_at_time VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_user_id_date ON usage_tracking(user_id, created_at DESC);
