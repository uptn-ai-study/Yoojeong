<script setup lang="ts">
import type { RankingEntry } from '../types/game'

defineProps<{
  top10: RankingEntry[]
  myBest: number
  playerId: string
  compact?: boolean
  inPlay?: boolean
}>()
</script>

<template>
  <section class="ranking-panel" :class="{ compact, 'in-play': inPlay }">
    <div class="ranking-head">
      <h3 class="title-4">TOP 10</h3>
      <span class="badge-count">실시간</span>
    </div>
    <ol class="ranking-list">
      <li
        v-for="(entry, idx) in top10"
        :key="`${entry.id}-${entry.timestamp}`"
        class="ranking-row"
        :class="{ mine: entry.id === playerId }"
      >
        <span class="rank">{{ idx + 1 }}</span>
        <span class="id">{{ entry.id }}</span>
        <span class="score">{{ entry.score.toLocaleString() }}</span>
      </li>
      <li v-if="top10.length === 0" class="ranking-empty caption">
        아직 기록이 없어요
      </li>
    </ol>
    <div class="my-best card">
      <span class="caption">나의 최고 기록</span>
      <span class="best-score title-3">{{ myBest.toLocaleString() }}</span>
      <span class="caption player-tag">{{ playerId }}</span>
    </div>
  </section>
</template>

<style scoped>
.ranking-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.ranking-panel.in-play {
  height: 100%;
  overflow: hidden;
}

.ranking-panel.compact .ranking-list,
.ranking-panel.in-play .ranking-list {
  flex: 1;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
}

.ranking-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ranking-list {
  list-style: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: var(--card-bg);
  border-radius: 12px;
  font-size: 13px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.ranking-row.mine {
  border: 2px solid var(--primary);
  background: var(--primary-light);
}

.rank {
  font-weight: 700;
  color: var(--primary);
}

.id {
  font-weight: 600;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score {
  font-weight: 700;
  color: var(--text-1);
}

.ranking-empty {
  text-align: center;
  padding: 12px;
}

.my-best {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
}

.best-score {
  color: var(--primary);
}

.player-tag {
  align-self: flex-end;
}
</style>
