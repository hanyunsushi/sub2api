<template>
  <!-- 提示信息 / 警告信息：静态说明使用status，实际错误使用alert；语义不依赖颜色。 -->
  <div class="kreepai-info-notice" :data-tone="tone" :role="tone === 'danger' ? 'alert' : 'status'">
    <Icon :name="noticeIcons[tone]" filled class="kreepai-info-notice-icon" />
    <div class="kreepai-info-notice-body"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'
const noticeIcons = { info: 'infoCircle', warning: 'exclamationCircle', danger: 'xCircle', success: 'checkCircle' } as const
withDefaults(defineProps<{ tone?: 'info' | 'warning' | 'danger' | 'success' }>(), { tone: 'info' })
</script>

<style scoped>
/* 提示信息 / 警告信息：复用18px浅底说明，错误与成功分别使用真实反馈语义色。 */
.kreepai-info-notice {
  --notice-color: var(--accent, #0088ff);
  --notice-background: var(--accent-soft, #e9f3ff);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 18px;
  background: var(--notice-background);
  box-shadow: none;
  color: var(--text-2);
  font-size: 12.5px;
  line-height: 1.7;
}
.kreepai-info-notice[data-tone='warning'] { --notice-color: #ff8d28; --notice-background: rgb(255 141 40 / .15); }
.kreepai-info-notice[data-tone='danger'] { --notice-color: #ff383c; --notice-background: rgb(255 56 60 / .15); }
.kreepai-info-notice[data-tone='success'] { --notice-color: #34c759; --notice-background: rgb(52 199 89 / .15); }
.kreepai-info-notice-icon {
  display: grid;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  color: var(--notice-color);
}
.kreepai-info-notice-body { min-width: 0; flex: 1; overflow-wrap: anywhere; }
.kreepai-info-notice-body ul { margin: 6px 0 0; padding-left: 20px; }
.kreepai-info-notice--manual { margin-bottom: 12px; }
.kreepai-info-notice--settings { margin-bottom: 14px; }
.kreepai-info-notice--update { margin-top: 8px; }
.kreepai-info-notice--update-flow { margin-top: 16px; }
</style>
