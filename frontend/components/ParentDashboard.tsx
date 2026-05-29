"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type ParentData = {
  child: { name: string; photo: string; currentSubject: string };
  overview: { weeklyHours: number; targetHours: number; streak: number; cgpa: number; trend: string };
  report: { topicsCompleted: string[]; recentScores: { test: string; score: number }[]; timePerSubject: { subject: string; hours: number }[]; weakAreas: string[] };
  comparison: { percentile: number; dailyHours: number; batchAvgHours: number; strong: string[]; weak: string[] };
  suggestions: string[];
  notifications: string[];
};

export function ParentDashboard({ studentId }: { studentId: string }) {
  const [data, setData] = useState<ParentData | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/parent/dashboard/${studentId}`).then((r) => r.json()).then(setData);
  }, [studentId]);

  if (!data) return <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">Loading...</main>;

  return (
    <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold">Parent Progress Dashboard</h1>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Panel title="Overview">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#111827] text-2xl">👨‍🎓</div>
              <div>
                <div className="text-xl font-semibold">{data.child.name}</div>
                <div className="text-sm text-[#6b7280]">{data.child.currentSubject}</div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Study Hours" value={`${data.overview.weeklyHours}/${data.overview.targetHours}`} />
              <Metric label="Streak" value={`${data.overview.streak} days`} />
              <Metric label="CGPA" value={`${data.overview.cgpa}`} />
              <Metric label="Trend" value={data.overview.trend} />
            </div>
          </Panel>

          <Panel title="Progress Report">
            <div className="grid gap-4 md:grid-cols-2">
              <List title="Topics completed this week" items={data.report.topicsCompleted} />
              <List title="Weak areas identified by AI" items={data.report.weakAreas} danger />
              <div>
                <h3 className="mb-2 font-semibold">Recent Tests</h3>
                {data.report.recentScores.map((item) => <Row key={item.test} left={item.test} right={`${item.score}%`} />)}
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Time per Subject</h3>
                {data.report.timePerSubject.map((item) => <Row key={item.subject} left={item.subject} right={`${item.hours}h`} />)}
              </div>
            </div>
          </Panel>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <Panel title="Comparison">
            <p>Rahul is in top <span className="text-[#4ade80]">{100 - data.comparison.percentile}%</span> of his batch.</p>
            <p className="mt-3">Studies {data.comparison.dailyHours} hrs/day vs batch avg {data.comparison.batchAvgHours} hrs.</p>
            <p className="mt-3">Strong in: {data.comparison.strong.join(", ")}</p>
            <p className="mt-1 text-[#f59e0b]">Weak in: {data.comparison.weak.join(", ")}</p>
          </Panel>

          <Panel title="AI Suggestions">
            <List items={data.suggestions} />
          </Panel>

          <Panel title="Notifications">
            <List items={data.notifications} />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded border border-[#1f2937] bg-[#0b0f19] p-4"><h2 className="mb-4 text-lg font-semibold">{title}</h2>{children}</section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-[#1f2937] bg-[#111827] p-3"><div className="text-sm text-[#6b7280]">{label}</div><div className="mt-1 text-xl text-[#4ade80]">{value}</div></div>;
}

function List({ title, items, danger }: { title?: string; items: string[]; danger?: boolean }) {
  return <div>{title && <h3 className="mb-2 font-semibold">{title}</h3>}<ul className="space-y-2">{items.map((x) => <li key={x} className={`rounded border border-[#1f2937] bg-[#111827] p-2 ${danger ? "text-[#f59e0b]" : ""}`}>{x}</li>)}</ul></div>;
}

function Row({ left, right }: { left: string; right: string }) {
  return <div className="mb-2 flex justify-between rounded border border-[#1f2937] bg-[#111827] p-2"><span>{left}</span><span className="font-mono text-[#4ade80]">{right}</span></div>;
}
