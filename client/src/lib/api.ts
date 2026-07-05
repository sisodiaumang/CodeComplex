// ─── API client ──────────────────────────────────────────────────────────────
// Cookie-based auth (httpOnly accessToken / refreshToken set by the backend).
// Every response is wrapped in the ApiResponse envelope:
//   { statusCode, success, message, data }
// api<T>() unwraps and returns `data`, throwing ApiError on failure.
// On a 401 it transparently attempts one token refresh and retries.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** internal – prevents infinite refresh loops */
  _retry?: boolean;
}

// Single in-flight refresh shared by concurrent 401s
let refreshInFlight: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/user/refresh-token`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

const NO_RETRY_PATHS = ["/user/login", "/user/refresh-token", "/user/signup"];

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, _retry = true } = options;

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers:
      body !== undefined && !isForm
        ? { "Content-Type": "application/json" }
        : undefined,
    body:
      body === undefined
        ? undefined
        : isForm
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (
    res.status === 401 &&
    _retry &&
    !NO_RETRY_PATHS.some((p) => path.startsWith(p))
  ) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return api<T>(path, { ...options, _retry: false });
    }
  }

  let json: { message?: string; data?: unknown } | null = null;
  try {
    json = await res.json();
  } catch {
    // empty / non-JSON body
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.message ?? `Request failed with status ${res.status}`
    );
  }

  return (json && "data" in json ? json.data : json) as T;
}

/** Returns a readable message from any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
