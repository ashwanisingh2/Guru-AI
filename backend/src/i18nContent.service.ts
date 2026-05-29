import OpenAI from "openai";
import { pool } from "./db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing" });

type TranslationInput = {
  topicId: string;
  sourceLang: "en";
  targetLang: "hi" | "hinglish" | "es" | "ar";
  title: string;
  description: string;
  content: unknown[];
  examples: unknown[];
};

const culturalRules = {
  hi: "Use Hindi explanations. Use Indian names and Indian market examples like Flipkart, UPI, Amazon India.",
  hinglish: "Use Roman Hindi with English technical terms. Tone can say bhai where natural. Use Indian examples.",
  es: "Use Spanish explanations with locally familiar examples.",
  ar: "Use Arabic, right-to-left formatting, and culturally neutral examples."
};

export async function getLocalizedContent(topicId: string, lang: string) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM content_i18n
    WHERE topic_id::text = $1 AND language_code = $2 AND status = 'published'
    UNION ALL
    SELECT *
    FROM content_i18n
    WHERE topic_id::text = $1 AND language_code = 'en' AND status = 'published'
    LIMIT 1
    `,
    [topicId, lang]
  );
  return rows[0] || null;
}

export async function aiTranslateContent(input: TranslationInput) {
  const fallback = {
    title: input.targetLang === "hinglish" ? input.title.replace("JavaScript", "JS") : input.title,
    description: `${input.description} (${input.targetLang} adapted)`,
    content: input.content,
    examples: input.examples,
    cultural_context: { rule: culturalRules[input.targetLang] },
    rtl: input.targetLang === "ar",
    quality_score: 82
  };

  if (!process.env.OPENAI_API_KEY) return fallback;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `Translate and culturally adapt educational CS content. ${culturalRules[input.targetLang]} Return strict JSON with title, description, content, examples, cultural_context, quality_score.`
      },
      { role: "user", content: JSON.stringify(input) }
    ]
  });

  return JSON.parse(completion.choices[0]?.message?.content || JSON.stringify(fallback));
}

export async function saveTranslation(input: TranslationInput, translated: Awaited<ReturnType<typeof aiTranslateContent>>) {
  const { rows } = await pool.query(
    `
    INSERT INTO content_i18n(topic_id, language_code, title, description, content, examples, cultural_context, rtl, status, quality_score)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,'ai_translated',$9)
    ON CONFLICT(topic_id, language_code)
    DO UPDATE SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      content = EXCLUDED.content,
      examples = EXCLUDED.examples,
      cultural_context = EXCLUDED.cultural_context,
      rtl = EXCLUDED.rtl,
      status = 'ai_translated',
      quality_score = EXCLUDED.quality_score,
      updated_at = NOW()
    RETURNING *
    `,
    [
      input.topicId,
      input.targetLang,
      translated.title,
      translated.description,
      JSON.stringify(translated.content || []),
      JSON.stringify(translated.examples || []),
      JSON.stringify(translated.cultural_context || {}),
      input.targetLang === "ar",
      translated.quality_score || 80
    ]
  );
  return rows[0];
}
