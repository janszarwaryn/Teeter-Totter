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
        <p>Your Time: {{ formatTime(store.score) }}</p>
        <p v-if="isWinner" class="new-record">New Record!</p>
        <Button variant="primary" @click="handleReset">Play Again</Button>
      </div>
    </div>

    <div v-if="showConfetti" class="confetti">
      <div v-for="n in 50" :key="n" 
           class="confetti-piece"
           :style="{
             left: Math.random() * 100 + '%',
             transform: `scale(${Math.random()})`,
             animation: `confetti-fall ${1 + Math.random() * 2}s linear forwards`
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
import { detectCollision, updateFallSpeed } from '@/helpers/physics';

const store = useGameStore();
const gameArea = ref<HTMLElement | null>(null);
const controlPanelRef = ref<InstanceType<typeof ControlPanel> | null>(null);
const showConfetti = ref(false);
const isWinner = ref(false);

let animationFrameId: number;
let lastTimestamp: number = 0;
let currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;

const BOARD_HEIGHT = GAME_CONFIG.BOARD.HEIGHT;
const BOARD_SURFACE_Y = GAME_CONFIG.BOARD.SURFACE_Y;
const BOARD_CENTER_X = GAME_CONFIG.BOARD.WIDTH / 2;
const COLLISION_THRESHOLD = GAME_CONFIG.PHYSICS.COLLISION_THRESHOLD;

const handleReset = () => {
  showConfetti.value = false;
  isWinner.value = false;
  currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
  lastTimestamp = 0;
  store.reset();
  controlPanelRef.value?.resetTimer?.();
  gameArea.value?.focus();
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
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (store.isPlaying && !store.isPaused && store.currentObject) {
    const movement = (currentFallSpeed * deltaTime) / 1000;
    const newY = store.currentObject.position.y + movement;

    // Obliczamy środek obiektu
    const objectCenterX = store.currentObject.position.x;
    const objectWidth = store.currentObject.size.width;
    const objectHeight = store.currentObject.size.height;
    const objectBottom = newY + objectHeight;
    
    // Sprawdzamy, czy obiekt jest nad huśtawką
    const isOverTeeterTotter = Math.abs(objectCenterX - BOARD_CENTER_X) <= 400;
    
    // Sprawdzamy kolizje z innymi obiektami
    const sideObjects = objectCenterX < BOARD_CENTER_X ? store.leftObjects : store.rightObjects;
    
    let hasCollision = false;
    let collisionY = BOARD_SURFACE_Y;

    // Sprawdzamy kolizje z innymi obiektami
    for (const obj of sideObjects) {
      const horizontalOverlap = Math.abs(objectCenterX - obj.position.x) < (objectWidth + obj.size.width) / 2;
      const verticalOverlap = Math.abs((newY + objectHeight / 2) - (obj.position.y + obj.size.height / 2)) < (objectHeight + obj.size.height) / 2;
      
      if (horizontalOverlap && verticalOverlap) {
        hasCollision = true;
        collisionY = obj.position.y - objectHeight - COLLISION_THRESHOLD;
        break;
      }
    }

    if (hasCollision) {
      // Kolizja z innym obiektem
      store.currentObject.position.y = collisionY;
      store.placeObject();
      if (store.bendingAngle < 10) {
        controlPanelRef.value?.addTimeBonus(5);
      }
      currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
    } else if (isOverTeeterTotter && objectBottom >= BOARD_SURFACE_Y - COLLISION_THRESHOLD) {
      // Kolizja z huśtawką
      store.currentObject.position.y = BOARD_SURFACE_Y - objectHeight - COLLISION_THRESHOLD;
      store.placeObject();
      currentFallSpeed = GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;
    } else if (!isOverTeeterTotter && objectBottom >= BOARD_HEIGHT) {
      // Obiekt minął huśtawkę - liczymy jako wyrzut
      if (store.throwsLeft > 0) {
        store.throwsLeft--;
        store.spawnNewObject();
      } else {
        handleGameOver();
      }
    } else {
      // Kontynuuj spadanie
      store.currentObject.position.y = newY;
    }

    if (!store.isAutoPlay) {
      currentFallSpeed = updateFallSpeed(currentFallSpeed, deltaTime);
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
  const finalTime = controlPanelRef.value?.getTime() || 0;
  if (finalTime > store.highScore) {
    store.highScore = finalTime;
    showConfetti.value = true;
    isWinner.value = true;
  }
  store.endGame();
};

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
  margin-top: 80px;
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

.confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 30px;
  background: #ffd300;
  top: 0;
  opacity: 0;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes confetti-slow {
  0% { transform: translate(0, 0) rotateX(0) rotateY(0); }
  100% { transform: translate(100px, 100vh) rotateX(360deg) rotateY(360deg); }
}

@keyframes confetti-medium {
  0% { transform: translate(0, 0) rotateX(0) rotateY(0); }
  100% { transform: translate(-100px, 100vh) rotateX(-360deg) rotateY(-360deg); }
}

@keyframes confetti-fast {
  0% { transform: translate(0, 0) rotateX(0) rotateY(0); }
  100% { transform: translate(200px, 100vh) rotateX(360deg) rotateY(360deg); }
}

.confetti-piece:nth-child(odd) {
  background: #7450fd;
}

.confetti-piece:nth-child(even) {
  z-index: 1;
}

.confetti-piece:nth-child(4n) {
  width: 5px;
  height: 12px;
  animation-duration: 2000ms;
  background: #ff0000;
}

.confetti-piece:nth-child(4n+1) {
  background: #ffd300;
  animation-duration: 2500ms;
  animation-timing-function: cubic-bezier(.84,0,.84,.32);
}

.confetti-piece:nth-child(4n+2) {
  background: #00ff00;
  animation-duration: 3000ms;
  animation-timing-function: cubic-bezier(.84,0,.84,.32);
}

.confetti-piece:nth-child(4n+3) {
  background: #0000ff;
  animation-duration: 3500ms;
  animation-timing-function: cubic-bezier(.84,0,.84,.32);
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
</style> 