"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";

type Lang = "hi" | "hinglish" | "es" | "ar";

export function AdminContentI18nPanel() {
  const [targetLang, setTargetLang] = useState<Lang>("hinglish");
  const [topicId, setTopicId] = useState("js-variables");
  const [title, setTitle] = useState("JavaScript Variables");
  const [description, setDescription] = useState("Learn how to declare and use variables in JavaScript.");
  const [translation, setTranslation] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function translate() {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/admin/content/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId,
        sourceLang: "en",
        targetLang,
        title,
        description,
        content: [{ type: "paragraph", text: description }],
        examples: [{ code: "let name = 'Rahul';", explanation: "Stores a string in a variable." }]
      })
    });
    setTranslation(await res.json());
    setLoading(false);
  }

  return (
    <section className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <div className="mx-auto max-w-5xl rounded border border-[#1f2937] bg-[#0b0f19] p-5">
        <h1 className="text-2xl font-semibold">Content i18n Admin</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-[#6b7280]">Topic ID</span>
            <input className="mt-1 w-full rounded border border-[#1f2937] bg-[#111827] p-3" value={topicId} onChange={(e) => setTopicId(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm text-[#6b7280]">Target Language</span>
            <select className="mt-1 w-full rounded border border-[#1f2937] bg-[#111827] p-3" value={targetLang} onChange={(e) => setTargetLang(e.target.value as Lang)}>
              <option value="hi">Hindi</option>
              <option value="hinglish">Hinglish</option>
              <option value="es">Spanish</option>
              <option value="ar">Arabic</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm text-[#6b7280]">English Title</span>
            <input className="mt-1 w-full rounded border border-[#1f2937] bg-[#111827] p-3" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm text-[#6b7280]">English Content</span>
            <textarea className="mt-1 h-32 w-full rounded border border-[#1f2937] bg-[#111827] p-3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>

        <button onClick={translate} disabled={loading} className="mt-5 rounded bg-[#4ade80] px-4 py-2 font-mono font-bold text-[#052e16] disabled:opacity-50">
          {loading ? "Translating..." : "AI Translate"}
        </button>

        {translation !== null && (
          <pre className={`mt-5 overflow-auto rounded border border-[#1f2937] bg-[#111827] p-4 font-mono text-xs ${targetLang === "ar" ? "rtl-content" : ""}`}>
            {JSON.stringify(translation, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}
