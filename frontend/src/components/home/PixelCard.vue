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
      class="pixel-canvas"
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
  variant?: 'default' | 'blue' | 'yellow' | 'pink' | string
  className?: string
  gap?: number
  speed?: number
  colors?: string
  noFocus?: boolean
}>(), {
  as: 'div',
  variant: 'default',
  className: '',
})

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const pixels = ref<Pixel[]>([])
const active = ref(false)
const reducedMotion = ref(false)
let frame = 0
let previousTime = 0
let resizeObserver: ResizeObserver | null = null

const variants: Record<string, {
  activeColor: string | null
  gap: number
  speed: number
  colors: string
  noFocus: boolean
}> = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: '#f8fafc,#f1f5f9,#cbd5e1',
    noFocus: false,
  },
  blue: {
    activeColor: '#e0f2fe',
    gap: 10,
    speed: 25,
    colors: '#e0f2fe,#7dd3fc,#0ea5e9',
    noFocus: false,
  },
  yellow: {
    activeColor: '#fef08a',
    gap: 3,
    speed: 20,
    colors: '#fef08a,#fde047,#eab308',
    noFocus: false,
  },
  pink: {
    activeColor: '#fecdd3',
    gap: 6,
    speed: 80,
    colors: '#fecdd3,#fda4af,#e11d48',
    noFocus: true,
  },
}

const variantConfig = computed(() => variants[props.variant] || variants.default)
const finalGap = computed(() => props.gap ?? variantConfig.value.gap)
const finalSpeed = computed(() => props.speed ?? variantConfig.value.speed)
const finalColors = computed(() => props.colors ?? variantConfig.value.colors)
const finalNoFocus = computed(() => props.noFocus ?? variantConfig.value.noFocus)

const effectiveSpeed = computed(() => {
  if (reducedMotion.value) return 0
  return Math.max(0, Math.min(100, finalSpeed.value)) * 0.001
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
    sizeStep: Math.random() * 0.4,
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

  const palette = finalColors.value.split(',').map((color) => color.trim()).filter(Boolean)
  const nextPixels: Pixel[] = []
  const gap = Math.max(1, parseInt(String(finalGap.value), 10))
  for (let x = 0; x < width; x += gap) {
    for (let y = 0; y < height; y += gap) {
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
  if (finalNoFocus.value || event.currentTarget === event.relatedTarget) return
  startAnimation('appear')
}

function handleBlur(event: FocusEvent) {
  if (finalNoFocus.value || event.currentTarget === event.relatedTarget) return
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

watch(() => [props.gap, props.speed, props.colors, props.variant], initPixels)
</script>

<style scoped>
.pixel-card {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  isolation: isolate;
  width: 300px;
  height: 400px;
  aspect-ratio: 4 / 5;
  border: 1px solid #27272a;
  border-radius: 25px;
  user-select: none;
  transition: border-color 200ms cubic-bezier(0.5, 1, 0.89, 1);
}

.pixel-card::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  aspect-ratio: 1;
  background: radial-gradient(circle, #09090b, transparent 85%);
  opacity: 0;
  transition: opacity 800ms cubic-bezier(0.5, 1, 0.89, 1);
  pointer-events: none;
}

.pixel-card:hover::before,
.pixel-card:focus-within::before {
  opacity: 1;
}

.pixel-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.pixel-card-content {
  position: relative;
  z-index: 2;
  display: contents;
}

.pixel-card-content :slotted(*) {
  position: relative;
  z-index: 2;
}

.pixel-card-reduced-motion .pixel-canvas {
  display: none;
}
</style>
