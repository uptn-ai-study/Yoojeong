import { computed, ref } from 'vue'
import { DEMO_RANKINGS } from '../data/demoRankings'
import type { RankingEntry } from '../types/game'

const STORAGE_KEY = 'line-it-rankings'
const BEST_KEY = 'line-it-best-score'
const SEEDED_KEY = 'line-it-rankings-seeded'
const TOP_N = 10

function loadRankings(): RankingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as RankingEntry[]
  } catch {
    /* ignore */
  }
  return []
}

function saveRankings(entries: RankingEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function seedIfEmpty(): RankingEntry[] {
  const existing = loadRankings()
  if (existing.length > 0) return existing
  if (localStorage.getItem(SEEDED_KEY)) return existing

  localStorage.setItem(SEEDED_KEY, '1')
  saveRankings([...DEMO_RANKINGS])
  return [...DEMO_RANKINGS]
}

function sortByScore(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
}

export function useRanking() {
  const rankings = ref<RankingEntry[]>(seedIfEmpty())
  const myBest = ref(Number(localStorage.getItem(BEST_KEY) || 0))

  const top10 = computed(() => sortByScore(rankings.value).slice(0, TOP_N))

  function refresh(): void {
    rankings.value = seedIfEmpty()
    myBest.value = Number(localStorage.getItem(BEST_KEY) || 0)
  }

  /** 플레이 종료 시 점수 반영 (아이디당 최고 기록만 유지) */
  function submitScore(id: string, score: number): void {
    if (!id || score <= 0) return

    const prev = rankings.value.find((e) => e.id === id)
    const bestScore = Math.max(score, prev?.score ?? 0)

    if (prev && bestScore === prev.score) return

    const entry: RankingEntry = {
      id,
      score: bestScore,
      timestamp: Date.now(),
    }

    const next = sortByScore([
      ...rankings.value.filter((e) => e.id !== id),
      entry,
    ]).slice(0, 50)

    rankings.value = next
    saveRankings(next)

    if (bestScore > myBest.value) {
      myBest.value = bestScore
      localStorage.setItem(BEST_KEY, String(bestScore))
    }
  }

  function getMyRank(playerId: string): number | null {
    const idx = top10.value.findIndex((e) => e.id === playerId)
    return idx >= 0 ? idx + 1 : null
  }

  return {
    top10,
    myBest,
    refresh,
    submitScore,
    getMyRank,
  }
}
