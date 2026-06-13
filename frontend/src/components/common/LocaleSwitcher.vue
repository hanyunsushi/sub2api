<template>
  <div class="relative" ref="dropdownRef">
    <button data-testid="common-locale-switcher-button-toggle-dropdown"
      ref="triggerRef"
      @click="toggleDropdown"
      :disabled="switching"
      class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
      :class="triggerClass"
      :title="currentLocale?.name"
    >
      <span class="hidden sm:inline">{{ currentLocale?.code.toUpperCase() }}</span>
      <Icon
        name="chevronDown"
        size="xs"
        class="transition-transform duration-200"
        :class="[chevronClass, { 'rotate-180': isOpen }]"
      />
    </button>

    <FloatingDropdown
      :show="isOpen"
      :trigger-el="triggerRef"
      placement="bottom-end"
      panel-class="w-32 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-dark-700 dark:bg-dark-800"
    >
        <button data-testid="common-locale-switcher-button-select-locale-locale-code"
          v-for="locale in availableLocales"
          :key="locale.code"
          :disabled="switching"
          @click="selectLocale(locale.code)"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-700"
          :class="{
            'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400':
              locale.code === currentLocaleCode
          }"
        >
          <span>{{ locale.name }}</span>
          <Icon v-if="locale.code === currentLocaleCode" name="check" size="sm" class="ml-auto text-primary-500" />
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

const currentLocaleCode = computed(() => locale.value)
const currentLocale = computed(() => availableLocales.find((l) => l.code === locale.value))
const triggerClass = computed(() =>
  props.tone === 'on-deep'
    ? 'text-white/85 hover:bg-white/10 hover:text-white disabled:text-white/50'
    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'
)
const chevronClass = computed(() =>
  props.tone === 'on-deep' ? 'text-white/65' : 'text-gray-400'
)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

async function selectLocale(code: string) {
  if (switching.value || code === currentLocaleCode.value) {
    isOpen.value = false
    return
  }
  switching.value = true
  try {
    await setLocale(code)
    isOpen.value = false
  } finally {
    switching.value = false
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
