# USE CASES — DEVVERSE v1

Dokumen use case resmi untuk **DEVVERSE v1 (Project Cockpit)**.
Menjelaskan siapa pengguna, apa masalah nyata yang mereka hadapi, skenario alur utama, dan bagaimana produk memberikan nilai jujur tanpa login dan tanpa instalasi.

---

## 1. Persona Pengguna

| Persona | Profil | Kebutuhan Utama | Frustrasi Utama |
|---|---|---|---|
| **Siswa SMK RPL / Mahasiswa Pemula** (Contoh: *Rizky, 17 th*) | Baru belajar coding, punya proyek web (HTML/PHP/JS), ingin daftar magang/PKL. | Tahu apakah repository GitHub-nya sudah rapi dan layak dilihat orang industri. | Tidak ada yang memberi tahu apa yang kurang selain "bikin portofolio". Takut reponya salah atau diketawain. |
| **Guru Kejuruan / Instruktur Coding** (Contoh: *Pak Budi, 38 th*) | Mengampu 30–60 siswa di kelas RPL/Informatika, memeriksa tugas coding berkala. | Memverifikasi kelengkapan proyek siswa secara objektif dan cepat. | Melelahkan clone repo satu per satu, sering nemu file `.env` bocor, tidak ada panduan cara install, atau repo cuma salinan kosong. |
| **Tech Lead / Reviewer Magang** (Contoh: *Kak Fajar, 29 th*) | Menyeleksi puluhan lamaran magang/junior developer di software house atau startup. | Triage cepat apakah pelamar benar-benar paham dasar rekayasa software. | Banyak link GitHub di CV cuma template kosong, tidak bisa dijalankan, atau tidak punya riwayat commit asli. |

---

## 2. Matriks Use Case

| ID | Nama Use Case | Aktor Primer | Tujuan Akhir | Rute Terkait |
|---|---|---|---|---|
| **UC-01** | Audit Mandiri Kesiapan Repositori | Siswa / Pemula | Mengetahui tingkat kelayakan proyek (Level 1–4) secara transparan. | `/` &rarr; `/r/:id` |
| **UC-02** | Perbaikan Bertahap via "Satu Perbaikan Berikutnya" | Siswa / Pemula | Memperbaiki kekurangan paling kritis tanpa kewalahan. | `/r/:id` &rarr; GitHub &rarr; `/` |
| **UC-03** | Mempelajari Standar Praktik Industri | Siswa / Pemula | Memahami *mengapa* suatu check penting dan bagaimana standar industri. | `/how`, `/r/:id` |
| **UC-04** | Penilaian & Standarisasi Tugas Sekolah | Guru / Mentor | Memvalidasi kepatuhan teknis tugas siswa dengan kriteria objektif. | `/r/:id` |
| **UC-05** | Triage Portofolio Pelamar Magang | Tech Lead / Rekruter | Memfilter kandidat yang reponya benar-benar bisa dijalankan dan aman. | `/`, `/r/:id` |
| **UC-06** | Berbagi & Membuka Laporan Permanen Tanpa Akun | Semua Pengguna | Membuka laporan dingin (*cold load*) yang statis dan dapat diandalkan. | `/r/:id` |
| **UC-07** | Autentikasi & Manajemen Portofolio Siswa | Siswa Terdaftar | Menyimpan dan mengorganisir riwayat proyek coding dalam satu workspace personal. | `/login`, `/dashboard` |
| **UC-08** | Analisis Roadmap & Bimbingan Asisten AI | Siswa Terdaftar | Menganalisis potensi arsitektur dan mendapatkan roadmap fitur selanjutnya dari AI. | `/dashboard` |

---

## 3. Rincian Skenario Use Case

### UC-01: Audit Mandiri Kesiapan Repositori (Self-Assessment)

- **Aktor:** Siswa SMK / Mahasiswa Pemula
- **Kondisi Awal (Precondition):**
  - Siswa memiliki tautan repository GitHub publik (misal: `https://github.com/rizkyfajar/absensi-qr`).
  - Repository bersifat publik (bukan privat).
