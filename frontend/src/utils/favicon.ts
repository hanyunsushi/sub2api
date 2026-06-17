export function updateFavicon(logoUrl: string) {
  const normalizedLogoUrl = logoUrl?.trim()
  if (!normalizedLogoUrl) return

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-site-favicon="true"], link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.dataset.siteFavicon = 'true'
  if (normalizedLogoUrl.startsWith('data:')) {
    const mimeMatch = normalizedLogoUrl.match(/^data:([^;,]+)[;,]/)
    link.type = mimeMatch?.[1] || 'image/png'
  } else {
    link.type = normalizedLogoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  }
  link.href = normalizedLogoUrl
}
