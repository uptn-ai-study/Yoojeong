export interface GridPos {
  col: number
  row: number
}

export interface InkSpot extends GridPos {
  bonusSeconds: number
  fadeAt: number
}

export type DungeonObjectType = 'E' | 'C' | 'S'

export interface DungeonPlacement extends GridPos {
  type: DungeonObjectType
}

export type DungeonEventKind =
  | 'enemy_encounter'
  | 'enemy_already_fought'
  | 'chest'
  | 'shop'

export interface DungeonEvent {
  kind: DungeonEventKind
  position: GridPos
  encounterId: string
}

export interface LevelConfig {
  id: number
  /** 0/1 미로 격자 크기 (열) */
  cols: number
  /** 0/1 미로 격자 크기 (행) */
  rows: number
  /** 미로 방(셀) 개수 */
  cellCols: number
  cellRows: number
  /** 0=길, 1=벽 */
  mazeGrid: number[][]
  /** 이동 가능한 방(셀) 좌표 */
  playable: GridPos[]
  timeLimit: number
  inkFadeAfter: number
  inks: {
    col: number
    row: number
    bonus: number
  }[]
  start: GridPos
  goal: GridPos
  /** 시작→목표 최단 경로 길이 (진행률 계산용) */
  solutionLength: number
  /** 미로 위 몬스터·보물상자·상점 */
  dungeonObjects: DungeonPlacement[]
}

export interface PathCell extends GridPos {
  index: number
}

export type GamePhase = 'intro' | 'playing' | 'levelClear' | 'gameOver' | 'victory'

export interface RankingEntry {
  id: string
  score: number
  timestamp: number
}

export interface LevelScoreBreakdown {
  level: number
  completion: number
  timeBonus: number
  smoothness: number
  inkBonus: number
  /** 몬스터 통과 가산점 (마리당 10점) */
  monsterBonus: number
  total: number
}

export interface GameSession {
  playerId: string
  levelScores: LevelScoreBreakdown[]
  totalScore: number
}
