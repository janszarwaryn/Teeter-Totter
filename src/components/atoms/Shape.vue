<template>
  <div 
    class="shape"
    :class="[
      type.toLowerCase(),
      { 'falling': !isPlaced, 'placed': isPlaced }
    ]"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: color,
      transform: `translate(-50%, -50%)`
    }"
  >
    <div class="weight-badge">
      <span class="weight-value">{{ weight }}</span>
      <span class="weight-unit">kg</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShapeType } from '@/constants/gameConstants';
import type { Position, Size } from '@/types/game';

interface Props {
  type: ShapeType;
  weight: number;
  position: Position;
  size: Size;
  color: string;
  isPlaced: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.shape {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  will-change: transform;
  transition: transform 0.016s linear;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.falling {
  z-index: 10;
}

.placed {
  z-index: 1;
}

.circle {
  border-radius: 50%;
}

.triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.rectangle {
  border-radius: 4px;
}
</style> 