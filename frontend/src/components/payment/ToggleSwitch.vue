<template>
  <label class="flex flex-col items-center gap-0.5 cursor-pointer">
    <span class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)] whitespace-nowrap">{{ label }}</span>
    <button data-testid="payment-toggle-switch-button-emit-toggle"
      type="button"
      role="switch"
      :aria-checked="checked"
      @click="emit('toggle')"
      :class="[
        'anthropic-switch',
        checked ? 'anthropic-switch-active' : '',
      ]"
    >
      <span class="anthropic-switch-thumb" />
    </button>
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; checked: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>
