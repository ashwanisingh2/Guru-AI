export const API_URL = "http://localhost:4000";

export async function api(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    signal: controller.signal,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) }
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error("API failed");
  return res.json();
}
