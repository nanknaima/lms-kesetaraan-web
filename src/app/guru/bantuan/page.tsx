"use client";

import { useAuth } from "@/hooks/useAuth";
import { BantuanContent } from "@/components/profile/BantuanContent";

export default function GuruBantuanPage() {
  const { loading } = useAuth("guru");

  if (loading) return <p className="text-sm text-slate-400">Memuat...</p>;

  return <BantuanContent role="guru" />;
}
