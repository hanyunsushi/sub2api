<template>
  <div
    :class="['relative', selectRootVariantClass]"
    ref="containerRef"
    @pointerenter="openDropdown"
    @mouseenter="openDropdown"
    @mouseleave="scheduleHoverClose"
  >
    <button data-testid="common-select-button-toggle"
      ref="triggerRef"
      type="button"
      @click="openDropdown"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-label="ariaLabel"
      :class="[
        'select-trigger',
        selectTriggerVariantClass,
        isOpen && 'select-trigger-open',
        error && 'select-trigger-error',
        disabled && 'select-trigger-disabled'
      ]"
      @keydown.down.prevent="onTriggerKeyDown"
      @keydown.up.prevent="onTriggerKeyDown"
    >
      <span class="select-value">
        <slot name="selected" :option="selectedOption">
          {{ selectedLabel }}
        </slot>
      </span>
      <span data-testid="common-select-span-clear-selection"
        v-if="clearable && hasValue && !disabled"
        class="select-clear"
        role="button"
        tabindex="-1"
        aria-label="Clear selection"
        @click.stop="clearSelection"
        @mousedown.stop
        @keydown.enter.stop.prevent="clearSelection"
      >
        <Icon name="x" size="sm" />
      </span>
      <span class="select-icon" :class="{ 'select-icon-open': isOpen }" aria-hidden="true"></span>
    </button>

    <!-- Teleport dropdown to body to escape stacking context -->
    <Teleport to="body">
      <div data-testid="common-select-div-div"
        v-if="isOpen"
        ref="dropdownRef"
        class="select-dropdown-portal"
        :class="[selectDropdownVariantClass, instanceId, portalClass]"
        :style="dropdownStyle"
        role="listbox"
        @mouseenter="cancelHoverClose"
        @mouseleave="scheduleHoverClose"
        @click.stop
        @mousedown.stop
        @keydown="onDropdownKeyDown"
      >
          <!-- Search input -->
          <div v-if="isSearchable" class="select-search">
            <Icon name="search" size="sm" class="text-[var(--anthropic-muted)]" />
            <input data-testid="common-select-input-search-query"
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholderText"
              :aria-label="searchPlaceholderText"
              class="select-search-input"
              @click.stop
            />
          </div>

          <!-- Options list -->
          <div class="select-options" ref="optionsListRef">
            <div data-testid="common-select-div-div-2"
              v-for="(option, index) in filteredOptions"
              :key="`${typeof getOptionValue(option)}:${String(getOptionValue(option) ?? '')}`"
              role="option"
              :aria-selected="isSelected(option)"
              :aria-disabled="isOptionDisabled(option)"
              @click.stop="!isOptionDisabled(option) && selectOption(option)"
              @mouseenter="handleOptionMouseEnter(option, index)"
              :class="[
                'select-option',
                isGroupHeaderOption(option) && 'select-option-group',
                isSelected(option) && 'select-option-selected',
                isOptionDisabled(option) && !isGroupHeaderOption(option) && 'select-option-disabled',
                focusedIndex === index && !isGroupHeaderOption(option) && 'select-option-focused'
              ]"
            >
              <slot name="option" :option="option" :selected="isSelected(option)">
                <Icon
                  v-if="option._creatable"
                  name="search"
                  size="sm"
                  class="flex-shrink-0 text-[var(--anthropic-muted)]"
                />
                <span class="select-option-label" :class="option._creatable && 'italic text-[var(--anthropic-muted)] dark:text-dark-300'">{{ getOptionLabel(option) }}</span>
                <Icon
                  v-if="isSelected(option)"
                  name="check"
                  size="sm"
                  class="text-[var(--anthropic-fg)]"
                  :stroke-width="2"
                />
              </slot>
            </div>

            <!-- Empty state -->
            <div v-if="filteredOptions.length === 0" class="select-empty">
              {{ props.loading ? t('common.loading') : emptyTextDisplay }}
            </div>
          </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import {
  claimDropdownOwner,
  onDropdownOwnerClaimed,
  releaseDropdownOwner
} from '@/utils/dropdownCoordinator'

const { t } = useI18n()

// Instance ID for unique click-outside detection
const instanceId = `select-${Math.random().toString(36).substring(2, 9)}`

export interface SelectOption {
  value: string | number | boolean | null
  label: string
  disabled?: boolean
  [key: string]: unknown
}

