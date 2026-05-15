<template>
  <div :class="backgroundClass" aria-hidden="true">
    <canvas ref="canvasRef" class="guizang-site-background__canvas"></canvas>
    <div class="guizang-site-background__grid"></div>
    <div class="guizang-site-background__dots"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  tone?: 'deep' | 'light'
}>(), {
  tone: 'deep'
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDarkMode = ref(false)
const backgroundClass = computed(() => [
  'guizang-site-background',
  `guizang-site-background--${props.tone}`
])
const inkColor = computed(() => {
  if (props.tone === 'light') {
    return isDarkMode.value ? '255,255,255' : '0,47,167'
  }
  return '255,255,255'
})

function drawGuizangField(canvas: HTMLCanvasElement, time: number, ink: string) {
  const rect = canvas.getBoundingClientRect()
  if (rect.width < 4 || rect.height < 4) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.round(rect.width * dpr)
  const height = Math.round(rect.height * dpr)

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const context = canvas.getContext('2d')
  if (!context) return

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  const compact = rect.width < 760
  const cell = compact ? 13 : 16
  const fontSize = compact ? 10 : 13
  const columns = Math.ceil(rect.width / cell)
  const rows = Math.ceil(rect.height / cell)
  const chars = "   ...:::---+++***ooo0011"

  context.font = `500 ${fontSize}px "JetBrains Mono", "DM Mono", ui-monospace, monospace`
  context.textBaseline = 'top'

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const radial = Math.hypot(column - columns * 0.54, row - rows * 0.48)
      const wave =
        Math.sin(column * 0.18 + time) +
        Math.sin(row * 0.25 - time * 0.78) +
        Math.sin((column + row) * 0.11 + time * 0.42) +
        Math.sin(radial * 0.16 - time * 0.62)
      const value = (wave / 4 + 1) / 2

      if (value < 0.23) continue

      const index = Math.min(chars.length - 1, Math.floor(value * chars.length))
      const char = chars[index]
      if (char === ' ') continue

      const pulse = 0.72 + Math.sin(time * 1.8 + column * 0.08) * 0.12
      const alpha = Math.max(0, Math.min(0.62, 0.07 + (value - 0.22) * pulse))
      context.fillStyle = `rgba(${ink},${alpha.toFixed(3)})`
      context.fillText(char, column * cell, row * cell)

      if (value > 0.78 && (row + column) % 5 === 0) {
        context.fillStyle = `rgba(${ink},${(alpha * 0.38).toFixed(3)})`
        context.fillRect(column * cell + cell * 0.64, row * cell + cell * 0.36, 2, 2)
      }
    }
  }
}

let frameId = 0
let resizeFrameId = 0
let start = 0
let themeObserver: MutationObserver | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  updateThemeMode()
  themeObserver = new MutationObserver(updateThemeMode)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  start = performance.now()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const render = (now: number) => {
    if (!document.hidden) {
      drawGuizangField(canvas, ((now - start) / 1000) * 0.58, inkColor.value)
    }
    frameId = requestAnimationFrame(render)
  }

  if (reduceMotion) {
    drawGuizangField(canvas, 1.8, inkColor.value)
  } else {
    frameId = requestAnimationFrame(render)
  }

  window.addEventListener('resize', handleResize, { passive: true })
})

onBeforeUnmount(() => {
  if (frameId) cancelAnimationFrame(frameId)
  if (resizeFrameId) cancelAnimationFrame(resizeFrameId)
  themeObserver?.disconnect()
  window.removeEventListener('resize', handleResize)
})

watch(inkColor, () => {
  const canvas = canvasRef.value
  if (!canvas) return
  drawGuizangField(canvas, 1.8, inkColor.value)
})

function updateThemeMode() {
  isDarkMode.value = document.documentElement.classList.contains('dark')
}

function handleResize() {
  const canvas = canvasRef.value
  if (!canvas) return

  if (resizeFrameId) cancelAnimationFrame(resizeFrameId)
  resizeFrameId = requestAnimationFrame(() => {
    drawGuizangField(canvas, 1.8, inkColor.value)
  })
}
</script>
