<script setup lang="ts">
import { defineComponent, h } from 'vue'
import ModelIcon from '@/components/common/ModelIcon.vue'
import type { AppearanceThemeId } from '@/composables/useAppearanceTheme'

defineOptions({ inheritAttrs: false })

defineProps<{
  themeId: AppearanceThemeId | string
}>()

const CloudflareLogoMark = defineComponent({
  name: 'CloudflareLogoMark',
  setup(_, { attrs }) {
    return () => h('svg', {
      ...attrs,
      viewBox: '0 0 209.51 94.74',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': 'true',
    }, [
      h('path', {
        fill: '#F48120',
        d: 'M143.05 93.42l1.07-3.71c1.27-4.41.8-8.48-1.34-11.48-2-2.76-5.26-4.38-9.25-4.57L58 72.7a1.47 1.47 0 0 1-1.35-2 2 2 0 0 1 1.75-1.34l76.26-1c9-.41 18.84-7.75 22.27-16.71l4.34-11.36a2.68 2.68 0 0 0 .18-1 3.31 3.31 0 0 0-.06-.54 49.67 49.67 0 0 0-95.49-5.14 22.35 22.35 0 0 0-35 23.42A31.73 31.73 0 0 0 .34 93.45a1.47 1.47 0 0 0 1.45 1.27l139.49 0h0a1.83 1.83 0 0 0 1.77-1.3z',
      }),
      h('path', {
        fill: '#FAAD3F',
        d: 'M168.22 41.15q-1 0-2.1.06a.88.88 0 0 0-.32.07 1.17 1.17 0 0 0-.76.8l-3 10.26c-1.28 4.41-.81 8.48 1.34 11.48a11.65 11.65 0 0 0 9.24 4.57l16.11 1a1.44 1.44 0 0 1 1.14.62 1.5 1.5 0 0 1 .17 1.37 2 2 0 0 1-1.75 1.34l-16.73 1c-9.09.42-18.88 7.75-22.31 16.7l-1.21 3.16a.9.9 0 0 0 .79 1.22h57.63a1.55 1.55 0 0 0 1.51-1.14 41.34 41.34 0 0 0-39.75-52.49z',
      }),
    ])
  },
})

const NewspaperLogoMark = defineComponent({
  name: 'NewspaperLogoMark',
  setup(_, { attrs }) {
    return () => h('svg', {
      ...attrs,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': 'true',
    }, [
      h('rect', {
        x: '4',
        y: '5',
        width: '16',
        height: '14',
        rx: '2',
        fill: 'currentColor',
        opacity: '0.12',
      }),
      h('path', {
        d: 'M7 8h10M7 11h10M7 14h6',
        stroke: 'currentColor',
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
      }),
    ])
  },
})

const ClaudeLogoMark = defineComponent({
  name: 'ClaudeLogoMark',
  setup(_, { attrs }) {
    return () => h(ModelIcon, {
      ...attrs,
      model: 'claude',
      size: '100%',
      'aria-hidden': 'true',
    })
  },
})
</script>

<template>
  <CloudflareLogoMark
    v-if="themeId === 'cloudflare'"
    v-bind="$attrs"
    data-theme-logo="cloudflare"
  />
  <ClaudeLogoMark
    v-else-if="themeId === 'anthropic'"
    v-bind="$attrs"
    data-theme-logo="anthropic"
  />
  <NewspaperLogoMark
    v-else
    v-bind="$attrs"
    data-theme-logo="newspaper"
  />
</template>