interface Props {
  modelValue: string | number | boolean | null | undefined
  options: SelectOption[] | Array<Record<string, unknown>>
  variant?: 'field' | 'text-control'
  ariaLabel?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  searchable?: boolean | 'auto'
  searchPlaceholder?: string
  emptyText?: string
  valueKey?: string
  labelKey?: string
  creatable?: boolean
  creatablePrefix?: string
  portalClass?: string
  menuVariant?: 'auto' | 'underline' | 'highlight'
  clearable?: boolean
  id?: string
  ariaDescribedby?: string
  /** 远程搜索模式：输入不在本地过滤 options，而是防抖后 emit('search', query)，由父组件请求数据更新 options */
  remote?: boolean
  /** 远程搜索模式下的加载态：options 为空时下拉显示 loading 文案 */
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | number | boolean | null): void
  (e: 'change', value: string | number | boolean | null, option: SelectOption | null): void
  (e: 'search', query: string): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'field',
  ariaLabel: 'Select option',
  disabled: false,
  error: false,
  searchable: 'auto',
  creatable: false,
  creatablePrefix: '',
  portalClass: '',
  menuVariant: 'auto',
  clearable: false,
  valueKey: 'value',
  labelKey: 'label',
  remote: false,
  loading: false
})

const emit = defineEmits<Emits>()

const isOpen = ref(false)
const searchQuery = ref('')
const focusedIndex = ref(-1)
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const optionsListRef = ref<HTMLElement | null>(null)
const dropdownPosition = ref<'bottom' | 'top'>('bottom')
const triggerRect = ref<DOMRect | null>(null)
const dropdownViewportPadding = 8
const dropdownMinimumWidth = 200
let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null
let stopDropdownOwnerListener: (() => void) | null = null

// i18n placeholders
const placeholderText = computed(() => props.placeholder ?? t('common.selectOption'))
const searchPlaceholderText = computed(() => props.searchPlaceholder ?? t('common.searchPlaceholder'))
const emptyTextDisplay = computed(() => props.emptyText ?? t('common.noOptionsFound'))

// 远程搜索的防抖间隔（对齐 OpenAIFastPolicyUserSelector 的 300ms 惯例）。
const REMOTE_SEARCH_DEBOUNCE_MS = 300
let remoteSearchTimer: ReturnType<typeof setTimeout> | null = null

const isSearchable = computed(() => {
  // 远程搜索模式始终显示搜索框（选项只是服务端结果的一页）。
  if (props.remote) return true
  if (props.searchable === 'auto') return props.options.length > 5
  return props.searchable
})

const selectRootVariantClass = computed(() =>
  props.variant === 'text-control' ? 'select-root--text-control' : 'select-root--field'
)

