"use client";

import Link from "next/link";

const topics = [
  { name: "HTML", percent: 100, status: "DONE" },
  { name: "CSS", percent: 90, status: "DONE" },
  { name: "JavaScript", percent: 60, status: "CURRENT" },
  { name: "React", percent: 0, status: "LOCKED" }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Good Evening, Rahul</h1>
            <p className="mt-1 text-sm text-[#6b7280]">Local testing dashboard</p>
          </div>
          <Link href="/topics" className="rounded bg-[#4ade80] px-4 py-2 font-mono text-sm font-bold text-[#052e16]">Start Learning</Link>
          <div className="flex gap-2">
            <Link href="/analytics" className="rounded border border-[#1f2937] px-4 py-2 font-mono text-sm">Analytics</Link>
            <Link href="/admin/reviews" className="rounded border border-[#1f2937] px-4 py-2 font-mono text-sm">Review</Link>
            <Link href="/pricing" className="rounded border border-[#1f2937] px-4 py-2 font-mono text-sm">Pricing</Link>
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <Metric value="12" label="Day Streak" />
          <Metric value="8.4" label="CGPA /10" />
          <Metric value="#15" label="Rank /500" />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Your Progress">
            <div className="mb-5">
              <div className="mb-2 flex justify-between text-sm">
                <span>Full-Stack Developer</span>
                <span className="font-mono text-[#4ade80]">78%</span>
              </div>
              <Bar value={78} />
            </div>
            <div className="space-y-3">
              {topics.map((topic) => (
                <Link key={topic.name} href={topic.status === "LOCKED" ? "/dashboard" : "/content"} className="block rounded border border-[#1f2937] bg-[#111827] p-3 hover:border-[#4ade80]/60">
                  <div className="flex justify-between gap-3">
                    <span>{topic.status} {topic.name}</span>
                    <span className="font-mono text-xs">{topic.percent}%</span>
                  </div>
                  <Bar value={topic.percent} muted={topic.status === "LOCKED"} />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Today's Target">
            <ol className="space-y-3">
              {["Complete recursion lesson", "Generate AI explanation", "Solve 3 practice problems"].map((target, i) => (
                <li key={target} className="rounded border border-[#1f2937] bg-[#111827] p-3">{i + 1}. {target}</li>
              ))}
            </ol>
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <Panel title="Badges">
            <div className="flex flex-wrap gap-2">
              {["HTML Ninja", "7-Day Streak", "Early Bird"].map((badge) => <span key={badge} className="rounded border border-[#4ade80]/50 bg-[#052e16]/40 px-3 py-2 text-sm">{badge}</span>)}
            </div>
          </Panel>
          <Panel title="AI Mentor">
            <p className="rounded border border-[#6366f1]/40 bg-[#312e81]/20 p-4 text-sm leading-6">Recursion tricky hai? Content page par AI explanation generate karo.</p>
            <Link href="/content" className="mt-4 inline-block rounded border border-[#6366f1] px-4 py-2 text-sm text-[#c7d2fe]">Open Content</Link>
          </Panel>
          <Panel title="Leaderboard">
            <div className="space-y-2">
              {["Priya 9.2", "Rahul 8.4 YOU", "Amit 8.1"].map((row, i) => <div key={row} className="rounded border border-[#1f2937] bg-[#111827] p-3">{i + 1}. {row}</div>)}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded border border-[#1f2937] bg-[#111827] p-4"><div className="text-2xl">{value}</div><div className="mt-1 text-sm text-[#6b7280]">{label}</div></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded border border-[#1f2937] bg-[#0b0f19] p-4"><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;
}

function Bar({ value, muted = false }: { value: number; muted?: boolean }) {
  return <div className="mt-2 h-2 rounded bg-[#1f2937]"><div className={`h-full rounded ${muted ? "bg-[#374151]" : "bg-[#4ade80]"}`} style={{ width: `${value}%` }} /></div>;
}
