CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE content_type AS ENUM ('video', 'text', 'quiz', 'coding_problem');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'revision_required');
CREATE TYPE assessment_type AS ENUM ('quiz', 'coding_test', 'viva');
CREATE TYPE mentor_personality AS ENUM ('strict', 'friendly', 'corporate', 'supportive');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'student',
  preferred_language VARCHAR(20) NOT NULL DEFAULT 'en',
  cgpa NUMERIC(4,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(140) NOT NULL,
  slug VARCHAR(160) UNIQUE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  prerequisite_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  position INTEGER NOT NULL,
  mastery_score_required INTEGER NOT NULL DEFAULT 85 CHECK (mastery_score_required BETWEEN 0 AND 100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(subject_id, slug),
  UNIQUE(subject_id, position)
);

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  language_code VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  video_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type assessment_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  question_pool JSONB NOT NULL,
  randomized_count INTEGER NOT NULL DEFAULT 5,
  passing_score INTEGER NOT NULL DEFAULT 85 CHECK (passing_score BETWEEN 0 AND 100),
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status progress_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  attempts INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  last_attempt_at TIMESTAMP,
  coding_passed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  ai_viva_feedback TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE content_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  grade_point NUMERIC(3,2) NOT NULL,
  letter_grade VARCHAR(2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_mentor_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  personality mentor_personality NOT NULL DEFAULT 'friendly',
  context JSONB NOT NULL DEFAULT '{}',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_slug ON subjects(slug);
CREATE INDEX idx_topics_subject_position ON topics(subject_id, position);
CREATE INDEX idx_topics_prerequisite ON topics(prerequisite_topic_id);
CREATE INDEX idx_content_topic_language ON content(topic_id, language_code);
CREATE INDEX idx_assessments_topic ON assessments(topic_id);
CREATE INDEX idx_progress_user_topic ON progress(user_id, topic_id);
CREATE INDEX idx_progress_completed ON progress(user_id, completed_at);
CREATE INDEX idx_submissions_user_assessment ON submissions(user_id, assessment_id);
CREATE INDEX idx_grades_user_subject ON grades(user_id, subject_id);
CREATE INDEX idx_ai_conversations_user_topic ON ai_mentor_conversations(user_id, topic_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);

CREATE OR REPLACE FUNCTION grade_point_from_score(score INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE
    WHEN score >= 95 THEN 10.0
    WHEN score >= 90 THEN 9.0
    WHEN score >= 85 THEN 8.5
    WHEN score >= 80 THEN 8.0
    WHEN score >= 70 THEN 7.0
    WHEN score >= 60 THEN 6.0
    WHEN score >= 50 THEN 5.0
    ELSE 0.0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION letter_from_score(score INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE
    WHEN score >= 90 THEN 'A+'
    WHEN score >= 85 THEN 'A'
    WHEN score >= 80 THEN 'B+'
    WHEN score >= 70 THEN 'B'
    WHEN score >= 60 THEN 'C'
    WHEN score >= 50 THEN 'D'
    ELSE 'F'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION refresh_user_cgpa(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET cgpa = COALESCE((
    SELECT ROUND(AVG(grade_point)::NUMERIC, 2)
    FROM grades
    WHERE user_id = target_user_id
  ), 0),
  updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_grade_from_progress()
RETURNS TRIGGER AS $$
DECLARE
  subject UUID;
BEGIN
  IF NEW.status = 'completed' THEN
    SELECT subject_id INTO subject FROM topics WHERE id = NEW.topic_id;

    INSERT INTO grades(user_id, topic_id, subject_id, score, grade_point, letter_grade)
    VALUES (
      NEW.user_id,
      NEW.topic_id,
      subject,
      NEW.score,
      grade_point_from_score(NEW.score),
      letter_from_score(NEW.score)
    )
    ON CONFLICT(user_id, topic_id)
    DO UPDATE SET
      score = EXCLUDED.score,
      grade_point = EXCLUDED.grade_point,
      letter_grade = EXCLUDED.letter_grade,
      updated_at = NOW();

    PERFORM refresh_user_cgpa(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_grade_from_progress
AFTER INSERT OR UPDATE OF status, score ON progress
FOR EACH ROW
EXECUTE FUNCTION sync_grade_from_progress();

CREATE OR REPLACE FUNCTION update_progress_from_submission()
RETURNS TRIGGER AS $$
DECLARE
  target_topic_id UUID;
BEGIN
  SELECT topic_id INTO target_topic_id FROM assessments WHERE id = NEW.assessment_id;

  INSERT INTO progress(user_id, topic_id, status, started_at, completed_at, score, attempts, unlocked)
  VALUES (
    NEW.user_id,
    target_topic_id,
    CASE WHEN NEW.passed THEN 'completed'::progress_status ELSE 'in_progress'::progress_status END,
    NOW(),
    CASE WHEN NEW.passed THEN NOW() ELSE NULL END,
    NEW.score,
    1,
    TRUE
  )
  ON CONFLICT(user_id, topic_id)
  DO UPDATE SET
    status = CASE WHEN NEW.passed THEN 'completed'::progress_status ELSE progress.status END,
    completed_at = CASE WHEN NEW.passed THEN NOW() ELSE progress.completed_at END,
    score = GREATEST(progress.score, NEW.score),
    attempts = progress.attempts + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_progress_from_submission
AFTER INSERT ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_progress_from_submission();

INSERT INTO users(full_name, email, role, preferred_language)
VALUES ('Demo Instructor', 'instructor@guru.ai', 'instructor', 'en');

INSERT INTO subjects(name, slug, description, created_by)
SELECT 'Web Development', 'web-development', 'Modern full-stack web development.', id
FROM users
WHERE email = 'instructor@guru.ai';

WITH subject AS (
  SELECT id FROM subjects WHERE slug = 'web-development'
),
t1 AS (
  INSERT INTO topics(subject_id, title, slug, position)
  SELECT id, 'HTML Foundations', 'html-foundations', 1 FROM subject
  RETURNING id
),
t2 AS (
  INSERT INTO topics(subject_id, prerequisite_topic_id, title, slug, position)
  SELECT subject.id, t1.id, 'CSS Systems', 'css-systems', 2 FROM subject, t1
  RETURNING id
),
t3 AS (
  INSERT INTO topics(subject_id, prerequisite_topic_id, title, slug, position)
  SELECT subject.id, t2.id, 'JavaScript Core', 'javascript-core', 3 FROM subject, t2
  RETURNING id
),
t4 AS (
  INSERT INTO topics(subject_id, prerequisite_topic_id, title, slug, position)
  SELECT subject.id, t3.id, 'React Fundamentals', 'react-fundamentals', 4 FROM subject, t3
  RETURNING id
),
t5 AS (
  INSERT INTO topics(subject_id, prerequisite_topic_id, title, slug, position)
  SELECT subject.id, t4.id, 'API Integration', 'api-integration', 5 FROM subject, t4
  RETURNING id
)
INSERT INTO content(topic_id, type, language_code, title, body, video_url, position)
SELECT id, 'video', 'en', 'HTML Foundations Lecture', 'Learn semantic HTML.', 'https://www.youtube.com/embed/UB1O30fR-EE', 1 FROM t1
UNION ALL
SELECT id, 'video', 'en', 'CSS Systems Lecture', 'Learn cascade and layout.', 'https://www.youtube.com/embed/yfoY53QXEnI', 1 FROM t2
UNION ALL
SELECT id, 'video', 'en', 'JavaScript Core Lecture', 'Learn JS basics.', 'https://www.youtube.com/embed/W6NZfCO5SIk', 1 FROM t3
UNION ALL
SELECT id, 'video', 'en', 'React Fundamentals Lecture', 'Learn React components.', 'https://www.youtube.com/embed/SqcY0GlETPk', 1 FROM t4
UNION ALL
SELECT id, 'video', 'en', 'API Integration Lecture', 'Learn API calls.', 'https://www.youtube.com/embed/cuEtnrL9-H0', 1 FROM t5;

INSERT INTO assessments(topic_id, type, title, question_pool, randomized_count, passing_score)
SELECT id, 'quiz', title || ' Quiz',
'[
  {"id": 1, "question": "Core concept?", "options": ["A", "B", "C", "D"], "answer": "A"},
  {"id": 2, "question": "Best practice?", "options": ["A", "B", "C", "D"], "answer": "B"},
  {"id": 3, "question": "Common mistake?", "options": ["A", "B", "C", "D"], "answer": "C"}
]'::jsonb,
3,
85
FROM topics
WHERE subject_id = (SELECT id FROM subjects WHERE slug = 'web-development');
