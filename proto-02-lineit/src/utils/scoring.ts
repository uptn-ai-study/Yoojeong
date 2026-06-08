import type { GridPos, LevelConfig, LevelScoreBreakdown } from '../types/game'
import { isAdjacent, playableSet } from './grid'
import { canMoveBetween } from './maze'

function direction(a: GridPos, b: GridPos): string {
  if (b.col > a.col) return 'R'
  if (b.col < a.col) return 'L'
  if (b.row > a.row) return 'D'
  return 'U'
}

export function calcSmoothness(path: GridPos[]): number {
  if (path.length < 3) return path.length >= 2 ? 50 : 0

  let turns = 0
  let straightSegments = 0

  for (let i = 2; i < path.length; i++) {
    const d1 = direction(path[i - 2], path[i - 1])
    const d2 = direction(path[i - 1], path[i])
    if (d1 !== d2) turns++
    else straightSegments++
  }

  const maxTurns = path.length - 2
  const turnRatio = maxTurns > 0 ? 1 - turns / maxTurns : 1
  const straightRatio =
    path.length > 2 ? straightSegments / (path.length - 2) : 1

  return Math.round(turnRatio * 55 + straightRatio * 45)
}

export const MONSTER_PASS_POINTS = 10

export function calcLevelScore(params: {
  level: number
  path: GridPos[]
  timeRemaining: number
  timeLimit: number
  reachedGoal: boolean
  inksCollected: number
  monstersDefeated: number
  solutionLength: number
}): LevelScoreBreakdown {
  const {
    level,
    path,
    timeRemaining,
    timeLimit,
    reachedGoal,
    inksCollected,
    monstersDefeated,
    solutionLength,
  } = params

  const visitRatio = Math.min(1, path.length / Math.max(2, solutionLength))
  const completion = reachedGoal
    ? 420
    : Math.round(visitRatio * 90)

  const timeBonus = reachedGoal
    ? Math.round((timeRemaining / Math.max(1, timeLimit)) * 220)
    : Math.round((timeRemaining / Math.max(1, timeLimit)) * 40)

  // 미로에서는 불필요한 우회가 적을수록 높은 점수
  const efficiency = reachedGoal
    ? Math.max(30, Math.round((1 - visitRatio) * 180))
    : Math.round(calcSmoothness(path) * 0.35)

  const inkBonus = inksCollected * 35
  const monsterBonus = monstersDefeated * MONSTER_PASS_POINTS
  const levelMultiplier = 1 + (level - 1) * 0.08

  const total = Math.round(
    (completion + timeBonus + efficiency + inkBonus) * levelMultiplier + monsterBonus
  )

  return {
    level,
    completion,
    timeBonus,
    smoothness: efficiency,
    inkBonus,
    monsterBonus,
    total,
  }
}

export function validatePath(
  path: GridPos[],
  level: LevelConfig
): { valid: boolean; visitedAll: boolean; reachedGoal: boolean } {
  const { start, goal } = level
  const region = playableSet(level)

  if (path.length === 0) {
    return { valid: false, visitedAll: false, reachedGoal: false }
  }

  const first = path[0]
  if (first.col !== start.col || first.row !== start.row) {
    return { valid: false, visitedAll: false, reachedGoal: false }
  }

  const seen = new Set<string>()
  for (let i = 0; i < path.length; i++) {
    const p = path[i]
    const key = `${p.col},${p.row}`
    if (!region.has(key)) {
      return { valid: false, visitedAll: false, reachedGoal: false }
    }
    if (seen.has(key)) {
      return { valid: false, visitedAll: false, reachedGoal: false }
    }
    seen.add(key)
    if (i > 0) {
      const prev = path[i - 1]
      if (!isAdjacent(prev, p) || !canMoveBetween(level, prev, p)) {
        return { valid: false, visitedAll: false, reachedGoal: false }
      }
    }
  }

  const last = path[path.length - 1]
  const visitedAll = false
  const reachedGoal = last.col === goal.col && last.row === goal.row

  return {
    valid: true,
    visitedAll,
    reachedGoal,
  }
}
