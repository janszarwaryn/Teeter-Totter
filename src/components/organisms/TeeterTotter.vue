<template>
  <div class="teeter-totter-container">
    <div 
      class="teeter-totter"
      :style="{
        transform: `rotate(${bendingAngle}deg)`
      }"
    >
      <div class="board">
        <!-- Linie pomocnicze dla pozycjonowania -->
        <div class="grid-lines">
          <div v-for="i in 20" :key="i" class="grid-line"></div>
        </div>
      </div>
      <div class="pivot"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  bendingAngle: number;
}>();
</script>

<style scoped>
.teeter-totter-container {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.teeter-totter {
  position: relative;
  width: 800px;
  height: 100%;
  transform-origin: center bottom;
  transition: transform 0.3s ease-out;
}

.board {
  position: absolute;
  bottom: 80px;
  left: 50%;
  width: 800px;
  height: 20px;
  background: linear-gradient(to right, #34495e, #2c3e50);
  transform: translate(-50%, 0);
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
  width: 40px;
  height: 80px;
  background: linear-gradient(to bottom, #7f8c8d, #95a5a6);
  transform: translateX(-50%);
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}
</style> 