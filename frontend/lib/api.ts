function resolveLocalUrl(value: string) {
  if (typeof window === "undefined") return value;
  const url = new URL(value);
  if (["localhost", "127.0.0.1"].includes(url.hostname) && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    url.hostname = window.location.hostname;
  }
  return url.toString().replace(/\/$/, "");
}

export const API_URL = resolveLocalUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
export const AI_URL = resolveLocalUrl(process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000");

type ApiOptions = Omit<RequestInit, "body"> & {
  token?: string;
  body?: unknown;
  offlineKey?: string;
};

const QUEUE_KEY = "guru_offline_queue";

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function queueRequest(path: string, options: ApiOptions) {
  if (!canUseStorage()) return;
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  queue.push({ path, options: { method: options.method || "POST", body: options.body }, createdAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: options.cache || "no-store"
    });
  } catch (error) {
    if (options.offlineKey || options.method !== "GET") queueRequest(path, options);
    throw error;
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: "API failed" }));
    throw new Error(detail.error || `API failed with ${res.status}`);
  }
  return res.json();
}

export async function flushOfflineQueue() {
  if (!canUseStorage() || !navigator.onLine) return;
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as { path: string; options: ApiOptions }[];
  const remaining = [];
  for (const item of queue) {
    try {
      await api(item.path, item.options);
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export function trackEvent(eventName: string, feature: string, metadata: Record<string, unknown> = {}) {
  return api("/api/analytics/events", {
    method: "POST",
    body: { eventName, feature, metadata, userId: "demo-user" },
    offlineKey: "analytics"
  }).catch(() => undefined);
}
