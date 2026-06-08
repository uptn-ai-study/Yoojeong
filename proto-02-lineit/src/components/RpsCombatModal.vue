<script setup lang="ts">
import { computed } from 'vue'
import type { RpsChoice, RpsOutcome } from '../utils/rps'
import { RPS_EMOJI, RPS_LABELS } from '../utils/rps'

const props = defineProps<{
  round: {
    player: RpsChoice
    enemy: RpsChoice
    outcome: RpsOutcome
  } | null
}>()

const emit = defineEmits<{
  pick: [choice: RpsChoice]
}>()

const choices: RpsChoice[] = ['scissors', 'rock', 'paper']

const resultText = computed(() => {
  if (!props.round) return ''
  switch (props.round.outcome) {
    case 'win':
      return '이겼다! 길을 계속 갑니다.'
    case 'lose':
      return '졌다... 몬스터가 그대로 서 있습니다. 다른 길로 나가세요.'
    case 'draw':
      return '비겼다! 다시 선택하세요.'
  }
})

const pickingDisabled = computed(
  () => props.round != null && props.round.outcome !== 'draw'
)
</script>

<template>
  <div class="rps-overlay" role="dialog" aria-modal="true" aria-label="가위바위보">
    <div class="rps-sheet">
      <h2 class="rps-title title-3">가위바위보!</h2>
      <p class="rps-desc">이기면 통과, 지면 시간이 깎입니다.</p>

      <div v-if="round" class="rps-result">
        <div class="rps-picks">
          <div class="rps-pick">
            <span class="rps-emoji">{{ RPS_EMOJI[round.player] }}</span>
            <span class="rps-label">나 · {{ RPS_LABELS[round.player] }}</span>
          </div>
          <span class="rps-vs">VS</span>
          <div class="rps-pick">
            <span class="rps-emoji">{{ RPS_EMOJI[round.enemy] }}</span>
            <span class="rps-label">몬스터 · {{ RPS_LABELS[round.enemy] }}</span>
          </div>
        </div>
        <p class="rps-outcome" :class="`rps-outcome--${round.outcome}`">
          {{ resultText }}
        </p>
      </div>

      <div class="rps-actions">
        <button
          v-for="choice in choices"
          :key="choice"
          type="button"
          class="btn rps-btn"
          :disabled="pickingDisabled"
          @click="emit('pick', choice)"
        >
          <span class="rps-btn-emoji">{{ RPS_EMOJI[choice] }}</span>
          <span>{{ RPS_LABELS[choice] }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rps-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
}

.rps-sheet {
  width: min(100%, 340px);
  padding: 24px 20px 20px;
  border-radius: 20px;
  background: var(--app-bg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.rps-title {
  margin: 0 0 6px;
  color: var(--text-1);
}

.rps-desc {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-2);
}

.rps-result {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 14px;
  background: var(--muted-bg);
}

.rps-picks {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.rps-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 72px;
}

.rps-emoji {
  font-size: 32px;
  line-height: 1;
}

.rps-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

.rps-vs {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-3);
}

.rps-outcome {
  margin: 12px 0 0;
  font-size: 14px;
  font-weight: 700;
}

.rps-outcome--win {
  color: #16a34a;
}

.rps-outcome--lose {
  color: var(--error);
}

.rps-outcome--draw {
  color: var(--primary);
}

.rps-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.rps-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 72px;
  padding: 10px 6px;
  border-radius: 16px;
  background: var(--primary-light);
  border: 1.5px solid var(--primary);
  color: var(--primary);
  font-weight: 700;
  font-size: 14px;
}

.rps-btn:disabled {
  opacity: 0.45;
  pointer-events: none;
}

.rps-btn:not(:disabled):active {
  background: var(--primary);
  color: #fff;
}

.rps-btn-emoji {
  font-size: 26px;
  line-height: 1;
}
</style>
