"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/lib/auth";
import { getAccessToken } from "@/lib/api";
import type { User } from "@/lib/types";

/** Guard sederhana: redirect ke /login jika belum ada token / token invalid. */
export function useAuth(requiredRole?: User["role"]) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    fetchMe()
      .then((u) => {
        if (requiredRole && u.role !== requiredRole) {
          router.replace("/login");
          return;
        }
        setUser(u);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}
