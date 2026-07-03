import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return {};

  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function deleteAll(table, filterColumn, key, url) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=minimal',
  };

  const response = await fetch(`${url}/rest/v1/${table}?${filterColumn}=not.is.null`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${table} delete failed (${response.status}): ${body}`);
  }

  return table;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || url.includes('your-project')) {
  console.log('Supabase 미설정 — 클라우드 데이터 리셋 스킵');
  process.exit(0);
}

if (!serviceKey) {
  console.error(
    'Supabase 전체 리셋에는 service_role key가 필요합니다.\n' +
      'Supabase → Project Settings → API → service_role 을 .env에 추가하세요:\n' +
      'SUPABASE_SERVICE_ROLE_KEY=eyJ...\n\n' +
      '또는 supabase/reset.sql 을 SQL Editor에서 실행하세요.',
  );
  process.exit(1);
}

try {
  await deleteAll('records', 'id', serviceKey, url);
  await deleteAll('profiles', 'toss_user_key', serviceKey, url);
  console.log('Supabase records·profiles 삭제 완료');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
