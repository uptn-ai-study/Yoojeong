<script setup lang="ts">
import type { LevelScoreBreakdown, RankingEntry } from '../types/game'

defineProps<{
  totalScore: number
  levelScores: LevelScoreBreakdown[]
  top10: RankingEntry[]
  playerId: string
  myRank: number | null
}>()

const emit = defineEmits<{
  home: []
  play: []
}>()
</script>

<template>
  <div class="victory">
    <div class="victory-scroll">
      <h1 class="title-1 victory-title">축하합니다!</h1>
      <p class="body-2 victory-desc">모든 레벨을 클리어했어요</p>

      <div class="score-hero">
        <span class="caption">최종 점수</span>
        <span class="display final-score">{{ totalScore.toLocaleString() }}</span>
        <span v-if="myRank" class="badge-primary">내 순위 {{ myRank }}위</span>
      </div>

      <div v-if="levelScores.length" class="breakdown card">
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

      <div class="ranking-block">
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
    </div>

    <div class="victory-footer">
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" @click="emit('home')">
          홈으로 가기
        </button>
        <button type="button" class="btn btn-primary victory-cta" @click="emit('play')">
          플레이
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.victory {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.victory-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 8px 0 16px;
}

.victory-title {
  text-align: center;
  background: linear-gradient(135deg, var(--primary) 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.victory-desc {
  text-align: center;
  color: var(--text-2);
  margin-bottom: 24px;
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
  margin-bottom: 8px;
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

.victory-footer {
  flex-shrink: 0;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.btn-row {
  display: flex;
  gap: 10px;
}

.victory-cta {
  flex: 1.2;
}
</style>
