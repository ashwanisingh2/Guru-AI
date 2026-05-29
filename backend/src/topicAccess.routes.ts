import { Router } from "express";
import { requireAuth, type AuthRequest } from "./auth";
import { completeTopic, getTopicAccess, getTopicProgress, recordAttempt } from "./topicAccess.service";

export const topicAccessRouter = Router();

function errorStatus(result: unknown) {
  return typeof result === "object" && result !== null && "status" in result && typeof result.status === "number"
    ? result.status
    : 400;
}

topicAccessRouter.use(requireAuth);

topicAccessRouter.get("/:topicId/access", async (req: AuthRequest, res) => {
  try {
    const result = await getTopicAccess(req.auth!.userId, (req.auth!.role || "student") as never, req.params.topicId);
    if (!result) return res.status(404).json({ error: "Topic not found" });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to check topic access" });
  }
});

topicAccessRouter.get("/:topicId/progress", async (req: AuthRequest, res) => {
  try {
    const progress = await getTopicProgress(req.auth!.userId, req.params.topicId);
    res.json({
      status: progress.status,
      score: Number(progress.score),
      attempts: Number(progress.attempts),
      nextRetryAt: progress.next_retry_at
    });
  } catch {
    res.status(500).json({ error: "Failed to load topic progress" });
  }
});

topicAccessRouter.post("/:topicId/attempt", async (req: AuthRequest, res) => {
  try {
    const score = Number(req.body.score);
    const codingPassed = Boolean(req.body.codingPassed);
    if (!Number.isInteger(score) || score < 0 || score > 100) return res.status(400).json({ error: "score must be 0-100" });

    const result = await recordAttempt(req.auth!.userId, req.params.topicId, score, codingPassed);
    if (!result.ok) return res.status(errorStatus(result)).json(result);
    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: "Failed to record attempt" });
  }
});

topicAccessRouter.post("/:topicId/complete", async (req: AuthRequest, res) => {
  try {
    const result = await completeTopic(req.auth!.userId, req.params.topicId);
    if (!result.ok) return res.status(errorStatus(result)).json(result);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to complete topic" });
  }
});
