<template>
  <div
    class="relative locale-switcher"
    ref="dropdownRef"
    @mouseleave="scheduleClose"
    @pointerleave="scheduleClose"
  >
    <button data-testid="common-locale-switcher-button-toggle-dropdown"
      ref="triggerRef"
      @click="toggleDropdown"
      @mouseenter="openDropdown"
      @pointerenter="openDropdown"
      @focus="openDropdown"
      :disabled="switching"
      class="language-bar-trigger"
      :class="triggerClass"
      :title="currentLocale?.name"
      aria-haspopup="menu"
      :aria-expanded="isOpen ? 'true' : 'false'"
    >
      <span class="hidden sm:inline">{{ currentLocale?.name }}</span>
      <span class="topbar-menu-caret" :class="{ 'topbar-menu-caret-open': isOpen }" aria-hidden="true"></span>
    </button>

    <FloatingDropdown
      :show="isOpen"
      :trigger-el="triggerRef"
      placement="bottom-end"
      panel-class="language-bar-menu w-36"
      @mouseenter="cancelClose"
      @mouseleave="scheduleClose"
      @close="closeDropdown"
    >
        <button data-testid="common-locale-switcher-button-select-locale-locale-code"
          v-for="locale in availableLocales"
          :key="locale.code"
          :disabled="switching"
          @click="selectLocale(locale.code)"
          class="language-bar-option flex w-full items-center gap-2 text-sm text-[var(--anthropic-muted)] transition-colors"
          :class="{
            'language-bar-option-active text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]':
              locale.code === currentLocaleCode
          }"
        >
          <span>{{ locale.name }}</span>
          <Icon v-if="locale.code === currentLocaleCode" name="check" size="sm" class="ml-auto text-[var(--anthropic-fg)]" />
        </button>
    </FloatingDropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import FloatingDropdown from '@/components/common/FloatingDropdown.vue'
import { setLocale, availableLocales } from '@/i18n'

const props = withDefaults(defineProps<{
  tone?: 'default' | 'on-deep'
}>(), {
  tone: 'default'
})

const { locale } = useI18n()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const switching = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const currentLocaleCode = computed(() => locale.value)
const currentLocale = computed(() => availableLocales.find((l) => l.code === locale.value))
const triggerClass = computed(() =>
  props.tone === 'on-deep'
    ? 'language-bar-trigger-on-deep'
    : 'language-bar-trigger-default'
)

function toggleDropdown() {
  cancelClose()
  isOpen.value = !isOpen.value
}

function openDropdown() {
  cancelClose()
  isOpen.value = true
}

function closeDropdown() {
  cancelClose()
  isOpen.value = false
}

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function scheduleClose() {
  cancelClose()
  closeTimer = setTimeout(() => {
    closeDropdown()
  }, 120)
}

async function selectLocale(code: string) {
  if (switching.value || code === currentLocaleCode.value) {
    closeDropdown()
    return
  }
  switching.value = true
  try {
    await setLocale(code)
    closeDropdown()
  } finally {
    switching.value = false
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  cancelClose()
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}
</style>
