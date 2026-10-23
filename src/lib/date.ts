/**
 * Helper format tanggal/jam terpusat — SELALU memaksa timeZone: "Asia/Taipei"
 * (UTC+8), tidak pernah bergantung pada timezone perangkat/OS pengguna.
 *
 * Tanpa ini, `new Date(value).toLocaleString("id-ID")` diam-diam memakai
 * timezone perangkat yang membuka halaman — kalau jam OS pengguna bukan waktu Taiwan,
 * semua tanggal/jam yang tampil di aplikasi ikut geser walau data di server
 * (dan perbandingan epoch time murni) sudah benar. PKBM PPI Taiwan beroperasi di
 * Taiwan (UTC+8), bukan Indonesia — HARUS sama dengan APP_TIMEZONE backend
 * (config/app.php = Asia/Taipei). Kalau dua sisi ini beda zona, tanggal-saja
 * (mis. tanggal pertemuan, yang dikirim backend sebagai tengah malam lokal)
 * tampil mundur 1 hari dan semua jam bergeser 1 jam.
 */

const TIME_ZONE = "Asia/Taipei";

/** Tanggal panjang + jam, mis. "22 September 2026, 22.28" — selalu waktu Taiwan. */
export function formatTanggalWaktu(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("id-ID", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tanggal saja, mis. "22/09/2026" — selalu waktu Taiwan. Bisa diberi opsi tambahan/override. */
export function formatTanggal(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("id-ID", { timeZone: TIME_ZONE, ...opts });
}

/** Jam saja, mis. "22.28" — selalu waktu Taiwan. */
export function formatWaktu(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("id-ID", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tanggal hari ini dalam format YYYY-MM-DD, dihitung berdasarkan waktu Taiwan —
 * BUKAN `new Date().toISOString().slice(0, 10)` (itu UTC, bisa salah mundur
 * 1 hari kalau dipanggil dini hari Taiwan, 00.00-07.59).
 */
export function hariIniStr(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Bulan ini dalam format YYYY-MM, dihitung berdasarkan waktu Taiwan. */
export function bulanIniStr(): string {
  return hariIniStr().slice(0, 7);
}

/**
 * Ubah value `<input type="datetime-local">` (naif, tanpa info zona — per
 * spek HTML berarti jam lokal DEVICE yang membuka halaman) jadi ISO string
 * UTC ("...Z") yang membawa instan (titik waktu) yang benar apa pun zona
 * device-nya — bukan cuma digit jam mentah. WAJIB dipakai sebelum mengirim
 * field jadwal (mis. mulai/selesai kuis) ke backend, supaya jadwal
 * menyesuaikan device pembuatnya, bukan asumsi timezone server.
 */
export function datetimeLocalToUtcIso(value: string): string {
  return new Date(value).toISOString();
}

/**
 * Kebalikan dari datetimeLocalToUtcIso() — dipakai untuk PRE-FILL input
 * `<input type="datetime-local">` saat mengedit data yang sudah tersimpan
 * (mis. form edit tugas), supaya yang tampil adalah jam lokal device saat
 * ini untuk instan (titik waktu) yang sama, bukan digit UTC mentah.
 */
export function utcIsoToDatetimeLocal(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Waktu relatif gaya feed sosial, mis. "3 jam yang lalu", "2 bulan yang lalu". */
export function formatRelatif(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffJam = Math.floor(diffMin / 60);
  if (diffJam < 24) return `${diffJam} jam yang lalu`;
  const diffHari = Math.floor(diffJam / 24);
  if (diffHari === 1) return "kemarin";
  if (diffHari < 30) return `${diffHari} hari yang lalu`;
  const diffBulan = Math.floor(diffHari / 30);
  if (diffBulan < 12) return diffBulan === 1 ? "sebulan yang lalu" : `${diffBulan} bulan yang lalu`;
  const diffTahun = Math.floor(diffHari / 365);
  return diffTahun === 1 ? "setahun yang lalu" : `${diffTahun} tahun yang lalu`;
}
