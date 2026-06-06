import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import liustSubscriptionAPI from "@/api/admin/liustSubscription";

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("admin liust subscription api", () => {
  it("fetches liust quota and expiry without exposing credentials", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        provider: "liust",
        enabled: true,
        configured: true,
        currency: "USD",
        site_url: "https://liust.xyz",
        total_limit_usd: 90,
        used_usd: 14.25,
        remaining_usd: 75.75,
        expires_at: "2026-09-10T00:00:00Z",
        active_count: 1,
        subscriptions: [],
      },
    });

    const result = await liustSubscriptionAPI.getStatus();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/liust/subscription");
    expect(result.provider).toBe("liust");
    expect(result.remaining_usd).toBe(75.75);
    expect(result.site_url).toBe("https://liust.xyz");
    expect(result).not.toHaveProperty("api_token");
  });
});
