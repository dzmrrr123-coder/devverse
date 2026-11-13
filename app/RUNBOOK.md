# RUNBOOK — DEVVERSE

Panduan operasional DEVVERSE v1.

## 1. Menjalankan Lokal

```bash
# Pasang dependensi
corepack pnpm install

# Jalankan server pengembangan
corepack pnpm dev

# Jalankan pengujian
corepack pnpm test

# Build produksi
corepack pnpm build
```

## 2. Deploy Produksi

- Deploy Target: Render / Docker
- Live URL: `https://devverse.app`
- Node Version: Node.js 20 LTS

## 3. Penanganan Insiden

### GitHub API Rate Limited (429)
Jika API publik mencapai batas 60 request/jam:
1. Buat GitHub Personal Access Token (classic, tanpa scope apa pun).
2. Set environment variable `GITHUB_TOKEN=ghp_...`.
3. Restart aplikasi. Batas laju akan naik menjadi 5000 request/jam.

### PGlite Database Recovery
Database tersimpan di folder `.data/pglite`.
Jika terjadi korupsi file setelah shutdown paksa:
1. Backup file: `cp -r .data/pglite .data/pglite.bak`
2. Jalankan migrasi ulang otomatis saat startup.
