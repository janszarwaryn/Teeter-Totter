<template>
  <div class="app">
    <div class="game-container">
      <GameBoard />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameBoard from '@/components/organisms/GameBoard.vue';
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

body {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.game-container {
  width: 1200px;
  height: 800px;
  min-width: 1000px;
  min-height: 700px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-sizing: border-box;
}
</style>
