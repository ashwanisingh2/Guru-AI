import cors from "cors";
import express from "express";
import { authRouter } from "./auth.routes";
import { aiContentRouter } from "./aiContent.routes";
import { studentDnaRouter } from "./studentDna.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/ai", aiContentRouter);
app.use("/api/student/dna", studentDnaRouter);
