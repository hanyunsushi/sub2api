<template>
  <div ref="dropdownRef" class="theme-switcher relative">
    <button
      ref="triggerRef"
      class="theme-switcher-trigger sidebar-link w-full"
      :class="{ 'sidebar-link-collapsed': collapsed }"
      type="button"
      :title="currentThemeOption.label"
      aria-label="Appearance theme"
      @click="toggleDropdown"
    >
      <Icon name="book" size="md" class="h-5 w-5 flex-shrink-0" />
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
      panel-class="theme-switcher-menu w-44 overflow-hidden"
    >
      <button
        v-for="theme in themes"
        :key="theme.id"
        class="theme-switcher-option flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
        :class="{ 'theme-switcher-option-active': theme.id === currentTheme }"
        type="button"
        @click="selectTheme(theme.id)"
      >
        <Icon name="book" size="sm" />
        <span>{{ theme.label }}</span>
        <Icon v-if="theme.id === currentTheme" name="check" size="sm" class="ml-auto text-primary-500" />
      </button>
    </FloatingDropdown>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import Icon from '@/components/icons/Icon.vue'
import { type AppearanceThemeId, useAppearanceTheme } from '@/composables/useAppearanceTheme'

withDefaults(defineProps<{
  collapsed?: boolean
}>(), {
  collapsed: false,
})

const { currentTheme, currentThemeOption, themes, setAppearanceTheme } = useAppearanceTheme()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectTheme(theme: AppearanceThemeId) {
  setAppearanceTheme(theme)
  isOpen.value = false
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
</script>
