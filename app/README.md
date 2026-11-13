# DEVVERSE — Project Cockpit

Laporan kesiapan repository GitHub dalam 4 level jujur untuk siswa SMK dan fresh graduate.

- Live URL: https://devverse.app
- Dokumentasi Operasional: [RUNBOOK.md](./RUNBOOK.md)

## Menjalankan

Butuh Node 24 dan pnpm 12 (tersedia lewat `corepack`).

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Database

Fase 0 memakai PGlite — Postgres yang berjalan di dalam proses — karena mesin ini tidak
punya server Postgres lokal. SQL migrasi tetap SQL Postgres, dan file yang sama dipakai
saat fase 2 pindah ke server Postgres.

- Migrasi: `db/migrations/*.up.sql` dan `*.down.sql`.
- Data dev: `.data/pglite` (tidak masuk git).
- Test migrasi menjalankan up dan down pada database sekali pakai.

Pilihan server Postgres produksi (host lokal atau hosted, beserta biayanya) diputuskan
di fase 2, bukan di sini.
