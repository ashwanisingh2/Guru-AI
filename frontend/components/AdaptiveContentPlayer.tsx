"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/lib/api";

type ContentType = "video" | "text" | "interactive" | "coding";
type Props = {
  contentId: string;
  contentType: ContentType;
  userId: string;
  language: string;
};

type Interaction = {
  type: string;
  value: string | number | boolean;
  at: number;
};

const videoQuizPoints = [
  { time: 8, question: "What does CSS specificity decide?", answer: "priority" },
  { time: 18, question: "Which layout system is one-dimensional?", answer: "flexbox" }
];

const textSections = [
  {
    title: "Cascade",
    body: "Cascade decides which CSS rule wins when multiple rules target the same element.",
    quiz: { question: "Cascade resolves rule conflicts. Type yes.", answer: "yes" }
  },
  {
    title: "Specificity",
    body: "Specificity ranks selectors. Inline styles outrank ids, ids outrank classes, and classes outrank elements.",
    quiz: { question: "What outranks a class selector?", answer: "id" }
  },
  {
    title: "Box Model",
    body: "Every element is a box made of content, padding, border, and margin.",
    quiz: { question: "Name the space inside border.", answer: "padding" }
  }
];

const tutorialSteps = [
  { prompt: "Create a div container. Type: div", answer: "div", hint: "HTML block element." },
  { prompt: "Apply flex layout. Type: display flex", answer: "display flex", hint: "Use display property." },
  { prompt: "Center content. Type: justify center", answer: "justify center", hint: "Main-axis alignment." }
];

const starterCode = `function add(a, b) {
  // return the sum
}
`;

function nowSeconds(startedAt: number) {
  return Math.floor((Date.now() - startedAt) / 1000);
}

