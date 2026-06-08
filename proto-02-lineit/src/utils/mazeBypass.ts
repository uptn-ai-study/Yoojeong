import type { GridPos, LevelConfig } from '../types/game.ts'
import { posKey } from './grid.ts'
import { canMoveBetween, cellToGrid } from './maze.ts'

type RandomFn = () => number

function mulberry32(seed: number): RandomFn {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row])
}

function wallBetweenRooms(a: GridPos, b: GridPos): { gx: number; gy: number } | null {
  const dc = b.col - a.col
  const dr = b.row - a.row
  const { gx, gy } = cellToGrid(a.col, a.row)
  if (dc === 1 && dr === 0) return { gx: gx + 1, gy }
  if (dc === -1 && dr === 0) return { gx: gx - 1, gy }
  if (dc === 0 && dr === 1) return { gx, gy: gy + 1 }
  if (dc === 0 && dr === -1) return { gx, gy: gy - 1 }
  return null
}

function monsterProximity(cell: GridPos, monster: GridPos): number {
  return Math.abs(cell.col - monster.col) + Math.abs(cell.row - monster.row)
}

interface WallCandidate {
  wall: { gx: number; gy: number }
  roomA: GridPos
  roomB: GridPos
  nearMonster: number
}

function collectWallCandidates(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  monsterCell: GridPos
): WallCandidate[] {
  const candidates: WallCandidate[] = []

  for (let row = 0; row < cellRows; row++) {
    for (let col = 0; col < cellCols; col++) {
      const roomA = { col, row }
      for (const [dc, dr] of [
        [1, 0],
        [0, 1],
      ] as const) {
        const roomB = { col: col + dc, row: row + dr }
        if (roomB.col >= cellCols || roomB.row >= cellRows) continue

        const wall = wallBetweenRooms(roomA, roomB)
        if (!wall) continue
        if (mazeGrid[wall.gy]?.[wall.gx] !== 1) continue

        candidates.push({
          wall,
          roomA,
          roomB,
          nearMonster: Math.min(
            monsterProximity(roomA, monsterCell),
            monsterProximity(roomB, monsterCell)
          ),
        })
      }
    }
  }

  return candidates
}

/** 몬스터 칸을 피해 시작→목표 도달 가능 여부 */
export function canReachGoalAvoidingMonster(
  level: LevelConfig,
  monsterCell: GridPos,
  mazeGrid: number[][] = level.mazeGrid
): boolean {
  const blocked = new Set([posKey(monsterCell)])
  const levelWithGrid = { ...level, mazeGrid }
  const queue = [level.start]
  const visited = new Set([posKey(level.start)])

  while (queue.length > 0) {
    const cur = queue.shift()
    if (!cur) break

    if (cur.col === level.goal.col && cur.row === level.goal.row) {
      return true
    }

    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const next = { col: cur.col + dc, row: cur.row + dr }
      const key = posKey(next)
      if (visited.has(key) || blocked.has(key)) continue
      if (!canMoveBetween(levelWithGrid, cur, next)) continue
      visited.add(key)
      queue.push(next)
    }
  }

  return false
}

/**
 * 몬스터가 길을 막았을 때 우회할 수 있도록 인접 벽 하나(또는 둘)를 뚫습니다.
 */
export function openBypassRoute(
  level: LevelConfig,
  monsterCell: GridPos,
  seed = 0
): { mazeGrid: number[][]; carved: boolean } {
  const baseGrid = level.mazeGrid

  if (canReachGoalAvoidingMonster(level, monsterCell, baseGrid)) {
    return { mazeGrid: baseGrid, carved: false }
  }

  const random = mulberry32(seed)
  const candidates = collectWallCandidates(
    baseGrid,
    level.cellCols,
    level.cellRows,
    monsterCell
  ).sort((a, b) => {
    if (a.nearMonster !== b.nearMonster) {
      return a.nearMonster - b.nearMonster
    }
    return random() - 0.5
  })

  for (const { wall } of candidates) {
    const next = cloneGrid(baseGrid)
    next[wall.gy][wall.gx] = 0
    if (canReachGoalAvoidingMonster(level, monsterCell, next)) {
      return { mazeGrid: next, carved: true }
    }
  }

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const next = cloneGrid(baseGrid)
      next[candidates[i].wall.gy][candidates[i].wall.gx] = 0
      next[candidates[j].wall.gy][candidates[j].wall.gx] = 0
      if (canReachGoalAvoidingMonster(level, monsterCell, next)) {
        return { mazeGrid: next, carved: true }
      }
    }
  }

  if (candidates.length > 0) {
    const next = cloneGrid(baseGrid)
    const wall = candidates[0].wall
    next[wall.gy][wall.gx] = 0
    return { mazeGrid: next, carved: true }
  }

  return { mazeGrid: baseGrid, carved: false }
}
