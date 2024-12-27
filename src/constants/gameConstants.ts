export const GAME_CONFIG = {
  BOARD: {
    WIDTH: 1000,
    HEIGHT: 600,
    SURFACE_Y: 450, // Pozycja Y powierzchni huśtawki
    GRID_INCREMENT: 50
  },
  PHYSICS: {
    INITIAL_FALL_SPEED: 50,
    ACCELERATION: 20,
    MAX_FALL_SPEED: 200,
    COLLISION_THRESHOLD: 5, // Próg kolizji w pikselach
    MAX_ANGLE: 30, // Maksymalny kąt przechylenia
    MOMENT_MULTIPLIER: 0.1 // Mnożnik momentu dla bardziej realistycznej fizyki
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
    scoreRange: [0, 200],
    weights: { min: 1, max: 2 }
  },
  PHASE_2: {
    name: 'Phase 2 - Medium',
    scoreRange: [201, 500],
    weights: { min: 1, max: 3 }
  },
  PHASE_3: {
    name: 'Phase 3 - Heavy',
    scoreRange: [501, 1000],
    weights: { min: 1, max: 5 }
  },
  PHASE_4: {
    name: 'Phase 4 - Expert',
    scoreRange: [1001, Infinity],
    weights: { min: 1, max: 8 }
  }
} as const; 