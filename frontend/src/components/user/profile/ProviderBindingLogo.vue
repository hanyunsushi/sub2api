<template>
  <span
    class="profile-binding-provider-logo"
    :class="`profile-binding-provider-logo--${provider}`"
    :aria-label="label"
    :title="label"
    :data-testid="`profile-binding-${provider}-logo`"
  >
    <ProviderLogoMark
      :provider="provider"
      class="profile-binding-provider-logo__mark"
    />
  </span>
</template>

<script setup lang="ts">
import ProviderLogoMark from '@/components/auth/ProviderLogoMark.vue'
import type { UserAuthProvider } from '@/types'

defineProps<{
  provider: UserAuthProvider
  label: string
}>()
</script>

<style scoped>
.profile-binding-provider-logo {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-grid;
  flex: 0 0 2.75rem;
  place-items: center;
  border: 1px solid var(--anthropic-border-subtle);
  border-radius: 8px;
  background: var(--anthropic-page);
  color: var(--anthropic-fg);
  box-shadow: none;
}

.profile-binding-provider-logo__mark {
  width: 1.5rem;
  height: 1.5rem;
}

.profile-binding-provider-logo--google .profile-binding-provider-logo__mark {
  width: 1.55rem;
  height: 1.55rem;
}

.profile-binding-provider-logo--linuxdo .profile-binding-provider-logo__mark,
.profile-binding-provider-logo--wechat .profile-binding-provider-logo__mark,
.profile-binding-provider-logo--dingtalk .profile-binding-provider-logo__mark {
  width: 1.625rem;
  height: 1.625rem;
}
</style>
