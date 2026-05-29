import Link from "next/link";
import { api } from "@/lib/api";

type Language = {
  id: number;
  code: string;
  name: string;
};

export default async function LanguagePage() {
  const languages = await api<Language[]>("/api/languages");

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#0a0c14] px-5 py-10 text-[#f9fafb]">
      <h1 className="text-3xl font-bold">Select Language</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {languages.map((language) => (
          <Link
            key={language.id}
            href={`/subjects?language=${language.code}`}
            className="rounded border border-[#1f2937] bg-[#111827] p-5 font-semibold shadow-sm"
          >
            {language.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
