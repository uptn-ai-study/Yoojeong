import type { GridPos } from '../types/game.ts'
import { cellToGrid } from './maze.ts'

export type CellDungeonType = 'E' | 'C' | 'S'

export interface CellDungeonPlacement {
  col: number
  row: number
  type: CellDungeonType
}

export interface CellDungeonSpawnConfig {
  enemyCount: number
  chestCount: number
  shopCount: number
  seed?: number
}

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

function shuffle<T>(arr: T[], random: RandomFn): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function posKey(pos: GridPos): string {
  return `${pos.col},${pos.row}`
}

function isRoomCell(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  pos: GridPos
): boolean {
  if (pos.col < 0 || pos.row < 0 || pos.col >= cellCols || pos.row >= cellRows) {
    return false
  }
  const { gx, gy } = cellToGrid(pos.col, pos.row)
  return mazeGrid[gy]?.[gx] === 0
}

function canMoveBetweenCells(
  mazeGrid: number[][],
  from: GridPos,
  to: GridPos
): boolean {
  const dc = to.col - from.col
  const dr = to.row - from.row
  if (Math.abs(dc) + Math.abs(dr) !== 1) return false
  const { gx, gy } = cellToGrid(from.col, from.row)
  return mazeGrid[gy + dr]?.[gx + dc] === 0
}

