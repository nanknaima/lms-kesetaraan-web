/**
 * Fetch wrapper tipis untuk memanggil backend Laravel (shared API dengan mobile).
 * Menyimpan access/refresh token di localStorage & otomatis refresh saat 401.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const TOKEN_KEY = "lms_access_token";
const REFRESH_KEY = "lms_refresh_token";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  if (!res.ok) return false;

  const body = await res.json();
  setTokens(body.data.access_token, body.data.refresh_token);
  return true;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { asForm?: boolean } = {},
  _retried = false,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!options.asForm) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, options, true);
    clearTokens();
    // apiFetch adalah utilitas polos (bukan komponen/hook React) yang dipanggil
    // dari mana saja, termasuk di luar konteks render — useRouter()/redirect()
    // tidak bisa dipakai di sini. Hard redirect memang disengaja saat sesi
    // invalid, supaya seluruh state in-memory ikut ter-reset bersih.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(body.message ?? "Terjadi kesalahan.", res.status, body.errors);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  del: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "DELETE", body: data ? JSON.stringify(data) : undefined }),
  upload: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: "POST", body: formData, asForm: true }),
};

export { ApiError };
