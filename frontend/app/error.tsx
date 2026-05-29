"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/api";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    trackEvent("page_crash", "crash", { message: error.message });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#0a0c14] p-5 text-[#f9fafb]">
      <section className="max-w-md rounded border border-[#1f2937] bg-[#111827] p-6">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Your work is safe. Retry or go back to dashboard.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={reset} className="rounded bg-[#4ade80] px-4 py-2 text-[#052e16]">Retry</button>
          <Link href="/dashboard" className="rounded border border-[#1f2937] px-4 py-2">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
