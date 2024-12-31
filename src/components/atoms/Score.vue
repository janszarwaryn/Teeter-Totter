<template>
  <div class="score-container">
    <div class="score-label">{{ label }}</div>
    <div class="score-value" :class="{ 'is-high-score': isHighScore }">
      {{ formattedValue }}
      <div v-if="showBonus" class="bonus-popup">
        +{{ lastBonus }}
      </div>
    </div>
    <div v-if="breakdown" class="score-breakdown">
      <div class="breakdown-item">
        <span>Base:</span>
        <span>{{ basePoints }}</span>
      </div>
      <div class="breakdown-item">
        <span>Bonus:</span>
        <span>{{ bonusPoints }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  label: string;
  value: number;
  isHighScore?: boolean;
  basePoints?: number;
  bonusPoints?: number;
  breakdown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isHighScore: false,
  basePoints: 0,
  bonusPoints: 0,
  breakdown: false
});

const showBonus = ref(false);
const lastBonus = ref(0);
const previousValue = ref(props.value);

const formattedValue = computed(() => {
  return props.value.toLocaleString();
});

watch(() => props.value, (newValue, oldValue) => {
  if (newValue > oldValue) {
    lastBonus.value = newValue - oldValue;
    showBonus.value = true;
    setTimeout(() => {
      showBonus.value = false;
    }, 1000);
  }
  previousValue.value = newValue;
});
</script>

<style scoped>
.score-container {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  min-width: 120px;
}

.score-label {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.score-value {
  font-size: 1.5em;
  font-weight: bold;
  color: #4ECDC4;
  transition: color 0.3s ease;
}

.is-high-score {
  color: #F1C40F;
}

.bonus-popup {
  position: absolute;
  top: -20px;
  right: 0;
  color: #2ECC71;
  font-size: 0.9em;
  font-weight: bold;
  animation: popUp 0.5s ease-out;
}

.score-breakdown {
  margin-top: 4px;
  font-size: 0.7em;
  color: rgba(255, 255, 255, 0.6);
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

@keyframes popUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  50% {
    opacity: 1;
    transform: translateY(-5px);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style> 