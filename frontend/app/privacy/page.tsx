"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Settings = {
  parentAccessApproved: boolean;
  hideScores: boolean;
  hideStudyTime: boolean;
  hideWeakAreas: boolean;
  hideAiChat: boolean;
};

export default function PrivacyPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/parent/privacy/demo-user`).then((r) => r.json()).then(setSettings);
  }, []);

  async function save(next: Settings) {
    setSettings(next);
    await fetch(`${API_URL}/api/parent/privacy/demo-user`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });
  }

  if (!settings) return <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">Loading...</main>;

  return (
    <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <div className="mx-auto max-w-2xl rounded border border-[#1f2937] bg-[#0b0f19] p-5">
        <h1 className="text-2xl font-semibold">Parent Privacy Settings</h1>
        {Object.entries(settings).map(([key, value]) => (
          <label key={key} className="mt-4 flex items-center justify-between rounded border border-[#1f2937] bg-[#111827] p-3">
            <span>{key}</span>
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={key === "hideAiChat"}
              onChange={(e) => save({ ...settings, [key]: e.target.checked })}
            />
          </label>
        ))}
        <p className="mt-4 text-sm text-[#6b7280]">AI mentor chat is always private.</p>
      </div>
    </main>
  );
}
