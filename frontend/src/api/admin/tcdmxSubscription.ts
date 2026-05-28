import { apiClient } from "@/api/client";

export interface TCDMXSubscriptionItem {
  id: number;
  group_id: number;
  group_name: string;
  status: string;
  window: "daily" | "weekly" | "monthly" | "unlimited" | string;
  limit_usd?: number;
  used_usd: number;
  remaining_usd?: number;
  expires_at?: string;
  days_remaining?: number;
}

export interface TCDMXSubscriptionStatus {
  provider: "tcdmx" | string;
  enabled: boolean;
  configured: boolean;
  currency: "USD" | string;
  site_url: string;
  total_limit_usd?: number;
  used_usd: number;
  remaining_usd?: number;
  expires_at?: string;
  days_remaining?: number;
  active_count: number;
  subscriptions: TCDMXSubscriptionItem[];
  refreshed_at?: string;
}

export async function getStatus(): Promise<TCDMXSubscriptionStatus> {
  const { data } = await apiClient.get<TCDMXSubscriptionStatus>("/admin/tcdmx/subscription");
  return data;
}

export default {
  getStatus,
};
