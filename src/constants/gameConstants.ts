export const GAME_CONFIG = {
  BOARD: {
    WIDTH: 1000,
    HEIGHT: 600,
    SURFACE_Y: 520,
    GRID_INCREMENT: 50
  },
  PHYSICS: {
    COLLISION_THRESHOLD: 1,
    MAX_ANGLE: 25,
    INITIAL_FALL_SPEED: 3,
    SPEED_UP_MULTIPLIER: 3,
    SPAWN_INTERVAL: 0,
    FALL_ACCELERATION: 0.5,
    MAX_FALL_SPEED: 10,
    TEETER_TOTTER_WIDTH: 0.6
  },
  GAME_RULES: {
    MAX_GAME_TIME: 180, // 3 minuty w sekundach
    INITIAL_THROWS: 3,
    MAX_ANGLE: 25, // maksymalny kąt przechylenia
    CRITICAL_ANGLE_THRESHOLD: 0.85 // 85% maksymalnego kąta
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
  PAUSE: ' ', // Space
  RESET: 'r'
} as const;

export const GAME_PHASES = {
  PHASE_1: {
    name: 'Phase 1 - Light',
    scoreRange: [0, 30],
    weights: { min: 1, max: 2 }
  },
  PHASE_2: {
    name: 'Phase 2 - Medium',
    scoreRange: [31, 60],
    weights: { min: 2, max: 4 }
  },
  PHASE_3: {
    name: 'Phase 3 - Heavy',
    scoreRange: [61, 90],
    weights: { min: 3, max: 6 }
  },
  PHASE_4: {
    name: 'Phase 4 - Expert',
    scoreRange: [91, Infinity],
    weights: { min: 4, max: 8 }
  }
} as const; 