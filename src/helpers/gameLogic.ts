import { ShapeType, GAME_CONFIG, GAME_PHASES } from '@/constants/gameConstants';
import type { GameObject } from '@/types/game';

export const generateRandomObject = (currentScore: number): GameObject => {
  const currentPhase = getCurrentPhase(currentScore);
  
  // Zwiększamy rozmiary obiektów
  const baseSize = 40; // Bazowy rozmiar
  const weight = Math.floor(
    Math.random() * (currentPhase.weights.max - currentPhase.weights.min + 1)
  ) + currentPhase.weights.min;
  
  const type = Object.values(ShapeType)[
    Math.floor(Math.random() * Object.values(ShapeType).length)
  ];
  
  // Oblicz rozmiar na podstawie wagi
  const sizeMultiplier = weight / currentPhase.weights.min;
  let width = baseSize * sizeMultiplier;
  let height = baseSize * sizeMultiplier;
  
  // Dostosuj wymiary w zależności od typu
  switch (type) {
    case ShapeType.TRIANGLE:
      width *= 1.2;
      break;
    case ShapeType.RECTANGLE:
      height *= 0.8;
      break;
  }
  
  const colors = {
    [ShapeType.TRIANGLE]: '#FF6B6B',
    [ShapeType.CIRCLE]: '#4ECDC4',
    [ShapeType.RECTANGLE]: '#45B7D1'
  };

  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    weight,
    position: { x: 0, y: 0 },
    size: { width, height },
    color: colors[type],
    fallSpeed: GAME_CONFIG.PHYSICS.INITIAL_FALL_SPEED,
    isPlaced: false
  };
};

export const getInitialPosition = (side: 'left' | 'right'): number => {
  const margin = 100; // Margines od krawędzi
  const randomOffset = Math.random() * 200; // Losowy offset
  
  if (side === 'left') {
    return margin + randomOffset;
  } else {
    return GAME_CONFIG.BOARD.WIDTH - margin - randomOffset;
  }
};

export const getCurrentPhase = (score: number) => {
  return Object.values(GAME_PHASES).find(
    phase => score >= phase.scoreRange[0] && score <= phase.scoreRange[1]
  ) || GAME_PHASES.PHASE_1;
}; 