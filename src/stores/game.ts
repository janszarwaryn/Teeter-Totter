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
    },

    spawnNewObject() {
      console.log('Attempting to spawn new object');
      if (this.currentObject || !this.isPlaying) {
        console.log('Cannot spawn: ', {
          hasCurrentObject: !!this.currentObject,
          isPlaying: this.isPlaying
        });
        return;
      }
      
      try {
        const newObject = generateRandomObject(this.score);
        const side = Math.random() < 0.5 ? 'left' : 'right';
        
        // Ustaw początkową pozycję
        const x = getInitialPosition(side);
        newObject.position = {
          x: x,
          y: -newObject.size.height // Zacznij powyżej widocznego obszaru
        };
        
        this.currentObject = { ...newObject };
        console.log('Successfully spawned:', this.currentObject);
      } catch (error) {
        console.error('Error spawning object:', error);
      }
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

      this.currentObject.isPlaced = true;
      if (this.currentObject.position.x < GAME_CONFIG.BOARD.WIDTH / 2) {
        this.leftObjects.push({ ...this.currentObject });
      } else {
        this.rightObjects.push({ ...this.currentObject });
      }
      
      this.recalculateBendingAngle();
      
      // Bonus za dobre umieszczenie obiektu
      if (Math.abs(this.bendingAngle) < 10) {
        this.addBonusPoints(300);
      } else if (Math.abs(this.bendingAngle) < 20) {
        this.addBonusPoints(100);
      }
      
      this.currentObject = null;
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
      
      // Podstawowe punkty za czas
      const timePoints = Math.floor(time * 10);
      
      // Bonus za stabilność
      const stabilityBonus = Math.abs(this.bendingAngle) < 10 ? 1000 : 
                            Math.abs(this.bendingAngle) < 20 ? 500 : 0;
      
      // Bonus za ilość obiektów i ich balans
      const totalObjects = this.leftObjects.length + this.rightObjects.length;
      const objectsBonus = totalObjects * 100;
      
      // Obliczamy rzeczywisty balans momentów
      const leftMoment = this.leftObjects.reduce((sum, obj) => sum + obj.weight, 0);
      const rightMoment = this.rightObjects.reduce((sum, obj) => sum + obj.weight, 0);
      const momentDifference = Math.abs(leftMoment - rightMoment);
      
      // Bonus za dobry balans wag
      const balanceBonus = momentDifference < 2 ? 1000 :
                          momentDifference < 4 ? 500 : 0;
      
      // Oblicz całkowity wynik
      this.score = Math.floor(
        timePoints + 
        this.bonusPoints + 
        objectsBonus + 
        stabilityBonus + 
        balanceBonus
      );
      
      // Zapisz najlepszy wynik
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
    },

    addBonusPoints(points: number) {
      this.bonusPoints += points;
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