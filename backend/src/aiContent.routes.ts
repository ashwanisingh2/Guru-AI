import { Router } from "express";
import { ZodError, z } from "zod";
import { generateExplanation } from "./aiContent.service";

export const aiContentRouter = Router();

const generateSchema = z.object({
  topic: z.string().min(2).max(160),
  userId: z.string().min(1).max(180),
  strugglingWith: z.string().min(2).max(500),
  format: z.enum(["text", "visual", "code", "practice", "mixed"]).default("mixed")
});

aiContentRouter.post("/generate-explanation", async (req, res) => {
  try {
    const input = generateSchema.parse(req.body);
    const result = await generateExplanation(input);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    res.status(500).json({ error: "Explanation generation failed" });
  }
});
