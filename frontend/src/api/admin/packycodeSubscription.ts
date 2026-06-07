import { apiClient } from "@/api/client";
import type { TCDMXSubscriptionItem, TCDMXSubscriptionStatus } from "./tcdmxSubscription";

export type PackyCodeSubscriptionItem = TCDMXSubscriptionItem;

export interface PackyCodeSubscriptionStatus extends Omit<TCDMXSubscriptionStatus, "provider"> {
  provider: "packycode" | string;
}

export async function getStatus(): Promise<PackyCodeSubscriptionStatus> {
  const { data } = await apiClient.get<PackyCodeSubscriptionStatus>("/admin/packycode/subscription");
  return data;
}

export default {
  getStatus,
};
