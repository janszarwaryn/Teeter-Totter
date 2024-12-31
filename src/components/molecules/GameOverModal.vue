<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h2>Game Over!</h2>
      
      <div class="score-section">
        <div class="score">
          <span class="label">Your Score:</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="high-score">
          <span class="label">High Score:</span>
          <span class="value">{{ highScore }}</span>
        </div>
      </div>

      <div class="reason">
        {{ getReasonText }}
      </div>

      <div class="actions">
        <button class="primary" @click="$emit('restart')">Play Again</button>
        <button class="secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  show: boolean;
  score: number;
  highScore: number;
  reason: 'balance' | 'throws' | 'time' | null;
  isNewHighScore: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'restart'): void;
  (e: 'close'): void;
}>();

const getReasonText = computed(() => {
  switch (props.reason) {
    case 'balance':
      return 'The teeter-totter lost balance!';
    case 'throws':
      return 'You ran out of throws!';
    case 'time':
      return 'Time\'s up!';
    default:
      return 'Game ended';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  padding: 30px;
  border-radius: 12px;
  min-width: 300px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

h2 {
  color: #fff;
  margin: 0 0 20px;
  font-size: 2em;
}

.score-section {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score, .high-score {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.label {
  color: rgba(255, 255, 255, 0.7);
}

.value {
  color: #4ecdc4;
  font-weight: bold;
  font-size: 1.2em;
}

.reason {
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1em;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 30px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.2s;
}

button.primary {
  background: #4ecdc4;
  color: #000;
}

button.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style> 