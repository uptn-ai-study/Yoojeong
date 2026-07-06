-- 기존 프로젝트에 schema.sql만 실행한 경우, SQL Editor에서 이 파일을 한 번 실행하세요.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.records to anon, authenticated;
