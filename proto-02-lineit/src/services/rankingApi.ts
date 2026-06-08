import type { RankingEntry } from '../types/game'

const API_PATH = '/api/rankings'

export async function fetchRankings(): Promise<RankingEntry[] | null> {
  try {
    const res = await fetch(API_PATH)
    if (!res.ok) return null
    return (await res.json()) as RankingEntry[]
  } catch {
    return null
  }
}

export async function submitRankingScore(
  id: string,
  score: number,
): Promise<RankingEntry[] | null> {
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, score }),
    })
    if (!res.ok) return null
    return (await res.json()) as RankingEntry[]
  } catch {
    return null
  }
}
