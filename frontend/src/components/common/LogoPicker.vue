<template>
  <div class="logo-picker">
    <div class="logo-picker-preview" aria-hidden="true">
      <img v-if="normalizedValue" :src="normalizedValue" alt="" />
      <Icon v-else name="grid" size="sm" />
    </div>
    <div class="logo-picker-field">
      <label v-if="label" class="input-label">{{ label }}</label>
      <input
        :value="modelValue"
        type="url"
        class="input"
        :data-testid="inputTestId"
        :placeholder="placeholder"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <p v-if="hint" class="input-hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  hint?: string
  placeholder?: string
  inputTestId?: string
}>(), {
  label: '',
  hint: '',
  placeholder: 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/light/openai.png',
  inputTestId: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const normalizedValue = computed(() => props.modelValue.trim())
</script>
