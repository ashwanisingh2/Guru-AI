import { pool } from "./db";

export type UserRole = "student" | "instructor" | "admin";

const MASTERY_SCORE = 85;
const MAX_ATTEMPTS = 3;
const COOLDOWN_HOURS = 24;

export function nextRetryAt(lastAttemptAt: Date | string | null, passed: boolean) {
  if (!lastAttemptAt || passed) return null;
  const next = new Date(lastAttemptAt);
  next.setHours(next.getHours() + COOLDOWN_HOURS);
  return next;
}

export function isCooldownActive(lastAttemptAt: Date | string | null, passed: boolean) {
  const next = nextRetryAt(lastAttemptAt, passed);
  return Boolean(next && next.getTime() > Date.now());
}

export async function getTopicAccess(userId: string, role: UserRole, topicId: string) {
  if (role === "admin" || role === "instructor") {
    return { canAccess: true, reason: "Role override", prerequisites: [] };
  }

  const { rows } = await pool.query(
    `
    WITH target AS (
      SELECT id, subject_id, prerequisite_topic_id, order_index
      FROM topics
      WHERE id = $2
    ),
    prereq AS (
      SELECT t.id, t.title, COALESCE(p.status, 'not_started') AS status, COALESCE(p.score, 0) AS score
      FROM topics t
      JOIN target x ON x.prerequisite_topic_id = t.id
      LEFT JOIN progress p ON p.topic_id = t.id AND p.user_id = $1
    )
    SELECT
      target.id,
      target.order_index,
      COALESCE(json_agg(prereq.*) FILTER (WHERE prereq.id IS NOT NULL), '[]') AS prerequisites,
      CASE
        WHEN target.order_index = 1 THEN true
        WHEN NOT EXISTS (SELECT 1 FROM prereq WHERE status <> 'completed' OR score < 85) THEN true
        ELSE false
      END AS can_access
    FROM target
    LEFT JOIN prereq ON true
    GROUP BY target.id, target.order_index
    `,
    [userId, topicId]
  );

  if (!rows[0]) return null;
  return {
    canAccess: rows[0].can_access,
    reason: rows[0].can_access ? "Unlocked" : "Complete prerequisites with 85%+ score",
    prerequisites: rows[0].prerequisites
  };
}

export async function getTopicProgress(userId: string, topicId: string) {
  const { rows } = await pool.query(
    `
    SELECT status, score, attempts, last_attempt_at,
      CASE
        WHEN status = 'completed' THEN NULL
        WHEN last_attempt_at IS NULL THEN NULL
        ELSE last_attempt_at + INTERVAL '24 hours'
      END AS next_retry_at
    FROM progress
    WHERE user_id = $1 AND topic_id = $2
    `,
    [userId, topicId]
  );

  return rows[0] || {
    status: "not_started",
    score: 0,
    attempts: 0,
    last_attempt_at: null,
    next_retry_at: null
  };
}

export async function validateAttempt(userId: string, topicId: string) {
  const progress = await getTopicProgress(userId, topicId);

  if (progress.status === "revision_required") {
    return { ok: false, status: 423, error: "Mandatory revision required before retry" };
  }

  if (Number(progress.attempts) >= MAX_ATTEMPTS) {
    await pool.query(
      `
      INSERT INTO progress(user_id, topic_id, status, attempts)
      VALUES($1, $2, 'revision_required', $3)
      ON CONFLICT(user_id, topic_id)
      DO UPDATE SET status = 'revision_required', updated_at = NOW()
      `,
      [userId, topicId, progress.attempts]
    );
    return { ok: false, status: 423, error: "Max attempts reached. Complete revision module." };
  }

  if (isCooldownActive(progress.last_attempt_at, false)) {
    return { ok: false, status: 429, error: "Retry cooldown active", nextRetryAt: nextRetryAt(progress.last_attempt_at, false) };
  }

  return { ok: true, progress };
}

export async function recordAttempt(userId: string, topicId: string, score: number, codingPassed: boolean) {
  const attempt = await validateAttempt(userId, topicId);
  if (!attempt.ok) return attempt;

  const passed = score >= MASTERY_SCORE && codingPassed;
  const { rows } = await pool.query(
    `
    INSERT INTO progress(user_id, topic_id, status, score, attempts, last_attempt_at, started_at)
    VALUES($1, $2, $3, $4, 1, NOW(), NOW())
    ON CONFLICT(user_id, topic_id)
    DO UPDATE SET
      status = CASE
        WHEN $3 = 'completed' THEN 'completed'
        WHEN progress.attempts + 1 >= 3 THEN 'revision_required'
        ELSE 'in_progress'
      END,
      score = GREATEST(progress.score, $4),
      attempts = progress.attempts + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    RETURNING *
    `,
    [userId, topicId, passed ? "completed" : "in_progress", score]
  );

  return { ok: true, passed, progress: rows[0], nextRetryAt: passed ? null : nextRetryAt(rows[0].last_attempt_at, false) };
}

export async function validateTopicCompletion(userId: string, topicId: string) {
  const { rows } = await pool.query(
    `
    WITH topic_content AS (
      SELECT id FROM content WHERE topic_id = $2
    ),
    content_check AS (
      SELECT COUNT(*) AS total,
        COUNT(cp.content_id) FILTER (WHERE cp.consumed = true) AS consumed
      FROM topic_content tc
      LEFT JOIN content_progress cp ON cp.content_id = tc.id AND cp.user_id = $1
    ),
    progress_check AS (
      SELECT COALESCE(score, 0) AS score, COALESCE(coding_passed, false) AS coding_passed
      FROM progress
      WHERE user_id = $1 AND topic_id = $2
    )
    SELECT
      COALESCE((SELECT total = consumed FROM content_check), false) AS all_content_consumed,
      COALESCE((SELECT score >= 85 FROM progress_check), false) AS mastery_passed,
      COALESCE((SELECT coding_passed FROM progress_check), false) AS coding_passed
    `,
    [userId, topicId]
  );

  const check = rows[0];
  const missing = [];
  if (!check.all_content_consumed) missing.push("Consume all content");
  if (!check.mastery_passed) missing.push("Score 85%+ on mastery test");
  if (!check.coding_passed) missing.push("Submit and pass coding assignment");

  return { ok: missing.length === 0, missing };
}

export async function completeTopic(userId: string, topicId: string) {
  const validation = await validateTopicCompletion(userId, topicId);
  if (!validation.ok) return { ok: false, status: 400, error: "Topic completion requirements not met", missing: validation.missing };

  const { rows } = await pool.query(
    `
    UPDATE progress
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE user_id = $1 AND topic_id = $2
    RETURNING *
    `,
    [userId, topicId]
  );

  return { ok: true, progress: rows[0] };
}
