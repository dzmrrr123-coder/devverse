create table if not exists users (
  id text primary key,
  github_id text unique,
  username text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists saved_projects (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  analysis_id text not null references analysis(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, analysis_id)
);

create table if not exists assistant_messages (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  analysis_id text references analysis(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_saved_projects_user_id on saved_projects(user_id);
create index if not exists idx_assistant_messages_user on assistant_messages(user_id, created_at asc);
