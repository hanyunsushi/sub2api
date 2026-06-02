import { apiClient } from "@/api/client";
import type { TCDMXSubscriptionItem, TCDMXSubscriptionStatus } from "./tcdmxSubscription";

export type QLHazyCoderSubscriptionItem = TCDMXSubscriptionItem;

export interface QLHazyCoderSubscriptionStatus extends Omit<TCDMXSubscriptionStatus, "provider"> {
  provider: "qlhazycoder" | string;
}

export async function getStatus(): Promise<QLHazyCoderSubscriptionStatus> {
  const { data } = await apiClient.get<QLHazyCoderSubscriptionStatus>("/admin/qlhazycoder/subscription");
  return data;
}

export default {
  getStatus,
};
