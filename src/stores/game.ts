import { defineStore } from 'pinia';
import { GameStatus, GAME_CONFIG, GAME_PHASES } from '@/constants/gameConstants';
import type { GameState, GameObject, Direction } from '@/types/game';
import { generateRandomObject, getInitialPosition, getCurrentPhase } from '@/helpers/gameLogic';
import { calculateTotalMoment, calculateBendingAngle, isGameOver, isObjectOverTeeterTotter, updateFallSpeed } from '@/helpers/physics';

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
      
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
    },

    spawnNewObject() {
      if (this.currentObject || !this.isPlaying) return;
      
      try {
        const newObject = generateRandomObject(this.score);
        
        const spawnPosition = {
          x: GAME_CONFIG.BOARD.WIDTH / 2, 
          y: 0 
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
      
      const movement = direction === 'left' ? -GAME_CONFIG.PHYSICS.MOVEMENT_SPEED : GAME_CONFIG.PHYSICS.MOVEMENT_SPEED;
      const newX = this.currentObject.position.x + movement;
      
      const margin = 50;
      const minX = -margin;
      const maxX = GAME_CONFIG.BOARD.WIDTH + margin;
      
      this.currentObject.position.x = Math.max(minX, Math.min(newX, maxX));
    },

    placeObject() {
      if (!this.currentObject || this.currentObject.isPlaced) return;

      const isOverTeeterTotter = isObjectOverTeeterTotter(
        this.currentObject.position,
        this.currentObject.size.width
      );

      if (!isOverTeeterTotter && this.currentObject.position.y > GAME_CONFIG.BOARD.HEIGHT * 0.3) {
        this.throwsLeft--;
        this.currentObject = null;
        
        if (this.throwsLeft <= 0) {
          this.setGameOverReason('throws');
          this.endGame();
        } else {
          setTimeout(() => {
            if (this.isPlaying) {
              this.spawnNewObject();
            }
          }, 500);
        }
        return;
      }

      if (isOverTeeterTotter) {
        this.currentObject.isPlaced = true;

        if (this.currentObject.position.x < GAME_CONFIG.BOARD.WIDTH / 2) {
          this.leftObjects.push({ ...this.currentObject });
        } else {
          this.rightObjects.push({ ...this.currentObject });
        }

        this.recalculateBendingAngle();
        this.addBonusPoints(50);

        const distanceFromCenter = Math.abs(
          this.currentObject.position.x - GAME_CONFIG.BOARD.WIDTH / 2
        );
        if (distanceFromCenter < 50) {
          this.addBonusPoints(100);
        }

        const currentAngle = Math.abs(this.bendingAngle);
        if (currentAngle < 5) {
          this.addBonusPoints(200);
        } else if (currentAngle < 10) {
          this.addBonusPoints(100);
        } else if (currentAngle < 15) {
          this.addBonusPoints(50);
        }

        this.currentObject = null;
        setTimeout(() => {
          if (this.isPlaying) {
            this.spawnNewObject();
          }
        }, 500);
      }
    },

    updateObjectPosition(deltaTime: number) {
      if (!this.currentObject || !this.isPlaying) return;

      const deltaSeconds = deltaTime / 1000;
      
      this.currentObject.fallSpeed = Math.min(
        this.currentObject.fallSpeed + (GAME_CONFIG.PHYSICS.FALL_ACCELERATION * deltaSeconds),
        GAME_CONFIG.PHYSICS.MAX_FALL_SPEED
      );

      this.currentObject.position.y += this.currentObject.fallSpeed * deltaSeconds * 60;

      const isNearSurface = this.currentObject.position.y >= GAME_CONFIG.BOARD.SURFACE_Y - 50;
      
      if (isNearSurface) {
        const isOverTeeterTotter = isObjectOverTeeterTotter(
          this.currentObject.position,
          this.currentObject.size.width
        );
        
        if (!isOverTeeterTotter) {
          this.currentObject.fallSpeed = Math.min(this.currentObject.fallSpeed, 2);
        }
        
        if (this.currentObject.position.y >= GAME_CONFIG.BOARD.SURFACE_Y - (this.currentObject.size.height / 2)) {
          this.placeObject();
        }
      }
    },

    recalculateBendingAngle() {
      const leftMoment = calculateTotalMoment(this.leftObjects);
      const rightMoment = calculateTotalMoment(this.rightObjects);
      this.bendingAngle = calculateBendingAngle(leftMoment, rightMoment);
      
      if (isGameOver(this.bendingAngle)) {
        this.endGame();
      }
    },

    updateScore(time: number) {
      this.gameTime = time;
      
      const timePoints = Math.floor(time * 5); 
      
      const stabilityBonus = Math.abs(this.bendingAngle) < 10 ? 1000 : 
                            Math.abs(this.bendingAngle) < 20 ? 500 : 0;
      
      const objectCount = this.leftObjects.length + this.rightObjects.length;
      const objectsBonus = objectCount * 100;
      
      const leftWeight = this.leftObjects.reduce((sum, obj) => sum + obj.weight, 0);
      const rightWeight = this.rightObjects.reduce((sum, obj) => sum + obj.weight, 0);
      const weightDifference = Math.abs(leftWeight - rightWeight);
      
      const balanceBonus = weightDifference < 2 ? 2000 :
                          weightDifference < 4 ? 1000 :
                          weightDifference < 6 ? 500 : 0;
      
      const phaseIndex = Object.values(GAME_PHASES).findIndex(
        phase => phase.name === getCurrentPhase(this.score).name
      );
      const phaseBonus = phaseIndex * 1000;

      this.score = Math.floor(
        timePoints +           
        this.bonusPoints +     
        objectsBonus +         
        stabilityBonus +       
        balanceBonus +        
        phaseBonus            
      );
      
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
    },

    addBonusPoints(points: number) {
      this.bonusPoints += points;
      this.score += points; 
    },

    toggleAutoPlay() {
      this.isAutoPlay = !this.isAutoPlay;
      if (this.isAutoPlay && !this.isPlaying) {
        this.startGame();
      }
    },

    reset() {
      const currentHighScore = this.highScore;
      
      this.status = GameStatus.INITIAL;
      this.score = 0;
      this.leftObjects = [];
      this.rightObjects = [];
      this.currentObject = null;
      this.bendingAngle = 0;
      this.throwsLeft = 3;
      this.isAutoPlay = false;
      
      this.highScore = currentHighScore;
    },

    setGameOverReason(reason: 'balance' | 'throws' | 'time') {
      this.gameOverReason = reason;
    }
  }
}); 