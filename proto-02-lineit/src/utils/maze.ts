import type { GridPos, LevelConfig } from '../types/game.ts'
import { isAdjacent, posKey } from './grid.ts'

export function cellToGrid(col: number, row: number): { gx: number; gy: number } {
  return { gx: 2 * col + 1, gy: 2 * row + 1 }
}

export function gridToCell(gx: number, gy: number): GridPos | null {
  if (gx % 2 !== 1 || gy % 2 !== 1) return null
  return { col: (gx - 1) / 2, row: (gy - 1) / 2 }
}

export function isRoomCell(level: LevelConfig, cell: GridPos): boolean {
  const { gx, gy } = cellToGrid(cell.col, cell.row)
  return (
    cell.col >= 0 &&
    cell.col < level.cellCols &&
    cell.row >= 0 &&
    cell.row < level.cellRows &&
    level.mazeGrid[gy]?.[gx] === 0
  )
}

export function canMoveBetween(
  level: LevelConfig,
  from: GridPos,
  to: GridPos
): boolean {
  if (!isAdjacent(from, to)) return false
  if (!isRoomCell(level, from) || !isRoomCell(level, to)) return false

  const dc = to.col - from.col
  const dr = to.row - from.row
  const { gx, gy } = cellToGrid(from.col, from.row)
  return level.mazeGrid[gy + dr]?.[gx + dc] === 0
}

/** 다른 던전 칸을 밟지 않고 target 인접 칸에서 접근 가능한지 */
export function canApproachCellAvoiding(
  level: LevelConfig,
  target: GridPos,
  blocked: Set<string>
): boolean {
  for (const [dc, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const adj = { col: target.col + dc, row: target.row + dr }
    const adjKey = posKey(adj)
    if (blocked.has(adjKey)) continue
    if (!canMoveBetween(level, target, adj)) continue
    if (canReachCellAvoiding(level, level.start, adj, blocked)) {
      return true
    }
  }
  return false
}

export function canReachCellAvoiding(
  level: LevelConfig,
  from: GridPos,
  to: GridPos,
  blocked: Set<string>
): boolean {
  const queue = [from]
  const visited = new Set([posKey(from)])

  while (queue.length > 0) {
    const cur = queue.shift()
    if (!cur) break

    if (cur.col === to.col && cur.row === to.row) {
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
      if (!canMoveBetween(level, cur, next)) continue
      visited.add(key)
      queue.push(next)
    }
  }

  return false
}

export function shortestPathLength(
  level: LevelConfig,
  start: GridPos,
  goal: GridPos
): number | null {
  const queue = [start]
  const visited = new Set([posKey(start)])
  const dist = new Map<string, number>([[posKey(start), 1]])

  while (queue.length > 0) {
    const cur = queue.shift()
    if (!cur) break

    if (cur.col === goal.col && cur.row === goal.row) {
      return dist.get(posKey(cur)) ?? null
    }

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
      dist.set(key, (dist.get(posKey(cur)) ?? 0) + 1)
      queue.push(next)
    }
  }

  return null
}
