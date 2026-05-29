import { AdaptiveContentPlayer } from "@/components/AdaptiveContentPlayer";

export default function PlayerPage() {
  return (
    <main className="min-h-screen bg-[#0a0c14] p-5">
      <div className="mx-auto max-w-5xl">
        <AdaptiveContentPlayer contentId="demo-content" contentType="text" userId="demo-user" language="javascript" />
      </div>
    </main>
  );
}
