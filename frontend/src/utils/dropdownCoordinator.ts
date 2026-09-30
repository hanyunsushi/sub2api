const dropdownOpenEventName = 'sub2api:dropdown-open'

export interface DropdownOpenEventDetail {
  owner: string
}

let activeDropdownOwner: string | null = null

export const claimDropdownOwner = (owner: string) => {
  if (activeDropdownOwner === owner) return
  activeDropdownOwner = owner
  if (typeof document === 'undefined') return
  document.dispatchEvent(
    new CustomEvent<DropdownOpenEventDetail>(dropdownOpenEventName, {
      detail: { owner }
    })
  )
}

export const releaseDropdownOwner = (owner: string) => {
  if (activeDropdownOwner === owner) {
    activeDropdownOwner = null
  }
}

export const onDropdownOwnerClaimed = (handler: (owner: string) => void) => {
  if (typeof document === 'undefined') return () => {}

  const listener = (event: Event) => {
    const owner = (event as CustomEvent<DropdownOpenEventDetail>).detail?.owner
    if (owner) handler(owner)
  }

  document.addEventListener(dropdownOpenEventName, listener)
  return () => document.removeEventListener(dropdownOpenEventName, listener)
}
