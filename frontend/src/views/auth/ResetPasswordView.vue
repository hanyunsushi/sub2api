<template>
  <AuthLayout>
    <div class="auth-recovery-panel">
      <div class="auth-recovery-header">
        <div class="auth-recovery-kicker">
          <Icon name="lock" size="sm" />
          <span>{{ t('auth.resetPassword') }}</span>
        </div>
        <h2 class="auth-recovery-heading">
          {{ t('auth.resetPasswordTitle') }}
        </h2>
        <p class="auth-recovery-copy">
          {{ t('auth.resetPasswordHint') }}
        </p>
      </div>

      <div v-if="isInvalidLink" class="space-y-6">
        <div class="auth-recovery-status auth-recovery-status-warning">
          <div class="auth-recovery-status-icon">
            <Icon name="exclamationCircle" size="lg" />
          </div>
          <div class="auth-recovery-status-body">
            <h3>{{ t('auth.invalidResetLink') }}</h3>
            <p>{{ t('auth.invalidResetLinkHint') }}</p>
          </div>
        </div>

        <div class="text-center">
          <router-link
            to="/forgot-password"
            class="auth-recovery-action"
          >
            {{ t('auth.requestNewResetLink') }}
          </router-link>
        </div>
      </div>

      <div v-else-if="isSuccess" class="space-y-6">
        <div class="auth-recovery-status auth-recovery-status-success">
          <div class="auth-recovery-status-icon">
            <Icon name="checkCircle" size="lg" />
          </div>
          <div class="auth-recovery-status-body">
            <h3>{{ t('auth.passwordResetSuccess') }}</h3>
            <p>{{ t('auth.passwordResetSuccessHint') }}</p>
          </div>
        </div>

        <div class="text-center">
          <router-link
            to="/login"
            class="btn btn-primary inline-flex items-center gap-2"
          >
            <Icon name="login" size="md" />
            {{ t('auth.signIn') }}
          </router-link>
        </div>
      </div>

      <!-- Form State -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Email (readonly) -->
        <div>
          <label for="email" class="input-label">
            {{ t('auth.emailLabel') }}
          </label>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icon name="mail" size="md" class="text-gray-400 dark:text-dark-500" />
            </div>
            <input data-testid="auth-reset-password-input-email"
              id="email"
              :value="email"
              type="email"
              readonly
              disabled
              class="input auth-recovery-readonly pl-11"
            />
          </div>
        </div>

        <!-- New Password Input -->
        <div>
          <label for="password" class="input-label">
            {{ t('auth.newPassword') }}
          </label>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icon name="lock" size="md" class="text-gray-400 dark:text-dark-500" />
            </div>
            <input data-testid="auth-reset-password-input-form-data-password"
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              :disabled="isLoading"
              class="input pl-11 pr-11"
              :class="{ 'input-error': errors.password }"
              :placeholder="t('auth.newPasswordPlaceholder')"
            />
            <button data-testid="auth-reset-password-button-show-password-show-password"
              type="button"
              @click="showPassword = !showPassword"
              class="auth-recovery-field-action"
            >
              <Icon v-if="showPassword" name="eyeOff" size="md" />
              <Icon v-else name="eye" size="md" />
            </button>
          </div>
        </div>

        <!-- Confirm Password Input -->
        <div>
          <label for="confirmPassword" class="input-label">
            {{ t('auth.confirmPassword') }}
          </label>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icon name="lock" size="md" class="text-gray-400 dark:text-dark-500" />
            </div>
            <input data-testid="auth-reset-password-input-form-data-confirm-password"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              :disabled="isLoading"
              class="input pl-11 pr-11"
              :class="{ 'input-error': errors.confirmPassword }"
              :placeholder="t('auth.confirmPasswordPlaceholder')"
            />
            <button data-testid="auth-reset-password-button-show-confirm-password-show-confirm-password"
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="auth-recovery-field-action"
            >
              <Icon v-if="showConfirmPassword" name="eyeOff" size="md" />
              <Icon v-else name="eye" size="md" />
            </button>
          </div>
        </div>

        <p v-if="errorMessage" class="auth-recovery-error">
          {{ errorMessage }}
        </p>

        <button data-testid="auth-reset-password-button-submit"
          type="submit"
          :disabled="isLoading"
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
          <Icon v-else name="checkCircle" size="md" class="mr-2" />
          {{ isLoading ? t('auth.resettingPassword') : t('auth.resetPassword') }}
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AuthLayout } from '@/components/layout'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores'
import { resetPassword } from '@/api/auth'

