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
      :current-phase="getCurrentPhase(store.score)"
      :phase-progress="getPhaseProgress(store.score)"
      @start="handleStart"
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
        <h2>{{ getGameOverMessage }}</h2>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Time Played:</span>
            <span class="stat-value">{{ formatTime(store.gameTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Final Score:</span>
            <span class="stat-value">{{ store.score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Score Breakdown:</span>
            <div class="score-breakdown">
              <div>Time Bonus: {{ timeBonus }}</div>
              <div>Stability: {{ stabilityBonus }}</div>
              <div>Objects: {{ objectsBonus }}</div>
              <div>Phase: {{ phaseBonus }}</div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-label">Objects Placed:</span>
            <span class="stat-value">{{ store.leftObjects.length + store.rightObjects.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Phase Reached:</span>
            <span class="stat-value">{{ getCurrentPhase(store.score).name }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Balance Status:</span>
            <span class="stat-value">{{ Math.abs(store.bendingAngle).toFixed(1) }}°</span>
          </div>
        </div>
        <p v-if="isWinner" class="new-record">New Record! 🏆</p>
        <p class="previous-record" v-if="!isWinner">
          Best Score: {{ store.highScore }}
        </p>
        <div class="game-over-actions">
          <Button variant="primary" @click="handleReset">Play Again</Button>
          <Button variant="secondary" @click="shareScore">Share Score</Button>
        </div>
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

    <div v-if="isWinner" class="fireworks-container">
      <div 
        v-for="firework in fireworksRef" 
        :key="firework.id"
        class="firework"
        :style="firework.style"
      ></div>
    </div>

    <!-- Game Over Modal -->
    <div v-if="store.isGameOver" class="game-over-modal">
      <div class="game-over-content">
        <h2>Game Over!</h2>
        <p class="game-over-reason">{{ gameOverReason }}</p>
        
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Time Played:</span>
            <span class="stat-value">{{ formatTime(store.gameTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Final Score:</span>
            <span class="stat-value">{{ store.score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Score Breakdown:</span>
            <div class="score-breakdown">
              <div>Time Bonus: {{ timeBonus }}</div>
              <div>Stability: {{ stabilityBonus }}</div>
              <div>Objects: {{ objectsBonus }}</div>
              <div>Phase: {{ phaseBonus }}</div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-label">Objects Placed:</span>
            <span class="stat-value">{{ store.leftObjects.length + store.rightObjects.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Phase Reached:</span>
            <span class="stat-value">{{ getCurrentPhase(store.score).name }}</span>
          </div>
        </div>

        <p v-if="isWinner" class="new-record">New Record! 🏆</p>
        <p class="previous-record" v-if="!isWinner">
          Best Score: {{ store.highScore }}
        </p>

        <div class="game-over-actions">
          <button class="retry-button" @click="handleReset">Play Again</button>
          <button class="menu-button" @click="handleMainMenu">Main Menu</button>
          <button class="share-button" @click="shareScore">Share Score</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameStore } from '@/stores/game';
import Shape from '@/components/atoms/Shape.vue';
import Button from '@/components/atoms/Button.vue';
import TeeterTotter from '@/components/organisms/TeeterTotter.vue';
import ControlPanel from '@/components/molecules/ControlPanel.vue';
import { CONTROLS, GAME_CONFIG, GAME_PHASES } from '@/constants/gameConstants';
import { detectCollision, updateFallSpeed, isObjectOverTeeterTotter, isBalanceCritical, checkTeeterTotterCollision, isGameOver } from '@/helpers/physics';
import { getCurrentPhase } from '@/helpers/gameLogic';

const store = useGameStore();
const gameArea = ref<HTMLElement | null>(null);
const controlPanelRef = ref<InstanceType<typeof ControlPanel> | null>(null);
const showConfetti = ref(false);
const isWinner = ref(false);
const lastTimestamp = ref<number>(0);
const pressedKeys = ref<string[]>([]);

let spawnTimeout: number;
let animationFrameId: number;

const handleKeyPress = (event: KeyboardEvent) => {
  if (!pressedKeys.value.includes(event.key)) {
    pressedKeys.value.push(event.key);
  }
  
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
    case CONTROLS.PAUSE:
      store.pauseGame();
      break;
  }
};

const handleKeyUp = (event: KeyboardEvent) => {
  pressedKeys.value = pressedKeys.value.filter(key => key !== event.key);
};

const handleReset = () => {
  showConfetti.value = false;
  isWinner.value = false;
  cancelAnimationFrame(animationFrameId);
  store.reset();
  controlPanelRef.value?.resetTimer?.();
  gameArea.value?.focus();
  animationFrameId = requestAnimationFrame(gameLoop);
};

const handleStart = () => {
  console.log('Game started');
  store.startGame();
  gameArea.value?.focus();
  animationFrameId = requestAnimationFrame(gameLoop);
};

const gameLoop = (timestamp: number) => {
  animationFrameId = requestAnimationFrame(gameLoop);

  if (store.isPaused || store.isGameOver || !store.isPlaying) {
    return;
  }

  if (!store.currentObject) {
    store.spawnNewObject();
    lastTimestamp.value = timestamp;
    return;
  }

  const deltaTime = timestamp - (lastTimestamp.value || timestamp);
  lastTimestamp.value = timestamp;

  // Oblicz prędkość spadania
  const baseSpeed = pressedKeys.value.includes(CONTROLS.SPEED_UP) ? 
    GAME_CONFIG.PHYSICS.SPEED_UP_MULTIPLIER : 
    GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;

  // Dodaj bardzo małe przyspieszenie
  const acceleration = GAME_CONFIG.PHYSICS.FALL_ACCELERATION * (deltaTime / 1000);
  const fallSpeed = Math.min(
    baseSpeed + acceleration,
    GAME_CONFIG.PHYSICS.MAX_FALL_SPEED
  );

  // Aktualizuj pozycję z mniejszym krokiem
  store.currentObject.position.y += fallSpeed * (deltaTime / 16); // Normalizacja do 60 FPS

  // Sprawdź kolizje
  const objectHeight = store.currentObject.size.height;
  const objectBottom = store.currentObject.position.y + (objectHeight / 2);

  if (objectBottom >= GAME_CONFIG.BOARD.SURFACE_Y) {
    const isOverTeeterTotter = isObjectOverTeeterTotter(
      store.currentObject.position,
      store.currentObject.size.width
    );

    if (isOverTeeterTotter) {
      store.currentObject.position.y = GAME_CONFIG.BOARD.SURFACE_Y - (objectHeight / 2);
      store.placeObject();
    } else {
      store.throwsLeft--;
      store.currentObject = null;
      if (store.throwsLeft <= 0) {
        handleGameOver('throws');
      }
    }
  }

  // Sprawdź czy huśtawka nie jest za bardzo przechylona
  if (Math.abs(store.bendingAngle) >= GAME_CONFIG.PHYSICS.MAX_ANGLE) {
    handleGameOver('balance');
    return;
  }

  // Sprawdź czy nie skończyły się rzuty
  if (store.throwsLeft <= 0) {
    handleGameOver('throws');
    return;
  }
};

const handleTimeUp = () => {
  if (!store.isGameOver) {
    handleGameOver('time');
  }
};

const handleGameOver = (reason: 'balance' | 'throws' | 'time') => {
  if (store.isGameOver) return;
  
  cancelAnimationFrame(animationFrameId);
  const finalTime = store.gameTime;

  // Przygotuj komunikaty końca gry
  const reasons = {
    throws: 'No throws left! Game Over!',
    balance: 'Teeter-totter lost balance! Game Over!',
    time: 'Time\'s up! Game Over!'
  };
  
  gameOverReason.value = reasons[reason];

  // Oblicz bonusy końcowe
  timeBonus.value = Math.floor(finalTime * 10);
  stabilityBonus.value = Math.abs(store.bendingAngle) < 10 ? 1000 : 0;
  objectsBonus.value = (store.leftObjects.length + store.rightObjects.length) * 100;
  phaseBonus.value = Object.values(GAME_PHASES).findIndex(
    phase => phase.name === getCurrentPhase(store.score).name
  ) * 1000;

  // Dodaj bonusy do wyniku
  const totalBonus = timeBonus.value + stabilityBonus.value + 
    objectsBonus.value + phaseBonus.value;
  store.addBonusPoints(totalBonus);

  // Sprawdź czy jest nowy rekord
  if (store.score > store.highScore) {
    store.highScore = store.score;
    showConfetti.value = true;
    isWinner.value = true;
    createFireworks();
  }

  // Zakończ grę i pokaż modal
  store.endGame();
  store.setGameOverReason(reason);
};

const createFireworks = () => {
  const fireworks = [];
  for (let i = 0; i < 20; i++) {
    const delay = Math.random() * 2;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight / 2);
    fireworks.push({
      id: i,
      style: {
        left: `${x}px`,
        top: `${y}px`,
        animationDelay: `${delay}s`,
        '--color': `hsl(${Math.random() * 360}, 80%, 60%)`
      }
    });
  }
  fireworksRef.value = fireworks;
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

const getNextPhaseThreshold = (score: number) => {
  const currentPhase = getCurrentPhase(score);
  const phases = Object.values(GAME_PHASES);
  const currentIndex = phases.findIndex(phase => phase.name === currentPhase.name);
  if (currentIndex < phases.length - 1) {
    return phases[currentIndex + 1].scoreRange[0];
  }
  return '';
};

const getPhaseProgress = (score: number) => {
  const currentPhase = getCurrentPhase(score);
  const [min, max] = currentPhase.scoreRange;
  if (max === Infinity) {
    // Dla ostatniej fazy pokazujemy postęp do "nieskończoności" jako wielokrotność minimum
    return Math.min((score - min) / (min * 2) * 100, 100);
  }
  const progress = ((score - min) / (max - min)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

const difficultyMultiplier = computed(() => {
  const phase = getCurrentPhase(store.score);
  const phaseIndex = Object.values(GAME_PHASES).findIndex(p => p.name === phase.name);
  return 1 + (phaseIndex * 0.2);
});

const getGameOverMessage = computed(() => {
  switch (store.gameOverReason) {
    case 'balance':
      return 'Game Over - Lost Balance!';
    case 'throws':
      return 'Game Over - Out of Throws!';
    case 'time':
      return 'Time\'s Up!';
    default:
      return 'Game Over!';
  }
});

// Przechowujemy bonusy jako refs żeby pokazać je w podsumowaniu
const timeBonus = ref(0);
const stabilityBonus = ref(0);
const objectsBonus = ref(0);
const phaseBonus = ref(0);
const gameOverReason = ref('');

const calculateBonuses = (finalTime: number) => {
  timeBonus.value = finalTime * 10;
  stabilityBonus.value = Math.abs(store.bendingAngle) < 10 ? 1000 : 0;
  objectsBonus.value = (store.leftObjects.length + store.rightObjects.length) * 100;
  phaseBonus.value = Object.values(GAME_PHASES).findIndex(
    phase => phase.name === getCurrentPhase(store.score).name
  ) * 1000;
  
  return timeBonus.value + stabilityBonus.value + objectsBonus.value + phaseBonus.value;
};

const shareScore = () => {
  const text = `I scored ${store.score} points in Teeter Totter Game! 
    Time: ${formatTime(store.gameTime)}
    Phase: ${getCurrentPhase(store.score).name}
    Objects: ${store.leftObjects.length + store.rightObjects.length}
    Can you beat my score? 🎮`;
    
  if (navigator.share) {
    navigator.share({
      title: 'My Teeter Totter Score',
      text: text,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(text);
    // Pokaż powiadomienie o skopiowaniu
  }
};

const showGameOverModal = ref(false);

const handleMainMenu = () => {
  showGameOverModal.value = false;
  store.reset();
};

onMounted(() => {
  gameArea.value?.focus();
  window.addEventListener('keydown', handleKeyPress);
  window.addEventListener('keyup', handleKeyUp);
  animationFrameId = requestAnimationFrame(gameLoop);
});

onUnmounted(() => {
  if (spawnTimeout) {
    clearTimeout(spawnTimeout);
  }
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
  color: #e74c3c;
  font-size: 2.5em;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
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

.stats-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 20px 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 0.9em;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.4em;
  font-weight: bold;
  color: #2c3e50;
}

@keyframes firework {
  0% {
    transform: scale(0);
    opacity: 1;
    box-shadow: 0 0 0 0 var(--color);
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
    box-shadow: 0 0 40px 40px var(--color);
  }
}

.fireworks-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.firework {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--color);
  border-radius: 50%;
  animation: firework 1s ease-out forwards;
}

.score-breakdown {
  font-size: 0.9em;
  text-align: left;
  margin-top: 5px;
}

.score-breakdown div {
  margin: 2px 0;
  color: #666;
}

.game-over-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}

.game-over-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.game-over-content {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  min-width: 300px;
  animation: slideIn 0.5s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.game-over-content h2 {
  color: #e74c3c;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.game-over-reason {
  color: #7f8c8d;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.game-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.game-stats p {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.game-over-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.game-over-actions button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button {
  background: #3498db;
  color: white;
}

.retry-button:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.menu-button {
  background: #95a5a6;
  color: white;
}

.menu-button:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
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

.share-button {
  background: #2ecc71;
  color: white;
}

.share-button:hover {
  background: #27ae60;
  transform: translateY(-2px);
}
</style> 