"use client";

/**
 * Konteks "penugasan aktif" (kelas+mapel) yang sedang dikelola guru — model
 * Penugasan Mengajar menggantikan asumsi lama "1 guru = 1 mapel = semua
 * kelas di paket itu". Guru memilih satu penugasan dari kartu di Dashboard,
 * lalu semua halaman fitur (Materi/Tugas/Kuis/Absensi/Pertemuan Online/Nilai
 * Akhir) beroperasi dalam konteks itu sampai guru ganti pilihan.
 *
 * Sumber kebenaran: query string (?kelas_id=&mapel_id=&nama_kelas=&nama_mapel=)
 * — dihitung langsung saat render, TANPA state/effect, supaya tidak ada
 * render awal yang kosong lalu "berkedip" begitu efek jalan. localStorage
 * dipakai HANYA sebagai fallback ketika query string kosong (mis. guru
 * masuk lewat link sidebar yang tidak bawa query) — ini satu-satunya bagian
 * yang butuh effect+setState karena localStorage adalah API browser yang
 * tidak tersedia saat render server/pertama kali.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "lms_penugasan_aktif";

export interface PenugasanAktif {
  kelasId: number;
  mapelId: number;
  namaKelas: string;
  namaMapel: string;
}

export function usePenugasanAktif() {
  const params = useSearchParams();
  const kelasId = params.get("kelas_id");
  const mapelId = params.get("mapel_id");
  const namaKelas = params.get("nama_kelas");
  const namaMapel = params.get("nama_mapel");

  // Di-memo berdasarkan nilai primitif (bukan dibuat ulang tiap render) — halaman
  // pemanggil (guru/tugas, guru/pertemuan-online, dst.) menaruh `aktif` langsung
  // di dependency array useEffect. Object literal baru di setiap render bikin
  // effect itu re-trigger terus-menerus -> re-fetch tanpa henti -> render ulang
  // -> object baru lagi -> loop tak berujung. Ditemukan lewat network tab yang
  // menembak ulang endpoint pertemuan-online berkali-kali per detik alih-alih
  // sekali per 30 detik seperti seharusnya.
  const fromQuery: PenugasanAktif | null = useMemo(
    () =>
      kelasId && mapelId
        ? { kelasId: Number(kelasId), mapelId: Number(mapelId), namaKelas: namaKelas ?? "", namaMapel: namaMapel ?? "" }
        : null,
    [kelasId, mapelId, namaKelas, namaMapel],
  );

  const [fallback, setFallback] = useState<PenugasanAktif | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (fromQuery) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromQuery));
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- baca localStorage (API browser, tak tersedia saat render) untuk fallback saat tidak ada query string.
        if (stored) setFallback(JSON.parse(stored));
      }
    } catch {
      // localStorage tidak tersedia (mis. private mode) — abaikan, tetap null.
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId, mapelId]);

  return { aktif: fromQuery ?? fallback, ready };
}

/** Query string standar untuk link dari kartu penugasan -> halaman fitur. */
export function penugasanQueryString(p: PenugasanAktif): string {
  return new URLSearchParams({
    kelas_id: String(p.kelasId),
    mapel_id: String(p.mapelId),
    nama_kelas: p.namaKelas,
    nama_mapel: p.namaMapel,
  }).toString();
}
