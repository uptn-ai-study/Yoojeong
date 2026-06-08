import type { GridPos } from './spawnDungeonElements.ts'

const DIRECTIONS: Array<[number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
]

export function isWalkableCell(maze: number[][], row: number, col: number): boolean {
  return maze[row]?.[col] === 0
}

export function countWalkableNeighbors(maze: number[][], pos: GridPos): number {
  let count = 0
  for (const [dc, dr] of DIRECTIONS) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (isWalkableCell(maze, nr, nc)) count++
  }
  return count
}

/** 막다른 길: 길(0)이면서 인접한 길이 정확히 1칸 */
export function isDeadEnd(maze: number[][], pos: GridPos): boolean {
  if (!isWalkableCell(maze, pos.row, pos.col)) return false
  return countWalkableNeighbors(maze, pos) === 1
}

export function partitionByDeadEnd(
  maze: number[][],
  cells: GridPos[]
): { deadEnds: GridPos[]; others: GridPos[] } {
  const deadEnds: GridPos[] = []
  const others: GridPos[] = []

  for (const cell of cells) {
    if (isDeadEnd(maze, cell)) deadEnds.push(cell)
    else others.push(cell)
  }

  return { deadEnds, others }
}
