import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import packycodeSubscriptionAPI from "@/api/admin/packycodeSubscription";

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("admin packycode subscription api", () => {
  it("fetches PackyCode quota and expiry without exposing credentials", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        provider: "packycode",
        enabled: true,
        configured: true,
        currency: "CNY",
        site_url: "https://www.packyapi.com",
        total_limit_usd: 120,
        used_usd: 31.2,
        remaining_usd: 88.8,
        expires_at: "2026-11-12T00:00:00Z",
        active_count: 1,
        subscriptions: [],
      },
    });

    const result = await packycodeSubscriptionAPI.getStatus();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/packycode/subscription");
    expect(result.provider).toBe("packycode");
    expect(result.remaining_usd).toBe(88.8);
    expect(result.site_url).toBe("https://www.packyapi.com");
    expect(result).not.toHaveProperty("api_token");
  });
});
