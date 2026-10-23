/**
 * Unduh/putar berkas lewat endpoint backend yang butuh Sanctum bearer token
 * (mis. /murid/materi/{id}/download|stream) — <a href>/<video src> polos
 * tidak bisa membawa header Authorization, jadi harus fetch()+blob dulu.
 * Pola yang sama sudah dipakai di guru/absensi/page.tsx untuk export Excel/PDF.
 */
import { getAccessToken } from "./api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://lms-kesetaraan-api.vercel.app/api";

async function fetchBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error("Gagal memuat berkas.");
  return res.blob();
}

/** Unduh berkas & langsung simpan ke perangkat memakai nama file yang diberikan. */
export async function unduhBerkas(path: string, filename: string): Promise<void> {
  const blob = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Ambil object URL sementara (untuk dipasang ke <video src>) — panggil URL.revokeObjectURL saat sudah tidak dipakai. */
export async function ambilBlobUrl(path: string): Promise<string> {
  const blob = await fetchBlob(path);
  return URL.createObjectURL(blob);
}

/**
 * Ambil berkas untuk DILIHAT dulu (bukan langsung diunduh) — dipakai bareng
 * <PreviewModal> (lihat components/ui/PreviewModal.tsx) supaya tampil di
 * DALAM halaman (bukan tab baru). Tab baru punya masalah nyata: tab kosong
 * yang cuma berisi satu blob: URL tidak punya riwayat sama sekali, jadi
 * tombol "kembali" browser SELALU nonaktif di situ — bukan bug yang bisa
 * diperbaiki dari sisi kita, makanya solusinya diganti jadi modal in-page
 * yang kita kendalikan sendiri tombol tutup/kembalinya.
 */
export async function ambilBlobUntukPreview(path: string): Promise<{ url: string; mimeType: string }> {
  const blob = await fetchBlob(path);
  return { url: URL.createObjectURL(blob), mimeType: blob.type || "application/octet-stream" };
}