- **Alur Utama (Main Flow):**
  1. Siswa membuka `https://devverse.app/`.
  2. Sistem menampilkan penjelasan 4 level kesiapan dan kolom input URL.
  3. Siswa menempelkan URL repository miliknya ke dalam kolom input.
  4. Siswa menekan tombol **"Analisis"** (atau menekan Enter).
  5. Sistem memvalidasi format URL di sisi client (`owner/repo` atau `https://github.com/owner/repo`).
  6. Sistem menampilkan progres 3 tahap jujur:
     - *1. Membaca struktur dan berkas repository...*
     - *2. Menjalankan 10 check kesiapan 4 level...*
     - *3. Menyusun laporan tangga dan satu perbaikan...*
  7. Sistem mengarahkan browser ke URL permanen `/r/:id` (12 karakter unik).
  8. Siswa membaca statement utama (misal: *"Level 2 lulus. Berikutnya Level 3 — Bisa dipercaya"*).
  9. Siswa melihat rincian panel frontier: check mana yang lulus, gagal, atau belum terbaca beserta buktinya.
- **Alur Alternatif (Alternative/Exception Flows):**
  - **4a. Input kosong:** Sistem menampilkan pesan *"Tempel URL repository GitHub terlebih dahulu."*
  - **5a. Format URL salah (bukan GitHub):** Sistem menampilkan pesan *"Format URL tidak dikenali. Gunakan format https://github.com/owner/repo atau owner/repo."*
  - **6a. Repository privat / tidak ditemukan:** Sistem menampilkan status 404 dengan pesan *"Repository tidak ditemukan di GitHub. Pastikan URL benar dan repository bersifat publik (bukan private)."*
  - **6b. Batas laju GitHub API tercapai (Rate Limit):** Sistem menampilkan status 429 dan menginformasikan waktu tunggu reset API.
- **Kondisi Akhir (Postcondition):**
  - Laporan tersimpan di database lokal dengan snapshot SHA commit saat analisis.
  - Siswa mendapatkan penilaian objektif atas kondisi proyeknya.

---

### UC-02: Perbaikan Bertahap via "Satu Perbaikan Berikutnya" (Growth Loop)

- **Aktor:** Siswa SMK / Mahasiswa Pemula
- **Kondisi Awal (Precondition):**
  - Siswa sudah membuka laporan proyeknya di `/r/:id`.
  - Proyek belum mencapai Level 4 (ada check yang gagal di level frontier).
- **Alur Utama (Main Flow):**
  1. Siswa membaca kartu **"SATU PERBAIKAN BERIKUTNYA"** di bagian bawah laporan.
  2. Sistem menunjuk check gagal pertama di level frontier dengan indikator kabel trace visual oranye dari check asal ke kartu judul perbaikan.
  3. Kartu menyajikan:
     - Judul tindakan jelas (misal: *"Tulis cara menjalankan proyek di README"* atau *"Tambahkan satu workflow CI"*).
     - Paragraf panduan praktis (misal: instruksi 4 baris, nama berkas yang dituju).
     - Label metadata ringkas (misal: `1 berkas · README.md` atau `8 baris · GitHub Actions`).
  4. Siswa mengklik tombol **"Buka panduan"** yang langsung mengarahkan ke bagian penjelasan check tersebut di `/how#<check_id>`.
  5. Siswa membuka repository di GitHub/editor lokal miliknya, melakukan perbaikan kode/berkas, dan melakukan `git push`.
  6. Siswa kembali ke Devverse dan menganalisis ulang repositorinya.
  7. Laporan baru terbit menunjukkan check tersebut kini **lulus**, dan tangga level naik ke tingkat berikutnya.
- **Alur Alternatif (Alternative/Exception Flows):**
  - **2a. Semua check di level frontier lulus:** Kartu menampilkan *"Semua check di Level X lulus. Berikutnya Level Y."*
  - **2b. Semua check di seluruh level 1–4 lulus:** Kartu menampilkan pesan apresiasi bahwa proyek sudah siap dibagikan secara profesional dan tidak ada check yang menahan.
- **Kondisi Akhir (Postcondition):**
  - Siswa belajar memperbaiki kekurangan teknis satu per satu tanpa rasa overwhelmed.

---

### UC-03: Mempelajari Standar Praktik Industri (Educational Deep-Dive)

- **Aktor:** Siswa SMK / Pemula
- **Kondisi Awal (Precondition):**
  - Siswa ingin tahu standar kelayakan software modern di luar sekadar "kodenya jalan di localhost".
