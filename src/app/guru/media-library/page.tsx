"use client";

import { useAuth } from "@/hooks/useAuth";
import { MediaLibraryContent } from "@/components/profile/MediaLibraryContent";

export default function GuruMediaLibraryPage() {
  const { loading } = useAuth("guru");

  if (loading) return <p className="text-sm text-slate-400">Memuat...</p>;

  return <MediaLibraryContent />;
}
