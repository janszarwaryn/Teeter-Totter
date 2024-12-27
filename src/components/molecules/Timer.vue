<template>
  <div class="timer">
    <div class="time-label">Time:</div>
    {{ formatTime(timeElapsed) }}
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps<{
  isRunning: boolean;
  initialTime?: number;
}>();

const timeElapsed = ref(0);
let timerId: number | null = null;

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const startTimer = () => {
  if (timerId) return;
  
  timerId = window.setInterval(() => {
    timeElapsed.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

const resetTimer = () => {
  stopTimer();
  timeElapsed.value = 0;
};

const start = () => {
  startTimer();
};

const pause = () => {
  stopTimer();
};

watch(() => props.isRunning, (newValue) => {
  if (newValue) {
    startTimer();
  } else {
    stopTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});

defineExpose({
  resetTimer,
  start,
  pause,
  getTime: () => timeElapsed.value,
  addBonus: (seconds: number) => {
    timeElapsed.value += seconds;
  }
});
</script>

<style scoped>
.timer {
  font-size: 1.5em;
  font-weight: bold;
  color: white;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 80px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-label {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.7);
}
</style> 