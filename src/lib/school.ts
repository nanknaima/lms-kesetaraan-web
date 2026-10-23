/**
 * Konten profil sekolah & kontak admin yang tampil di halaman publik (login, dsb).
 * Teks di bawah ini draf awal — silakan edit sesuai info PKBM PPI Taiwan yang sebenarnya.
 */
export const SEKOLAH = {
  nama: "PKBM PPI Taiwan",
  tagline: "Sekolah Kesetaraan Paket A, B & C untuk WNI di Taiwan",
  deskripsi:
    "PKBM PPI Taiwan adalah lembaga pendidikan kesetaraan yang melayani anak, remaja, dan pekerja migran Indonesia di Taiwan yang ingin menuntaskan jenjang SD, SMP, atau SMA lewat jalur Paket A, B, dan C — tanpa harus meninggalkan pekerjaan atau aktivitas sehari-hari.",
  keunggulan: [
    { icon: "ijazah", title: "Ijazah setara & diakui", text: "Lulusan Paket A/B/C setara SD/SMP/SMA dan diakui untuk melanjutkan sekolah atau melamar kerja di Indonesia maupun luar negeri." },
    { icon: "fleksibel", title: "Belajar fleksibel", text: "Kelas online & materi bisa diakses kapan saja, cocok untuk yang bekerja penuh waktu di Taiwan." },
    { icon: "bahasa", title: "Diajar guru berbahasa Indonesia", text: "Semua pengajar dan materi menggunakan Bahasa Indonesia, disesuaikan kurikulum kesetaraan nasional." },
    { icon: "pendampingan", title: "Pendampingan langsung", text: "Tim admin & wali kelas siap membantu lewat WhatsApp untuk kendala akademik maupun teknis." },
  ],
} as const;

export const KONTAK_ADMIN = {
  // TODO: ganti dengan nomor WhatsApp admin PKBM PPI Taiwan yang sebenarnya (format 62xxxxxxxxxx, tanpa + atau 0 di depan).
  whatsappNomor: "6281234567890",
  waLink:
    "https://wa.me/6281234567890?text=" +
    encodeURIComponent("Halo Admin PKBM PPI Taiwan, saya butuh bantuan terkait akun LMS."),
  // TODO: ganti dengan email admin yang sebenarnya.
  email: "admin@pkbmppitaiwan.sch.id",
} as const;
