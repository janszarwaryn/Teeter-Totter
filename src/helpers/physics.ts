import type { GameObject, Position, CollisionResult } from '@/types/game';
import { GAME_CONFIG } from '@/constants/gameConstants';

const BOARD_CENTER_X = GAME_CONFIG.BOARD.WIDTH / 2;
const MAX_ANGLE = GAME_CONFIG.PHYSICS.MAX_ANGLE;

export const calculateMoment = (object: GameObject): number => {
  // Obliczamy odległość od środka w pikselach
  const distanceFromCenter = Math.abs(object.position.x - BOARD_CENTER_X);
  
  // Określamy stronę (lewa = -1, prawa = 1)
  const side = object.position.x < BOARD_CENTER_X ? -1 : 1;
  
  // Moment siły = waga * odległość * strona
  // Dla lewej strony będzie ujemny, dla prawej dodatni
  return (object.weight * distanceFromCenter * side) / 100;
};

export const calculateTotalMoment = (objects: GameObject[]): number => {
  return objects.reduce((total, obj) => total + calculateMoment(obj), 0);
};

export const calculateBendingAngle = (leftMoment: number, rightMoment: number): number => {
  // Sumujemy momenty (lewy jest już ujemny)
  const totalMoment = leftMoment + rightMoment;
  
  // Konwertujemy moment na kąt
  // Dodatni moment = przechylenie w prawo
  // Ujemny moment = przechylenie w lewo
  const angle = totalMoment;
  
  // Ograniczamy maksymalny kąt
  return Math.max(
    -GAME_CONFIG.PHYSICS.MAX_ANGLE,
    Math.min(GAME_CONFIG.PHYSICS.MAX_ANGLE, angle)
  );
};

export const isGameOver = (angle: number): boolean => {
  // Game over gdy kąt przekroczy 90% maksymalnego
  return Math.abs(angle) >= GAME_CONFIG.PHYSICS.MAX_ANGLE;
};

export const isBalanceCritical = (angle: number): boolean => {
  return Math.abs(angle) >= GAME_CONFIG.PHYSICS.MAX_ANGLE * 0.85;
};

export const updateFallSpeed = (currentSpeed: number, deltaTime: number): number => {
  const newSpeed = currentSpeed + (GAME_CONFIG.PHYSICS.FALL_ACCELERATION * deltaTime / 1000);
  return Math.min(newSpeed, GAME_CONFIG.PHYSICS.MAX_FALL_SPEED);
};

export const detectCollision = (
  currentObject: GameObject,
  objects: GameObject[]
): CollisionResult => {
  // Sprawdzamy kolizję z innymi obiektami
  for (const obj of objects) {
    // Sprawdzamy kolizję poziomą
    const horizontalOverlap = Math.abs(currentObject.position.x - obj.position.x) < 
      (currentObject.size.width + obj.size.width) / 2;
      
    // Sprawdzamy kolizję pionową
    const verticalDistance = currentObject.position.y - obj.position.y;
    const verticalOverlap = verticalDistance > 0 && 
      verticalDistance < (currentObject.size.height + obj.size.height) / 2;

    if (horizontalOverlap && verticalOverlap) {
      return {
        hasCollision: true,
        collidingWith: obj,
        position: {
          x: currentObject.position.x,
          y: obj.position.y - (currentObject.size.height / 2)
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
  const teeterTotterWidth = GAME_CONFIG.BOARD.WIDTH * GAME_CONFIG.PHYSICS.TEETER_TOTTER_WIDTH;
  const margin = objectWidth / 2; // Margines zależny od szerokości obiektu

  // Sprawdź tylko pozycję poziomą
  return Math.abs(objectPosition.x - teeterTotterCenter) < (teeterTotterWidth / 2) + margin;
}; 