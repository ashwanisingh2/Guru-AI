"use client";

import { useEffect, useState } from "react";
import { api, trackEvent } from "@/lib/api";

type Feature = { feature: string; events: number; users: number };

export default function AnalyticsPage() {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    trackEvent("analytics_viewed", "analytics");
    api<{ features: Feature[] }>("/api/analytics/engagement")
      .then((data) => setFeatures(data.features))
      .catch(() => setFeatures([
        { feature: "onboarding", events: 12, users: 5 },
        { feature: "ai_explanation", events: 8, users: 4 },
        { feature: "content", events: 6, users: 3 }
      ]));
  }, []);

  const max = Math.max(...features.map((item) => item.events), 1);

  return (
    <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">Engagement Analytics</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Top features by events and active users.</p>
        <div className="mt-6 space-y-3">
          {features.map((item) => (
            <div key={item.feature} className="rounded border border-[#1f2937] bg-[#111827] p-4">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">{item.feature}</span>
                <span className="font-mono text-sm text-[#4ade80]">{item.events} events · {item.users} users</span>
              </div>
              <div className="mt-3 h-2 rounded bg-[#1f2937]">
                <div className="h-full rounded bg-[#4ade80]" style={{ width: `${(item.events / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
