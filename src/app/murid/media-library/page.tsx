"use client";

import { useAuth } from "@/hooks/useAuth";
import { MediaLibraryContent } from "@/components/profile/MediaLibraryContent";

export default function MuridMediaLibraryPage() {
  const { loading } = useAuth("murid");

  if (loading) return <p className="text-sm text-slate-400">Memuat...</p>;

  return <MediaLibraryContent />;
}
