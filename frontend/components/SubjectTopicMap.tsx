"use client";

import "reactflow/dist/style.css";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Edge, Handle, Node, Position } from "reactflow";
import { API_URL } from "@/lib/api";

type Subject = {
  id: string;
  label: string;
  icon: string;
  locked?: boolean;
};

type Topic = {
  id: string;
  title: string;
  status: "complete" | "current" | "locked";
  score: number;
  prerequisite?: string;
  teaser?: string;
  progressNeeded?: number;
  lastScore?: number;
};

const subjects: Subject[] = [
  { id: "web-dev", label: "Web Dev", icon: "💻" },
  { id: "data-science", label: "Data Science", icon: "📊" },
  { id: "cybersecurity", label: "Cybersecurity", icon: "🔒", locked: true },
  { id: "cloud", label: "Cloud", icon: "☁️", locked: true }
];

const fallbackTopics: Topic[] = [
  { id: "html", title: "HTML Basics", status: "complete", score: 100 },
  { id: "css", title: "CSS Mastery", status: "complete", score: 85 },
  {
    id: "js",
    title: "JavaScript Core",
    status: "locked",
    score: 72,
    prerequisite: "CSS Mastery Test",
    progressNeeded: 85,
    lastScore: 72,
    teaser: "Complete CSS Mastery Test"
  },
  {
    id: "dom",
    title: "DOM Manipulation",
    status: "locked",
    score: 0,
    prerequisite: "JavaScript Core",
    teaser: "Content hidden"
  },
  {
    id: "react",
    title: "React Fundamentals",
    status: "locked",
    score: 0,
    prerequisite: "2 more topics",
    teaser: "Build Instagram Clone"
  },
  { id: "node", title: "Node.js Backend", status: "locked", score: 0, prerequisite: "React Fundamentals" },
  { id: "capstone", title: "Full-Stack Capstone", status: "locked", score: 0, prerequisite: "Node.js Backend", teaser: "Final Project + Certificate" }
];

