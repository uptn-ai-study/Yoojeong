<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="guide-overlay" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    <div class="guide-sheet">
      <div class="sheet-handle" />
      <h2 id="guide-title" class="title-2">게임 가이드</h2>

      <ul class="guide-rules">
        <li class="body-1"><strong>녹색 점</strong>에서 출발해 인접 칸으로만 이동하세요</li>
        <li class="body-1">되돌리면 선이 줄어듭니다</li>
        <li class="body-1"><strong>검은 라인</strong>이 미로 벽이며, 통로 칸으로만 이동할 수 있어요</li>
        <li class="body-1"><strong>붉은 점</strong>에 도달하면 클리어입니다</li>
        <li class="body-1"><strong>사과</strong>를 먹으면 시간 보너스 (일정 시간 후 사라짐)</li>
        <li class="body-1"><strong>몬스터</strong>를 만나면 가위바위보로 겨룹니다. 이기면 <strong>+10점</strong>과 함께 통과하고, 지면 시간이 줄어들며 몬스터가 그대로 길을 막습니다. 이때 미로 벽이 일부 열려 다른 경로가 생길 수 있어요</li>
        <li class="body-1"><strong>보물상자</strong>를 열면 시간 보너스를 받을 수 있어요</li>
        <li class="body-1">레벨이 올라갈수록 미로가 더 복잡해집니다</li>
      </ul>

      <button type="button" class="btn btn-primary" @click="emit('close')">
        확인
      </button>
    </div>
  </div>
</template>

<style scoped>
.guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: rgba(17, 24, 39, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.guide-sheet {
  width: 100%;
  max-width: 480px;
  background: var(--card-bg);
  border-radius: 24px 24px 0 0;
  padding: 24px 20px calc(28px + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
  max-height: 85dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

#guide-title {
  text-align: center;
  margin-bottom: 16px;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 0 auto 20px;
}

.guide-rules {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.guide-rules li {
  padding-left: 20px;
  position: relative;
  line-height: 1.45;
}

.guide-rules li::before {
  content: "•";
  position: absolute;
  left: 4px;
  color: var(--primary);
  font-weight: 700;
}
</style>
