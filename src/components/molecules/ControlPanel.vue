<template>
  <div class="control-panel">
    <div class="scores">
      <Score label="Score" :value="score" />
      <Score label="High Score" :value="highScore" />
      <div class="throws-info">
        <span class="throws-label">Throws:</span>
        <span class="throws-count" :class="{ 'low-throws': throwsLeft <= 1 }">
          {{ throwsLeft }}
        </span>
      </div>
    </div>

    <div class="phase-info">
      <span class="phase-label">{{ currentPhase.name }}</span>
      <span class="phase-weights">Weights: {{ currentPhase.weights.min }}-{{ currentPhase.weights.max }}kg</span>
    </div>

    <Timer
      ref="timerRef"
      :initial-time="60"
      :is-running="isPlaying"
      @time-up="onTimeUp"
    />

    <div class="game-controls">
      <Button 
        v-if="!isPlaying" 
        variant="primary" 
        @click="$emit('start')"
      >
        Start Game
      </Button>
      <Button 
        v-else 
        variant="secondary" 
        @click="$emit('pause')"
      >
        {{ isPaused ? 'Resume' : 'Pause' }}
      </Button>
      <Button 
        variant="danger" 
        @click="$emit('reset')"
      >
        Reset
      </Button>
      <Button 
        :variant="isAutoPlay ? 'danger' : 'secondary'"
        @click="$emit('toggle-auto-play')"
      >
        {{ isAutoPlay ? 'Manual Mode' : 'Auto Play' }}
      </Button>
    </div>

    <div class="game-info">
      <div class="info-item">
        <span class="label">Angle:</span>
        <span class="value" :class="{ warning: bendingAngle > 20 }">
          {{ bendingAngle.toFixed(1) }}°
        </span>
      </div>
      <div class="info-item">
        <span class="label">Balance:</span>
        <span class="value" :class="getBalanceClass">
          {{ getBalanceText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from '@/components/atoms/Button.vue';
import Score from '@/components/atoms/Score.vue';
import Timer from '@/components/molecules/Timer.vue';
import { getCurrentPhase } from '@/helpers/gameLogic';

interface Props {
  score: number;
  highScore: number;
  bendingAngle: number;
  isPlaying: boolean;
  isPaused: boolean;
  isAutoPlay: boolean;
  throwsLeft: number;
}

const props = defineProps<Props>();
const timerRef = ref<InstanceType<typeof Timer> | null>(null);

const currentPhase = computed(() => getCurrentPhase(props.score));

const emit = defineEmits<{
  (e: 'start'): void;
  (e: 'pause'): void;
  (e: 'reset'): void;
  (e: 'toggle-auto-play'): void;
  (e: 'time-up'): void;
}>();

const getBalanceClass = computed(() => {
  if (props.bendingAngle < 10) return 'balanced';
  if (props.bendingAngle < 20) return 'warning';
  return 'danger';
});

const getBalanceText = computed(() => {
  if (props.bendingAngle < 10) return 'Stable';
  if (props.bendingAngle < 20) return 'Warning';
  return 'Unstable';
});

const onTimeUp = () => {
  emit('time-up');
};

defineExpose({
  addTimeBonus: (seconds: number) => {
    timerRef.value?.addBonus(seconds);
  }
});
</script>

<style scoped>
.control-panel {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 15px 40px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.scores {
  display: flex;
  gap: 30px;
  align-items: center;
}

.phase-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 200px;
}

.phase-label {
  font-size: 1.1em;
  font-weight: bold;
  color: #4ECDC4;
}

.phase-weights {
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.7);
}

.game-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.game-info {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.7);
}

.value {
  font-size: 1.1em;
  font-weight: bold;
  color: white;
  min-width: 60px;
  text-align: right;
}

.value.balanced {
  color: #2ecc71;
}

.value.warning {
  color: #f1c40f;
}

.value.danger {
  color: #e74c3c;
}

.throws-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-left: 20px;
}

.throws-label {
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.7);
}

.throws-count {
  font-size: 1.2em;
  font-weight: bold;
  color: #4ECDC4;
  min-width: 24px;
  text-align: center;
}

.throws-count.low-throws {
  color: #e74c3c;
  animation: pulse 1s infinite;
}
</style> 