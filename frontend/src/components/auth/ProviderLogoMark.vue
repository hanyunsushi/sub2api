<template>
  <span
    v-bind="$attrs"
    class="provider-logo-mark"
    :class="`provider-logo-mark--${provider}`"
    aria-hidden="true"
  >
    <Icon
      v-if="provider === 'email'"
      name="mail"
      size="md"
      class="provider-logo-mark__graphic provider-logo-mark__fallback"
    />
    <GitHubMark
      v-else-if="provider === 'github'"
      class="provider-logo-mark__graphic"
    />
    <GoogleMark
      v-else-if="provider === 'google'"
      class="provider-logo-mark__graphic"
    />
    <img
      v-else-if="provider === 'linuxdo'"
      class="provider-logo-mark__graphic"
      :src="linuxDoLogoURL"
      alt=""
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
    />
    <img
      v-else-if="provider === 'dingtalk'"
      class="provider-logo-mark__graphic"
      :src="dingtalkLogoURL"
      alt=""
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
    />
    <svg
      v-else-if="provider === 'wechat'"
      class="provider-logo-mark__graphic"
      viewBox="0 0 82 82"
      role="img"
      aria-label="WeChat"
    >
      <!-- Bubble outlines are adapted from the official WeChat homepage SVG asset. -->
      <path
        fill="#07C160"
        d="M29.84 12.617C15.2 12.617 3.33331 22.5837 3.33331 34.877C3.33331 41.5837 6.90665 47.6237 12.4933 51.7037C12.94 52.0237 13.2333 52.557 13.2333 53.157C13.2333 53.357 13.1933 53.537 13.14 53.7237C12.6933 55.4037 11.98 58.0904 11.9467 58.217C11.8933 58.4304 11.8067 58.6504 11.8067 58.8704C11.8067 59.3637 12.2 59.757 12.6933 59.757C12.8867 59.757 13.04 59.6837 13.2 59.5904L19.0067 56.2104C19.44 55.957 19.9067 55.8037 20.4133 55.8037C20.6867 55.8037 20.9467 55.8437 21.1933 55.9237C23.9 56.7104 26.82 57.1437 29.8467 57.1437C30.3334 57.1437 30.82 57.1304 31.3 57.1104C30.7267 55.3704 30.4067 53.5437 30.4067 51.657C30.4067 40.4437 41.2267 31.3503 54.5801 31.3503C55.0667 31.3503 55.1867 31.3637 55.6667 31.3903C53.6667 20.7503 43.06 12.617 29.84 12.617Z"
      />
      <path
        fill="#07C160"
        d="M69.0333 65.6769C73.6866 62.2769 76.6666 57.2436 76.6666 51.6503C76.6666 41.4036 66.78 33.0969 54.5799 33.0969C42.3799 33.0969 32.4932 41.4036 32.4932 51.6503C32.4932 61.8969 42.3866 70.2036 54.5799 70.2036C57.0999 70.2036 59.5333 69.8436 61.7933 69.1836C62 69.1236 62.2133 69.0836 62.44 69.0836C62.8666 69.0836 63.2466 69.2103 63.6133 69.4236L68.4466 72.237C68.58 72.317 68.7133 72.377 68.8733 72.377C69.28 72.377 69.6066 72.0436 69.6066 71.637C69.6066 71.4503 69.5333 71.2703 69.4866 71.097C69.46 70.9903 68.8666 68.7503 68.4933 67.357C68.4533 67.197 68.4133 67.0503 68.4133 66.8836C68.4133 66.3836 68.66 65.9436 69.0333 65.6769Z"
      />
      <circle cx="38.6734" cy="27.757" r="3.16" fill="#fff" />
      <circle cx="21" cy="27.757" r="3.16" fill="#fff" />
      <circle cx="61.94" cy="45.7169" r="2.78" fill="#fff" />
      <circle cx="47.2133" cy="45.7169" r="2.78" fill="#fff" />
    </svg>
    <img
      v-else-if="provider === 'oidc'"
      class="provider-logo-mark__graphic"
      :src="openidLogoURL"
      alt=""
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
    />
    <svg
      v-else
      class="provider-logo-mark__graphic"
      viewBox="0 0 32 32"
    >
      <path
        fill="#f7931e"
        d="M17.1 3.2v16.9c0 3.5-2.8 6.4-6.3 6.4a6.3 6.3 0 0 1-4.5-1.9 8.3 8.3 0 0 0 7.8 5.4c4.6 0 8.3-3.7 8.3-8.3V3.2h-5.3Z"
      />
      <path
        fill="#f7931e"
        d="M20.6 10.9 29 6.1v6.1l-8.4 4.8v-6.1Z"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
import GitHubMark from '@/components/auth/GitHubMark.vue'
import GoogleMark from '@/components/auth/GoogleMark.vue'
import Icon from '@/components/icons/Icon.vue'
import type { UserAuthProvider } from '@/types'

// Official static brand assets for third-party login binding marks.
const linuxDoLogoURL = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHZlcnNpb249IjEuMiIgYmFzZVByb2ZpbGU9InRpbnktcHMiIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTIwIDEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+TElOVVggRE8gTG9nbzwvdGl0bGU+PGNsaXBQYXRoIGlkPSJhIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI0NyIvPjwvY2xpcFBhdGg+PGNpcmNsZSBmaWxsPSIjZjBmMGYwIiBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiLz48cmVjdCBmaWxsPSIjMWMxYzFlIiBjbGlwLXBhdGg9InVybCgjYSkiIHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIzMCIvPjxyZWN0IGZpbGw9IiNmMGYwZjAiIGNsaXAtcGF0aD0idXJsKCNhKSIgeD0iMTAiIHk9IjQwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIi8+PHJlY3QgZmlsbD0iI2ZmYjAwMyIgY2xpcC1wYXRoPSJ1cmwoI2EpIiB4PSIxMCIgeT0iODAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiLz48L3N2Zz4='
const dingtalkLogoURL = 'https://gw.alicdn.com/imgextra/i1/O1CN01v0jO6U1J7o3hkhmNt_!!6000000000982-2-tps-240-240.png'
const openidLogoURL = 'https://openid.net/wp-content/uploads/2022/11/df-l-oix-l-openid_rgb-300dpi.png'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  provider: UserAuthProvider
}>()

</script>

<style scoped>
.provider-logo-mark {
  display: inline-flex;
  width: 1.25rem;
  height: 1.25rem;
  flex: 0 0 1.25rem;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.provider-logo-mark__graphic {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.provider-logo-mark--github {
  color: var(--anthropic-fg);
}
</style>
