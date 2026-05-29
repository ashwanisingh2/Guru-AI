import { z } from "zod";

export const studentDnaSchema = z.object({
  userId: z.string().min(1),
  language: z.enum(["en", "hi", "hinglish", "es", "ar"]),
  goal: z.enum(["fullstack", "datascience", "ai", "cybersecurity", "cloud"]),
  currentLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  dailyTimeMinutes: z.number().int().min(30).max(360),
  learningStyles: z.array(z.enum(["video", "reading", "coding", "project"])).min(1),
  mentorPersonality: z.enum(["strict", "supportive", "chill", "corporate"]),
  weakAreas: z.array(z.string()).default([]),
  strongAreas: z.array(z.string()).default([]),
  preferredStudyTime: z.enum(["morning", "afternoon", "evening", "night"])
});

export type StudentDnaInput = z.infer<typeof studentDnaSchema>;
