import { ShapeType, GAME_PHASES } from '@/constants/gameConstants';
import type { GameObject, Position, Size } from '@/types/game';

export const getCurrentPhase = (score: number) => {
  for (const phase of Object.values(GAME_PHASES)) {
    const [min, max] = phase.scoreRange;
    if (score >= min && score <= max) {
      return phase;
    }
  }
  return GAME_PHASES.PHASE_4; // Domyślnie ostatnia faza
};

export const generateRandomObject = (score: number = 0): GameObject => {
  const currentPhase = getCurrentPhase(score);
  
  // Losujemy czy generować obiekt z aktualnej fazy czy z wcześniejszej
  const useCurrentPhase = Math.random() < 0.7; // 70% szans na obiekt z aktualnej fazy
  
  let minWeight, maxWeight;
  if (useCurrentPhase) {
    // Używamy wag z aktualnej fazy
    minWeight = currentPhase.weights.min;
    maxWeight = currentPhase.weights.max;
  } else {
    // Używamy wag z losowej wcześniejszej fazy
    const phases = Object.values(GAME_PHASES);
    const currentPhaseIndex = phases.indexOf(currentPhase);
    if (currentPhaseIndex > 0) {
      const randomPreviousPhase = phases[Math.floor(Math.random() * currentPhaseIndex)];
      minWeight = randomPreviousPhase.weights.min;
      maxWeight = randomPreviousPhase.weights.max;
    } else {
      // Jeśli jesteśmy w pierwszej fazie, używamy jej wag
      minWeight = currentPhase.weights.min;
      maxWeight = currentPhase.weights.max;
    }
  }

  // Losujemy wagę z wybranego zakresu
  const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;

  const shapeTypes = Object.values(ShapeType);
  const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];

  const size = calculateSize(weight, randomType);
  const color = getShapeColor(randomType);

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: randomType,
    weight,
    position: { x: 0, y: 0 },
    size,
    color
  };
};

export const calculateSize = (weight: number, type: ShapeType): Size => {
  // Bazowy rozmiar: 12 pikseli na kilogram
  const baseSize = weight * 12;

  switch (type) {
    case ShapeType.CIRCLE:
      return {
        width: baseSize,
        height: baseSize
      };
    case ShapeType.TRIANGLE:
      return {
        width: baseSize * 1.2,
        height: baseSize
      };
    case ShapeType.RECTANGLE:
      return {
        width: baseSize,
        height: baseSize * 0.8
      };
  }
};

export const getShapeColor = (type: ShapeType): string => {
  switch (type) {
    case ShapeType.TRIANGLE:
      return '#FF6B6B';
    case ShapeType.CIRCLE:
      return '#4ECDC4';
    case ShapeType.RECTANGLE:
      return '#45B7D1';
  }
};

export const getInitialPosition = (side: 'left' | 'right'): number => {
  const minX = 100; // Minimalna odległość od krawędzi
  const maxX = 400; // Maksymalna odległość od środka
  const randomOffset = Math.random() * (maxX - minX) + minX;
  return side === 'left' ? randomOffset : 1000 - randomOffset;
};

export function snapToGrid(position: number): number {
  const gridSize = GAME_CONFIG.BOARD.GRID_INCREMENT;
  return Math.round(position / gridSize) * gridSize;
}

export function calculateScore(bendingAngle: number): number {
  const maxAngle = GAME_CONFIG.BOARD.MAX_BENDING_ANGLE;
  const angleRatio = 1 - (bendingAngle / maxAngle);
  return Math.round(angleRatio * 100);
}

export function isValidPosition(x: number): boolean {
  return x >= 0 && x <= GAME_CONFIG.BOARD.WIDTH;
}

export function getNextPosition(currentX: number, direction: 'left' | 'right'): number {
  const movement = GAME_CONFIG.BOARD.GRID_INCREMENT;
  const newX = direction === 'left' 
    ? currentX - movement 
    : currentX + movement;
  
  return snapToGrid(
    Math.max(0, Math.min(newX, GAME_CONFIG.BOARD.WIDTH))
  );
} 