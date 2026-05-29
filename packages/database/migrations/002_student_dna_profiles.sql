CREATE TABLE IF NOT EXISTS student_dna_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(20) NOT NULL CHECK (language IN ('en', 'hi', 'hinglish', 'es', 'ar')),
  goal VARCHAR(40) NOT NULL CHECK (goal IN ('fullstack', 'datascience', 'ai', 'cybersecurity', 'cloud')),
  current_level VARCHAR(40) NOT NULL CHECK (current_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  daily_time_minutes INTEGER NOT NULL CHECK (daily_time_minutes BETWEEN 30 AND 360),
  learning_styles TEXT[] NOT NULL,
  mentor_personality VARCHAR(40) NOT NULL CHECK (mentor_personality IN ('strict', 'supportive', 'chill', 'corporate')),
  weak_areas TEXT[] NOT NULL DEFAULT '{}',
  strong_areas TEXT[] NOT NULL DEFAULT '{}',
  preferred_study_time VARCHAR(40) NOT NULL CHECK (preferred_study_time IN ('morning', 'afternoon', 'evening', 'night')),
  generated_path JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_dna_user ON student_dna_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_dna_goal ON student_dna_profiles(goal);
