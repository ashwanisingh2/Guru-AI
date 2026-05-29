import { Router } from "express";
import { ZodError } from "zod";
import { requireAuth, type AuthRequest } from "./auth";
import { createProfile, generateLearningPath, getProfile, updateProfile } from "./studentDna.service";
import { studentDnaSchema } from "./studentDna.schema";

export const studentDnaRouter = Router();

studentDnaRouter.use(requireAuth);

studentDnaRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const input = studentDnaSchema.parse(req.body);
    if (req.auth?.userId !== input.userId) return res.status(403).json({ error: "Forbidden" });

    const generatedPath = await generateLearningPath(input);
    const profile = await createProfile(input, generatedPath);
    res.status(201).json({ profile, generatedPath });
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    res.status(500).json({ error: "Failed to create student DNA profile" });
  }
});

studentDnaRouter.get("/:userId", async (req: AuthRequest, res) => {
  try {
    if (req.auth?.userId !== req.params.userId) return res.status(403).json({ error: "Forbidden" });
    const profile = await getProfile(req.params.userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json({ profile });
  } catch {
    res.status(500).json({ error: "Failed to retrieve student DNA profile" });
  }
});

studentDnaRouter.put("/:userId", async (req: AuthRequest, res) => {
  try {
    if (req.auth?.userId !== req.params.userId) return res.status(403).json({ error: "Forbidden" });
    const input = studentDnaSchema.parse({ ...req.body, userId: req.params.userId });
    const result = await updateProfile(req.params.userId, input);
    if (!result.profile) return res.status(404).json({ error: "Profile not found" });
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    res.status(500).json({ error: "Failed to update student DNA profile" });
  }
});