function canApproachFromStartAvoiding(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  start: GridPos,
  enemyCell: GridPos,
  blocked: Set<string>
): boolean {
  for (const [dc, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const adj = { col: enemyCell.col + dc, row: enemyCell.row + dr }
    const adjKey = posKey(adj)
    if (blocked.has(adjKey)) continue
    if (!isRoomCell(mazeGrid, cellCols, cellRows, adj)) continue
    if (!canMoveBetweenCells(mazeGrid, enemyCell, adj)) continue
    if (
      canReachFromStartAvoiding(
        mazeGrid,
        cellCols,
        cellRows,
        start,
        adj,
        blocked
      )
    ) {
      return true
    }
  }
  return false
}

function canReachFromStartAvoiding(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  start: GridPos,
  target: GridPos,
  blocked: Set<string>
): boolean {
  const queue = [start]
  const visited = new Set([posKey(start)])

  while (queue.length > 0) {
    const cur = queue.shift()
    if (!cur) break

    if (cur.col === target.col && cur.row === target.row) {
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
      if (!isRoomCell(mazeGrid, cellCols, cellRows, next)) continue
      if (!canMoveBetweenCells(mazeGrid, cur, next)) continue
      visited.add(key)
      queue.push(next)
    }
  }

  return false
}

function countOpenNeighbors(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  pos: GridPos
): number {
  let count = 0
  for (const [dc, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const next = { col: pos.col + dc, row: pos.row + dr }
    if (!isRoomCell(mazeGrid, cellCols, cellRows, next)) continue
    if (!canMoveBetweenCells(mazeGrid, pos, next)) continue
    count++
  }
  return count
}

function isDeadEndCell(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  pos: GridPos
): boolean {
  return countOpenNeighbors(mazeGrid, cellCols, cellRows, pos) === 1
}

function collectSpawnableCells(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  reserved: GridPos[]
): GridPos[] {
  const reservedKeys = new Set(reserved.map(posKey))
  const cells: GridPos[] = []

  for (let row = 0; row < cellRows; row++) {
    for (let col = 0; col < cellCols; col++) {
      const pos = { col, row }
      if (!isRoomCell(mazeGrid, cellCols, cellRows, pos)) continue
      if (reservedKeys.has(posKey(pos))) continue
      cells.push(pos)
    }
  }

  return cells
}

function pickCells(primary: GridPos[], fallback: GridPos[], count: number): GridPos[] {
  const picked = primary.slice(0, count)
  if (picked.length < count) {
    picked.push(...fallback.slice(0, count - picked.length))
  }
  return picked
}

/**
 * 미로 방(셀) 좌표 기준으로 E/C/S를 배치합니다.
 * 몬스터를 먼저 배치하고, 보물상자는 몬스터를 피해 시작점에서 도달 가능한 막다른 길에 둡니다.
 */
export function spawnDungeonOnCells(
  mazeGrid: number[][],
  cellCols: number,
  cellRows: number,
  start: GridPos,
  goal: GridPos,
  config: CellDungeonSpawnConfig
): CellDungeonPlacement[] {
  const { enemyCount, chestCount, shopCount } = config
  const total = enemyCount + chestCount + shopCount
  const spawnable = collectSpawnableCells(mazeGrid, cellCols, cellRows, [start, goal])

  if (spawnable.length < total) {
    throw new Error(
      `배치 가능한 칸이 부족합니다. 필요: ${total}, 가능: ${spawnable.length}`
    )
  }

  const random = config.seed != null ? mulberry32(config.seed) : Math.random

  const deadEnds: GridPos[] = []
  const others: GridPos[] = []
  for (const cell of spawnable) {
    if (isDeadEndCell(mazeGrid, cellCols, cellRows, cell)) deadEnds.push(cell)
    else others.push(cell)
  }

  // 몬스터는 다른 몬스터 칸을 거치지 않고 접근 가능한 곳에만 배치합니다.
  const enemyPool = shuffle([...others, ...deadEnds], random)
  const enemyCells: GridPos[] = []
  const enemyKeys = new Set<string>()

  for (let i = 0; i < enemyCount; i++) {
    const candidates = enemyPool.filter((cell) => {
      if (enemyKeys.has(posKey(cell))) return false

      if (
        !canApproachFromStartAvoiding(
          mazeGrid,
          cellCols,
          cellRows,
          start,
          cell,
          enemyKeys
        )
      ) {
        return false
      }

      const withNew = new Set([...enemyKeys, posKey(cell)])
      for (const placed of enemyCells) {
        if (
          !canApproachFromStartAvoiding(
            mazeGrid,
            cellCols,
            cellRows,
            start,
            placed,
            withNew
          )
        ) {
          return false
        }
      }

      return true
    })

    if (candidates.length === 0) {
      throw new Error(
        `접근 가능한 몬스터 배치 칸이 부족합니다. 필요: ${enemyCount}, 배치: ${i}`
      )
    }

    const picked = shuffle(candidates, random)[0]
    enemyCells.push(picked)
    enemyKeys.add(posKey(picked))
  }
  const afterEnemies = spawnable.filter((cell) => !enemyKeys.has(posKey(cell)))

  const reachableDeadEnds = shuffle(
    afterEnemies.filter(
      (cell) =>
        isDeadEndCell(mazeGrid, cellCols, cellRows, cell) &&
        canReachFromStartAvoiding(
          mazeGrid,
          cellCols,
          cellRows,
          start,
          cell,
          enemyKeys
        )
    ),
    random
  )
  const reachableOthers = shuffle(
    afterEnemies.filter(
      (cell) =>
        !isDeadEndCell(mazeGrid, cellCols, cellRows, cell) &&
        canReachFromStartAvoiding(
          mazeGrid,
          cellCols,
          cellRows,
          start,
          cell,
          enemyKeys
        )
    ),
    random
  )

  const chestCells = pickCells(reachableDeadEnds, reachableOthers, chestCount)
  if (chestCells.length < chestCount) {
    throw new Error(
      `몬스터를 피해 도달 가능한 보물상자 칸이 부족합니다. 필요: ${chestCount}, 가능: ${chestCells.length}`
    )
  }

  const chestKeys = new Set(chestCells.map(posKey))
  const afterChests = afterEnemies.filter((cell) => !chestKeys.has(posKey(cell)))
  const shopCells = shuffle(afterChests, random).slice(0, shopCount)

  if (shopCells.length < shopCount) {
    throw new Error(
      `상점을 배치할 칸이 부족합니다. 필요: ${shopCount}, 가능: ${shopCells.length}`
    )
  }

  return [
    ...enemyCells.map((cell) => ({ ...cell, type: 'E' as const })),
    ...chestCells.map((cell) => ({ ...cell, type: 'C' as const })),
    ...shopCells.map((cell) => ({ ...cell, type: 'S' as const })),
  ]
}
