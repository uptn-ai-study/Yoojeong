<script setup lang="ts">
import type { LevelScoreBreakdown, RankingEntry } from '../types/game'

withDefaults(
  defineProps<{
    title: string
    displayScore: number
    scoreLabel: string
    levelScores: LevelScoreBreakdown[]
    top10: RankingEntry[]
    playerId: string
    myRank: number | null
    showRanking?: boolean
    showBreakdown?: boolean
    primaryLabel: string
  }>(),
  {
    showRanking: false,
    showBreakdown: false,
  }
)

const emit = defineEmits<{
  primary: []
  secondary: []
}>()
</script>

<template>
  <div class="sheet-overlay">
    <div class="bottom-sheet">
      <div class="sheet-handle" />
      <h2 class="sheet-title title-2">{{ title }}</h2>

      <div class="score-hero">
        <span class="caption">{{ scoreLabel }}</span>
        <span class="display final-score">{{ displayScore.toLocaleString() }}</span>
        <span v-if="showRanking && myRank" class="badge-primary">내 순위 {{ myRank }}위</span>
      </div>

      <div v-if="showBreakdown && levelScores.length" class="breakdown card">
        <h4 class="title-4">레벨별 점수</h4>
        <div
          v-for="s in levelScores"
          :key="s.level"
          class="breakdown-row body-2"
        >
          <span>Lv.{{ s.level }}</span>
          <span class="breakdown-detail">
            완주 {{ s.completion }} · 시간 {{ s.timeBonus }} · 경로 {{ s.smoothness }} · 사과 {{ s.inkBonus }}<template v-if="s.monsterBonus"> · 몬스터 {{ s.monsterBonus }}</template>
          </span>
          <span class="row-total">+{{ s.total }}</span>
        </div>
      </div>

      <div v-if="showRanking" class="ranking-block">
        <h4 class="title-4">TOP 10</h4>
        <ol class="mini-rank">
          <li
            v-for="(e, i) in top10"
            :key="e.timestamp + e.id"
            :class="{ mine: e.id === playerId }"
          >
            <span>{{ i + 1 }}</span>
            <span>{{ e.id }}</span>
            <span>{{ e.score.toLocaleString() }}</span>
          </li>
          <li v-if="top10.length === 0" class="mini-rank-empty caption">
            아직 기록이 없어요
          </li>
        </ol>
      </div>

      <div class="btn-row">
        <button type="button" class="btn btn-secondary" @click="emit('secondary')">
          홈으로
        </button>
        <button type="button" class="btn btn-primary sheet-cta" @click="emit('primary')">
          {{ primaryLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.2);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.bottom-sheet {
  background: var(--card-bg);
  border-radius: 24px 24px 0 0;
  padding: 24px 20px calc(28px + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 480px;
  max-height: 85dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 0 auto 20px;
}

.sheet-title {
  margin-bottom: 16px;
  text-align: center;
}

.score-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 16px;
}

.final-score {
  color: var(--primary);
}

.breakdown {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 6px;
  align-items: start;
  padding: 6px 0;
  border-bottom: 1px solid var(--muted-bg);
}

.breakdown-row:last-child {
  border-bottom: none;
}

.breakdown-detail {
  font-size: 11px;
  color: var(--text-3);
}

.row-total {
  font-weight: 700;
  color: var(--primary);
}

.ranking-block {
  margin-bottom: 20px;
}

.mini-rank {
  list-style: none;
  margin-top: 8px;
}

.mini-rank li {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 8px;
  padding: 8px 10px;
  font-size: 13px;
  border-radius: 10px;
}

.mini-rank li.mine {
  background: var(--primary-light);
  border: 1.5px solid var(--primary);
  font-weight: 600;
}

.mini-rank-empty {
  text-align: center;
  padding: 12px 0;
}

.btn-row {
  display: flex;
  gap: 10px;
}

.sheet-cta {
  flex: 1.2;
}
</style>
