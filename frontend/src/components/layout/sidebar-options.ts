// 侧边栏：仅声明控制台菜单所需数据形状，保留原应用的权限和路由所有权。
import type { VNodeChild } from 'vue'
export interface MenuOption {
  key?: string | number
  type?: string
  label?: string | ((item: MenuOption) => VNodeChild)
  icon?: (item?: MenuOption) => VNodeChild
  children?: MenuOption[]
  disabled?: boolean
  show?: boolean
  sidebarLabel?: string
  sidebarProject?: boolean
  sidebarProjectKey?: string
  sidebarProjectOwner?: string
  sidebarRouteKey?: string
  sidebarCaption?: string
  sidebarProjectLoading?: boolean
}
