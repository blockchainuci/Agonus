import { getAuthHeaders } from "@/src/hooks/api";

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BASE_URL = API_URL ? API_URL.replace(/\/$/, "") : "";

if (!BASE_URL && typeof window !== "undefined") {
  console.warn("NEXT_PUBLIC_API_URL is not set.");
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }

  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(opts.headers ?? {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: opts.credentials ?? "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