const selectTriggerVariantClass = computed(() =>
  props.variant === 'text-control' ? 'select-trigger--text-control' : 'select-trigger--field'
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

const isLevelOneDropdown = computed(() => {
  if (props.menuVariant === 'underline') return true
  if (props.menuVariant === 'highlight') return false
  return (
    props.variant === 'text-control' ||
    Boolean(containerRef.value?.closest(levelOneDropdownContextSelector))
  )
})

const hasExplicitPortalVariant = computed(() =>
  /\b(?:filter-underline-menu|topbar-underline-menu|dropdown-highlight-menu|account-card-action-menu)\b/.test(props.portalClass)
)

const selectDropdownVariantClass = computed(() => {
  if (hasExplicitPortalVariant.value) return ''
  return isLevelOneDropdown.value
    ? 'filter-underline-menu select-dropdown-portal--underline'
    : 'dropdown-highlight-menu select-dropdown-portal--highlight'
})

// Computed style for teleported dropdown
const dropdownStyle = computed(() => {
  if (!triggerRect.value) return {}

  const rect = triggerRect.value
  const viewportRight = Math.max(dropdownViewportPadding, window.innerWidth - dropdownViewportPadding)
  const left = Math.min(
    Math.max(dropdownViewportPadding, rect.left),
    viewportRight
  )
  const availableWidth = Math.max(0, viewportRight - left)
  const preferredMinWidth = Math.max(dropdownMinimumWidth, rect.width)
  const minWidth = Math.min(preferredMinWidth, availableWidth)
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${left}px`,
    minWidth: `${minWidth}px`,
    maxWidth: `${availableWidth}px`,
    zIndex: '100000020'
  }

  if (dropdownPosition.value === 'top') {
    style.bottom = `${window.innerHeight - rect.top + 4}px`
  } else {
    style.top = `${rect.bottom + 4}px`
  }

  return style
})

const getOptionValue = (option: any): any => {
  if (typeof option === 'object' && option !== null) {
    return option[props.valueKey]
  }
  return option
}

const getOptionLabel = (option: any): string => {
  if (typeof option === 'object' && option !== null) {
    return String(option[props.labelKey] ?? '')
  }
  return String(option ?? '')
}

const isOptionDisabled = (option: any): boolean => {
  if (typeof option === 'object' && option !== null) {
    return !!option.disabled
  }
  return false
}

const isGroupHeaderOption = (option: any): boolean => {
  if (typeof option === 'object' && option !== null) {
    return option.kind === 'group'
  }
  return false
}

const selectedOption = computed(() => {
  return props.options.find((opt) => getOptionValue(opt) === props.modelValue) || null
})

const selectedLabel = computed(() => {
  if (selectedOption.value) {
    return getOptionLabel(selectedOption.value)
  }
  // In creatable mode, show the raw value if no matching option
  if (props.creatable && props.modelValue) {
    return String(props.modelValue)
  }
  return placeholderText.value
})

const hasValue = computed(
  () => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== ''
)

const filteredOptions = computed(() => {
  let opts = props.options as any[]
  // 远程搜索模式不在本地过滤（选项即服务端搜索结果的一页）。
  if (isSearchable.value && searchQuery.value && !props.remote) {
    const query = searchQuery.value.toLowerCase()
    opts = opts.filter((opt) => {
      // Match label
      if (getOptionLabel(opt).toLowerCase().includes(query)) return true
      // Also match description if present
      if (opt.description && String(opt.description).toLowerCase().includes(query)) return true
      return false
    })
    // In creatable mode, always prepend a fuzzy search option
    if (props.creatable && searchQuery.value.trim()) {
      const trimmed = searchQuery.value.trim()
      const prefix = props.creatablePrefix || t('common.search')
      opts = [{ [props.valueKey]: trimmed, [props.labelKey]: `${prefix} "${trimmed}"`, _creatable: true }, ...opts]
    }
  }
  return opts
})

const isSelected = (option: any): boolean => {
  return getOptionValue(option) === props.modelValue
}

const findNextEnabledIndex = (startIndex: number): number => {
  const opts = filteredOptions.value
  if (opts.length === 0) return -1
  for (let offset = 0; offset < opts.length; offset++) {
    const idx = (startIndex + offset) % opts.length
    if (!isOptionDisabled(opts[idx])) return idx
  }
  return -1
}

const findPrevEnabledIndex = (startIndex: number): number => {
  const opts = filteredOptions.value
  if (opts.length === 0) return -1
  for (let offset = 0; offset < opts.length; offset++) {
    const idx = (startIndex - offset + opts.length) % opts.length
    if (!isOptionDisabled(opts[idx])) return idx
  }
  return -1
}

const handleOptionMouseEnter = (option: any, index: number) => {
  if (isOptionDisabled(option) || isGroupHeaderOption(option)) return
  focusedIndex.value = index
}

// Update trigger rect periodically while open to follow scroll/resize
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
    const dropdownHeight = dropdownRef.value.offsetHeight || 240
    const spaceBelow = window.innerHeight - triggerRect.value.bottom
    const spaceAbove = triggerRect.value.top

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      dropdownPosition.value = 'top'
    } else {
      dropdownPosition.value = 'bottom'
    }
  })
}

const openDropdown = () => {
  if (props.disabled) return
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

watch(isOpen, (open) => {
  if (open) {
    calculateDropdownPosition()
    // Reset focused index to current selection or first item
    if (filteredOptions.value.length === 0) {
      focusedIndex.value = -1
    } else {
      const selectedIdx = filteredOptions.value.findIndex(isSelected)
      const initialIdx = selectedIdx >= 0 ? selectedIdx : 0
      focusedIndex.value = isOptionDisabled(filteredOptions.value[initialIdx])
        ? findNextEnabledIndex(initialIdx + 1)
        : initialIdx
    }

    if (isSearchable.value) {
      nextTick(() => searchInputRef.value?.focus())
    }
    // Add scroll listener to update position
    window.addEventListener('scroll', updateTriggerRect, { capture: true, passive: true })
    window.addEventListener('resize', calculateDropdownPosition)
    document.addEventListener('pointermove', handleDocumentHoverMove, { passive: true })
    document.addEventListener('mousemove', handleDocumentHoverMove, { passive: true })
  } else {
    cancelHoverClose()
    searchQuery.value = ''
    focusedIndex.value = -1
    // 关闭时取消仍在排队的远程搜索（避免关闭后尾随 emit 一次 search(''))。
    if (remoteSearchTimer) {
      clearTimeout(remoteSearchTimer)
      remoteSearchTimer = null
    }
    window.removeEventListener('scroll', updateTriggerRect, { capture: true })
    window.removeEventListener('resize', calculateDropdownPosition)
    document.removeEventListener('pointermove', handleDocumentHoverMove)
    document.removeEventListener('mousemove', handleDocumentHoverMove)
  }
})

// 远程搜索：输入防抖后交给父组件请求（!isOpen 抑制关闭重置 searchQuery 触发的空 query）。
watch(searchQuery, (query) => {
  if (!props.remote || !isOpen.value) return
  if (remoteSearchTimer) clearTimeout(remoteSearchTimer)
  remoteSearchTimer = setTimeout(() => {
    remoteSearchTimer = null
    emit('search', query.trim())
  }, REMOTE_SEARCH_DEBOUNCE_MS)
})

const selectOption = (option: any) => {
  const value = getOptionValue(option) ?? null
  emit('update:modelValue', value)
  emit('change', value, option)
  isOpen.value = false
  releaseDropdownOwner(instanceId)
  triggerRef.value?.focus()
}

const clearSelection = () => {
  if (props.disabled) return
  emit('update:modelValue', null)
  emit('change', null, null)
}

// Keyboards
const onTriggerKeyDown = () => {
  if (!isOpen.value) {
    openDropdown()
  }
}

const onDropdownKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = findNextEnabledIndex(focusedIndex.value + 1)
      if (focusedIndex.value >= 0) scrollToFocused()
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = findPrevEnabledIndex(focusedIndex.value - 1)
      if (focusedIndex.value >= 0) scrollToFocused()
      break
    case 'Enter':
      e.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < filteredOptions.value.length) {
        const opt = filteredOptions.value[focusedIndex.value]
        if (!isOptionDisabled(opt)) selectOption(opt)
      }
      break
    case 'Escape':
      e.preventDefault()
      isOpen.value = false
      releaseDropdownOwner(instanceId)
      triggerRef.value?.focus()
      break
    case 'Tab':
      isOpen.value = false
      releaseDropdownOwner(instanceId)
      break
  }
}

const scrollToFocused = () => {
  nextTick(() => {
    const list = optionsListRef.value
    if (!list) return
    const focusedEl = list.children[focusedIndex.value] as HTMLElement
    if (!focusedEl) return

    if (focusedEl.offsetTop < list.scrollTop) {
      list.scrollTop = focusedEl.offsetTop
    } else if (focusedEl.offsetTop + focusedEl.offsetHeight > list.scrollTop + list.offsetHeight) {
      list.scrollTop = focusedEl.offsetTop + focusedEl.offsetHeight - list.offsetHeight
    }
  })
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  // Check if click is inside THIS specific instance's dropdown or trigger
  const isInDropdown = !!target.closest(`.${instanceId}`)
  const isInTrigger = containerRef.value?.contains(target)

  if (!isInDropdown && !isInTrigger && isOpen.value) {
    isOpen.value = false
    releaseDropdownOwner(instanceId)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  stopDropdownOwnerListener = onDropdownOwnerClaimed((owner) => {
    if (owner !== instanceId) {
      isOpen.value = false
    }
  })
})

onUnmounted(() => {
  cancelHoverClose()
  releaseDropdownOwner(instanceId)
  stopDropdownOwnerListener?.()
  stopDropdownOwnerListener = null
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updateTriggerRect, { capture: true })
  window.removeEventListener('resize', calculateDropdownPosition)
  if (remoteSearchTimer) {
    clearTimeout(remoteSearchTimer)
    remoteSearchTimer = null
  }
})
</script>

<style scoped>
.select-trigger {
  @apply flex w-full items-center justify-between gap-2;
  @apply px-4 py-2.5 text-sm;
  @apply border;
  @apply transition-all duration-200;
  @apply focus:outline-none;
  @apply cursor-pointer;
  --select-component-surface: var(--select-default-surface, var(--atelier-paper-2));
  --select-surface: var(--select-component-surface);
  --select-muted-surface: var(--select-component-surface);
  border-radius: 12px;
  background: var(--select-surface);
  background-color: var(--select-surface);
  border-color: var(--anthropic-border, var(--atelier-line));
  color: var(--atelier-ink);
  box-shadow: var(--anthropic-button-ring, 0 0 0 1px var(--anthropic-border-subtle));
}

.select-trigger:hover {
  border-color: var(--anthropic-border-hover, var(--atelier-line-strong));
  background: var(--anthropic-raised, var(--atelier-ui-hover-surface));
}

.select-trigger:focus-visible {
  outline: 2px solid var(--anthropic-focus, var(--atelier-focus));
  outline-offset: 3px;
  background: var(--select-surface);
}

.select-trigger-open {
  border-color: var(--atelier-line-strong);
  background: var(--select-surface);
  background-color: var(--select-surface);
  box-shadow: none;
}

:global(#app .app-layout-content .layout-section-fixed.table-page-filter-section .select-trigger),
:global(#app .app-layout-content .table-page-filter-section .select-trigger),
:global(#app .app-layout-content .table-filter-shell .select-trigger),
:global(#app .app-layout-content .table-filter-left .select-trigger),
:global(#app .app-layout-content .table-filter-actions .select-trigger),
:global(#app .app-layout-content .accounts-filter-shell .select-trigger),
:global(#app .app-layout-content .accounts-filter-left .select-trigger),
:global(#app .app-layout-content .accounts-filter-actions .select-trigger),
:global(#app .app-layout-content .users-filter-shell .select-trigger),
:global(#app .app-layout-content .users-filter-left .select-trigger),
:global(#app .app-layout-content .users-filter-actions .select-trigger),
:global(#app .app-layout-content .users-filter-tools .select-trigger),
:global(#app .app-layout-content .usage-filter-card .select-trigger),
:global(#app .app-layout-content .usage-filter-shell .select-trigger),
:global(#app .app-layout-content .usage-filter-left .select-trigger),
:global(#app .app-layout-content .usage-filter-actions .select-trigger),
:global(#app .app-layout-content .keys-filter-shell .select-trigger),
:global(#app .app-layout-content .keys-filter-left .select-trigger),
:global(#app .app-layout-content .keys-filter-actions .select-trigger),
:global(#app .app-layout-content .global-pricing-filter-card .select-trigger),
:global(#app .app-layout-content .global-pricing-filter-shell .select-trigger),
:global(#app .app-layout-content .global-pricing-filter-left .select-trigger),
:global(#app .app-layout-content .global-pricing-filter-actions .select-trigger),
:global(#app .app-layout-content .dashboard-filter-card .select-trigger),
:global(#app .app-layout-content .dashboard-filter-shell .select-trigger),
:global(#app .app-layout-content .dashboard-filter-range .select-trigger),
:global(#app .app-layout-content .dashboard-filter-granularity .select-trigger),
:global(#app .app-layout-content .usage-time-filter-card .select-trigger),
:global(#app .app-layout-content .usage-time-filter-shell .select-trigger),
:global(#app .app-layout-content .usage-time-filter-range .select-trigger),
:global(#app .app-layout-content .usage-time-filter-granularity .select-trigger),
:global(#app .app-layout-content .usage-record-filter-wrap .select-trigger),
:global(#app .app-layout-content .order-filter-card .select-trigger),
:global(#app .app-layout-content .payment-dashboard-filter-bar .select-trigger),
:global(#app .app-layout-content .payment-plans-filter-bar .select-trigger),
:global(#app .app-layout-content .risk-control-toolbar-actions .select-trigger),
:global(#app .app-layout-content .risk-control-record-filters .select-trigger),
:global(#app .app-layout-content .ops-monitor-toolbar-controls .select-trigger),
:global(#app .app-layout-content .ops-card-filter-bar .select-trigger),
:global(#app .app-layout-content .ops-card-filter-grid .select-trigger),
:global(#app .app-layout-content .codex-toolbar .select-trigger),
:global(#app .app-layout-content .codex-list-actions__primary .select-trigger),
:global(#app .app-layout-content .codex-list-actions__filters .select-trigger) {
  --select-default-surface: transparent !important;
  --select-component-surface: transparent !important;
  --select-surface: transparent !important;
  --select-muted-surface: transparent !important;
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

:global(#app .app-layout-content .layout-section-fixed.table-page-filter-section .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .table-page-filter-section .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .table-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .table-filter-left .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .table-filter-actions .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .accounts-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .accounts-filter-left .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .accounts-filter-actions .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .users-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .users-filter-left .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .users-filter-actions .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .users-filter-tools .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-filter-card .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-filter-left .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-filter-actions .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .keys-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .keys-filter-left .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .keys-filter-actions .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-card .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-left .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .global-pricing-filter-actions .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-card .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-range .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .dashboard-filter-granularity .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-card .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-shell .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-range .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-time-filter-granularity .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .usage-record-filter-wrap .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .order-filter-card .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .payment-dashboard-filter-bar .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .payment-plans-filter-bar .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .risk-control-toolbar-actions .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .risk-control-record-filters .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .ops-monitor-toolbar-controls .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .ops-card-filter-bar .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .ops-card-filter-grid .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .codex-toolbar .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .codex-list-actions__primary .select-trigger:is(:hover, .select-trigger-open)),
:global(#app .app-layout-content .codex-list-actions__filters .select-trigger:is(:hover, .select-trigger-open)) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-color: transparent !important;
  outline: 0 !important;
  box-shadow: none !important;
  text-decoration-line: underline !important;
  text-decoration-thickness: 1px !important;
  text-underline-offset: 3px !important;
}

:global(#app .app-layout-content .layout-section-fixed.table-page-filter-section .select-trigger:focus-visible),
:global(#app .app-layout-content .table-page-filter-section .select-trigger:focus-visible),
:global(#app .app-layout-content .table-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .table-filter-left .select-trigger:focus-visible),
:global(#app .app-layout-content .table-filter-actions .select-trigger:focus-visible),
:global(#app .app-layout-content .accounts-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .accounts-filter-left .select-trigger:focus-visible),
:global(#app .app-layout-content .accounts-filter-actions .select-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-left .select-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-actions .select-trigger:focus-visible),
:global(#app .app-layout-content .users-filter-tools .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-card .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-left .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-filter-actions .select-trigger:focus-visible),
:global(#app .app-layout-content .keys-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .keys-filter-left .select-trigger:focus-visible),
:global(#app .app-layout-content .keys-filter-actions .select-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-card .select-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-left .select-trigger:focus-visible),
:global(#app .app-layout-content .global-pricing-filter-actions .select-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-card .select-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-range .select-trigger:focus-visible),
:global(#app .app-layout-content .dashboard-filter-granularity .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-card .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-shell .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-range .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-time-filter-granularity .select-trigger:focus-visible),
:global(#app .app-layout-content .usage-record-filter-wrap .select-trigger:focus-visible),
:global(#app .app-layout-content .order-filter-card .select-trigger:focus-visible),
:global(#app .app-layout-content .payment-dashboard-filter-bar .select-trigger:focus-visible),
:global(#app .app-layout-content .payment-plans-filter-bar .select-trigger:focus-visible),
:global(#app .app-layout-content .risk-control-toolbar-actions .select-trigger:focus-visible),
:global(#app .app-layout-content .risk-control-record-filters .select-trigger:focus-visible),
:global(#app .app-layout-content .ops-monitor-toolbar-controls .select-trigger:focus-visible),
:global(#app .app-layout-content .ops-card-filter-bar .select-trigger:focus-visible),
:global(#app .app-layout-content .ops-card-filter-grid .select-trigger:focus-visible),
:global(#app .app-layout-content .codex-toolbar .select-trigger:focus-visible),
:global(#app .app-layout-content .codex-list-actions__primary .select-trigger:focus-visible),
:global(#app .app-layout-content .codex-list-actions__filters .select-trigger:focus-visible) {
  outline: 2px solid var(--anthropic-focus, var(--atelier-focus)) !important;
  outline-offset: 3px !important;
  border: 0 !important;
  box-shadow: none !important;
}

.select-trigger--text-control {
  --select-default-surface: transparent !important;
  --select-component-surface: transparent !important;
  --select-surface: transparent !important;
  --select-muted-surface: transparent !important;
  width: max-content !important;
  min-width: 0 !important;
  min-height: var(--anthropic-control-height, 2rem) !important;
  height: var(--anthropic-control-height, 2rem) !important;
  justify-content: center !important;
  gap: 0.125rem !important;
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
  text-decoration-line: underline;
  text-decoration-color: transparent;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.24em;
}

.select-trigger--text-control:hover,
.select-trigger--text-control.select-trigger-open {
  border-color: transparent !important;
  background: transparent !important;
  background-color: transparent !important;
  color: var(--anthropic-fg, var(--atelier-ink)) !important;
  box-shadow: none !important;
  text-decoration-color: currentColor;
}

.select-trigger--text-control:focus:not(:focus-visible),
.select-trigger--text-control.select-trigger-open:focus:not(:focus-visible) {
  --tw-ring-color: transparent !important;
  --tw-ring-shadow: 0 0 #0000 !important;
  --tw-ring-offset-shadow: 0 0 #0000 !important;
  border: 0 !important;
  border-color: transparent !important;
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
  outline: 0 !important;
  text-decoration-color: currentColor;
}

.select-trigger--text-control:focus-visible {
  border: 0 !important;
  background: transparent !important;
  background-color: transparent !important;
  outline: 2px solid var(--anthropic-focus, var(--atelier-focus)) !important;
  outline-offset: 3px !important;
  box-shadow: none !important;
}

.select-trigger--text-control .select-value {
  flex: 0 1 auto;
}

.select-trigger--text-control .select-icon {
  margin-left: -0.125rem;
  color: currentColor;
}

.select-trigger-error {
  border-color: var(--anthropic-error, var(--atelier-status-danger));
}

.select-trigger-disabled {
  @apply cursor-not-allowed opacity-60;
  background: var(--anthropic-raised, var(--atelier-surface-muted));
  color: var(--anthropic-disabled, var(--atelier-dust));
}

.select-value {
  @apply flex-1 truncate text-left;
}

.select-icon {
  @apply flex-shrink-0;
  display: inline-grid;
  align-items: center;
  justify-content: center;
  place-items: center;
  width: 1.25rem;
  min-width: 1.25rem;
  height: 1.25rem;
  min-height: 1.25rem;
  color: var(--atelier-muted);
  transform: translateY(1px) rotate(0deg);
  transform-origin: 50% 50%;
  transition: transform 0.2s ease-in-out, color 160ms ease;
}

.select-icon::before {
  content: "";
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M14.128 7.16482C14.3126 6.95983 14.6298 6.94336 14.835 7.12771C15.0402 7.31242 15.0567 7.62952 14.8721 7.83477L10.372 12.835L10.2939 12.9053C10.2093 12.9667 10.1063 13 9.99995 13C9.85833 12.9999 9.72264 12.9402 9.62788 12.835L5.12778 7.83477L5.0682 7.75273C4.95072 7.55225 4.98544 7.28926 5.16489 7.12771C5.34445 6.96617 5.60969 6.95939 5.79674 7.09744L5.87193 7.16482L9.99995 11.7519L14.128 7.16482Z'/%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M14.128 7.16482C14.3126 6.95983 14.6298 6.94336 14.835 7.12771C15.0402 7.31242 15.0567 7.62952 14.8721 7.83477L10.372 12.835L10.2939 12.9053C10.2093 12.9667 10.1063 13 9.99995 13C9.85833 12.9999 9.72264 12.9402 9.62788 12.835L5.12778 7.83477L5.0682 7.75273C4.95072 7.55225 4.98544 7.28926 5.16489 7.12771C5.34445 6.96617 5.60969 6.95939 5.79674 7.09744L5.87193 7.16482L9.99995 11.7519L14.128 7.16482Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.select-trigger-open .select-icon,
.select-icon-open {
  transform: translateY(1px) rotate(180deg);
}

.select-clear {
  @apply flex flex-shrink-0 cursor-pointer items-center justify-center;
  @apply rounded transition-colors;
  color: var(--anthropic-quiet, var(--atelier-dust));
}

.select-clear:hover {
  color: var(--anthropic-fg, var(--atelier-ink));
}
</style>

<style>
.select-dropdown-portal {
  @apply w-max min-w-[200px];
  @apply border;
  @apply overflow-hidden;
  --select-surface: var(--anthropic-page, var(--atelier-paper));
  --select-muted-surface: var(--anthropic-page, var(--atelier-paper));
  --select-option-text: var(--atelier-muted);
  --select-option-stable-text: var(--select-option-text);
  --select-option-hover-surface: var(--anthropic-section, var(--atelier-paper-2));
  --select-option-focused-surface: var(--select-option-hover-surface);
  --select-option-selected-surface: var(--anthropic-cookbook-hover, var(--atelier-ui-hover-surface));
  --select-option-selected-text: var(--atelier-ink);
  padding: 12px;
  border-radius: 16px;
  background: var(--select-surface);
  border-color: var(--anthropic-cookbook-border, var(--atelier-line));
  color: var(--atelier-ink);
  box-shadow: var(--anthropic-dropdown-shadow, 0 4px 24px rgba(0, 0, 0, 0.05));
  pointer-events: auto !important;
}

.select-dropdown-portal .select-search {
  @apply flex items-center gap-2 px-3 py-2;
  @apply border-b;
  margin: 0 0 8px;
  border-color: var(--anthropic-border-subtle, var(--atelier-line));
  background: var(--select-muted-surface);
}

.select-dropdown-portal .select-search-input {
  @apply flex-1 bg-transparent text-sm;
  @apply focus:outline-none;
  color: var(--anthropic-fg, var(--atelier-ink));
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.125rem 0.25rem;
  box-shadow: none;
}

.select-dropdown-portal .select-search-input:focus {
  border-color: transparent;
  outline: none;
  box-shadow: none;
}

.select-dropdown-portal .select-search-input:focus-visible {
  outline: 2px solid var(--anthropic-focus, var(--atelier-focus));
  outline-offset: 3px;
  box-shadow: none;
}

.select-dropdown-portal .select-search-input::placeholder {
  color: var(--anthropic-quiet, var(--atelier-dust));
}

.select-dropdown-portal .select-options {
  @apply max-h-80 overflow-y-auto outline-none;
  display: grid;
  gap: 2px;
}

.select-dropdown-portal .select-option {
  @apply flex items-center justify-between gap-2;
  @apply px-3 py-2 text-sm;
  @apply cursor-pointer transition-colors duration-150;
  min-height: 2.5rem;
  border-radius: 8px;
  color: var(--select-option-stable-text);
  text-decoration-line: none;
  text-underline-offset: 0.2em;
  pointer-events: auto !important;
}

.select-dropdown-portal .select-option-selected {
  background: var(--select-option-selected-surface);
  color: var(--select-option-selected-text);
}

.select-dropdown-portal .select-option-focused {
  background: var(--select-option-focused-surface);
  color: var(--anthropic-fg, var(--atelier-ink));
  text-decoration-line: none;
}

.select-dropdown-portal .select-option:hover {
  background: var(--select-option-hover-surface);
  color: var(--anthropic-fg, var(--atelier-ink));
  text-decoration-line: none;
}

.select-dropdown-portal .select-option-selected.select-option-focused,
.select-dropdown-portal .select-option-selected:hover {
  background: var(--select-option-selected-surface);
  color: var(--select-option-selected-text);
}

.select-dropdown-portal .select-option-selected :where(.select-option-label, svg),
.select-dropdown-portal .select-option-selected.select-option-focused :where(.select-option-label, svg),
.select-dropdown-portal .select-option-selected:hover :where(.select-option-label, svg) {
  color: var(--select-option-selected-text);
}

.select-dropdown-portal .select-option-focused :where(.select-option-label, svg),
.select-dropdown-portal .select-option:hover :where(.select-option-label, svg) {
  color: var(--anthropic-fg, var(--atelier-ink));
}

.select-dropdown-portal--underline .select-option,
.select-dropdown-portal--underline .select-option-selected,
.select-dropdown-portal--underline .select-option-selected.select-option-focused,
.select-dropdown-portal--underline .select-option-selected:hover,
.select-dropdown-portal--underline .select-option-focused,
.select-dropdown-portal--underline .select-option:hover {
  background: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--anthropic-fg, var(--atelier-ink)) !important;
  text-decoration-line: underline !important;
  text-underline-offset: 0.22em !important;
}

.select-dropdown-portal--underline .select-option {
  text-decoration-color: transparent !important;
}

.select-dropdown-portal--underline .select-option-selected,
.select-dropdown-portal--underline .select-option-selected.select-option-focused,
.select-dropdown-portal--underline .select-option-selected:hover,
.select-dropdown-portal--underline .select-option-focused,
.select-dropdown-portal--underline .select-option:hover {
  text-decoration-color: currentColor !important;
}

.select-dropdown-portal--underline .select-option-selected :where(.select-option-label, svg),
.select-dropdown-portal--underline .select-option-selected.select-option-focused :where(.select-option-label, svg),
.select-dropdown-portal--underline .select-option-selected:hover :where(.select-option-label, svg),
.select-dropdown-portal--underline .select-option-focused :where(.select-option-label, svg),
.select-dropdown-portal--underline .select-option:hover :where(.select-option-label, svg) {
  color: var(--anthropic-fg, var(--atelier-ink)) !important;
}

.select-dropdown-portal .select-option-disabled {
  @apply cursor-not-allowed opacity-40;
}

.select-dropdown-portal .select-option-group {
  @apply cursor-default select-none;
  @apply bg-gray-50 dark:bg-dark-900;
  @apply text-[11px] font-bold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  background: var(--select-muted-surface);
  color: var(--atelier-dust);
}

.select-dropdown-portal .select-option-group:hover {
  @apply bg-gray-50 dark:bg-dark-900;
  background: var(--select-muted-surface);
}

.select-dropdown-portal .select-option-label {
  @apply flex-1 min-w-0 truncate text-left;
}

.dark .select-trigger,
.dark .select-dropdown-portal {
  --select-surface: var(--atelier-paper-2);
  --select-muted-surface: var(--atelier-paper-2);
  --select-option-text: var(--atelier-muted);
  --select-option-stable-text: var(--select-option-text);
  --select-option-hover-surface: var(--anthropic-section, var(--atelier-paper-2));
  --select-option-focused-surface: var(--select-option-hover-surface);
  --select-option-selected-surface: var(--atelier-ui-hover-surface);
  --select-option-selected-text: var(--atelier-ink);
  background: var(--select-surface);
  border-color: var(--atelier-material-edge);
  color: var(--atelier-ink);
}

.dark .select-dropdown-portal .select-search {
  border-color: var(--atelier-material-edge);
  background: var(--select-muted-surface);
}

.dark .select-dropdown-portal .select-option {
  color: var(--atelier-muted);
}

.dark .select-dropdown-portal .select-option-group {
  background: var(--select-muted-surface);
  color: var(--atelier-dust);
}

.dark .select-dropdown-portal .select-option:hover,
.dark .select-dropdown-portal .select-option-focused {
  background: var(--select-option-hover-surface);
  color: var(--anthropic-fg, var(--atelier-ink));
}

.dark .select-dropdown-portal .select-option-selected:hover {
  background: var(--select-option-selected-surface);
  color: var(--select-option-selected-text);
}

.select-dropdown-portal .select-empty {
  @apply px-4 py-8 text-center text-sm;
  @apply text-gray-500 dark:text-dark-400;
}

.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition: opacity 0.22s var(--atelier-ease), transform 0.22s var(--atelier-ease);
}

.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}
</style>
