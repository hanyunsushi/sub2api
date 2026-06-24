<template>
  <div ref="containerRef" class="electric-border" :style="rootStyle">
    <div class="eb-canvas-container">
      <canvas ref="canvasRef" class="eb-canvas" />
    </div>
    <div class="eb-layers">
      <div class="eb-glow-1" />
      <div class="eb-glow-2" />
      <div class="eb-background-glow" />
    </div>
    <div class="eb-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  color?: string
  speed?: number
  chaos?: number
  thickness?: number
  borderRadius?: number
}>(), {
  color: '#5227FF',
  speed: 1,
  chaos: 0.12,
  thickness: 2,
  borderRadius: 24
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let animationFrameId = 0
let timeValue = 0
let lastFrameTime = 0
let lastDpr = 1
let resizeObserver: ResizeObserver | null = null
let canvasSize = { width: 0, height: 0 }

const rootStyle = computed(() => ({
  '--electric-border-color': props.color,
  '--electric-border-thickness': `${props.thickness}px`,
  borderRadius: `${props.borderRadius}px`
}))

const canvasOutset = computed(() => Math.max(props.thickness * 3, 8))

const random = (x: number) => (Math.sin(x * 12.9898) * 43758.5453) % 1

const noise2D = (x: number, y: number) => {
  const i = Math.floor(x)
  const j = Math.floor(y)
  const fx = x - i
  const fy = y - j

  const a = random(i + j * 57)
  const b = random(i + 1 + j * 57)
  const c = random(i + (j + 1) * 57)
  const d = random(i + 1 + (j + 1) * 57)

  const ux = fx * fx * (3.0 - 2.0 * fx)
  const uy = fy * fy * (3.0 - 2.0 * fy)

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy
}

const octavedNoise = (
  x: number,
  octaves: number,
  lacunarity: number,
  gain: number,
  baseAmplitude: number,
  baseFrequency: number,
  time: number,
  seed: number,
  baseFlatness: number
) => {
  let y = 0
  let amplitude = baseAmplitude
  let frequency = baseFrequency

  for (let i = 0; i < octaves; i += 1) {
    let octaveAmplitude = amplitude
    if (i === 0) {
      octaveAmplitude *= baseFlatness
    }
    y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3)
    frequency *= lacunarity
    amplitude *= gain
  }

  return y
}

const getCornerPoint = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  arcLength: number,
  progress: number
) => {
  const angle = startAngle + progress * arcLength
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  }
}

const getRoundedRectPoint = (t: number, left: number, top: number, width: number, height: number, radius: number) => {
  const straightWidth = width - 2 * radius
  const straightHeight = height - 2 * radius
  const cornerArc = (Math.PI * radius) / 2
  const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc
  const distance = t * totalPerimeter

  let accumulated = 0

  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth
    return { x: left + radius + progress * straightWidth, y: top }
  }
  accumulated += straightWidth

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc
    return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress)
  }
  accumulated += cornerArc

  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight
    return { x: left + width, y: top + radius + progress * straightHeight }
  }
  accumulated += straightHeight

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc
    return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress)
  }
  accumulated += cornerArc

  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth
    return { x: left + width - radius - progress * straightWidth, y: top + height }
  }
  accumulated += straightWidth

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc
    return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress)
  }
  accumulated += cornerArc

  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight
    return { x: left, y: top + height - radius - progress * straightHeight }
  }

  accumulated += straightHeight
  const progress = (distance - accumulated) / cornerArc
  return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress)
}

const updateSize = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return canvasSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvasSize

  const borderOffset = canvasOutset.value
  const rect = container.getBoundingClientRect()
  const width = rect.width + borderOffset * 2
  const height = rect.height + borderOffset * 2
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.scale(dpr, dpr)

  canvasSize = { width, height }
  return canvasSize
}

const drawElectricBorder = (currentTime: number) => {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (dpr !== lastDpr) {
    lastDpr = dpr
    updateSize()
  }

  const deltaTime = lastFrameTime > 0 ? (currentTime - lastFrameTime) / 1000 : 0
  timeValue += deltaTime * props.speed
  lastFrameTime = currentTime

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.scale(dpr, dpr)

  const octaves = 10
  const lacunarity = 1.6
  const gain = 0.7
  const amplitude = props.chaos
  const frequency = 10
  const baseFlatness = 0
  const displacement = 60
  const borderOffset = canvasOutset.value
  const { width, height } = canvasSize

  const left = borderOffset
  const top = borderOffset
  const borderWidth = width - 2 * borderOffset
  const borderHeight = height - 2 * borderOffset
  if (borderWidth <= 0 || borderHeight <= 0) {
    animationFrameId = requestAnimationFrame(drawElectricBorder)
    return
  }

  const maxRadius = Math.min(borderWidth, borderHeight) / 2
  const radius = Math.min(props.borderRadius, maxRadius)
  const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius
  const sampleCount = Math.max(8, Math.floor(approximatePerimeter / 2))

  ctx.strokeStyle = props.color
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()

  for (let i = 0; i <= sampleCount; i += 1) {
    const progress = i / sampleCount
    const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius)
    const xNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, timeValue, 0, baseFlatness)
    const yNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, timeValue, 1, baseFlatness)
    const displacedX = point.x + xNoise * displacement
    const displacedY = point.y + yNoise * displacement

    if (i === 0) {
      ctx.moveTo(displacedX, displacedY)
    } else {
      ctx.lineTo(displacedX, displacedY)
    }
  }

  ctx.closePath()
  ctx.stroke()
  animationFrameId = requestAnimationFrame(drawElectricBorder)
}

const stopAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }
}

const startAnimation = () => {
  stopAnimation()
  lastDpr = Math.min(window.devicePixelRatio || 1, 2)
  lastFrameTime = 0
  updateSize()
  animationFrameId = requestAnimationFrame(drawElectricBorder)
}

onMounted(() => {
  startAnimation()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateSize()
    })
    resizeObserver.observe(containerRef.value)
  }
})

watch(() => [props.color, props.speed, props.chaos, props.thickness, props.borderRadius], () => {
  timeValue = 0
  startAnimation()
})

onBeforeUnmount(() => {
  stopAnimation()
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.electric-border {
  --electric-light-color: oklch(from var(--electric-border-color) l c h);
  position: relative;
  border-radius: inherit;
  overflow: visible;
  isolation: isolate;
}

.eb-canvas-container {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.eb-canvas {
  display: block;
}

.eb-content {
  position: relative;
  z-index: 1;
  border-radius: inherit;
}

.eb-layers {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
}

.eb-glow-1,
.eb-glow-2,
.eb-background-glow {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border-radius: inherit;
  pointer-events: none;
}

.eb-glow-1 {
  border: var(--electric-border-thickness) solid oklch(from var(--electric-border-color) l c h / 0.6);
  filter: blur(1px);
}

.eb-glow-2 {
  border: var(--electric-border-thickness) solid var(--electric-light-color);
  filter: blur(4px);
}

.eb-background-glow {
  z-index: -1;
  background: linear-gradient(-30deg, var(--electric-light-color), transparent, var(--electric-border-color));
  opacity: 0.3;
  filter: blur(32px);
  transform: scale(1.1);
}
</style>
