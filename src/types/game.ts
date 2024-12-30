import { GameStatus, ShapeType } from '@/constants/gameConstants';

export interface GameObject {
  id: string;
  type: ShapeType;
  weight: number;
  position: Position;
  size: Size;
  color: string;
  fallSpeed: number;
  isPlaced: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  leftObjects: GameObject[];
  rightObjects: GameObject[];
  currentObject: GameObject | null;
  bendingAngle: number;
  isAutoPlay: boolean;
  throwsLeft: number;
  isStabilized: boolean;
  stabilizationTimeLeft: number;
  gameTime: number;
  bonusPoints: number;
  gameOverReason: null | string;
}

export interface PhysicsState {
  fallSpeed: number;
  totalMoment: number;
  isBalanced: boolean;
}

export type Direction = 'left' | 'right';

export interface CollisionResult {
  hasCollision: boolean;
  collidingWith?: GameObject;
  position?: Position;
} 