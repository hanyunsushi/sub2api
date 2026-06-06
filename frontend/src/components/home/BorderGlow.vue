<template>
  <div
    ref="cardRef"
    class="border-glow-card"
    :style="cardStyle"
    @pointermove="handlePointerMove"
  >
    <span class="edge-light" aria-hidden="true"></span>
    <div class="border-glow-inner">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'

type GlowStyle = CSSProperties & Record<`--${string}`, string | number>

interface AnimateOptions {
  start?: number
  end?: number
  duration?: number
  delay?: number
  ease?: (value: number) => number
  onUpdate: (value: number) => void
  onEnd?: () => void
}

const props = withDefaults(defineProps<{
  edgeSensitivity?: number
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  animated?: boolean
  colors?: string[]
  fillOpacity?: number
}>(), {
  edgeSensitivity: 30,
  glowColor: '40 80 80',
  backgroundColor: '#120F17',
  borderRadius: 28,
  glowRadius: 40,
  glowIntensity: 1,
  coneSpread: 25,
  animated: false,
  colors: () => ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity: 0.5,
})

const gradientPositions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const gradientKeys = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'] as const
const colorMap = [0, 1, 2, 0, 1, 2, 1]

const cardRef = ref<HTMLElement | null>(null)
let reduceMotion = false
let animationFrameIds: number[] = []
let animationTimeoutIds: number[] = []

function parseHSL(hslStr: string) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 40, s: 80, l: 80 }
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) }
}

function buildGlowVars(glowColor: string, intensity: number): GlowStyle {
  const { h, s, l } = parseHSL(glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
  const vars: GlowStyle = {}

  opacities.forEach((opacity, index) => {
    vars[`--glow-color${keys[index]}`] = `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`
  })

  return vars
}

function buildGradientVars(colors: string[]): GlowStyle {
  const safeColors = colors.length ? colors : ['#c084fc', '#f472b6', '#38bdf8']
  const vars: GlowStyle = {}

  gradientKeys.forEach((key, index) => {
    const colorIndex = Math.min(colorMap[index], safeColors.length - 1)
    vars[key] = `radial-gradient(at ${gradientPositions[index]}, ${safeColors[colorIndex]} 0px, transparent 50%)`
  })
  vars['--gradient-base'] = `linear-gradient(${safeColors[0]} 0 100%)`

  return vars
}

const cardStyle = computed<GlowStyle>(() => ({
  '--card-bg': props.backgroundColor,
  '--edge-sensitivity': props.edgeSensitivity,
  '--border-radius': `${props.borderRadius}px`,
  '--glow-padding': `${props.glowRadius}px`,
  '--cone-spread': props.coneSpread,
  '--fill-opacity': props.fillOpacity,
  ...buildGlowVars(props.glowColor, props.glowIntensity),
  ...buildGradientVars(props.colors),
}))

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3)
}

function easeInCubic(x: number) {
  return x * x * x
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateOptions) {
  const t0 = performance.now() + delay

  function tick() {
    const elapsed = performance.now() - t0
    const t = Math.min(elapsed / duration, 1)
    onUpdate(start + (end - start) * ease(t))

    if (t < 1) {
      animationFrameIds.push(window.requestAnimationFrame(tick))
    } else {
      onEnd?.()
    }
  }

  const timeoutId = window.setTimeout(() => {
    animationFrameIds.push(window.requestAnimationFrame(tick))
  }, delay)

  animationTimeoutIds.push(timeoutId)
}

function getCenterOfElement(el: HTMLElement) {
  const { width, height } = el.getBoundingClientRect()
  return [width / 2, height / 2] as const
}

function getEdgeProximity(el: HTMLElement, x: number, y: number) {
  const [cx, cy] = getCenterOfElement(el)
  const dx = x - cx
  const dy = y - cy
  let kx = Infinity
  let ky = Infinity

  if (dx !== 0) kx = cx / Math.abs(dx)
  if (dy !== 0) ky = cy / Math.abs(dy)

  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
}

function getCursorAngle(el: HTMLElement, x: number, y: number) {
  const [cx, cy] = getCenterOfElement(el)
  const dx = x - cx
  const dy = y - cy
  if (dx === 0 && dy === 0) return 0

  const radians = Math.atan2(dy, dx)
  let degrees = radians * (180 / Math.PI) + 90
  if (degrees < 0) degrees += 360

  return degrees
}

