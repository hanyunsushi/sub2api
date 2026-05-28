import { apiClient } from "@/api/client";

export interface BuzzBalance {
  enabled: boolean;
  configured: boolean;
  currency: "USD" | string;
  site_url: string;
  total: number;
  used: number;
  remaining: number;
  expires_at?: string;
  days_remaining?: number;
  refreshed_at?: string;
}

export async function getBalance(): Promise<BuzzBalance> {
  const { data } = await apiClient.get<BuzzBalance>("/admin/buzz/balance");
  return data;
}

export default {
  getBalance,
};
