<template>
  <span
    class="creepee-avatar"
    :data-creepee-action="normalizedAction"
    aria-hidden="true"
  >
    <canvas
      ref="canvasRef"
      class="creepee-avatar-canvas"
      data-testid="creepee-avatar-canvas"
      width="120"
      height="120"
      :data-creepee-action="normalizedAction"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type CreepeeAction = 'idle' | 'charge' | 'wave'
type SpritePart = 'U' | 'L' | 'R' | 'C'

interface SpriteCell {
  x: number
  y: number
  v: string
}

type SpriteParts = Record<SpritePart, SpriteCell[]>

const props = withDefaults(defineProps<{
  action?: CreepeeAction
}>(), {
  action: 'idle'
})

const CREEPEE_SPRITE = Object.freeze({
  G: 40,
  cx: 19.37,
  cy: 23.48,
  g: [
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000330000000000000000000000',
    '0000000000000000123000030000000000000000',
    '0000000000000001231003310000000000000000',
    '0000000000000011321031110000000000000000',
    '0000000000000021101011110000000000000000',
    '0000000000000021111011110000000000000000',
    '0000000000000011111011110000000000000000',
    '0000000000000011111011110000000000000000',
    '0000000000000021111011110000000000000000',
    '0000000000000021111011110000000000000000',
    '0000000000000021111011110000000000000000',
    '0000000000000021111011130000000000000000',
    '0000000000000031111011113300000000000000',
    '0000000000003311112021111100000000000000',
    '0000000000033111120002111100000000000000',
    '0000000000011112000300021100000000000000',
    '0000000000011110033133021100000000000000',
    '0000000000011110011111021130000000000000',
    '0000000000311110011111021113300000000000',
    '0000000003111110011111021111130000000000',
    '0000000331111120021112001111111300000000',
    '0000003111112003000200000211111130000000',
    '0000011111200331330003330022111111300000',
    '0000002112003111113331113300211111100000',
    '0000000000331111111111111230002111100000',
    '0000000003111111111111121313300211100000',
    '0000000311111111200211211111133002100000',
    '0000000111111112000020002111111300200000',
    '0000022211111200000000000021111133000000',
    '0000002311112000000000000002111121000000',
    '0000000111200000000000000000021132120000',
    '0000000120000000000000000000000210200000',
    '0000000200000000000000000000000020000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000'
  ],
  p: [
    '........................................',
    '........................................',
    '........................................',
    '........................................',
    '........................................',
    '................UU......................',
    '................UUU....U................',
    '...............UUUU..UUU................',
    '..............UUUUU.UUUU................',
    '..............UUU.U.UUUU................',
    '..............UUUUU.UUUU................',
    '..............UUUUU.UUUU................',
    '..............UUUUU.UUUU................',
    '..............UUUUU.UUUU................',
    '..............UUUUU.UUUU................',
    '..............UUUUU.UUUU................',
    '..............UUUUU.UUUU................',
    '..............UUUUU.UUUUUU..............',
    '............UUUUUUU.UUUUUU..............',
    '...........LUUUUUU...UUUUU..............',
    '...........LLLUU...C...UUR..............',
    '...........LLLL..CCCCC.RRR..............',
    '...........LLLL..CCCCC.CRRR.............',
    '..........LLLLL..CCCCC.CRRRRR...........',
    '.........LLLLLL..CCCCC.CRRRRRR..........',
    '.......LLLLLLLL..CCCCC..RRRRRRRR........',
    '......LLLLLLL..L...C.....RRRRRRRR.......',
    '.....LLLLLL..LLLLL...RRR..RRRRRRRRR.....',
    '......LLLL..LLLLLLLRRRRRRR..RRRRRRR.....',
    '..........LLLLLLLLLRRRRRRRR...RRRRR.....',
    '.........LLLLLLLLLLRRRRRRRRRR..RRRR.....',
    '.......LLLLLLLLLL..RRRRRRRRRRRR..RR.....',
    '.......LLLLLLLLL....R...RRRRRRRR..R.....',
    '.....LLLLLLLLL............RRRRRRRR......',
    '......LLLLLLL..............RRRRRRR......',
    '.......LLLL..................RRRRRRR....',
    '.......LL......................RR.R.....',
    '.......L........................R.......',
    '........................................',
    '........................................'
  ]
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const normalizedAction = computed<CreepeeAction>(() => {
  return props.action === 'charge' || props.action === 'wave' ? props.action : 'idle'
})

let spriteParts: SpriteParts | null = null
let animationFrameId = 0
let frame = 0

function getCreepeeSpriteParts(): SpriteParts {
  if (spriteParts) return spriteParts

  const parts: SpriteParts = { U: [], L: [], R: [], C: [] }
  for (let y = 0; y < CREEPEE_SPRITE.G; y += 1) {
    for (let x = 0; x < CREEPEE_SPRITE.G; x += 1) {
      const value = CREEPEE_SPRITE.g[y][x]
      if (value === '0') continue
      const part = CREEPEE_SPRITE.p[y][x]
      if (part === 'U' || part === 'L' || part === 'R' || part === 'C') {
        parts[part].push({ x, y, v: value })
      }
    }
  }
  spriteParts = parts
  return parts
}

function mixCreepeeColor(a: string, b: string, amount: number) {
  const pa = Number.parseInt(a.slice(1), 16)
  const pb = Number.parseInt(b.slice(1), 16)
  const ar = (pa >> 16) & 255
  const ag = (pa >> 8) & 255
  const ab = pa & 255
  const br = (pb >> 16) & 255
  const bg = (pb >> 8) & 255
  const bb = pb & 255
  const rr = Math.round(ar + (br - ar) * amount)
  const rg = Math.round(ag + (bg - ag) * amount)
  const rb = Math.round(ab + (bb - ab) * amount)
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  try {
    return canvas.getContext('2d')
  } catch {
    return null
  }
}

function colorForCell(cell: SpriteCell, glow: number) {
  const palette: Record<string, string> = { '1': '#e8643c', '2': '#963a1e', '3': '#f6906a' }
  const base = palette[cell.v] || palette['1']
  return glow > 0 ? mixCreepeeColor(base, '#fff1e6', glow) : base
}

function drawCreepeeFrame() {
  const canvas = canvasRef.value
  if (!canvas) return
  const maybeContext = getCanvasContext(canvas)
  if (!maybeContext) return
  const context: CanvasRenderingContext2D = maybeContext

  const width = 120
  const height = 120
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const parts = getCreepeeSpriteParts()
  const px = Math.max(1, Math.floor(Math.min(width, height) / 48))
  const spriteWidth = CREEPEE_SPRITE.G * px
  const phase = frame
  const action = normalizedAction.value
  const charge = action === 'charge'
  const wave = action === 'wave'
  const glow = charge ? Math.pow(Math.sin(phase * 0.25) * 0.5 + 0.5, 1.6) : 0
  const bob = charge
    ? -glow * 0.45 + Math.sin(phase * 0.12) * 0.25
    : Math.sin(phase * 0.045) * (wave ? 0.55 : 0.42)
  const blink = !charge ? (phase % 150 < 10 ? Math.sin(((phase % 150) / 10) * Math.PI) : 0) : 0
  const eyeX = wave ? 0.55 : Math.sin(phase * 0.02)
  const waveRot = wave ? Math.sin(phase * 0.16) * 0.34 : 0
  const shakeX = charge ? (Math.random() * 2 - 1) * glow * 0.9 : 0
  const shakeY = charge ? (Math.random() * 2 - 1) * glow * 0.6 : 0

  function drawCell(cell: SpriteCell, cellGlow: number) {
    context.fillStyle = colorForCell(cell, cellGlow)
    context.fillRect(cell.x * px, cell.y * px, px, px)
  }

  function drawPart(cells: SpriteCell[], cellGlow: number, transform: { rot?: number, px?: number, py?: number } = {}) {
    context.save()
    const pivotX = transform.px || 0
    const pivotY = transform.py || 0
    context.translate(pivotX * px, pivotY * px)
    if (transform.rot) context.rotate(transform.rot)
    context.translate(-pivotX * px, -pivotY * px)
    cells.forEach((cell) => drawCell(cell, cellGlow))
    context.restore()
  }

  function drawFace(faceGlow: number, faceBlink: number, faceEyeX: number) {
    const cx = 19.5 + faceEyeX * 0.35
    const cy = 23.6
    const eye = faceGlow > 0 ? '#9c4527' : '#3a1d12'
    const shine = faceGlow > 0 ? '#fff1e6' : '#ffd0a8'
    context.fillStyle = faceGlow > 0 ? mixCreepeeColor('#e8643c', '#fff1e6', faceGlow) : '#e8643c'
    context.fillRect(Math.round((cx - 2.2) * px), Math.round((cy - 1.5) * px), Math.round(4.4 * px), Math.round(4.1 * px))
    context.fillStyle = eye
    if (faceBlink > 0.55) {
      context.fillRect(Math.round((cx - 1.55) * px), Math.round((cy - 0.05) * px), Math.round(1.25 * px), Math.max(1, Math.round(0.35 * px)))
      context.fillRect(Math.round((cx + 0.42) * px), Math.round((cy - 0.05) * px), Math.round(1.25 * px), Math.max(1, Math.round(0.35 * px)))
    } else {
      context.fillRect(Math.round((cx - 1.52) * px), Math.round((cy - 0.7) * px), Math.round(0.95 * px), Math.round(1.3 * px))
      context.fillRect(Math.round((cx + 0.55) * px), Math.round((cy - 0.7) * px), Math.round(0.95 * px), Math.round(1.3 * px))
      context.fillStyle = shine
      context.fillRect(Math.round((cx - 1.32) * px), Math.round((cy - 0.5) * px), Math.max(1, Math.round(0.35 * px)), Math.max(1, Math.round(0.35 * px)))
      context.fillRect(Math.round((cx + 0.75) * px), Math.round((cy - 0.5) * px), Math.max(1, Math.round(0.35 * px)), Math.max(1, Math.round(0.35 * px)))
    }
    context.fillStyle = eye
    context.fillRect(Math.round((cx - 0.45) * px), Math.round((cy + 1.05) * px), Math.max(1, Math.round(0.35 * px)), Math.max(1, Math.round(0.35 * px)))
    context.fillRect(Math.round((cx - 0.05) * px), Math.round((cy + 1.25) * px), Math.max(1, Math.round(0.35 * px)), Math.max(1, Math.round(0.35 * px)))
    context.fillRect(Math.round((cx + 0.35) * px), Math.round((cy + 1.05) * px), Math.max(1, Math.round(0.35 * px)), Math.max(1, Math.round(0.35 * px)))
  }

  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false
  context.save()
  context.globalAlpha = 0.18
  context.fillStyle = '#000000'
  context.fillRect(Math.round((width - 25 * px) / 2), Math.round((height + spriteWidth) / 2 - 3 * px), Math.round(25 * px), Math.max(2, Math.round(1.2 * px)))
  context.restore()

  context.save()
  context.translate(Math.round((width - spriteWidth) / 2 + shakeX * px), Math.round((height - spriteWidth) / 2 + bob * px + shakeY * px))
  drawPart(parts.L, glow)
  drawPart(parts.R, glow, { rot: waveRot, px: CREEPEE_SPRITE.cx, py: CREEPEE_SPRITE.cy })
  drawPart(parts.U, glow)
  drawPart(parts.C, glow)
  drawFace(glow, blink, eyeX)
  context.restore()

  frame += charge ? 1.15 : 1
  animationFrameId = window.requestAnimationFrame(drawCreepeeFrame)
}

function startAnimation() {
  if (import.meta.env.MODE === 'test' || animationFrameId) return
  drawCreepeeFrame()
}

function stopAnimation() {
  if (!animationFrameId) return
  window.cancelAnimationFrame(animationFrameId)
  animationFrameId = 0
}

watch(normalizedAction, (action) => {
  if (canvasRef.value) {
    canvasRef.value.dataset.creepeeAction = action
  }
})

onMounted(startAnimation)
onBeforeUnmount(stopAnimation)
</script>

<style scoped>
.creepee-avatar {
  display: inline-grid;
  place-items: center;
  width: var(--creepee-avatar-size, 1.25rem);
  height: var(--creepee-avatar-size, 1.25rem);
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 0.25rem;
  color: #e8643c;
  line-height: 0;
}

.creepee-avatar-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  pointer-events: none;
}
</style>
