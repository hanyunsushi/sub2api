import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import tcdmxSubscriptionAPI from "@/api/admin/tcdmxSubscription";

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("admin tcdmx subscription api", () => {
  it("fetches TCDMX quota and expiry without exposing credentials", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        provider: "tcdmx",
        enabled: true,
        configured: true,
        currency: "USD",
        site_url: "https://tcdmx.com/subscriptions",
        total_limit_usd: 100,
        used_usd: 12.25,
        remaining_usd: 87.75,
        expires_at: "2026-07-08T00:00:00Z",
        active_count: 1,
        subscriptions: [],
      },
    });

    const result = await tcdmxSubscriptionAPI.getStatus();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/tcdmx/subscription");
    expect(result.remaining_usd).toBe(87.75);
    expect(result.site_url).toBe("https://tcdmx.com/subscriptions");
    expect(result).not.toHaveProperty("api_token");
  });
});
