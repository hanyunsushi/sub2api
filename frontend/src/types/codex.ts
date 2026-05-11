export type CodexAccountStatus = 'active' | 'expiring' | 'failed' | 'disabled' | 'unknown'
export type CodexAccountSource = 'file' | 'memory' | 'unknown'

export interface CpaAuthFileRaw {
  id?: string
  auth_index?: string
  name?: string
  provider?: string
  label?: string
  status?: string
  status_message?: string
  disabled?: boolean
  unavailable?: boolean
  runtime_only?: boolean
  source?: 'file' | 'memory' | string
  path?: string
  size?: number
  modtime?: string
  created_at?: string
  updated_at?: string
  last_refresh?: string
  email?: string
  account_type?: string
  account?: string
  success?: number
  failed?: number
  recent_requests?: Array<{ time: string; success: number; failed: number }>
  [key: string]: unknown
}

export interface CodexAccountView {
  key: string
  name: string
  provider: string
  label: string
  status: CodexAccountStatus
  statusMessage: string
  source: CodexAccountSource
  canDelete: boolean
  canDownload: boolean
  size?: number
  modifiedAt?: string
  lastRefreshAt?: string
  email?: string
  success?: number
  failed?: number
}

export interface CodexGroup {
  id: number
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CodexAccountMetadata {
  id: number
  auth_name: string
  group_id?: number | null
  display_name: string
  note: string
  local_tags: string[]
  settings: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UpdateCodexAccountMetadataRequest {
  auth_name?: string
  group_id?: number | null
  clear_group_id?: boolean
  display_name?: string
  note?: string
  local_tags?: string[]
  settings?: Record<string, unknown>
  sort_order?: number
}

export interface CreateCodexGroupRequest {
  name: string
  color?: string
  sort_order?: number
}

export interface CodexAccountMerged extends CodexAccountView {
  metadata?: CodexAccountMetadata
  group?: CodexGroup
}

export interface CpaRequestOptions {
  baseUrl?: string
  managementKey?: string
  signal?: AbortSignal
}
