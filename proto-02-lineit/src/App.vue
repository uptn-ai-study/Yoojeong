<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { TOTAL_LEVELS } from './data/levels'
import IntroScreen from './components/IntroScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ResultSheet from './components/ResultSheet.vue'
import VictoryScreen from './components/VictoryScreen.vue'
import IdWelcomeModal from './components/IdWelcomeModal.vue'
import DungeonEventModal from './components/DungeonEventModal.vue'
import RpsCombatModal from './components/RpsCombatModal.vue'
import { useGame } from './composables/useGame'
import { PLAYER_ID_STORAGE_KEY, usePlayerId } from './composables/usePlayerId'
import { useDailyPlays } from './composables/useDailyPlays'
import { useRanking } from './composables/useRanking'
import { resetFirstVisitState } from './utils/resetAppState'

const game = useGame()
const {
  playerId,
  loadOrCreate,
  hasSeenWelcome,
  markWelcomeSeen,
} = usePlayerId()
const daily = useDailyPlays()
const ranking = useRanking()

const showIdWelcome = ref(false)

const showResultSheet = computed(
  () =>
    game.phase.value === 'levelClear' || game.phase.value === 'gameOver'
)

const showDungeonModal = computed(
  () => game.dungeonEvent.value != null && !game.rpsCombatActive.value
)

const showRpsModal = computed(() => game.rpsCombatActive.value)

const playFrozen = computed(
  () =>
    showResultSheet.value ||
    game.dungeonEvent.value != null ||
    showIdWelcome.value
)

const resultTitle = computed(() => {
  if (game.phase.value === 'victory') return '축하합니다!'
  if (game.phase.value === 'levelClear') return '레벨 클리어'
  return '다시 도전하세요.'
})

const resultPrimaryLabel = computed(() => {
  if (game.phase.value === 'levelClear') return '다음 레벨'
  return '플레이'
})

const resultScoreLabel = computed(() =>
  game.phase.value === 'levelClear' ? '획득 점수' : '최종 점수'
)

const resultDisplayScore = computed(() => {
  if (game.phase.value === 'levelClear') {
    const last = game.levelScores.value[game.levelScores.value.length - 1]
    return last?.total ?? 0
  }
  return game.totalScore.value
})

const myRank = computed(() => {
  if (!playerId.value) return null
  const sorted = ranking.top10.value
  const idx = sorted.findIndex((e) => e.id === playerId.value)
  return idx >= 0 ? idx + 1 : null
})

onMounted(() => {
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search)
    if (params.has('reset')) {
      resetFirstVisitState()
      showIdWelcome.value = false
      params.delete('reset')
      const qs = params.toString()
      history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname)
    }
  }

  const hadExistingId = !!localStorage.getItem(PLAYER_ID_STORAGE_KEY)
  loadOrCreate()
  // 이전 버전에서 이미 아이디가 있던 사용자는 팝업 생략
  if (hadExistingId) markWelcomeSeen()
  daily.refresh()
  ranking.refresh()
})

watch(
  () => game.phase.value,
  (phase) => {
    if (
      (phase === 'gameOver' || phase === 'victory') &&
      playerId.value &&
      game.totalScore.value > 0
    ) {
      ranking.submitScore(playerId.value, game.totalScore.value)
    }
  }
)

function handleStart(): void {
  if (!daily.consumePlay()) return
  const deferTimer = !hasSeenWelcome()
  game.startGame(deferTimer)
  if (deferTimer) showIdWelcome.value = true
}

function handleIdWelcomeConfirm(): void {
  markWelcomeSeen()
  showIdWelcome.value = false
  game.beginLevelTimer()
}

function handleExitPlay(): void {
  if (!confirm('플레이를 종료하고 나갈까요?')) return
  game.goIntro()
  daily.refresh()
}

function handleGoHome(): void {
  game.goIntro()
  daily.refresh()
}

function handleVictoryPlay(): void {
  if (daily.canPlay.value && daily.consumePlay()) {
    game.startGame()
  } else {
    game.goIntro()
    daily.refresh()
  }
}

function handleResultPrimary(): void {
  if (game.phase.value === 'levelClear') {
    game.nextLevel()
  } else {
    game.startLevel()
  }
}

function handleDungeonFight(): void {
  game.beginRpsCombat()
}

function handleDungeonResolve(): void {
  const event = game.dungeonEvent.value
  if (!event) return
  switch (event.kind) {
    case 'enemy_already_fought':
      game.dismissMonsterNotice()
      break
    case 'chest':
      game.resolveDungeonChest()
      break
    case 'shop':
      game.resolveDungeonShop()
      break
    default:
      break
  }
}
</script>

<template>
  <div class="app-shell">
    <div class="screen-pad">
      <IntroScreen
        v-if="game.phase.value === 'intro'"
        :plays-remaining="daily.playsRemaining.value"
        :max-plays="daily.maxPlays"
        :can-play="daily.canPlay.value"
        @start="handleStart"
      />

      <VictoryScreen
        v-else-if="game.phase.value === 'victory'"
        :total-score="game.totalScore.value"
        :level-scores="game.levelScores.value"
        :top10="ranking.top10.value"
        :player-id="playerId"
        :my-rank="myRank"
        @home="handleGoHome"
        @play="handleVictoryPlay"
      />

      <div
        v-else
        class="play-stack"
        :class="{ 'play-stack--frozen': playFrozen }"
      >
        <GameScreen
          :level="game.level.value"
          :current-level-index="game.currentLevelIndex.value"
          :total-levels="TOTAL_LEVELS"
          :path="game.path.value"
          :active-inks="game.activeInks.value"
          :active-dungeon-objects="game.activeDungeonObjects.value"
          :is-drawing="game.isDrawing.value"
          :time-left="game.timeLeft.value"
          :progress="game.progress.value"
          :message="showResultSheet ? '' : game.message.value"
          :top10="ranking.top10.value"
          :my-best="ranking.myBest.value"
          :player-id="playerId"
          :maze-revision="game.mazeRevision.value"
          @cell-enter="game.tryAddCell"
          @stroke-end="game.endStroke"
          @reset="game.startLevel"
          @exit="handleExitPlay"
        />
      </div>

    </div>

    <IdWelcomeModal
      v-if="showIdWelcome"
      :player-id="playerId"
      @confirm="handleIdWelcomeConfirm"
    />

    <DungeonEventModal
      v-if="showDungeonModal && game.dungeonEvent.value"
      :event="game.dungeonEvent.value"
      @fight="handleDungeonFight"
      @resolve="handleDungeonResolve"
    />

    <RpsCombatModal
      v-if="showRpsModal"
      :round="game.rpsRound.value"
      @pick="game.chooseRps"
    />

    <ResultSheet
      v-if="showResultSheet"
      :title="resultTitle"
      :display-score="resultDisplayScore"
      :score-label="resultScoreLabel"
      :level-scores="game.levelScores.value"
      :top10="ranking.top10.value"
      :player-id="playerId"
      :my-rank="myRank"
      :show-ranking="false"
      :show-breakdown="false"
      :primary-label="resultPrimaryLabel"
      @primary="handleResultPrimary"
      @secondary="handleGoHome"
    />
  </div>
</template>

<style scoped>
.play-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.play-stack--frozen {
  pointer-events: none;
}
</style>
