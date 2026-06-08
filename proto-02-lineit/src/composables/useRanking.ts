import { computed, ref } from 'vue'
import {
  DEMO_RANKINGS,
  MAX_STORED,
  TOP_N,
  sortByScore,
  upsertScore,
} from '../../lib/ranking'
import { fetchRankings, submitRankingScore } from '../services/rankingApi'
import type { RankingEntry } from '../types/game'

const STORAGE_KEY = 'line-it-rankings'
const BEST_KEY = 'line-it-best-score'
const SEEDED_KEY = 'line-it-rankings-seeded'

function loadLocalRankings(): RankingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as RankingEntry[]
  } catch {
    /* ignore */
  }
  return []
}

function saveLocalRankings(entries: RankingEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function seedLocalIfEmpty(): RankingEntry[] {
  const existing = loadLocalRankings()
  if (existing.length > 0) return existing
  if (localStorage.getItem(SEEDED_KEY)) return existing

  localStorage.setItem(SEEDED_KEY, '1')
  saveLocalRankings([...DEMO_RANKINGS])
  return [...DEMO_RANKINGS]
}

function applyMyBest(score: number, current: number): number {
  if (score <= current) return current
  localStorage.setItem(BEST_KEY, String(score))
  return score
}

export function useRanking() {
  const rankings = ref<RankingEntry[]>([])
  const myBest = ref(Number(localStorage.getItem(BEST_KEY) || 0))
  const isOnline = ref(false)

  const top10 = computed(() => sortByScore(rankings.value).slice(0, TOP_N))

  async function refresh(): Promise<void> {
    myBest.value = Number(localStorage.getItem(BEST_KEY) || 0)

    const remote = await fetchRankings()
    if (remote) {
      rankings.value = remote
      isOnline.value = true
      return
    }

    rankings.value = seedLocalIfEmpty()
    isOnline.value = false
  }

  /** 플레이 종료 시 점수 반영 (아이디당 최고 기록만 유지) */
  async function submitScore(id: string, score: number): Promise<void> {
    if (!id || score <= 0) return

    const remote = await submitRankingScore(id, score)
    if (remote) {
      rankings.value = remote
      isOnline.value = true
      const mine = remote.find((e) => e.id === id)
      if (mine) myBest.value = applyMyBest(mine.score, myBest.value)
      else myBest.value = applyMyBest(score, myBest.value)
      return
    }

    const prev = rankings.value.find((e) => e.id === id)
    const bestScore = Math.max(score, prev?.score ?? 0)
    if (prev && bestScore === prev.score) return

    const next =
      upsertScore(rankings.value.length ? rankings.value : seedLocalIfEmpty(), id, score) ??
      rankings.value

    rankings.value = next.slice(0, MAX_STORED)
    saveLocalRankings(rankings.value)
    isOnline.value = false
    myBest.value = applyMyBest(bestScore, myBest.value)
  }

  function getMyRank(playerId: string): number | null {
    const idx = top10.value.findIndex((e) => e.id === playerId)
    return idx >= 0 ? idx + 1 : null
  }

  return {
    top10,
    myBest,
    isOnline,
    refresh,
    submitScore,
    getMyRank,
  }
}
