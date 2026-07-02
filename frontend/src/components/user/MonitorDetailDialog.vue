<template>
  <BaseDialog
    :show="show"
    :title="title"
    width="wide"
    @close="$emit('close')"
  >
    <div v-if="loading" class="py-8 text-center text-sm text-[var(--anthropic-muted)]">
      {{ t('common.loading') }}
    </div>
    <div v-else-if="!detail" class="py-8 text-center text-sm text-[var(--anthropic-muted)]">
      {{ t('channelStatus.detailLoadError') }}
    </div>
    <div v-else class="monitor-detail-table-scroll overflow-x-auto">
      <table class="monitor-detail-table min-w-[760px] w-full table-fixed text-left text-sm">
        <colgroup>
          <col class="w-[30%]" />
          <col class="w-[14%]" />
          <col class="w-[14%]" />
          <col class="w-[10%]" />
          <col class="w-[10%]" />
          <col class="w-[10%]" />
          <col class="w-[12%]" />
        </colgroup>
        <thead class="border-b border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]">
          <tr class="text-xs uppercase tracking-wider text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
            <th class="py-2 pr-3">{{ t('channelStatus.detailColumns.model') }}</th>
            <th class="py-2 pr-3">{{ t('channelStatus.detailColumns.latestStatus') }}</th>
            <th class="py-2 pr-3">{{ t('channelStatus.detailColumns.latestLatency') }}</th>
            <th class="py-2 pr-3">{{ t('channelStatus.detailColumns.availability7d') }}</th>
            <th class="py-2 pr-3">{{ t('channelStatus.detailColumns.availability15d') }}</th>
            <th class="py-2 pr-3">{{ t('channelStatus.detailColumns.availability30d') }}</th>
            <th class="py-2 pr-3">{{ t('channelStatus.detailColumns.avgLatency7d') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in detail.models"
            :key="m.model"
            class="border-b border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"
          >
            <td class="py-2 pr-3 font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)]">
              <span class="block truncate">{{ m.model }}</span>
            </td>
            <td class="py-2 pr-3">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
                :class="statusBadgeClass(m.latest_status)"
              >
                {{ statusLabel(m.latest_status) }}
              </span>
            </td>
            <td class="py-2 pr-3 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ formatLatency(m.latest_latency_ms) }}</td>
            <td class="py-2 pr-3 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ formatPercent(m.availability_7d) }}</td>
            <td class="py-2 pr-3 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ formatPercent(m.availability_15d) }}</td>
            <td class="py-2 pr-3 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ formatPercent(m.availability_30d) }}</td>
            <td class="py-2 pr-3 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ formatLatency(m.avg_latency_7d_ms) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button data-testid="user-monitor-detail-button-emit-close" @click="$emit('close')" class="btn btn-secondary">
          {{ t('channelStatus.closeDetail') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  status as fetchChannelMonitorDetail,
  type UserMonitorDetail,
} from '@/api/channelMonitor'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'

const props = defineProps<{
  show: boolean
  monitorId: number | null
  title: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const appStore = useAppStore()
const { statusLabel, statusBadgeClass, formatLatency, formatPercent } = useChannelMonitorFormat()

const detail = ref<UserMonitorDetail | null>(null)
const loading = ref(false)

async function load(id: number) {
  detail.value = null
  loading.value = true
  try {
    detail.value = await fetchChannelMonitorDetail(id)
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('channelStatus.detailLoadError')))
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.show, props.monitorId] as const,
  ([show, id]) => {
    if (!show) {
      detail.value = null
      return
    }
    if (id != null) void load(id)
  },
  { immediate: true },
)
</script>

<style scoped>
.monitor-detail-table-scroll {
  scrollbar-gutter: stable;
}

.monitor-detail-table th,
.monitor-detail-table td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
