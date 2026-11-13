# PLAN - DEVVERSE v1 (Project Cockpit)

`Status: PROPOSED`

Source: instruksi manusia 12 Nov 2026 ("ini adalah produk lek, tidak ada batas waktu
yang menuntutnya harus jadi besok, untuk anak SMK kelas 1-3 dan juga mahasiswa baru atau
fresh graduate programmer") + discovery 12 produk di lab ini + Stack Overflow Developer
Survey 2025 + perbandingan langsung dengan OpenSSF Scorecard.

## 1. Goal

Seseorang yang baru selesai mengerjakan sebuah proyek - siswa SMK kelas 1 sampai 3,
mahasiswa baru, atau fresh graduate - bisa menempelkan URL repository GitHub dan dalam
satu menit melihat laporan kesiapan yang jujur dan sesuai tingkatnya: proyeknya sudah
sampai tangga mana, satu hal apa yang harus diperbaiki berikutnya, dan kenapa itu
penting. Hari ini orang itu tidak punya cara menjawab "apakah ini sudah cukup baik?"
selain menebak, dan orang di sekitarnya menilai dari kelengkapan tugas, bukan dari
apakah barangnya benar-benar jalan.

Produk ini bukan kumpulan alat. Ia satu pertanyaan yang belum dijawab alat lain:
apakah yang kubangun ini sudah nyata.

## 2. Acceptance

Seorang asing bisa menjalankan ini dan menghitung hasilnya:

- `pnpm test` lulus dengan minimal 25 kasus di 4 file: unit engine, kontrak adapter
  GitHub, end-to-end API, dan render halaman laporan.
- `pnpm build` keluar 0, dan `dist/` tidak memuat string token GitHub - diuji oleh satu
  kasus yang memindai hasil build.
- `POST /api/analyze` untuk 3 repository fixture menghasilkan verdict yang persis sama
  dengan berkas `fixtures/expected.json`. Berkas itu ditulis tangan lebih dulu, sebelum
  engine dijalankan; selisih sekecil apa pun menggagalkan test.
- Menganalisis repository dan commit yang sama dua kali menghasilkan verdict identik -
  diuji dengan menjalankan engine dua kali pada fixture yang sama.
- Halaman `/r/:id` dirender di 390px dan 1440px oleh Playwright tanpa overflow
  horizontal, diukur dari lebar dokumen.
- Repository yang tidak ada mengembalikan 404 dengan pesan bahasa Indonesia, bukan
  stack trace.
- `product-gate.ps1 -ProjectDir devverse` melaporkan minimal 7 dari 10 kriteria PASS
  pada produk ini sendiri.

## 3. Scope and non-goals

**In scope.** v1 adalah lima fase berurutan, bukan satu sprint:

1. Engine penilaian: definisi check, tangga 4 level, adapter GitHub - semuanya fungsi
   murni yang bisa diuji tanpa jaringan.
2. Laporan anonim: tempel URL, dapat laporan, dapat tautan permanen yang bisa dibagikan
   tanpa akun.
3. Akun: login GitHub, daftar proyek tersimpan, riwayat skor per commit.
4. Loop pertumbuhan: "satu perbaikan berikutnya" yang diturunkan dari check yang gagal,
   dan progres yang hanya bergerak kalau buktinya berubah.
5. Halaman `/how`: satu paragraf per check dalam bahasa Indonesia, tanpa login. Ini
   lapisan mengajarnya, dan ia harus ada sejak fase 2 supaya laporan tidak berhenti jadi
   vonis.

**Non-goals.** Sengaja tidak ada di v1, beserta alasannya:

- Repository privat. Butuh scope OAuth tambahan dan kewajiban menyimpan kode orang lain.
  Belum perlu untuk membuktikan produknya jalan.
- Fitur AI apa pun. Biaya per pengguna, dan paling mudah ditiru. Masuk setelah ada
  pengguna yang bertahan.
- Enam modul workshop (JSON, regex, SQL, markdown, playground, vault). Semuanya sudah
  dimenangkan alat gratis yang mapan; diparkir di `IDEA-PARKING.md`.
- Skill tree visual, achievement, daily challenge. Efeknya baru ada kalau sudah ada data
  bukti. Membangunnya lebih dulu berarti membangun gamifikasi tanpa sesuatu untuk
  digamifikasi.
- Aplikasi mobile native. Web responsif cukup.

## 4. Surfaces

- `/` - halaman masuk: satu penjelasan singkat, satu input URL, satu tombol. Tugasnya
  cuma mendapatkan satu URL. Bukan bagian halaman lain karena tanpa ini tidak ada yang
  bisa dianalisis.
- `/r/:id` - laporan: skor per level, daftar check dengan verdict dan buktinya, satu
  perbaikan berikutnya. Bisa dibuka tanpa akun karena inilah artefak yang dibagikan.
- `/how` - penjelasan tiap check dalam bahasa manusia. Terpisah dari laporan karena
  laporan menjawab "proyekku bagaimana", halaman ini menjawab "check ini maksudnya apa".
- `/login` - fase 3, masuk dengan GitHub. Terpisah karena laporan harus tetap bisa
  dibuka tanpa ini.
- `/dashboard` - fase 3, daftar proyek tersimpan dan riwayat skornya per commit.
- `not-found` dan `error` - dua halaman kegagalan, bukan dialog.

## 5. Data

Fase 1 tidak menyimpan apa pun. Engine hanya membaca repository publik lewat GitHub API
dan mengembalikan objek di memori.

Fase 2 menambah dua tabel:

- `analysis`: id (nanoid 12 karakter, jadi bagian URL), owner, repo, commit_sha,
  engine_version, created_at, ip_hash.
- `check_result`: analysis_id, check_id, level, verdict (`lulus` / `gagal` /
  `tidak_tahu`), evidence_path, evidence_url, detail.

Kepemilikan: sebuah analysis milik siapa pun yang punya tautannya. Tidak ada akun di
fase 2. `ip_hash` hanya untuk pembatasan laju, tidak pernah ditampilkan. Masa simpan sudah
diputuskan manusia: laporan 30 hari, `ip_hash` 24 jam, penghapusan lewat satu perintah
berkala (bagian 10).

Fase 3 menambah `user`, `session`, `account`, dan `saved_project` lewat pustaka auth.
`saved_project` menunjuk ke `analysis`, bukan menyalinnya, sehingga riwayat per commit
tidak diduplikasi.

## 6. States

Setiap permukaan harus punya state ini sebelum boleh disebut selesai:

- Halaman masuk: kosong (belum ada URL), URL tidak valid, sedang menganalisis (dengan
  progres per tahap, bukan spinner buta), gagal (repo tidak ada / privat / kena batas
  laju), sukses (pindah ke laporan).
- Laporan: lengkap, sebagian (beberapa check `tidak_tahu` karena API tidak bisa membaca
  workflow), kedaluwarsa (commit sudah berubah sejak dianalisis), tidak ditemukan
  (tautan sudah dihapus).
- Tiap check: lulus, gagal, tidak tahu. `tidak_tahu` selalu membawa alasan satu kalimat,
  karena "tidak tahu" tanpa alasan lebih buruk daripada gagal.
- Batas laju: 429 dengan waktu reset dinyatakan dalam bahasa manusia.
- Izin: fase 3, dashboard akun lain tidak bisa dibuka.

## 7. Risks

- **Batas laju GitHub 60 permintaan per jam tanpa token membuat alat ini mati pada
  pengunjung ke-30.** Dicek oleh: test kontrak yang memastikan klien selalu mengirim
  token server, dan satu test handler 429 dengan respons fixture.
- **Engine memberi verdict salah pada stack yang tidak dikenal** - misalnya proyek
  Laravel atau PHP polos yang lazim di sekolah. Dicek oleh: tiga repository fixture
  dengan verdict yang ditulis tangan di `fixtures/expected.json`, dijalankan di CI
  setiap push.
- **Token GitHub bocor ke browser.** Dicek oleh: satu test yang memindai `dist/` dan
  gagal kalau string token muncul di bundle.
- **TanStack Start lebih sedikit contohnya, dan model gratis menulisnya lebih buruk.**
  Dicek oleh tripwire fase 0: kalau rute pertama + server function + baca database belum
  jalan dalam satu sesi kerja, pindah ke Next.js App Router. Engine dan lapisan data
  tidak bergantung framework, jadi biaya pindahnya terbatas pada routing dan server
  function.
- **Laporan 0/10 memalukan pemula dan membuatnya pergi.** Dicek oleh tangga level:
  repository yang baru sampai Level 1 merender "Level 1 lulus, berikutnya Level 2" dan
  tidak pernah menampilkan 0/10. Dibuktikan oleh render fixture `bare-html` di test.
- **Verdict berubah antar versi engine sehingga laporan lama jadi salah.** Dicek oleh:
  `engine_version` disimpan di setiap analysis, dan satu test yang menjalankan ulang
  fixture di bawah engine yang sama lalu membandingkan hasilnya.
- **Check yang flaky** - hasil berbeda untuk repo yang sama. Dicek oleh: test yang
  menjalankan engine dua kali pada fixture yang sama dan membandingkan verdict.
- **Alat ini jadi gerbang yang hanya bilang tidak, dan tidak ada yang membagikannya.**
  Dicek oleh: review manual 10 repository nyata sebelum rilis, mencatat mana laporan yang
  kalimatnya menuduh dan mana yang menuntun.

## 8. Build order

Fase 0 - fondasi, tanpa fitur:

1. Skeleton repo: pnpm, TypeScript strict, TanStack Start, Vitest, ESLint, satu workflow
   CI - verifikasi dengan `pnpm build` dan `pnpm test` hijau di GitHub Actions pada push
   pertama.
2. Skema Postgres dan satu migrasi dasar - verifikasi dengan test naik-turun migrasi
   pada database sekali pakai.

Fase 1 - engine, tanpa UI:

3. Definisi check dan tangga 4 level sebagai modul TypeScript murni tanpa jaringan -
   verifikasi dengan unit test pada fixture di memori.
4. Adapter GitHub di balik satu interface, dengan respons rekaman sebagai fixture -
   verifikasi dengan test kontrak yang tidak memanggil jaringan.

Fase 2 - laporan:

5. `POST /api/analyze`, tabel `analysis` dan `check_result` - verifikasi dengan test
   end-to-end pada tiga fixture. Berhenti di sini kalau keputusan masa simpan data belum
   dijawab.
6. Halaman `/`, `/r/:id`, `/how` - verifikasi dengan render Playwright di 390px dan
   1440px, termasuk state kosong, gagal, dan `tidak_tahu`.

Fase 3 - akun:

7. Login GitHub dan `/dashboard` dengan `saved_project` - verifikasi dengan test izin:
   akun A tidak bisa membuka proyek akun B.
8. Riwayat skor per commit - verifikasi dengan test yang menganalisis dua commit berbeda
   dari fixture yang sama dan memastikan delta tercatat.
9. Riwayat anonim di klaim saat login: laporan yang dulu dibuat tanpa akun bisa
   dihubungkan ke akun baru, diuji dengan satu kasus yang memastikan tidak bisa diklaim
   dua kali.

Fase 4 - loop:

10. "Satu perbaikan berikutnya" diturunkan dari check yang gagal, dengan penjelasan per
    check - verifikasi dengan render satu laporan yang punya tiga check gagal dan
    memastikan hanya satu yang disorot.
11. Jalankan `product-gate.ps1` pada produk ini sendiri - verifikasi minimal 7 dari 10
    PASS.

## 9. Evidence plan

Semua bukti baru, karena seluruh permukaan baru:

- `pnpm test` - unit engine, kontrak adapter, end-to-end API, izin, render.
- `pnpm build` keluar 0, plus pemindaian `dist/` untuk token.
- Render Playwright di 390px dan 1440px untuk `/`, `/r/:id`, `/how`, termasuk state
  kosong, gagal, dan `tidak_tahu`.
- Tiga repository fixture dengan `fixtures/expected.json` yang ditulis tangan sebelum
  engine jalan.
- `product-gate.ps1 -ProjectDir devverse` pada produk ini sendiri di akhir fase 4.
- Manual: membuka URL hasil deploy di ponsel, dan satu repository nyata milik orang lain
  yang belum pernah dilihat engine.
- Yang tidak bisa dibuktikan mesin dan harus dijawab manusia: apakah laporannya terasa
  menuntun atau menuduh. Satu-satunya cara mengukurnya adalah membacakannya ke anggota
  audiensnya.

## 10. Open decisions

**ACCEPTED 12 Nov 2026 - bentuk v1 adalah laporan kesiapan 4 level.** Dipilih manusia dari
tiga opsi yang ditawarkan. Konsekuensinya: engine membaca repository, tangga level adalah
objek inti produk, dan laporan harus bisa dibuka tanpa akun karena ia artefak yang
dibagikan. Dua opsi lain tercatat ditolak pada tanggal yang sama: tracker manual tanpa
GitHub API (lebih mudah dibohongi, tidak ada kejutan "ternyata proyekku belum"), dan
workshop tools lebih dulu (kalah dari IT-Tools yang gratis dengan 80+ alat).

**ACCEPTED 12 Nov 2026 - v1 gratis dengan batas laju per IP.** Tidak ada billing, tidak
ada tabel paket di fase 3. Ini mengonfirmasi `ip_hash` di tabel `analysis` memang
diperlukan sejak fase 2, dan menutup pertanyaan apakah fase 3 butuh skema monetisasi
(jawabannya: tidak).

**ACCEPTED 12 Nov 2026 - masa simpan data: laporan 30 hari, `ip_hash` 24 jam.** Dipilih
manusia dari tiga opsi (90/24, 30/24, permanen/24). Laporan anonim dihapus setelah 30 hari;
`ip_hash` dihapus setelah 24 jam dan hanya dipakai untuk pembatasan laju. Penghapusan lewat
satu perintah yang dijalankan berkala. Konsekuensi yang diterima: tautan yang dibagikan
berhenti bekerja setelah 30 hari, karena laporan adalah potret satu commit, bukan arsip
permanen. Opsi "permanen" ditolak - menyimpan data yang bisa dikaitkan ke repo publik
seseorang lebih lama dari yang dibutuhkan bukan pilihan yang baik.

**AI RECOMMENDED, sudah diambil - TanStack Start, bukan Next.js.** Alasannya server
function dengan tipe end-to-end untuk engine penilaian, dan Vite membuat loop
pengembangan cepat. Konsekuensinya dicatat sebagai risiko di bagian 7, lengkap dengan
tripwire pindah.

**AI RECOMMENDED, sudah diambil - UI bahasa Indonesia dengan istilah teknis tetap
Inggris.** Audiensnya siswa SMK dan mahasiswa baru; kata "commit", "pull request", dan
"deploy" tetap Inggris karena itu yang akan mereka temui di tempat kerja.

**AI RECOMMENDED, sudah diambil - tangga 4 level, bukan satu gerbang produksi.**
Gerbang produksi yang sama yang kujalankan pada 12 produk di lab ini memberi 0/10 pada
10 produk, dan itu benar secara teknis tapi salah sebagai pesan untuk orang yang baru
menulis halaman HTML pertamanya. Tangga level adalah koreksi atas alat ukurku sendiri,
bukan kelonggaran.

**ACCEPTED 12 Nov 2026 - arah visual ditetapkan manusia, bukan diusulkan agen.** Instruksi
langsung: "ingat ya gaada pilih arah design yg murah ya, ingat baik baik ini perintah ku
langsung". Ini mengikat sesi berikutnya, bukan sekadar catatan:

- Perpaduan 40% Space Mission Control, 30% Developer Workshop, 20% Cozy Productivity, 10%
  Game Progression adalah spesifikasi, bukan eksplorasi. Space Mission Control dominan:
  gelap, holografik, panel instrumen.
- Arah desain tidak boleh dipilih karena lebih murah atau lebih mudah dibangun. Biaya
  implementasi bukan kriteria pemilihan arah, dan alasan "lebih gampang di ponsel" tidak
  sah untuk menyingkirkan register visual yang sudah ditetapkan.
- Dua arah dari set pertama ditolak manusia pada tanggal yang sama: `Papan Ukur` (kertas
  terang) karena menang dengan alasan biaya, dan `Jalur` (editorial krem) karena register
  editorial tidak ada di dalam campuran 40/30/20/10.
- Gerbangnya tidak berubah: satu layar FigCraft tetap harus diekspor, ditunjukkan, dan
  `APPROVED` manusia sebelum markup pertama. Yang berubah hanya jumlah opsi, bukan izin
  membangun tanpa persetujuan.
- Setiap persentase dalam campuran harus bisa ditunjuk elemennya di layar. Kalau 10% game
  progression tidak muncul di layar laporan, itu harus dinyatakan, bukan diklaim.

**ACCEPTED 12 Nov 2026 - kanvas arah 2 disetujui manusia.** Dua frame (1440 dan 390)
diekspor, ditunjukkan, dan disetujui; rinciannya ada di `DESIGN-DIRECTION.md` bagian
`## Canvas review`. Markup fase 2 mengikuti frame itu, bukan interpretasi baru, dan
persetujuan itu mencakup panel Level 3 yang menampilkan tiga check (satu lulus, satu gagal,
satu belum terbaca) - level tetap unit jujurnya, bukan skor.

**ACCEPTED 12 Nov 2026 - set 10 check, ambang, dan arti level.** Diputuskan manusia setelah
sembilan check terbaca dari kanvas dan tidak satu pun ambang tertulis di dokumen:

- Level 1 `Nyala`: `readme_ada`, `kode_utama` (minimal 1 file sumber), `tanpa_rahasia`
  (nama file di seluruh tree + pola kunci di maksimal 10 file teks; riwayat git tidak
  dipindai dan itu dinyatakan di bukti).
- Level 2 `Bisa dijalankan`: `cara_install` (README punya bagian instalasi atau blok
  perintah), `lockfile`, `env_contoh`.
- Level 3 `Bisa dipercaya`: `test_otomatis`, `ci_berjalan` (workflow ada **dan** run sukses
  terbaca di commit terakhir - jawaban manusia: "run sukses terbaca"), `riwayat_commit`
  (minimal 3 commit, **pesan tidak dinilai** - jawaban manusia).
- Level 4 `Siap dibagikan`: `lisensi_ada` (lisensi terdeteksi; `NOASSERTION` tetap lulus
  dengan catatan "tidak dikenali GitHub") - jawaban manusia, dipilih dari tiga opsi.
- Level lulus hanya kalau semua check-nya lulus; `tidak_tahu` bukan lulus. Level di atas
  level pertama yang belum lulus tidak dievaluasi dan tidak punya baris `check_result`.
- Dua check yang tidak berlaku di proyek tanpa dependensi (`lockfile`, `env_contoh`) lulus
  dengan alasan tertulis "tidak ada manifest dependensi", supaya proyek HTML statis tidak
  terhenti permanen di Level 2. Dasar hukumnya: tidak ada yang perlu dikunci.

**PROPOSED 13 Nov 2026 - dua penyimpangan implementasi dari keputusan di atas, menunggu
jawaban manusia.** Keduanya ditemukan saat verifikasi render; tidak ada yang diubah
diam-diam.

- `tanpa_rahasia` sekarang hanya memindai **nama berkas** (`.env`, `*.pem`, `id_rsa`,
  `credentials.json`, dan sejenisnya). Pemindaian pola kunci di maksimal 10 berkas teks
  yang disebut di atas belum diimplementasikan; bukti di laporan menyatakan "isi file dan
  riwayat git tidak dipindai". Usul: terima pengurangan ini untuk v1 - ia menghemat 10
  request GitHub per analisis pada batas 60/jam - atau minta pemindaian isi berkas
  dikerjakan.
- Kesepuluh check selalu dievaluasi dan disimpan; level di atas frontier ditampilkan
  `belum` di layar. Keputusan di atas menyebut level itu "tidak dievaluasi dan tidak punya
  baris `check_result`". Yang berbeda hanya penyimpanan, bukan arti yang dibaca pengguna.
  Usul: terima "evaluasi semua, tampilkan `belum`" lalu perbaiki kalimat keputusan itu.

**AI RECOMMENDED, sudah diambil - database fase 0: PGlite, bukan server Postgres.**
Mesin ini tidak punya server Postgres lokal: `psql` tidak ada, tidak ada service Postgres,
dan Docker tidak jalan. PGlite menjalankan Postgres 18 di dalam proses, SQL migrasi tetap
SQL Postgres, dan `db/migrations/` yang sama dipakai saat pindah ke server. Konsekuensinya:
`pnpm build` dan `pnpm test` membuktikan migrasi serta baca-tulis pada mesin ini, bukan
pada server Postgres sungguhan. Pilihan server produksi (lokal atau hosted) dan biayanya
tetap keputusan fase 2 - hosted berarti uang, jadi itu keputusan manusia.
