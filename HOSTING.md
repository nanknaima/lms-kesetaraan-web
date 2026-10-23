# Tutorial Hosting LMS Kesetaraan (Gratis vs Berbayar)

Catatan sebelum mulai: dokumen `docs/deployment.md` yang sudah ada itu isinya lebih ke arah "production serius" — VPS berbayar, Vercel, dan seterusnya. File ini beda fokus, khusus buat yang mau coba hosting **gratisan dulu** sebelum keluar duit, sekalian dikasih tau kapan sebenarnya opsi gratis itu nggak cukup dan harus mulai mikir bayar.

Info di bawah ini saya cek ulang per September 2026, karena kebijakan free tier provider cloud itu suka berubah-ubah tanpa kabar (Railway sama Oracle contohnya baru aja mengubah aturan free tier mereka tahun ini).

## Gambaran umum dulu

Project ini ada 3 bagian yang butuh tempat tinggal masing-masing:

1. Backend Laravel + database MySQL — ini yang paling "berat", butuh server beneran.
2. Frontend Next.js (web) — ini ringan, banyak platform kasih gratis selamanya.
3. Aplikasi mobile Flutter — ini bukan soal hosting server, tapi soal distribusi ke Play Store / App Store.

Saya bahas satu-satu, terus di akhir saya kasih rangkuman kalau mau web doang, mobile doang, atau dua-duanya sekaligus.

## Backend + Database (bagian paling menentukan)

Ini bagian yang paling sering bikin orang nyerah dan langsung bayar, padahal sebenarnya masih ada opsi gratis yang lumayan serius kalau tau caranya.

### Opsi gratis: Oracle Cloud "Always Free"

Ini satu-satunya provider besar yang free tier-nya beneran gratis selamanya, bukan trial 30 hari atau credit yang abis-abis. Cocok banget buat hosting Laravel + MySQL karena dikasih VM beneran (bukan cuma serverless function yang tidur kalau nggak dipakai).

Yang didapat sekarang (per pertengahan 2026 mereka sempat mengurangi jatahnya, jadi ini angka yang berlaku sekarang):
- 2 OCPU dan 12GB RAM di instance ARM (Ampere A1) — ini yang dipakai buat jalanin Laravel-nya
- Ditambah 2 instance kecil AMD (1/8 OCPU, 1GB RAM masing-masing) kalau mau dipisah, misalnya satu buat backend satu buat worker/queue
- 200GB storage block, jadi ga bakal kehabisan ruang buat database dan file upload
- Gratis selamanya, nggak ada tanggal kedaluwarsa

2 OCPU + 12GB itu sebenarnya sudah lebih dari cukup buat Laravel + MySQL + Next.js kalau mau digabung sekalian di satu VM buat skala LMS sekolah (bukan skala ribuan user bersamaan).

Alur singkatnya kalau mau coba:
1. Daftar akun Oracle Cloud (butuh kartu kredit/debit buat verifikasi, tapi nggak bakal kena tagihan selama pakai resource yang "Always Free")
2. Bikin Compute Instance, pilih shape "VM.Standard.A1.Flex", atur ke 2 OCPU / 12GB RAM
3. Install stack seperti biasa: nginx, PHP 8.2-fpm, MySQL, Composer — persis kayak yang udah dijelasin di `docs/deployment.md` bagian VPS, cuma servernya gratis
4. Jangan lupa buka port 80/443 di security list Oracle-nya (ini yang sering kelewat, orang udah setting nginx bener tapi tetep nggak bisa diakses gara-gara firewall Oracle-nya belum dibuka)

Kekurangannya: proses daftar Oracle Cloud memang agak ribet dan kadang verifikasi kartu kreditnya suka ditolak tanpa alasan jelas (ini keluhan yang lumayan umum). Kalau kejadian, coba lagi beberapa hari kemudian atau pakai kartu dari bank lain.

### Kenapa bukan Railway?

Sempat kepikiran Railway karena gampang banget deploy-nya (tinggal connect GitHub, otomatis kedetect Laravel), tapi setelah dicek lagi free tier-nya sekarang cuma:
- Credit awal $5 buat coba-coba doang
- Setelah itu cuma dapat $1/bulan credit gratis
- Dibatasi 512MB RAM dan 2 vCPU

$1/bulan itu bakal abis dalam hitungan hari kalau backend jalan terus-terusan 24 jam. Jadi Railway ini lebih cocok buat testing sebentar, bukan buat hosting yang jalan terus. Kalau nanti sudah siap bayar, Railway baru masuk akal (sekitar $5-10/bulan tergantung pemakaian).

### Kalau sudah siap bayar

Kalau nanti usernya udah banyak dan 2 OCPU/12GB Oracle udah kerasa sempit, opsi VPS berbayar yang worth dicoba:
- DigitalOcean / Biznet Gio — mulai sekitar $6/bulan (sudah ada di `docs/deployment.md`)
- Railway — lebih simpel tapi bayar per pemakaian
- Laravel Forge/Ploi kalau mau yang ada panel manajemen server, tapi ini biaya tambahan di luar biaya VPS-nya

## Frontend Next.js

Bagian ini gampang, hampir semua platform kasih gratis selamanya buat project kayak gini:

**Vercel** — ini pilihan paling pas karena Next.js emang buatan mereka sendiri, jadi semua fitur (image optimization, server actions, dll) jalan mulus tanpa konfigurasi tambahan. Free tier "Hobby"-nya cukup buat kebutuhan LMS sekolah — bandwidth dan build minutes-nya jauh dari batas kalau bukan skala ribuan pengunjung bersamaan.