function handlePointerMove(event: PointerEvent) {
  const card = cardRef.value
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const edge = getEdgeProximity(card, x, y)
  const angle = getCursorAngle(card, x, y)

  card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`)
  card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
}

function startSweep() {
  const card = cardRef.value
  if (!card || reduceMotion) return

  const angleStart = 110
  const angleEnd = 465
  card.classList.add('sweep-active')
  card.style.setProperty('--cursor-angle', `${angleStart}deg`)

  animateValue({
    duration: 500,
    onUpdate: (value) => card.style.setProperty('--edge-proximity', `${value}`),
  })
  animateValue({
    ease: easeInCubic,
    duration: 1500,
    end: 50,
    onUpdate: (value) => {
      card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`)
    },
  })
  animateValue({
    ease: easeOutCubic,
    delay: 1500,
    duration: 2250,
    start: 50,
    end: 100,
    onUpdate: (value) => {
      card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`)
    },
  })
  animateValue({
    ease: easeInCubic,
    delay: 2500,
    duration: 1500,
    start: 100,
    end: 0,
    onUpdate: (value) => card.style.setProperty('--edge-proximity', `${value}`),
    onEnd: () => card.classList.remove('sweep-active'),
  })
}

function clearAnimations() {
  animationFrameIds.forEach((id) => window.cancelAnimationFrame(id))
  animationTimeoutIds.forEach((id) => window.clearTimeout(id))
  animationFrameIds = []
  animationTimeoutIds = []
}

onMounted(() => {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (props.animated) startSweep()
})

onBeforeUnmount(clearAnimations)
</script>

<style scoped>
.border-glow-card {
  --edge-proximity: 0;
  --cursor-angle: 45deg;
  --edge-sensitivity: 30;
  --color-sensitivity: calc(var(--edge-sensitivity) + 20);
  --border-radius: 28px;
  --glow-padding: 40px;
  --cone-spread: 25;

  position: relative;
  display: grid;
  overflow: visible;
  isolation: isolate;
  width: max-content;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: var(--border-radius);
  background: var(--card-bg, #120F17);
  transform: translate3d(0, 0, 0.01px);
  box-shadow:
    rgba(0, 0, 0, 0.1) 0 1px 2px,
    rgba(0, 0, 0, 0.1) 0 2px 4px,
    rgba(0, 0, 0, 0.1) 0 4px 8px,
    rgba(0, 0, 0, 0.1) 0 8px 16px,
    rgba(0, 0, 0, 0.1) 0 16px 32px,
    rgba(0, 0, 0, 0.1) 0 32px 64px;
}

.border-glow-card::before,
.border-glow-card::after,
.border-glow-card > .edge-light {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transition: opacity 0.25s ease-out;
  z-index: -1;
}

.border-glow-card:not(:hover):not(.sweep-active)::before,
.border-glow-card:not(:hover):not(.sweep-active)::after,
.border-glow-card:not(:hover):not(.sweep-active) > .edge-light {
  opacity: 0;
  transition: opacity 0.75s ease-in-out;
}

/* colored mesh-gradient border */
.border-glow-card::before {
  border: 1px solid transparent;
  background:
    linear-gradient(var(--card-bg, #120F17) 0 100%) padding-box,
    linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box,
    var(--gradient-one, radial-gradient(at 80% 55%, hsl(268deg 100% 76%) 0px, transparent 50%)) border-box,
    var(--gradient-two, radial-gradient(at 69% 34%, hsl(349deg 100% 74%) 0px, transparent 50%)) border-box,
    var(--gradient-three, radial-gradient(at 8% 6%, hsl(136deg 100% 78%) 0px, transparent 50%)) border-box,
    var(--gradient-four, radial-gradient(at 41% 38%, hsl(192deg 100% 64%) 0px, transparent 50%)) border-box,
    var(--gradient-five, radial-gradient(at 86% 85%, hsl(186deg 100% 74%) 0px, transparent 50%)) border-box,
    var(--gradient-six, radial-gradient(at 82% 18%, hsl(52deg 100% 65%) 0px, transparent 50%)) border-box,
    var(--gradient-seven, radial-gradient(at 51% 4%, hsl(12deg 100% 72%) 0px, transparent 50%)) border-box,
    var(--gradient-base, linear-gradient(#c299ff 0 100%)) border-box;

  opacity: calc((var(--edge-proximity) - var(--color-sensitivity)) / (100 - var(--color-sensitivity)));

  mask-image:
    conic-gradient(
      from var(--cursor-angle) at center,
      black calc(var(--cone-spread) * 1%),
      transparent calc((var(--cone-spread) + 15) * 1%),
      transparent calc((100 - var(--cone-spread) - 15) * 1%),
      black calc((100 - var(--cone-spread)) * 1%)
    );
}

/* colored mesh-gradient background fill near edges */
.border-glow-card::after {
  border: 1px solid transparent;
  background:
    var(--gradient-one, radial-gradient(at 80% 55%, hsl(268deg 100% 76%) 0px, transparent 50%)) padding-box,
    var(--gradient-two, radial-gradient(at 69% 34%, hsl(349deg 100% 74%) 0px, transparent 50%)) padding-box,
    var(--gradient-three, radial-gradient(at 8% 6%, hsl(136deg 100% 78%) 0px, transparent 50%)) padding-box,
    var(--gradient-four, radial-gradient(at 41% 38%, hsl(192deg 100% 64%) 0px, transparent 50%)) padding-box,
    var(--gradient-five, radial-gradient(at 86% 85%, hsl(186deg 100% 74%) 0px, transparent 50%)) padding-box,
    var(--gradient-six, radial-gradient(at 82% 18%, hsl(52deg 100% 65%) 0px, transparent 50%)) padding-box,
    var(--gradient-seven, radial-gradient(at 51% 4%, hsl(12deg 100% 72%) 0px, transparent 50%)) padding-box,
    var(--gradient-base, linear-gradient(#c299ff 0 100%)) padding-box;

  mask-image:
    linear-gradient(to bottom, black, black),
    radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
    radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
    radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
    radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
    radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
    conic-gradient(from var(--cursor-angle) at center, transparent 5%, black 15%, black 85%, transparent 95%);

  mask-composite: subtract, add, add, add, add, add;
  opacity: calc(var(--fill-opacity, 0.5) * (var(--edge-proximity) - var(--color-sensitivity)) / (100 - var(--color-sensitivity)));
  mix-blend-mode: soft-light;
}

/* outer glow layer */
.border-glow-card > .edge-light {
  inset: calc(var(--glow-padding) * -1);
  z-index: 1;
  pointer-events: none;
  mask-image:
    conic-gradient(
      from var(--cursor-angle) at center,
      black 2.5%,
      transparent 10%,
      transparent 90%,
      black 97.5%
    );
  opacity: calc((var(--edge-proximity) - var(--edge-sensitivity)) / (100 - var(--edge-sensitivity)));
  mix-blend-mode: plus-lighter;
}

.border-glow-card > .edge-light::before {
  content: "";
  position: absolute;
  inset: var(--glow-padding);
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px var(--glow-color, hsl(40deg 80% 80% / 100%)),
    inset 0 0 1px 0 var(--glow-color-60, hsl(40deg 80% 80% / 60%)),
    inset 0 0 3px 0 var(--glow-color-50, hsl(40deg 80% 80% / 50%)),
    inset 0 0 6px 0 var(--glow-color-40, hsl(40deg 80% 80% / 40%)),
    inset 0 0 15px 0 var(--glow-color-30, hsl(40deg 80% 80% / 30%)),
    inset 0 0 25px 2px var(--glow-color-20, hsl(40deg 80% 80% / 20%)),
    inset 0 0 50px 2px var(--glow-color-10, hsl(40deg 80% 80% / 10%)),
    0 0 1px 0 var(--glow-color-60, hsl(40deg 80% 80% / 60%)),
    0 0 3px 0 var(--glow-color-50, hsl(40deg 80% 80% / 50%)),
    0 0 6px 0 var(--glow-color-40, hsl(40deg 80% 80% / 40%)),
    0 0 15px 0 var(--glow-color-30, hsl(40deg 80% 80% / 30%)),
    0 0 25px 2px var(--glow-color-20, hsl(40deg 80% 80% / 20%)),
    0 0 50px 2px var(--glow-color-10, hsl(40deg 80% 80% / 10%));
}

.border-glow-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
</style>
