import type { GameObject, Position, CollisionResult } from '@/types/game';
import { GAME_CONFIG } from '@/constants/gameConstants';

const BOARD_CENTER_X = GAME_CONFIG.BOARD.WIDTH / 2;
const MAX_ANGLE = GAME_CONFIG.PHYSICS.MAX_ANGLE;

export const calculateMoment = (object: GameObject): number => {
  // Obliczamy odległość od środka (ramię siły)
  const distanceFromCenter = Math.abs(object.position.x - BOARD_CENTER_X) / GAME_CONFIG.BOARD.WIDTH;
  // Moment siły = masa * przyspieszenie grawitacyjne * ramię siły
  // Znak zależy od strony (ujemny dla lewej, dodatni dla prawej)
  const direction = object.position.x < BOARD_CENTER_X ? -1 : 1;
  return direction * object.weight * distanceFromCenter * GAME_CONFIG.PHYSICS.MOMENT_MULTIPLIER;
};

export const calculateTotalMoment = (objects: GameObject[]): number => {
  return objects.reduce((total, obj) => total + calculateMoment(obj), 0);
};

export const calculateBendingAngle = (leftMoment: number, rightMoment: number): number => {
  // Całkowity moment to różnica momentów
  const totalMoment = leftMoment + rightMoment; // Lewy moment jest już ujemny
  
  // Zwiększamy czułość huśtawki
  const maxMoment = 20; // Jeszcze bardziej zwiększamy czułość
  const angle = (totalMoment / maxMoment) * MAX_ANGLE;
  
  // Ograniczamy kąt do zakresu -MAX_ANGLE do MAX_ANGLE
  return Math.max(-MAX_ANGLE, Math.min(angle, MAX_ANGLE));
};

export const isGameOver = (bendingAngle: number): boolean => {
  return Math.abs(bendingAngle) >= MAX_ANGLE;
};

export const updateFallSpeed = (currentSpeed: number, deltaTime: number): number => {
  const newSpeed = currentSpeed + (GAME_CONFIG.PHYSICS.ACCELERATION * deltaTime / 1000);
  return Math.min(newSpeed, GAME_CONFIG.PHYSICS.MAX_FALL_SPEED);
};

export const detectCollision = (
  currentObject: GameObject,
  objects: GameObject[]
): CollisionResult => {
  // Sprawdzamy kolizję z innymi obiektami
  for (const obj of objects) {
    const horizontalOverlap = Math.abs(currentObject.position.x - obj.position.x) < 
      (currentObject.size.width + obj.size.width) / 2;
    
    const verticalDistance = currentObject.position.y - obj.position.y;
    const verticalOverlap = verticalDistance > 0 && 
      verticalDistance < (currentObject.size.height + obj.size.height) / 2;

    if (horizontalOverlap && verticalOverlap) {
      return {
        hasCollision: true,
        collidingWith: obj,
        position: {
          x: currentObject.position.x,
          y: obj.position.y - currentObject.size.height - GAME_CONFIG.PHYSICS.COLLISION_THRESHOLD
        }
      };
    }
  }

  return { hasCollision: false };
};

// Dodajemy nową funkcję do sprawdzania kolizji z huśtawką
export const isObjectOverTeeterTotter = (
  objectPosition: Position,
  objectWidth: number
): boolean => {
  const teeterTotterCenter = GAME_CONFIG.BOARD.WIDTH / 2;
  const teeterTotterWidth = GAME_CONFIG.BOARD.WIDTH * 0.6; // 60% szerokości planszy
  
  return Math.abs(objectPosition.x - teeterTotterCenter) < teeterTotterWidth / 2;
}; 