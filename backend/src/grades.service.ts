import { pool } from "./db";

export function topicScore(input: { videoCompletion: number; quizScore: number; codingScore: number; vivaScore: number }) {
  return Math.round(
    input.videoCompletion * 0.2 +
    input.quizScore * 0.3 +
    input.codingScore * 0.3 +
    input.vivaScore * 0.2
  );
}

export function letterGrade(score: number) {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 55) return "D";
  return "F";
}

export function gradePoint(letter: string) {
  return ({ "A+": 10, A: 9, B: 8, C: 7, D: 6, F: 0 } as Record<string, number>)[letter] ?? 0;
}

export async function calculateUserGrades(userId: string) {
  await pool.query(
    `
    UPDATE topic_grade_components
    SET total_score = ROUND(video_completion * 0.2 + quiz_score * 0.3 + coding_score * 0.3 + viva_score * 0.2, 2),
        updated_at = NOW()
    WHERE user_id = $1
    `,
    [userId]
  );

  await pool.query(
    `
    INSERT INTO module_grades(user_id, subject_id, average_score, letter_grade, credits)
    SELECT
      $1,
      t.subject_id,
      ROUND((SUM(g.total_score * g.difficulty) / NULLIF(SUM(g.difficulty), 0))::NUMERIC, 2),
      grade_letter(ROUND((SUM(g.total_score * g.difficulty) / NULLIF(SUM(g.difficulty), 0))::NUMERIC, 2)),
      SUM(g.credits)
    FROM topic_grade_components g
    JOIN topics t ON t.id = g.topic_id
    WHERE g.user_id = $1
    GROUP BY t.subject_id
    ON CONFLICT(user_id, subject_id)
    DO UPDATE SET average_score = EXCLUDED.average_score,
      letter_grade = EXCLUDED.letter_grade,
      credits = EXCLUDED.credits,
      updated_at = NOW()
    `,
    [userId]
  );

  await pool.query(
    `
    UPDATE users SET cgpa = COALESCE((
      SELECT ROUND((SUM(grade_point(letter_grade) * credits) / NULLIF(SUM(credits), 0))::NUMERIC, 2)
      FROM module_grades
      WHERE user_id = $1
    ), 0), updated_at = NOW()
    WHERE id = $1
    `,
    [userId]
  );

  await unlockBadges(userId);
}

export async function getGradeSummary(userId: string) {
  const { rows } = await pool.query(
    `
    WITH ranked AS (
      SELECT id, cgpa, RANK() OVER (ORDER BY cgpa DESC) AS rank
      FROM users
      WHERE role = 'student'
    )
    SELECT
      u.cgpa,
      COALESCE((SELECT SUM(credits) FROM module_grades WHERE user_id = $1), 0) AS total_credits,
      COALESCE((SELECT rank FROM ranked WHERE id = $1), 0) AS rank,
      COALESCE(s.current_streak, 0) AS streak
    FROM users u
    LEFT JOIN streaks s ON s.user_id = u.id
    WHERE u.id = $1
    `,
    [userId]
  );
  return rows[0];
}

export async function getTopicGrade(userId: string, topicId: string) {
  const { rows } = await pool.query(
    `
    SELECT video_completion, quiz_score, coding_score, viva_score, total_score
    FROM topic_grade_components
    WHERE user_id = $1 AND topic_id = $2
    `,
    [userId, topicId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    breakdown: {
      videoCompletion: Number(row.video_completion),
      quizScore: Number(row.quiz_score),
      codingScore: Number(row.coding_score),
      vivaScore: Number(row.viva_score)
    },
    total: Number(row.total_score)
  };
}

export async function unlockBadges(userId: string) {
  const badgeRules = [
    ["html_ninja", "HTML Ninja", "Complete HTML with 90%+"],
    ["night_owl", "Night Owl", "Study 10 nights in a row"],
    ["full_stack_legend", "Full-Stack Legend", "Complete capstone"]
  ];

  for (const [code, name, description] of badgeRules) {
    await pool.query(
      `
      INSERT INTO badges(code, name, description)
      VALUES($1, $2, $3)
      ON CONFLICT(code) DO NOTHING
      `,
      [code, name, description]
    );
  }

  await pool.query(
    `
    INSERT INTO user_badges(user_id, badge_id)
    SELECT $1, b.id
    FROM badges b
    WHERE b.code = 'html_ninja'
    AND EXISTS (
      SELECT 1 FROM topic_grade_components g
      JOIN topics t ON t.id = g.topic_id
      WHERE g.user_id = $1 AND LOWER(t.title) LIKE '%html%' AND g.total_score >= 90
    )
    ON CONFLICT(user_id, badge_id) DO NOTHING
    `,
    [userId]
  );
}

export async function getBadges(userId: string) {
  const earned = await pool.query(
    `
    SELECT b.code, b.name, b.description, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = $1
    ORDER BY ub.earned_at DESC
    `,
    [userId]
  );

  const next = await pool.query(
    `
    SELECT code, name, description
    FROM badges
    WHERE id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = $1)
    LIMIT 5
    `,
    [userId]
  );

  return { earned: earned.rows, next: next.rows };
}

export async function getLeaderboard(type: string) {
  const interval = type === "weekly" ? "7 days" : type === "monthly" ? "30 days" : "100 years";
  const { rows } = await pool.query(
    `
    SELECT *
    FROM (
      SELECT
        u.id,
        u.full_name,
        u.cgpa,
        COALESCE(SUM(gp.points), 0) AS points,
        RANK() OVER (ORDER BY u.cgpa DESC, COALESCE(SUM(gp.points), 0) DESC) AS rank
      FROM users u
      LEFT JOIN gamification_points gp ON gp.user_id = u.id AND gp.created_at >= NOW() - $1::interval
      WHERE u.role = 'student'
      GROUP BY u.id
    ) ranked
    ORDER BY rank
    LIMIT 50
    `,
    [interval]
  );
  return rows;
}
