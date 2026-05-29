import { Router } from "express";

export const parentRouter = Router();

const demo = {
  child: { id: "demo-user", name: "Rahul Sharma", photo: "", currentSubject: "Web Development" },
  overview: { weeklyHours: 12.5, targetHours: 15, streak: 12, cgpa: 8.4, trend: "+0.3" },
  report: {
    topicsCompleted: ["HTML Forms", "CSS Grid", "Responsive Layout"],
    recentScores: [{ test: "CSS Mastery", score: 90 }, { test: "JS Basics", score: 72 }],
    timePerSubject: [{ subject: "Web Dev", hours: 9 }, { subject: "DSA", hours: 3.5 }],
    weakAreas: ["JavaScript Closures", "Async/Await", "Array Methods"]
  },
  comparison: {
    percentile: 80,
    dailyHours: 2.5,
    batchAvgHours: 3,
    strong: ["HTML", "CSS"],
    weak: ["JS"]
  },
  suggestions: [
    "Rahul struggles with JavaScript. Recommend extra practice.",
    "Study time inconsistent. Suggest fixed schedule.",
    "Consider Pro plan for 1-on-1 mentoring."
  ],
  notifications: ["Weekly email report: Sunday", "Alert: no activity for 2 days", "Milestone celebrations enabled"]
};

parentRouter.get("/dashboard/:studentId", (_req, res) => {
  res.json(demo);
});

parentRouter.get("/privacy/:studentId", (_req, res) => {
  res.json({
    parentAccessApproved: true,
    hideScores: false,
    hideStudyTime: false,
    hideWeakAreas: false,
    hideAiChat: true
  });
});

parentRouter.put("/privacy/:studentId", (req, res) => {
  res.json({ ok: true, settings: { ...req.body, hideAiChat: true } });
});
