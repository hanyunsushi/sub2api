<template>
  <AuthLayout>
    <div class="auth-recovery-panel">
      <div class="auth-recovery-header">
        <div class="auth-recovery-kicker">
          <Icon name="mail" size="sm" />
          <span>{{ t('auth.sendResetLink') }}</span>
        </div>
        <h2 class="auth-recovery-heading">
          {{ t('auth.forgotPasswordTitle') }}
        </h2>
        <p class="auth-recovery-copy">
          {{ t('auth.forgotPasswordHint') }}
        </p>
      </div>

      <div v-if="isSubmitted" class="space-y-6">
        <div class="auth-recovery-status auth-recovery-status-success">
          <div class="auth-recovery-status-icon">
            <Icon name="checkCircle" size="lg" />
          </div>
          <div class="auth-recovery-status-body">
            <h3>{{ t('auth.resetEmailSent') }}</h3>
            <p>{{ t('auth.resetEmailSentHint') }}</p>
          </div>
        </div>

        <div class="text-center">
          <router-link
            to="/login"
            class="auth-recovery-action"
          >
            <Icon name="arrowLeft" size="sm" />
            {{ t('auth.backToLogin') }}
          </router-link>
        </div>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label for="email" class="input-label">
            {{ t('auth.emailLabel') }}
          </label>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icon name="mail" size="md" class="text-[var(--anthropic-muted)] dark:text-dark-500" />
            </div>
            <input data-testid="auth-forgot-password-input-form-data-email"
              id="email"
              v-model="formData.email"
              type="email"
              required
              autofocus
              autocomplete="email"
              :disabled="isLoading"
              class="input pl-11"
              :class="{ 'input-error': errors.email }"
              :placeholder="t('auth.emailPlaceholder')"
            />
          </div>
        </div>

        <p v-if="errorMessage" class="auth-recovery-error">
          {{ errorMessage }}
        </p>

        <div v-if="turnstileEnabled && turnstileSiteKey">
          <TurnstileWidget
            ref="turnstileRef"
            :site-key="turnstileSiteKey"
            @verify="onTurnstileVerify"
            @expire="onTurnstileExpire"
            @error="onTurnstileError"
          />
        </div>

        <button data-testid="auth-forgot-password-button-submit"
          type="submit"
          :disabled="isLoading || turnstileChallengeRequired"
          class="btn btn-primary auth-recovery-submit w-full"
        >
          <svg
            v-if="isLoading"
            class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <Icon v-else name="mail" size="md" class="mr-2" />
          {{ isLoading ? t('auth.sendingResetLink') : t('auth.sendResetLink') }}
        </button>
      </form>
    </div>

    <template #footer>
      <p class="auth-footer-copy">
        {{ t('auth.rememberedPassword') }}
        <router-link
          to="/login"
          class="auth-footer-link-strong font-medium underline-offset-4 transition-colors hover:underline"
        >
          {{ t('auth.signIn') }}
        </router-link>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AuthLayout } from '@/components/layout'
import Icon from '@/components/icons/Icon.vue'
import TurnstileWidget from '@/components/TurnstileWidget.vue'
import { useAppStore } from '@/stores'
import { getPublicSettings, forgotPassword } from '@/api/auth'

const { t } = useI18n()

// ==================== Stores ====================

const appStore = useAppStore()

// ==================== State ====================

const isLoading = ref<boolean>(false)
const isSubmitted = ref<boolean>(false)
const errorMessage = ref<string>('')

// Public settings
const turnstileEnabled = ref<boolean>(false)
const turnstileSiteKey = ref<string>('')

// Turnstile
const turnstileRef = ref<InstanceType<typeof TurnstileWidget> | null>(null)
const turnstileToken = ref<string>('')

const formData = reactive({
  email: ''
})

const errors = reactive({
  email: '',
  turnstile: ''
})

const validationToastMessage = computed(() => errors.email || errors.turnstile || '')

const turnstileChallengeRequired = computed(
  () => turnstileEnabled.value && Boolean(turnstileSiteKey.value) && !turnstileToken.value
)

watch(validationToastMessage, (value, previousValue) => {
  if (value && value !== previousValue) {
    appStore.showError(value)
  }
})

// ==================== Lifecycle ====================

onMounted(async () => {
  try {
    const settings = await getPublicSettings()
    turnstileEnabled.value = settings.turnstile_enabled
    turnstileSiteKey.value = settings.turnstile_site_key || ''
  } catch (error) {
    console.error('Failed to load public settings:', error)
  }
})

