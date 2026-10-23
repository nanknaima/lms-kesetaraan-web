"use client";

import { useAuth } from "@/hooks/useAuth";
import { PengaturanContent } from "@/components/profile/PengaturanContent";

export default function AdminPengaturanPage() {
  const { loading } = useAuth("admin");

  if (loading) return <p className="text-sm text-slate-400">Memuat...</p>;

  return <PengaturanContent bisaHapusAkun={false} />;
}
