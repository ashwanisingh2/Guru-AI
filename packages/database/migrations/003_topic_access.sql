ALTER TABLE topics ADD COLUMN IF NOT EXISTS order_index INTEGER;
UPDATE topics SET order_index = position WHERE order_index IS NULL;

ALTER TABLE progress ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS coding_passed BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
    CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'revision_required');
  ELSE
    ALTER TYPE progress_status ADD VALUE IF NOT EXISTS 'revision_required';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS content_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_content_progress_user_content ON content_progress(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_progress_topic_attempt ON progress(user_id, topic_id, attempts, last_attempt_at);
