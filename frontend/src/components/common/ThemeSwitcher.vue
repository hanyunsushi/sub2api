<template>
  <div v-if="authStore.isAdmin" ref="dropdownRef" class="theme-switcher relative">
    <button data-testid="common-theme-switcher-button-toggle-dropdown"
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
      <button data-testid="common-theme-switcher-button-select-theme-theme-id"
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
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { adminAPI } from '@/api/admin'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import ThemeLogo from '@/components/common/ThemeLogo.vue'
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
</script>
