import crypto from "crypto";
import OpenAI from "openai";
import { pool } from "./db";
import { personalizedExplanationPrompt } from "./aiContent.prompts";

type GenerateInput = {
  topic: string;
  userId: string;
  strugglingWith: string;
  format: "text" | "visual" | "code" | "practice" | "mixed";
};

type StudentProfile = {
  name?: string;
  goal: string;
  currentLevel: string;
  language: string;
  learningStyles: string[];
  weakAreas: string[];
  strongAreas: string[];
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing" });

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildCacheKey(input: GenerateInput, profile: StudentProfile) {
  const basis = [
    normalize(input.topic),
    normalize(input.strugglingWith),
    input.format,
    normalize(profile.goal),
    normalize(profile.currentLevel),
    normalize(profile.language),
    profile.learningStyles.map(normalize).sort().join(",")
  ].join("|");

  return crypto.createHash("sha256").update(basis).digest("hex").slice(0, 40);
}

export async function getStudentProfile(userId: string): Promise<StudentProfile> {
  const { rows } = await pool.query(
    `
    SELECT u.full_name, u.preferred_language, d.goal, d.current_level, d.language,
      d.learning_styles, d.weak_areas, d.strong_areas
    FROM users u
    LEFT JOIN student_dna_profiles d ON d.user_id = u.id
    WHERE u.id::text = $1 OR u.email = LOWER($1)
    LIMIT 1
    `,
    [userId]
  ).catch(() => ({ rows: [] }));

  const row = rows[0] || {};
  return {
    name: row.full_name,
    goal: row.goal || "fullstack",
    currentLevel: row.current_level || "beginner",
    language: row.language || row.preferred_language || "hinglish",
    learningStyles: row.learning_styles || ["reading", "coding"],
    weakAreas: row.weak_areas || [],
    strongAreas: row.strong_areas || []
  };
}

function fallbackContent(input: GenerateInput, profile: StudentProfile) {
  const isHinglish = profile.language === "hinglish" || profile.language === "hi";
  return {
    explanation: isHinglish
      ? `${input.topic} ko simple blocks me socho. Problem ka sabse chhota answer base case hai; baaki answer wahi function chhote input par dobara chala kar milta hai.`
      : `Think of ${input.topic} as solving a big problem by reducing it to smaller versions until the base case answers the smallest one.`,
    visual: {
      type: "call_stack",
      title: `${input.topic} call stack`,
      steps: ["Call starts", "Input gets smaller", "Base case returns", "Each waiting call resolves"]
    },
    codeExample: `function factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n - 1);\n}`,
    practiceProblems: [
      { difficulty: "easy", prompt: "Identify the base case in factorial.", hint: "Find when recursion stops." },
      { difficulty: "easy", prompt: "Trace factorial(3) by hand.", hint: "Write each call on a new line." },
      { difficulty: "medium", prompt: "Write sum(n) recursively.", hint: "sum(n) = n + sum(n - 1)." },
      { difficulty: "medium", prompt: "Reverse a string recursively.", hint: "Move first char to the end." },
      { difficulty: "hard", prompt: "Render a nested comment tree recursively.", hint: "Each comment can have children." }
    ],
    realWorldExample: profile.goal.includes("full")
      ? "React component trees and nested comments are naturally recursive."
      : "Folder trees, org charts, and dependency graphs are naturally recursive.",
    estimatedTime: "15 minutes"
  };
}

export function qualityCheck(content: ReturnType<typeof fallbackContent>) {
  const problems = Array.isArray(content.practiceProblems) ? content.practiceProblems.length : 0;
  const score = [
    content.explanation.length >= 80,
    content.codeExample.length >= 40,
    problems === 5,
    content.realWorldExample.length >= 20,
    content.visual.steps.length >= 3
  ].filter(Boolean).length * 20;

  return {
    score,
    needsHumanReview: score < 80 || Math.random() < 0.05,
    checks: { hasExplanation: true, practiceProblemCount: problems, hasVisual: Boolean(content.visual), hasCode: Boolean(content.codeExample) }
  };
}

export async function generateExplanation(input: GenerateInput) {
  const profile = await getStudentProfile(input.userId);
  const cacheKey = buildCacheKey(input, profile);

  const cached = await pool.query(
    "SELECT id, response, quality, review_status FROM ai_generated_explanations WHERE cache_key = $1",
    [cacheKey]
  ).catch(() => ({ rows: [] }));
  if (cached.rows[0]) return { ...cached.rows[0].response, cached: true, quality: cached.rows[0].quality, reviewStatus: cached.rows[0].review_status, explanationId: cached.rows[0].id };

  let response = fallbackContent(input, profile);
  if (process.env.OPENAI_API_KEY) {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.3,
      messages: [{ role: "user", content: personalizedExplanationPrompt({ ...input, profile }) }],
      response_format: { type: "json_object" }
    });
    response = { ...response, ...JSON.parse(completion.choices[0]?.message?.content || "{}") };
  }

  const quality = qualityCheck(response);
  const reviewStatus = quality.needsHumanReview ? "needs_human_review" : "auto_approved";

  const stored = await pool.query(
    `
    INSERT INTO ai_generated_explanations(cache_key, user_id, topic, struggling_with, format, profile_snapshot, response, quality, review_status)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT(cache_key) DO UPDATE SET updated_at = NOW()
    RETURNING id
    `,
    [cacheKey, input.userId, input.topic, input.strugglingWith, input.format, profile, response, quality, reviewStatus]
  ).catch(() => ({ rows: [] }));

  const explanationId = stored.rows[0]?.id;
  return { ...response, cached: false, quality, reviewStatus, explanationId };
}

export async function saveExplanationFeedback(input: { explanationId: string; userId: string; rating?: number; comment?: string }) {
  await pool.query(
    `
    INSERT INTO ai_explanation_feedback(explanation_id, user_id, rating, comment)
    VALUES($1, $2, $3, $4)
    `,
    [input.explanationId, input.userId, input.rating || null, input.comment || null]
  ).catch(() => undefined);
}

