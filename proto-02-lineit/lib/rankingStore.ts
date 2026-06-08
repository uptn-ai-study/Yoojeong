import {
  DEMO_RANKINGS,
  TOP_N,
  validatePlayerId,
  validateScore,
  type RankingEntry,
} from './ranking'
import { getSupabaseAdmin } from './supabaseAdmin'

function rowToEntry(row: {
  player_id: string
  score: number
  updated_at: string
}): RankingEntry {
  return {
    id: row.player_id,
    score: row.score,
    timestamp: new Date(row.updated_at).getTime(),
  }
}

async function seedDemoRankings(): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  await supabase.from('rankings').upsert(
    DEMO_RANKINGS.map((entry) => ({
      player_id: entry.id,
      score: entry.score,
      updated_at: new Date(entry.timestamp).toISOString(),
    })),
    { onConflict: 'player_id', ignoreDuplicates: true },
  )
}

export async function fetchTopRankings(limit = TOP_N): Promise<RankingEntry[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) throw new Error('Supabase is not configured')

  const { count, error: countError } = await supabase
    .from('rankings')
    .select('*', { count: 'exact', head: true })

  if (countError) throw countError
  if ((count ?? 0) === 0) await seedDemoRankings()

  const { data, error } = await supabase
    .from('rankings')
    .select('player_id, score, updated_at')
    .order('score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(rowToEntry)
}

export async function submitRanking(
  id: string,
  score: number,
): Promise<RankingEntry[]> {
  if (!validatePlayerId(id) || !validateScore(score)) {
    throw new Error('Invalid id or score')
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: existing, error: readError } = await supabase
    .from('rankings')
    .select('score')
    .eq('player_id', id)
    .maybeSingle()

  if (readError) throw readError

  const bestScore = Math.max(score, existing?.score ?? 0)
  if (existing && bestScore === existing.score) {
    return fetchTopRankings()
  }

  const { error: writeError } = await supabase.from('rankings').upsert(
    {
      player_id: id,
      score: bestScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'player_id' },
  )

  if (writeError) throw writeError
  return fetchTopRankings()
}
