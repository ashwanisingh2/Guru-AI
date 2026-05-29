CREATE TABLE IF NOT EXISTS topic_grade_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  video_completion NUMERIC(5,2) NOT NULL DEFAULT 0,
  quiz_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  coding_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  viva_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  credits INTEGER NOT NULL DEFAULT 1 CHECK (credits BETWEEN 1 AND 5),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS module_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  average_score NUMERIC(5,2) NOT NULL,
  letter_grade VARCHAR(2) NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

CREATE TABLE IF NOT EXISTS gamification_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streak_freezes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_on DATE,
  earned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topic_grade_user_topic ON topic_grade_components(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_module_grades_user_subject ON module_grades(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_points_user_created ON gamification_points(user_id, created_at);

CREATE OR REPLACE FUNCTION grade_letter(score NUMERIC)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE
    WHEN score >= 90 THEN 'A+'
    WHEN score >= 85 THEN 'A'
    WHEN score >= 75 THEN 'B'
    WHEN score >= 65 THEN 'C'
    WHEN score >= 55 THEN 'D'
    ELSE 'F'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION grade_point(letter VARCHAR)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE letter
    WHEN 'A+' THEN 10
    WHEN 'A' THEN 9
    WHEN 'B' THEN 8
    WHEN 'C' THEN 7
    WHEN 'D' THEN 6
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
