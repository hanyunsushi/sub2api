import { apiClient } from './client'
import type {
  CodexAccountMetadata,
  CodexGroup,
  CreateCodexGroupRequest,
  UpdateCodexAccountMetadataRequest,
} from '@/types/codex'

export async function listGroups(): Promise<CodexGroup[]> {
  const { data } = await apiClient.get<CodexGroup[]>('/admin/codex/groups')
  return data
}

export async function createGroup(request: CreateCodexGroupRequest): Promise<CodexGroup> {
  const { data } = await apiClient.post<CodexGroup>('/admin/codex/groups', request)
  return data
}

export async function updateGroup(id: number, request: CreateCodexGroupRequest): Promise<CodexGroup> {
  const { data } = await apiClient.put<CodexGroup>(`/admin/codex/groups/${id}`, request)
  return data
}

export async function deleteGroup(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/codex/groups/${id}`)
  return data
}

export async function listAccountMetadata(): Promise<CodexAccountMetadata[]> {
  const { data } = await apiClient.get<CodexAccountMetadata[]>('/admin/codex/accounts/metadata')
  return data
}

export async function updateAccountMetadata(
  authName: string,
  request: UpdateCodexAccountMetadataRequest
): Promise<CodexAccountMetadata> {
  const encoded = encodeURIComponent(authName)
  const { data } = await apiClient.put<CodexAccountMetadata>(
    `/admin/codex/accounts/${encoded}/metadata`,
    request
  )
  return data
}

export async function deleteAccountMetadata(authName: string): Promise<{ message: string }> {
  const encoded = encodeURIComponent(authName)
  const { data } = await apiClient.delete<{ message: string }>(
    `/admin/codex/accounts/${encoded}/metadata`
  )
  return data
}
