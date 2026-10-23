/**
 * Tipe-tipe khusus halaman guru (materi, kuis, absensi, pertemuan online, nilai akhir).
 * Didefinisikan terpisah dari src/lib/types.ts agar tidak bentrok dengan perubahan paralel di sana.
 */
import type { DiskusiReaksiRingkas } from "./types";

export interface MuridRingkasKelas {
  user_id: number;
  paket: "A" | "B" | "C";
  kelas_id: number;
  tgl_lahir: string;
  alamat: string | null;
  status_kelulusan: string;
  user: { id: number; nama: string; nis: string | null };
}

/** GET /guru/kelas — kelas yang diampu guru (sesuai paket mapel-nya) beserta roster murid lengkap. */
export interface KelasGuru {
  id: number;
  nama_kelas: string;
  paket: "A" | "B" | "C";
  tingkat: string;
  murid: MuridRingkasKelas[];
}

export type MateriTipe = "pdf" | "video" | "link" | "teks" | "ppt" | "docx" | "gambar";

/** GET /guru/materi */
export interface MateriGuru {
  id: number;
  mapel_id: number;
  guru_id: number;
  judul: string;
  tipe: MateriTipe;
  file_url: string | null;
  deskripsi: string | null;
  created_at: string;
  diskusi_count?: number;
  reaksi_summary?: DiskusiReaksiRingkas[];
}

/** GET /guru/kuis */
export interface KuisGuru {
  id: number;
  kelas_id: number;
  judul: string;
  durasi_menit: number;
  total_soal: number;
  random_soal: boolean;
  mulai: string;
  selesai: string;
  soal_count: number;
}

export type SoalKuisTipe = "pilihan_ganda" | "benar_salah" | "isian_singkat" | "esai";

/** Soal di dalam GET /guru/kuis/{id} — jawaban_benar terlihat oleh guru (berbeda dari sisi murid). */
export interface SoalKuisGuru {
  id: number;
  pertanyaan: string;
  tipe: SoalKuisTipe;
  opsi: string[] | null;
  jawaban_benar: string;
  poin: number;
  urutan: number;
}

export interface KuisDetailGuru extends KuisGuru {
  soal: SoalKuisGuru[];
}

export interface RekapNilaiKuis {
  murid_id: number;
  total_skor: number;
  murid: { id: number; nama: string; nis: string | null };
}

export interface EsaiPendingKuis {
  id: number;
  murid: { id: number; nama: string; nis: string | null };
  soal: { id: number; pertanyaan: string };
  jawaban?: string;
}

export interface HasilKuisGuru {
  rekap_nilai: RekapNilaiKuis[];
  esai_pending: EsaiPendingKuis[];
}

export type StatusAbsensi = "hadir" | "izin" | "sakit" | "alpa";

/** GET /guru/absensi?tanggal= */
export interface AbsensiGuruRow {
  id: number;
  mapel_id: number;
  murid_id: number;
  tanggal: string;
  status: StatusAbsensi;
  keterangan: string | null;
  otomatis: boolean;
  murid: { id: number; nama: string; nis: string | null };
}

/** Satu baris rekap bulanan per murid, dari GET /guru/absensi/rekap?bulan= */
export interface RekapAbsensiItem {
  murid_id: number;
  status: StatusAbsensi;
  total: number;
  murid: { id: number; nama: string; nis: string | null };
}

export type RekapAbsensiResponse = Record<string, RekapAbsensiItem[]>;

/** GET /guru/pertemuan-online — bentuk sama dengan PertemuanOnline murid. */
export interface PertemuanOnlineGuru {
  id: number;
  judul: string;
  platform: "zoom" | "google_meet" | "lainnya";
  link_meeting: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  agenda: string | null;
  status: "terjadwal" | "terlaksana" | "batal";
  join_aktif: boolean;
  sudah_selesai: boolean;
}

/** Satu baris rincian komponen nilai, snapshot saat NilaiAkhir dihitung (lihat rincian_komponen). */
export interface RincianKomponenNilai {
  komponen_nilai_id: number;
  nama: string;
  tipe: KomponenNilaiTipe;
  bobot_persen: number;
  nilai: number;
}