const { t } = useI18n()

// ==================== Router & Stores ====================

const route = useRoute()
const appStore = useAppStore()

// ==================== State ====================

const isLoading = ref<boolean>(false)
const isSuccess = ref<boolean>(false)
const errorMessage = ref<string>('')
const showPassword = ref<boolean>(false)
const showConfirmPassword = ref<boolean>(false)

// URL parameters
const email = ref<string>('')
const token = ref<string>('')

const formData = reactive({
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  password: '',
  confirmPassword: ''
})

const validationToastMessage = computed(
  () => errors.password || errors.confirmPassword || ''
)

watch(validationToastMessage, (value, previousValue) => {
  if (value && value !== previousValue) {
    appStore.showError(value)
  }
})

// Check if the reset link is valid (has email and token)
const isInvalidLink = computed(() => !email.value || !token.value)

// ==================== Lifecycle ====================

onMounted(() => {
  // Get email and token from URL query parameters
  email.value = (route.query.email as string) || ''
  token.value = (route.query.token as string) || ''

  if (!email.value || !token.value) {
    appStore.showError(t('auth.invalidResetLink'))
  }
})

// ==================== Validation ====================

function validateForm(): boolean {
  errors.password = ''
  errors.confirmPassword = ''

  let isValid = true

  // Password validation
  if (!formData.password) {
    errors.password = t('auth.passwordRequired')
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = t('auth.passwordMinLength')
    isValid = false
  }

  // Confirm password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = t('auth.confirmPasswordRequired')
    isValid = false
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = t('auth.passwordsDoNotMatch')
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
    await resetPassword({
      email: email.value,
      token: token.value,
      new_password: formData.password
    })

    isSuccess.value = true
    appStore.showSuccess(t('auth.passwordResetSuccess'))
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: { detail?: string; code?: string } } }

    // Check for invalid/expired token error
    if (err.response?.data?.code === 'INVALID_RESET_TOKEN') {
      errorMessage.value = t('auth.invalidOrExpiredToken')
    } else if (err.response?.data?.detail) {
      errorMessage.value = err.response.data.detail
    } else if (err.message) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = t('auth.resetPasswordFailed')
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

.auth-recovery-status-warning {
  border-color: color-mix(in srgb, #d97706 32%, var(--atelier-ink) 10%);
  background: color-mix(in srgb, var(--atelier-paper) 86%, #d97706 14%);
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

.auth-recovery-status-warning .auth-recovery-status-icon {
  border-color: color-mix(in srgb, #d97706 34%, transparent);
  background: color-mix(in srgb, var(--atelier-paper-2) 76%, #d97706 24%);
  color: #92400e;
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
  border: 1px solid color-mix(in srgb, #dc2626 35%, var(--atelier-ink) 12%);
  background: color-mix(in srgb, var(--atelier-paper) 88%, #dc2626 12%);
  color: color-mix(in srgb, #dc2626 70%, var(--atelier-ink));
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

.auth-recovery-readonly {
  background: color-mix(in srgb, var(--atelier-paper-2) 78%, var(--atelier-ink) 4%);
}

.auth-recovery-field-action {
  position: absolute;
  inset-block: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding-right: 0.875rem;
  color: var(--atelier-muted);
  transition: color 0.18s ease;
}

.auth-recovery-field-action:hover {
  color: var(--atelier-blue);
}

:global(.theme-cloudflare .auth-recovery-kicker),
:global(.theme-cloudflare .auth-recovery-status-icon) {
  background: color-mix(in srgb, var(--atelier-paper-2) 84%, #f6821f 16%);
  border-color: color-mix(in srgb, #f6821f 30%, transparent);
  color: #b85c00;
}

:global(.theme-cloudflare .auth-recovery-status) {
  background: color-mix(in srgb, var(--atelier-paper) 90%, #f6821f 10%);
  border-color: color-mix(in srgb, #f6821f 28%, var(--atelier-ink) 10%);
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
  background: color-mix(in srgb, var(--atelier-dark) 86%, var(--atelier-blue) 14%);
  border-color: rgba(248, 251, 255, 0.16);
}
</style>
