import { Router } from "express";
import { NotificationService, type MentorTone, type NotificationType } from "./notification.service";

export const notificationRouter = Router();
const service = new NotificationService();

notificationRouter.post("/send", async (req, res) => {
  const { userId, type, tone, email, fcmToken, name, topic, score, goal, progress, deepLink } = req.body;
  if (!userId || !type || !tone) return res.status(400).json({ error: "userId, type, tone required" });

  const result = await service.deliver(
    { userId, type: type as NotificationType, tone: tone as MentorTone, name, topic, score, goal, progress, deepLink },
    { email, fcmToken, inAppOnline: false }
  );

  res.status(202).json(result);
});
