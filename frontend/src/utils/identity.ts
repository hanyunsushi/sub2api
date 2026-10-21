// 区分-身份牌：原用户名稳定映射六组身份色，不表达健康/权限。
export const AVATAR_PALETTE = [
  { background: '#5856d6', color: '#433f9f' },
  { background: '#af52de', color: '#7d2a9f' },
  { background: '#ff2d55', color: '#b51c3e' },
  { background: '#5ac8fa', color: '#18789f' },
  { background: '#32ade6', color: '#176785' },
  { background: '#00c7be', color: '#087d78' },
]
export function initial(name: string) { return (name || '?').charAt(0).toUpperCase() }
function hashHue(name: string) {
  let h = 0
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}
export function avatarStyle(name: string) {
  const color = AVATAR_PALETTE[hashHue(name) % AVATAR_PALETTE.length]
  return {
    background: `color-mix(in srgb, ${color.background} 12%, white)`,
    color: color.color,
  }
}
