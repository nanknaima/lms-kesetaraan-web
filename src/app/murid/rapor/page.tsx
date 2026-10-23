"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rapor TIDAK BOLEH diunduh murid — rapor resmi hanya versi fisik, diambil
 * langsung saat wisuda secara offline (lihat Bagian 3 permintaan perombakan).
 * Halaman ini sengaja dibiarkan ADA (bukan 404) supaya URL lama yang
 * di-bookmark/diketik langsung tetap ditangani dengan baik: redirect balik
 * ke dashboard, bukan mengekspos fitur unduh rapor.
 */
export default function MuridRaporPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/murid/dashboard");
  }, [router]);

  return <p className="text-sm text-slate-400">Mengalihkan...</p>;
}
