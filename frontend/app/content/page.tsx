"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { API_URL, trackEvent } from "@/lib/api";
import { AIExplanationGenerator } from "@/components/AIExplanationGenerator";

type Topic = {
  id: number;
  title: string;
  video_url: string;
};

function ContentView() {
  const router = useRouter();
  const params = useSearchParams();
  const topicId = params.get("topic") || "recursion";
  const subject = params.get("subject") || "web-development";
  const language = params.get("language") || "hinglish";
  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/subjects/${subject}/topics?userId=demo-user`)
      .then((res) => res.json())
      .then((topics) => setTopic(topics.find((item: Topic) => String(item.id) === topicId) || topics[0] || null))
      .catch(() => setTopic({ id: "recursion" as unknown as number, title: "Recursion", video_url: "https://www.youtube.com/embed/Mv9NEXX1VHc" }));
  }, [subject, topicId]);

  async function completeTopic() {
    await fetch(`${API_URL}/api/topics/${topicId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "demo-user", score: 100 })
    });
    trackEvent("topic_completed", "content", { topicId });
    router.push(`/topics?subject=${subject}&language=${language}`);
    router.refresh();
  }

  if (!topic) return <main className="min-h-screen bg-[#0a0c14] p-5 text-[#f9fafb]">Loading...</main>;

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-[#0a0c14] px-5 py-10 text-[#f9fafb]">
      <h1 className="text-3xl font-bold">{topic.title}</h1>
      <div className="mt-6 aspect-video overflow-hidden rounded bg-black">
        <iframe
          className="h-full w-full"
          src={topic.video_url}
          title={topic.title}
          allowFullScreen
        />
      </div>
      <button onClick={completeTopic} className="mt-6 rounded bg-[#4ade80] px-5 py-3 font-semibold text-[#052e16]">
        Mark Complete
      </button>
      <AIExplanationGenerator userId="demo-user" topic={topic.title} />
    </main>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={<main className="p-5">Loading...</main>}>
      <ContentView />
    </Suspense>
  );
}
