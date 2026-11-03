import type { SVGProps } from 'react'
import { resolveSfIcon, type SfIconName } from './sf-symbols'

// 卡片SVG：React日期等桥接与Vue使用同一SF数据；选中/展开而非hover切换真实Fill。
export function SfSymbolReact({ name, filled = false, label, ...props }: Omit<SVGProps<SVGSVGElement>, 'name'> & { name: SfIconName; filled?: boolean; label?: string }) {
  const { exportName, symbol } = resolveSfIcon(name, filled)
  return <svg width={16} height={16} {...props} viewBox={symbol.viewBox} preserveAspectRatio="xMidYMid meet" fill="currentColor" stroke="none" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" data-icon-library="SF Symbols" data-icon-export={`sf${exportName}`} data-icon-weight="Regular" data-icon-variant={filled ? 'fill' : 'default'}>
    {symbol.paths.map((path, index) => <path key={index} d={path.d} fillOpacity={path.fillOpacity} fillRule={path.fillRule as 'nonzero' | 'evenodd' | undefined} clipRule={path.clipRule as 'nonzero' | 'evenodd' | undefined} />)}
  </svg>
}
