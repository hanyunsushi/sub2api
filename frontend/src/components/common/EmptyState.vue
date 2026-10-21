<template>
  <!-- 提示信息：空数据与加载、错误保持分离；默认文案和调用方动作保留。 -->
  <div class="empty-state min-w-0 max-w-full [overflow-wrap:anywhere]">
    <!-- 卡片SVG / 图标底框：中性空态插图，不用成功或警告颜色暗示业务结果。 -->
    <div
      class="empty-state-illustration mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-dark-800"
    >
      <slot name="icon">
        <component v-if="icon" :is="icon" class="empty-state-icon h-10 w-10" aria-hidden="true" />
        <svg
          v-else
          class="empty-state-icon h-10 w-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </slot>
    </div>

    <!-- 提示信息：标题是空态正文，不继承页面标题的字体与层级。 -->
    <h3 class="empty-state-title" role="status">
      {{ displayTitle }}
    </h3>

    <!-- 提示信息：长描述可换行，保留调用方原文。 -->
    <p class="empty-state-description">
      {{ description }}
    </p>

    <!-- 高亮弧边按钮：继续使用原路由或 action 事件，调用方插槽负责自己的操作语义。 -->
    <div v-if="actionText || $slots.action" class="mt-6">
      <slot name="action">
        <component
          :is="actionTo ? 'RouterLink' : 'button'"
          v-if="actionText"
          :to="actionTo"
          :type="actionTo ? undefined : 'button'"
          @click="!actionTo && $emit('action')"
          class="btn btn-primary"
        >
          <Icon v-if="actionIcon" name="plus" size="md" class="mr-2" />
          {{ actionText }}
        </component>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Component } from 'vue'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()

interface Props {
  icon?: Component | string
  title?: string
  description?: string
  actionText?: string
  actionTo?: string | object
  actionIcon?: boolean
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  actionIcon: true
})

const displayTitle = computed(() => props.title || t('common.noData'))

defineEmits(['action'])
</script>

<style scoped>
/* 提示信息：空态最小180px/内距26px；不套卡片表面，不把普通描述当页面标题。 */
:root.kreepai-design-system .empty-state {
  min-height: 180px;
  padding: 26px;
  color: var(--text-3);
}

/* 卡片SVG：空态共用用户提供的透明SVG，文案与原操作不变。 */
:root.kreepai-design-system .empty-state-illustration {
  width: min(160px, 100%);
  height: 100px;
  margin-bottom: 9px;
  background: url('../../assets/illustrations/kreeper-placeholder-transparent.svg') center / contain no-repeat;
  opacity: 1;
  filter: none;
}

:root.kreepai-design-system .empty-state-illustration > * { visibility: hidden; }

:root.kreepai-design-system .empty-state-icon {
  width: 40px;
  height: 40px;
  margin: 0;
  color: inherit;
}

/* 提示信息：仅空态文案使用正文字体；按钮继续由共享视觉层负责。 */
:root.kreepai-design-system .empty-state-title,
:root.kreepai-design-system .empty-state-description {
  max-width: 100%;
  color: inherit;
  font: 400 12.5px/20px var(--ff-body);
}

:root.kreepai-design-system .empty-state-description {
  margin-top: 9px;
}
</style>
