// src/api/client.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4001";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON from ${path} but got "${contentType || "unknown"}" ` +
      `(status ${res.status}). Is the backend running at ${API_BASE_URL} ` +
      `and is the route mounted correctly?`
    );
  }

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(`Gemini rate limit reached. Retry after ${data.retryAfter || 60}s.`);
    }
    throw new Error(data.message || `Request to ${path} failed (${res.status})`);
  }
  return data;
}