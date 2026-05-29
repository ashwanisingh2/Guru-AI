import { Router } from "express";
import OpenAI from "openai";
import { assembleMentorContext, buildActions, detectEmotion, fallbackReply, remember, resolvePersonality } from "./mentor.service";
import { mentorPrompts } from "./mentor.prompts";

export const mentorRouter = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing" });

mentorRouter.post("/chat", async (req, res) => {
  try {
    const { userId, message, context = {} } = req.body;
    if (!userId || !message) return res.status(400).json({ error: "userId and message are required" });

    const assembled = await assembleMentorContext(userId, context);
    const personality = resolvePersonality(assembled);
    const emotion = detectEmotion(message);
    const actions = buildActions(emotion, context);

    remember(userId, "user", message);

    let reply = fallbackReply(personality, message, context);
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [
          { role: "system", content: mentorPrompts[personality].system },
          { role: "system", content: `Context JSON: ${JSON.stringify(assembled)}` },
          { role: "user", content: message }
        ],
        temperature: 0.4
      });
      reply = completion.choices[0]?.message?.content || reply;
    }

    remember(userId, "assistant", reply);

    res.json({
      reply,
      tone: mentorPrompts[personality].tone,
      actions,
      emotion_detected: emotion
    });
  } catch {
    res.status(500).json({ error: "Mentor chat failed" });
  }
});
