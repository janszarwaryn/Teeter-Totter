<template>
  <div class="app">
    <div class="game-container">
      <GameBoard />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameBoard from '@/components/organisms/GameBoard.vue';
console.log('App.vue mounted');
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  overflow: hidden;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
}

.game-container {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  padding: 20px;
}
</style>
