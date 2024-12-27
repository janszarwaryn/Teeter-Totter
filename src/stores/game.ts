import { defineStore } from 'pinia';
import { GameStatus, GAME_CONFIG } from '@/constants/gameConstants';
import type { GameState, GameObject, Direction } from '@/types/game';
import { generateRandomObject, getInitialPosition } from '@/helpers/gameLogic';
import { calculateTotalMoment, calculateBendingAngle, isGameOver } from '@/helpers/physics';

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    status: GameStatus.INITIAL,
    score: 0,
    leftObjects: [],
    rightObjects: [],
    currentObject: null,
    bendingAngle: 0,
    isAutoPlay: false,
    highScore: 0,
    throwsLeft: 3
  }),

  getters: {
    isPlaying: (state): boolean => state.status === GameStatus.PLAYING,
    isPaused: (state): boolean => state.status === GameStatus.PAUSED,
    isGameOver: (state): boolean => state.status === GameStatus.GAME_OVER,
    
    leftMoment: (state): number => calculateTotalMoment(state.leftObjects),
    rightMoment: (state): number => calculateTotalMoment(state.rightObjects),
    
    currentBendingAngle: (state): number => {
      const leftMoment = calculateTotalMoment(state.leftObjects);
      const rightMoment = calculateTotalMoment(state.rightObjects);
      return calculateBendingAngle(leftMoment, rightMoment);
    }
  },

  actions: {
    startGame() {
      this.status = GameStatus.PLAYING;
      this.score = 0;
      this.leftObjects = [];
      this.rightObjects = [];
      this.bendingAngle = 0;
      this.throwsLeft = 3;
      this.spawnNewObject();
    },

    pauseGame() {
      if (this.status === GameStatus.PLAYING) {
        this.status = GameStatus.PAUSED;
      } else if (this.status === GameStatus.PAUSED) {
        this.status = GameStatus.PLAYING;
      }
    },

    endGame() {
      this.status = GameStatus.GAME_OVER;
      this.currentObject = null;
    },

    spawnNewObject() {
      const newObject = generateRandomObject(this.score);
      const side = Math.random() < 0.5 ? 'left' : 'right';
      newObject.position.x = getInitialPosition(side);
      newObject.position.y = 0; // Start from top
      this.currentObject = newObject;
    },

    moveObject(direction: Direction) {
      if (!this.currentObject || !this.isPlaying) return;
      
      const movement = GAME_CONFIG.BOARD.GRID_INCREMENT / 2;
      const currentX = this.currentObject.position.x;
      const newX = direction === 'left' 
        ? currentX - movement 
        : currentX + movement;
      
      // Sprawdzamy granice planszy
      const minX = this.currentObject.size.width / 2;
      const maxX = GAME_CONFIG.BOARD.WIDTH - this.currentObject.size.width / 2;
      
      // Aktualizujemy pozycję
      this.currentObject.position.x = Math.max(minX, Math.min(newX, maxX));
    },

    placeObject() {
      if (!this.currentObject) return;

      const side = this.currentObject.position.x < 500 ? 'left' : 'right';
      if (side === 'left') {
        this.leftObjects.push({ ...this.currentObject });
      } else {
        this.rightObjects.push({ ...this.currentObject });
      }

      this.updateGameState();
      this.spawnNewObject();
    },

    updateGameState() {
      const leftMoment = this.leftMoment;
      const rightMoment = this.rightMoment;
      this.bendingAngle = calculateBendingAngle(leftMoment, rightMoment);

      if (isGameOver(this.bendingAngle)) {
        this.endGame();
      } else {
        this.updateScore();
      }
    },

    updateScore(time: number) {
      this.score = time;
      if (time > this.highScore) {
        this.highScore = time;
      }
    },

    toggleAutoPlay() {
      this.isAutoPlay = !this.isAutoPlay;
      if (this.isAutoPlay && !this.isPlaying) {
        this.startGame();
      }
    },

    reset() {
      // Zachowujemy najlepszy wynik
      const currentHighScore = this.highScore;
      
      // Resetujemy wszystkie wartości do stanu początkowego
      this.$reset();
      
      // Przywracamy najlepszy wynik
      this.highScore = currentHighScore;
      
      // Zatrzymujemy grę
      this.status = GameStatus.INITIAL;
      
      // Wyczyść wszystkie obiekty
      this.leftObjects = [];
      this.rightObjects = [];
      this.currentObject = null;
      
      // Resetuj kąt nachylenia
      this.bendingAngle = 0;
      
      // Resetuj liczbę wyrzutów
      this.throwsLeft = 3;
      
      // Wyłącz tryb auto-play
      this.isAutoPlay = false;
    }
  }
}); 