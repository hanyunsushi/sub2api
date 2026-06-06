import { apiClient } from "@/api/client";
import type { TCDMXSubscriptionItem, TCDMXSubscriptionStatus } from "./tcdmxSubscription";

export type XHYAPISubscriptionItem = TCDMXSubscriptionItem;

export interface XHYAPISubscriptionStatus extends Omit<TCDMXSubscriptionStatus, "provider"> {
  provider: "xhyapi" | string;
}

export async function getStatus(): Promise<XHYAPISubscriptionStatus> {
  const { data } = await apiClient.get<XHYAPISubscriptionStatus>("/admin/xhyapi/subscription");
  return data;
}

export default {
  getStatus,
};
