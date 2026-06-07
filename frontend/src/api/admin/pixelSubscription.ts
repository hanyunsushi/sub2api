import { apiClient } from "@/api/client";
import type { TCDMXSubscriptionItem, TCDMXSubscriptionStatus } from "./tcdmxSubscription";

export type PixelSubscriptionItem = TCDMXSubscriptionItem;

export interface PixelSubscriptionStatus extends Omit<TCDMXSubscriptionStatus, "provider"> {
  provider: "pixel" | string;
}

export async function getStatus(): Promise<PixelSubscriptionStatus> {
  const { data } = await apiClient.get<PixelSubscriptionStatus>("/admin/pixel/subscription");
  return data;
}

export default {
  getStatus,
};
