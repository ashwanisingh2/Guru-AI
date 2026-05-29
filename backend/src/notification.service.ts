import sendgrid from "@sendgrid/mail";
import admin from "firebase-admin";
import type { WebSocketServer } from "ws";
import { pool } from "./db";

export type NotificationType =
  | "SCHEDULED_STUDY_REMINDER"
  | "STREAK_WARNING"
  | "MASTERY_CELEBRATION"
  | "STRUGGLE_DETECTION"
  | "GOAL_PROGRESS";

export type MentorTone = "strict" | "supportive" | "chill" | "corporate";

type NotificationPayload = {
  userId: string;
  type: NotificationType;
  tone: MentorTone;
  name?: string;
  topic?: string;
  score?: number;
  goal?: string;
  progress?: number;
  deepLink?: string;
};

type DeliveryPrefs = {
  fcmToken?: string;
  email?: string;
  inAppOnline?: boolean;
};

export class NotificationService {
  constructor(private wss?: WebSocketServer) {
    if (process.env.SENDGRID_API_KEY) sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    }
  }

  generateMessage(payload: NotificationPayload) {
    const name = payload.name || "Student";
    const topic = payload.topic || "today's topic";

    if (payload.type === "SCHEDULED_STUDY_REMINDER") {
      return `${name}, it's your coding time. Today: ${topic}.`;
    }

    if (payload.type === "STREAK_WARNING") {
      return {
        strict: "24 hours left. Don't break your streak. Discipline.",
        supportive: "Hey, you haven't studied today. Just 30 minutes?",
        chill: "Bro where you at? Streak dying in 4 hours.",
        corporate: "Consistency is key in tech. Log in today."
      }[payload.tone];
    }

    if (payload.type === "MASTERY_CELEBRATION") {
      return `${topic} CRUSHED! ${payload.score || 90}%! You're ready for the next topic!`;
    }

    if (payload.type === "STRUGGLE_DETECTION") {
      return {
        strict: "Stop. Watch the basics again. You're not ready.",
        supportive: "This is hard. Let's try a different approach. Video or text?",
        chill: "Bro this topic is tough. Want me to explain differently?",
        corporate: "Gap in fundamentals detected. Recommending prerequisite review."
      }[payload.tone];
    }

    return `Week done! ${payload.progress || 0}% towards ${payload.goal || "your goal"}. Keep going.`;
  }

  selectChannels(prefs: DeliveryPrefs) {
    if (prefs.inAppOnline) return ["websocket"];
    if (prefs.fcmToken) return ["push"];
    if (prefs.email) return ["email"];
    return ["database"];
  }

  async deliver(payload: NotificationPayload, prefs: DeliveryPrefs) {
    const message = this.generateMessage(payload);
    const channels = this.selectChannels(prefs);

    await pool.query(
      `
      INSERT INTO notifications(user_id, title, body, metadata, scheduled_for)
      VALUES($1, $2, $3, $4, NOW())
      `,
      [payload.userId, payload.type, message, { deepLink: payload.deepLink, channels }]
    ).catch(() => undefined);

    if (channels.includes("websocket")) this.sendWebSocket(payload.userId, { ...payload, message });
    if (channels.includes("push") && prefs.fcmToken) await this.sendPush(prefs.fcmToken, payload.type, message, payload.deepLink);
    if (channels.includes("email") && prefs.email) await this.sendEmail(prefs.email, payload.type, message, payload.deepLink);

    return { message, channels };
  }

  sendWebSocket(userId: string, data: unknown) {
    this.wss?.clients.forEach((client) => {
      if (client.readyState === 1) client.send(JSON.stringify({ userId, ...data as object }));
    });
  }

  async sendPush(token: string, title: string, body: string, deepLink?: string) {
    if (!admin.apps.length) return;
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: { deepLink: deepLink || "" }
    });
  }

  async sendEmail(email: string, subject: string, body: string, deepLink?: string) {
    if (!process.env.SENDGRID_API_KEY) return;
    await sendgrid.send({
      to: email,
      from: process.env.NOTIFICATION_FROM_EMAIL || "noreply@guru.ai",
      subject,
      text: deepLink ? `${body}\n${deepLink}` : body
    });
  }
}
