export const GAME_CONFIG = {
  BOARD: {
    WIDTH: 1200,
    HEIGHT: 800,
    SURFACE_Y: 600,
    TEETER_TOTTER: {
      WIDTH: 600,
      CENTER_X: 600,
      Y: 600,
      VALID_AREA: {
        MIN_X: 240,
        MAX_X: 960
      }
    }
  },
  PHYSICS: {
    COLLISION_THRESHOLD: 1,
    MAX_ANGLE: 25,
    INITIAL_FALL_SPEED: 1,
    SPEED_UP_MULTIPLIER: 3,
    SPAWN_INTERVAL: 0,
    FALL_ACCELERATION: 0.2,
    MAX_FALL_SPEED: 5,
    TEETER_TOTTER_WIDTH: 0.6,
    MOVEMENT_SPEED: 30
  },
  GAME_RULES: {
    MAX_GAME_TIME: 180,
    INITIAL_THROWS: 3,
    MAX_ANGLE: 25,
    CRITICAL_ANGLE_THRESHOLD: 0.85
  }
} as const;

export enum GameStatus {
  INITIAL = 'INITIAL',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  AUTO_PLAY = 'AUTO_PLAY'
}

export enum ShapeType {
  TRIANGLE = 'TRIANGLE',
  CIRCLE = 'CIRCLE',
  RECTANGLE = 'RECTANGLE'
}

export const CONTROLS = {
  MOVE_LEFT: 'ArrowLeft',
  MOVE_RIGHT: 'ArrowRight',
  SPEED_UP: 'ArrowDown',
  PAUSE: ' ', 
  RESET: 'r'
} as const;

export const GAME_PHASES = {
  PHASE_1: {
    name: 'Phase 1 - Light',
    scoreRange: [0, 500],
    weights: { min: 0.5, max: 2 }
  },
  PHASE_2: {
    name: 'Phase 2 - Medium',
    scoreRange: [501, 1500],
    weights: { min: 2, max: 3 }
  },
  PHASE_3: {
    name: 'Phase 3 - Heavy',
    scoreRange: [1501, 3000],
    weights: { min: 3, max: 5 }
  },
  PHASE_4: {
    name: 'Phase 4 - Expert',
    scoreRange: [3001, Infinity],
    weights: { min: 4, max: 8 }
  }
} as const; 