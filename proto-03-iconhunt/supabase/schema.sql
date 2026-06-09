-- ICON HUNT 랭킹 테이블
-- Supabase Dashboard → SQL Editor에서 한 번 실행하세요.

create table if not exists public.iconhunt_rankings (
  player_id text primary key,
  score integer not null check (score > 0 and score <= 99999999),
  updated_at timestamptz not null default now()
);

create index if not exists iconhunt_rankings_score_idx
  on public.iconhunt_rankings (score desc, updated_at desc);

alter table public.iconhunt_rankings enable row level security;

revoke all on table public.iconhunt_rankings from anon, authenticated;
