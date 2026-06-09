import {
  DEMO_RANKINGS,
  TABLE_NAME,
  TOP_N,
  validatePlayerId,
  validateScore,
} from './ranking.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';

function rowToEntry(row) {
  return {
    id: row.player_id,
    score: row.score,
    timestamp: new Date(row.updated_at).getTime(),
  };
}

async function seedDemoRankings() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from(TABLE_NAME).upsert(
    DEMO_RANKINGS.map((entry) => ({
      player_id: entry.id,
      score: entry.score,
      updated_at: new Date(entry.timestamp).toISOString(),
    })),
    { onConflict: 'player_id', ignoreDuplicates: true },
  );
}

export async function fetchTopRankings(limit = TOP_N) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase is not configured');

  const { count, error: countError } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;
  if ((count ?? 0) === 0) await seedDemoRankings();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('player_id, score, updated_at')
    .order('score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(rowToEntry);
}

export async function submitRanking(id, score) {
  if (!validatePlayerId(id) || !validateScore(score)) {
    throw new Error('Invalid id or score');
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: existing, error: readError } = await supabase
    .from(TABLE_NAME)
    .select('score')
    .eq('player_id', id)
    .maybeSingle();

  if (readError) throw readError;

  const bestScore = Math.max(score, existing?.score ?? 0);
  if (existing && bestScore === existing.score) {
    return fetchTopRankings();
  }

  const { error: writeError } = await supabase.from(TABLE_NAME).upsert(
    {
      player_id: id,
      score: bestScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'player_id' },
  );

  if (writeError) throw writeError;
  return fetchTopRankings();
}
