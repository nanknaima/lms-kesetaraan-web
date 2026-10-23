"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProfileForm } from "@/components/ProfileForm";
import type { User } from "@/lib/types";

/** Halaman "Kelola Profil" (form edit avatar/nama/bio/password) — dipakai bareng oleh ketiga role. */
export function KelolaProfilPage({ role }: { role: User["role"] }) {
  const { user, loading } = useAuth(role);
  const [localUser, setLocalUser] = useState<User | null>(null);
  // Sinkronkan localUser saat `user` dari useAuth berubah (mis. baru selesai
  // loading) — dihitung saat render (bukan lewat useEffect) mengikuti pola
  // resmi React "Adjusting state when a prop changes", supaya localUser tetap
  // bisa di-override independen oleh ProfileForm.onUpdated di antara sinkronisasi.
  const [syncedFrom, setSyncedFrom] = useState<User | null>(null);
  if (user !== syncedFrom) {
    setSyncedFrom(user);
    setLocalUser(user);
  }

  if (loading || !localUser) return <p className="text-sm text-slate-400">Memuat...</p>;

  return (
    <div className="space-y-4">
      <ProfileForm user={localUser} onUpdated={setLocalUser} />
    </div>
  );
}
