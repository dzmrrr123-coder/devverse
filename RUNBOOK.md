# RUNBOOK — DEVVERSE

Panduan operasional DEVVERSE v1.

- Live demo: https://devverse.app
- Dokumentasi: [PLAN.md](./PLAN.md), [DESIGN-DIRECTION.md](./DESIGN-DIRECTION.md)

## 1. Menjalankan Lokal

```bash
cd app
corepack pnpm install
corepack pnpm dev
corepack pnpm test
corepack pnpm build
```

## 2. Deploy Produksi

Target: Render / Fly.io / Docker
URL: `https://devverse.app`
Node: 20 LTS

## 3. Penanganan Insiden

- **Batas laju GitHub API (429)**: Tambahkan `GITHUB_TOKEN=ghp_...` pada environment variables untuk menaikkan limit ke 5000 request/jam.
- **Database PGlite**: File persisten tersimpan di `.data/pglite`. Startup otomatis menjalankan migrasi idempotent (`db/migrations`).
