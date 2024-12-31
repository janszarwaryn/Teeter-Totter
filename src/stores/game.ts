import { defineStore } from 'pinia';
import { GameStatus, GAME_CONFIG, GAME_PHASES } from '@/constants/gameConstants';
import type { GameState, GameObject, Direction } from '@/types/game';
import { generateRandomObject, getInitialPosition, getCurrentPhase } from '@/helpers/gameLogic';
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
    throwsLeft: 3,
    gameTime: 0,
    bonusPoints: 0,
    isStabilized: false,
    stabilizationTimeLeft: 0,
    gameOverReason: null
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
      this.leftObjects = [];
      this.rightObjects = [];
      this.currentObject = null;
      this.bendingAngle = 0;
      this.throwsLeft = 3;
      this.score = 0;
      this.gameTime = 0;
      this.bonusPoints = 0;
      this.isStabilized = false;
      this.stabilizationTimeLeft = 0;
      
      // Natychmiast spawnujemy pierwszy obiekt
      this.spawnNewObject();
    },

    pauseGame() {
      if (this.status === GameStatus.PLAYING) {
        this.status = GameStatus.PAUSED;
        return;
      } 
      if (this.status === GameStatus.PAUSED) {
        this.status = GameStatus.PLAYING;
      }
    },

    endGame() {
      this.status = GameStatus.GAME_OVER;
      this.currentObject = null;
      
      // Zapisz najlepszy wynik jeśli obecny jest wyższy
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
    },

    spawnNewObject() {
      if (this.currentObject || !this.isPlaying) return;
      
      try {
        const newObject = generateRandomObject(this.score);
        
        // Ustaw początkową pozycję dokładnie nad środkiem huśtawki
        const spawnPosition = {
          x: GAME_CONFIG.BOARD.WIDTH / 2, // Środek planszy
          y: 0 // Góra planszy
        };

        this.currentObject = {
          ...newObject,
          position: spawnPosition,
          fallSpeed: GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED
        };
      } catch (error) {
        console.error('Error spawning object:', error);
      }
    },

    moveObject(direction: Direction) {
      if (!this.currentObject || !this.isPlaying) return;
      
      const movement = direction === 'left' ? -15 : 15;
      const newX = this.currentObject.position.x + movement;
      
      // Ograniczenie ruchu do szerokości huśtawki
      const minX = (GAME_CONFIG.BOARD.WIDTH / 2) - (GAME_CONFIG.BOARD.TEETER_TOTTER.WIDTH / 3);
      const maxX = (GAME_CONFIG.BOARD.WIDTH / 2) + (GAME_CONFIG.BOARD.TEETER_TOTTER.WIDTH / 3);
      
      this.currentObject.position.x = Math.max(minX, Math.min(newX, maxX));
    },

    placeObject() {
      if (!this.currentObject || this.currentObject.isPlaced) return;

      // Najpierw oznaczamy obiekt jako umieszczony
      this.currentObject.isPlaced = true;

      // Dodaj obiekt do odpowiedniej tablicy
      if (this.currentObject.position.x < GAME_CONFIG.BOARD.WIDTH / 2) {
        this.leftObjects.push({ ...this.currentObject });
      } else {
        this.rightObjects.push({ ...this.currentObject });
      }

      // Przelicz kąt huśtawki
      this.recalculateBendingAngle();

      // Nalicz punkty tylko raz
      this.addBonusPoints(50); // Podstawowe punkty

      // Bonus za precyzję
      const distanceFromCenter = Math.abs(
        this.currentObject.position.x - GAME_CONFIG.BOARD.WIDTH / 2
      );
      if (distanceFromCenter < 50) {
        this.addBonusPoints(100);
      }

      // Bonus za balans
      const currentAngle = Math.abs(this.bendingAngle);
      if (currentAngle < 5) {
        this.addBonusPoints(200);
      } else if (currentAngle < 10) {
        this.addBonusPoints(100);
      } else if (currentAngle < 15) {
        this.addBonusPoints(50);
      }

      this.currentObject = null;

      // Spawnuj nowy obiekt jeśli gra się nie skończyła
      if (Math.abs(this.bendingAngle) < GAME_CONFIG.PHYSICS.MAX_ANGLE) {
        this.spawnNewObject();
      }
    },

    recalculateBendingAngle() {
      const leftMoment = calculateTotalMoment(this.leftObjects);
      const rightMoment = calculateTotalMoment(this.rightObjects);
      this.bendingAngle = calculateBendingAngle(leftMoment, rightMoment);
      
      // Sprawdź czy gra się nie skończyła
      if (isGameOver(this.bendingAngle)) {
        this.endGame();
      }
    },

    updateScore(time: number) {
      this.gameTime = time;
      
      // 1. Punkty bazowe za czas
      const timePoints = Math.floor(time * 5); // 5 punktów za sekundę
      
      // 2. Bonus za stabilność całkowitą
      const stabilityBonus = Math.abs(this.bendingAngle) < 10 ? 1000 : 
                            Math.abs(this.bendingAngle) < 20 ? 500 : 0;
      
      // 3. Bonus za ilość obiektów
      const objectCount = this.leftObjects.length + this.rightObjects.length;
      const objectsBonus = objectCount * 100;
      
      // 4. Bonus za balans wag
      const leftWeight = this.leftObjects.reduce((sum, obj) => sum + obj.weight, 0);
      const rightWeight = this.rightObjects.reduce((sum, obj) => sum + obj.weight, 0);
      const weightDifference = Math.abs(leftWeight - rightWeight);
      
      const balanceBonus = weightDifference < 2 ? 2000 :
                          weightDifference < 4 ? 1000 :
                          weightDifference < 6 ? 500 : 0;
      
      // 5. Bonus za fazę gry
      const phaseIndex = Object.values(GAME_PHASES).findIndex(
        phase => phase.name === getCurrentPhase(this.score).name
      );
      const phaseBonus = phaseIndex * 1000;

      // Oblicz całkowity wynik
      this.score = Math.floor(
        timePoints +           // Punkty za czas
        this.bonusPoints +     // Zebrane bonusy
        objectsBonus +         // Bonus za ilość obiektów
        stabilityBonus +       // Bonus za stabilność
        balanceBonus +        // Bonus za balans wag
        phaseBonus            // Bonus za osiągniętą fazę
      );
      
      // Zapisz najlepszy wynik
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
    },

    addBonusPoints(points: number) {
      this.bonusPoints += points;
      this.score += points; // Natychmiast aktualizuj wynik
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
      
      // Reset stanu gry
      this.status = GameStatus.INITIAL;
      this.score = 0;
      this.leftObjects = [];
      this.rightObjects = [];
      this.currentObject = null;
      this.bendingAngle = 0;
      this.throwsLeft = 3;
      this.isAutoPlay = false;
      
      // Przywracamy najlepszy wynik
      this.highScore = currentHighScore;
    },

    setGameOverReason(reason: 'balance' | 'throws' | 'time') {
      this.gameOverReason = reason;
    }
  }
}); 