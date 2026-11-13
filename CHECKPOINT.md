# CHECKPOINT — DEVVERSE v1 + Phase 3 + Timeline + Sesi Tahan Deploy

OBJECTIVE: Bangun Devverse v1 + Phase 3 — Project Cockpit lengkap dengan Autentikasi Siswa, Dashboard Portofolio, Studio Asisten AI, Dynamic README Badge, dan Timeline Progres Commit, dengan sesi login yang bertahan lintas deploy.

COMPLETED:
- **Sesi tahan deploy (2026-11-13):** sesi JWT sekarang dipulihkan otomatis saat database PGlite kosong lagi (Railway mengganti container tiap deploy), dan kunci penanda tangan diturunkan dari `GITHUB_CLIENT_SECRET` supaya stabil — evidence: `auth.test.ts` 8 tests pass (termasuk 3 test baru: rehidrasi pasca-wipe, id user tetap saat login ulang, flag Secure per-protokol); repro lokal end-to-end: login → hapus `.data` → restart server → `GET /dashboard` tetap **200** (sebelumnya 307 ke `/login`).
- **Logout mencabut sesi di server:** `POST /api/auth/logout` menghapus baris `sessions` — evidence: repro lokal, sesudah logout `GET /dashboard` = 307 ke `/login`.
- Timeline Progress Delta Engine: Evaluasi perubahan level per commit (`levelChange`), mendeteksi check yang berhasil diperbaiki (`fixedChecks`) dan regresi (`regressedChecks`) — evidence: `timeline.test.ts` pass
- Dynamic README Badge: Endpoint SVG `/api/badge/:owner/:repo`, styling presisi *Meja Kerja*, tombol 1-klik `Salin Badge` di laporan — evidence: `badge.test.ts` pass
- Timeline UI Component (`src/components/timeline-view.tsx`): Desain instrumen cockpit vertikal dengan simpul LED menyala, commit SHA pill, badge kenaikan level (`+1 LEVEL NAIK 🚀`), dan daftar check teratasi.
- Tab Timeline di Dashboard (`src/routes/dashboard.tsx`): Siswa dapat berpindah antara `PROYEK`, `REPO GITHUB`, dan `TIMELINE`.
- API Endpoint Timeline (`src/routes/api/projects/timeline.ts`): Membaca seluruh histori analisis repositori secara kronologis.
- Pure Verdict Engine: 10 check, 4 level, ladder evaluation, deterministik — evidence: `engine.test.ts` (22 tests) & `checks.test.ts` pass
- Server Auth & Session: Signed JWT session tokens via `jose`, `getServerSession`, `requireAuth`, `createSessionCookie` — evidence: `auth.test.ts` pass
- AI Assistant Engine: Integrasi Google Gemini (default `gemini-3.8-flash-high`, selector model di dashboard) + fallback cerdas — evidence: `assistant.test.ts` & `api/assistant.test.ts` pass
- Product Gate: **9/10 PASS** (C1 State, C2 Identity/Auth, C3 Failure Paths, C4 Tests, C5 Dockerfile, C6 CI, C7 Deploy, C8 Observability, C10 Ops Docs) — evidence: `product-gate.ps1`
- Design Direction Gate: **43 PASS, 0 FAIL** — evidence: `design-direction-check.ps1`
- Live Deployment: aktif di `https://devverse-production.up.railway.app`

CHANGED:
- `devverse/app/src/server/auth.ts` (secret stabil, rehidrasi sesi, `isSecureRequest`, `revokeSessionFromRequest`)
- `devverse/app/src/server/auth.test.ts` (+3 test regresi sesi)
- `devverse/app/src/server/db.ts` (hormati `RAILWAY_VOLUME_MOUNT_PATH` / `DEVVERSE_DATA_DIR`)
- `devverse/app/src/routes/api/auth/{dev,github.callback,logout}.ts`
- `devverse/app/src/engine/timeline.ts`, `badge.ts`, `components/timeline-view.tsx`, `routes/dashboard.tsx`, `routes/login.tsx`, `styles.css`

DECISIONS:
- D-001 (ACCEPTED): 10 check, 4 level, nextFix CheckResult
- D-002 (ACCEPTED): Meja Kerja direction approved on 1440 & 390 frames
- D-003 (ACCEPTED): TanStack Start client bundle zero token leak
- D-004 (ACCEPTED): PGlite singleton via globalThis to survive Vite HMR reloads
- D-005 (ACCEPTED): Wajib Login untuk mengakses Dashboard & Studio Asisten AI
- D-006 (ACCEPTED): Tombol aksi cepat kustom "[ Analisa lah projek ku untuk pengembangan selanjutnya ]"
- D-007 (ACCEPTED): Dynamic README SVG badge via /api/badge/:owner/:repo
- D-008 (ACCEPTED): Timeline progres commit visual di Dashboard siswa
- D-009 (ACCEPTED): Sesi login harus bertahan lintas deploy — kunci tanda tangan stabil + rehidrasi saat DB kosong; logout tetap mencabut sesi server-side
- D-010 (PROPOSED): Volume Railway di `/data` agar riwayat proyek & analisis ikut permanen (butuh tindakan manusia di dashboard Railway)

ASSUMPTIONS:
- A-001 | Public GitHub API is accessed anonymously by default (60 req/hr), token is optional via GITHUB_TOKEN | verified | HIGH | low | yes | ACCEPTED
- A-002 | GEMINI_API_KEY / key dari browser dipakai AI Assistant dengan fallback otomatis saat offline | verified | HIGH | low | yes | ACCEPTED
- A-003 | `GITHUB_CLIENT_SECRET` Railway stabil, jadi turunannya bisa dipakai sebagai kunci sesi tanpa env baru | verified (OAuth login berhasil) | HIGH | medium | yes | ACCEPTED

BLOCKERS: NONE

EVIDENCE:
- Vitest: **109 tests passing across 13 test files** (fresh run, 2026-11-13)
- Typecheck: `tsc --noEmit` exit 0 (fresh)
- Vite build: exit 0, tidak ada `devverse-secret-key` / `devverse.session.v1` di client bundle (scan `dist/client/assets/*.js`)
- Repro sesi: login 200 → `Remove-Item .data` + restart → `/dashboard` 200; logout → 307 `/login`
- Product Gate: 9/10 PASS
- Design Direction Check: 43 PASS, 0 FAIL

RESUME:
- Deploy `8617da4` diverifikasi live; satu-satunya langkah manusia yang tersisa: pasang volume Railway di `/data` supaya riwayat proyek tidak hilang saat deploy.
