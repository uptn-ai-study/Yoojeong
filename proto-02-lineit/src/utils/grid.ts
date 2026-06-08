import type { GridPos, LevelConfig } from '../types/game'

export function posKey(p: GridPos): string {
  return `${p.col},${p.row}`
}

export function isAdjacent(a: GridPos, b: GridPos): boolean {
  const dc = Math.abs(a.col - b.col)
  const dr = Math.abs(a.row - b.row)
  return (dc === 1 && dr === 0) || (dc === 0 && dr === 1)
}

export function isInBounds(p: GridPos, cols: number, rows: number): boolean {
  return p.col >= 0 && p.col < cols && p.row >= 0 && p.row < rows
}

export function playableSet(level: LevelConfig): Set<string> {
  return new Set(level.playable.map(posKey))
}

export function isPlayableCell(level: LevelConfig, cell: GridPos): boolean {
  const { gx, gy } = { gx: 2 * cell.col + 1, gy: 2 * cell.row + 1 }
  return (
    cell.col >= 0 &&
    cell.col < level.cellCols &&
    cell.row >= 0 &&
    cell.row < level.cellRows &&
    level.mazeGrid[gy]?.[gx] === 0
  )
}

export function totalPlayableCells(level: LevelConfig): number {
  return level.playable.length
}

export function cellIndex(col: number, row: number, cols: number): number {
  return row * cols + col
}

export const CELL_COLORS = [
  'var(--cell-1)',
  'var(--cell-2)',
  'var(--cell-3)',
  'var(--cell-4)',
  'var(--cell-5)',
]

export function cellColor(col: number, row: number): string {
  return CELL_COLORS[(col + row) % CELL_COLORS.length]
}
