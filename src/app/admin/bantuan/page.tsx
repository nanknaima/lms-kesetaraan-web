"use client";

import { useAuth } from "@/hooks/useAuth";
import { BantuanContent } from "@/components/profile/BantuanContent";

export default function AdminBantuanPage() {
  const { loading } = useAuth("admin");

  if (loading) return <p className="text-sm text-slate-400">Memuat...</p>;

  return <BantuanContent role="admin" />;
}
