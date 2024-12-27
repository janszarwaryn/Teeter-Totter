<template>
  <div class="game-board">
    <ControlPanel
      ref="controlPanelRef"
      :score="store.score"
      :high-score="store.highScore"
      :bending-angle="store.bendingAngle"
      :is-playing="store.isPlaying"
      :is-paused="store.isPaused"
      :is-auto-play="store.isAutoPlay"
      :throws-left="store.throwsLeft"
      @start="store.startGame"
      @pause="store.pauseGame"
      @reset="handleReset"
      @toggle-auto-play="store.toggleAutoPlay"
      @time-up="handleTimeUp"
    />

    <div 
      class="game-area"
      tabindex="0"
      @keydown="handleKeyPress"
      ref="gameArea"
    >
      <div class="game-objects">
        <!-- Current falling object -->
        <Shape
          v-if="store.currentObject"
          v-bind="store.currentObject"
          :class="{ falling: true }"
        />

        <!-- Left side objects -->
        <Shape
          v-for="object in store.leftObjects"
          :key="object.id"
          v-bind="object"
          :class="{ placed: true }"
        />

        <!-- Right side objects -->
        <Shape
          v-for="object in store.rightObjects"
          :key="object.id"
          v-bind="object"
          :class="{ placed: true }"
        />
      </div>

      <TeeterTotter
        :bending-angle="store.bendingAngle"
      />
    </div>

    <div v-if="store.isGameOver" class="game-over">
      <div class="game-over-content">
        <h2>Game Over!</h2>
        <p class="final-score">Time Played: {{ formatTime(store.score) }}</p>
        <p v-if="isWinner" class="new-record">New Record!</p>
        <p class="previous-record" v-if="!isWinner">
          Best Time: {{ formatTime(store.highScore) }}
        </p>
        <Button variant="primary" @click="handleReset">Play Again</Button>
      </div>
    </div>

    <div v-if="showConfetti" class="confetti-container">
      <div 
        v-for="piece in confettiPieces" 
        :key="piece.id"
        class="confetti-piece"
        :style="{
          left: piece.left,
          animationDelay: piece.animationDelay,
          backgroundColor: piece.backgroundColor
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game';
import Shape from '@/components/atoms/Shape.vue';
import Button from '@/components/atoms/Button.vue';
import TeeterTotter from '@/components/organisms/TeeterTotter.vue';
import ControlPanel from '@/components/molecules/ControlPanel.vue';
import { CONTROLS, GAME_CONFIG } from '@/constants/gameConstants';
import { detectCollision, updateFallSpeed, isObjectOverTeeterTotter } from '@/helpers/physics';

const store = useGameStore();
const gameArea = ref<HTMLElement | null>(null);
const controlPanelRef = ref<InstanceType<typeof ControlPanel> | null>(null);
const showConfetti = ref(false);
const isWinner = ref(false);

let animationFrameId: number;
let lastTime = ref(0);
let currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;

const BOARD_HEIGHT = GAME_CONFIG.BOARD.HEIGHT;
const BOARD_SURFACE_Y = GAME_CONFIG.BOARD.SURFACE_Y;
const BOARD_CENTER_X = GAME_CONFIG.BOARD.WIDTH / 2;
const COLLISION_THRESHOLD = GAME_CONFIG.PHYSICS.COLLISION_THRESHOLD;

const handleReset = () => {
  showConfetti.value = false;
  isWinner.value = false;
  cancelAnimationFrame(animationFrameId);
  store.reset();
  lastTime.value = null;
  currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
  controlPanelRef.value?.resetTimer?.();
  gameArea.value?.focus();
  
  // Natychmiast restartujemy pętlę gry
  animationFrameId = requestAnimationFrame(gameLoop);
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === CONTROLS.RESET) {
    handleReset();
    return;
  }

  if (!store.isPlaying || store.isPaused) return;

  event.preventDefault();

  switch (event.key) {
    case CONTROLS.MOVE_LEFT:
      store.moveObject('left');
      break;
    case CONTROLS.MOVE_RIGHT:
      store.moveObject('right');
      break;
    case CONTROLS.SPEED_UP:
      currentFallSpeed = GAME_CONFIG.PHYSICS.MAX_FALL_SPEED;
      break;
    case CONTROLS.PAUSE:
      store.pauseGame();
      break;
  }
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.key === CONTROLS.SPEED_UP) {
    currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
  }
};

