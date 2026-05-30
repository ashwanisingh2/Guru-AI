import cors from "cors";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import { studentDnaRouter } from "./studentDna.routes";
import { topicAccessRouter } from "./topicAccess.routes";
import { codingRouter } from "./coding.routes";
import { mentorRouter } from "./mentor.routes";
import { notificationRouter } from "./notification.routes";
import { startNotificationCron } from "./notification.cron";
import { badgesRouter, gradesRouter, leaderboardRouter } from "./grades.routes";
import { adminContentRouter, i18nContentRouter } from "./i18nContent.routes";
import { parentRouter } from "./parent.routes";
import { authRouter } from "./auth.routes";
import { pool as sharedPool } from "./db";
import { aiContentRouter } from "./aiContent.routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/ai", aiContentRouter);
app.use("/api/student/dna", studentDnaRouter);
app.use("/api/topics", topicAccessRouter);
app.use("/api/coding", codingRouter);
app.use("/api/mentor", mentorRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/grades", gradesRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/content", i18nContentRouter);
app.use("/api/admin/content", adminContentRouter);
app.use("/api/parent", parentRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/languages", async (_req, res) => {
  const { rows } = await sharedPool.query("SELECT * FROM languages ORDER BY id").catch(() => ({
    rows: [
      { id: "en", code: "en", name: "English" },
      { id: "hi", code: "hi", name: "Hindi" },
      { id: "hinglish", code: "hinglish", name: "Hinglish" }
    ]
  }));
  res.json(rows);
});

app.get("/api/subjects", async (_req, res) => {
  const { rows } = await sharedPool.query("SELECT * FROM subjects ORDER BY id").catch(() => ({
    rows: [
      { id: "web-development", slug: "web-development", name: "Web Development", description: "Modern full-stack web development." },
      { id: "computer-science", slug: "computer-science", name: "Computer Science", description: "Core CS fundamentals." }
    ]
  }));
  res.json(rows);
});

app.post("/api/onboarding", (req, res) => {
  res.status(201).json({
    ok: true,
    student_dna_profile: req.body.student_dna_profile
  });
});

const memoryEvents: { user_id: string; event_name: string; feature: string; metadata: unknown; created_at: string }[] = [];

app.post("/api/analytics/events", async (req, res) => {
  const userId = String(req.body.userId || "demo-user");
  const eventName = String(req.body.eventName || "unknown");
  const feature = String(req.body.feature || eventName);
  const metadata = req.body.metadata || {};
  const createdAt = new Date().toISOString();

  memoryEvents.push({ user_id: userId, event_name: eventName, feature, metadata, created_at: createdAt });
  if (memoryEvents.length > 500) memoryEvents.shift();

  await sharedPool.query(
    `
    INSERT INTO analytics_events(user_id, event_name, feature, metadata)
    VALUES($1,$2,$3,$4)
    `,
    [userId, eventName, feature, metadata]
  ).catch(() => undefined);

  res.status(202).json({ ok: true });
});

app.get("/api/analytics/engagement", async (_req, res) => {
  const db = await sharedPool.query(
    `
    SELECT feature, COUNT(*)::int AS events, COUNT(DISTINCT user_id)::int AS users
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY feature
    ORDER BY events DESC
    LIMIT 10
    `
  ).catch(() => ({ rows: [] }));

  if (db.rows.length) return res.json({ features: db.rows });

  const fallback = Object.values(memoryEvents.reduce<Record<string, { feature: string; events: number; users: Set<string> }>>((acc, event) => {
    acc[event.feature] ||= { feature: event.feature, events: 0, users: new Set() };
    acc[event.feature].events += 1;
    acc[event.feature].users.add(event.user_id);
    return acc;
  }, {}))
    .map((item) => ({ feature: item.feature, events: item.events, users: item.users.size }))
    .sort((a, b) => b.events - a.events);

  res.json({
    features: fallback.length ? fallback : [
      { feature: "onboarding", events: 12, users: 5 },
      { feature: "ai_explanation", events: 8, users: 4 },
      { feature: "content", events: 6, users: 3 }
    ]
  });
});

app.get("/api/pricing", (_req, res) => {
  res.json({
    currency: "INR",
    region: "IN",
    plans: [
      { id: "starter", name: "Starter", amount: 0 },
      { id: "pro", name: "Pro", amount: 49900 },
      { id: "institute", name: "Institute", amount: null }
    ],
    paymentsEnabled: false
  });
});

app.post("/api/payments/checkout", (req, res) => {
  const planId = String(req.body.planId || "pro");
  res.status(201).json({
    ok: true,
    mode: "local_mock",
    planId,
    checkoutUrl: `/pricing?checkout=success&plan=${planId}`,
    message: "Local checkout approved. Connect Stripe/Razorpay in production."
  });
});

