"use client";

import { useAuth } from "@/hooks/useAuth";
import { BantuanContent } from "@/components/profile/BantuanContent";

export default function MuridBantuanPage() {
  const { loading } = useAuth("murid");

  if (loading) return <p className="text-sm text-slate-400">Memuat...</p>;

  return <BantuanContent role="murid" />;
}
