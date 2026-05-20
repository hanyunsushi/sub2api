import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

const interactiveDropdownFiles = [
  'components/common/LocaleSwitcher.vue',
  'components/common/ProxySelector.vue',
  'components/common/SubscriptionProgressMini.vue',
  'components/common/VersionBadge.vue',
  'components/layout/AppHeader.vue',
  'components/account/ModelWhitelistSelector.vue',
  'components/admin/usage/UsageFilters.vue',
  'components/admin/group/GroupRateMultipliersModal.vue',
  'components/admin/group/GroupRPMOverridesModal.vue',
  'views/admin/AccountsView.vue',
  'views/admin/ChannelsView.vue',
  'views/admin/GroupsView.vue',
  'views/admin/ProxiesView.vue',
  'views/admin/SubscriptionsView.vue',
  'views/admin/UsageView.vue',
  'views/admin/UsersView.vue'
]

describe('interactive dropdown portal coverage', () => {
  it.each(interactiveDropdownFiles)('%s renders hand-written dropdowns through FloatingDropdown', (path) => {
    expect(read(path)).toContain('FloatingDropdown')
  })

  it('keeps high-risk dropdowns out of local absolute stacking contexts', () => {
    const sources = interactiveDropdownFiles.map(read).join('\n')

    expect(sources).not.toContain('class="select-dropdown"')
    expect(sources).not.toContain('class="absolute left-0 right-0 top-full z-50')
    expect(sources).not.toContain('class="absolute z-50 mt-1 max-h-60 w-full overflow-auto')
    expect(sources).not.toContain('class="absolute right-0 top-full z-50')
    expect(sources).not.toContain('class="absolute right-0 z-50 mt-2')
    expect(sources).not.toContain('class="absolute z-50 mt-1 max-h-48 w-full overflow-auto')
  })
})