app.get("/api/admin/reviews/ai-content", async (_req, res) => {
  const db = await sharedPool.query(
    `
    SELECT
      a.id,
      a.topic,
      a.struggling_with,
      a.response,
      a.quality,
      a.review_status,
      a.created_at,
      COALESCE(ROUND(AVG(f.rating)::numeric, 2), 0) AS avg_rating,
      COUNT(f.*) AS feedback_count,
      COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'rating', f.rating,
        'comment', f.comment,
        'userId', f.user_id,
        'createdAt', f.created_at
      ) ORDER BY f.created_at DESC) FILTER (WHERE f.id IS NOT NULL), '[]') AS feedback
    FROM ai_generated_explanations a
    LEFT JOIN ai_explanation_feedback f ON f.explanation_id = a.id
    WHERE a.review_status = 'needs_human_review'
    GROUP BY a.id
    ORDER BY a.created_at DESC
    LIMIT 20
    `
  ).catch(() => ({ rows: [] }));

  res.json({
    items: db.rows.length ? db.rows : [
      {
        id: "demo-review-1",
        topic: "recursion",
        struggling_with: "base case",
        review_status: "needs_human_review",
        quality: { score: 76, needsHumanReview: true },
        response: { explanation: "Demo explanation pending review." },
        avg_rating: 0,
        feedback_count: 0,
        feedback: [],
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.post("/api/admin/reviews/ai-content/:id", async (req, res) => {
  const status = req.body.status === "rejected" ? "rejected" : "approved";
  await sharedPool.query(
    "UPDATE ai_generated_explanations SET review_status = $1, updated_at = NOW() WHERE id::text = $2",
    [status, req.params.id]
  ).catch(() => undefined);
  res.json({ ok: true, id: req.params.id, status });
});

app.post("/api/content/progress", async (req, res) => {
  const { userId, contentId, timeSpent, percentComplete } = req.body;
  if (!userId || !contentId) return res.status(400).json({ error: "userId and contentId required" });
  const consumed = Number(percentComplete || 0) >= 95;
  const { rows } = await sharedPool.query(
    `
    INSERT INTO content_progress(user_id, content_id, consumed, time_spent)
    VALUES($1, $2, $3, $4)
    ON CONFLICT(user_id, content_id)
    DO UPDATE SET consumed = content_progress.consumed OR EXCLUDED.consumed,
      time_spent = GREATEST(content_progress.time_spent, EXCLUDED.time_spent),
      updated_at = NOW()
    RETURNING *
    `,
    [userId, contentId, consumed, Number(timeSpent || 0)]
  ).catch(() => ({ rows: [{ user_id: userId, content_id: contentId, consumed, time_spent: Number(timeSpent || 0) }] }));
  res.status(202).json({
    ok: true,
    saved: rows[0]
  });
});

app.get("/api/subjects/:id/topics", async (req, res) => {
  const userId = String(req.query.userId || "demo-user");
  const { rows } = await sharedPool.query(
    `
    SELECT
      t.*,
      COALESCE(up.completed, false) AS completed,
      CASE
        WHEN t.position = 1 THEN true
        WHEN EXISTS (
          SELECT 1
          FROM topics prev
          JOIN user_progress p ON p.topic_id = prev.id
          WHERE prev.subject_id = t.subject_id
          AND prev.position = t.position - 1
          AND p.user_id = $2
          AND p.completed = true
        ) THEN true
        ELSE false
      END AS unlocked
    FROM topics t
    JOIN subjects s ON s.id = t.subject_id
    LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = $2
    WHERE s.slug = $1 OR s.id::text = $1
    ORDER BY t.position
    `,
    [req.params.id, userId]
  ).catch(() => ({
    rows: [
      { id: "recursion", position: 1, title: "Recursion", video_url: "https://www.youtube.com/embed/Mv9NEXX1VHc", completed: false, unlocked: true },
      { id: "arrays", position: 2, title: "Arrays", video_url: "https://www.youtube.com/embed/55l-aZ7_F24", completed: false, unlocked: true },
      { id: "react-components", position: 3, title: "React Components", video_url: "https://www.youtube.com/embed/SqcY0GlETPk", completed: false, unlocked: false }
    ]
  }));
  res.json(rows);
});

app.post("/api/topics/:id/complete", async (req, res) => {
  const userId = String(req.body.userId || "demo-user");
  const score = Number(req.body.score || 100);
  const { rows } = await sharedPool.query(
    `
    INSERT INTO user_progress(user_id, topic_id, completed, score, completed_at)
    VALUES($1, $2, true, $3, NOW())
    ON CONFLICT(user_id, topic_id)
    DO UPDATE SET completed = true, score = $3, completed_at = NOW()
    RETURNING *
    `,
    [userId, req.params.id, score]
  ).catch(() => ({ rows: [{ id: req.params.id, completed: true, score }] }));
  res.json(rows[0]);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`GuruAI API running on http://localhost:${port}`);
  startNotificationCron();
});
