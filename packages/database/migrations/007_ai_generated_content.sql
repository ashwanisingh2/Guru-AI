CREATE TABLE IF NOT EXISTS ai_generated_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(160) UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  topic VARCHAR(160) NOT NULL,
  struggling_with TEXT NOT NULL,
  format VARCHAR(40) NOT NULL,
  profile_snapshot JSONB NOT NULL DEFAULT '{}',
  response JSONB NOT NULL,
  quality JSONB NOT NULL DEFAULT '{}',
  review_status VARCHAR(40) NOT NULL DEFAULT 'auto_approved',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_explanations_cache_key ON ai_generated_explanations(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_generated_explanations_review ON ai_generated_explanations(review_status, created_at);
