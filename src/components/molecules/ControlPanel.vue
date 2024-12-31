<template>
  <div class="control-panel">
    <div class="scores">
      <Score 
        label="Score" 
        :value="score"
        :base-points="basePoints"
        :bonus-points="bonusPoints"
        :breakdown="true"
      />
      <Score 
        label="High Score" 
        :value="highScore" 
        :is-high-score="true"
      />
      <div class="throws-info">
        <span class="throws-label">Throws:</span>
        <span class="throws-count" :class="{ 'low-throws': throwsLeft <= 1 }">
          {{ throwsLeft }}
        </span>
      </div>
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

    <div class="phase-box">
      <div class="phase-header">
        <span class="phase-name">{{ currentPhase.name }}</span>
        <span class="weights">Weights: {{ currentPhase.weights.min }}-{{ currentPhase.weights.max }}kg</span>
      </div>
      <div class="mini-progress">
        <div 
          class="mini-progress-fill"
          :style="{ width: `${phaseProgress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
  currentPhase: any;
  phaseProgress: number;
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

watch(() => props.isPlaying, (newValue) => {
  if (newValue) {
    timerRef.value?.start();
  } else {
    timerRef.value?.pause();
  }
});

watch(() => props.isPaused, (newValue) => {
  if (newValue) {
    timerRef.value?.pause();
  } else if (props.isPlaying) {
    timerRef.value?.start();
  }
});

const onTimeUp = () => {
  emit('time-up');
};

defineExpose({
  addTimeBonus: (seconds: number) => {
    timerRef.value?.addBonus(seconds);
  }
});

const basePoints = computed(() => {
  if (!props.isPlaying) return 0;
  const timePoints = timerRef.value?.currentTime || 0;
  return Math.floor(timePoints * 5);
});

const bonusPoints = computed(() => {
  return props.score - basePoints.value;
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

.phase-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  width: 200px;
}

.phase-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-name {
  font-weight: bold;
  color: #4ecdc4;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.weights {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.6);
}

.mini-progress {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.mini-progress-fill {
  height: 100%;
  background: #4ecdc4;
  transition: width 0.3s ease-out;
  box-shadow: 0 0 8px rgba(78, 205, 196, 0.5);
}

.bonus-indicator {
  color: #27ae60;
  font-weight: bold;
  animation: fadeUp 0.5s ease-out;
}

.score-breakdown {
  font-size: 0.8em;
  color: #7f8c8d;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 