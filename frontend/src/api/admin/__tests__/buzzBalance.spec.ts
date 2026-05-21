import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import buzzBalanceAPI from "@/api/admin/buzzBalance";

vi.mock("@/api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("admin buzz balance api", () => {
  it("fetches BuzzAI balance without exposing credentials", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        enabled: true,
        configured: true,
        currency: "USD",
        total: 100,
        used: 12.34,
        remaining: 87.66,
        refreshed_at: "2026-05-21T10:00:00Z",
      },
    });

    const result = await buzzBalanceAPI.getBalance();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/buzz/balance");
    expect(result.remaining).toBe(87.66);
    expect(result).not.toHaveProperty("api_token");
  });
});
