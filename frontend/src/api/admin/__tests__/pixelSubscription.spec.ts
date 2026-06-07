import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import pixelSubscriptionAPI from "@/api/admin/pixelSubscription";

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("admin pixel subscription api", () => {
  it("fetches Pixel quota and expiry without exposing credentials", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        provider: "pixel",
        enabled: true,
        configured: true,
        currency: "USD",
        site_url: "https://ai-pixel.online",
        total_limit_usd: 70,
        used_usd: 8.25,
        remaining_usd: 61.75,
        expires_at: "2026-10-11T00:00:00Z",
        active_count: 1,
        subscriptions: [],
      },
    });

    const result = await pixelSubscriptionAPI.getStatus();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/pixel/subscription");
    expect(result.provider).toBe("pixel");
    expect(result.remaining_usd).toBe(61.75);
    expect(result.site_url).toBe("https://ai-pixel.online");
    expect(result).not.toHaveProperty("api_token");
  });
});
