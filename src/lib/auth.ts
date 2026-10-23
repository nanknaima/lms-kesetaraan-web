import { api, setTokens, clearTokens, API_BASE_URL } from "./api";
import type { User } from "./types";

interface LoginResponse {
  data: {
    access_token: string;
    refresh_token: string;
    user: User;
  };
}

/** identifier = email (semua role), NIP (guru), atau NIS (murid) — lihat docs/api-endpoints.md */
export async function login(identifier: string, password: string): Promise<User> {
  const res = await api.post<LoginResponse>("/auth/login", { identifier, password });
  setTokens(res.data.access_token, res.data.refresh_token);
  return res.data.user;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearTokens();
  }
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<{ data: User }>("/auth/me");
  return res.data;
}

/** Redirect berdasarkan role setelah login — dipakai di halaman login. */
export function dashboardPathFor(role: User["role"]) {
  return { admin: "/admin/dashboard", guru: "/guru/dashboard", murid: "/murid/dashboard" }[role] ?? "/login";
}

/** URL tombol "Login dengan Google" — navigasi penuh (bukan fetch), backend yang redirect ke Google. */
export function googleLoginUrl() {
  return `${API_BASE_URL}/auth/google/redirect`;
}

/** Langkah 1 lupa sandi: minta kode OTP dikirim ke email. */
export async function forgotPassword(email: string) {
  return api.post<{ message: string }>("/auth/forgot-password", { email });
}

/** Langkah 2 lupa sandi: verifikasi kode OTP sebelum menampilkan form password baru. */
export async function verifyOtp(email: string, otp: string) {
  return api.post<{ message: string }>("/auth/verify-otp", { email, otp });
}

/** Langkah 3 lupa sandi: set password baru. */
export async function resetPassword(email: string, otp: string, password: string, passwordConfirmation: string) {
  return api.post<{ message: string }>("/auth/reset-password", {
    email,
    otp,
    password,
    password_confirmation: passwordConfirmation,
  });
}