const gameLoop = (timestamp: number) => {
  if (!lastTime.value) {
    lastTime.value = timestamp;
  }
  
  const deltaTime = timestamp - lastTime.value;
  lastTime.value = timestamp;

  // Upewniamy się, że gra jest w odpowiednim stanie
  if (!store.isPlaying || store.isPaused || store.isGameOver) {
    animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  // Sprawdzamy czy mamy aktywny obiekt
  if (!store.currentObject) {
    store.spawnNewObject();
  }

  if (store.currentObject) {
    const objectHeight = store.currentObject.size.height;
    const movement = (currentFallSpeed * deltaTime) / 1000;
    const newY = store.currentObject.position.y + movement;
    const objectBottom = newY + objectHeight / 2;
    
    // Sprawdź czy obiekt jest nad huśtawką
    const isOverTeeterTotter = isObjectOverTeeterTotter(
      store.currentObject.position,
      store.currentObject.size.width
    );

    // Sprawdź kolizje z innymi obiektami
    const leftCollision = detectCollision(store.currentObject, store.leftObjects);
    const rightCollision = detectCollision(store.currentObject, store.rightObjects);
    const collision = leftCollision.hasCollision ? leftCollision : rightCollision;

    if (collision.hasCollision && collision.position) {
      // Kolizja z innym obiektem
      store.currentObject.position.y = collision.position.y;
      store.placeObject();
      store.recalculateBendingAngle();
      if (Math.abs(store.bendingAngle) < 10) {
        controlPanelRef.value?.addTimeBonus(5);
      }
      currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
    } else if (
      isOverTeeterTotter && 
      objectBottom >= GAME_CONFIG.BOARD.SURFACE_Y - GAME_CONFIG.PHYSICS.COLLISION_THRESHOLD
    ) {
      // Kolizja z huśtawką
      store.currentObject.position.y = 
        GAME_CONFIG.BOARD.SURFACE_Y - 
        (objectHeight / 2) - 
        GAME_CONFIG.PHYSICS.COLLISION_THRESHOLD;
      store.placeObject();
      store.recalculateBendingAngle();
      currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
    } else if (!isOverTeeterTotter && objectBottom >= GAME_CONFIG.BOARD.HEIGHT) {
      // Obiekt minął huśtawkę
      if (store.throwsLeft > 0) {
        store.throwsLeft--;
      }
      if (store.throwsLeft <= 0) {
        handleGameOver();
        cancelAnimationFrame(animationFrameId);
        return;
      }
      store.spawnNewObject();
      currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
    } else {
      // Kontynuuj spadanie
      store.currentObject.position.y = newY;
      if (!store.isAutoPlay) {
        currentFallSpeed = updateFallSpeed(currentFallSpeed, deltaTime);
      }
    }
  }
  
  animationFrameId = requestAnimationFrame(gameLoop);
};

const handleTimeUp = () => {
  if (!store.isGameOver) {
    store.endGame();
  }
};

const handleGameOver = () => {
  if (store.isGameOver) return;
  const finalTime = controlPanelRef.value?.getTime() || 0;
  store.updateScore(finalTime);
  if (finalTime > store.highScore) {
    store.highScore = finalTime;
    showConfetti.value = true;
    isWinner.value = true;
  }
  store.endGame();
};

const generateConfetti = () => {
  return Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 2 + 's',
    backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)]
  }));
};

const confettiPieces = ref(generateConfetti());

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

onMounted(() => {
  gameArea.value?.focus();
  window.addEventListener('keydown', handleKeyPress);
  window.addEventListener('keyup', handleKeyUp);
  animationFrameId = requestAnimationFrame(gameLoop);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  window.removeEventListener('keyup', handleKeyUp);
  cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.game-board {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  padding: 20px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.game-area {
  width: 1000px;
  height: 600px;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  outline: none;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.game-area:focus {
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1),
              0 0 0 2px rgba(255, 255, 255, 0.5);
}

.game-objects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

:deep(.falling) {
  transition: transform 0.1s linear;
}

:deep(.placed) {
  transition: transform 0.3s ease-out;
}

.game-over {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
  backdrop-filter: blur(4px);
}

.game-over-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transform: translateY(0);
  animation: slideIn 0.5s ease-out;
}

.game-over-content h2 {
  color: #2c3e50;
  margin: 0 0 20px;
  font-size: 2em;
}

.game-over-content p {
  margin: 10px 0;
  color: #34495e;
  font-size: 1.2em;
}

.game-over-content .new-record {
  color: #e74c3c;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1001;
}

.confetti-piece {
  position: fixed;
  width: 10px;
  height: 30px;
  background: transparent;
  top: -20px;
  opacity: 0;
  animation: confetti-fall 3s linear forwards;
}

.confetti-piece:nth-child(3n) {
  background: #ff6b6b;
}

.confetti-piece:nth-child(3n+1) {
  background: #4ecdc4;
}

.confetti-piece:nth-child(3n+2) {
  background: #ffe66d;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.final-score {
  font-size: 2em;
  color: #2c3e50;
  margin: 20px 0;
  font-weight: bold;
}

.new-record {
  font-size: 1.5em;
  color: #e74c3c;
  font-weight: bold;
  animation: pulse 1s infinite;
  margin: 15px 0;
}

.previous-record {
  color: #7f8c8d;
  font-size: 1.2em;
  margin: 10px 0;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.game-over-actions button {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.game-over-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style> 