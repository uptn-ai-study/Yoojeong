<script setup lang="ts">
defineProps<{
  playerId: string
}>()

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="id-welcome-title">
    <div class="modal-card">
      <h2 id="id-welcome-title" class="title-2 modal-title">
        당신의 랜덤 아이디는 <span class="id-value">{{ playerId }}</span>입니다.
      </h2>
      <button type="button" class="btn btn-primary" @click="emit('confirm')">
        확인
      </button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 340px;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 28px 24px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.modal-title {
  line-height: 1.45;
}

.id-value {
  color: var(--primary);
  font-weight: 700;
  letter-spacing: -0.3px;
}
</style>
