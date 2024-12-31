<template>
  <div class="teeter-totter-container">
    <div 
      class="teeter-totter"
      :style="{
        transform: `rotate(${bendingAngle}deg)`
      }"
    >
      <div 
        class="board"
        :class="{ stabilized: isStabilized }"
      >
        <!-- Linie pomocnicze dla pozycjonowania -->
        <div class="grid-lines">
          <div v-for="i in 20" :key="i" class="grid-line"></div>
        </div>
      </div>
      <div class="pivot"></div>
    </div>
    <div 
      v-if="isStabilized" 
      class="stabilization-countdown"
    >
      {{ stabilizationTimeLeft }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  bendingAngle: number;
  isStabilized: boolean;
  stabilizationTimeLeft: number;
}>();
</script>

<style scoped>
.teeter-totter-container {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.teeter-totter {
  position: relative;
  width: 600px;
  height: 100%;
  transform-origin: center bottom;
  transition: transform 0.3s ease-out;
}

.board {
  width: 100%;
  height: 15px;
  background: #34495e;
  border-radius: 4px;
  position: relative;
}

.board.stabilized {
  background: linear-gradient(to right, #3498db, #2980b9);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
}

.grid-line {
  width: 2px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
}

.pivot {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 30px;
  height: 60px;
  background: linear-gradient(to bottom, #7f8c8d, #95a5a6);
  transform: translateX(-50%);
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.stabilization-countdown {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 48px;
  font-weight: bold;
  color: #3498db;
  text-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.2); }
  100% { transform: translateX(-50%) scale(1); }
}
</style> 