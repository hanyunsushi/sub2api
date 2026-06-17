<template>
  <component
    :is="as"
    ref="containerRef"
    class="pixel-card"
    :class="[
      className,
      active ? 'pixel-card-active' : '',
      reducedMotion ? 'pixel-card-reduced-motion' : '',
    ]"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
    @focusin="handleFocus"
    @focusout="handleBlur"
  >
    <canvas
      ref="canvasRef"
      class="pixel-card-canvas"
      aria-hidden="true"
    />
    <span class="pixel-card-content">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Pixel {
  x: number
  y: number
  color: string
  speed: number
  delay: number
  counter: number
  counterStep: number
  size: number
  sizeStep: number
  minSize: number
  maxSize: number
  isIdle: boolean
  isReverse: boolean
  isShimmer: boolean
}

const props = withDefaults(defineProps<{
  as?: string
  className?: string
  gap?: number
  speed?: number
  colors?: string
  noFocus?: boolean
}>(), {
  as: 'div',
  className: '',
  gap: 7,
  speed: 42,
  colors: 'rgba(255,250,240,0.82),rgba(245,191,93,0.58),rgba(157,169,182,0.54)',
  noFocus: false,
})

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const pixels = ref<Pixel[]>([])
const active = ref(false)
const reducedMotion = ref(false)
let frame = 0
let previousTime = 0
let resizeObserver: ResizeObserver | null = null

const effectiveSpeed = computed(() => {
  if (reducedMotion.value) return 0
  return Math.max(0, Math.min(100, props.speed)) * 0.001
})

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function buildPixel(x: number, y: number, color: string, delay: number): Pixel {
  return {
    x,
    y,
    color,
    speed: randomBetween(0.1, 0.9) * effectiveSpeed.value,
    delay,
    counter: 0,
    counterStep: Math.random() * 4 + 4,
    size: 0,
    sizeStep: Math.random() * 0.35 + 0.05,
    minSize: 0.5,
    maxSize: randomBetween(0.5, 2),
    isIdle: false,
    isReverse: false,
    isShimmer: false,
  }
}

function initPixels() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  const rect = container.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))
  const context = canvas.getContext('2d')
  if (!context) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  const palette = props.colors.split(',').map((color) => color.trim()).filter(Boolean)
  const nextPixels: Pixel[] = []
  for (let x = 0; x < width; x += props.gap) {
    for (let y = 0; y < height; y += props.gap) {
      const dx = x - width / 2
      const dy = y - height / 2
      const distance = Math.sqrt(dx * dx + dy * dy)
      nextPixels.push(buildPixel(
        x,
        y,
        palette[Math.floor(Math.random() * palette.length)] || '#fffaf0',
        reducedMotion.value ? 0 : distance,
      ))
    }
  }
  pixels.value = nextPixels
}

function drawPixel(context: CanvasRenderingContext2D, pixel: Pixel) {
  const centerOffset = 1 - pixel.size * 0.5
  context.fillStyle = pixel.color
  context.fillRect(pixel.x + centerOffset, pixel.y + centerOffset, pixel.size, pixel.size)
}

function appear(pixel: Pixel, context: CanvasRenderingContext2D) {
  pixel.isIdle = false
  if (pixel.counter <= pixel.delay) {
    pixel.counter += pixel.counterStep
    return
  }
  if (pixel.size >= pixel.maxSize) {
    pixel.isShimmer = true
  }
  if (pixel.isShimmer) {
    if (pixel.size >= pixel.maxSize) pixel.isReverse = true
    if (pixel.size <= pixel.minSize) pixel.isReverse = false
    pixel.size += pixel.isReverse ? -pixel.speed : pixel.speed
  } else {
    pixel.size += pixel.sizeStep
  }
  drawPixel(context, pixel)
}

function disappear(pixel: Pixel, context: CanvasRenderingContext2D) {
  pixel.isShimmer = false
  pixel.counter = 0
  if (pixel.size <= 0) {
    pixel.isIdle = true
    return
  }
  pixel.size -= 0.1
  drawPixel(context, pixel)
}

function animate(mode: 'appear' | 'disappear') {
  frame = window.requestAnimationFrame(() => animate(mode))
  const now = performance.now()
  const interval = 1000 / 60
  if (now - previousTime < interval) return
  previousTime = now - ((now - previousTime) % interval)

  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return

  context.clearRect(0, 0, canvas.width, canvas.height)
  let allIdle = true
  for (const pixel of pixels.value) {
    if (mode === 'appear') {
      appear(pixel, context)
    } else {
      disappear(pixel, context)
    }
    if (!pixel.isIdle) allIdle = false
  }
  if (allIdle) {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
}

function startAnimation(mode: 'appear' | 'disappear') {
  if (reducedMotion.value) return
  if (frame) window.cancelAnimationFrame(frame)
  active.value = mode === 'appear'
  previousTime = performance.now()
  frame = window.requestAnimationFrame(() => animate(mode))
}

function handleEnter() {
  startAnimation('appear')
}

function handleLeave() {
  startAnimation('disappear')
}

function handleFocus(event: FocusEvent) {
  if (props.noFocus || event.currentTarget === event.relatedTarget) return
  startAnimation('appear')
}

function handleBlur(event: FocusEvent) {
  if (props.noFocus || event.currentTarget === event.relatedTarget) return
  startAnimation('disappear')
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  initPixels()
  resizeObserver = new ResizeObserver(initPixels)
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (frame) window.cancelAnimationFrame(frame)
})

watch(() => [props.gap, props.speed, props.colors], initPixels)
</script>

<style scoped>
.pixel-card {
  position: relative;
  overflow: hidden;
}

.pixel-card-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  opacity: 0.72;
  pointer-events: none;
  transition: opacity 220ms var(--atelier-ease, ease);
}

.pixel-card-content {
  position: relative;
  z-index: 2;
  display: contents;
}

.pixel-card:not(.pixel-card-active) .pixel-card-canvas {
  opacity: 0.4;
}

.pixel-card-reduced-motion .pixel-card-canvas {
  display: none;
}
</style>
