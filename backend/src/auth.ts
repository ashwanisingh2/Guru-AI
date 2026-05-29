import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & {
  auth?: { userId: string; role?: string };
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (process.env.DISABLE_AUTH === "true" || process.env.NODE_ENV !== "production") {
    req.auth = {
      userId: String(req.headers["x-user-id"] || req.body?.userId || req.query.userId || "11111111-1111-1111-1111-111111111111"),
      role: String(req.headers["x-user-role"] || "student")
    };
    return next();
  }

  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret) as {
      userId: string;
      role?: string;
    };
    req.auth = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
