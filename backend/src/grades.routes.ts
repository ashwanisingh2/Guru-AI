import { Router } from "express";
import { calculateUserGrades, getBadges, getGradeSummary, getLeaderboard, getTopicGrade } from "./grades.service";

export const gradesRouter = Router();

gradesRouter.get("/summary/:userId", async (req, res) => {
  const summary = await getGradeSummary(req.params.userId);
  if (!summary) return res.status(404).json({ error: "User not found" });
  res.json(summary);
});

gradesRouter.get("/topic/:topicId/:userId", async (req, res) => {
  const grade = await getTopicGrade(req.params.userId, req.params.topicId);
  if (!grade) return res.status(404).json({ error: "Topic grade not found" });
  res.json(grade);
});

gradesRouter.post("/calculate", async (req, res) => {
  if (!req.body.userId) return res.status(400).json({ error: "userId required" });
  await calculateUserGrades(req.body.userId);
  res.json({ ok: true });
});

export const badgesRouter = Router();

badgesRouter.get("/:userId", async (req, res) => {
  res.json(await getBadges(req.params.userId));
});

export const leaderboardRouter = Router();

leaderboardRouter.get("/:type", async (req, res) => {
  res.json({ users: await getLeaderboard(req.params.type) });
});
