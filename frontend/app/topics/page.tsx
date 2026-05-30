import Link from "next/link";
import { api } from "@/lib/api";

type Topic = {
  id: number;
  title: string;
  position: number;
  video_url: string;
  unlocked: boolean;
  completed: boolean;
};

export default async function TopicsPage({
  searchParams
}: {
  searchParams: Promise<{ subject?: string; language?: string }>;
}) {
  const params = await searchParams;
  const subject = params.subject || "web-development";
  const language = params.language || "hinglish";
  const topics = await api<Topic[]>(`/api/subjects/${subject}/topics?userId=demo-user`);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#0a0c14] px-5 py-10 text-[#f9fafb]">
      <h1 className="text-3xl font-bold">Topic Map</h1>
      <div className="mt-8 space-y-4">
        {topics.map((topic) =>
          topic.unlocked ? (
            <Link
              key={topic.id}
              href={`/content?topic=${topic.id}&subject=${subject}&language=${language}`}
              className="flex items-center justify-between rounded border border-[#1f2937] bg-[#111827] p-5 shadow-sm"
            >
              <span>{topic.position || ""} {topic.title}</span>
              <span>{topic.completed ? "Completed" : "Unlocked"}</span>
            </Link>
          ) : (
            <div key={topic.id} className="flex items-center justify-between rounded border border-[#1f2937] bg-[#111827] p-5 text-[#6b7280]">
              <span>{topic.position || ""} {topic.title}</span>
              <span>Locked</span>
            </div>
          )
        )}
      </div>
    </main>
  );
}
