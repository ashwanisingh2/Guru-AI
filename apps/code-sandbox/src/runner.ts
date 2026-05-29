import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/run", (_req, res) => {
  res.status(501).json({ error: "Sandbox runner not implemented yet" });
});

app.listen(5000, () => console.log("Code sandbox on :5000"));
