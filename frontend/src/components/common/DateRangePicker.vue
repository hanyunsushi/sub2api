<template>
  <div
    :class="['relative', datePickerRootVariantClass]"
    ref="containerRef"
    @pointerenter="openDropdown"
    @mouseenter="openDropdown"
    @mouseleave="scheduleHoverClose"
  >
    <button data-testid="common-date-range-picker-button-toggle"
      type="button"
      @click="openDropdown"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      :class="['date-picker-trigger', datePickerTriggerVariantClass, isOpen && 'date-picker-trigger-open']"
    >
      <span class="date-picker-value">
        {{ displayValue }}
      </span>
      <span class="date-picker-chevron" aria-hidden="true"></span>
    </button>

    <Teleport to="body">
      <div data-testid="common-date-range-picker-div-div"
        v-if="isOpen"
        ref="dropdownRef"
        class="date-picker-dropdown-portal"
        :class="[datePickerDropdownVariantClass, instanceId]"
        :style="dropdownStyle"
        @mouseenter="cancelHoverClose"
        @mouseleave="scheduleHoverClose"
        @click.stop
        @mousedown.stop
      >
          <!-- Quick presets -->
          <div class="date-picker-presets">
            <button data-testid="common-date-range-picker-button-select-preset-preset"
              v-for="preset in presets"
              :key="preset.value"
              @click="selectPreset(preset)"
              :class="['date-picker-preset', isPresetActive(preset) && 'date-picker-preset-active']"
            >
              {{ t(preset.labelKey) }}
            </button>
          </div>

          <div class="date-picker-divider"></div>

          <!-- Custom date range inputs -->
          <div class="date-picker-custom">
            <div class="date-picker-field">
              <label class="date-picker-label">{{ t('dates.startDate') }}</label>
              <input data-testid="common-date-range-picker-input-local-start-date"
                type="text"
                v-model="localStartDate"
                inputmode="numeric"
                autocomplete="off"
                placeholder="YYYY-MM-DD"
                pattern="\d{4}-\d{2}-\d{2}"
                class="date-picker-input"
                @input="onDateChange"
                @change="normalizeDateInput('start')"
                @focus="cancelHoverClose"
              />
            </div>
            <div class="date-picker-separator">
              <span class="date-picker-separator-mark" aria-hidden="true"></span>
            </div>
            <div class="date-picker-field">
              <label class="date-picker-label">{{ t('dates.endDate') }}</label>
              <input data-testid="common-date-range-picker-input-local-end-date"
                type="text"
                v-model="localEndDate"
                inputmode="numeric"
                autocomplete="off"
                placeholder="YYYY-MM-DD"
                pattern="\d{4}-\d{2}-\d{2}"
                class="date-picker-input"
                @input="onDateChange"
                @change="normalizeDateInput('end')"
                @focus="cancelHoverClose"
              />
            </div>
          </div>

          <!-- Apply button -->
          <div class="date-picker-actions">
            <button data-testid="common-date-range-picker-button-apply" @click="apply" class="date-picker-apply">
              {{ t('dates.apply') }}
            </button>
          </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  claimDropdownOwner,
  onDropdownOwnerClaimed,
  releaseDropdownOwner
} from '@/utils/dropdownCoordinator'

interface DatePreset {
  labelKey: string
  value: string
  getRange: () => { start: string; end: string }
}

interface Props {
  startDate: string
  endDate: string
  variant?: 'field' | 'text-control'
}

interface Emits {
  (e: 'update:startDate', value: string): void
  (e: 'update:endDate', value: string): void
  (e: 'change', range: { startDate: string; endDate: string; preset: string | null }): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text-control'
})
const emit = defineEmits<Emits>()

const { t, locale } = useI18n()
const instanceId = `date-picker-${Math.random().toString(36).substring(2, 9)}`

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const localStartDate = ref(props.startDate)
const localEndDate = ref(props.endDate)
const activePreset = ref<string | null>('last24Hours')
const dropdownPosition = ref<'bottom' | 'top'>('bottom')
const triggerRect = ref<DOMRect | null>(null)
let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null
let stopDropdownOwnerListener: (() => void) | null = null

const today = computed(() => {
  // Use local timezone to avoid UTC timezone issues
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Tomorrow's date - used for max date to handle timezone differences
// When user is in a timezone behind the server, "today" on server might be "tomorrow" locally
const tomorrow = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatDateToString(d)
})

