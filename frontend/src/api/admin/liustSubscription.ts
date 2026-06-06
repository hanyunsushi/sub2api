import { apiClient } from "@/api/client";
import type { TCDMXSubscriptionItem, TCDMXSubscriptionStatus } from "./tcdmxSubscription";

export type LiustSubscriptionItem = TCDMXSubscriptionItem;

export interface LiustSubscriptionStatus extends Omit<TCDMXSubscriptionStatus, "provider"> {
  provider: "liust" | string;
}

export async function getStatus(): Promise<LiustSubscriptionStatus> {
  const { data } = await apiClient.get<LiustSubscriptionStatus>("/admin/liust/subscription");
  return data;
}

export default {
  getStatus,
};
