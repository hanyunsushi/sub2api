import { ref } from 'vue'

const dropdownOpenEventName = 'sub2api:dropdown-open'

export interface DropdownOpenEventDetail {
  owner: string
}

export const activeDropdownOwner = ref<string | null>(null)

export const claimDropdownOwner = (owner: string) => {
  activeDropdownOwner.value = owner
  if (typeof document === 'undefined') return
  document.dispatchEvent(
    new CustomEvent<DropdownOpenEventDetail>(dropdownOpenEventName, {
      detail: { owner }
    })
  )
}

export const releaseDropdownOwner = (owner: string) => {
  if (activeDropdownOwner.value === owner) {
    activeDropdownOwner.value = null
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
