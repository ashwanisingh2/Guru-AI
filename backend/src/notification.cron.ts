import cron from "node-cron";
import { pool } from "./db";
import { NotificationService } from "./notification.service";

export function startNotificationCron(service = new NotificationService()) {
  cron.schedule("* * * * *", async () => {
    await scheduledStudyReminder(service);
  });

  cron.schedule("0 * * * *", async () => {
    await streakWarnings(service);
  });

  cron.schedule("0 18 * * 0", async () => {
    await weeklyGoalProgress(service);
  });
}

async function scheduledStudyReminder(service: NotificationService) {
  const { rows } = await pool.query(
    `
    SELECT u.id, u.full_name, u.email, d.preferred_study_time, d.mentor_personality, d.goal
    FROM users u
    JOIN student_dna_profiles d ON d.user_id = u.id
    WHERE d.preferred_study_time IS NOT NULL
    LIMIT 50
    `
  ).catch(() => ({ rows: [] }));

  for (const user of rows) {
    await service.deliver({
      userId: user.id,
      type: "SCHEDULED_STUDY_REMINDER",
      tone: user.mentor_personality || "supportive",
      name: user.full_name,
      topic: "JavaScript Closures",
      deepLink: "/content"
    }, { email: user.email });
  }
}

async function streakWarnings(service: NotificationService) {
  const { rows } = await pool.query(
    `
    SELECT u.id, u.full_name, u.email, d.mentor_personality
    FROM users u
    JOIN student_dna_profiles d ON d.user_id = u.id
    LEFT JOIN streaks s ON s.user_id = u.id
    WHERE s.last_activity_date IS NULL OR s.last_activity_date < CURRENT_DATE
    LIMIT 100
    `
  ).catch(() => ({ rows: [] }));

  for (const user of rows) {
    await service.deliver({
      userId: user.id,
      type: "STREAK_WARNING",
      tone: user.mentor_personality || "supportive",
      name: user.full_name,
      deepLink: "/"
    }, { email: user.email });
  }
}

async function weeklyGoalProgress(service: NotificationService) {
  const { rows } = await pool.query(
    `
    SELECT u.id, u.full_name, u.email, d.mentor_personality, d.goal, u.cgpa
    FROM users u
    JOIN student_dna_profiles d ON d.user_id = u.id
    LIMIT 100
    `
  ).catch(() => ({ rows: [] }));

  for (const user of rows) {
    await service.deliver({
      userId: user.id,
      type: "GOAL_PROGRESS",
      tone: user.mentor_personality || "corporate",
      name: user.full_name,
      goal: user.goal,
      progress: Math.round(Number(user.cgpa || 0) * 10),
      deepLink: "/path"
    }, { email: user.email });
  }
}
