export interface RankingEntry {
  id: string
  score: number
  timestamp: number
}

export const TOP_N = 10
export const MAX_STORED = 50

/** 최초 실행 시 TOP 10이 비어 보이지 않도록 하는 목업 데이터 */
export const DEMO_RANKINGS: RankingEntry[] = [
  { id: 'VioletBear', score: 12_480, timestamp: 1 },
  { id: 'CoralFox', score: 11_920, timestamp: 2 },
  { id: 'TealOwl', score: 10_650, timestamp: 3 },
  { id: 'AmberCat', score: 9_840, timestamp: 4 },
  { id: 'IndigoHare', score: 8_720, timestamp: 5 },
  { id: 'MintKoala', score: 7_560, timestamp: 6 },
  { id: 'RoseDuck', score: 6_430, timestamp: 7 },
  { id: 'AzureNewt', score: 5_290, timestamp: 8 },
  { id: 'LimePanda', score: 4_150, timestamp: 9 },
  { id: 'PeachLynx', score: 3_080, timestamp: 10 },
]

export function sortByScore(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
}

export function topN(entries: RankingEntry[], n = TOP_N): RankingEntry[] {
  return sortByScore(entries).slice(0, n)
}

export function validatePlayerId(id: unknown): id is string {
  return typeof id === 'string' && /^[A-Za-z]{4,24}$/.test(id)
}

export function validateScore(score: unknown): score is number {
  return (
    typeof score === 'number' &&
    Number.isFinite(score) &&
    score > 0 &&
    score <= 99_999_999
  )
}

/** 아이디당 최고 기록만 유지. 변경 없으면 null */
export function upsertScore(
  entries: RankingEntry[],
  id: string,
  score: number,
): RankingEntry[] | null {
  if (!validatePlayerId(id) || !validateScore(score)) return null

  const prev = entries.find((e) => e.id === id)
  const bestScore = Math.max(score, prev?.score ?? 0)
  if (prev && bestScore === prev.score) return null

  const entry: RankingEntry = {
    id,
    score: bestScore,
    timestamp: Date.now(),
  }

  return sortByScore([
    ...entries.filter((e) => e.id !== id),
    entry,
  ]).slice(0, MAX_STORED)
}

export function seedIfEmpty(entries: RankingEntry[] | null | undefined): RankingEntry[] {
  if (entries && entries.length > 0) return entries
  return [...DEMO_RANKINGS]
}
