import type { GridPos, LevelConfig } from '../types/game.ts'
import { MazeGenerator } from '../utils/MazeGenerator.ts'
import { canMoveBetween, shortestPathLength } from '../utils/maze.ts'
import { spawnDungeonOnCells } from '../utils/spawnDungeonOnCells.ts'

interface LevelSpec {
  cellCols: number
  cellRows: number
  /** 최단 경로 1칸당 허용 초 (작을수록 어려움) */
  timePerStep: number
  timeMin: number
  inkFadeAfter: number
  inkCount: number
  enemyCount: number
  chestCount: number
  shopCount: number
}

/** Lv.1–3 정사각, Lv.4–6 세로 직사각(~1.2), Lv.7+ 더 긴 직사각(~1.3) — 모바일 통로 너비 개선 */
const LEVEL_SPECS: LevelSpec[] = [
  { cellCols: 7, cellRows: 7, timePerStep: 1.05, timeMin: 16, inkFadeAfter: 0, inkCount: 0, enemyCount: 0, chestCount: 0, shopCount: 0 },
  { cellCols: 8, cellRows: 8, timePerStep: 1.0, timeMin: 18, inkFadeAfter: 5, inkCount: 1, enemyCount: 1, chestCount: 0, shopCount: 0 },
  { cellCols: 9, cellRows: 9, timePerStep: 0.95, timeMin: 20, inkFadeAfter: 4, inkCount: 1, enemyCount: 1, chestCount: 1, shopCount: 0 },
  { cellCols: 9, cellRows: 11, timePerStep: 0.9, timeMin: 22, inkFadeAfter: 4, inkCount: 2, enemyCount: 2, chestCount: 1, shopCount: 0 },
  { cellCols: 10, cellRows: 12, timePerStep: 0.85, timeMin: 24, inkFadeAfter: 3, inkCount: 2, enemyCount: 2, chestCount: 1, shopCount: 1 },
  { cellCols: 11, cellRows: 14, timePerStep: 0.82, timeMin: 26, inkFadeAfter: 3, inkCount: 3, enemyCount: 2, chestCount: 2, shopCount: 1 },
  { cellCols: 12, cellRows: 16, timePerStep: 0.78, timeMin: 28, inkFadeAfter: 3, inkCount: 3, enemyCount: 3, chestCount: 2, shopCount: 1 },
  { cellCols: 13, cellRows: 17, timePerStep: 0.75, timeMin: 30, inkFadeAfter: 2, inkCount: 3, enemyCount: 3, chestCount: 2, shopCount: 1 },
  { cellCols: 14, cellRows: 19, timePerStep: 0.72, timeMin: 32, inkFadeAfter: 2, inkCount: 4, enemyCount: 4, chestCount: 3, shopCount: 1 },
  { cellCols: 15, cellRows: 20, timePerStep: 0.68, timeMin: 34, inkFadeAfter: 2, inkCount: 4, enemyCount: 4, chestCount: 3, shopCount: 2 },
]

function posKey(p: GridPos): string {
  return `${p.col},${p.row}`
}

function pickInkCells(
  level: Pick<LevelConfig, 'playable' | 'start' | 'goal' | 'dungeonObjects'>,
  count: number,
  seed: number
): GridPos[] {
  if (count <= 0) return []

  const start = level.start
  const goal = level.goal
  const dungeonKeys = new Set(level.dungeonObjects.map(posKey))
  const candidates = level.playable.filter((cell) => {
    if (dungeonKeys.has(posKey(cell))) return false
    if (cell.col === start.col && cell.row === start.row) return false
    if (cell.col === goal.col && cell.row === goal.row) return false
    const dist =
      Math.abs(cell.col - start.col) +
      Math.abs(cell.row - start.row) +
      Math.abs(cell.col - goal.col) +
      Math.abs(cell.row - goal.row)
    return dist >= 4
  })

  const picked: GridPos[] = []
  let state = seed
  const nextRandom = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }

  const pool = [...candidates]
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(nextRandom() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }

  return picked
}

