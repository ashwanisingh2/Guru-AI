import { pool } from "./db";
import type { StudentDnaInput } from "./studentDna.schema";

export async function generateLearningPath(profile: StudentDnaInput) {
  return {
    title: `${profile.goal} ${profile.currentLevel} path`,
    dailyTimeMinutes: profile.dailyTimeMinutes,
    mentor: profile.mentorPersonality,
    phases: [
      "Foundation diagnostic",
      "Core concepts",
      "Guided practice",
      "Project assessment",
      "Interview readiness"
    ]
  };
}

export async function createProfile(profile: StudentDnaInput, generatedPath: unknown) {
  const { rows } = await pool.query(
    `
    INSERT INTO student_dna_profiles (
      user_id, language, goal, current_level, daily_time_minutes,
      learning_styles, mentor_personality, weak_areas, strong_areas,
      preferred_study_time, generated_path
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
    `,
    [
      profile.userId,
      profile.language,
      profile.goal,
      profile.currentLevel,
      profile.dailyTimeMinutes,
      profile.learningStyles,
      profile.mentorPersonality,
      profile.weakAreas,
      profile.strongAreas,
      profile.preferredStudyTime,
      generatedPath
    ]
  ).catch(() => ({ rows: [{ user_id: profile.userId, ...profile, generated_path: generatedPath }] }));
  return rows[0];
}

export async function getProfile(userId: string) {
  const { rows } = await pool.query("SELECT * FROM student_dna_profiles WHERE user_id = $1", [userId]).catch(() => ({ rows: [] }));
  return rows[0] || null;
}

export async function updateProfile(userId: string, profile: StudentDnaInput) {
  const generatedPath = await generateLearningPath(profile);
  const { rows } = await pool.query(
    `
    UPDATE student_dna_profiles SET
      language = $2,
      goal = $3,
      current_level = $4,
      daily_time_minutes = $5,
      learning_styles = $6,
      mentor_personality = $7,
      weak_areas = $8,
      strong_areas = $9,
      preferred_study_time = $10,
      generated_path = $11,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
    `,
    [
      userId,
      profile.language,
      profile.goal,
      profile.currentLevel,
      profile.dailyTimeMinutes,
      profile.learningStyles,
      profile.mentorPersonality,
      profile.weakAreas,
      profile.strongAreas,
      profile.preferredStudyTime,
      generatedPath
    ]
  ).catch(() => ({ rows: [{ user_id: userId, ...profile, generated_path: generatedPath }] }));
  return { profile: rows[0] || null, generatedPath };
}
