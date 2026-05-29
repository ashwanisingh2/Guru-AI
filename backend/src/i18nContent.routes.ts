import { Router } from "express";
import { aiTranslateContent, getLocalizedContent, saveTranslation } from "./i18nContent.service";

export const i18nContentRouter = Router();
export const adminContentRouter = Router();

i18nContentRouter.get("/:topicId", async (req, res) => {
  const content = await getLocalizedContent(req.params.topicId, String(req.query.lang || "en"));
  if (!content) return res.status(404).json({ error: "Content not found" });
  res.json(content);
});

adminContentRouter.post("/translate", async (req, res) => {
  const { topicId, sourceLang, targetLang, title, description, content, examples } = req.body;
  if (!topicId || sourceLang !== "en" || !targetLang || !title) {
    return res.status(400).json({ error: "topicId, sourceLang=en, targetLang, title required" });
  }

  const translated = await aiTranslateContent({ topicId, sourceLang, targetLang, title, description, content: content || [], examples: examples || [] });
  const saved = await saveTranslation({ topicId, sourceLang, targetLang, title, description, content: content || [], examples: examples || [] }, translated);
  res.status(201).json({ translation: saved });
});
