import type { ApiEnvelope, AuthUser } from "./types";

const STORAGE_ACCESS = "bt_access_token";
const STORAGE_REFRESH = "bt_refresh_token";
const STORAGE_USER = "bt_user";

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_API_URL (vd: http://localhost:3001)",
    );
  }
  return url.replace(/\/$/, "");
}

export function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_ACCESS);
}

export function readRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_REFRESH);
}

export function persistSession(params: {
  access_token: string;
  refresh_token: string;
  user?: unknown;
}) {
  localStorage.setItem(STORAGE_ACCESS, params.access_token);
  localStorage.setItem(STORAGE_REFRESH, params.refresh_token);
  if (params.user !== undefined) {
    localStorage.setItem(STORAGE_USER, JSON.stringify(params.user));
  }
}

export function clearSessionStorage() {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  localStorage.removeItem(STORAGE_USER);
}

export function readUserJson<T = AuthUser>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type FetchOptions = RequestInit & {
  auth?: boolean;
  raw?: boolean;
  _retried?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refresh = readRefreshToken();
      const user = readUserJson<{ id: number }>();
      if (!refresh || !user?.id) return false;

      const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, refreshToken: refresh }),
      });
      if (!res.ok) return false;

      const json = (await res.json()) as ApiEnvelope<{
        access_token: string;
        refresh_token: string;
      }>;
      const data =
        json?.data ??
        (json as unknown as { access_token: string; refresh_token: string });
      if (!data?.access_token || !data?.refresh_token) return false;

      persistSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function unwrapData<T>(json: unknown): T {
  if (
    json &&
    typeof json === "object" &&
    "data" in json &&
    ("statusCode" in json || "message" in json)
  ) {
    return (json as ApiEnvelope<T>).data;
  }
  return json as T;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, raw = false, _retried, headers, ...init } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const finalHeaders = new Headers(headers);
  if (auth) {
    const token = readAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !finalHeaders.has("Content-Type")
  ) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...init, headers: finalHeaders });

  if (res.status === 401 && auth && !_retried) {
    const ok = await tryRefreshTokens();
    if (ok) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!res.ok) {
    const looksLikeHtml =
      typeof text === "string" &&
      (text.trimStart().startsWith("<!DOCTYPE") ||
        text.trimStart().startsWith("<html"));
    const msg = looksLikeHtml
      ? `API ${res.status} — có vẻ gọi nhầm FE. Kiểm tra NEXT_PUBLIC_API_URL (Nest nên chạy PORT=3001).`
      : (json &&
          typeof json === "object" &&
          "message" in json &&
          String((json as { message: unknown }).message)) ||
        `API ${res.status}`;
    throw new ApiError(
      Array.isArray(msg) ? msg.join(", ") : String(msg),
      res.status,
      json,
    );
  }

  if (raw) return json as T;
  return unwrapData<T>(json);
}

export async function apiJson<T = unknown>(
  path: string,
  body?: unknown,
  options: Omit<FetchOptions, "body"> & { method?: string } = {},
): Promise<T> {
  const { method = body === undefined ? "GET" : "POST", ...rest } = options;
  return apiFetch<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    ...rest,
  });
}
