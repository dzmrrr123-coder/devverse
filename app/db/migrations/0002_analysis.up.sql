-- Fase 2: laporan anonim. Tidak ada akun. Sebuah analysis dimiliki siapa pun
-- yang punya tautannya; ip_hash hanya untuk pembatasan laju, tidak pernah tampil.
create table analysis (
  id text primary key,
  owner text not null,
  repo text not null,
  default_branch text not null default 'main',
  commit_sha text,
  engine_version text not null,
  created_at timestamptz not null default now(),
  ip_hash text not null,
  repo_url text not null,
  repo_description text
);

create table check_result (
  analysis_id text not null references analysis(id) on delete cascade,
  check_id text not null,
  level smallint not null,
  verdict text not null check (verdict in ('lulus', 'gagal', 'tidak_tahu')),
  evidence_path text,
  evidence_url text,
  detail text not null,
  primary key (analysis_id, check_id)
);

create index analysis_created_at_idx on analysis (created_at);
create index analysis_ip_hash_idx on analysis (ip_hash);
