<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div
        v-if="announcementStore.currentPopup"
        class="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[rgba(20,19,19,0.48)] p-4 pt-[8vh]"
      >
        <div data-testid="common-announcement-popup-div-div"
          class="w-full max-w-[680px] overflow-hidden rounded-lg border border-[var(--atelier-line-strong)] bg-[var(--atelier-paper)] shadow-none"
          @click.stop
        >
          <div class="border-b border-[var(--atelier-line)] bg-[var(--atelier-paper-2)] px-8 py-6">
            <div>
              <!-- Icon and badge -->
              <div class="mb-3 flex items-center gap-2">
                <div class="announcement-popup-icon flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-none">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span class="announcement-popup-badge inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-white shadow-none">
                  <span class="relative flex h-2 w-2">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--anthropic-page)] opacity-75"></span>
                    <span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--anthropic-page)]"></span>
                  </span>
                  {{ t('announcements.unread') }}
                </span>
              </div>

              <!-- Title -->
              <h2 class="mb-2 font-serif text-2xl font-medium leading-tight text-[var(--atelier-ink)]">
                {{ announcementStore.currentPopup.title }}
              </h2>

              <div class="flex items-center gap-1.5 text-sm text-[var(--atelier-muted)]">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <time>{{ displayedAnnouncement ? formatRelativeWithDateTime(displayedAnnouncement.created_at) : '' }}</time>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="max-h-[50vh] overflow-y-auto bg-[var(--atelier-paper)] px-8 py-8">
            <div class="relative">
              <div class="announcement-popup-accent absolute bottom-0 left-0 top-0 w-1 rounded-full"></div>
              <div class="pl-6">
                <div
                  class="markdown-body prose prose-sm max-w-none dark:prose-invert"
                  v-html="renderedContent"
                ></div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-[var(--atelier-line)] bg-[var(--atelier-paper-2)] px-8 py-5">
            <div class="flex items-center justify-end">
              <button data-testid="common-announcement-popup-button-handle-dismiss"
                @click="handleDismiss"
                class="announcement-popup-dismiss rounded-lg px-6 py-2.5 text-sm font-medium text-[var(--atelier-paper)] shadow-none transition-all hover:shadow-none"
              >
                <span class="flex items-center gap-2">
                  <svg v-if="preview" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ preview ? t('common.close') : t('announcements.markRead') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAnnouncementStore } from '@/stores/announcements'
import { formatRelativeWithDateTime } from '@/utils/format'
import type { Announcement, UserAnnouncement } from '@/types'
import '@/styles/announcement-markdown.css'

type PreviewAnnouncement = Pick<Announcement | UserAnnouncement, 'title' | 'content' | 'created_at'>

const props = withDefaults(defineProps<{
  announcement?: PreviewAnnouncement | null
  preview?: boolean
}>(), {
  announcement: null,
  preview: false,
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const announcementStore = useAnnouncementStore()
const displayedAnnouncement = computed(() => (
  props.preview ? props.announcement : announcementStore.currentPopup
))

marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  const content = displayedAnnouncement.value?.content
  if (!content) return ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

function handleDismiss() {
  if (props.preview) {
    emit('close')
    return
  }
  announcementStore.dismissPopup()
}

// Manage body overflow — only set, never unset (bell component handles restore)
watch(
  displayedAnnouncement,
  (popup) => {
    if (popup) {
      document.body.style.overflow = 'hidden'
    } else if (props.preview) {
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.preview) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.popup-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.popup-fade-enter-from > div {
  transform: translate3d(0, -12px, 0);
  opacity: 0;
}

.popup-fade-leave-to > div {
  transform: translate3d(0, -8px, 0);
  opacity: 0;
}

.announcement-popup-icon,
.announcement-popup-badge,
.announcement-popup-accent,
.announcement-popup-dismiss {
  background: var(--atelier-ink, #141413);
  box-shadow: none;
}

.announcement-popup-dismiss:hover {
  background: var(--atelier-dark, #3d3d3a);
}

/* Scrollbar Styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--atelier-dust, #87867f);
  border-radius: 4px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--atelier-muted, #5e5d59);
}
</style>
