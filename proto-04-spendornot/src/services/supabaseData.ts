import type { Category, Record, ViewMode } from '../types';
import { getSupabaseClient } from '../lib/supabase';

export interface CloudProfile {
  nickname: string;
  viewMode: ViewMode;
  hasSeenIntro: boolean;
}

interface DbProfileRow {
  nickname: string;
  view_mode: ViewMode;
  has_seen_intro: boolean;
}

interface DbRecordRow {
  id: string;
  record_date: string;
  category: Category;
  amount: number;
  memo: string | null;
}

function mapRecordRow(row: DbRecordRow): Record {
  return {
    id: row.id,
    date: row.record_date,
    category: row.category,
    amount: row.amount,
    ...(row.memo ? { memo: row.memo } : {}),
  };
}

export async function fetchCloudProfile(tossUserKey: string): Promise<CloudProfile | null> {
  const supabase = getSupabaseClient(tossUserKey);
  const { data, error } = await supabase
    .from('profiles')
    .select('nickname, view_mode, has_seen_intro')
    .eq('toss_user_key', tossUserKey)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as DbProfileRow;
  return {
    nickname: row.nickname,
    viewMode: row.view_mode === 'fish' ? 'fish' : 'bill',
    hasSeenIntro: row.has_seen_intro,
  };
}

export async function upsertCloudProfile(
  tossUserKey: string,
  profile: CloudProfile,
): Promise<void> {
  const supabase = getSupabaseClient(tossUserKey);
  const { error } = await supabase.from('profiles').upsert(
    {
      toss_user_key: tossUserKey,
      nickname: profile.nickname,
      view_mode: profile.viewMode,
      has_seen_intro: profile.hasSeenIntro,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'toss_user_key' },
  );

  if (error) throw error;
}

export async function fetchCloudRecords(tossUserKey: string): Promise<Record[]> {
  const supabase = getSupabaseClient(tossUserKey);
  const { data, error } = await supabase
    .from('records')
    .select('id, record_date, category, amount, memo')
    .eq('toss_user_key', tossUserKey)
    .order('record_date', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DbRecordRow[]).map(mapRecordRow);
}

export async function upsertCloudRecord(tossUserKey: string, record: Record): Promise<void> {
  const supabase = getSupabaseClient(tossUserKey);
  const { error } = await supabase.from('records').upsert(
    {
      id: record.id,
      toss_user_key: tossUserKey,
      record_date: record.date,
      category: record.category,
      amount: record.amount,
      memo: record.memo ?? null,
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
}

export async function upsertCloudRecords(tossUserKey: string, records: Record[]): Promise<void> {
  if (records.length === 0) return;

  const supabase = getSupabaseClient(tossUserKey);
  const { error } = await supabase.from('records').upsert(
    records.map((record) => ({
      id: record.id,
      toss_user_key: tossUserKey,
      record_date: record.date,
      category: record.category,
      amount: record.amount,
      memo: record.memo ?? null,
    })),
    { onConflict: 'id' },
  );

  if (error) throw error;
}

export async function deleteCloudRecord(tossUserKey: string, id: string): Promise<void> {
  const supabase = getSupabaseClient(tossUserKey);
  const { error } = await supabase.from('records').delete().eq('id', id);

  if (error) throw error;
}