function TopicNode({ data }: { data: Topic & { onLocked: (topic: Topic) => void; onOpen: (topic: Topic) => void } }) {
  const color =
    data.status === "complete"
      ? "border-[#4ade80] bg-[#052e16] text-[#f9fafb]"
      : data.status === "current"
        ? "border-[#6366f1] bg-[#1e1b4b] text-[#f9fafb]"
        : "border-[#374151] bg-[#111827] text-[#6b7280]";

  return (
    <button
      onClick={() => (data.status === "locked" ? data.onLocked(data) : data.onOpen(data))}
      title={data.status === "locked" ? `${data.prerequisite || "Complete previous topic"} | ${data.teaser || ""}` : "Open topic"}
      className={`w-[280px] rounded border px-4 py-3 text-left shadow-xl transition hover:scale-[1.01] ${color}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#4ade80]" />
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">{data.status === "locked" ? "🔒" : "🔓"} {data.title}</div>
        <div className="font-mono text-xs">{data.status === "locked" ? "LOCKED" : `${data.score}% ✅`}</div>
      </div>
      {data.status === "locked" && (
        <div className="mt-2 space-y-1 text-xs">
          <div>Complete {data.prerequisite || "previous topic"} first</div>
          {data.progressNeeded && <div>Score needed: {data.progressNeeded}%</div>}
          {data.lastScore && <div>Your last score: {data.lastScore}%</div>}
          {data.teaser && <div>👁️ Preview: {data.teaser}</div>}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-[#4ade80]" />
    </button>
  );
}

const nodeTypes = { topic: TopicNode };

export function SubjectTopicMap() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState("web-dev");
  const [topics, setTopics] = useState<Topic[]>(fallbackTopics);
  const [lockedTopic, setLockedTopic] = useState<Topic | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/subjects/${selectedSubject}/topics?userId=demo-user`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setTopics(
          data.map((item, index) => ({
            id: String(item.id),
            title: item.title,
            status: item.completed ? "complete" : item.unlocked ? "current" : "locked",
            score: item.completed ? 100 : 0,
            prerequisite: data[index - 1]?.title,
            teaser: "Content hidden",
            progressNeeded: 85
          }))
        );
      })
      .catch(() => setTopics(fallbackTopics));
  }, [selectedSubject]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000/progress");
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data) as { topicId: string; score: number; complete: boolean };
      setTopics((current) =>
        current.map((topic) => topic.id === update.topicId ? { ...topic, score: update.score, status: update.complete ? "complete" : topic.status } : topic)
      );
      if (update.complete) confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 } });
    };
    ws.onerror = () => ws.close();
    return () => ws.close();
  }, []);

  const progress = Math.round((topics.filter((topic) => topic.status === "complete").length / topics.length) * 100);
  const nextGoal = topics.find((topic) => topic.status !== "complete");

  const nodes: Node[] = useMemo(
    () =>
      topics.map((topic, index) => ({
        id: topic.id,
        type: "topic",
        position: { x: 40, y: index * 145 },
        data: {
          ...topic,
          onLocked: setLockedTopic,
          onOpen: (item: Topic) => router.push(`/content?topic=${item.id}&subject=${selectedSubject}`)
        }
      })),
    [router, selectedSubject, topics]
  );

  const edges: Edge[] = useMemo(
    () =>
      topics.slice(1).map((topic, index) => ({
        id: `${topics[index].id}-${topic.id}`,
        source: topics[index].id,
        target: topic.id,
        animated: topic.status !== "locked",
        style: { stroke: topic.status === "locked" ? "#374151" : "#4ade80", strokeWidth: 2 }
      })),
    [topics]
  );

  return (
    <section className="min-h-screen bg-[#0a0c14] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto max-w-5xl rounded border border-[#1f2937] bg-[#0b0f19] p-4 sm:p-6">
        <h1 className="text-2xl font-semibold">🎓 Choose Your Path</h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              disabled={subject.locked}
              onClick={() => setSelectedSubject(subject.id)}
              className={`rounded border px-4 py-3 text-left transition ${
                selectedSubject === subject.id
                  ? "border-[#4ade80] bg-[#052e16]/50"
                  : "border-[#1f2937] bg-[#111827] disabled:text-[#6b7280]"
              }`}
            >
              {subject.icon} {subject.label}
            </button>
          ))}
        </div>

        <div className="mt-6 text-sm text-[#6b7280]">
          → Selected: <span className="text-[#f9fafb]">{subjects.find((s) => s.id === selectedSubject)?.label}</span>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <h2 className="font-mono text-sm tracking-[0.18em] text-[#4ade80]">📍 YOUR JOURNEY MAP</h2>
          <span className="font-mono text-xs text-[#6b7280]">{progress}% Complete</span>
        </div>

        <div className="mt-3 h-[3px] rounded bg-[#1f2937]">
          <div className="h-full rounded bg-gradient-to-r from-[#166534] to-[#4ade80]" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 h-[720px] rounded border border-[#1f2937] bg-[#111827] sm:h-[860px]">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
            <Background color="#1f2937" />
            <Controls />
          </ReactFlow>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-[#1f2937] bg-[#111827] p-4">📊 Your Progress: {progress}% Complete</div>
          <div className="rounded border border-[#1f2937] bg-[#111827] p-4">🎯 Next Goal: {nextGoal ? `Pass ${nextGoal.title} (85%+)` : "All topics complete"}</div>
        </div>
      </div>

      {lockedTopic && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded border border-[#1f2937] bg-[#111827] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Topic Locked</h3>
            <p className="mt-3 text-sm text-[#6b7280]">Complete {lockedTopic.prerequisite || "previous topic"} to unlock {lockedTopic.title}.</p>
            {lockedTopic.lastScore && <p className="mt-2 text-sm text-[#f59e0b]">Your last score: {lockedTopic.lastScore}%. Required: 85%.</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setLockedTopic(null)} className="rounded border border-[#374151] px-4 py-2 text-sm">Close</button>
              <button onClick={() => setLockedTopic(null)} className="rounded bg-[#4ade80] px-4 py-2 font-mono text-sm font-bold text-[#052e16]">Retry Test</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
