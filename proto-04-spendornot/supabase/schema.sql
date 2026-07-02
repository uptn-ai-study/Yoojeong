-- 쓸까말까 — Supabase 스키마 (향후 연동용)
-- 토스 사용자 키(toss_user_key)로 사용자별 데이터를 분리합니다.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  toss_user_key text unique not null,
  nickname text not null default '',
  view_mode text not null default 'bill' check (view_mode in ('bill', 'fish')),
  has_seen_intro boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists records (
  id text primary key,
  toss_user_key text not null references profiles (toss_user_key) on delete cascade,
  record_date date not null,
  category text not null check (category in ('택시', '외식', '쇼핑', '기타')),
  amount integer not null check (amount > 0),
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists records_toss_user_key_date_idx
  on records (toss_user_key, record_date desc);

alter table profiles enable row level security;
alter table records enable row level security;

-- 실제 운영 시: 토스 로그인 + Supabase Auth 또는 Edge Function으로
-- toss_user_key 검증 후 RLS 정책을 적용하세요.
