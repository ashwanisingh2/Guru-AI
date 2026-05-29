"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ReviewItem = {
  id: string;
  topic: string;
  struggling_with: string;
  review_status: string;
  quality: { score?: number };
  response: { explanation?: string };
};

export default function AIReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    api<{ items: ReviewItem[] }>("/api/admin/reviews/ai-content")
      .then((data) => setItems(data.items))
      .catch(() => undefined);
  }, []);

  async function update(id: string, status: "approved" | "rejected") {
    await api(`/api/admin/reviews/ai-content/${id}`, { method: "POST", body: { status } });
    setItems((current) => current.map((item) => item.id === id ? { ...item, review_status: status } : item));
  }

  return (
    <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">AI Content Review</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Human review queue for low-confidence or sampled generated content.</p>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded border border-[#1f2937] bg-[#111827] p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="font-semibold">{item.topic}</div>
                  <div className="text-sm text-[#6b7280]">{item.struggling_with} · score {item.quality?.score ?? "n/a"} · {item.review_status}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => update(item.id, "approved")} className="rounded bg-[#4ade80] px-3 py-2 text-sm text-[#052e16]">Approve</button>
                  <button onClick={() => update(item.id, "rejected")} className="rounded border border-[#ef4444] px-3 py-2 text-sm text-[#fecaca]">Reject</button>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#d1d5db]">{item.response?.explanation}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
