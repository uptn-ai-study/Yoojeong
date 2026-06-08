<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { DungeonPlacement, GridPos, InkSpot, LevelConfig } from '../types/game'
import { useMobileLayout } from '../composables/useMobileLayout'
import { isAdjacent, isPlayableCell, posKey } from '../utils/grid'
import { cellToGrid, gridToCell, canMoveBetween } from '../utils/maze'

const { isMobile } = useMobileLayout()

const props = defineProps<{
  level: LevelConfig
  path: GridPos[]
  activeInks: InkSpot[]
  activeDungeonObjects: DungeonPlacement[]
  isDrawing: boolean
}>()

const emit = defineEmits<{
  cellEnter: [cell: GridPos]
  strokeEnd: []
}>()

const boardRef = ref<SVGSVGElement | null>(null)
const boardWrapRef = ref<HTMLDivElement | null>(null)
const activePointerId = ref<number | null>(null)
const boardSize = ref({ width: 320, height: 320 })
const lockedUnitSize = ref<number | null>(null)

const PAD = 12
const MAZE_WALL = '#111111'
const WALL_STROKE = 1.15
const PATH_STROKE = '#2563eb'
const touchRadius = computed(() => (isMobile.value ? 34 : 28))

function snapCoord(value: number): number {
  return Math.round(value * 2) / 2
}

const gridLayout = computed(() => {
  const { cols, rows } = props.level
  const availableW = Math.max(120, boardSize.value.width - PAD * 2)
  const availableH = Math.max(120, boardSize.value.height - PAD * 2)
  const unitCap = isMobile.value ? 22 : 18
  const rawUnit = Math.min(availableW / cols, availableH / rows, unitCap)
  const unitSize =
    lockedUnitSize.value ?? Math.round(rawUnit * 100) / 100
  const width = PAD * 2 + cols * unitSize
  const height = PAD * 2 + rows * unitSize
  return { unitSize, width, height, cols, rows }
})

function gridPoint(gx: number, gy: number): { x: number; y: number } {
  const { unitSize } = gridLayout.value
  return {
    x: PAD + gx * unitSize,
    y: PAD + gy * unitSize,
  }
}

function cellCenter(col: number, row: number): { x: number; y: number } {
  const { gx, gy } = cellToGrid(col, row)
  const { unitSize } = gridLayout.value
  const p = gridPoint(gx, gy)
  return {
    x: snapCoord(p.x + unitSize / 2),
    y: snapCoord(p.y + unitSize / 2),
  }
}

