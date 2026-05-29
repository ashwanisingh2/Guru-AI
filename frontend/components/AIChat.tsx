"use client";

import { useState } from "react";
import { AI_URL } from "@/lib/api";

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Hi, main GuruAI mentor hoon.");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!message.trim()) return;
    setLoading(true);
    const res = await fetch(`${AI_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language: "Hinglish", personality: "Friendly" })
    });
    const data = await res.json();
    setReply(data.reply);
    setMessage("");
    setLoading(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 rounded border bg-white p-4 shadow-lg">
          <div className="mb-3 font-bold">GuruAI Mentor</div>
          <div className="min-h-20 rounded bg-slate-100 p-3 text-sm">{loading ? "Thinking..." : reply}</div>
          <div className="mt-3 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="min-w-0 flex-1 rounded border px-3 py-2 text-sm"
              placeholder="Ask..."
            />
            <button onClick={send} className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
              Send
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg">
        AI Chat
      </button>
    </div>
  );
}
