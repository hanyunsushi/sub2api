import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import GroupCapacityBadge from '../GroupCapacityBadge.vue'

describe('GroupCapacityBadge', () => {
  it('only marks in-use capacity badges as active', () => {
    const wrapper = mount(GroupCapacityBadge, {
      props: {
        concurrencyUsed: 2,
        concurrencyMax: 10,
        sessionsUsed: 1,
        sessionsMax: 4,
        rpmUsed: 0,
        rpmMax: 60
      }
    })

    const badges = wrapper.findAll('.group-capacity-badge')

    expect(badges).toHaveLength(3)
    expect(badges[0].classes()).toContain('group-capacity-badge-active')
    expect(badges[1].classes()).toContain('group-capacity-badge-active')
    expect(badges[2].classes()).not.toContain('group-capacity-badge-active')
    expect(wrapper.find('.group-capacity-cell').classes()).toContain('account-capacity-cell')
  })
})
