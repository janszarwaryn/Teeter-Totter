// @ts-nocheck
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
      @keyup="handleKeyUp"
      ref="gameArea"
    >
      <div class="game-objects">
        <div class="drop-zone">
          <div class="drop-indicator" v-if="store.currentObject"></div>
          <Shape
            v-if="store.currentObject"
            v-bind="store.currentObject"
            :class="{ falling: true }"
          />
        </div>

        <Shape
          v-for="object in store.leftObjects"
          :key="object.id"
          v-bind="object"
          :class="{ placed: true }"
        />

        <Shape
          v-for="object in store.rightObjects"
          :key="object.id"
          v-bind="object"
          :class="{ placed: true }"
        />
      </div>

      <TeeterTotter
        :bending-angle="store.bendingAngle"
        :is-stabilized="store.isStabilized"
        :stabilization-time-left="store.stabilizationTimeLeft"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game';
import Shape from '@/components/atoms/Shape.vue';
import TeeterTotter from '@/components/organisms/TeeterTotter.vue';
import ControlPanel from '@/components/molecules/ControlPanel.vue';
import { CONTROLS, GAME_CONFIG, GAME_PHASES } from '@/constants/gameConstants';
import { getCurrentPhase } from '@/helpers/gameLogic';
import { calculateTotalMoment, calculateBendingAngle, isObjectOverTeeterTotter } from '@/helpers/physics';

// Zdefiniuj interfejs dla refs
interface ControlPanelInstance {
  resetTimer: () => void;
  getTime: () => number;
  addTimeBonus: (seconds: number) => void;
}

export default defineComponent({
  name: 'GameBoard',
  components: {
    Shape,
    TeeterTotter,
    ControlPanel
  },
  setup() {
    const store = useGameStore();
    const gameArea = ref<HTMLElement | null>(null);
    const controlPanelRef = ref<ControlPanelInstance | null>(null);
    const showConfetti = ref(false);
    const isWinner = ref(false);
    const gameOverReason = ref('');
    const lastTimestamp = ref<number>(0);
    const pressedKeys = ref<string[]>([]);

    // Bonusy
    const timeBonus = ref(0);
    const stabilityBonus = ref(0);
    const objectsBonus = ref(0);
    const phaseBonus = ref(0);

    // Timery
    let spawnTimeout: number;
    let animationFrameId: number;

    // Pomocnicze funkcje
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPhaseProgress = (score: number) => {
      const currentPhase = getCurrentPhase(score);
      const phases = Object.values(GAME_PHASES);
      const currentPhaseIndex = phases.findIndex(
        phase => phase.scoreRange[0] <= score && score <= phase.scoreRange[1]
      );
      
      const nextPhase = phases[currentPhaseIndex + 1];
      if (!nextPhase) return 100;
      
      const currentMin = currentPhase.scoreRange[0];
      const nextMin = nextPhase.scoreRange[0];
      const range = nextMin - currentMin;
      const progress = ((score - currentMin) / range) * 100;
      
      return Math.min(Math.max(progress, 0), 100);
    };

    const handleStart = () => {
      console.log('Game started');
      store.startGame();
      gameArea.value?.focus();
      animationFrameId = requestAnimationFrame(gameLoop);
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

    const handleTimeUp = () => {
      handleGameOver('time');
    };

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

    const handleGameOver = (reason: 'balance' | 'throws' | 'time') => {
      store.setGameOverReason(reason);
      store.endGame();
      
      // Oblicz bonusy końcowe
      const timePoints = controlPanelRef.value?.getTime?.() || 0;
      store.updateScore(timePoints);

      // Pokaż efekty końca gry
      showConfetti.value = store.score > store.highScore;
      isWinner.value = store.score > store.highScore;
      gameOverReason.value = reason;
    };

    // Dodaj funkcję gameLoop
    const gameLoop = (timestamp: number) => {
      if (!store.currentObject || !store.isPlaying || store.isPaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = lastTimestamp.value ? timestamp - lastTimestamp.value : 16;
      lastTimestamp.value = timestamp;

      // Oblicz prędkość spadania
      const baseSpeed = pressedKeys.value.includes(CONTROLS.SPEED_UP) ? 
        GAME_CONFIG.PHYSICS.SPEED_UP_MULTIPLIER : 
        GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED;

      // Użyj baseSpeed w obliczeniach
      store.currentObject.position.y += baseSpeed * (deltaTime / 16);

      // Sprawdź kolizje
      const objectHeight = store.currentObject.size.height;
      const objectBottom = store.currentObject.position.y + (objectHeight / 2);

      // Sprawdź czy obiekt jest w obszarze huśtawki
      if (objectBottom >= GAME_CONFIG.BOARD.SURFACE_Y - 20) {
        const isOverTeeterTotter = isObjectOverTeeterTotter(
          store.currentObject.position,
          store.currentObject.size.width
        );

        if (isOverTeeterTotter) {
          store.currentObject.position.y = GAME_CONFIG.BOARD.SURFACE_Y - (objectHeight / 2);
          store.placeObject();
          
          if (Math.abs(store.bendingAngle) >= GAME_CONFIG.PHYSICS.MAX_ANGLE) {
            handleGameOver('balance');
          }
        }
      }
      
      // Sprawdź czy obiekt spadł poza planszę
      if (objectBottom >= GAME_CONFIG.BOARD.HEIGHT) {
        store.throwsLeft--;
        store.currentObject = null;
        
        if (store.throwsLeft <= 0) {
          handleGameOver('throws');
        } else {
          store.spawnNewObject();
        }
        return;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    onMounted(() => {
      if (store.isPlaying) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
      gameArea.value?.focus();
    });

    onUnmounted(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (spawnTimeout) {
        clearTimeout(spawnTimeout);
      }
    });

    return {
      store,
      gameArea,
      controlPanelRef,
      showConfetti,
      isWinner,
      gameOverReason,
      handleStart,
      handleReset,
      handleTimeUp,
      handleKeyPress,
      handleKeyUp,
      getCurrentPhase,
      getPhaseProgress
    };
  }
});
</script>

<style scoped>
.game-board {
  width: 1200px;
  height: 800px;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  overflow: hidden;
}

.game-area {
  flex: 1;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.game-objects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Dodaj style dla spadających obiektów */
.falling {
  position: absolute;
  transition: transform 0.1s linear;
  will-change: transform;
}

/* Obszar zrzutu obiektów */
.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Wskaźnik miejsca zrzutu */
.drop-indicator {
  position: absolute;
  bottom: 200px; /* Dostosuj do wysokości huśtawki */
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1px;
}
</style> 