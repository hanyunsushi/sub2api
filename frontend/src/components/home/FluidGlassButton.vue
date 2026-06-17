<template>
  <component
    :is="as"
    ref="rootRef"
    class="fluid-glass-button"
    :class="[className, `fluid-glass-${mode}`]"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <canvas ref="canvasRef" class="fluid-glass-canvas" aria-hidden="true"></canvas>
    <span class="fluid-glass-refractor" aria-hidden="true"></span>
    <span class="fluid-glass-lens" aria-hidden="true"></span>
    <span class="fluid-glass-content">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl'

const vertex = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`

const fragment = `
precision mediump float;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uMode;

float lensShape(vec2 uv, vec2 p, float r) {
  float d = distance(uv, p);
  return smoothstep(r, r * 0.16, d);
}

float barShape(vec2 uv, vec2 p) {
  vec2 q = vec2((uv.x - p.x) * 1.2, (uv.y - 0.5) * 3.1);
  float d = length(q);
  return smoothstep(0.58, 0.14, d);
}

float cubeShape(vec2 uv, vec2 p) {
  vec2 q = abs(uv - p);
  float d = max(q.x, q.y);
  return smoothstep(0.46, 0.12, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = uPointer;
  float lensMask = lensShape(uv, p, 0.52);
  float barMask = barShape(uv, p);
  float cubeMask = cubeShape(uv, p);
  float glass = mix(lensMask, barMask, step(0.5, uMode));
  glass = mix(glass, cubeMask, step(1.5, uMode));
  float wave = sin((uv.x * 24.0) + (uv.y * 18.0) + uTime * 1.4) * 0.5 + 0.5;
  float ca = abs(sin((uv.x - p.x) * 12.0 + uTime * 0.7));
  vec3 base = vec3(1.0, 0.985, 0.94);
  vec3 blueEdge = vec3(0.56, 0.66, 0.82);
  vec3 warmEdge = vec3(0.98, 0.76, 0.48);
  float rim = smoothstep(0.08, 0.62, abs(uv.x - p.x) + abs(uv.y - p.y));
  vec3 color = mix(base, blueEdge, rim * 0.46);
  color = mix(color, warmEdge, ca * glass * 0.18);
  float alpha = 0.12 + glass * 0.38 + wave * 0.055;
  gl_FragColor = vec4(color, alpha);
}
`

const props = withDefaults(defineProps<{
  as?: string
  className?: string
  mode?: 'lens' | 'bar' | 'cube'
  lensProps?: Record<string, unknown>
  barProps?: Record<string, unknown>
  cubeProps?: Record<string, unknown>
}>(), {
  as: 'div',
  className: '',
  mode: 'lens',
  lensProps: () => ({}),
  barProps: () => ({}),
  cubeProps: () => ({}),
})

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let renderer: Renderer | null = null
let program: Program | null = null
let mesh: Mesh | null = null
let resizeObserver: ResizeObserver | null = null
let frame = 0
let startTime = 0
let reduceMotion = false

const modeProps = computed(() => {
  return props.mode === 'bar' ? props.barProps : props.mode === 'cube' ? props.cubeProps : props.lensProps
})

const modeNumber = computed(() => {
  return props.mode === 'bar' ? 1 : props.mode === 'cube' ? 2 : 0
})

function resize() {
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas || !renderer || !program) return

  const rect = root.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))
  renderer.setSize(width, height)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  program.uniforms.uResolution.value.set(width, height)
  renderFrame()
}

function renderFrame(time = 0) {
  if (!renderer || !mesh || !program) return
  program.uniforms.uTime.value = time
  renderer.render({ scene: mesh })
}

function loop() {
  if (reduceMotion) return
  renderFrame((performance.now() - startTime) / 1000)
  frame = requestAnimationFrame(loop)
}

function handlePointerMove(event: PointerEvent) {
  const root = rootRef.value
  if (!root || !program) return
  const rect = root.getBoundingClientRect()
  const x = (event.clientX - rect.left) / Math.max(1, rect.width)
  const y = 1 - ((event.clientY - rect.top) / Math.max(1, rect.height))
  program.uniforms.uPointer.value.set(x, y)
  root.style.setProperty('--fluid-glass-x', `${x * 100}%`)
  root.style.setProperty('--fluid-glass-y', `${(1 - y) * 100}%`)
  root.style.setProperty('--fluid-glass-tilt-x', `${(x - 0.5) * 10}deg`)
  root.style.setProperty('--fluid-glass-tilt-y', `${(0.5 - y) * 10}deg`)
}

function handlePointerLeave() {
  if (!program) return
  program.uniforms.uPointer.value.set(0.5, 0.5)
  rootRef.value?.style.setProperty('--fluid-glass-x', '50%')
  rootRef.value?.style.setProperty('--fluid-glass-y', '50%')
  rootRef.value?.style.setProperty('--fluid-glass-tilt-x', '0deg')
  rootRef.value?.style.setProperty('--fluid-glass-tilt-y', '0deg')
}

function destroy() {
  if (frame) {
    cancelAnimationFrame(frame)
    frame = 0
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', resize)
  program?.remove()
  renderer = null
  program = null
  mesh = null
}

onMounted(() => {
  const canvas = canvasRef.value
  const root = rootRef.value
  if (!canvas || !root) return
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  renderer = new Renderer({
    dpr: 1,
    canvas,
    alpha: true,
    depth: false,
    antialias: true,
  })

  const gl = renderer.gl
  const geometry = new Triangle(gl)
  program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uResolution: { value: new Vec2(1, 1) },
      uPointer: { value: new Vec2(0.5, 0.5) },
      uTime: { value: 0 },
      uMode: { value: modeNumber.value },
    },
    transparent: true,
  })
  mesh = new Mesh(gl, { geometry, program })

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root)
  window.addEventListener('resize', resize, { passive: true })
  resize()

  startTime = performance.now()
  root.style.setProperty('--fluid-glass-ior', String(modeProps.value.ior ?? 1.15))
  root.style.setProperty('--fluid-glass-thickness', String(modeProps.value.thickness ?? 5))
  if (!reduceMotion) loop()
})

onBeforeUnmount(destroy)
</script>

<style scoped>
.fluid-glass-button {
  --fluid-glass-x: 50%;
  --fluid-glass-y: 50%;
  --fluid-glass-tilt-x: 0deg;
  --fluid-glass-tilt-y: 0deg;
  position: relative;
  display: inline-grid;
  place-items: center;
  isolation: isolate;
  overflow: hidden;
  transform-style: preserve-3d;
}

.fluid-glass-canvas,
.fluid-glass-refractor,
.fluid-glass-lens {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.fluid-glass-canvas {
  width: 100%;
  height: 100%;
  opacity: 0.92;
}

.fluid-glass-refractor {
  transform:
    perspective(540px)
    rotateX(var(--fluid-glass-tilt-y))
    rotateY(var(--fluid-glass-tilt-x));
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.30), rgba(255, 255, 255, 0.06) 42%, rgba(255, 255, 255, 0.18)),
    radial-gradient(circle at var(--fluid-glass-x) var(--fluid-glass-y), rgba(255, 250, 240, 0.56), transparent 34%);
  backdrop-filter: blur(18px) saturate(1.42) contrast(1.1);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.42),
    inset 0 -18px 38px -28px rgba(255, 255, 255, 0.48);
}

.fluid-glass-lens {
  background:
    radial-gradient(circle at var(--fluid-glass-x) var(--fluid-glass-y), rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.12) 28%, transparent 58%),
    linear-gradient(120deg, transparent 16%, rgba(255, 255, 255, 0.26) 44%, transparent 70%);
  mix-blend-mode: screen;
  opacity: 0.74;
}

.fluid-glass-content {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.fluid-glass-bar .fluid-glass-refractor {
  border-radius: 999px;
}

.fluid-glass-cube .fluid-glass-refractor {
  border-radius: 18px;
}
</style>
