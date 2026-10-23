export type Role = "admin" | "guru" | "murid";

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  nis?: string | null;
  nip?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  // Hanya terisi untuk role admin — 'super' boleh kelola akun admin lain, 'staff' tidak (Bagian 10).
  admin_level?: "super" | "staff" | null;
  // Hanya terisi untuk role murid — lihat GET /auth/me (eager load muridProfile.kelas).
  muridProfile?: { paket: "A" | "B" | "C"; kelas: { id: number; nama_kelas: string } | null } | null;
}

/** GET /admin/admin-akun — daftar akun admin (Bagian 10). */
export interface AdminAkun {
  id: number;
  nama: string;
  email: string;
  admin_level: "super" | "staff";
  status: string;
}

/** GET /chat/kontak — daftar kontak chat personal (BUKAN forum Diskusi), otomatis mengikuti hubungan sekolah. */
export interface ChatKontak {
  id: number;
  nama: string | null;
  avatar_url: string | null;
  peran: string;
  pesan_terakhir: string | null;
  waktu_terakhir: string | null;
  belum_dibaca: number;
}

/** Satu baris di dalam GET /chat/{lawan}. pesan bernilai null kalau sudah "dihapus untuk semua orang". */
export interface ChatMessage {
  id: number;
  pengirim_id: number;
  pesan: string | null;
  pinned: boolean;
  dibaca_at: string | null;
  dihapus_untuk_semua_at: string | null;
  created_at: string;
}

/** GET /murid/leaderboard — papan peringkat kuis di kelas murid sendiri. */
export interface LeaderboardEntry {
  murid_id: number;
  nama: string;
  avatar_url: string | null;
  poin: number;
  peringkat: number;
}

export interface Leaderboard {
  poin_saya: number;
  peringkat_saya: number | null;
  total_murid: number;
  top: LeaderboardEntry[];
}

export interface Pengumuman {
  id: number;
  judul: string;
  gambar_url: string | null;
  pinned: boolean;
  badge_baru: boolean;
  konten?: string;
  // Field tambahan yang dikembalikan GET /admin/pengumuman (tampilan admin).
  target?: "semua" | "paket" | "kelas";
  target_id?: string | number | null;
  tanggal_mulai?: string;
  tanggal_berakhir?: string;
  status_publish?: "draft" | "published" | "expired";
}

