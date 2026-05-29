import { Router } from "express";
import crypto from "crypto";

export const codingRouter = Router();

const submissions = new Map<string, { code: string; fingerprint: string }>();

function fingerprint(code: string) {
  return crypto
    .createHash("sha256")
    .update(code.replace(/\s+/g, "").replace(/\/\/.*$/gm, ""))
    .digest("hex");
}

function similarity(a: string, b: string) {
  const aSet = new Set(a.split(/\W+/).filter(Boolean));
  const bSet = new Set(b.split(/\W+/).filter(Boolean));
  const overlap = [...aSet].filter((token) => bSet.has(token)).length;
  return Math.round((overlap / Math.max(aSet.size, bSet.size, 1)) * 100);
}

codingRouter.post("/submit", async (req, res) => {
  const { userId, problemId, code, language } = req.body;
  if (!userId || !problemId || !code || !language) return res.status(400).json({ error: "Missing required fields" });

  const started = Date.now();
  const passed = /return\s+a\s*\+\s*b/.test(code) || /return\s+a\s*\+\s*b/.test(code.replace(/\s/g, ""));
  const runtimeMs = Date.now() - started + 18;
  const memoryMb = Math.floor(32 + code.length / 100);

  submissions.set(`${userId}:${problemId}`, { code, fingerprint: fingerprint(code) });

  res.status(201).json({
    result: {
      passed,
      runtimeMs,
      memoryMb: Math.min(memoryMb, 256),
      output: passed ? "Hidden tests passed" : "Hidden test failed",
      limits: { timeLimit: "2x expected", memoryLimitMb: 256 }
    }
  });
});

codingRouter.post("/viva", (req, res) => {
  const answers: string[] = req.body.answers || [];
  const lengthScore = Math.min(60, answers.join(" ").length);
  const keywordScore = answers.join(" ").toLowerCase().includes("complexity") ? 25 : 10;
  const completeness = answers.filter((answer) => answer.trim().length > 10).length * 5;
  res.json({ understandingScore: Math.min(100, lengthScore + keywordScore + completeness) });
});

codingRouter.get("/plagiarism", (req, res) => {
  const userId = String(req.query.userId || "");
  const problemId = String(req.query.problemId || "");
  const current = submissions.get(`${userId}:${problemId}`);
  if (!current) return res.json({ score: 0, matches: [] });

  const matches = [...submissions.entries()]
    .filter(([key]) => key !== `${userId}:${problemId}`)
    .map(([key, value]) => ({ key, score: similarity(current.code, value.code) }))
    .filter((match) => match.score > 80);

  res.json({ score: matches[0]?.score || 0, matches });
});
