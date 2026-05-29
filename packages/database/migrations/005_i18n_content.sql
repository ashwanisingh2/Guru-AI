CREATE TYPE translation_status AS ENUM ('draft', 'ai_translated', 'in_review', 'published', 'unpublished');

CREATE TABLE IF NOT EXISTS content_i18n (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  language_code VARCHAR(20) NOT NULL CHECK (language_code IN ('en', 'hi', 'hinglish', 'es', 'ar')),
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]',
  examples JSONB NOT NULL DEFAULT '[]',
  cultural_context JSONB NOT NULL DEFAULT '{}',
  rtl BOOLEAN NOT NULL DEFAULT FALSE,
  status translation_status NOT NULL DEFAULT 'draft',
  quality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  reviewed_by UUID REFERENCES users(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(topic_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_content_i18n_topic_lang ON content_i18n(topic_id, language_code);
CREATE INDEX IF NOT EXISTS idx_content_i18n_status ON content_i18n(status);