/** GET /guru/nilai-akhir */
export interface NilaiAkhirGuru {
  id: number;
  murid_id: number;
  mapel_id: number;
  /** @deprecated Sisa skema bobot lama (Bagian 5) — nilai_kuis & nilai_ujian sudah tidak diisi lagi, pakai rincian_komponen. */
  nilai_tugas: number | null;
  nilai_kuis: number | null;
  nilai_absensi: number | null;
  nilai_ujian: number | null;
  rincian_komponen: RincianKomponenNilai[] | null;
  nilai_akhir: number;
  status_kelulusan: "lulus" | "tidak_lulus" | "pending";
  catatan_guru: string | null;
  rekomendasi_guru_lulus: boolean | null;
  dikirim_ke_admin_at: string | null;
  verified_by_admin: boolean;
  dirilis_ke_murid: boolean;
  murid: { id: number; nama: string; nis: string | null };
}

/** Satu murid yang dilewati saat POST /guru/nilai-akhir/kirim-admin-massal, beserta alasannya. */
export interface KirimAdminMassalDilewati {
  nama: string;
  alasan: string;
}

/** Response POST /guru/nilai-akhir/kirim-admin-massal?mapel_id= */
export interface KirimAdminMassalResponse {
  message: string;
  jumlah_terkirim: number;
  terkirim: string[];
  jumlah_dilewati: number;
  dilewati: KirimAdminMassalDilewati[];
}

export type KomponenNilaiTipe = "manual" | "auto_tugas" | "auto_absensi";

/** GET/POST/PUT /guru/komponen-nilai?mapel_id= — komponen penilaian fleksibel per mapel (Bagian 5). */
export interface KomponenNilai {
  id: number;
  mapel_id: number;
  nama: string;
  tipe: KomponenNilaiTipe;
  bobot_persen: number;
  urutan: number;
}

/** Satu baris murid dalam GET /guru/nilai-komponen/matriks. */
export interface BarisMatriksNilai {
  murid_id: number;
  murid: { id: number; nama: string; nis: string | null };
  nilai_per_komponen: Record<number, number | null>;
  nilai_akhir: number;
}

/** GET /guru/nilai-komponen/matriks?mapel_id=&kelas_id= — data spreadsheet nilai. */
export interface MatriksNilai {
  komponen: KomponenNilai[];
  bobot_total: number;
  baris: BarisMatriksNilai[];
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

// ==================== Penugasan Mengajar ====================
// Model baru pengganti "1 guru = 1 mapel": guru mengampu kombinasi
// (kelas, mapel) spesifik, dikelola admin atau diajukan sendiri oleh guru.
// Lihat backend Api\Admin\PenugasanController & Api\Guru\PenugasanMengajarController.

export type StatusPenugasan = "diajukan" | "disetujui" | "ditolak" | "dicabut";
export type DiajukanOleh = "admin" | "guru";

/** GET /admin/penugasan, GET /guru/penugasan-saya */
export interface PenugasanMengajar {
  id: number;
  guru_id: number;
  kelas_id: number;
  mapel_id: number;
  status: StatusPenugasan;
  diajukan_oleh: DiajukanOleh;
  catatan_guru: string | null;
  catatan_admin: string | null;
  created_at: string;
  updated_at: string;
  guru?: { id: number; nama: string; nip?: string | null };
  kelas?: { id: number; nama_kelas: string; paket?: "A" | "B" | "C"; tingkat?: string };
  mapel?: { id: number; nama_mapel: string; kode?: string; paket?: "A" | "B" | "C" };
}

/** Satu kombinasi kelas x mapel (satu paket) dari GET /guru/kelas-mapel-tersedia. */
export interface KelasMapelKombinasi {
  kelas_id: number;
  nama_kelas: string;
  tingkat: string;
  mapel_id: number;
  nama_mapel: string;
  kode_mapel: string;
  status: "kosong" | "terisi";
  guru_pengampu: { id: number; nama: string } | null;
}

export type KelasMapelTersediaResponse = Record<"A" | "B" | "C", KelasMapelKombinasi[]>;
