import { ShapeType, GAME_CONFIG, GAME_PHASES } from '@/constants/gameConstants';
import type { GameObject } from '@/types/game';

export const generateRandomObject = (score: number): GameObject => {
  const currentPhase = getCurrentPhase(score);
  
  // Określ zakres wag dla wszystkich poprzednich faz i obecnej
  const availableWeights: { min: number; max: number }[] = [];
  
  Object.values(GAME_PHASES).forEach(phase => {
    if (phase.scoreRange[0] <= score) {
      availableWeights.push(phase.weights);
    }
  });
  
  // Losowo wybierz jeden z dostępnych zakresów wag
  const selectedRange = availableWeights[Math.floor(Math.random() * availableWeights.length)];
  
  // Generuj wagę z wybranego zakresu
  const weight = Number((selectedRange.min + Math.random() * (selectedRange.max - selectedRange.min)).toFixed(1));
  
  const type = Object.values(ShapeType)[
    Math.floor(Math.random() * Object.values(ShapeType).length)
  ];
  
  // Oblicz rozmiar na podstawie wagi
  const sizeMultiplier = weight / currentPhase.weights.min;
  let width = 40 * sizeMultiplier;
  let height = 40 * sizeMultiplier;
  
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

export const getNextPhase = (score: number) => {
  const phases = Object.values(GAME_PHASES);
  const currentPhaseIndex = phases.findIndex(
    phase => phase.scoreRange[0] <= score && score <= phase.scoreRange[1]
  );
  
  return phases[currentPhaseIndex + 1];
}; 