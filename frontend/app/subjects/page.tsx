import Link from "next/link";
import { api } from "@/lib/api";

type Subject = {
  id: number;
  name: string;
  slug: string;
};

export default async function SubjectsPage({
  searchParams
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const subjects = await api<Subject[]>("/api/subjects");
  const { language = "hinglish" } = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#0a0c14] px-5 py-10 text-[#f9fafb]">
      <h1 className="text-3xl font-bold">Select Subject</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            href={`/topics?subject=${subject.slug}&language=${language}`}
            className="rounded border border-[#1f2937] bg-[#111827] p-5 font-semibold shadow-sm"
          >
            {subject.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
