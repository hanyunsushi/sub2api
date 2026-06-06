import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import xhyapiSubscriptionAPI from "@/api/admin/xhyapiSubscription";

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("admin xhyapi subscription api", () => {
  it("fetches XHYAPI quota and expiry without exposing credentials", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        provider: "xhyapi",
        enabled: true,
        configured: true,
        currency: "USD",
        site_url: "https://xhyapi.com",
        total_limit_usd: 120,
        used_usd: 20.25,
        remaining_usd: 99.75,
        expires_at: "2026-08-09T00:00:00Z",
        active_count: 1,
        subscriptions: [],
      },
    });

    const result = await xhyapiSubscriptionAPI.getStatus();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/xhyapi/subscription");
    expect(result.provider).toBe("xhyapi");
    expect(result.remaining_usd).toBe(99.75);
    expect(result.site_url).toBe("https://xhyapi.com");
    expect(result).not.toHaveProperty("api_token");
  });
});