// ==================== Turnstile Handlers ====================

function onTurnstileVerify(token: string): void {
  turnstileToken.value = token
  errors.turnstile = ''
}

function onTurnstileExpire(): void {
  turnstileToken.value = ''
  errors.turnstile = t('auth.turnstileExpired')
}

function onTurnstileError(): void {
  turnstileToken.value = ''
  errors.turnstile = t('auth.turnstileFailed')
}

// ==================== Validation ====================

function validateForm(): boolean {
  errors.email = ''
  errors.turnstile = ''

  let isValid = true

  // Email validation
  if (!formData.email.trim()) {
    errors.email = t('auth.emailRequired')
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = t('auth.invalidEmail')
    isValid = false
  }

  // Turnstile validation
  if (turnstileChallengeRequired.value) {
    errors.turnstile = t('auth.completeVerification')
    isValid = false
  }

  return isValid
}

// ==================== Form Handlers ====================

async function handleSubmit(): Promise<void> {
  errorMessage.value = ''

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    await forgotPassword({
      email: formData.email,
      turnstile_token: turnstileEnabled.value && turnstileSiteKey.value ? turnstileToken.value : undefined
    })

    isSubmitted.value = true
    appStore.showSuccess(t('auth.resetEmailSent'))
  } catch (error: unknown) {
    // Reset Turnstile on error
    if (turnstileRef.value) {
      turnstileRef.value.reset()
      turnstileToken.value = ''
    }

    const err = error as { message?: string; response?: { data?: { detail?: string } } }

    if (err.response?.data?.detail) {
      errorMessage.value = err.response.data.detail
    } else if (err.message) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = t('auth.sendResetLinkFailed')
    }

    appStore.showError(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-recovery-panel {
  display: grid;
  gap: 1.5rem;
}

.auth-recovery-header {
  display: grid;
  gap: 0.75rem;
  text-align: left;
}

.auth-recovery-kicker {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid color-mix(in srgb, var(--atelier-blue) 24%, transparent);
  background: color-mix(in srgb, var(--atelier-paper-2) 86%, var(--atelier-blue) 14%);
  color: var(--atelier-blue);
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0;
}

.auth-recovery-heading {
  color: var(--atelier-ink);
  font-size: 1.65rem;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1.12;
}

.auth-recovery-copy {
  color: var(--atelier-muted);
  font-size: 0.92rem;
  line-height: 1.65;
}

.auth-recovery-status {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  border: 1px solid color-mix(in srgb, var(--atelier-blue) 20%, var(--atelier-ink) 16%);
  background: color-mix(in srgb, var(--atelier-paper) 88%, var(--atelier-blue) 12%);
  color: var(--atelier-ink);
  border-radius: 8px;
  padding: 1rem;
}

.auth-recovery-status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--atelier-blue) 24%, transparent);
  background: color-mix(in srgb, var(--atelier-paper-2) 78%, var(--atelier-blue) 22%);
  color: var(--atelier-blue);
}

.auth-recovery-status-body {
  display: grid;
  gap: 0.35rem;
}

.auth-recovery-status-body h3 {
  color: var(--atelier-ink);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.35;
}

.auth-recovery-status-body p,
.auth-recovery-error {
  color: var(--atelier-muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.auth-recovery-error {
  border: 1px solid color-mix(in srgb, var(--atelier-status-danger) 35%, var(--atelier-ink) 12%);
  background: color-mix(in srgb, var(--atelier-paper) 88%, var(--atelier-status-danger) 12%);
  color: color-mix(in srgb, var(--atelier-status-danger) 70%, var(--atelier-ink));
  border-radius: 8px;
  padding: 0.85rem 0.95rem;
}

.auth-recovery-action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--atelier-blue);
  font-weight: 650;
  transition: color 0.18s ease;
}

.auth-recovery-action:hover {
  color: var(--atelier-blue-dark);
}

.auth-recovery-submit {
  min-height: 2.8rem;
}

:global(.dark .auth-recovery-heading),
:global(.dark .auth-recovery-status-body h3) {
  color: rgba(248, 251, 255, 0.94);
}

:global(.dark .auth-recovery-copy),
:global(.dark .auth-recovery-status-body p) {
  color: rgba(248, 251, 255, 0.68);
}

:global(.dark .auth-recovery-status) {
  background: color-mix(in srgb, #111827 86%, var(--atelier-blue) 14%);
  border-color: rgba(248, 251, 255, 0.16);
}
</style>
