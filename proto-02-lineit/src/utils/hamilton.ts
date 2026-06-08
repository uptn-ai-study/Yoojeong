import type { GridPos, LevelConfig } from '../types/game'
import { isAdjacent } from './grid'

export function posKey(p: GridPos): string {
  return `${p.col},${p.row}`
}

function isValidHamiltonPath(
  path: GridPos[],
  goal: GridPos,
  playableSet: Set<string>
): boolean {
  if (path.length === 0) return false

  const seen = new Set<string>()

  for (let i = 0; i < path.length; i++) {
    const p = path[i]
    const key = posKey(p)
    if (!playableSet.has(key) || seen.has(key)) return false
    seen.add(key)
    if (i > 0 && !isAdjacent(path[i - 1], p)) return false
  }

  const last = path[path.length - 1]
  return last.col === goal.col && last.row === goal.row
}

/** start → goal, 플레이 영역의 모든 칸 1회 방문 경로 존재 여부 */
export function hasHamiltonPathInRegion(
  playable: GridPos[],
  start: GridPos,
  goal: GridPos
): boolean {
  return findHamiltonPathInRegion(playable, start, goal) !== null
}

export function findHamiltonPathInRegion(
  playable: GridPos[],
  start: GridPos,
  goal: GridPos
): GridPos[] | null {
  const playableSet = new Set(playable.map(posKey))
  if (!playableSet.has(posKey(start)) || !playableSet.has(posKey(goal))) {
    return null
  }

  const total = playable.length
  const visited = new Set<string>()
  const path: GridPos[] = []

  function dfs(c: number, r: number): boolean {
    const keyHere = posKey({ col: c, row: r })
    if (!playableSet.has(keyHere)) return false
    visited.add(keyHere)
    path.push({ col: c, row: r })

    if (path.length === total) {
      const solved = c === goal.col && r === goal.row
      if (!solved) {
        visited.delete(keyHere)
        path.pop()
      }
      return solved
    }

    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nc = c + dc
      const nr = r + dr
      const key = posKey({ col: nc, row: nr })
      if (playableSet.has(key) && !visited.has(key) && dfs(nc, nr)) {
        return true
      }
    }

    visited.delete(keyHere)
    path.pop()
    return false
  }

  if (!dfs(start.col, start.row)) return null
  return isValidHamiltonPath(path, goal, playableSet) ? path : null
}

export function assertLevelSolvable(level: LevelConfig): void {
  if (!hasHamiltonPathInRegion(level.playable, level.start, level.goal)) {
    throw new Error(
      `Level ${level.id} has no Hamilton path from start to goal`
    )
  }
}
