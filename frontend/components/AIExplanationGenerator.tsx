"use client";

import { useState } from "react";
import { api, trackEvent } from "@/lib/api";

type Explanation = {
  explanation: string;
  visual?: { title: string; steps: string[] };
  codeExample: string;
  practiceProblems: { difficulty: string; prompt: string; hint: string }[];
  realWorldExample: string;
  estimatedTime: string;
  cached?: boolean;
  reviewStatus?: string;
};

export function AIExplanationGenerator({ userId, topic }: { userId: string; topic: string }) {
  const [strugglingWith, setStrugglingWith] = useState("base case concept");
  const [result, setResult] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const data = await api<Explanation>("/api/ai/generate-explanation", {
        method: "POST",
        body: { topic, userId, strugglingWith, format: "mixed" }
      });
      setResult(data);
      trackEvent("ai_explanation_generated", "ai_explanation", { topic, strugglingWith });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded border border-[#1f2937] bg-[#0b0f19] p-4 text-[#f9fafb]">
      <h2 className="text-lg font-semibold">AI Personalized Explanation</h2>
      <div className="mt-3 flex gap-2">
        <input className="min-w-0 flex-1 rounded border border-[#1f2937] bg-[#111827] px-3 py-2 outline-none" value={strugglingWith} onChange={(e) => setStrugglingWith(e.target.value)} />
        <button disabled={loading} onClick={generate} className="rounded bg-[#4ade80] px-4 py-2 font-mono text-sm font-bold text-[#052e16] disabled:opacity-50">
          Generate
        </button>
      </div>

      {result && (
        <div className="mt-4 space-y-4 text-sm leading-6">
          <p>{result.explanation}</p>
          {result.visual && (
            <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
              <div className="font-semibold text-[#4ade80]">{result.visual.title}</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {result.visual.steps.map((step, index) => (
                  <div key={step} className="rounded border border-[#1f2937] bg-[#0a0c14] p-3">
                    <div className="mb-2 font-mono text-xs text-[#4ade80]">CALL {index + 1}</div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <pre className="overflow-auto rounded bg-black p-3 font-mono text-xs">{result.codeExample}</pre>
          <div>
            <div className="font-semibold text-[#4ade80]">Practice</div>
            <ul className="mt-2 space-y-2">
              {result.practiceProblems.map((problem) => <li key={problem.prompt}><b>{problem.difficulty}:</b> {problem.prompt} <span className="text-[#6b7280]">Hint: {problem.hint}</span></li>)}
            </ul>
          </div>
          <p className="text-[#c7d2fe]">{result.realWorldExample}</p>
          <div className="font-mono text-xs text-[#6b7280]">{result.estimatedTime} · {result.cached ? "cached" : "new"} · {result.reviewStatus}</div>
        </div>
      )}
    </section>
  );
}
