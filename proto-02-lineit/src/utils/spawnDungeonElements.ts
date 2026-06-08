import { partitionByDeadEnd } from './dungeonTopology.ts'

export type DungeonObject = 'E' | 'C' | 'S' | 'P' | 'G'

/** 0=길, 1=벽, 그 외=던전 오브젝트 */
export type ObjectMapCell = 0 | 1 | DungeonObject

export interface DungeonSpawnConfig {
  enemyCount: number
  chestCount: number
  shopCount: number
  seed?: number
}

export interface GridPos {
  row: number
  col: number
}

export interface DungeonSpawnResult {
  objectMap: ObjectMapCell[][]
  player: GridPos
  goal: GridPos
}

const PLAYER_POS: GridPos = { row: 1, col: 1 }

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
  return `${pos.row},${pos.col}`
}

function cloneMazeAsObjectMap(maze: number[][]): ObjectMapCell[][] {
  return maze.map((row) => row.map((cell) => cell as ObjectMapCell))
}

function inBounds(maze: number[][], row: number, col: number): boolean {
  return row >= 0 && row < maze.length && col >= 0 && col < (maze[0]?.length ?? 0)
}

function findBottomRightPath(maze: number[][]): GridPos {
  for (let row = maze.length - 1; row >= 0; row--) {
    for (let col = (maze[row]?.length ?? 0) - 1; col >= 0; col--) {
      if (maze[row][col] === 0) {
        return { row, col }
      }
    }
  }
  throw new Error('탈출구로 사용할 빈 공간(0)을 찾을 수 없습니다.')
}

function collectSpawnableCells(
  maze: number[][],
  reserved: GridPos[]
): GridPos[] {
  const reservedKeys = new Set(reserved.map(posKey))
  const cells: GridPos[] = []

  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < (maze[row]?.length ?? 0); col++) {
      if (maze[row][col] !== 0) continue
      const key = posKey({ row, col })
      if (reservedKeys.has(key)) continue
      cells.push({ row, col })
    }
  }

  return cells
}

function assertPathCell(maze: number[][], pos: GridPos, label: string): void {
  if (!inBounds(maze, pos.row, pos.col)) {
    throw new Error(`${label} 위치가 미로 범위를 벗어났습니다.`)
  }
  if (maze[pos.row][pos.col] !== 0) {
    throw new Error(`${label} 위치 [${pos.row}][${pos.col}]는 길(0)이 아닙니다.`)
  }
}

function pickCells(
  primary: GridPos[],
  fallback: GridPos[],
  count: number
): GridPos[] {
  const picked = primary.slice(0, count)
  if (picked.length < count) {
    picked.push(...fallback.slice(0, count - picked.length))
  }
  return picked
}

/**
 * 보물상자는 막다른 길을 우선 배치하고, 부족하면 일반 길에 배치합니다.
 */
function pickChestCells(
  maze: number[][],
  spawnable: GridPos[],
  chestCount: number,
  random: RandomFn
): GridPos[] {
  const { deadEnds, others } = partitionByDeadEnd(maze, spawnable)
  const shuffledDeadEnds = shuffle(deadEnds, random)
  const shuffledOthers = shuffle(others, random)
  const picked = pickCells(shuffledDeadEnds, shuffledOthers, chestCount)

  if (picked.length < chestCount) {
    throw new Error(
      `보물상자를 배치할 칸이 부족합니다. 필요: ${chestCount}, 가능: ${picked.length}`
    )
  }

  return picked
}

/**
 * 미로(0=길, 1=벽)의 빈 공간에 로그라이크 오브젝트를 랜덤 배치합니다.
 * 원본 maze는 변경하지 않고, 별도 objectMap을 반환합니다.
 *
 * - P(플레이어): [1][1] 고정
 * - G(탈출구): 우측 하단 끝 빈 공간 고정
 * - C(보물상자): 막다른 길 우선 배치
 */
export function spawnDungeonElements(
  maze: number[][],
  config: DungeonSpawnConfig
): DungeonSpawnResult {
  if (maze.length === 0 || (maze[0]?.length ?? 0) === 0) {
    throw new Error('maze는 비어 있을 수 없습니다.')
  }

  const { enemyCount, chestCount, shopCount } = config
  if (enemyCount < 0 || chestCount < 0 || shopCount < 0) {
    throw new Error('오브젝트 개수는 0 이상이어야 합니다.')
  }

  const player = { ...PLAYER_POS }
  const goal = findBottomRightPath(maze)

  assertPathCell(maze, player, '플레이어 시작점')
  assertPathCell(maze, goal, '탈출구')

  if (player.row === goal.row && player.col === goal.col) {
    throw new Error('시작점과 탈출구가 같은 칸입니다.')
  }

  const totalRequested = enemyCount + chestCount + shopCount
  const spawnable = collectSpawnableCells(maze, [player, goal])

  if (spawnable.length < totalRequested) {
    throw new Error(
      `배치 가능한 칸이 부족합니다. 필요: ${totalRequested}, 가능: ${spawnable.length}`
    )
  }

  const random = config.seed != null ? mulberry32(config.seed) : Math.random

  const chestCells = pickChestCells(maze, spawnable, chestCount, random)
  const chestKeys = new Set(chestCells.map(posKey))
  const remaining = spawnable.filter((cell) => !chestKeys.has(posKey(cell)))
  const shuffledRemaining = shuffle(remaining, random)

  if (shuffledRemaining.length < enemyCount + shopCount) {
    throw new Error('몬스터/상점을 배치할 칸이 부족합니다.')
  }

  const objectMap = cloneMazeAsObjectMap(maze)
  let cursor = 0

  for (const cell of chestCells) {
    objectMap[cell.row][cell.col] = 'C'
  }

  for (let i = 0; i < enemyCount; i++) {
    const cell = shuffledRemaining[cursor++]
    objectMap[cell.row][cell.col] = 'E'
  }

  for (let i = 0; i < shopCount; i++) {
    const cell = shuffledRemaining[cursor++]
    objectMap[cell.row][cell.col] = 'S'
  }

  objectMap[player.row][player.col] = 'P'
  objectMap[goal.row][goal.col] = 'G'

  return { objectMap, player, goal }
}

export { isDeadEnd, partitionByDeadEnd } from './dungeonTopology.ts'