// Helper function to format date to YYYY-MM-DD using local timezone
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const presets: DatePreset[] = [
  {
    labelKey: 'dates.today',
    value: 'today',
    getRange: () => {
      const t = today.value
      return { start: t, end: t }
    }
  },
  {
    labelKey: 'dates.yesterday',
    value: 'yesterday',
    getRange: () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      const yesterday = formatDateToString(d)
      return { start: yesterday, end: yesterday }
    }
  },
  {
    labelKey: 'dates.last24Hours',
    value: 'last24Hours',
    getRange: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      return {
        start: formatDateToString(start),
        end: formatDateToString(end)
      }
    }
  },
  {
    labelKey: 'dates.last7Days',
    value: '7days',
    getRange: () => {
      const end = today.value
      const d = new Date()
      d.setDate(d.getDate() - 6)
      const start = formatDateToString(d)
      return { start, end }
    }
  },
  {
    labelKey: 'dates.last14Days',
    value: '14days',
    getRange: () => {
      const end = today.value
      const d = new Date()
      d.setDate(d.getDate() - 13)
      const start = formatDateToString(d)
      return { start, end }
    }
  },
  {
    labelKey: 'dates.last30Days',
    value: '30days',
    getRange: () => {
      const end = today.value
      const d = new Date()
      d.setDate(d.getDate() - 29)
      const start = formatDateToString(d)
      return { start, end }
    }
  },
  {
    labelKey: 'dates.thisMonth',
    value: 'thisMonth',
    getRange: () => {
      const now = new Date()
      const start = formatDateToString(new Date(now.getFullYear(), now.getMonth(), 1))
      return { start, end: today.value }
    }
  },
  {
    labelKey: 'dates.lastMonth',
    value: 'lastMonth',
    getRange: () => {
      const now = new Date()
      const start = formatDateToString(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const end = formatDateToString(new Date(now.getFullYear(), now.getMonth(), 0))
      return { start, end }
    }
  }
]

const displayValue = computed(() => {
  if (activePreset.value) {
    const preset = presets.find((p) => p.value === activePreset.value)
    if (preset) return t(preset.labelKey)
  }

  if (localStartDate.value && localEndDate.value) {
    if (localStartDate.value === localEndDate.value) {
      return formatDate(localStartDate.value)
    }
    return `${formatDate(localStartDate.value)} - ${formatDate(localEndDate.value)}`
  }

  return t('dates.selectDateRange')
})

const datePickerRootVariantClass = computed(() =>
  props.variant === 'text-control' ? 'date-picker-root--text-control' : 'date-picker-root--field'
)

const datePickerTriggerVariantClass = computed(() =>
  props.variant === 'text-control' ? 'date-picker-trigger--text-control' : 'date-picker-trigger--field'
)

const levelOneDropdownContextSelector = [
  '.app-header-atelier',
  '.table-page-filter-section',
  '.table-filter-shell',
  '.table-filter-left',
  '.table-filter-actions',
  '.dashboard-filter-card',
  '.dashboard-filter-shell',
  '.usage-time-filter-card',
  '.usage-time-filter-shell',
  '.usage-filter-card',
  '.usage-filter-shell',
  '.keys-filter-shell',
  '.global-pricing-filter-card',
  '.global-pricing-filter-shell',
  '.monitor-filter-shell',
  '.ops-monitor-toolbar-controls',
  '.ops-card-filter-bar',
  '.ops-card-filter-grid',
  '.codex-toolbar',
  '.codex-list-actions__filters',
  '.risk-control-toolbar-actions',
  '.risk-control-record-filters',
  '.payment-dashboard-filter-bar',
  '.payment-plans-filter-bar',
  '.order-filter-card'
].join(',')

const datePickerDropdownVariantClass = computed(() =>
  props.variant === 'text-control' ||
  Boolean(containerRef.value?.closest(levelOneDropdownContextSelector))
    ? 'filter-underline-menu date-picker-dropdown-portal--underline'
    : 'dropdown-highlight-menu date-picker-dropdown-portal--highlight'
)

