-- Supabase SQL Editor에서 한 번 실행하세요.

create table if not exists public.rankings (
  player_id text primary key,
  score integer not null check (score > 0 and score <= 99999999),
  updated_at timestamptz not null default now()
);

create index if not exists rankings_score_idx
  on public.rankings (score desc, updated_at desc);

alter table public.rankings enable row level security;

-- API는 service role key로 접근합니다. anon 키로의 직접 접근은 차단합니다.
revoke all on table public.rankings from anon, authenticated;
