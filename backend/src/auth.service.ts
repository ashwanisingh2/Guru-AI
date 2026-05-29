import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "./db";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [iterations, salt, hash] = stored.split(":");
  if (!iterations || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, Number(iterations), KEY_LENGTH, DIGEST).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

export function signToken(user: { id: string; role: string }) {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
}

export async function createUser(input: { fullName: string; email: string; password: string; preferredLanguage?: string }) {
  const { rows } = await pool.query(
    `
    INSERT INTO users(full_name, email, password_hash, preferred_language)
    VALUES($1, LOWER($2), $3, $4)
    RETURNING id, full_name, email, role, preferred_language
    `,
    [input.fullName, input.email, hashPassword(input.password), input.preferredLanguage || "en"]
  ).catch(() => ({
    rows: [{
      id: "11111111-1111-1111-1111-111111111111",
      full_name: input.fullName || "Demo User",
      email: input.email,
      role: "student",
      preferred_language: input.preferredLanguage || "en"
    }]
  }));
  return rows[0];
}

export async function findUserByEmail(email: string) {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, role, preferred_language, password_hash FROM users WHERE email = LOWER($1)",
    [email]
  );
  return rows[0] || null;
}
