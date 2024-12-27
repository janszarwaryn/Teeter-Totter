<template>
  <div 
    class="shape"
    :class="[type.toLowerCase()]"
    :style="{
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: color,
      transform: `translate(${position.x - size.width / 2}px, ${position.y}px)`
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
}

defineProps<Props>();
</script>

<style scoped>
.shape {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center bottom;
  will-change: transform;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.weight-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 8px;
  display: flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 2;
}

.weight-value {
  color: white;
  font-weight: bold;
  font-size: 1em;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.weight-unit {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.7em;
  font-weight: normal;
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

/* Efekty hover dla lepszej widoczności aktywnego elementu */
.shape:not(.placed):hover {
  filter: brightness(1.1);
}

/* Animacja przy kolizji */
@keyframes collision {
  0% { transform: scale(1) translateX(-50%); }
  50% { transform: scale(0.95) translateX(-50%); }
  100% { transform: scale(1) translateX(-50%); }
}

.shape.collision {
  animation: collision 0.2s ease-out;
}

/* Dodajemy cień dla lepszej głębi */
.shape.placed {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Dodajemy efekt unoszenia dla aktywnego elementu */
.shape:not(.placed) .weight-badge {
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(-50%, -50%); }
  50% { transform: translate(-50%, -60%); }
}
</style> 