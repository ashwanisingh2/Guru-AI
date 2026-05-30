CREATE TABLE IF NOT EXISTS ai_explanation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  explanation_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  rating INT,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (explanation_id) REFERENCES ai_generated_explanations(id) ON DELETE CASCADE
);