export function AdaptiveContentPlayer({ contentId, contentType, userId, language }: Props) {
  const startedAt = useRef(Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [percentComplete, setPercentComplete] = useState(0);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [warning, setWarning] = useState("");

  const track = (type: string, value: Interaction["value"]) => {
    setInteractions((current) => [...current, { type, value, at: nowSeconds(startedAt.current) }]);
  };

  async function saveProgress() {
    await fetch(`${API_URL}/api/content/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        contentId,
        timeSpent: nowSeconds(startedAt.current),
        percentComplete,
        interactions
      })
    }).catch(() => undefined);
  }

  useEffect(() => {
    const interval = window.setInterval(saveProgress, 30000);
    return () => window.clearInterval(interval);
  });

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && contentType === "video") {
        videoRef.current?.pause();
        setWarning("Tab switch detected. Video paused.");
        track("tab_switch", true);
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [contentType]);

  if (contentType === "video") {
    return <VideoMode videoRef={videoRef} percentComplete={percentComplete} setPercentComplete={setPercentComplete} track={track} warning={warning} saveProgress={saveProgress} />;
  }

  if (contentType === "text") {
    return <TextMode textRef={textRef} percentComplete={percentComplete} setPercentComplete={setPercentComplete} track={track} saveProgress={saveProgress} />;
  }

  if (contentType === "interactive") {
    return <InteractiveMode track={track} saveProgress={saveProgress} setPercentComplete={setPercentComplete} />;
  }

  return <CodingMode track={track} saveProgress={saveProgress} setPercentComplete={setPercentComplete} language={language} />;
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-[#1f2937] bg-[#0b0f19] p-4 text-[#f9fafb]">
      <h1 className="mb-4 text-xl font-semibold">{title}</h1>
      {children}
    </section>
  );
}

function VideoMode({
  videoRef,
  percentComplete,
  setPercentComplete,
  track,
  warning,
  saveProgress
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  percentComplete: number;
  setPercentComplete: (n: number) => void;
  track: (type: string, value: Interaction["value"]) => void;
  warning: string;
  saveProgress: () => Promise<void>;
}) {
  const [speed, setSpeed] = useState(1);
  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [watched, setWatched] = useState(false);
  const passedQuiz = useRef(new Set<number>());

  useEffect(() => {
    const interval = window.setInterval(saveProgress, 5000);
    return () => window.clearInterval(interval);
  }, [saveProgress]);

  function onTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setPercentComplete(Math.round((video.currentTime / video.duration) * 100));

    const nextQuiz = videoQuizPoints.findIndex((point, index) => video.currentTime >= point.time && !passedQuiz.current.has(index));
    if (nextQuiz >= 0) {
      video.pause();
      setQuizIndex(nextQuiz);
      track("video_quiz_pause", video.currentTime);
    }
  }

  function submitQuiz() {
    if (quizIndex === null) return;
    const quiz = videoQuizPoints[quizIndex];
    if (answer.trim().toLowerCase() !== quiz.answer) return track("video_quiz_wrong", quizIndex);
    passedQuiz.current.add(quizIndex);
    setQuizIndex(null);
    setAnswer("");
    track("video_quiz_passed", quizIndex);
    videoRef.current?.play();
  }

  return (
    <Shell title="Video Lesson">
      {warning && <div className="mb-3 rounded border border-[#f59e0b] bg-[#451a03] p-3 text-sm text-[#f59e0b]">{warning}</div>}
      <video
        ref={videoRef}
        className="aspect-video w-full rounded bg-black"
        src="/sample-lesson.mp4"
        controls={false}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => {
          setWatched(true);
          setPercentComplete(100);
          track("video_complete", true);
        }}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded border border-[#1f2937] px-3 py-2" onClick={() => videoRef.current?.play()}>Play</button>
        <button className="rounded border border-[#1f2937] px-3 py-2" onClick={() => videoRef.current?.pause()}>Pause</button>
        <button className="rounded border border-[#1f2937] px-3 py-2" onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10))}>Back 10s</button>
        <select
          className="rounded border border-[#1f2937] bg-[#111827] px-3"
          value={speed}
          onChange={(e) => {
            const value = Number(e.target.value);
            setSpeed(value);
            if (videoRef.current) videoRef.current.playbackRate = value;
          }}
        >
          {[0.5, 1, 1.25, 1.5, 2].map((value) => <option key={value}>{value}</option>)}
        </select>
        <button disabled={!watched} className="rounded bg-[#4ade80] px-3 py-2 font-mono text-[#052e16] disabled:opacity-40">Mark as Watched</button>
      </div>
      <Progress value={percentComplete} />

      {quizIndex !== null && (
        <Modal title="Checkpoint Quiz">
          <p>{videoQuizPoints[quizIndex].question}</p>
          <input className="mt-3 w-full rounded border border-[#1f2937] bg-[#0a0c14] px-3 py-2" value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <button className="mt-3 rounded bg-[#4ade80] px-4 py-2 text-[#052e16]" onClick={submitQuiz}>Continue</button>
        </Modal>
      )}
    </Shell>
  );
}

function TextMode({
  textRef,
  percentComplete,
  setPercentComplete,
  track,
  saveProgress
}: {
  textRef: React.RefObject<HTMLDivElement>;
  percentComplete: number;
  setPercentComplete: (n: number) => void;
  track: (type: string, value: Interaction["value"]) => void;
  saveProgress: () => Promise<void>;
}) {
  const minReadSeconds = 90;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [passed, setPassed] = useState<Record<number, boolean>>({});
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  function onScroll() {
    const el = textRef.current;
    if (!el) return;
    const progress = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setPercentComplete(Math.min(100, Math.max(0, progress)));
  }

  const canComplete = percentComplete >= 95 && elapsed >= minReadSeconds && textSections.every((_, i) => passed[i]);

  return (
    <Shell title="Text Lesson">
      <div className="mb-3 flex justify-between font-mono text-xs text-[#6b7280]">
        <span>Estimated read: 2 min</span>
        <span>Actual: {elapsed}s</span>
      </div>
      <div ref={textRef} onScroll={onScroll} className="h-[520px] overflow-y-auto rounded border border-[#1f2937] bg-[#111827] p-5 leading-7">
        {textSections.map((section, index) => (
          <section key={section.title} className="mb-10">
            <h2 className="mb-2 text-lg font-semibold text-[#4ade80]">{section.title}</h2>
            <p>{section.body}</p>
            <div className="mt-4 rounded border border-[#6366f1]/40 bg-[#312e81]/20 p-3">
              <p className="text-sm">{section.quiz.question}</p>
              <input className="mt-2 w-full rounded bg-[#0a0c14] px-3 py-2" value={answers[index] || ""} onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })} />
              <button
                className="mt-2 rounded border border-[#4ade80] px-3 py-1 text-sm text-[#4ade80]"
                onClick={() => {
                  const ok = answers[index]?.trim().toLowerCase() === section.quiz.answer;
                  setPassed({ ...passed, [index]: ok });
                  track(ok ? "text_quiz_passed" : "text_quiz_wrong", index);
                }}
              >
                Check
              </button>
              {passed[index] && <span className="ml-3 text-sm text-[#4ade80]">Correct</span>}
            </div>
          </section>
        ))}
      </div>
      <Progress value={percentComplete} />
      <button disabled={!canComplete} onClick={saveProgress} className="mt-4 rounded bg-[#4ade80] px-4 py-2 font-mono text-[#052e16] disabled:opacity-40">Mark Complete</button>
    </Shell>
  );
}

function InteractiveMode({ track, saveProgress, setPercentComplete }: { track: (type: string, value: Interaction["value"]) => void; saveProgress: () => Promise<void>; setPercentComplete: (n: number) => void }) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [hints, setHints] = useState(3);
  const [feedback, setFeedback] = useState("");
  const current = tutorialSteps[step];

  function submit() {
    if (input.trim().toLowerCase() === current.answer) {
      const next = Math.min(step + 1, tutorialSteps.length);
      setStep(next);
      setInput("");
      setFeedback("");
      setPercentComplete(Math.round((next / tutorialSteps.length) * 100));
      track("interactive_step_passed", step);
      if (next === tutorialSteps.length) saveProgress();
    } else {
      setFeedback("Wrong answer. Review the concept and retry.");
      track("interactive_wrong", step);
    }
  }

  return (
    <Shell title="Interactive Tutorial">
      {step >= tutorialSteps.length ? <div className="text-[#4ade80]">Tutorial complete.</div> : (
        <>
          <p>{current.prompt}</p>
          <input className="mt-4 w-full rounded border border-[#1f2937] bg-[#111827] px-3 py-2" value={input} onChange={(e) => setInput(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button className="rounded bg-[#4ade80] px-4 py-2 text-[#052e16]" onClick={submit}>Submit</button>
            <button disabled={hints === 0} className="rounded border border-[#6366f1] px-4 py-2 text-[#c7d2fe] disabled:opacity-40" onClick={() => { setHints(hints - 1); setFeedback(current.hint); track("hint_used", step); }}>Hint ({hints})</button>
          </div>
          {feedback && <div className="mt-3 text-sm text-[#f59e0b]">{feedback}</div>}
        </>
      )}
    </Shell>
  );
}

function CodingMode({ track, saveProgress, setPercentComplete, language }: { track: (type: string, value: Interaction["value"]) => void; saveProgress: () => Promise<void>; setPercentComplete: (n: number) => void; language: string }) {
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState("");

  function blockPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    track("paste_blocked", true);
    setResult("Paste blocked. Type the solution yourself.");
  }

  async function runTests() {
    const passed = /return\s+a\s*\+\s*b/.test(code);
    setResult(passed ? "All tests passed." : "Tests failed: add(2, 3) should return 5.");
    setPercentComplete(passed ? 100 : 50);
    track("coding_tests", passed);
    if (passed) await saveProgress();
  }

  return (
    <Shell title="Coding Assignment">
      <div onPaste={blockPaste} className="overflow-hidden rounded border border-[#1f2937]">
        <Editor height="420px" defaultLanguage={language === "python" ? "python" : "javascript"} theme="vs-dark" value={code} onChange={(value) => setCode(value || "")} />
      </div>
      <div className="mt-4 flex gap-2">
        <button className="rounded bg-[#4ade80] px-4 py-2 text-[#052e16]" onClick={runTests}>Run Tests</button>
        <button className="rounded border border-[#6366f1] px-4 py-2 text-[#c7d2fe]" onClick={() => { setResult("Hint: return a + b"); track("ai_hint", true); }}>AI Hint</button>
      </div>
      {result && <pre className="mt-3 rounded bg-[#111827] p-3 font-mono text-sm">{result}</pre>}
    </Shell>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="mt-4 h-[3px] rounded bg-[#1f2937]">
      <div className="h-full rounded bg-gradient-to-r from-[#166534] to-[#4ade80]" style={{ width: `${value}%` }} />
    </div>
  );
}

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded border border-[#1f2937] bg-[#111827] p-5">
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
