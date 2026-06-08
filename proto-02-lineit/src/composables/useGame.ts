import { computed, onUnmounted, ref, shallowRef } from 'vue'
import { createLevel, TOTAL_LEVELS } from '../data/levels'
import type {
  DungeonEvent,
  DungeonPlacement,
  GamePhase,
  GridPos,
  InkSpot,
  LevelScoreBreakdown,
} from '../types/game'
import { checkPlacementTrigger } from '../utils/dungeonEvents'
import { isPlayableCell, posKey, totalPlayableCells } from '../utils/grid'
import { openBypassRoute } from '../utils/mazeBypass'
import { canMoveBetween } from '../utils/maze'
import { getRpsOutcome, randomRpsChoice, type RpsChoice } from '../utils/rps'
import { calcLevelScore, MONSTER_PASS_POINTS, validatePath } from '../utils/scoring'

const COMBAT_LOSE_PENALTY = 5

/**
 * 미로 통과 로직
 * - 시작점(녹색)에서 경로를 이어서 탐색
 * - 되돌리면 경로가 줄어듦
 * - 붉은 점(목표)에 도달하면 레벨 클리어
 * - 사과를 먹으면 시간 보너스, 일정 시간 후 소멸
 */
export function useGame() {
  const phase = ref<GamePhase>('intro')
  const currentLevelIndex = ref(0)
  const path = ref<GridPos[]>([])
  const isStretching = ref(false)
  const timeLeft = ref(0)
  const levelScores = ref<LevelScoreBreakdown[]>([])
  const totalScore = ref(0)
  const inksCollected = ref(0)
  const monstersDefeated = ref(0)
  const collectedKeys = ref<Set<string>>(new Set())
  const message = ref('')
  const activeInks = shallowRef<InkSpot[]>([])
  const activeDungeonKeys = ref<Set<string>>(new Set())
  /** 가위바위보에서 진 몬스터 (재전투 불가) */
  const defeatedByMonsterKeys = ref<Set<string>>(new Set())
  const dungeonEvent = ref<DungeonEvent | null>(null)
  const rpsCombatActive = ref(false)
  const rpsRound = ref<{
    player: RpsChoice
    enemy: RpsChoice
    outcome: 'win' | 'lose' | 'draw'
  } | null>(null)

  let rpsResolveTimer: ReturnType<typeof setTimeout> | null = null

  const runtimeMazeGrid = shallowRef<number[][] | null>(null)
  const mazeRevision = ref(0)
  const currentLevel = shallowRef(
    createLevel(0, (Math.random() * 0xffffffff) >>> 0)
  )

  let timerId: ReturnType<typeof setInterval> | null = null
  let levelStartMs = 0

  const level = computed(() => {
    const base = currentLevel.value
    const grid = runtimeMazeGrid.value ?? base.mazeGrid
    if (grid === base.mazeGrid) return base
    return { ...base, mazeGrid: grid }
  })
  const totalCells = computed(() => totalPlayableCells(level.value))

  const pathSet = computed(() => new Set(path.value.map(posKey)))

  const activeDungeonObjects = computed<DungeonPlacement[]>(() =>
    level.value.dungeonObjects.filter((obj) =>
      activeDungeonKeys.value.has(posKey(obj))
    )
  )

  const progress = computed(() => {
    if (path.value.length === 0) return 0
    if (phase.value === 'levelClear' || phase.value === 'victory') return 100
    const target = Math.max(2, level.value.solutionLength)
    return Math.min(99, Math.round((path.value.length / target) * 100))
  })

  function clearTimer(): void {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function inkFadeAt(): number {
    const lv = level.value
    return lv.inkFadeAfter > 0
      ? levelStartMs + lv.inkFadeAfter * 1000
      : Number.POSITIVE_INFINITY
  }

  function clearRpsTimer(): void {
    if (rpsResolveTimer) {
      clearTimeout(rpsResolveTimer)
      rpsResolveTimer = null
    }
  }

  function isBlockingEnemyCell(cell: GridPos): boolean {
    const key = posKey(cell)
    if (!activeDungeonKeys.value.has(key)) return false
    return level.value.dungeonObjects.some(
      (obj) => obj.type === 'E' && obj.col === cell.col && obj.row === cell.row
    )
  }

  function resetRuntimeMaze(): void {
    runtimeMazeGrid.value = null
    mazeRevision.value = 0
  }

  function applyMazeBypass(monsterCell: GridPos): boolean {
    const lv = level.value
    const seed = lv.id * 313 + monsterCell.col * 17 + monsterCell.row
    const result = openBypassRoute(lv, monsterCell, seed)
    if (!result.carved || result.mazeGrid === lv.mazeGrid) return false
    runtimeMazeGrid.value = result.mazeGrid
    mazeRevision.value += 1
    return true
  }

  function clearDungeonState(): void {
    clearRpsTimer()
    dungeonEvent.value = null
    rpsCombatActive.value = false
    rpsRound.value = null
  }

  function initDungeon(): void {
    clearDungeonState()
    activeDungeonKeys.value = new Set(
      level.value.dungeonObjects.map((obj) => posKey(obj))
    )
    defeatedByMonsterKeys.value = new Set()
  }

  function showAlreadyFoughtMonster(cell: GridPos): void {
    dungeonEvent.value = {
      kind: 'enemy_already_fought',
      position: { ...cell },
      encounterId: posKey(cell),
    }
  }

  function dismissMonsterNotice(): void {
    if (dungeonEvent.value?.kind !== 'enemy_already_fought') return
    dungeonEvent.value = null
    if (phase.value === 'playing' && timeLeft.value <= 0) {
      onTimeUp()
    }
  }

  function initInks(): void {
    const lv = level.value
    const fadeAt = inkFadeAt()
    activeInks.value = lv.inks.map((ink) => ({
      col: ink.col,
      row: ink.row,
      bonusSeconds: ink.bonus,
      fadeAt,
    }))
  }

  function initInksPending(): void {
    activeInks.value = level.value.inks.map((ink) => ({
      col: ink.col,
      row: ink.row,
      bonusSeconds: ink.bonus,
      fadeAt: Number.POSITIVE_INFINITY,
    }))
  }

  function beginLevelTimer(): void {
    levelStartMs = performance.now()
    initInks()
    startTimer()
  }

  function tickInks(): void {
    const now = performance.now()
    activeInks.value = activeInks.value.filter((ink) => ink.fadeAt > now)
  }

  function startTimer(): void {
    clearTimer()
    timeLeft.value = level.value.timeLimit
    timerId = setInterval(() => {
      tickInks()
      if (timeLeft.value <= 0) {
        timeLeft.value = 0
        onTimeUp()
        return
      }
      timeLeft.value -= 1
    }, 1000)
  }

  function resetPath(): void {
    path.value = []
    isStretching.value = false
  }

  function restoreInkOnCell(p: GridPos): void {
    const lv = level.value
    const def = lv.inks.find((ink) => ink.col === p.col && ink.row === p.row)
    if (!def) return
    if (performance.now() > inkFadeAt()) return
    const key = posKey(p)
    if (activeInks.value.some((ink) => posKey(ink) === key)) return
    activeInks.value = [
      ...activeInks.value,
      {
        col: p.col,
        row: p.row,
        bonusSeconds: def.bonus,
        fadeAt: inkFadeAt(),
      },
    ]
  }

  function revertCellsFromPath(removed: GridPos[]): void {
    for (const p of removed) {
      const key = posKey(p)
      if (!collectedKeys.value.has(key)) continue
      const lv = level.value
      const def = lv.inks.find((ink) => ink.col === p.col && ink.row === p.row)
      if (!def) continue
      collectedKeys.value.delete(key)
      timeLeft.value = Math.max(0, timeLeft.value - def.bonus)
      inksCollected.value = Math.max(0, inksCollected.value - 1)
      restoreInkOnCell(p)
    }
  }

  function startLevel(deferTimer = false): void {
    if (currentLevelIndex.value === 0) {
      levelScores.value = []
      totalScore.value = 0
    }

    resetPath()
    inksCollected.value = 0
    monstersDefeated.value = 0
    collectedKeys.value = new Set()
    message.value = ''
    currentLevel.value = createLevel(
      currentLevelIndex.value,
      (Math.random() * 0xffffffff) >>> 0
    )
    resetRuntimeMaze()
    initDungeon()
    clearTimer()
    timeLeft.value = level.value.timeLimit
    if (deferTimer) {
      initInksPending()
    } else {
      beginLevelTimer()
    }
    phase.value = 'playing'
  }

  function startGame(deferTimer = false): void {
    currentLevelIndex.value = 0
    levelScores.value = []
    totalScore.value = 0
    startLevel(deferTimer)
  }

  function collectAt(p: GridPos): void {
    const key = posKey(p)
    if (collectedKeys.value.has(key)) return
    const idx = activeInks.value.findIndex((ink) => posKey(ink) === key)
    if (idx === -1) return

    const item = activeInks.value[idx]
    collectedKeys.value.add(key)
    timeLeft.value += item.bonusSeconds
    inksCollected.value += 1
    activeInks.value = activeInks.value.filter((_, i) => i !== idx)
    message.value = `+${item.bonusSeconds}s 사과!`
    setTimeout(() => {
      if (message.value.startsWith('+')) message.value = ''
    }, 1200)
  }

  function tryCompleteIfReady(): void {
    const lv = level.value
    const validation = validatePath(path.value, lv)
    if (validation.valid && validation.reachedGoal) {
      finishLevel(true)
    }
  }

  function triggerDungeonOnEnter(cell: GridPos): void {
    const lv = level.value
    const event = checkPlacementTrigger(
      lv.dungeonObjects,
      activeDungeonKeys.value,
      cell
    )
    if (!event) return

    if (event.kind !== 'enemy_encounter') {
      clearTimer()
    }
    dungeonEvent.value = event
  }

  function retreatFromEnemyCell(position: GridPos): void {
    const eventKey = posKey(position)
    if (path.value.length === 0) return
    const last = path.value[path.value.length - 1]
    if (posKey(last) !== eventKey) return
    path.value = path.value.slice(0, -1)
    isStretching.value = false
  }

  function advanceOntoClearedCell(position: GridPos): void {
    if (path.value.length === 0) return
    const lv = level.value
    const last = path.value[path.value.length - 1]
    const dc = Math.abs(position.col - last.col)
    const dr = Math.abs(position.row - last.row)
    if (!((dc === 1 && dr === 0) || (dc === 0 && dr === 1))) return
    if (!canMoveBetween(lv, last, position)) return
    if (path.value.some((p) => posKey(p) === posKey(position))) return

    path.value = [...path.value, { ...position }]
    isStretching.value = true
    collectAt(position)
  }

  function dismissDungeonEvent(options?: {
    /** false면 몬스터 등 오브젝트를 맵에 남김 (패배 시) */
    removeObject?: boolean
    /** 패배 시 몬스터 칸에서 한 칸 물러남 */
    retreatFromEnemy?: boolean
    timeBonus?: number
    timePenalty?: number
    message?: string
  }): void {
    const event = dungeonEvent.value
    if (!event) return

    clearRpsTimer()

    if (options?.retreatFromEnemy && event.kind === 'enemy_encounter') {
      const monsterKey = posKey(event.position)
      defeatedByMonsterKeys.value = new Set([
        ...defeatedByMonsterKeys.value,
        monsterKey,
      ])
      retreatFromEnemyCell(event.position)
      if (applyMazeBypass(event.position)) {
        options.message = `-${COMBAT_LOSE_PENALTY}s 패배... 새 길이 열렸어요!`
      }
    }

    const clearedEnemy =
      event.kind === 'enemy_encounter' && options?.removeObject !== false

    if (options?.removeObject !== false) {
      activeDungeonKeys.value.delete(posKey(event.position))
    }

    if (clearedEnemy) {
      advanceOntoClearedCell(event.position)
    }

    dungeonEvent.value = null
    rpsCombatActive.value = false
    rpsRound.value = null

    if (options?.timeBonus) {
      timeLeft.value += options.timeBonus
    }
    if (options?.timePenalty) {
      timeLeft.value = Math.max(0, timeLeft.value - options.timePenalty)
    }
    if (options?.message) {
      message.value = options.message
      setTimeout(() => {
        if (message.value === options.message) message.value = ''
      }, 1500)
    }

    if (phase.value === 'playing') {
      if (timeLeft.value <= 0) {
        onTimeUp()
        return
      }
      if (event.kind !== 'enemy_encounter') {
        startTimer()
      }
      tryCompleteIfReady()
    }
  }

  function beginRpsCombat(): void {
    if (dungeonEvent.value?.kind !== 'enemy_encounter') return
    rpsCombatActive.value = true
    rpsRound.value = null
  }

  function chooseRps(playerChoice: RpsChoice): void {
    if (!rpsCombatActive.value || dungeonEvent.value?.kind !== 'enemy_encounter') {
      return
    }
    if (rpsRound.value && rpsRound.value.outcome !== 'draw') return

    const enemyChoice = randomRpsChoice()
    const outcome = getRpsOutcome(playerChoice, enemyChoice)
    rpsRound.value = { player: playerChoice, enemy: enemyChoice, outcome }

    if (outcome === 'draw') {
      rpsResolveTimer = setTimeout(() => {
        rpsRound.value = null
        rpsResolveTimer = null
      }, 1200)
      return
    }

    rpsResolveTimer = setTimeout(() => {
      rpsResolveTimer = null
      if (outcome === 'win') {
        monstersDefeated.value += 1
        dismissDungeonEvent({
          message: `이겼다! +${MONSTER_PASS_POINTS}점 · 길을 계속 갑니다.`,
        })
      } else {
        dismissDungeonEvent({
          removeObject: false,
          retreatFromEnemy: true,
          timePenalty: COMBAT_LOSE_PENALTY,
          message: `-${COMBAT_LOSE_PENALTY}s 패배... 다른 길을 찾으세요.`,
        })
      }
    }, 1400)
  }

  function resolveDungeonChest(): void {
    dismissDungeonEvent({ timeBonus: 5, message: '+5s 보물!' })
  }

  function resolveDungeonShop(): void {
    dismissDungeonEvent({ message: '상점을 떠났습니다.' })
  }

  function tryAddCell(cell: GridPos): boolean {
    if (dungeonEvent.value) return false

    const lv = level.value
    if (!isPlayableCell(lv, cell)) {
      return false
    }

    const key = posKey(cell)

    if (path.value.length === 0) {
      if (cell.col !== lv.start.col || cell.row !== lv.start.row) return false
      path.value = [{ ...cell }]
      isStretching.value = true
      return true
    }

    const last = path.value[path.value.length - 1]
    if (posKey(last) === key) {
      isStretching.value = true
      return true
    }

    const onPathIdx = path.value.findIndex((p) => posKey(p) === key)
    if (onPathIdx >= 0 && onPathIdx < path.value.length - 1) {
      const removed = path.value.slice(onPathIdx + 1)
      path.value = path.value.slice(0, onPathIdx + 1)
      revertCellsFromPath(removed)
      isStretching.value = true
      return true
    }

    const dc = Math.abs(cell.col - last.col)
    const dr = Math.abs(cell.row - last.row)
    if (!((dc === 1 && dr === 0) || (dc === 0 && dr === 1))) return false
    if (!canMoveBetween(lv, last, cell)) return false

    if (isBlockingEnemyCell(cell)) {
      if (defeatedByMonsterKeys.value.has(key)) {
        showAlreadyFoughtMonster(cell)
        return false
      }
      triggerDungeonOnEnter(cell)
      if (dungeonEvent.value) return false
    }

    path.value = [...path.value, { ...cell }]
    isStretching.value = true
    collectAt(cell)
    triggerDungeonOnEnter(cell)
    if (!dungeonEvent.value) {
      tryCompleteIfReady()
    }

    return true
  }

  function finishLevel(success: boolean): void {
    clearTimer()
    clearDungeonState()
    isStretching.value = false

    const lv = level.value
    const validation = validatePath(path.value, lv)

    const breakdown = calcLevelScore({
      level: lv.id,
      path: path.value,
      timeRemaining: timeLeft.value,
      timeLimit: lv.timeLimit,
      reachedGoal: validation.reachedGoal,
      inksCollected: inksCollected.value,
      monstersDefeated: monstersDefeated.value,
      solutionLength: lv.solutionLength,
    })

    if (success && validation.reachedGoal) {
      const prevIdx = levelScores.value.findIndex((s) => s.level === breakdown.level)
      if (prevIdx >= 0) {
        totalScore.value -= levelScores.value[prevIdx].total
        levelScores.value = [
          ...levelScores.value.slice(0, prevIdx),
          breakdown,
          ...levelScores.value.slice(prevIdx + 1),
        ]
      } else {
        levelScores.value = [...levelScores.value, breakdown]
      }
      totalScore.value += breakdown.total

      if (currentLevelIndex.value >= TOTAL_LEVELS - 1) {
        phase.value = 'victory'
        message.value = '모든 레벨 클리어!'
      } else {
        phase.value = 'levelClear'
        message.value = `레벨 ${lv.id} 클리어! +${breakdown.total}`
      }
    } else {
      phase.value = 'gameOver'
      message.value = validation.reachedGoal
        ? '경로가 유효하지 않습니다. 다시 시도하세요'
        : '녹색 시작점에서 출발해 붉은 점까지 도달하세요'
    }
  }

  function onTimeUp(): void {
    clearTimer()
    finishLevel(false)
    message.value = '시간 초과!'
  }

  function nextLevel(): void {
    if (currentLevelIndex.value < TOTAL_LEVELS - 1) {
      currentLevelIndex.value += 1
      startLevel()
    }
  }

  function endStroke(): void {
    if (path.value.length === 0) return
    isStretching.value = false
    tryCompleteIfReady()
  }

  function goIntro(): void {
    clearTimer()
    clearDungeonState()
    phase.value = 'intro'
    resetPath()
  }

  onUnmounted(() => {
    clearTimer()
    clearRpsTimer()
  })

  return {
    phase,
    level,
    currentLevelIndex,
    path,
    pathSet,
    isDrawing: isStretching,
    isStretching,
    timeLeft,
    levelScores,
    totalScore,
    inksCollected,
    message,
    activeInks,
    activeDungeonObjects,
    dungeonEvent,
    mazeRevision,
    rpsCombatActive,
    rpsRound,
    progress,
    totalCells,
    startGame,
    startLevel,
    beginLevelTimer,
    nextLevel,
    tryAddCell,
    endStroke,
    resetPath,
    goIntro,
    onTimeUp,
    beginRpsCombat,
    chooseRps,
    resolveDungeonChest,
    resolveDungeonShop,
    dismissMonsterNotice,
  }
}