function mixSeed(playSeed: number, salt: number): number {
  return (playSeed ^ salt) >>> 0
}

export function buildLevel(
  id: number,
  spec: LevelSpec,
  playSeed: number
): LevelConfig {
  const generator = new MazeGenerator()
  const mazeGrid = generator.generate(
    spec.cellCols,
    spec.cellRows,
    mixSeed(playSeed, id * 9973)
  )
  const rows = mazeGrid.length
  const cols = mazeGrid[0]?.length ?? 0

  const playable: GridPos[] = []
  for (let row = 0; row < spec.cellRows; row++) {
    for (let col = 0; col < spec.cellCols; col++) {
      playable.push({ col, row })
    }
  }

  const start = { col: 0, row: 0 }
  const goal = { col: spec.cellCols - 1, row: spec.cellRows - 1 }

  const dungeonObjects = spawnDungeonOnCells(
    mazeGrid,
    spec.cellCols,
    spec.cellRows,
    start,
    goal,
    {
      enemyCount: spec.enemyCount,
      chestCount: spec.chestCount,
      shopCount: spec.shopCount,
      seed: mixSeed(playSeed, id * 5527),
    }
  )

  const base = {
    id,
    cols,
    rows,
    cellCols: spec.cellCols,
    cellRows: spec.cellRows,
    mazeGrid,
    playable,
    timeLimit: 0,
    inkFadeAfter: spec.inkFadeAfter,
    start,
    goal,
    dungeonObjects,
  }

  const inkCells = pickInkCells(base, spec.inkCount, mixSeed(playSeed, id * 7919))
  const inks = inkCells.map((cell, index) => ({
    col: cell.col,
    row: cell.row,
    bonus: index % 2 === 0 ? 4 : 6,
  }))

  const shortest = shortestPathLength(
    { ...base, inks, solutionLength: 1 },
    start,
    goal
  )
  if (shortest == null) {
    throw new Error(`Level ${id}: start/goal unreachable`)
  }

  const timeLimit = Math.max(
    spec.timeMin,
    Math.round(shortest * spec.timePerStep)
  )

  const level: LevelConfig = {
    ...base,
    inks,
    solutionLength: shortest,
    timeLimit,
  }

  return level
}

const MAX_BUILD_ATTEMPTS = 48

/** 플레이 시드로 레벨을 생성합니다. 배치 실패 시 시드를 바꿔 재시도합니다. */
export function createLevel(
  levelIndex: number,
  playSeed: number = (Math.random() * 0xffffffff) >>> 0
): LevelConfig {
  const spec = LEVEL_SPECS[levelIndex]
  if (!spec) {
    throw new Error(`Invalid level index: ${levelIndex}`)
  }
  const id = levelIndex + 1

  for (let attempt = 0; attempt < MAX_BUILD_ATTEMPTS; attempt++) {
    try {
      return buildLevel(id, spec, (playSeed + attempt * 1597) >>> 0)
    } catch {
      // 보물상자·던전 배치 실패 시 다른 시드로 재생성
    }
  }

  throw new Error(`Level ${id}: generation failed after ${MAX_BUILD_ATTEMPTS} attempts`)
}

export const TOTAL_LEVELS = LEVEL_SPECS.length

/** 레벨 검증용 고정 시드 목록 */
export const LEVEL_TEST_SEEDS = [1, 42, 9973, 246813579] as const

export function isLevelConnected(level: LevelConfig): boolean {
  const queue = [level.start]
  const visited = new Set([posKey(level.start)])

  while (queue.length > 0) {
    const cur = queue.shift()
    if (!cur) break
    if (cur.col === level.goal.col && cur.row === level.goal.row) return true

    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const next = { col: cur.col + dc, row: cur.row + dr }
      const key = posKey(next)
      if (visited.has(key)) continue
      if (!canMoveBetween(level, cur, next)) continue
      visited.add(key)
      queue.push(next)
    }
  }

  return false
}