Untuk deploy, hubungkan repo frontend ke Vercel dan gunakan root directory repo frontend. Isi
`NEXT_PUBLIC_API_URL` dengan URL backend lengkap sampai `/api`, misalnya
`https://lms-kesetaraan-api.vercel.app/api` (akhiri `/api` tepat satu kali), lalu deploy
Production. Di backend Laravel, izinkan origin frontend HTTPS di `config/cors.php`.
Jika memakai Sanctum stateful cookies, set `SANCTUM_STATEFUL_DOMAINS` ke domain frontend
tanpa skema; API web saat ini mengirim bearer token. Untuk error login database TiDB,
pastikan konfigurasi MySQL backend mengaktifkan TLS dan seluruh environment variables
database Vercel sudah benar.

Gratis di sini beneran gratis selamanya, jadi nggak ada alasan buat bayar untuk bagian frontend kecuali butuh custom domain enterprise atau traffic yang udah gede banget.

## Database

Nggak perlu cari layanan database terpisah (kayak PlanetScale atau semacamnya) yang bakal nambah kerumitan. MySQL yang jalan di VM Oracle Cloud yang sama dengan Laravel udah cukup — malah lebih cepat karena backend dan database satu jaringan lokal, nggak ada latency network tambahan.

Yang penting jangan lupa backup rutin. Bisa pakai cron job sederhana yang nge-dump database ke file terus disimpan (misalnya `mysqldump` dijadwalin tiap malam), soalnya di free tier nggak ada backup otomatis kayak layanan managed database berbayar.

## File upload (foto profil, gambar pengumuman, dll)

Paling simpel: simpan langsung di storage VM Oracle Cloud-nya (200GB itu banyak banget buat foto-foto ukuran normal). Laravel udah support ini secara default lewat `storage/app/public`.

Kalau suatu saat mau yang lebih niat (misalnya biar gambar otomatis di-resize/optimize dan dilayani lewat CDN biar loading-nya cepet dari mana aja), **Cloudinary** ada free tier yang lumayan (25GB storage dan bandwidth per bulan gratis). Tapi ini optional aja, buat awal-awal storage lokal di VM udah lebih dari cukup.

## Mobile: Android

Ada dua jalur, tergantung mau resmi lewat Play Store atau nggak:

**Jalur gratis total**: build APK (`flutter build apk --release`) terus bagikan filenya langsung ke murid/guru buat di-install manual (sideload). Nggak keluar biaya sepeser pun. Kekurangannya user harus izinin "install dari sumber tidak dikenal" di HP mereka, dan nggak ada update otomatis — tiap ada versi baru harus sebar ulang APK-nya.

**Jalur Play Store resmi**: sekarang biayanya $25, tapi ini bayar SEKALI SEUMUR HIDUP (bukan langganan tahunan kayak dulu banyak yang kira). Cuma ada satu hal yang perlu diketahui: akun developer baru sekarang WAJIB ngelewatin fase "closed testing" dulu — minimal 12 tester aktif, selama 14 hari berturut-turut, sebelum aplikasinya boleh dipublish ke publik. Jadi rencanain waktu buat fase ini kalau target rilis resmi di Play Store.

Untuk LMS sekolah, jalur APK sideload sebenarnya cukup masuk akal di awal-awal (murid dan guru kan bisa dikasih instruksi cara install), baru nanti kalau udah mau lebih profesional/gampang diakses publik, upgrade ke Play Store.

## Mobile: iOS

Ini bagian yang nggak ada jalan gratisnya sama sekali, apapun caranya. Apple mewajibkan **Apple Developer Program**, $99/tahun (dan ini langganan tahunan terus, bukan sekali bayar), buat bisa build dan submit aplikasi ke App Store — termasuk buat TestFlight (versi beta testing-nya) sekalipun.

Selain itu juga butuh Mac buat proses build/submit-nya (atau pakai layanan Mac cloud/CI kalau nggak punya Mac fisik, tapi itu nambah biaya lagi). Jadi kalau budget belum ada, realistisnya rilis iOS ini ditunda dulu, fokus ke Android + web duluan.

## Rangkuman kalau bingung pilih yang mana

**Cuma mau hosting web (Next.js + Laravel + MySQL)**: Oracle Cloud Always Free buat backend & database, Vercel free buat frontend. Total biaya: Rp 0, dan ini beneran gratis selamanya bukan trial.

**Cuma mau hosting mobile (Android + iOS)**: nggak ada istilah "hosting" di sini, backendnya tetep butuh server (ya pakai Oracle Cloud di atas). Buat distribusi, Android bisa gratis total (APK sideload) atau $25 sekali bayar (Play Store). iOS wajib $99/tahun, nggak ada opsi gratis.

**Mau web dan mobile sekaligus**: backend & database & web frontend tetep gratis total (Oracle Cloud + Vercel). Yang bayar cuma bagian distribusi mobile-nya doang — kalau cuma Android dan mau resmi di Play Store ya $25 sekali, kalau mau nambah iOS juga baru ketemu biaya rutin $99/tahun.

Jadi sebenarnya biaya paling gede itu bukan di hosting server-nya (itu bisa Rp 0 kalau pakai Oracle Cloud), tapi di distribusi iOS App Store. Kalau budget terbatas, saran saya: mulai dari web + Android dulu (total bisa Rp 0 kalau APK sideload, atau ~Rp 400 ribuan sekali kalau mau resmi di Play Store), iOS nyusul belakangan kalau memang dibutuhkan.