const dropdownStyle = computed(() => {
  if (!triggerRect.value) return {}

  const rect = triggerRect.value
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${rect.left}px`,
    minWidth: `${Math.max(rect.width, 320)}px`,
    zIndex: '100000030'
  }

  if (dropdownPosition.value === 'top') {
    style.bottom = `${window.innerHeight - rect.top + 8}px`
  } else {
    style.top = `${rect.bottom + 8}px`
  }

  return style
})

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  const dateLocale = locale.value === 'zh' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })
}

const isPresetActive = (preset: DatePreset): boolean => {
  return activePreset.value === preset.value
}

const selectPreset = (preset: DatePreset) => {
  const range = preset.getRange()
  localStartDate.value = range.start
  localEndDate.value = range.end
  activePreset.value = preset.value
}

const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/

const isValidDateString = (value: string): boolean => {
  if (!DATE_INPUT_RE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

const clampDateInput = (value: string, min?: string, max?: string): string => {
  if (!isValidDateString(value)) return value
  if (min && isValidDateString(min) && value < min) return min
  if (max && isValidDateString(max) && value > max) return max
  return value
}

const normalizeDateInput = (field: 'start' | 'end') => {
  if (field === 'start') {
    localStartDate.value = clampDateInput(localStartDate.value, undefined, localEndDate.value || tomorrow.value)
  } else {
    localEndDate.value = clampDateInput(localEndDate.value, localStartDate.value, tomorrow.value)
  }
  onDateChange()
}

const onDateChange = () => {
  // Check if current dates match any preset
  activePreset.value = null
  if (!isValidDateString(localStartDate.value) || !isValidDateString(localEndDate.value)) return
  for (const preset of presets) {
    const range = preset.getRange()
    if (range.start === localStartDate.value && range.end === localEndDate.value) {
      activePreset.value = preset.value
      break
    }
  }
}

const openDropdown = () => {
  cancelHoverClose()
  claimDropdownOwner(instanceId)
  isOpen.value = true
}

const cancelHoverClose = () => {
  if (!hoverCloseTimer) return
  clearTimeout(hoverCloseTimer)
  hoverCloseTimer = null
}

const scheduleHoverClose = () => {
  if (hoverCloseTimer) return
  hoverCloseTimer = setTimeout(() => {
    isOpen.value = false
    releaseDropdownOwner(instanceId)
    hoverCloseTimer = null
  }, 120)
}

const isPointerWithinDropdown = (target: EventTarget | null) => {
  if (!(target instanceof Node)) return false
  return !!containerRef.value?.contains(target) || !!dropdownRef.value?.contains(target)
}

const handleDocumentHoverMove = (event: PointerEvent | MouseEvent) => {
  if (!isOpen.value) return
  if (isPointerWithinDropdown(event.target)) {
    cancelHoverClose()
  } else {
    scheduleHoverClose()
  }
}

const updateTriggerRect = () => {
  if (containerRef.value) {
    triggerRect.value = containerRef.value.getBoundingClientRect()
  }
}

const calculateDropdownPosition = () => {
  if (!containerRef.value) return
  updateTriggerRect()

  nextTick(() => {
    if (!dropdownRef.value || !triggerRect.value) return
    const dropdownHeight = dropdownRef.value.offsetHeight || 260
    const spaceBelow = window.innerHeight - triggerRect.value.bottom
    const spaceAbove = triggerRect.value.top

    dropdownPosition.value = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'top' : 'bottom'
  })
}

const apply = () => {
  normalizeDateInput('start')
  normalizeDateInput('end')
  if (!isValidDateString(localStartDate.value) || !isValidDateString(localEndDate.value)) return
  emit('update:startDate', localStartDate.value)
  emit('update:endDate', localEndDate.value)
  emit('change', {
    startDate: localStartDate.value,
    endDate: localEndDate.value,
    preset: activePreset.value
  })
  isOpen.value = false
  releaseDropdownOwner(instanceId)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const isInDropdown = !!target.closest(`.${instanceId}`)
  const isInTrigger = containerRef.value?.contains(target)

  if (!isInDropdown && !isInTrigger && isOpen.value) {
    isOpen.value = false
    releaseDropdownOwner(instanceId)
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
    releaseDropdownOwner(instanceId)
  }
}

// Sync local state with props
watch(
  () => props.startDate,
  (val) => {
    localStartDate.value = val
    onDateChange()
  }
)

watch(
  () => props.endDate,
  (val) => {
    localEndDate.value = val
    onDateChange()
  }
)

watch(isOpen, (open) => {
  if (open) {
    calculateDropdownPosition()
    window.addEventListener('scroll', updateTriggerRect, { capture: true, passive: true })
    window.addEventListener('resize', calculateDropdownPosition)
    document.addEventListener('pointermove', handleDocumentHoverMove, { passive: true })
    document.addEventListener('mousemove', handleDocumentHoverMove, { passive: true })
  } else {
    cancelHoverClose()
    window.removeEventListener('scroll', updateTriggerRect, { capture: true })
    window.removeEventListener('resize', calculateDropdownPosition)
    document.removeEventListener('pointermove', handleDocumentHoverMove)
    document.removeEventListener('mousemove', handleDocumentHoverMove)
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
  stopDropdownOwnerListener = onDropdownOwnerClaimed((owner) => {
    if (owner !== instanceId) {
      isOpen.value = false
    }
  })
  // Initialize active preset detection
  onDateChange()
})

onUnmounted(() => {
  cancelHoverClose()
  releaseDropdownOwner(instanceId)
  stopDropdownOwnerListener?.()
  stopDropdownOwnerListener = null
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('scroll', updateTriggerRect, { capture: true })
  window.removeEventListener('resize', calculateDropdownPosition)
  document.removeEventListener('pointermove', handleDocumentHoverMove)
  document.removeEventListener('mousemove', handleDocumentHoverMove)
})
</script>

<style scoped>
.date-picker-trigger {
  @apply flex items-center;
  @apply text-sm;
  @apply transition-all duration-200;
  @apply focus:outline-none;
  @apply cursor-pointer;
  gap: 4px;
  min-height: var(--anthropic-control-height, 2rem);
  padding: 0;
  border: 0;
  border-radius: 0;
  border-color: transparent;
  background: transparent;
  color: var(--atelier-ink);
  box-shadow: none;
}

.date-picker-trigger--field {
  min-height: 2.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--anthropic-border, var(--atelier-line));
  border-radius: 12px;
  background: var(--select-default-surface, var(--atelier-paper-2));
  box-shadow: var(--anthropic-button-ring, 0 0 0 1px var(--anthropic-border-subtle));
}

.date-picker-trigger--text-control {
  width: max-content !important;
  min-width: 0 !important;
  min-height: var(--anthropic-control-height, 2rem) !important;
  height: var(--anthropic-control-height, 2rem) !important;
  gap: 0.125rem !important;
  padding: 0 !important;
  border: 0 !important;
  border-color: transparent !important;
  border-radius: 0 !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  color: var(--atelier-ink) !important;
  box-shadow: none !important;
  font-family: var(--atelier-font-sans) !important;
  font-size: var(--anthropic-control-font-size, 0.8125rem) !important;
  font-weight: var(--anthropic-control-font-weight, 500) !important;
  line-height: var(--anthropic-control-line-height, 1.25rem) !important;
  letter-spacing: 0 !important;
  text-decoration-line: underline;
  text-decoration-color: transparent;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.24em;
}

.date-picker-trigger--text-control:hover,
.date-picker-trigger--text-control.date-picker-trigger-open {
  border-color: transparent !important;
  background: transparent !important;
  background-color: transparent !important;
  color: var(--atelier-ink) !important;
  box-shadow: none !important;
  text-decoration-color: currentColor;
}

.date-picker-trigger--text-control:focus-visible {
  border: 0 !important;
  background: transparent !important;
  background-color: transparent !important;
  outline: 2px solid var(--anthropic-focus, var(--atelier-focus)) !important;
  outline-offset: 3px !important;
  box-shadow: none !important;
}

.date-picker-trigger-open {
  background: transparent;
  color: var(--atelier-ink);
  box-shadow: none;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

:global(#app .app-layout-content .layout-section-fixed.table-page-filter-section .date-picker-trigger),
:global(#app .app-layout-content .table-page-filter-section .date-picker-trigger),
:global(#app .app-layout-content .table-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .table-filter-left .date-picker-trigger),
:global(#app .app-layout-content .table-filter-actions .date-picker-trigger),
:global(#app .app-layout-content .accounts-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .accounts-filter-left .date-picker-trigger),
:global(#app .app-layout-content .accounts-filter-actions .date-picker-trigger),
:global(#app .app-layout-content .users-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .users-filter-left .date-picker-trigger),
:global(#app .app-layout-content .users-filter-actions .date-picker-trigger),
:global(#app .app-layout-content .users-filter-tools .date-picker-trigger),
:global(#app .app-layout-content .usage-filter-card .date-picker-trigger),
:global(#app .app-layout-content .usage-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .usage-filter-left .date-picker-trigger),
:global(#app .app-layout-content .usage-filter-actions .date-picker-trigger),
:global(#app .app-layout-content .keys-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .keys-filter-left .date-picker-trigger),
:global(#app .app-layout-content .keys-filter-actions .date-picker-trigger),
:global(#app .app-layout-content .global-pricing-filter-card .date-picker-trigger),
:global(#app .app-layout-content .global-pricing-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .global-pricing-filter-left .date-picker-trigger),
:global(#app .app-layout-content .global-pricing-filter-actions .date-picker-trigger),
:global(#app .app-layout-content .dashboard-filter-card .date-picker-trigger),
:global(#app .app-layout-content .dashboard-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .dashboard-filter-range .date-picker-trigger),
:global(#app .app-layout-content .dashboard-filter-granularity .date-picker-trigger),
:global(#app .app-layout-content .usage-time-filter-card .date-picker-trigger),
:global(#app .app-layout-content .usage-time-filter-shell .date-picker-trigger),
:global(#app .app-layout-content .usage-time-filter-range .date-picker-trigger),
:global(#app .app-layout-content .usage-time-filter-granularity .date-picker-trigger),
:global(#app .app-layout-content .usage-record-filter-wrap .date-picker-trigger),
:global(#app .app-layout-content .order-filter-card .date-picker-trigger),
:global(#app .app-layout-content .payment-dashboard-filter-bar .date-picker-trigger),
:global(#app .app-layout-content .payment-plans-filter-bar .date-picker-trigger),
:global(#app .app-layout-content .risk-control-toolbar-actions .date-picker-trigger),
:global(#app .app-layout-content .risk-control-record-filters .date-picker-trigger),
:global(#app .app-layout-content .ops-monitor-toolbar-controls .date-picker-trigger),
:global(#app .app-layout-content .ops-card-filter-bar .date-picker-trigger),
:global(#app .app-layout-content .ops-card-filter-grid .date-picker-trigger),
:global(#app .app-layout-content .codex-toolbar .date-picker-trigger),
:global(#app .app-layout-content .codex-list-actions__primary .date-picker-trigger),
:global(#app .app-layout-content .codex-list-actions__filters .date-picker-trigger) {
  width: max-content !important;
  min-width: 0 !important;
  min-height: var(--anthropic-control-height, 2rem) !important;
  padding: 0 !important;
  border: 0 !important;
  border-color: transparent !important;
  border-radius: 0 !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  font-family: var(--atelier-font-sans) !important;
  font-size: var(--anthropic-control-font-size, 0.8125rem) !important;
  font-weight: var(--anthropic-control-font-weight, 500) !important;
  line-height: var(--anthropic-control-line-height, 1.25rem) !important;
  letter-spacing: 0 !important;
}

:global(#app .app-layout-content .layout-section-fixed.table-page-filter-section .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .table-page-filter-section .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .table-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .table-filter-left .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .table-filter-actions .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .accounts-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .accounts-filter-left .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .accounts-filter-actions .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .users-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .users-filter-left .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .users-filter-actions .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .users-filter-tools .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-filter-card .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-filter-left .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-filter-actions .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .keys-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .keys-filter-left .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .keys-filter-actions .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-card .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-left .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-actions .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-card .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-range .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-granularity .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-card .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-shell .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-range .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-granularity .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .usage-record-filter-wrap .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .order-filter-card .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .payment-dashboard-filter-bar .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .payment-plans-filter-bar .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .risk-control-toolbar-actions .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .risk-control-record-filters .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .ops-monitor-toolbar-controls .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .ops-card-filter-bar .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .ops-card-filter-grid .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .codex-toolbar .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .codex-list-actions__primary .date-picker-trigger:is(:hover, .date-picker-trigger-open)),
:global(#app .app-layout-content .codex-list-actions__filters .date-picker-trigger:is(:hover, .date-picker-trigger-open)) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-color: transparent !important;
  box-shadow: none !important;
  text-decoration-line: underline !important;
  text-decoration-thickness: 1px !important;
  text-underline-offset: 3px !important;
}

:global(#app .app-layout-content .layout-section-fixed.table-page-filter-section .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .table-page-filter-section .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .table-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .table-filter-left .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .table-filter-actions .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .accounts-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .accounts-filter-left .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .accounts-filter-actions .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-left .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-actions .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-tools .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-card .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-left .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-actions .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .keys-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .keys-filter-left .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .keys-filter-actions .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-card .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-left .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-actions .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-card .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-range .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-granularity .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-card .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-shell .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-range .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-granularity .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .usage-record-filter-wrap .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .order-filter-card .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .payment-dashboard-filter-bar .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .payment-plans-filter-bar .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .risk-control-toolbar-actions .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .risk-control-record-filters .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .ops-monitor-toolbar-controls .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .ops-card-filter-bar .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .ops-card-filter-grid .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .codex-toolbar .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .codex-list-actions__primary .date-picker-trigger:focus-visible),
:global(#app .app-layout-content .codex-list-actions__filters .date-picker-trigger:focus-visible) {
  outline: 2px solid var(--anthropic-focus, var(--atelier-focus)) !important;
  outline-offset: 3px !important;
  border: 0 !important;
  box-shadow: none !important;
}

.date-picker-icon {
  display: none !important;
}

.date-picker-value {
  @apply font-medium;
  font-size: var(--anthropic-control-font-size, 0.8125rem);
  line-height: var(--anthropic-control-line-height, 1.25rem);
  color: var(--atelier-ink);
  -webkit-text-fill-color: var(--atelier-ink);
}

.date-picker-chevron {
  display: inline-grid;
  align-items: center;
  justify-content: center;
  place-items: center;
  flex: 0 0 1.25rem;
  width: 1.25rem;
  min-width: 1.25rem;
  height: 1.25rem;
  min-height: 1.25rem;
  color: var(--atelier-ink);
  transform: translateY(1px) rotate(0deg);
  transform-origin: 50% 50%;
  transition: transform 0.2s ease-in-out;
}

.date-picker-chevron::before {
  content: "";
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M14.128 7.16482C14.3126 6.95983 14.6298 6.94336 14.835 7.12771C15.0402 7.31242 15.0567 7.62952 14.8721 7.83477L10.372 12.835L10.2939 12.9053C10.2093 12.9667 10.1063 13 9.99995 13C9.85833 12.9999 9.72264 12.9402 9.62788 12.835L5.12778 7.83477L5.0682 7.75273C4.95072 7.55225 4.98544 7.28926 5.16489 7.12771C5.34445 6.96617 5.60969 6.95939 5.79674 7.09744L5.87193 7.16482L9.99995 11.7519L14.128 7.16482Z'/%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M14.128 7.16482C14.3126 6.95983 14.6298 6.94336 14.835 7.12771C15.0402 7.31242 15.0567 7.62952 14.8721 7.83477L10.372 12.835L10.2939 12.9053C10.2093 12.9667 10.1063 13 9.99995 13C9.85833 12.9999 9.72264 12.9402 9.62788 12.835L5.12778 7.83477L5.0682 7.75273C4.95072 7.55225 4.98544 7.28926 5.16489 7.12771C5.34445 6.96617 5.60969 6.95939 5.79674 7.09744L5.87193 7.16482L9.99995 11.7519L14.128 7.16482Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.date-picker-trigger-open .date-picker-chevron {
  transform: translateY(1px) rotate(180deg);
}

</style>

<style>
.date-picker-dropdown-portal {
  @apply border;
  @apply overflow-hidden;
  @apply min-w-[320px];
  border-radius: 16px;
  border-color: var(--anthropic-cookbook-border, var(--atelier-material-edge)) !important;
  background: var(--anthropic-page, var(--atelier-paper)) !important;
  color: var(--atelier-ink);
  --date-picker-muted-text: var(--atelier-muted);
  --date-picker-hover-surface: transparent;
  --date-picker-active-surface: var(--anthropic-cookbook-hover, var(--anthropic-raised));
  --date-picker-active-text: var(--anthropic-fg);
  box-shadow: var(--anthropic-dropdown-shadow, 0 4px 24px rgba(0, 0, 0, 0.05)) !important;
  pointer-events: auto !important;
}

.date-picker-dropdown-portal .date-picker-presets {
  @apply grid grid-cols-2 gap-1 p-2;
  background: var(--anthropic-page, var(--atelier-material-2));
}

.date-picker-dropdown-portal .date-picker-preset {
  @apply rounded-md px-3 py-1.5 text-xs font-medium;
  @apply transition-colors duration-150;
  color: var(--date-picker-muted-text);
  text-decoration-line: none;
  text-underline-offset: 0.2em;
}

.date-picker-dropdown-portal .date-picker-preset-active {
  background: var(--date-picker-active-surface);
  color: var(--date-picker-active-text);
}

.date-picker-dropdown-portal .date-picker-preset:hover:not(.date-picker-preset-active) {
  background: var(--date-picker-hover-surface);
  color: var(--anthropic-fg, var(--atelier-ink));
  text-decoration-line: underline;
}

.date-picker-dropdown-portal .date-picker-preset-active:hover {
  background: var(--date-picker-active-surface);
  color: var(--date-picker-active-text);
}

.date-picker-dropdown-portal .date-picker-divider {
  @apply border-t border-gray-100 dark:border-dark-700;
  border-color: var(--atelier-material-edge);
}

.date-picker-dropdown-portal .date-picker-custom {
  @apply flex items-end gap-2 p-3;
}

.date-picker-dropdown-portal .date-picker-field {
  @apply flex-1;
}

.date-picker-dropdown-portal .date-picker-label {
  @apply mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400;
  color: var(--atelier-muted);
}

.date-picker-dropdown-portal .date-picker-input {
  @apply w-full rounded-md px-2 py-1.5 text-sm;
  @apply border;
  @apply focus:outline-none;
  border-color: var(--anthropic-border, var(--atelier-material-edge));
  background: var(--anthropic-page, var(--atelier-material-1));
  color: var(--atelier-ink);
  box-shadow: none;
}

.date-picker-dropdown-portal .date-picker-input:focus {
  border-color: var(--anthropic-border, var(--atelier-material-edge));
  outline: none;
  box-shadow: none;
}

.date-picker-dropdown-portal .date-picker-input:focus-visible {
  outline: 2px solid var(--anthropic-focus, var(--atelier-focus));
  outline-offset: 3px;
  box-shadow: none;
}

.date-picker-dropdown-portal .date-picker-input::-webkit-calendar-picker-indicator {
  display: none !important;
}

.dark .date-picker-dropdown-portal .date-picker-input::-webkit-calendar-picker-indicator {
  display: none !important;
}

.date-picker-dropdown-portal .date-picker-separator {
  @apply flex items-center justify-center pb-1;
}

.date-picker-dropdown-portal .date-picker-separator-mark {
  width: 14px;
  height: 1px;
  border-radius: 999px;
  background: var(--atelier-muted);
  opacity: 0.72;
}

.date-picker-dropdown-portal .date-picker-actions {
  @apply flex justify-end p-2 pt-0;
  border-top: 1px solid var(--anthropic-border-subtle, var(--atelier-material-edge));
  background: var(--anthropic-page, var(--atelier-paper));
}

.date-picker-dropdown-portal .date-picker-apply {
  @apply rounded-lg px-4 py-1.5 text-sm font-medium;
  @apply transition-colors duration-150;
  background: var(--anthropic-fg, var(--atelier-ink));
  color: var(--anthropic-page, var(--atelier-paper));
}

.date-picker-dropdown-portal .date-picker-apply:hover,
.date-picker-dropdown-portal .date-picker-apply:focus-visible {
  background: var(--anthropic-fg-hover, var(--atelier-dark));
}

/* Dropdown animation */
.date-picker-dropdown-enter-active,
.date-picker-dropdown-leave-active {
  transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);
}

.date-picker-dropdown-enter-from,
.date-picker-dropdown-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}

.dark .date-picker-trigger,
.dark .date-picker-dropdown-portal .date-picker-input {
  border-color: var(--atelier-material-edge);
  background: var(--atelier-paper-2);
  color: var(--atelier-ink);
}

.dark .date-picker-trigger {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.dark .date-picker-dropdown-portal {
  background: var(--atelier-paper-2) !important;
  border-color: var(--atelier-material-edge) !important;
  color: var(--atelier-ink);
}

.dark .date-picker-icon,
.dark .date-picker-chevron,
.dark .date-picker-dropdown-portal .date-picker-label,
.dark .date-picker-dropdown-portal .date-picker-preset {
  color: var(--atelier-muted);
}

.dark .date-picker-dropdown-portal .date-picker-presets,
.dark .date-picker-dropdown-portal .date-picker-actions {
  background: var(--anthropic-page, var(--atelier-paper-2));
}
</style>