export interface PertemuanOnline {
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

export interface Tugas {
  id: number;
  judul: string;
  deadline: string;
  status: "belum" | "terlambat" | "dinilai" | "terlewat";
  nilai: number | null;
}

/** GET /murid/tugas/{id} — detail tugas + submission murid (kalau sudah pernah mengumpulkan). */
export interface TugasDetailMurid {
  id: number;
  judul: string;
  instruksi: string | null;
  lampiran_url: string | null;
  deadline: string;
  mapel: string | null;
  lewat_deadline: boolean;
  submission: {
    jawaban: string | null;
    file_url: string | null;
    nilai: number | null;
    feedback: string | null;
    status: "belum" | "terlambat" | "dinilai";
    submitted_at: string | null;
  } | null;
}

export interface Pendaftaran {
  id: number;
  nama: string;
  email: string;
  no_hp: string;
  paket: "A" | "B" | "C";
  tgl_lahir: string;
  alamat: string | null;
  dokumen_url: string | null;
  status: "pending" | "approved" | "rejected";
  nis_generated: string | null;
  // Terisi kalau akun murid sudah dibuat dari pendaftaran ini lewat menu Tambah Murid (Bagian G).
  user_id: number | null;
  alasan_reject: string | null;
  created_at: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface GuruAkun {
  id: number;
  nama: string;
  email: string;
  nip: string | null;
  status: string;
  // Nama key ikut nama method relasi Eloquent (camelCase) — bukan snake_case.
  guruProfile?: { mapel?: { id: number; nama_mapel: string } | null } | null;
}

export interface MuridAkun {
  id: number;
  nama: string;
  email: string;
  nis: string | null;
  status: string;
  muridProfile?: { paket?: string; kelas_id?: number | null; kelas?: { id: number; nama_kelas: string } | null } | null;
}

export interface Kelas {
  id: number;
  nama_kelas: string;
  paket: "A" | "B" | "C";
  tingkat: string;
  // Nama key ikut nama method relasi Eloquent waliKelas() — Laravel men-snake_case-kan jadi wali_kelas di JSON.
  wali_kelas?: { id: number; nama: string } | null;
}

export interface Mapel {
  id: number;
  nama_mapel: string;
  kode: string;
  paket: "A" | "B" | "C";
}

/** Ringkasan guru pengampu — nested lewat relasi hasOne Mapel::guru() (GuruProfile). */
export interface GuruRingkas {
  user_id: number;
  no_hp?: string | null;
  user: { id: number; nama: string; avatar_url: string | null };
}

/** GET /murid/mapel — daftar mapel sesuai paket murid login. */
export interface MapelMurid {
  id: number;
  nama_mapel: string;
  kode: string;
  paket: "A" | "B" | "C";
  guru: GuruRingkas | null;
}

/** GET /murid/mapel/{id} — detail satu mapel untuk halaman kelas (header + info kelas). */
export interface MapelDetail {
  id: number;
  nama_mapel: string;
  kode: string;
  paket: "A" | "B" | "C";
  guru: GuruRingkas | null;
  jumlah_peserta: number;
  periode_akademik: string;
}

/** GET /murid/absensi — riwayat kehadiran murid, opsional difilter per mapel/bulan. */
export interface AbsensiMurid {
  id: number;
  mapel_id: number;
  tanggal: string;
  status: "hadir" | "izin" | "sakit" | "alpa";
  keterangan: string | null;
  mapel?: { id: number; nama_mapel: string };
}

/** GET /murid/nilai-akhir — nilai akhir per mapel yang sudah dirilis guru ke murid. */
export interface NilaiAkhirMurid {
  id: number;
  mapel_id: number;
  nilai_tugas: number;
  nilai_kuis: number;
  nilai_absensi: number;
  nilai_ujian: number;
  nilai_akhir: number;
  status_kelulusan: "lulus" | "tidak_lulus" | "pending";
  catatan_guru: string | null;
  mapel?: { id: number; nama_mapel: string };
}

export interface DiskusiReaksiRingkas {
  emoji: string;
  count: number;
  reacted: boolean;
}

/** GET/POST /diskusi — forum diskusi per mapel ATAU per materi (materi_id null = diskusi level-mapel lama). */
export interface Diskusi {
  id: number;
  mapel_id: number | null;
  materi_id: number | null;
  user_id: number;
  pesan: string;
  created_at: string;
  user: { id: number; nama: string; avatar_url: string | null; role: Role };
  reaksi_summary: DiskusiReaksiRingkas[];
}

export type MateriTipe = "pdf" | "video" | "link" | "teks" | "ppt" | "docx" | "gambar";

/** GET /murid/materi?mapel_id= */
export interface MateriMurid {
  id: number;
  mapel_id: number;
  guru_id: number;
  judul: string;
  tipe: MateriTipe;
  file_url: string | null;
  deskripsi: string | null;
  created_at: string;
  mapel?: { id: number; nama_mapel: string };
  guru?: { id: number; nama: string; avatar_url: string | null };
  diskusi_count?: number;
  reaksi_summary?: DiskusiReaksiRingkas[];
}

/** GET /murid/kuis?mapel_id= */
export interface KuisMurid {
  id: number;
  mapel_id: number;
  guru_id: number;
  kelas_id: number;
  judul: string;
  durasi_menit: number;
  total_soal: number;
  random_soal: boolean;
  mulai: string;
  selesai: string;
}

export type SoalKuisTipe = "pilihan_ganda" | "benar_salah" | "isian_singkat" | "esai";

/** Soal yang dikirim ke murid saat mengerjakan — jawaban_benar disembunyikan backend. */
export interface SoalKuisMurid {
  id: number;
  pertanyaan: string;
  tipe: SoalKuisTipe;
  opsi: string[] | null;
  poin: number;
}

export interface SubmissionTugas {
  id: number;
  tugas_id: number;
  murid: { id: number; nama: string; nis: string };
  file_url: string | null;
  jawaban: string | null;
  nilai: number | null;
  feedback: string | null;
  submitted_at: string | null;
  status: "belum" | "terlambat" | "dinilai";
}

/** GET /admin/kelulusan — antrean nilai akhir yang menunggu verifikasi admin. */
export interface KelulusanAdmin {
  id: number;
  murid_id: number;
  mapel_id: number;
  nilai_tugas: number;
  nilai_kuis: number;
  nilai_absensi: number;
  nilai_ujian: number;
  nilai_akhir: number;
  status_kelulusan: "lulus" | "tidak_lulus" | "pending";
  catatan_guru: string | null;
  rekomendasi_guru_lulus: boolean;
  murid: { id: number; nama: string; nis: string };
  mapel: { id: number; nama_mapel: string };
}

/** GET/PUT /admin/bobot-nilai — bobot default perhitungan nilai akhir. */
export interface BobotNilai {
  id: number;
  mapel_id: number | null;
  bobot_tugas: number;
  bobot_kuis: number;
  bobot_absensi: number;
  bobot_ujian: number;
  passing_grade: number;
}
