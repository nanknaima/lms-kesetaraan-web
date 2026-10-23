"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setTokens } from "@/lib/api";
import { fetchMe, dashboardPathFor } from "@/lib/auth";

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackInner />
    </Suspense>
  );
}

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/login?google_error=" + encodeURIComponent("Login Google gagal. Silakan coba lagi."));
      return;
    }

    setTokens(accessToken, refreshToken);
    fetchMe()
      .then((user) => router.replace(dashboardPathFor(user.role)))
      .catch(() => router.replace("/login?google_error=" + encodeURIComponent("Login Google gagal. Silakan coba lagi.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <p className="text-sm text-slate-500">Memproses login Google...</p>
    </div>
  );
}