- **Alur Utama (Main Flow):**
  1. Siswa mengklik menu **"Arti 10 check"** di header halaman.
  2. Sistem membuka rute `/how`.
  3. Siswa melihat indeks 4 level:
     - **01 Nyala**: Ada README, ada kode utama, tidak ada file rahasia/kredensial bocor.
     - **02 Bisa Dijalankan**: Instruksi instalasi jelas, dependensi terkunci (lockfile), konfigurasi ada contohnya (`.env.example`).
     - **03 Bisa Dipercaya**: Ada test otomatis, CI berjalan di tiap push, riwayat commit bertumbuh.
     - **04 Siap Dibagikan**: Memiliki lisensi open-source yang jelas (MIT, Apache, dll).
  4. Siswa membaca penjelasan bahasa manusia untuk tiap check:
     - *Apa artinya?* (konteks mengapa industri peduli).
     - *Kapan dianggap lulus?* (bukti konkret yang dinilai).
     - *Kalau belum, apa yang harus dibuat?* (solusi praktis).
- **Kondisi Akhir (Postcondition):**
  - Siswa memahami bahwa rekayasa perangkat lunak mencakup kebersihan repo, keamanan kredensial, keandalan dependensi, dan reproduktibilitas.

---

### UC-04: Penilaian & Standarisasi Tugas Sekolah (Classroom / Mentor Review)

- **Aktor:** Guru Kejuruan SMK RPL / Mentor Bootcamp
- **Kondisi Awal (Precondition):**
  - Guru memberikan tugas akhir pembuatan aplikasi web kepada siswa.
  - Guru menetapkan standar kelulusan tugas: *"Tugas minimal mencapai Level 2 (Bisa dijalankan)."*
- **Alur Utama (Main Flow):**
  1. Siswa menyerahkan link laporan DEVVERSE mereka (misal: `https://devverse.app/r/YUR4OaVUhDyk`) ke form pengumpulan tugas sekolah.
  2. Guru membuka link laporan tersebut dari browser tanpa perlu membuat akun atau login.
  3. Guru langsung melihat:
     - Status level yang dicapai siswa (misal: *Level 2 lulus*).
     - Commit SHA dan waktu analisis (WIB).
     - Bukti berkas konkret yang dideteksi engine (misal: berkas `package-lock.json` ada, `.env.example` ada).
     - Apakah ada kunci kredensial/rahasia yang bocor di Level 1.
  4. Guru memberikan nilai dan catatan langsung berdasarkan laporan objektif.
- **Kondisi Akhir (Postcondition):**
  - Waktu penilaian tugas berkurang dari 15–20 menit per siswa (clone manual) menjadi < 1 menit.
  - Siswa tidak bisa beralasan "di laptop saya jalan" jika instruksi install atau lockfile tidak ada di repo.

---

### UC-05: Triage Portofolio Pelamar Magang (Recruiter / Tech Lead Filter)

- **Aktor:** Tech Lead / Rekruter Teknis
- **Kondisi Awal (Precondition):**
  - Rekruter menerima puluhan CV pelamar posisi Magang Web Developer / Junior Backend.
  - CV mencantumkan tautan repository GitHub proyek portofolio.
- **Alur Utama (Main Flow):**
  1. Rekruter membuka DEVVERSE dan menempelkan tautan proyek pelamar.
  2. Rekruter memeriksa hasil penilaian 4 level:
     - Apakah pelamar sembrono menaruh API key / file `.env` di repo publik? (Level 1).
     - Apakah pelamar menyertakan lockfile dan panduan run agar tim lain bisa menjalankan kodenya? (Level 2).
     - Apakah pelamar pernah menulis unit test otomatis atau memasang GitHub Actions? (Level 3).
  3. Jika repositori mencapai Level 2 atau 3, rekruter memprioritaskan kandidat untuk tahap wawancara teknis.
- **Kondisi Akhir (Postcondition):**
  - Rekruter menyaring kandidat berkualitas secara cepat dan adil berdasarkan bukti nyata di kode sumber.

---

### UC-06: Berbagi & Membuka Laporan Dingin Tanpa Akun (Shared Cold Link)

- **Aktor:** Siapa saja (Penerima Tautan Laporan)
- **Kondisi Awal (Precondition):**
  - Pengguna menerima tautan laporan `/r/:id` dari pesan WhatsApp, Discord, email, atau CV.
- **Alur Utama (Main Flow):**
  1. Pengguna membuka tautan di peramban (desktop maupun smartphone).
  2. Sistem membaca data laporan langsung dari basis data tanpa meminta login atau registrasi.
  3. Pada layar desktop:
     - Tampil panel instrumen 312px di sisi kiri dan kolom baca 1128px di sisi kanan.
     - Tampil tombol **"Bagikan"** yang dapat mengkopi URL laporan ke clipboard.
  4. Pada layar smartphone:
     - Rail kiri disembunyikan otomatis untuk kenyamanan membaca.
     - Tampil fixed navigation strip 60px di bagian bawah layar yang menunjukkan posisi tangga level dengan indikator status aktif.
     - Tata letak responsif tanpa horizontal scrolling/overflow.
