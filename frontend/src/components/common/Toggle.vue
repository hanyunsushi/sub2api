<template>
  <button data-testid="common-toggle-button-toggle"
    type="button"
    @click="toggle"
    class="toggle-switch relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[var(--atelier-focus)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-800"
    :class="[modelValue ? 'bg-[var(--anthropic-focus)]' : 'bg-[var(--anthropic-raised)] dark:bg-[var(--anthropic-section)]']"
    role="switch"
    :aria-checked="modelValue"
  >
    <span
      class="toggle-switch__thumb pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--anthropic-page)] shadow ring-0 transition duration-200 ease-in-out"
      :class="[modelValue ? 'translate-x-5' : 'translate-x-0']"
    />
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>
