import { pool } from "./db";
import { mentorPrompts, type MentorPersonality } from "./mentor.prompts";

type ChatContext = {
  currentTopic?: string;
  recentScore?: number;
  streak?: number;
};

const memory = new Map<string, { role: "user" | "assistant"; content: string; at: string }[]>();

export function detectEmotion(message: string) {
  const text = message.toLowerCase();
  if (/(stuck|confused|fail|failed|hard|can't|cannot|frustrated)/.test(text)) return "frustrated";
  if (/(easy|done|understood|confident|clear)/.test(text)) return "confident";
  if (/(boring|bored|sleepy|tired)/.test(text)) return "bored";
  if (/(wow|great|excited|love|awesome|yes)/.test(text)) return "excited";
  return "confident";
}

export function remember(userId: string, role: "user" | "assistant", content: string) {
  const current = memory.get(userId) || [];
  current.push({ role, content, at: new Date().toISOString() });
  memory.set(userId, current.slice(-20));
}

export function getLastConversations(userId: string) {
  return (memory.get(userId) || []).slice(-10);
}

export async function assembleMentorContext(userId: string, requestContext: ChatContext) {
  const dna = await pool.query(
    `
    SELECT mentor_personality, goal, current_level, weak_areas, strong_areas, preferred_study_time
    FROM student_dna_profiles
    WHERE user_id::text = $1
    `,
    [userId]
  ).catch(() => ({ rows: [] }));

  const progress = await pool.query(
    `
    SELECT t.title, p.status, p.score, p.attempts
    FROM progress p
    JOIN topics t ON t.id = p.topic_id
    WHERE p.user_id::text = $1
    ORDER BY p.updated_at DESC
    LIMIT 5
    `,
    [userId]
  ).catch(() => ({ rows: [] }));

  return {
    studentDna: dna.rows[0] || null,
    currentTopic: requestContext.currentTopic,
    recentScore: requestContext.recentScore,
    streak: requestContext.streak,
    progressHistory: progress.rows,
    memory: getLastConversations(userId)
  };
}

export function resolvePersonality(context: Awaited<ReturnType<typeof assembleMentorContext>>): MentorPersonality {
  const value = String(context.studentDna?.mentor_personality || "SUPPORTIVE_DIDI").toLowerCase();
  if (value.includes("strict")) return "STRICT_SIR";
  if (value.includes("chill")) return "CHILL_FRIEND";
  if (value.includes("corporate")) return "CORPORATE_SENIOR";
  return "SUPPORTIVE_DIDI";
}

export function buildActions(emotion: string, context: ChatContext) {
  const actions = [];
  if (emotion === "frustrated") {
    actions.push({ type: "notification", message: "Take a 10 minute reset, then retry the concept drill.", time: "in_10_minutes" });
  }
  if ((context.recentScore || 0) < 85) {
    actions.push({ type: "schedule_adjust", newTime: "add_30_minutes_revision_today" });
  }
  if ((context.streak || 0) >= 5) {
    actions.push({ type: "notification", message: "Streak active. Maintain consistency today.", time: "evening" });
  }
  return actions;
}

export function fallbackReply(personality: MentorPersonality, message: string, context: ChatContext) {
  const score = context.recentScore ?? 0;
  if (score && score < 85) {
    if (personality === "STRICT_SIR") return "Unacceptable. Redo this topic. I expect 90% next time.";
    if (personality === "CORPORATE_SENIOR") return "This won't pass a code review. Let's fix the weak area and retry properly.";
    if (personality === "CHILL_FRIEND") return "Oof, that was rough. But you're close. Retry after fixing the core mistake.";
    return "It's okay, everyone struggles here. Let's break it down together.";
  }
  if (/done|completed|passed/i.test(message)) {
    if (personality === "STRICT_SIR") return "Adequate. Next topic. Don't celebrate yet.";
    if (personality === "CORPORATE_SENIOR") return "Excellent. Add this to your portfolio. Recruiters will notice.";
    if (personality === "CHILL_FRIEND") return "Let's goooo! You're basically a dev now!";
    return "WOW! You did it! I'm genuinely so happy for you!";
  }
  return mentorPrompts[personality].system.split("Greeting style: ")[1]?.split("\n")[0]?.replaceAll('"', "") || "Ready to learn today?";
}
