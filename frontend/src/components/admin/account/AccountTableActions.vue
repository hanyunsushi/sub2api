<template>
  <div class="flex flex-wrap items-center gap-3">
    <slot name="before"></slot>
    <!-- 普通按钮 / 高亮弧边按钮：页面操作始终留在账号页，刷新等待由真实请求控制。 -->
    <RefreshButton :label="t('common.refresh')" :loading="loading" @refresh="$emit('refresh')" />
    <slot name="after"></slot>
    <slot name="beforeCreate"></slot>
    <button type="button" @click="$emit('create')" class="btn btn-primary">{{ t('admin.accounts.createAccount') }}</button>
    <slot name="afterCreate"></slot>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import RefreshButton from '@/components/common/RefreshButton.vue'

defineProps(['loading'])
defineEmits(['refresh', 'create'])

const { t } = useI18n()
</script>
