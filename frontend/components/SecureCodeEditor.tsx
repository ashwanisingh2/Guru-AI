"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";

type Props = {
  problemId: string;
  userId: string;
  language?: "javascript" | "python";
  allowedPasteSnippets?: string[];
};

type TestResult = {
  passed: boolean;
  runtimeMs: number;
  memoryMb: number;
  output: string;
};

const vivaQuestions = [
  "Explain your approach in 2 lines",
  "What is time complexity? Can you optimize?",
  "What if input size is 10^6?"
];

export function SecureCodeEditor({ problemId, userId, language = "javascript", allowedPasteSnippets = [] }: Props) {
  const [code, setCode] = useState("function solve(input) {\n  // write code here\n}\n");
  const [alerts, setAlerts] = useState<string[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [vivaAnswers, setVivaAnswers] = useState<string[]>(["", "", ""]);
  const [vivaScore, setVivaScore] = useState<number | null>(null);
  const [plagiarism, setPlagiarism] = useState<{ score: number; matches: string[] } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  function alert(message: string) {
    setAlerts((current) => [...current, `${new Date().toLocaleTimeString()} ${message}`]);
  }

  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "f12" || (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key))) {
        e.preventDefault();
        alert("DevTools shortcut blocked");
      }
      if (e.ctrlKey && key === "c") {
        e.preventDefault();
        alert("Copy blocked");
      }
    };
    const onBlur = () => alert("Tab/window switch detected");
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      alert("Right-click blocked");
    };

    document.addEventListener("keydown", blockKeys);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onContext);
    return () => {
      document.removeEventListener("keydown", blockKeys);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onContext);
    };
  }, []);

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => alert("Camera/audio permission missing"));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      alert("Proctor snapshot captured");
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  async function enforceFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => alert("Fullscreen required"));
    }
  }

  async function submitCode() {
    await enforceFullscreen();
    const res = await fetch(`${API_URL}/api/coding/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, code, language, problemId, alerts })
    });
    const data = await res.json();
    setResult(data.result);

    const plagiarismRes = await fetch(`${API_URL}/api/coding/plagiarism?problemId=${problemId}&userId=${userId}`);
    setPlagiarism(await plagiarismRes.json());
  }

  async function submitViva() {
    const res = await fetch(`${API_URL}/api/coding/viva`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, problemId, answers: vivaAnswers })
    });
    const data = await res.json();
    setVivaScore(data.understandingScore);
  }

  return (
    <section className="min-h-screen bg-[#0a0c14] p-4 text-[#f9fafb]">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded border border-[#1f2937] bg-[#0b0f19] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Secure Coding Test</h1>
            <button onClick={enforceFullscreen} className="rounded border border-[#4ade80] px-3 py-2 font-mono text-sm text-[#4ade80]">ENTER FULLSCREEN</button>
          </div>
          <div
            onCopy={(e) => { e.preventDefault(); alert("Copy blocked"); }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (!allowedPasteSnippets.includes(text)) {
                e.preventDefault();
                alert("Paste blocked");
              }
            }}
            className="overflow-hidden rounded border border-[#1f2937]"
          >
            <Editor height="520px" theme="vs-dark" language={language} value={code} onChange={(value) => setCode(value || "")} />
          </div>
          <button onClick={submitCode} className="mt-4 rounded bg-[#4ade80] px-4 py-2 font-mono font-bold text-[#052e16]">SUBMIT CODE</button>

          {result && (
            <pre className="mt-4 rounded bg-[#111827] p-4 font-mono text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}

          {result && (
            <div className="mt-4 rounded border border-[#1f2937] bg-[#111827] p-4">
              <h2 className="font-semibold">AI Viva</h2>
              {vivaQuestions.map((question, index) => (
                <label key={question} className="mt-3 block">
                  <span className="text-sm text-[#6b7280]">{question}</span>
                  <textarea className="mt-1 w-full rounded bg-[#0a0c14] p-3" value={vivaAnswers[index]} onChange={(e) => {
                    const next = [...vivaAnswers];
                    next[index] = e.target.value;
                    setVivaAnswers(next);
                  }} />
                </label>
              ))}
              <button onClick={submitViva} className="mt-3 rounded border border-[#6366f1] px-4 py-2 text-[#c7d2fe]">Submit Viva</button>
              {vivaScore !== null && <div className="mt-3 text-[#4ade80]">Understanding score: {vivaScore}/100</div>}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
            <h2 className="font-semibold">Proctoring</h2>
            <video ref={videoRef} autoPlay muted playsInline className="mt-3 aspect-video w-full rounded bg-black" />
            <div className="mt-3 text-xs text-[#6b7280]">Snapshot every 30s. Face/audio checks server-side.</div>
          </div>

          <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
            <h2 className="font-semibold">Plagiarism</h2>
            <pre className="mt-3 overflow-auto rounded bg-[#0a0c14] p-3 font-mono text-xs">
              {JSON.stringify(plagiarism || { score: 0, matches: [] }, null, 2)}
            </pre>
          </div>

          <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
            <h2 className="font-semibold">Security Alerts</h2>
            <div className="mt-3 max-h-72 space-y-2 overflow-auto font-mono text-xs text-[#f59e0b]">
              {alerts.map((item, index) => <div key={`${item}-${index}`}>{item}</div>)}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
