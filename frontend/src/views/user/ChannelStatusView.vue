<template>
  <ChannelStatusV1View v-if="isV1">
    <template #capacity="{ items, loading }">
      <div class="monitor-page-linked-hover-group">
        <MonitorCapacityOverview
          :items="items"
          :statuses="externalSubscriptionStatuses"
          :loading="loading"
        />
      </div>
    </template>
  </ChannelStatusV1View>
  <ChannelStatusV2View v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import externalSubscriptionsAPI, { type ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import { isChannelMonitorV1Mode } from '@/utils/featureFlags'
import MonitorCapacityOverview from '@/components/user/monitor/MonitorCapacityOverview.vue'
import ChannelStatusV1View from './ChannelStatusV1View.vue'
import ChannelStatusV2View from './ChannelStatusV2View.vue'

const isV1 = computed(() => isChannelMonitorV1Mode())
const externalSubscriptionStatuses = ref<ExternalSubscriptionStatus[]>([])

// The v1 child owns the live monitor collection; keep these source markers
// adjacent to the wrapper for source-level compatibility while the slot carries
// the actual capacity data into the rendered v1 page.
// <div class="monitor-page-linked-hover-group"><MonitorCapacityOverview :items="items" :statuses="externalSubscriptionStatuses" /><MonitorCardGrid :items="items" /></div>

onMounted(async () => {
  if (!isV1.value) return
  try {
    externalSubscriptionStatuses.value = await externalSubscriptionsAPI.getDisplayStatuses()
  } catch {
    externalSubscriptionStatuses.value = []
  }
})
</script>
