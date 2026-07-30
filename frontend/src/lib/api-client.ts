/**
 * api-client.ts
 *
 * A typed fetch wrapper that automatically injects the Clerk JWT into every
 * request. Use the `useApiClient()` hook in any React component or TanStack
 * Query hook to get a fully-configured client instance.
 */

"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }

    const message =
      typeof detail === "object" &&
      detail !== null &&
      "detail" in detail
        ? String((detail as Record<string, unknown>).detail)
        : `Request failed with status ${res.status}`;

    throw new ApiError(res.status, message, detail);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApiClient() {
  const { getToken } = useAuth();

  const getAuthToken = useCallback(async () => {
    return getToken();
  }, [getToken]);

  const get = useCallback(
    async <T>(path: string): Promise<T> => {
      const token = await getAuthToken();
      return apiFetch<T>(path, token);
    },
    [getAuthToken]
  );

  const post = useCallback(
    async <T>(path: string, body: unknown): Promise<T> => {
      const token = await getAuthToken();
      return apiFetch<T>(path, token, {
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body),
      });
    },
    [getAuthToken]
  );

  const put = useCallback(
    async <T>(path: string, body: unknown): Promise<T> => {
      const token = await getAuthToken();
      return apiFetch<T>(path, token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    [getAuthToken]
  );

  const patch = useCallback(
    async <T>(path: string, body: unknown): Promise<T> => {
      const token = await getAuthToken();
      return apiFetch<T>(path, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    [getAuthToken]
  );

  const del = useCallback(
    async <T>(path: string): Promise<T> => {
      const token = await getAuthToken();
      return apiFetch<T>(path, token, { method: "DELETE" });
    },
    [getAuthToken]
  );

  return { get, post, put, patch, del };
}
