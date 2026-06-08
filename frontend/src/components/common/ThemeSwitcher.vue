<template>
  <div v-if="authStore.isAdmin" ref="dropdownRef" class="theme-switcher relative">
    <button
      ref="triggerRef"
      class="theme-switcher-trigger sidebar-link w-full"
      :class="{ 'sidebar-link-collapsed': collapsed }"
      type="button"
      :title="currentThemeOption.label"
      aria-label="Appearance theme"
      @click="toggleDropdown"
    >
      <ThemeLogo :theme-id="currentTheme" class="h-5 w-5 flex-shrink-0" />
      <span
        class="sidebar-label"
        :class="{ 'sidebar-label-collapsed': collapsed }"
        :aria-hidden="collapsed ? 'true' : 'false'"
      >
        {{ currentThemeOption.label }}
      </span>
      <Icon
        v-if="!collapsed"
        name="chevronDown"
        size="xs"
        class="ml-auto flex-shrink-0 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <FloatingDropdown
      :show="isOpen"
      :trigger-el="triggerRef"
      placement="bottom-end"
      panel-class="theme-switcher-menu w-52 overflow-hidden"
    >
      <button
        v-for="theme in themes"
        :key="theme.id"
        class="theme-switcher-option flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
        :class="{ 'theme-switcher-option-active': theme.id === currentTheme }"
        type="button"
        @click="selectTheme(theme.id)"
      >
        <ThemeLogo :theme-id="theme.id" class="h-4 w-4 flex-shrink-0" />
        <span>{{ theme.label }}</span>
        <Icon v-if="theme.id === currentTheme" name="check" size="sm" class="ml-auto text-primary-500" />
      </button>
    </FloatingDropdown>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { adminAPI } from '@/api/admin'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import Icon from '@/components/icons/Icon.vue'
import { type AppearanceThemeId, useAppearanceTheme } from '@/composables/useAppearanceTheme'
import { useAppStore, useAuthStore } from '@/stores'

withDefaults(defineProps<{
  collapsed?: boolean
}>(), {
  collapsed: false,
})

const authStore = useAuthStore()
const appStore = useAppStore()
const { currentTheme, currentThemeOption, themes, setAppearanceTheme, updateAppearanceThemeDefault } = useAppearanceTheme()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

async function selectTheme(theme: AppearanceThemeId) {
  if (!authStore.isAdmin) {
    isOpen.value = false
    return
  }
  setAppearanceTheme(theme)
  isOpen.value = false
  try {
    const updated = await adminAPI.settings.updateAppearanceThemeDefault(theme)
    updateAppearanceThemeDefault(updated.appearance_theme_default)
  } catch (error) {
    appStore.showError((error as { message?: string })?.message || 'Failed to update appearance theme')
    void appStore.fetchPublicSettings(true)
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

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
    return () => h('svg', {
      ...attrs,
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': 'true',
    }, [
      h('path', {
        d: 'M11.96 3.25 4.7 20.25h2.94l1.45-3.58h5.77l1.47 3.58h2.97L12.04 3.25h-.08Zm-1.88 10.96 1.89-4.68 1.91 4.68h-3.8Z',
      }),
    ])
  },
})

const ThemeLogo = defineComponent({
  name: 'ThemeLogo',
  props: {
    themeId: {
      type: String,
      required: true,
    },
  },
  setup(props, { attrs }) {
    return () => {
      if (props.themeId === 'cloudflare') {
        return h(CloudflareLogoMark, { ...attrs, 'data-theme-logo': 'cloudflare' })
      }
      if (props.themeId === 'anthropic') {
        return h(ClaudeLogoMark, { ...attrs, 'data-theme-logo': 'anthropic' })
      }
      return h(NewspaperLogoMark, { ...attrs, 'data-theme-logo': 'newspaper' })
    }
  },
})
</script>