const pathStrokeD = computed(() => {
  if (props.path.length < 2) return ''
  const pts = props.path.map((p) => cellCenter(p.col, p.row))
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`
  }
  return d
})

const wallRects = computed(() => {
  const { cols, rows, unitSize } = gridLayout.value
  const grid = props.level.mazeGrid
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  const seen = new Set<string>()

  const addLine = (x1: number, y1: number, x2: number, y2: number): void => {
    const key =
      x1 <= x2 && y1 <= y2
        ? `${x1},${y1},${x2},${y2}`
        : `${x2},${y2},${x1},${y1}`
    if (seen.has(key)) return
    seen.add(key)
    lines.push({ x1, y1, x2, y2 })
  }

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      if (grid[gy][gx] !== 0) continue

      const p = gridPoint(gx, gy)
      const left = p.x
      const top = p.y
      const right = p.x + unitSize
      const bottom = p.y + unitSize

      if (gy > 0 && grid[gy - 1][gx] === 1) addLine(left, top, right, top)
      if (gx > 0 && grid[gy][gx - 1] === 1) addLine(left, top, left, bottom)
      if (gy < rows - 1 && grid[gy + 1][gx] === 1) addLine(left, bottom, right, bottom)
      if (gx < cols - 1 && grid[gy][gx + 1] === 1) addLine(right, top, right, bottom)
    }
  }

  return lines
})

function isOnPath(col: number, row: number): boolean {
  return props.path.some((p) => p.col === col && p.row === row)
}

function pathIndex(col: number, row: number): number {
  return props.path.findIndex((p) => p.col === col && p.row === row)
}

function corridorNeighbors(gx: number, gy: number): GridPos[] {
  const result: GridPos[] = []
  if (gx % 2 === 0 && gy % 2 === 1) {
    result.push({ col: (gx - 1) / 2, row: (gy - 1) / 2 })
    result.push({ col: (gx + 1) / 2, row: (gy - 1) / 2 })
  } else if (gx % 2 === 1 && gy % 2 === 0) {
    result.push({ col: (gx - 1) / 2, row: (gy - 1) / 2 })
    result.push({ col: (gx - 1) / 2, row: (gy + 1) / 2 })
  }
  return result.filter((c) => isPlayableCell(props.level, c))
}

function pickCorridorCell(candidates: GridPos[]): GridPos | null {
  if (candidates.length === 0) return null
  if (props.path.length === 0) {
    const start = props.level.start
    return candidates.find((c) => c.col === start.col && c.row === start.row) ?? candidates[0]
  }

  const last = props.path[props.path.length - 1]
  for (const c of candidates) {
    if (canMoveBetween(props.level, last, c)) return c
  }
  return candidates[0]
}

function cellFromGrid(gx: number, gy: number): GridPos | null {
  if (props.level.mazeGrid[gy]?.[gx] !== 0) return null

  const room = gridToCell(gx, gy)
  if (room && isPlayableCell(props.level, room)) return room

  return pickCorridorCell(corridorNeighbors(gx, gy))
}

function candidateCellsFromPath(): GridPos[] {
  if (props.path.length === 0) {
    return [props.level.start]
  }

  const last = props.path[props.path.length - 1]
  const candidates: GridPos[] = []
  const seen = new Set<string>()

  const add = (cell: GridPos): void => {
    const key = posKey(cell)
    if (seen.has(key)) return
    seen.add(key)
    candidates.push(cell)
  }

  for (const cell of props.level.playable) {
    if (!isAdjacent(last, cell)) continue
    if (!canMoveBetween(props.level, last, cell)) continue
    add(cell)
  }

  for (let i = props.path.length - 2; i >= 0; i--) {
    const cell = props.path[i]
    if (!canMoveBetween(props.level, last, cell)) continue
    add(cell)
  }

  return candidates
}

function nearestCellFromLocal(localX: number, localY: number): GridPos | null {
  const { unitSize, cols, rows } = gridLayout.value
  const svg = boardRef.value
  if (!svg) return null
  const ctm = svg.getScreenCTM()
  if (!ctm) return null

  const scale = ctm.a
  const touchRadiusLocal = touchRadius.value / Math.max(scale, 0.5)
  let best: GridPos | null = null
  let bestDist = touchRadiusLocal * touchRadiusLocal

  const candidates = candidateCellsFromPath()
  const last = props.path[props.path.length - 1]

  for (const cell of candidates) {
    const center = cellCenter(cell.col, cell.row)
    const dx = localX - center.x
    const dy = localY - center.y
    const dist = dx * dx + dy * dy
    if (dist > bestDist) continue

    bestDist = dist
    best = cell
  }

  if (best && last) {
    const lastKey = posKey(last)
    const bestKey = posKey(best)
    if (bestKey !== lastKey) {
      const lastCenter = cellCenter(last.col, last.row)
      const lastDx = localX - lastCenter.x
      const lastDy = localY - lastCenter.y
      const lastDist = lastDx * lastDx + lastDy * lastDy
      if (lastDist <= bestDist * 1.4) {
        return last
      }
    }
  }

  if (best) return best

  const gx = Math.floor((localX - PAD) / unitSize)
  const gy = Math.floor((localY - PAD) / unitSize)
  if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) {
    return cellFromGrid(gx, gy)
  }

  return null
}

function clientToCell(clientX: number, clientY: number): GridPos | null {
  const svg = boardRef.value
  if (!svg) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const local = pt.matrixTransform(ctm.inverse())
  const { unitSize, cols, rows } = gridLayout.value

  const gx = Math.floor((local.x - PAD) / unitSize)
  const gy = Math.floor((local.y - PAD) / unitSize)
  if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) {
    const direct = cellFromGrid(gx, gy)
    if (direct) return direct
  }

  return nearestCellFromLocal(local.x, local.y)
}

function handlePointer(clientX: number, clientY: number): void {
  const cell = clientToCell(clientX, clientY)
  if (cell) emit('cellEnter', cell)
}

function onPointerDown(e: PointerEvent): void {
  e.preventDefault()
  activePointerId.value = e.pointerId
  lockedUnitSize.value = gridLayout.value.unitSize
  ;(e.currentTarget as SVGElement)?.setPointerCapture?.(e.pointerId)
  handlePointer(e.clientX, e.clientY)
}

function onPointerMove(e: PointerEvent): void {
  if (activePointerId.value !== e.pointerId) return
  if (activePointerId.value === null && props.path.length === 0) return
  e.preventDefault()
  handlePointer(e.clientX, e.clientY)
}

function endPointer(e: PointerEvent): void {
  if (activePointerId.value !== e.pointerId) return
  activePointerId.value = null
  lockedUnitSize.value = null
  ;(e.currentTarget as SVGElement)?.releasePointerCapture?.(e.pointerId)
  emit('strokeEnd')
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!boardWrapRef.value) return
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    if (activePointerId.value !== null) return

    const width = Math.round(entry.contentRect.width)
    const height = Math.round(entry.contentRect.height)
    if (
      Math.abs(width - boardSize.value.width) < 2 &&
      Math.abs(height - boardSize.value.height) < 2
    ) {
      return
    }
    boardSize.value = { width, height }
  })
  resizeObserver.observe(boardWrapRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="boardWrapRef" class="board-wrap">
    <svg
      ref="boardRef"
      class="game-board"
      :viewBox="`0 0 ${gridLayout.width} ${gridLayout.height}`"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endPointer"
      @pointercancel="endPointer"
    >
      <rect
        :x="PAD"
        :y="PAD"
        :width="gridLayout.cols * gridLayout.unitSize"
        :height="gridLayout.rows * gridLayout.unitSize"
        fill="#ffffff"
      />

      <line
        v-for="(wall, i) in wallRects"
        :key="`wall-${i}`"
        :x1="wall.x1"
        :y1="wall.y1"
        :x2="wall.x2"
        :y2="wall.y2"
        :stroke="MAZE_WALL"
        :stroke-width="WALL_STROKE"
        stroke-linecap="square"
      />

      <g v-if="pathStrokeD" class="body-layer" pointer-events="none">
        <path
          :d="pathStrokeD"
          fill="none"
          stroke="#ffffff"
          stroke-width="6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="pathStrokeD"
          fill="none"
          :stroke="PATH_STROKE"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <g
        v-for="obj in activeDungeonObjects"
        :key="`dungeon-${obj.type}-${obj.col}-${obj.row}`"
        class="dungeon-object"
        pointer-events="none"
      >
        <g
          v-if="obj.type === 'E'"
          :transform="`translate(${cellCenter(obj.col, obj.row).x - 8}, ${cellCenter(obj.col, obj.row).y - 8})`"
        >
          <ellipse cx="8" cy="9" rx="7" ry="6" fill="var(--dungeon-enemy)" />
          <circle cx="5.5" cy="7.5" r="1.2" fill="#fff" />
          <circle cx="10.5" cy="7.5" r="1.2" fill="#fff" />
          <circle cx="5.5" cy="7.5" r="0.6" fill="#1e1b4b" />
          <circle cx="10.5" cy="7.5" r="0.6" fill="#1e1b4b" />
        </g>
        <g
          v-else-if="obj.type === 'C'"
          :transform="`translate(${cellCenter(obj.col, obj.row).x - 8}, ${cellCenter(obj.col, obj.row).y - 7})`"
        >
          <rect x="1" y="5" width="14" height="9" rx="1" fill="var(--dungeon-chest)" />
          <rect x="0" y="2" width="16" height="4" rx="1" fill="#ca8a04" />
          <rect x="6.5" y="7" width="3" height="5" rx="0.5" fill="#854d0e" />
        </g>
        <g
          v-else
          :transform="`translate(${cellCenter(obj.col, obj.row).x - 8}, ${cellCenter(obj.col, obj.row).y - 8})`"
        >
          <rect x="1" y="6" width="14" height="8" rx="1" fill="#e0f2fe" stroke="var(--dungeon-shop)" stroke-width="0.8" />
          <path d="M1 6 L8 1 L15 6 Z" fill="var(--dungeon-shop)" />
          <circle cx="12" cy="9" r="2" fill="#fbbf24" stroke="#b45309" stroke-width="0.6" />
        </g>
      </g>

      <g v-for="apple in activeInks" :key="`apple-${apple.col}-${apple.row}`">
        <circle
          :cx="cellCenter(apple.col, apple.row).x"
          :cy="cellCenter(apple.col, apple.row).y"
          r="5.5"
          fill="var(--apple-body)"
          stroke="var(--apple-dark)"
          stroke-width="0.8"
        />
        <line
          :x1="cellCenter(apple.col, apple.row).x"
          :y1="cellCenter(apple.col, apple.row).y - 5.5"
          :x2="cellCenter(apple.col, apple.row).x"
          :y2="cellCenter(apple.col, apple.row).y - 8"
          stroke="var(--apple-stem)"
          stroke-width="1.2"
          stroke-linecap="round"
        />
        <ellipse
          :cx="cellCenter(apple.col, apple.row).x - 2"
          :cy="cellCenter(apple.col, apple.row).y - 7"
          rx="2.2"
          ry="1.2"
          fill="var(--apple-leaf)"
        />
        <text
          :x="cellCenter(apple.col, apple.row).x"
          :y="cellCenter(apple.col, apple.row).y + 11"
          text-anchor="middle"
          class="apple-label"
        >
          +{{ apple.bonusSeconds }}s
        </text>
      </g>

      <circle
        v-if="!isOnPath(level.start.col, level.start.row) || pathIndex(level.start.col, level.start.row) === 0"
        :cx="cellCenter(level.start.col, level.start.row).x"
        :cy="cellCenter(level.start.col, level.start.row).y"
        r="6"
        fill="#22c55e"
        stroke="#fff"
        stroke-width="2"
      />

      <circle
        v-if="!isOnPath(level.goal.col, level.goal.row) || pathIndex(level.goal.col, level.goal.row) !== path.length - 1"
        :cx="cellCenter(level.goal.col, level.goal.row).x"
        :cy="cellCenter(level.goal.col, level.goal.row).y"
        r="6"
        fill="#ef4444"
        stroke="#fff"
        stroke-width="2"
      />

      <circle
        v-if="path.length > 0"
        :cx="cellCenter(path[path.length - 1].col, path[path.length - 1].row).x"
        :cy="cellCenter(path[path.length - 1].col, path[path.length - 1].row).y"
        r="5"
        fill="#2563eb"
        stroke="#fff"
        stroke-width="2"
      />
    </svg>
  </div>
</template>

<style scoped>
.board-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  touch-action: none;
}

.game-board {
  width: 100%;
  height: 100%;
  max-height: 100%;
  touch-action: none;
  cursor: crosshair;
  -webkit-user-select: none;
  user-select: none;
}

.body-layer {
  pointer-events: none;
  shape-rendering: geometricPrecision;
}

.apple-label {
  font-size: 8px;
  font-weight: 700;
  fill: var(--apple-dark);
  font-family: inherit;
}

.dungeon-object {
  pointer-events: none;
}
</style>
