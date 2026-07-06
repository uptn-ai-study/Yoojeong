-- 쓸까말까 — Supabase 스키마
-- 토스 사용자 키(toss_user_key)로 사용자별 데이터를 분리합니다.
-- 클라이언트는 x-toss-user-key 헤더와 RLS로 본인 데이터만 접근합니다.

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

-- 요청 헤더에서 toss user key 읽기 (Supabase PostgREST)
create or replace function public.request_toss_user_key()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.headers', true), '')::json->>'x-toss-user-key',
    ''
  );
$$;

alter table profiles enable row level security;
alter table records enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "records_select_own" on records;
drop policy if exists "records_insert_own" on records;
drop policy if exists "records_update_own" on records;
drop policy if exists "records_delete_own" on records;

create policy "profiles_select_own"
  on profiles for select
  using (toss_user_key = public.request_toss_user_key());

create policy "profiles_insert_own"
  on profiles for insert
  with check (toss_user_key = public.request_toss_user_key());

create policy "profiles_update_own"
  on profiles for update
  using (toss_user_key = public.request_toss_user_key())
  with check (toss_user_key = public.request_toss_user_key());

create policy "records_select_own"
  on records for select
  using (toss_user_key = public.request_toss_user_key());

create policy "records_insert_own"
  on records for insert
  with check (toss_user_key = public.request_toss_user_key());

create policy "records_update_own"
  on records for update
  using (toss_user_key = public.request_toss_user_key())
  with check (toss_user_key = public.request_toss_user_key());

create policy "records_delete_own"
  on records for delete
  using (toss_user_key = public.request_toss_user_key());

-- PostgREST(anon)가 RLS 정책을 타려면 테이블 권한이 필요합니다.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.records to anon, authenticated;

-- 참고: anon key + 헤더 기반 RLS는 개발·MVP용입니다.
-- 정식 운영 시 토스 appLogin authorizationCode 검증 Edge Function + JWT 연동을 권장합니다.
