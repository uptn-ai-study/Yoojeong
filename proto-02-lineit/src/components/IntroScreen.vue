<script setup lang="ts">
import { ref } from 'vue'
import GameGuideModal from './GameGuideModal.vue'

defineProps<{
  playsRemaining: number
  maxPlays: number
  canPlay: boolean
}>()

const emit = defineEmits<{
  start: []
}>()

const showGuide = ref(false)
</script>

<template>
  <div class="intro">
    <div class="intro-center">
      <div class="intro-hero">
        <div class="intro-brand">
          <div class="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 120 120" width="144" height="144">
              <rect x="10" y="10" width="100" height="100" rx="16" fill="#ffffff" />
              <path
                d="M 28 28 L 60 28 L 60 60 L 92 60 L 92 92"
                fill="none"
                stroke="#ffffff"
                stroke-width="10"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M 28 28 L 60 28 L 60 60 L 92 60 L 92 92"
                fill="none"
                stroke="#2563eb"
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="28" cy="28" r="9" fill="#22c55e" stroke="#ffffff" stroke-width="3" />
              <circle cx="92" cy="92" r="9" fill="#ef4444" stroke="#ffffff" stroke-width="3" />
            </svg>
          </div>
          <h1 class="title-1 intro-title">Line It</h1>
        </div>
        <button type="button" class="btn guide-btn" @click="showGuide = true">
          가이드
        </button>
      </div>

      <div class="intro-footer">
        <p class="caption plays-info">
          오늘 남은 플레이
          <strong>{{ playsRemaining }} / {{ maxPlays }}</strong>
        </p>
        <button
          v-if="canPlay"
          type="button"
          class="btn btn-primary"
          @click="emit('start')"
        >
          시작하기
        </button>
        <button v-else type="button" class="btn btn-disabled" disabled>
          오늘 플레이 횟수를 모두 사용했어요
        </button>
      </div>
    </div>
    <GameGuideModal v-if="showGuide" @close="showGuide = false" />
  </div>
</template>

<style scoped>
.intro {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 20px 0;
}

.intro-center {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.intro-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.intro-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.logo-mark {
  filter: drop-shadow(0 4px 12px rgba(30, 58, 95, 0.15));
}

.intro-title {
  margin: 0;
  font-size: 33.6px;
  background: linear-gradient(135deg, var(--primary) 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.intro-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plays-info {
  text-align: center;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-2);
}

.plays-info strong {
  font-size: 16px;
  color: var(--primary);
  font-weight: 700;
}

.guide-btn {
  background: var(--primary-light);
  border-radius: 9999px;
  padding: 0 20px;
  height: 42px;
  font-size: 15px;
  color: var(--primary);
}
</style>
