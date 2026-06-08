import type { DungeonEvent as GameDungeonEvent, DungeonPlacement, GridPos } from '../types/game'
import type { DungeonObject, ObjectMapCell } from './spawnDungeonElements.ts'

export type DungeonEventKind =
  | 'enemy_encounter'
  | 'chest'
  | 'shop'
  | 'goal'
  | 'empty'

export interface DungeonEventBase {
  kind: DungeonEventKind
  position: GridPos
}

/** 턴제 전투 / 카드 보상 팝업을 띄울 때 사용 */
export interface EnemyEncounterEvent extends DungeonEventBase {
  kind: 'enemy_encounter'
  object: 'E'
  /** UI에서 전투 인스턴스를 구분할 때 사용 */
  encounterId: string
}

export interface ChestEvent extends DungeonEventBase {
  kind: 'chest'
  object: 'C'
}

export interface ShopEvent extends DungeonEventBase {
  kind: 'shop'
  object: 'S'
}

export interface GoalEvent extends DungeonEventBase {
  kind: 'goal'
  object: 'G'
}

export interface EmptyCellEvent extends DungeonEventBase {
  kind: 'empty'
  object: 0
}

export type DungeonEvent =
  | EnemyEncounterEvent
  | ChestEvent
  | ShopEvent
  | GoalEvent
  | EmptyCellEvent

function posKey(pos: GridPos): string {
  return `${pos.row},${pos.col}`
}

function cellAt(objectMap: ObjectMapCell[][], pos: GridPos): ObjectMapCell | null {
  return objectMap[pos.row]?.[pos.col] ?? null
}

function isDungeonObject(cell: ObjectMapCell): cell is DungeonObject {
  return cell === 'E' || cell === 'C' || cell === 'S' || cell === 'P' || cell === 'G'
}

/**
 * 플레이어가 도착한 칸의 던전 이벤트를 검사합니다.
 * 'E' 칸이면 enemy_encounter 이벤트를 반환해 전투 UI를 띄울 수 있습니다.
 */
export function checkDungeonCellEvent(
  objectMap: ObjectMapCell[][],
  position: GridPos
): DungeonEvent | null {
  const cell = cellAt(objectMap, position)
  if (cell == null) return null

  switch (cell) {
    case 'E':
      return {
        kind: 'enemy_encounter',
        position: { ...position },
        object: 'E',
        encounterId: posKey(position),
      }
    case 'C':
      return { kind: 'chest', position: { ...position }, object: 'C' }
    case 'S':
      return { kind: 'shop', position: { ...position }, object: 'S' }
    case 'G':
      return { kind: 'goal', position: { ...position }, object: 'G' }
    case 'P':
    case 0:
      return { kind: 'empty', position: { ...position }, object: 0 }
    case 1:
      return null
    default:
      return null
  }
}

/**
 * 이동 직후 호출용 헬퍼.
 * 전투/상자/상점/탈출구 이벤트만 반환하고, 빈 칸이면 null을 반환합니다.
 */
export function checkDungeonTrigger(
  objectMap: ObjectMapCell[][],
  position: GridPos
): Exclude<DungeonEvent, EmptyCellEvent> | null {
  const event = checkDungeonCellEvent(objectMap, position)
  if (!event || event.kind === 'empty') return null
  return event
}

function placementToEvent(placement: DungeonPlacement): GameDungeonEvent {
  const position = { col: placement.col, row: placement.row }
  const encounterId = `${placement.col},${placement.row}`
  switch (placement.type) {
    case 'E':
      return { kind: 'enemy_encounter', position, encounterId }
    case 'C':
      return { kind: 'chest', position, encounterId }
    case 'S':
      return { kind: 'shop', position, encounterId }
  }
}

/** 셀 좌표 기반 던전 배치에서 이벤트를 검사합니다. */
export function checkPlacementTrigger(
  placements: DungeonPlacement[],
  activeKeys: Set<string>,
  position: GridPos
): GameDungeonEvent | null {
  const key = `${position.col},${position.row}`
  if (!activeKeys.has(key)) return null
  const placement = placements.find(
    (p) => p.col === position.col && p.row === position.row
  )
  if (!placement) return null
  return placementToEvent(placement)
}

/** 전투 승리·상자 오픈 후 칸을 빈 길(0)로 되돌립니다. */
export function clearDungeonObject(
  objectMap: ObjectMapCell[][],
  position: GridPos
): ObjectMapCell[][] {
  const cell = cellAt(objectMap, position)
  if (cell == null || !isDungeonObject(cell) || cell === 'P' || cell === 'G') {
    return objectMap
  }

  const next = objectMap.map((row) => [...row])
  next[position.row][position.col] = 0
  return next
}
