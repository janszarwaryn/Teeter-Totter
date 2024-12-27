<template>
  <button 
    :class="[
      'game-button',
      variant,
      { disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

defineProps<Props>();
defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style scoped>
.game-button {
  padding: 10px 20px;
  font-size: 1em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.game-button:active {
  transform: translateY(1px);
}

.game-button.primary {
  background: #2ecc71;
  color: white;
}

.game-button.primary:hover {
  background: #27ae60;
}

.game-button.secondary {
  background: #3498db;
  color: white;
}

.game-button.secondary:hover {
  background: #2980b9;
}

.game-button.danger {
  background: #e74c3c;
  color: white;
}

.game-button.danger:hover {
  background: #c0392b;
}

.game-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-button.disabled:hover {
  transform: none;
}
</style> 