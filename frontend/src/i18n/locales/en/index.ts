import landing from './landing'
import common from './common'
import dashboard from './dashboard'
import channelMonitorV2 from './channelMonitorV2'
import batchImage from './batchImage'
import admin from './admin'
import misc from './misc'

export default {
  customization: {
    sortBy: 'Sort by',
    ascending: 'Ascending',
    descending: 'Descending',
    selectAccount: 'Select account',
    externalSubscriptions: 'External Subscriptions',
    openMode: 'Open mode',
    iframe: 'Embedded page',
    redirect: 'Redirect',
    logoCdn: 'Logo CDN URL',
    logoPresets: 'Custom logo URLs',
    quotaBar: 'Quota bar'
  },
  ...landing,
  ...common,
  ...dashboard,
  ...channelMonitorV2,
  ...batchImage,
  admin,
  ...misc,
}
