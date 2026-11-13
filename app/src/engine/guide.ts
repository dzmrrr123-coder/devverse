import type { CheckId, Level } from './types'

/**
 * Teks yang dibaca siswa, terpisah dari mesin verdict.
 *
 * `checks.ts` hanya memutuskan lulus/gagal/tidak tahu. Nama manusia, arti check,
 * dan satu perbaikan berikutnya adalah copy presentasi — supaya mengubah kalimat
 * tidak pernah bisa mengubah verdict, dan sebaliknya.
 */
export type CheckGuide = {
  id: CheckId
  level: Level
  name: string
  meaning: string
  passing: string
  fix: { title: string; body: string; meta: string }
}

export const LEVEL_GUIDES: { level: Level; name: string; job: string }[] = [
  { level: 1, name: 'Nyala', job: 'Ada README, ada kode, tidak ada rahasia.' },
  { level: 2, name: 'Bisa dijalankan', job: 'Orang lain bisa memasang dan menjalankannya.' },
  { level: 3, name: 'Bisa dipercaya', job: 'Ada test, CI yang jalan, dan riwayat commit.' },
  { level: 4, name: 'Siap dibagikan', job: 'Ada lisensi yang jelas.' },
]

export const CHECK_GUIDES: Record<CheckId, CheckGuide> = {
  readme_ada: {
    id: 'readme_ada',
    level: 1,
    name: 'Ada README',
    meaning:
      'README adalah halaman pertama yang dibaca orang lain. Tanpa itu, satu-satunya cara memahami proyekmu adalah membaca semua kodenya.',
    passing: 'Ada berkas README di root dan isinya minimal 80 karakter.',
    fix: {
      title: 'Tulis README yang menjelaskan proyek',
      body: 'Empat baris cukup: proyek ini apa, untuk siapa, dan cara membukanya. Simpan sebagai README.md di akar repository.',
      meta: '4 baris · README.md',
    },
  },
  kode_utama: {
    id: 'kode_utama',
    level: 1,
    name: 'Ada kode utama',
    meaning:
      'Repository harus berisi kode yang benar-benar menjalankan sesuatu, bukan hanya catatan atau gambar.',
    passing:
      'Minimal satu berkas sumber dengan ekstensi yang dikenal, di luar folder build dan dependensi.',
    fix: {
      title: 'Tambahkan kode utama proyek',
      body: 'Commit berkas yang menjalankan proyekmu — HTML, PHP, JavaScript, Python, atau bahasa lain yang kamu pakai.',
      meta: '1 berkas · kode sumber',
    },
  },
  tanpa_rahasia: {
    id: 'tanpa_rahasia',
    level: 1,
    name: 'Tidak ada berkas rahasia',
    meaning:
      'Kunci API, password, dan private key tidak boleh masuk repository. Sekali ter-commit, nilainya harus dianggap bocor.',
    passing: 'Tidak ada .env, private key, atau berkas kredensial di seluruh tree.',
    fix: {
      title: 'Hapus berkas rahasia dari repository',
      body: 'Pindahkan nilainya ke environment variable, hapus berkasnya dari git, lalu ganti kunci yang sudah terlanjur ter-commit.',
      meta: '1 berkas · .gitignore',
    },
  },
  cara_install: {
    id: 'cara_install',
    level: 2,
    name: 'Ada cara menjalankan',
    meaning:
      'Orang lain harus bisa menjalankan proyekmu tanpa bertanya. Perintah install dan cara membukanya ditulis di README.',
    passing: 'README punya bagian instalasi, atau blok perintah yang bisa dijalankan.',
    fix: {
      title: 'Tulis cara menjalankan proyek di README',
      body: 'Tambahkan bagian "Cara menjalankan" berisi perintah yang kamu pakai sendiri — misalnya pnpm install lalu pnpm dev.',
      meta: '1 bagian · README',
    },
  },
  lockfile: {
    id: 'lockfile',
    level: 2,
    name: 'Dependensi terkunci',
    meaning:
      'Lockfile mencatat versi paket yang kamu pakai. Tanpa itu, orang lain bisa memasang versi berbeda dan proyeknya berperilaku lain.',
    passing: 'Ada lockfile, atau proyek memang tidak punya dependensi.',
    fix: {
      title: 'Commit lockfile dependensi',
      body: 'Jalankan install sekali, lalu commit package-lock.json, pnpm-lock.yaml, composer.lock, atau lockfile lain yang dibuat.',
      meta: '1 berkas · lockfile',
    },
  },
  env_contoh: {
    id: 'env_contoh',
    level: 2,
    name: 'Konfigurasi ada contohnya',
    meaning:
      'Kalau proyek butuh environment variable, contohnya harus ada. Orang lain tidak bisa menebak nama variabel yang kamu pakai.',
    passing: 'Ada .env.example, atau proyek tidak menyebut konfigurasi env sama sekali.',
    fix: {
      title: 'Tambahkan .env.example',
      body: 'Salin nama variabel dari .env-mu ke .env.example tanpa nilainya, lalu commit berkas itu. Jangan pernah commit .env asli.',
      meta: '1 berkas · .env.example',
    },
  },
  ada_test: {
    id: 'ada_test',
    level: 3,
    name: 'Ada test otomatis',
    meaning:
      'Test membuatmu berani mengubah kode. Tanpa test, setiap perbaikan adalah tebakan apakah ada yang rusak.',
    passing: 'Minimal satu berkas test yang dikenali.',
    fix: {
      title: 'Tambahkan satu test otomatis',
      body: 'Mulai dari satu test untuk fungsi yang paling penting. Satu test yang jalan lebih berguna daripada sepuluh yang hanya direncanakan.',
      meta: '1 berkas · test',
    },
  },
  ci_jalan: {
    id: 'ci_jalan',
    level: 3,
    name: 'CI jalan di setiap push',
    meaning:
      'CI menjalankan test dan build otomatis setiap kali kode berubah. Check ini butuh workflow dan run sukses yang terbaca di commit terakhir.',
    passing: 'Ada workflow .github/workflows dan satu run sukses terbaca di commit terakhir.',
    fix: {
      title: 'Tambahkan satu workflow CI',
      body: 'Delapan baris di .github/workflows/test.yml. Tanpa ini tidak ada yang membuktikan kode masih jalan setelah diubah orang lain.',
      meta: '8 baris · GitHub Actions',
    },
  },
  riwayat_commit: {
    id: 'riwayat_commit',
    level: 3,
    name: 'Riwayat commit terbaca',
    meaning:
      'Riwayat commit menunjukkan proyek tumbuh, bukan diunggah sekali lalu ditinggalkan. Ini juga bukti kerja yang bisa dibaca orang lain.',
    passing: 'Riwayat commit bisa dibaca dan berisi minimal tiga commit. Pesan commit tidak dinilai.',
    fix: {
      title: 'Buat commit berikutnya',
      body: 'Commit perubahanmu sedikit-sedikit dengan pesan yang jelas, supaya perjalanan proyeknya terbaca.',
      meta: '3 commit · pesan jelas',
    },
  },
  lisensi_ada: {
    id: 'lisensi_ada',
    level: 4,
    name: 'Ada lisensi',
    meaning:
      'Lisensi memberi tahu orang lain apa yang boleh mereka lakukan dengan kodemu. Tanpa lisensi, secara default tidak ada yang boleh memakainya.',
    passing:
      'GitHub mendeteksi berkas lisensi di repository. Lisensi yang tidak dikenali tetap lulus dengan catatan.',
    fix: {
      title: 'Tambahkan lisensi',
      body: 'MIT adalah pilihan paling sederhana untuk proyek belajar. Tambahkan berkas LICENSE lewat tombol "Add license" di GitHub.',
      meta: '1 berkas · LICENSE',
    },
  },
}

export function guideFor(id: CheckId): CheckGuide {
  return CHECK_GUIDES[id]
}

export function levelGuide(level: Level): { level: Level; name: string; job: string } {
  const guide = LEVEL_GUIDES.find((entry) => entry.level === level)
  return guide ?? { level, name: `Level ${level}`, job: '' }
}
