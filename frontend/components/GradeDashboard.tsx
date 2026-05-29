"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Summary = { cgpa: string; total_credits: string; rank: string; streak: number };
type Badge = { code: string; name: string; description: string };
type Leader = { id: string; full_name: string; cgpa: string; points: string; rank: string };

export function GradeDashboard({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [badges, setBadges] = useState<{ earned: Badge[]; next: Badge[] }>({ earned: [], next: [] });
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/grades/summary/${userId}`).then((r) => r.json()).then(setSummary).catch(() => undefined);
    fetch(`${API_URL}/api/badges/${userId}`).then((r) => r.json()).then(setBadges).catch(() => undefined);
    fetch(`${API_URL}/api/leaderboard/weekly`).then((r) => r.json()).then((d) => setLeaders(d.users || [])).catch(() => undefined);
  }, [userId]);

  return (
    <section className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold">Grade Dashboard</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <Metric label="CGPA" value={summary?.cgpa || "0.00"} />
          <Metric label="Credits" value={summary?.total_credits || "0"} />
          <Metric label="Rank" value={summary?.rank ? `#${summary.rank}` : "#--"} />
          <Metric label="Streak" value={`${summary?.streak || 0} days`} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="Skill Badges">
            <div className="grid gap-3 sm:grid-cols-2">
              {badges.earned.map((badge) => (
                <div key={badge.code} className="rounded border border-[#4ade80]/50 bg-[#052e16]/40 p-3">
                  <div className="font-semibold">{badge.name}</div>
                  <div className="mt-1 text-sm text-[#6b7280]">{badge.description}</div>
                </div>
              ))}
              {badges.next.map((badge) => (
                <div key={badge.code} className="rounded border border-[#1f2937] bg-[#111827] p-3 opacity-70">
                  <div className="font-semibold">🔒 {badge.name}</div>
                  <div className="mt-1 text-sm text-[#6b7280]">{badge.description}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Weekly Leaderboard">
            <div className="space-y-2">
              {leaders.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded border border-[#1f2937] bg-[#111827] p-3">
                  <span>#{user.rank} {user.full_name}</span>
                  <span className="font-mono text-[#4ade80]">CGPA {user.cgpa}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#6b7280]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#4ade80]">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-[#1f2937] bg-[#0b0f19] p-4">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
