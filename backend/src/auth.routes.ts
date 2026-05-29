import { Router } from "express";
import { ZodError, z } from "zod";
import { createUser, findUserByEmail, signToken, verifyPassword } from "./auth.service";

export const authRouter = Router();

const signupSchema = z.object({
  fullName: z.string().min(1).default("Demo User"),
  email: z.string().min(1),
  password: z.string().min(1),
  preferredLanguage: z.enum(["en", "hi", "hinglish", "es", "ar"]).optional()
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

authRouter.post("/signup", async (req, res) => {
  try {
    const input = signupSchema.parse(req.body);
    const user = await createUser(input);
    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    if (String((error as { code?: string }).code) === "23505") return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Signup failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    if (process.env.DISABLE_AUTH === "true" || process.env.NODE_ENV !== "production") {
      const user = {
        id: "11111111-1111-1111-1111-111111111111",
        full_name: "Demo User",
        email: input.email,
        role: "student",
        preferred_language: "en"
      };
      return res.json({ user, token: signToken(user) });
    }

    const user = await findUserByEmail(input.email);
    if (!user?.password_hash || !verifyPassword(input.password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token: signToken(user) });
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    res.status(500).json({ error: "Login failed" });
  }
});
