import landing from './landing'
import common from './common'
import dashboard from './dashboard'
import channelMonitorV2 from './channelMonitorV2'
import batchImage from './batchImage'
import admin from './admin'
import misc from './misc'

export default {
  customization: {
    externalSubscriptions: '外部订阅',
    openMode: '打开方式',
    iframe: '内嵌页面',
    redirect: '直接跳转',
    logoCdn: 'Logo CDN 地址',
    logoPresets: '自定义 Logo URL',
    quotaBar: '额度条'
  },
  ...landing,
  ...common,
  ...dashboard,
  ...channelMonitorV2,
  ...batchImage,
  admin,
  ...misc,
}
