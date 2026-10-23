"use client";

import { useAuth } from "@/hooks/useAuth";
import { KartuStudiContent } from "@/components/profile/KartuStudiContent";

export default function MuridKartuSiswaPage() {
  const { user, loading } = useAuth("murid");

  if (loading || !user) return <p className="text-sm text-slate-400">Memuat...</p>;

  return <KartuStudiContent user={user} />;
}
