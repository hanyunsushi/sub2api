import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const copyToClipboard = vi.fn().mockResolvedValue(true)

const messages: Record<string, string> = {
  'keys.endpoints.title': 'API 端点',
  'keys.endpoints.default': '默认',
  'keys.endpoints.copied': '已复制',
  'keys.endpoints.copiedHint': '已复制到剪贴板',
  'keys.endpoints.clickToCopy': '点击可复制此端点',
  'keys.endpoints.speedTest': '测速',
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => messages[key] ?? key,
  }),
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({
    copyToClipboard,
  }),
}))

import EndpointPopover from '../EndpointPopover.vue'

describe('EndpointPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('将说明提示渲染到 body 浮层而不是旧的 title 图标上', async () => {
    const wrapper = mount(EndpointPopover, {
      attachTo: document.body,
      props: {
        apiBaseUrl: 'https://default.example.com/v1',
        customEndpoints: [
          {
            name: '备用线路',
            endpoint: 'https://backup.example.com/v1',
            description: '自定义说明',
          },
        ],
      },
    })

    const backupTrigger = wrapper.findAll('[data-testid="endpoint-tooltip-trigger"]')[1]
    await backupTrigger.trigger('mouseenter')
    await flushPromises()

    const tooltip = document.body.querySelector('.endpoint-tooltip')
    expect(tooltip?.textContent).toContain('自定义说明')
    expect(tooltip?.textContent).toContain('点击可复制此端点')
    expect(tooltip?.parentElement).toBe(document.body)
    expect(backupTrigger.attributes('title')).toBeUndefined()
    expect(wrapper.find('[title="自定义说明"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('uses a body-level fixed tooltip so the endpoint hint is not clipped by filter bars', async () => {
    const wrapper = mount(EndpointPopover, {
      attachTo: document.body,
      props: {
        apiBaseUrl: 'https://default.example.com/v1',
        customEndpoints: [],
      },
    })

    expect(wrapper.find('.endpoint-tooltip').exists()).toBe(false)
    expect(wrapper.find('[data-testid="endpoint-tooltip-trigger"]').exists()).toBe(true)
    await wrapper.find('[data-testid="endpoint-tooltip-trigger"]').trigger('mouseenter')
    await flushPromises()
    const tooltip = document.body.querySelector<HTMLElement>('.endpoint-tooltip')
    expect(tooltip).not.toBeNull()
    expect(tooltip?.parentElement).toBe(document.body)
    expect(tooltip?.style.position).toBe('fixed')
    expect(tooltip?.style.zIndex).toBe('100000220')
    wrapper.unmount()
  })

  it('点击 URL 后会复制并切换为已复制提示', async () => {
    const wrapper = mount(EndpointPopover, {
      attachTo: document.body,
      props: {
        apiBaseUrl: 'https://default.example.com/v1',
        customEndpoints: [],
      },
    })

    await wrapper.find('[role="button"]').trigger('click')
    await flushPromises()

    expect(copyToClipboard).toHaveBeenCalledWith('https://default.example.com/v1', '已复制')
    await wrapper.find('[data-testid="endpoint-tooltip-trigger"]').trigger('mouseenter')
    await flushPromises()
    expect(document.body.querySelector('.endpoint-tooltip')?.textContent).toContain('已复制到剪贴板')
    expect(wrapper.find('button[aria-label="已复制到剪贴板"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
