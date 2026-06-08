<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DungeonPlacement, GridPos, InkSpot, LevelConfig, RankingEntry } from '../types/game'
import GameBoard from './GameBoard.vue'
import RankingPanel from './RankingPanel.vue'
import { useMobileLayout } from '../composables/useMobileLayout'

const props = defineProps<{
  level: LevelConfig
  currentLevelIndex: number
  totalLevels: number
  path: GridPos[]
  activeInks: InkSpot[]
  activeDungeonObjects: DungeonPlacement[]
  isDrawing: boolean
  timeLeft: number
  progress: number
  message: string
  top10: RankingEntry[]
  myBest: number
  playerId: string
  mazeRevision: number
}>()

const emit = defineEmits<{
  cellEnter: [cell: GridPos]
  strokeEnd: []
  reset: []
  exit: []
}>()

const { isMobile, isCompact } = useMobileLayout()
const showRanking = ref(false)

const timerPercent = computed(() =>
  Math.max(0, (props.timeLeft / props.level.timeLimit) * 100)
)

const timerClass = computed(() => {
  if (props.timeLeft <= 10) return 'critical'
  if (props.timeLeft <= 20) return 'warn'
  return ''
})

function toggleRanking(): void {
  showRanking.value = !showRanking.value
}
</script>

<template>
  <div class="game-screen" :class="{ compact: isCompact, mobile: isMobile }">
    <header class="game-header">
      <button type="button" class="btn exit-btn" @click="emit('exit')">
        <span class="exit-icon" aria-hidden="true">←</span>
        <span class="exit-label">나가기</span>
      </button>

      <div class="header-center">
        <div class="level-chip">
          <span class="title-4">Lv.{{ level.id }}</span>
          <span class="caption">{{ currentLevelIndex + 1 }}/{{ totalLevels }}</span>
        </div>
        <div class="timer-block" :class="timerClass">
          <div class="timer-bar">
            <div class="timer-fill" :style="{ width: `${timerPercent}%` }" />
          </div>
          <span class="timer-text title-4">{{ timeLeft }}s</span>
        </div>
      </div>

      <button
        type="button"
        class="btn rank-toggle"
        :class="{ active: showRanking }"
        :aria-expanded="showRanking"
        @click="toggleRanking"
      >
        랭킹
      </button>
    </header>

    <p v-if="message" class="game-toast">{{ message }}</p>

    <section class="play-area">
      <p v-if="playerId" class="play-brand">
        <span class="play-brand-name">Line It</span>, {{ playerId }}
      </p>

      <div class="progress-row">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progress}%` }" />
        </div>
        <span class="caption">{{ progress }}%</span>
      </div>

      <GameBoard
        :key="`maze-${mazeRevision}`"
        class="play-board"
        :level="level"
        :path="path"
        :active-inks="activeInks"
        :active-dungeon-objects="activeDungeonObjects"
        :is-drawing="isDrawing"
        @cell-enter="emit('cellEnter', $event)"
        @stroke-end="emit('strokeEnd')"
      />
    </section>

    <section
      v-show="showRanking"
      class="ranking-area"
      :class="{ 'ranking-area--overlay': isMobile }"
    >
      <RankingPanel
        :top10="top10"
        :my-best="myBest"
        :player-id="playerId"
        in-play
      />
    </section>
  </div>
</template>

<style scoped>
.game-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  gap: 0;
}

.game-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0 8px;
  background: var(--app-bg);
  border-bottom: 1px solid var(--border);
}

.play-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0 10px;
  overflow: hidden;
}

.play-brand {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.3;
  color: var(--text-muted);
  text-align: center;
}

.play-brand-name {
  font-weight: 700;
  color: var(--text);
}

.ranking-area {
  flex-shrink: 0;
  max-height: 34vh;
  overflow: hidden;
  padding: 10px 0 12px;
  border-top: 1px solid var(--border);
  background: var(--app-bg);
}

.ranking-area--overlay {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  max-height: min(52vh, 420px);
  padding: 12px max(16px, env(safe-area-inset-left)) calc(12px + env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-right));
  border-top: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
  background: var(--app-bg);
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.level-chip {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-width: 40px;
}

.timer-block {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.exit-btn,
.rank-toggle {
  flex-shrink: 0;
  min-height: 44px;
  min-width: 44px;
  padding: 0 12px;
  gap: 4px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.rank-toggle {
  background: var(--primary-light);
  border: 1.5px solid var(--primary);
  color: var(--primary);
}

.rank-toggle.active,
.rank-toggle:active {
  background: var(--primary);
  color: #fff;
}

.exit-btn {
  background: var(--muted-bg);
  border: 1.5px solid var(--border);
  color: var(--text-1);
}

.exit-btn:active {
  background: #fee2e2;
  border-color: var(--error);
  color: var(--error);
}

.exit-icon {
  font-size: 15px;
  line-height: 1;
}

.timer-block.warn .timer-fill {
  background: #f59e0b;
}

.timer-block.critical .timer-fill {
  background: var(--error);
}

.timer-bar {
  flex: 1;
  height: 8px;
  background: var(--muted-bg);
  border-radius: 9999px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 9999px;
  transition: width 1s linear, background 0.3s;
}

.timer-text {
  min-width: 36px;
  text-align: right;
}

.game-toast {
  flex-shrink: 0;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  padding: 4px 0 0;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}

.progress-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--muted-bg);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cell-3), var(--primary));
  border-radius: 9999px;
  transition: width 0.2s;
}

.play-board {
  flex: 1;
  min-height: 0;
}

.game-screen.mobile .play-area {
  padding-bottom: 6px;
}

.game-screen.compact .game-header {
  padding-top: 6px;
  padding-bottom: 6px;
}

.game-screen.compact .ranking-area:not(.ranking-area--overlay) {
  max-height: 28vh;
}

@media (max-width: 520px) {
  .exit-label {
    display: none;
  }

  .exit-btn {
    min-width: 44px;
    padding: 0;
    justify-content: center;
  }
}
</style>
