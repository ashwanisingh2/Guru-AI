import Link from "next/link";

const metrics = [
  ["Adaptive path", "AI changes explanations by level, style, language, and goal."],
  ["Offline ready", "Lessons and events keep working locally, then sync later."],
  ["Engagement loop", "Every key action feeds analytics for personalization."]
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080b12] text-[#f9fafb]">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <div className="mb-6 flex w-fit items-center gap-2 rounded border border-[#1f2937] bg-[#0f172a] px-3 py-2 font-mono text-xs text-[#4ade80]">
            GURU AI · LOCAL TESTING BUILD
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">
            Personalized CS learning that adapts while the student learns.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#9ca3af]">
            Student DNA, AI explanations, offline sync, analytics, and adaptive practice in one local MVP.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded bg-[#4ade80] px-5 py-3 font-mono text-sm font-bold text-[#052e16]">Start Onboarding</Link>
            <Link href="/dashboard" className="rounded border border-[#1f2937] px-5 py-3 font-mono text-sm">Open Dashboard</Link>
            <Link href="/analytics" className="rounded border border-[#1f2937] px-5 py-3 font-mono text-sm">View Analytics</Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {metrics.map(([title, body]) => (
              <div key={title} className="rounded border border-[#1f2937] bg-[#0f172a] p-4">
                <div className="font-semibold">{title}</div>
                <p className="mt-2 text-sm leading-6 text-[#9ca3af]">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded border border-[#1f2937] bg-[#0b0f19] p-5 shadow-[0_0_80px_rgba(74,222,128,0.08)]">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#6b7280]">Live Learning Loop</div>
          <div className="mt-5 space-y-4">
            {["Student struggles with recursion", "AI detects beginner + full-stack goal", "Generates visual, code, practice", "Tracks completion and engagement"].map((item, i) => (
              <div key={item} className="flex gap-3 rounded border border-[#1f2937] bg-[#111827] p-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#4ade80] font-mono text-xs font-bold text-[#052e16]">{i + 1}</div>
                <div className="text-sm">{item}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded border border-[#6366f1]/40 bg-[#312e81]/20 p-4">
            <div className="font-mono text-xs text-[#c7d2fe]">AI OUTPUT</div>
            <p className="mt-2 text-sm leading-6 text-[#dbeafe]">React component trees can be recursive. Each component renders child components until no children remain.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
