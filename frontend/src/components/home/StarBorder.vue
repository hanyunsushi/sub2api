<template>
  <component
    :is="as"
    class="star-border-container"
    :class="className"
    :style="containerStyle"
  >
    <div class="border-gradient-bottom" :style="gradientStyle" aria-hidden="true"></div>
    <div class="border-gradient-top" :style="gradientStyle" aria-hidden="true"></div>
    <div class="inner-content">
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  as?: string
  className?: string
  color?: string
  speed?: string
  thickness?: number
}>(), {
  as: 'button',
  className: '',
  color: 'white',
  speed: '6s',
  thickness: 1,
})

const containerStyle = computed<CSSProperties>(() => ({
  padding: `${props.thickness}px 0`,
}))

const gradientStyle = computed<CSSProperties>(() => ({
  background: `radial-gradient(circle, ${props.color}, transparent 10%)`,
  animationDuration: props.speed,
}))
</script>

<style scoped>
.star-border-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 0;
}

.border-gradient-bottom {
  position: absolute;
  z-index: 0;
  right: -250%;
  bottom: -12px;
  width: 300%;
  height: 50%;
  border-radius: 50%;
  opacity: 0.7;
  animation: star-movement-bottom linear infinite alternate;
}

.border-gradient-top {
  position: absolute;
  z-index: 0;
  top: -12px;
  left: -250%;
  width: 300%;
  height: 50%;
  border-radius: 50%;
  opacity: 0.7;
  animation: star-movement-top linear infinite alternate;
}

.inner-content {
  position: relative;
  z-index: 1;
  border-radius: 8px;
  background: transparent;
}

@keyframes star-movement-bottom {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }

  100% {
    transform: translate(-100%, 0%);
    opacity: 0;
  }
}

@keyframes star-movement-top {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }

  100% {
    transform: translate(100%, 0%);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .border-gradient-bottom,
  .border-gradient-top {
    animation: none;
  }
}
</style>
