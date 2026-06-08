<script setup lang="ts">
import { computed } from 'vue'
import type { DungeonEvent } from '../types/game'

const props = defineProps<{
  event: DungeonEvent
}>()

const emit = defineEmits<{
  resolve: []
  fight: []
}>()

const isMonsterEvent = computed(
  () =>
    props.event.kind === 'enemy_encounter' ||
    props.event.kind === 'enemy_already_fought'
)

const title = computed(() => {
  switch (props.event.kind) {
    case 'enemy_encounter':
      return '몬스터를 만났다!'
    case 'enemy_already_fought':
      return '몬스터'
    case 'chest':
      return '보물상자'
    case 'shop':
      return '상점'
  }
})

const description = computed(() => {
  switch (props.event.kind) {
    case 'enemy_encounter':
      return '가위바위보에서 이기면 길을 계속 갈 수 있어요.'
    case 'enemy_already_fought':
      return '이미 가위 바위 보 전투를 마쳤습니다. 다른 길로 가세요'
    case 'chest':
      return '상자를 열면 시간 보너스를 받습니다.'
    case 'shop':
      return '잠시 쉬어가며 아이템을 살펴보세요.'
  }
})

const actionLabel = computed(() => {
  switch (props.event.kind) {
    case 'enemy_encounter':
      return '전투하기'
    case 'enemy_already_fought':
      return '확인'
    case 'chest':
      return '열기'
    case 'shop':
      return '떠나기'
  }
})
</script>

<template>
  <div class="dungeon-overlay" role="dialog" aria-modal="true" :aria-label="title">
    <div class="dungeon-sheet">
      <div class="dungeon-icon" :class="`dungeon-icon--${event.kind}`" aria-hidden="true">
        <svg v-if="isMonsterEvent" viewBox="0 0 48 48" class="icon-svg">
          <ellipse cx="24" cy="28" rx="16" ry="14" fill="var(--dungeon-enemy)" />
          <circle cx="17" cy="24" r="3" fill="#fff" />
          <circle cx="31" cy="24" r="3" fill="#fff" />
          <circle cx="17" cy="24" r="1.5" fill="#1e1b4b" />
          <circle cx="31" cy="24" r="1.5" fill="#1e1b4b" />
          <path d="M18 32 Q24 36 30 32" stroke="#4c1d95" stroke-width="2" fill="none" />
          <path d="M10 18 L14 22 M38 18 L34 22" stroke="var(--dungeon-enemy)" stroke-width="2.5" stroke-linecap="round" />
        </svg>
        <svg v-else-if="event.kind === 'chest'" viewBox="0 0 48 48" class="icon-svg">
          <rect x="8" y="20" width="32" height="18" rx="2" fill="var(--dungeon-chest)" />
          <rect x="6" y="14" width="36" height="8" rx="2" fill="#ca8a04" />
          <rect x="21" y="22" width="6" height="10" rx="1" fill="#854d0e" />
          <circle cx="24" cy="27" r="1.5" fill="#fef08a" />
        </svg>
        <svg v-else viewBox="0 0 48 48" class="icon-svg">
          <rect x="6" y="22" width="36" height="18" rx="2" fill="#e0f2fe" stroke="var(--dungeon-shop)" stroke-width="1.5" />
          <path d="M6 22 L24 12 L42 22 Z" fill="var(--dungeon-shop)" />
          <rect x="20" y="28" width="8" height="12" fill="#fff" />
          <circle cx="34" cy="32" r="4" fill="#fbbf24" stroke="#b45309" stroke-width="1" />
        </svg>
      </div>

      <h2 class="dungeon-title title-3">{{ title }}</h2>
      <p class="dungeon-desc">{{ description }}</p>

      <button
        type="button"
        class="btn dungeon-action"
        @click="event.kind === 'enemy_encounter' ? emit('fight') : emit('resolve')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.dungeon-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.dungeon-sheet {
  width: min(100%, 320px);
  padding: 24px 20px 20px;
  border-radius: 20px;
  background: var(--app-bg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.dungeon-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.icon-svg {
  width: 64px;
  height: 64px;
}

.dungeon-title {
  margin: 0 0 8px;
  color: var(--text-1);
}

.dungeon-desc {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-2);
}

.dungeon-action {
  width: 100%;
  min-height: 48px;
  border-radius: 9999px;
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
}

.dungeon-action:active {
  opacity: 0.9;
}
</style>
