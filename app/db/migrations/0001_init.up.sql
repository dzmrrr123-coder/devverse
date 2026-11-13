-- Fase 0: fondasi. Tabel produk (analysis, check_result) menyusul di fase 2.
create table app_meta (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into app_meta (key, value) values ('engine_version', '0.0.0-phase0');
