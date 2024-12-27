<template>
  <div class="score-display" :class="{ 'score-updated': isAnimating }">
    <div class="score-label">{{ label }}</div>
    <div class="score-value">{{ formattedValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

interface Props {
  label: string;
  value: number;
}

const props = defineProps<Props>();
const isAnimating = ref(false);

const formattedValue = computed(() => props.value.toLocaleString());

watch(() => props.value, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    isAnimating.value = true;
    setTimeout(() => {
      isAnimating.value = false;
    }, 300);
  }
});
</script>

<style scoped>
.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  color: white;
}

.score-label {
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

.score-value {
  font-size: 1.5em;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.score-updated .score-value {
  animation: pulse 0.3s ease-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style> 