- **Alur Alternatif (Alternative/Exception Flows):**
  - **2a. ID laporan salah / tidak ada di database:** Sistem menyajikan halaman 404 berbahasa Indonesia: *"Laporan tidak ditemukan. Tautan ini mungkin salah ketik, atau laporannya sudah dihapus. Analisis ulang repository-nya untuk membuat laporan baru"* disertai tombol kembali ke halaman awal.
- **Kondisi Akhir (Postcondition):**
  - Informasi tersampaikan secara instan, ringan, dan tidak terhalang paywall/authwall.

---

### UC-07: Autentikasi & Manajemen Portofolio Siswa (Student Dashboard)

- **Aktor:** Siswa SMK / Mahasiswa Pemula
- **Kondisi Awal (Precondition):**
  - Siswa ingin melacak seluruh repositori miliknya dalam satu akun terpusat.
- **Alur Utama (Main Flow):**
  1. Siswa mengklik tombol **"Masuk / Dashboard"** di navigasi utama atau langsung mengakses `/login`.
  2. Sistem menampilkan antarmuka login bersih bergaya *Meja Kerja*.
  3. Siswa memasukkan username GitHub miliknya dan menekan tombol masuk.
  4. Sistem memverifikasi sesi, membuat signed JWT session cookie (`devverse_session`), dan menyimpan record sesi di database.
  5. Sistem mengarahkan siswa ke `/dashboard`.
  6. Pada kolom kiri (*Workspace Repository*), siswa dapat:
     - Menempelkan URL repo baru untuk dianalisis dan disimpan ke portofolionya.
     - Melihat daftar kartu proyek yang tersimpan (lengkap dengan indikator level 1–4 dan link laporan cepat).
     - Mengklik kartu proyek tertentu untuk mengaktifkan konteks analisis tersebut bagi Asisten AI.
  7. Siswa dapat menekan tombol **"Keluar"** kapan saja untuk menghapus cookie sesi dan keluar dengan aman.
- **Kondisi Akhir (Postcondition):**
  - Sesi terenkripsi dan terlindungi di sisi server (`requireAuth`).
  - Riwayat proyek siswa tersimpan rapi dan persisten.

---

### UC-08: Analisis Roadmap & Bimbingan Asisten AI Siswa (AI Project Coach)

- **Aktor:** Siswa Terotentikasi
- **Kondisi Awal (Precondition):**
  - Siswa sudah login di `/dashboard` dan memilih satu repository aktif di kolom kiri.
- **Alur Utama (Main Flow):**
  1. Pada kolom kanan (*Studio Asisten AI*), siswa melihat badge konteks repositori yang aktif (misal: `Konteks: rizkyfajar/absensi-qr`).
  2. Siswa melihat bar tombol aksi cepat:
     - `[ Draf README Proyek ]`
     - `[ Draf GitHub Actions CI ]`
     - `[ Draf .env.example ]`
     - `[ Analisa lah projek ku untuk pengembangan selanjutnya ]` (Aksi Khusus Roadmap)
  3. Siswa menekan tombol **`[ Analisa lah projek ku untuk pengembangan selanjutnya ]`**.
  4. Sistem mengirimkan permintaan ke `POST /api/assistant/chat` dengan payload analisis arsitektur proyek.
  5. Asisten AI (ditenagai model Google Gemini) menganalisis tumpukan teknologi, level kesiapan saat ini, dan check yang belum terpenuhi.
  6. Asisten AI membalas langsung di area chat dengan bahasa Indonesia ramah dan santai:
     - **Pengembangan Fitur Utama**: Rekomendasi fitur fungsional bernilai tinggi (misal: export PDF/Excel, multi-role access, filter server-side).
     - **Peningkatan Kualitas Rekayasa**: Rekomendasi teknis (validasi input server-side, unit testing, arsitektur modular).
     - **Kesiapan Portofolio Karier**: Tips membuat portofolio menarik saat wawancara magang/kerja.
  7. Siswa juga dapat mengetik pertanyaan lanjutan bebas di kolom input chat (misal: *"Gimana cara bikin unit test untuk fungsi login?"*).
  8. Seluruh riwayat percakapan otomatis tersimpan di tabel `assistant_messages` untuk dipelajari kembali di sesi berikutnya.
- **Kondisi Akhir (Postcondition):**
  - Siswa mendapatkan panduan roadmap nyata untuk mengembangkan proyek sekolahnya menjadi produk berstandar industri.
